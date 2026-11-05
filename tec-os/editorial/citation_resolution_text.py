"""Pure reconstruction of reviewed C16 text edits from the frozen edit base."""
import re

CITATION = re.compile(r'(?<![\w/])([\w./-]+\.[\w]+):(\d+)(?:[-–](\d+))?')
EDIT_BASE = '16755d6b2d1dbb097fba46d2c2a52b433f49a4d0'
NOTE = '''<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->'''


def normalize(text):
    return re.sub(r'\s+', ' ', text).strip()


def render(original, rows):
    text = original
    protected = {}
    replacements = {}
    edits = []

    def protect(value):
        key = '@@C16PROTECTED' + str(len(protected)) + '@@'
        if key in original:
            raise ValueError('reserved replacement marker in edit base')
        protected[key] = value
        return key

    for row in rows:
        if row['status'] == 'superseded':
            anchor = row.get('replacement_anchor')
            if not anchor or normalize(anchor) not in normalize(original):
                raise ValueError('supersession has no replacement anchor: ' + row['old_citation'])
            if row['old_citation'] in {m.group() for m in CITATION.finditer(original)}:
                raise ValueError('superseded citation survives in edit base: ' + row['old_citation'])
        if row['status'] == 'removed' and not row.get('prose_edits'):
            raise ValueError('removal needs an explicit passage edit: ' + row['old_citation'])
        for edit in row.get('prose_edits', []):
            if edit not in edits:
                edits.append(edit)

    # Protect replacement prose from citation substitutions. This prevents a new
    # range that equals a different old range from being substituted twice.
    for edit in sorted(edits, key=lambda item: len(item['old']), reverse=True):
        if edit['old'] not in text:
            raise ValueError('reviewed original passage absent: ' + edit['old'])
        text = text.replace(edit['old'], protect(edit['new']))

    for row in rows:
        if row['status'] in {'local-example', 'superseded', 'removed'}:
            continue
        old, new = row['old_citation'], row['new_citation']
        if old in replacements and replacements[old] != new:
            raise ValueError('conflicting target ranges: ' + old)
        replacements[old] = new
    inside = False
    lines = []
    for line in text.splitlines(keepends=True):
        if line.lstrip().startswith(('```', '~~~')):
            inside = not inside
        if not inside:
            line = CITATION.sub(lambda match: protect(replacements[match.group()])
                               if match.group() in replacements else match.group(), line)
        lines.append(line)
    text = ''.join(lines)
    for key, value in protected.items():
        text = text.replace(key, value)
    if text != original and NOTE not in text:
        end = text.index('-->', text.index('<!-- Checked against')) + 3
        text = text[:end] + '\n\n' + NOTE + text[end:]
    return text
