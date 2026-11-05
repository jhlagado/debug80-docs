# Chapter 11 and Appendix B compact source candidates

Status: source-only candidates for independent review. These eight complete
fences are proposed text, not assembled or qualified reader replacements.
Original listings, recipes and captures remain unchanged. No product import,
assembly, build, emulation, test, capture or runtime has occurred.

The preparation covered the full device chapter and Appendix B,
including their call/register/stack contracts, all containing explanations and
historical results. It also covered house STYLE, the style-amendment record and both
assembly style bindings. Mechanisms use TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. The source snapshot and exact
text identities are recorded below. None qualifies KS48 or a new font/default.

Each fence is a separate ASCII file with LF line endings and one final newline.
HWLIB is an include, not a standalone COM file. The other seven programs
include ABI.INC above their origin and HWLIB.ASM after their body. VTEST is
the unchanged program name from Appendix B, not a renamed BVTEST program.
Code labels have their own lines. Data labels share declarations where the
complete literal fits 40 columns. No symbol is added or renamed.

## Shared HWLIB candidate

```asm
; HWLIB.ASM: routines this chapter's
; programs share. It goes after a
; program's own code, since it makes
; bytes where it is included.

; Test for TEC-OS with ABI 5. Returns Z
; if the table's four bytes match, NZ if
; not. Changes AF, B, DE and HL.
; Takes no register parameters.

CHKHW:
  ld hl,ABITAB   ; signature, then the
                 ; major version
  ld de,TAG      ; what they must be
  ld b,4         ; a major of 6 fails as
                 ; a wrong letter does

CHKH1:
  ld a,(de)
  cp (hl)
  ret nz         ; NZ: not what
                 ; TAG holds
  inc hl         ; on to the next
                 ; of each
  inc de
  djnz CHKH1
  ret            ; Z from the
                 ; last comparison

; End a program that found another
; system. Takes nothing, and returns to
; the CCP through the program's own
; return address.
; Uses BDOS 9's register contract.

NOTHW:
  ld de,NOTMSG   ; no board devices
                 ; here, and no
                 ; harm done

; Print the $-ended string at DE. A jump
; here prints and ends the program.
; Changes AF, BC, DE and HL.
; Takes DE. Returns no value through
; the caller's return word. Uses the
; BDOS 9 register and flag contract.

SAY:
  ld c,9         ; BDOS print string
  jp BDOS        ; its RET is
                 ; this routine's

; Print the $-ended label at DE, then A
; in hex. Changes AF, BC and DE.
; Takes DE and A. Returns no value.
; Restores HL after the label and
; digits.

LABHEX:
  push af        ; the value, across the
                 ; BDOS call
  push hl        ; the BDOS changes HL
  call SAY
  pop hl
  pop af         ; on into HEX

; Print A as two hex digits, which also
; prints a BCD byte in decimal. Changes
; AF, BC and DE.
; Takes A. Returns no value.
; Restores HL after both digits.

HEX:
  push hl        ; a caller may keep a
                 ; value here
  push af        ; the low digit
                 ; comes second
  rrca           ; the high digit down
                 ; to bits 0 to 3
  rrca
  rrca
  rrca
  call NIBBLE    ; the high digit
  pop af
  call NIBBLE    ; the low digit
  pop hl
  ret

; Print the low four bits of A as a hex
; digit. Changes AF, BC, DE and HL.
; Takes A. Returns through BDOS 2,
; using its register/flag contract.

NIBBLE:
  and $0F        ; one digit
  add a,'0'
  cp '9'+1       ; past 9: the letters
                 ; start seven later
  jr c,NIBB1
  add a,7

NIBB1:
  ld e,a         ; BDOS console output
  ld c,2
  jp BDOS        ; its RET is
                 ; this routine's

TAG: db "TNA",5

NOTMSG:
  db "not TEC-OS with ABI 5",13,10,"$"
```

## BOARD candidate

