# Held compact ARGS source candidate

Status: source-only formatting candidate. This is not a qualified listing or
reader insertion. No assembly, product import, execution, test, emulation or
capture occurred. Historical recipes and output remain attached to their
original source. A later byte match alone would not establish a new workflow.

## Authority and exact source identity

Read the governing Origo bindings/z80-cpm/assembly-style.md and complete
assembly-style-compact.md, including the KD229/KD241 refinement recorded at
`5ef991ffca9d9774888d8d667cc3155ccb8fcf45`. Read the book's compact-example
amendment and the full ARGS containing passage, source, fixture recipe and
captures in Chapter20. The compact layout controls spacing and reflow while
the inherited comment contracts and24576-byte source ceiling remain.

The original for this candidate is frozen book
`b8c5c284160dba6d377392ff9a1b07f3d7e60581`, file
`tec-os/editorial/reader-rewrite/draft/20-from-prompt-to-program.md`, Git blob
`39ea0f0434249d2bf1b942ef09dbf22a187735b3`. Its last change there is
`f9e2e36512fbf1be540c16e79d9a1dd24cc51fd2`.
The complete original fence is513–562 and its body514–561. The containing
page-zero/entry explanation runs from492 through the chapter's end, with the capacity-card recipe
at444–453 and relevant captures at473–490 and570–585. Coordinates use the
frozen text, not a future HEAD. The same source is retained at original
book10821b6:tec-os/20-ccp.md:502–551, with its body503–550.

The original complete fence's SHA-256 is
`5d1352f2239fca0d302d393ebeba6fd2c81c444e12183a38ab91083f641cf0cb`.
This identity includes both Markdown fence lines, LF line endings and the
closing fence's final LF. The candidate hash below uses the same convention.
Only the source body belongs in a later extracted ASM file.

Chapter20's retained fixture names TEC-OS78127ec and ATOM0.3.7. Those are
historical provenance, not a new execution identity for this candidate.
The current page-zero/BDOS mechanism reasoning uses only Git source at
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. No product test/programs/args.asm
exists there, so no product-file identity is substituted for the book source.

## ARGS-COMPACT-01

Proposed extraction name: `args.compact.asm`. The complete source is the
following assembly fence. No entry label, instruction or operand is added.
The original header and instruction comments retain their wording after
reflow. Added headers and comments explain the counted walks, local saves
and the two fall-through/return paths.

```asm
; ARGS: prints the two FCBs and the
; command tail that the CCP leaves in
; page zero: each FCB's drive byte as a
; digit and its eleven name bytes,
; then the tail between brackets.
;
; Takes CCP-prepared page zero. Uses
; the inherited stack and return word.
; No register or flag result is
; promised. BDOS may change registers
; and flags. PUT saves BC and HL.

BDOS equ $0005

  org $0100
  ld hl,$005C    ; the first FCB
  call SHOWFCB   ; first name fields
  ld hl,$006C    ; the second
  call SHOWFCB
  ld a,'['
  call PUT       ; begin tail delimiter

; the tail's length, then its characters

  ld hl,$0080
  ld b,(hl)      ; count excludes length

TAIL:
  ld a,b         ; remaining tail bytes
  or a           ; Z when count is zero
  jr z,TEND      ; empty or finished
  inc hl
  ld a,(hl)
  call PUT       ; B and HL survive PUT
  dec b          ; one tail byte printed
  jr TAIL        ; test before next read

TEND:
  ld a,']'
  jp PUT         ; inherited return word

; Print drive/name fields and CR/LF.
; Takes HL at an FCB's drive byte.
; Drive display adds '0' to that byte.
; Falls into PUT for the final LF.
; PUT protects BC/HL around BDOS.
; Other registers and flags may change.

SHOWFCB:

; the drive: 0 for the current one

  ld a,(hl)
  add a,'0'      ; drive code as a glyph
  call PUT
  ld a,' '
  call PUT       ; field separator

; the name and type, as stored

  ld b,11

NAME:
  inc hl
  ld a,(hl)
  call PUT       ; next name/type byte
  djnz NAME      ; exactly eleven bytes
  ld a,13        ; end the FCB row
  call PUT
  ld a,10        ; fall through into PUT

; Print A by function 2,
; keeping B and HL.
; Takes A. Restores BC and HL after
; the BDOS call. Other registers and
; flags may change. Returns through
; its caller's return word.

PUT:
  push hl        ; caller's pointer
  push bc        ; loop count preserved
  ld e,a
  ld c,2         ; BDOS character output
  call BDOS
  pop bc         ; restore loop state
  pop hl         ; resume buffer walk
  ret
```

