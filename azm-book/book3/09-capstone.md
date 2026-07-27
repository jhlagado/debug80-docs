---
layout: default
title: "Capstone"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 10
---

# Chapter 9 — Capstone

The preceding chapters sorted tables, walked strings, packed flags into bytes,
built a ring buffer, used recursive calls, split files with `.include` and
followed `.word` links through data structures. This chapter combines those
techniques in one program: **eight queens** on an 8x8 board.

The puzzle: place eight queens so no two share a row, column or diagonal. There are exactly **92** distinct solutions if you treat reflected and rotated boards as different; the companion program counts all of them and stores the total in RAM.

Flat AZM has no `break`, no `continue` and no `func`: only `call`, `ret` and branches.

The companion build is [`examples/09_eight_queens.asm`](examples/09_eight_queens.asm).

---

## The problem: one queen per row

A queen attacks along its row, column and both diagonals. On an 8x8 board with eight queens, each row must hold exactly one queen. That cuts the search space sharply: you are not choosing 64 squares independently; you are choosing **which column** on row 0, then row 1 and so on.

If row `r` uses column `c`, the search records three constraints:

1. Column `c` is taken; no other row may use it.
2. The **forward diagonal** (row + col constant) is threatened.
3. The **backward diagonal** (row − col constant) is threatened.

When all three checks pass for `(r, c)`, record the placement, recurse to row
`r + 1` and when that returns, **undo** the marks before trying the next column.
That undo step is backtracking. Without it, stale flags make available squares
appear occupied and prune valid branches from the search.

---

## Board representation in bytes

Five structures live in workspace RAM:

| Structure | Size | Role |
|-----------|------|------|
| `queen_cols` | 8 bytes | Current search path: `queen_cols[r]` = tentative column for row `r` |
| `solution_cols` | 8 bytes | Last completed solution copied from `queen_cols` |
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

![One queen threatens a row, a column and two diagonals, and costs exactly three flag bytes](../../assets/images/azm-book/book3/queens-board.svg)

The search does not need one byte per square. It needs fast answers to "is this
column or diagonal already taken?" Chapter 4's masks could pack all eight
column flags into one byte. The companion instead uses one byte per column so
every test is `ld a, (hl)` / `or a` / `jr nz`.

The companion keeps separate `.ds` labels for teaching clarity. A larger
project can fold the workspace into one record and name every field offset
once, using the same idiom as Chapter 5's ring buffer:

```asm
QueenWorkspace .type
solution_count .word
queen_cols     .field byte[8]
solution_cols  .field byte[8]
col_used       .field byte[8]
diag_sum_used  .field byte[15]
diag_diff_used .field byte[15]
.endtype

QS_SOLUTION .equ offset(QueenWorkspace, solution_count)
QS_COLS     .equ offset(QueenWorkspace, queen_cols)
; ... then use (ix + QS_COLS) as the base of the queen_cols field
```

`queen_cols` changes as the search tries placements. `count_solution` copies
all eight bytes to `solution_cols`, preserving the last completed board after
backtracking continues.

---

## Constraint checks as small routines

The hot path is divided into routines with explicit `.routine` contracts, the
same discipline used for `gcd_u16`, `ring_push` and `factorial_u8`.

**Column free** (index `col_used` with `C`):

```asm
; col_free: is column C unused?
.routine in C out zero clobbers A,B,HL,sign,parity,halfCarry,carry
col_free:
    ld hl, col_used
    ld b, 0
    add hl, bc
    ld a, (hl)
    or a
    ret
```

**Forward diagonal** (index `row + col` into `diag_sum_used`):

```asm
; diag_sum_free: is forward diagonal (row+col) unused?
.routine in B,C out zero clobbers A,DE,HL,sign,parity,halfCarry,carry
diag_sum_free:
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

**Backward diagonal** (use `row - col + DIAG_BIAS` so the index stays in the
range 0–14):

```asm
    ld a, b
    add a, DIAG_BIAS
    sub c
```

Each failed check jumps to `_next_col` in the row driver, the flat-ASM equivalent of "try the next column" without a `continue` keyword.

---

## Marking, recursion and unmarking

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

`mark_constraints` sets `col_used[c]`, both diagonal bytes and
`queen_cols[row]`. `unmark_constraints` clears the flags. The next trial may
overwrite `queen_cols`, so only `solution_cols` is a stable completed board.

`push bc` around each helper preserves **B = row** and **C = column** across `call`s that clobber AF and HL.

![The recursive call sits between the mark and the unmark, so every flag set on the way down is cleared on the way back](../../assets/images/azm-book/book3/mark-recurse-unmark.svg)

---

## Recursive `place_row`

**Contract:** B = current row (0..7). At row `BOARD_SIZE`, a full placement was found; increment the global counter. Otherwise try every column on this row.

```asm
; place_row: assign a queen to row B; count solutions at row BOARD_SIZE
; Self-call; max depth PLACE_MAX_DEPTH; max stack PLACE_MAX_STACK_BYTES bytes.
.routine in B clobbers AF,BC,DE,HL
place_row:
    ld a, b
    cp BOARD_SIZE
    jr nz, _try_cols
    call count_solution
    ret
