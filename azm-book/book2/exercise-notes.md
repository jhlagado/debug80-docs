---
layout: default
title: "Exercise Notes"
parent: "AZM Book 2 — Z80 Fundamentals"
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
`add a, b`, works entirely inside the CPU.

## Chapter 2: Machine Code

### Decode a byte stream

| Address | Bytes | Instruction |
| ------- | ----- | ----------- |
| `$0000` | `3E 12` | `ld a, $12` |
| `$0002` | `47` | `ld b, a` |
| `$0003` | `3E 05` | `ld a, $05` |
| `$0005` | `80` | `add a, b` |
| `$0006` | `32 10 80` | `ld ($8010), a` |
| `$0009` | `76` | `halt` |

The final A is `$17`, B is `$12`, and `$8010` contains `$17`.

## Chapter 3: Assembly Language

### Register trace

| Instruction completed | A | B | C |
| --------------------- | - | - | - |
| `ld a, $10` | `$10` | unchanged | unchanged |
| `ld b, a` | `$10` | `$10` | unchanged |
| `ld a, $06` | `$06` | `$10` | unchanged |
| `add a, b` | `$16` | `$10` | unchanged |
| `ld c, a` | `$16` | `$10` | `$16` |

No instruction in the sequence refers to HL, so HL retains its incoming value.

## Chapter 4: Memory Access and Data

### Memory form identification

| Instruction | LD form | Memory action | Address source |
| ----------- | ------- | ------------- | -------------- |
| `ld a, (hl)` | reg8 ← (HL) | Read one byte | HL |
| `ld (hl), b` | (HL) ← reg8 | Write one byte | HL |
| `ld a, (bc)` | A ← (BC) | Read one byte | BC |
| `ld ($8010), a` | (nn) ← A | Write one byte | Fixed address `$8010` |
| `ld de, ($8020)` | reg16 ← (nn) | Read two bytes | Fixed address `$8020` |

The final form reads the low byte from `$8020` and the high byte from `$8021`.

## Chapter 5: Flags, Comparisons and Jumps

### Flag prediction

| Sequence | Final A | Z | C |
| -------- | ------- | - | - |
| `ld a, 5 / cp 5` | 5 | Set | Clear |
| `ld a, 5 / cp 6` | 5 | Clear | Set |
| `ld a, 5 / cp 3` | 5 | Clear | Clear |
| `ld a, 0 / xor a` | 0 | Set | Clear |
| Previous sequence followed by `dec a` | `$FF` | Clear | Clear |

`cp` preserves A. `dec` changes Z but leaves the carry state supplied by
`xor a`.

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

`ld hl, scores` loads `$8000`; `ld a, (scores)` loads 10 (`$0A`). Six
increments leave HL at `$8006`. The next byte is `$01`, the first byte of
`records`, and is outside `scores`.

## Chapter 8: Stack and Subroutines

### Stack trace

| Instruction | SP afterward | Stack transfer |
| ----------- | ------------ | -------------- |
| `push af` | `$BFFE` | `$34` to `$BFFE`, `$12` to `$BFFF` |
| `push bc` | `$BFFC` | `$78` to `$BFFC`, `$56` to `$BFFD` |
| `pop de` | `$BFFE` | DE receives `$5678` |
| `pop hl` | `$C000` | HL receives `$1234` |

The final values are DE = `$5678`, HL = `$1234` and SP = `$C000`.

## Chapter 9: I/O and Ports

### Flag behaviour of `in`

The immediate form needs an explicit test:

```asm
in a, (IN_PORT)
or a
jr z, is_zero
```

Starting with Z clear and carry set, the immediate read leaves both flags
unchanged. Reading `$00` therefore leaves Z clear and carry set until `or a`
sets Z and clears carry. Reading `$80` also leaves the initial flags after
`in`; `or a` leaves Z clear and clears carry.

The register-addressed form can branch directly:

```asm
in a, (C)
jr z, is_zero
```

Reading `$00` sets Z; reading `$80` clears Z. The carry flag remains set in
both tests because `in r, (C)` preserves it.

## Chapter 10: A Complete Program

### A `find_max` trace

| Iteration | C | A before `cp` | Carry | Update | A after |
| --------- | - | ------------- | ----- | ------ | ------- |
| 1 | 23 | 0 | Set | Yes | 23 |
| 2 | 47 | 23 | Set | Yes | 47 |
| 3 | 91 | 47 | Set | Yes | 91 |
| 4 | 5 | 91 | Clear | No | 91 |
| 5 | 67 | 91 | Clear | No | 91 |
| 6 | 12 | 91 | Clear | No | 91 |
| 7 | 88 | 91 | Clear | No | 91 |
| 8 | 34 | 91 | Clear | No | 91 |

The routine returns A = 91, B = 0 and HL = `$8008`. `max_val` receives 91
(`$5B`).

## Chapter 11: Subroutine Conventions

### Push/pop order

The matching epilogue is:

```asm
pop af
pop hl
pop bc
```

It restores AF = `$3344`, HL = `$2222`, BC = `$1111` and SP = `$C000`.
Using `pop bc / pop hl / pop af` also balances SP, but produces BC = `$3344`,
HL = `$2222` and AF = `$1111`.
