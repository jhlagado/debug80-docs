# SITE03 ownership-observer repair proposal

Status: source proposal only, not applied or executed. No new probe, native
control, build, real-output validator or allocation is included.

## Need and baseline

Complete the scoped book verification: actual exit zero, passing terminal and
complete checker receipts for 39 pages, 247 links, 45 fragments, four sidebar
groups, previous/next navigation and 247 literal fence pairs, with registered
ownership before heavy work, unchanged inputs and an independently resolved
actual owned-process outcome. This is the allocation03 acceptance contract,
not a project to prove a universal process supervisor.

Baseline: book branch commit `9dd7589`, sealed runner
`8433ce3e7ab0697835467ddca0b168feb836a56f36ce083ba384eb3b556edbc6`.
The sealed reader source remains `a3e4c29`; checker, approved expectations,
48 synthetic checker outcomes, source/config/dependency/runtime pins and guard
are unchanged. Root has archived SITE03 at Origo `e7195e82`. SITE01, SITE02 and SITE03 remain failed under their original
readings. SITE03's narrowly reviewed registered-hold release establishes no
universal lifecycle or historical-descendant guarantee.

## Actual mechanism

`run_once.py:172-183` runs a global UTC/C identity snapshot with a literal
`timeout=0.5`. The watchdog calls `owned()` on its observation loop before
checking the whole deadline (`319-343`). `TimeoutExpired` therefore enters the
watchdog exception path immediately, latches failure124, sends bound TERM then
KILL and writes `deadline-audit.json` with `clear:false`. Its `os._exit` can stop
the main cleanup path before the final owned-process audit is written.

That happened at 07:06:16.407952Z. The absolute deadline was 07:09:02.787484Z.
The guard reported SIGTERM cleanup, 6.7 seconds, sampled peak 322 MB and three
observed job processes. Whole invocation exit124 took 13.782821208 seconds.
These are an identity-observation failure and incomplete audit receipts, not
exhaustion of 180 seconds or 850 MB. The reason `ps` exceeded 0.5 seconds is not
known. The result is censored at that timeout, so it supplies no measurement of
how long the failed query would have taken.

## Contract classification

The registered allocation03 figures are 850 MB, 450 MB heap, wait 0, 180 seconds
whole, three seconds cleanup reserve, two workers and no minification. Its reading
requires the actual acceptance and ownership conditions above. It does not set
0.5 seconds per process query or a global process-table polling cadence as a gate
figure. Those are internal implementation choices in the sealed runner.

The explicit proposed internal change below is **0.5 to 2.0 seconds for ordinary
identity queries**, capped by time remaining before soft stop. It is not applied,
is not an automatic retry and does not amend a measured gate figure. 2.0 seconds
is an engineering candidate to test, not an empirically qualified sufficient or
optimal bound. Cleanup queries retain at most 0.5 seconds. Every query timeout
still fails closed. No unavailable observation is treated as an empty table.

P3 source review/adoption, focused controls, a fresh seal/input review and a new
allocation are required before use. This proposal does not automatically require
a new owner decision merely because an internal timeout changes. If adoption
would instead weaken a registered acceptance reading, exceed a resource figure
or accept an unresolved owned-process outcome, that would require its own
explicit decision. No such amendment is proposed here.

## Chosen change and alternatives

Keep global discovery. Dropping steady-state global queries after ACK would
reduce discovery of descendants that leave the worker group. It is a broader
coverage change than this repair and is rejected. Merely writing more receipts
while retaining the same 0.5-second steady query abort would leave the observed
book-verification failure mechanism untouched. Retrying queries or ignoring a
failed query is also rejected.

Change only the runner's query budgeting, durable ownership history and soft
stop/finalisation wiring. `source-contract.py.txt` gives the concrete function
contracts and pseudocode. No production file is changed by that file.

