; 07_include_demo.asm - Chapter 7 companion
; Assemble from book3:
;   azm examples/07_include_demo.asm
; Run to halt, then inspect:
;   (str_len) at $8008 - length of message ("HELLO" -> 5)

; The message field is reserved at a fixed width so str_len keeps its address
; when the text changes length. offset(DemoData, str_len) places it.
DemoData .type
message  .field byte[8]
str_len  .byte
.endtype

.org $0000
main:
    ld hl, message
    call strlen_u8
    ld (str_len), a
    halt

.include "lib/strings.asm"

DEMO_BASE .equ $8000

.org DEMO_BASE
message:
    .db "HELLO", 0

.org DEMO_BASE + offset(DemoData, str_len)
str_len:
    .ds byte
