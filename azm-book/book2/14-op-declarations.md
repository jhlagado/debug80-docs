---
layout: default
title: "Op Declarations"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 14
---
[← Layout Types](13-layout-types.md) | [Book 2](index.md)

# Chapter 14 — Op Declarations

The Z80 instruction set has gaps. `ld de, hl` does not exist, so copying HL
into DE requires two separate byte moves. Testing whether A is strictly greater
than a threshold takes a `cp` and two conditional jumps. Zeroing a register
pair means loading the immediate zero, not using a dedicated clear instruction.

The sequence `cp c / jr c, _skip / jr z, _skip` does not state "skip unless A
is strictly above C." A reader must derive that condition from three separate
instructions.

`op` is the AZM mechanism for naming a short instruction sequence and placing it inline at every call site.

---

## Op declarations

Every op invocation is a separate copy of the body in the binary. That copy is exactly what a reader would see in a disassembly listing.

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

Empty parentheses `()` are required for a no-parameter op declaration. The call, however, omits them: `clear_a`, not `clear_a()`.

---

## Parameterized ops

A parameter has a name and a matcher type that constrains what the call site may supply.

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

A stack-based swap is useful, but a generic `reg16` version would also accept
SP, which cannot be used with `push` or `pop`. Define the supported pair
explicitly:

```asm
op swap_hl_de()
  push hl
  push de
  pop hl
  pop de
end
```

Calling `swap_hl_de` emits:

```asm
  push hl
  push de
  pop hl
  pop de
```

After the expansion, HL holds the original value of DE and DE holds the original value of HL.

---

## All matcher types

| Matcher | Matches at the call site |
|---------|--------------------------|
| `reg8`  | Any 8-bit register: A, B, C, D, E, H, L |
| `reg16` | Any of BC, DE, HL or SP; the op body must still use instructions legal for the matched pair |
| `imm8`  | A known one-byte constant: unsigned 0–255 or signed −128–127; an unresolved expression also passes initial matching |
| `imm16` | A known two-byte constant: unsigned 0–65,535 or signed −32,768–32,767; an unresolved expression also passes initial matching |
| `idx16` | An IX/IY indexed memory operand such as `(ix+1)`, not bare IX or IY |
| `ea`    | An effective-address expression: a label, field path or address constant |
| `mem8`  | A parenthesized memory operand used by an op as byte-wide |
| `mem16` | A parenthesized memory operand used by an op as word-wide |
| `cc`    | A Z80 condition code: Z, NZ, C, NC, M, P, PE, PO |

`mem8` and `mem16` both match the memory operand shapes `(hl)`, `(label)` and
indexed forms such as `(ix+1)`. The matcher records the width intended by the
op author; the expanded instruction must still support that operand and width.
Both matchers include the parentheses in substitution. An op with `src mem8`
that writes `ld a, src` expands `(hl)` to `ld a, (hl)`.

A symbol whose value is not yet resolved can match `imm8`, `imm16` and `ea`.
When otherwise identical `imm8` and `imm16` overloads both match, AZM prefers
`imm8`; the expanded instruction still determines whether the final value can
be encoded. Known numeric constants are matched against the separate signed and
unsigned ranges shown in the table.

`ea` matches the address itself, without parentheses.

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

A `call` to a subroutine emits the `call` instruction (3 bytes), which pushes a 2-byte return address and jumps. The subroutine body runs, ending with `ret` (1 byte), which pops the return address and jumps back. Minimum overhead for a subroutine call: 4 bytes of instructions and 2 bytes of stack.

An op call emits the body instructions directly. No `call`, no `ret`, no stack push or pop.

For a body of N instructions used at K call sites, count the static instruction
encodings in the binary:

- **Subroutine**: N body instructions once, one `ret`, and K `call`
  instructions = N + 1 + K.
- **Op**: N instructions at each of K call sites = N × K instructions total.

At K = 1, the op avoids both `call` and `ret`. At K = 2, the subroutine uses
fewer instruction encodings when N is greater than 3; both forms use six when
N is 3.

This count compares instruction encodings, not bytes: Z80 instructions vary
from one to four bytes. At run time, each subroutine invocation also executes
one `call` and one `ret`; an op executes only its expanded body.

