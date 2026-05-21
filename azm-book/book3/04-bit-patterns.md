---
layout: default
title: "Chapter 4 — Bit Patterns"
parent: "AZM Book 3 — Algorithms and Data Structures"
grand_parent: "AZM Books"
nav_order: 5
---
[← Strings](03-strings.md) | [Book 3](index.md) | [Records →](05-records.md)

# Chapter 4 — Bit Patterns

Chapters 2 and 3 treated each byte as one number. Hardware status registers, UART flags, and packed record fields treat a byte as **eight switches in one box**. You set one switch without breaking the others with masks, `and` / `or` / `xor`, and shifts.

This chapter works through a packed status byte: test a flag, set a flag, clear a flag, isolate one bit for a boolean result. Named `op` declarations from Book 1 Chapter 14 spell the repeated mask idioms. The companion program is [`examples/04_bit_flags.asm`](examples/04_bit_flags.asm).

---

## The problem: eight flags, one byte

A device reports ready, error, and busy in a single status register at `$8000`. Your code must:

1. Light an LED if ready was set at startup.
2. Record an error without clearing ready.
3. Clear busy after the operation finishes.
4. Store whether the error bit is on as `$00` or `$01` in a separate byte for a later test.

You could use eight bytes of RAM — wasteful on a small machine. One byte with named bit masks is the usual trade.

---

## Bit masks as `.equ` names

Give each bit a name at assemble time:

```asm
FLAG_READY .equ $01    ; bit 0
FLAG_ERROR .equ $02    ; bit 1
FLAG_BUSY  .equ $04    ; bit 2
```

`FLAG_READY` is not a memory address — it is the value `$01` substituted wherever it appears. Combining flags at assembly time is `or`:

```asm
INITIAL .equ FLAG_READY | FLAG_BUSY    ; $05
```

At run time you still load the live byte from `(device_flags)` into A.

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

**Clear bit 2 (busy):** you need `and` with the **inverted** mask. For `FLAG_BUSY` (`$04`), the clear mask is `$FB`:

```asm
    ld a, (device_flags)
    and $FB
```

When the mask is not a compile-time constant in A, invert through a scratch register:

```asm
    ld b, a
    ld a, FLAG_BUSY
    cpl
    and b
```

`cpl` complements A (`$04` → `$FB`). Then `and b` clears only that bit in the saved value.

**Toggle** a bit: `xor mask`.

---

## `op` for flag idioms

Book 1 Chapter 14: short sequences that repeat in one file are good `op` candidates — no `call` overhead, intent visible at the call site.

```asm
op bit_set(reg reg8, mask imm8)
  or mask
end

op bit_clr(reg reg8, mask imm8)
  ld b, reg
  ld a, mask
  cpl
  and b
end

op bit_test(mask imm8)
  and mask
end
```

Load the status byte into A first, then test:

```asm
    ld a, (device_flags)
    bit_test FLAG_READY
    jr z, .not_ready
```

`bit_test` expands to a single `and mask` — A must already hold the byte under test. The Z80 has no `ld a, a`, so the op deliberately does not reload A.

`bit_clr` saves `reg` into B, complements the mask in A, then `and b` — the general pattern when you cannot write `and $FB` literally because the mask arrived in a register.

---

## Shifts: move bits, watch carry

Logical shifts move bit positions for multiply/divide tricks and for isolation:

| Instruction | What moves |
|-------------|------------|
| `rlca` / `rrca` | Rotate A through carry (8-bit, fast) |
| `rla` / `rra` | Rotate A through carry including previous carry |
| `sla r` | Shift left; bit 0 ← 0; high bit → carry |
| `srl r` | Shift right; high bit ← 0; low bit → carry |

**Extract bit 1 into bit 0** after masking:

```asm
; extract_bit_u8: error bit as 0 or 1 in A
;!      in        A
;!      out       A
;!      clobbers  F
@extract_bit_u8:
    and FLAG_ERROR
    rr a
    ret
```

`and FLAG_ERROR` clears all but bit 1 (`$02`). One `rr a` moves that bit into position 0. Result in `error_bit` should be `$01` when the error flag is set.

For a general bit index `n`, loop `n` times with `srl a`, or use the Z80 `bit n, r` instruction (sets Z if bit clear) when you only need a branch, not a 0/1 byte in A.

---

## `bit n, r` for branches only

```asm
    ld a, (device_flags)
    bit 2, a
    jr nz, .still_busy
```

`bit` does not change A; it only sets flags. Use it when you will branch immediately. Use `and mask` when you need a numeric 0/1 in A for storage.

---

## Trace: flags from `$05` to `$03`

Start: `$05` = ready + busy (`$01 | $04`).

| Step | A | Action |
|------|---|--------|
| test ready | `$05` | `and $01` → NZ → `ready_lit` = 1 |
| set error | `$07` | `or $02` |
| clear busy | `$03` | `and $FB` clears bit 2 |
| extract error | `$01` | `and $02`, `rr a` |

After `halt`, `(device_flags)` should be `$03`, `(ready_lit)` `$01`, `(error_bit)` `$01`.

---

## Packed flags inside records (preview)

Chapter 5 stores structs as bytes. A status nibble and a type nibble can share one byte:

```
  bit 7 6 5 4 3 2 1 0
       [  type  ][flags]
```

The same `and` / `or` / shift tools apply; `offset` and `sizeof` tell you **which** byte, not how to twiddle bits inside it.

---

## `main` in the companion

```asm
.org $0000
main:
    ld a, (device_flags)
    bit_test FLAG_READY
    ...

    ld a, (device_flags)
    bit_set A, FLAG_ERROR
    ld (device_flags), a

    ld a, (device_flags)
    bit_clr A, FLAG_BUSY
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

AZM writes `examples/04_bit_flags.lst` by default. Open that listing to confirm `bit_set` expanded to `or` at the call site, not a subroutine call.

---

## Summary

- A **mask** names which bits an instruction touches; define masks with `.equ`.
- **`or`** sets, **`and`** clears or tests, **`xor`** toggles.
- **Clear one bit** with `and` and the inverted mask (`cpl` on the mask byte when needed).
- **`op`** names flag idioms when the same 2–4 instructions repeat in one file.
- **Shifts** and **`bit n, r`** move or test bit positions; choose based on whether you need a branch or a stored 0/1.
- Chapter 5 reuses these skills inside **record** layouts.

---

## Exercises

1. Start from `$05`. Predict `(device_flags)` after only `bit_set A, FLAG_ERROR` without clearing busy.
2. Add `FLAG_FAULT .equ $08`. Write `main` so a fault sets bit 3 and forces busy clear in one pass through A.
3. Implement `popcount_u8`: count set bits in A with a loop (`and 1`, `srl`, increment counter). Return count in A.
4. Implement `parity_u8`: return 1 if odd number of set bits, 0 if even. One compact approach is to toggle a workspace byte each time you find a set bit.
5. Replace `extract_bit_u8` with eight `bit n, a` / `jr` branches — when is the shift loop smaller?
6. Define an `op` `rot_right(reg reg8)` that expands to `rra` with A loaded from `reg` — use it in a 16-bit shift across A and a workspace byte.

---

[← Strings](03-strings.md) | [Book 3](index.md) | [Records →](05-records.md)
