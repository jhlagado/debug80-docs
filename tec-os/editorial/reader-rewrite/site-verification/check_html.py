#!/usr/bin/env python3
"""Validate retained TEC-OS HTML against a frozen source manifest. No rendering."""
import argparse
from collections import Counter
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path, PurePosixPath
import posixpath
import re
import sys
from urllib.parse import unquote, urlsplit


class Mismatch(Exception):
    def __init__(self, category, message, **details):
        self.failure = dict(category=category, message=message, **details)
        super().__init__(message)


def require(condition, category, message, **details):
    if not condition:
        raise Mismatch(category, message, **details)


def digest(data):
    return hashlib.sha256(data).hexdigest()


# ECMAScript WhiteSpace plus LineTerminator, not Python's broader whitespace set.
ECMA_TAIL = frozenset('\u0009\u000b\u000c\u0020\u00a0\u1680'
                     '\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a'
                     '\u202f\u205f\u3000\ufeff\u000a\u000d\u2028\u2029')
CODE_SOURCE = dict(path='node_modules/vitepress/dist/node/chunk-D3CUZ4fa.js',
                   sha256='07d45c356e7c850c2454904949f4b0b95c1d4a2d92119cbdaf4d419ae20dde98',
                   lines=[35347, 35418])
PAGER_SOURCE = dict(path='node_modules/vitepress/dist/client/theme-default/composables/prev-next.js',
                    sha256='2288a677ec465c6e3fe584024730c9add222bf7b880e0e2d6c9828ea8a6edd91',
                    lines=[6, 48])


def ecma_trim_end(text):
    """One whole-block suffix removal matching the pinned highlighter call."""
    end = len(text)
    while end and text[end-1] in ECMA_TAIL:
        end -= 1
    return text[:end]


def sequence_digest(value):
    return digest(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode())


class Node:
    def __init__(self, tag, attrs=(), parent=None):
        self.tag, self.parent = tag, parent
        self.attrs = dict(attrs)
        self.children = []

    def has(self, cls):
        return cls in self.attrs.get('class', '').split()

    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.walk()

    def text(self):
        return ''.join(c.text() if isinstance(c, Node) else c
                       for c in self.children)