```asm
; BOARD: print what INFO reports, then
; what a bad number returns.
;
; Takes no command-line parameters.
; Prints the report and bad-call status.
; Uses BDOS and numbered-call register
; contracts. Ends through the inherited
; return word.

BDOS equ $0005
%INCLUDE "ABI.INC"

  org $0100
  call CHKHW     ; the numbers below
                 ; hold only on ABI 5
  jp nz,NOTHW
  ld c,TNINFO
  call ABICALL
  push hl        ; the size, across
                 ; the printing
  push de        ; and the version
  ld a,b         ; the device bits
  ld de,MSGB     ; the first line
  call LABHEX
  pop hl         ; the version, high
                 ; byte first
  ld a,h
  ld de,MSGVER   ; the second
  call LABHEX
  ld a,l         ; then the low byte on
                 ; the same line
  call HEX
  pop hl         ; the console's size
  push hl        ; the rows, for the
                 ; next line
  ld a,l         ; the columns
  ld de,MSGCOL   ; the third
  call LABHEX
  pop hl         ; the rows
  ld a,h
  ld de,MSGROW   ; the fourth
  call LABHEX
  ld c,TNCOUNT   ; the number after the
                 ; last service
  call ABICALL
  push af        ; the status, and
                 ; its carry
  ld de,MSGBAD
  call LABHEX
  pop af         ; only the carry is
                 ; wanted now
  ld de,MSGNC
  jp nc,SAY      ; prints and ends
                 ; the program
  ld de,MSGC     ; the carry was set
  jp SAY         ; prints and ends
                 ; the program

; What each line starts with, and how
; the last ends.

MSGB: db "Devices  B = $"
MSGVER: db 13,10,"Version DE = $"
MSGCOL: db 13,10,"Columns  L = $"
MSGROW: db 13,10,"Rows     H = $"

; The last line: the status, then
; its carry.

MSGBAD: db 13,10,"Number 16: status $"
MSGC: db ", carry set",13,10,"$"
MSGNC: db ", carry clear",13,10,"$"
%INCLUDE "HWLIB.ASM"
```

## LCDMSG candidate

```asm
; LCDMSG: write a row of the 20 x 4 LCD
; and beep, on TEC-OS only.
;
; Takes no command-line parameters.
; Requests row 1 and a 400-half-cycle
; tone, then prints the fixed message.
; Uses BDOS and numbered-call register
; contracts. Ends through the inherited
; return word.

BDOS equ $0005
%INCLUDE "ABI.INC"

  org $0100
  call CHKHW     ; the numbers below
                 ; hold only on ABI 5
  jp nz,NOTHW
  ld b,1         ; the LCD's second row
  ld hl,TEXT     ; exactly 20 characters
  ld c,TNLCD
  call ABICALL   ; A is the status, 0
                 ; for this row
  ld b,120       ; about 1 kHz
  ld de,400      ; 400 half cycles,
                 ; about 0.2 s
  ld c,TNTONE
  call ABICALL   ; returns when the
                 ; tone ends
  ld de,DONE
  jp SAY         ; prints and ends
                 ; the program

TEXT: db "Hello on the LCD    "
DONE: db "Written and beeped",13,10,"$"
%INCLUDE "HWLIB.ASM"
```

## DIGCLK candidate

```asm
; DIGCLK: the time on the 7-segment
; digits, until a key.
;
; Takes no command-line parameters.
; Polls BDOS 6 after each digit scan.
; A nonzero key ends the program through
; its inherited return word. Uses BDOS
; and numbered-call register contracts.

BDOS equ $0005
%INCLUDE "ABI.INC"

  org $0100
  call CHKHW     ; the numbers below
                 ; hold only on ABI 5
  jp nz,NOTHW

LOOP:
  ld hl,PASSES   ; the clock is read one
                 ; pass in 32
  inc (hl)
  ld a,(hl)
  and 31         ; 0 on every 32nd pass
  call z,TOSEG
  ld hl,DIGS     ; one pass over the
                 ; six digits
  ld c,TNDIGIT
  call ABICALL
  ld e,$FF       ; BDOS direct input: a
                 ; key, or 0
  ld c,6
  call BDOS
  or a
  jr z,LOOP      ; no key: the digits
                 ; need another pass
  ret            ; DIGIT left them dark

; Read the clock and turn hours, minutes
; and seconds into six patterns at DIGS.
; Changes AF, BC, DE and HL; with no
; clock DIGS stays as it was.
; Takes no register parameters.
; Updates DIGS when RTC succeeds.

TOSEG:
  ld hl,TIME     ; seven BCD bytes,
                 ; seconds first
  ld b,0         ; B = 0: read
  ld c,TNRTC
  call ABICALL
  ret nz         ; status 2: no clock
  ld de,DIGS     ; the leftmost digit's
                 ; pattern first
  ld a,(TIME+2)  ; hours
  call PAIR
  ld a,(TIME+1)  ; minutes
  call PAIR
  ld a,(TIME)    ; seconds, and PAIR's
                 ; RET ends TOSEG

; Store the two digits of the BCD byte
; in A as patterns at DE, which moves on
; by two. Changes AF, BC and HL.

PAIR:
  push af        ; the units digit, for
                 ; after the tens
  rrca           ; the tens digit down
                 ; to bits 0 to 3
  rrca
  rrca
  rrca
  call SEG       ; the tens
  pop af         ; on into SEG for
                 ; the units

; Store the low four bits of A as a
; pattern at DE, which moves on. Changes
; AF, BC and HL.

SEG:
  and $0F        ; one digit
  ld c,a         ; BC = the digit
  ld b,0
  ld hl,SEGTAB   ; the digit's segments,
                 ; one bit each
  add hl,bc
  ld a,(hl)
  ld (de),a      ; into the row of six
  inc de
  ret

; The digits 0 to 9 as segment patterns.

; 0 to 3

SEGTAB: db $EB,$28,$CD,$AD

; 4 to 7

  db $2E,$A7,$E7,$29
  db $EF,$AF     ; 8 and 9
PASSES: db 31    ; 31: the first pass
                 ; reads the clock
DIGS: db 0,0,0,0,0,0
TIME: ds 7
%INCLUDE "HWLIB.ASM"
```

