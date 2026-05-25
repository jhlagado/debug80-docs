---
layout: default
title: "Chapter 3 — Strings"
parent: "AZM Book 3 — Algorithms and Data Structures"
grand_parent: "AZM Books"
nav_order: 4
---
[← Arrays and Loops](02-arrays-and-loops.md) | [Book 3](index.md) | [Bit Patterns →](04-bit-patterns.md)

# Chapter 3 — Strings

Chapter 2 walked a byte table with a **fixed length** in B. Text in memory usually has no fixed length — you stop when you see a sentinel, not when a counter reaches eight. That one change drives how you hold pointers, how you copy and how you compare.

This chapter chooses a string representation, builds length, copy and search on top of it and documents every routine with AZMDoc. The companion program is [`examples/03_string_length.asm`](examples/03_string_length.asm).

---

## The problem: text without a length field

You need to know how many characters are in a message before formatting a screen line. You need to copy a label into a buffer. You need to find the first `'/'` in a path.

None of those questions mention "array of eight bytes." They mention **text that ends somewhere**. In assembly you answer that by picking a representation first, then writing the walk.

---

## Representation: null-terminated bytes

Wirth's order still applies: **decide layout, then write the algorithm.**

A **null-terminated string** (C-style) is a sequence of byte values followed by a zero byte `$00`. The zero is not part of the visible text; it marks the end.

```asm
.org $8000
message:
    .db "HELLO", 0
buffer:
    .ds byte[8]
```

`message` points at `'H'`. Each `inc hl` moves to the next character until `(hl)` is zero.

AZM also accepts a string directive that appends the terminator for you (Book 1 Chapter 3):

```asm
message:
    .cstr "HELLO"
```

Both forms emit the same bytes in ROM: `48 45 4C 4C 4F 00`.

### Length vs capacity

Two different numbers confuse beginners:

| Concept | Meaning |
|---------|---------|
| **Length** | Characters before the null — five for `"HELLO"`. |
| **Capacity** | Bytes reserved in RAM — eight in `buffer` above. |

`strlen` counts length. `strcpy` must not write past capacity if the source is longer than the destination buffer — this chapter copies into a buffer sized for the demo; Chapter 5's records are a natural place to store `(capacity)` beside `(data)`.

### Why not store length in byte zero?

You could: byte 0 holds the count, bytes 1..n hold text. That saves a scan for length but shifts every pointer (`HL` must skip the count byte). Null-terminated layout is the convention in this book because the walk is uniform — every algorithm uses the same `ld a,(hl)` / `or a` / `jr z` spine.

---

## String calling convention

Unless a routine says otherwise, Book 3 string routines use:

| Role | Register | Notes |
|------|----------|--------|
| Current / source pointer | HL | Points at next byte to read |
| Destination pointer | DE | Used by copy and compare |
| Search character | C | Compared with `cp c` |
| Length or index result | A | 0–255 in the demo sizes |
| Not found sentinel | A = `$FF` | Same idea as Chapter 2 search |

**Callee-save:** push BC/DE/HL if you use them as scratch and the `;!` block does not list them under `clobbers`.

**Invariant for traversal** (label `.loop` or `.scan`):

> HL points at the next byte to examine. All bytes before HL in this string have already been processed.

When output is wrong, check that HL still satisfies the invariant — not every `inc` in the listing.

---

## The core loop: test for zero without destroying the byte

```asm
    ld a, (hl)
    or a
    jr z, .at_end
    ; ... use A as the character ...
    inc hl
```

`or a` sets the Zero flag from A's value without changing A. That is the standard Z80 idiom for "is this byte zero?" — same role `cp 0` would play, but `or a` is one byte cheaper and appears in every listing below.

---

## `strlen_u8`: count before the null

```asm
; strlen_u8: count bytes before null (does not include terminator)
;!      in        HL
;!      out       A
;!      clobbers  AF, B, HL
@strlen_u8:
    ld b, 0
StrLenLoop:
    ld a, (hl)
    or a
    jr z, StrLenDone
    inc hl
    inc b
    jr StrLenLoop
StrLenDone:
    ld a, b
    ret
```

B is the running length. The loop invariant: at `StrLenLoop`, B equals the number of non-null bytes already passed.

For `message` above, `str_len` at `$8008` should hold `$05` after `halt`.

---

## `strcpy_u8`: copy byte-by-byte through the null

Copying uses **two pointers**: HL reads, DE writes. Each iteration moves one byte and advances both.

```asm
; strcpy_u8: copy null-terminated string HL → DE (terminator included)
;!      in        HL, DE
;!      out       DE
;!      clobbers  AF, HL, DE
@strcpy_u8:
StrCopyLoop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    or a
    jr nz, StrCopyLoop
    ret
```

The last iteration copies the zero terminator. That matters if later code scans `buffer` with the same null-terminated walk — the copy is a faithful duplicate.

After `call strcpy_u8`, DE points one past the null. Reload HL from `message` before another pass; do not assume DE still equals the source base.

---

## `str_find_char`: linear search with an index

