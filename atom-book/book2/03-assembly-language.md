---
layout: default
title: "Assembly Language"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 3
---

# Assembly Language

Assembly language gives machine instructions readable names and gives memory
addresses labels. The assembler translates that source into the same bytes the
CPU executes.

---

## A First Program

Here is the same add-5-and-3 program from Chapter 2, rewritten in assembly:

```asm
ORG $0000
MAIN:
  LD A, 5
  LD B, A
  LD A, 3
  ADD A, B
  LD (RESULT), A
  HALT

ORG $8000
RESULT: DB 0
```

The six instructions in the body of `MAIN` are the same six operations you
already saw in Chapter 2.

`ORG $0000` tells the assembler: everything from here assembles starting at address `$0000`. `MAIN:` is a label. The assembler records it as the current address, so `MAIN` refers to `$0000`. `HALT` stops the CPU. `ORG $8000` starts a new block at `$8000`. `RESULT:` is another label, and `DB 0` places one byte with value 0 at the current address, so `RESULT` refers to `$8000`.

`LD A, 5` loads 5 into A. `LD B, A` copies A into B. `LD A, 3` replaces A with 3. `ADD A, B` adds B (still 5) to A (now 3), leaving 8 in A.

`LD (RESULT), A` stores A into the byte named `RESULT`. The parentheses mean "memory at the address of `RESULT`."

![The assembly beside the bytes it produces. A label lets the assembler supply the address.](../../assets/images/atom-book/book2/source-and-bytes.svg)

---

## Instructions and directives

Two constructs in that program are directives to the assembler rather than instructions to the CPU: `ORG` and `DB`.

**Assembler directives** do their work while Atom builds the output. `ORG`
places code and data at specific addresses, `EQU` names a compile-time
constant, and `DB`, `DW` and `DS` define storage. `CSTR`, `PSTR` and `ISTR`
emit strings with a null terminator, length prefix or high-bit terminator.

Atom also has a preprocessing stage. A leading `%INCLUDE` names another source
file, while `%IF`, `%ELSE` and `%ENDIF` select which source is assembled. Book 1
defines the distinction between preprocessor directives and assembler
directives.

Directives produce bytes, reserve addresses or guide the build. Instructions
such as `LD`, `ADD`, `CALL` and `RET` become operations executed by the Z80.

---

## Placing code and data with `ORG`

A Z80 program still has to respect the memory map from Chapter 1. Code has to land somewhere executable. Variables have to live somewhere writable.

```asm
ORG $0000
MAIN:
  ; ... code here ...
  HALT

ORG $8000
COUNT:   DB 0
SCRATCH: DW 0
```

The assembler emits each block where `ORG` directs, not in the order the blocks appear in the file.

---

## The `LD` Instruction

`LD` copies a value from a source to a destination:

```
ld destination, source
```

The source stays as it was and the flags register is untouched.

A source can be a register, an immediate constant encoded directly in the instruction or a byte in memory. A destination can be a register or a byte in memory.

---

> **Parentheses in `LD` memory operands**
>
> In the `LD` forms used here, parentheses mean "use memory at this address."
>
> `LD A, B` copies register B into A, no memory involved.
> `LD A, (HL)` reads the *byte at the address held in HL* from memory.
>
> Adding or removing parentheses may select a different legal instruction, so
> the operand form is worth checking whenever memory is involved. Other
> instructions use parentheses for indirect jump targets and I/O ports.

---

The Z80 implements specific pairings of source and destination types. Chapter 4 covers the memory access forms and the complete LD forms table.

### 8-bit register to register

You can copy any of A, B, C, D, E, H and L into any other:

```asm
LD A, B     ; A = B
LD D, H     ; D = H
LD L, C     ; L = C
LD A, A     ; legal, pointless
```

### Immediate constant into register

Any 8-bit register takes a one-byte immediate from 0 to 255. A 16-bit register
pair takes a two-byte immediate from -32,768 to 65,535; negative values use
their two's-complement word representation.

```asm
LD A, 42        ; A = 42
LD B, $FF       ; B = 255
LD HL, $8000    ; HL = $8000
LD IX, $4000    ; IX = $4000
```

---

## Constants

A **constant** is a name the assembler substitutes for a fixed value:

```asm
MAXCOUNT EQU 10
BASEADDR EQU $8000
```

Wherever you write the name, the assembler substitutes the value. `LD A, MAXCOUNT` becomes `LD A, 10`. `LD HL, BASEADDR` becomes `LD HL, $8000`. A constant lives entirely at assembly time; its value ends up inside the instructions that use it.

The difference between a constant and a label: a constant is a value you write down (`10`, `$8000`). A label is an address the assembler computes from where things end up in the output.

### Private labels

A period begins a private label. Its scope runs from the preceding global label
to the next global label:

```asm
COUNTDOWN:
.LOOP:
  DEC A
  JR NZ,.LOOP
  RET
```

Another routine may declare its own `.LOOP` without a collision. Atom associates
each private name with its owning global scope. The period is part of the source
name and does not count toward the eight significant characters allowed after
it.

---

