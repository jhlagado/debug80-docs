; Chapter 12 companion. Results: GCDRES=$0006, POWRES=$51.

BASE EQU 3
EXP EQU 4
GCDA EQU 48
GCDB EQU 18

ORG 0000H
MAIN:
    LD HL,GCDA
    LD DE,GCDB
    CALL GCDU16
    LD (GCDRES),HL

    LD C,BASE
    LD B,EXP
    CALL POWERU8
    LD (POWRES),A
    HALT

; In: HL,DE. Out: HL. Clobbers: AF,DE.
GCDU16:
.LOOP:
    LD A,H
    OR L
    JR Z,.RIGHT
    LD A,D
    OR E
    JR Z,.LEFT
    PUSH HL
    OR A
    SBC HL,DE
    POP HL
    JR C,.SWAP
    OR A
    SBC HL,DE
    JR .LOOP
.SWAP:
    EX DE,HL
    JR .LOOP
.LEFT:
    RET
.RIGHT:
    EX DE,HL
    RET

; In: B=exponent, C=base. Out: A. Clobbers: F,B,E.
POWERU8:
    LD E,1
.LOOP:
    LD A,B
    OR A
    JR Z,.DONE
    DEC B
    LD A,E
    PUSH BC
    CALL MUL8AC
    POP BC
    LD E,A
    JR .LOOP
.DONE:
    LD A,E
    RET

; In: A,C. Out: A. Clobbers: F,B.
MUL8AC:
    OR A
    RET Z
    LD B,A
    XOR A
.LOOP:
    ADD A,C
    DJNZ .LOOP
    RET

ORG 8000H
GCDRES:
    DS 2
POWRES:
    DS 1
