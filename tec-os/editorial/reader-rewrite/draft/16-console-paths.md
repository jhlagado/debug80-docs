---
title: Console paths
parent: TEC-OS
nav_order: 16
nav_group: "Part II: Inside TEC-OS"
---

# 16. Console paths

<!-- Source mechanisms inspected at adopted TEC-OS
     962853f499f05faf281f6cdff1deca8959f58c2b. All unprefixed source ranges
     below use that revision. No execution or current artifact result is claimed.
     Current cold-default claims are separate from historical captures. -->

<!-- Historical evidence: all three captures, their recipes and the TERM host
     assembly recipe retain TEC-OS 78127ec. TERM used atom-z80 0.3.7 and a
     starter-card copy named con.img. Serial TXBYTE/BCONOUT measurements retain
     60cfbdc and the 4 MHz clock, as recorded in Book 22:1-5,91-92.
     No capture, assembly or timing run was repeated. -->

A key can arrive while a program is printing and still be available for its
next read. TEC-OS holds that byte while the output continues. At the other
end of the path, the same output byte can become a serial bit stream or a
character in display memory. The BDOS processes editing and output controls
before the BIOS transfers bytes to the selected device
(`src/cpm/bdoscon.asm:126-168`, `src/cpm/bdoscon.asm:178-243`,
`src/cpm/bdoscon.asm:318-350`, `src/console.asm:429-492`).

## The BIOS boundary

The BIOS jump table gives the BDOS and programs fixed offsets for machine
operations. TEC-OS supplies all seventeen CP/M 2.2 entries. Each is a
three-byte jump (`src/tables.asm:19-35`):

| Offset | Entry | Routine |
| ---: | --- | --- |
| `00h` | cold boot | `COLD` |
| `03h` | warm boot | `WBOOTR` |
| `06h` | `CONST` | `BCONSTC` |
| `09h` | `CONIN` | `BCONIN` |
| `0Ch` | `CONOUT` | `BCONOUT` |
| `0Fh` | `LIST` | `BLIST` |
| `12h` | `PUNCH` | `BPUNCH` |
| `15h` | `READER` | `BREADER` |
| `18h` | `HOME` | `BHOME` |
| `1Bh` | `SELDSK` | `BSELDSK` |
| `1Eh` | `SETTRK` | `BSETTRK` |
| `21h` | `SETSEC` | `BSETSEC` |
| `24h` | `SETDMA` | `BSETDMA` |
| `27h` | `READ` | `BREAD` |
| `2Ah` | `WRITE` | `BWRITE` |
| `2Dh` | `LISTST` | `BLISTST` |
| `30h` | `SECTRAN` | `BSECTRN` |

Cold boot copies the ROM table to `BF00h`. The word at `0001h` points to its
warm-boot entry, `BF03h`, so subtracting three gives the table base. The BDOS's
`BIOCST`, `BIOCIN` and `BIOCOT` names address entries in that RAM copy
(`src/boot.asm:144-152`, `src/boot.asm:412-420`, `src/cpm/bdos.asm:22-36`). A
program can replace a jump to receive the BDOS's calls as well as direct BIOS
calls. Warm boot leaves the table in place. A hook into a program's transient
program area (TPA) must be restored before that program ends, including a
replacement warm-boot jump.

The output-time status check is an exception to the BDOS's table route.
`CONSTQ` calls the ROM's `BCONST` directly so it can poll without drawing
a cursor. Its input still passes through `GETCHAR` and the RAM `CONIN`
entry. Private ROM printing routines can also call `BCONOUT` directly.
A BIOS-table hook therefore covers the named interface, not every internal
ROM call (`src/cpm/bdoscon.asm:126-168`, `src/cpm/bdoscon.asm:318-330`,
`src/console.asm:498-522`).

## Requested and applied consoles

`CON:` is the logical console. The IOBYTE at `0003h` selects its physical
device with bits 0–1. `TTY:`, `CRT:`, `BAT:` and `UC1:` are the four
physical console names. TEC-OS maps them to these board paths
(`src/console.asm:1-26`, `src/console.asm:127-163`,
`src/layout.asm:63-66`):

