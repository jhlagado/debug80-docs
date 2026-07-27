---
layout: default
title: "Capstone"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 10
---

# Capstone

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

## Board representation as one record

Six fields live in workspace RAM:

| Field | Size | Role |
|-------|------|------|
| `solutionCount` | `sizeof(word)` | Running total, 92 when the search finishes |
| `queenCols` | `sizeof(ColFlags)` | Current search path: one tentative column per row |
| `solutionCols` | `sizeof(ColFlags)` | Last completed solution copied from `queenCols` |
| `constraints.colUsed` | `sizeof(ColFlags)` | `Slot.Free` or `Slot.Taken` per column |
| `constraints.diagSumUsed` | `sizeof(DiagFlags)` | Forward diagonal index `row + col` |
| `constraints.diagDiffUsed` | `sizeof(DiagFlags)` | Backward diagonal index `row - col + DIAG_BIAS` |

Two array aliases carry the only literal counts in the program, and everything
else is derived from them:

```asm
ColFlags  .typealias byte[8]     ; one flag per column, so also the board size
DiagFlags .typealias byte[15]    ; one flag per diagonal: 2 * BOARD_SIZE - 1

BOARD_SIZE .equ sizeof(ColFlags)
DIAG_BIAS  .equ BOARD_SIZE - 1
```

`DIAG_BIAS` is one less than the board size, so the smallest backward-diagonal
index is 0 when `row = 0` and `col = BOARD_SIZE - 1`.

![One queen threatens a row, a column and two diagonals, and costs exactly three flag bytes](../../assets/images/azm-book/book3/queens-board.svg)

The search does not need one byte per square. It needs fast answers to "is this
column or diagonal already taken?" Chapter 4's masks could pack all eight
column flags into one byte. The companion instead uses one byte per column so
every test is `ld a, (hl)` / `or a` / `jr nz`.

### The three flag tables are one record

`clear_constraints` zeroes the three flag tables in a single `ldir`-style pass.
That only works if they are contiguous and in a known order, which is a
property of the layout, not of the loop. So the layout says it:

```asm
Constraints .type
colUsed      .field ColFlags
diagSumUsed  .field DiagFlags
diagDiffUsed .field DiagFlags
.endtype

QueenWorkspace .type
solutionCount .field word
queenCols     .field ColFlags
solutionCols  .field ColFlags
constraints   .field Constraints
.endtype
```

The whole workspace is then one reservation, and each old label becomes a
layout cast that folds to the same immediate address:

```asm
solution_count .equ <QueenWorkspace>queens_ws.solutionCount
queen_cols     .equ <QueenWorkspace>queens_ws.queenCols
solution_cols  .equ <QueenWorkspace>queens_ws.solutionCols
col_used       .equ <QueenWorkspace>queens_ws.constraints.colUsed
diag_sum_used  .equ <QueenWorkspace>queens_ws.constraints.diagSumUsed
diag_diff_used .equ <QueenWorkspace>queens_ws.constraints.diagDiffUsed

.org $8000
queens_ws:
    .ds QueenWorkspace
```

Every `ld hl, col_used` in the rest of the program still assembles to
`ld hl, imm16`; the difference is that the immediate now comes from the field
list. Widening the board to 10 columns is a change to `ColFlags` and
`DiagFlags`, after which the addresses, the clear length and `BOARD_SIZE` all
follow.

`queenCols` changes as the search tries placements. `count_solution` copies
all `BOARD_SIZE` bytes to `solutionCols`, preserving the last completed board
after backtracking continues.

### Free and taken as an enum

A flag byte holds one of two values, so it gets a name for each:

```asm
Slot .enum Free, Taken
```

`Slot.Free` is 0 and `Slot.Taken` is 1. `mark_constraints` stores
`ld a, Slot.Taken`, which is the same `3E 01` as `ld a, 1` was.
`unmark_constraints` keeps `xor a` because it is one byte rather than two, with
a comment noting that zero is `Slot.Free`. Enum members must be qualified;
`Taken` alone is rejected.

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