1. Give each ordinary global identity query one budget of
   `min(2.0, soft_deadline-now)`. A nonpositive budget starts soft-stop handling
   without launching a query. Cleanup queries use
   `min(0.5, hard_deadline-now)`. A query has no retry. Keep UTC/C and the exact
   identity fields. Record start,end,effective budget,typed outcome and actual
   duration. Successful queries over 0.5 seconds are recorded as such, not hidden.
2. Separate the monotonic soft-stop timer from the observation loop. An in-flight
   query or audit lock must not postpone bound TERM at soft stop or KILL after
   the existing 0.4-second grace. The existing hard timer remains independent,
   sends KILL without waiting for audit/receipt I/O and exits124 at the original
   absolute deadline. The new budget cannot reset or extend either timer.
3. Keep the first failure in a short in-memory latch, preserving its code/stage
   before later command exits. Publish a stop marker for the worker phase checkpoint; it refuses a
   later phase once the marker is visible. Cross-process publication is not
   instantaneous preemption, and any first failure disqualifies the invocation. Receipt persistence must not hold the signalling/escalation path.
   Main is the only normal terminal/audit writer. The observer requests stop and
   returns; it no longer calls `finalize` or `os._exit`. Only the hard deadline
   retains forced exit. An unresponsive main still fails at that hard deadline.
4. Retain direct-child registration immediately after Popen, including an unknown
   birth until checked. Retain the validated nonce/context/PID/parent/PGID/birth
   binding before ACK. Append scoped discovered identities and exit/reuse
   observations instead of losing history when live maps are pruned. A cumulative
   observation ledger is not a complete historical descendant census: unseen
   processes can still detach and reparent between snapshots.
5. Keep all identity checks and final audit fail-closed. After guard/build/checker
   completion, main must retain a successful fresh audit and all input checks
   before PASS. Audit timeout, residual owned identity, missing registry/ACK,
   nonzero command or any first failure prevents acceptance. If cleanup observation
   fails, record UNKNOWN_HELD with registered identities and the last successful
   snapshot, not `remaining:[]`. Independent resolution remains necessary.

The stop-marker/worker checkpoint wiring must be included in the bounded patch;
otherwise a failure latched only in parent memory has no explicit worker
checkpoint signal before its full file receipt appears. This narrows the
publication window but does not prove zero instructions run during it. This small worker change does not alter
checker inputs or acceptance. Guard source remains unchanged.

## Continuity and limits

A live Popen handle binds a direct child until reaped; its bare PID is never an
indefinite signalling authority. The acknowledged worker group remains bound
independently of guard lifetime. Each successful global snapshot extends only
observed PID/birth and parent/group closure. A later snapshot must detect PID
reuse and never transfer authority to the new birth. The proposed longer query
window does not prove that every intervening descendant was observed.

Signal failures, OS scheduling, interrupted receipt writes, SIGKILL/host loss and
bootstrap attribution limits remain explicit. A blocked or failed final audit
cannot be converted into acceptance by a prior empty observation. SITE03's
missing historical ledger cannot be reconstructed by the new implementation.
No numeric-PID cleanup of the failed invocation is proposed.

## Planned controls and route to book closure

`controls.json` specifies positive and negative controls with concrete inputs
and expected outcomes. They are planned, not executed. First qualify the proposed
state transitions using a fake clock/query/receipt/signal adapter driving the
actual candidate routines, not a separate model that duplicates their decisions.
Then use separately allocated small public-runner controls with short-lived
fixture children for the group/lifetime integration cases. No VitePress build,
browser or real book validation belongs in those diagnostic controls.

Keep all 48 already qualified checker controls and their exact input/output
artifacts. They need not be rerun solely because the unchanged checker inputs
are carried into another runner packet. Bind the new focused runner control
source/results in the fresh seal and independently review its bootstrap import
boundary. No unverified helper may execute before payload verification.

After those controls and source/input review close, offer one fresh bounded
actual invocation for the complete 39-page closure, under the unchanged figures.
It must run the actual checker to completion and retain input/process postflight
results. A prior failed build or synthetic positive cannot substitute for that
acceptance. No successor command or allocation is supplied by this proposal.