## NOW candidate

```asm
; NOW: print the date and time from
; the clock.
;
; Takes no command-line parameters.
; Prints the fields or the no-clock
; message. Uses BDOS and numbered-call
; register contracts. Ends through the
; inherited return word.

BDOS equ $0005
%INCLUDE "ABI.INC"

  org $0100
  call CHKHW     ; the numbers below
                 ; hold only on ABI 5
  jp nz,NOTHW
  ld hl,TIME     ; seven BCD bytes
  ld b,0         ; B = 0: read
  ld c,TNRTC
  call ABICALL
  ld de,NOCLK
  jp nz,SAY      ; status 2: no
                 ; clock answered
  ld de,CENTY    ; the clock holds two
                 ; digits of the year
  call SAY
  ld hl,PLAN     ; each field's offset,
                 ; then what follows it

NEXT:
  ld c,(hl)      ; BC = the field's
                 ; offset in TIME
  ld b,0
  inc hl
  push hl        ; the plan, across
                 ; the printing
  ld hl,TIME
  add hl,bc
  ld a,(hl)      ; a BCD byte prints
                 ; as decimal
  call HEX
  pop hl
  ld e,(hl)      ; the separator
  inc hl
  push hl        ; the plan again
  ld c,2         ; BDOS console output
  call BDOS
  pop hl
  ld a,(hl)      ; another field?
  inc a
  jr nz,NEXT     ; FFh ends the plan
  ld de,ENDLN
  jp SAY         ; prints and ends
                 ; the program

; year, month

PLAN: db 6,'-',4,'-'

; date, hours

  db 3,' ',2,':'

; minutes, seconds

  db 1,':',0,' '
  db 5,13,$FF    ; weekday, 1 to 7; FFh
                 ; ends the plan
CENTY: db "20$"
NOCLK: db "no clock",13,10,"$"

; after the plan's carriage return

ENDLN: db 10,"$"
TIME: ds 7
%INCLUDE "HWLIB.ASM"
```

## ROWS candidate

