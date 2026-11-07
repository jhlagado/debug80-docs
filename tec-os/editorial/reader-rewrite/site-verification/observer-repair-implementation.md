# Observer-repair source implementation

Status: source implementation and all control-source reviews are clear. The
complete patch and exact input bindings are ready for independent allocation.
No candidate import, control, probe, build or actual-output validator has run.

The complete source/input diff is `observer-repair-complete.patch`, with base,
endpoint and hashes recorded in `observer-repair-source-offer.json`. The exact
three proposed commands and limits are in `observer-control-allocation-request.md`
and its JSON counterpart. Every command still requires a new explicit allocation.

Authority is Origo `fc90db15`,
`studies/p3-tec-os/reviews/book-observer-repair-adoption.md`. The literal adoption
and input identity are retained in `observer-repair-authority.json`.

The candidate must preserve all 39 reader source identities and the checker,
approved expectation manifest, 48 checker-control artifacts, config/source and
installed/runtime pins. The consumed SITE03 seal remains a failed historical
packet; it must not be invoked or treated as a seal for these changed sources.
A new actual book-verification packet can be sealed only after the focused
source/control review and allocated control results close.

The implementation scope is the runner, worker-visible stop checkpoint and
focused controls. It does not change the guard. Ordinary process queries have
an explicit candidate cap of 2 seconds, bounded by soft time remaining; cleanup
queries retain 0.5 seconds. No query retry or unavailable-observation success is
permitted. The whole 180 seconds, cleanup reserve 3 seconds, guard 850 MB, heap 450 MB,
wait 0, two workers and no minification remain unchanged.

Q01–Q14 must call actual candidate routines with injected dependencies. Q15/Q16
are separately allocated short public-runner fixtures, not VitePress renders or
book acceptance. Their isolated fixture doubles and differing fixture seals must
be listed explicitly. They must not alter the real reader/checker artifacts.

After control results and independent input review, offer one fresh actual
invocation for all 39 pages, 247 links, 45 fragments, four sidebar groups, pagers and
247 literal fences plus canonical input and owned-process postflight closure.
The failed historical jobs and narrow registered-hold releases remain unchanged.
