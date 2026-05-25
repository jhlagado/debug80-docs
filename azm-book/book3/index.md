---
layout: default
title: "AZM Book 3 — Algorithms and Data Structures"
parent: "AZM Books"
nav_order: 4
has_children: true
---
# AZM Book 3 — Algorithms and Data Structures

**Prerequisite:** complete [AZM Book 1 — Z80 Fundamentals](../book1/index.md) through Chapter 14. You should be comfortable with raw Z80, subroutine conventions, AZMDoc contracts, layout types and ops before starting here. [AZM Book 2 — Programming the TEC-1G](../book2/index.md) is useful but not required; this book is mostly target-neutral.

This book teaches classic algorithms and small data structures in **flat AZM assembly** — the same machine model as Book 1, with representation before algorithm (Wirth) and small complete programs with explicit invariants (K&R).

---

## What changes from Book 1

Book 1 taught the Z80 and the AZM tooling that makes assembly maintainable. Book 3 applies that tooling to real problems: sorting, searching, strings, bit tricks, records, recursion and pointer structures.

| Book 1 gave you | Book 3 uses it for |
|-----------------|-------------------|
| Register passing, callee-save discipline | Fixed calling conventions per algorithm family |
| AZMDoc `;!` + `@ROUTINE:` | Machine-checkable subroutine specs |
| `byte` / `word` / `addr`, `.type`, `sizeof`, `offset` | Arrays, records and layout-aware indexing |
| `.ds Type[N]` | Workspace RAM for algorithm-local state |
| Ops | Named idioms inside hot loops |

There is no hidden runtime: no `func`, no `:=`, no structured `if`/`while`, no `import`, no typed memory lowering. Every branch and every memory access is visible in the listing.

---

## Learning arc

1. **Foundations** — arithmetic algorithms with a fixed 16-bit convention and workspace bytes when registers are not enough.
2. **Arrays and loops** — contiguous storage, HL indexing, loop invariants, sorting and searching.
3. **Strings** — sentinel-terminated bytes, length vs capacity, in-place transforms.
4. **Bit patterns** — shifts, masks, parity, packed flags.
5. **Records** — layout types as the single source of truth for field offsets; ring buffer as the pilot data structure.
6. **Recursion** — stack frames, base cases, preserving return values across nested calls.
7. **Composition** — `.include`, shared `lib/*.asm` routines with AZMDoc, files plus contracts (no `import`).
8. **Pointer structures** — `addr` fields, linked lists, binary search trees.
9. **Capstone** — eight queens (or equivalent backtracking search) tying the part together.

Companion examples live in this book's `examples/` directory. Each full chapter cites a matching `.asm` file you can assemble and run to `halt`.

---

## Chapter table

| Ch | File | Status | What it covers |
|----|------|--------|----------------|
| — | [Introduction](00-introduction.md) | **Written** | Wirth/K&R approach, workspace pattern, AZMDoc as spec, how to use this part |
| 1 | [Foundations](01-foundations.md) | **Written** | Euclidean GCD, 16-bit compare/subtract, calling convention, workspace RAM, digit count |
| 2 | [Arrays and Loops](02-arrays-and-loops.md) | **Written** | Byte arrays, loop invariants, insertion sort, linear search |
| 3 | [Strings](03-strings.md) | **Written** | Null-terminated strings, strlen/copy/compare, char search |
| 4 | [Bit Patterns](04-bit-patterns.md) | **Written** | Masks, shifts, packed flags, `op` idioms |
| 5 | [Records](05-records.md) | **Written** | `.type` records, `sizeof`/`offset`, layout casts, ring buffer FIFO |
| 6 | [Recursion](06-recursion.md) | **Written** | Stack budget, factorial vs iterative, `sum_u8_rec`, AZMDoc on self-calls |
| 7 | [Composition](07-composition.md) | **Written** | `.include`, `lib/strings.asm`, symbol discipline, `.asmi` sketch |
| 8 | [Pointer Structures](08-pointer-structures.md) | **Written** | `.word` links, singly linked list traverse/find/head insert, optional BST sketch |
| 9 | [Capstone](09-capstone.md) | **Written** | Eight queens backtracking |

---

## Examples

| File | Chapter | Program |
|------|---------|---------|
| [examples/01_gcd.asm](examples/01_gcd.asm) | 1 | `gcd_u16` + `digit_count_u16`, stores results, `halt` |
| [examples/02_insertion_sort.asm](examples/02_insertion_sort.asm) | 2 | Insertion sort + linear search on a byte table |
| [examples/03_string_length.asm](examples/03_string_length.asm) | 3 | `strlen`, `strcpy`, `strcmp`, `str_find_char`, then `halt` |
| [examples/04_bit_flags.asm](examples/04_bit_flags.asm) | 4 | Set/test/clear flag bits with `op` helpers, then `halt` |
| [examples/05_ring_buffer.asm](examples/05_ring_buffer.asm) | 5 | Ring buffer push/pop, full-ring fail, FIFO verify |
| [examples/06_factorial.asm](examples/06_factorial.asm) | 6 | Recursive and iterative `5!`, recursive table sum |
| [examples/07_include_demo.asm](examples/07_include_demo.asm) | 7 | `main` includes `lib/strings.asm`, calls shared `strlen_u8` |
| [examples/08_linked_list.asm](examples/08_linked_list.asm) | 8 | List sum, find `$22`, insert `$40` at head |
| [examples/09_eight_queens.asm](examples/09_eight_queens.asm) | 9 | Count all 8-queen solutions → `solution_count` = 92 |

---

## How to compile the examples

From the `azm-book/book3/` directory (or pass the full path):

```sh
azm examples/01_gcd.asm
```

From the AZM source tree:

```sh
npm run azm -- /path/to/azm-book/book3/examples/01_gcd.asm
```

Optional register-care check (Book 1 Chapter 12):

```sh
azm --rc warn examples/01_gcd.asm
```

Load the object code into your Z80 emulator, run to `halt`, then inspect RAM at the labels documented in each example (`result`, `sorted`, etc.).

---

## Hardware

Same memory map as Book 1: code at `$0000`, data and workspace at `$8000` and above unless an example comments otherwise. No port I/O is required for these examples.

---

[← AZM Books](../index.md) | [Introduction →](00-introduction.md)