| Value | Physical console | Input source | Output path |
| ---: | --- | --- | --- |
| 0 | `TTY:` | serial port | serial port |
| 1 | `CRT:` | matrix keyboard | PICO9918 |
| 2 | `BAT:` | serial port, with console filtering | direct discard |
| 3 | `UC1:` | matrix keyboard | graphics LCD |

The other IOBYTE fields are `RDR:` in bits 2–3, `PUN:` in bits 4–5 and
`LST:` in bits 6–7. TEC-OS uses only the console field for routing.
The reader, punch and list calls have fixed implementations whatever those
upper fields contain (`src/console.asm:566-599`).

A program can write the IOBYTE directly or use BDOS function 8. Function 7
reads the byte back. A write changes the request immediately while
`CONMOD` records the mode actually applied. `CONSEL` compares the two
at BIOS console status, input and output calls. A changed request enters
`CONSW` (`src/cpm/bdos.asm:399-412`, `src/console.asm:98-111`,
`src/console.asm:230-241`, `src/console.asm:295-305`,
`src/console.asm:429-430`). This is the standard IOBYTE contract used by
`STAT CON:=CRT:` too.

For either odd mode, `CONSW` reads the display table address in `PIVEC`
or `GLVEC`. A zero pointer selects serial instead. A valid table supplies
seven vectors and the columns and rows. `CONSW` copies them, resets the
scroll region and records the applied mode. Unless that console display is
claimed, it restores the display mode, homes the cursor and clears the
screen. `TTY:` and `BAT:` instead set `VWID` and `VHGT` to zero
(`src/console.asm:127-199`).

`CONMD` writes the applied mode into `CONMOD` and the low IOBYTE field,
keeping the other six bits. After a console call has acted on a request,
that field names the selected device. A missing display or keyboard thus
changes a requested video mode back to `TTY:`. `INFO` returns the applied
dimensions in `L` and `H`. Both are zero for serial because TEC-OS cannot
read the PC terminal's dimensions. A screen-layout program reads the size
again after changing consoles (`src/console.asm:606-620`,
`src/services.asm:95-105`).

The `CON` command uses this same request. Its next output call applies the
change before printing the reply (`src/cpm/ccpcmd.asm:200-232`,
`src/console.asm:98-111`). In this historical `78127ec` capture,
the board's 80-column PICO console had printed the banner, drive list,
first `CON` reply and the typed `CON TTY` line. Only the new reply and
subsequent input appear in the serial capture:

<!-- node tools/capture.mjs --board pico --serial CON "CON TTY" CON -->
```text
CON: TTY:
A>CON
CON: TTY:
A>
```

## Input held at two levels

The BIOS keeps one received character in `RXCHAR`, with `RXFULL` marking
it ready. These bytes are above the RAM BIOS table. Serial reception and
keyboard delivery both publish there. `CINTAKE` returns the character and
clears the flag or advances a queued arrow sequence while leaving the
flag set (`src/ram.asm:314-319`, `src/ram.asm:430-432`,
`src/console.asm:274-286`,
`src/console.asm:329-354`, `src/keyboard.asm:109-129`).

`BCONST` first applies the console request and shows any completed PICO
row move. An already buffered byte returns ready without another physical
read. Otherwise a video mode calls `KBPOLL` while a serial mode listens
for a start bit. The public `CONST` entry, `BCONSTC`, also draws the cursor
when no character is ready on a video console. The BDOS's output check uses
the cursor-free entry (`src/console.asm:210-286`,
`src/cpm/bdoscon.asm:160-168`).

`BCONIN` also takes an already buffered byte first. When it must wait on a
video console, it draws the cursor and calls `KBSTEP` repeatedly. Once
that wait delivers a key it hides the cursor before returning. Serial
input instead waits for port `03h` bit 7 to go low. Console reception
clears bit 7 and skips a resulting `NUL`. The source documents a leading
`NUL` before Debug80's first input byte as a reason for that filter
(`src/console.asm:288-320`, `src/console.asm:361-421`).

Before waiting for serial input, the ROM reads port `00h`. In Debug80 that read
starts queued host model input. On the board it reads the hex-keypad encoder and
has no effect on the serial line. This is a model input trigger, not a hardware
receive buffer (`src/console.asm:28-45`, `src/console.asm:253-279`,
`src/console.asm:361-377`).

