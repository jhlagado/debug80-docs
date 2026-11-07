#!/usr/bin/env python3
"""Text-only corruption controls using the public checker CLI and supplied manifest.

Synthetic HTML is deliberately not a VitePress render or site acceptance result.
All fixtures and actual CLI receipts remain in the reported private directory.
"""
import argparse
from collections import defaultdict
import hashlib
from html import escape
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


HERE = Path(__file__).resolve().parent


def sha(data):
    return hashlib.sha256(data).hexdigest()


def scaffold(manifest, directory):
    """Construct synthetic DOM-shaped evidence; never construct an expectations file."""
    ids = defaultdict(set)
    for page in manifest['pages']:
        for link in page['links']:
            if link['fragment']:
                ids[link['target']].add(link['fragment'])
    for page in manifest['pages']:
        parts = ['<!DOCTYPE html><html><head><title>', escape(page['title']),
                 '</title></head><body><aside class="VPSidebar"><nav id="VPSidebarNav">']
        for group in manifest['sidebar']['groups']:
            parts += ['<div class="group"><section class="VPSidebarItem level-0">',
                      '<div class="item"><h2 class="text">', escape(group['title']),
                      '</h2><div class="caret"></div></div><div class="items">']
            for item in group['items']:
                parts += ['<div class="VPSidebarItem level-1 is-link"><div class="item">',
                          '<a class="VPLink link" href="/', escape(item['html'], quote=True),
                          '"><p class="text">', escape(item['title']), '</p></a></div></div>']
            parts += ['</div></section></div>']
        heading = ('Appendix F. <code>tecvol</code>' if page['html']=='tec-os/appendix-f-tecvol.html'
                   else escape(page['h1']))
        parts += ['</nav></aside><main><div class="vp-doc"><h1 id="synthetic-title">',
                  heading, ' <a class="header-anchor" href="#synthetic-title" aria-label="',
                  escape('Permalink to "'+page['source_h1']+'"', quote=True),
                  '">&#8203;</a></h1>']
        for fragment in sorted(ids[page['html']]):
            parts += ['<h2 id="', escape(fragment, quote=True), '">Synthetic target',
                      '<a class="header-anchor" href="#', escape(fragment, quote=True),
                      '">&#8203;</a></h2>']
        for link in page['links']:
            href = '/' + link['target'] + ('#'+link['fragment'] if link['fragment'] else '')
            parts += ['<a href="', escape(href, quote=True), '">Synthetic reader link</a>']
        for fence in page['fences']:
            parts += ['<div class="language-', escape(fence['language'], quote=True),
                      '"><button class="copy"></button><span class="lang">',
                      escape(fence['language']), '</span><pre class="shiki vp-code"><code>',
                      '<span class="line"><span>', escape(fence['rendered_text'], quote=False),
                      '</span></span></code></pre></div>']
        parts += ['</div></main>']
        if page['previous'] or page['next']:
            parts += ['<footer class="VPDocFooter"><nav class="prev-next">']
            for key, cls in (('previous','prev'),('next','next')):
                if page[key]:
                    parts += ['<div class="pager"><a class="VPLink pager-link ', cls,
                              '" href="/', page[key], '"><span class="desc">', key,
                              '</span><span class="title">Synthetic pager</span></a></div>']
            parts += ['</nav></footer>']
        parts += ['</body></html>']
        path = directory/page['html']
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(''.join(parts).encode())
    for public in manifest['public_html']:
        content = subprocess.check_output(['git', '-C', str(HERE.parents[3]), 'show',
                                           manifest['source_revision']+':'+public['source']])
        assert len(content) == public['bytes'] and sha(content) == public['sha256']
        path = directory/public['html']
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)


def replace_once(directory, page, before, after):
    path = directory/page
    text = path.read_bytes().decode()
    if before not in text:
        raise AssertionError('Control mutation not applied: '+before[:100])
    path.write_bytes(text.replace(before, after, 1).encode())


def tree_hashes(directory):
    return [{'path':p.relative_to(directory).as_posix(), 'sha256':sha(p.read_bytes()),
             'bytes':p.stat().st_size} for p in sorted(directory.rglob('*')) if p.is_file()]


