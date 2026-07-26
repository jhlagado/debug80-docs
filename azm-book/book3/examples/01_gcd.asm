; 01_gcd.asm — Chapter 1 companion
; Assemble: azm 01_gcd.asm
; Run to halt, then inspect:
;   (gcd_result)   at $8000 — GCD(48, 18) → $0006
;   (power_result) at $8002 — 3^4 → $0051 (81)

BASE .equ 3
EXP  .equ 4
GCD_A .equ 48
GCD_B .equ 18

.org $0000
main:
    ld hl, GCD_A
    ld de, GCD_B
    call gcd_u16
    ld (gcd_result), hl

    ld c, BASE
    ld b, EXP
    call power_u8
    ld (power_result), a
    halt

; gcd_u16: greatest common divisor (Euclidean, subtractive)
.routine in HL,DE out HL clobbers AF,DE
gcd_u16:
_loop:
    ld a, h
    or l
    jr z, _right_is_answer
    ld a, d
    or e
    jr z, _left_is_answer
    push hl
    or a
    sbc hl, de
    pop hl
    jr c, _swap
    or a
    sbc hl, de
    jr _loop
_swap:
    ex de, hl
    jr _loop
_left_is_answer:
    ret
_right_is_answer:
    ex de, hl
    ret

; power_u8: unsigned C^B into A (B may be 0 → 1)
.routine in B,C out A clobbers F,BC,DE
power_u8:
    ld e, 1
_pow_loop:
    ld a, b
    or a
    jr z, _done
    dec b
    ld a, e
    push bc
    call mul8_a_by_c
    pop bc
    ld e, a
    jr _pow_loop
_done:
    ld a, e
    ret

; mul8_a_by_c: A := A * C (8-bit, small operands only)
.routine in A,C out A clobbers F,B
mul8_a_by_c:
    or a
    ret z
    ld b, a
    xor a
_mul_loop:
    add a, c
    djnz _mul_loop
    ret

.org $8000
gcd_result:
    .ds word
power_result:
    .ds byte
