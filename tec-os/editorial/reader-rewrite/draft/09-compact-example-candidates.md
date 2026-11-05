# SHOW compact-source candidates

Status: SOURCE-ONLY, UNASSEMBLED and UNRUN. These are separate editorial
candidates, not reader insertions or qualified replacements. I own only this
file. The complete historical SHOW listing, recipe and output in Chapter 9
and its saved-register fragment in Chapter 8 remain untouched.

## Authority and original identities

The compact layout is `origo/bindings/z80-cpm/assembly-style-compact.md`,
including KD-241's spacing and comment-flow refinement. The comment contracts
and 24,576-byte file limit in `assembly-style.md` still apply. The book's
`style-amendment-record.md`, `compact-proof-plan.md` and
`runtime-verification-needs.md` preserve the distinction between source
preparation and actual example qualification.

Book snapshot `f38a2a61641d57d0c34d410227363846b74f795e` identifies the
original inputs. Paths below are relative to
`tec-os/editorial/reader-rewrite/draft/`. Fence-body identities include their
final LF and exclude Markdown delimiters.

| Original | Location | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Complete SHOW | `09-read-and-write-a-file.md:143-179`, last changed at `2684a6bf2646faab0373bbb64329c71d21f46e56` | 1,179 | `dc7b84514897bed699e9cdc1c2e79581e27f215222fc772d2be1a6c1bb508abd` |
| Saved-register fragment | `08-call-tec-os.md:89-95`, unchanged historical SHOW excerpt | 176 | `19b48835392060bce88e16f52226ed74e1985ad942c42fb77082857dc736fcda` |

The fragment belongs to the historical SHOW program. It is not a standalone
program or a separately qualified workflow. Chapter 9 retains the 78127ec
capture authority, historical 72-byte statement, ATOM 0.3.7 and starter TAS
from Thorium dbee66a. None of those historical results certifies the compact
source below. Mechanism inspection remains at TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`, not a newly adopted source pin.

## Complete candidate: SHOW.compact.asm

The fence body is canonical ASCII with LF line endings and a final LF. A
future packet must identify any CR/LF export and actual CP/M text conversion
separately. No executable or on-card source identity is inferred here.

```asm
; SHOW NAME: print the text file NAME on
; the console.

BDOS equ $0005

; the CCP's FCB for the first name

FCB equ $005C

; where the BDOS reads a record

DMA equ $0080

  org $0100

; Takes the CCP's default FCB and DMA.
; Returns by RET or JP BDOS through the
; inherited CCP return word.
; Changes AF, BC, DE and HL.

  xor a          ; Zero for the CR byte.

; read from the first record

  ld (FCB+32),a
  ld de,FCB      ; FCB address for open.
  ld c,15        ; open the file
  call BDOS
  inc a          ; FFh: no such file
  jr z,NOFILE    ; Missing file.

NEXT:
  ld de,FCB      ; FCB for next read.

; read the next record into DMA

  ld c,20
  call BDOS
  or a           ; Z: a record was read.
  ret nz         ; no more records
  ld hl,DMA      ; Scan this record.
  ld b,128       ; One complete record.

PUT:
  ld a,(hl)      ; The next text byte.
  cp $1A         ; ^Z ends a text file
  ret z
  push hl        ; Save the pointer.
  push bc        ; Save the count.
  ld e,a
  ld c,2         ; print the character
                 ; in E
  call BDOS
  pop bc         ; Restore the count.
  pop hl         ; Restore the pointer.
  inc hl
  djnz PUT       ; More in this record.
  jr NEXT        ; Read another record.

NOFILE:
  ld de,NOMSG    ; Missing-file text.
  ld c,9

; print, and return from there

  jp BDOS

