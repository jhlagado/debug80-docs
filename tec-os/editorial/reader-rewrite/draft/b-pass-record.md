# Appendix B pass record

## Scope and authority

I own only `draft/appendix-b-rom-services.md` and this record. The ledger's
final path is `tec-os/appendix-b-rom-services.md`. I read the complete original
appendix, all 64 assigned units, the closed outline/profile amendment and
the final-path ledger. No other chapter supplies an assigned fragment here.
Chapter 11 supplies the programming introduction and HWLIB. Chapter 13 supplies
resident services/registry use and Chapter 23 supplies dispatcher internals.

I applied the amended STYLE guide, human-writing and teaching-prose-review
standards to a reference appendix. I kept direct lookup entries rather than
turning sixteen service contracts into a tutorial or adding a recap.
Mechanism authority is TEC-OS `ea3ef3de9133931e925a0220d51c0e971c1fd8dd`,
read through git object text. I reused the full hardware-routine/caller read
from Chapter 11 and read the volume, registry, driver, PICO-record and font
paths relevant to this complete appendix. I checked every source reference
semantically, including unchanged claims, rather than accepting a textual
line mapping.

No product execution, import, test, build, assembly, capture, card write or UI
workflow occurred. Text comparisons, source-coordinate checks and prose
scripts are preparation checks. They are not a new product result.

## Historical evidence and actual proof scope

The original checked-at and C16 comments are retained literally. A separate
comment names ea3ef3d for the mechanism coordinates and explicitly separates
historical measurements. I did not use the old 78127ec header as evidence
that every cost, path depth or VRAM result was measured at that pin.

| Retained material | Actual historical provenance checked |
| --- | --- |
| Invalid number 58, INFO 244, DIGIT 20,670, LCD 4,915/4,935, TONE formula/222 overhead, JOY 214 and KEYS 581 | `editorial/reviews/book-29.md:7-15,58-85`: TEC-OS 60e0768, copied source-identical tree, guarded service timing from ABICALL's JP to return with stack-write recording. The report distinguishes upper bounds from observed depths. |
| DIGIT lit interval 3,348 and DJNZ 3,323 | `editorial/reviews/book-10.md:1-7,23-23`: TEC-OS bd15528, trace between the selecting and extinguishing port writes. The loop component is an instruction count. This interval is not silently assigned60e0768 by the later whole-pass figure. |
| VIDEO 1,232 and release 217,252/187,492/147,031, PUTAT 509 and depths 22/18/18/14, FONT 194/depth 4 | `editorial/reviews/book-40.md:1-5,110-114`: TEC-OS 58d4345, guarded copied tree. Conditions remain selected PICO80/40 or console elsewhere, cursor present/absent and driver identity. |
| GLCD PUTAT about 36,900 | `editorial/reviews/book-43.md:1-3,59-59`: TEC-OS 621201d, recorded writer measurement 36,909 at `ab13/svc621.json`. The report checked that artifact. I have not executed or newly authenticated it. |
| RTC read 6,946 | `editorial/reviews/book-31.md:1-4,72-72`: TEC-OS 7458352, direct model measurement reported at the CALL/return boundary with CALL's 17 removed. |
| RTC set 7,780 | `editorial/reviews/book-29.md:67-85` records 7,752 at 60e0768. `editorial/reviews/book-32.md:1-4,54-54` checks the 28-T-state mode guard at 7458352. I label 7,780 as the earlier measurement plus instruction adjustment, not a newly timed set. |
| VTEST positive TAS/VRAM round trip | `editorial/reviews/book-27.md:1-8,45-52,76-78`: TEC-OS 60e0768, sources taken from book ASM, cards made from chapter recipes, TAS on the model and retained text matching its capture. `60e0768:test/inputs.json` pins TAS to Thorium dbee66a and SHA-256 45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2. |

The VTEST evidence is specifically the then-loaded PICO.SVC's version-2
graphics record. It does not qualify the later ROM implementation by source
similarity. I compared its listing at book 51ea0e9 with the retained original:
only the second comment line changed from PICO.SVC to the ROM console.
Executable instructions/data and the capture command/output match. I state
the older record provider alongside the historical result in the draft.
The current program listing is retained byte for byte from the assigned
original, including that later comment. Compact-style rewriting still needs
its own assembly proof and no such proof is claimed.

The service summary's stack column is ea3ef3d's ABI bound. It is not the
measured maximum for every path. The historical PUTAT path depths and FONT
measurement are separately labelled by pin. The dispatcher restores its
pushed arguments before service entry, so its temporary depth is not added
to a routine's own maximum. Caller return words, saves and nesting still
need room. The inherited-stack allowance is taught in Chapter 10.