## Static semantics and dependency closure

The sequence and all symbols remain BDOS, TAIL, TEND, SHOWFCB, NAME and PUT.
All numeric operands and the literals `'['`, `']'`, `'0'` and `' '` retain
contents and case. Register/condition/opcode/directive changes are case only.
Separated labels, comments and whitespace are the only other source changes.
Actual assembler acceptance and symbol-map identity remain unproved.

The source is self-contained. It has no include, macro, generated source,
external symbol or linked helper. BDOS is defined locally as0005h. There is
no ABI.INC or HWLIB closure to supply. Runtime dependencies are the CCP's
page-zero publication, BDOS2, its BIOS console route and inherited warm-boot
return word. These are distinct from source includes.

| Path | Static source reasoning at ea3ef3d |
| --- | --- |
| First two arguments | src/cpm/ccpcmd.asm:456–471 parses the first two references at005C/006C, ignoring parse errors for these program arguments. Each cleared FCB has drive plus11 padded name/type bytes at511–599. ARGS reads those heads rather than their overlapping allocation-map fields. |
| Overlap and tail | Both FCBs are36 bytes but start16 bytes apart. The second ends at008F. PREPPAGE:472–497 publishes the tail last at0081, its length at0080 and a zero after it, then sets DMA. ARGS counts from0080 and does not use the zero as its loop test. |
| Capitalisation and pieces | src/cpm/ccp.asm:249–284 converts letters in the current piece to capitals and replaces its ! separator with zero before launch. Spaces within that piece survive into the tail. Later chained pieces are outside this tail. |
| Wildcards and parse limits | ccpcmd.asm:617–645 handles field length,712–727 expands a star through the field and734–758 supplies delimiters/space skipping. PREPPAGE ignores the parse carry. A program argument can therefore produce partial fields rather than a built-in command error. No validation is added to this candidate. |
| Name walk | SHOWFCB adds '0' to the drive byte, prints a space and sets B11. NAME advances HL through the11 bytes, printing padding too. DJNZ uses the B restored by PUT. SHOWFCB's final LD A,10 falls into PUT, whose RET returns to the caller of SHOWFCB. |
| Tail walk | TAIL checks B before advancing HL, so an empty tail reaches TEND without reading a character. Each emitted character is followed by DEC B. PUT restores BC/HL around its call. TEND loads the closing bracket and jumps to PUT, whose RET uses the inherited program return word. |
| BDOS clobbers | src/cpm/bdos.asm:137–141 switches to the private stack;228–252 replicates result registers and restores caller SP. FNCOUT:337–341 calls OUTCHAR then returns0. The BDOS contract permits other register/flag changes. PUT's PUSH HL/PUSH BC and matching POPs preserve its own BC/HL, not a narrower BDOS contract. No AF, DE, IX, IY or alternate-register preservation is promised here. |
| Launch/exit | src/cpm/ccp.asm:519–536 publishes page zero, sets SP, pushes WBOOT and jumps to0100h. ARGS introduces no SP change and balances its local saves on returning paths. Output-time ^S/^C can still abort through src/cpm/bdoscon.asm:318–350 and bdos.asm:115–119 instead of returning locally. |

The inherited header calls the drive display a digit. The code is specifically
`ADD A,'0'`, not a decimal conversion routine. Drive bytes10–16 therefore need
a separate boundary case before any broader display claim. No instruction is
changed to improve that original behaviour. ARGS prints two FCB rows followed
by a bracketed tail. It adds no CR/LF after the closing bracket. The normal
CCP return path supplies its own prompt separation.

## Public route for later qualification

The historical host recipe is `npx atom build/args.asm build/args.com` in the
product setup with atom-z800.3.7. The candidate's corresponding command form
is `npx atom build/args.compact.asm build/args.compact.com`, using the pinned
local ATOM dependency. These are recorded unrun routes. The original FITS/BIG
capacity fixture and its other commands are outside this candidate's scope.
Neither source nor output is inserted into that fixture during preparation.

A later public-route packet must extract the exact candidate and record its
LF/CP/M text identities separately. On an isolated supplied-card copy, select
working drive B, enter the source through `A:TED B:ARGS.ASM`, save, quit and
reopen the persisted source. Assemble through `A:TAS ARGS` and launch ARGS
through the ordinary CCP. Separately assemble both original and candidate
with the named ATOM version and compare logical bytes and symbols, then compare
the actual saved-source TAS output while accounting for CP/M record padding.
These steps require a reviewed allocation and are not performed here.

