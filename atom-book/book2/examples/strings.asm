; Chapter 14 companion. Results: STRLENB=5, COPYOK=1, FINDIDX=2.

CHARL EQU 'L'

ORG 0000H
MAIN:
    LD HL,MESSAGE
    CALL STRLEN
    LD (STRLENB),A

    LD HL,MESSAGE
    LD DE,BUFFER
    CALL STRCOPY

    LD HL,BUFFER
    LD DE,MESSAGE
    CALL STRCMP
    OR A
    JR NZ,.BAD
    LD A,1
    JR .STORE
.BAD:
    XOR A
.STORE:
    LD (COPYOK),A

    LD HL,MESSAGE
    LD C,CHARL
    CALL STRFIND
    LD (FINDIDX),A
    HALT

; In: HL=null-terminated string. Out: A=length.
STRLEN:
    LD B,0
.LOOP:
    LD A,(HL)
    OR A
    JR Z,.DONE
    INC HL
    INC B
    JR .LOOP
.DONE:
    LD A,B
    RET

; In: HL=source, DE=destination. Copies through the terminator.
STRCOPY:
.LOOP:
    LD A,(HL)
    LD (DE),A
    INC HL
    INC DE
    OR A
    JR NZ,.LOOP
    RET

; In: HL,DE=strings. Out: A=0 equal, 1 greater, $FF less.
STRCMP:
.LOOP:
    LD A,(HL)
    PUSH AF
    LD A,(DE)
    POP BC
    CP B
    JR C,.GREATER
    JR NZ,.LESS
    OR A
    JR Z,.EQUAL
    INC HL
    INC DE
    JR .LOOP
.LESS:
    LD A,0FFH
    RET
.GREATER:
    LD A,1
    RET
.EQUAL:
    XOR A
    RET

; In: HL=string, C=character. Out: A=index or $FF.
STRFIND:
    LD B,0
.LOOP:
    LD A,(HL)
    OR A
    JR Z,.MISSING
    CP C
    JR Z,.FOUND
    INC HL
    INC B
    JR .LOOP
.FOUND:
    LD A,B
    RET
.MISSING:
    LD A,0FFH
    RET

ORG 8000H
MESSAGE:
    DB "HELLO",0
BUFFER:
    DS 8
STRLENB:
    DS 1
COPYOK:
    DS 1
FINDIDX:
    DS 1
