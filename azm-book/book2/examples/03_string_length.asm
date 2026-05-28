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
    jr nz, .copy_bad
    ld a, 1
.copy_bad:
    ld (copy_ok), a

    ld hl, message
    ld c, CHAR_L
    call str_find_char
    ld (find_index), a
    halt

CHAR_L .equ 'L'

; strlen_u8: bytes before null terminator (HL → string)
;!      in        HL
;!      out       A
;!      clobbers  AF, B, HL
@strlen_u8:
    ld b, 0
.slen_loop:
    ld a, (hl)
    or a
    jr z, .done
    inc hl
    inc b
    jr .slen_loop
.done:
    ld a, b
    ret

; strcpy_u8: copy null-terminated string HL → DE (terminator included)
;!      in        HL, DE
;!      out       DE
;!      clobbers  AF, HL, DE
@strcpy_u8:
.copy:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    or a
    jr nz, .copy
    ret

; strcmp_u8: lexicographic compare; 0 equal, 1 HL>DE, $FF HL<DE
;!      in        HL, DE
;!      out       A
;!      clobbers  AF, HL, DE
@strcmp_u8:
.cmp_loop:
    ld a, (hl)
    push af
    ld a, (de)
    pop bc
    cp c
    jr c, .less
    jr nz, .greater
    or a
    jr z, .equal
    inc hl
    inc de
    jr .cmp_loop
.less:
    ld a, $FF
    ret
.greater:
    ld a, 1
    ret
.equal:
    xor a
    ret

; str_find_char: index of first C in string, or $FF if absent
;!      in        HL, C
;!      out       A
;!      clobbers  AF, B, HL
@str_find_char:
    ld b, 0
.scan:
    ld a, (hl)
    or a
    jr z, .missing
    cp c
    jr z, .found
    inc hl
    inc b
    jr .scan
.found:
    ld a, b
    ret
.missing:
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
