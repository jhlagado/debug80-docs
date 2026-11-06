# Scoped site verification packet

Status: source preparation, not allocated or run.

The packet keeps the accepted reader source at `a3e4c29`. Preparation reads
Git exports and installed dependency files without importing VitePress or
building the site. The expectation manifest contains 39 pages, 247 local
links, 45 fragments and 247 literal fences. Its sidebar has 38 pages in
four groups. The unlisted front door has no previous page. Its default next
page is the first chapter, as the installed theme's lookup specifies.

## Invocation and receipts

`prepare_packet.py` binds the source archive, before/after config files,
complete installed dependency bytes and symlinks, package manifests, runtime
executables, memory guard and packet files. `seal.json` is the resulting
input manifest. It excludes its own digest, which is supplied explicitly to
`run_once.py` in the reviewed command. A changed file requires another seal
and another review before allocation.

`run_once.py` requires an absolute UTC deadline supplied before invocation.
The deadline can be at most 180 seconds after entry. Preflight, dependency
copying, guard startup, build, validation and cleanup share that deadline.
The final three seconds are reserved for stopping and receipts. No phase
resets the clock. The watcher starts before preflight and guard startup.

A new output directory and an exclusive persistent claim for the seal prevent
a second invocation of the same sealed attempt. The claim is never removed.
An existing claim causes failure, even if a different output path is supplied.
A missing terminal receipt cannot count as a pass. No automatic retry occurs.

The guarded command uses `--wait 0`, 850 MB and a 450 MB Node heap. It runs
`build_and_check.py`, which starts VitePress once then runs the HTML checker
once after a successful build. Two workers and disabled minification are
bound in the temporary config. A failure skips every later build/check phase.
The original dependency tree is copied into the isolated source export.
Both dependency trees are checked again after the run.

`stream.log` contains merged child output, written and synchronised while it
arrives. `events.jsonl` records command boundaries. Phase start/end receipts,
`memory.jsonl`, `checker.json` and `owned-process-audit.json` retain their
separate meanings. The first failure has an exclusive receipt which later
cleanup cannot replace. `terminal.json` records the invocation result.

The deadline path stops the owned process tree and writes a separate process
audit. External SIGINT, SIGTERM and SIGHUP use the failure/cleanup path.
SIGKILL or host loss cannot run cleanup code, so the durable invocation/claim
and missing terminal receipt remain an incomplete failure for review.

## Validator controls

`check_html.py` validates emitted files through the same public entry used by
the guarded command. `test_checker.py` writes synthetic HTML text fixtures and
changes actual files before calling that validator. These controls neither
render Markdown nor import VitePress. A positive fixture is not evidence that
the actual build passed. The retained controls report lists the mutations and
receipts. Rendered output remains unqualified until the allocated invocation.

The validator checks titles, first headings, actual IDs and relative links,
sidebar and previous/next order and decoded literal code. The manifest retains
raw source fences and separate expected rendered text. The installed highlighter
removes whitespace at the end of the whole fence before highlighting. Only that
source-derived transformation is applied, not linewise trimming or tab expansion.
Appendix F's inline-code backticks are absent from its visible heading but
remain in its raw source, frontmatter title and sidebar label. These expected
representations were fixed before any real build or render. It rejects unexpected
or absent reader pages. It does not establish visual layout, browser behaviour,
physical hardware, a global site result or publication readiness.
