# Bounded banner workflow allocation request

Ready for scheduling after P3 offers the qualified source/artifact set. The
qualification preparing at ea3ef3d is recorded as pending, not assumed final.
The full procedure is in `banner-validation-plan.md`.

Requested work: one model round on the normal 80-column PICO9918 console with
the matrix keyboard and a disposable copy of the qualified actual starter card.
Keep its original startup file, GLCD driver, mounts and write-behind flag.
Use the actual pinned TED/TAS on A and enter B:BANNER.ASM through matrix keys.
Prove new file, save/quit/flush, visible reopen, build, run, TED wait/return,
edit the banner text and rebuild/run, then quit/flush and source reopening plus standalone execution in a fresh machine
from the persisted card image. Capture source, output, screen, hashes and invariants.

Current proposed first-job maximum: 120 seconds for the whole job, 600 MB total
under the guard and a 450 MB JavaScript heap. One attempt, finite milestone waits
and a finite accumulated cycle budget must fit inside that deadline. This
supersedes the earlier unrun 15-minute/850 MB proposal. Stop and report the exact
milestone on failure or budget exhaustion. No retry or deadline extension.
An explicit ATOM reference checks the small program bytes against the actual
on-machine TAS output. The exact compact-layout source is fixed before either
assembly. No full test suite, browser run, GLCD round or physical-board claim is included.
No automatic retry or alternate console. Artifact preparation, if required,
must fit this allocation or remain pending; existing filenames do not prove pins.

The immutable harness, candidate source, exact command and input hashes must be
filed on the existing private remote before command approval. Origo P3 evidence
is the proposed durable home. A temporary preparation path alone is insufficient.

The harness can be prepared by read-only source inspection before allocation.
Execution is held until the machine slot and source-linked ROM/map/card are
available and the exact command is approved after the final source offer. Other
editorial work continues during that hold.
