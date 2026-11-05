# Chapter 13 compact example candidates

Status: unassembled source candidates for independent review. These four
listings and the CHEAT derivation are separate from reader prose. No byte,
symbol, public build, execution or capture qualification is claimed. The
original Chapter13 listings and held FAIL candidate remain unchanged.

The complete containing chapter, runtime-verification-needs.md, house STYLE
and the compact assembly amendment were read before preparing these sources.
The original layout is frozen at the book revision recorded below. Current
mechanism authority remains TEC-OS ea3ef3de9133931e925a0220d51c0e971c1fd8dd.

Each fence below represents a separate ASCII file with LF line endings and
one final newline. Instructions and register/condition tokens are lowercase.
Existing labels, constants, expressions, include names and literal bytes keep
their identity. Comments retain their original wording with new wrapping or
placement beside the same operation. Code labels have separate lines and data
labels share their declarations. No extra entry label is introduced.

## COUNT.SVC candidate

```asm
; COUNT.SVC: count the characters that
; reach the BIOS's CONOUT, and publish
; the count in a record.
; REMOVE puts CONOUT back.

%INCLUDE "ABI.INC"

  org $0100

; magic, format, no
; dependencies, removable

HDR: db 'D',SVCFMT,0,1
  dw 0,0,0,0     ; REMOVE, size, extra
                 ; memory, relocation
  db 2,2,2       ; bytes added to the
                 ; BDOS, BIOS,
                 ; CCP stacks
  dw 0           ; INIT
  db "COUNT   "  ; the name
                 ; SERVICES prints

; Point CONOUT at MYCO,
; keeping the old target.
; Returns HL = the record, carry clear.
; Changes AF, DE and HL.

INIT:
  call CONSLOT   ; HL = the address held
                 ; by CONOUT's JP

  ld e,(hl)      ; DE = that jump's
                 ; target
  inc hl
  ld d,(hl)
  ld (OLDCO),de  ; MYCO ends by
                 ; jumping there
  ld de,MYCO     ; the hook goes in last
  ld (hl),d
  dec hl
  ld (hl),e
  ld hl,REC      ; the record for
                 ; the loader

; carry clear: installed

  or a
  ret

; Put CONOUT back. Returns carry clear.
; Changes AF, DE and HL.

REMOVE:
  call CONSLOT   ; HL = the address held
                 ; by CONOUT's JP
  ld de,(OLDCO)  ; the target INIT saved
  ld (hl),e
  inc hl
  ld (hl),d
  or a           ; carry clear: removal
                 ; goes ahead
  ret

; Find CONOUT's slot in the BIOS table.
; Returns HL = the address
; held by its JP. Changes F and DE.

CONSLOT:
  ld hl,($0001)  ; HL = the WBOOT entry

; three entries on, and past
; the JP's opcode

  ld de,9+1
  add hl,de
  ret

; The hook: count a character, then
; CONOUT as it was. Keeps every register
; for that jump.

MYCO:
  push hl        ; two bytes of the
                 ; caller's stack
  ld hl,(CHARS)  ; the count, a word
  inc hl
  ld (CHARS),hl
  pop hl         ; C still holds
                 ; the character
  db $C3         ; JP to the
                 ; entry replaced
OLDCO: dw 0      ; INIT fills this in

; The record's one entry.
; Returns HL = the count.
; Changes nothing else.

GETCNT:
  ld hl,(CHARS)
  ret

; the link: the loader fills it

REC: dw 0
  db "COUNT   "  ; the record's name
  db 1           ; its interface version
  dw TABLE       ; its entry table

TABLE:
  jp GETCNT      ; offset 0: the count
CHARS: dw 0      ; the count itself
```

## CHARS.COM candidate

