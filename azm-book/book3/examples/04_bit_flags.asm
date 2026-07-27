; 04_bit_flags.asm — Chapter 4 companion
; Assemble: azm 04_bit_flags.asm
; Run to halt, then inspect:
;   (device_flags) at $8000 — final packed status byte → $03
;   (ready_lit)    at $8001 — 1 if READY was set at start → 1
;   (error_bit)    at $8002 — bit 1 isolated → 1

; Bit positions first; the masks are shifts of those positions, so a bit never
; has one number in the mask and a different one in a bit instruction.
StatusBit .enum Ready, Error, Busy

FLAG_READY .equ 1 << StatusBit.Ready
FLAG_ERROR .equ 1 << StatusBit.Error
FLAG_BUSY  .equ 1 << StatusBit.Busy

op bit_set(mask imm8)
  or mask
end

op bit_clr(mask imm8)
  ld b, a
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
    bit_set FLAG_ERROR
    ld (device_flags), a

    ld a, (device_flags)
    bit_clr FLAG_BUSY
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
