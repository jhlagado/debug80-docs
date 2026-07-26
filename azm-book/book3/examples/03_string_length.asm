; 03_string_length.asm — Chapter 3 companion
; Assemble: azm 03_string_length.asm
; Run to halt, then inspect:
;   (str_len)     at $8008 — length of message ("HELLO" → 5)
;   (copy_ok)     at $8009 — $01 if buffer matches source
;   (find_index)  at $800A — index of 'L' in message → 2

.org $0000
main:
    ld hl, message
    call strlen_u8
    ld (str_len), a

    ld hl, message
    ld de, buffer
    call strcpy_u8

    ld hl, buffer
    ld de, message
    call strcmp_u8
    ld a, 0
    jr nz, _copy_bad
    ld a, 1
_copy_bad:
    ld (copy_ok), a

    ld hl, message
    ld c, CHAR_L
    call str_find_char
    ld (find_index), a
    halt

CHAR_L .equ 'L'

; strlen_u8: bytes before null terminator (HL → string)
.routine in HL out A clobbers F,B,HL
strlen_u8:
    ld b, 0
_slen_loop:
    ld a, (hl)
    or a
    jr z, _done
    inc hl
    inc b
    jr _slen_loop
_done:
    ld a, b
    ret

; strcpy_u8: copy null-terminated string HL → DE (terminator included)
.routine in HL,DE out DE clobbers AF,HL
strcpy_u8:
_copy:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    or a
    jr nz, _copy
    ret

; strcmp_u8: lexicographic compare; 0 equal, 1 HL>DE, $FF HL<DE
.routine in HL,DE out A clobbers F,HL,DE
strcmp_u8:
_cmp_loop:
    ld a, (hl)
    push af
    ld a, (de)
    pop bc
    cp c
    jr c, _greater
    jr nz, _less
    or a
    jr z, _equal
    inc hl
    inc de
    jr _cmp_loop
_less:
    ld a, $FF
    ret
_greater:
    ld a, 1
    ret
_equal:
    xor a
    ret

; str_find_char: index of first C in string, or $FF if absent
.routine in HL,C out A clobbers F,B,HL
str_find_char:
    ld b, 0
_scan:
    ld a, (hl)
    or a
    jr z, _missing
    cp c
    jr z, _found
    inc hl
    inc b
    jr _scan
_found:
    ld a, b
    ret
_missing:
    ld a, $FF
    ret

.org $8000
message:
    .db "HELLO", 0
buffer:
    .ds byte[8]
str_len:
    .ds byte
copy_ok:
    .ds byte
find_index:
    .ds byte
