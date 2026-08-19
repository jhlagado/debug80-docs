---
layout: default
title: "Stack and Subroutines"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 8
---

# Stack and Subroutines

Larger programs need to reuse logic (the same comparison, the same output routine, the same byte-copying sequence) called from a dozen different places.

---

## Subroutines

`CALL` and `RET` are the Z80's entire subroutine mechanism. The CPU stays in the same mode throughout, the bytes of a subroutine body are ordinary instructions like any others, and the stack is the only record of how deep the calls have gone.

---

## The `CALL` instruction

`CALL LABEL` is a push of the return address followed by a jump, two operations in one opcode. Concretely:

1. Pushes the address of the instruction following the `CALL` onto the hardware stack (this is the **return address**).
2. Jumps to `LABEL`.

The instruction is always 3 bytes long.

The hardware stack is a region of RAM used as a last-in-first-out buffer. When `CALL` pushes a word onto the stack, SP decreases by two (the stack grows downward in memory on the Z80). The return address is stored at the new SP.

---

## The `RET` instruction

`RET` is equivalent to `POP PC`, if such an instruction existed. The CPU reads the top two bytes of the stack into the program counter, increments SP by two and execution resumes at the instruction after the original `CALL`.

![call is a push and a jump; ret is the pop that undoes it.](../../assets/images/atom-book/book2/call-and-ret.svg)

---

## The hardware stack

The program determines where the stack lives by loading SP with a starting address before any `CALL`, `PUSH` or `POP` instruction. A common choice is the top of available RAM: `LD SP, $BFFF` (or whichever address marks the last byte of RAM on the target).

Each push decreases SP by two and writes a 16-bit value. Each pop reads two bytes and increases SP by two.

![The stack grows toward lower addresses: each push decreases SP by two.](../../assets/images/atom-book/book2/stack-grows-down.svg)

---

## Passing values through registers

A calling convention on the Z80 is an agreement between a routine and its callers, kept by the code on both sides. The conventions used in these chapters are:

- **A** carries a single byte result or input value.
- **HL** carries a 16-bit result or input value.
- **BC** and **DE** carry secondary input values.

The comment header records which registers a subroutine reads on entry and
which it modifies on exit. This record is the contract between the subroutine
and its caller.

```asm
; ADDBYTES: add two byte values.
; In:  B = first byte, C = second byte
; Out: A = B + C
; Preserves: BC, DE, HL
; Clobbers: F
ADDBYTES:
  LD A, B
  ADD A, C
  RET
```

`PRESERVES` means those registers hold the same values after the call that they held before. `CLOBBERS` names the registers the routine may leave holding something else.

Every subroutine in Atom is a plain label followed by instructions, ending with `RET`. If you forget `RET`, control falls through into whatever bytes follow the last instruction, which is almost always wrong.

---

## `PUSH` and `POP`: saving and restoring registers

`PUSH HL`: SP is decremented by two, then the contents of HL are written to the two bytes at the new SP address, as if `LD (SP), HL` were an instruction.

`POP HL` is the inverse: two bytes are read from the address in SP into HL, then SP is incremented by two, as if `LD HL, (SP)` were an instruction.

The operand can be any of AF, BC, DE, HL, IX or IY.

A subroutine uses `PUSH` / `POP` to preserve registers it needs to modify internally. The pattern:

```asm
EXAMPLE:
  PUSH BC          ; save caller's BC on entry
  ; ... use BC for internal work ...
  POP BC           ; restore caller's BC before returning
  RET
```

The critical rule is that SP must have the same value at `RET` that it had
immediately after the corresponding `CALL`, unless the routine deliberately
implements a different calling convention. A pushed word may be popped into a
different register, but every path to `RET` must remove all temporary stack
entries. Otherwise `RET` reads a temporary value as its return address.

### Cross-register moves through the stack

You can push one pair and pop into a different pair: the stack holds two bytes, and the `POP` decides where they land. That gives a route between any two register pairs:

```asm
  PUSH AF         ; save AF onto the stack
  PUSH BC         ; save BC onto the stack
  POP DE          ; DE <- what was in BC
  POP HL          ; HL <- what was in AF
```

The second transfer (AF into HL) is particularly useful. The stack is the one route out of F: `PUSH AF` puts the flags byte in memory, and any `POP` can collect it.

If you swap the pop order above, DE gets AF and HL gets BC, the reverse of what a top-to-bottom reading suggests.

![A push and its pop can name different pairs, which is the only route to F. SP ends where it started.](../../assets/images/atom-book/book2/cross-register-move.svg)

---

## Shadow registers: saving state with `EXX`

In a tight interrupt handler or innermost loop, saving BC, DE and HL via `PUSH` and `POP` costs six instructions (three pushes, three pops) and takes six bytes of stack space. `EXX` does the same job in a single instruction: it swaps BC, DE and HL with a second hidden set of registers (BC′, DE′, HL′) simultaneously. A second instruction, `EX AF, AF′`, swaps A and F with their shadow counterparts.

