# Chapter 11 pass record

## Scope and authority

I own only `draft/11-use-the-boards-devices.md` and this record. The final
path is `tec-os/11-use-the-boards-devices.md`. I have not changed navigation,
the movement map, shared ledgers or another writer's files.

I read the complete original hardware-services chapter, all 96 assigned
movement units, the closed outline and its opening-profile amendment. There
are no additional destination-11 fragments from another chapter. The reader
has the call, register, file and memory contracts from Chapters 8–10. This
chapter's job is to use the board's hardware calls without disrupting the
serial line or console. I applied the amended STYLE guide, human-writing
and teaching-prose-review standards.

Mechanism authority is TEC-OS `ea3ef3de9133931e925a0220d51c0e971c1fd8dd`,
inspected through git text. I read owning routines, dispatcher, callers,
console/driver paths, capture configuration and media recipes. No product
execution, import, test, assembly, build, capture, card modification or UI
workflow occurred. Text comparisons and prose diagnostics do not qualify a
program or a new result.

## Reader route and preservation

The closed outline's route is implemented in this order:

1. Shared ports explain why a hardware service is useful before any listing.
   Ports and memory addresses are distinguished. Numbered ROM routines are
   distinguished from resident service files before either term becomes an
   installation prerequisite.
2. ABI means entry addresses, registers and results. Signature, major/minor
   compatibility and the single C008h jump precede the signature-check code.
   C selects a service, B/DE/HL carry arguments and A is not an input.
3. Hardware status, result registers, preservation scope and caller stack
   precede HWLIB. The BDOS nesting rule is scoped to hardware calls rather
   than incorrectly extended to MOUNT/UNMNT. Chapter 10 supplies the inherited
   return word and stack allowance used by the helper explanation.
4. HWLIB's inclusion after entry code, tail jumps, label/value preservation,
   nibbles and BCD precede its complete historical listing. ABI.INC's
   constants-only role differs from executable HWLIB code/data.
5. INFO and BOARD establish optional devices and dimensions. LCDMSG, DIGCLK,
   NOW and ROWS each follow the particular call contracts they use.
6. VIDEO claim/release and console restoration precede the PICO record and
   font-address contracts. PUTAT's availability, zero-count and clipping
   rules precede PLACE. DEMO combines these mechanisms with its own port code.

All seven ASM listings, both shell recipes and nine text-output fences remain
literally identical and in their original relative order. All 29 assigned
source/output/provenance units match the original, including the actual pin
comment, capture commands, alternate `@key 5` command and same-run LCD/screen
comments. The generous draft initially omitted BOARD's host card-preparation
fence. I restored it before the preservation check and retained its commands
unchanged. No illustrative program, output or recipe was added.

The source comment retains `78127ec`, starter TAS from Thorium `dbee66a`,
SHA-256 `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`
and DEMO's host ATOM `atom-z80` 0.3.7. A separate comment identifies the
source-only mechanism check. The historical syntax stays unchanged pending
compact-style assembly proof. That proof is not supplied by textual equality.

I checked existing runtime provenance beyond the checked header.
`editorial/reviews/book-45.md:1-3,77-77` records guarded runs at `78127ec`,
cards made from chapter recipes and source comparison with the book fences.
Its hardware row records nine transcripts, seven matching directly and two
matching when the following same-run LCD/screen fence is included. I have not
rerun or newly authenticated the named historical output artifacts. DIGCLK
has no separate positive runtime transcript in the original chapter and is
retained as its existing complete listing, not presented as a new result.

The INFO values, 80-column PLACE layout, LCD/NOW/ROWS/DEMO captures and timing
figures remain historical host-model evidence. The `--board pico` run is named
as host-model configuration rather than browser evidence. Clock origin and
emulated-time behaviour are checked against capture source. Retained DIGIT
and PUTAT costs are not fresh measurements. TONE's formula and arithmetic
are instruction-derived with final-interval and overhead qualifications.
No physical-board result, chosen-font rendering or new default is inferred.
The KS48 40-column opening remains held. Startup/device policy is unchanged.

