---
layout: default
title: "Quick Start Programs"
parent: "MON-3 User Guide"
grand_parent: "TEC-1G Hardware"
nav_order: 12
has_toc: false
nav_exclude: true
---

[← Hard Drive Access](11-hard-drive-access.md) | [Guide](index.md) | [Appendix →](13-appendix.md)

# Quick Start Programs

Who wants the TEC-1G to say Hello?  Here are three ways TEC can do this.
Only a summary of the programs has been provided, making the examples
a good exercise for learning how they work.  The programs utilise Mon3 API
routines as discussed in the Advanced Programming chapter.

```asm
 This routine is the shortest.  It will    This routine will convert the ASCII
 display the data at 4009 using RST        "HELLO!" to seven segment code
 20 to multiplex and key scan.  If the     using the ASCIItoSegment routine.
 AD key is pressed the routine will        Then it will use RST 20 to multiplex
 exit.  Data at 4009 is hardcoded to       and key scan.  Change the ASCII at
 display HELLO on the seven                401A to display something
 segments                                  different.
 4000 11 09 40    LD DE,4009               4000 21 1A 40    LD HL,401A
 4003 E7          RST 20                   4003 11 20 20    LD DE,2020
 4004 FE 13       CP 13                    4006 06 06       LD B,06
 4006 20 F8       JR NZ,4000               4008 0E 06       LD C,06
 4008 C9          RET                      400A 7E          LD A,(HL)
 4009 6E C7 C2    .db 6E C7 C2             400B D7          RST 10
 400B C2 EB 18    .db C2 EB 18             400C 12          LD (DE),A
                                           400D 23          INC HL

 This routine will display HELLO on        400E 13          INC DE
 the LCD Screen.  It first clears the       400F 10 F9       DJNZ 400A
 LCD by calling commandToLCD and           4011 11 20 20    LD DE,2020
 then calling stringToLCD to display       4014 E7          RST 20
 a zero-terminated ASCII string.           4015 FE 13       CP 13
 Press the AD key to exit.                 4017 20 F8       JR NZ,4011

 4000 06 01       LD B,01                  4019 C9          RET
 4002 0E 0F       LD C,0F                  401A 48 45 4C    .db "HEL"
 4004 D7          RST 10                   401D 4C 4F 21    .db "LO!"
 4005 21 11 40    LD HL,4011
 4008 0E 0D       LD C,0D
 400A D7          RST 10
 400B CF          RST 08
 400C FE 13       CP 13
 400E 20 FB       JR NZ,400B
 4010 C9          RET
 4011 48 45 4C    .db "HEL"
 4014 4C 4F 21 00 .db "LO!",0
```

Matrix Keyboard echo to the Serial Terminal
This program demonstrates how to read in key presses from the Matrix
Keyboard, convert the keys to ASCII, handle key bounce and send the ASCII
to a serial terminal.  Interestingly, lines 4006 to 4028 can be replaced with
the PARSEMATRIXSCAN API call.   Fun Task: Modify the program to display
on the LCD.

```asm
MATRIXSCAN       .EQU 12H
SERIALENABLE     .EQU 14H
TXBYTE           .EQU 16H
TOGGLECAPS       .EQU 30H
```
MATRIXSCANASCII  .EQU 35H
```asm
KEY_VALUE        .EQU 2000H        ;RAM location of key value

4000 0E 14       LD C,SERIALENABLE ;set serial to send bytes
4002 D7          RST 10H           ;API call
4003 0E 12       LD C,MATRIXSCAN   ;Scan the keyboard
4005 D7          RST 10H           ;API call
4006 28 06       JR Z,400E         ;valid key has been pressed
4008 AF          XOR A             ;reset last key pressed
4009 32 00 20    LD (KEY_VALUE),A
400C 18 F5       JR 4003           ;get next key
400E 3A 00 20    LD A,(KEY_VALUE)  ;ignore key if its the same
4011 BB          CP E
4012 28 EF       JR Z,4003
4014 7B          LD A,E
4015 32 00 20    LD (KEY_VALUE),A  ;store new key pressed
4018 FE 03       CP 03H            ;check if first key is
401A 38 E7       JR C,4003         ;Shift,Ctl or Fn and ignore
401C 3E 07       LD A,07H          ;is the key CAPS LOCK?
401E BB          CP E
401F 20 05       JR NZ,4026        ;no, then skip caps toggle
4021 0E 30       LD C,TOGGLECAPS   ;toggle caps lock flag
4023 D7          RST 10H           ;API call
4024 18 DD       JR 4003
4026 0E 35       LD C,MATRIXSCANASCII ;convert to ASCII
4028 D7          RST 10H           ;API call
4029 0E 16       LD C,TXBYTE       ;send key pressed to serial
402B D7          RST 10H           ;API call
402C 18 D5       JR 4003           ;loop back to matrixScan
```

