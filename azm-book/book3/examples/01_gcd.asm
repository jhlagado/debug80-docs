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
;!      in        HL, DE
;!      out       HL
;!      clobbers  AF, DE
@gcd_u16:
.loop:
    ld a, h
    or l
    jr z, .right_is_answer
    ld a, d
    or e
    jr z, .left_is_answer
    push hl
    or a
    sbc hl, de
    pop hl
    jr c, .swap
    or a
    sbc hl, de
    jr .loop
.swap:
    ex de, hl
    jr .loop
.left_is_answer:
    ret
.right_is_answer:
    ex de, hl
    ret

; power_u8: unsigned C^B into A (B may be 0 → 1)
;!      in        B, C
;!      out       A
;!      clobbers  AF, BC, DE, E
@power_u8:
    ld e, 1
.pow_loop:
    ld a, b
    or a
    jr z, .done
    dec b
    ld a, e
    call mul8_a_by_c
    ld e, a
    jr .pow_loop
.done:
    ld a, e
    ret

; mul8_a_by_c: A := A * C (8-bit, small operands only)
;!      in        A, C
;!      out       A
;!      clobbers  AF, BC, DE
@mul8_a_by_c:
    ld b, a
    ld a, 0
.mul_loop:
    ld a, b
    or a
    ret z
    dec b
    add a, c
    jr .mul_loop

.org $8000
gcd_result:
    .ds word
power_result:
    .ds byte