class Document(HTMLParser):
    VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

    def __init__(self, text, page):
        super().__init__(convert_charrefs=True)
        self.root = Node('document')
        self.stack = [self.root]
        self.page = page
        self.feed(text)
        self.close()
        require(len(self.stack) == 1, 'html', 'Unclosed HTML element', page=page,
                tags=[n.tag for n in self.stack[1:]])
        ids = [n.attrs['id'] for n in self.root.walk() if 'id' in n.attrs]
        require(len(ids) == len(set(ids)), 'html', 'Duplicate HTML id', page=page)

    def handle_starttag(self, tag, attrs):
        names = [a[0] for a in attrs]
        require(len(names) == len(set(names)), 'html', 'Duplicate HTML attribute',
                page=self.page, tag=tag)
        require(all(v is not None for k, v in attrs if k in ('class', 'id', 'href')),
                'html', 'Attribute requires a value', page=self.page, tag=tag)
        node = Node(tag, attrs, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        require(len(self.stack) > 1 and self.stack[-1].tag == tag,
                'html', 'Mismatched HTML closing tag', page=self.page, tag=tag)
        self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def nodes(root, tag=None, cls=None):
    return [n for n in root.walk() if (tag is None or n.tag == tag)
            and (cls is None or n.has(cls))]


def one(root, tag=None, cls=None, category='document', page=''):
    found = nodes(root, tag, cls)
    require(len(found) == 1, category, 'Expected exactly one scoped element',
            page=page, tag=tag, css_class=cls, actual_count=len(found))
    return found[0]


def canonical(path):
    return (isinstance(path, str) and path.startswith('tec-os/')
            and len(PurePosixPath(path).parts) == 2
            and posixpath.normpath(path) == path and '\\' not in path
            and not any(c in path for c in '?#%'))


def read_manifest(raw):
    manifest = json.loads(raw)
    require(isinstance(manifest, dict) and manifest.get('schema') == 1,
            'manifest', 'Expected schema 1')
    require(isinstance(manifest.get('source_revision'), str)
            and re.fullmatch(r'[0-9a-f]{40}', manifest['source_revision']),
            'manifest', 'Expected full source revision')
    representation = manifest.get('representation')
    require(isinstance(representation, dict)
            and representation.get('code_transform_source') == CODE_SOURCE
            and representation.get('pager_source') == PAGER_SOURCE,
            'manifest', 'Representation must bind the inspected highlighter and pager source')
    pages = manifest.get('pages')
    require(isinstance(pages, list) and len(pages) == 39,
            'manifest', 'Expected exactly 39 pages')
    for page in pages:
        require(isinstance(page, dict), 'manifest', 'Page must be an object')
        require(canonical(page.get('path')) and page['path'].endswith('.md')
                and page.get('html') == page['path'][:-3] + '.html',
                'manifest', 'Invalid source/output path pair')
        for key in ('title', 'h1', 'source_h1'):
            require(isinstance(page.get(key), str) and bool(page[key]),
                    'manifest', 'Missing title or heading', page=page['html'], field=key)
        visible = page['source_h1']
        if '`' in visible:
            require(page['html'] == 'tec-os/appendix-f-tecvol.html'
                    and visible == 'Appendix F. `tecvol`', 'manifest',
                    'Unreviewed inline heading representation', page=page['html'])
            visible = visible.replace('`', '')
        require(page['h1'] == visible, 'manifest', 'Visible h1 differs from source heading contract',
                page=page['html'])
        for key in ('links', 'fences'):
            require(isinstance(page.get(key), list), 'manifest', 'Expected array', field=key)
        require('previous' in page and 'next' in page, 'manifest', 'Missing pager fields')
        for link in page['links']:
            require(isinstance(link, dict) and canonical(link.get('target'))
                    and link['target'].endswith('.html')
                    and isinstance(link.get('fragment'), str),
                    'manifest', 'Invalid expected reader link')
        for fence in page['fences']:
            require(isinstance(fence, dict) and isinstance(fence.get('language'), str)
                    and isinstance(fence.get('text'), str)
                    and isinstance(fence.get('rendered_text'), str), 'manifest', 'Invalid fence')
            require(fence['language'] in ('asm', 'json', 'sh', 'text')
                    and '[!code' not in fence['text'], 'manifest',
                    'Unreviewed fence transform or language', page=page['html'])
            require(fence['rendered_text'] == ecma_trim_end(fence['text']), 'manifest',
                    'Expected rendered text is not the exact whole-fence ECMAScript trimEnd',
                    page=page['html'])
    outputs = [p['html'] for p in pages]
    require(len(set(outputs)) == 39, 'manifest', 'Duplicate expected page')
    require('tec-os/index.html' in outputs, 'manifest', 'Missing index')
    numbered = [re.fullmatch(r'tec-os/(\d{2})-[^/]+\.html', p) for p in outputs]
    references = [re.fullmatch(r'tec-os/appendix-([a-j])-[^/]+\.html', p) for p in outputs]
    require(sorted(int(m[1]) for m in numbered if m) == list(range(1, 29))
            and sorted(m[1] for m in references if m) == list('abcdefghij'),
            'manifest', 'Expected chapters 1-28 and appendices A-J')
    require(all(l['target'] in outputs for p in pages for l in p['links']),
            'manifest', 'Expected link outside reader manifest')
    actual_counts = dict(pages=39, links=sum(len(p['links']) for p in pages),
                         fragments=sum(bool(l['fragment']) for p in pages for l in p['links']),
                         fences=sum(len(p['fences']) for p in pages))
    require(actual_counts == dict(pages=39, links=247, fragments=45, fences=247),
            'manifest', 'Manifest does not describe the frozen 39-page contract',
            actual=actual_counts)
    if 'counts' in manifest:
        require(manifest['counts'] == actual_counts, 'manifest', 'Declared counts differ')
    public_html = manifest.get('public_html')
    require(isinstance(public_html, list) and len(public_html) == 1,
            'manifest', 'Expected one bound public HTML passthrough')
    public = public_html[0]
    require(isinstance(public, dict)
            and public.get('source') == 'public/tec1g/mon3-user-guide/index.html'
            and public.get('html') == 'tec1g/mon3-user-guide/index.html'
            and isinstance(public.get('bytes'), int) and public['bytes'] > 0
            and isinstance(public.get('sha256'), str)
            and re.fullmatch(r'[0-9a-f]{64}', public['sha256']),
            'manifest', 'Invalid bound public HTML passthrough')
    groups = manifest.get('sidebar', {}).get('groups')
    require(isinstance(groups, list) and len(groups) == 4,
            'manifest', 'Expected four sidebar groups')
    flat = []
    for group, size in zip(groups, (7, 6, 15, 10)):
        require(isinstance(group, dict) and isinstance(group.get('title'), str)
                and isinstance(group.get('items'), list) and len(group['items']) == size,
                'manifest', 'Invalid sidebar group')
        for item in group['items']:
            require(isinstance(item, dict) and item.get('html') in outputs
                    and isinstance(item.get('title'), str), 'manifest', 'Invalid sidebar item')
            flat.append(item['html'])
    expected_order = sorted(p for p in outputs if p != 'tec-os/index.html')
    require(flat == expected_order and len(set(flat)) == 38,
            'manifest', 'Sidebar must order chapters 1-28 then appendices A-J')
    for page in pages:
        i = flat.index(page['html']) if page['html'] in flat else None
        previous = flat[i-1] if i is not None and i > 0 else None
        following = (flat[0] if i is None else flat[i+1] if i+1 < len(flat) else None)
        require(page['previous'] == previous and page['next'] == following,
                'manifest', 'Expected pager is not the flattened sidebar chain', page=page['html'])
    return manifest, actual_counts


def resolve(href, page):
    """Return a decoded output path/fragment; external links return None."""
    u = urlsplit(href)
    if u.scheme or u.netloc:
        return None
    require(not u.query, 'links', 'Unexpected query on reader link', page=page, href=href)
    path = unquote(u.path)
    target = (posixpath.normpath(path.lstrip('/') if path.startswith('/') else
                               posixpath.join(posixpath.dirname(page), path)) if path else page)
    if path.endswith('/'):
        target = target.rstrip('/') + '/index.html'
    return target, unquote(u.fragment)


def inventory(dist, receipt):
    require(dist.is_dir(), 'inventory', 'Distribution directory is missing')
    require(not dist.is_symlink(), 'inventory', 'Distribution root must not be a symlink')
    files = sorted(dist.rglob('*.html'))
    require(not any(p.is_symlink() for p in dist.rglob('*')), 'inventory',
            'Symlinks are not retained HTML evidence')
    contents = {p.relative_to(dist).as_posix():p.read_bytes() for p in files}
    identities = [{'path':p, 'sha256':digest(b), 'bytes':len(b)}
                  for p,b in contents.items()]
    receipt['html_inputs'] = identities
    # VitePress always emits a framework 404 outside the TEC-OS reader subtree.
    # It is not a fortieth reader. Public HTML is checked separately by exact bytes/hash.
    return {p:b for p,b in contents.items() if p != '404.html'}


def verify(manifest, dist, receipt):
    pages = manifest['pages']
    expected = {p['html'] for p in pages} | {p['html'] for p in manifest['public_html']}
    files = inventory(dist, receipt)
    require(not (dist/'tec-os'/'editorial').exists(), 'inventory', 'Editorial output is forbidden')
    require(set(files) == expected, 'inventory', 'Reader HTML inventory differs',
            missing=sorted(expected-set(files)), unexpected=sorted(set(files)-expected))
    for public in manifest['public_html']:
        data = files[public['html']]
        require(len(data) == public['bytes'] and digest(data) == public['sha256'],
                'public_html', 'Public passthrough bytes/hash differ; no semantic acceptance',
                path=public['html'], expected_bytes=public['bytes'], actual_bytes=len(data),
                expected_sha256=public['sha256'], actual_sha256=digest(data))
        receipt['checked']['public_html'] += 1
    documents = {}
    for page in pages:
        name = page['html']
        parsed = Document(files[name].decode('utf-8'), name)
        content = one(parsed.root, cls='vp-doc', page=name)
        main = one(parsed.root, tag='main', page=name)
        require(content in list(main.walk()) and content.tag == 'div', 'document',
                'Expected vp-doc content within main', page=name)
        head = one(parsed.root, tag='head', page=name)
        require(len(nodes(parsed.root, tag='title')) == 1, 'title', 'Duplicate or missing title', page=name)
        title = one(head, tag='title', category='title', page=name).text()
        require(title == page['title'], 'title', 'Head title differs', page=name,
                expected=page['title'], actual=title)
        check_h1(content, page)
        documents[name] = (parsed.root, content)
        receipt['checked']['documents'] += 1
    for page in pages:
        name = page['html']
        root, content = documents[name]
        actual = []
        for a in nodes(content, tag='a'):
            if a.has('header-anchor'):
                continue
            require('href' in a.attrs, 'links', 'Document anchor lacks href', page=name)
            link = resolve(a.attrs['href'], name)
            require(link is not None, 'links', 'Unexpected external document anchor',
                    page=name, href=a.attrs['href'])
            actual.append(link)
        wanted = [(l['target'], l['fragment']) for l in page['links']]
        require(Counter(actual) == Counter(wanted), 'links', 'Document reader-link multiset differs',
                page=name, expected=wanted, actual=actual)
        for target, fragment in actual:
            require(target in documents, 'links', 'Reader link has no output document', page=name,
                    target=target)
            if fragment:
                ids = [n.attrs.get('id') for n in documents[target][1].walk()]
                require(fragment in ids, 'fragment', 'Fragment has no id in target vp-doc',
                        page=name, target=target, fragment=fragment)
                receipt['checked']['fragments'] += 1
        receipt['checked']['links'] += len(actual)
        check_sidebar(root, manifest['sidebar']['groups'], name)
        receipt['checked']['sidebars'] += 1
        check_pager(root, page)
        receipt['checked']['pagers'] += 1
        check_fences(content, page)
        receipt['checked']['fences'] += len(page['fences'])


def check_h1(content, page):
    heading = one(content, tag='h1', category='h1', page=page['html'])
    anchors = nodes(heading, cls='header-anchor')
    require(len(anchors) == 1 and bool(heading.children)
            and heading.children[-1] is anchors[0], 'h1',
            'Expected one final direct H1 permalink', page=page['html'])
    anchor = anchors[0]
    heading_id = heading.attrs.get('id')
    require(bool(heading_id) and anchor.tag == 'a'
            and anchor.attrs == {'class': 'header-anchor', 'href': '#'+heading_id,
                                 'aria-label': 'Permalink to "'+page['source_h1']+'"'}
            and anchor.children == ['\u200b'], 'h1',
            'H1 permalink structure differs from installed source', page=page['html'])
    # Installed linkInsideHeader: space:true, placement:after, followed by the anchor.
    # Compare the exact prefix including its one U+0020; never strip heading text.
    actual = ''.join(c.text() if isinstance(c, Node) else c for c in heading.children[:-1])
    expected = page['h1'] + ' '
    require(actual == expected, 'h1', 'Document h1 content or exact permalink separator differs',
            page=page['html'], expected=expected, actual=actual)


def check_sidebar(root, groups, page):
    sidebar = one(root, cls='VPSidebar', category='sidebar_groups', page=page)
    require(sidebar.tag == 'aside', 'sidebar_groups', 'Sidebar must be an aside', page=page)
    nav = one(sidebar, tag='nav', category='sidebar_groups', page=page)
    require(nav.attrs.get('id') == 'VPSidebarNav', 'sidebar_groups',
            'Sidebar navigation id differs', page=page)
    roots = [n for n in nav.walk() if n.has('VPSidebarItem') and n.has('level-0')]
    require(len(roots) == 4, 'sidebar_groups', 'Expected four root sidebar groups', page=page)
    all_anchors = []
    for group, expected in zip(roots, groups):
        headings = [n for n in group.children if isinstance(n, Node) and n.has('item')]
        require(len(headings) == 1, 'sidebar_groups', 'Missing direct sidebar group header', page=page)
        title = one(headings[0], tag='h2', cls='text', category='sidebar_groups', page=page).text()
        require(title == expected['title'], 'sidebar_groups', 'Sidebar group heading differs',
                page=page, expected=expected['title'], actual=title)
        anchors = nodes(group, tag='a')
        actual = []
        for a in anchors:
            require('href' in a.attrs, 'sidebar_order', 'Sidebar anchor lacks href', page=page)
            label = one(a, cls='text', category='sidebar_order', page=page).text()
            path = resolve(a.attrs.get('href', ''), page)
            actual.append(dict(html=path[0] if path and not path[1] else None, title=label))
        require(actual == expected['items'], 'sidebar_order', 'Sidebar links/order/titles differ',
                page=page, expected=expected['items'], actual=actual)
        all_anchors.extend(anchors)
    require(len(all_anchors) == 38 and len(nodes(nav, tag='a')) == 38,
            'sidebar_order', 'Unexpected or duplicate sidebar links', page=page)


def check_pager(root, page):
    footers = nodes(root, cls='VPDocFooter')
    require(len(footers) <= 1, 'pager', 'Duplicate footer', page=page['html'])
    require(all(f.tag == 'footer' for f in footers), 'pager',
            'Document footer must be a footer element', page=page['html'])
    pager_links = nodes(footers[0], tag='a', cls='pager-link') if footers else []
    for field, cls in (('previous', 'prev'), ('next', 'next')):
        links = [a for a in pager_links if a.has(cls)]
        expected = page[field]
        require(len(links) == (0 if expected is None else 1), 'pager',
                'Pager direction count differs', page=page['html'], direction=field,
                expected=expected, actual_count=len(links))
        if links:
            require(resolve(links[0].attrs.get('href', ''), page['html']) == (expected, ''),
                    'pager', 'Pager target differs', page=page['html'], direction=field,
                    expected=expected, actual=links[0].attrs.get('href'))
    require(len(pager_links) == sum(page[k] is not None for k in ('previous','next')),
            'pager', 'Unexpected pager link', page=page['html'])
    require(len(nodes(root, tag='a', cls='pager-link')) == len(pager_links),
            'pager', 'Pager link outside the document footer', page=page['html'])


def check_fences(content, page):
    pres = nodes(content, tag='pre')
    require(len(pres) == len(page['fences']), 'code_count', 'Fence count differs',
            page=page['html'], expected=len(page['fences']), actual=len(pres))
    for ordinal, (pre, fence) in enumerate(zip(pres, page['fences']), 1):
        code = one(pre, tag='code', category='code_count', page=page['html'])
        require(code.parent is pre, 'code_count', 'Expected pre/code structure',
                page=page['html'], fence=ordinal)
        parent = pre
        language = None
        while parent is not None and parent is not content:
            markers = [c[len('language-'):] for c in parent.attrs.get('class', '').split()
                       if c.startswith('language-')]
            if markers:
                require(len(markers) == 1, 'code_language', 'Ambiguous fence language', page=page['html'])
                language = markers[0]
                break
            parent = parent.parent
        require(language == fence['language'], 'code_language', 'Fence language differs',
                page=page['html'], fence=ordinal, expected=fence['language'], actual=language)
        actual, expected = code.text(), fence['rendered_text']
        if actual != expected:
            offset = next((i for i,(a,b) in enumerate(zip(actual, expected)) if a != b),
                          min(len(actual), len(expected)))
            raise Mismatch('code_text', 'Decoded fence text differs; no whitespace normalization',
                           page=page['html'], fence=ordinal, first_character_offset=offset,
                           raw_source_sha256=digest(fence['text'].encode()),
                           expected_sha256=digest(expected.encode()), actual_sha256=digest(actual.encode()),
                           expected_bytes=len(expected.encode()), actual_bytes=len(actual.encode()),
                           expected_excerpt=repr(expected[max(0,offset-20):offset+20]),
                           actual_excerpt=repr(actual[max(0,offset-20):offset+20]))


def durable_write(stream, value):
    stream.seek(0)
    stream.write(json.dumps(value, indent=2, ensure_ascii=False) + '\n')
    stream.truncate()
    stream.flush()
    os.fsync(stream.fileno())


def run(expect, dist, receipt_path):
    """One validation attempt. Existing receipts are never replaced or retried."""
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation is before reading inputs or parsing HTML.
    with receipt_path.open('x', encoding='utf-8') as stream:
        receipt = dict(schema=1, status='running', first_failure=None,
                       expectations=str(expect.resolve()), dist=str(dist.resolve()),
                       checker_sha256=digest(Path(__file__).read_bytes()),
                       checked=dict(documents=0, links=0, fragments=0, sidebars=0,
                                    pagers=0, fences=0, public_html=0))
        durable_write(stream, receipt)
        directory = os.open(receipt_path.parent, os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
        try:
            manifest_bytes = expect.read_bytes()
            receipt['expectations_sha256'] = digest(manifest_bytes)
            manifest, counts = read_manifest(manifest_bytes)
            receipt['source_revision'] = manifest['source_revision']
            receipt['expected_counts'] = counts
            receipt['representation'] = manifest['representation']
            receipt['literal_inputs'] = dict(
                encoding='SHA-256 of UTF-8 compact JSON ordered page/value arrays; ensure_ascii=false',
                raw_fences_sha256=sequence_digest([[p['path'], [f['text'] for f in p['fences']]]
                                                  for p in manifest['pages']]),
                rendered_fences_sha256=sequence_digest([[p['path'], [f['rendered_text'] for f in p['fences']]]
                                                       for p in manifest['pages']]),
                raw_headings_sha256=sequence_digest([[p['path'], p['source_h1']] for p in manifest['pages']]),
                visible_headings_sha256=sequence_digest([[p['path'], p['h1']] for p in manifest['pages']]))
            verify(manifest, dist, receipt)
            receipt['status'] = 'passed'
        except Mismatch as exc:
            receipt['status'], receipt['first_failure'] = 'failed', exc.failure
        except (OSError, UnicodeError, ValueError, TypeError, KeyError) as exc:
            receipt['status'] = 'failed'
            receipt['first_failure'] = dict(category='input', message=str(exc), exception=type(exc).__name__)
        except Exception as exc:
            # Unexpected checker defects are durable failures, never a pass or retry.
            receipt['status'] = 'failed'
            receipt['first_failure'] = dict(category='internal', message=str(exc),
                                           exception=type(exc).__name__)
        durable_write(stream, receipt)
        return receipt


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--expect', required=True, type=Path)
    parser.add_argument('--dist', required=True, type=Path)
    parser.add_argument('--receipt', required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        receipt = run(args.expect, args.dist, args.receipt)
    except OSError as exc:
        print(json.dumps(dict(status='refused', category='receipt', message=str(exc))), file=sys.stderr)
        return 2
    print(json.dumps(dict(status=receipt['status'], first_failure=receipt['first_failure'])))
    return 0 if receipt['status'] == 'passed' else 1


if __name__ == '__main__':
    sys.exit(main())
