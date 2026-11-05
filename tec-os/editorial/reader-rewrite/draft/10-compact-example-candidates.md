# TOP, AREA and KEY compact source candidates

Status: source-only candidates for independent review and later allocated
assembly. These are not qualified listings and are not replacements for the
reader examples. No assembly, product import, program execution, test or capture
was performed. No historical transcript is attributed to these candidates.

## Authority and identities

Read the complete original listings and their containing explanations/recipes
in draft/10-memory-for-programs.md. The frozen book identity for this packet is
`521c4fc684c21618a5f2777a55628f17069b7396`. Its source-listing history is separate
from the chapter's retained TEC-OS78127ec and ATOM0.3.7 runtime provenance.
No new run provenance follows from the current book commit.

The governing layout is Origo bindings/z80-cpm/assembly-style.md and its
assembly-style-compact.md amendment, read at the binding revision recorded by
`5ef991ffca9d9774888d8d667cc3155ccb8fcf45`. The compact rules supersede old tab
alignment. KD229/KD241 require narrow-display review and actual assembly
qualification before migration acceptance. The book's current STYLE,
style-amendment-record and runtime-verification-needs compact-example amendment
retain the original reader sources until each candidate is qualified separately.
The LINE result does not qualify TOP, AREA or KEY.

Each identity below includes the complete fenced source, from the opening
`asm` fence through the closing fence, with LF line endings and a final LF.
Fence markers are included in the identity hash but excluded from a later ASM
file. The candidate identifier names exactly the assembly fence in its section.
No tabs or Markdown indentation belong to the extracted source.

| Candidate | Exact original at the frozen book commit | Original fence SHA-256 |
| --- | --- | --- |
| TOP-COMPACT-01 | draft/10-memory-for-programs.md:84–113 | `f49eabe5e301534bf6fef1d366e67f485e6817344ce0afa5753634eacc45716d` |
| AREA-COMPACT-01 | draft/10-memory-for-programs.md:197–239 | `047813c99b9174d0c9cefef1c5f22f6204b0589c847c749e327f8407a1dcd68b` |
| KEY-COMPACT-01 | draft/10-memory-for-programs.md:453–498 | `c9d3f073867676fc4e02e9855f8c782e8f26be8502899bdc58cd18f6b6adac73` |

Candidate hashes and the completed static disposition appear after the listings.
The original three listings, explanations, recipes and captures remain untouched.

## TOP-COMPACT-01

Later extraction name: `top.compact.asm`. The code still reads the high byte
at0007h before the low byte at0006h. HEX calls DIGIT for the high nibble and
falls through for the low nibble. The final function9 call uses the inherited
return word. Only layout, instruction/directive/register case and additional
contract/logic comments change.

```asm
; TOP: print the word at 0006h, the
; first byte above the program area.
;
; Takes no parameters. Prints an h
; suffix and CR/LF after the address.
; Finishes through BDOS function 9 and
; the inherited return word. Uses the
; BDOS register and flag contract.

BDOS equ $0005

  org $0100
  ld a,($0007)   ; the high byte first
  call HEX
  ld a,($0006)   ; then the low byte
  call HEX
  ld de,CRLF     ; suffix after address
  ld c,9
  jp BDOS        ; inherited return word

; Print A's high digit by call and its
; low digit by fall-through. Takes A.
; Returns no value. Uses the BDOS
; register and flag contract.

HEX:
  push af        ; A as two hex digits
  rrca
  rrca
  rrca
  rrca
  call DIGIT     ; high nibble first
  pop af         ; original low nibble

; Print the low nibble of A. Returns
; through BDOS function 2. Uses the
; BDOS register and flag contract.

DIGIT:
  and $0F        ; select the low nibble
  add a,'0'
  cp '9'+1       ; first code above '9'
  jr c,DIGIT1    ; 0..9 already ASCII

; Extra offset for hexadecimal A..F.

  add a,'A'-'9'-1

DIGIT1:
  ld e,a
  ld c,2         ; BDOS character output
  jp BDOS        ; tail return to caller

; Address suffix for BDOS function 9.

CRLF: db "h",13,10,"$"
```

## AREA-COMPACT-01

Later extraction name: `area.compact.asm`. The subtraction still clears carry
before SBC. PUTDEC retains the five negative powers and the last fall-through.
DIGIT retains the carry-controlled subtraction loop, correction and saved HL
across function2. Every original comment is retained with reflowed wrapping.

