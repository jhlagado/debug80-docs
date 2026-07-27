---
layout: default
title: "Stack and Subroutines"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 8
---

# Chapter 8 — Stack and Subroutines

Larger programs need to reuse logic (the same comparison, the same output routine, the same byte-copying sequence) called from a dozen different places.

`call` and `ret` solve this.

---

## Subroutines

The Z80 has no hardware concept of a subroutine beyond `call` and `ret`. There is no special mode the CPU enters, no register tracking call depth, no difference between bytes at a call site and bytes inside a subroutine body.

---

## The `call` instruction

`call label` is a push of the return address followed by a jump, two operations in one opcode. Concretely:

1. Pushes the address of the instruction following the `call` onto the hardware stack (this is the **return address**).
2. Jumps to `label`.

The instruction is always 3 bytes long.

The hardware stack is a region of RAM used as a last-in-first-out buffer. When `call` pushes a word onto the stack, SP decreases by two (the stack grows downward in memory on the Z80). The return address is stored at the new SP.

---

## The `ret` instruction

`ret` is equivalent to `pop pc`, if such an instruction existed. The CPU reads the top two bytes of the stack into the program counter, increments SP by two and execution resumes at the instruction after the original `call`.

![call is a push and a jump; ret is the pop that undoes it.](../../assets/images/azm-book/book2/call-and-ret.svg)

---

## The hardware stack

The program determines where the stack lives by loading SP with a starting address before any `call`, `push` or `pop` instruction. A common choice is the top of available RAM: `ld sp, $BFFF` (or whichever address marks the last byte of RAM on the target).

Each push decreases SP by two and writes a 16-bit value. Each pop reads two bytes and increases SP by two.

![The stack runs downward from wherever you point SP. Beginners reliably assume the opposite.](../../assets/images/azm-book/book2/stack-grows-down.svg)

---

## Passing values through registers

The Z80 has no hardware-enforced calling convention. The conventions used in these chapters are:

- **A** carries a single byte result or input value.
- **HL** carries a 16-bit result or input value.
- **BC** and **DE** carry secondary input values.

Every subroutine should document which registers it reads on entry and which it modifies on exit. The comment header is the contract between the subroutine and its caller.

```asm
; add_bytes: add two byte values.
; In:  B = first byte, C = second byte
; Out: A = B + C
; Preserves: BC, DE, HL
; Clobbers: F
add_bytes:
  ld a, b
  add a, c
  ret
```

`Preserves` means those registers hold the same values after the call that they held before. `Clobbers` means the caller must not rely on those registers after the call.

Every subroutine in AZM is a plain label followed by instructions, ending with `ret`. If you forget `ret`, control falls through into whatever bytes follow the last instruction, which is almost always wrong.

---

## `push` and `pop`: saving and restoring registers

`push hl`: SP is decremented by two, then the contents of HL are written to the two bytes at the new SP address, as if `ld (sp), hl` were an instruction.

`pop hl` is the inverse: two bytes are read from the address in SP into HL, then SP is incremented by two, as if `ld hl, (sp)` were an instruction.

The operand can be any of AF, BC, DE, HL, IX or IY.

A subroutine uses `push` / `pop` to preserve registers it needs to modify internally. The pattern:

```asm
example:
  push bc          ; save caller's BC on entry
  ; ... use BC for internal work ...
  pop bc           ; restore caller's BC before returning
  ret
```

The critical rule is that SP must have the same value at `ret` that it had
immediately after the corresponding `call`, unless the routine deliberately
implements a different calling convention. A pushed word may be popped into a
different register, but every path to `ret` must remove all temporary stack
entries. Otherwise `ret` reads a temporary value as its return address.

### Cross-register moves through the stack

You can push one pair and pop into a different pair, since the stack has no memory of which register supplied the bytes it holds. This lets you perform register transfers that `ld` cannot express:

```asm
  push af         ; save AF onto the stack
  push bc         ; save BC onto the stack
  pop de          ; DE ← what was in BC
  pop hl          ; HL ← what was in AF
```

The second transfer (AF into HL) is particularly useful, because there is no `ld l, f` instruction. The flags register F cannot appear in any `ld` combination.

If you swap the pop order above, DE gets AF and HL gets BC, the reverse of what you might expect if you read the code top-to-bottom without thinking about the stack.

![A push and its pop can name different pairs, which is the only route to F. SP ends where it started.](../../assets/images/azm-book/book2/cross-register-move.svg)

---

## Shadow registers: saving state without the stack

In a tight interrupt handler or innermost loop, saving BC, DE and HL via `push` and `pop` costs six instructions (three pushes, three pops) and takes six bytes of stack space. `exx` does the same job in a single instruction: it swaps BC, DE and HL with a second hidden set of registers (BC′, DE′, HL′) simultaneously. A second instruction, `ex af, af′`, swaps A and F with their shadow counterparts.

These are the **shadow registers**: a second, hidden copy of A, F, B, C, D, E, H and L. You cannot use them directly in instructions; `exx` and `ex af, af′` are the only way in.

The trade-off is that there is only one shadow set. If both the main code and an interrupt handler rely on `exx`, the interrupt can silently destroy the values stored by the main code. Shadow registers are therefore suitable only when speed matters and one context has exclusive use of them.

---

## Conditional return: `ret cc`

The Z80 also provides conditional return instructions: `ret z`, `ret nz`, `ret c`, `ret nc` and so on. `ret z` pops the return address and returns only if Z is set; otherwise it falls through to the next instruction.

