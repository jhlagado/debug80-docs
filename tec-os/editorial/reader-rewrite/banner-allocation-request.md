# Bounded banner workflow allocation request

Ready for scheduling after P3 offers the qualified source/artifact set. The
qualification preparing at ea3ef3d is recorded as pending, not assumed final.
The full procedure is in `banner-validation-plan.md`.

Requested work: one model round on the normal 80-column PICO9918 console with
the matrix keyboard and a disposable copy of the qualified actual starter card.
Keep its original startup file, GLCD driver, mounts and write-behind flag.
Use the actual pinned TED/TAS on A and enter B:BANNER.ASM through matrix keys.
Prove new file, save/quit/flush, visible reopen, build, run, TED wait/return,
then quit/flush and source reopening plus standalone execution in a fresh machine
from the persisted card image. Capture source, output, screen, hashes and invariants.

Proposed maximum: 15 minutes wall time, 850 MB guard limit, one process and one
attempt. Per-milestone waits are finite, with an accumulated limit of 12 billion
T-states. Stop and report the exact milestone on failure or budget exhaustion.
No full test suite, browser run, GLCD round or physical-board claim is included.
No automatic retry or alternate console. Artifact preparation, if required,
must fit this allocation or remain pending; existing filenames do not prove pins.

The harness can be prepared by read-only source inspection before allocation.
Execution is held until the machine slot and source-linked ROM/map/card are
available. Other editorial work continues during that hold.