```asm
; AREA: print the size of the program
; area in bytes, in decimal.
;
; Takes no parameters. Reads the word
; at 0006h and subtracts 0100h. Uses
; the BDOS register and flag contract.
; The final jump uses the inherited
; return word after printing the suffix.

BDOS equ $0005

  org $0100
  ld hl,($0006)  ; the first byte
                 ; above the area
  ld de,$0100    ; the area's first byte

; clear carry for the subtraction

  or a

; HL = the size in bytes

  sbc hl,de
  call PUTDEC

; the text after the number

  ld de,BYTES
  ld c,9         ; BDOS function 9:
                 ; print a string
  jp BDOS        ; print, and return
                 ; from there

; PUTDEC: print HL in decimal, always
; as five digits. Takes HL. Returns
; nothing. Changes AF, BC, DE and HL.

PUTDEC:

; the ten-thousands digit

  ld bc,-10000
  call DIGIT
  ld bc,-1000    ; the thousands,
                 ; from what is left
  call DIGIT
  ld bc,-100     ; the hundreds
  call DIGIT
  ld bc,-10      ; the tens
  call DIGIT

; the units: fall into DIGIT

  ld bc,-1

; DIGIT: print how many times a power
; of ten goes into HL. Takes the
; negative of the power in BC and the
; number in HL. Returns the remainder
; in HL. Changes AF, BC and DE.

DIGIT:

; one below the character for 0

  ld a,'0'-1

DLOOP:
  inc a          ; the next digit
  add hl,bc      ; take off one power
                 ; of ten
  jr c,DLOOP     ; carry: HL is still
                 ; 0 or more
  sbc hl,bc      ; one too many: add
                 ; the power back
  push hl        ; function 2 changes
                 ; the registers
  ld e,a
  ld c,2         ; BDOS function 2:
                 ; print E
  call BDOS      ; output with HL saved
  pop hl         ; remainder for caller
  ret

BYTES: db " bytes",13,10,"$"
```

## KEY-COMPACT-01

Later extraction name: `key.compact.asm`. KEY still selects its private stack
before calling a BIOS routine. It patches the CONIN and CONOUT operands from
the warm-boot vector, saves the original key across output and exits through
0000h after Return. The two zero operands remain writable patch sites. The
64-byte reservation and exclusive STACK label are unchanged.

```asm
; KEY: read keys through the BIOS and
; print each one's code in hex, until
; Return.
;
; Takes no parameters. Uses a private
; 64-byte stack. Prints each code and
; a space, then CR/LF after Return.
; Uses the BIOS register/flag contract
; and finishes by jumping to 0000h.

  org $0100      ; COM entry address

; the BIOS's routines run on this stack

  ld sp,STACK

; the BIOS's warm boot entry, table + 3

  ld hl,($0001)
  ld de,6        ; CONIN is two slots on
  add hl,de      ; locate input vector

; table + 9: CONIN

  ld (CONIN+1),hl
  ld de,3        ; next BIOS slot
  add hl,de      ; locate output vector

; table + 0Ch: CONOUT

  ld (CONOUT+1),hl

; Each iteration prints the original
; key before testing it against Return.

NEXT:
  call CONIN     ; wait for a key;
                 ; A = its code
  push af        ; key for Return test
  call HEX
  ld c,' '       ; code separator
  call CONOUT    ; separate key codes
  pop af         ; original key restored
  cp 13          ; Return ends the loop
  jr nz,NEXT     ; continue until Return
  ld c,13
  call CONOUT
  ld c,10
  call CONOUT

; no return word on this stack

  jp $0000

; Print C through the patched BIOS
; entry. Takes C and returns no value.
; Uses the BIOS register/flag contract.
; print C; the address goes here

CONOUT:
  jp 0

; Read through the patched BIOS entry.
; Returns A. Uses the BIOS register/flag
; contract for other registers/flags.

CONIN:
  jp 0           ; the address goes here

; Print A's high digit by call and its
; low digit by fall-through. Takes A.
; Returns no value. Uses the BIOS
; register and flag contract.

HEX:
  push af        ; A as two hex digits
  rrca
  rrca
  rrca
  rrca
  call DIGIT     ; high nibble first
  pop af         ; original low nibble

; Print the low nibble of A. Takes A.
; Tail-returns through BIOS CONOUT.
; Uses the BIOS register/flag contract.

DIGIT:
  and $0F        ; select the low nibble
  add a,'0'
  cp '9'+1
  jr c,DIGIT1    ; 0..9 already ASCII

; Extra offset for hexadecimal A..F.

  add a,'A'-'9'-1

DIGIT1:
  ld c,a
  jr CONOUT      ; tail return to caller

  ds 64          ; private caller stack

STACK:
```

