# Current site verification result

SITE03 actually ran under Origo2111028d and FAILED on a 0.5-second watchdog
identity-observation timeout. No build completion or checker acceptance exists.
The complete result and bounded resource-hold disposition are in
`site-verification/attempt03-result.json`. No retry, source amendment, profile
relaxation or publication is allocated. All following commands are historical.

# Current site verification request

KD-246 is explicitly approved. The corrected packet and fresh command are in
`site-verification/attempt03-request.md`. Synthetic controls and independent
source/result/input reviews are clear. A fresh actual allocation remains required. No actual invocation
of the new seal has run. The following SITE02 request is historical.

# Corrected TEC-OS site verification packet

Status: SITE02 ran under Origo9de5c81e and failed validation after a successful
render. Its original receipts and sealed packet are preserved in
`site-verification/failed-attempt02`. The title-reading proposal is pending an
explicit Origo gate-reference decision. No changed reading has been activated or
executed and no next invocation is allocated. Publication remains excluded.

The preparation and command below are historical records of the failed SITE02
packet, not instructions to reuse its claim or output directory. See
`site-verification/title-reading-proposal/README.md` for the bounded decision.

## Preserved first result

`KS47-SITE01-20261106`, allocated at Origo `58001ab3`, failed before ownership
ACK or any VitePress build. Both invocation and guard exited 1. Whole elapsed
time was 7.2871055 seconds. The guard reports 2.3 seconds, a sampled peak of
14 MB and one observed process. There was no build-start or checker receipt.

The actual receipts, command log, persistent claim and all 16 old payloads with
their original `31020778…` seal are retained in
`site-verification/failed-attempt01`. The original output and claim are unchanged.
Origo `2ea74522` retains the complete 60,688,710-byte raw archive with SHA-256
`cc66bc78b89acf934bd7c12b75ac6c78119eacd731ab77859214b444c8e15579`.

The initial pre-ACK classification was `UNKNOWN_HELD`. Independent review
resolved this attempt's specific bootstrap outcome and released its reservation,
using the actual terminal results, retained context/ownership and later UTC
audit. Generic pre-ACK cleanup remains unproved. That release authorises no retry
or next invocation.

## Diagnosis and bounded correction

The old outer `ps` call inherited its timezone and locale. The worker ran with
UTC/C settings and recorded its birth in that environment. Literal `lstart`
comparison could therefore reject the same process. The owner also retained a
separate same-process comparison with an 11-hour Melbourne/UTC difference.
The failed run did not retain the outer birth string, so its exact value and
every other possible missing-ACK precondition cannot be reconstructed.

Both `ps` calls now explicitly use `TZ=UTC`, `LC_ALL=C` and `LANG=C`. The worker
ownership receipt declares those settings and the outer observer checks them.
`ownership-diagnostic.json` and append-only events retain expected and observed
PID/group/birth, environment, guard state, stop/failure state and exact mismatch
reasons. ACK publication has its own event. `ack_published` distinguishes
pending identity checks from normal later teardown.

The complete bounded diff is `site-verification/attempt02-source.diff` and the
qualified diagnosis is `attempt02-diagnosis.json`. Independent source review
`9843122` is retained in `attempt02-source-review.json`. New static checks used
AST parsing and file identities only. No new observer, process probe, worker,
runner, guard or build ran.

## Complete sealed inputs

Book source remains `a3e4c292fee3022e432a18be36370d2d87cd4b30`.
The new seal SHA-256 is
`09719b943cddba8aebcf384f24b37f554dc991833ba79e0ba07ea65f50e0c37d`.

Only `run_once.py`, `build_and_check.py` and the packet README changed among
the 16 payloads. The other 13 payloads are byte-identical to attempt 01. That
includes the checker, expectations, 40-control report, invocation entry,
preparation utilities and all config/dependency/source manifests.

The 34,037,760-byte source export retains SHA-256
`4b2e63773028566961df97fd8cafa4e0ce50b398f3fe776fb2b41f24bfa3cb28`.
All 889 exported source-file identities, 4,454 actual installed dependency
entries, runtime/guard identities and temporary config bytes are unchanged.
The complete before/after config and diff remain sealed. Accepted reader prose,
source citations and validation expectations are unchanged.

## Prepared command, not executed

P3 must supply a new allocation record in `TECOS_SITE02_ALLOCATION`. The output
directory must not exist. The old persistent claim is never removed or reused.

```sh
: "${TECOS_SITE02_ALLOCATION:?New P3 allocation record is required}"
sh /Users/johnhardy/projects/debug80-docs-tec-os/tec-os/editorial/reader-rewrite/site-verification/invoke.sh \
  09719b943cddba8aebcf384f24b37f554dc991833ba79e0ba07ea65f50e0c37d \
  /private/tmp/tec-os-reader-site-09719b943cdd-attempt02 \
  "$TECOS_SITE02_ALLOCATION"
```

The same absolute 180-second deadline is set before runner and guard startup.
The guard still uses `--wait 0 --limit 850 --heap 450`. Build workers remain 2
and minification remains disabled. No retry occurs. The existing pre-ACK window
is unchanged. The build still requires the outer ownership ACK.

The actual checker path supplied by the runner will be:

```sh
/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9 -S -B \
  /private/tmp/tec-os-reader-site-09719b943cdd-attempt02/packet/check_html.py \
  --expect /private/tmp/tec-os-reader-site-09719b943cdd-attempt02/packet/expectations.json \
  --dist /private/tmp/tec-os-reader-site-09719b943cdd-attempt02/source/.vitepress/dist \
  --receipt /private/tmp/tec-os-reader-site-09719b943cdd-attempt02/checker.json
```

It remains under the same guard after one successful build. It requires all
39 titles/H1s, 247 links, 45 fragments, four sidebar groups, previous/next order
and 247 decoded literal examples. The exact public passthrough, framework 404,
source-derived code suffix and H1 permalink contracts are unchanged. The prior
40 synthetic controls remain retained and unchanged. They were not rerun and
supply no actual render result.

## Acceptance boundary

Durable streaming output, command events, phase receipts, ownership/ACK records,
first failure, memory log, checker results and process audits remain required.
Acceptance needs actual exit 0, matching passed terminal/checker receipts,
no first failure, ACK before build and a clear actual owned-process audit.
A failed pre-ACK attempt remains `UNKNOWN_HELD` until its owner resolves the
specific outcome. An empty internal audit alone cannot release it.

This is a new source packet, not a retry result. Independent input review and
new allocation precede execution. No universal termination, visual layout,
browser, global site, native product build, hardware, llms output or publication
acceptance is claimed.
