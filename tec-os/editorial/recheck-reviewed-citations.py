#!/usr/bin/env python3
"""Recheck source files supporting reviewed citations without assembling anything.

Record one frozen source manifest from a resolution ledger, then compare that
manifest with a later offer. A matching blob preserves source text, not runtime
proof. A changed blob requires claim-level review even if its labels still exist.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

REFERENCE = re.compile(r'(?<![\w/])([\w./-]+\.[\w]+):(\d+)(?:[-–](\d+))?')
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--source-repo', required=True, type=Path)
p.add_argument('--revision', required=True)
p.add_argument('--ledger', required=True, type=Path)
p.add_argument('--manifest', required=True, type=Path)
p.add_argument('--record', action='store_true')
a = p.parse_args()
def git(*args):
    return subprocess.check_output(['git', '-C', str(a.source_repo), *args], text=True).strip()
revision = git('rev-parse', a.revision + '^{commit}')
ledger = json.loads(a.ledger.read_text())
rows = ledger['resolutions'] if isinstance(ledger, dict) else ledger
paths = set()
source_cache = {}
for row in rows:
    references = (row.get('new_citation') or '') + '\n' + '\n'.join(e['new'] for e in row.get('prose_edits', []))
    references += '\n' + '\n'.join(x for x in row.get('supporting_target_ranges', []) if isinstance(x, str))
    for match in REFERENCE.finditer(references):
        path, start, end = match.groups()
        if row.get('status') == 'local-example':
            continue
        if path not in source_cache:
            source_cache[path] = subprocess.check_output(['git', '-C', str(a.source_repo), 'show', revision + ':' + path], text=True).splitlines()
        if not 1 <= int(start) <= int(end or start) <= len(source_cache[path]):
            raise SystemExit('citation out of bounds: ' + match.group())
        paths.add(path)
if a.record:
    result = {'revision': revision, 'ledger': a.ledger.name,
              'qualification': 'Source identity only; no runtime or whole-chapter certification.',
              'files': {path: git('rev-parse', revision + ':' + path) for path in sorted(paths)}}
    a.manifest.write_text(json.dumps(result, indent=2) + '\n')
    print('Recorded', len(paths), 'source blobs at', revision)
else:
    previous = json.loads(a.manifest.read_text())
    changed = []
    for path, blob in previous['files'].items():
        result = subprocess.run(['git', '-C', str(a.source_repo), 'rev-parse', revision + ':' + path], text=True, capture_output=True)
        if result.returncode or result.stdout.strip() != blob:
            changed.append(path)
    print(json.dumps({'baseline': previous['revision'], 'offer': revision,
                      'source_files_requiring_review': changed,
                      'runtime_validation': 'Still separate and required.'}, indent=2))
    raise SystemExit(bool(changed))