_try_cols:
    ld c, 0
_col_loop:
    ld a, c
    cp BOARD_SIZE
    jr nc, _done
    ; ... col_free, diag_sum_free, diag_diff_free ...
    ; ... mark, inc b, call place_row, unmark ...
    inc c
    jr _col_loop
_done:
    ret
```

**Base case:** `b == 8`, all rows assigned. `count_solution` copies the current
path to `solution_cols`, then bumps the 16-bit `solution_count` at `$8000`.

**Recursive step:** valid column → mark → `inc b` → `call place_row` → unmark → next column.

![Columns 0, 2, 4, 1 and 3 leave row 5 with nothing legal, and the search backs up to try again](../../assets/images/azm-book/book3/backtracking-tree.svg)

Depth is at most nine `place_row` calls (rows 0..8). Each of the eight trial
rows keeps a saved BC pair while the next row runs. At row 8, the nested
`count_solution` call temporarily adds one more return address. Constants make
the exact budget visible:

```asm
PLACE_STEP_BYTES      .equ 4
PLACE_BASE_BYTES      .equ 4
PLACE_MAX_DEPTH       .equ BOARD_SIZE + 1
PLACE_MAX_STACK_BYTES .equ BOARD_SIZE * PLACE_STEP_BYTES + PLACE_BASE_BYTES
STACK_TOP             .equ $9FFF
```

For an 8x8 board, the deepest path occupies `8 × 4 + 4 = 36` bytes.

### Stopping at the first solution

Stopping after the first solution requires a `found` byte in workspace.
`count_solution` sets it, and the column loop checks it after `call place_row`.
A non-zero value causes an early `ret` from each active `place_row` frame,
propagating the result upward because one `ret` exits only one frame.

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

`clear_constraints` zeroes 38 bytes in one loop (`col_used`, both diagonal
tables). Neither column array needs clearing: every completed path writes all
eight `queen_cols` entries before they are copied to `solution_cols`.

---

## Memory after `halt`

```
  $8000  ┌────────┬────────┐
         │ $5C    │ $00    │  solution_count (word) = 92
  $8002  ├────────┴────────┴── queen_cols[8] — final abandoned search path
  $800A  ├────────────────────── solution_cols[8] — last complete solution
  $8012  ├────────────────────── col_used[8]
         ├────────────────────── diag_sum_used[15]
         └────────────────────── diag_diff_used[15]
```

After execution reaches `halt`, `$005C` in `solution_count` confirms that the
search completed. A single-step trace with column 0 accepted on row 0 shows
`diag_sum_used` and `col_used` changing to `$01`, then clearing during
backtracking after a deeper row fails.

---

## Book 3 techniques in the capstone

| Earlier idea | Here |
|--------------|------|
| Byte arrays + indexing (Ch. 2) | `col_used`, diagonal tables |
| Bit thinking (Ch. 4) | Optional bitboard exercise |
| Records / workspace (Ch. 5) | Fixed layout at `$8000` |
| Recursion + stack (Ch. 6) | `place_row` self-call, SP init |
| Small routines with `.routine` contracts (Ch. 1, 7) | `col_free`, `mark_constraints`, … |
| Pointers (Ch. 8) | Not required — pure tables |

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/09_eight_queens.asm`](examples/09_eight_queens.asm) | `solution_count` = `$005C` (92); `solution_cols` holds one complete placement |

```sh
azm examples/09_eight_queens.asm
azm --rc warn examples/09_eight_queens.asm
```

---

## Exercises

1. A hand trace of `place_row` should cover rows 0–2 when the first successful
   columns are 0, 2 and 4. It should include the three `queen_cols` entries and
   the `col_used` bytes set before recursion reaches row 3.
2. Removing `call unmark_constraints` after the recursive `call place_row`
   creates a case for determining whether `solution_count` remains 92 and how
   stale flags affect the column loop.
3. An alternative base case stops after the first solution by adding a `found`
   byte, setting it in `count_solution` and returning early from every active
   frame when it is non-zero. The resulting `solution_count` shows whether the
   early exit propagated correctly.
4. A bitboard version packs `col_used` into one byte and rewrites `col_free`
   and `mark_constraints` using Chapter 4's `and` and `or`. Its listing length
   can be compared with the byte-table version.
5. An iterative version uses an explicit workspace stack of `(row, col)` trial
   states and includes a workspace estimate for depth 8.
6. A deliberate contract error calls `col_free` without restoring C after a
   clobbering helper. `azm --rc warn` should identify the failure, and the
   `.routine` contract defines the correction.

---

## Book 3 in practice

The capstone combines arrays, constraint flags, recursion and register
contracts. Across the earlier chapters, records, separate source files and
pointer layouts provide other representations for problems that need them.

The same approach applies to a new buffer, parser or game board: its
representation determines the `.routine` contracts, and emulator traces show
whether the implementation preserves each invariant.
