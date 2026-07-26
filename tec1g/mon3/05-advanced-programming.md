---
layout: default
title: "Advanced Programming"
parent: "MON-3 User Guide"
grand_parent: "TEC-1G"
nav_order: 5
nav_exclude: true
has_toc: true
search: false
---

[← Terminal Monitor and TEC Magazine Code](04-terminal-monitor-and-tec-magazine-code.md) | [Guide](index.md) | [Real Time Clock Add-On →](06-real-time-clock.md)

# Advanced Programming

To assist when developing Z80 programs, Mon3 contains built-in
functionality that makes it easy to interface with the TEC-1G hardware.

## RST (Restart) commands

RST commands on the Z80 are one-byte call commands that execute code
at certain address locations defined by the Z80.  The following table
outlines the routines.

| Command | Op Code | Description |
| --- | --- | --- |
| `RST 00H` | `C7` | Software monitor reset. |
| `RST 08H` | `CF` | Key wait and press routine. This simulates a `HALT` command where the TEC waits for a key to be pressed and then continues execution. If a key is currently being held down, the routine waits until the key is released and then detects the next key. The key that has been pressed is stored in register `A`.<br><br>`RST 08H` waits for a keypress.<br>`LD B,A` loads the key to register `B`. |
| `RST 10H` | `D7` | API entry call. Executes a monitor routine. See the API calls section below for details. |
| `RST 18H` | `DF` | API 2 entry call. Graphical LCD routine entry. See the [Graphical LCD Add-On](07-graphical-lcd.md) chapter for details. |
| `RST 20H` | `E7` | Scan Seven Segments and Keys. Multiplexes the seven-segment displays and checks for a key press. It can be used to display information on the seven segments and check for a key to be pressed. It must be called in a loop until a key is pressed to maintain seven-segment persistence. Returns Zero flag set when a key is pressed and register `A` with the key value. Register `DE` points to the seven-segment data. See the first program in the Quick Start Programs chapter for an example. Registers `DE`, `A`, and `B` are modified. |
| `RST 28H` | `EF` | LCD Busy Check. Call before sending a command to the LCD when directly communicating with the LCD. The routine only exits when the LCD Busy flag is not set.<br><br>`RST 28H` checks the LCD busy flag.<br>`LD A,01H` loads `A` with a clear-screen instruction.<br>`OUT (04),A` sends the instruction to the LCD. |
| `RST 30H` | `F7` | Breakpoint entry. Breaks code execution at the current address location. See the Debugging Programs section for details. |
| `RST 38H` | `FF` | Maskable interrupt handler. Jumps here with Interrupts Enabled (`EI`), Interrupt Mode 1 (`IM 1`), and when the `INT` pin on the CPU goes low. Mon3 does nothing when this happens, but a user-defined routine can be used. See the Interrupt section below. |

## Interrupts

The Z80 CPU has the ability to interrupt the execution of code, handle the
interrupt and then resume code execution.  This is done in software with
Interrupts Enabled (EI) and Interrupt Mode 1 (IM 1) and by hardware when
the INT line on the CPU goes low.  Mon3 ignores interrupts, but a
user-defined routine can be provided to handle the interrupt.  To do this,
the address of the interrupt routine is to be placed at RAM address <span class="mon3-address-emphasis">0892H</span>.

```asm
       ei                 ; Enable interrupts
       im 1               ; Interrupt mode 1
       ld hl,myINT          ; Interrupt routine
     ld (0892H),hl          ; Save address in 0892H
       ... continue

myINT:
       ld c,03H   ; Bell routine
       rst 10H    ; Call API
       reti       ; Exit Int routine
```


This code will sound a bell tone in the speaker when an interrupt occurs.

## NMI (Non-Maskable Interrupts)

Non-Maskable Interrupts occur when the NMI line on the CPU goes low.
These interrupts will always trigger.  Mon3 ignores the NMI line, but a
user-defined routine can be provided to handle the interrupt.  To do this,
the address of the interrupt routine is to be placed at RAM address <span class="mon3-address-emphasis">0894H</span>.

```asm
     ld hl,myNMI            ; NMI routine
     ld (0894H),hl          ; Save address in 0894H
       ... continue

myNMI:
       ld c,03H   ; Bell routine
       rst 10H    ; Call API
       retn       ; Exit NMI routine
```


This code will sound a bell tone in the speaker when an NMI occurs.  The
TEC-1G has an NMI jumper that can set NMI to trigger on a Keypad press, a
HALT instruction or externally (no jumper).

![MON-3 illustration](../../assets/images/tec1g/mon3/page-30-figure-1.png)

