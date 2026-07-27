---
layout: default
title: "Bit Patterns"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 5
---

# Chapter 4 — Bit Patterns

Chapters 2 and 3 treated each byte as one number. Hardware status registers, UART flags and packed record fields treat a byte as **eight switches in one box**.

The companion program is [`examples/04_bit_flags.asm`](examples/04_bit_flags.asm).

---

## The problem: eight flags, one byte

A device reports ready, error and busy in a single status register at `$8000`.
The example has four requirements:

1. An LED reflects whether ready was set at startup.
2. An error can be recorded without clearing ready.
3. Busy clears after the operation finishes.
4. A separate byte stores the error bit as `$00` or `$01` for a later test.

You could use eight bytes of RAM, which is wasteful on a small machine. One byte with named bit masks is the usual trade.

---

## Bit masks as `.equ` names

Each bit receives an assemble-time name:

```asm
FLAG_READY .equ $01    ; bit 0
FLAG_ERROR .equ $02    ; bit 1
FLAG_BUSY  .equ $04    ; bit 2
```

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

**Test bit 0 (ready) without changing the stored byte:**

```asm
    ld a, (device_flags)
    and FLAG_READY
    ; Z set → ready bit was clear
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

Book 2 Chapter 14: short sequences that repeat in one file are good `op` candidates: no `call` overhead, intent visible at the call site.

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

`bit_test` expands to a single `and mask`. It takes no register parameter, so A must already hold the byte under test.

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

For a general bit index `n`, loop `n` times with `srl a` or use the Z80 `bit n, r` instruction (sets Z if bit clear) when you only need a branch, not a 0/1 byte in A.

---

## `bit n, r` for branches only

```asm
    ld a, (device_flags)
    bit 2, a
    jr nz, _still_busy
```

`bit` does not change A; it only sets flags. `and mask` is the appropriate form
when storage requires a numeric 0/1 in A.

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

`offset` and `sizeof` tell you **which** byte, not how to twiddle bits inside it.

---

## `main` in the companion

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

## Examples

| File | What to verify |
|------|----------------|
| [`examples/04_bit_flags.asm`](examples/04_bit_flags.asm) | `device_flags` = `$03`, `ready_lit` = 1, `error_bit` = 1 |

```sh
azm examples/04_bit_flags.asm
```

AZM writes `examples/04_bit_flags.lst` by default. The `bit_set` invocation
remains visible as the source line, with the bytes emitted by its `or` expansion
shown beside it. There is no `call` instruction.

---

## Exercises

1. Starting from `$05`, the predicted `(device_flags)` value after
   `bit_set FLAG_ERROR` should be recorded without clearing busy.
2. A `FLAG_FAULT .equ $08` definition extends `main` so that a fault sets bit 3
   and clears busy in one pass through A.
3. A `popcount_u8` routine should copy A to a shifting register, perform eight
   `srl` operations, increment a counter for each set carry, and return the
   count in A.
4. A `parity_u8` routine should return 1 for an odd number of set bits and 0
   for an even number. One compact implementation toggles a workspace byte for
   every set bit.
5. A comparison between `and FLAG_ERROR` / `rr a` and `bit 1, a` followed by a
   branch should distinguish a stored numeric result from control flow alone.
6. An op named `shift_right_pair(hi reg8, lo reg8)` should expand to `srl hi`
   followed by `rr lo`, shifting the 16-bit value in B:C right by one bit.
