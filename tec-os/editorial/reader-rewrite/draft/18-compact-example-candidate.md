# READ compact-source candidate

Status: source-only candidate, unassembled and unrun. The retained reader
listing, recipe and historical timing evidence remain unchanged. This file
does not supply a verification command, allocation or replacement proof.

## Exact source identities

Original: draft/18-cache-and-persistence.md's complete assembly fence at
book971ce6c. Its LF fence body is 589 bytes with SHA-256
`3fdb415da9cceb855a30e187291cf3976ab62811f36d311c847bab248cd9fcda`. It is the retained historical
READ example, not a newly measured binary.

The LF candidate below is 581 bytes with SHA-256
`87a5f62a21ee3c54e4a2ba72b9188587bc5252c324ef11be2481aac04e98b6e3`.

```asm
; READ: open the file named on the
; command line and read it to the end.
; The CCP supplies the FCB at005Ch.
; An open failure returns through the
; inherited return word. After reading,
; it jumps to0000h for warm boot.
; No register preservation is promised.

BDOS equ $0005
FCB equ $005C    ; command-line name

  org $0100
  ld de,FCB
  ld c,15        ; open the file
  call BDOS
  inc a          ; FFh becomes zero
  ret z          ; No matching file.

NEXT:
  ld de,FCB
  ld c,20        ; read to0080h
  call BDOS
  or a           ; zero: record read
  jr z,NEXT
  jp $0000
```

## Static correspondence and required proof

Read the complete containing READ explanation, original source and card
recipe. The candidate retains every instruction, operand, label and constant
in order. The original comments about the command-line FCB, open result,
function20 DMA destination and zero read status retain their meanings. The
entry/exit header states the existing branches rather than a new mechanism.
Code labels have their own lines. Comments fit the chosen40-column layout
and inline comments start at column18 with at least two spaces after code.
The file has no tabs and is below24576 bytes. No original source was altered.

READ has no include. Its public PC route is the existing explicit ATOM
assembly of read.asm to read.com at0100h. A separately claimed card route
requires actual TAS READ on the exact source and pinned TAS. Keep the
original and compact sources separate and compare logical COM bytes and
symbols, then record128-byte file padding separately. These comparisons
have not occurred.

Use the reviewed proof plan's separate time.img definition with exact
12288-byte DATA.BIN, SYSTEM, THROUGH and BEHIND volumes. A finite allocated
workflow must observe successful reading to sequential EOF, warm return and
an absent-file control, with exact starting card/ROM/map/runtime identities.
An instruction-by-instruction text comparison does not qualify that workflow.
The historical78127ec READ costs and earlier cache costs keep their own pins
and are not remeasured or repinned by formatting. No physical-board result
is supplied.

Read the candidate and this record in order for meaning, every comment,
agency and punctuation. No product import, assembler, build, emulator, test
or capture tool ran. Only inert text extraction and hashing prepared this
candidate. Independent static review and a separately reviewed allocated
execution packet remain required before reader insertion.

## Independent static review correction

The full independent review confirmed statement, comment and identity
preservation, layout, include closure and the unperformed-proof boundary.
It found comment density below the inherited40-percent floor. Added a
meaningful ret-z branch comment identifying the missing-file result and
recomputed the candidate text identity above. Five of11 executable lines
and six of14 statements now have inline comments. No code changes.
Bounded confirmation remains pending. No assembly or execution occurred.