The BDOS has another one-character reserve, `PENDCHR` and `PENDING`, in its
own workspace. `GETCHAR` returns that byte first and otherwise calls the
RAM BIOS `CONIN` entry. `CONSTAT` reports it ready before consulting the
BIOS. Function 11 goes further: a character reported ready by the BIOS is
read into the BDOS reserve and the call returns 1. It returns 0 when
neither level has input (`src/ram.asm:242-245`,
`src/cpm/bdoscon.asm:126-153`, `src/cpm/bdos.asm:772-792`).

A direct BIOS read cannot return a byte already held inside the BDOS.
A program which prints with BDOS function 2 and reads only through BIOS
`CONIN` can therefore miss input retained during output. Keeping both
input and output at the same interface level avoids that split. Neither
one-byte reserve is a general queue for input arriving while the CPU is
busy elsewhere (`src/cpm/bdoscon.asm:126-168`,
`src/cpm/bdoscon.asm:318-350`, `src/console.asm:28-39`).

## BDOS output and line input

Functions 2 and 9 print through `OUTCHAR`. Function 9 reads the string at
`DE` up to a dollar sign. `OUTCHAR` expands a tab to spaces until the
BDOS's `COLUMN` reaches a multiple of eight. Before every output character,
`CHKKEY` checks for input (`src/cpm/bdos.asm:337-341`,
`src/cpm/bdos.asm:419-433`, `src/cpm/bdoscon.asm:178-204`).

A waiting `^S` pauses output until another key. A `^C` used to resume it
jumps through `CHDROP` to warm boot and cancels a pending command chain.
Any other resume key is consumed. A `^P` outside that pause toggles
`LISTEN`, the copy-to-list flag. Other keys are placed in `PENDCHR` for
the next BDOS read (`src/cpm/bdoscon.asm:318-360`,
`src/cpm/bdos.asm:115-119`).

`ECHORAW` updates `COLUMN` before calling either output hook. A carriage
return sets it to zero, backspace reduces it toward zero and a byte from
space upwards increments it. With `LISTEN` set the character is sent
through `LIST` first, with `BC` saved across that call. It then jumps to
`CONOUT`. Either replacement BIOS routine may change `C` so column
tracking must already be complete (`src/cpm/bdoscon.asm:229-264`,
`src/cpm/bdoscon.asm:290-305`).

Function 1 obtains a character with `GETCHAR` and echoes it through
`ECHOCHAR`, including a control byte. Tabs are echoed as spaces. Function
6's input form, `E = FFh`, returns a waiting character without echo or
returns zero. Its output form sends `E` straight to BIOS `CONOUT`.
The BDOS then performs no tab expansion, key check, list copy or column
update. A video BIOS may still interpret the byte as a terminal control
(`src/cpm/bdos.asm:321-330`, `src/cpm/bdos.asm:376-397`,
`src/cpm/bdoscon.asm:273-286`, `src/console.asm:429-437`).

Function 10 takes a buffer at `DE`. Its first byte gives the maximum
character count, from 1 to 255. The returned count goes in the second byte
and the characters follow. CR or LF ends the line and is echoed rather
than stored. Filling the buffer also ends it, with a CR echo. The input
loop recognises these editing controls (`src/cpm/bdos.asm:454-531`,
`src/cpm/bdos.asm:740-765`):

| Key | Input and echo effect |
| --- | --- |
| Backspace, `08h` | Remove the last character and send backspace, space, backspace to erase it |
| Delete, `7Fh` | Remove the last character and echo that character as a printing-terminal rubout |
| `^U` | Print `#`, start a new screen line and empty the input buffer |
| `^R` | Print `#` and retype the buffered text on a new screen line |
| `^X` | Erase the displayed input and empty the buffer |
| `^E` | Start a new screen line while retaining the input buffer |
| `^P` | Toggle the list copy without storing the key |
| `^C` | Print `^C` and warm boot only while the buffer is empty, otherwise ignore the key |

