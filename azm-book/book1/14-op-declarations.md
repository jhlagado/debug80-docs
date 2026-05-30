---
layout: default
title: "Chapter 14 — Op Declarations"
parent: "AZM Book 1 — Z80 Fundamentals"
nav_order: 14
---
[← Layout Types](13-layout-types.md) | [Book 1](index.md)

# Chapter 14 — Op Declarations

The Z80 instruction set has gaps. `ld hl, de` does not exist — copying HL into DE requires two separate byte moves. Testing whether A is strictly greater than a threshold takes a `cp` and two conditional jumps. Zeroing a register pair means loading the immediate zero, not a dedicated clear instruction.

These patterns appear constantly. None of them are complex. The problem is that writing `cp c / jr c, .skip / jr z, .skip` does not communicate "skip unless A is strictly above C" — it communicates three separate Z80 instructions that a reader must trace to understand the intent. The meaning is buried in the mechanics.

`op` is the AZM mechanism for naming a short instruction sequence and placing it inline at every call site. No `call`, no return address, no stack frame. The named sequence is pasted into the output as if you had written the instructions there yourself.

---

## Op declarations

An op declaration gives a name to an instruction sequence. At every call site, the assembler places the body of the op directly into the instruction stream — as if you had typed those instructions at that location. The call is textually replaced with the expansion.

This is not a subroutine call. A subroutine call emits `call target` at the call site, pushes a return address onto the stack, executes the body and returns with `ret`. An op call emits the body instructions directly. No `call`, no `ret`, no stack effect, no branch.

The machine code at a call site contains the expanded instructions, not a jump. Every op invocation is a separate copy of the body in the binary. That copy is exactly what a reader would see in a disassembly listing.

---

## Declaring an op

The simplest op has no parameters:

```asm
op clear_a()
  xor a
end
```

Calling it:

```asm
main:
  clear_a           ; assembler emits: xor a
  ret
```

The body is one instruction. `clear_a` expands to `xor a` at each call site. The call site is replaced with the expansion in the assembled output.

Empty parentheses `()` are required for a no-parameter op declaration. The call, however, omits them — `clear_a`, not `clear_a()`.

---

## Parameterized ops

Parameters let a single op declaration cover multiple operand variants. A parameter has a name and a matcher type that constrains what the call site may supply.

```asm
op load8(dst reg8, val imm8)
  ld dst, val
end
```

`dst reg8` matches any of the seven 8-bit registers: A, B, C, D, E, H, L. `val imm8` matches a compile-time constant that fits in one byte. The body substitutes the matched values at the call site:

```asm
  load8 A, 42       ; emits: ld a, 42
  load8 B, $FF      ; emits: ld b, $FF
  load8 C, 0        ; emits: ld c, 0
```

Each invocation emits exactly one `ld` instruction. The op is a named shorthand; the expansion is an ordinary Z80 load.

A more useful example: swap the contents of two register pairs through the stack.

```asm
op swap16(r1 reg16, r2 reg16)
  push r1
  push r2
  pop r1
  pop r2
end
```

`reg16` matches any of the four 16-bit register pairs: HL, DE, BC, SP. Calling `swap16 HL, DE` emits:

```asm
  push hl
  push de
  pop hl
  pop de
```

After the expansion, HL holds the original value of DE and DE holds the original value of HL. Four instructions, one named intent: swap.

---

## All matcher types

| Matcher | Matches at the call site |
|---------|--------------------------|
| `reg8`  | Any 8-bit register: A, B, C, D, E, H, L |
| `reg16` | Any 16-bit register pair: HL, DE, BC, SP |
| `imm8`  | A compile-time constant that fits in 8 bits (0–255) |
| `imm16` | A compile-time constant or label that fits in 16 bits |
| `ea`    | An effective address expression — a label, a field path or an address constant |
| `mem8`  | A byte-wide memory operand in parentheses: `(hl)`, `(my_var)` |
| `mem16` | A word-wide memory operand in parentheses |
| `cc`    | A Z80 condition code: Z, NZ, C, NC, M, P, PE, PO |

`mem8` and `mem16` include the parentheses in the substitution. An op with `src mem8` that writes `ld a, src` in its body expands `src` as `(hl)` when called with `(hl)` — the result is `ld a, (hl)`.

`ea` matches the address itself, without parentheses. An op that writes `ld hl, addr` in its body expands `addr` to the raw label or constant when called with an `ea` operand.

A condition-code parameter lets an op abstract over conditional branches:

```asm
op branch_if(cond cc, target imm16)
  jp cond, target
end

  branch_if Z, found        ; emits: jp z, found
  branch_if NC, no_carry    ; emits: jp nc, no_carry
```