The pitches are arithmetic at 4 MHz from the retained half-period formula.
The last-half-cycle exception, nonzero-DE condition and final overhead remain.
No physical oscillator, brightness, refresh or board result follows from them.
The source-format font facts describe the existing ABI 5.1 FONT 15 contract.
They do not qualify the chosen KS48 font or 40-column cold default.

The BBE3h PICO table coordinate is explicitly the original 78127ec layout in
Appendix C. C179h FONT is retained as a historical 58d4345 layout coordinate,
also present when FONT was introduced in book commit af8c9ab. Neither is a
new symbol-map measurement or a fixed ABI address. Current callers use FIND
or FONT. I did not fabricate a current build to regenerate either address.

## Complete movement account

All units below are from `tec-os/appendix-b-rom-services.md` at movement base
`10821b68f80c10d2037bbd1c5ab207877c897c68`:

`1-6`, `8-8`, `10-10`, `12-14`, `16-23`, `25-25`, `27-31`, `33-38`, `40-41`, `43-43`, `45-49`, `51-55`, `57-60`, `62-66`, `68-71`, `73-90`, `92-99`, `101-101`, `103-107`, `109-114`, `116-123`, `125-126`, `128-134`, `136-139`, `141-146`, `148-150`, `152-158`, `160-164`, `166-171`, `173-174`, `176-183`, `185-192`, `194-198`, `200-208`, `210-216`, `218-224`, `226-226`, `228-231`, `233-240`, `242-245`, `247-254`, `256-257`, `259-259`, `261-263`, `265-265`, `267-274`, `276-282`, `284-286`, `288-288`, `290-298`, `300-303`, `305-307`, `309-309`, `311-315`, `317-323`, `325-334`, `336-339`, `341-402`, `404-408`, `410-410`, `411-420`, `422-425`, `427-427`, `429-436`

The original opening, ABI table and general call contract now distinguish
mechanisms, source bounds and separately pinned costs before the lookup
entries. Every original service retains its number, name, argument, status,
stack allowance and retained cost. The INFO and PICO tables retain every
bit/offset/name/value. Both TONE tables retain every instruction/numeric row.
The volume refusal table retains every original refusal with clearer mapping
versus cache consequences. The existing driver/registry/claim/font exceptions
remain in their corresponding lookup sections. Existing addresses, VTEST,
recipe and output are preserved with their scope made explicit.

All five assigned source/output/provenance units match literally: two original
metadata comments, VTEST's complete ASM fence, the capture/preparation command
and its text fence. Both fences remain identical and ordered. Front matter
and headings are reconstructed for the same final appendix path. No new
program, transcript, runtime figure or shell recipe was introduced.

## Source contracts and factual clarifications

I read the following owning paths at ea3ef3d. All reader-facing coordinates
refer to this pin unless an explicit historical result pin is supplied.

| Contract | Source read and support |
| --- | --- |
| ABI and selection | `src/abi.asm:1-20`; `src/abi.inc:1-183`; `src/services.asm:35-105`; `src/tables.asm:99-132`; `src/rom.asm:12-18`: table bytes, 16 numbers, return-through-stack selection, preservation and status helpers. |
| Build/public include | `tools/build.mjs:143-157`; `tools/media.mjs:251-257`: actual checks versus claimed routine semantics and the published include. |
| Hardware routines | `src/services.asm:107-595`: full DIGIT/LCD/VIDEO/TONE/JOY/KEYS/PUTAT/RTC paths, including rejected modes, probe, row mark, zero cases, cursor ordering and write-protection restoration. `src/boot.asm:90-94,178-215` supplies clock-bit initialization and warm release. |
| Video and cursor callers | `src/video.asm:82-123,125-212`; `src/console.asm:200-225,296-332`; `src/term.asm:49-65`; `drivers/glcd.asm:604-641`; `src/pico.asm:277-331`: selected-console page/cursor paths, direct cell output and high-byte reverse glyphs. |
| Volumes and descriptor results | Complete `src/volsvc.asm:1-506`, especially 246-279,287-315,326-429 and457-506; `format/format.json:27-38`; `src/vol.asm:470-530`: drive validation, descriptor read failures, on-any-drive refusal, slot checks, mapping publication, descriptor byte 14 and reread/copy path. |
| Flush and allocation policy | `src/cache.asm:247-350`; `src/boot.asm:679-800`: successful writes versus failed/dropped lines and the 1.0/1.1 slot reservation distinction. MOUNT/UNMNT call BDOS 37 and default reselect 14, unlike DESC. |
| Driver hook and removal | `src/services.asm:605-658`; `src/video.asm:125-212`; `drivers/glcd.asm:39-129`: only B = 3 is admitted, HL = 0 precedes installation checks, startup-CRT refusal, LINEBUF, table order, REMOVE and reselection only when the dropped mode was selected. |
| Registry structure and bounds | `src/loader.asm:60-64,458-518,589-606,773-880`: record fields, total 256 limit, per-new-service 255 limit, validation/linking, newest-first name/version search and byte index. `src/loader.asm:128-174` proves removal increments the generation. |
| PICO record/provider | `src/pico.asm:31-174,353-445`; `src/ram.asm:75-107`; `src/abi.inc:205-243`: permanent tail, thirteen words, graphics argument contracts, unchecked claim prerequisite, zero-data count, delayed width change and state offsets. Removal restores an owner's prior head rather than removing the ROM tail. |
| Existing font | `src/services.asm:597-603`; `src/abi.inc:163-168`; `tools/lib/font.mjs:9-31`; `drivers/glcd.asm:66-72`; `src/pico.asm:277-331`: returned address, 96 glyphs/eight rows, pixel placement and driver acquisition. |
| Joystick diagnostic labels | `diag/interact.asm:553-557`: exact named bits are retained as unconfirmed physical labels rather than newly established wiring. |

