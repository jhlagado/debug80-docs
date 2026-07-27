---
layout: default
title: "Records"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 6
---

# Chapter 5 — Records

Chapter 2 indexed bytes in a table. Real programs store **records**: several fields packed together (coordinates, queue indices, flags) with a stride larger than 1.

Field offsets kept only in comments can drift away from the data they describe.
Wirth's alternative fixes the **representation** first, then expresses the
algorithm against that layout. AZM's `.type` blocks provide that representation.

Layout types from Book 2 Chapter 13 come back here, driving field reads and writes through HL and IX and then building a **ring buffer**, a fixed-size FIFO queue over a byte table. The companion listing is [`examples/05_ring_buffer.asm`](examples/05_ring_buffer.asm).

---

## The problem: a queue without moving memory

A FIFO queue (first in, first out) needs:

- storage for N elements
- a write index (where the next push goes)
- a read index (where the next pop comes from)
- a count of how many elements are valid (or equivalent logic)

Shifting the whole table on every pop is wasteful on a small machine. A **ring buffer** keeps indices in workspace RAM and only moves the indices. Storage is a fixed byte array; push writes at `head` and advances; pop reads at `tail` and advances. When an index reaches capacity, it wraps to 0.

---

## Defining the layout once

A record is a packed field list inside `.type` / `.endtype`:

```asm
RingState .type
head    .byte
tail    .byte
count   .byte
.endtype
```

Field lines do **not** allocate memory. Storage still comes from `.ds`, `.db` or `.dw`:

```asm
RING_CAP .equ 8

ring_buf:
    .ds RING_CAP

ring_state:
    .ds RingState
```

`ring_state` reserves `sizeof(RingState)` bytes: three bytes for `head`, `tail` and `count` in order. When the length is a named constant, `.ds RING_CAP` and `.ds byte[8]` mean the same reservation; the type-array form uses literal lengths in the current assembler, not named constants.

![Three control bytes beside the eight they control, and the offset constants that name them](../../assets/images/azm-book/book3/ring-state-layout.svg)

Named compile-time constants make field offsets usable in instructions:

```asm
RING_HEAD   .equ offset(RingState, head)
RING_TAIL   .equ offset(RingState, tail)
RING_COUNT  .equ offset(RingState, count)
STATE_SIZE  .equ sizeof(RingState)
```

Adding a field to `RingState` causes every `.equ` based on `offset` to update at
the next assembly.

---

## `sizeof` and `.ds Type[n]`

`sizeof(Type)` is the record's exact packed size in bytes. For scalars:

| Type | `sizeof` |
|------|----------|
| `byte` | 1 |
| `word` | 2 |
| `addr` | 2 |

For arrays in size positions, literal lengths multiply:

```asm
BUF_BYTES .equ sizeof(byte[8])   ; = 8
```

If the capacity is a named constant, use the constant directly:

```asm
BUF_BYTES .equ RING_CAP
```

`.ds` accepts a type expression wherever it needs a byte count:

```asm
ring_buf:
    .ds RING_CAP

ring_state:
    .ds RingState
```

These forms are equivalent to `.ds 8` and `.ds 3` here. With a literal length you can also write `.ds byte[8]`; that documents element width when capacity is fixed in source. Initialized data still uses `.db` / `.dw`; `.ds` only reserves space.

Labels stay **untyped**. `ring_state` is an address, not a permanent `RingState`
variable. A routine passes that address in a register and uses
`offset(RingState, field)` constants at the access site.

---

## Reading and writing fields

### HL plus offset

When HL points at the start of a `RingState` record:

```asm
  ld de, RING_COUNT
  add hl, de
  ld a, (hl)            ; A = count
```

For offsets 0–127, the constant fits in `(ix + d)` form, which is usually shorter.

### IX-relative access

Loading the record base into IX once allows each field access to use a symbolic
displacement:

```asm
  ld ix, ring_state
  ld a, (ix + RING_HEAD)
  ld (ix + RING_COUNT), a
```

`RING_HEAD` is the constant 0; `RING_TAIL` is 1; `RING_COUNT` is 2.

### Run-time index into the byte table

`head` and `tail` are dynamic indices (0 .. RING_CAP−1). The address of
`ring_buf[head]` is formed at runtime:

```asm
  ld a, (ix + RING_HEAD)
  ld hl, ring_buf
  ld b, 0
  ld c, a
  add hl, bc            ; HL = ring_buf + head
  ld a, e               ; byte to store (saved in E)
  ld (hl), a
```

AZM does not emit multiply/add for runtime indices.

---

## Layout casts for constant addresses

When the index and field path are known at assembly time, a **layout cast** folds the address into one expression:

```asm
  ld hl, <RingState>ring_state.count
```

Parts:

- `<RingState>`: layout to apply
- `ring_state`: base label
- `.count`: field path (no `[i]` when accessing a single record)

The assembler computes `ring_state + offset(RingState, count)` and emits `ld hl, imm16`.

For an array of records with a constant index:

```asm
  ld hl, <byte[8]>ring_buf[3]
```

That is `ring_buf + 3` when the element type is `byte`. For a table of structures:

```asm
  ld hl, <Sprite[16]>sprite_table[2].flags
```

expands to `sprite_table + 2 * sizeof(Sprite) + offset(Sprite, flags)`.

Runtime registers are rejected inside the brackets:

```asm
  ld hl, <byte[8]>ring_buf[hl]    ; error: HL is not a constant
```

Layout casts suit call sites with fixed indices, including initialization,
debug checks and table-driven dispatch with `.equ` indices. HL/BC arithmetic is
required when a push or pop keeps the index in a register.

The long form and the cast must agree:

```asm
  ld hl, ring_state + offset(RingState, count)
  ld hl, <RingState>ring_state.count
```

---

## Ring buffer structure

Separate **data** (the ring) from **control** (indices and count):

```asm
RingState .type
head    .byte       ; next write index
tail    .byte       ; next read index
count   .byte       ; bytes currently stored
.endtype

ring_buf:
    .ds RING_CAP

ring_state:
    .ds RingState
```

**Invariants** (when the routines are correct):

- `0 <= count <= RING_CAP`
- `head` and `tail` are each in `0 .. RING_CAP - 1`
- the oldest byte is at `ring_buf[tail]` when `count > 0`
- the next free slot for push is `ring_buf[head]` when `count < RING_CAP`

Push fails closed when `count == RING_CAP` (returns with carry clear). Pop fails when `count == 0`.

### Memory diagram

After pushing `$11`, `$22`, `$33` and then popping all three, the buffer may still hold those bytes in RAM, but `count` is 0 and the logical queue is empty:

![Four states of the same eight bytes, including the popped bytes that are still in RAM and no longer in the queue](../../assets/images/azm-book/book3/ring-buffer.svg)

When `head` or `tail` would become `RING_CAP`, the index wraps to 0:

```asm
ring_advance_index:
    inc a
    cp RING_CAP
    ret c                 ; still in range
    xor a                 ; wrap to 0
    ret
```

When `RING_CAP` is a power of two (8, 16, 32, …), `and RING_CAP - 1` after
`inc a` can replace `cp` / `xor`, reducing the wrap to one instruction. The
compare form works for any capacity and is what the example uses.

---

## `ring_push` and `ring_pop`

### Push

```asm
; ring_push: append one byte; carry set on success, carry clear when full
.routine in A,IX out carry clobbers A,zero,sign,parity,halfCarry,BC,DE,HL
ring_push:
    ld e, a
    ld a, (ix + RING_COUNT)
    cp RING_CAP
    jr nc, _full
    ld a, (ix + RING_HEAD)
    ld hl, ring_buf
    ld b, 0
    ld c, a
    add hl, bc
    ld a, e
    ld (hl), a
    ld a, (ix + RING_HEAD)
    call ring_advance_index
    ld (ix + RING_HEAD), a
    ld a, (ix + RING_COUNT)
    inc a
    ld (ix + RING_COUNT), a
    scf
    ret
_full:
    or a
    ret
```

Carry flag is the success/fail signal: no separate error code byte unless the caller wants one in workspace.

### Pop

```asm
; ring_pop: remove oldest byte; carry set on success, carry clear when empty
.routine in IX out A,carry clobbers zero,sign,parity,halfCarry,BC,DE,HL
ring_pop:
    ld a, (ix + RING_COUNT)
    or a
    jr z, _empty
    ld a, (ix + RING_TAIL)
    ld hl, ring_buf
    ld b, 0
    ld c, a
    add hl, bc
    ld e, (hl)
    ld a, (ix + RING_TAIL)
    call ring_advance_index
    ld (ix + RING_TAIL), a
    ld a, (ix + RING_COUNT)
    dec a
    ld (ix + RING_COUNT), a
    ld a, e
    scf
    ret
_empty:
    or a
    ret
```

