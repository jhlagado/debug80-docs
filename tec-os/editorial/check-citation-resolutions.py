#!/usr/bin/env python3
"""Check complete disposition of the frozen pending citation inventory.

This is a source-only coverage and range check. Semantic support is recorded
in the resolution reasons; passing this command does not certify those reasons
or any runtime result. The original textual map remains an immutable inventory.
"""
import argparse
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

CITATION = re.compile(r'(?<![\w/])([\w./-]+\.[\w]+):(\d+)(?:[-–](\d+))?')
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--source-repo', required=True, type=Path)
p.add_argument('--ledger', required=True, type=Path)
p.add_argument('--inventory', type=Path, default=Path(__file__).with_name('source-citation-map.json'))
a = p.parse_args()
book = Path(__file__).resolve().parents[2]
inventory = json.loads(a.inventory.read_text())
ledger = json.loads(a.ledger.read_text())
rows = ledger['resolutions']
expected = Counter()
all_references = set()
for row in inventory['citations']:
    all_references.update((o['path'], o['citation']) for o in row['occurrences'])
    if row['status'] == 'pending':
        expected.update((o['path'], o['citation']) for o in row['occurrences'])
seen = set()
counts = Counter()
source_cache = {}
for row in rows:
    key = (row['book_path'], row['old_citation'])
    if key not in all_references or key in seen:
        raise SystemExit('unexpected or duplicate resolution: ' + repr(key))
    seen.add(key)
    if row['status'] not in {'accepted', 'corrected', 'removed', 'local-example', 'superseded'}:
        raise SystemExit('unresolved status: ' + repr(key))
    if not row['reason'].strip():
        raise SystemExit('missing semantic reason: ' + repr(key))
    text = (book / row['book_path']).read_text()
    replacement = row.get('new_citation') or ''
    if row['status'] in {'accepted', 'corrected'}:
        if not replacement or not list(CITATION.finditer(replacement)):
            raise SystemExit('reviewed replacement missing: ' + repr(key))
        for target in CITATION.finditer(replacement):
            if target.group() not in text:
                raise SystemExit('reviewed replacement absent: ' + repr(key) + ' -> ' + target.group())
        for match in CITATION.finditer(replacement):
            path, start, end = match.groups()
            if path not in source_cache:
                source_cache[path] = subprocess.check_output(['git', '-C', str(a.source_repo), 'show', ledger['source_revision'] + ':' + path], text=True).splitlines()
            if not 1 <= int(start) <= int(end or start) <= len(source_cache[path]):
                raise SystemExit('target range out of bounds: ' + match.group())
    elif row['status'] == 'local-example':
        if row['old_citation'] not in text:
            raise SystemExit('local example changed: ' + repr(key))
    counts[row['status']] += expected[key]
missing = sorted(set(expected) - seen)
print(json.dumps({'source_revision': ledger['source_revision'],
                  'pending_occurrences_in_frozen_inventory': sum(expected.values()),
                  'resolved_occurrences_by_disposition': dict(counts),
                  'additional_reviewed_mapped_ranges': len(seen - set(expected)),
                  'missing_resolutions': [dict(book_path=p, old_citation=c) for p, c in missing],
                  'qualification': 'Coverage and source bounds only; semantic reasons require independent reading.'}, indent=2))
raise SystemExit(bool(missing))
