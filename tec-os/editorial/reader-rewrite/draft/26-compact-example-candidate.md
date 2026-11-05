# Held compact HELLO candidate

Status: source-only, unassembled and unrun. This file prepares a separate
candidate for Chapter 26's retained HELLO listing. It does not replace that
listing or qualify a new editor round. The historical source, recipes,
diagnostics, screens and program output remain untouched.

## Authority and original identity

I read the complete compact layout and inherited comment contracts in
Origo's `bindings/z80-cpm/assembly-style-compact.md` and `assembly-style.md`,
including the separated-label and prose-flow amendment at
`5ef991ffca9d9774888d8d667cc3155ccb8fcf45`. Instructions and registers use
lowercase, two leading spaces and one space before operands. Existing symbols
and literal contents retain their case. Inline semicolons start at column 18
with two or more spaces after code. Labels have their own lines with a blank
above. Standalone comment blocks have a separating blank on either side.
The target is 40 columns, with at least 40 percent commented code lines,
no more than four consecutive uncommented code lines and a 24,576-byte file
limit. A formatting candidate still needs assembled-byte, symbol and actual
display proof before migration.

The book snapshot inspected is
`b8c5c284160dba6d377392ff9a1b07f3d7e60581`. The actual retained chapter is
`tec-os/editorial/reader-rewrite/draft/26-build-the-rom-and-media.md`, last
changed by `fde0f894d649a04374c9769d5b533767a7c2c78a`, Git blob
`0704aefd73dea2e99ae64afffc12405c95e70a43`.

The original assembly body is at lines 357–365, inside fence 356–366.
Its LF text, including final LF and excluding Markdown delimiters, has SHA-256
`ebab7a75f15a68fee22283fd7f9682a4ee80f49dab46c3b64435bc18d98079a6`.
The complete containing passage is lines 350–473: source, mechanism,
historical editor failure/repair, PC assembly, card preparation and return.
I read that whole passage and its provenance header before drafting.

The same original listing is at `tec-os/07-first-program.md:58-66`, fence
57–67, in frozen book base `10821b68f80c10d2037bbd1c5ab207877c897c68`.
That source and its complete editor/PC passages were read too. The explicit
7458352 editor-round provenance and historical 33-byte ATOM result belong
to the original example. The original diagnostic `HELLO.ASM:7:1`, source
screen, omitted fourteen blank rows and repair/return screens are not
transferred to this candidate. The separate retained PC capture keeps its
own recorded provenance. No historical checked-at statement supplies a
current execution result.

Current mechanism inspection uses TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. It does not adopt a new KS48
font/default or qualify the planned 40-column workflow.

## Complete candidate

Suggested future filename: `HELLO.ASM`, isolated from the original input.
The fence body is the complete candidate, ASCII with LF line endings and a
final LF. The original header and three instruction comments retain their
wording after reflow. Added header lines state the entry, local data,
clobber and normal-exit conditions.

```asm
; HELLO: print a line and return to
; the CCP.
; Takes the normal CCP entry state.
; Uses its own dollar-ended MESSAGE.
; BDOS calls may change all registers.
; No register or flag result is defined.
; Normal ret uses the inherited word.

BDOS equ $0005

  org $0100
  ld de,MESSAGE  ; the string,
                 ; ended by $
  ld c,9         ; BDOS function 9:
                 ; print a string
  call BDOS
  ret            ; back to TEC-OS

MESSAGE:
  db "Hello from the TEC-1G",13,10,"$"
```

The candidate LF body is 493 ASCII bytes over 20 lines, SHA-256
`73b3bf45bbbecd9c9d212eabdd1126b1c589ca800055ecb5f626de649a481025`.
That identity includes the final LF and excludes the Markdown delimiters.
It identifies source text, not emitted or on-card bytes.

