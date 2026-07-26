---
layout: default
title: "Strings"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 4
---
[← Arrays and Loops](02-arrays-and-loops.md) | [Book 3](index.md) | [Bit Patterns →](04-bit-patterns.md)

# Chapter 3 — Strings

Chapter 2 walked a byte table with a **fixed length** in B. Text in memory usually has no fixed length: you stop when you see a sentinel, not when a counter reaches eight.

The companion program is [`examples/03_string_length.asm`](examples/03_string_length.asm).

---

## The problem: text without a length field

You need to know how many characters are in a message before formatting a screen line. You need to copy a label into a buffer. You need to find the first `'/'` in a path.

---

## Representation: null-terminated bytes

A **null-terminated string** (C-style) is a sequence of byte values followed by a zero byte `$00`. The zero is not part of the visible text; it marks the end.

```asm
.org $8000
message:
    .db "HELLO", 0
buffer:
    .ds byte[8]
```

`message` points at `'H'`.

AZM also accepts a string directive that appends the terminator for you (Book 2 Chapter 3):

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

`strcpy` must not write past capacity if the source is longer than the destination buffer. This chapter copies into a buffer sized for the demo; Chapter 5's records are a natural place to store `(capacity)` beside `(data)`.

### The alternative: length in byte zero

Byte 0 holds the count, bytes 1..n hold the text. That saves a scan for length but shifts every pointer (`HL` must skip the count byte). Null-terminated layout is the convention in this book because the walk is uniform; every algorithm uses the same `ld a,(hl)` / `or a` / `jr z` spine.

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

**Callee-save:** push BC/DE/HL if you use them as scratch and the `.routine` block does not list them under `clobbers`.

**Invariant for traversal** (owner-local label `_loop` or `_scan`):

> HL points at the next byte to examine. All bytes before HL in this string have already been processed.

---

## The core loop: test for zero without destroying the byte

```asm
    ld a, (hl)
    or a
    jr z, _at_end
    ; ... use A as the character ...
    inc hl
```

`or a` sets the Zero flag from A's value without changing A. That is the standard Z80 idiom for "is this byte zero?" It plays the same role as `cp 0`, but `or a` is one byte cheaper.

---

## `strlen_u8`: count before the null

```asm
; strlen_u8: count bytes before null (does not include terminator)
.routine in HL out A clobbers F,B,HL
strlen_u8:
    ld b, 0
_loop:
    ld a, (hl)
    or a
    jr z, _done
    inc hl
    inc b
    jr _loop
_done:
    ld a, b
    ret
```

The loop invariant: at `_loop`, B equals the number of non-null bytes already passed.

For `message` above, `str_len` at `$800E` should hold `$05` after `halt`.

---

## `strcpy_u8`: copy byte-by-byte through the null

Copying uses **two pointers**: HL reads, DE writes.

```asm
; strcpy_u8: copy null-terminated string HL → DE (terminator included)
.routine in HL,DE out DE clobbers AF,HL
strcpy_u8:
_copy:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    or a
    jr nz, _copy
    ret
```

The last iteration copies the zero terminator. That matters if later code scans `buffer` with the same null-terminated walk.

After `call strcpy_u8`, DE points one past the null. Reload HL from `message` before another pass; do not assume DE still equals the destination base.

---

## `str_find_char`: linear search with an index

Chapter 2's `find_byte_ge` returned the first index where `values[i] >= C`. String search is the same walk with a different test:

```asm
; str_find_char: index of first C in string, or $FF if absent
.routine in HL,C out A clobbers F,B,HL
str_find_char:
    ld b, 0
_scan:
    ld a, (hl)
    or a
    jr z, _missing
    cp c
    jr z, _found
    inc hl
    inc b
    jr _scan
_found:
    ld a, b
    ret
_missing:
    ld a, $FF
    ret
```

Invariant at `_scan`: no byte at index `< B` equals C.

For `'L'` in `"HELLO"`, `find_index` should be `$02` (0-based).

---

## `strcmp_u8`: walk two strings together

Lexicographic compare reads one byte from each string until bytes differ or both are null.

```asm
; strcmp_u8: 0 if equal, 1 if HL string greater, $FF if less
.routine in HL,DE out A clobbers F,BC,HL,DE
strcmp_u8:
_loop:
    ld a, (hl)
    push af
    ld a, (de)
    pop bc
    cp b
    jr c, _greater
    jr nz, _less
    or a
    jr z, _equal
    inc hl
    inc de
    jr _loop
_less:
    ld a, $FF
    ret
_greater:
    ld a, 1
    ret
_equal:
    xor a
    ret
```

Order matters: compare characters **before** you decide both strings ended. A holds the DE character and B holds the HL character, so `cp b` computes DE - HL. Carry therefore means the HL string is greater. If both bytes are zero, Z remains set and `_equal` returns 0. If one string is a prefix of the other, the zero byte orders the shorter string before the longer one.

The companion program copies `message` into `buffer`, then compares the two buffers. `copy_ok` at `$800F` should be `$01`.

---

## Preparing for print: digits and terminators

Display routines need ASCII, not raw small integers. The digit loop from Chapter 1 still applies: divide the value by 10, add `'0'` to each remainder, store backward into a small buffer, null-terminate.

Sketch of the invariant for decimal output into a byte buffer at DE:

> HL (or DE) points at the next free byte leftward; the digits emitted so far sit to the right; when the value reaches zero, the digits are complete.

You do not need a print port for Book 3. Storing `"42", 0` in RAM and inspecting bytes after `halt` is enough proof.

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

---

## Memory layout after `halt`

```
  $8000  ┌──┬──┬──┬──┬──┬──┐
         │48│45│4C│4C│4F│00│              message
  $8006  ├──┼──┼──┼──┼──┼──┬──┬──┐
         │48│45│4C│4C│4F│00│..│..│     buffer, 8 bytes reserved
  $800E  ├──┼──┼──┤
         │05│01│02│                    str_len, copy_ok, find_index
         └──┴──┴──┘
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

## Exercises

1. Change `message` to `.db "AZM", 0`. Predict `str_len` and `find_index` for `'M'` before running the program.
2. Add `strchr` that returns HL pointing at the match (or HL = 0 / a sentinel label meaning not found). Document `in`/`out`/`clobbers`.
3. Implement `strcat_u8`: HL destination, DE source. Scan HL to its null, then `strcpy` from DE into that position.
4. Bounded copy: `strncpy_u8` with B = max bytes to write; stop early if source ends, but never write more than B bytes (pad with null if required).
5. Hand-trace `strcmp_u8` on `"AB"` vs `"A"`. Which return code should you get?
6. Store the decimal string for `str_len` into a 4-byte workspace after computing length (exercise direction from "print prep").

---

[← Arrays and Loops](02-arrays-and-loops.md) | [Book 3](index.md) | [Bit Patterns →](04-bit-patterns.md)
