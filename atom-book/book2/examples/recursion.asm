; Chapter 16 companion. Results: FACTR=FACTI=$78, SUMR=$001A.

FACTN EQU 5
FSTEP EQU 4
FBASE EQU 2
FDEPTH EQU FACTN+1
FSTACK EQU FACTN*FSTEP+FBASE
STACKTOP EQU 9FFFH

ORG 0000H
MAIN:
    LD SP,STACKTOP

    LD B,FACTN
    CALL FACTREC
    LD (FACTR),A

    LD B,FACTN
    CALL FACTITER
    LD (FACTI),A

    LD HL,NUMS
    LD A,NUMSLEN
    CALL SUMREC
    LD (SUMR),HL
    HALT

; In: B=n. Out: A=n!. Uses four stack bytes per non-base level.
FACTREC:
    LD A,B
    OR A
    JR Z,.ONE
    PUSH BC
    DEC B
    CALL FACTREC
    POP BC
    LD C,B
    CALL MUL8AC
    RET
.ONE:
    LD A,1
    RET

; In: B=n. Out: A=n!, computed iteratively.
FACTITER:
    LD A,B
    OR A
    JR Z,.ONE
    LD E,1
    LD C,B
.LOOP:
    LD A,C
    OR A
    JR Z,.DONE
    LD A,E
    PUSH BC
    CALL MUL8AC
    LD E,A
    POP BC
    DEC C
    JR .LOOP
.DONE:
    LD A,E
    RET
.ONE:
    LD A,1
    RET

MUL8AC:
    OR A
    RET Z
    LD B,A
    XOR A
.LOOP:
    ADD A,C
    DJNZ .LOOP
    RET

; In: HL=table, A=count. Out: HL=sum.
SUMREC:
    OR A
    JR Z,.ZERO
    LD B,A
    LD A,(HL)
    PUSH AF
    INC HL
    DEC B
    LD A,B
    CALL SUMREC
    POP AF
    LD E,A
    LD D,0
    ADD HL,DE
    RET
.ZERO:
    LD HL,0
    RET

ORG 8000H
FACTR:
    DS 1
FACTI:
    DS 1
SUMR:
    DS 2
NUMS:
    DB 2,3,5,7,9
NUMSLEN EQU $-NUMS
