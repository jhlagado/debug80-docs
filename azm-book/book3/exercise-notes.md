---
layout: default
title: "Exercise Notes"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 99
---

# Exercise Notes

These notes provide expected results for traces and tests, along with design
guidance for the programming exercises. The extension notes describe useful
checks without prescribing a complete implementation.

## Chapter 1: Arithmetic Foundations

1. **Euclid trace and invariant.** The first five transitions are
   `(270, 192) -> (78, 192) -> (192, 78) -> (114, 78) -> (36, 78) ->
   (78, 36)`. Subtraction and swapping preserve
   `gcd(HL, DE) = gcd(270, 192)`. The returned GCD is 6.
2. **Result representation and zero cases.** Both `(0, 5)` and `(5, 0)`
   return HL = 5 and store `$05 $00`. The `(270, 192)` case returns HL = 6
   and stores `$06 $00`.
3. **Register-contract diagnosis.** `gcd_u16` declares DE as clobbered, so its
   incoming address has no defined value after the call. Reloading the address
   after the call or saving and restoring DE around it satisfies the caller's
   need; the chosen repair should agree with the caller's own contract.
4. **Decimal digit count.** The boundary results are
   `0 -> 1`, `9 -> 1`, `10 -> 2`, `99 -> 2`, `100 -> 3` and `255 -> 3`.
   Comparisons against 10 and 100 are sufficient when the larger boundary is
   tested first or the branches are arranged to preserve both ranges.
5. **Extension — Shift-and-add multiplication.** The expected low-byte results
   are 0, 255, 81 and 144. The last value is `400 mod 256`; the routine still
   has an 8-bit result even though its algorithm changed.
6. **Extension — Exact 16-bit product.** Decimal 400 is `$0190`, so its word
   store is `$90 $01`; decimal 510 is `$01FE`, stored as `$FE $01`. The helper
   must retain carries in its 16-bit accumulator rather than returning only
   the low byte.

## Chapter 2: Arrays and Loops

1. **Insertion-sort trace.** The three rows are:

   | Completed iteration | Table | Sorted prefix |
   |---------------------|-------|---------------|
   | `i = 1` | `4, 9, 6, 2, 8, 1, 7, 3` | `4, 9` |
   | `i = 2` | `4, 6, 9, 2, 8, 1, 7, 3` | `4, 6, 9` |
   | `i = 3` | `2, 4, 6, 9, 8, 1, 7, 3` | `2, 4, 6, 9` |

   Before iteration `i`, elements `0..i-1` form a sorted prefix.
2. **Addresses and storage.** The requested cells are
   `$8000 = 9`, `$8003 = 2` and `$8007 = 3`. Runtime initialization must write
   all eight reserved bytes before the sort reads them. The sorted result is
   `1, 2, 3, 4, 6, 7, 8, 9`.
3. **Equality search contract.** On the sorted table, searches return
   `1 -> 0`, `6 -> 4`, `9 -> 7` and `5 -> $FF`. A zero-length table returns
   `$FF` without reading `(HL)`, which requires the length check to precede
   the first load.
4. **Boundary-value verification.** Replacing the first 9 with 0 produces
   `0, 1, 2, 3, 4, 6, 7, 8`. Threshold 0 returns index 0; threshold 10 returns
   `$FF`. In the second case, the invariant eventually covers the whole table:
   every examined element is below the threshold.
5. **Extension — Descending insertion sort.** The final table is
   `9, 8, 7, 6, 4, 3, 2, 1`. Before each outer iteration, the prefix is sorted
   in descending order.
6. **Extension — Bubble sort.** After each outer pass, the completed suffix
   contains the largest remaining values in final order. Empty and one-element
   inputs need an early length test so a `djnz` counter cannot wrap from zero
   to 255.

## Chapter 3: Strings

1. **Sentinel walk.** `"AZM"` has length 3. The indices are `M -> 2`,
   `A -> 0` and `Z -> 1`. At the top of `_scan`, B is the current index and
   every earlier character differs from C.
2. **Two-pointer trace.** The three values copied are `$41`, `$5A` and `$00`.
   After each pass, A contains the byte just written; after the terminator
   pass, both pointers are one byte beyond their respective nulls. The
   destination prefix behind DE equals the source prefix behind HL.
3. **Pointer-returning search.** For `"HELLO"`, the successful pointers are
   `base + 0` for H, `base + 2` for the first L and `base + 4` for O, all with
   carry set. Z and the empty-string search return HL = 0 with carry clear.
4. **Lexicographic verification.** On `"AB"` against `"A"`, the second pass
   compares DE's null against HL's B. The subtraction borrows, selecting the
   `HL greater` result 1. The complete results are `0`, `1`, `$FF` and `$FF`
   in the order listed in the exercise.
5. **Extension — Concatenation with capacity.** `"AZ"` plus `"M"` occupies
   four bytes including its terminator, so capacity 4 succeeds as
   `"AZM", 0`. Capacity 3 fails. Preserving the original destination on
   failure requires a length or capacity check before the first write.
