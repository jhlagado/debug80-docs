"""Bind inert source/export/dependency inputs. This does not build the site."""
from datetime import datetime, timezone
import difflib
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import tarfile
from packet_inputs import canonical, digest, durable_json, tree_identity

SOURCE = 'a3e4c292fee3022e432a18be36370d2d87cd4b30'


def prepare():
    packet = Path(__file__).resolve().parent
    repo = packet.parents[3]
    assert repo.name == 'debug80-docs-tec-os', repo
    git = str(Path(shutil.which('git')).resolve())

    def source_bytes(path):
        return subprocess.check_output([git, '-C', str(repo), 'show', SOURCE + ':' + path])

    tracked = subprocess.check_output([git, '-C', str(repo), 'ls-tree', '-r',
                                      '--name-only', SOURCE], text=True).splitlines()
    expected = json.loads((packet / 'expectations.json').read_text())
    assert expected['source_revision'] == SOURCE
    readers = {p['path'] for p in expected['pages']}
    assert len(readers) == 39
    assert readers == {p for p in tracked if p.startswith('tec-os/') and
                       p.count('/') == 1 and p.endswith('.md')}
    for row in expected['pages']:
        data = source_bytes(row['path'])
        assert hashlib.sha256(data).hexdigest() == row['source_sha256']
        text = data.decode()
        assert row['source_h1'] == re.search(r'^# (.+)$', text, re.M)[1]
        assert row['h1'] == row['source_h1'].replace('`', '')
        fences = re.findall(r'^```([^\n]*)\n(.*?)^```[\t ]*$', text, re.M | re.S)
        assert len(fences) == len(row['fences'])
        whitespace = ('\t\n\v\f\r \u00a0\u1680' +
                      ''.join(chr(n) for n in range(0x2000, 0x200b)) +
                      '\u2028\u2029\u202f\u205f\u3000\ufeff')
        for (language, raw), fence in zip(fences, row['fences']):
            assert language.strip() == fence['language'] and raw == fence['text']
            assert '[!code' not in raw
            assert fence['rendered_text'] == raw.rstrip(whitespace)
    public_html = {p for p in tracked if p.startswith('public/') and p.endswith('.html')}
    assert public_html == {p['source'] for p in expected['public_html']}
    for row in expected['public_html']:
        data = source_bytes(row['source'])
        assert len(data) == row['bytes']
        assert hashlib.sha256(data).hexdigest() == row['sha256']
    before = source_bytes('.vitepress/config.ts').decode()
    excluded = [p for p in tracked if p.endswith('.md') and p not in readers]
    after, count = re.subn(r'srcExclude: \[[\s\S]*?\n  \],',
                           'srcExclude: ' + json.dumps(excluded) + ',', before, count=1)
    assert count == 1
    marker = 'export default defineConfig({'
    assert after.count(marker) == 1
    after = after.replace(marker, marker + '\n  buildConcurrency: 2,\n'
                          '  vite: { build: { minify: false } },', 1)
    (packet / 'config.before.ts').write_text(before)
    (packet / 'config.after.ts').write_text(after)
    (packet / 'config.diff').write_text(''.join(difflib.unified_diff(
        before.splitlines(True), after.splitlines(True),
        fromfile='source/.vitepress/config.ts', tofile='temporary/.vitepress/config.ts')))
    dependency_root = (repo / '.github/site/node_modules').resolve(strict=True)
    installed = tree_identity(dependency_root)
    durable_json(packet / 'installed-inputs.json', installed)
    manifests = {}
    for name in ['package.json', 'package-lock.json', '.github/site/package.json',
                 '.github/site/package-lock.json']:
        data = source_bytes(name)
        manifests[name] = {'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    site_lock = json.loads(source_bytes('.github/site/package-lock.json'))
    mismatches = []
    for package_path, metadata in site_lock['packages'].items():
        if not package_path or not package_path.startswith('node_modules/'):
            continue
        package_json = dependency_root / package_path[len('node_modules/'):] / 'package.json'
        if package_json.exists():
            actual = json.loads(package_json.read_text())
            if actual.get('version') != metadata.get('version'):
                mismatches.append(package_path)
        elif not metadata.get('optional'):
            mismatches.append(package_path)
    if mismatches:
        raise ValueError('installed package versions disagree with site lock: ' + str(mismatches))
    manifests['installed_package_versions'] = 'all present packages match; absent optional platforms allowed'
    durable_json(packet / 'dependency-manifests.json', manifests)
    with tempfile.TemporaryDirectory(prefix='tec-os-source-seal-') as temporary:
        archive = Path(temporary) / 'source.tar'
        subprocess.run([git, '-C', str(repo), 'archive', '--output', str(archive), SOURCE], check=True)
        archive_hash = digest(archive)
        archive_bytes = archive.stat().st_size
        with tarfile.open(archive) as tar:
            source_inputs = {}
            for member in tar.getmembers():
                assert not member.issym() and not member.islnk()
                if member.isfile():
                    data = tar.extractfile(member).read()
                    source_inputs[member.name] = hashlib.sha256(data).hexdigest()
        source_inputs['.vitepress/config.ts'] = hashlib.sha256(after.encode()).hexdigest()
        durable_json(packet / 'source-inputs.json', {
            'files': source_inputs,
            'writable_exclusions': ['node_modules/ (separately checked against installed inputs)',
                                    '.vitepress/dist/', '.vitepress/cache/', '.vitepress/.temp/',
                                    '.vitepress/config.ts.timestamp-*.mjs'],
            'source': 'Installed VitePress config defaults and Vite config loader source; no build run'})
    guard = Path('/Users/johnhardy/projects/origo/tools/mem-guard.mjs').resolve(strict=True)
    runtime = {}
    for name, path in [('node', Path(shutil.which('node')).resolve(strict=True)),
                       ('python', Path(sys.executable).resolve(strict=True)), ('git', Path(git))]:
        runtime[name] = {'path': str(path), 'sha256': digest(path)}
    payload_names = ['packet_inputs.py', 'run_once.py', 'build_and_check.py',
                     'prepare_packet.py', 'check_html.py', 'test_checker.py',
                     'controls-result.json', 'expectations.json', 'installed-inputs.json',
                     'dependency-manifests.json', 'config.before.ts', 'config.after.ts',
                     'config.diff', 'source-inputs.json']
    seal = {'schema': 1, 'status': 'PREPARED_UNRUN', 'source_revision': SOURCE,
            'repository': str(repo), 'source_archive_sha256': archive_hash,
            'source_archive_bytes': archive_bytes,
            'source_tree': subprocess.check_output([git, '-C', str(repo), 'rev-parse',
                                                   SOURCE + '^{tree}'], text=True).strip(),
            'installed_root': str(dependency_root), 'installed_entries': len(installed['entries']),
            'installed_identity': installed['sha256'], 'runtime': runtime, 'git': git,
            'guard': {'path': str(guard), 'sha256': digest(guard)},
            'home': str(Path.home()),
            'path': str(Path(runtime['node']['path']).parent) + ':/usr/bin:/bin:/usr/sbin:/sbin',
            'claim_directory': str(Path.home() / '.origo/site-verification/claims'),
            'policy': {'guard_limit_mb': 850, 'node_heap_mb': 450, 'guard_wait_seconds': 0,
                       'whole_invocation_max_seconds': 180, 'cleanup_reserved_seconds': 3,
                       'build_workers': 2, 'minify': False, 'retry': False},
            'preparation_host': {'system': platform.system(), 'machine': platform.machine(),
                                 'python': sys.version},
            'payload': {name: digest(packet / name) for name in payload_names}}
    durable_json(packet / 'seal.json', seal)
    print(json.dumps({'status': 'PREPARED_UNRUN', 'seal_sha256': digest(packet / 'seal.json'),
                      'installed_entries': len(installed['entries']),
                      'source_archive_sha256': archive_hash}, indent=2))


if __name__ == '__main__':
    prepare()