When two overloads of the same op name have different parameter signatures, the assembler picks the most specific match. A fixed-register matcher (`A`, `HL`) is more specific than a class matcher (`reg8`, `reg16`). A smaller immediate matcher (`imm8`) is more specific than a wider one (`imm16`) for values that fit in the smaller range. An unresolvable tie is a compile error.

---

## Op vs subroutine

The cost difference is straightforward.

A `call` to a subroutine emits the `call` instruction (3 bytes), which pushes a 2-byte return address and jumps. The subroutine body runs, ending with `ret` (1 byte), which pops the return address and jumps back. Minimum overhead for a subroutine call: 4 bytes of instructions and 2 bytes of stack.

An op call emits the body instructions directly. No `call`, no `ret`, no stack push or pop. If the body is 2 instructions, the call site is 2 instructions.

For a body of N instructions called in K places:

- **Subroutine**: N instructions in memory once, plus K call/ret pairs = N + 2K instructions total.
- **Op**: N instructions at each of K call sites = N × K instructions total.

At K = 1, the op is smaller. At K = 2 and N > 4, the subroutine is smaller. For short bodies (2–3 instructions) called a handful of times, the op typically wins on code size. For longer bodies called from many places, the subroutine wins — the single copy pays for itself.

There is also an overhead threshold on the subroutine side. A subroutine with a 2-instruction body and a 2-instruction call/ret pair doubles the instruction count in the binary for every call site. Calling a 2-instruction subroutine costs as much as the subroutine itself. For sequences that short, the inline expansion is almost always correct.

The decision rule: if the body is short enough that the call overhead is a significant fraction of the work being done, use an op. If the body is long enough that call overhead is negligible and if the subroutine is called from enough places that the single copy saves meaningful space, use a subroutine.

---

## Pseudo-opcodes: filling Z80 instruction gaps

Some Z80 instruction gaps appear so often that the language fills them with named ops. These are called pseudo-opcodes — they look like instructions, but the Z80 CPU has no such opcode. The assembler expands each one to the actual instructions that achieve the same effect.

The most common gap is 16-bit register copies. The Z80 has no `ld hl, de` instruction. Copying DE into HL requires two 8-bit loads:

```asm
  ld h, d
  ld l, e
```

With a pseudo-opcode op:

```asm
op ld_hl_de()
  ld h, d
  ld l, e
end
```

Calling `ld_hl_de` is clearer than reading `ld h, d / ld l, e` and mentally assembling it into "copy DE into HL."

A general version using `reg16` parameters:

```asm
op copy16(dst reg16, src reg16)
  ; note: this only works correctly for certain
  ; dst/src combinations — see below
end
```

The general case is tricky because a `reg16` body can only emit generic instructions, and a true 16-bit register copy needs two instructions that name both halves of both pairs. In practice, specific pseudo-ops for each pair are cleaner:

```asm
op ld_hl_de()
  ld h, d
  ld l, e
end

op ld_de_hl()
  ld d, h
  ld e, l
end

op ld_bc_hl()
  ld b, h
  ld c, l
end
```

Zeroing a register pair is another gap. `ld hl, 0` exists, but the general form as a named op makes intent clear:

```asm
op clear16(r reg16)
  ld r, 0
end

  clear16 HL    ; emits: ld hl, 0
  clear16 BC    ; emits: ld bc, 0
  clear16 DE    ; emits: ld de, 0
```

---

## Op expansion is visible in the listing

When you run `azm source.asm`, AZM writes a `.lst` file by default. That listing shows the expanded instructions at each call site — not the op name. This is deliberate: the listing reflects the actual machine output.

For `count_above` from Chapter 10, if the strictly-above check were wrapped in an op:

```asm
op jr_if_not_above(threshold reg8, skip_label imm16)
  cp threshold
  jr c, skip_label
  jr z, skip_label
end
```

The listing at an invocation `jr_if_not_above C, .skip` shows:

```asm
  00: B9        cp c
  01: 38 06     jr c, .skip
  03: 28 04     jr z, .skip
```

The op name does not appear. The CPU only knows the expanded instructions. A reader with a listing or a disassembler sees those three instructions and can trace the logic directly.

This also means the register-care analyzer sees the expanded instructions. An op has no call boundary and no contract of its own. Whatever registers and flags the expansion touches are the registers and flags the caller's instruction stream touches — exactly as if you had written those instructions there.

---

## A worked example: naming the strictly-above check

`count_above` from Chapter 10 contained this pattern to test whether A is strictly greater than C:

```asm
  cp c
  jr c, .skip     ; A < C: skip
  jr z, .skip     ; A = C: skip
```

Three instructions, two conditional jumps, one intent: "if A is not above threshold, skip." A reader must decode the Z80 flag semantics to understand what the two jumps together mean.

Define an op that names the intent:

```asm
; jr_if_not_above: skip to label unless A is strictly above threshold
; Expands to: cp threshold / jr c, label / jr z, label
op jr_if_not_above(threshold reg8, skip_label imm16)
  cp threshold
  jr c, skip_label
  jr z, skip_label
end
```

The rewritten `count_above`:

```asm
;!      in        HL, B, C
;!      out       A
;!      clobbers  B, HL
@count_above:
  push de
  ld d, 0
CountAboveLoop:
  ld a, (hl)
  jr_if_not_above C, CountAboveSkip    ; expands to three instructions
  inc d
CountAboveSkip:
  inc hl
  djnz CountAboveLoop
  ld a, d
  pop de
  ret
```

The call site now reads: if A is not above C, skip to `CountAboveSkip`. The jump destination and the threshold both appear on the same line. The two-jump structure is an implementation detail of the Z80 flag set; the op name says what the code does.

Compare the two versions side by side:

**Original:**
```asm
  ld a, (hl)
  cp c
  jr c, CountAboveSkip
  jr z, CountAboveSkip
  inc d
CountAboveSkip:
```

**With op:**
```asm
  ld a, (hl)
  jr_if_not_above C, CountAboveSkip
  inc d
CountAboveSkip:
```

The machine output is identical. The listing shows the same three instructions at the `jr_if_not_above` site. The only difference is what the source communicates.

---

## Summary

- `op` defines an inline instruction expansion. The body is placed at each call site — no `call`, no `ret`, no stack push. The machine sees the expanded instructions.
- A no-parameter op uses `op name()` and is called without parentheses: `name`.
- Parameterized ops substitute matched operands into the body. Matcher types: `reg8` (A–L), `reg16` (HL/DE/BC/SP), `imm8` (8-bit immediate), `imm16` (16-bit immediate or label), `ea` (effective address), `mem8`/`mem16` (memory operand with parentheses), `cc` (condition code).
- Multiple overloads of the same op name are resolved by specificity. Fixed-register matchers beat class matchers; `imm8` beats `imm16` for small values.
- Use an op for short sequences where call overhead would be a significant fraction of the work. Use a subroutine when the body is long enough that a single copy saves meaningful space.
- The listing (`.lst`) shows expanded instructions at each call site, not the op name. The analyzer sees the expanded sequence.
- Pseudo-opcodes are ops that fill gaps in the Z80 instruction set: `ld hl, de` (two byte moves), `clear16 HL` (load immediate zero) and similar.

---

## Exercises

**1. Write an op.** The two-instruction sequence `ld a, r / or a` appears before every counted loop to establish the Z flag from a register's value. Define an op called `test_reg` with a `reg8` parameter that expands to this sequence. Then write the two lines needed before these loops:

```asm
  ; loop driven by B
  ; while NZ:
  ;   ... body ...
  ;   dec b

  ; loop driven by C
  ; while NZ:
  ;   ... body ...
  ;   dec c
```

Show the exact two instructions each invocation expands to.

**2. Op vs subroutine cost.** A subroutine body is 5 instructions. You call it from 4 places. A subroutine call adds 2 instructions of overhead (call + ret). An op call adds no overhead but copies the body at each site.

- (a) How many total instructions does the binary contain if you use a subroutine?
- (b) How many if you use an op?
- (c) At what body length does the op version and the subroutine version produce the same total instruction count, assuming 4 call sites?

**3. Overload resolution.** Given these two op declarations:

```asm
op load_a(src reg8)
  ld a, src
end

op load_a(src A)
  ; do nothing — A is already A
end
```

Which overload fires for each of these call sites? Explain why, using the specificity rule:

```asm
  load_a B
  load_a A
  load_a H
```

**4. Identify the matcher type.** For each operand at the following call sites, state which matcher type it satisfies and whether it would match `reg8`, `reg16`, `imm8`, `imm16`, `ea`, `mem8` or `cc`:

```asm
  my_op HL            ; (a)
  my_op 42            ; (b)
  my_op $FFFF         ; (c)
  my_op (my_var)      ; (d)
  my_op NZ            ; (e)
  my_op my_label      ; (f)
```

---

## Book 1 complete

You have reached the end of Book 1.

You can now:

- write a complete AZM program with subroutines, loops, conditional branches and data tables
- apply push/pop discipline to protect callers from register clobbering
- document subroutine interfaces with AZMDoc contracts and verify them with register-care analysis
- define named record types, reserve storage with `.ds TypeExpr` and compute sizes and offsets at assembly time rather than by hand
- name repeated instruction sequences with ops and read code that communicates intent rather than mechanics alone

Book 2 builds on all of this. It covers arrays and runtime indexing, string handling, recursion, multi-file programs and patterns for larger programs that exceed what a single file can hold clearly.

---

[← Layout Types](13-layout-types.md) | [Book 1](index.md)