```asm
; ROWS: wait for a key on the matrix
; keyboard, then print the eight rows
; and the joystick's byte.
;
; Takes no command-line parameters.
; Checks Matrix enablement before
; waiting. Prints rows/JOY, then waits
; for release. Uses BDOS and numbered
; register contracts. Ends through the
; inherited return word.

BDOS equ $0005
%INCLUDE "ABI.INC"

  org $0100
  call CHKHW     ; the numbers below
                 ; hold only on ABI 5
  jp nz,NOTHW
  ld c,TNINFO    ; is there a matrix
                 ; keyboard to wait for?
  call ABICALL
  bit 0,b        ; INFO's matrix bit
  ld de,NOMTX
  jp z,SAY       ; none: the wait would
                 ; never end

WAIT:
  call SCAN      ; until a key is down
  jr z,WAIT
  ld c,TNJOY     ; the same moment, read
                 ; as the joystick
  call ABICALL
  ld a,b         ; its bits
  ld (STICK),a   ; printed after
                 ; the rows
  ld hl,BUF      ; the eight rows, on
                 ; one line
  ld b,8

SHOW:
  ld a,(hl)      ; one row's byte
  inc hl
  push bc        ; the count, across
                 ; the printing
  call HEX
  ld e,' '       ; BDOS console output
  ld c,2
  push hl        ; the BDOS changes HL
  call BDOS
  pop hl
  pop bc
  djnz SHOW
  ld a,(STICK)   ; JOY's bits
  ld de,MSGJOY
  call LABHEX
  ld de,CRLF     ; end the line
  call SAY

DRAIN:
  call SCAN      ; end only when every
                 ; key is up
  jr nz,DRAIN
  ret

; Read the rows into BUF. Returns Z if
; no key is down, NZ if one is. Changes
; AF, BC, DE and HL.
; Takes no register parameters.
; The returned row bytes are in BUF.

SCAN:
  ld hl,BUF      ; eight bytes, row
                 ; 0 first
  ld c,TNKEYS
  call ABICALL
  ld hl,BUF      ; OR the rows together
  ld b,8
  xor a          ; nothing seen yet

SCAN1:
  or (hl)        ; a key leaves a
                 ; bit set
  inc hl
  djnz SCAN1
  or a           ; Z if every row was 0
  ret

NOMTX: db "no matrix keyboard",13,10,"$"
MSGJOY: db " JOY $"
CRLF: db 13,10,"$"
BUF: ds 8        ; the rows, as KEYS
                 ; leaves them
STICK: ds 1      ; JOY's byte
%INCLUDE "HWLIB.ASM"
```

## PLACE candidate

```asm
; PLACE: write a word at two screen
; positions with PUTAT, plain and in
; reverse, leaving the cursor where
; it is.
;
; Takes no command-line parameters.
; Prints the second PUTAT status.
; Uses BDOS and numbered-call register
; contracts. Ends through the inherited
; return word.

BDOS equ $0005
%INCLUDE "ABI.INC"

  org $0100
  call CHKHW     ; the numbers below
                 ; hold only on ABI 5
  jp nz,NOTHW
  ld de,$0A1E    ; row 10, column 30
  ld hl,PLAIN
  call WRITE
  ld de,$0B1E    ; the row below
  ld hl,INVERT
  call WRITE
  ld de,MSG      ; A holds the second
                 ; call's status
  call LABHEX
  ld de,CRLF     ; end the line
  jp SAY         ; prints and ends
                 ; the program

; Write the six characters at HL at row
; D, column E. Returns the status in A.
; Changes F, BC, DE and HL.

WRITE:
  ld b,6
  ld c,TNPUTAT
  jp ABICALL     ; its RET is
                 ; this routine's

PLAIN: db "TEC-OS"

; "TEC" with bit 7 set: reverse images

INVERT: db $D4,$C5,$C3

; "-OS", the same

  db $AD,$CF,$D3
MSG: db "PUTAT status $"
CRLF: db 13,10,"$"
%INCLUDE "HWLIB.ASM"
```

## VTEST candidate

