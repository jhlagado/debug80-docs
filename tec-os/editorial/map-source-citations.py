#!/usr/bin/env python3
"""Prepare source ranges; never rewrite chapters or certify prose claims.

Run with Python 3, --source-repo PATH, --old REV, --new REV. Book citations
are read from --book-rev (default 4d830dc), so concurrent prose edits cannot
change the inventory. Outputs are written beside this script unless overridden.
Only git object reads and text scans are performed. No third-party dependencies.
"""
import argparse
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

CITATION = re.compile(r'(?<![\w/])([\w./-]+\.[\w]+):(\d+)(?:[-–](\d+))?')
TOKEN = re.compile(r"'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"|[\w]+|[^\s]", re.UNICODE)


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args])


def read(repo, rev, path):
    return git(repo, 'show', f'{rev}:{path}').decode('utf-8')


def tokenize(text, asm):
    values, lines = [], []
    for number, line in enumerate(text.splitlines(), 1):
        # Assembly comment delimiters and line wrapping carry no source meaning.
        # Keep comment words and punctuation; keep quoted literals case-sensitive.
        for match in TOKEN.finditer(line):
            token = match.group()
            if asm and token == ';':
                continue
            values.append(token.casefold() if asm and token[0] not in "'\"" else token)
            lines.append(number)
    return values, lines


def locate(needle, documents):
    if not needle:
        return []
    hits = []
    for path, (tokens, lines) in documents.items():
        for index in positions[path].get(needle[0], []):
            if tokens[index:index + len(needle)] == needle:
                hits.append((path, index, index + len(needle)))
                if len(hits) > 1:
                    return hits
    return hits


def range_of(hit, documents):
    path, start, end = hit
    lines = documents[path][1]
    assert 0 <= start < end <= len(lines)
    return {'path': path, 'start': lines[start], 'end': lines[end - 1]}


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-repo', required=True, type=Path)
parser.add_argument('--old', default='78127ec')
parser.add_argument('--new', default='fe2097f4bad3f7578aa41b8bce8aa571c451dbc7')
parser.add_argument('--book-rev', default='4d830dc')
parser.add_argument('--output-dir', type=Path, default=Path(__file__).resolve().parent)
args = parser.parse_args()
book = Path(__file__).resolve().parents[2]
old, new = [git(args.source_repo, 'rev-parse', f'{rev}^{{commit}}').decode().strip()
            for rev in (args.old, args.new)]
book_rev = git(book, 'rev-parse', f'{args.book_rev}^{{commit}}').decode().strip()
paths = git(args.source_repo, 'ls-tree', '-r', '--name-only', new).decode().splitlines()
documents = {}
for path in paths:
    if Path(path).suffix.lower() in {'.asm', '.inc', '.mjs', '.js', '.json', '.md', '.py', '.sh', '.txt'}:
        try:
            documents[path] = tokenize(read(args.source_repo, new, path), path.endswith(('.asm', '.inc')))
        except UnicodeDecodeError:
            continue
positions = {}
for path, (tokens, _) in documents.items():
    index = {}
    for offset, token in enumerate(tokens):
        index.setdefault(token, []).append(offset)
    positions[path] = index
inventory = {}
book_paths = git(book, 'ls-tree', '-r', '--name-only', book_rev, '--', 'tec-os').decode().splitlines()
for path in book_paths:
    if not path.endswith('.md') or path.startswith('tec-os/editorial/'):
        continue
    for number, line in enumerate(read(book, book_rev, path).splitlines(), 1):
        for match in CITATION.finditer(line):
            source, start, end = match.groups()
            key = (source, int(start), int(end or start))
            inventory.setdefault(key, []).append({'path': path, 'line': number, 'citation': match.group()})
