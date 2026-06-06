---
layout: default
title: "Terminal Monitor"
parent: "MON-3 User Guide"
grand_parent: "TEC-1G Hardware"
nav_order: 9
has_toc: false
nav_exclude: true
---

[← Tiny Basic](07-tiny-basic.md) | [Guide](index.md) | [TEC Magazine Code on the TEC-1G →](09-tec-magazine-code-on-the-tec-1g.md)

# Terminal Monitor

### Starting up TMON
### Using TMON

TMON has been removed from Mon3 as of v1.5 but it can be loaded as a
stand-alone program.  See the GitHub for source files.
The Terminal Monitor (TMON) is a complete serial port-based monitor for
the TEG-1G, designed for users who prefer to interact with the TEC-1G via a
terminal.

Starting up TMON

Connect a serial terminal to the TEC-1G via the FTDI to USB connector.
Then, select Terminal Monitor from the main menu by pressing GO and
look at the serial terminal.


```asm
 TMON for TEC-1G Version 1.0
 MON-3 Version: 2023.11
 RAM Found between 0000h and 3FFFh - 16384 bytes
 1000 >
```


Using TMON

TMON is an interactive tool that works with a serial terminal e.g. PuTTY or
Tera Term on a PC, or a 'real' VT100 serial terminal such as a Wyse WY-60.
The TEC-1G keypad and 7-seg displays are not used once the program
starts, and do not do anything (except for the testing routines documented
below).

Interactions with TMON are via the serial console. The user types
commands interactively and the results are displayed on the terminal.

All interactions with TMON use HEX format - so a byte is 00 to FF, etc. The
"h" or "0x" is omitted for brevity.

Typically, the ADDR key exits any interactive command, or by entering "Q"
from the terminal.

The above text is the default display when TMON first starts.  TMON is now
awaiting input and commands from the Available Commands list can be
entered.

### The Command Prompt
### DATA mode

 1000 >


The 1000 represents the CURRENT ADDRESS in HEX. Many commands
default to their actions interacting with memory at this address. The
CURRENT ADDRESS changes as with certain commands. e.g. inputting
code and data, and can be set by the ADDR command. By default, TMON
points to itself.

The command input editor is very simple. Invalid inputs are typically
ignored and result in the user simply being returned to the command
prompt. The maximum command length accepted is 40 characters,
however, presently the longest valid command possible is 9 characters in
length. When the user's input exceeds the maximum command length,
the TEC will emit a beep tone to indicate this condition has been reached.
Backspace is supported, to correct typos.

All data entered at all times is assumed to be HEX - 4 bytes for addresses, 2
bytes for data. Invalid data input is ignored.

DATA mode

When the DATA command is given, TMON switches to interactive data
entry mode. This is signified by the prompt changing as follows:


 XXXX nn :


XXXX continues to represent the CURRENT ADDRESS however the nn
represents the HEX byte stored at that address, which you are presently
editing.
   -   Enter a HEX byte and it will be written to memory at CADDR;
```asm
       CURRENT ADDR is then incremented by one.
   -   ENTER increments CURRENT ADDRESS by one and leaves the
       existing value as-is. This way, any bytes that don't need altering are
       skipped over.
   -   - decrements the CURRENT ADDRESS by one. This allows for
       correcting input errors by going back one address after erroneous
       input.
   -   Q exits data entry mode.
```

### TMON Commands

Invalid entries will be ignored.

The DATA entry system is very simple and will continue to be improved in
future versions.

TMON Commands

```asm
 HELP                         ?                             EXIT

 INTEL                        BEEP                          BELL

 VER                          STATE                         CLS

 RAMCHK                       GO [xxxx]                     DUMP [xxxx]

 ADDR [xxxx]                  DATA [xxxx]                   INC

 7SEG                         SMON                          HALT

 DEBUG                        KEYTEST                       FILL xxxx yyyy nn

 PRINT
```

Parameters marked with square brackets e.g. \[xxxx\] are optional.

HELP
Displays help text

?
Display the list of commands

EXIT
Reboots the 1G back to MON3

INTEL
Calls the Intel Hex file transfer routine built into MON-3

BEEP
Beeps the 1G speaker

BELL
Sents the BELL command to the remote console

VER
Displays the version number of TMON and MON-3

STATE
Displays the state of the 1G system - SHADOW, PROTECT, EXPAND, CAPS
LOCK

CLS
Sens a clear screen sequence to the remote console

RAMCHK
Runs a simple test to determine how much RAM is installed, and at what
momentary address(e)s.  Uses whichever bank EXPAND is set to, but does
not alter the EXPAND state.  Supports multiple discontinuous RAM blocks,
if fitted.

GO xxxx
Executes code from the CURRENT ADDRESS, or from xxxx if supplied.

DUMP xxxx
DUMP the contents of 64 bytes of memory; provides HEX and ASCII
outputs so memory can be examined.

DUMP pauses at completion - space repeats the command (CADDR
continues to increment if auto-increment is on; otherwise the same block
repeats). This allows you to quickly run through larger blocks without
needing to type commands repeatedly.

Q quits and returns to the command prompt.

ADDR xxxx
Set the CURRENT ADDRESS. If no address is supplied, display the CADDR
instead.

DATA xxxx
Interactively Input data into memory. Input one hex byte at a time; the
value input is stored in the CADDR memory location.

Enter Q to quit input mode. See full description of DATA mode, above.

INC ON/OFF
Set auto-increment mode of CADDR. No parameter supplied = Display the
current auto-increment mode. Sometimes turning auto-increment off is
helpful for debugging or monitoring.

7SEG
Displays CADDR and memory byte on TEC 7-seg displays. + and - keys
increment/decrement CADDR.  Pressing the ADDR key exits to TMON.

SMON
Serial data stream monitor. Accepts serial input from the terminal and
displays the HEX bytes received on screen. Great for debugging terminal
comms and understanding control codes received from the PC (e.g. VT100
sequences). This is a crude implementation but does display the
limitations of the bit-bang serial in not being able to adequately buffer
incoming bytes in real time (try pressing an arrow key or a PC function
key).

Enter Q (capital) to exit SMON back to TMON.

If a terminal program such as Tera Term is used to add a small delay (e.g
20ms) between bytes transmitted from the PC, SMON can accurately show
VT100 control codes such as a PC arrow or function key. Without the delay,
the bit-bang serial normally gets the first byte only, or perhaps the first and
fourth or fifth byte, hence demonstrating the limitations of the bit-bang
interface.

HALT
Executes a CPU HALT instruction - on TEC-1F, press any key to resume.

DEBUG
Calls the MON-3 debugger/breakpoint tool to examine register contents.

KEYTEST
Tests the selected keyboard - the last pressed key's scancode will appear
on the 7-segment displays. Fn is displayed with bit 5 set. Matrix keypad
keys supported by MON3 (NOT the full matrix keyset) will be returned if
MATRIX mode is enabled.  Pressing the ADDR key exits to TMON.

FILL xxxx yyyy nn
Fill memory between address xxxx and yyyy with data nn. note: Fill range
must be at least 2 bytes long. No checks for safety are done - use with
caution, as any area of memory, including the stack, program code or data
could be overwritten.  This does not apply if Protect Mode is on.

PRINT your-text-here
your-text-here is echoed back to the serial terminal.

![Extracted figure from MON-3 User Guide page 26](../../assets/images/tec1g-hardware/mon3-user-guide/page-26-figure-1.png)

[← Tiny Basic](07-tiny-basic.md) | [Guide](index.md) | [TEC Magazine Code on the TEC-1G →](09-tec-magazine-code-on-the-tec-1g.md)