```asm
; CHARS: print the count that COUNT.SVC
; publishes, in hex.

BDOS equ $0005
%INCLUDE "ABI.INC"

  org $0100
  call CHKHW     ; the numbers below
                 ; hold only on ABI 5
  jp nz,NOTHW    ; prints and ends
                 ; the program
  ld de,NAME     ; the record's
                 ; eight-byte name

; the least interface version

  ld b,1
  ld c,TNFIND    ; the registry's find
  call ABICALL
  ld de,NONE

; carry: no such record,
; so print and end

  jp c,SAY

; offset 0 of the table: HL = the count

  call CALLHL
  push hl        ; the low byte, for
                 ; after the label
  ld a,h         ; the high byte first
  ld de,MSG      ; the label
  call LABHEX    ; A is the high byte
  pop hl
  ld a,l         ; the low byte, on the
                 ; same line
  call HEX
  ld de,CRLF     ; end the line
  jp SAY         ; prints and ends
                 ; the program

; Call the routine at HL, whose RET
; returns to the caller of CALLHL.
; Changes what that routine changes.

CALLHL:
  jp (hl)

; the record to find

NAME: db "COUNT   "

; printed when there is no record

NONE: db "no COUNT "
  db "record"
  db 13,10,"$"

; the label before the count

MSG: db "count $"
CRLF: db 13,10,"$"
%INCLUDE "HWLIB.ASM"
```

## RECS.COM candidate

```asm
; RECS: list the registry, newest record
; first: each record's name, its
; interface version and the address of
; its entry table.

BDOS equ $0005
%INCLUDE "ABI.INC"

  org $0100
  call CHKHW     ; the numbers below
                 ; hold only on ABI 5
  jp nz,NOTHW

; the next record's number

NEXT:
  ld a,(INDEX)
  ld b,a         ; B = that number

; the registry's enumerate

  ld c,TNLIST
  call ABICALL
  ret c          ; carry: past the
                 ; last record
  ld a,(INDEX)   ; the next one, for the
                 ; next round
  inc a
  ld (INDEX),a
  call SHOW      ; one line for
                 ; this record
  jr NEXT        ; until the carry above

; Print the record at HL on one line.
; Changes AF, BC, DE and HL.

SHOW:
  inc hl         ; past the link word
  inc hl         ; HL = the name
  ld b,8         ; the eight bytes of
                 ; the name

SHOW1:
  ld e,(hl)      ; BDOS console output
  ld c,2

  push bc        ; the BDOS changes
                 ; these
  push hl
  call BDOS
  pop hl
  pop bc
  inc hl         ; the name's next byte
  djnz SHOW1
  ld a,(hl)      ; the version, after
                 ; the name
  inc hl         ; HL = the table's word
  ld de,VERS
  call LABHEX    ; LABHEX and HEX
                 ; keep HL

; DE = the table's address

  ld e,(hl)
  inc hl
  ld d,(hl)
  ex de,hl       ; HL = it, which
                 ; HEX keeps
  ld a,h         ; high byte first
  ld de,TABL
  call LABHEX
  ld a,l         ; the low byte, on the
                 ; same line
  call HEX
  ld de,CRLF     ; end the line

; its RET is this routine's

  jp SAY

INDEX: db 0
VERS: db " version $"
TABL: db " table $"
CRLF: db 13,10,"$"
%INCLUDE "HWLIB.ASM"
```

## NEEDS.SVC candidate

```asm
; NEEDS.SVC: a service that names
; COUNT's record as a dependency and
; binds to it once, at INIT. Its own
; entry would use TABLE.

%INCLUDE "ABI.INC"

  org $0100

; the tool writes the dependency count

HDR: db 'D',SVCFMT,0,1
  dw 0,0,0,0     ; REMOVE, size, extra
                 ; memory, relocation
  db 0,0,0       ; no stack bytes added
  dw 0           ; INIT
  db "NEEDS   "

; Find COUNT's table and keep it.
; Returns HL = 0, no record,
; carry clear. Changes AF, BC and DE.

INIT:

; the same name and version
; as the dependency

  ld de,NAME
  ld b,1
  ld c,TNFIND    ; the registry's find
  call ABICALL
  ret c          ; the loader has
                 ; checked this already
  ld (TABLE),hl  ; safe to keep: COUNT
                 ; can't leave first
  ld hl,0        ; no record of its own
  or a
  ret

; Nothing to undo. Returns carry clear.

REMOVE:
  or a           ; carry clear: removal
                 ; goes ahead
  ret

; the record to find

NAME: db "COUNT   "
TABLE: dw 0      ; the table, once found

; the least version, then the
; record's name

DEPS: db 1,"COUNT   "
```

## CHEAT derivation