## Complete material account

The movement-map base is `10821b68f80c10d2037bbd1c5ab207877c897c68`.
All 96 units below come from `tec-os/10-hardware-services.md`. Front matter
and headings are reconstructed for destination 11. Every assigned fact,
example, recipe and provenance unit is retained or explicitly qualified.

`1-6`, `8-8`, `10-14`, `16-19`, `21-21`, `23-30`, `32-32`, `34-36`, `38-43`, `45-51`, `53-55`, `57-57`, `59-63`, `65-67`, `69-126`, `128-131`, `133-133`, `135-139`, `141-145`, `147-151`, `153-163`, `165-170`, `172-172`, `174-177`, `179-186`, `188-190`, `192-243`, `245-247`, `249-254`, `256-260`, `262-262`, `263-276`, `278-282`, `284-284`, `285-298`, `300-302`, `304-309`, `311-311`, `313-317`, `319-341`, `343-343`, `345-345`, `346-355`, `357-358`, `360-360`, `361-365`, `367-368`, `370-374`, `376-384`, `386-388`, `390-390`, `392-396`, `398-403`, `405-410`, `412-414`, `416-481`, `483-487`, `489-489`, `491-538`, `540-542`, `544-544`, `545-554`, `556-558`, `560-560`, `562-566`, `568-570`, `572-634`, `636-637`, `639-639`, `640-649`, `651-651`, `652-658`, `660-660`, `662-665`, `667-673`, `675-682`, `684-685`, `687-687`, `689-696`, `698-699`, `701-733`, `735-740`, `742-742`, `743-759`, `761-770`, `772-776`, `778-778`, `780-786`, `788-792`, `794-797`, `799-799`, `800-811`, `813-816`, `818-818`, `819-824`, `826-829`

The old opening/shared-port units are taught before the ABI check. The table,
calling and helper units are regrouped to establish contracts before code.
The remaining device examples retain their order. All bit values, service
numbers, sizes, example buffers, status branches, row/column values, timing
relationships and retained outputs remain accounted for. The LED explanation
ends on the concrete distinction between direct LED ports and shared console
ports rather than a chapter recap.

## Source support and bounded corrections

All coordinates below are at ea3ef3d. I traced the owning instructions and their relevant
callers.

| Claim | Owning source and support |
| --- | --- |
| ABI bytes and contracts | `src/abi.asm:1-20`; `src/abi.inc:1-65`: signature, versions, addresses, caller inputs, interrupt/register preservation, exceptions and out-of-range rule. `src/reset.asm:1-13` supplies the reset jump. |
| Selection, return and status | `src/services.asm:35-105`: the dispatcher preserves input HL/DE through lookup, returns into the selected routine with the caller's return word next and rejects numbers from TNCOUNT. HWERR sets carry/NZ and HWOK clears A/carry. INFO combines CONDEV/VCLAIM and returns ROMVER/VWID/VHGT. |
| Hardware numbers and stack | `src/abi.inc:66-118`: hardware number definitions and conservative stack bounds. PUTAT's 22 bytes are below the caller's return address. Own saves/nesting also consume the inherited allowance. These are bounds rather than a measured peak. |
| Digits and LCD | `src/services.asm:107-193`: left-first six-pattern scan, serial-idle selection and all-off exit. LCD rejects row >=4 before writing 20 bytes and clears the row-3 ownership mark. |
| VIDEO and restoration | `src/services.asm:194-279`; `src/boot.asm:178-215`: mode validation precedes presence check, claim flag and cursor handling, conditional PIVEC restore, clear/home only for selected PICO and warm-boot release. |
| TONE arithmetic and zero case | `src/services.asm:281-322`: the delay loop copies B and performs 256 iterations for B=0, DE counts half cycles, zero DE exits before a port write and a nonempty call ends with TXIDLE. Ordinary toggle spacing follows instruction counting. |
| Matrix and joystick | `src/services.asm:324-356`: complemented input, eight matrix rows, joystick F7FEh with row-3 address-line overlap. Always-success paths are distinct from INFO's enable bit. |
| PUTAT ordering | `src/services.asm:360-427`: ownership and video mode are checked before B=0. Nonzero count hides the cursor before the row check. Width clipping occurs before reading the next source byte and each byte goes directly to VPUT. |
| RTC | `src/services.asm:432-595`: mode check, clock probe, seven-byte burst and write-protection control. INFO's cold-boot bit is not a fresh RTC probe. The clock buffers and their static instruction flow are retained literally. |
| Font and PICO record | `src/services.asm:597-603`; `src/abi.inc:163-183,205-243`; `src/pico.asm:30-87`: FONT address result and 96 eight-row characters, named record/version and claimed graphics entries versus unclaimed width operation. No chosen-font/default acceptance follows from those APIs. |
| Display bytes and reverse images | `src/pico.asm:247-331`; `drivers/glcd.asm:604-641`; `src/term.asm:1-175`: glyph selection/reverse drawing and ordinary terminal byte filtering. The text decoder's capture cannot prove reverse pixels. |
| Historical model configuration | `tools/capture.mjs:1-145`: named board/device setup and fixed clock origin. Its stdout/screen/LCD paths are historical model provenance rather than browser or physical-board proof. |
| DEMO composition and distribution | `test/programs/demo.asm:1-481`; `tools/media.mjs:205-234,251-252`: actual service calls, signature check, direct graphics/LED code, claim/release and card/export recipes. The retained explicit PC ATOM commands keep their historical provenance rather than asserting the current media backend. |