FIFO order: bytes leave in the same order they arrived because `tail` chases `head` around the ring.

---

## Register contracts on routines

Book 2 Chapter 12 introduced the `.routine` directive and register contracts.

| Tag | Meaning |
|-----|---------|
| `.routine in` | Registers the caller must set before `call` |
| `.routine out` | Registers and flags that carry meaningful values across returning exits |
| `.routine clobbers` | Registers destroyed (not restored) |

The `.routine` directive appears immediately before the callable entry.
`@name:` is reserved for symbols exported from a source unit; call sites use the
plain symbol name, such as `call ring_push`.

For `ring_push` and `ring_pop`, the human `;` line states the meaning of success
and failure, while `.routine out` names the carrier as `carry` rather than
`F.C`. The shown `ring_pop` returns A = 0 on its empty path, but carry still
determines whether A contains a popped byte.

The register-contract checker provides machine verification:

```sh
azm --rc warn examples/05_ring_buffer.asm
```

---

## `main`: test sequence

The companion program:

1. Clears `ring_state` through IX.
2. Pushes `$11`, `$22`, `$33`, then pops three times (FIFO).
3. Stores the last pop in `pop_result` (expect `$33`).
4. Pushes eight more bytes to fill the ring, then attempts a ninth push with `$CC`.
5. Stores `push_ok` = 0 if that push failed (carry clear), 1 if it incorrectly succeeded.

After `halt`, the expected values are:

| Label | Address | Expected |
|-------|---------|----------|
| `pop_result` | `$800B` | `$33` |
| `push_ok` | `$800C` | `$00` (ring full) |
| `ring_state.count` | `$800A` | `$08` |

---

## Records inside records

When a field is itself a layout, `.field` embeds it:

```asm
Pos .type
x       .byte
y       .byte
.endtype

Actor .type
tile    .byte
pos     .field Pos
.endtype

POS_X .equ offset(Actor, pos.x)
```

Nested paths work in `offset` and in layout casts:
`<Actor>player.pos.x`. For an array inside a record, combine the array field
offset, element stride and element field offset:

```asm
offset(Scene, sprites) + 2 * sizeof(Sprite) + offset(Sprite, color)
```

Current AZM does not accept `sprites[2].color` as a nested `offset` path.

Unions (`.union` / `.endunion`) share the same offset rules; the union's size is the largest member.

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/05_ring_buffer.asm`](examples/05_ring_buffer.asm) | FIFO pop `$33`, `push_ok` = 0 on full ring |

```sh
azm examples/05_ring_buffer.asm
azm --rc warn examples/05_ring_buffer.asm
```

A single-step trace of `ring_push` shows `head` and `count` changing through
`(ix + RING_HEAD)` while HL targets the corresponding cell in `ring_buf`.

---

## Exercises

1. The first exercise calculates three `.equ` values without assembling:
   `sizeof(RingState)`, `offset(RingState, tail)` and
   `offset(RingState, count)` for the chapter's three-byte layout.
2. Adding a `flags` byte after `count` should be followed by an account of which
   `.equ` lines and which push/pop instructions change.
3. An alternative `ring_buf[head]` address calculation uses DE as the base and
   C as the index while retaining the existing `ring_push` contract.
4. A capacity of 16 can use `and 15` in `ring_advance_index` instead of `cp` /
   `xor`; a paper proof should show that `head` never reaches 16.
5. A `ring_peek` routine should return the oldest byte in A without removing it
   and report an empty ring with carry clear. Its contract documents
   `.routine in`, `.routine out` and `.routine clobbers`.
6. Two forms should load the address of `ring_state.head` into HL: a layout
   cast and `ring_state + offset(RingState, head)`. Assembly should produce the
   same immediate for both.
7. Four reserved `Event` records use `Event .type`, `code .byte`, `param
   .word`, `.endtype` and `.ds Event[4]`. A loop should zero every `param` field
   using `sizeof(Event)` as its stride.
