# Held FAIL example

Status: original execution not established. The full source, recipe, output
and interpretation below are retained unchanged from the reviewed draft.
They first entered the book at5006e2c and remain in frozen10821b6. Reports
through46 do not explicitly record this run. Source inspection supports the
failed-INIT mechanism but cannot establish a captured result. Do not insert
this example as verified reader evidence until an actual original run record
is found or a separate allocated workflow proves it. No new run occurred.

## Preserved material

This
historical FAIL.SVC does no setup and returns carry set. The capture
omits the commands that assembled FAIL and AREA:

```asm
; FAIL.SVC: a service whose INIT returns carry set, so the load fails.
%INCLUDE "ABI.INC"

	ORG	$0100
HDR:	DB	'D',SVCFMT,0,1	; magic, format, no dependencies, removable
	DW	0,0,0,0		; REMOVE, size, extra memory, relocation
	DB	0,0,0		; no stack bytes added
	DW	0		; INIT
	DB	"FAIL    "	; the name SERVICES would print

; Nothing was done, so there is nothing to undo. Returns carry set: not
; installed.
INIT:	SCF
	RET

; Never reached: a failed INIT runs no REMOVE. Returns carry clear.
REMOVE:	OR	A
	RET
```

<!-- node tools/tecvol.mjs put svc.img B fail.asm --text; node tools/capture.mjs --card svc.img B: "TAS AREA" "TAS FAIL FAIL.SVC" FAIL.SVC SERVICES AREA -->
```text
B>FAIL.SVC
FAIL.SVC?

B>SERVICES
B>AREA
47268 bytes

B>
```

FAIL left no BIOS hook, so its pages were released and AREA reported the
original TPA size in this run. A failed INIT runs no REMOVE. An INIT that
started an interrupt source must turn it off before reporting failure.


## Bounded original-record search

A further read-only search found no matching original invocation and result.
Book5006e2c introduces the source, command and printed result without an
execution record. The retained chapter10 rerun JSON records COUNT and RECS,
its setup omits FAIL and its combined output contains no FAIL.SVC. An older
FAIL script and binary use a different vector-installing fixture, not this
no-setup SCF/RET example. Targeted retained text-log searches found no match.
Binary images and compressed archives were not exhaustively examined.
No qualifying payload was archived and nothing executed. The hold remains.
