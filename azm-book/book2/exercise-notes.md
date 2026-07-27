---
layout: default
title: "Exercise Notes"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 99
---

# Exercise Notes

These notes provide results for traces and calculations, along with checks for
the programming exercises. The coding notes describe the required structure
and observable result without replacing the exercise with a complete program.

## Chapter 1: The Computer

### 1. Parts of the system

| Action | Active parts | Data transfer | Address selection |
| ------ | ------------ | ------------- | ----------------- |
| Fetch opcode at `$0120` | CPU and memory | Opcode byte from memory to CPU | `$0120` selects a memory byte |
| Read RAM at `$8004` | CPU and memory | Stored byte from RAM to CPU | `$8004` selects a memory byte |
| Write `$3C` to port `$10` | CPU and I/O | `$3C` from CPU to peripheral | Low address byte `$10` selects the port |
| Add B to A | CPU | B and A are used internally; the result returns to A | No external address is selected during the arithmetic operation |

Instruction fetches still use memory even when the operation itself, such as
`add a, b`, works entirely inside the CPU.

### 2. Registers and stored words

HL = `$3A7C` means H = `$3A` and L = `$7C`. A word store at `$8200` produces:

| Address | Byte | Role |
| ------- | ---- | ---- |
| `$8200` | `$7C` | Low byte |
| `$8201` | `$3A` | High byte |

### 3. Instruction trace

| Starting PC | Instruction | PC afterward | Changed state |
| ----------- | ----------- | ------------ | ------------- |
| `$0000` | `ld a, 5` | `$0002` | A = `$05` |
| `$0002` | `ld b, a` | `$0003` | B = `$05` |
| `$0003` | `ld a, 3` | `$0005` | A = `$03` |
| `$0005` | `add a, b` | `$0006` | A = `$08`, Z clear, C clear |
| `$0006` | `ld ($8000), a` | `$0009` | `$8000` = `$08` |
| `$0009` | `halt` | `$000A` | Normal instruction execution suspends |

The store and HALT leave the arithmetic flags unchanged, so the final Z and C
states remain clear. The final registers are A = `$08`, B = `$05` and PC =
`$000A` after HALT has executed. A debugger that pauses before executing the
HALT instruction may display `$0009` at that earlier stop point.

### 4. Reset and the memory map

Reset puts PC at `$0000`, where the proposed board has no device and therefore
no valid startup instruction. Keeping the same chip sizes, a workable map is:

```text
$0000-$1FFF   ROM   8 KB
$2000-$7FFF   RAM   24 KB
$8000-$FFFF   Unmapped or available for other hardware
```

The decisive requirement is valid executable code at `$0000`.

## Chapter 2: Machine Code

### 1. Decode a byte stream

| Address | Bytes | Instruction |
| ------- | ----- | ----------- |
| `$0000` | `3E 12` | `ld a, $12` |
| `$0002` | `47` | `ld b, a` |
| `$0003` | `3E 05` | `ld a, $05` |
| `$0005` | `80` | `add a, b` |
| `$0006` | `32 10 80` | `ld ($8010), a` |
| `$0009` | `76` | `halt` |

The final A is `$17`, B is `$12`, and `$8010` contains `$17`.

### 2. Encode a short program

| Address | Instruction | Bytes |
| ------- | ----------- | ----- |
| `$0000` | `ld a, $2A` | `3E 2A` |
| `$0002` | `ld b, a` | `47` |
| `$0003` | `ld ($8120), a` | `32 20 81` |
| `$0006` | `halt` | `76` |

The continuous sequence is `3E 2A 47 32 20 81 76`. PC advances to `$0007`
when HALT is fetched.

### 3. Patch a little-endian address

The address bytes occupy `$0007` and `$0008`. They change from `$00 $80` to
`$20 $81`, giving:

```text
3E 05 47 3E 03 80 32 20 81 76
```

The store decodes as `ld ($8120), a`.

### 4. Labels and emitted data

`Limit` has the value 10 (`$000A`) and emits no bytes. `first` is `$8100`, and
that address contains `$AA`. `second` is `$8101`; its word occupies `$8101`
and `$8102` as `$34 $12`. The listing has an address and emitted bytes beside
the `.db` and `.dw` lines, while `.equ` only defines a value.

## Chapter 3: Assembly Language

### 1. Register trace

| Instruction completed | A | B | C |
| --------------------- | - | - | - |
| `ld a, $10` | `$10` | unchanged | unchanged |
| `ld b, a` | `$10` | `$10` | unchanged |
| `ld a, $06` | `$06` | `$10` | unchanged |
| `add a, b` | `$16` | `$10` | unchanged |
| `ld c, a` | `$16` | `$10` | `$16` |

No instruction in the sequence refers to HL, so HL retains its incoming value.

### 2. Copying HL into DE

