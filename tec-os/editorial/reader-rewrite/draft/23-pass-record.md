# Chapter 23 pass record

## Brief and authority

The chapter's job is to follow a numbered call into the ROM and account for
its argument registers, shared-device effects, code bytes and caller stack.
The reader has used the hardware interface and can read Z80 calls, returns,
flags and saved register pairs. This is implementation teaching after the
programming interface, not a second API catalogue.

The replacement outline closed at `0e4feea` and its recording at `3060e71`
govern the route. The controlling movement map assigns 26 complete units
from old `23-hardware-services-inside.md` at book base `10821b68`.
There are no assigned units from another chapter. All 26 units and the
complete old chapter were read, including its byte table and shared rules.
The complete replacement outline and Chapter 23 reverse-outline notes were
also read. There are no executable listings, capture recipes or output
fences in this assignment.

The complete human-writing skill, revision playbook and pattern catalogue
were read alongside the course-writing teaching standard and its banned
patterns, reader model and review checklist. The book's STYLE and closed
outline govern the established assembly prerequisites and substantive
ending. The course's beginner assumptions and summary template do not
override them.

The initial source inspection used
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`, read with
`git show`. Historical size/address examples retain `78127ec`. Static
instruction/operand comparison of services.asm and abi.asm, ignoring only
comments, case and whitespace, finds identical text at the two pins. This
does not constitute a new build or measured artifact qualification.

## Planned teaching order

The route begins with argument-preserving dispatch and its exits. The
routine/byte table establishes which implementations belong here. Stored
state and the status LCD follow, then shared digit/speaker output, matrix
input, clock transfers, display claim/release/text and the font. The last
section derives caller-stack requirements from dispatcher and nested driver
use. The historical table and addresses remain visibly historical. Stack
bounds remain declarations supported by source paths, not measured maxima.

## Material accounting

All ranges below belong to old23 at the controlling book base. No unit
from another chapter is imported.

| Old range | Disposition |
| --- | --- |
| 1–6, 8 | Replace title/navigation with the closed outline's numbered-service subject. |
| 10, 12–14 | Replace the partial old citation scope with the full source-only ea3ef3d scope. Preserve 78127ec for byte/address examples. |
| 16–20 | Replace the routine-tour announcement with the argument/register/stack problem. Retain the 16 addresses and 480-byte account below. |
| 22 | Replace the dispatch heading. |
| 24–29 | Retain C008h, eight-byte table, signature, ABI 5.1 and all argument registers under dispatch. |
| 31–35 | Retain count, comparison, flag-preserving LD, status/carry and unchanged argument pairs. |
| 37–44 | Retain both pushes, doubled index, 32-byte table, address loads, EX (SP),HL, RET and removal of dispatcher words. |
| 46–50 | Retain both exits and all preservation exceptions. Make B/DE/HL preservation explicit and keep FIND/LIST's result convention separate. |
| 52 | Split the routine catalogue into connected device groups. |
| 54–62 | Retain every routine's number, file and responsibility with final-path cross-references. Retain the code-account scope. |
| 64–76 | Retain every byte-table row and number, explicitly at 78127ec. |
| 78–85 | Retain INFO's stored presence/claim/version/dimensions, cold probe, bit numbers and historical BFEAh/BFEBh. |
| 87–94 | Retain shared serial bit, select mask, segment/select writes, 256-turn dwell, approximate time and off/advance/shift sequence. |
| 96–101 | Retain row validation before mutation, CDWRD, LCDROWS and twenty LCDWAIT/write operations. Explain the actual WRDCLR caller. |
| 103–109 | Combine TONE with DIGIT's shared port. Retain toggle, saved output/count registers, timing formula, B=0 convention and final idle value. Qualify the formula as the interval between loop toggles. |
| 111–118 | Retain FEFEh scan, upper address lines, RLC carry termination, eight rows, F7FEh fourth value, row 3 sharing and complemented polarity. |
| 120–128 | Retain RTC mode check, seconds/BCD presence threshold, enable, bit order, both burst commands, seven bytes and write-protect sequence. |
| 130–138 | Retain VIDEO's validation/presence/cursor/claim and VTOWN's dependence on the selected console. |
| 140–151 | Retain both release no-op cases, PIVEC/PIBLK cold setup, fourth word/offset, VHLJP, conditional clear/home and warm release before PZINIT. Qualify NMI disabling by the actual restore-table path. |
| 153–162 | Retain PUTAT's ownership/mode tests, zero count, cursor erase before row test, successful off-screen clipping, per-cell saves and VPUT vector. |
| 164–168 | Retain FONT's number/routine/result, 96×8 layout from 20h and GLCD INIT's failure on pre-5.1 ROMs. |
| 170 | Replace shared-rules heading with the caller-stack subject. |
| 172–178 | Retain no-BDOS scope, INIT/existing-BDOS eligibility, mount exceptions and resident mutations at their relevant routines. |
| 180–189 | Retain caller contexts, bound below return word, dispatcher inclusion, all five four-byte bounds, PUTAT's six saves/nested drawing and 22-versus-four caller requirement. |

This accounts for all 26 controlling units. Only roadmap wording and
repeated certification are deleted. The exact byte-account values, address
examples, instruction examples, timing formula, limits and failures remain.
The old chapter contained no executable or output fences to move.

## Source proofs

All unprefixed paths below are at ea3ef3d. Routines were read through their
branches and supporting calls. These are text inspections, not test results.

| Claim | Exact support and reasoning |
| --- | --- |
| ABI entry and argument convention | src/abi.asm:12–20 and src/abi.inc:17–58 place the fixed table/jump and reserve A/F for dispatch. |
| Rejection and dispatch | src/services.asm:45–68 compares before pushes, indexes SVTAB with twice C and swaps saved HL with the selected address before RET. src/tables.asm:104–132 supplies all sixteen addresses. |
| Exits and exceptions | src/services.asm:70–86 changes A/F only. src/abi.inc:35–58 and149–161 separates ordinary result/preservation rules from FIND/LIST's generation return. src/loader.asm:773–814 supplies their actual entry paths. |
| Historical sizes | Exact old23 table at 78127ec, checked against the unchanged services.asm instruction/operand sequence at that pin and ea3ef3d. Its rows total480, including six bytes for the access routine but excluding768 font data bytes and SVDRV. No new artifact size is asserted. |
| INFO | src/services.asm:95–105 ORs CONDEV/VCLAIM, loads ROMVER and reads the dimensions together. src/boot.asm:88–94 sets CDRTC once. src/layout.asm:97–100 and src/ram.asm:138–139,438–439 locate the bits/state. |
| Historical dimension addresses | 78127ec:src/ram.asm:281–282 reserves adjacent VWID/VHGT. The original qualified workspace table places them at BFEAh/BFEBh. The draft retains the historical addresses and corrects the old chapter's reflowed citation to the actual historical coordinates. |
| LCD and recovery-word lifetime | src/services.asm:157–192 checks row before writes, clears CDWRD only for row3, selects LCDROWS then sends20 bytes. src/tables.asm:51–52 gives addresses. src/lcd.asm:29–58 bounds the busy wait. src/loader.asm:960–980 returns before clearing the row when CDWRD is clear. |
| Shared port and digit scan | src/services.asm:17–33,107–146 gives port01h/bit6 and six segment/select/delay/off steps. B=0 makes256 DJNZ turns. About0.8ms is the retained rounded instruction-time description at4MHz, not a new observation. |
| Tone timing and state | src/services.asm:283–318 supplies DE=0 exit, TXIDLE, XOR80h, B-to-C delay, DE test and idle termination. Between ordinary loop toggles: LD C,B4 + delay(16×B−5) + DEC DE6 + four register/test instructions16 + JR taken12 + XOR7 + OUT11 =16×B+51. B=0 denotes256 delay turns. Final termination is not claimed to have the repeating interval. |
| Matrix/joystick | src/services.asm:326–356 selects FEFEh, rotates the low row-select bit through eight reads and uses F7FEh for joystick row3. Both CPL operations produce active-high results. |
| Clock | src/services.asm:443–495 validates B, probes then transfers seven bytes with BFh/BEh and restores write protect through80h. RTCHAS:497–519 compares seconds against60h. RTCPUT:526–534 and RTCCMD/RTCWR:540–570 send commands/data LSB first. |
| Claim and terminal gating | src/services.asm:194–237 validates before mutation and hides cursor before setting the claim. src/term.asm:910–929 gates by both VCLAIM and CMCRT. |
| Release and NMI ordering | src/services.asm:245–279 has no-claim/no-table returns, fourth-word restore and console-only clear/home. src/video.asm:22–29,64–68 and src/pico.asm:64–86 establish pointer/call ownership. src/pico.asm:258–331,677–679 restores the mode/font/page with the VDP interrupt-enable bit clear. src/boot.asm:185–195 calls release before rebuilding page zero. With no PIVEC, this restore does not run. |
| Positioned text and nesting | src/services.asm:360–428 gates before zero count, hides cursor before checking row and clips each column before reading source. BC/DE/HL remain saved during VPUT. src/video.asm:31–41 jumps through its vector. Supporting CURHIDE:src/term.asm:949–979 and GLCPUT:drivers/glcd.asm:307–378, GLCCMP/GLGLY:535–635 retain nested driver use within the bound's scope. |
| Font and old-ROM failure | src/services.asm:597–603 and src/abi.inc:163–168 give address/layout. src/pico.asm:303–329 reads FONT directly. drivers/glcd.asm:66–80 exits on FONT failure and604–635 reads through FONTP. |
| Stack contract and no BDOS re-entry | src/abi.inc:35–58,66–113,163–168 defines interrupt preservation and conservative bounds. All hardware/FONT call paths were read. The volume reset exception actually calls BDOS37 at src/volsvc.asm:339–358. No measured peak is substituted for a bound. |

## Completed craft passes

The generous draft was committed and pushed as `56c568c` before sentence
editing. Its later passes have these dispositions:

| Pass | Actual disposition |
| --- | --- |
| Thematic/prerequisite | Read every paragraph against the dispatch→device constraints→caller-stack route. Kept VIDEO claim/release and PUTAT together. Shared TXIDLE precedes both output loops. INFO's cold probe precedes RTC's per-call probe. The last stack paragraph derives its requirement from the already-read nested draw. |
| Deletion | Read every sentence in order and across paragraph boundaries. Deleted the font paragraph's final repetition of INIT failure and the dimension paragraph's redundant labels-versus-addresses comment. Retained the distinction between the two ROM tables and between code/font data because identical words otherwise conceal different byte counts. |
| Plainness/agency | Replaced vague “result registers” with B/DE/HL. Kept selects, tests, writes and returns as actual operations. No intention, perception or social agency is assigned to code, hardware or publication structure. |
| Every comma | Read each comma with the punctuation temporarily absent. Removed optional commas before so in table sizing and the LCD timeout consequence. Kept list separators, apposition and conditional extent. Replaced both prose semicolons with full stops. No serial comma or em dash remains. |
| Technical/literal | Corrected historical VWID/VHGT coordinates to281–282, added WRDCLR's actual conditional clear and qualified NMI disabling by the restore-table path. Kept the RTC threshold as a presence test, not complete BCD validation. PUTAT's ownership/mode tests still precede count-zero success. |
| Journey | Read the entire revised draft in reader order, including every table row. Dispatch removes its saves before routine entry, which supports the final bound explanation. The source-backed FONT failure ends its section without certification. The chapter ends on the concrete22-byte/four-byte caller requirement. |
| Manual pattern gate | Checked the complete draft for mind/social verbs, inflated copulas, hollow pivots/landings, staged questions, attention commands, negative parallelism, serial commas and prohibited punctuation. No unresolved hard finding remains. The negative cases define real errors, preservation rules or measured-versus-bounded scope. |

No prose-gate or complexity script was executed under the no-execution
instruction. Sentence shape was reviewed manually. Short results such as
the eight-row buffer, zero-half-cycle return and claim lifetime carry
distinct facts. No mechanical readability score is claimed.

Static checks find all74 exact source ranges within their named Git files.
All eleven byte-account rows match old23 exactly. The chapter has no
semicolon, em dash or executable/output fence. The final diff check is
clean. These checks read text only and do not run the product or its tests.

## Handoff and limits

Only this record and `23-numbered-service-dispatch.md` were written.
No build, test, capture, fixture import or product runtime was performed.
Final-path cross-references use revision-ledger destinations for11,16,17,24
and25. Independent result review and final reader-order integration remain.
No new output, qualified artifact measurement or physical-board evidence
is supplied. KD243/KS48's planned40-column/TECCompact opening remains
pending elsewhere. This draft keeps ea3ef3d's source/font facts and does
not claim that the planned font/default has landed. Startup/GLCD policy
is unchanged.

## Independent reviews and clarity correction

The full factual/craft review cleared all26 assigned units, dispatcher and
register paths, clock transfers, claim/NMI restoration, PUTAT order/bounds,
FONT and the eleven historical byte rows totalling480. A separate complete
preservation/editorial review found one clarity issue: the exit helpers'
lack of B/DE/HL writes could read as whole-call preservation. The paragraph
now states helper-entry scope and explicitly says those helpers do not undo
the selected routine's changes. The whole call follows the service contract.
Read ABI35–58 and services70–86 again. No execution was performed.
Correction confirmation and final qualification remain pending.

## Correction confirmation

Independent confirmation at8aaec1b closed the helper-entry preservation
clarification. The two full reviews found no other factual, preservation
or craft finding. Historical480-byte accounting remains separate from
current source inspection and future KS48 qualification. Final navigation
and source/media acceptance remain pending.

## Matrix-switch condition correction

Source cross-check at ea3ef3d console82–88 and pico64–86 distinguishes
PICO response from keyboard enablement. Cold boot reads the Matrix switch
bit into CONDEV. It does not probe a keyboard response. The prose now uses
responding PICO plus Matrix switch enabled, replacing presence/answer wording.
This is a source-backed condition correction, not physical detection evidence.
No execution or literal-output change occurred.

## Receiver source adoption selected at 9ba1f59

Current mechanism authority is TEC-OS
`962853f499f05faf281f6cdff1deca8959f58c2b`. The tested source remains
`8b8664a7d93c6dc2e8bce509b9770585e106eedc`. P3 proposal 18 and the closed
result review at Origo `43d5f328` bind that offer. The receiver selected it at
book `9ba1f59` after scoped workflow receipt `4b5b5a50` and the opening chapter
reviews closed at `d9d57d2` and `b911e84`.

This section supersedes the earlier source-adoption and opening-workflow
holds. Earlier sections retain the actual initial ea3ef3d inspection and its
coordinates as an editorial record. Their historical costs, addresses and
program results are not reassigned to the current source. Compact-example
assembly proof and uncovered hardware workflows remain separate.

The complete current reader and pass record were read before editing. Both
source-adoption impact records were read, including all 35 claim contexts,
29 proof spans and nine historical exceptions. The report SHA-256 is
`df276b238d6014d98580b26f690bf1bbb1798d197ef3a495653a1cfc3c0a0bc0`, matching
its confirmation. The actual ea3ef3d-to-962853f source diff was read for the
owned mechanisms, parser and publication paths. The tested-to-landed diff
changes only the two qualification records.

Complete owning routines and relevant callers were reread at the selected
source. All current citation claims were checked in their containing passages,
including unchanged spans. Same-blob comparisons establish unchanged source
identity after that semantic read. They do not establish a runtime result.

The selected font is TEC Compact. `tools/lib/font.mjs:9-35` parses 96 glyphs
from 20h through 7Fh, eight top-first rows per glyph, with five pixels in bits
7–3. `tools/lib/font-package.mjs:8-21` checks selected/original identities and
the complete notices. The retained source/export manifest and
`format/FONT-NOTICES.txt:33-47` were read. Legacy bitmap upstream authorship
remains unresolved. No new attribution or licence conclusion is supplied.

The qualified offer binds ROM SHA-256
`fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d` and D8
SHA-256 `9a87dec39a63efc8fdf38ae13d6ec6299763c833fc891de121e2b30f4a1a36ac`.
Their authority is the retained P3 native artifact inventory and result review,
not this text inspection. Native 16,020 used and 364 free already appear at
ea3ef3d. They do not indicate font growth from the historical 16,018/366
account. No new address or byte measurement is introduced.

Raw PICO cold setup is now 40 columns, conditional on a responding PICO and
the enabled Matrix switch (`src/pico.asm:36-92`, `src/video.asm:22-29`,
`src/console.asm:82-88`). Explicit 32/40/80, bare selection preserving width
and claim, host/UI fallback 80 and serial pagination 80 remain distinct.
The current record is PICO v3 with entry offsets 16/18/20/22/24 and state
positions 36/41/42. The first four graphics entries require a claim and the
width entry rejects an active claim. None of these contracts is changed by
the font selection.

### Complete Chapter 23 citation coverage

All 73 pre-adoption unprefixed reader citations were rechecked semantically.
The explicit `78127ec:src/ram.asm:281-282` remains historical. Two new font
references bring the current reader to 75 citation occurrences, each with one
range. No current citation is left outside this coverage. The earlier record's
36 citation groups and 42 ranges were also revisited, including its supporting
loader, volume and nested display paths. Its original source-proof coordinates
remain explicitly scoped to the initial ea3ef3d read.

| Earlier reader citation | Current citation and support |
| --- | --- |
| `src/pico.asm:64-86` | `src/pico.asm:69-92`: PISTART's Matrix gate, table copy and pointer/record publication. |
| `src/pico.asm:247-331` | `src/pico.asm:252-336`: mode/register, page and font restoration. |
| `src/pico.asm:258-278` | `src/pico.asm:263-283`: register writes through VPAIR. |
| `src/pico.asm:677-679` | `src/pico.asm:682-684`: register templates keep the interrupt-enable bit clear. |
| `src/pico.asm:303-329` | `src/pico.asm:308-334`: eight-row FONT indexing and normal/reverse writes. |

The original record's pico 258–331 proof therefore corresponds to current
263–336. All other originally cited product files have identical Git blobs
at the two mechanism pins. Their full relevant routines were reread: dispatcher
and helpers, each hardware routine, RTC command/bit paths, row ownership,
VTOWN, VPUT, boot release ordering, registry results and volume exceptions.
All current claims remain supported without a register, flag, timing or stack
contract change.

The historical 78127ec eleven-row code table is byte-identical. Its 480-byte
sum, six-byte font-access routine and historical BFEAh/BFEBh remain at that
pin. The current font's 768 data bytes are still separate from that table.
Neither source equality nor the offered map remeasures those quantities.
No executable, output or recipe fence exists in this reader.

### Bounded editorial readback

The new font paragraph was drafted before the gate and separate thematic,
deletion, agency, punctuation and journey passes. It explains the selected data
and row encoding between the FONT access contract and GLCD INIT failure. Its
source-package sentence identifies a source validation operation, not a run
performed here. Every changed paragraph and its neighbours were read fully.
The helper-entry preservation correction remains explicit and unchanged.

The mandatory prose gate and sentence-complexity report were run on both
owned files. Reader SHORT prompts retain exact status, count and control-flow
facts. LONG/CLAUSES prompts retain INFO's linked results, preservation
exceptions, the conditional NMI restore path and BDOS re-entry prohibition.
ECHO prompts use the same register, byte, return and call identities. The
zero-count NEG prompt preserves both no-read and no-cursor-change guarantees.
These prompts were read against their complete paragraphs and do not justify
unrelated rewriting or shortened contracts.

This is current source/citation adoption, ready for independent confirmation.
Historical byte accounting remains historical. No current execution, artifact
measurement or physical-board result is supplied. No import, syntax check,
assembly, build, test, model or capture occurred. Navigation, final integration
and publication remain separate.

### Final literal and reading checks

The before/after reader comparison uses book `8ed3f3713ec8c68d9b520e777357df4790ca4180` as its
input. All 0 fences, 1 tables and 0 protected historical/capture comments
compare byte-identically and in order. Only the separate current-mechanism
comment is excluded from that comment comparison. Fixed entry offsets,
historical table values, map coordinates, hashes, recipes and screen text
remain unchanged. The final changed paragraphs were read with their neighbours
for meaning, agency, every comma and the reader's next step.

Input reader SHA-256:
`3320d33dcf2e9f4193bbd60b752649f4290ef6a9a389125806d76952a4b55d7b`.
Output reader SHA-256:
`157602c7c7bd62648c8591ae23dc01f3eb1b613afd62917d79cf0720d9ef779a`.

The actual mandatory prose gate reports zero findings across all six owned
files. Complexity prompts in this record retain explicit source identities,
coverage counts, original movement inventories and evidence limitations.
Repeated glyph/row terms name the same encoding. Short source-pin, font and
origin-limit statements carry distinct audit facts. Longer coverage sentences
list the exact contracts checked. Earlier record flags remain historical
process facts, not grounds for unrelated reader edits. No unresolved current
citation or source-adoption finding remains in this owned slice. Independent
confirmation of this application remains separate.
