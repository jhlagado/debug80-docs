"""Pure reconstruction of reviewed C16 text edits from the frozen edit base."""
import re

CITATION = re.compile(r'(?<![\w/])([\w./-]+\.[\w]+):(\d+)(?:[-–](\d+))?')
EDIT_BASE = '16755d6b2d1dbb097fba46d2c2a52b433f49a4d0'
NOTE = '''<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->'''


def normalize(text):
    # Reflow is permitted in prose, never in literal code or command blocks.
    literals = re.compile(r'(^[ \t]*```[^\n]*\n.*?^[ \t]*```[^\n]*$|^[ \t]*~~~[^\n]*\n.*?^[ \t]*~~~[^\n]*$|`[^`]*`)', re.M | re.S)
    pieces = literals.split(text)
    def literal(piece):
        # CommonMark turns a line ending inside an inline code span into one
        # space. Preserve every other literal space and every fenced byte.
        if piece.startswith('`') and not piece.startswith('```'):
            return piece.replace('\r\n', ' ').replace('\n', ' ')
        return piece
    return ''.join(literal(piece) if index % 2 else re.sub(r'\s+', ' ', piece)
                   for index, piece in enumerate(pieces)).strip()


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
        if row['status'] == 'removed':
            tied = [edit for edit in row.get('prose_edits', [])
                    if row['old_citation'] in {m.group() for m in CITATION.finditer(edit['old'])}
                    and row['old_citation'] not in {m.group() for m in CITATION.finditer(edit['new'])}]
            if not tied:
                raise ValueError('removal needs an edit of the cited occurrence: ' + row['old_citation'])
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
    for row in rows:
        if row['status'] == 'removed' and row['old_citation'] in {m.group() for m in CITATION.finditer(text)}:
            raise ValueError('removed occurrence survives: ' + row['old_citation'])
    if text != original and NOTE not in text:
        end = text.index('-->', text.index('<!-- Checked against')) + 3
        text = text[:end] + '\n\n' + NOTE + text[end:]
    return text
