---
layout: default
title: "Exercise Notes"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 99
---

# Exercise Notes

These notes provide the expected result for each chapter exercise.
## Chapter 1: The Computer

### Parts of the system

| Action | Active parts | Data transfer | Address selection |
| ------ | ------------ | ------------- | ----------------- |
| Fetch opcode at `$0120` | CPU and memory | Opcode byte from memory to CPU | `$0120` selects a memory byte |
| Read RAM at `$8004` | CPU and memory | Stored byte from RAM to CPU | `$8004` selects a memory byte |
| Write `$3C` to port `$10` | CPU and I/O | `$3C` from CPU to peripheral | Low address byte `$10` selects the port |
| Add B to A | CPU | B and A are used internally; the result returns to A | No external address is selected during the arithmetic operation |

Instruction fetches still use memory even when the operation itself, such as
`ADD A, B`, works entirely inside the CPU.

## Chapter 2: Machine Code

### Decode a byte stream

| Address | Bytes | Instruction |
| ------- | ----- | ----------- |
| `$0000` | `3E 12` | `LD A, $12` |
| `$0002` | `47` | `LD B, A` |
| `$0003` | `3E 05` | `LD A, $05` |
| `$0005` | `80` | `ADD A, B` |
| `$0006` | `32 10 80` | `LD ($8010), A` |
| `$0009` | `76` | `HALT` |

The final A is `$17`, B is `$12`, and `$8010` contains `$17`.

## Chapter 3: Assembly Language

### Register trace

| Instruction completed | A | B | C |
| --------------------- | - | - | - |
| `LD A, $10` | `$10` | unchanged | unchanged |
| `LD B, A` | `$10` | `$10` | unchanged |
| `LD A, $06` | `$06` | `$10` | unchanged |
| `ADD A, B` | `$16` | `$10` | unchanged |
| `LD C, A` | `$16` | `$10` | `$16` |

No instruction in the sequence refers to HL, so HL retains its incoming value.

## Chapter 4: Memory Access and Data

### Memory form identification

| Instruction | LD form | Memory action | Address source |
| ----------- | ------- | ------------- | -------------- |
| `LD A, (HL)` | reg8 ← (HL) | Read one byte | HL |
| `LD (HL), B` | (HL) ← reg8 | Write one byte | HL |
| `LD A, (BC)` | A ← (BC) | Read one byte | BC |
| `LD ($8010), A` | (nn) ← A | Write one byte | Fixed address `$8010` |
| `LD DE, ($8020)` | reg16 ← (nn) | Read two bytes | Fixed address `$8020` |

The final form reads the low byte from `$8020` and the high byte from `$8021`.

## Chapter 5: Flags, Comparisons and Jumps

### Flag prediction

| Sequence | Final A | Z | C |
| -------- | ------- | - | - |
| `LD A,5 / CP 5` | 5 | Set | Clear |
| `LD A,5 / CP 6` | 5 | Clear | Set |
| `LD A,5 / CP 3` | 5 | Clear | Clear |
| `LD A,0 / XOR A` | 0 | Set | Clear |
| Previous sequence followed by `DEC A` | `$FF` | Clear | Clear |

`CP` preserves A. `DEC` changes Z but leaves the carry state supplied by
`XOR A`.

## Chapter 6: Counting Loops and DJNZ

### The zero-count case

| Runtime count | Iterations | Final B | Final byte counter |
| ------------- | ---------- | ------- | ------------------ |
| 0 | 256 | 0 | 0 after wrapping through 256 increments |
| 1 | 1 | 0 | 1 |
| 255 | 255 | 0 | 255 |

The guard tests A before copying it to B. A zero result branches around the
body; a non-zero result loads B and enters the loop. The test cases should then
produce 0, 1 and 255 iterations.

## Chapter 7: Data Tables and Indexed Access

### Address, value and final pointer

