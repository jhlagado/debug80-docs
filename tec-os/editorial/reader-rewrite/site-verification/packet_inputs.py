"""Inert file identities and durable receipts for the scoped site packet."""
import hashlib
import json
import os
import secrets
from pathlib import Path
from datetime import datetime, timezone


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def canonical(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'),
                       ensure_ascii=False) + '\n').encode()


def tree_identity(root):
    root = Path(root).resolve(strict=True)
    rows = []
    for directory, dirs, files in os.walk(root, followlinks=False):
        for name in sorted(dirs + files):
            path = Path(directory) / name
            relative = path.relative_to(root).as_posix()
            if path.is_symlink():
                if Path(os.readlink(path)).is_absolute():
                    raise ValueError('absolute dependency symlink is not relocatable: ' + relative)
                resolved = path.resolve(strict=True)
                if root not in resolved.parents and resolved != root:
                    raise ValueError('dependency symlink escapes installed input: ' + relative)
                rows.append({'path': relative, 'kind': 'symlink',
                             'target': os.readlink(path)})
            elif path.is_file():
                rows.append({'path': relative, 'kind': 'file',
                             'bytes': path.stat().st_size, 'sha256': digest(path),
                             'executable': bool(path.stat().st_mode & 0o111)})
            elif not path.is_dir():
                raise ValueError('unsupported installed input: ' + relative)
    rows.sort(key=lambda row: row['path'])
    return {'entries': rows, 'sha256': hashlib.sha256(canonical(rows)).hexdigest()}


def source_identity(root):
    """All exported file inputs, excluding only reviewed generated output paths."""
    import re
    root = Path(root)
    files = {}
    generated = []
    excluded_dirs = {'node_modules', '.vitepress/dist', '.vitepress/cache', '.vitepress/.temp'}
    for directory, dirs, names in os.walk(root, followlinks=False):
        for name in tuple(dirs):
            path = Path(directory) / name
            relative = path.relative_to(root).as_posix()
            if relative in excluded_dirs:
                generated.append(relative + '/')
                dirs.remove(name)
            elif path.is_symlink():
                raise ValueError('unreviewed source directory link: ' + relative)
        for name in names:
            path = Path(directory) / name
            relative = path.relative_to(root).as_posix()
            if re.fullmatch(r'\.vitepress/config\.ts\.timestamp-[\w.-]+\.mjs', relative):
                generated.append(relative)
            elif path.is_symlink() or not path.is_file():
                raise ValueError('unreviewed source file type: ' + relative)
            else:
                files[relative] = digest(path)
    return {'files': files, 'generated_paths': sorted(generated)}


def durable_json(path, value, exclusive=False):
    path = Path(path)
    temporary = path.with_name('.' + path.name + '.' + secrets.token_hex(12) + '.tmp')
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        data = canonical(value)
        while data:
            data = data[os.write(fd, data):]
        os.fsync(fd)
    finally:
        os.close(fd)
    try:
        if exclusive:
            # Publish the complete receipt atomically without replacing a winner.
            os.link(temporary, path)
        else:
            os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()
    directory = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def first_failure(output, stage, detail, code):
    try:
        durable_json(Path(output) / 'first-failure.json',
                     {'status': 'FAILED', 'stage': stage, 'detail': detail,
                      'exit_code': code, 'retry': False,
                      'utc': datetime.now(timezone.utc).isoformat()}, exclusive=True)
    except FileExistsError:
        pass