The deletion paths update `LINPTR` and `LINCNT`. `ERASE1` sends its three
bytes directly through BIOS `CONOUT`, bypassing the printer echo.
`LINERASE` repeats it for `^X` and history replacement
(`src/cpm/bdos.asm:559-729`, `src/cpm/bdoscon.asm:368-376`).

This retained `78127ec` example shows `^U` discarding a partial command
and `^R` retyping a complete one before Return:

<!-- node tools/capture.mjs $'TYPE X\x15DIR *.CMD' $'DIR *.CMD\x12' -->
```text
A>TYPE X#
DIR *.CMD
STARTUP.CMD 
1 file, 980K free
A>DIR *.CMD#
DIR *.CMD
STARTUP.CMD 
1 file, 980K free
A>
```

The CCP marks its own function-10 call with `HFLAG`. Only then do `^W`
and `^N` replace the line from history. In an ordinary program call they
are stored as characters. Completion consumes `HFLAG` and submits a
nonempty marked line to `HSTORE`. Abandoned empty-line `^C` instead clears
the flag through warm boot. [Chapter 22](22-the-history-ring.md) explains
storage and traversal (`src/cpm/ccp.asm:148-166`,
`src/cpm/bdos.asm:545-553`, `src/cpm/bdos.asm:740-765`,
`src/boot.asm:530-536`).

## Serial bits and timing

The TEC-1G has no UART. The CPU sends on port `01h` bit 6 and receives
on port `03h` bit 7. Port `01h` also selects the seven-segment digits.
The serial setting is 4800 baud with eight data bits, no parity and two
stop bits. The timing counts assume the 4 MHz FAST clock
(`src/layout.asm:14-20`, `src/console.asm:28-45`,
`tools/build.mjs:26-27`).

`TXBYTE` saves the interrupt state and disables maskable interrupts for
the byte. Nine passes send a start bit followed by eight data bits, least
significant first. `SBC A,A` turns carry into `00h` or `FFh` then
`AND 40h` selects the output level. Each pass writes the port, delays
and shifts the next bit into carry. A pass costs `49 + 16 × TXDLY`
T-states. The stop bits hold the line high for `TXSTOP` delay passes.
The saved interrupt state is restored after them (`src/console.asm:452-492`).

`RXBITS` begins after a poll detects the low start bit. It also saves
and masks interrupts then waits `RXHALF` delay passes before sampling
the first data bit. Eight samples enter `C` through carry. A sampling
pass costs `38 + 16 × RXDLY` T-states. The routine restores the saved
interrupt state before returning the byte (`src/console.asm:387-421`).

The build derives the five counts from a bit time of
`4,000,000 / 4800`, about 833.3 T-states (`tools/build.mjs:38-59`):

| Count | Derivation | Value |
| --- | --- | ---: |
| `TXDLY` | Round `(bit time − 49) / 16` | 49 |
| `RXDLY` | Round `(bit time − 38) / 16` | 50 |
| `TXSTOP` | Round `2 × bit time / 16` then add 1 | 105 |
| `RXPOLL` | Round `3.5 × bit time / 38` upwards | 77 |
| `RXHALF` | Round `(1.5 × bit time − 51 − 58.5 − 19) / 16` | 70 |

A transmit pass therefore takes 833 T-states and a receive pass 838.
The `RXHALF` deductions cover the fixed 51 T-states around its loop,
the mean of the interrupt-state paths at 65 and 52 T-states and half
the maximum 38-T-state polling delay. `RXPOLL` covers roughly three and
a half bit times for one status-listening attempt. A received `NUL` starts
another attempt rather than becoming a character. The generated counts
are written to `src/gen/config.asm` (`tools/build.mjs:38-77`,
`src/console.asm:253-279`, `src/console.asm:387-399`).

At `60cfbdc`, the model measured 9,293 T-states for a whole `TXBYTE`
character and 9,448 through serial `BCONOUT`. At 4 MHz the latter is
roughly 420 characters a second.

Reception has no hardware buffer. A byte arriving while the CPU is not
polling can be lost. A PC therefore cannot send an uninterrupted stream
merely because TEC-OS has a one-byte software reserve. The receiving
program must return to `CONIN` or `READER` before the next start bit
(`src/console.asm:28-39`, `src/console.asm:361-377`,
`src/console.asm:585-599`).

