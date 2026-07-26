; 08_linked_list.asm — Chapter 8 companion
; Assemble: azm 08_linked_list.asm
; Run to halt, then inspect:
;   list_sum at $800E — sum of 10+20+30 → $003C (60)
;   find_hit at $8010 — $01 if $22 was found
;   find_node at $800F — address of node_b when found
;   sum_after at $8011 — sum after push $40 at head → $0064 (100)

ListNode .type
value   .byte
next    .word
.endtype

LIST_VALUE  .equ offset(ListNode, value)
LIST_NEXT   .equ offset(ListNode, next)

.org $0000
main:
    ld hl, (list_head)
    call list_sum_u16
    ld (list_sum), hl

    ld a, $22
    ld hl, (list_head)
    call list_find_u8
    ld (find_node), hl
    ld a, 0
    ld (find_hit), a
    jr nc, _after_find
    inc a
    ld (find_hit), a
_after_find:

    ld de, node_spare
    ld a, $40
    call list_push_head

    ld hl, (list_head)
    call list_sum_u16
    ld (sum_after), hl

    halt

; list_sum_u16: sum value bytes along list starting at HL (null = 0)
.routine in HL out HL clobbers AF,BC,DE
list_sum_u16:
    ld de, 0
_sum_loop:
    ld a, h
    or l
    jr z, _sum_done
    ld a, (hl)
    add a, e
    ld e, a
    jr nc, _sum_no_carry
    inc d
_sum_no_carry:
    ld bc, LIST_NEXT
    add hl, bc
    ld a, (hl)
    ld c, a
    inc hl
    ld a, (hl)
    ld h, a
    ld l, c
    jr _sum_loop
_sum_done:
    ex de, hl
    ret

; list_find_u8: find first node with value A; HL = node or 0, carry set if found
.routine in HL,A out HL,carry clobbers A,BC,DE
list_find_u8:
    ld b, a
_find_loop:
    ld a, h
    or l
    jr z, _not_found
    ld a, (hl)
    cp b
    jr z, _found
    ld bc, LIST_NEXT
    add hl, bc
    ld a, (hl)
    ld c, a
    inc hl
    ld a, (hl)
    ld h, a
    ld l, c
    jr _find_loop
_found:
    scf
    ret
_not_found:
    ld hl, 0
    or a
    ret

; list_push_head: prepend node DE with value A; updates list_head
.routine in A,DE clobbers BC,DE,HL
list_push_head:
    push af
    ld hl, list_head
    ld a, (hl)
    ld c, a
    inc hl
    ld a, (hl)
    ld b, a
    pop af
    ld (de), a
    ex de, hl
    ld (hl), c
    inc hl
    ld (hl), b
    ex de, hl
    ld hl, list_head
    ld (hl), e
    inc hl
    ld (hl), d
    ret

.org $8000
node_a:
    .db $10
    .dw node_b
node_b:
    .db $22
    .dw node_c
node_c:
    .db $30
    .dw 0

node_spare:
    .ds ListNode

list_head:
    .dw node_a

list_sum:
    .ds word
find_node:
    .ds word
find_hit:
    .ds byte
sum_after:
    .ds word
