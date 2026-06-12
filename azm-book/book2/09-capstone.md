---
layout: default
title: "Chapter 9 — Capstone"
parent: "AZM Book 2 — Algorithms and Data Structures"
nav_order: 10
---
[← Pointer Structures](08-pointer-structures.md) | [Book 2](index.md)

# Chapter 9 — Capstone

You have sorted tables, walked strings, packed flags into bytes, built a ring buffer, called yourself on the stack, split files with `.include` and followed `addr` fields through linked structures. This chapter ties those habits into one program: **eight queens** on an 8×8 board.

The puzzle: place eight queens so no two share a row, column or diagonal. There are exactly **92** distinct solutions if you treat reflected and rotated boards as different — the companion program counts all of them and stores the total in RAM. No BIOS, no print routine — you inspect `solution_count` in the emulator after `halt`, the same way earlier chapters left results at named labels.

The algorithm is **depth-first search with backtracking**: try a column on the current row, recurse to the next row and if the search dead-ends, **unmark** the constraints you set and try the next column. Flat AZM has no `break`, no `continue` and no `func` — only `call`, `ret`, branches and bytes you can see in the listing.

The companion build is [`examples/09_eight_queens.asm`](examples/09_eight_queens.asm).

---

## The problem: one queen per row

A queen attacks along its row, column and both diagonals. On an 8×8 board with eight queens, each row must hold exactly one queen. That cuts the search space sharply: you are not choosing 64 squares independently; you are choosing **which column** on row 0, then row 1 and so on.

If row `r` uses column `c`, you must remember:

1. Column `c` is taken — no other row may use it.
2. The **forward diagonal** (row + col constant) is threatened.
3. The **backward diagonal** (row − col constant) is threatened.

When all three checks pass for `(r, c)`, record the placement, recurse to row `r + 1` and when that returns, **undo** the marks before trying the next column. That undo step is backtracking. Skip it and stale flags will make you think occupied squares are free.

---

## Board representation in bytes

Two kinds of data live in workspace RAM:

| Structure | Size | Role |
|-----------|------|------|
| `queen_cols` | 8 bytes | Solution snapshot: `queen_cols[r]` = column of the queen on row `r` |
| `col_used` | 8 bytes | `$00` = column free, `$01` = occupied |
| `diag_sum_used` | 15 bytes | Forward diagonal index `row + col` (0..14) |
| `diag_diff_used` | 15 bytes | Backward diagonal index `row - col + DIAG_BIAS` (0..14) |

`DIAG_BIAS` is 7 so the smallest index is 0 when `row = 0` and `col = 7`.

```asm
BOARD_SIZE    .equ 8
DIAG_BIAS     .equ 7
DIAG_SUM_LEN  .equ 15
DIAG_DIFF_LEN .equ 15
```

This is not a 64-cell chess diagram in RAM. You do not need one byte per square to **search** — you need fast answers to “is this column or diagonal already taken?” Byte tables indexed by column or by diagonal id are enough. Chapter 4's masks would pack each `col_used` row into one bit per column (a **bitboard** per row); the companion uses whole bytes for clarity so every test is `ld a, (hl)` / `or a` / `jr nz`.

The companion keeps separate `.ds` labels for teaching clarity. In a larger project you can fold the workspace into one record and name every field offset once — the same idiom as the ring buffer in Chapter 5:

```asm
.type QueenWorkspace
solution_count .word
queen_cols     .field byte[8]
col_used       .field byte[8]
diag_sum_used  .field byte[15]
diag_diff_used .field byte[15]
.endtype

QS_SOLUTION .equ offset(QueenWorkspace, solution_count)
QS_COLS     .equ offset(QueenWorkspace, queen_cols)
; ... then (ix + QS_COLS) instead of a global queen_cols label
```

Layout types scale to whole workspace regions: one `.type`, one base label, constants for every inner field — still plain Z80 in the listing.

`queen_cols` updates whenever you commit a placement so the last completed board is visible when the count finishes. Counting all solutions does not require printing the board.

---

## Constraint checks as small routines