CHEAT is the complete compact COUNT source above with exactly two source-line
replacements. In the header, replace `  db 2,2,2` with `  db 9,2,2`, preserving
its existing comment and continuations. Replace the first `  db "COUNT   "`
line with `  db "CHEAT   "`, again preserving its comment. This is the
eight-byte service name, not the record name below REC. Every other byte of
the compact COUNT source remains unchanged, including the original COUNT.SVC
file comment, labels, hook, record name and declarations. Save the derived
source under the separate name CHEAT.ASM when a later packet is prepared.

The historical Chapter13:449 substitution makes these same two changes to
the tabbed original. Its `the name` comment selects the header occurrence,
not the `the record's name` occurrence. The compact derivation selects the
same occurrence explicitly. A tab-specific substitution cannot be reused on
the compact layout. No CHEAT source file or executable has been created here.

The changed declaration requests nine additional BDOS stack bytes against
the inspected limit of eight. Rejection before INIT is the later observation
to establish. The retained621201d capture is separate historical evidence,
not an observed result from this candidate.

## Exact source identities

Original fences were read from Chapter13 at book commit
971ce6c3a82b8e878187575693123d80d54e19cd. They remain byte-identical to
the retained sources inventoried in compact-proof-plan.md. The four compact
hashes below cover only each complete fence body, including its LF final
newline. They exclude Markdown fences. A future CR/LF CP/M text conversion
and its EOF/record padding need separate byte identities.

| Source | Original bytes | Original SHA-256 | Compact bytes | Compact SHA-256 |
| --- | ---: | --- | ---: | --- |
| COUNT |1885|372bc013b7907fa1b4308f31054a66df925e39e8b0afeceeda739d1b00240966|2304|df9a49a74aba201a021c5002af69a1bd35aa5e2949bf94086293796255f651d2|
| CHARS |1048|a2e6e3bcbde00088e63918b3516246fbb2fdb2b8964ce8c86aaf68ad5169bf07|1249|db574fc1d36304c4008f9476e362267b81bec52f8760e4de85324c9c25a510dd|
| RECS |1361|81663bfd2f8393f5bc99bc24ebde5533076c2fc068cbc022ca692f8222075c58|1713|b21550ff9cef040641e5d03fbb317efa8080589a1e9a8d12d714df42b5e44704|
| NEEDS |944|547ed52c6a29f2f282ac4f7d3cb948acecc22f3f15290a5d8b8f8d6fde28a452|1105|b63647cc1f3f50fb5fe9a55bf16ffcbc700061892eb9e4c2fd5787ea429c184b|
| Derived CHEAT |1885|79853814ad799d6b52bbd0e27b067851f89c62fddcac968ebc9b9173a2e1e593|2304|643997ebe7c65378df110a0266dcd4c98c0949357c571ed82c5a128a6091b98e|

The original CHEAT identity covers the original COUNT fence with only the
two historical substitutions applied as text. The compact CHEAT identity
covers the complete compact COUNT fence with only the two replacements
specified above. Neither identity is an assembly or a stored COM/SVC hash.

## Static correspondence

An inert text comparison removed comments and insignificant spacing outside
quoted literals, then compared case-normalised code/data tokens in order.
Each compact listing matches its original by that comparison. Literal contents
and spaces inside quotes remained exact. The separate label comparison
preserves their original case and order:

| Candidate | Existing labels in source order |
| --- | --- |
| COUNT and CHEAT | HDR, INIT, REMOVE, CONSLOT, MYCO, OLDCO, GETCNT, REC, TABLE, CHARS |
| CHARS | CALLHL, NAME, NONE, MSG, CRLF |
| RECS | NEXT, SHOW, SHOW1, INDEX, VERS, TABL, CRLF |
| NEEDS | HDR, INIT, REMOVE, NAME, TABLE, DEPS |

BDOS remains the uppercase equate name in the clients. `%INCLUDE` and its
quoted filenames retain their exact spelling. The source comparison retains
the data-encoded JP at MYCO, both COUNT name fields, CHARS's split message
declarations, RECS's byte-sized INDEX and NEEDS's trailing dependency record.
In particular, RECS's index-wrap limitation is preserved rather than repaired
as part of formatting. No new label, instruction, reservation or literal is
introduced. CHEAT has only its two intentional data changes relative to COUNT.

