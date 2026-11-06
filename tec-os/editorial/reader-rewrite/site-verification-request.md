# Sealed TEC-OS site verification request

Status: source preparation and independent inert confirmation are clear at
`e4ea69f`. The invocation remains unrun and requires P3's separate allocation.
Publication is excluded.

## Bound candidate and inputs

The book candidate is `a3e4c292fee3022e432a18be36370d2d87cd4b30`.
The packet is in `tec-os/editorial/reader-rewrite/site-verification`.
Its seal has SHA-256
`3102077825ff6cb6944a117c5fc56d450614f8f82e8998a704cffeea860f0b4e`.

The seal binds 16 payload files, the exact source archive, runtime executables
and the memory guard. The 34,037,760-byte source archive has SHA-256
`4b2e63773028566961df97fd8cafa4e0ce50b398f3fe776fb2b41f24bfa3cb28`.
The installed-input manifest binds all 4,454 files and symlinks in the actual
docs dependency tree. Package manifests and lockfiles have separate source
identities. Installed package versions were checked against the site lockfile.
Absolute dependency symlinks are rejected before relocation.

The complete before/after temporary config and its diff are payload files.
The temporary config selects only the 39 reader Markdown pages, uses two
workers and disables minification. Other public files and assets remain.
`source-inputs.json` binds all 889 exported file inputs with that config delta.
Only the named generated output paths are writable exclusions. Dependencies
are copied privately and checked separately before and after the run.

## Single allocated command

This is a prepared command, not an executed transcript. P3 supplies the actual
allocation record in `TECOS_SITE_ALLOCATION`. The output directory must not
exist. The persistent claim for this seal is never removed or reused.

```sh
: "${TECOS_SITE_ALLOCATION:?P3 allocation record is required}"
sh /Users/johnhardy/projects/debug80-docs-tec-os/tec-os/editorial/reader-rewrite/site-verification/invoke.sh \
  3102077825ff6cb6944a117c5fc56d450614f8f82e8998a704cffeea860f0b4e \
  /private/tmp/tec-os-reader-site-3102077825ff-attempt01 \
  "$TECOS_SITE_ALLOCATION"
```

The sealed entry sets the absolute UTC deadline before executing the isolated
Python runner. One monotonic deadline covers preflight, export, dependency
copy, guard startup, build, checking and final flush/exit. Its maximum is 180
seconds. The final three seconds are reserved for the soft stop and receipts.
A separate final cutoff remains active through finalisation. It sends KILL to
bound jobs and exits 124 without a blocking audit, receipt write or wait.

The guard uses `--wait 0 --limit 850 --heap 450`. A busy slot fails immediately.
There is no queue wait or retry. VitePress runs once through its pinned CLI.
The checker runs once after a successful build under the same guard. A failed
build skips it. Failure latches prevent later outer command launches and
ownership acknowledgements, and the worker checks failure before each phase.

Before any build starts, the worker supplies its context nonce, guard PID,
process group and start identity. The outer invocation must acknowledge them.
That detached group remains bound independently of the guard's lifetime.
Bootstrap uses only standard-library code. Payload files are verified and
copied privately before helper import, worker execution or checker execution.

## Actual validator and controls

`check_html.py` has the exact future command:

```sh
/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9 -S -B \
  /private/tmp/tec-os-reader-site-3102077825ff-attempt01/packet/check_html.py \
  --expect /private/tmp/tec-os-reader-site-3102077825ff-attempt01/packet/expectations.json \
  --dist /private/tmp/tec-os-reader-site-3102077825ff-attempt01/source/.vitepress/dist \
  --receipt /private/tmp/tec-os-reader-site-3102077825ff-attempt01/checker.json
```

The runner supplies those absolute paths from its bound execution context.
The checker requires all 39 titles and H1s, 247 reader links, 45 fragments,
four sidebar groups, previous/next order and 247 decoded literal examples.
The unlisted front door's default next link is Chapter 1. A framework 404
and one hash-bound 321-byte public HTML passthrough are outside the reader
inventory and confer no global site acceptance.

The expectation manifest preserves raw source and expected rendered text
separately. The installed highlighter trims only the whole fence's suffix.
Internal padding and tabs remain exact. The H1 contract includes the installed
single-space permalink separator and its exact final anchor structure.
Appendix F's inline-code delimiters are absent from its visible heading but
remain in the raw heading, browser title and sidebar label. These rules were
fixed from installed source before any real rendering.

`test_checker.py` exercised the same checker CLI on actual synthetic HTML files.
All 40 controls passed: four positives and 36 corruption rejections. Cases
cover missing/extra pages, wrong title or heading, malformed H1 permalinks,
missing fragments, wrong links, sidebar order, previous/next links, code bytes,
padding, tabs, language and the public passthrough. Existing-receipt refusal
also preserved the original receipt. The complete controls report retains
arguments, receipts and before/after HTML hashes. These are validator controls,
not a successful real-site build or render.

## Receipts and acceptance

Merged output is synchronised to `stream.log` as it arrives. Command events,
phase start/end records, `memory.jsonl`, ownership/ack records, `checker.json`,
complete postflight source identities and process audits remain in the output
directory. An exclusive first-failure receipt cannot be replaced by cleanup.
Terminal writers share one finalisation path. The first failure's normalised
exit code is retained. An interrupted or incomplete receipt cannot pass.

Acceptance requires actual invocation exit 0, a matching passed terminal and
checker receipt, no first failure and a clear owned-process audit. A retained
PASS-shaped file with a nonzero invocation exit is insufficient. P3 retains
and reviews the complete result before any later allocation or publication.

The checker source review and runner source review close their bounded source
findings. The runner's OS scheduling and signal-delivery behaviour has not been
executed. No build, VitePress import, real rendering, browser, preview, product
assembly, native product build or runtime job accompanied this preparation.
Physical hardware, visual layout, the global site, llms built-output checks
and publication remain outside this requested allocation.
