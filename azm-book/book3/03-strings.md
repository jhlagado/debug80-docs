---
layout: default
title: "Strings"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 4
---

# Strings

Chapter 2 walked a byte table with a **fixed length** in B. Text in memory
usually carries its end inside the data: a sentinel byte stops the walk. The
complete program in
[`examples/03_string_length.asm`](examples/03_string_length.asm) measures,
copies, compares and searches one null-terminated string.

---

## Finding where the text ends

The examples cover three common operations: finding a message length before
formatting a screen line, copying a label into a buffer and locating the first
`'/'` in a path.

---

## Representation: null-terminated bytes

A **null-terminated string** (C-style) is a sequence of byte values followed by a zero byte `$00`, which marks the end of the text.

```asm
.org $8000
message:
    .db "HELLO", 0
buffer:
    .ds byte[8]
```

`message` points at `'H'`.

AZM also accepts a string directive that appends the terminator automatically
(Book 2 Chapter 3):

```asm
message:
    .cstr "HELLO"
```

Both forms emit the same bytes: `48 45 4C 4C 4F 00`.

### Length vs capacity

Length and capacity describe different limits:

| Concept | Meaning |
|---------|---------|
| **Length** | Characters before the null — five for `"HELLO"`. |
| **Capacity** | Bytes reserved in RAM — eight in `buffer` above. |

`strcpy` must not write past capacity if the source is longer than the destination buffer. This chapter copies into a buffer sized for the demo; Chapter 5's records are a natural place to store `(capacity)` beside `(data)`.

![Length is what strlen_u8 counts, capacity is what .ds reserved, and the caller alone keeps one inside the other](../../assets/images/azm-book/book3/string-layout.svg)

### The alternative: length in byte zero

Byte 0 holds the count, bytes 1..n hold the text. That saves a scan for length but shifts every pointer (`HL` must skip the count byte). Null-terminated layout is the convention in this book because the walk is uniform; every algorithm uses the same `ld a,(hl)` / `or a` / `jr z` spine.

![The same five characters, stored two ways: the terminator at the end, or the count at the front](../../assets/images/azm-book/book3/string-representations.svg)

---

## String calling convention

Unless a routine says otherwise, Book 3 string routines use:

| Role | Register | Notes |
|------|----------|--------|
| Current / source pointer | HL | Points at next byte to read |
| Destination pointer | DE | Used by copy and compare |
| Search character | C | Compared with `cp c` |
| Length or index result | A | 0–255; these routines handle strings of up to 255 bytes |
| Not found sentinel | A = `$FF` | Same idea as Chapter 2 search |

**Callee-save:** push BC/DE/HL when you use as scratch any register the `.routine` block leaves out of `clobbers`.

**Invariant for traversal** (owner-local label `_loop` or `_scan`):

> HL points at the next byte to examine. All bytes before HL in this string have already been processed.

---

## The core loop: test for zero and keep the byte

```asm
    ld a, (hl)
    or a
    jr z, _at_end
    ; ... use A as the character ...
    inc hl
```

`or a` sets the Zero flag from A's value and leaves A intact. It occupies one
byte, one fewer than `cp 0`.

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

The 8-bit result limits this routine to strings of at most 255 bytes. Longer
strings make B wrap to zero before the terminator.

For `message` above, `str_len` at `$800E` should hold `$05` after `halt`.

---

## `strcpy_u8`: copy byte-by-byte through the null

Copying uses **two pointers**: HL reads, DE writes.