The comments' word/punctuation sequence also matches each original after
joining whitespace. Comments were read with their associated operations,
including carry conditions, saved registers, tail jumps and the COUNT hook's
last-write order. Longer notes use aligned continuations or separate blocks.
Every candidate line fits40 columns, contains no tabs and stays below the
24,576-byte source limit. These are source-text observations. Only later
assembly can establish byte, symbol or relocation equality.

## Includes and public writer boundaries

COUNT, NEEDS and derived CHEAT require `ABI.INC`. CHARS and RECS additionally
require the complete HWLIB.ASM after their bodies. Its original retained
source is Chapter11:152–207, 1,755 LF bytes, SHA-256
f79687a437ce6a74c90c34272d93093f61731c63cd13cb8a3c9964f4cf215338.
No helper replacement is embedded or qualified here. A future compact HWLIB
needs its own identity and comparison through these clients.

The inspected ea3 source `src/abi.inc` has SHA-256
092ccf072bb559ba8efc5e55f576d303f2f98a3ea13ed2e821bbd102856a9357.
That source hash does not establish the identity of an unstated `dist/abi.inc`.
Future packets must freeze the actual distribution include beside the sources,
the resolved host paths and both original/compact include closures. Historical
recreation uses that run's own include rather than silently substituting ea3.

The intended on-card build routes remain `TAS COUNT COUNT.SVC`, `TAS CHARS`,
`TAS RECS`, `TAS NEEDS NEEDS.SVC` and `TAS CHEAT CHEAT.SVC`. These names
describe future public routes, not commands run here. COUNT's observed
installation/use/removal remains78127ec, while CHEAT/RECS/NEEDS retain621201d
run evidence. The PC writer's111-byte COUNT result remains7458352 and its
comparison with TAS's first111 bytes remains60e0768. No new size or capture
is inferred for these candidates.

At ea3, `tools/lib/prl.mjs:33–46` matches an indented uppercase ORG without
a trailing comment. `tools/lib/svc.mjs:93–104` uses that expression while
preparing and assembling makeSvc input. All four candidates intentionally use
lowercase `org`, so this public PC service route remains blocked. No product
fix is authorised and no temporary uppercasing may count as qualification of
the actual candidate. The ordinary ATOM wrapper also needs its supported
handling of CHARS/RECS's trailing HWLIB include established, as recorded in
compact-proof-plan.md. These limitations do not grant an alternative route.

NEEDS's displayed source is the TAS form. Its final DEPS record is version1
followed by the eight-byte name `COUNT   `. TAS excludes that record from the
image and writes the dependency metadata. makeSvc instead takes an explicit
`deps` option. A future PC-writer comparison needs a separately identified
input with the trailing DEPS declaration removed and the matching option
`[{name:"COUNT",version:1}]`. That representation is not silently substituted
into this candidate. Compare each writer's original/compact output first,
then compare image, dependency and relocation fields with record padding
accounted for. No writer was imported or assembled to check this here.

## Review and qualification still required

The full containing chapter was read before candidate preparation, including
the hook/failure/stack limitations and every historical recipe and output.
The candidate document then received a complete read-back with each comment
beside its operation, every-paragraph/sentence deletion, agency and punctuation
passes. Long comments were rewrapped at phrases while retaining their meaning
and literal wording. Static correspondence and hashes were refreshed after
the final comment-layout changes.

Independent static review of `c46300f` found two comment-layout issues.
The COUNT target note now accompanies `ld e,(hl)`, giving COUNT and derived
CHEAT 13/31 commented instructions. The RECS BDOS-clobber note now
accompanies `push bc`, reducing its longest uncommented instruction run to
four. Existing comment words, statements, labels and literals are unchanged.
COUNT, derived CHEAT and RECS identities were refreshed. Bounded confirmation
of these fixes remains open. The candidate hashes identify
only proposed text. Public-route byte/symbol/relocation comparison and positive
COUNT/CHARS/RECS/NEEDS workflows plus the intended CHEAT rejection still need
separately reviewed packets and allocation. No executable packet or command
is sealed by this document. FAIL is excluded and its audit candidate untouched.
No product import, assembly, build, emulation, test, capture or runtime occurred.