`LD HL, SCORES` loads `$8000`; `LD A, (SCORES)` loads 10 (`$0A`). Six
increments leave HL at `$8006`. The next byte is `$01`, the first byte of
`RECORDS`, and is outside `SCORES`.

## Chapter 8: Stack and Subroutines

### Stack trace

| Instruction | SP afterward | Stack transfer |
| ----------- | ------------ | -------------- |
| `PUSH AF` | `$BFFE` | `$34` to `$BFFE`, `$12` to `$BFFF` |
| `PUSH BC` | `$BFFC` | `$78` to `$BFFC`, `$56` to `$BFFD` |
| `POP DE` | `$BFFE` | DE receives `$5678` |
| `POP HL` | `$C000` | HL receives `$1234` |

The final values are DE = `$5678`, HL = `$1234` and SP = `$C000`.

## Chapter 9: I/O and Ports

### Flag behaviour of `IN`

The immediate form needs an explicit test:

```asm
IN A, (IN_PORT)
OR A
JR Z, IS_ZERO
```

Starting with Z clear and carry set, the immediate read leaves both flags
unchanged. Reading `$00` therefore leaves Z clear and carry set until `OR A`
sets Z and clears carry. Reading `$80` also leaves the initial flags after
`IN`; `OR A` leaves Z clear and clears carry.

The register-addressed form can branch directly:

```asm
IN A, (C)
JR Z, IS_ZERO
```

Reading `$00` sets Z; reading `$80` clears Z. The carry flag remains set in
both tests because `IN R, (C)` preserves it.

## Chapter 10: A Complete Program

### A `FIND_MAX` trace

| Iteration | C | A before `CP` | Carry | Update | A after |
| --------- | - | ------------- | ----- | ------ | ------- |
| 1 | 23 | 0 | Set | Yes | 23 |
| 2 | 47 | 23 | Set | Yes | 47 |
| 3 | 91 | 47 | Set | Yes | 91 |
| 4 | 5 | 91 | Clear | No | 91 |
| 5 | 67 | 91 | Clear | No | 91 |
| 6 | 12 | 91 | Clear | No | 91 |
| 7 | 88 | 91 | Clear | No | 91 |
| 8 | 34 | 91 | Clear | No | 91 |

The routine returns A = 91, B = 0 and HL = `$8008`. `MAX_VAL` receives 91
(`$5B`).

## Chapter 11: Subroutine Conventions

### Push/pop order

The matching epilogue is:

```asm
POP AF
POP HL
POP BC
```

It restores AF = `$3344`, HL = `$2222`, BC = `$1111` and SP = `$C000`.
Using `POP BC / POP HL / POP AF` also balances SP, but produces BC = `$3344`,
HL = `$2222` and AF = `$1111`.

## Chapter 12: Arithmetic Routines

### Power trace

The three calls to `MUL8AC` receive A/C pairs 1/2, 2/2 and 4/2. E becomes 2,
4 and 8 after those calls. B begins at 3 and reaches zero before `.DONE`
returns A = 8.

## Chapter 13: Sorting and Searching

### Search limits

With `LIMIT EQU 8`, `FINDGE` stops at index 6, where the sorted byte is 8.
With `LIMIT EQU 10`, every byte is smaller than the limit and the routine
returns `$FF`.

## Chapter 14: Strings

### Missing character and capacity

Searching `"HELLO"` for `'Z'` returns `$FF`. A five-byte `BUFFER` receives the
five letters at `$8006` through `$800A`, then the copied terminator overwrites
the following byte at `$800B`.

## Chapter 15: Bit Patterns and Packed Flags

### A fourth flag

Bit 7 has mask `%10000000`, or `$80`. `OR $80` sets it. Combined with the final
`FLAGS` value `$03`, the result is `$83`.

## Chapter 16: Recursion

### Factorial stack

For `FACTN EQU 3`, the deepest call begins with three saved BC words and four
return addresses on the stack: 14 bytes in total. The return path multiplies
1 × 1, then 1 × 2, then 2 × 3, producing 6.