No instruction, operand, expression, symbol or literal content changes.
There is no added START label. The unlabelled entry at ORG 0100h remains
unlabelled to preserve the original symbol set. BDOS remains a local equate.
MESSAGE moves onto its own line immediately before the same data declaration.
The constant, origin, DE load, function number, CALL, RET and message order
are unchanged. The case and bytes represented by the greeting, CR, LF and
final dollar remain exact.

The general BDOS clobber qualification deliberately makes no AF/BC/DE/HL-only
promise and no claim that IX or other registers survive a call. HELLO defines
no register or flag result for a caller. Its normal program exit is distinct
from an output-time abort. The original “back to TEC-OS” comment describes the
normal RET, not a guarantee that every control-key path returns locally.

## Include closure and static reasoning

Both original and candidate contain no include, macro, generated header,
external equate or linked routine. Each assembly consumes one source file.
BDOS and MESSAGE are the complete two-symbol source closure. Runtime entry
requires the selected TEC-OS ROM and its page-zero BDOS jump, CCP launch at
0100h and inherited return word. Those runtime dependencies are not omitted
assembly inputs.

| Contract | Source inspected at ea3ef3d |
| --- | --- |
| Entry and local return | src/cpm/ccp.asm:519–536 calls PREPPAGE, puts WBOOT on the resident stack and jumps to TPA. The unchanged CALL/RET pair adds and removes its call return word before the program's RET consumes the inherited word. No private SP, push/pop or extra exit is added. |
| String processing | src/cpm/bdos.asm:419–433 reads from PARAM, stops before the dollar and passes each preceding character to OUTCHAR. The candidate reloads DE=MESSAGE and C=9 exactly as the original does. |
| Clobber boundary | bdos.asm:121–141 states general register changes and switches stacks. Its228–252 replicates the result and restores caller SP, without a general register-preservation contract. The header does not strengthen that contract. |
| Console path | src/cpm/bdoscon.asm:178–204,229–243 routes output through normal console processing and the RAM BIOS table. Its318–351 handles pause/list/pending input, with ^S followed by ^C taking CHDROP. The candidate adds no handling or unconditional visible-output promise. |
| Formatting-only intent | Operand order and tokens are unchanged, symbols keep their names and the literal data is exact. Whitespace, comment wrapping, token case and the separate MESSAGE line are the intended changes. Actual assembler acceptance, emitted equality and symbol values remain unproved. |

The current source trace supports the intended mechanism. It is not a new
run, a current 33-byte measurement or proof that an old transcript was
reproduced. No optimisation, tail call, added error path or extra preservation
promise is proposed.

## Actual future public routes

The historical PC route is `npx atom hello.asm hello.com`, retained at
frozen Chapter 26:438–440. A future packet must select the pinned local
ATOM CLI without an implicit download. Assemble the exact original and exact
candidate separately, at the same origin and under the same filename in
isolated directories. Retain the complete logical outputs and symbol maps.
Do not import an assembly wrapper or silently substitute another source.

The normal on-card route uses a fresh identified card copy with tools on A
and work on B. Open HELLO.ASM through TED, enter the complete candidate,
save, quit and reopen the persisted source. Build through actual TAS, then
exercise TED's ordinary build/error/repair/run/return keys. Use the TAS-created
COM for the on-card execution comparison. A directly injected ATOM COM or
an internal jump to the output routine cannot establish that workflow.

At ea3ef3d, `test/inputs.json` records these application identities:

| Input | Thorium revision | SHA-256 |
| --- | --- | --- |
| TAS.COM | dbee66a90816df9a5884a08754ebc2d458a38325 | 45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2 |
| TED.COM | 128edb7cbb27de17a9d3a7a747706a5b227b30c4 | 2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f |

These are source-manifest identities, not newly checked executable files.
The future packet must bind the actual adopted ROM/map/card, local ATOM,
TED/TAS, runtime dependencies, input route and display configuration. If any
identity changes, recheck the relevant contracts before sealing that packet.