Split the hot path into `@` subroutines with AZMDoc contracts — the same discipline as `gcd_u16`, `ring_push` and `factorial_u8`.

**Column free** — index `col_used` with `C`:

```asm
; col_free: is column C unused?
;! in C; out zero; clobbers A,B,HL
@col_free:
    ld hl, col_used
    ld b, 0
    add hl, bc
    ld a, (hl)
    or a
    ret
```

**Forward diagonal** — index `row + col` into `diag_sum_used`:

```asm
; diag_sum_free: is forward diagonal (row+col) unused?
;! in B,C; out zero; clobbers A,DE,HL
@diag_sum_free:
    ld a, b
    add a, c
    ld e, a
    ld d, 0
    ld hl, diag_sum_used
    add hl, de
    ld a, (hl)
    or a
    ret
```

**Backward diagonal** — use `row - col + DIAG_BIAS` so the index stays in range without signed arithmetic drama:

```asm
    ld a, b
    add a, DIAG_BIAS
    sub c
```

That value selects a slot in `diag_diff_used`.

Each failed check jumps to `.next_col` in the row driver — the flat-ASM equivalent of “try the next column” without a `continue` keyword.

---

## Mark, recurse, unmark

When all three tests pass, **mark** before `call place_row` and **unmark** after it returns:

```asm
    push bc
    call mark_constraints
    pop bc

    push bc
    inc b
    call place_row
    pop bc

    push bc
    call unmark_constraints
    pop bc
```

`mark_constraints` sets `col_used[c]`, both diagonal bytes and `queen_cols[row]`. `unmark_constraints` clears the flags but leaves `queen_cols` overwritten on the next successful mark — fine for counting.

`push bc` around each helper preserves **B = row** and **C = column** across `call`s that clobber AF and HL. That repetition is the cost of small, checkable routines in flat AZM; Chapter 7's alternative is one larger routine with fewer calls.

---

## Recursive `place_row`

**Contract:** B = current row (0..7). At row `BOARD_SIZE`, a full placement was found — increment the global counter. Otherwise try every column on this row.

```asm
; place_row: assign a queen to row B; count solutions at row BOARD_SIZE
; Self-call; max depth PLACE_MAX_DEPTH; frame PLACE_FRAME_BYTES bytes.
;! in B; clobbers AF,BC,DE,HL
@place_row:
    ld a, b
    cp BOARD_SIZE
    jr nz, PlaceRowTryCols
    call count_solution
    ret
PlaceRowTryCols:
    ld c, 0
PlaceRowColLoop:
    ld a, c
    cp BOARD_SIZE
    jr nc, PlaceRowDone
    ; ... col_free, diag_sum_free, diag_diff_free ...
    ; ... mark, inc b, call place_row, unmark ...
    inc c
    jr PlaceRowColLoop
PlaceRowDone:
    ret
```

**Base case:** `b == 8` — all rows assigned. `count_solution` bumps the 16-bit `solution_count` at `$8000`.

**Recursive step:** valid column → mark → `inc b` → `call place_row` → unmark → next column.

Depth is at most nine frames (rows 0..8), each saving `bc` once in the trial path plus the CPU's return address. Name the budget:

```asm
PLACE_FRAME_BYTES .equ 4
PLACE_MAX_DEPTH   .equ BOARD_SIZE + 1
STACK_TOP         .equ $9FFF
```

`main` sets `ld sp, STACK_TOP` before the first `call`, as in Chapter 6. Nine levels × four bytes is trivial on a 64K map; the habit matters when depth grows.

### Stopping at the first solution

The companion counts **all** 92 solutions. To stop after the first, add a `found` byte in workspace, set it in `count_solution` and after `call place_row` in the column loop load `found` and `ret` early from `place_row` when it is non-zero — propagating the flag up every return, because `ret` only exits one frame. In AZM you use explicit memory and branches for this early-exit state.

---

## `main` and `clear_constraints`

```asm
.org $0000
main:
    ld sp, STACK_TOP
    call clear_constraints
    xor a
    ld (solution_count), a
    ld (solution_count + 1), a
    ld b, 0
    call place_row
    halt
```

