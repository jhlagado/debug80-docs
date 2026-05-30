---
layout: default
title: "Chapter 2 — Arrays and Loops"
parent: "AZM Book 2 — Algorithms and Data Structures"
nav_order: 3
---
[← Foundations](01-foundations.md) | [Book 2](index.md) | [Strings →](03-strings.md)

# Chapter 2 — Arrays and Loops

Chapter 1 kept every value in registers. Sorting and searching need **indexed storage**: many bytes in a row, one element selected by offset. This chapter treats a byte table as an array, states loop invariants in plain language and implements insertion sort plus linear search in flat AZM.

The companion program is [`examples/02_insertion_sort.asm`](examples/02_insertion_sort.asm).

---

## The problem: sort and find

You have eight scores in RAM, in arbitrary order. You need them ascending for display, then you need the index of the first score at least 5.

Two separate algorithms, one representation:

1. **Insertion sort** — build a sorted prefix; insert each new element into its place.
2. **Linear search** — walk from index 0 until `values[i] >= threshold` or you run out.

Both depend on the same array layout.

---

## Array representation

A byte array is a label, a length and consecutive bytes in memory:

```asm
ARRAY_LEN .equ 8

.org $8000
values:
    .db 9, 4, 6, 2, 8, 1, 7, 3
```

`values` is the **base address** — the address of `values[0]`, not the first element's numeric value. `ARRAY_LEN` is a compile-time constant from `.equ`.

Reserve uninitialized storage with layout types when you want self-documenting size (Book 1 Chapter 13):

```asm
values:
    .ds byte[8]
```

The sort example uses `.db` with initial data so you can see wrong order before `halt`.

### Indexing with HL

To read `values[i]` when `i` is small and fits in one byte:

1. Load the base into HL (or DE if HL is busy).
2. Form offset `i` in BC with B = 0 and C = i.
3. `add hl, bc` — HL now points at element i.
4. `ld a, (hl)` — A holds the element.

```
  values + 0   values + 1   values + 2
  ┌────┬────┬────┬────┬────┬────┬────┬────┐
  │  9 │  4 │  6 │  2 │  8 │  1 │  7 │  3 │
  └────┴────┴────┴────┴────┴────┴────┴────┘
    ▲
    HL when i = 0
```

For sequential scans, `inc hl` after each read is cheaper than recomputing base + i. Random access by index uses `add hl, bc`.

---

## Loop invariants

An invariant is a statement that stays true every time control reaches a particular label. Naming it is how you know the loop is still correct after you edit it.

**Insertion sort outer loop** (label `.outer`, index in C):

> Before each outer iteration, bytes `values[0 .. c-1]` are sorted ascending.

**Inner shift loop** (label `.inner`, index in B = j):

> The key byte sits in `key_byte`. Bytes `values[j+1 .. c]` equal the old `values[j .. c-1]` from before this inner pass. Bytes `values[0 .. j]` are unchanged and still sorted.

**Linear search** (label `.scan`):

> If the loop has run k times, no element among `values[0 .. k-1]` satisfies `>= threshold`.

When output is wrong, check the invariant first — not every opcode.

---

## Insertion sort

Pseudocode:

```
for i from 1 to length-1:
    key = values[i]
    j = i - 1
    while j >= 0 and values[j] > key:
        values[j+1] = values[j]
        j = j - 1
    values[j+1] = key
```

### Keeping the base in DE

The inner loop moves HL along the table. If you only keep HL, you lose the base address. **DE holds the base** for the whole routine; HL is recomputed from DE and the current index.

Length arrives in B but inner loops reuse B. Store it in workspace. Place scratch bytes after the table in the same `.org $8000` block (AZM cannot place a later `org` below an earlier data segment):

```asm
found_index:
    .ds byte
key_byte:
    .ds byte
sort_len:
    .ds byte
```

Entry (store length through HL — `ld (sort_len), b` is not a supported AZM form):

```asm
@insertion_sort:
    ld hl, sort_len
    ld (hl), b
    ld de, hl
    ld c, 1
```

### Load the key

```asm
    ld hl, de
    ld b, 0
    add hl, bc          ; HL = base + i (C = i)
    ld a, (hl)
    push af
    ld hl, key_byte
    pop af
    ld (hl), a
    ld b, c
    dec b               ; B = j = i - 1
```