Chapter 2's `find_byte_ge` returned the first index where `values[i] >= C`. String search is the same walk with a different test:

```asm
; str_find_char: index of first C in string, or $FF if absent
;!      in        HL, C
;!      out       A
;!      clobbers  AF, B, HL
@str_find_char:
    ld b, 0
FindCharScan:
    ld a, (hl)
    or a
    jr z, FindCharMissing
    cp c
    jr z, FindCharFound
    inc hl
    inc b
    jr FindCharScan
FindCharFound:
    ld a, b
    ret
FindCharMissing:
    ld a, $FF
    ret
```

Invariant at `FindCharScan`: no byte at index `< B` equals C.

For `'L'` in `"HELLO"`, `find_index` should be `$02` (0-based).

---

## `strcmp_u8`: walk two strings together

Lexicographic compare reads one byte from each string until bytes differ or both are null.

```asm
; strcmp_u8: 0 if equal, 1 if HL string greater, $FF if less
;!      in        HL, DE
;!      out       A
;!      clobbers  AF, HL, DE
@strcmp_u8:
StrCmpLoop:
    ld a, (hl)
    push af
    ld a, (de)
    pop bc
    cp c
    jr c, StrCmpLess
    jr nz, StrCmpGreater
    or a
    jr z, StrCmpEqual
    inc hl
    inc de
    jr StrCmpLoop
StrCmpLess:
    ld a, $FF
    ret
StrCmpGreater:
    ld a, 1
    ret
StrCmpEqual:
    xor a
    ret
```

Order matters: compare characters **before** you decide both strings ended. If both bytes are zero, `cp b` sets Z, the `jr nz` to `StrCmpGreater` does not fire and `StrCmpEqual` returns 0. If one string is a prefix of the other, the shorter one ends first on a later iteration — `cp` sees `0` against a non-zero byte and returns less or greater correctly.

The companion program copies `message` into `buffer`, then compares the two buffers. `copy_ok` at `$8009` should be `$01`.

---

## Preparing for print: digits and terminators

Display routines want ASCII, not raw small integers. The digit loop from Chapter 1 still applies: divide the value by 10, add `'0'` to each remainder, store backward into a small buffer, null-terminate.

Sketch of the invariant for decimal output into a byte buffer at DE:

> HL (or DE) points at the next free byte rightward; the digits emitted so far sit to the left; when the value reaches zero, write `$00` and you are done.

You do not need a print port for Book 3 — storing `"42", 0` in RAM and inspecting bytes after `halt` is enough proof.

---

## `main`: orchestration

```asm
.org $0000
main:
    ld hl, message
    call strlen_u8
    ld (str_len), a

    ld hl, message
    ld de, buffer
    call strcpy_u8

    ld hl, buffer
    ld de, message
    call strcmp_u8
    ...
    ld hl, message
    ld c, CHAR_L
    call str_find_char
    ld (find_index), a
    halt
```

Reload HL (and DE when needed) before each call — the string routines advance pointers as documented.

---

## Memory layout after `halt`

```
  $8000  ┌──┬──┬──┬──┬──┬──┬──┬──┐
         │48│45│4C│4C│4F│00│..│..│  message / buffer
  $8008  ├──┬──┬──┬──┐
         │05│01│02│  │  str_len, copy_ok, find_index
         └──┴──┴──┴──┘
```

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/03_string_length.asm`](examples/03_string_length.asm) | `str_len` = 5, `copy_ok` = 1, `find_index` = 2 |

```sh
azm examples/03_string_length.asm
azm --rc warn examples/03_string_length.asm
```

Single-step through `strlen_u8` once: watch B increment only on non-zero bytes, then confirm HL stops on the null.

---

## Summary

- Pick **representation first**: null-terminated bytes end with `$00`.
- **Length** is how many characters precede the null; **capacity** is how much RAM you reserved.
- **HL** (and **DE** for copy/compare) is the pointer; advance with `inc hl` / `inc de`.
- **`or a` after `ld a,(hl)`** tests the terminator without changing A.
- **`strcpy_u8`** copies through the null; **`strcmp_u8`** and **`str_find_char`** reuse the same walk with different exit tests.
- **AZMDoc** on every string routine keeps pointer roles checkable with `--rc warn`.

---

## Exercises

1. Change `message` to `.db "AZM", 0`. Predict `str_len` and `find_index` for `'M'` before running the program.
2. Add `strchr` that returns HL pointing at the match (or HL = 0 / a sentinel label meaning not found). Document `in`/`out`/`clobbers`.
3. Implement `strcat_u8`: HL destination, DE source — scan HL to its null, then `strcpy` from DE into that position.
4. Bounded copy: `strncpy_u8` with B = max bytes to write; stop early if source ends, but never write more than B bytes (pad with null if required).
5. Hand-trace `strcmp_u8` on `"AB"` vs `"A"`. Which return code should you get?
6. Store the decimal string for `str_len` into a 4-byte workspace after computing length (exercise direction from "print prep").

---

[← Arrays and Loops](02-arrays-and-loops.md) | [Book 3](index.md) | [Bit Patterns →](04-bit-patterns.md)