The decision rule: if the body is short enough that the call overhead is a significant fraction of the work being done, use an op. If the body is long enough that call overhead is negligible and if the subroutine is called from enough places that the single copy saves meaningful space, use a subroutine.

---

## Pseudo-opcodes: filling Z80 instruction gaps

Programs can fill recurring Z80 instruction gaps with named ops. These
pseudo-opcodes look like instructions in AZM source, but the Z80 has no
corresponding opcode.

The most common gap is 16-bit register copies. Copying DE into HL requires two 8-bit loads:

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

A generic `reg16` parameter does not expose the high and low halves of the
matched pair. A true 16-bit copy therefore cannot derive `d` and `e` from a
generic destination or `h` and `l` from a generic source. Define the supported
pairings explicitly:

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

## Ops in listings and register analysis

When you run `azm source.asm`, AZM writes a `.lst` file by default. The listing
keeps the op invocation as the source line and associates the bytes emitted by
its expansion with that line. It does not replace the invocation with a printed
copy of the op body.

For `count_above` from Chapter 10, if the strictly-above check were wrapped in an op:

```asm
op jr_if_not_above(threshold reg8, skip_label imm16)
  cp threshold
  jr c, skip_label
  jr z, skip_label
end
```

At an invocation such as `jr_if_not_above C, _skip`, the emitted bytes still
come from these three expanded instructions:

```asm
  cp c
  jr c, _skip
  jr z, _skip
```

The register contract analyzer sees those expanded instructions even though the
listing retains the invocation text. An op has no call boundary and no contract
of its own.

---

## A worked example: naming the strictly-above check

`count_above` from Chapter 10 used this pattern, with its labels spelled out in full to test whether A is strictly greater than C:

```asm
  cp c
  jr c, _skip     ; A < C: skip
  jr z, _skip     ; A = C: skip
```

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
.routine in HL,B,C out A clobbers B,HL,F
count_above:
  push de
  ld d, 0
_loop:
  ld a, (hl)
  jr_if_not_above C, _skip    ; expands to three instructions
  inc d
_skip:
  inc hl
  djnz _loop
  ld a, d
  pop de
  ret
```

The call site now reads: if A is not above C, skip to `_skip`.

Compare the two versions side by side:

**Original:**
```asm
  ld a, (hl)
  cp c
  jr c, _skip
  jr z, _skip
  inc d
_skip:
```

**With op:**
```asm
  ld a, (hl)
  jr_if_not_above C, _skip
  inc d
_skip:
```

The machine output is identical.

---

## Exercises

**1. Write an op.** The two-instruction sequence `ld a, r / or a` establishes
Z from a register's value. Define `test_reg` with a `reg8` parameter, invoke it
once for each loop below and show the two instructions produced by each
expansion:

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

**2. Op vs subroutine size.** A reusable body contains 5 instructions and
appears at 4 call sites. A subroutine stores the body once, one `ret`, and one
`call` at each site. An op copies the 5 instructions at every site.

- (a) How many instruction encodings does the binary contain with a subroutine?
- (b) How many if you use an op?
- (c) With four sites, what is the smallest whole-number body length for which
  the subroutine uses fewer instruction encodings?

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

**4. Identify the matcher types.** For each operand at the following call sites,
state every matcher it satisfies among `reg8`, `reg16`, `imm8`, `imm16`, `ea`,
`mem8`, `mem16` and `cc`:

```asm
  my_op HL            ; (a)
  my_op 42            ; (b)
  my_op $FFFF         ; (c)
  my_op (my_var)      ; (d)
  my_op NZ            ; (e)
  my_op my_label      ; (f)
```

---

## Book 2 complete

You can now:

- write a complete AZM program with subroutines, loops, conditional branches and data tables
- apply push/pop discipline to protect callers from register clobbering
- document subroutine interfaces with register contracts and verify them with register contract analysis
- define named record types, reserve storage with `.ds TypeExpr` and compute sizes and offsets at assembly time rather than by hand
- name repeated instruction sequences with ops and read code that communicates intent rather than mechanics alone

Book 3 covers arrays and runtime indexing, string handling, recursion, multi-file programs and patterns for larger programs that exceed what a single file can hold clearly.

---

[← Layout Types](13-layout-types.md) | [Book 2](index.md)