### Inner shift

Compare `values[j]` to `key_byte`. While the element is greater, shift it right by one index:

```asm
InsertInner:
    ld a, b
    or a
    jr z, InsertPlace
    ld hl, de
    ld a, b
    ld c, a
    ld b, 0
    add hl, bc          ; HL = &values[j]
    ld a, (hl)
    ...
    ld hl, key_byte
    ld a, (hl)
    cp e                ; E holds values[j] from ld a,(hl) above
```

The listing uses `ld a, (hl)` then `cp` against the key loaded into A from `(key_byte)`. If the element is greater, copy it to `values[j+1]`, decrement j, repeat.

### Place the key

When j < 0 or `values[j] <= key`, write `key_byte` at `values[j+1]` (implemented as base + j + 1 with careful index handling at `InsertPlace`).

Full source: see [`examples/02_insertion_sort.asm`](examples/02_insertion_sort.asm).

After `halt`, memory at `$8000` should read:

```
01 02 03 04 06 07 08 09
```

---

## Linear search

After sorting, find the first index where `values[i] >= C`:

```asm
; find_byte_ge: first index where values[i] >= C, or $FF if none
;!      in        HL, C
;!      out       A
;!      clobbers  AF, B, HL
@find_byte_ge:
    ld b, 0
FindByteScan:
    ld a, (hl)
    cp c
    jr nc, FindByteFound
    inc hl
    inc b
    ld a, b
    cp ARRAY_LEN
    jr c, FindByteScan
    ld a, $FF
    ret
FindByteFound:
    ld a, b
    ret
```

`cp c` / `jr nc` uses the unsigned sense from Book 1: carry set means A ≥ C. B doubles as the running index. `$FF` means not found — a sentinel index, not a valid offset for an 8-element table.

With threshold 5 on the sorted table, the first match is 5 at index 4. `found_index` at `$8008` should hold `$04`.

---

## `main`: orchestration

```asm
.org $0000
main:
    ld hl, values
    ld b, ARRAY_LEN
    call insertion_sort

    ld hl, values
    ld c, THRESHOLD
    call find_byte_ge
    ld (found_index), a
    halt
```

Reload HL before the second call — `insertion_sort` returns HL equal to the base (in DE), but treating reload as mandatory habit matches Book 1's lesson about clobbered pointers.

---

## When to use layout types here

This chapter uses plain `.db` because each element is one byte. When elements are records:

```asm
.type Score
value   .byte
name    .field byte[16]
.endtype

leaderboard:
    .ds Score[8]
```

Stride becomes `sizeof(Score)` and field offsets use `offset(Score, value)` — the subject of Chapter 5. The indexing pattern (base + index × stride) is the same; only the stride changes.

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/02_insertion_sort.asm`](examples/02_insertion_sort.asm) | Sorted bytes at `values`, `found_index` = 4 for threshold 5 |

```sh
azm examples/02_insertion_sort.asm
```

Single-step through one outer iteration in the emulator: watch `key_byte` and confirm the sorted prefix grows.

---

## Summary

- A **byte array** is a base label plus `.equ` length; index with `add hl, bc` or sequential `inc hl`.
- **DE = base** is a practical invariant when HL walks inside the table.
- **Workspace** holds `key_byte` and `sort_len` when B/C/HL are dedicated to indices.
- **Insertion sort** maintains "prefix sorted" as its outer invariant.
- **Linear search** returns an index or `$FF`; flags come from `cp` immediately before the branch.

---

## Exercises

1. Hand-trace insertion sort for the first three outer iterations (i = 1, 2, 3). Write the table contents after each.
2. Change one `.db` value to 0 and rerun. Does the sort still terminate correctly? Why?
3. Implement descending sort by changing one comparison in the inner loop.
4. Add `find_byte_eq` that returns the index of the first element equal to C, or `$FF`.
5. Replace insertion sort with bubble sort using nested `djnz` loops. State the outer loop invariant in one sentence.
6. Reserve the table with `.ds byte[8]` and initialize it in `main` with eight `ld (hl), a` stores instead of `.db`.

---

[← Foundations](01-foundations.md) | [Book 2](index.md) | [Strings →](03-strings.md)
