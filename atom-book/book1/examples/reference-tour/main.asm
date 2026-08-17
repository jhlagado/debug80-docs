%DEFINE DEBUG 1
%INCLUDE "lib/device.asm"

ORG 4000H

START:
    LD A,DEVICEID
    JR .DONE
    DB 'X'
.DONE:
    DW START
    ALIGN 8
    CSTR "OK"
    PSTR "A"
    ISTR "Z"
    DS 2
    DS 2,$FF
