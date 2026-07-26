---
layout: default
title: "Pointer Structures"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 9
---
[← Composition](07-composition.md) | [Book 3](index.md) | [Capstone →](09-capstone.md)

# Chapter 8 — Pointer Structures

Chapter 5 packed several fields into one record, but every byte still lived in
a table indexed by number. This chapter chains **nodes** through **stored
addresses**: each record holds data plus a `.word` link to the next node, or
zero for "none".

A pointer is a 16-bit address copied into a `.word` field.

The companion listing is [`examples/08_linked_list.asm`](examples/08_linked_list.asm): a static three-node list, sum and find walks and insert-at-head into a pre-allocated spare node.

---

## The problem: variable shape without shifting memory

A ring buffer (Chapter 5) keeps all elements in one byte array and moves **indices**. Inserting in the middle of a plain array means copying bytes, expensive on a small machine.

A **singly linked list** stores each element in its own small record. Insertion
at the **head** takes only a few stores: the new node links to the old head,
and `list_head` receives the new node's address.

The trade is explicit: each node costs an extra two bytes for the link, and
"element 4" cannot be reached in one arithmetic step. Traversal follows links
from the head until it reaches the requested node or **null**.

---

## Node layout: data plus link

The `.type` declaration describes the shape once:

```asm
ListNode .type
value   .byte
next    .word
.endtype

LIST_VALUE  .equ offset(ListNode, value)
LIST_NEXT   .equ offset(ListNode, next)
NODE_SIZE   .equ sizeof(ListNode)
```

`sizeof(ListNode)` is 3: one data byte, then a little-endian 16-bit link. The link field uses `.word` because it holds a full address, the same width as `word` and `addr` in Book 2 Chapter 13. AZM also offers `.addr` when you want the layout name to say "this field is a pointer"; for flat AZM listings, `.word` is enough as long as you treat it as an address in comments and register contracts.

**Null** is the address **0**. A missing next node is stored as `.dw 0`. At run time you test the pointer in HL with:

```asm
    ld a, h
    or l
    jr z, _at_end
```

`or l` sets Z only when both H and L are zero: the same 16-bit zero test used throughout the course, without a 16-bit compare instruction.

---

## Static nodes in fixed RAM

Book 3 does not use a heap allocator. You **name** nodes as labels and connect them at assembly time or in `main`:

```asm
node_a:
    .db $10
    .dw node_b
node_b:
    .db $22
    .dw node_c
node_c:
    .db $30
    .dw 0

list_head:
    .dw node_a
```

`list_head` is not a node; it is one word of storage that holds the address of the first node. The three nodes can live anywhere in RAM; only the links define order.

You can also reserve uninitialized nodes and fill them in code:

```asm
node_spare:
    .ds ListNode
```

### Memory diagram

After assembly, RAM holds this:

![Each next field holds the address of the next node, and list_head is a word of storage rather than a node](../../assets/images/azm-book/book3/linked-list.svg)

---

## Loading the head pointer into HL

Book 2 Chapter 4's absolute word load applies:

```asm
    ld hl, (list_head)
```

That expands to a read of the little-endian word at `list_head`. HL now points at `node_a`'s first byte (the `value` field at offset 0).

Reading **only** the link field of the node currently in HL requires the
field offset:

```asm
    ld bc, LIST_NEXT
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl          ; HL = next node address
```

Low byte first, then high byte. That is Z80 little-endian order.

---

## Traverse: `list_sum_u16`