def controls(expect, output, work=None):
    original_manifest = expect.read_bytes()
    manifest = json.loads(original_manifest)
    if work is None:
        work = Path(tempfile.mkdtemp(prefix='tec-os-html-controls-'))
    else:
        work.mkdir(exist_ok=False, parents=True)
    # Byte-for-byte copy of the supplied manifest, not a generated expectation.
    snapshot = work/'expectations.snapshot.json'
    snapshot.write_bytes(original_manifest)
    baseline = work/'synthetic-baseline'
    scaffold(manifest, baseline)
    first = manifest['pages'][0]
    name = first['html']
    another = next(p['html'] for p in manifest['pages'] if p['html'] not in (name,first['next']))
    fragment_link = next(l for p in manifest['pages'] for l in p['links'] if l['fragment'])
    code_page = next(p for p in manifest['pages'] if p['fences'])
    code_name = code_page['html']
    code_text = escape(code_page['fences'][0]['rendered_text'], quote=False)
    # Keep surrounding spans: only decoded source characters change.
    code_start = '<code><span class="line"><span>'
    code_end = '</span></span></code>'
    group = manifest['sidebar']['groups'][0]
    item1, item2 = group['items'][:2]
    records = []

    def run_case(label, expected_category, mutation=None):
        directory = work/label/'dist'
        shutil.copytree(baseline, directory)
        before = tree_hashes(directory)
        if mutation:
            mutation(directory)
        after = tree_hashes(directory)
        receipt_path = directory.parent/'receipt.json'
        argv = [sys.executable, '-B', str(HERE/'check_html.py'), '--expect', str(snapshot),
                '--dist', str(directory), '--receipt', str(receipt_path)]
        result = subprocess.run(argv, capture_output=True, text=True, check=False)
        receipt_bytes = receipt_path.read_bytes()
        receipt = json.loads(receipt_bytes)
        category = receipt['first_failure']['category'] if receipt['first_failure'] else None
        wanted_exit = 0 if expected_category is None else 1
        assert result.returncode == wanted_exit, (label,result.returncode,result.stdout,result.stderr)
        assert category == expected_category, (label,category,expected_category,receipt)
        assert receipt['status'] == ('passed' if expected_category is None else 'failed')
        assert receipt['expectations_sha256'] == sha(original_manifest)
        assert receipt['checker_sha256'] == sha((HERE/'check_html.py').read_bytes())
        if mutation:
            assert before != after, 'No actual corruption/representation change: '+label
        record = dict(control=label, synthetic_not_rendered=True, argv=argv,
                      expected_first_failure=expected_category, exit_status=result.returncode,
                      stdout=result.stdout, stderr=result.stderr, before_html=before,
                      after_html=after, receipt_path=str(receipt_path),
                      receipt_sha256=sha(receipt_bytes), actual_receipt=receipt)
        records.append(record)
        return record

    run_case('positive', None)
    def relative_links(d):
        for page in manifest['pages']:
            for link in page['links']:
                fragment = '#'+link['fragment'] if link['fragment'] else ''
                href = '/'+link['target']+fragment
                relative = (fragment if link['target']==page['html'] and fragment
                            else './'+Path(link['target']).name+fragment)
                replace_once(d,page['html'],'<a href="'+escape(href,quote=True)+'">',
                             '<a href="'+escape(relative,quote=True)+'">')
    run_case('relative-and-self-fragment-positive', None, relative_links)
    run_case('delete-page', 'inventory', lambda d:(d/name).unlink())
    run_case('unexpected-root-page', 'inventory',
             lambda d:(d/'tec-os'/'superseded-reader.html').write_text('<html></html>'))
    run_case('unexpected-other-root-html', 'inventory',
             lambda d:(d/'index.html').write_text('<html></html>'))
    run_case('framework-404-positive', None,
             lambda d:(d/'404.html').write_text('<!DOCTYPE html><html><head><title>404</title></head><body></body></html>'))
    public_path = manifest['public_html'][0]['html']
    def corrupt_public(d):
        path = d/public_path
        data = path.read_bytes()
        path.write_bytes(bytes([data[0] ^ 1])+data[1:])
    run_case('public-passthrough-corruption', 'public_html', corrupt_public)
    run_case('public-passthrough-missing', 'inventory', lambda d:(d/public_path).unlink())
    def editorial(d):
        p=d/'tec-os'/'editorial'/'private.txt'
        p.parent.mkdir();p.write_text('Synthetic forbidden output')
    run_case('editorial-output', 'inventory', editorial)
    run_case('wrong-title', 'title', lambda d:replace_once(d,name,
             '<title>'+escape(first['title'])+'</title>', '<title>Wrong title</title>'))
    run_case('wrong-h1', 'h1', lambda d:replace_once(d,name,
             escape(first['h1'])+' <a class="header-anchor"', 'Wrong heading <a class="header-anchor"'))
    heading_end = escape(first['h1'])+' <a class="header-anchor"'
    run_case('h1-missing-permalink-separator', 'h1', lambda d:replace_once(d,name,
             heading_end, escape(first['h1'])+'<a class="header-anchor"'))
    run_case('h1-extra-permalink-separator', 'h1', lambda d:replace_once(d,name,
             heading_end, escape(first['h1'])+'  <a class="header-anchor"'))
    run_case('h1-wrong-permalink-separator', 'h1', lambda d:replace_once(d,name,
             heading_end, escape(first['h1'])+'\t<a class="header-anchor"'))
    run_case('h1-content-after-permalink', 'h1', lambda d:replace_once(d,name,
             '&#8203;</a></h1>', '&#8203;</a>Extra heading content</h1>'))
    run_case('h1-wrong-permalink-target', 'h1', lambda d:replace_once(d,name,
             'href="#synthetic-title" aria-label=', 'href="#wrong-heading" aria-label='))
    run_case('h1-wrong-permalink-symbol', 'h1', lambda d:replace_once(d,name,
             '&#8203;</a></h1>', '&#8203;Extra</a></h1>'))
    run_case('h1-wrong-permalink-label', 'h1', lambda d:replace_once(d,name,
             'aria-label="'+escape('Permalink to "'+first['source_h1']+'"',quote=True)+'"',
             'aria-label="Wrong label"'))
    appendix_f = next(p for p in manifest['pages'] if p['html']=='tec-os/appendix-f-tecvol.html')
    f_item = next(i for g in manifest['sidebar']['groups'] for i in g['items']
                  if i['html']==appendix_f['html'])
    # KD246 changes exactly this browser title; sidebar text remains literal.
    assert appendix_f['title'] == 'F. tecvol | Debug80 Docs'
    assert f_item['title'] == 'F. `tecvol`'
    run_case('title-sidebar-distinction-positive', None)
    assert first['title'] == 'First session | Debug80 Docs'
    run_case('ordinary-title-positive', None)
    run_case('h1-source-delimiters-not-visible', 'h1', lambda d:replace_once(d,appendix_f['html'],
             'Appendix F. <code>tecvol</code> <a class="header-anchor"',
             'Appendix F. `<code>tecvol</code>` <a class="header-anchor"'))
    run_case('title-frontmatter-delimiters-retained', 'title', lambda d:replace_once(d,appendix_f['html'],
             '<title>'+escape(appendix_f['title'])+'</title>',
             '<title>F. `tecvol` | Debug80 Docs</title>'))
    run_case('title-missing-word', 'title', lambda d:replace_once(d,appendix_f['html'],
             '<title>'+escape(appendix_f['title'])+'</title>', '<title>F. | Debug80 Docs</title>'))
    run_case('title-wrong-case', 'title', lambda d:replace_once(d,appendix_f['html'],
             '<title>'+escape(appendix_f['title'])+'</title>', '<title>F. TECVOL | Debug80 Docs</title>'))
    run_case('title-wrong-suffix', 'title', lambda d:replace_once(d,appendix_f['html'],
             '<title>'+escape(appendix_f['title'])+'</title>', '<title>F. tecvol | Debug80 Doc</title>'))
    run_case('duplicate-title', 'title', lambda d:replace_once(d,appendix_f['html'],
             '<title>'+escape(appendix_f['title'])+'</title>',
             ('<title>'+escape(appendix_f['title'])+'</title>')*2))
    run_case('missing-title', 'title', lambda d:replace_once(d,appendix_f['html'],
             '<title>'+escape(appendix_f['title'])+'</title>', ''))
    run_case('remove-fragment', 'fragment', lambda d:replace_once(d,fragment_link['target'],
             'id="'+fragment_link['fragment']+'"', 'id="synthetic-removed-target"'))
    link = first['links'][0]
    href = '/'+link['target']+('#'+link['fragment'] if link['fragment'] else '')
    run_case('wrong-document-link', 'links', lambda d:replace_once(d,name,
             '<a href="'+href+'">', '<a href="/'+another+'">'))
    run_case('extra-document-link', 'links', lambda d:replace_once(d,name,
             '</div></main>', '<a href="/'+another+'">Unexpected</a></div></main>'))
    run_case('duplicate-document', 'document', lambda d:replace_once(d,name,
             '</main>', '<div class="vp-doc"><h1>Duplicate</h1></div></main>'))
    run_case('missing-document', 'document', lambda d:replace_once(d,name,
             'class="vp-doc"', 'class="synthetic-missing-content"'))
    run_case('duplicate-id', 'html', lambda d:replace_once(d,name,
             '</div></main>', '<p id="synthetic-title">Duplicate id</p></div></main>'))
    def reorder(d):
        path=d/name;text=path.read_text()
        a='/'+item1['html'];b='/'+item2['html']
        text=text.replace('href="'+a+'"','href="__SWAP__"',1)
        text=text.replace('href="'+b+'"','href="'+a+'"',1)
        text=text.replace('href="__SWAP__"','href="'+b+'"',1)
        path.write_text(text)
    run_case('sidebar-reorder', 'sidebar_order', reorder)
    run_case('sidebar-group-heading', 'sidebar_groups', lambda d:replace_once(d,name,
             '<h2 class="text">'+escape(group['title'])+'</h2>',
             '<h2 class="text">Wrong group</h2>'))
    run_case('sidebar-frontmatter-delimiters-retained', 'sidebar_order', lambda d:replace_once(d,name,
             '<p class="text">'+escape(f_item['title'])+'</p>',
             '<p class="text">'+escape(f_item['title'].replace('`',''))+'</p>'))
    run_case('wrong-pager', 'pager', lambda d:replace_once(d,name,
             'class="VPLink pager-link next" href="/'+first['next']+'"',
             'class="VPLink pager-link next" href="/'+another+'"'))
    run_case('index-missing-doorway-next', 'pager', lambda d:replace_once(d,'tec-os/index.html',
             'class="VPLink pager-link next"', 'class="VPLink synthetic-missing-next"'))
    run_case('code-character', 'code_text', lambda d:replace_once(d,code_name,
             code_start+code_text+code_end, code_start+'X'+code_text+code_end))
    # No frozen source/rendered fence contains a backtick, so deletion has no input.
    # Insert one into actual synthetic HTML; source expectations stay unchanged.
    literal_backticks = sum(f['text'].count('`') for p in manifest['pages'] for f in p['fences'])
    rendered_backticks = sum(f['rendered_text'].count('`') for p in manifest['pages'] for f in p['fences'])
    assert literal_backticks == rendered_backticks == 0
    run_case('code-literal-backtick-inserted', 'code_text', lambda d:replace_once(d,code_name,
             code_start+code_text+code_end, code_start+'`'+code_text+code_end))
    run_case('code-padding', 'code_text', lambda d:replace_once(d,code_name,
             code_start+code_text+code_end, code_start+' \t'+code_text+code_end))
    assert not code_text.endswith('\n')
    run_case('code-extra-terminal-lf', 'code_text', lambda d:replace_once(d,code_name,
             code_start+code_text+code_end, code_start+code_text+'\n'+code_end))
    tab_page = next(p for p in manifest['pages'] if any('\t' in f['rendered_text'] for f in p['fences']))
    tab_fence = next(f for f in tab_page['fences'] if '\t' in f['rendered_text'])
    run_case('code-tab-expanded', 'code_text', lambda d:replace_once(d,tab_page['html'],
             code_start+escape(tab_fence['rendered_text'],quote=False)+code_end,
             code_start+escape(tab_fence['rendered_text'].replace('\t','    ',1),quote=False)+code_end))
    padded_page = next(p for p in manifest['pages'] if any(' \n' in f['rendered_text'] for f in p['fences']))
    padded_fence = next(f for f in padded_page['fences'] if ' \n' in f['rendered_text'])
    run_case('code-trailing-space-removed', 'code_text', lambda d:replace_once(d,padded_page['html'],
             code_start+escape(padded_fence['rendered_text'],quote=False)+code_end,
             code_start+escape(padded_fence['rendered_text'].replace(' \n','\n',1),quote=False)+code_end))
    run_case('code-language', 'code_language', lambda d:replace_once(d,code_name,
             'class="language-'+code_page['fences'][0]['language']+'"', 'class="language-wrong"'))
    run_case('extra-code-block', 'code_count', lambda d:replace_once(d,code_name,
             '</div></main>', '<div class="language-text"><pre><code>Extra\n</code></pre></div></div></main>'))
    def entities(d):
        encoded=''.join('&#'+str(ord(c))+';' for c in code_page['fences'][0]['rendered_text'])
        replace_once(d,code_name,code_start+code_text+code_end,code_start+encoded+code_end)
    run_case('escaped-entity-positive', None, entities)
    def two_failures(d):
        replace_once(d,name,'<title>'+escape(first['title'])+'</title>','<title>Wrong title</title>')
        replace_once(d,code_name,code_start+code_text+code_end,code_start+'X'+code_text+code_end)
    failed = run_case('first-failure-only', 'title', two_failures)
    # This invocation must refuse before parsing: it is not a second validation attempt.
    old_receipt=Path(failed['receipt_path']).read_bytes()
    refusal=subprocess.run(failed['argv'],capture_output=True,text=True,check=False)
    assert refusal.returncode==2 and Path(failed['receipt_path']).read_bytes()==old_receipt
    assert json.loads(refusal.stderr)['category']=='receipt'
    assert expect.read_bytes()==original_manifest
    installed = HERE.parents[3]/'node_modules'/'vitepress'
    inert_sources = []
    for relative in (
        'dist/client/theme-default/components/VPSidebar.vue',
        'dist/client/theme-default/components/VPSidebarGroup.vue',
        'dist/client/theme-default/components/VPSidebarItem.vue',
        'dist/client/theme-default/components/VPDoc.vue',
        'dist/client/theme-default/components/VPDocFooter.vue',
        'dist/client/theme-default/components/VPLink.vue',
        'dist/client/theme-default/composables/prev-next.js',
        'dist/node/chunk-D3CUZ4fa.js',
    ):
        source = installed/relative
        if source.is_file():
            inert_sources.append(dict(path=relative, sha256=sha(source.read_bytes()),
                                      inspection='Read as inert text only; not imported or executed.'))
    report = dict(schema=1, status='passed', scope='Synthetic 39-page HTML corruption controls only; no real render/site acceptance.',
                  source_revision=manifest['source_revision'], expectations_path=str(snapshot),
                  supplied_expectations_path=str(expect.resolve()),
                  representation=manifest['representation'],
                  public_html=manifest['public_html'],
                  expectations_sha256=sha(original_manifest), checker_sha256=sha((HERE/'check_html.py').read_bytes()),
                  controls_script_sha256=sha(Path(__file__).read_bytes()), work_directory=str(work),
                  controls=records, control_count=len(records),
                  literal_backtick_scope=dict(
                      source_occurrences=literal_backticks, rendered_occurrences=rendered_backticks,
                      deletion_case='Unavailable: the 247 frozen fences contain no literal backticks. No altered-manifest positive or invented source fence is used.',
                      insertion_case='One literal backtick is inserted into an actual synthetic HTML fence and must fail code_text against unchanged source/rendered expectations.'),
                  h1_permalink_correction=dict(
                      finding='checker-source-01', review_commit='b37c00e956576992c1a6ed0e1f3f9fdd28a38b3c',
                      source_path='node_modules/vitepress/dist/node/chunk-D3CUZ4fa.js',
                      source_sha256='07d45c356e7c850c2454904949f4b0b95c1d4a2d92119cbdaf4d419ae20dde98',
                      source_lines=[31698,35746,35759],
                      contract='One final direct permalink anchor with exact class, self-id href, source-heading aria-label and U+200B symbol; prefix text equals visible h1 plus exactly one U+0020. No heading whitespace is stripped.',
                      status='Implemented and synthetic controls passed; bounded independent confirmation remains separate.'),
                  inert_component_source_identities=inert_sources,
                  receipt_reuse_control=dict(exit_status=refusal.returncode, stderr=refusal.stderr,
                                            original_receipt_sha256=sha(old_receipt),receipt_unchanged=True),
                  product_import_build_render_runtime=False,
                  known_inert_source_observations=[
                      'Installed highlighter applies ECMAScript trimEnd once to the whole fence. Manifest raw text is retained and its exact rendered_text relationship is checked before comparing HTML without normalization.',
                      'Installed default prev-next lookup gives the unlisted index the first chapter as next. This exact manifest doorway is required; no reader/config change is made.',
                      'KD246 changes only the Appendix F browser title to F. tecvol | Debug80 Docs. Its sidebar label retains literal frontmatter backticks; source_h1 retains inline-code delimiters while visible h1 omits them. Exact checker equality and all 247 fence expectations remain unchanged.',
                      'Only framework 404.html and the exact manifest-bound public HTML passthrough are permitted outside the 39 readers. The public file is read from the frozen Git artifact and checked by bytes/hash, without semantic/global acceptance. Other unlisted HTML and any tec-os/editorial output are rejected.'
                  ])
    output.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
    return report


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--expect',required=True,type=Path)
    parser.add_argument('--result',required=True,type=Path)
    parser.add_argument('--work',type=Path)
    args=parser.parse_args()
    report=controls(args.expect,args.result,args.work)
    print(json.dumps(dict(status=report['status'],controls=report['control_count'],
                          result=str(args.result),work_directory=report['work_directory'])))


if __name__=='__main__':
    main()
