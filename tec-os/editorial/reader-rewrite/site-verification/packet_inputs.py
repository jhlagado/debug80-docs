"""Inert file identities and durable receipts for the scoped site packet."""
import hashlib
import json
import os
from pathlib import Path


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


def durable_json(path, value, exclusive=False):
    path = Path(path)
    flags = os.O_WRONLY | os.O_CREAT | (os.O_EXCL if exclusive else os.O_TRUNC)
    fd = os.open(path, flags, 0o600)
    try:
        data = canonical(value)
        while data:
            data = data[os.write(fd, data):]
        os.fsync(fd)
    finally:
        os.close(fd)
    directory = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def first_failure(output, stage, detail, code):
    try:
        durable_json(Path(output) / 'first-failure.json',
                     {'status': 'FAILED', 'stage': stage, 'detail': detail,
                      'exit_code': code, 'retry': False}, exclusive=True)
    except FileExistsError:
        pass
