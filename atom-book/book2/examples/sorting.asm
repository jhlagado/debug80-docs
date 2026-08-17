; Chapter 13 companion. Sorts VALUES and stores the first index >= 5.

LIMIT EQU 5

ORG 0000H
MAIN:
    LD HL,VALUES
    LD B,ARRLEN
    CALL INSSORT

    LD HL,VALUES
    LD C,LIMIT
    CALL FINDGE
    LD (FOUNDIDX),A
    HALT

; In: HL=table, B=length. Sorts the table ascending.
INSSORT:
    PUSH HL
    POP DE
    LD HL,SORTLEN
    LD (HL),B
    LD C,1
.OUTER:
    LD A,C
    LD (SORTIDX),A
    LD HL,SORTLEN
    LD B,(HL)
    CP B
    JR NC,.DONE
    PUSH DE
    POP HL
    LD B,0
    ADD HL,BC
    LD A,(HL)
    LD (KEYBYTE),A
    LD A,C
    LD (SORTJ),A
.INNER:
    LD A,(SORTJ)
    DEC A
    LD (SORTJ),A
    CP 0FFH
    JR Z,.PLACE
    PUSH DE
    POP HL
    LD C,A
    LD B,0
    ADD HL,BC
    LD A,(KEYBYTE)
    CP (HL)
    JR NC,.PLACE
    LD A,(HL)
    INC HL
    LD (HL),A
    JR .INNER
.PLACE:
    PUSH DE
    POP HL
    LD A,(SORTJ)
    INC A
    LD C,A
    LD B,0
    ADD HL,BC
    LD A,(KEYBYTE)
    LD (HL),A
    LD A,(SORTIDX)
    LD C,A
    INC C
    JR .OUTER
.DONE:
    RET

; In: HL=table, C=limit. Out: A=index or $FF.
FINDGE:
    LD B,0
.SCAN:
    LD A,(HL)
    CP C
    JR NC,.FOUND
    INC HL
    INC B
    LD A,B
    CP ARRLEN
    JR C,.SCAN
    LD A,0FFH
    RET
.FOUND:
    LD A,B
    RET

ORG 8000H
VALUES:
    DB 9,4,6,2,8,1,7,3
ARRLEN EQU $-VALUES
FOUNDIDX:
    DS 1
KEYBYTE:
    DS 1
SORTIDX:
    DS 1
SORTJ:
    DS 1
SORTLEN:
    DS 1