These are the **shadow registers**: a second, hidden copy of A, F, B, C, D, E, H and L. `EXX` and `EX AF, AF′` are the only way in: a shadow value has to be swapped into the main set before an instruction can use it.

The trade-off is that there is only one shadow set. If both the main code and an interrupt handler rely on `EXX`, the interrupt can silently destroy the values stored by the main code. Shadow registers are therefore suitable only when speed matters and one context has exclusive use of them.

---

## Conditional return: `RET CC`

The Z80 also provides conditional return instructions: `RET Z`, `RET NZ`, `RET C`, `RET NC` and so on. `RET Z` pops the return address and returns only if Z is set; otherwise it falls through to the next instruction.

This is useful for early-exit patterns:

```asm
CHKNZERO:
  OR A          ; test A for zero
  RET Z         ; return immediately if A is zero
  ; ... rest of the subroutine runs only when A != 0 ...
  RET
```

When using `RET CC`, the stack must be balanced at the conditional return point just as it must be at the final return.

---

## Nested calls and stack depth

A subroutine can itself call another subroutine. Each `CALL` pushes another return address; each `RET` pops one.

The only limit is the size of the RAM region allocated to the stack. Excessive call depth or a missing pop before return overwrites RAM used for other purposes.

![Return addresses pushed on the way in, popped on the way out. SP is the only measure of depth.](../../assets/images/atom-book/book2/nested-calls.svg)

---

## Worked example

```asm
ORG $8000
RESADD: DB 0
RESMAX: DW 0
```

The program has a `MAIN` entry point and two helper subroutines.

**`ADDBYTES`: the simplest subroutine.**

```asm
; ADDBYTES: add two byte values.
; In:  B = first byte, C = second byte
; Out: A = B + C
; Preserves: BC, DE, HL
; Clobbers: F
ADDBYTES:
  LD A, B
  ADD A, C
  RET
```

The subroutine modifies only A, so BC, DE and HL are naturally preserved. The caller passes 20 in B and 10 in C:

```asm
  LD B, $14
  LD C, $0A
  CALL ADDBYTES        ; A = 30
  LD (RESADD), A
```

After the call, `RESADD` holds 30 (`$1E`).

**`MAX_WORD`: push/pop for preservation.**

```asm
; max_word: return the larger of two 16-bit values.
; In:  HL = first value, DE = second value
; Out: HL = larger value
; Preserves: DE
; Clobbers: F
MAX_WORD:
  PUSH DE
  OR A
  SBC HL, DE
  JR C, .MAXISDE
  ADD HL, DE
  POP DE
  RET                ; HL held the original (larger) value
.MAXISDE:
  POP HL             ; saved DE is the larger value; DE itself is unchanged
  RET
```

`OR A` and `SBC HL, DE` modify F; the comment header documents this.

The `OR A` before `SBC HL, DE` clears the carry flag. `SBC HL, DE` subtracts DE from HL including the carry bit, so carry must be clear before the instruction for a pure 16-bit subtraction.

After `SBC HL, DE`, the carry flag indicates the comparison result:

- **Carry clear**: HL was greater than or equal to DE (no unsigned borrow). HL
  now holds `ORIGINAL_HL - DE`. `ADD HL, DE` restores the original HL, and
  `POP DE` removes the saved word while restoring DE.
- **Carry set**: HL was less than DE (unsigned borrow occurred). The saved DE
  value is the larger word. `POP HL` loads that saved value directly into HL.
  DE still holds its incoming value, so the declared preservation holds.

The `OR A / SBC HL, DE` pair performs an unsigned 16-bit comparison. Each path
then obtains the required result while consuming the saved stack word.

The caller passes 80 (`$0050`) in HL and 200 (`$00C8`) in DE:

```asm
  LD HL, $0050
  LD DE, $00C8
  CALL MAX_WORD         ; HL = $00C8
  LD (RESMAX), HL
```

After the call, `RESMAX` holds 200.

**Stack balance in `MAX_WORD`.** The subroutine pushes one word. The
carry-clear path removes it with `POP DE`; the carry-set path removes it with
`POP HL`. Both paths reach `RET` with the temporary word gone and DE unchanged.

---

## An advanced trick: reading the program counter

`CALL` pushes the address of the next instruction onto the stack, which allows
code to obtain the current PC:

```asm
  CALL NEXTINS       ; pushes address of NEXTINS onto the stack
NEXTINS:
  POP HL                ; HL = address of this instruction
```

`CALL NEXTINS` targets the instruction immediately after the call, so its
only useful effect here is pushing that instruction's address. `POP HL`
retrieves the address of `NEXTINS`.

Balance is all the stack requires: `CALL` pushed one word and `POP HL` consumed it, so execution carries straight on into the next instruction.

---

## Exercise

**Stack trace.** With SP = `$C000`, AF = `$1234` and BC = `$5678`, a
four-instruction trace should give SP and the two bytes written or read at each
step, followed by final DE, HL and SP.

```asm
PUSH AF
PUSH BC
POP DE
POP HL
```

[Exercise notes](exercise-notes.md#chapter-8-stack-and-subroutines)
