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
.routine in HL,B out HL clobbers AF,BC,DE
insertion_sort:
    push hl
    pop de
    ld hl, sort_len
    ld (hl), b
    ld c, 1
_outer:
    ld a, c
    ld (sort_index), a
    ld hl, sort_len
    ld b, (hl)
    cp b
    jr nc, _done
    push de
    pop hl
    ld b, 0
    add hl, bc
    ld a, (hl)
    push af
    ld hl, key_byte
    pop af
    ld (hl), a
    ld b, c
_inner:
    dec b
    ld a, b
    cp $FF
    jr z, _place
    push de
    pop hl
    ld a, b
    ld c, a
    ld b, 0
    add hl, bc
    push hl
    ld hl, key_byte
    ld a, (hl)
    pop hl
    cp (hl)
    jr nc, _place
    ld a, (hl)
    inc hl
    ld (hl), a
    jr _inner
_place:
    push de
    pop hl
    inc b
    ld a, b
    ld c, a
    ld b, 0
    add hl, bc
    push hl
    ld hl, key_byte
    ld a, (hl)
    pop hl
    ld (hl), a
    ld a, (sort_index)
    ld c, a
    inc c
    jr _outer
_done:
    push de
    pop hl
    ret

; find_byte_ge: first index where values[i] >= C, or $FF if none
.routine in HL,C out A clobbers F,B,HL
find_byte_ge:
    ld b, 0
_scan:
    ld a, (hl)
    cp c
    jr nc, _found
    inc hl
    inc b
    ld a, b
    cp ARRAY_LEN
    jr c, _scan
    ld a, $FF
    ret
_found:
    ld a, b
    ret

.org $8000
values:
    .db 9, 4, 6, 2, 8, 1, 7, 3
found_index:
    .ds byte
key_byte:
    .ds byte
sort_index:
    .ds byte
sort_len:
    .ds byte
