# Scoped site verification packet

Status: attempt 01 failed before ACK or build. This corrected source packet
is prepared for a new seal, review and allocation. It has not run.

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
resets the clock. Both deadline watchers start before preflight and guard
startup. The soft stop retains failure and audit data. At the final deadline
a separate path sends KILL to bound jobs and exits 124 without waiting for
a process audit or receipt write. Incomplete receipts cannot count as a pass.

The sealed `invoke.sh` entry computes that absolute deadline before executing
the isolated standard-library runner. The guard has `--wait 0`. A busy slot
therefore fails immediately rather than queuing.

A new output directory and an exclusive persistent claim for the seal prevent
a second invocation of the same sealed attempt. The claim is never removed.
An existing claim causes failure, even if a different output path is supplied.
A missing terminal receipt cannot count as a pass. No automatic retry occurs.

The guarded command uses `--wait 0`, 850 MB and a 450 MB Node heap. It runs
`build_and_check.py`, which starts VitePress once then runs the HTML checker
once after a successful build. Two workers and disabled minification are
bound in the temporary config. A failure skips every later build/check phase.
The entry runner imports only standard-library modules during bootstrap. It
checks its own identity and copies each sealed payload into a fresh private
packet directory, checking every copy before importing the helper. Worker and
checker execution uses that private copy.

The original dependency tree is copied into the isolated source export.
Both dependency trees are checked again after the run. Absolute symlinks are
rejected before copying. Every exported source input is checked before and
after the build. Only dependency files checked separately, `.vitepress/dist`,
`.vitepress/cache`, `.vitepress/.temp` and the installed loader's temporary
config module are excluded from that source-file comparison.

`stream.log` contains merged child output, written and synchronised while it
arrives. `events.jsonl` records command boundaries. Phase start/end receipts,
`memory.jsonl`, `checker.json` and `owned-process-audit.json` retain their
separate meanings. The first failure has an exclusive receipt which later
cleanup cannot replace. Failure latches block later outer command launches
and ownership acknowledgements. The worker checks the same failure receipt
before each phase. Ownership and failure receipts are published atomically
after their complete temporary file has been synchronised. `terminal.json` records the invocation result.

Before starting VitePress, the guarded worker writes its PID, process group,
start identity and context nonce. It waits for the outer invocation to validate
and acknowledge that group. The group remains bound independently of the
guard's lifetime. Without acknowledgement the worker exits without building.
PID start identities distinguish observed processes from later PID reuse.
Both process observers explicitly set `TZ=UTC`, `LC_ALL=C` and `LANG=C` for
their `ps` calls. The worker declares that environment in its ownership record.
The outer invocation checks it before acknowledgement.

Ownership diagnostics retain expected and observed PID, group and birth text,
the observer environment, guard state and exact mismatch reasons. Changes are
appended to the durable event log and the latest observation is retained in
`ownership-diagnostic.json`. ACK publication has its own event. The
`ack_published` field distinguishes pending identity checks from later teardown.

The deadline path stops the owned process tree and writes a separate process
audit. The watchdog and main path share one exclusive terminal finaliser.
The first recorded failure code is preserved through the terminal receipt and
process exit. External SIGINT, SIGTERM and SIGHUP use the failure/cleanup path.
A failure before ACK remains `UNKNOWN_HELD`. An empty internal audit does not
prove that every bootstrap process was attributed. The preserved independent
UTC audit of attempt 01 is evidence about its recorded identities at that time,
not a universal pre-ACK cleanup guarantee. P3 must separately review that hold
before allocating another attempt.

SIGKILL or host loss cannot run cleanup code, so the durable invocation/claim
and missing terminal receipt remain an incomplete failure for review.

## Validator controls

`check_html.py` validates emitted files through the same public entry used by
the guarded command. `test_checker.py` writes synthetic HTML text fixtures and
changes actual files before calling that validator. These controls neither
render Markdown nor import VitePress. A positive fixture is not evidence that
the actual build passed. The retained controls report lists the mutations and
receipts. Rendered output remains unqualified until the allocated invocation.

A single frozen public HTML passthrough also remains byte-identical to its
source. It is outside the 39 rendered readers and gives no global site claim.

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

The source preparation and synthetic-control commands are separate from the
later allocated invocation:

```sh
python3 -B prepare_packet.py
python3 -B test_checker.py --expect expectations.json --result NEW_CONTROL_REPORT
```

The controls mutate actual synthetic HTML files before invoking the same
checker CLI. Synthetic headings include the installed H1 permalink separator
and its exact structure. Every expected rendered heading has its
exact final permalink, one preceding space and the source-defined aria label.
The checker never strips heading whitespace to make a comparison pass.

