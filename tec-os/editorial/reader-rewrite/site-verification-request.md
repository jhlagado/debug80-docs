# TEC-OS integrated-book verification request

Status: prepared for P3 allocation. Nothing in this request has run.

## Frozen source and scope

The integrated source candidate is
`a3e4c292fee3022e432a18be36370d2d87cd4b30` on `tec-os-reader-rewrite` in
`/Users/johnhardy/projects/debug80-docs-tec-os`. It has 39 root readers,
including 28 chapters and ten appendices. All root files equal their accepted
drafts after navigation-only frontmatter changes. There are four sidebar
groups with 7, 6, 15 and 10 entries. The front door remains unlisted and
`tec-os/editorial/**` remains excluded.

Independent reader corrections and the original FAIL workflow are clear at
`db58db7`. The 13 changed-source readers are clear at `baf7b75` and the other
22 source applications at `2c81623`. Integration confirmation is separate.

## Requested allocation

One isolated TEC-OS-only VitePress build, under the shared memory guard, with
an 850 MB limit, 450 MB Node heap, two build workers and minification disabled.
No product assembly, test, runtime, browser, preview, server, native build or
publication is included. No checkout of main, merge, workflow dispatch or
remote publication command is needed. The canonical checkout stays untouched.

The build uses an export of the exact commit above and the existing docs
site dependencies. Temporary build configuration belongs only in that export.
It excludes every tracked Markdown page except the 39 direct `tec-os/*.md`
readers. Theme files, public files and assets remain available. No generated
output is committed back over the source.

## Exact preparation and build commands

These commands are a request for allocation, not an executed transcript.
`TECOS_SITE_TMP` must be a new empty scratch directory selected for the run.

```sh
git -C /Users/johnhardy/projects/debug80-docs-tec-os archive --output "$TECOS_SITE_TMP/source.tar" a3e4c292fee3022e432a18be36370d2d87cd4b30
tar -xf "$TECOS_SITE_TMP/source.tar" -C "$TECOS_SITE_TMP"
ln -s /Users/johnhardy/projects/debug80-docs-tec-os/.github/site/node_modules "$TECOS_SITE_TMP/node_modules"
```

The following source-only preparation changes only the exported config and
retains its original bytes. It excludes all other tracked Markdown pages while
preserving theme, public-file and asset handling.

```sh
python3 - "$TECOS_SITE_TMP" <<'PYCODE'
from pathlib import Path
import json, re, subprocess, sys
scratch = Path(sys.argv[1])
repo = '/Users/johnhardy/projects/debug80-docs-tec-os'
revision = 'a3e4c292fee3022e432a18be36370d2d87cd4b30'
tracked = subprocess.check_output(
    ['git', '-C', repo, 'ls-tree', '-r', '--name-only', revision],
    text=True).splitlines()
excluded = [p for p in tracked if p.endswith('.md') and
            not (p.startswith('tec-os/') and p.count('/') == 1)]
config = scratch / '.vitepress/config.ts'
original = config.read_text()
(scratch / 'config.before.ts').write_text(original)
changed, count = re.subn(
    r'srcExclude: \[[\s\S]*?\n  \],',
    'srcExclude: ' + json.dumps(excluded) + ',', original, count=1)
assert count == 1
changed = changed.replace(
    'export default defineConfig({',
    'export default defineConfig({\n  buildConcurrency: 2,\n'
    '  vite: { build: { minify: false } },', 1)
config.write_text(changed)
(scratch / 'config.after.ts').write_text(changed)
assert 'tec-os/editorial/' in changed
PYCODE
```

```sh
node /Users/johnhardy/projects/origo/tools/mem-guard.mjs --limit 850 --heap 450 --name tec-os-reader-site --log "$TECOS_SITE_TMP/mem-guard.log" -- sh -c 'cd "$1" && npm run -s build' sh "$TECOS_SITE_TMP"
```

## Checks on retained output

A successful build alone is insufficient. Retain its exit status, complete
output and memory log. Check the exported `.vitepress/dist/tec-os` for exactly
39 reader HTML files and no editorial subtree. Confirm all 39 page titles and
all 45 reader anchor targets against the actual emitted IDs. Confirm all 247
relative reader links resolve in the output. Check generated previous/next
links and the four sidebar groups for correct order, with no superseded root
routes or editorial/candidate/pass-record entries. Compare every rendered
literal example against the accepted source after HTML entity decoding,
without treating a representation change as a new product capture.

The source checks already run are `node .vitepress/generate-sidebar.mjs` and
`node scripts/check-links.mjs`. The latter passed 1,245 links in 436 Markdown
files. Installed VitePress's heading-slug algorithm checked 247 reader links
and 45 fragments. The prose gate has zero hard findings and 11 reviewed
metadata/table/URL candidates. These checks do not establish rendered layout.

Visual page inspection, if required after this build, needs a separate bounded
allocation. A TEC-OS-only build cannot certify the rest of the site or the
built-site llms URL gate. The two llms source copies are unchanged. Publication
remains excluded regardless of this verification result.
