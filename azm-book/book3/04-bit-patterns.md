---
layout: default
title: "Bit Patterns"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 5
---

# Bit Patterns

Chapters 2 and 3 treated each byte as one number. Hardware status registers,
UART flags and packed record fields assign separate meanings to individual
bits. [`examples/04_bit_flags.asm`](examples/04_bit_flags.asm) tests, sets,
clears and extracts flags from one status byte.

---

## Eight flags in one byte

A device reports ready, error and busy in a single status register at `$8000`.
The example has four requirements:

1. An LED reflects whether ready was set at startup.
2. An error can be recorded while ready stays set.
3. Busy clears after the operation finishes.
4. A separate byte stores the error bit as `$00` or `$01` for a later test.

Named bit masks let one byte hold the eight flags, at the cost of masking or
shifting whenever code accesses one of them.

---

## Bit positions as an enum, masks as shifts

A flag has two numbers: its position (0, 1, 2) and its mask (`$01`, `$02`,
`$04`). Written as six separate `.equ` lines they can disagree. An enum names
the positions once, and each mask is a shift of the position it belongs to:

```asm
StatusBit .enum Ready, Error, Busy

FLAG_READY .equ 1 << StatusBit.Ready
FLAG_ERROR .equ 1 << StatusBit.Error
FLAG_BUSY  .equ 1 << StatusBit.Busy
```

`.enum` assigns 0 to the first member, 1 to the second and so on, so
`StatusBit.Busy` is 2 and `FLAG_BUSY` folds to `$04` at assembly time.
Members are always qualified: `Busy` on its own is an error, and
`StatusBit.Busy` is the spelling AZM accepts. Inserting a member renumbers
every position after it, and the masks follow.

`FLAG_READY` is not a memory address; it is the value `$01` substituted wherever it appears. Combining flags at assembly time is `or`:

```asm
INITIAL .equ FLAG_READY | FLAG_BUSY    ; $05
```

At run time you still load the live byte from `(device_flags)` into A.

![Three named bits in one byte, two of them set at reset](../../assets/images/azm-book/book3/byte-as-switches.svg)

---

## AND, OR, XOR on A

| Instruction | Effect on bits |
|-------------|----------------|
| `or mask` | Sets every bit where `mask` is 1; leaves other bits unchanged |
| `and mask` | Clears every bit where `mask` is 0; keeps bits where `mask` is 1 |
| `xor mask` | Toggles bits where `mask` is 1 |

**Set bit 1 (error):**

```asm
    ld a, (device_flags)
    or FLAG_ERROR
    ld (device_flags), a
```

**Test bit 0 (ready), leaving the stored byte alone:**

```asm
    ld a, (device_flags)
    and FLAG_READY
    ; Z set -> ready bit was clear
```

**Clear bit 2 (busy):** clearing requires `and` with the **inverted** mask. For
`FLAG_BUSY` (`$04`), the clear mask is `$FB`:

```asm
    ld a, (device_flags)
    and $FB
```

When A already holds the live flag byte, copy it before loading and inverting
the clear mask:

```asm
    ld b, a
    ld a, FLAG_BUSY
    cpl
    and b
```

`cpl` complements A (`$04` → `$FB`).

---

## `op` for flag idioms

An `op` can name a short sequence that repeats within one file. Its instructions
expand inline at each use. [Book 1 Chapter 7](../book1/07-ops-aliases.md) covers
`op` declarations.

```asm
op bit_set(mask imm8)
  or mask
end

op bit_clr(mask imm8)
  ld b, a
  ld a, mask
  cpl
  and b
end

op bit_test(mask imm8)
  and mask
end
```

The status byte must be in A before the test:

```asm
    ld a, (device_flags)
    bit_test FLAG_READY
    jr z, _not_ready
```

`bit_test` expands to a single `and mask` on A.

---

## Shifts: move bits, watch carry

