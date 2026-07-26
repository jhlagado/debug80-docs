---
layout: default
title: "Assembly Language"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 3
---
[← Machine Code](02-machine-code.md) | [Book 2](index.md) | [Memory Access and Data →](04-memory-access-and-data.md)

# Chapter 3 — Assembly Language

The CPU still runs the same machine code, but you get readable instruction names, names for addresses and a source file you can actually inspect without decoding hex in your head.

---

## A First Program

Here is the same add-5-and-3 program from Chapter 2, rewritten in assembly:

```asm
.org $0000
main:
  ld a, 5
  ld b, a
  ld a, 3
  add a, b
  ld (result), a
  halt

.org $8000
result: .db 0
```

The five instructions in the body of `main` are the same five operations you already saw in Chapter 2.

`.org $0000` tells the assembler: everything from here assembles starting at address `$0000`. `main:` is a label. The assembler records it as the current address, so `main` refers to `$0000`. `halt` stops the CPU. `.org $8000` starts a new block at `$8000`. `result:` is another label, and `.db 0` places one byte with value 0 at the current address, so `result` refers to `$8000`.

`ld a, 5` loads 5 into A. `ld b, a` copies A into B. `ld a, 3` replaces A with 3. `add a, b` adds B (still 5) to A (now 3), leaving 8 in A.

`ld (result), a` stores A into the byte named `result`. The parentheses mean "memory at the address of `result`."

---

## What AZM adds — and what it doesn't

You just saw two constructs in that program that are not Z80 instructions: `.org` and `.db`. These are assembler directives.

**Standard directives** are not AZM inventions. `.org` places code and data at specific addresses, `.equ` names a compile-time constant, `.db`, `.dw` and `.ds` define storage, and `.include` splits a program across files. You will find all of them in a Z80 reference and in other assemblers, usually spelled without the leading dot. AZM writes them with a dot, and that is the spelling this book uses throughout.

**AZM adds** the following on top:

- **`op`**: defines an inline instruction sequence that expands at each call site, with no call overhead
- **`type` / `union`**: named record layouts with scalar types (`byte`, `word`, `addr`); `sizeof` and `offset` compute byte sizes and field positions as compile-time constants; `.ds` accepts type expressions such as `.ds Sprite[16]`
- **`enum`**: named sets of values with no memory allocated
- **register contracts**: formal `.routine` register contracts on subroutines, verified by the assembler
- **string directives**: `.cstr`, `.pstr` and `.istr` emit a string with a chosen termination

AZM does **not** add function declarations, local variables, structured control-flow keywords or typed assignment operators. Other languages call a named block of reusable code a function; in AZM it is a subroutine built from `call` and `ret`.

---

## Placing code and data with `.org`

A Z80 program still has to respect the memory map from Chapter 1. Code has to land somewhere executable. Variables have to live somewhere writable.

```asm
.org $0000
main:
  ; ... code here ...
  halt

.org $8000
count:   .db 0
scratch: .dw 0
```

The assembler emits each block where `.org` directs, not in the order the blocks appear in the file.

---

## The `ld` Instruction

`ld` copies a value from a source to a destination:

```
ld destination, source
```

The source stays as it was and the flags register is untouched.

A source can be a register, an immediate constant encoded directly in the instruction or a byte in memory. A destination can be a register or a byte in memory.

---

> **The Parentheses Rule: memorise this before reading further**
>
> **Parentheses always mean "go to this address in memory."**
>
> `ld a, b` copies register B into A, no memory involved.
> `ld a, (hl)` reads the *byte at the address held in HL* from memory.
>
> Missing or adding parentheses writes a completely different instruction,
> one the assembler will happily accept, silently doing the wrong thing.

---

The Z80 implements specific pairings of source and destination types; not all combinations are legal. Chapter 4 covers the memory access forms and the complete LD forms table.

### 8-bit register to register

You can copy any of A, B, C, D, E, H and L into any other:

```asm
ld a, b     ; A = B
ld d, h     ; D = H
ld l, c     ; L = C
ld a, a     ; legal, pointless
```

### Immediate constant into register

Any 8-bit register takes an immediate byte (0–255). Any 16-bit register pair takes a 16-bit constant:

```asm
ld a, 42        ; A = 42
ld b, $FF       ; B = 255
ld hl, $8000    ; HL = $8000
ld ix, $4000    ; IX = $4000
```

---

## Constants

A **constant** is a name for a fixed value that has no address of its own:

```asm
MaxCount .equ 10
BaseAddr .equ $8000
```

Wherever you write the name, the assembler substitutes the value. `ld a, MaxCount` becomes `ld a, 10`. `ld hl, BaseAddr` becomes `ld hl, $8000`. Constants produce no bytes in the output and occupy no memory at run time.

The difference between a constant and a label: a constant is a value you write down (`10`, `$8000`). A label is an address the assembler computes from where things end up in the output.

---

## Named Storage

Named storage looks like this:

```asm
.org $8000
count:   .db 0
scratch: .dw 0
```

`count` starts at `$8000`. `scratch` follows immediately at `$8001`, because `count` is one byte wide. Since `scratch` is a word, it occupies two bytes: `$8001` and `$8002`. Change `count` to a word later and every address below it shifts without touching the code that accesses them.

`.db` (define byte) places one byte at the current address. `.dw` (define word) places two bytes in little-endian order. The number that follows is the initial value.

You access named storage with parentheses, the same notation you use for any memory address:

```asm
ld a, (count)         ; A = byte at address of count
ld (count), a         ; byte at address of count = A
```