This is useful for early-exit patterns:

```asm
check_nonzero:
  or a          ; test A for zero
  ret z         ; return immediately if A is zero
  ; ... rest of the subroutine runs only when A != 0 ...
  ret
```

When using `ret cc`, the stack must be balanced at the conditional return point just as it must be at the final return.

---

## Nested calls and stack depth

A subroutine can itself call another subroutine. Each `call` pushes another return address; each `ret` pops one.

The only limit is the size of the RAM region allocated to the stack. A program that calls too many levels deep, or forgets to pop before returning, will overwrite RAM used for other purposes.

![Return addresses pushed on the way in, popped on the way out. No register records how deep you are.](../../assets/images/azm-book/book2/nested-calls.svg)

---

## The example: `learning/book2/examples/06_subroutines.asm`

```asm
.org $8000
result_add: .db 0
result_max: .dw 0
```

The program has a `main` entry point and two helper subroutines.

**`add_bytes`: the simplest subroutine.**

```asm
; add_bytes: add two byte values.
; In:  B = first byte, C = second byte
; Out: A = B + C
; Preserves: BC, DE, HL
; Clobbers: F
add_bytes:
  ld a, b
  add a, c
  ret
```

The subroutine modifies only A, so BC, DE and HL are naturally preserved. The caller passes 20 in B and 10 in C:

```asm
  ld b, $14
  ld c, $0A
  call add_bytes        ; A = 30
  ld (result_add), a
```

After the call, `result_add` holds 30 (`$1E`).

**`max_word`: push/pop for preservation.**

```asm
; max_word: return the larger of two 16-bit values.
; In:  HL = first value, DE = second value
; Out: HL = larger value
; Preserves: DE
; Clobbers: F
max_word:
  push de
  or a
  sbc hl, de
  jr c, max_is_de
  add hl, de
  pop de
  ret                ; HL held the original (larger) value
max_is_de:
  pop hl             ; saved DE is the larger value; DE itself is unchanged
  ret
```

`or a` and `sbc hl, de` modify F; the comment header documents this.

The `or a` before `sbc hl, de` clears the carry flag. `sbc hl, de` subtracts DE from HL including the carry bit, so carry must be clear before the instruction for a pure 16-bit subtraction.

After `sbc hl, de`, the carry flag indicates the comparison result:

- **Carry clear**: HL was greater than or equal to DE (no unsigned borrow). HL
  now holds `original_HL - DE`. `add hl, de` restores the original HL, and
  `pop de` removes the saved word while restoring DE.
- **Carry set**: HL was less than DE (unsigned borrow occurred). The saved DE
  value is the larger word. `pop hl` loads that saved value directly into HL.
  DE was never modified, so the declared preservation still holds.

The `or a / sbc hl, de` pair performs an unsigned 16-bit comparison. Each path
then obtains the required result while consuming the saved stack word.

The caller passes 80 (`$0050`) in HL and 200 (`$00C8`) in DE:

```asm
  ld hl, $0050
  ld de, $00C8
  call max_word         ; HL = $00C8
  ld (result_max), hl
```

After the call, `result_max` holds 200.

**Stack balance in `max_word`.** The subroutine pushes one word. The
carry-clear path removes it with `pop de`; the carry-set path removes it with
`pop hl`. Both paths reach `ret` with the temporary word gone and DE unchanged.

---

## An advanced trick: reading the program counter

The Z80 has no instruction to read PC directly. But because `call` pushes the address of the next instruction onto the stack, you can read PC with a trick:

```asm
  call next_instr       ; pushes address of next_instr onto the stack
next_instr:
  pop hl                ; HL = address of this instruction
```

`call next_instr` targets the instruction immediately after the call, so its
only useful effect here is pushing that instruction's address. `pop hl`
retrieves the address of `next_instr`.

No `ret` appears here, and that is fine. The only thing the stack requires is balance: `call` pushed one word, `pop hl` consumed it.

---

## Port I/O in Chapter 9

Peripheral drivers often use the same subroutine structure: a documented
register interface, a body that accesses one device and a `ret`. Chapter 9
introduces the Z80 port instructions used by those drivers.

---

## Exercises

**1. Stack trace.** This exercise tracks the stack and register values through four instructions, starting with SP at `$C000`, AF at `$1234` and BC at `$5678`.

```asm
push af
push bc
pop de
pop hl
```

After all four instructions: what is in DE? What is in HL? What is SP? _(Remember: the stack is last-in-first-out: the pair pushed last is the first to be popped.)_

**2. The push/pop mismatch.** This subroutine has a stack-balance bug. The answer should identify it and explain precisely what happens when `ret` executes:

```asm
count_nonzero:
  push bc
  push de
  ld b, $08
  ld c, 0
count_loop:
  ld a, (hl)
  or a
  jr z, skip
  inc c
skip:
  inc hl
  djnz count_loop
  ld a, c
  pop bc
  ret
```

The answer also needs a corrected version.

**3. A byte-doubling subroutine.** The required `double_byte` subroutine receives a byte in B and returns B × 2 in A. Its comment header must document inputs, outputs and clobbered registers. Three lines in `main` then pass 15, call the subroutine and store the result in a variable named `doubled`.

**4. The `or a / sbc hl, de` pattern.** The explanation should cover what `or a` does to carry, why omitting it gives wrong results, and why `add hl, de` follows on the carry-clear path. It should also identify the value in HL after `sbc hl, de` on that path.