The main factual qualifications are:

- Hardware failures set NZ, but volume/driver failures do not supply that
  contract. FIND/LIST return the generation only on success. Carry is the
  common decision flag.
- A rejected drive change does not imply an untouched cache. Successful dirty
  writes may already have reached the card and failed CFLALL lines are dropped.
  Descriptor-read failure also maps to TNEBAD. MOUNT refuses a volume already
  on the requested drive as well as on another drive.
- DRVR drops are admitted before matrix/presence/startup installation checks
  when B = 3. B = 1 is refused even for HL = 0. Other selected screens are preserved.
- PUTAT validates availability before count/row. Nonzero count hides the cursor
  before an off-row success. The high-byte filter statement is scoped to the
  ordinary video-console path.
- TONE DE = 0 leaves the port untouched. A nonempty call ends speaker-off.
- FIND walks at most 256 and LIST's byte index selects at most 256 entries.
  A new service can publish at most 255 while total registry size can reach 256.
  An adequate caller stack is required. The original phrase “any stack” did
  not remove the stated stack bound.
- A zero-count graphics transfer moves no data but still sets the VRAM address.
  The width entry instead requires no active claim and programs the screen
  on reselection rather than immediately at its call.

## Actual reference and craft passes

I wrote the full generous draft before the reductive passes. The reference
pass made the sixteen entries directly locatable, retained general rules
before the summary and separated cost provenance from the current contracts.
The table has explicit stack-bound and historical-cost headings. Each entry
states its own status and bound. Claim ownership, zero cases and stateful
failure consequences appear beside their affected API rather than only in
an introductory warning.

I read every sentence for deletion in order and across its neighbours.
Necessary repeated status/bound statements remain because each lookup entry
must be usable on its own. I removed the old fixed-order forecast and replaced
the blanket measurement sentence with the actual evidence categories. I kept
the complete VTEST listing and explanation together and supplied its existing
preparation dependency and historical record provider before treating the
capture as evidence.

I checked agency throughout. Routines test, copy, select and return. People
supply buffers and choose calls. No artifact has intentions or judgement.
I inspected every authorial comma and punctuation join. Field lists retain
necessary separators, optional conjunction/serial commas are omitted and
there is no authorial semicolon or em dash. The historical assembly comments
and capture-command semicolon remain immutable.

The final read-back follows fixed entry, calling/status, cost qualification,
hardware, volumes, driver hook, registry, PICO entries/example and FONT.
It supports lookup without requiring a new host build, new default or a
newly qualified program. The final font entry ends on the concrete ABI 5.0
installation consequence rather than a summary or promotional landing.

## Text-only checks

The final prose gate reports zero findings across both owned files. The
appendix has 251 sentences with an average length of 12.2 words. Complexity
diagnostics are 0.62 joints per sentence, 28% flagged and approximate grade
6.5. I read the flags in context. Short status/bound clauses, register names,
source coordinates, necessary failed-operation distinctions and table units
are appropriate for this reference. They are retained for lookup rather than
expanded to alter the metric.

The coordinate check confirms 88 ranges in bounds across 21 product files.
This checks location bounds after the semantic source read, not factual truth
by text matching. Both complete fences and all five assigned literal units
match the original. The final punctuation read found no authorial semicolon
or em dash. Historical code/comments and the capture command are unchanged.
The owned-file whitespace check is clear.

## Remaining acceptance

This is a source-only reference draft ready for independent factual/editorial
review. Integrated links/anchors, final profile adoption and whole-book
read-back remain open. The original captures retain their actual historical
scope. Compact-style assembly proof, the KS48 chosen-font/default workflow
and publication remain held. I have not changed a shared ledger or any file
outside the two owned paths in the repository.