I corrected the original claim that DEMO uses every preceding service. Its
actual numbered calls are INFO, TONE, LCD, VIDEO, DIGIT and RTC. It does not
call KEYS, JOY or PUTAT. Its LED scan is direct port code. I also scoped the
register-preservation and BDOS rules to avoid the volume-service exceptions.

The fixed-entry explanation now allows the separately fixed reset jump at
C000h. PUTAT availability comes before its zero-count success, with nonzero
cursor removal before off-row success. A zero-duration TONE does not promise
a port write. `GLCD: no` in DEMO means the driver-installed INFO bit is clear,
not that a physical device is absent. These are source clarifications rather
than new runtime observations.

## Craft passes and remaining acceptance

I completed the generous draft before the reductive passes. In the thematic
pass I checked every paragraph against the route above and moved register,
stack and helper contracts before the first listing. In the deletion pass I
read every sentence in order and across its neighbours. I removed a redundant
font/default disclaimer from reader prose while retaining the precise hold in
source metadata and this record. Operational distinctions and safety cases
remain because their removal changes a caller's permitted behaviour.

I read agency throughout: instructions branch, routines check bytes and
programs write ports. No machine, file or chapter is assigned intention or
judgement. I inspected every authorial comma and punctuation join, removed
serial and optional conjunction commas and replaced the remaining authorial
semicolon. Immutable comments, source punctuation and output were untouched.
The final reader-order read checks that shared ports, ABI, registers, stack,
helpers and device contracts are available before each complete example.
The final paragraph identifies the LED port boundary without an empty landing.

The final prose gate reports zero findings across both owned files. The chapter has 256 sentences with an average length of 12.3 words.
The text diagnostics are 0.62 joints per sentence, 15% flagged and an
approximate grade of 6.9. I read the flagged
sentences in context. Short interface contracts, repeated required register
and routine names, the no-active-claim rule and explicit port distinctions
are retained for their technical jobs. These diagnostics are not runtime
proof. All 18 fences compare literally and in order. All 29 assigned literal
units are present. The source-coordinate check confirms 23 ranges in bounds
across 11 product files. No whitespace correction was applied inside a
historical fence.

This draft is ready for independent editorial and factual review. Integrated
navigation/anchors, final profile adoption and whole-book reader-order review
remain open. Historical captures and listings keep their actual pins. Compact
assembly proof, new-font/default workflow acceptance and publication remain
held. I have not changed any other writer's files or shared status records.
