; 07_include_demo.asm — Chapter 7 companion
; Assemble from book3/examples:
;   azm 07_include_demo.asm
; Run to halt, then inspect:
;   (str_len) at $8008 — length of message ("HELLO" → 5)

.org $0000
main:
    ld hl, message
    call strlen_u8
    ld (str_len), a
    halt

.include "lib/strings.asm"

.org $8000
message:
    .db "HELLO", 0

.org $8008
str_len:
    .ds byte
