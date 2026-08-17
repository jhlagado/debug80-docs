---
layout: default
title: "Subroutine Conventions"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 11
---

# Subroutine Conventions

Chapter 10 showed how data moves through a complete program. This chapter
concentrates on the rules at each call boundary. `FIND_MAX` receives HL and B,
while `CNTABOVE` receives HL, B and C. Both return A. The comment above
`CNTABOVE` lists D as clobbered because its running counter remains in D on
return. Callers and later edits must follow that contract for the routines to
compose correctly.

---

## The register-passing convention

Programs may pass arguments in registers, on the stack or in fixed memory, and
the Z80 leaves the choice to the program. This book uses the following
register convention because it suits small routines and matches later examples:

- **HL** carries a 16-bit address or pointer: the start of a table, a buffer, a string.
- **BC** carries a 16-bit count or value, such as loop counts or word quantities.
- **B** alone carries an 8-bit count when only one is needed.
- **C** carries a single-byte argument when something other than the count is needed.
- **DE** carries a second address, most commonly a destination when HL is the source.
- **A** carries a single byte that needs a fast path: a byte value, a flag, a character.

Return values follow a matching convention:

- **A** carries a byte result.
- **HL** carries a 16-bit result: an address, a computed word.

These roles are conventions, not hardware rules. Following them consistently
makes call sites easier to read.

---

## Callee-save and caller-save registers

For each register, the contract determines whether its incoming value survives
the call.

**Caller-save registers** may be changed by the routine. In this book, A, F,
declared outputs and every register named in `CLOBBERS` are caller-save at that
call boundary. An input register is also caller-save when the contract says the
routine consumes or clobbers it. The caller must save any incoming value that it
still needs after the call.

**Callee-save registers** are the ones whose incoming values survive the call:
every register the contract leaves out of its outputs and clobbers. A routine
that uses one internally restores it before returning. This is the convention
used in this chapter, not a fixed property of BC, DE, HL, IX or IY themselves.

The mechanism is push and pop:

```asm
ROUTINE:
  PUSH BC
  PUSH DE
  ; ... body that uses BC and DE internally ...
  POP DE
  POP BC
  RET
```

The stack is LIFO (last in, first out), so the last saved value must be removed
first. Popping into the wrong pairs restores the values to different registers.

![Caller-save and callee-save responsibilities for registers at a call boundary.](../../assets/images/azm-book/book2/caller-callee-save.svg)

Chapter 10's `FIND_MAX` borrows C as a temporary, so it clobbers a register that
is not one of its inputs. Comparing against `(HL)` directly removes that
temporary and leaves only HL, B and A, which already serve as inputs or output.
`CNTABOVE` needs D for its running count throughout the loop, so it preserves
the caller's whole DE pair with `PUSH DE` and `POP DE`.

```asm
CNTABOVE:
  PUSH DE            ; save caller's DE (D used internally as counter)
  LD D, 0            ; D = running count
.CNTLOOP:
  LD A, (HL)
  CP C
  JR C, .CNTSKIP   ; A < threshold: skip
  JR Z, .CNTSKIP   ; A = threshold: skip (strictly above only)
  INC D
.CNTSKIP:
  INC HL
  DJNZ .CNTLOOP
  LD A, D            ; return count in A
  POP DE             ; restore caller's DE
  RET
```

The pop must appear on every return path. Missing it leaves the saved word at
the top of the stack, so `RET` uses that word as its destination.

---

## The IX frame for local storage

When a subroutine needs more temporary values than the registers can hold, it
can allocate local storage on the stack.

The technique uses IX as a base pointer into the stack.

The prologue establishes the frame:

```asm
ROUTINE:
  PUSH IX            ; save caller's IX
  LD IX, 0
  ADD IX, SP         ; IX now points to the frame base (top of stack)
```

Two bookkeeping entries are on the stack already, and any arguments the caller pushed before the `CALL` sit above them:

![The frame IX points into. Arguments and bookkeeping sit at positive displacements, locals at negative ones.](../../assets/images/azm-book/book2/ix-frame.svg)

IX+0 and IX+1 hold the saved IX and IX+2 and IX+3 hold the return address, so caller arguments start at IX+4 and locals sit below IX+0.

Local storage decrements SP once for each required byte:

```asm
  DEC SP
  DEC SP             ; allocate 2 bytes of local storage
```

The two bytes are now at IX−1 and IX−2, where indexed addressing reaches them:

```asm
  LD (IX-1), A       ; write first local
  LD A, (IX-2)       ; read second local
```

The epilogue undoes both steps and restores IX for the caller:

```asm
  LD SP, IX          ; restore SP to frame base (discards locals)
  POP IX             ; restore caller's IX
  RET
```

The `LD SP, IX` line removes all local storage in one instruction, regardless of how many bytes were allocated.