The inspected TED 128edb7 source, `ted/src/editor-project.asm:166-180,221-268`,
saves before preparing its build chain and can stop on save failure or
cancellation. Its449–481 prefixes tool names using the stored load drive.
Those branches justify checking actual source persistence and actual tool
selection, rather than treating a pressed key as proof of a completed build.
The future round must identify initial THOR.PRJ, THOR.SES and THOR.ERR state
and retain their resulting bytes. It must confirm which source the project
build keys actually selected.

## Required future proof

These are preparation requirements, not an executable offer or allocation.
No assembler, import, editor, model, test, capture or runtime ran here.

1. Freeze exact original and candidate text bodies with hashes, line endings
   and final newline. Identify CP/M text conversion, terminal 1Ah and record
   padding separately. Read back the actual on-card candidate and confirm the
   source fits the editor limit.
2. Assemble both sources using explicit pinned ATOM. Compare every emitted
   byte, origin/end and both existing symbol identities/values. Retain actual
   sizes instead of copying the historical 33-byte statement. Build the saved
   candidate with on-card TAS and compare its logical COM bytes and available
   symbols with the ATOM reference. Inspect and account for record padding.
3. Observe normal CCP launch of that TAS-created HELLO, exact console bytes
   and its real inherited-return path to a ready prompt. Separate program
   bytes from the CCP's newline/prompt. Include complete input and capture
   boundaries rather than prepending a prompt from another observation.
4. Derive the deliberate-error location from the frozen compact source's
   actual CALL line. Do not use the original `TED HELLO.ASM 7` coordinate.
   Specify and independently review the exact cursor/input sequence before
   execution. A proposed control is the original kind of fault, a leading
   `1` on the CALL line, but its actual diagnostic and coordinates must come
   from the new TAS run, not the old 7458352 screen.
5. Through TED's real `^T B` path, observe saved erroneous source, the selected
   TAS invocation, actual diagnostic and TED reopening at the actual error.
   Capture the current status row and source presentation. Do not copy the
   historical message, fourteen-row omission, line/column or error screen.
6. Repair through actual editor movement and deletion, then use `^T R`.
   Observe corrected persisted source, a successful build, the actual HELLO
   run, return to TED, its key wait and redraw, then quit/reopen. Record the
   final source, HELLO.COM/HELLO.DBG and project/session/error-file state so
   stale output or the wrong project cannot masquerade as a completed round.
7. Check the complete compact source on the adopted 40-column editor/display
   route. Static width arithmetic does not establish font pixels, wrapping,
   cursor placement, reverse status text, typing or persistence. A serial
   workflow alone cannot qualify those presentation claims, KS48 or a board.
8. Seal finite cases, exact inputs, dependency closure and enforceable whole-job
   limits in a separately reviewed packet before requesting allocation. Preserve
   failed/stopped evidence. Actual byte/workflow result review and reader
   insertion remain separate decisions. Neither this file nor historical
   byte equality grants execution or replacement approval.

## Static preparation disposition

The instruction sequence and every original comment were compared manually
with the frozen listing. All four executable instructions and both symbol
names remain. Comments now fit the narrow layout without losing the original
meaning. The added header states general BDOS clobbers and normal exit only.
The candidate has three commented executable instructions out of four.
Counting EQU/ORG/DB too gives three out of seven, above the 40-percent floor.
The longest uncommented statement run is two, at EQU/ORG. Text inspection
found no tabs, no line wider than 40 columns and every inline/continuation
semicolon at column 18. MESSAGE has its own line and a blank above it.

I read the whole containing historical passage, then the complete candidate,
static path account and future proof requirements. Deletion, agency and
every-comma passes preserve the source-only boundary and the actual editor
route without converting source expectations into results. Static text checks
remain separate from assembler/style qualification. Only this new candidate
file is committed with --only and pushed. No original or shared record is
changed and no reader insertion is authorised.