Logical shifts move bit positions for multiply/divide tricks and for isolation:

| Instruction | What moves |
|-------------|------------|
| `rlca` / `rrca` | Rotate A circularly; the bit that wraps is also copied into carry |
| `rla` / `rra` | Rotate A through carry: A and the carry form a 9-bit ring |
| `sla r` | Shift left; bit 0 ← 0; high bit → carry |
| `srl r` | Shift right; high bit ← 0; low bit → carry |

![The same byte and the same clear carry through both instructions: bit 0 is where they part company](../../assets/images/azm-book/book3/rotate-vs-shift.svg)

**Extract bit 1 into bit 0** after masking:

```asm
; extract_bit_u8: error bit as 0 or 1 in A
.routine in A out A clobbers F
extract_bit_u8:
    and FLAG_ERROR
    rr a
    ret
```

One `rr a` moves that bit into position 0. Result in `error_bit` should be `$01` when the error flag is set.

For a general bit index `n`, loop `n` times with `srl a`, or use the Z80 `bit n, r` instruction (sets Z if bit clear) when a branch is all you need.

---

## `bit n, r` for branches only

```asm
    ld a, (device_flags)
    bit StatusBit.Busy, a
    jr nz, _still_busy
```

`bit` takes a bit **position**, not a mask. `StatusBit.Busy` supplies position
2, while `FLAG_BUSY` would mean bit 4. The assembler emits `CB 57`, the same
two bytes as `bit 2, a`.

`bit` sets flags and leaves A alone. `and mask` is the appropriate form when
storage requires a numeric 0/1 in A.

---

## Trace: flags from `$05` to `$03`

Initial value: `$05` = ready + busy (`$01 | $04`).

| Step | A | Action |
|------|---|--------|
| test ready | `$05` | `and $01` → NZ → `ready_lit` = 1 |
| set error | `$07` | `or $02` |
| clear busy | `$03` | `and $FB` clears bit 2 |
| extract error | `$01` | `and $02`, `rr a` |

After `halt`, `(device_flags)` should be `$03`, `(ready_lit)` `$01`, `(error_bit)` `$01`.

![Each operator against its mask, with the bit that moved marked and carry cleared every time](../../assets/images/azm-book/book3/mask-operations.svg)

---

## Packed flags inside records (preview)

Chapter 5 stores structs as bytes. A status nibble and a type nibble can share one byte:

```
  bit 7 6 5 4 3 2 1 0
       [  type  ][flags]
```

`offset` and `sizeof` tell you **which** byte; the masks in this chapter work inside it.

---

## `main` in the example

```asm
.org $0000
main:
    ld a, (device_flags)
    bit_test FLAG_READY
    ...

    ld a, (device_flags)
    bit_set FLAG_ERROR
    ld (device_flags), a

    ld a, (device_flags)
    bit_clr FLAG_BUSY
    ld (device_flags), a

    ld a, (device_flags)
    call extract_bit_u8
    ld (error_bit), a
    halt
```

---

## Inspecting the flag byte

After [`examples/04_bit_flags.asm`](examples/04_bit_flags.asm) runs,
`device_flags` should be `$03`, `ready_lit` should be 1 and `error_bit` should
be 1:

| File | What to verify |
|------|----------------|
| [`examples/04_bit_flags.asm`](examples/04_bit_flags.asm) | `device_flags` = `$03`, `ready_lit` = 1, `error_bit` = 1 |

```sh
azm examples/04_bit_flags.asm
```

AZM writes `examples/04_bit_flags.lst` by default. The `bit_set` invocation
remains visible as the source line, with the two bytes emitted by its `or`
expansion shown beside it.

---

## Exercise

**Mask trace.** A trace starting with A = `$05` should show A after setting
error, clearing busy and toggling ready in that order. Each value should
appear in binary beside the mask used for that step.

[Exercise notes](exercise-notes.md#chapter-4-bit-patterns)