A caution: the index displacement in `(IX+D)` is a signed 8-bit value. For locals, d is negative (−1 through −128). For caller-pushed args, d is positive (4 through 127). The maximum frame size is 128 bytes of locals and 124 bytes of arguments.

---

## Register documentation

Plain assembly records a subroutine's register interface in a comment block
immediately before the label. The block declares every input, every output and
every register the subroutine leaves changed:

Here is that revised body, with the C temporary gone:

```asm
; find_max: scan a byte table and return the largest value
; In:  HL = pointer to first byte of table
;      B  = number of bytes to scan
; Out: A  = maximum value found
; Clobbers: B (reaches 0), F, HL (advances past last byte)
FIND_MAX:
  LD A, 0
.MAXLOOP:
  CP (HL)
  JR NC, .NOMAX
  LD A, (HL)
.NOMAX:
  INC HL
  DJNZ .MAXLOOP
  RET
```

`CLOBBERS` lists every register the routine may leave changed.

The comment block for `CNTABOVE` with push/pop discipline:

```asm
; CNTABOVE: count bytes in a table that are strictly above a threshold
; In:  HL = pointer to first byte of table
;      B  = number of bytes to scan
;      C  = threshold value
; Out: A  = count of bytes where byte > threshold
; Clobbers: B (reaches 0), F, HL (advances past last byte)
; Preserves: C, D, E (DE saved via push/pop)
CNTABOVE:
  PUSH DE
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
  POP DE
  RET
```

`PRESERVES` lists registers the subroutine explicitly restores.

The caller and routine uphold these comments by convention. A mismatch shows
up at runtime, sometimes far from its origin.

---

## Conventions applied to both routines

The two Chapter 10 subroutines now follow the same convention. Their comment
blocks describe the call boundary, while their bodies preserve every register
listed under `PRESERVES`.

```asm
; find_max: scan a byte table and return the largest value
; In:  HL = pointer to first byte
;      B  = count (number of bytes to scan)
; Out: A  = maximum value found
; Clobbers: B (reaches 0 after djnz), F, HL (points past last byte)
; Preserves: C, D, E, IX, IY
FIND_MAX:
  LD A, 0
.MAXLOOP:
  CP (HL)
  JR NC, .NOMAX
  LD A, (HL)
.NOMAX:
  INC HL
  DJNZ .MAXLOOP
  RET
```

`FIND_MAX` uses only its input registers and A, which is why its body has no push/pop at all.

```asm
; CNTABOVE: count bytes in a table strictly above a threshold
; In:  HL = pointer to first byte
;      B  = count (number of bytes to scan)
;      C  = threshold value (bytes must be strictly greater to count)
; Out: A  = number of bytes where byte > threshold
; Clobbers: B (reaches 0 after djnz), F, HL (points past last byte)
; Preserves: C, D, E (DE saved via push/pop)
CNTABOVE:
  PUSH DE            ; D used as counter; save caller's DE
  LD D, 0
.CNTLOOP:
  LD A, (HL)
  CP C               ; compare byte against threshold
  JR C, .CNTSKIP   ; A < C: skip (carry set = unsigned less-than)
  JR Z, .CNTSKIP   ; A = C: skip (zero set = equal, not above)
  INC D                  ; A > C: increment counter
.CNTSKIP:
  INC HL
  DJNZ .CNTLOOP
  LD A, D            ; move count from D into A for return
  POP DE             ; restore caller's DE before returning
  RET
```

The main sequence that calls both:

```asm
MAIN:
  LD HL, VALUES
  LD B, 8
  CALL FIND_MAX
  LD (MAX_VAL), A

  LD HL, VALUES      ; reload HL - find_max walked it to the end
  LD B, 8            ; reload B - find_max consumed it
  LD C, 64
  CALL CNTABOVE
  LD (ABOVE_64), A
  HALT
```

A caller that needs HL or B after `FIND_MAX` returns has to reload them.

## From machine rules to larger routines

The first half of Book 2 ends with the rules that routines and callers must uphold in plain Z80
assembly: arguments and results occupy agreed registers, preserved values are
restored and every path reaches `RET` with a balanced stack. A comment records
that agreement for callers.

The next five chapters keep these interfaces visible in comments and exercise
them in larger routines. Arithmetic introduces helper calls, sorting combines
nested loops with indexed storage, strings use pointer conventions and
recursion makes the stack budget part of routine design.

---

## Exercise

**Push/pop order.** With BC = `$1111`, HL = `$2222`, AF = `$3344` and SP =
`$C000`, these pushes establish the stack contents:

```asm
PUSH BC
PUSH HL
PUSH AF
```

The answer should supply the correct three-pop epilogue, restored registers and
SP. A second trace using `POP BC / POP HL / POP AF` should give the resulting
registers and explain why a balanced SP alone does not prove correct
restoration.

[Exercise notes](exercise-notes.md#chapter-11-subroutine-conventions)