The two legal moves are:

```asm
ld d, h
ld e, l
```

For HL = `$1234`, the final state is H = `$12`, L = `$34`, D = `$12`, E =
`$34`, HL = `$1234` and DE = `$1234`. Both loads leave the flags unchanged.

### 3. Constants and labels

With `.org $8000`, `BASE` = `$8000`, `count` = `$8000` and `next` = `$8001`.
The emitted bytes are `$00` at `$8000`, `$34` at `$8001` and `$12` at
`$8002`. Moving the origin to `$8100` changes `count` to `$8100` and `next` to
`$8101`; `BASE` remains the explicitly defined value `$8000`.

### 4. `dec` and the Zero flag

| Decrement | B | Z | C |
| --------- | - | - | - |
| First | 2 | Clear | Set |
| Second | 1 | Clear | Set |
| Third | 0 | Set | Set |

`dec` updates Z but preserves the incoming carry state.

## Chapter 4: Memory Access and Data

### 1. Memory form identification

| Instruction | LD form | Memory action | Address source |
| ----------- | ------- | ------------- | -------------- |
| `ld a, (hl)` | reg8 ← (HL) | Read one byte | HL |
| `ld (hl), b` | (HL) ← reg8 | Write one byte | HL |
| `ld a, (bc)` | A ← (BC) | Read one byte | BC |
| `ld ($8010), a` | (nn) ← A | Write one byte | Fixed address `$8010` |
| `ld de, ($8020)` | reg16 ← (nn) | Read two bytes | Fixed address `$8020` |

The final form reads the low byte from `$8020` and the high byte from `$8021`.

### 2. Repair an illegal transfer

`ld ($8000), (hl)` is illegal because the Z80 has no direct memory-to-memory
`ld`. A legal replacement carries the byte through a register:

```asm
ld a, (hl)
ld ($8000), a
```

When `(HL)` contains `$5A`, A and `$8000` both contain `$5A` afterward.

### 3. Signed and unsigned readings

| Hex | Binary | Unsigned | Signed |
| --- | ------ | -------- | ------ |
| `$00` | `00000000` | 0 | 0 |
| `$7F` | `01111111` | 127 | 127 |
| `$80` | `10000000` | 128 | -128 |
| `$FF` | `11111111` | 255 | -1 |

The readings agree for `$00` and `$7F`. `$80 + $01` produces `$81`, read as
129 unsigned or -127 signed. `$FF + $01` produces `$00`, read as zero under
both interpretations; the addition also produces an unsigned carry.

### 4. Word-store trace

The store writes `$CD` to `$8050` and `$AB` to `$8051`. The following word
load reconstructs DE = `$ABCD`.

## Chapter 5: Flags, Comparisons and Jumps

### 1. Flag prediction

| Sequence | Final A | Z | C |
| -------- | ------- | - | - |
| `ld a, 5 / cp 5` | 5 | Set | Clear |
| `ld a, 5 / cp 6` | 5 | Clear | Set |
| `ld a, 5 / cp 3` | 5 | Clear | Clear |
| `ld a, 0 / xor a` | 0 | Set | Clear |
| Previous sequence followed by `dec a` | `$FF` | Clear | Clear |

`cp` preserves A. `dec` changes Z but leaves the carry state supplied by
`xor a`.

### 2. A clobbered comparison

`xor a` is the last instruction to set Z before the jump. It always produces
zero and sets Z, so `jp nz` falls through for both incoming values. Both tests
therefore store 10, including the incorrect A = 4 case.

No flag-changing instruction can intervene between this comparison and its
jump; placing them adjacent is the clearest correction. The `xor a`
initialization can run after the conditional store:

```asm
cp 5
jp nz, skip
ld a, 10
ld (count), a
skip:
xor a
```

With `count` initially `$EE`, corrected runs leave 10 for A = 5 and `$EE` for
A = 4.

### 3. Count down with flags

The body order is `dec a`, `ld (last_a), a`, then `jp nz` back to the body.
The store leaves the Z result from `dec a` intact. The values written are 9, 8,
7, 6, 5, 4, 3, 2, 1 and 0. The final A and `last_a` are both zero, with Z set.

### 4. Test a status bit

`and $04` supplies Z to the branch. A set path stores 1, while the zero path
stores 0. The expected results are:

| Input | `input AND $04` | `ready` |
| ----- | --------------- | ------- |
| `$04` | `$04` | 1 |
| `$05` | `$04` | 1 |
| `$00` | `$00` | 0 |
| `$FB` | `$00` | 0 |

## Chapter 6: Counting Loops and DJNZ

### 1. The zero-count case

| Runtime count | Iterations | Final B | Final byte counter |
| ------------- | ---------- | ------- | ------------------ |
| 0 | 256 | 0 | 0 after wrapping through 256 increments |
| 1 | 1 | 0 | 1 |
| 255 | 255 | 0 | 255 |