```asm
; VTEST: write four bytes to the
; PICO9918's VRAM and read them back
; through the graphics entries of the
; ROM's PICO9918 console.
;
; Takes no command-line parameters.
; Uses a PICO record for the four-byte
; claim/write/read/release sequence.
; Prints BACK or the no-record message.
; Uses BDOS and numbered-call register
; contracts. Ends through the inherited
; return word.

BDOS equ $0005
VRAM equ $3000   ; an address the text
                 ; modes leave alone
%INCLUDE "ABI.INC"

  org $0100
  call CHKHW     ; the numbers below
                 ; hold only on ABI 5
  jp nz,NOTHW
  ld de,NAME     ; the record's
                 ; eight-byte name
  ld b,2         ; version 2 has the
                 ; graphics entries
  ld c,TNFIND    ; the registry's find
  call ABICALL
  ld de,NONE
  jp c,SAY       ; carry: no such
                 ; record, so print
                 ; and end
  ld (TABLE),hl  ; good until this
                 ; program exits
  ld b,1         ; claim the PICO9918
  ld c,TNVIDEO
  call ABICALL
  ld hl,VRAM     ; PICOWR: BC bytes from
                 ; DE to VRAM at HL
  ld de,DATA     ; the bytes to write
  ld bc,4
  ld a,PICOWR    ; the entry's offset in
                 ; the table
  call ENTRY
  ld hl,VRAM     ; PICORD: BC bytes from
                 ; VRAM at HL to DE
  ld de,BACK     ; where to put them
  ld bc,4
  ld a,PICORD    ; the entry's offset in
                 ; the table
  call ENTRY
  ld b,0         ; give it back: the
                 ; console's screen
                 ; returns
  ld c,TNVIDEO
  call ABICALL
  ld de,BACK     ; the four bytes,
                 ; as text
  jp SAY         ; prints and ends
                 ; the program

; Run the table's entry at offset A,
; with its arguments in BC, DE and HL.
; Changes what the entry changes.
; Uses TABLE as the entry-table address.
; Returns as the selected entry does.

ENTRY:
  push hl        ; the entry's HL
  push de        ; and its DE
  ld e,a         ; DE = the offset
  ld d,0
  ld hl,(TABLE)
  add hl,de      ; HL = the entry's word
  ld e,(hl)
  inc hl
  ld d,(hl)
  ex de,hl       ; HL = the routine
  pop de         ; the entry's DE back
  ex (sp),hl     ; the routine goes on
                 ; the stack, HL
                 ; comes back
  ret            ; a jump to it, with
                 ; HL free

TABLE: dw 0      ; the table, once found

; the record to find

NAME: db "PICO    "

; printed when there is no record

NONE: db "no PICO "
  db "record"
  db 13,10,"$"
DATA: db "VRAM"  ; the four bytes
                 ; to write
BACK: db "????"  ; PICORD fills
                 ; these four
  db 13,10,"$"
%INCLUDE "HWLIB.ASM"
```

## Text identities and static correspondence

The originals are the seven assembly fences in Chapter 11 and the VTEST
fence in Appendix B at book commit
`b8c5c284160dba6d377392ff9a1b07f3d7e60581`. Each identity covers the ASCII
fence body only, without Markdown delimiters, including its final LF.
The byte counts below describe source text, not assembled programs.

| File | Original bytes | Candidate bytes |
| --- | ---: | ---: |
| HWLIB.ASM | 1755 | 2606 |
| BOARD.ASM | 1340 | 1849 |
| LCDMSG.ASM | 577 | 928 |
| DIGCLK.ASM | 1751 | 2439 |
| NOW.ASM | 1124 | 1589 |
| ROWS.ASM | 1466 | 2126 |
| PLACE.ASM | 822 | 1120 |
| VTEST.ASM | 1796 | 2676 |

Full SHA-256 identities, original followed by candidate:

- HWLIB:
  `f79687a437ce6a74c90c34272d93093f61731c63cd13cb8a3c9964f4cf215338`
  `4e24317cfee3bff6e7c840e41a1fa7c73fa82540faeee4f7de24f6f09d7e89b0`
- BOARD:
  `76abc8bcb272aa567a118fef1e22320d823109b4885e64d21c8d9c3974123288`
  `bf27e8f2b4336f097a195e781fd43bb8f7ff16aa685c2f0ae3dda6cc8c3aa80d`
- LCDMSG:
  `439cbc2600c8e30e9645cf136e9fcce78ed6fbecb505fc65172d131de6f251f3`
  `438daaf6298bf1a7ed2275b7047bc23aacca769e61e765f32f41ccdb4fd2b353`
- DIGCLK:
  `f1ad379fd8a83afe6f0c0180e1c1956a016f5a0f55f51caaff977be83b411398`
  `ac9717fb1efb82a33d50112521dfd37fe367430a7e7b63f7ecbed581b040b97d`
- NOW:
  `2568599921c253588c3cffb9e9c87b30187dab010b11d0bf3579c4a4965a51ac`
  `03a85f9d17b4fbf482b5032d19db42e679120369a6b3c023377aecaad9ac64e8`
- ROWS:
  `0b1de6333c9984bd937223ecfb57896012511fdbcc3fd76456c244d8fafc9772`
  `ea445cb32db0e402f4e93800c045b073bd84bf77aa7a7d515959b2bca8733852`
