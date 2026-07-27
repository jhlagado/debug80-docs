---
layout: default
title: "Records"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 6
---

# Records

Chapter 2 indexed bytes in a table. A table of **records** packs several fields
together, such as coordinates, queue indices and flags, with a stride larger
than 1.

Field offsets kept only in comments can drift away from the data they describe.
AZM's `.type` blocks define the representation once, and the algorithm uses
offsets computed from that layout.

Layout types, which [Book 1 Chapter 5](../book1/05-layout-system.md) covers,
drive field reads and writes through HL and IX. The example in
[`examples/05_ring_buffer.asm`](examples/05_ring_buffer.asm) uses them to build
a **ring buffer**, a fixed-size FIFO queue over a byte table.

---

## A queue that moves only its indices

A FIFO queue (first in, first out) needs:

- storage for N elements
- a write index (where the next push goes)
- a read index (where the next pop comes from)
- a count of how many elements are valid (or equivalent logic)

A **ring buffer** avoids shifting the whole table on every pop. Its fixed byte
array stays in place while indices in workspace RAM move: push writes at `head`
and advances, while pop reads at `tail` and advances. An index wraps to 0 when
it reaches capacity.

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

Field lines describe layout; storage comes from `.ds`, `.db` or `.dw`:

```asm
RING_CAP .equ 8

ring_buf:
    .ds RING_CAP

ring_state:
    .ds RingState
```

`ring_state` reserves `sizeof(RingState)` bytes: three bytes for `head`, `tail` and `count` in order. `.ds RING_CAP` and `.ds byte[8]` reserve the same eight bytes; the count inside `[ ]` must be a literal, so a named capacity goes in the plain form.

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

The second reserves `sizeof(RingState)` bytes, whatever the field list currently sums to. With a literal length you can also write `.ds byte[8]`; that documents element width when capacity is fixed in source. Initialized data still uses `.db` / `.dw`; `.ds` only reserves space.

Labels stay **untyped**: `ring_state` is an address. A routine passes that
address in a register and applies `offset(RingState, field)` constants at the
access site, which is where the layout enters.

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

Each displacement is whatever `offset` computes from the current field list, so
reordering `RingState` changes the generated displacements while this code stays
as written.

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

Runtime indices require instructions such as `add hl, bc`; AZM evaluates layout
arithmetic at assembly time.

---

## Layout casts for constant addresses

When the index and field path are known at assembly time, a **layout cast** folds the address into one expression:

```asm
  ld hl, <RingState>ring_state.count
```

Parts:

- `<RingState>`: layout to apply
- `ring_state`: base label
- `.count`: field path

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

The bracketed index must be an assembly-time literal, so a register there is an error:

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

The ring buffer keeps **data** in its byte array and **control** in the indices
and count:

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

**Invariants:**

- `0 <= count <= RING_CAP`
- `head` and `tail` are each in `0 .. RING_CAP - 1`
- the oldest byte is at `ring_buf[tail]` when `count > 0`
- the next free slot for push is `ring_buf[head]` when `count < RING_CAP`

When `count == RING_CAP`, push returns with carry clear. When `count == 0`, pop
returns with carry clear.

### Memory diagram

After pushing `$11`, `$22`, `$33` and then popping all three, the buffer may still hold those bytes in RAM, but `count` is 0 and the logical queue is empty:

![Four states of the same eight bytes, including the popped bytes that are still in RAM while count says the queue is empty](../../assets/images/azm-book/book3/ring-buffer.svg)

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

The carry flag reports whether the byte was pushed.

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

[Book 1 Chapter 6](../book1/06-register-contracts.md) covers the `.routine` directive and register contracts.

| Tag | Meaning |
|-----|---------|
| `.routine in` | Registers the caller must set before `call` |
| `.routine out` | Registers and flags that carry meaningful values across returning exits |
| `.routine clobbers` | Registers the routine destroys |

The `.routine` directive appears immediately before the callable entry.
`@name:` is reserved for symbols exported from a source unit; call sites use the
plain symbol name, such as `call ring_push`.

For `ring_push` and `ring_pop`, the human `;` line states the meaning of success
and failure, while `.routine out` names the carrier as `carry`. The shown
`ring_pop` returns A = 0 on its empty path, but carry still determines whether A
contains a popped byte.

The register-contract checker provides machine verification:

```sh
azm --rc warn examples/05_ring_buffer.asm
```

---

## `main`: test sequence

The example runs this sequence:

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

In current AZM an `offset` path names fields, so an index into a record array
belongs in the arithmetic above.

Unions (`.union` / `.endunion`) share the same offset rules; the union's size is the largest member.

---

## Inspecting the queue state

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

1. Without assembling, compute `sizeof(RingState)`, `offset(RingState, tail)`
   and `offset(RingState, count)` for the chapter's three-byte layout. Write
   the three `.equ` lines, then assemble and compare.
2. Add a `flags` byte to `RingState` after `count`. Which constants change?
   Which push and pop code must change?
3. Rewrite the `ring_buf[head]` address setup using DE as the base, keeping
   the index in C and the same contract on `ring_push`.
4. Change `RING_CAP` to 16 and use `and 15` in `ring_advance_index` in place
   of the `cp` and `xor` pair. Prove on paper that `head` stays below 16.
5. Write `ring_peek`: return the oldest byte in A and leave the queue as it
   was, with carry clear signalling empty. Document `in`, `out` and
   `clobbers`.
6. Load the address of `ring_state.head` into HL twice, once with a layout
   cast and once as `ring_state + offset(RingState, head)`. Assemble both and
   confirm the same immediate in the listing.
7. Declare an `Event` record (`code .byte`, `param .word`) and reserve
   `.ds Event[4]`. Write a loop that zeroes every `param` field using
   `sizeof(Event)` as the stride.