Summing the list is a `while`-shaped loop (Chapter 2's invariant style): HL is the current node; DE holds the running 16-bit sum because each payload is one byte but the total can exceed 255.

```asm
; list_sum_u16: sum value bytes along list starting at HL (null = 0)
.routine in HL out HL clobbers AF,BC,DE
list_sum_u16:
    ld de, 0
_sum_loop:
    ld a, h
    or l
    jr z, _sum_done
    ld a, (hl)
    add a, e
    ld e, a
    jr nc, _sum_no_carry
    inc d
_sum_no_carry:
    ld bc, LIST_NEXT
    add hl, bc
    ld a, (hl)
    ld c, a
    inc hl
    ld a, (hl)
    ld h, a
    ld l, c
    jr _sum_loop
_sum_done:
    ex de, hl
    ret
```

**Invariant at `_sum_loop`:** DE is the sum of all `value` bytes in nodes strictly before the node HL points at (if any). When HL is null, DE is the full sum returned in HL via `ex de, hl`.

For the static chain `$10`, `$22`, `$30`, the result is `$0062` (98). The companion stores it in `list_sum`.

HL is not an index; it is a full address that changes to unrelated addresses as you follow `next`.

---

## Find: `list_find_u8`

Search reuses the same advance pattern, keeping the target byte in D while BC
is reused to address and load each link:

```asm
; list_find_u8: find first node with value A; HL = node or 0, carry set if found
.routine in HL,A out HL,carry clobbers A,zero,sign,parity,halfCarry,BC,D
list_find_u8:
    ld d, a
_find_loop:
    ld a, h
    or l
    jr z, _missing
    ld a, (hl)
    cp d
    jr z, _found
    ld bc, LIST_NEXT
    add hl, bc
    ld a, (hl)
    ld c, a
    inc hl
    ld a, (hl)
    ld h, a
    ld l, c
    jr _find_loop
_found:
    scf
    ret
_missing:
    ld hl, 0
    or a
    ret
```

Carry set means HL points at a node whose `value` matches. Carry clear means HL is 0, including the empty list case when `list_head` was 0.

The demo searches for `$22` and expects `find_hit = 1` and `find_node` equal to the address of `node_b`.

---

## Head insertion: `list_push_head`

**Insert at head** needs a free node address (here `node_spare`), a byte value in A and the current head word:

```asm
; list_push_head: prepend node DE with value A; updates list_head
.routine in A,DE clobbers BC,DE,HL
list_push_head:
    push af
    ld hl, (list_head)
    ld c, l
    ld b, h              ; BC = old head
    pop af
    ld (de), a           ; new node's value field
    ex de, hl            ; HL = new node
    push hl
    inc hl
    ld (hl), c           ; next, low byte
    inc hl
    ld (hl), b           ; next, high byte
    pop hl               ; HL = new node base again
    ld (list_head), hl
    ret
```

The insertion consists of four steps:

1. `push af` holds the incoming value while the old head is read.
2. BC receives the old head link, with the low byte in C and the high byte in B.
3. `pop af` restores the payload for storage at `(de)`, and `ex de, hl` makes
   the new node available for storing BC into `next`.
4. HL now holds the new node address and is stored in `list_head`.

After `ld de, node_spare` / `ld a, $40` / `call list_push_head`, the list order is spare → a → b → c. The new sum is `$00A2` (162).

![Two stores change the shape of the list, and no existing node is touched](../../assets/images/azm-book/book3/insert-at-head.svg)

```asm
    ld de, node_spare
    ld a, $40
    call list_push_head
```

---

## Layout casts for node fields

When the node address and field path are known at assembly time, layout casts from Chapter 5 still apply:

```asm
    ld hl, <ListNode>node_b.value
    ld a, (hl)

    ld hl, <ListNode>node_b.next
    ld e, (hl)
```

For the head variable:

```asm
    ld hl, <word>list_head
```

Runtime traversal cannot put HL inside brackets, so the chapter routines use
explicit `add hl, bc` with `LIST_NEXT`.

---

## Register contracts on pointer routines

Pointer routines follow the same `.routine` declarations as the ring buffer and factorial helpers:

| Tag | Role for lists |
|-----|----------------|
| `.routine in` | HL = current node or head pointer; A or DE for push/find |
| `.routine out` | HL = sum, found node or 0; carry for find |
| `.routine clobbers` | Include every register the link walk destroys |

The contract documents whether zero in HL means end-of-list or "not found".
Here both use HL = 0, with carry distinguishing a successful find.

```sh
azm --rc warn examples/08_linked_list.asm
```

---

## Optional: BST insert with two `.word` links

A **binary search tree** adds a second link per node: left and right children, each a `.word` (zero if absent).

```asm
TreeNode .type
value   .byte
left    .word
right   .word
.endtype
```

An insertion routine needs the **address of a link word**, not merely the node
address. HL starts at the address of the root word. Each iteration loads the
node address stored there. A zero word is an empty slot, so the routine writes
the new node address into that link. Otherwise it compares the key and changes
HL to the address of the existing node's `left` or `right` word.

![HL holds the address of a link word, never the address of a node, so one pair of stores attaches a node anywhere in the tree](../../assets/images/azm-book/book3/bst-insert.svg)

```asm
TREE_VALUE .equ offset(TreeNode, value)
TREE_LEFT  .equ offset(TreeNode, left)
TREE_RIGHT .equ offset(TreeNode, right)

; bst_insert_u8: attach pre-initialized node IX for key A
; In: HL = address of root/child link word, IX = new node, A = key
; Duplicate keys leave the tree unchanged.
.routine in HL,IX,A clobbers AF,C,DE,HL
bst_insert_u8:
    ld c, a
_walk:
    ld e, (hl)
    inc hl
    ld d, (hl)
    dec hl
    ld a, d
    or e
    jr z, _attach

    ex de, hl             ; HL = existing node
    ld a, (hl)            ; value is the first field
    cp c
    ret z
    ld de, TREE_LEFT
    jr nc, _descend       ; key < node value
    ld de, TREE_RIGHT
_descend:
    add hl, de            ; HL = address of chosen child link
    jr _walk

_attach:
    push ix
    pop de
    ld (hl), e
    inc hl
    ld (hl), d
    ret
```

The caller initializes the new node's value and clears both child words before
the call. The control flow is a loop, not a self-call, so tree height affects
iteration count rather than stack depth. A complete implementation also needs a
node pool and a `root` word.

---

## `main`: what to inspect at `halt`

```asm
    ld hl, (list_head)
    call list_sum_u16
    ld (list_sum), hl

    ld a, $22
    ld hl, (list_head)
    call list_find_u8
    ...

    ld de, node_spare
    ld a, $40
    call list_push_head

    ld hl, (list_head)
    call list_sum_u16
    ld (sum_after), hl

    halt
```

| Label | Expected |
|-------|----------|
| `list_sum` | `$0062` (98) |
| `find_hit` | `$01` |
| `find_node` | address of `node_b` |
| `sum_after` | `$00A2` (162) |

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/08_linked_list.asm`](examples/08_linked_list.asm) | Sum 98 (`$0062`), find `$22`, sum 162 (`$00A2`) after head insert |

```sh
azm examples/08_linked_list.asm
azm --rc warn examples/08_linked_list.asm
```

A single-step trace of `list_sum_u16` shows HL jumping from `node_a` to
`node_b` to `node_c` by loading `next`, rather than by adding a stride to a
table base.

---

## Exercises

1. A memory diagram should show the list after `$40` is inserted at its head,
   identifying the node addressed by `list_head` and the value of
   `node_a.next`.
2. The null test should use DE rather than HL and be written without
   assembling. Its explanation should show why `or e` alone cannot test a
   16-bit pointer.
3. A `list_count_u8` routine returns the number of nodes in A and includes
   `.routine in`, `.routine out` and `.routine clobbers`. An empty list returns
   0.
4. An **insert at tail** routine uses a spare node and walks to the final link.
   Its memory reads can then be compared with those required for head
   insertion.
5. A layout-only change from `next` to `.addr` should preserve the instruction
   encoding while making the field's meaning clearer.
6. A `list_get_u8` routine accepts a zero-based index in B and returns the value
   byte in A, with carry clear when the index is out of range. It advances B
   times rather than using multiplication.
7. A three-node `TreeNode` pool uses keys `5`, `3` and `8`, with each node
   inserted through the address of a `root` word. A paper diagram should record
   the resulting tree boxes and `.word` links.

---

[← Composition](07-composition.md) | [Book 3](index.md) | [Capstone →](09-capstone.md)
