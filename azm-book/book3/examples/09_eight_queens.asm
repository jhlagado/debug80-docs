; 09_eight_queens.asm - Chapter 9 companion
; Assemble: azm 09_eight_queens.asm
; Run to halt, then inspect:
;   (solution_count) at $8000 - number of distinct 8-queen placements -> $005C (92)
;   (solution_cols)  at $800A - last completed solution: col per row (8 bytes)

ColFlags  .typealias byte[8]     ; one flag per column, so also the board size
DiagFlags .typealias byte[15]    ; one flag per diagonal: 2 * BOARD_SIZE - 1

; The three constraint tables sit in one record so clear_constraints can zero
; them in a single pass of sizeof(Constraints) bytes.
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

BOARD_SIZE   .equ sizeof(ColFlags)
DIAG_BIAS    .equ BOARD_SIZE - 1

solution_count .equ <QueenWorkspace>queens_ws.solutionCount
queen_cols     .equ <QueenWorkspace>queens_ws.queenCols
solution_cols  .equ <QueenWorkspace>queens_ws.solutionCols
col_used       .equ <QueenWorkspace>queens_ws.constraints.colUsed
diag_sum_used  .equ <QueenWorkspace>queens_ws.constraints.diagSumUsed
diag_diff_used .equ <QueenWorkspace>queens_ws.constraints.diagDiffUsed

; Recursive place_row stack budget:
;   each trial row: saved BC (2) + recursive return address (2)
;   row-8 base call: return address + nested count_solution call (4)
PLACE_STEP_BYTES      .equ 4
PLACE_BASE_BYTES      .equ 4
PLACE_MAX_DEPTH       .equ BOARD_SIZE + 1
PLACE_MAX_STACK_BYTES .equ BOARD_SIZE * PLACE_STEP_BYTES + PLACE_BASE_BYTES
STACK_TOP             .equ $9FFF

; A square is either free or taken; the flag tables store nothing else.
Slot .enum Free, Taken

; Three idioms for reaching one flag byte, named once each and expanded inline
; at the call site. Every one of them leaves the address in HL.
op flag_addr(tbl imm16, idx reg8)
  ld hl, tbl
  ld d, 0
  ld e, idx
  add hl, de
end

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

; clear_constraints: zero col_used and both diagonal tables
.routine clobbers AF,BC,DE,HL
clear_constraints:
    ld hl, col_used
    ld bc, sizeof(Constraints)
    xor a
    ld b, a
_zero_loop:
    ld (hl), b
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, _zero_loop
    ret

; col_free: is column C unused?
.routine in C out zero clobbers A,B,HL,sign,parity,halfCarry,carry
col_free:
    ld hl, col_used
    ld b, 0
    add hl, bc
    ld a, (hl)
    or a
    ret

; diag_sum_free: is forward diagonal (row+col) unused?
.routine in B,C out zero clobbers A,DE,HL,sign,parity,halfCarry,carry
diag_sum_free:
    diag_sum_addr
    ld a, (hl)
    or a
    ret

; diag_diff_free: is backward diagonal (row-col+DIAG_BIAS) unused?
.routine in B,C out zero clobbers A,DE,HL,sign,parity,halfCarry,carry
diag_diff_free:
    diag_diff_addr
    ld a, (hl)
    or a
    ret

; mark_constraints: occupy column C on row B and both diagonals
.routine in B,C clobbers AF,DE,HL
mark_constraints:
    flag_addr col_used, c
    ld a, Slot.Taken
    ld (hl), a

    flag_addr queen_cols, b
    ld a, c               ; queen_cols holds a column number, not a Slot
    ld (hl), a

    diag_sum_addr
    ld a, Slot.Taken
    ld (hl), a

    diag_diff_addr
    ld a, Slot.Taken
    ld (hl), a
    ret

; unmark_constraints: release column C on row B and both diagonals
.routine in B,C clobbers AF,DE,HL
unmark_constraints:
    flag_addr col_used, c
    xor a                 ; one byte, and Slot.Free is zero
    ld (hl), a

    diag_sum_addr
    xor a
    ld (hl), a

    diag_diff_addr
    xor a
    ld (hl), a
    ret

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

    push bc
    call col_free
    pop bc
    jr nz, _next_col

    push bc
    call diag_sum_free
    pop bc
    jr nz, _next_col

    push bc
    call diag_diff_free
    pop bc
    jr nz, _next_col

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

_next_col:
    inc c
    jr _col_loop
_row_done:
    ret

; count_solution: snapshot queen_cols, then solution_count++
.routine clobbers AF,BC,DE,HL
count_solution:
    ld hl, queen_cols
    ld de, solution_cols
    ld bc, BOARD_SIZE
    ldir
    ld hl, solution_count
    ld a, (hl)
    inc a
    ld (hl), a
    jr nz, _count_done
    inc hl
    inc (hl)
_count_done:
    ret

.org $8000
queens_ws:
    .ds QueenWorkspace