Seven Segment Scroller via the Serial Terminal
This program reads in text from the serial terminal and scrolls the text on
the Seven Segment Displays.  Pressing Enter (Carriage Return) will start
the scroll.  It uses ASCIITOSEGMENT to convert ASCII to Seven Segment
Display format.  This routine only works using the TEC-1G Hex Keypad. Fun
Task: Modify the program to display text on the LCD.

```asm
ASCIITOSEGMENT   .EQU 06H
SERIALENABLE     .EQU 14H
TXBYTE           .EQU 16H
RXBYTE           .EQU 17H
START_STR        .EQU 2000H        ;Start of string address
ASCII_STR        .EQU 2002H        ;RAM location of ASCII text

4000 0E 14       LD C,SERIALENABLE ;set serial to send bytes
4002 D7          RST 10H           ;API call
4003 11 02 20    LD DE,ASCII_STR   ;set DE to store ASCII
4006 0E 17       LD C,RXBYTE       ;get a byte from terminal
4008 D7          RST 10H           ;API call
4009 FE 0D       CP 0DH            ;is the byte a CR?
400B 28 0A       JR Z,4017         ;yes jump to scroll routine
400D 0E 16       LD C,TXBYTE       ;echo byte back to terminal
400F D7          RST 10H           ;API call
4010 0E 06       LD C,ASCIITOSEGMENT ;convert ASCII to 7-Seg
4012 D7          RST 10H           ;API call
4013 12          LD (DE),A         ;save modified ASCII
4014 13          INC DE            ;move to next RAM location
4015 18 EF       JR 4006           ;loop for more input
4017 3E FF       LD A,0FFH         ;place FF at end of string
4019 12          LD (DE),A
401A 21 02 20    LD HL,ASCII_STR   ;scroll loop starts here
401D 22 00 20    LD (START_STR),HL ;reset to start of string
4020 26 00       LD H,00H          ;set timer to zero
```
4022 ED 5B 00 20 LD DE,(START_STR) ;point to start of string
```asm
4026 E7          RST 20H           ;scan segments & scan keys
4027 C8          RET Z             ;if key is pressed, exit
4028 25          DEC H             ;delay for full 256 bytes
4029 20 F7       JR NZ,4022        ;repeat multiplex
402B 1A          LD A,(DE)         ;check to see if FF is
402C 3C          INC A             ;the next char to display
402D 28 EB       JR Z,401A         ;it is, go back to begining
402F 21 00 20    LD HL,START_STR   ;shift start by one address
4032 34          INC (HL)          ;(max 254 characters!)
4033 18 EB       JR 4020           ;display scroll again
```

Three GLCD demos are provided to demonstrate how to use the GLCD API
calls.  They are a circle animation that uses graphics mode, a font
demonstration in text mode and a terminal display example.

Making Bubbles
This program first sets up the LCD to use Graphics and ensures that on
every plotToLCD the internal graphics buffer is cleared.  This makes the
circle animate.  Then a circle is expanded until it reaches the end of the
screen.  A beep is played and the code is repeated.  Fun Task: Modify the
time delay to change the speed of the growing bubble.

```asm
INITLCD         .EQU 0
SETGRMODE       .EQU 4
DRAWCIRCLE      .EQU 8
PLOTTOLCD       .EQU 12
SETBUFCLEAR     .EQU 17
BEEP            .EQU 3
TIMEDELAY       .EQU 33

4000 3E 00       LD A,INITLCD                 ;Initialise the GLCD
4002 DF          RST 18H
4003 3E 04       LD A,SETGRMODE               ;Set Graphics Mode
4005 DF          RST 18H
4006 3E 11       LD A,SETBUFCLEAR             ;Set Gr Buffer to Clear
4008 DF          RST 18H
4009 0E 03       LD C,BEEP                    ;Play a Beep
400B D7          RST 10H
400C 1E 01       LD E,1                       ;Set initial radius to 1
400E 01 20 40    LD BC,4020H                  ;Set X,Y to mid screen
4011 C5          PUSH BC                      ;Save BC/DE
4012 D5          PUSH DE
4013 3E 08       LD A,DRAWCIRCLE              ;Draw Circle
4015 DF          RST 18H
4016 3E 0C       LD A,PLOTTOLCD               ;Output to LCD
4018 DF          RST 18H
4019 0E 21       LD C,TIMEDELAY               ;Wait a bit
401B 21 00 40    LD HL,4000H
401E D7          RST 10H
401F D1          POP DE                       ;Restore BC/DE
4020 C1          POP BC
4021 1C          INC E                        ;Increase radius by 1
4022 CB 6B       BIT 5,E                      ;Check if bubble hits edge
4024 20 E3       JR NZ,4009        ;Yes, reset radius
4026 18 E9       JR 4011           ;No, redraw circle
```