NOMSG: db "No such file",13,10,"$"
```

No instructions, operands, expressions, data or instruction order change.
The identifiers remain BDOS, FCB, DMA, NEXT, PUT, NOFILE and NOMSG. There
is no added START label. The entry contract precedes the original unlabelled
entry, which is an intentional label-layout exception to preserve the symbol
map. NEXT and PUT are internal loops, not new externally callable routines.

All original comments retain their meaning. The file description and longer
notes are reflowed without dropping their wording. The print-character note
uses an aligned continuation. Added comments identify existing buffer,
register-save and branch roles. The literal `"No such file"`, CR/LF bytes,
dollar terminator and `1Ah` test remain exact. Mnemonics, registers and
conditions are lowercase. Labels/constants keep their original uppercase
identity. Code uses two leading spaces and inline semicolons at column 18.

## Saved-register candidate fragment

This is the contiguous save/call/restore sequence from the complete candidate.
It corresponds to Chapter 8's historical fragment and the same instructions
inside Chapter 9's SHOW. Its input assumptions remain character in A, pointer
in HL and remaining count in B. It preserves HL and BC across function 2.
It consumes four bytes for the two saves plus the pending CALL's return word,
then restores that caller-stack position. This is instruction arithmetic,
not a measured maximum for the whole program or its BDOS call.

```asm
  push hl        ; Save the pointer.
  push bc        ; Save the count.
  ld e,a
  ld c,2         ; print the character
                 ; in E
  call BDOS
  pop bc         ; Restore the count.
  pop hl         ; Restore the pointer.
```

Qualify this fragment through complete SHOW. Do not create a synthetic entry,
standalone COM or output transcript for it. Any later insertion into Chapter 8
must use this exact excerpt from the qualified full candidate and retain the
original historical provenance separately.

## Include closure and public routes

Both original and compact SHOW contain no INCLUDE directive and consume no
ABI.INC, HWLIB.ASM or generated source. BDOS, FCB and DMA are local equates.
The closure is one source per assembly. The fragment consumes those definitions
from complete SHOW and has no independent assembly closure.

The public standalone ATOM route is the retained
`npx atom show.asm show.com`, using the explicitly pinned local ATOM 0.3.7.
A future sealed command must select that local CLI without downloading or
installing a package. Run original and compact sources in separate isolated
directories, each under the filename `show.asm`. Preserve each exact input and
output identity. The CLI's actual supported options and whole-job limits must
be reviewed before any executable offer. No assembly wrapper is imported here.

The public on-card route is `B:` then `TAS SHOW`, with the selected source
present as `B:SHOW.ASM` and the pinned TAS on A. A future preparation can use
the public `tecvol put ... B show.asm --text` route on a fresh working copy of
the selected starter. Its actual source readback must show the complete
converted candidate before building. Preserve the original and compact cases
on separate fresh card copies rather than overwriting one result with another.
Use the TAS-created SHOW.COM for execution, not an injected ATOM COM.

At ea3ef3d, the TAS pin in `test/inputs.json` is Thorium
`dbee66a90816df9a5884a08754ebc2d458a38325`, 10,295 application bytes,
SHA-256 `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.
That application identity is separate from any CP/M record padding. An editor
workflow would additionally need the actual TED input and its own observations.
This candidate proposes the existing host-import/TAS route, not a TED proof.

SHOW uses the CCP-prepared FCB at 005Ch and default DMA at 0080h. Relevant
source paths are ea3ef3d `src/cpm/ccpcmd.asm:447-545` for argument/page-zero
preparation, `src/cpm/ccp.asm:519-536` for entry/return,
`src/cpm/bdosfile.asm:236-248` for open,
`src/cpm/bdosrec.asm:209-298` for sequential reads and
`src/cpm/bdos.asm:332-341,414-433` for character/string output. Public text
import is `tools/tecvol.mjs:149-156` through
`tools/lib/cpmfs.mjs:181-188`. No file import was performed.

The original command recipe also depends on the complete historical HELLO
source and `work.img` preparation retained in Chapter 26. A future source-only
packet must freeze that fixture's exact bytes and line-ending conversion.
Printing a compact replacement for HELLO would change the selected text and
could not silently reuse Chapter 9's retained capture.

## Exact future proof requirements

