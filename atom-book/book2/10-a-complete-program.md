---
layout: default
title: "A Complete Program"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 10
---

# A Complete Program

The earlier chapters introduced one mechanism at a time. This chapter combines
them in one program: a data table, DJNZ loops, subroutines, register-based
arguments and conditional branches. The focus is the data flow through
`MAIN` and across two calls.

---

## The integration goal

The program solves two related problems on the same byte table:

1. The maximum value in the table.
2. The number of entries strictly greater than 64.

`MAIN` supplies a table pointer and length to each subroutine, receives each
result and stores it in named RAM. That structure connects the separate
instruction patterns from earlier chapters into one flat Z80 program.

The complete source follows.

---

## The full program

```asm
TABLELEN EQU 8

ORG $0000
MAIN:
  LD HL, VALUES
  LD B, TABLELEN
  CALL FIND_MAX
  LD (MAX_VAL), A

  LD HL, VALUES
  LD B, TABLELEN
  LD C, 64
  CALL CNTABOVE
  LD (ABOVE_64), A
  HALT

; find_max: scan byte table, return largest value
; In:  HL = pointer to first byte, B = count
; Precondition: B > 0
; Out: A = maximum value
; Clobbers: B, C, F, HL
FIND_MAX:
  LD A, 0
.MAXLOOP:
  LD C, (HL)
  CP C
  JR NC, .NOMAX
  LD A, C
.NOMAX:
  INC HL
  DJNZ .MAXLOOP
  RET

; CNTABOVE: count entries strictly greater than threshold
; In:  HL = pointer to first byte, B = count, C = threshold
; Precondition: B > 0
; Out: A = count of entries > C
; Clobbers: B, D, F, HL
; Preserves: C
CNTABOVE:
  LD D, 0
.CNTLOOP:
  LD A, (HL)
  CP C
  JR C, .CNTSKIP
  JR Z, .CNTSKIP
  INC D
.CNTSKIP:
  INC HL
  DJNZ .CNTLOOP
  LD A, D
  RET

ORG $8000
VALUES:   DB 23, 47, 91, 5, 67, 12, 88, 34
MAX_VAL:  DB 0
ABOVE_64: DB 0
```

---

## `MAIN`: the calling sequence

`MAIN` sets up registers, calls a subroutine, stores the result, then repeats
for the second task. Every argument register is loaded immediately before its
`CALL`, so the complete data flow is visible in the calling sequence.

The table base address `VALUES` must be loaded into HL again before the second
call because `FIND_MAX` advances HL past the end of the table during its scan.
The comment header records that side effect by listing HL among the clobbers.
Reloading HL at the call site prevents the second routine from scanning the
bytes after the table.

![The register traffic across both calls. HL is reloaded between them because find_max leaves it past the end of the table.](../../assets/images/azm-book/book2/main-data-flow.svg)

---

## `FIND_MAX`: a counted loop with a conditional update

`FIND_MAX` scans the table and returns the largest byte in A. The loop body uses C as a temporary to hold the current element.

```asm
FIND_MAX:
  LD A, 0
.MAXLOOP:
  LD C, (HL)
  CP C
  JR NC, .NOMAX
  LD A, C
.NOMAX:
  INC HL
  DJNZ .MAXLOOP
  RET
```

The flag-before-branch check on `CP C` / `JR NC` shows that `CP C` establishes the flag, `JR NC` reads it immediately, and nothing changes the flag between them. Carry clear after `CP C` means A ≥ C, so `JR NC` skips the update and the running maximum is left alone. `LD A, C` runs only when carry was set, meaning A was less than C and C is a new maximum. After eight iterations, A = 91 (`$5B`), the largest value in the table.

The comment header documents "Clobbers: B, C, F, HL". B is consumed by
`DJNZ`, C holds the current element, comparisons modify F, HL advances past the
last byte and A holds the result.

---

## `CNTABOVE`: reusing comparison flags

`CNTABOVE` counts entries strictly greater than a threshold and returns the count in A.

```asm
CNTABOVE:
  LD D, 0
.CNTLOOP:
  LD A, (HL)
  CP C
  JR C, .CNTSKIP
  JR Z, .CNTSKIP
  INC D
.CNTSKIP:
  INC HL
  DJNZ .CNTLOOP
  LD A, D
  RET
```

The subroutine uses D as its running count. `LD D, 0` changes only D, so B
retains the loop count and C retains the threshold. The comment contract lists
D among the clobbered registers and C among the preserved registers.

The loop body uses one `CP C` and two conditional branches on the **same** flag
result. `CP C` sets carry when A < C and sets Z when A == C. To count only
entries strictly greater than C, both conditions must be false: carry clear and
Z clear. The code runs `JR C, .CNTSKIP` (skip if A < C) and `JR Z,
.CNTSKIP` (skip if A == C) immediately after that single comparison.
No instruction between `CP C` and those branches changes the flags, so both
tests read the same comparison.

---

## Tracing the integrated program

The program places `VALUES`, `MAX_VAL` and `ABOVE_64` at `$8000`. Both
subroutines receive a table pointer and count, and `MAIN` stores their returned
values in the named result bytes. A trace through `MAIN` follows each value from
RAM into an argument register, through a loop and back to a result byte.

Each `CALL` pushes one return address on the stack. The counted loops otherwise
map directly to the Z80 instructions in their bodies, with `CALL` and `RET`
providing entry and return.

---

## Interfaces exposed by integration

Putting the routines together exposes the register interface at each call. The
`;` comment above `FIND_MAX` says what the routine reads, returns and clobbers.
The assembler treats that comment as text, so the caller remains responsible
for loading the declared registers and the routine for honouring its claims. A
mismatch assembles and produces the wrong result at run time. Chapter 11
develops a consistent register and stack convention for these comments.

`CNTABOVE` keeps its running count in D, and D is the only name that count
has while the routine runs. Chapter 11 concentrates on this interface
boundary: which registers carry arguments and results, which side saves a live
value and how every return path keeps the stack balanced.

The `CP C` / `JR C` / `JR Z` sequence in `CNTABOVE` implements "strictly
greater than" in three instructions. Keeping the instructions visible makes
the flag dependency explicit at each use.

Every byte in this program is a standalone variable. Grouping related bytes
into records requires each field access to carry its numeric offset: for
example, `XOFF EQU 0`, `YOFF EQU 1` and `COLOFF EQU 2`.

---

## Exercise

**A `FIND_MAX` trace.** Every row of this table should be completed for the
chapter's eight-byte input, including the carry result from `CP C`.

| Iteration | C (current) | A before `CP` | Carry set? | Update A? | A after |
| --------- | ----------- | ------------- | ---------- | --------- | ------- |
| 1         | 23          | 0             | ?          | ?         | ?       |
| 2         | 47          | ?             | ?          | ?         | ?       |
| 3         | 91          | ?             | ?          | ?         | ?       |
| 4         | 5           | ?             | ?          | ?         | ?       |
| 5         | 67          | ?             | ?          | ?         | ?       |
| 6         | 12          | ?             | ?          | ?         | ?       |
| 7         | 88          | ?             | ?          | ?         | ?       |
| 8         | 34          | ?             | ?          | ?         | ?       |

The final line should give A, B and HL on return and the byte stored in
`MAX_VAL`.

[Exercise notes](exercise-notes.md#chapter-10-a-complete-program)
