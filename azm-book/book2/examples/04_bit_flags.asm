; 04_bit_flags.asm — Chapter 4 companion
; Assemble: azm 04_bit_flags.asm
; Run to halt, then inspect:
;   (device_flags) at $8000 — final packed status byte → $03
;   (ready_lit)    at $8001 — 1 if READY was set at start → 1
;   (error_bit)    at $8002 — bit 1 isolated → 1

FLAG_READY .equ $01
FLAG_ERROR .equ $02
FLAG_BUSY  .equ $04

op bit_set(reg reg8, mask imm8)
  or mask
end

op bit_clr(reg reg8, mask imm8)
  ld b, reg
  ld a, mask
  cpl
  and b
end

op bit_test(mask imm8)
  and mask
end

.org $0000
main:
    ld a, (device_flags)
    bit_test FLAG_READY
    ld a, 0
    jr z, _ready_clear
    ld a, 1
_ready_clear:
    ld (ready_lit), a

    ld a, (device_flags)
    bit_set A, FLAG_ERROR
    ld (device_flags), a

    ld a, (device_flags)
    bit_clr A, FLAG_BUSY
    ld (device_flags), a

    ld a, (device_flags)
    call extract_bit_u8
    ld (error_bit), a
    halt

; extract_bit_u8: isolate bit 1 of A into A as 0 or 1
.routine in A out A clobbers F
extract_bit_u8:
    and FLAG_ERROR
    rr a
    ret

.org $8000
device_flags:
    .db $05
ready_lit:
    .ds byte
error_bit:
    .ds byte