- PLACE:
  `09087942638e6bea22c9c5d3e450f05342584da5f16922f1da06395a8d004d9b`
  `d7a30e32b1c18c42358adb97480b0980df603bbcad0cc88f4775458a692aeed7`
- VTEST:
  `6b0fcd65d2da1ad619a1c53ea06c9f076193cc128a3747f7f273246f839c037e`
  `3a47e544b11c17bb8a07e829633f7e5feaa656018d8917dd2a39b0f1b34025f3`

A text comparison accounts for every statement in order, allowing whitespace
and mnemonic/register case changes outside quoted literals. Labels retain their
spelling and order. Equates, operands, data, quoted strings and numeric literal
spellings remain unchanged. Original comments retain their words in order,
with wrapping and placement changes. Added headers describe inputs, results,
return paths and the contracts used by each program. No executable statement,
error check, adapter or new source behaviour has been added.

The HWLIB NOTMSG label is separate from its declaration so the full existing
literal fits. Both the label and declaration remain in the same position.
All eight fences fit 40 columns and are below the 24,576-byte source limit.
The instruction-only comment counts, excluding labels, equates, includes and
data/storage directives, are HWLIB 21/37, BOARD 20/34, LCDMSG 8/12,
DIGCLK 22/43, NOW 15/31, ROWS 21/45, PLACE 7/15 and VTEST 24/40.
Each exceeds the 40% floor. No instruction run exceeds four uncommented
instructions without an intervening comment. These are static layout checks,
not assembler acceptance or byte equivalence.

## Dependencies and public assembly routes