The parentheses mean the same thing everywhere:

| Notation | Meaning |
|----------|---------|
| `ld a, (hl)` | Read byte at the address in HL |
| `ld a, (count)` | Read byte at the address of `count` |
| `ld a, ($8000)` | Read byte at address `$8000` |

Chapter 4 covers word-size access (`ld hl, (scratch)`) and the full set of memory addressing forms.

---

## ADD, INC and DEC

`add a, b` adds B to A and **writes the result back into A**. If you need A's original value later, copy it to another register before the `add`.

`inc r` adds 1 to register r; `dec r` subtracts 1. Both modify the register in place and update the flags. `dec` sets the Zero flag when the result reaches zero, which Chapters 5 and 6 put to use.

---

## The Examples

Two example files accompany this chapter.

### `00_first_program.asm`

The addition program from the beginning of this chapter: load two values, add them, store the result to a named variable.

### `01_register_moves.asm`

```asm
.org $0000
main:
  ld a, $FF
  ld b, $10
  ld c, $20
  ld d, a
  ld e, b
  ld hl, $1234
  ld de, $5678
  ld bc, $0064
  ld d, h
  ld e, l
  halt
```

`ld a, $FF` loads 255 into A (an immediate load, the value encoded directly in the instruction bytes). `ld d, a` copies A into D, a register-to-register move, no memory involved.

`ld hl, $1234` loads a 16-bit immediate into HL: H gets `$12`, L gets `$34`. The instruction encodes as three bytes: the opcode, then the value in little-endian order (`$34` then `$12`).

`ld de, $5678` overwrites both D and E. The `$FF` that was in D from the earlier copy is gone.

The final two instructions, `ld d, h` and `ld e, l`, copy HL into DE one byte at a time. After both, DE holds `$1234`. There is no single instruction that copies one register pair into another; you always do it as two 8-bit moves. `ex de, hl` swaps the two register pairs in one instruction, and Chapter 7 introduces it when both HL and DE are in use as pointers.

Example `02_constants_and_labels.asm` demonstrates word-size memory access and is walked through in Chapter 4.

---

## When Your Program Does the Wrong Thing

Assembly gives you no runtime errors, no stack traces and no error messages.

### Step 1: Read the assembler listing

From a terminal, run `azm your-file.asm`; AZM writes a `.lst` by default unless you pass `--nolist`. In VS Code with Debug80, start a debug session (**F5**); the target's `outputDir` receives a `.lst` (and related artifacts) you can open alongside the source. The listing shows each source line alongside the hex bytes it generated and the address where they were placed. Before running a program, glance at the listing and confirm:

- Did every instruction assemble without an error or warning?
- Is the data section placed where you intended? (`count` at `$8000`, `scratch` at `$8001`?)
- Does the entry point (`main`) start at `$0000`, or wherever your memory map expects it?

A misplaced `.org` is one of the most common sources of programs that compile cleanly and then do nothing sensible at all.

### Step 2: Use the emulator's step mode

Every Z80 emulator has a way to single-step: execute one instruction and pause. Before each step, ask yourself: *what should this instruction do to which register?* After the step, check whether the register holds what you expected.

If a register has the wrong value after an instruction, you have found the exact point of failure. Now ask why: was the source register already wrong before this instruction?

### Step 3: Watch the flags

After any instruction that modifies flags (`add`, `sub`, `cp`, `and`, `or`, `xor`, `inc`, `dec`), check what the flags register actually contains in the emulator's register display. A jump that branches the wrong way almost always traces back to a flag that was set differently than you thought.

Apply the flag-before-branch check from Chapter 5 when this happens: identify which instruction set the flag, then verify nothing between that instruction and the jump changed it.

### Step 4: Check memory after the program halts

Most Z80 emulators let you inspect any memory address after execution. When a program stores a result to a named variable, halt execution and look at the address where that variable lives. If the value is correct but the program still behaves unexpectedly, the problem may be in how the result is being used later.

For the examples in this chapter: after `00_first_program.asm` runs, address `$8000` should hold `$08`.

---

## Exercises

**1. Register trace.** Step through this sequence in your head and write down the value in each register after every instruction executes:

```asm
ld a, $10
ld b, a
ld a, $06
add a, b
ld c, a
```

When you reach the end: what is in A? B? C? Has anything changed in HL? Now assemble the snippet (add `.org $0000`, a `main:` label, a `halt` and a `.org $8000` data block for any storage you need) and confirm in the emulator.

**2. Copy HL into DE, without using `ld de, hl`.** There is no single Z80 instruction that copies one 16-bit register pair directly into another. Write the two `ld` instructions needed to move the value in HL into DE using only 8-bit register moves. Then write a second version that achieves the same result using the stack (`push` / `pop`), a technique you will meet formally in Chapter 8.

**3. Constants versus labels.** Given this program fragment:

```asm
BASE .equ $8000

.org $8000
count: .db 0
```

Explain the difference between `BASE` and `count` in terms of what each name means to the assembler and what code they produce. Which one occupies a byte in the output binary? Which one is zero bytes in the output?

**4. `dec` and the Zero flag.** Starting with `ld b, 3`, execute `dec b` three times in a row. Write down the value in B after each `dec`. After which `dec` instruction is the Zero flag set? (Chapter 6 will use this exact mechanism to build counted loops.)

---

[← Machine Code](02-machine-code.md) | [Book 2](index.md) | [Memory Access and Data →](04-memory-access-and-data.md)
