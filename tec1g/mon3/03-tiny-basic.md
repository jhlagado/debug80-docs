---
layout: default
title: "Tiny Basic"
parent: "MON-3 User Guide"
grand_parent: "TEC-1G"
nav_order: 3
has_toc: true
---

[← Memory Map and Data Entry Mode](02-memory-map-and-data-entry-mode.md) | [Guide](index.md) | [Terminal Monitor and TEC Magazine Code →](04-terminal-monitor-and-tec-magazine-code.md)

# Tiny Basic

## Overview

Tiny Basic has been removed from Mon3 as of v1.6 but it can be loaded
as a stand-alone program.  See the GitHub for source files.

Tiny Basic is an easy-to-use BASIC programming language.  Tiny Basic by
default uses the FTDI to USB serial terminal connection.  If a GLCD Add-On
board is installed, the GLCD can be used as a terminal along with a Matrix
Keyboard.  Go to Settings -> Toggle GLCD Term to enable.  Some
additional commands have been implemented to interact with the TEC-1G
hardware.  Tiny Basic will use RAM address <span class="mon3-address-emphasis">0900H-3FFFH</span>

Functionality has been added to the Mon3 version to make it more useful
for the TEC-1G.  Here is a list of language additions.

## Language Additions

| Syntax | Description |
| --- | --- |
| `PEEK(n)` | Return the contents of memory at location `n`. Value is in decimal. |
| `OUT p,n` | Output `n` to port `p` on the TEC. |
| `XOFF`, `XON` | Turn the serial terminal output off and on. Used if outputting to the seven segments. |
| `PRINT` extensions | Placed in `PRINT` statements and preceding a number. For example, `PRINT &255,%12,$65` outputs `FF   .   A`.<br>`&` outputs a number as hexadecimal.<br>`%` outputs a number as an ASCII character, printing `.` for non-printable characters.<br>`$` outputs a number as an ASCII character, printing all characters. |
| `Ctrl-D`, `Ctrl-Z` | `Ctrl-D` exits back to the monitor. `Ctrl-Z` clears the whole line. |

## Example Programs

Here are some Tiny Basic Example programs

```text
Display the first 22 Fibonacci Numbers
 5 REM ** FIBONACCI SEQUENCE **
10 PRINT "FIBONACCI SEQUENCE"
20 FOR I=1 TO 22
30 GOSUB 70
40 PRINT "F",I,F
50 NEXT I
60 STOP
70 LET A=0; LET B=1
80 FOR J=1 TO I
90 LET T=A+B; LET A=B; LET B=T
100 NEXT J
110 LET F=A
120 RETURN

Display the Factors of a given number
 5 REM ** FACTORS OF N **
10 INPUT "GIVE ME A NUMBER" I
20 LET C=1
30 PRINT "FACTORS OF ",#3,I,":"
40 IF I/C*C=I PRINT C
50 C=C+1
60 IF C<=I GOTO 40
70 GOTO 10

Output the numbers 0 to 9 on the TEC-1G Seven Segment Display
 5 REM ** SEGMENT OUTPUT DEMO **
10 @(0)=235;@(1)=40;@(2)=205;@(3)=173;@(4)=46
20 @(5)=167;@(6)=231;@(7)=41;@(8)=239;@(9)=175
30 XOFF
40 OUT 1,1
50 FOR I=0 TO 9
60 OUT 2,@(I)
70 FOR J=1 TO 1000;NEXT J
80 NEXT I
90 XON

Print All ASCII Characters
10 REM ** PRINT ASCII CHARACTERS **
20 FOR I=32 TO 255
30 PRINT #1,&I+32,$32,$I+32,$32,
40 IF (I+1)/10*10=(I+1) PRINT
50 NEXT I
```

[← Memory Map and Data Entry Mode](02-memory-map-and-data-entry-mode.md) | [Guide](index.md) | [Terminal Monitor and TEC Magazine Code →](04-terminal-monitor-and-tec-magazine-code.md)
