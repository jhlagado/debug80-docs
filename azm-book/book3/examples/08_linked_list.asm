; 08_linked_list.asm — Chapter 8 companion
; Assemble: azm 08_linked_list.asm
; Run to halt, then inspect:
;   list_sum at $800E — sum of $10+$22+$30 → $0062 (98)
;   find_node at $8010 — address of node_b when found
;   find_hit at $8012 — $01 if $22 was found
;   sum_after at $8013 — sum after push $40 at head → $00A2 (162)

ListNode .type
value   .byte
next    .word
.endtype

LIST_VALUE  .equ offset(ListNode, value)
LIST_NEXT   .equ offset(ListNode, next)
NODE_SIZE   .equ sizeof(ListNode)

; HL := the node HL's next field points at. Both walks below need it, and an
; op keeps the eight instructions in one place while still emitting them
; inline at each call site.
op follow_next()
  ld bc, LIST_NEXT
  add hl, bc            ; HL = &node.next
  ld a, (hl)
  ld c, a               ; C = low byte of next
  inc hl
  ld a, (hl)
  ld h, a               ; H = high byte of next
  ld l, c
end

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
    follow_next
    jr _sum_loop
_sum_done:
    ex de, hl
    ret

; list_find_u8: find first node with value A; HL = node or 0, carry set if found
.routine in HL,A out HL,carry clobbers A,zero,sign,parity,halfCarry,BC,D
list_find_u8:
    ld d, a
_find_loop:
    ld a, h
    or l
    jr z, _not_found
    ld a, (hl)
    cp d
    jr z, _found
    follow_next
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
    ld hl, (list_head)
    ld c, l
    ld b, h              ; BC = old head
    pop af
    ld (de), a           ; new node's value field, at offset LIST_VALUE = 0
    ex de, hl            ; HL = new node
    push hl
    inc hl               ; LIST_NEXT is 1, so one inc reaches the link
    ld (hl), c           ; next, low byte
    inc hl
    ld (hl), b           ; next, high byte
    pop hl               ; HL = new node base again
    ld (list_head), hl
    ret

.org $8000
; Three ListNode records written out by hand: one value byte, then the
; NODE_SIZE - 1 bytes of link that follow it.
node_a:
    .db $10               ; value
    .dw node_b            ; next
node_b:
    .db $22
    .dw node_c
node_c:
    .db $30
    .dw 0                 ; next = null

node_spare:
    .ds ListNode

list_head:
    .dw node_a

list_sum:
    .ds word
find_node:
    .ds addr              ; holds a node address, not a count
find_hit:
    .ds byte
sum_after:
    .ds word