GLCD Font Display
This program cycles through all stored fonts on the GLCD.  Characters on the GLCD are
stored in the Character Generator ROM (CGROM).   The program sets up the LCD for text
mode and displays characters on the screen.  Press any key to continue.  The code also
uses the GLCD ports directly, skipping the API.  This is perfectly fine to do.  See the ST7920
manual on how to send instructions directly to the GLCD. This routine only works using
the TEC-1G Hex Keypad.

```asm
INITLCD         .EQU 0
SETTXTMODE      .EQU 5
PRINTSTRING     .EQU 13
DELAYUS         .EQU 15
4000 3E 00       LD A,INITLCD              ;Initialise the GLCD
4002 DF          RST 18H
4003 3E 05       LD A,SETTXTMODE  ;Set Text Mode
4005 DF          RST 18H
4006 3E 0D       LD A,PRINTSTRING ;Display Text
4008 DF          RST 18H
```
4009 20 50 72 65 .DB " Press Any Key",0
400D 73 73 20 41
4011 6E 79 20 4B
4015 65 79 00
```asm
4018 0E 00       LD C,0           ;Character Counter
401A CF          RST 08H          ;Wait for key press
401B 06 40       LD B,40H         ;64 Characters per screen
401D 3E 80       LD A,80H         ;row 1 on LCD
401F CD 47 40    CALL 4047        ;Set Row on LCD
4022 79          LD A,C           ;Get Character
4023 CD 4B 40    CALL 404B        ;Display Character on LCD
4026 0C          INC C            ;Next Character
4027 CB 79       BIT 7,C          ;Is C=80H
4029 20 04       JR NZ,402F       ;Yes, display chinese chars
402B 10 F5       DJNZ 4022        ;No, display next character
402D 18 EB       JR 401A          ;Page done, next page
402F 21 40 A1    LD HL,A140H      ;Point to Chinese ROM
4032 CF          RST 08H          ;Wait for key press
4033 06 20       LD B,20H         ;32 Characters per screen
4035 3E 80       LD A,80H         ;row 1 on LCD
4037 CD 47 40    CALL 4047        ;Set Row on LCD
403A 7C          LD A,H           ;Get Character High Byte
403B CD 4B 40    CALL 404B        ;Display Character on LCD
403E 7D          LD A,L           ;Get Character Low Byte
403F CD 4B 40    CALL 404B        ;Display Character on LCD
4042 23          INC HL           ;Next Character
4043 10 F5       DJNZ 403A        ;Display next character
4045 18 EB       JR 4032          ;New Page
4047 D3 07       OUT (07H),A      ;Send instruction to LCD
4049 18 02       JR 404D          ;Do Delay
404B D3 87       OUT (87H),A      ;Send data to LCD
404D 3E 0F       LD A,DELAYUS     ;Set Delay
404F DF          RST 18H
4050 C9          RET
```

Use the GLCD as a serial terminal
This program turns the GLCD into a text terminal.  Characters entered are
displayed on the GLCD and standard keyboard commands like carriage
return and backspace also work.  To scroll press left and right arrows on the
keyboard.  Ctrl-A will turn the cursor on, Ctrl-B turn the cursor off,  Ctrl-C
will inverse the characters typed and Ctrl-D will exit.

