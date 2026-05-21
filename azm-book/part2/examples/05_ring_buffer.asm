; 05_ring_buffer.asm — Chapter 5 companion
; Assemble: azm 05_ring_buffer.asm
; Run to halt, then inspect:
;   ring_buf at $8000 — FIFO storage (capacity 8)
;   ring_state at $8008 — head, tail, count (RingState)
;   pop_result at $800B — last popped byte ($33)
;   push_ok at $800C — $01 if last push succeeded, $00 if ring was full

RING_CAP .equ 8

.type RingState
head    .byte
tail    .byte
count   .byte
.endtype

RING_HEAD   .equ offset(RingState, head)
RING_TAIL   .equ offset(RingState, tail)
RING_COUNT  .equ offset(RingState, count)

.org $0000
main:
    ld ix, ring_state
    xor a
    ld (ix + RING_HEAD), a
    ld (ix + RING_TAIL), a
    ld (ix + RING_COUNT), a

    ld a, $11
    call ring_push
    ld a, $22
    call ring_push
    ld a, $33
    call ring_push

    call ring_pop
    call ring_pop
    call ring_pop
    ld (pop_result), a

    ld a, $44
    call ring_push
    ld a, $55
    call ring_push
    ld a, $66
    call ring_push
    ld a, $77
    call ring_push
    ld a, $88
    call ring_push
    ld a, $99
    call ring_push
    ld a, $AA
    call ring_push
    ld a, $BB
    call ring_push

    ld a, $CC
    call ring_push
    xor a
    ld (push_ok), a
    jr nc, .after_full_test
    inc a
    ld (push_ok), a
.after_full_test:
    halt

; ring_push: append one byte; carry set on success, carry clear when full
;!      in        A, IX
;!      out       carry
;!      clobbers  BC, DE, HL
@ring_push:
    ld e, a
    ld a, (ix + RING_COUNT)
    cp RING_CAP
    jr nc, .full
    ld a, (ix + RING_HEAD)
    ld hl, ring_buf
    ld b, 0
    ld c, a
    add hl, bc
    ld a, e
    ld (hl), a
    ld a, (ix + RING_HEAD)
    call ring_advance_index
    ld (ix + RING_HEAD), a
    ld a, (ix + RING_COUNT)
    inc a
    ld (ix + RING_COUNT), a
    scf
    ret
.full:
    or a
    ret

; ring_pop: remove oldest byte; carry set on success, carry clear when empty
;!      in        IX
;!      out       A, carry
;!      clobbers  BC, DE, HL
@ring_pop:
    ld a, (ix + RING_COUNT)
    or a
    jr z, .empty
    ld a, (ix + RING_TAIL)
    ld hl, ring_buf
    ld b, 0
    ld c, a
    add hl, bc
    ld e, (hl)
    ld a, (ix + RING_TAIL)
    call ring_advance_index
    ld (ix + RING_TAIL), a
    ld a, (ix + RING_COUNT)
    dec a
    ld (ix + RING_COUNT), a
    ld a, e
    scf
    ret
.empty:
    or a
    ret

; ring_advance_index: A := (A + 1) mod RING_CAP
;!      in        A
;!      out       A
;!      clobbers  F
@ring_advance_index:
    inc a
    cp RING_CAP
    ret c
    xor a
    ret

.org $8000
ring_buf:
    .ds RING_CAP
ring_state:
    .ds RingState
pop_result:
    .ds byte
push_ok:
    .ds byte