Every client needs the exact `src/abi.inc` from TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`, stored under the existing
include name `ABI.INC`, and this shared candidate as `HWLIB.ASM`.
The ABI include is 6,242 bytes with SHA-256
`092ccf072bb559ba8efc5e55f576d303f2f98a3ea13ed2e821bbd102856a9357`.
The ABI include remains before `org $0100`. The HWLIB include remains after
the client's code and data. HWLIB emits code and data there, so moving that
include to the header is not an equivalent formatting change.

The normal public host assembly mechanism is
`tools/lib/assemble.mjs:10–20`, used by `tools/media.mjs:187–192` for COM
programs. It passes the source directly to ATOM. There is no
`tecvol asm` command. A later packet must name a supported public workflow
for these individual sources rather than inventing a CLI.
At this source pin, the service writer documents ATOM's header-only include
restriction and expands a trailing include for its own service build
(`tools/lib/svc.mjs:93–100`). That service-specific transformation is not an
adapter for these COM examples. Direct public ATOM qualification of all seven
clients is held on the trailing `%INCLUDE "HWLIB.ASM"` dependency. No include
expander, concatenated substitute or private assembler route is supplied here.
HWLIB cannot be qualified by assembling it as a standalone COM program.

The separate case-sensitive service-writer ORG search remains recorded in
`compact-proof-plan.md`. These are COM clients, so that service-writer defect
is not presented as an additional failure of their ordinary assembly route.
Neither blocker is repaired or waived by this packet.

The retained on-machine route is `TAS BOARD`, `TAS LCDMSG`, `TAS DIGCLK`,
`TAS NOW`, `TAS ROWS`, `TAS PLACE` or `TAS VTEST`, with ABI.INC and HWLIB.ASM
on the current drive. Future qualification must establish the actual TAS binary
and normal card/build provenance, not infer them from an old transcript.
ATOM remains the production toolchain. TAS is a bounded compatibility comparison.

The include closure also covers CHARS and RECS in the separate Chapter 13
candidate document. BOARD, LCDMSG, DIGCLK, NOW, ROWS, PLACE, VTEST, CHARS
and RECS are nine clients. No client is qualified solely because another
successfully uses the shared helper.

## Contract review and preserved boundaries

The numbered-call contract is `src/abi.inc:34–64`, with the PICO graphics
entries at `205–218`. BDOS entry, result and console paths are in
`src/cpm/bdos.asm:121–151`, `235–252`, `332–341`, `371–398` and `414–435`.
The dispatcher is `src/services.asm:35–86`. These coordinates refer to the
full ea3 source pin above, read as Git text.

These programs use BDOS functions 2, 6 and 9, not disk functions. Added
headers refer to those calls' contracts rather than promising that all BDOS
calls destroy only AF, BC, DE and HL. In particular, this document makes no
IX-preservation promise for a disk path. The original narrow helper comments
remain scoped to their actual console calls. Numbered MOUNT, UNMOUNT and
DESCRIBE have different IX/alternate-register rules and are not called here.

The static review followed the inherited return word, tail jumps, saved values
across printing and the HWLIB fall-throughs. It also followed DIGCLK's first
clock read from PASSES = 31, the RTC-failure return before changing DIGS,
PAIR/SEG conversion and the nonzero-key exit. NOW retains its field plan,
separators, century prefix and weekday. ROWS retains the press/read/release
sequence and joystick snapshot. Its INFO bit tests Matrix switch enablement,
not a responding keyboard probe, despite the retained informal question in the
original inline comment. PLACE retains the two coordinates, six-byte strings
and second-call status. VTEST retains the existing PICO version-2 lookup,
claim/write/read/release sequence and stack-mediated ENTRY dispatch. It adds
no new claim-success check or fallback.

## Historical evidence and future proof scope

Chapter 11's retained recipes and captures remain historical `78127ec`
material. Its starter TAS comes from Thorium `dbee66a`, with the exact identity
recorded in that chapter. That history does not establish a positive DIGCLK
transcript. Appendix B's VTEST result is specifically `60e0768`, using the
then-loaded PICO.SVC record. It is not evidence of running this candidate
against the later ROM PICO console. Original comments about that console do
not change the capture's provenance. Existing timing figures and captures stay
in their original passages, with their individual pins, and are not replaced
or newly checked by this document.

Future proof remains subject to a separately reviewed packet and allocation.
The groups below propose observations, not commands to execute or a sealed
budget. Use the bounds in `compact-proof-plan.md` when that packet is prepared.
LINE is already qualified and is excluded from required reruns.

| Group | Required comparisons and observations |
| --- | --- |
| Shared helper | Resolve the public include route first. Record all source/include hashes and assembler identities. Compare each original/compact client with original/compact HWLIB where allocated. Compare logical COM bytes, symbols, padded file records and output, not source hashes alone. |
| BOARD | Serial and PICO INFO fields, bad number 16, status and carry suffix, exact report and normal return. Preserve the unsupported-ABI exit. |
| LCDMSG | Exact row-1 contents, tone request and completion, fixed message and normal return. Model port activity cannot establish audible or physical display quality. |
| DIGCLK | First and every-32nd RTC read, fixed-time segment bytes, absent-clock retention, six-digit scan, BDOS polling and nonzero-key return with digits dark. No positive result is inherited from the other device recipes. |
| NOW | Exact field order, separators, weekday and line ending, no-clock result and normal return. Derive the expected time from the observed clock and elapsed assembly/run work rather than copying an old timestamp. |
| ROWS | Matrix-enabled press/release cases for x and 5, eight row bytes and joystick value, release before return, disabled-Matrix message. No keyboard-presence claim from the enable bit. |
| PLACE | Exact two positions, plain/reverse bytes, cursor preservation and second-call status. Separate serial absence, PICO success and GLCD clipping/device limits. |
| VTEST | Current ROM record lookup, claim/release state, exact four-byte VRAM round trip, BACK output and return, plus absent-record control. Preserve the existing unchecked status paths. |

For every allocated workflow, retain the actual source bytes, assembly output,
logical and padded hashes, console bytes, relevant device/memory observations
and return evidence. Identify source defects separately from formatting defects.
A text comparison cannot establish ATOM/TAS equivalence, runtime success,
browser behaviour or physical-board evidence. No listing insertion, allocation,
new font/default acceptance or historical repinning is authorised here.

The final craft pass checked paragraph and sentence purpose, agency, every
comma and the reader's route through candidates, identities, blockers and
future observations. Original literal text and comment meaning take precedence
over stylistic tidying. The status remains source-only and unassembled.

## LABHEX header review disposition

The confirmed header finding replaces the added claim “Restores HL after both
print calls” with “Restores HL after the label and digits.” The latter is
wrapped over two comment lines to keep the 40-column limit. LABHEX calls SAY
for the label, then falls through to HEX, which prints two digits. The revised
header describes the saved HL across that whole sequence without suggesting
there are only two BDOS calls. Original comment wording and all executable
statements remain unchanged. HWLIB's source size and SHA-256 above were
refreshed after this single header change. Full independent review of the
eight candidates remains open. This correction is source-only, with no
assembly, import or runtime qualification.
