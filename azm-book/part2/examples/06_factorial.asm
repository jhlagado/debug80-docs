; 06_factorial.asm — Chapter 6 companion
; Assemble: azm examples/06_factorial.asm
; Run to halt, then inspect:
;   (fact_rec)  at $8000 — 5! via recursion → $78 (120)
;   (fact_iter) at $8001 — 5! via loop     → $78 (120)
;   (sum_rec)   at $8002 — $8003 — sum_u8_rec on demo table → $001A (26)

FACT_N .equ 5

; Stack budget for factorial_u8 (compile-time check on paper):
;   each active frame: return address (2) + push bc (2) = 4 bytes
FACT_FRAME_BYTES .equ 4
FACT_MAX_DEPTH   .equ FACT_N + 1
STACK_TOP        .equ $9FFF

.org $0000
main:
    ld sp, STACK_TOP

    ld b, FACT_N
    call factorial_u8
    ld (fact_rec), a

    ld b, FACT_N
    call factorial_iter_u8
    ld (fact_iter), a

    ld hl, demo_nums
    ld a, 5
    call sum_u8_rec
    ld (sum_rec), hl

    halt

; factorial_u8: unsigned B! into A (0! = 1; safe for B <= 5 in 8 bits)
; Self-call; max depth FACT_MAX_DEPTH; frame FACT_FRAME_BYTES bytes.
;!      in        B
;!      out       A
;!      clobbers  AF, BC
@factorial_u8:
    ld a, b
    or a
    jr z, .fact_one
    push bc
    dec b
    call factorial_u8
    pop bc
    ld c, b
    call mul8_a_by_c
    ret
.fact_one:
    ld a, 1
    ret

; factorial_iter_u8: same contract as factorial_u8, iterative
;!      in        B
;!      out       A
;!      clobbers  AF, BC, DE
@factorial_iter_u8:
    ld a, b
    or a
    jr z, .iter_one
    ld e, 1
    ld c, b
.iter_loop:
    ld a, c
    or a
    jr z, .iter_done
    ld a, e
    call mul8_a_by_c
    ld e, a
    dec c
    jr .iter_loop
.iter_done:
    ld a, e
    ret
.iter_one:
    ld a, 1
    ret

; mul8_a_by_c: A := A * C (8-bit, demo sizes only)
;!      in        A, C
;!      out       A
;!      clobbers  AF, BC, DE
@mul8_a_by_c:
    ld e, a
    ld a, 0
    ld b, c
.acc:
    ld a, b
    or a
    jr z, .mul_done
    dec b
    add a, e
    jr .acc
.mul_done:
    ret

; sum_u8_rec: sum bytes demo_nums[0 .. A-1] into HL (A = count on entry)
; Self-call; one return address per tail index; no extra pushes in body.
;!      in        HL, A
;!      out       HL
;!      clobbers  AF, BC, DE, HL
@sum_u8_rec:
    or a
    jr z, .zero
    push af
    push bc
    ld b, a
    ld a, (hl)
    ld c, a
    inc hl
    dec b
    ld a, b
    call sum_u8_rec
    ld e, c
    ld d, 0
    add hl, de
    pop bc
    pop af
    ret
.zero:
    ld hl, 0
    ret

.org $8000
fact_rec:
    .ds byte
fact_iter:
    .ds byte
sum_rec:
    .ds word

demo_nums:
    .db 2, 3, 5, 7, 9