The guard tests A before copying it to B. A zero result branches around the
body; a non-zero result loads B and enters the loop. The test cases should then
produce 0, 1 and 255 iterations.

### 2. Find a minimum

For a non-empty table, the first byte can initialize the running minimum.
HL then advances once and B decreases once before the repeated comparison
begins. At the top of each remaining iteration, A holds the minimum of every
element already examined, HL points to the next element, and B counts the
elements still to examine.

The expected stored values are 2, 9 and 0 for the three supplied tables. The
one-element case must bypass the repeated body after initialization.

### 3. Sentinel loop: find the zero

For `$41, $42, $43, $00, $44, $45`, the result is `zero_pos = 3`, HL points to
the fourth byte and B remains 3 because the matching iteration exits before
DJNZ. A leading zero produces position 0 with HL at the table base and B still
6. A six-byte table with no zero produces `$FF`, HL at base + 6 and B = 0.

A separate index register can begin at zero and increase only when the current
byte fails to match.

### 4. Flag-exit trace

| Iteration | Byte | A | Carry after `cp $10` | Exit |
| --------- | ---- | - | -------------------- | ---- |
| 1 | 3 | 3 | Set | No |
| 2 | 7 | 10 | Set | No |
| 3 | 2 | 12 | Set | No |
| 4 | 8 | 20 | Clear | Yes |

At the `$10` threshold, A and `flagval` are 20, B is 2 and HL is table base +
4. At the `$0C` threshold, the third iteration reaches 12 and exits with A =
12, B = 3 and HL = table base + 3.

## Chapter 7: Data Tables and Indexed Access

### 1. Address, value and final pointer

`ld hl, scores` loads `$8000`; `ld a, (scores)` loads 10 (`$0A`). Six
increments leave HL at `$8006`. The next byte is `$01`, the first byte of
`records`, and is outside `scores`.

### 2. IX record access

Record index 2 begins at `$8010 + 2 × 3 = $8016`. With IX = `$8016`, displaced
loads at offsets 0, 1 and 2 produce A = `$33`, B = `$CC` and C = `$03`. IX
remains `$8016`.

### 3. Block-copy trace

After `ldir`, `$8200`–`$8203` contain `$10, $20, $30, $40`. HL = `$8104`, DE
= `$8204` and BC = `$0000`. An initial BC of zero means 65,536 transfers; both
pointers wrap through the full 16-bit address space and return to their initial
values when BC reaches zero.

### 4. The missing increment

As written, every iteration reads the first score, 10. The loop ends with HL =
`$8000`, B = 0 and `max_score` = 10. `inc hl` belongs after
`no_new_max:` and before `djnz`, so it runs on both comparison paths. The
corrected run ends with HL = `$8006`, B = 0 and `max_score` = 60.

## Chapter 8: Stack and Subroutines

### 1. Stack trace

| Instruction | SP afterward | Stack transfer |
| ----------- | ------------ | -------------- |
| `push af` | `$BFFE` | `$34` to `$BFFE`, `$12` to `$BFFF` |
| `push bc` | `$BFFC` | `$78` to `$BFFC`, `$56` to `$BFFD` |
| `pop de` | `$BFFE` | DE receives `$5678` |
| `pop hl` | `$C000` | HL receives `$1234` |

The final values are DE = `$5678`, HL = `$1234` and SP = `$C000`.

### 2. A mismatched stack

The call places return address `$0103` at `$BFFE`–`$BFFF`. `push bc` moves SP
to `$BFFC`; `push de` moves it to `$BFFA`. `pop bc` then loads `$5678`, not
the incoming BC, and leaves SP at `$BFFC`. `ret` reads saved BC as its address,
so PC becomes `$1234` and SP becomes `$BFFE`. The real return address remains
at `$BFFE`.

The matching exit is `pop de`, `pop bc`, `ret`. It restores both pairs, returns
to `$0103`, and leaves SP at `$C000`.

### 3. A byte-doubling subroutine

The body can copy B to A and add B to A. B remains unchanged; A and F are the
clobbered outputs. Expected arithmetic results are:

| B | A after doubling | Carry |
| - | ---------------- | ----- |
| 0 | 0 | Clear |
| 15 | 30 | Clear |
| 127 | 254 | Clear |
| 128 | 0 | Set |
| 255 | 254 | Set |

The caller should observe the same A value in `doubled`.

### 4. The `or a / sbc hl, de` pattern

`or a` clears carry in both traces. For HL = `$0064`, DE = `$0028`,
`sbc hl, de` produces `$003C` with carry clear. The carry-clear path adds DE
back, returning HL = `$0064`, while the saved DE is restored as `$0028`.