Indexing a flag table is Chapter 2's four instructions, and the program writes
them at three sites. One parameterised `op` names the calculation once:

```asm
op flag_addr(tbl imm16, idx reg8)
  ld hl, tbl
  ld d, 0
  ld e, idx
  add hl, de
end
```

`imm16` matches the table label and `reg8` matches the index register, so
`flag_addr col_used, c` and `flag_addr queen_cols, b` both expand to
`ld hl` / `ld d, 0` / `ld e` / `add hl, de` with the operands substituted.

`col_free` keeps its own version because `ld b, 0` / `add hl, bc` is a byte
shorter when the index is already in C and B is free.

**Diagonal addressing** carries an extra step: the index is computed from the
row and the column rather than taken from one register. `diag_sum_free`,
`mark_constraints` and `unmark_constraints` all need the same six
instructions, and so do their backward-diagonal counterparts, so two more ops
cover the six sites:

```asm
op diag_sum_addr()
  ld a, b
  add a, c              ; forward diagonal index = row + col
  ld e, a
  ld d, 0
  ld hl, diag_sum_used
  add hl, de
end

op diag_diff_addr()
  ld a, b
  add a, DIAG_BIAS
  sub c                 ; backward diagonal index = row - col + DIAG_BIAS
  ld e, a
  ld d, 0
  ld hl, diag_diff_used
  add hl, de
end
```

The bias keeps the backward index non-negative: `row - col` runs from
`-(BOARD_SIZE - 1)` to `BOARD_SIZE - 1`, and adding `DIAG_BIAS` slides that
range to `0 .. sizeof(DiagFlags) - 1`.

**Forward diagonal** then reads as the question it is asking:

```asm
; diag_sum_free: is forward diagonal (row+col) unused?
.routine in B,C out zero clobbers A,DE,HL,sign,parity,halfCarry,carry
diag_sum_free:
    diag_sum_addr
    ld a, (hl)
    or a
    ret
```

There is no `call` here. The listing file prints the six expanded instructions
and their bytes beside the `diag_sum_addr` line, and `--rc warn` analyses those
instructions, which is why the contract still declares DE and HL clobbered.

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

`mark_constraints` writes `Slot.Taken` into `col_used[c]` and both diagonal
bytes, and records the column number in `queen_cols[row]`.
`unmark_constraints` clears the three flags and leaves `queen_cols` alone. The
next trial may overwrite `queen_cols`, so only `solution_cols` is a stable
completed board.

`push bc` around each helper preserves **B = row** and **C = column** across `call`s that clobber AF and HL.

![The recursive call sits between the mark and the unmark, so every flag set on the way down is cleared on the way back](../../assets/images/azm-book/book3/mark-recurse-unmark.svg)

---

## Recursive `place_row`

**Contract:** B = current row, 0 to `BOARD_SIZE - 1`. At row `BOARD_SIZE`, a full placement was found; increment the global counter. Otherwise try every column on this row.

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
    jr nc, _row_done
    ; ... col_free, diag_sum_free, diag_diff_free ...
    ; ... mark, inc b, call place_row, unmark ...
    inc c
    jr _col_loop
_row_done:
    ret
```

**Base case:** B has reached `BOARD_SIZE`, so every row is assigned. `count_solution` copies the current
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

`clear_constraints` zeroes `sizeof(Constraints)` bytes in one loop, which is
`col_used` and both diagonal tables and nothing else:

```asm
clear_constraints:
    ld hl, col_used
    ld bc, sizeof(Constraints)
```

Neither column array needs clearing: every completed path writes all
`BOARD_SIZE` `queen_cols` entries before they are copied to `solution_cols`.

---

## Memory after `halt`

![Every field offset and address in the workspace comes from one type declaration](../../assets/images/azm-book/book3/queens-workspace.svg)

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
| Records / workspace (Ch. 5) | `QueenWorkspace` at `$8000`, addressed by layout cast |
| Enums (Book 1 Ch. 3) | `Slot.Free` and `Slot.Taken` in the flag tables |
| Ops (Book 1 Ch. 7) | `flag_addr`, `diag_sum_addr`, `diag_diff_addr` |
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