`clear_constraints` zeroes 38 bytes in one loop (`col_used`, both diagonal tables). `queen_cols` does not need clearing before a full search because every solution path writes all eight entries before `count_solution` runs.

---

## Memory after `halt`

```
  $8000  ┌────────┬────────┐
         │ $5C    │ $00    │  solution_count (word) = 92
  $8002  ├────────┴────────┴── queen_cols[8] — last solution's columns
  $800A  ├────────────────────── col_used[8]
         ├────────────────────── diag_sum_used[15]
         └────────────────────── diag_diff_used[15]
```

Run to `halt`, then read `solution_count`. If you see `$005C`, the search finished. Single-step through row 0 with column 0 accepted: watch `diag_sum_used` and `col_used` flip to `$01`, then clear after backtrack when a deeper row fails.

---

## How this chapter uses the rest of Book 2

| Earlier idea | Here |
|--------------|------|
| Byte arrays + indexing (Ch. 2) | `col_used`, diagonal tables |
| Bit thinking (Ch. 4) | Optional bitboard exercise |
| Records / workspace (Ch. 5) | Fixed layout at `$8000` |
| Recursion + stack (Ch. 6) | `place_row` self-call, SP init |
| Small `@` routines + `;!` (Ch. 1, 7) | `col_free`, `mark_constraints`, … |
| Pointers (Ch. 8) | Not required — pure tables |

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/09_eight_queens.asm`](examples/09_eight_queens.asm) | `solution_count` = `$005C` (92); `queen_cols` holds one complete placement |

```sh
cd azm-book/book2/examples
azm 09_eight_queens.asm
azm --rc warn 09_eight_queens.asm
```

From the AZM source tree:

```sh
npm run azm -- /path/to/azm-book/book2/examples/09_eight_queens.asm
```

No port I/O — inspect RAM in the emulator.

---

## Summary

- **Eight queens** with one queen per row becomes a search over column choices with three constraint tables.
- **Backtracking** requires symmetric **mark** and **unmark** around each recursive `call`.
- **Byte tables** index columns and diagonals; `queen_cols` stores the placement per row.
- **`place_row`** is depth-first recursion with base case `row == BOARD_SIZE` and a column loop on each level.
- **`solution_count`** in RAM replaces console output when you have no print routine.
- Decompose checks into **`@` routines** with AZMDoc so callers know register roles and clobbers.

---

## Exercises

1. Trace `place_row` by hand for rows 0–2 when the first successful columns are 0, 2 and 4. Write the three entries in `queen_cols` and which `col_used` bytes are set before the recursion to row 3.
2. Remove the `call unmark_constraints` after the recursive `call place_row`. Run the program. Does `solution_count` stay 92? Explain what stale flags do to the column loop.
3. Change the base case to stop after the first solution: add a `found` byte, set it in `count_solution` and return early from every frame when `found` is non-zero. How many bytes does `solution_count` hold now?
4. Pack `col_used` into one byte of eight bits (bitboard). Rewrite `col_free` and `mark_constraints` using `and` / `or` from Chapter 4. Does the listing get shorter or longer?
5. Replace recursion with an explicit stack in workspace: push `(row, col)` trial state, loop until stack empty. Estimate workspace bytes for depth 8.
6. Run `azm --rc warn` on a deliberate bug: call `col_free` without restoring `C` after a clobbering helper. Fix using the `;!` contract.

---

## What you learned in Book 2

You started Book 2 with arithmetic conventions and AZMDoc on small routines. You finished with a search that combines **arrays**, **bit-level reasoning**, **records**, **recursion**, **multi-file composition** and **pointer layouts** — choosing the representation that fits each problem.

Flat AZM never hid control flow behind syntax. Every `call` and every byte in `col_used` is in the listing you assemble. That is the trade this part teaches: more typing, full ownership.

Book 1 gave you the CPU and the tooling. Book 2 showed how algorithms look when you own the data layout first. The next step is a project of your own — a buffer, a parser, a game board — where you pick the representation, write the `;!` lines and let the emulator prove the invariant.

---

[← Pointer Structures](08-pointer-structures.md) | [Book 2](index.md)
