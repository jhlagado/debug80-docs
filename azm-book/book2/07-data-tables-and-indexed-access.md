---
layout: default
title: "Data Tables and Indexed Access"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 7
---

# Data Tables and Indexed Access

Table-based programs need sequential access for processing every entry and
indexed access for reaching one entry directly.

---

## Declaring a byte table

An `.org` before a label sets its address, and `.db` then declares a
sequence of byte values:

```asm
.org $8000
scores: .db 10, 20, 30, 40, 50, 60
```

The assembler lays them out in memory in the order listed: `$8000` holds 10,
`$8001` holds 20, `$8002` holds 30 and so on.

The name `scores` refers to the address of the first byte in the array, which is
the address `$8000`. It is not the value 10. `(scores)` is the first byte stored there.

Word tables work the same way, with two bytes per entry in little-endian order:

```asm
.org $8010
widths: .dw 100, 200, 300, 400
```

`$8010` and `$8011` together hold 100 (low byte `$64` at `$8010`, high byte
`$00` at `$8011`).

---

## HL-based sequential access

HL holds an address. `ld a, (hl)` reads the byte at that address. `inc hl`
advances HL to the next byte.

A DJNZ loop over a byte table looks like this:

```asm
ld hl, scores      ; HL = address of first entry
ld b, 6            ; B = number of entries
loop_top:
  ld a, (hl)       ; A = current entry
  ; ... process A ...
  inc hl           ; advance to next entry
  djnz loop_top    ; repeat for all entries
```

The order matters: the body reads
the entry first (`ld a, (hl)`), processes it, then advances (`inc hl`). An
increment before the read would skip the first entry.

![HL walking a byte table one entry at a time.](../../assets/images/azm-book/book2/hl-walking.svg)

Word entries are two bytes wide, so HL advances by two between them:

```asm
ld hl, widths
ld b, 4
word_loop:
  ld e, (hl)       ; low byte of current word
  inc hl
  ld d, (hl)       ; high byte of current word
  inc hl           ; now HL points to next word
  ; DE holds current word value
  djnz word_loop
```

---

## The address vs value distinction