## Reader, punch and list

BDOS functions 3, 4 and 5 call the BIOS's `READER`, `PUNCH` and `LIST`
entries. The reader waits without a timeout and returns all eight bits,
including `NUL`. It reads the serial line directly so a byte already in
`RXCHAR` stays with the console. The punch sends all eight bits of `C`
through `TXBYTE`, whatever console is selected. On a serial console its
bytes interleave with console output (`src/cpm/bdos.asm:343-369`,
`src/console.asm:573-599`).

`LIST` discards each character with a direct return. `LISTST` always
returns `FFh`, ready. A program waiting for printer readiness can therefore
continue even though the board has no printer (`src/console.asm:559-571`).
A display-console program can use punch and reader as a separate byte
channel to a PC, provided it also respects the unbuffered receive timing.

BAT uses the console's serial input path, which strips bit 7 and skips
`NUL`. Its output returns directly from `BCONOUT`. It neither calls
`LIST` nor copies output to the punch. The BDOS's independently enabled
`^P` copy can still call the RAM `LIST` hook before that BAT discard
(`src/console.asm:361-378`, `src/console.asm:429-440`,
`src/cpm/bdoscon.asm:229-243`).

## Matrix scan and key bytes

The keyboard uses port `FEh`. With `C = FEh`, `IN A,(C)` puts the row
mask in `B` on the high address lines. Its single low bit selects one of
eight rows. A low bit in the returned byte marks a pressed key. Key
number k is row k / 8 and bit k mod 8. Keys 0–2 are Shift, Ctrl and Fn,
keys 3–6 are arrows and key 7 is Caps Lock (`src/keyboard.asm:1-7`,
`src/keyboard.asm:36-70`, `src/keyboard.asm:88-117`).

Cold boot copies the Matrix switch's bit 0 from port `03h` into
`CONDEV`. Without `CDMTX`, `KBPOLL` returns immediately. Otherwise it
calls up to eight `KBSTEP`s, returning early when a character is ready.
Blocking video input calls `KBSTEP` repeatedly instead
(`src/console.asm:82-88`, `src/console.asm:309-320`,
`src/keyboard.asm:15-28`).

`KBMASK` rotates after each row and `KBBASE` advances by eight. For each
pressed key, `KBSTEP` moves the previous `KBE` into `KBD` and stores the
new key in `KBE`. At row 7 the scan has retained its two highest-numbered
pressed keys. `KBEVAL` compares the highest with `KBLAST`, records releases
and delivers a held key only once. Holding it produces no automatic repeat
(`src/keyboard.asm:36-97`). A press and release entirely between scans
is lost.

Two ordinary keys produce no character. A retained second key below 3 is
a modifier and a modifier alone also produces none. Caps Lock toggles
bit 7 in both `LATCHV` and the system latch. `KBASCII` uses plain/shifted
`KBSPEC` entries for Return, Esc, space, quote and backslash. Digits and
punctuation use `KBSHIFT`. Letters are lowercase normally, uppercase with Shift or Caps Lock and
control codes `01h–1Ah` with Ctrl. Fn uses the ordinary character
(`src/keyboard.asm:88-142`, `src/keyboard.asm:150-220`,
`src/tables.asm:40-44`).

Return is `0Dh` and Esc is `1Bh`. `^H` (`08h`) is backspace and
`^I` (`09h`) is tab. The arrows produce three-byte sequences:

| Arrow | Bytes |
| --- | --- |
| Up | `ESC [ A` |
| Down | `ESC [ B` |
| Right | `ESC [ C` |
| Left | `ESC [ D` |

The keyboard puts `ESC` in `RXCHAR` and queues the other bytes in
`KBT1` and `KBT2`, with `KBTN = 2`. `CINTAKE` advances them on successive
reads, keeping `RXFULL` set until the sequence is consumed
(`src/keyboard.asm:98-129`, `src/console.asm:329-354`,
`src/tables.asm:40-42`). The table-derived character set and these arrow
bytes let an editor read the matrix keyboard through the same console
interface as serial input.

## Bytes to display cells