The productea3 test/inputs.json records TAS.COM from Thorium
`dbee66a90816df9a5884a08754ebc2d458a38325`, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`,
and TED.COM from`128edb7cbb27de17a9d3a7a747706a5b227b30c4`, SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`.
These are source-manifest identities. No application executable was imported
or rehashed. The future packet must bind the actual adopted ROM/card, font,
console width, input path, ATOM version and TED/TAS bytes. A40-column source
layout and the prior LINE result establish none of that workflow for ARGS.

## Finite future FCB and tail cases

These nine cases bound a later proposed review packet. They are input forms
and source-derived distinctions to check, not expected captures, runnable test
scripts or an execution allocation. All start on working drive B and use
normal CCP launch.

| Case | Input form | Distinction requiring actual evidence |
| --- | --- | --- |
| 1 | `ARGS` | Both drive/name heads are freshly blank/default and the zero tail count prints no character between brackets. |
| 2 | `args one.txt` | The first FCB receives an uppercase padded8.3 name, the second stays blank and the tail retains its leading space. |
| 3 | `args one.txt a:*.c` | Retained wildcard case, explicit drive1 in the second FCB, star expansion and exact literal spacing in the tail. |
| 4 | `ARGS X Y ! ARGS` | Space before ! remains in the first tail. The next no-argument invocation proves fresh publication rather than retained X/Y fields. |
| 5 | `ARGS A:ONE.TXT B:TWO.BIN EXTRA` | Explicit drive bytes1/2, only the first two FCB heads and a tail that still includes the third token. |
| 6 | `ARGS ABCDEFGH.XYZ ??.*` | Exact8/3 limits, literal question marks and star expansion in the type field without losing displayed padding. |
| 7 | `ARGS J:ONE.TXT` | Parsed drive10 exercises the unchanged ADD-'0' display boundary. Do not claim two-digit decimal output from this listing. |
| 8 | `ARGS ABCDEFGHI.TXT Y` | Overlong first field and ignored parse carry. Compare the actual partial FCB heads and complete tail with the parser path, not a newly invented friendly-error rule. |
| 9 | A complete127-character command: `ARGS ` followed by122 `X` characters | Normal CCP maximum. The tail count is123, since the four-character command name is excluded. Check the complete counted tail, the partially filled first FCB, blank second head, closing bracket and ordinary exit. |

The later packet must capture actual FCB/tail character counts and padded
fields, not only a final prompt. It must preserve the distinction between
program CR/LF and CCP prompt output. Static preservation does not establish
that the inherited stack, saved registers, font display or runtime return path
worked. Forty-column TED readback must include the lowercase source, labels,
comments and saved-file bytes. No broad card/user search, FITS/BIG capacity
run or unrelated runtime suite is needed to prove this formatting candidate.

## Static style disposition and hold

Read every original and candidate instruction, operand, symbol and comment
in order. Both fall-through edges and every branch are retained. No helper
or entry label is added. Code labels have separate lines and a blank above.
Standalone comment blocks are blank-separated. Instructions use two literal
spaces and one mnemonic/operand separator. Inline notes begin at column18
with at least two spaces after code and a space after the semicolon.
Continuation semicolons align with their first line.

Original comments were reflowed at phrases or moved intact to standalone
blocks. Added comments describe contracts, loop counts and output boundaries.
PUT's original B/HL preservation comment remains, with the actual local BC/HL
saves explained separately from the BDOS clobber contract. The headers are
11 lines at entry and6 each for SHOWFCB and PUT, within the15-line target.

Static text inspection found no tabs or source lines beyond40 columns and no
early inline semicolon or missing two-space comment gap. There are41 code
lines including EQU/ORG and39 executable instructions. Of those,23 carry an
inline comment, giving56.1% with directives included. Headers, continuations
and standalone comments do not inflate that numerator. The longest run of
uncommented code is3. The LF source body is2008 bytes, below24576. These are
source-text counts, not an assembled size or a qualified checker result.

The exact ARGS-COMPACT-01 fence SHA-256 is
`1e50887f4b418284302425f597c0b6519fcaa366be2f855aa85104325bcef0ad`.
Its convention is defined with the original identity above. The original
assembly fence in the shared reader draft still compares byte-identically
with the frozen original despite concurrent editorial changes elsewhere in
that chapter. This change owns only the separate candidate file.

Actual ATOM/TAS acceptance, emitted bytes, symbol-map equality, runtime/public
workflow proof,40-column presentation and reader insertion remain held. No
historical output is relabelled and no new result is fabricated.