## Normal assembly route and include closure

The chapter's normal host route is ATOM0.3.7 from the TEC-OS project's
`atom-z80` dependency. For later isolated comparison the original forms are
`npx atom top.asm top.com`, `npx atom area.asm area.com` and
`npx atom key.asm key.com`. The corresponding candidate forms replace the
names with `top.compact.asm top.compact.com`, `area.compact.asm area.compact.com`
and `key.compact.asm key.compact.com`. These are unrun command forms for the
same normal assembler, not a new build route or execution allocation.
Use the explicitly pinned local dependency rather than an unpinned download.
At productea3ef3d, package.json declares atom-z800.3.7. The stand-alone helper
at tools/lib/assemble.mjs:10–19 also invokes ATOM and materialises COM bytes
from0100h. No helper or package was imported for this preparation.

| Source | Complete source dependency closure | Runtime interface |
| --- | --- | --- |
| TOP | Its single source, local BDOS constant, HEX/DIGIT/DIGIT1 and CRLF | BDOS2/9 through0005h, inherited return word |
| AREA | Its single source, local BDOS constant, PUTDEC/DIGIT/DLOOP and BYTES | BDOS2/9 through0005h, inherited return word |
| KEY | Its single source, CONIN/CONOUT patch stubs, HEX/DIGIT/DIGIT1 and64-byte stack | RAM BIOS vectors derived from0001h, explicit0000h exit |

None has an include directive, external label, generated source, ABI.INC,
HWLIB, resident-service declaration or font dependency. A later on-card TAS
comparison would be a separate named route requiring its exact assembler input
and allocation. The existing host recipes do not establish that result.

## Static disposition and remaining qualification

Read each original and candidate instruction in order, including every label,
literal, branch condition and fall-through. Original identifier spelling is
unchanged. Mnemonics/directives and register/condition spellings are lowercase.
Strings and character literals retain case and contents. Code labels have their
own lines with a blank above. Instructions have two leading spaces and one
mnemonic/operand separator. Inline semicolons begin at column18 or later with
at least two spaces after code. Longer notes use separated left-margin blocks.
Original comment wording is retained through reflow. Added comments state
contracts, branch meanings, return-word use and the reasons for saved state.

Static readback found no tabs or source lines beyond40 columns. It caught
and corrected an early inline-comment column and a patch operand with too
little room before its comment. Long original comments were reflowed or moved
to separated blocks, including AREA's ten-thousands and final fall-through
notes. No original comment meaning or instruction order was removed.

The conservative comment count below includes instructions and directives,
including EQU/DB/DS. It excludes label-only, blank and comment-only lines.
Only a comment on the code line counts in the numerator. Continuations and
headers therefore do not inflate the floor. A sequential read found no run
of more than four code lines without a comment or intervening comment block.
Every routine header is within the15-line target. These are static source
checks, not an assembler, migration-checker or display result.

| Candidate | Commented code / code lines | Density | Candidate fence SHA-256 |
| --- | ---: | ---: | --- |
| TOP-COMPACT-01 | 12 / 25 | 48% | `5f9bcb7b7272f93b771817fa4ac430f3167f2fe522b0884c9083656e57947263` |
| AREA-COMPACT-01 | 15 / 31 | 48.4% | `bb65038e4c39df6f8ff859f5aeb3c5fd831bd2cb97e65f12f69aba5c051be074` |
| KEY-COMPACT-01 | 20 / 39 | 51.3% | `7829fc2c4928944869ce70c0a38852955740c46d7b04be8f7d13c60a7cc74a13` |

Assembly-byte and symbol-map equality, actual comment/checker acceptance,
40-column display review and any positive workflow/capture remain unqualified.
Original operand/label case semantics must be checked with the actual ATOM
assembler and debug consumers before any reader migration. No assembled size,
cycle count, output or successful build is inferred from these sources.