MATRIXSCAN       .EQU 12H
PARSEMATRIXSCAN  .EQU 36H
```asm
INVGRAPHIC       .EQU 16H
INITTERMINAL     .EQU 17H
SENDCHARTOLCD    .EQU 18H
DISPLAYCURSOR    .EQU 1EH

4000 3E 17       LD A,INITTERMINAL ;Initialise the GLCD
4002 DF          RST 18H           ;GLCD API call
4003 0E 12       LD C,MATRIXSCAN   ;Matrix Scan API Entry
4005 D7          RST 10H           ;API call
4006 0E 36       LD C,PARSEMATRIXSCAN ;Parse Matrix Scan API
4008 D7          RST 10H           ;API call
4009 30 F8       JR NC,4003        ;Loop if no key pressed
400B FE 04       CP 04H            ;Is key Ctrl-D?
400D C8          RET Z             ;Yes, then Exit
400E FE 03       CP 03H            ;Is key Ctrl-A or B?
4010 30 07       JR NC,4019        ;No, then jump ahead
4012 3D          DEC A             ;Adjust A to be 0 or 1
4013 4F          LD C,A            ;Set A as parameter
4014 3E 1E       LD A,DISPLAYCURSOR ;Toggle Cursor GLCD API
4016 DF          RST 18H           ;GLCD API call
4017 18 EA       JR 4003           ;Done, check for new key
4019 FE 03       CP 03H            ;Is key Ctrl-C?
401B 20 05       JR NZ,4022        ;No, then jump ahead
401D 3E 16       LD A,INVGRAPHIC   ;Toggle Inverse Mode
401F DF          RST 18H           ;GLCD API call
4020 18 E1       JR 4003           ;Done, check for new key
4022 4F          LD C,A            ;Set Keypress as parameter
4023 3E 18       LD A,SENDCHARTOLCD ;Send Character GLCD API
4025 DF          RST 18H           ;GLCD API call
4026 18 DB       JR 4003           ;Done, check for new key
```

Display a Clock on the Seven Segments
This program requires the RTC Add-on board and will display the current
time set on the RTC Board on the Seven Segments..  A check for 12/24 hour
mode is done to determine how the Hours are displayed.  If in 12 hour
mode, Bit 5 is cleared and a decimal point is inserted.  Pressing AD will quit
the program.
```asm
RTCPRESENT       .EQU 00H
GETTIME          .EQU 02H
GET1224MODE      .EQU 08H
CONVATOSEG       .EQU 04H
RTCAPI           .EQU 46H
DISP_BUFF        .EQU 2000H        ;7 Segment Display Buffer
4000 0E 2E       LD C,RTCAPI       ;RTC API Entry
4002 06 00       LD B,RTCPRESENT   ;Is RTC Board Installed?
4004 D7          RST 10H           ;API call
4005 D8          RET C             ;Carry Set = No, Just Exit
4006 0E 2E       LD C,RTCAPI       ;RTC API Entry
4008 06 02       LD B,GETTIME      ;Get Current RTC Time
400A D7          RST 10H           ;API call
400B 7A          LD A,D            ;Get Seconds
400C 11 04 20    LD DE,DISP_BUFF+4 ;point DE to seconds buffer
400F 0E 04       LD C,CONVATOSEG   ;Convert A to 7 Segment
4011 D7          RST 10H           ;API call saves in DE
4012 7D          LD A,L            ;Get Minutes
4013 11 02 20    LD DE,DISP_BUFF+2 ;point DE to minutes buffer
4016 0E 04       LD C,CONVATOSEG   ;Convert A to 7 Segment
4018 D7          RST 10H           ;API call saves in DE
4019 0E 2E       LD C,RTCAPI       ;RTC API Entry
401B 06 08       LD B,GET1224MODE  ;Check if 12 or 24 Hour
401D D7          RST 10H           ;API call
401E 28 0A       JR Z,402A         ;24 Mode, skip AM/PM setup
4020 CB AC       RES 5,H           ;Remove AM/PM Flag (Bit 5
4022 3A 03 20    LD A,(DISP_BUFF+3) ;Get 4th segment value
4025 F6 10       OR 10H            ;Set Decimal Point Segment
4027 32 03 20    LD (DISP_BUFF+3),A ;Save back to segment
402A 7C          LD A,H            ;Get Hour
402B 11 00 20    LD DE,DISP_BUFF   ;point DE to hour buffer
402E 0E 04       LD C,CONVATOSEG   ;Convert A to 7 Segment
4030 D7          RST 10H           ;API call saves in DE
4031 11 00 20    LD DE,DISP_BUFF   ;point to start of buffer
4034 E7          RST 20H           ;Scan Segments & Key Press
4035 FE 13       CP 13H            ;Is key press "AD" key?
4037 20 CD       JR NZ,4006        ;No, Loop Main Display
4039 C9          RET               ;Exit back to Monitor
```

[← Hard Drive Access](11-hard-drive-access.md) | [Guide](index.md) | [Appendix →](13-appendix.md)