6. **Extension — Bounded copy.** Capacity 0 writes nothing; capacity 1 writes
   only `$00`; capacity 4 writes `"HEL", 0`; capacity 8 writes
   `"HELLO", 0` and leaves the two unused bytes outside the produced string.

## Chapter 4: Bit Patterns

1. **Mask trace.** Starting from `$05` (`00000101`), setting error with `$02`
   gives `$07` (`00000111`), clearing busy with `$FB` gives `$03`
   (`00000011`), and toggling ready with `$01` gives `$02` (`00000010`).
2. **Enum-derived flag.** `Fault` has position 3 and `FLAG_FAULT` is `$08`.
   Setting fault and clearing busy maps `$00 -> $08`, `$05 -> $09` and
   `$FF -> $FB`.
3. **Population count contract.** The results are
   `$00 -> 0`, `$01 -> 1`, `$55 -> 4`, `$80 -> 1` and `$FF -> 8`. An
   eight-iteration loop has a fixed bound independent of the input bits.
4. **Numeric extraction or branch.** `and $02` followed by `rr a` produces A
   equal to 0 or 1. `bit 1, a` preserves A and sets Z when the tested bit is
   clear, which suits a branch without producing a normalized byte.
5. **Extension — Parity.** The expected results are
   `$00 -> 0`, `$01 -> 1`, `$03 -> 0`, `$7F -> 1`, `$80 -> 1` and
   `$FF -> 0`.
6. **Extension — Sixteen-bit shift op.** The expected B:C and carry results
   are `$4000` with carry set, `$0080` with carry clear and `$0000` with carry
   set. `srl hi` establishes the incoming carry for `rr lo`; `rr lo` leaves
   the original low bit in carry.

## Chapter 5: Records

1. **Layout arithmetic.** The original layout has size 3 and offsets
   `head = 0`, `tail = 1`, `count = 2`. Appending `flags` gives size 4 and
   `flags = 3`; all three earlier offsets stay unchanged.
2. **Queue-state trace.**

   | Operation | Head | Tail | Count | Result |
   |-----------|------|------|-------|--------|
   | cleared | 0 | 0 | 0 | empty |
   | push `$11` | 1 | 0 | 1 | carry set |
   | push `$22` | 2 | 0 | 2 | carry set |
   | pop | 2 | 1 | 1 | A = `$11`, carry set |
   | push `$33` | 3 | 1 | 2 | carry set |

   The logical queue contains `$22`, then `$33`.
3. **Equivalent field addresses.** Both forms fold to the same base plus
   offset. Appending `flags` changes the total size from 3 to 4 but does not
   move `head` at offset 0 or `count` at offset 2.
4. **Non-destructive peek.** An empty ring returns carry clear. The one-byte
   case returns `$7A` with carry set, and the wrapped case returns the byte at
   `ring_buf[tail]`. Comparing all state bytes before and after each successful
   call verifies that peek did not consume the value.
5. **Extension — Power-of-two wrap.** Incoming indices 0, 14 and 15 advance to
   1, 15 and 0. For capacity 10, index 9 advances to 10 and
   `10 & 9` produces 8 rather than 0; masking implements modulo only when the
   capacity is a power of two.
6. **Extension — Record-array stride.** `sizeof(Event) = 3` and
   `offset(Event, param) = 1`. The four parameter addresses are separated by
   three bytes. A correct loop changes the eight parameter bytes and preserves
   the four code bytes.

## Chapter 6: Recursion

1. **Factorial trace and range.** Calls descend through B values
   `4, 3, 2, 1, 0`; unwind results are `1, 1, 2, 6, 24`. Both 8-bit routines
   return `$D0` (208) for 6 because `720 mod 256 = 208`. Their agreement shows
   consistent overflow, not an exact factorial.
2. **Stack budget.** Five saved BC pairs use 10 bytes and six active return
   addresses use 12, for 22 bytes total. With initial SP `$9FFF`, the deepest
   value is `$9FE9`.
3. **Recursive-sum invariant.** The base returns 0; unwinding over `2, 3, 5`
   produces 5, then 8, then 10 in HL. On entry, HL points to the first byte of
   the remaining suffix and A gives its length; after return, HL is that
   suffix's sum. The empty table returns 0 and the chapter table returns 26.
4. **Register-contract diagnosis.** B is listed under clobbers, so its incoming
   value is unavailable after the call unless the caller saves it or reloads
   it. The repaired call site should leave no live-clobber warning.
5. **Extension — Sixteen-bit Hanoi count.** The expected values are 0, 1, 31
   and 255. The stack formula depends on the registers saved by each
   implementation; it should count one recursive return address plus every
   pushed local at each non-base level, followed by the base return address.
6. **Extension — Iterative table sum.** All test results must match the
   recursive routine. The chapter's recursive design needs
   `255 * 4 + 2 = 1022` bytes at maximum depth; a direct iterative loop keeps
   only its caller's return address unless it calls another routine.

## Chapter 7: Source Composition