For HL = `$0014`, subtraction produces `$FFEC` with carry set. The carry-set
path loads the saved DE into HL, so both HL and the preserved DE finish as
`$0028`. Clearing carry before `sbc` makes the subtraction compare HL directly
with DE instead of subtracting an additional one.

## Chapter 9: I/O and Ports

### 1. Flag behaviour of `in`

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

### 2. A bit-3 ready check

Bit 3 has mask `%00001000`, or `$08`. The masked results are:

| Status | Result after `and $08` | Z | Branch to wait |
| ------ | ---------------------- | - | -------------- |
| `$00` | `$00` | Set | Yes |
| `$08` | `$08` | Clear | No |
| `$09` | `$08` | Clear | No |
| `$80` | `$00` | Set | Yes |

The listing should show `$08` as the immediate operand of `and` (`E6 08`).

### 3. A receive loop

The loop reads with `in a, (IN_PORT)`, stores through `(HL)`, increments HL and
uses DJNZ. Its contract has HL and B as inputs and clobbers A, B and HL; the
immediate input form and the other body instructions leave F unchanged.

For the supplied stream, destination through destination + 3 contains `$11,
$22, $33, $44`; B = 0 and HL = destination + 4.

### 4. Register-addressed output

The three instructions are:

```asm
ld bc, $1220
ld d, $7F
out (C), d
```

BC is `$1220`, D is `$7F`, the address pins carry `$1220`, and the data bus
carries `$7F`. Conventional 8-bit decoding selects port `$20` from the low
byte; hardware that decodes the upper pins can also distinguish `$12`.

## Chapter 10: A Complete Program

### 1. A `find_max` trace

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

### 2. The side effect in HL

Without the reload, the second scan starts at `$8008` and reads `$8008` through
`$800F`. The source defines `max_val` at `$8008` and `above_64` at `$8009`;
the next six bytes are unspecified. The result therefore cannot be determined
from this source alone. With HL restored to `values`, the bytes above 64 are
91, 67 and 88, so `above_64` becomes 3.

### 3. Shared comparison flags

| A | Z after `cp 64` | Carry after `cp 64` | D increments |
| - | --------------- | ------------------- | ------------ |
| 63 | Clear | Set | No |
| 64 | Set | Clear | No |
| 65 | Clear | Clear | Yes |

`inc d` preserves carry but changes Z. If it appears between the comparison
and the branches, `jr c` can still test the comparison's carry result, while
`jr z` reads the zero result from `inc d` and no longer tests equality.

### 4. A third task

The new routine can use the same HL, B and C input convention, with C = 32 and
a scratch register for the count. After `cp c`, carry set identifies a byte
below the threshold. The routine should document and preserve any scratch pair
that its contract promises to retain.

The expected counts are 3 for the chapter table, 0 for `{32}`, and 2 for
`{0, 31, 32, 255}`.

## Chapter 11: Subroutine Conventions

### 1. Push/pop order

The matching epilogue is:

```asm
pop af
pop hl
pop bc
```

It restores AF = `$3344`, HL = `$2222`, BC = `$1111` and SP = `$C000`.
Using `pop bc / pop hl / pop af` also balances SP, but produces BC = `$3344`,
HL = `$2222` and AF = `$1111`.

### 2. Registers that need saving

The entry sequence is `push bc` followed by `push de`; the matching exit is
`pop de` followed by `pop bc`. Saving BC to preserve C also restores B, even
though the contract permits B to change. That stronger preservation is valid.
Every return path must execute both pops in reverse order.

### 3. An IX frame

The call moves SP from `$C000` to `$BFFE`. `push ix` moves it to `$BFFC`;
after `ld ix, 0 / add ix, sp`, IX = `$BFFC`. Four `dec sp` instructions leave
SP = `$BFF8`. The locals occupy:

| Local | Address |
| ----- | ------- |
| `(ix-1)` | `$BFFB` |
| `(ix-2)` | `$BFFA` |
| `(ix-3)` | `$BFF9` |
| `(ix-4)` | `$BFF8` |

The first local receives 42 (`$2A`), so A reads back `$2A`. `ld sp, ix`
restores SP to `$BFFC`; `pop ix` restores IX = `$9000` and SP = `$BFFE`;
`ret` loads PC = `$1234` and restores SP = `$C000`.

### 4. An early return with a missing pop

The first byte, 2, is added to C. HL advances to the zero at table base + 1,
and DJNZ leaves B = 2. The zero then selects `SumEarlyExit`. Because saved BC =
`$0307` remains at the top of the stack, the faulty `ret` loads PC = `$0307`
and leaves SP = `$BFFE`; the real return address `$0103` remains there.

Adding `pop bc` before the early `ret` restores the contract. The corrected
return leaves A = 0, BC = `$0307`, HL = table base + 1, SP = `$C000` and PC =
`$0103`.
