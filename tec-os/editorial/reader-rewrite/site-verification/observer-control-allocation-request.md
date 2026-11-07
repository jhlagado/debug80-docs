# Observer repair: source-reviewed control allocation request

Status: source only, independently reviewed and unrun. No allocation is granted.
The proposed IDs below must be recorded by P3 before execution. Run no successor
automatically after a failure or unresolved resource outcome.

The complete patch is `observer-repair-complete.patch`. Core source is `dcb14a8`.
The first three independent source findings and all three control-predicate
findings are closed in the retained review/confirmation pairs.

Only runner and worker change among the previous sixteen production payloads.
The other fourteen remain byte-identical. All 39 reader hashes, approved titles,
H1/navigation readings, 247 links, 45 fragments and 247 fence pairs are unchanged.
The 48 qualified checker-control artifacts remain unchanged and are not rerun.

## Exact proposed commands

### Q01-Q14

```sh
/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9 -I -S -B /Users/johnhardy/projects/debug80-docs-tec-os/tec-os/editorial/reader-rewrite/site-verification/test_observer.py --suite Q01-Q14 --allocation KS47-OBSERVER-STATE01-20261107 --inputs /Users/johnhardy/projects/debug80-docs-tec-os/tec-os/editorial/reader-rewrite/site-verification/observer-state-allocation-inputs.json --inputs-sha256 019f63903250533e78d88ed48e00b75fe7f3df270bd112ec982affd1c878578a --work /private/tmp/tec-os-observer-state-019f63903250 --result /private/tmp/tec-os-observer-state-019f63903250.json
```

One lightweight state-control process: 60 seconds from driver entry,
10 seconds per case, two-second bounded thread barriers/joins. Query and
cross-process signal adapters are fake; the driver uses its own real-wall alarm.
No live process-table query, candidate subprocess or product build is run by
these cases. This supplies no measured memory-peak claim. Expected driver exit
0 and fourteen complete case results are both required.

### Q15

```sh
/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9 -I -S -B /Users/johnhardy/projects/debug80-docs-tec-os/tec-os/editorial/reader-rewrite/site-verification/public_observer_fixture.py --case Q15 --allocation KS47-OBSERVER-Q15-20261107 --binding /Users/johnhardy/projects/debug80-docs-tec-os/tec-os/editorial/reader-rewrite/site-verification/fixture-inputs.json --binding-sha256 e7faf93e1680459964fd8c14069562d756f021dadf2f0640971c74461b978e2c --work /private/tmp/tec-os-observer-q15-e7faf93e1680 --result /private/tmp/tec-os-observer-q15-e7faf93e1680.json
```

Do not wrap this command in another guard. It starts one actual pinned guard
inside the public runner: 850 MB, 450 MB heap, wait zero. The controller has
60 seconds from entry including preparation and postflight; the inner runner
cutoff is fixed at controller entry plus 55 seconds, leaving five seconds inside
that same envelope. Two workers/no minification remain unchanged. The native
fixture and its guard require their own allocation and retained actual outcome.

### Q16

```sh
/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9 -I -S -B /Users/johnhardy/projects/debug80-docs-tec-os/tec-os/editorial/reader-rewrite/site-verification/public_observer_fixture.py --case Q16 --allocation KS47-OBSERVER-Q16-20261107 --binding /Users/johnhardy/projects/debug80-docs-tec-os/tec-os/editorial/reader-rewrite/site-verification/fixture-inputs.json --binding-sha256 e7faf93e1680459964fd8c14069562d756f021dadf2f0640971c74461b978e2c --work /private/tmp/tec-os-observer-q16-e7faf93e1680 --result /private/tmp/tec-os-observer-q16-e7faf93e1680.json
```

Do not wrap this command in another guard. It starts one actual pinned guard
inside the public runner: 850 MB, 450 MB heap, wait zero. The controller has
60 seconds from entry including preparation and postflight; the inner runner
cutoff is fixed at controller entry plus 55 seconds, leaving five seconds inside
that same envelope. Two workers/no minification remain unchanged. The native
fixture and its guard require their own allocation and retained actual outcome.

Q15 requires actual public-runner exit0, complete PASS terminal/input postflight
and an explicitly CLEAR empty audit. Q16 requires actual runner exit124 for the
injected post-ACK receipt-integrity failure, FAILED terminal, UNKNOWN_HELD runner
audit and independent resolution of the retained fixture process scope. The
controller exits0 only for the expected fixture outcome. Neither fixture is a
book result: the Node program and checker are explicitly bound test doubles.

## Preserved boundary and next step

The source adoption changes an internal ordinary-query candidate setting to
at most2 seconds, capped by original soft time remaining. Cleanup remains
at most0.5 seconds, with no query retry. Actual site figures remain180 seconds
whole, three seconds cleanup reserve,850 MB sampled,450 MB heap,wait0,
two workers and no minification. Two seconds is not qualified sufficiency.

An unseen detached/reparented process can still fall outside sampled history.
The marker-publication and bootstrap/OS-call limits remain explicit. The failed
SITE03 result and its narrowly recorded registered-hold release are unchanged.

After allocated controls and their actual result/input/process reviews close,
prepare a fresh production seal and input review. Only a separately allocated
actual render/checker invocation can complete the 39-page book closure. No
actual book command, browser check or publication is allocated by this offer.