On serial output the PC's terminal interprets controls and escape sequences.
The ROM sends the output bytes unchanged. For a video console `BCONOUT`
instead enters `VTOUT`, which draws through the selected display vectors.
A claimed PICO console suppresses that output before the terminal runs
(`src/console.asm:429-492`, `src/term.asm:49-98`,
`src/term.asm:915-929`).

`VROW` and `VCOL` store the cursor position. `VPUT` writes a cell, `VGET`
reads one and `VCLREOL` clears from a column to its row's end. `VRDROW`
and `VWRROW` transfer a row through the 80-byte `LINEBUF`
(`src/ram.asm:121-134`, `src/ram.asm:435-439`, `src/video.asm:37-80`).

Printable bytes `20h–7Eh` are drawn with `VATTR` ORed into them.
Reverse video sets `VATTR` to `80h`, selecting the reverse glyph.
Ordinary output bytes `7Fh–FFh` are dropped. A last-column character
leaves `VCOL` one past the edge. Only the next printable character
wraps so an exactly full row followed by CR and LF adds no blank row
(`src/term.asm:49-98`, `src/term.asm:576-590`).

The control path recognises six bytes (`src/term.asm:106-200`):

| Byte | Control | Effect |
| --- | --- | --- |
| `08h` | BS | Move left one column, stopping at the first |
| `09h` | HT | Move to the next eight-column tab stop, clipped to the last column |
| `0Ah` | LF | Move down, scrolling at the region's bottom |
| `0Ch` | FF | Clear the screen and home the cursor |
| `0Dh` | CR | Move to the first column |
| `1Bh` | ESC | Start escape parsing |

Other control bytes have no action in `VTCTL`. At the bottom of the scroll
region, LF deletes its top line. Elsewhere LF moves down
until the screen's last row. A scroll copies rows through `LINEBUF` and
clears the freed bottom row. Console selection and warm boot restore the
region to the whole screen (`src/term.asm:180-234`,
`src/term.asm:844-897`, `src/console.asm:177-179`,
`src/boot.asm:201-209`).

## Escape state and row editing

Output arrives one byte at a time so `ESCST` records the parser's progress.
Zero is ordinary text, 1 follows `ESC`, 2 collects the first number and
3 collects the second. An opening `[` sets the first parameter to zero
and the absent second parameter to `FFh`. Another byte immediately after
`ESC` ends the sequence and is dropped (`src/term.asm:236-266`).

Digits build a byte-sized decimal value, modulo 256. A semicolon starts
the second value at zero. `?` and other intermediate bytes below `40h`
are skipped while parsing continues. A final byte at `40h` or above
ends the sequence and selects an action. An unsupported final byte performs
no action. Skipping a private `?` marker does not prevent a recognised
final action (`src/term.asm:268-351`).

| Sequence | Action |
| --- | --- |
| `ESC [ n A`, `B`, `C`, `D` | Move up, down, right or left n places, with omitted or zero n meaning 1 and movement clipped to the screen |
| `ESC [ r ; c H` or `f` | Position at row r and column c, counted from 1, with missing or zero values meaning 1 |
| `ESC [ J` or any parameter except 2 | Clear from the cursor to the screen's end |
| `ESC [ 2 J` | Clear the screen while retaining the cursor position |
| `ESC [ K` with any parameter | Clear from the cursor to the line's end |
| `ESC [ 0 m`, `ESC [ 7 m` | Normal or reverse video |
| `ESC [ n @`, `ESC [ n P` | Insert blanks or delete characters at the cursor, shifting the remainder of that row |
| `ESC [ t ; b r` | Set the scroll region and home the cursor |
| `ESC [ r` | Restore the full-screen scroll region and home the cursor |
| `ESC [ n L`, `ESC [ n M` | Insert or delete lines within the scroll region and return to the first column |

Movement and insertion/deletion counts use `VTN`, with omitted or zero
counts meaning 1. Cursor moves stop at the screen's edges, not the scroll
region. Positioning clips to the dimensions. The second parameter's `FFh` sentinel also means that an explicit value of 255 uses
its default. A scroll region must fit the screen and contain at least
two rows. Missing or zero bounds mean the first and last rows
(`src/term.asm:361-516`).