```asm
; strcpy_u8: copy null-terminated string HL -> DE (terminator included)
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

The last iteration copies the zero terminator so later code can scan `buffer`
with the same null-terminated walk.

![HL reads and DE writes in step, and the loop only exits once the terminator has been written](../../assets/images/azm-book/book3/two-pointer-copy.svg)

After `call strcpy_u8`, DE points one byte past the null, so `main` reloads both
pointers before the compare: `ld hl, buffer` and `ld de, message`.

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

Invariant at `_scan`: every byte at index `< B` differs from C.

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

![Both pointers advance together, and the pass that settles the answer is the one on the two terminators](../../assets/images/azm-book/book3/strcmp-walk.svg)

The example copies `message` into `buffer`, then compares the two buffers.
`copy_ok` at `$800F` should be `$01`.

---

## Preparing for print: digits and terminators

Display routines need ASCII, so a small integer is converted digit by digit. A
decimal-output loop divides the value by 10, adds `'0'` to each remainder,
stores the digits backward into a small buffer and appends a null terminator.

Sketch of the invariant for decimal output into a byte buffer at DE:

> HL (or DE) points at the next free byte leftward; the digits emitted so far sit to the right; when the value reaches zero, the digits are complete.

Storing `"42", 0` in RAM provides a result that can be verified after `halt`.

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
    or a
    jr nz, _copy_bad
    ld a, 1
    jr _store_copy_ok
_copy_bad:
    xor a
_store_copy_ok:
    ld (copy_ok), a

    ld hl, message
    ld c, CHAR_L
    call str_find_char
    ld (find_index), a
    halt
```

---

## Memory layout after `halt`

![Where the three results land, and the two spare bytes at the end of buffer](../../assets/images/azm-book/book3/string-workspace.svg)

---

## Running the string routines

[`examples/03_string_length.asm`](examples/03_string_length.asm) should leave
`str_len` = 5, `copy_ok` = 1 and `find_index` = 2:

| File | What to verify |
|------|----------------|
| [`examples/03_string_length.asm`](examples/03_string_length.asm) | `str_len` = 5, `copy_ok` = 1, `find_index` = 2 |

```sh
azm examples/03_string_length.asm
azm --rc warn examples/03_string_length.asm
```

A single-step trace of `strlen_u8` shows B incrementing only for non-zero bytes
and HL stopping on the null.

---

## Exercises

[Exercise notes](exercise-notes.md#chapter-3-strings) give results, checks and
implementation guidance.

1. **Sentinel walk.** With `message` changed to `.db "AZM", 0`, a prediction
   should give `str_len` and the indices returned when C is `'M'`, `'A'` and
   `'Z'`. A RAM check can verify all four results, and the explanation should
   state the traversal invariant at the top of `str_find_char`.
2. **Two-pointer trace.** A trace of `strcpy_u8` copying `"AZ", 0` should
   record `(HL)`, `(DE)` and A on each iteration, including the terminator
   pass. Its invariant should state the relationship between the source and
   destination bytes already passed.
3. **Pointer-returning search.** A new `strchr_u8` uses HL and C as inputs; on
   success HL points at the first match and carry is set; when absent HL is
   zero and carry is clear. Its full `.routine` contract and tests should cover
   `"HELLO"` with `'H'`, `'L'`, `'O'`, `'Z'`, plus the empty string with
   `'A'`.
4. **Lexicographic verification.** A trace of `strcmp_u8` on `"AB"` against
   `"A"` should identify the subtraction that sets the decisive flags. Further
   tests should verify
   `"A"/"A" -> 0`, `"AB"/"A" -> 1`, `"A"/"AB" -> $FF` and
   `"ABC"/"ABD" -> $FF`.

### Extensions

5. **Extension — Concatenation with capacity.** A `strcat_u8` routine uses HL
   as destination, DE as source and B as total destination capacity. Its
   design should define a carry result for success or insufficient space
   before the implementation is written. Tests should use `"AZ" + "M"` in
   capacities 4 and 3 and confirm that failure leaves the original destination
   unchanged.
6. **Extension — Bounded copy.** A bounded copy uses HL as source, DE as
   destination and B as capacity. The result must be null-terminated whenever
   B is non-zero and must write only within the first B destination bytes.
   Capacity tests 0, 1, 4 and 8 should use source `"HELLO"`.
