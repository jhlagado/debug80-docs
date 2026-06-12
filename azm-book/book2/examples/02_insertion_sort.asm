; 02_insertion_sort.asm — Chapter 2 companion
; Assemble: azm 02_insertion_sort.asm
; Run to halt, then inspect values at $8000 (8 bytes, sorted 1..9).
; (found_index) at $8008 — index of first value >= 5 → 4

ARRAY_LEN .equ 8
THRESHOLD .equ 5

.org $0000
main:
    ld hl, values
    ld b, ARRAY_LEN
    call insertion_sort

    ld hl, values
    ld c, THRESHOLD
    call find_byte_ge
    ld (found_index), a
    halt

; insertion_sort: sort byte table ascending (insertion sort)
;! in HL,B; out HL; clobbers AF,BC,DE,HL
@insertion_sort:
    ld hl, sort_len
    ld (hl), b
    ld de, hl
    ld c, 1
.outer:
    ld a, c
    ld hl, sort_len
    ld b, (hl)
    cp b
    jr nc, .done
    ld hl, de
    ld b, 0
    add hl, bc
    ld a, (hl)
    push af
    ld hl, key_byte
    pop af
    ld (hl), a
    ld b, c
.inner:
    dec b
    ld a, b
    cp $FF
    jr z, .place
    ld hl, de
    ld a, b
    ld c, a
    ld b, 0
    add hl, bc
    ld a, (hl)
    ld e, a
    ld hl, key_byte
    ld a, (hl)
    cp e
    jr nc, .place
    ld a, e
    inc hl
    ld (hl), a
    dec hl
    dec hl
    jr .inner
.place:
    ld hl, de
    inc b
    ld a, b
    ld c, a
    ld b, 0
    add hl, bc
    ld hl, key_byte
    ld a, (hl)
    ld (hl), a
    inc c
    jr .outer
.done:
    ld hl, de
    ret

; find_byte_ge: first index where values[i] >= C, or $FF if none
;! in HL,C; out A; clobbers F,B,HL
@find_byte_ge:
    ld b, 0
.scan:
    ld a, (hl)
    cp c
    jr nc, .found
    inc hl
    inc b
    ld a, b
    cp ARRAY_LEN
    jr c, .scan
    ld a, $FF
    ret
.found:
    ld a, b
    ret

.org $8000
values:
    .db 9, 4, 6, 2, 8, 1, 7, 3
found_index:
    .ds byte
key_byte:
    .ds byte
sort_len:
    .ds byte