The erase actions differ from a full VT100. `ESC [ 1 J` clears forwards
here, as every J parameter except 2 does. K ignores its parameter so
`ESC [ 1 K` and `ESC [ 2 K` also clear forwards. Attribute processing
applies each parameter in turn, changing only 0 and 7
(`src/term.asm:523-590`).

Character insert/delete reads the cursor row into `LINEBUF`, shifts its
cells and writes the row back. Counts are clipped to the cells remaining.
Line insert/delete similarly clips to the rows between the cursor and the
region's bottom. It does nothing outside the region. Insertions copy from
the bottom upwards and deletions from the top down so the source rows
survive until copied (`src/term.asm:602-745`, `src/term.asm:755-897`).

## A historical terminal example

`TERM` exercises that subset: it clears the screen, writes `ABCDEFG`,
positions at row 1 column 3 and clears forwards to leave `AB`. It then
writes `X` at row 5 column 10 and a reverse `R` beside it. Its source is
`test/programs/term.asm`, not a file supplied on the starter card
(`test/programs/term.asm:1-35`). This historical `78127ec` PC recipe used
ATOM from `atom-z80` 0.3.7 and an existing starter-card copy, `con.img`:

```sh
npx atom test/programs/term.asm term.com
node tools/tecvol.mjs put con.img B term.com
```

The retained 80-column PICO screen capture shows the result after exit.
The textual screen extraction omits attributes so the reverse `R` appears
as an ordinary letter:

<!-- node tools/capture.mjs --board pico --screen --card con.img B:TERM -->
```text
AB



         XR

A>
```

With any command tail, such as `B:TERM S`, the program continues with
30 numbered lines, `L00` through `L29`, to exercise scrolling
(`test/programs/term.asm:12-36`).

## Cursor cells and display pages

The cursor is an inversion of the existing cell. `CURFLIP` reads it with
`VGET`, flips bit 7 and writes it with `VPUT`. `VCURV` gates repeated
show and hide operations. `CONIN`'s video wait and an empty public
`CONST` poll request it. Output removes it before processing its byte.
A pending wrap has no drawable cursor cell. Functions 2 and 9 use the
cursor-free status check so their output avoids redrawing the cursor between characters
(`src/term.asm:939-979`, `src/console.asm:210-220`,
`src/console.asm:295-320`, `src/term.asm:49-50`).

The display table contains eight words: six drawing/row routines, the
page-operation routine and a final columns/rows pair. `PIVEC` and `GLVEC`
hold the PICO and GLCD table addresses. The six routines are `VPUT`,
`VGET`, `VCLREOL`, `VREST`, `VRDROW` and `VWRROW`
(`src/video.asm:134-148`, `src/console.asm:165-177`,
`src/ram.asm:359-365`).

The PICO console has two name tables in video memory (VRAM). Page function 0
shows the page already drawn. Functions 1 and 2 begin and end a row move. At the
beginning, `TMSMBEG` selects the hidden destination page and copies across the
rows outside the move. The move reads the shown page and writes the hidden one.
A previous pending move is shown before another begins. Ending a move marks it
complete while `CONST` or `CONIN` shows it with a register-2 update
(`src/pico.asm:198-250`, `src/pico.asm:506-553`, `src/pico.asm:605-666`,
`src/console.asm:230-233`, `src/console.asm:295-298`).

The terminal brackets scrolling and line insert/delete with those page
operations. `VTFN` calls them only for a PICO console without a program
claim. A GLCD table has zero in that seventh slot because it needs no
PICO page operations (`src/term.asm:804-897`, `src/video.asm:91-123`,
`drivers/glcd.asm:39-46`).

## Display registration and claims

At cold boot `TMSINIT` writes `5Ah` and `A5h` to VRAM address `3FFFh`
through ports `BFh` and `BEh` and reads each back. Both must match.
`VIDINIT` then sets `CDTMS` and enters `PISTART`. With the Matrix switch
enabled, `PISTART` copies `PITPL` into the BIOS workspace's `PIBLK`,
sets 40 columns and installs its address in `PIVEC`
(`src/tms.asm:17-48`, `src/video.asm:22-29`, `src/pico.asm:69-92`).
With the switch disabled or a failed probe, serial remains the console.

