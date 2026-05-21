; 09_eight_queens.asm — Chapter 9 companion
; Assemble: azm 09_eight_queens.asm
; Run to halt, then inspect:
;   (solution_count) at $8000 — number of distinct 8-queen placements → $005C (92)
;   (queen_cols)     at $8002 — last completed solution: col per row (8 bytes)

BOARD_SIZE   .equ 8
DIAG_BIAS    .equ 7
DIAG_SUM_LEN .equ 15
DIAG_DIFF_LEN .equ 15

; Recursive place_row: push bc (2) + return address (2) per active row try
PLACE_FRAME_BYTES .equ 4
PLACE_MAX_DEPTH   .equ BOARD_SIZE + 1
STACK_TOP         .equ $9FFF

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
;!      in
;!      out
;!      clobbers  AF, BC, DE, HL
@clear_constraints:
    ld hl, col_used
    ld bc, DIAG_SUM_LEN + DIAG_DIFF_LEN + BOARD_SIZE
    xor a
    ld b, a
.zero_loop:
    ld (hl), b
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .zero_loop
    ret

; col_free: is column C unused?
;!      in        C
;!      out       Z set if column is free
;!      clobbers  AF, HL
@col_free:
    ld hl, col_used
    ld b, 0
    add hl, bc
    ld a, (hl)
    or a
    ret

; diag_sum_free: is forward diagonal (row+col) unused?
;!      in        B, C
;!      out       Z set if free
;!      clobbers  AF, DE, HL
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

; diag_diff_free: is backward diagonal (row-col+DIAG_BIAS) unused?
;!      in        B, C
;!      out       Z set if free
;!      clobbers  AF, HL
@diag_diff_free:
    ld a, b
    add a, DIAG_BIAS
    sub c
    ld e, a
    ld d, 0
    ld hl, diag_diff_used
    add hl, de
    ld a, (hl)
    or a
    ret

; mark_constraints: occupy column C on row B and both diagonals
;!      in        B, C
;!      out
;!      clobbers  AF, DE, HL
@mark_constraints:
    ld hl, col_used
    ld d, 0
    ld e, c
    add hl, de
    ld a, 1
    ld (hl), a

    ld hl, queen_cols
    ld d, 0
    ld e, b
    add hl, de
    ld a, c
    ld (hl), a

    ld a, b
    add a, c
    ld e, a
    ld d, 0
    ld hl, diag_sum_used
    add hl, de
    ld a, 1
    ld (hl), a

    ld a, b
    add a, DIAG_BIAS
    sub c
    ld e, a
    ld d, 0
    ld hl, diag_diff_used
    add hl, de
    ld a, 1
    ld (hl), a
    ret

; unmark_constraints: release column C on row B and both diagonals
;!      in        B, C
;!      out
;!      clobbers  AF, DE, HL
@unmark_constraints:
    ld hl, col_used
    ld d, 0
    ld e, c
    add hl, de
    xor a
    ld (hl), a

    ld a, b
    add a, c
    ld e, a
    ld d, 0
    ld hl, diag_sum_used
    add hl, de
    xor a
    ld (hl), a

    ld a, b
    add a, DIAG_BIAS
    sub c
    ld e, a
    ld d, 0
    ld hl, diag_diff_used
    add hl, de
    xor a
    ld (hl), a
    ret

; place_row: assign a queen to row B; count solutions at row BOARD_SIZE
; Self-call; max depth PLACE_MAX_DEPTH; frame PLACE_FRAME_BYTES bytes.
;!      in        B
;!      out
;!      clobbers  AF, BC, DE, HL
@place_row:
    ld a, b
    cp BOARD_SIZE
    jr nz, .try_cols
    call count_solution
    ret
.try_cols:
    ld c, 0
.col_loop:
    ld a, c
    cp BOARD_SIZE
    jr nc, .row_done

    push bc
    call col_free
    pop bc
    jr nz, .next_col

    push bc
    call diag_sum_free
    pop bc
    jr nz, .next_col

    push bc
    call diag_diff_free
    pop bc
    jr nz, .next_col

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

.next_col:
    inc c
    jr .col_loop
.row_done:
    ret

; count_solution: solution_count++
;!      in
;!      out
;!      clobbers  AF, HL
@count_solution:
    ld hl, solution_count
    ld a, (hl)
    inc a
    ld (hl), a
    jr nz, .count_done
    inc hl
    inc (hl)
.count_done:
    ret

.org $8000
solution_count:
    .ds word
queen_cols:
    .ds BOARD_SIZE
col_used:
    .ds BOARD_SIZE
diag_sum_used:
    .ds DIAG_SUM_LEN
diag_diff_used:
    .ds DIAG_DIFF_LEN