`ld hl, scores` loads the address of the table into HL. HL does not hold 10
(the first element's value).

Only `ld a, (hl)` produces the value stored in the table.

---

## Labels, variables and code share the same memory

A label that names a variable and a label that marks a point in code are the
same kind of thing to the assembler: a memory address, a plain 16-bit number. A
load can read from a code address, and a jump can target a data address. In the
second case the CPU interprets data bytes as instructions, with results
determined by those byte values.

---

## IX-based displaced access

IX is a 16-bit index register. Its specific capability is the `(ix+d)`
addressing mode: `d` is a signed byte offset, any value from -128 to +127 and
`ld a, (ix+d)` reads the byte at address IX + d while IX keeps pointing where
it did.

Once IX holds the base of a record, every field can be named by its
offset from that base:

```asm
; A three-byte record: offset 0 = id, offset 1 = high byte, offset 2 = low byte
ld ix, record_base   ; IX = base of the record
ld a, (ix+0)         ; A = id field
ld b, (ix+1)         ; B = high byte field
ld c, (ix+2)         ; C = low byte field
; IX is unchanged throughout - all three fields read from one base address
```

The displacement field holds -128 through +127; an offset outside that range is
an assembler error.

![One load of the base, then every field by name. IX is unchanged throughout.](../../assets/images/azm-book/book2/ix-displacement.svg)

---

## Accessing a specific table entry by index

Entry `n` in a byte table is at `table_base + n`. Small indices known at
assembly time can appear directly as offsets:

```asm
ld ix, scores        ; IX = base of scores table
ld a, (ix+0)         ; entry 0: value 10
ld a, (ix+3)         ; entry 3: value 40
```

For a runtime index, the general approach is to add the index to HL:

```asm
ld hl, scores        ; HL = base
ld de, 3             ; DE = index (entry 3)
add hl, de           ; HL = scores + 3
ld a, (hl)           ; A = entry 3 = 40
```

`add hl, de` adds the 16-bit value in DE to HL, and the load takes whatever is at the result, so an index past the table
length reads the bytes that follow the table in memory.

---

## The example: `examples/05_data_tables.asm`

```asm
TableLen .equ 6
RecSize  .equ 3

.org $8000
scores:  .db 10, 20, 30, 40, 50, 60
records: .db $01, $01, $A0
         .db $02, $02, $B0
         .db $03, $03, $C0

.org $8020
sum:       .db 0
max_score: .db 0
rec1_id:   .db 0
rec1_lo:   .db 0
```

**Section A: sequential HL loop, accumulating a sum.**

```asm
ld hl, scores
ld b, TableLen
ld a, 0
hl_loop:
  add a, (hl)
  inc hl
  djnz hl_loop
ld (sum), a
```

HL walks the six score bytes.
After six iterations, A = 10 + 20 + 30 + 40 + 50 + 60 = 210 (`$D2`), which is
stored in `sum`.

**Section B: sequential HL loop, finding the maximum.**

```asm
ld hl, scores
ld b, TableLen
ld a, 0
max_loop:
  ld c, (hl)
  cp c
  jr nc, no_new_max
  ld a, c
no_new_max:
  inc hl
  djnz max_loop
ld (max_score), a
```

A holds the running maximum. The flag-before-branch check shows that `cp c` is
the instruction that sets the flag; `jr nc` reads it immediately after with
nothing in between; carry being clear means A ≥ C, so `jr nc` skips the update
and the running maximum is unchanged. `ld a, c` runs only when `cp c` found A
less than C, which is a new maximum. After six entries, `max_score` holds 60 (`$3C`).

**Section C: IX+d access on a packed record table.**

```asm
ld ix, records + RecSize    ; IX = base of record 1
ld a, (ix+0)                ; A = id field
ld (rec1_id), a
ld a, (ix+2)                ; A = lo field
ld (rec1_lo), a
```

`records + RecSize` is a compile-time address arithmetic expression: the
assembler computes `address_of_records + 3` before emitting any code. IX is
loaded with that address in a single `ld ix, imm16` instruction.

The displacement encodes each offset directly, so all three reads work from the
single base address in IX. `rec1_id` receives `$02` (the id byte of record 1)
and `rec1_lo` receives `$B0`.

---

## Block operations: LDIR and friends

The Z80 has hardware instructions for copying or scanning ranges of memory. The
most useful is `ldir`.

`ldir` copies BC bytes from the address in HL to the address in DE. After each
byte is copied, HL and DE are both incremented and BC is decremented. The
instruction repeats until BC reaches zero.

The manual and block-instruction forms for copying four bytes show the difference:

```asm
; Without ldir: a manual copy loop
ld hl, source     ; HL = source address
ld de, dest       ; DE = destination address
ld b, 4           ; B = byte count
copy_loop:
  ld a, (hl)      ; A = byte from source
  ld (de), a      ; write to destination
  inc hl
  inc de
  djnz copy_loop

; With ldir: one instruction
ld hl, source     ; HL = source address
ld de, dest       ; DE = destination address
ld bc, 4          ; BC = byte count (note: BC, not just B)
ldir              ; copy 4 bytes, HL and DE advance, BC reaches 0
```

After `ldir`, HL points one byte past the last source byte, DE points one byte
past the last destination byte, and BC holds zero.

![What ldir leaves in HL, DE and BC. The registers ending up past the data is the part that catches people out.](../../assets/images/azm-book/book2/ldir-copy.svg)

`ldir` uses BC as a 16-bit counter. Counts from 1 to 65,535 have their ordinary
meaning; an initial BC value of zero wraps on the first decrement and copies
65,536 bytes. The manual loop above uses B as an 8-bit counter and likewise
treats an initial zero as 256 iterations.

`lddr` copies in the decrementing direction: HL and DE are decremented after
each byte rather than incremented. When the destination begins inside the
source range at a higher address, starting from the end with `lddr` avoids
overwriting source bytes before they are read.

`cpir` scans memory for a byte value. It reads bytes from (HL), compares each
to A, and stops when it finds a match or exhausts BC bytes. After `cpir`, Z is
set if a match was found, and HL points one past the matching byte. `cpdr` is
the same scan in the decrementing direction.

AZM assembles `ldir`, `lddr`, `cpir` and `cpdr` directly, like `djnz`.

When both HL and DE are live pointers, as they are during any `ldir` sequence,
you sometimes need to exchange them. A register-only transfer through A takes
six instructions and clobbers A; a stack-based exchange avoids A but touches
memory. `ex de, hl` does it in one: afterward, DE holds what HL had and HL holds
what DE had, while every other register is unchanged.

```asm
ld hl, source
ld de, dest
ld bc, 64
ldir              ; copy 64 bytes; HL and DE now point past the copied region
ex de, hl         ; HL now points past dest; DE points past source
```

For element-by-element work on a single table, the DJNZ-over-HL pattern from the first section is usually clearer.

---

## Subroutines in Chapter 8

Everything so far has been a single block of code. Chapter 8 introduces the
stack and the `call`/`ret` instructions used to enter reusable subroutines and
return to their callers.

---

## Exercises

**1. Post-loop pointer value.** The HL sum loop in the chapter starts with `ld hl, scores` where `scores` is at address `$8000` and contains six entries. After the loop completes all six iterations, what address does HL hold? What byte would `ld a, (hl)` read at that point? Is that byte part of `scores`?

**2. Address versus value.** The explanation must distinguish the effects of these two instructions:

```asm
ld hl, scores      ; (a)
ld a, (scores)     ; (b)
```

Which instruction loads the number 10 (the first element of the table) into a register? Which loads the memory address where 10 is stored?

**3. IX record access.** Three three-byte records are packed in memory, with `id` at offset 0, `hi` at offset 1 and `lo` at offset 2. The table starts at address `$8010`. The required IX loads read all three fields of the **third** record (index 2) into A, B and C respectively; computing the address loaded into IX establishes the base.

**4. The missing increment.** The following loop is meant to find the maximum score in the `scores` table, but it has a subtle error. The answer should identify what goes wrong and explain the final value in `max_score`:

```asm
ld hl, scores
ld b, TableLen
ld a, 0
max_loop:
  cp (hl)
  jr nc, no_new_max
  ld a, (hl)
no_new_max:
  djnz max_loop
ld (max_score), a
```

_(Hint: `inc hl` is missing somewhere. Where? And what does HL read on every iteration as a result?)_
