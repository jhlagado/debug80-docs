; lib/strings.asm — shared string routines (Chapter 7)
; Included by application .asm files; do not assemble this file alone.
; Contract: Chapter 3 string convention — HL in, A out for length/search.

; strlen_u8: count bytes before null (terminator not counted)
;! in HL; out A; clobbers F,B,HL
@strlen_u8:
    ld b, 0
.loop:
    ld a, (hl)
    or a
    jr z, .done
    inc hl
    inc b
    jr .loop
.done:
    ld a, b
    ret