All items below remain unperformed. This file supplies no command approval,
compute allocation, executable harness, budget extension or retry permission.

1. Freeze original and compact source bodies, line endings, resolved paths
   and SHA-256s. Confirm the originals still match the table above. Bind the
   offered TEC-OS source, ROM/map/starter, assembler/runtime/dependency files
   and test-file bytes. Reassess the contracts if the offered source changes.
2. Obtain independent review of the candidate and a separately sealed exact
   command. Bound the complete invocation, including preparation and synchronous
   assembly, under its approved wall/cycle/memory limits. Missing inputs must
   fail without downloads, fixture imports or assembler fallback.
3. Assemble both complete sources through explicit ATOM. Compare all logical
   bytes, origin, end and the complete existing symbol-name/kind/value map.
   Preserve labels and constants exactly. Record actual sizes rather than
   adopting the historical 72-byte figure as a new result.
4. Build each actual source through on-card `TAS SHOW`. Retain source readback,
   exact build command/output, generated COM and available debug output. Compare
   logical bytes and common symbols with the ATOM reference. Identify record
   padding and demonstrate its actual contents rather than comparing only a
   convenient prefix and ignoring the tail.
5. On fresh execution cases using the TAS-built COM, observe SHOW printing the
   exact identified HELLO text and returning through the inherited word to a
   ready prompt. Retain the full command and console bytes with explicit capture
   boundaries. Do not manufacture a preceding prompt or historical output.
6. Exercise both text endings: an identified fixture with `1Ah` inside a record
   and bytes after it that must not print, and a no-`1Ah` fixture spanning more
   than one 128-byte record that ends by sequential EOF. Compare every intended
   byte and prove the record boundary is crossed. Retain the fixture contents.
7. Observe `SHOW NOSUCH.TXT` and bare `SHOW` taking the missing-name path, printing
   the exact message and returning. Keep default disk-error behaviour separate
   from ordinary EOF. Returned-error adaptation is outside this formatting job.
8. Check the full compact source on an actual 40-column editor/display route
   under a separately qualified configuration. Static line lengths cannot prove
   screen readability, chosen-font pixels, typing or persistence. An ea3 serial
   proof would establish only its recorded serial scope.
9. Derive the Chapter 8 fragment from the qualified SHOW artifact's exact source.
   Its seven executable instructions must match the complete candidate and its
   pointer/count saves must survive the real output loop. Preserve failures and
   stopped attempts. Independent result and editorial review precede any reader
   replacement or new workflow assertion.

## Candidate text identities and preparation boundary

Candidate hashes and text-only observations are recorded below after the
complete source/comment read. They identify source text, not machine code.

| Candidate LF body | Bytes | SHA-256 |
| --- | ---: | --- |
| SHOW.compact.asm | 1,371 | `9fe6d69b0476cb598894a131dfe583c443464de103c269c303377e2613eb7e38` |
| Saved-register fragment | 234 | `da1ef037a7e9772bf83b3d309c149167c01bf784b75a36f33234ee5fa5d91685` |

Both bodies contain only ASCII, no tabs and no line wider than 40 columns.
Inline comments and their continuations start at column 18. The complete
candidate has 68 source lines. The fragment is an exact contiguous eight-line
excerpt with seven executable instructions. A text-only comparison preserves
the ordered original statements after accounting for case, spacing and
separate labels. All original comment wording remains present in order,
including reflowed continuations. The seven definition names are unchanged.
These observations do not establish assembled bytes, symbol values or a run.

I read the complete original SHOW passage and its surrounding FCB/DMA,
read-result, terminator, return and historical-card explanations. I read the
Chapter 8 fragment in context and the compact rules and amendments above.
I checked each candidate instruction and original comment against its source
before reading the candidate as a complete program. I then read the entire
record for paragraph purpose, sentence deletion, agency and every comma.
Only source-text comparisons and identity calculations accompanied preparation.
I have not changed the reader chapters, their pass records or any historical
literal. Independent candidate review and every future proof item remain open.