*Cartoon credit: Ken Stone, TE Issue 10, 1983.*

## API (Application Programming Interface) commands

The API on Mon3 exposes routines used by Mon3 which can be used in
your own programs. It makes writing code quicker and easier by exposing
monitor services through a small call interface.

### General conventions

The register C holds the API Call number.  All other registers except the IX
register can be used as parameters if needed.  Executing a RST 10H or D7
calls the API.


### General Interface

```asm
ld c,[API Call Number]
rst 10H
```

### Some Examples

```asm
          ;Produce a short Beep from the speaker
0E 03     ld c,3      ;beep call number
D7        rst 10H

          ;Display the letter 'G' on the LCD Screen
0E 0E     ld c,14     ;charToLCD call number
3E 47     ld a,"G"    ;parameter
D7        rst 10H

          ;Wait for a period of time
0E 21     ld c,33     ;timeDelay call number
21 00 30  ld hl,3000H ;parameter
D7        rst 10H
```


To assist with API call number references, the file api_includes.z80, in the
GitHub repository, contains the API Call Number with its Text equivalent for
use with your own code.

See the [MON-3 source in the TEC-1G repository](https://github.com/MarkJelic/TEC-1G/tree/main/ROMs/MON3/source).

### API Call List

**Utility Calls**

| Call | # | 0x |
| --- | ---: | --- |
| `softwareID` | 0 | 0 |
| `versionID` | 1 | 01 |
| `preInit` | 2 | 02 |
| `beep` | 3 | 03 |
| `convAToSeg` | 4 | 04 |
| `regAToASCII` | 5 | 05 |
| `ASCIIToSegment` | 6 | 06 |
| `stringCompare` | 7 | 07 |
| `HLToString_` | 8 | 08 |
| `AToString` | 9 | 09 |
| `scanSegments` | 10 | 0A |
| `displayError` | 11 | 0B |
| `checkStartEnd` | 30 | 1E |

**Serial Calls**

| Call | # | 0x |
| --- | ---: | --- |
| `serialEnable` | 20 | 14 |
| `serialDisable` | 21 | 15 |
| `txByte` | 22 | 16 |
| `rxByte` | 23 | 17 |
| `intexHexLoad` | 24 | 18 |
| `sendToSerial` | 25 | 19 |
| `receiveFromSerial` | 26 | 1A |
| `sendAssembly` | 27 | 1B |
| `sendHex` | 28 | 1C |
| `genDataDump` | 29 | 1D |
| `stringToSerial` | 45 | 2D |

**System Latch Calls**

| Call | # | 0x |
| --- | ---: | --- |
| `getCaps` | 37 | 25 |
| `getShadow` | 38 | 26 |
| `getProtect` | 39 | 27 |
| `getExpand` | 40 | 28 |
| `setCaps` | 41 | 29 |
| `setShadow` | 42 | 2A |
| `setProtect` | 43 | 2B |
| `setExpand` | 44 | 2C |
| `toggleCaps` | 48 | 30 |

**LCD Calls**

| Call | # | 0x |
| --- | ---: | --- |
| `LCDBusy` | 12 | 0C |
| `stringToLCD` | 13 | 0D |
| `charToLCD` | 14 | 0E |
| `commandToLCD` | 15 | 0F |

**Input Calls**

| Call | # | 0x |
| --- | ---: | --- |
| `scanKeys` | 16 | 10 |
| `scanKeysWait` | 17 | 11 |
| `matrixScan` | 18 | 12 |
| `joystickScan` | 19 | 13 |
| `matrixScanASCII` | 53 | 35 |
| `parseMatrixScan` | 54 | 36 |

**Misc. Calls**

| Call | # | 0x |
| --- | ---: | --- |
| `timeDelay` | 33 | 21 |
| `RTCAPI` | 46 | 2E |
| `random` | 49 | 31 |
| `setDisStart` | 50 | 32 |
| `getDisNext` | 51 | 33 |
| `getDisassembly` | 52 | 34 |
| `LCDConfirm` | 55 | 37 |
| `getGLCDTerm` | 56 | 38 |
| `setGLCDTerm` | 57 | 39 |
| `loadFromDisk` | 58 | 3A |
| `openFile` | 59 | 3B |
| `readSector` | 60 | 3C |
| `writeSector` | 61 | 3D |
| `RGBScan` | 62 | 3E |

**Menu Calls**

| Call | # | 0x |
| --- | ---: | --- |
| `menuDriver` | 31 | 1F |
| `paramDriver` | 32 | 20 |
| `menuPop` | 47 | 2F |

**Sound Calls**

| Call | # | 0x |
| --- | ---: | --- |
| `playNote` | 34 | 22 |
| `playTune` | 35 | 23 |
| `playTuneMenu` | 36 | 24 |

## API Utility Calls

### softwareID #0 (00H)
Get Software ID String
- Input: nothing
- Return: HL = Pointer to SOFTWARE ASCII String
- Destroy: none

### versionID #1 (01H)
Get Version Number and Version String
- Input: nothing
- Return: `HL` = pointer to release ASCII string
- Return: `BC` = release major version number
- Return: `DE` = release minor version number
- Destroys: none

### preInit #2 (02H)
Performs a cold reset as if the TEC-1G had just been powered on. Returns to
MON3 to its default state.

### beep #3 (03H)
Makes a short beep tone to the TEC Speaker
- Input: nothing
- Destroys: A

### convAToSeg #4 (04H)
Convert register A to Seven Segment display format
- Inputs: `A` = byte to convert
- Inputs: `DE` = address to store segment values (2 bytes)
- Destroys: `BC`

### regAToASCII #5 (05H)
Convert register A to ASCII. IE: 2CH -> "2C"
- Input: A = byte to convert
- Output: HL = two-byte ASCII string
- Destroys: A

### ASCIItoSegment #6 (06H)
ASCII to Segment.  Converts an ASCII character to Seven Segment display
format
- Input: A = ASCII character
- Return: A = Segment character or 0 if out of range
- Destroys: none

### stringCompare #7 (07H)
Compare two string
- Input: `HL` = source pointer
- Input: `DE` = target pointer
- Input: `B` = bytes to compare (up to 256)
- Output: Zero Flag Set = compare match
- Destroys: `HL`, `DE`, `A`, `BC`

### HLToString #8 (08H)
Convert HL to ASCII string. IE: <span class="mon3-address-emphasis">2C0FH</span> -> "2C0F"
- Input: `HL` = value to convert
- Input: `DE` = address of string destination (4 bytes)
- Output: `DE` = address one after last ASCII entry
- Destroys: `A`

### AToString #9 (09H)
Convert register A to ASCII string. IE: 2CH -> "2C"
- Input: `A` = byte to convert
- Input: `DE` = address of string destination (2 bytes)
- Output: `DE` = address one after last ASCII entry
- Destroys: `A`

### scanSegments #10 (0AH)
Multiplex the Seven Segment displays with the contents of DE.  Must be
called repetitively for segments to stay persistent.
- Inputs: DE = pointer to 6-byte location of segment data
- Destroys: A, B, DE = DE + 6

### displayError #11 (0BH)
Display ERROR on the Seven Segments and wait for keypress
- Input: none
- Destroys: all

### checkStartEnd #30 (1EH)
Check start and end address differences.
- Input: `HL` = address location of START value
- Input: `HL+2` = address location of END value
- Output: `HL` = start address
- Output: `BC` = length of end-start
- Output: Carry = set if end is less than start
- Destroys: `DE`

## API LCD Calls

### LCDBusy #12 (0CH)
LCD busy check.  Checks the LCD busy flag and loops until LCD isn't busy
- Input: nothing
- Destroys: none

### stringToLCD #13 (0DH)
ASCII string to LCD.  Writes a string (text) to the current cursor location on
the LCD
- Input: HL = ASCII string terminated with a zero byte
- Destroy: A, HL (moves to end of the list)

```asm
TEXT: .db "HELLO TEC!",0

       ld hl,TEXT
       ld c,13
       rst 10h
```

### charToLCD #14 (0EH)
ASCII character to LCD.  Writes one character to the LCD at the current
cursor location
- Input: A = ASCII character
- Destroy: none

```asm
ld a,"G"
ld c,14
rst 10h
```

### commandToLCD #15 (0FH)
Command to LCD.  Sends an LCD instruction to the LCD
- Input: B = Instruction byte
- Destroy: none

```asm
ld b,01  ;clear LCD
  ld c,15
  rst 10h
```

## API Input Calls

### scanKeys #16 (10H)
Universal Key input detection routine. Supports HexPad and Matrix.  The
routine does not wait for a key press the returns immediately.  Only Hexpad
keys are detected if using the Matrix Keyboard.
- Return: `A` = key value when the status flags indicate a key press
- Return: Zero flag set if a key is pressed
- Return: Carry flag set if a new key press is detected
- Return: Carry flag not set for a key pressed and held, or if no key has been pressed
- Destroys: `DE` if using Matrix Keyboard

Key mapping returned in register `A`:

| Key | Value | Key | Value |
| --- | --- | --- | --- |
| `0-F` | `00-0F` | `Fn-0-F` | `20-2F` (bit 5 set) |
| Plus | `10` | Fn-Plus | `30` |
| Minus | `11` | Fn-Minus | `31` |
| GO | `12` | Fn-GO | `32` |
| AD | `13` | Fn-AD | `33` |

### scanKeysWait #17 (11H)
Generic Key input detection routine. Supports HexPad and Matrix. Waits
until a key is pressed.  The routine will only detect a key if all keys are
released first.  Only Hexpad keys are detected if using the Matrix Keyboard.
- Return: A = key value (if following are met)
- zero flag set if a key is pressed
- Destroys: DE if using Matrix Keyboard
See table above for return values in register A

### joystickScan #19 (13H)
Joystick port scan routines.  This routine will return a value based on the
movement/button of the joystick or any combination: IE: UP+DOWN = 03H,
Routine must be called repetitively.
- Input: none
- Output: `A` = joystick return value between `00H-5FH` (0-95)
- Output: Zero flag set if no joystick value returned
- Destroy: none

| Value | Meaning | Value | Meaning |
| --- | --- | --- | --- |
| `01H` | Up | `10H` | Fire 2 |
| `02H` | Down | `20H` | Comm2 (Pin 9) |
| `04H` | Left | `40H` | Fire 1 |
| `08H` | Right | `80H` | Fire 3 |

### matrixScan #18 (12H)
Key scan routine for the Matrix Keyboard.  This routine detects up to two
key presses at the same time.  Key values stored in DE.  The routine must
be called repetitively.
- Input: none
- Output: `E` = key pressed between `00H-3FH` (0-63)
- Output: `D` = second key, `FF` = no key, `00` = Shift, `01` = Ctrl, `02` = Fn
- Output: Zero flag set if a key is pressed or the combination is valid

Key mapping returned in register `E`; some gaps are present.

| Key | Value | Key | Value | Key | Value | Key | Value | Key | Value | Key | Value |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shift | `00` | Esc | `0C` | 4 | `17` | D | `27` | O | `32` | Z | `3D` |
| Ctrl | `01` | Space | `0D` | 5 | `18` | E | `28` | P | `33` | `\\` | `3F` |
| Fn | `02` | Single Qt | `0E` | 6 | `19` | F | `29` | Q | `34` | | |
| Up | `03` | Comma | `0F` | 7 | `1A` | G | `2A` | R | `35` | | |
| Down | `04` | Minus | `10` | 8 | `1B` | H | `2B` | S | `36` | | |
| Left | `05` | F.Stop | `11` | 9 | `1C` | I | `2C` | T | `37` | | |
| Right | `06` | `/` | `12` | `;` | `1E` | J | `2D` | U | `38` | | |
| Caps | `07` | 0 | `13` | `=` | `20` | K | `2E` | V | `39` | | |
| Del | `08` | 1 | `14` | A | `24` | L | `2F` | W | `3A` | | |
| Tab | `09` | 2 | `15` | B | `25` | M | `30` | X | `3B` | | |
| Enter | `0A` | 3 | `16` | C | `26` | N | `31` | Y | `3C` | | |

### matrixScanASCII #53 (35H)
Convert the output of the matrixScan routine to ASCII.  matrixScan returns
values between 0 and 63 (3Fh). These represent key presses on the
keyboard.  This routine will convert the output of matrixScan DE, to the
actual key pressed in ASCII.  If the key doesn't map to an ASCII character
then the matrix key value is returned.
Shift+Key will return the capital or secondary characters, Ctrl+Key will
return the control code.  IE: Ctrl-C will return 03.
- Input: `DE` = value returned from `matrixScan`
- Input: `E` = key, `D` = secondary key
- Output: `A` = key pressed in ASCII
- Destroy: `BC`, `HL`

Example code on using matrixScanASCII can be found in the Quick Start
Programs chapter below.

### parseMatrixScan #54 (36H)
Parse matrix keyboard input.  This routine checks the key(s) pressed on the
Matrix Keyboard and either returns the key pressed in ASCII or handles
special cases.  The special cases are Key Bounce/Repeat and Caps lock.
This routine includes a call to matrixScanASCII and is designed to come
directly after matrixScan.  As this routine also scans the keyboard, it needs
to be included in a Scan loop.
- Input: `DE` = value returned from `matrixScan`
- Input: `E` = key, `D` = secondary key
- Input: Zero Flag = set if key pressed, from `matrixScan`
- Output: `A` = key pressed in ASCII
- Output: Carry Flag = set if ASCII returned
- Output: Carry Flag = not set if a special case occurred and no ASCII was returned
- Destroy: `BC`, `HL`

```asm
scan_loop:
    ld c,18       ;matrixScan
    rst 10h       ;API call
    ld c,54       ;parseMatrixScan
    rst 10h       ;API call
    jr nc,scan_loop
    ld c,22       ;txByte Send to FTDI
    rst 10h       ;API call
```

## API Serial Data Transfer Calls

### serialEnable #20 (14H)
Enable BitBang serial port for serial transmit.  Disco LED's glow blue to
indicate ready status.
- Input: none
- Destroy: A

### serialDisable #21 (15H)
Disable BitBang serial port for serial transmit.  Disco LEDs turn off.
- Input: none
- Destroy: A

### txByte #22 (16H)
Bit Bang FTDI USB transmit routine.  Send one byte over FTDI USB serial
connection.  It assumes a UART connection of 4800-8-N-2.
- Input: A = byte to transmit
- Output: nothing
- Destroy: none

### rxByte #23 (17H)
Bit Bang FTDI USB receive routine.  Receive one byte via the FTDI USB
serial connection.  It assumes a UART connection of 4800-8-N-2.  Note
routine will wait until a bit is detected.
- Input: nothing
- Return: A = byte received
- Destroy: none

### intelHexLoad #24 (18H)
Load an Intel Hex file via the FTDI USB serial connection.  Displays file
progress on the segments and PASS or FAIL at the end of the load.  Intel
Hex file format is a string of ASCII with the following parts:

<div class="intel-hex-diagram" role="group" aria-label="Intel HEX record structure">
  <div class="intel-hex-diagram__labels" aria-hidden="true">
    <span class="intel-hex-diagram__cell intel-hex-diagram__cell--mark">MARK</span>
    <span class="intel-hex-diagram__cell intel-hex-diagram__cell--length">LENGTH</span>
    <span class="intel-hex-diagram__cell intel-hex-diagram__cell--address">ADDRESS</span>
    <span class="intel-hex-diagram__cell intel-hex-diagram__cell--type">RECORD TYPE</span>
    <span class="intel-hex-diagram__cell intel-hex-diagram__cell--data">DATA</span>
    <span class="intel-hex-diagram__cell intel-hex-diagram__cell--checksum">CHECKSUM</span>
  </div>
  <code class="intel-hex-diagram__record" aria-label="Example Intel HEX line: colon, length 10, address 2000, record type 00, data 210621CD7D20CD98203A00213C320021, checksum AF">
    <span class="intel-hex-diagram__cell intel-hex-diagram__cell--mark">:</span><span class="intel-hex-diagram__cell intel-hex-diagram__cell--length">10</span><span class="intel-hex-diagram__cell intel-hex-diagram__cell--address">2000</span><span class="intel-hex-diagram__cell intel-hex-diagram__cell--type">00</span><span class="intel-hex-diagram__cell intel-hex-diagram__cell--data">210621CD7D20CD98203A00213C320021</span><span class="intel-hex-diagram__cell intel-hex-diagram__cell--checksum">AF</span>
  </code>
</div>


MARK is a colon character, LENGTH is the number of bytes per line,
ADDRESS is the 2-byte address of where the data is to be stored.  RECORD
TYPE is 00 for Data and 01 for EOF.  DATA is the bytes to be stored.
CHECKSUM is the addition of all bytes in one line.

- Input: nothing
- Output: nothing
- Destroy: HL,DE,BC,A

### sendToSerial #25 (19H)
SIO Binary Dump.  Transfer TEC data to a serial terminal.  From address and
Length of data is needed for input.  Use checkStartEnd to get length if
using From/To address.
- Input: `HL` = start address
- Input: `DE` = length in bytes of data to send
- Destroys: `A`, `HL`, `DE`, `BC`

### receiveFromSerial #26 (1AH)
SIO receives binary data.  Receive binary data from FTDI.  From address
and Length of data is needed for input.  Use checkStartEnd to get length
if using From/To address.
- Input: `HL` = start address
- Input: `DE` = length in bytes of data to receive
- Destroys: `A`, `HL`, `DE`, `BC`

### sendAssembly #27 (1BH)
Send Assembly instructions to the serial port.  Print out the disassembled
code that is on the TEC in readable assembly language on the serial
terminal.  From address and Length of data is needed for input.  Use
checkStartEnd to get length if using From/To address.
- Input: `HL` = start address
- Input: `DE` = length in bytes of data to disassemble
- Destroys: `A`, `HL`, `DE`, `BC`

### sendHex #28 (1CH)
Send a traditional HEX dump as text to the serial terminal.  Up to 16 bytes
are displayed per line.    From address and Length of data is needed for
input.  Use checkStartEnd to get length if using From/To address.
- Input: `HL` = start address
- Input: `DE` = length in bytes of data to send as hex
- Destroys: `A`, `HL`, `DE`, `BC`

### genDataDump #29 (1DH)
Generate data dump in ASCII.  Print the Address and then B number of
bytes.  This routine is a subroutine in the _sendHex routine.
- Input: `B` = number of bytes to display
- Input: `HL` = start address of data dump
- Input: `DE` = address of string destination
- Output: `DE` = zero-terminated address one after the last ASCII
  entry i.e. `"4000: 23 34 45 56 78 9A BC DE",0`
- Destroys: `A`, `HL`; `HL` moves to the next address after the last byte

### stringToSerial #45 (2DH)
ASCII string to FTDI Serial Port.  Writes a string (text) to the serial port
- Input: HL = ASCII string terminated with a zero byte
- Destroy: A, HL (moves to end of the list)

```asm
TEXT: .db "HELLO TEC!",0

       ld hl,TEXT
       ld c,55
       rst 10h
```

## API Menu & Parameter Calls

### menuDriver #31 (1FH)
Menu driver for user programs.  Creates a selectable custom menu/list.
Keys: <span class="mon3-key-emphasis">Go</span> = Select menu item, <span class="mon3-key-emphasis">AD</span> = Exit Menu, <span class="mon3-key-emphasis">Plus</span>/<span class="mon3-key-emphasis">Minus</span> = Navigate menu.
If a menu item is selected by pressing <span class="mon3-key-emphasis">Go</span>, a jump is performed to the
menu routine address (see example below).  If the user routine ends with a
RET instruction, control will be brought back to the menu.  There is no need
to call the menuDriver again after the routine returns.

When an item is selected, the routine that is associated with the menu
entry will be called.  The selected menu item number will be stored at RAM
address <span class="mon3-address-emphasis">0897H</span>.  Items start from 0.

If after the RET the menu is to be removed or popped off, then call the
menuPop routine prior to the RET.  This will return control to the previous
menu or enter Data Entry mode.

The menu can also be used as a selectable List.  Use menuPop to close the
list once the item has been selected.  See an example below on how to do
this.
- Input: HL = Pointer to Menu configuration.
- Destroys: A, HL

All strings are ZERO terminated! Except the 7 Segment Text must be ASCII
of exactly 6 bytes.  Menu configuration is as follows.

```asm
<# Menu Entries>, <7 Segment Text>, <Menu Text Title>,
[<Menu Text Label>, <Menu Routine Address>]+
  EG: .db 2                 ; Two menu items
      .db "MyGame"          ; 7 segment text (6 bytes)
      .db "Games",0         ; Menu title
      .db "TEC Invaders",0  ; Text and Routine
      .dw invaders
      .db "TEC Maze",0      ; Text and routine
      .dw maze
```

### paramDriver #32 (20H)
Parameter data entry driver.  Creates a list of editable two-byte parameters.
Keys: <span class="mon3-key-emphasis">Go</span> = Continue, <span class="mon3-key-emphasis">AD</span> = Exit, <span class="mon3-key-emphasis">Plus</span>/<span class="mon3-key-emphasis">Minus</span> = Navigate, <span class="mon3-key-emphasis">0-F</span> = enter values
- Input: HL = Pointer to Parameter configuration.

Once the <span class="mon3-key-emphasis">Go</span> key is pressed, code will continue after the API call.  The
parameter view on the LCD will automatically be removed and the LCD will
display the prior view to the parameter call.  There is no need to call
menuPop to restore the previous LCD view.

Parameter text can be no longer than 14 characters.  Parameters entered
will be stored in the Param RAM Address locations of two-bytes each.  All
strings are ZERO terminated!    Except the 7 Segment Text must be ASCII
of exactly 6 bytes.  Parameter configuration is as follows.

```asm
<No. of Entries>, <7 Segment Text>, <Parameter Title
Text>, [<Param Text Label>, <Param RAM Address>]+
  EG: .db 3                 ; Three parameters
      .db "Params"          ; 7 segment text (6 bytes)
      .db "= Enter Parameters =",0  ; Parameter title
      .db "Start Address:",0        ; Text and Address
      .dw RAM_LOC_1
      .db "End Address:",0          ; Text and Address
      .dw RAM_LOC_2
      .db "Dest. Address:",0        ; Text and Address
      .dw RAM_LOC_3
```

### menuPop #47 (2FH)
Replace the current menu with its parent menu if any.  If menus have been
nested, the parent menu will become the active menu.  This is the same as
pressing the <span class="mon3-key-emphasis">AD</span> key but done in software.  If no parent menu exists then
the Monitor mode is changed to Data Entry View.  Useful if using the menu
as a Select List where execution of code is to be continued.
- Input: none.
- Destroys: A

### Menu and Parameter Driver Example
Create a Menu with 3 items.  The first item jumps to a routine which is the
standard way to use the menu.  The second item displays a selectable list
that saves a value in RAM and returns to the menu.  The last item will
create a parameter entry list of four 2-byte items.

```asm
MENUDRIVER  .EQU 1FH  ;Menu API
PARAMDRIVER .EQU 20H  ;Param API
MENUPOP     .EQU 2FH  ;Menu Pop API

PROGRAM1    .EQU 1000H ;Program 1
BAUD        .EQU 2008H ;Baud value
PARAM1      .EQU 2000H ;two bytes
PARAM2      .EQU 2002H ;per param
PARAM3      .EQU 2004H
PARAM4      .EQU 2006H

;Create Menu
0E 1F      ld c,MENUDRIVER
21 00 30   ld hl,menuCFG ;config
D7         rst 10H ;API call
;Code continues in menu routines

;Create Selectable List
setBaud:
0E 1F      ld c,MENUDRIVER
21 00 30   ld hl,baudCFG ;config
D7         rst 10H ;API call
;Code continues in menu routines

;Baud rate saving code
baud12:
21 00 12   ld hl,1200H ;baud rate
18 0D      jr saveBaud ;cont..

baud24:
21 00 24   ld hl,2400H ;baud rate
18 08      jr saveBaud ;cont..

baud48:
21 00 48   ld hl,4800H ;baud rate
18 03      jr saveBaud ;cont..

baud96:
21 00 96   ld hl,9600H ;baud rate

saveBaud:
22 08 20   ld (BAUD),hl ;save baud
0E 2F      ld c,MENUPOP
D7         rst 10H ;API call
C9         ret ;Return to Main Menu

;Create Parameter Entry
createParam:
0E 20      ld c,PARAMDRIVER
21 80 30   ld hl,paramCFG ;config
D7         rst 10H ;API call
;Parameter code continues
C9         ret ;Return to Main Menu

;Main Menu Configuration
menuCFG:
    .db 3   ;three entries
    .db "-Menu-"
    .db "= MENU TITLE =",0
    .db "Run Program",0
    .dw PROGRAM1
    .db "Set Baud Rate",0
    .dw setBaud
    .db "Parameters",0
    .dw createParam

;Selectable List Configuration
baudCFG:
    .db 4   ;four entries
    .db "BAUDrt"
    .db "= Select Baud =",0
    .db "1200",0
    .dw baud12
    .db "2400",0
    .dw baud24
    .db "4800",0
    .dw baud48
    .db "9600",0
    .dw baud96

;Parameter Entry Configuration
paramCFG:
    .db 4   ;four entries
    .db "Input "
    .db "= PARAM TITLE =",0
    .db "Start Address",0
    .dw PARAM1
    .db "End Address",0
    .dw PARAM2
    .db "Copy Address",0
    .dw PARAM3
    .db "Backup Address",0
    .dw PARAM4
```

## API Sound Calls

### playNote #34 (22H)
Play a note.  Play a note with a given frequency and wavelength
- Input: `HL` = frequency (`01-7F`)
- Input: `B` = wavelength (`00-FF`)
- Destroys: `HL`, `BC`, `A`

### playTune #35 (23H)
Play a series of notes.  To play a note use a reference between 01H and 18H.
Where 01H is the lowest frequency and 18H is the highest frequency.  Use
00H for a pause and any value above 18H to exit.  A single pause can be
used to separate notes.

Note reference table is as follows:

| Note | Code | Note | Code | Note | Code | Note | Code |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G | `01H` | C# | `07H` | G | `0DH` | C# | `13H` |
| G# | `02H` | D | `08H` | G# | `0EH` | D | `14H` |
| A | `03H` | D# | `09H` | A | `0FH` | D# | `15H` |
| A# | `04H` | E | `0AH` | A# | `10H` | E | `16H` |
| B | `05H` | F | `0BH` | B | `11H` | F | `17H` |
| C | `06H` | F# | `0CH` | C | `12H` | F# | `18H` |

- Input: `DE` = address of first note
- Destroy: `A`, `B`, `DE`, `HL`

### playTuneMenu #36 (24H)
Play a series of notes with the _playTune routine, but the address of the
first note is selected via a parameter menu.
- Input: none
- Destroy: A,B,DE,HL

## API System Latch Calls

### getCaps #37 (25H)
Get Caps lock state
- Input: none
- Output: A = caps lock state; 0 = off, 80H = on

### getShadow #38 (26H)
Get SHADOW state
- Input: none
- Output: A = shadow state; 0 = off, 01H = on

### getProtect #39 (27H)
Get PROTECT state
- Input: none
- Output: A = protect state; 0 = off, 02H = on

### getExpand #40 (28H)
Get EXPAND state
- Input: none
- Output: A = expand state; 0 = off, 04H = on

### setCaps #41 (29H)
Set Caps lock state
- Input: A = Desired caps lock state; 0 = off, 80H = on
- Destroy: A

### setShadow #42 (2AH)
Set Shadow state
- Input: A = Desired shadow state; 0 = off, 01H = on
- Destroy: A

### setProtect #43 (2BH)
Set Protect state
- Input: A = Desired protect state; 0 = off, 02H = on
- Destroy: A

### setExpand #44 (2CH)
Set Expand state
- Input: A = Desired expand state; 0 = off, 04H = on
- Destroy: A

### toggleCaps #48 (30H)
Toggle Caps Lock state. On/Off or vice versa
- Input: none
- Destroy: A

## Miscellaneous Calls

### timeDelay #33 (21H)
A 16-bit delay routine.  An input delay of <span class="mon3-address-emphasis">2000H</span> is approximately 50ms.
- Input: HL = delay amount
- Destroys: none

### random #49 (31H)
Random number generator.  Return a random number between 00H-FFH
- Input: none
- Output: A = pseudo-random number
- Destroy: B

### setDisStart #50 (32H)
Set Disassembly start address.  Set the first address for disassembly output
- Input: HL = start address
- Output: none
- Destroy: none

### getDisNext #51 (33H)
Get Disassembly next address.  The new start address for the next output.
- Input: none
- Output: HL = start address
- Destroy: none

### getDisassembly #52 (34H)
Generate Disassembly line.  Must call setDisStart prior.  Only need to call
setDisStart once as the next address is automatically increased.
- Input: none
- Output: `HL` = pointer to zero-terminated disassembly ASCII
- Destroy: none

### RTCAPI #46 (2EH)
Call a Real Time Clock (RTI) routine for the RTC add on board.  See the RTC
chapter below for details on this add-on.

- Input: `B` = RTC routine number
- Other inputs depend on the RTC routine.

### LCDConfirm #55 (37H)
Ask a confirmation message on the LCD before proceeding.  Press 'C' to
confirm or any other key to not confirm.
- Input: none
- Output: `Zero Flag` = set == confirmed or 'C' pressed
- Destroy: `A`, `HL`

### getGLCDTerm #56 (38H)
Get GLCDTERM state.  Check if using the GLCD as a Terminal
- Input: none
- Output: `A` = GLCD Terminal state; 0 = off, FF = on

### setGLCDTerm #57 (39H)
Set GLCD Terminal state
- Input: `A` = Desired GLCD Terminal state; 0 = off, FF = on
- Destroy: `A`

### loadFromDisk #58 (3AH)
See the Hard Drive Access section for details of this routine.

### openFile #59 (3BH)
See the Hard Drive Access section for details of this routine.

### readFile #60 (3CH)
See the Hard Drive Access section for details of this routine.

### writeFile #61 (3DH)
See the Hard Drive Access section for details of this routine.

### RGBScan #62 (3EH)
Multiplex the 8x8 RGB Board with 3 colours, Red, Green and Blue.  Need to
be called in a loop.  The Row data is from top to bottom.

- Input: `IY` = 24 bytes of row data: 8 red, 8 green, 8 blue

![MON-3 illustration](../../assets/images/tec1g/mon3/page-49-figure-1.jpg)

*This is what's displayed with the data below.*

```asm
LOOP:
    ld iy,RGBDATA
    ld c,62       ;RGBScan
    rst 10h
    jr LOOP

RGBDATA:  .db 00h,00h,24h,00h,18h,00h,00h,00h    ; RED Data
          .db 24h,3Ch,5Ah,0FFh,0FFh,0BDh,42h,24h ; GREEN Data
          .db 00h,00h,00h,00h,18h,00h,00h,00h    ; BLUE Data
```

[← Terminal Monitor and TEC Magazine Code](04-terminal-monitor-and-tec-magazine-code.md) | [Guide](index.md) | [Real Time Clock Add-On →](06-real-time-clock.md)