1. **Include graph and placement.** The acyclic edges run from `main.asm` to
   each included file. An edge from `ring.asm` back to `main.asm` creates a
   cycle. Each source-emitting include contributes bytes at its directive's
   position in the single assembly unit; a constants-only include emits none.
2. **Composed string library.** The expected buffer is
   `"HELLO", 0` with two spare bytes, and `copy_ok` is 1. The client must reload
   or preserve every input invalidated by the copy contract before calling the
   compare routine.
3. **Shared symbols and diagnostics.** One constants include gives both files
   the same `CHAR_L` definition. Two non-local `done` declarations occupy one
   source-unit namespace and produce a duplicate-symbol diagnostic. Prefixing
   the labels or making branch labels owner-local removes the collision.
4. **Contract-only boundary.** The character-output entry declares A under
   `in`, while the key-reader entry declares A under `out`. If the character
   routine clobbers A, a caller that expects the old character afterward must
   save it or reload it. The `.asmi` supplies analysis records and emits no
   routine body.
5. **Extension — Single-purpose math build.** GCD(270, 192) stores `$06 $00`.
   Only included source contributes routine bytes, so omitting the string
   include removes its labels and instructions from the listing.
6. **Extension — Include and import boundaries.** Imported callable entries
   need explicit `@` exports, while internal helpers remain private to the
   module. Textual inclusion joins declarations in one namespace; import
   exposes the module's selected public symbols.

## Chapter 8: Pointer Structures

1. **Node representation.** `sizeof(ListNode) = 3`,
   `offset(value) = 0` and `offset(next) = 1`. After insertion,
   `list_head -> node_spare -> node_a -> node_b -> node_c -> 0`;
   `node_a.next` still contains `node_b`. Changing `.word` to `.addr` clarifies
   the field's purpose while retaining its two-byte size and emitted data.
2. **Traversal invariant.** The loop-entry states are
   `(HL = node_a, DE = $0000)`,
   `(node_b, $0010)`,
   `(node_c, $0032)` and
   `(0, $0062)`. DE contains the sum of values in all nodes before HL.
3. **Count routine and contract.** The expected counts are 0, 3 and 4. A
   complete contract identifies HL as consumed by traversal and lists every
   scratch register and flag changed by the null test and counter.
4. **Indexed retrieval.** The original list returns
   `0 -> $10`, `1 -> $22` and `2 -> $30`, all with carry set. Index 3 and
   index 0 on an empty list return carry clear; A has no meaningful result on
   those paths unless the contract explicitly supplies one.
5. **Extension — Tail insertion cost.** The original list requires traversal
   of three nodes and reads three two-byte link fields before attaching the
   spare node. Head insertion performs no node traversal and reads only the
   two-byte `list_head` word. The final values are
   `$10, $22, $30, $40`.
6. **Extension — Three-node search tree.** The root points to key 5; its left
   link points to 3 and its right link points to 8. All four child links below
   the leaf nodes are null. An in-order traversal therefore returns
   `3, 5, 8`.

## Chapter 9: Eight Queens Capstone

1. **Constraint trace.** `queen_cols[0..2]` contains `0, 2, 4`.
   Set column indices are `0, 2, 4`; sum-diagonal indices are
   `0 + 0 = 0`, `1 + 2 = 3` and `2 + 4 = 6`; difference-diagonal indices are
   `0 - 0 + 7 = 7`, `1 - 2 + 7 = 6` and `2 - 4 + 7 = 5`.
2. **Workspace layout.** `sizeof(Constraints) = 38` (`$26`) and
   `sizeof(QueenWorkspace) = 56` (`$38`). The field offsets and addresses are:

   | Field | Offset | Address |
   |-------|--------|---------|
   | `solutionCount` | 0 | `$8000` |
   | `queenCols` | 2 | `$8002` |
   | `solutionCols` | 10 (`$0A`) | `$800A` |
   | `constraints.colUsed` | 18 (`$12`) | `$8012` |
   | `constraints.diagSumUsed` | 26 (`$1A`) | `$801A` |
   | `constraints.diagDiffUsed` | 41 (`$29`) | `$8029` |

3. **Backtracking failure.** With the chapter's depth-first order and the
   unmark call removed, constraint bytes accumulate across failed branches and
   the search reaches zero completed solutions. Restoring the unmark step
   returns the count to 92 (`$005C`).
4. **Contract diagnosis.** `col_free` requires the current column in C. A
   preceding call that clobbers C invalidates that input, so the caller must
   restore the column before `call col_free`. The repaired program produces
   92 solutions and no warning at that call site.
5. **Extension — First-solution search.** The early-exit version stores
   `solution_count = 1`. A valid `solution_cols` contains each column 0 through
   7 once; the eight `row + col` values are unique, as are the eight
   `row - col + 7` values.
6. **Extension — Packed column constraints.** Replacing eight column bytes
   with one reduces `sizeof(Constraints)` from 38 to 31 and
   `sizeof(QueenWorkspace)` from 56 to 49. The packed implementation still
   counts 92 solutions; its listing comparison should isolate the changed
   test, mark and unmark sequences.