`TMSW` supports 80, 40 and 32 columns, all with 24 rows. It selects the
register template, name-table address and row-address table for that width.
`PIBLK` also contains the permanent registry-tail record `PICO`, version 3.
A program finds it with `TNFIND`. `CON` changes width through `PICOWID`
at offset 24 in its table. Width changes are rejected while the PICO is
claimed (`src/pico.asm:31-57`, `src/pico.asm:103-196`,
`src/cpm/ccpcmd.asm:161-194`, `src/abi.inc:219-231`).

For an active CRT console, `TMSWID` temporarily sets `CONMOD` to serial
while the IOBYTE still requests CRT. The next console call then copies
the new dimensions and clears the screen. The selected width remains in
the BIOS workspace across warm boot. Bare `CON CRT` and `CON PICO` bypass
the width entry and preserve the selected width and any claim
(`src/cpm/ccpcmd.asm:120-208`, `src/pico.asm:1-21`,
`src/pico.asm:103-122`, `src/console.asm:165-199`).

Normal PICO text at this source pin is light green on black at all three
widths. Four ROM byte values select the palette: the `31h` immediate in
`TMSCOL` and the colour byte in each register template. Colour selection
adds no field to the display table (`src/pico.asm:347-350`,
`src/pico.asm:668-684`). Patterns `80h–FFh` are complements of their
`00h–7Fh` partners, built from the ROM font (`src/pico.asm:291-336`).

The graphics LCD is a loaded service. Its table gives 21 columns and
eight rows on the 128 × 64 display. `INIT` obtains the ROM font, probes
the controller and registers its table through `DRVR`, service 12, with
`B = 3` and `HL` pointing to the table (`drivers/glcd.asm:1-23`,
`drivers/glcd.asm:39-93`). `SVDRV` accepts only UC1 mode 3. Other values
return `TNEBAD` and carry without changing the table. That rejects the
older `PICO.SVC` which used CRT mode 1. PICO's table is now the ROM's
(`src/services.asm:618-627`).

`SVDRV` returns `TNENODV` for a nonzero table passed from a startup line
while the requested IOBYTE field is CRT. The CCP suppresses the error
for that startup absent-device result. A typed `GLCD.SVC`
installation can instead succeed while PICO remains the applied console.
`SVCGO` keeps that mode when `CONMOD` is CRT, otherwise it selects UC1.
A later `CON UC1` can select the loaded table without loading it again
(`src/services.asm:629-647`, `src/cpm/ccp.asm:465-485`,
`src/loader.asm:895-958`).

`VIDHOOK` rejects a nonzero table if the Matrix switch was disabled at
cold boot or a GLCD table is already present. On success it stores `GLVEC` and
returns `HL = LINEBUF`, the row buffer used by the driver. A zero table
pointer removes the hook without those rejection tests
(`src/services.asm:649-658`, `src/video.asm:150-188`).

Removal has two parts. `GLCD.SVC` first finds the PICO record. If it exists
and the requested console is UC1, `REMOVE` changes that request to CRT.
It then drops the UC1 table through `DRVR`. `VIDHOOK` invalidates an
applied UC1 mode by setting `CONMOD` to serial without changing the request.
The next console call can therefore take the available PICO console or
fall back to serial when no PICO request was made. Removing an idle GLCD
while CRT is active leaves PICO and its text in place
(`drivers/glcd.asm:104-129`, `src/video.asm:184-212`).

A program drawing directly on PICO uses `VIDEO`, service 3, to claim it.
`VTOWN` reports a claim only when PICO is also the console. In that case
console output is dropped and cursor and page operations leave the display
alone. A different console can continue while PICO is claimed
(`src/services.asm:211-237`, `src/term.asm:915-929`,
`src/video.asm:110-123`, `src/console.asm:429-437`).

Release and warm boot both enter `HWVREL`. It returns immediately when
there is no claim. After a claim, an installed PICO table supplies the
routine to restore the registers, font and page even if UC1 is the console.
The screen is cleared and homed only when PICO is the console. Without a
PICO table the program's display state remains in place. Warm boot releases
the claim before rebuilding page zero (`src/services.asm:245-279`,
`src/boot.asm:187-195`).