old_documents = {}
records = []
for (path, start, end), occurrences in sorted(inventory.items()):
    record = {'source': {'path': path, 'start': start, 'end': end}, 'occurrences': occurrences,
              'status': 'pending', 'targets': []}
    records.append(record)
    if path not in old_documents:
        try:
            text = read(args.source_repo, old, path)
            old_documents[path] = (text, *tokenize(text, path.endswith(('.asm', '.inc'))))
        except subprocess.CalledProcessError:
            old_documents[path] = None
    doc = old_documents[path]
    if doc is None:
        record['reason'] = 'source file absent at old revision'
        continue
    text, tokens, lines = doc
    if not 1 <= start <= end <= len(text.splitlines()):
        record['reason'] = 'old source range out of bounds'
        continue
    selected = [i for i, n in enumerate(lines) if start <= n <= end]
    if not selected:
        record['reason'] = 'range contains no tokens'
        continue
    lo, hi = selected[0], selected[-1] + 1
    needle = tokens[lo:hi]
    record['source_token_sha256'] = hashlib.sha256(json.dumps(needle).encode()).hexdigest()
    hits = locate(needle, documents)
    if len(hits) == 1:
        record.update(status='mapped', reason='unique complete token sequence', targets=[range_of(hits[0], documents)])
        continue
    # Repeated short fragments require unique unchanged surrounding context.
    found = None
    for padding in (16, 64, 256):
        a, b = max(0, lo-padding), min(len(tokens), hi+padding)
        context = locate(tokens[a:b], documents)
        if len(context) == 1:
            p, x, _ = context[0]
            found = (p, x + lo-a, x + hi-a)
            break
    if found:
        record.update(status='mapped', reason='unique unchanged surrounding token sequence', targets=[range_of(found, documents)])
        continue
    # A split is accepted only at original line boundaries, with every token
    # accounted for by unique multi-token fragments, in original source order.
    fragments = []
    cursor = lo
    while cursor < hi:
        chosen = None
        boundaries = [i for i in range(cursor+1, hi+1) if i == hi or lines[i] != lines[i-1]]
        for stop in reversed(boundaries):
            if stop-cursor < 16:
                continue
            candidates = locate(tokens[cursor:stop], documents)
            if len(candidates) == 1:
                chosen = (stop, candidates[0])
                break
        if chosen is None:
            break
        cursor, hit = chosen
        fragments.append(hit)
    if cursor == hi and len(fragments) > 1 and len({h[0] for h in fragments}) == len(fragments):
        record.update(status='mapped', reason='unique complete fragments across split files', targets=[range_of(h, documents) for h in fragments])
    else:
        record['reason'] = 'ambiguous sequence' if len(hits) > 1 else 'changed or unmatched sequence; substantive review required'

counts = Counter(r['status'] for r in records)
occurrences = sum(len(r['occurrences']) for r in records)
mapped_occurrences = sum(len(r['occurrences']) for r in records if r['status'] == 'mapped')
result = {'old_revision': old, 'new_revision': new, 'book_revision': book_rev,
          'scope': 'All file:line citations in tracked tec-os Markdown except editorial material.',
          'summary': {'unique_ranges': len(records), 'mapped_ranges': counts['mapped'], 'pending_ranges': counts['pending'],
                      'occurrences': occurrences, 'mapped_occurrences': mapped_occurrences,
                      'pending_occurrences': occurrences-mapped_occurrences}, 'citations': records}
args.output_dir.mkdir(parents=True, exist_ok=True)
(args.output_dir / 'source-citation-map.json').write_text(json.dumps(result, indent=2) + '\n')
report = ['# Source citation preparation', '', f'Source: `{old}` → `{new}`.', f'Book inventory: `{book_rev}`.', '',
          'Run: `python3 tec-os/editorial/map-source-citations.py --source-repo /path/to/tec-os --old 78127ec --new ' + new + ' --book-rev ' + book_rev + '`.', '',
          f'Unique ranges: {len(records)}; mapped: {counts["mapped"]}; pending: {counts["pending"]}.',
          f'Occurrences: {occurrences}; mapped: {mapped_occurrences}; pending: {occurrences-mapped_occurrences}.', '',
          'Mapping compares actual git text. Assembly case and whitespace, comment delimiters and comment wrapping are normalized; quoted literals retain case. All other tokens must match. Unique surrounding context can disambiguate repeated fragments. Split mappings require complete unique fragments in distinct files. Every old range and emitted target token range is bounds-checked. No builds, tests or captures are run.', '',
          'A mapped range establishes textual correspondence only. It does not revalidate the chapter claim, addresses, timing or behaviour. Pending ranges include changed source, ambiguity and missing matches; no replacement is asserted. The JSON retains every occurrence and the source token digest. Editorial notes are excluded from the book inventory. Chapters are never modified.', '',
          '## Pending ranges', '', '| Source | Occurrences | Reason |', '| --- | ---: | --- |']
for r in records:
    if r['status'] == 'pending':
        s = r['source']
        report.append(f'| `{s["path"]}:{s["start"]}-{s["end"]}` | {len(r["occurrences"])} | {r["reason"]} |')
(args.output_dir / 'source-citation-report.md').write_text('\n'.join(report) + '\n')
print(json.dumps(result['summary'], sort_keys=True))
