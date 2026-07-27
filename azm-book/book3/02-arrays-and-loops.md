---
layout: default
title: "Arrays and Loops"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 3
---

# Arrays and Loops

Chapter 1 kept every value in registers. Sorting and searching need **indexed storage**: many bytes in a row, one element selected by offset.

The companion program is [`examples/02_insertion_sort.asm`](examples/02_insertion_sort.asm).

---

## The problem: sort and find

The example starts with eight scores in RAM in arbitrary order. Displaying them
requires ascending order, followed by the index of the first score that is at
least 5.

Two separate algorithms, one representation:

1. **Insertion sort**: build a sorted prefix; insert each new element into its place.
2. **Linear search**: walk from index 0 until `values[i] >= threshold` or you run out.

---

## Array representation

A byte array is a label, a length and consecutive bytes in memory:

```asm
.org $8000
values:
    .db 9, 4, 6, 2, 8, 1, 7, 3
ARRAY_LEN .equ $ - values
```

`values` is the **base address**, the address of `values[0]`, not the first
element's numeric value. `$` is the current assembly address, so `$ - values`
is the number of bytes the `.db` line just emitted. Writing `ARRAY_LEN .equ 8`
instead would mean counting the initialisers by eye and recounting them after
every edit.

Layout types provide self-documenting sizes when an array needs uninitialized
storage ([Book 1 Chapter 5](../book1/05-layout-system.md)):

```asm
values:
    .ds byte[8]
```

The sort example uses `.db` with initial data, making the original unsorted
order visible before execution reaches `halt`.

### Indexing with HL

Reading `values[i]` when `i` fits in one byte takes four steps:

1. The base address goes into HL, or into DE when HL is already in use.
2. BC holds offset `i`, with B = 0 and C = i.
3. `add hl, bc` advances HL to element i.
4. `ld a, (hl)` loads the element into A.

![Four instructions turn a label and an index into the address of one element](../../assets/images/azm-book/book3/array-indexing.svg)

For sequential scans, `inc hl` after each read is cheaper than recomputing base + i.

---

## Loop invariants

An invariant is a statement that stays true every time control reaches a particular label.

**Insertion sort outer loop** (label `_outer`, index in C):

> Before each outer iteration, bytes `values[0 .. c-1]` are sorted ascending.

**Inner shift loop** (label `_inner`, next candidate derived from `sort_j`):

> The key byte sits in `key_byte`. `sort_j` is one greater than the next index
> to inspect. Elements already passed on the right have been shifted one place,
> while the untouched prefix remains sorted.

**Linear search** (label `_scan`):

> If the loop has run k times, every element among `values[0 .. k-1]` is below `threshold`.

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

![Every pass selects a key, shifts the larger values right, drops the key into the hole and advances the sorted boundary](../../assets/images/azm-book/book3/insertion-sort-pass.svg)

### Keeping the base in DE

If you only keep HL, you lose the base address. **DE holds the base** for the whole routine; HL is recomputed from DE and the current index.

Length arrives in B, but the inner loops also need B, so the routine stores the
length in workspace. Its scratch bytes follow the table in the same `.org
$8000` block. AZM maintains a forward-only placement cursor for each segment,
so a later data `.org` places bytes at the cursor and leaves the earlier ones
where they are:

```asm
found_index:
    .ds byte
key_byte:
    .ds byte
sort_index:
    .ds byte
sort_j:
    .ds byte
sort_len:
    .ds byte
```

Entry (B reaches memory through `(hl)`, since `ld (nn), a` is the Z80's only
absolute byte store):

```asm
insertion_sort:
    push hl
    pop de
    ld hl, sort_len
    ld (hl), b
    ld c, 1
```

Copying HL into DE takes two instructions: `push hl` / `pop de` here, or
`ld d, h` / `ld e, l`.

### Loading the key

```asm
    ld a, c
    ld (sort_index), a
    push de
    pop hl
    ld b, 0
    add hl, bc          ; HL = base + i (C = i)
    ld a, (hl)
    push af
    ld hl, key_byte
    pop af
    ld (hl), a
    ld a, c
    ld (sort_j), a
```

### Inner shift

The inner loop compares `values[j]` with `key_byte`. An element greater than the
key moves right by one index:

```asm
_inner:
    ld a, (sort_j)
    dec a
    ld (sort_j), a
    cp $FF
    jr z, _place
    push de
    pop hl
    ld c, a
    ld b, 0
    add hl, bc          ; HL = &values[j]
    push hl
    ld hl, key_byte
    ld a, (hl)
    pop hl
    cp (hl)
    jr nc, _place
    ld a, (hl)
    inc hl
    ld (hl), a
    jr _inner
```

### Placing the key

`sort_j` preserves j while B and C form a 16-bit table offset. When j < 0 or
`values[j] <= key`, write `key_byte` at `values[j+1]`. `sort_index` then
restores the outer-loop index after C has been reused for address arithmetic.

Full source: see [`examples/02_insertion_sort.asm`](examples/02_insertion_sort.asm).

After `halt`, memory at `$8000` should read:

```
01 02 03 04 06 07 08 09
```

![Seven passes over the book's own data, the sorted prefix growing by one byte each time](../../assets/images/azm-book/book3/insertion-sort.svg)

---

## Linear search

After sorting, find the first index where `values[i] >= C`:

```asm
; find_byte_ge: first index where values[i] >= C, or $FF if none
.routine in HL,C out A clobbers F,B,HL
find_byte_ge:
    ld b, 0
_scan:
    ld a, (hl)
    cp c
    jr nc, _found
    inc hl
    inc b
    ld a, b
    cp ARRAY_LEN
    jr c, _scan
    ld a, $FF
    ret
_found:
    ld a, b
    ret
```

`cp c` / `jr nc` uses the unsigned sense from Book 2: `cp` subtracts, so carry is set when A < C and clear when A ≥ C. `jr nc` therefore takes the branch on a match. `$FF` means not found: a sentinel chosen because an 8-element table only ever uses indices 0 to 7.

With threshold 5 on the sorted table (1, 2, 3, 4, 6, 7, 8, 9), the first element of at least 5 is the 6 at index 4. `found_index` at `$8008` should hold `$04`.

![The walk stops at the first element the compare puts at or above the threshold](../../assets/images/azm-book/book3/linear-search.svg)

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

The second call reloads HL because the `insertion_sort` contract lists it as
clobbered.

---

## Layout types for record elements

This chapter uses plain `.db` because each element is one byte. When elements are records:

```asm
Score .type
value   .byte
name    .field byte[16]
.endtype

leaderboard:
    .ds Score[8]
```

Stride becomes `sizeof(Score)` and field offsets use `offset(Score, value)`, the subject of Chapter 5.

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/02_insertion_sort.asm`](examples/02_insertion_sort.asm) | Sorted bytes at `values`, `found_index` = 4 for threshold 5 |

```sh
azm examples/02_insertion_sort.asm
```

One outer iteration in the emulator shows `key_byte` holding the selected value
while the sorted prefix grows.

---

## Exercises

1. A hand trace should cover the first three outer iterations (i = 1, 2, 3)
   and record the table contents after each iteration.
2. Changing one `.db` value to 0 provides a case for determining whether the
   sort still terminates correctly and why.
3. Changing one comparison in the inner loop should produce a descending sort.
4. A `find_byte_eq` routine should return the index of the first element equal
   to C, or `$FF`.
5. A bubble sort can use nested `djnz` loops and should include a one-sentence
   outer-loop invariant.
6. An alternative table uses `.ds byte[8]` for its reservation and eight `ld
   (hl), a` stores in `main` for initialization.