## Named Storage

Named storage looks like this:

```asm
ORG $8000
COUNT:   DB 0
SCRATCH: DW 0
```

`COUNT` starts at `$8000`. `SCRATCH` follows immediately at `$8001`, because `COUNT` is one byte wide. Since `SCRATCH` is a word, it occupies two bytes: `$8001` and `$8002`. If `COUNT` later becomes a word, every label after it moves up by one byte and the code that reads or writes them keeps working as written.

`DB` (define byte) places one byte at the current address. `DW` (define word) places two bytes in little-endian order. The number that follows is the initial value.

You access named storage with parentheses, the same notation you use for any memory address:

```asm
LD A, (COUNT)         ; A = byte at address of count
LD (COUNT), A         ; byte at address of count = A
```

The parentheses mean the same thing everywhere:

| Notation | Meaning |
|----------|---------|
| `LD A, (HL)` | Read byte at the address in HL |
| `LD A, (COUNT)` | Read byte at the address of `COUNT` |
| `LD A, ($8000)` | Read byte at address `$8000` |

Chapter 4 covers word-size access (`LD HL, (SCRATCH)`) and the full set of memory addressing forms.

---

## ADD, INC and DEC

`ADD A, B` adds B to A and **writes the result back into A**. If you need A's original value later, copy it to another register before the `ADD`.

`INC R` adds 1 to register r; `DEC R` subtracts 1. Both modify the register in place and update the flags. `DEC` sets the Zero flag when the result reaches zero, which Chapters 5 and 6 put to use.

---

## Worked examples

Two short programs apply the instructions introduced so far.

### First program

The addition program from the beginning of this chapter: load two values, add them, store the result to a named variable.

### Register moves

```asm
ORG $0000
MAIN:
  LD A, $FF
  LD B, $10
  LD C, $20
  LD D, A
  LD E, B
  LD HL, $1234
  LD DE, $5678
  LD BC, $0064
  LD D, H
  LD E, L
  HALT
```

`LD A, $FF` loads 255 into A (an immediate load, the value encoded directly in the instruction bytes). `LD D, A` copies A into D, a register-to-register move, no memory involved.

`LD HL, $1234` loads a 16-bit immediate into HL: H gets `$12`, L gets `$34`. The instruction encodes as three bytes: the opcode, then the value in little-endian order (`$34` then `$12`).

`LD DE, $5678` overwrites both D and E. The `$FF` that was in D from the earlier copy is gone.

The final two instructions, `LD D, H` and `LD E, L`, copy HL into DE one byte
at a time. After both, DE holds `$1234`. There is no `LD DE, HL` instruction.
A direct copy using `LD` therefore takes two 8-bit moves. Chapter 8 shows a
stack-based transfer, while `EX DE, HL` exchanges rather than copies the pairs.

The next chapter adds constants, labels and word-size memory access.

---

## Debugging a Wrong Result

A wrong result in assembly surfaces as a wrong byte in a register or in memory, and finding its cause means reading the listing, stepping the program and watching the flags.

### Step 1: The assembler listing

From a terminal, `atom your-file.asm` publishes a `.lst` inside the build's
`current` generation. In VS Code with Debug80, **Run and Debug** starts the
selected target. Its output directory receives the listing and related
artifacts that can be opened alongside the source. The listing shows each source line with its
output bytes and address. Before execution, it can confirm:

- Did the assembler report an error?
- Is the data section placed where you intended? (`COUNT` at `$8000`, `SCRATCH` at `$8001`?)
- Does the entry point (`MAIN`) start at `$0000`, or wherever your memory map expects it?

A misplaced `ORG` is one of the most common reasons a program assembles cleanly and then runs the wrong bytes.

### Step 2: The emulator's step mode

Debug80 and most Z80 emulators can execute one instruction and pause. Predicting
the register or memory location that should change before each step provides a
specific result to compare with the state after the step.

If a register first acquires the wrong value after one instruction, inspect
that instruction's source operand and the value it held before the step.

### Step 3: Flag state

After an instruction that modifies flags (`ADD`, `SUB`, `CP`, `AND`, `OR`,
`XOR`, `INC`, `DEC`), the emulator's register display shows the resulting flag
state. A jump that takes the wrong path often reads a flag set by an earlier
instruction than the branch was intended to test.

The flag-before-branch check from Chapter 5 identifies which instruction set the flag and whether anything before the jump changed it.

### Step 4: Memory after the program halts

Most Z80 emulators expose any memory address after execution. When a program stores a result to a named variable, the address of that variable shows whether the store succeeded. If the value is correct but the program still behaves unexpectedly, the problem may be in how the result is used later.

After the first program runs, address `$8000` should hold `$08`.

---

## Exercise

**Register trace.** A trace table should give A, B and C after each
instruction and state whether any instruction changes HL.

```asm
LD A, $10
LD B, A
LD A, $06
ADD A, B
LD C, A
```

A complete test program with `ORG`, `MAIN:` and `HALT` allows the final
emulator state to be compared with the trace.

[Exercise notes](exercise-notes.md#chapter-3-assembly-language)
