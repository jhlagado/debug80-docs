---
layout: default
title: "Subroutine Conventions"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 11
---

# Subroutine Conventions

Chapter 10 showed how data moves through a complete program. This chapter
concentrates on the rules at each call boundary. `find_max` receives HL and B,
while `count_above` receives HL, B and C. Both return A. The comment above
`count_above` lists D as clobbered because its running counter remains in D on
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
declared outputs and every register named in `Clobbers` are caller-save at that
call boundary. An input register is also caller-save when the contract says the
routine consumes or clobbers it. The caller must save any incoming value that it
still needs after the call.

**Callee-save registers** are the ones whose incoming values survive the call:
every register the contract leaves out of its outputs and clobbers. A routine
that uses one internally restores it before returning. This is the convention
used in this chapter, not a fixed property of BC, DE, HL, IX or IY themselves.

The mechanism is push and pop:

```asm
my_routine:
  push bc
  push de
  ; ... body that uses BC and DE internally ...
  pop de
  pop bc
  ret
```

The stack is LIFO (last in, first out), so the last saved value must be removed
first. Popping into the wrong pairs restores the values to different registers.

![Which side is responsible for which register. The contract decides this, not the register.](../../assets/images/azm-book/book2/caller-callee-save.svg)

Chapter 10's `find_max` borrows C as a temporary, so it clobbers a register that
is not one of its inputs. Comparing against `(hl)` directly removes that
temporary and leaves only HL, B and A, which already serve as inputs or output.
`count_above` needs D for its running count throughout the loop, so it preserves
the caller's whole DE pair with `push de` and `pop de`.

```asm
count_above:
  push de            ; save caller's DE (D used internally as counter)
  ld d, 0            ; D = running count
CountAboveLoop:
  ld a, (hl)
  cp c
  jr c, CountAboveSkip   ; A < threshold: skip
  jr z, CountAboveSkip   ; A = threshold: skip (strictly above only)
  inc d
CountAboveSkip:
  inc hl
  djnz CountAboveLoop
  ld a, d            ; return count in A
  pop de             ; restore caller's DE
  ret
```

The pop must appear on every return path. Missing it leaves the saved word at
the top of the stack, so `ret` uses that word as its destination.

---

## The IX frame for local storage

When a subroutine needs more temporary values than the registers can hold, it
can allocate local storage on the stack.

The technique uses IX as a base pointer into the stack.

The prologue establishes the frame:

```asm
my_routine:
  push ix            ; save caller's IX
  ld ix, 0
  add ix, sp         ; IX now points to the frame base (top of stack)
```

Two bookkeeping entries are on the stack already, and any arguments the caller pushed before the `call` sit above them:

![The frame IX points into. Arguments and bookkeeping sit at positive displacements, locals at negative ones.](../../assets/images/azm-book/book2/ix-frame.svg)

IX+0 and IX+1 hold the saved IX and IX+2 and IX+3 hold the return address, so caller arguments start at IX+4 and locals sit below IX+0.

Local storage decrements SP once for each required byte:

```asm
  dec sp
  dec sp             ; allocate 2 bytes of local storage
```

The two bytes are now at IX−1 and IX−2, where indexed addressing reaches them:

```asm
  ld (ix-1), a       ; write first local
  ld a, (ix-2)       ; read second local
```

The epilogue undoes both steps and restores IX for the caller:

```asm
  ld sp, ix          ; restore SP to frame base (discards locals)
  pop ix             ; restore caller's IX
  ret
```

The `ld sp, ix` line removes all local storage in one instruction, regardless of how many bytes were allocated.

A caution: the index displacement in `(ix+d)` is a signed 8-bit value. For locals, d is negative (−1 through −128). For caller-pushed args, d is positive (4 through 127). The maximum frame size is 128 bytes of locals and 124 bytes of arguments.

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
find_max:
  ld a, 0
FindMaxLoop:
  cp (hl)
  jr nc, FindMaxSkip
  ld a, (hl)
FindMaxSkip:
  inc hl
  djnz FindMaxLoop
  ret
```

`Clobbers` lists every register the routine may leave changed.

The comment block for `count_above` with push/pop discipline:

```asm
; count_above: count bytes in a table that are strictly above a threshold
; In:  HL = pointer to first byte of table
;      B  = number of bytes to scan
;      C  = threshold value
; Out: A  = count of bytes where (byte > threshold)
; Clobbers: B (reaches 0), F, HL (advances past last byte)
; Preserves: C, D, E (DE saved via push/pop)
count_above:
  push de
  ld d, 0
CountAboveLoop:
  ld a, (hl)
  cp c
  jr c, CountAboveSkip
  jr z, CountAboveSkip
  inc d
CountAboveSkip:
  inc hl
  djnz CountAboveLoop
  ld a, d
  pop de
  ret
