---
layout: default
title: "Subroutine Conventions"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 11
---

# Subroutine Conventions

Chapter 10's two subroutines worked. `find_max` received HL and B, while
`count_above` received HL, B and C. Both returned A. The comment above
`count_above` listed D as clobbered because its running counter remained in D
on return. That contract is useful only when every caller reads it and every
later edit keeps it accurate.

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

Chapter 10's `find_max` needs one change first: it borrows C as a temporary, so it clobbers a register that is not one of its inputs. Dropping the temporary and comparing against `(hl)` directly leaves HL, B and A, all inputs or outputs. `count_above` needs the other remedy, since D holds its running count for the whole loop.

The fix: push and pop DE around the body.

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

The only way to communicate a subroutine's register interface in plain assembly is a comment block.

The comment block lives immediately before the subroutine label and declares every input, every output and every register the subroutine leaves changed:

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

These comments bind only the people who read them. A mismatch shows up at runtime, sometimes far from its origin.

[Book 1 Chapter 6](../book1/06-register-contracts.md) covers what AZM provides beyond comments: a structured declaration syntax that the register contract analyzer can read and verify.

---

## A worked example: the complete pair

Here are both subroutines from Chapter 10 with full push/pop discipline and complete comment blocks.

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

The answer requires the matching three-pop epilogue and an explanation of what happens when the order is reversed.

**2. Registers that need saving.** A subroutine receives HL as an input table pointer and B as a byte count. Internally, it uses C and D as scratch and E as a second counter. The task is to determine which registers need push/pop discipline and provide the matching entry and exit sequences.

**3. An IX frame.** The required prologue and epilogue allocate four bytes of local storage at `(ix-1)` through `(ix-4)`. Two further instructions store 42 in the first local and read it back into A.

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

The explanation must account for the caller's BC and the stack when the early exit fires, followed by a corrected version.

---

## Book 2 complete

You can now:

- write a complete AZM program with subroutines, loops, conditional branches and data tables
- read and write Z80 instructions against the flags they set and the addressing modes they use
- apply push/pop discipline to protect callers from register clobbering
- document a subroutine interface as a comment block the next reader can rely on

The comment block is where this book stops. AZM can check the same interface itself, and it can name a record layout or an instruction idiom once instead of at every use. Those features belong to the assembler rather than to the machine, so they live in Book 1:

- [Chapter 5, The Layout System](../book1/05-layout-system.md), for record types, `sizeof`, `offset` and cast paths in place of hand-counted byte offsets
- [Chapter 6, Register Contracts](../book1/06-register-contracts.md), for `.routine` and the analysis that turns a comment block into something the assembler proves
- [Chapter 7, Ops, Aliases and Source Composition](../book1/07-ops-aliases.md), for `op` declarations, and for building one program out of several files

[Book 3](../book3/index.md) covers arrays and runtime indexing, string handling, recursion, multi-file programs and patterns for programs that outgrow a single file.