```

`Preserves` lists registers the subroutine explicitly restores.

The caller and routine uphold these comments by convention. A mismatch shows
up at runtime, sometimes far from its origin.

[Book 1 Chapter 6](../book1/06-register-contracts.md) covers what AZM provides beyond comments: a structured declaration syntax that the register contract analyzer can read and verify.

---

## Conventions applied to both routines

The two Chapter 10 subroutines now follow the same convention. Their comment
blocks describe the call boundary, while their bodies preserve every register
that the contract promises to preserve.

```asm
; find_max: scan a byte table and return the largest value
; In:  HL = pointer to first byte
;      B  = count (number of bytes to scan)
; Out: A  = maximum value found
; Clobbers: B (reaches 0 after djnz), F, HL (points past last byte)
; Preserves: C, D, E, IX, IY
find_max:
  ld a, 0
FindMaxLoop:
  cp (hl)
  jr nc, FindMaxSkip
  ld a, (hl)
FindMaxSkip:
  inc hl
  djnz FindMaxLoop
  ret
```

`find_max` uses only its input registers and A, which is why its body has no push/pop at all.

```asm
; count_above: count bytes in a table strictly above a threshold
; In:  HL = pointer to first byte
;      B  = count (number of bytes to scan)
;      C  = threshold value (bytes must be strictly greater to count)
; Out: A  = number of bytes where byte > threshold
; Clobbers: B (reaches 0 after djnz), F, HL (points past last byte)
; Preserves: C, D, E (DE saved via push/pop)
count_above:
  push de            ; D used as counter; save caller's DE
  ld d, 0
CountAboveLoop:
  ld a, (hl)
  cp c               ; compare byte against threshold
  jr c, CountAboveSkip   ; A < C: skip (carry set = unsigned less-than)
  jr z, CountAboveSkip   ; A = C: skip (zero set = equal, not above)
  inc d                  ; A > C: increment counter
CountAboveSkip:
  inc hl
  djnz CountAboveLoop
  ld a, d            ; move count from D into A for return
  pop de             ; restore caller's DE before returning
  ret
```

The main sequence that calls both:

```asm
main:
  ld hl, values
  ld b, 8
  call find_max
  ld (max_val), a

  ld hl, values      ; reload HL - find_max walked it to the end
  ld b, 8            ; reload B - find_max consumed it
  ld c, 64
  call count_above
  ld (above_64), a
  halt
```

A caller that needs HL or B after `find_max` returns has to reload them.

---

## Exercises

**1. Push/pop order.** A subroutine has this entry sequence:

```asm
  push bc
  push hl
  push af
```

LIFO order determines the matching three-pop epilogue. Tracing the values when
the pop order is reversed shows which register receives each saved pair.

**2. Registers that need saving.** A subroutine receives HL as an input table
pointer and B as a byte count. Internally, it uses C and D as scratch and E as a
second counter. Classifying the inputs and internal registers determines which
pairs need push/pop discipline and produces matching entry and exit sequences.

**3. An IX frame.** A prologue and epilogue that allocate four bytes of local
storage place them at `(ix-1)` through `(ix-4)`. Storing 42 in the first local
and reading it back into A demonstrates that IX remains a stable base while SP
moves.

**4. A missing pop.** The following subroutine has a return path that misses a pop:

```asm
sum_bytes:
  push bc
  ld c, 0            ; C = running sum
SumBytesLoop:
  ld a, (hl)
  add a, c
  ld c, a
  inc hl
  djnz SumBytesLoop
  ld a, c
  pop bc
  ret
```

If `b` is loaded with 0 before the call, `djnz` executes 256 times (the Z80's zero-count behaviour). A separate error path may instead return early when a zero byte is found:

```asm
  ld a, (hl)
  or a
  jr z, SumEarlyExit ; found zero, abort
  add a, c
  ld c, a
  inc hl
  djnz SumBytesLoop
  ld a, c
  pop bc
  ret
SumEarlyExit:
  ld a, 0
  ret                ; BUG: missing pop
```

Tracing the early exit accounts for both the caller's BC and the word left on
the stack. The corrected path restores BC before returning.

---

## From machine rules to assembler checks

Book 2 ends with the rules that routines and callers must uphold in plain Z80
assembly: arguments and results occupy agreed registers, preserved values are
restored and every path reaches `ret` with a balanced stack. A comment records
that agreement for callers.

AZM can check the same interface and can name a record layout or instruction
idiom once instead of repeating its details at each use. Those assembler
features are covered in Book 1:

- [Chapter 5, The Layout System](../book1/05-layout-system.md), for record types, `sizeof`, `offset` and cast paths in place of hand-counted byte offsets
- [Chapter 6, Register Contracts](../book1/06-register-contracts.md), for `.routine` and the analysis that turns a comment block into something the assembler proves
- [Chapter 7, Ops, Aliases and Source Composition](../book1/07-ops-aliases.md), for `op` declarations and for building one program out of several files

[Book 3](../book3/index.md) covers arrays and runtime indexing, string handling, recursion, multi-file programs and patterns for programs that outgrow a single file.
