---
title: Make a small program
parent: TEC-OS
nav_order: 2
nav_group: "Part I: Using TEC-OS"
---

# 2. Make a small program

<!-- Source mechanisms inspected at TEC-OS
     962853f499f05faf281f6cdff1deca8959f58c2b.
     Accepted workflow: Origo attempt02 e77c7ef0, Machines 4 and 5,
     phases 043–096, tested source 8b8664a.
     Scoped actual-result receipt: Origo 4b5b5a50,
     studies/p3-tec-os/reviews/book-opening-workflows.md.
     ROM SHA-256 fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d.
     TED.COM Thorium 128edb7, TAS.COM Thorium dbee66a.
     Exact hashes, source proofs and excerpt boundaries: 02-pass-record.md.
     Whole batch FAILED later. This covered host-model workflow qualifies no
     advanced service, physical-board, browser, audio or publication result.
     Historical HELLO evidence is not transferred into this BANNER session. -->

SAMPLE came with its source already on the card. BANNER begins as text you
enter yourself. It prints a greeting, which you can change and build again
with TED's build keys.

## A new source file

The prepared tools are on A and your new file goes on B. Starting at the
`A>` prompt from the first session, `A:TED B:BANNER.ASM` opens TED from A
with BANNER.ASM on B as the file to edit. The two drive prefixes name the
tool and the source separately. Press Return after the command.

For this new file the editing area is empty. TED's last screen row starts
with its name and BANNER.ASM. The `*` marks unsaved work and `L1 C1` gives
the cursor's line and column. The arrow keys move through the text.
Backspace, also written `^H`, removes the character before the cursor.
While TED is open these keys act on the source text.

The following is the complete source to type. Each line ends with Return,
including the blank lines and the final line. Use the two leading spaces on
the instruction lines and retain the comments beginning with `;`. On this
40-column console every source line fits across the screen.

<!-- attempt02 packet/BANNER.initial.asm, complete source.
     CRLF line endings rendered as LF in this fence; all other bytes retained.
     Matrix entry is recorded one line at a time in phases 045–057. -->
```asm
  org $0100

; Print one line to the console.
; Takes nothing. Returns to the CCP.
; Changes AF, BC, DE and HL.

START:
  ld de,MSG      ; Text for BDOS.
  ld c,9         ; $ ends the text.
  call 5
  ret            ; CCP warm boot.

MSG: db "Hello from TEC-OS",13,10,"$"
```

After the last Return the cursor is at `L14 C1`. Blank lines count towards
the line number even though they contain no instructions. Keeping them as
shown makes the error position in the next step match your file.

## A rejected build and its repair

A build turns the source text into the program's bytes. Before the first
successful build, add one deliberate mistake to see how TED returns you to
it. At line 14 type `BROKEN` and press Return. The cursor moves to `L15 C1`.
`^S` saves the text as BANNER.ASM and the status row changes to `Saved`.
Saving text does not establish that it is a valid program.

TED's build keys use a prefix. `^T B` means Ctrl and T together followed by
B with Ctrl released. It saves the source and runs TAS to assemble it. The
following console excerpt is from that rejected build before TED redraws
the editor. The initial screen-clear controls, leading blank line and editor
redraw after the last line are omitted:

<!-- attempt02 stage/results/banner-rejected-console.bin.
     Contiguous console text from the first A>A:TAS through A>A:TED.
     CRLF rendered as lines. The long diagnostic wraps on the 40-column screen. -->
```text
A>A:TAS B:BANNER.ASM
BANNER.ASM:14:1: unknown instruction or directive

A>A:TED
```

TAS reports the source name, line 14 and column 1. `BROKEN` is neither an
instruction nor a directive TAS accepts. No BANNER.COM was created by this
failed build. TED opens the source again at the error and displays
`unknown instruction or directive` on its status row. That message replaces
the usual file position while it is displayed.

Left clears the message and moves the cursor to the end of the preceding
line. The status now reads `L13 C38`. Down moves to the end of `BROKEN` at
`L14 C7`. Six Backspaces remove its six letters. The cursor is then at
`L14 C1` on the extra blank line. `^G` deletes forwards and removes that
extra line too. It supplies the Delete action on the matrix keyboard, which
has no separate Delete key. The source is now the complete listing above.

`^S` saves the repaired text. Wait for `Saved` before `^Q` quits TED and
returns to `A>`. At the empty prompt, `^C` finishes pending card writes.
The successful return to the prompt establishes preservation only if no
write-failure message appeared. `Write lost` means some pending changes
were dropped. Another `^C` cannot recover those changes.

Reopening `A:TED B:BANNER.ASM` reads the saved source. It starts at `L1 C1`
in this session. The deliberate extra line has gone. The save, quit and
reopen distinguish a stored file from text that was only in the editor.

## The first successful run

A Left at the start of the reopened file leaves the cursor at `L1 C1`.
`^T B` now builds the corrected source. TAS writes BANNER.COM and TED opens
again with the source. Its status may show the project name in place of the
cursor position. Left restores the position display at `L1 C1`.

`^T R` performs a build too and then runs the resulting program. This is the
complete console text from the initial run, with the initial clear-screen
controls and leading blank line omitted. The editor has not yet redrawn:

<!-- attempt02 stage/results/BANNER-initial-run-console.bin.
     All text after the initial clear-screen controls and leading CRLF.
     Final Press a key has no following newline in the raw artifact. -->
```text
A>A:TAS B:BANNER.ASM
BANNER.COM written

A>A:TED

A>B:BANNER
Hello from TEC-OS

A>A:TED
Press a key
```

`BANNER.COM written` reports the successful assembly. The greeting is your
program's output. The `A>A:TED` lines are commands used to reopen the editor,
not text printed by BANNER. TED waits at `Press a key` so the result remains
visible. Space returns to the source. Left leaves its cursor at `L1 C1`
and restores the position display for the next edit.

TAS also writes BANNER.DBG beside the source and COM file on B. It contains
information for a debugger. Keep it with the other BANNER files, though this
exercise needs only the source to edit and the COM file to run.

## The printed line

The source you typed contains both instructions and the message they print.
An assembler translates the instructions into bytes the Z80 processor executes.
A semicolon begins a comment for you to read. Comments and blank lines do
not become instructions in BANNER.COM.

`org $0100` places the assembled program at address `0100h`, where TEC-OS
loads and starts a COM program. The dollar prefix in `$0100` is the
assembler's notation for a hexadecimal number. `START:` and `MSG:` are
labels, names for positions in the assembled program. START names the
first instruction and MSG names the message bytes after the instructions.

The Z80 has small storage locations called registers. `C` holds one byte.
`DE` is a pair of registers large enough to hold a memory address.
`ld de,MSG` loads DE with the address of MSG. It does not copy the message
into the registers. `ld c,9` loads C with the number 9. These two values
select the printing operation and locate its text.

The printing operation is a function of the BDOS, TEC-OS's console and file
interface for programs. Function 9 prints the text at the address in DE.
`call 5` calls the BDOS through address `0005h`. When that operation returns,
execution continues at the following instruction. The final `ret` ends
BANNER and returns through TEC-OS to the command processor, the CCP that
runs your typed commands. Its warm boot returns to a command prompt.

`db` places literal bytes in the program. The quoted greeting supplies its
character bytes. The following 13 and 10 are a carriage return and line
feed to end the displayed line. Function 9 stops at the `$` byte, which it
does not print. Here `"$"` is a character in the data, separate from the
hexadecimal notation in `$0100`. Keep the quotes and the final `,13,10,"$"`
when you change the greeting.

BDOS calls may change registers. BANNER goes straight from printing to its
final return and uses none of the earlier register values.

## A changed greeting

From `L1 C1`, twelve Down presses reach `L13 C1`, the MSG line. Twenty-six
Right presses move to `L13 C27`, just before the quote after TEC-OS. Typing
`!` inserts it inside the quoted greeting. The cursor moves to `L13 C28`
and the `*` returns. Only this line changes:

<!-- attempt02 packet/BANNER.edited.asm, final source line only. -->
```asm
MSG: db "Hello from TEC-OS!",13,10,"$"
```

`^S` saves the change. Left clears `Saved` and moves to `L13 C27`.
`^T B` builds it. To restore the position display afterwards, Left moves to
`L13 C26` and Right returns to `L13 C27`. These arrows move within the
source without changing its text.

`^T R` builds and runs the changed program. This separate run has the new
greeting. As before, the initial clear-screen controls and leading blank
line are omitted:

<!-- attempt02 stage/results/BANNER-edited-run-console.bin.
     All text after the initial clear-screen controls and leading CRLF.
     This is not combined with the initial run. -->
```text
A>A:TAS B:BANNER.ASM
BANNER.COM written

A>A:TED

A>B:BANNER
Hello from TEC-OS!

A>A:TED
Press a key
```

Space returns to TED. Left then Right restores the displayed `L13 C27`
position. The extra exclamation mark is in both the saved source and the
rebuilt program. Saving alone would have left the earlier COM unchanged.

## Saved source and the standalone program

`^Q` quits the editor. At `A>`, `^C` completes pending writes before a reset
or removal. Wait for its successful return to the prompt. A write-failure
message has the same consequence as in the earlier save: the prompt alone
does not prove the file was preserved.

In the reviewed host-model session, the preserved card was reopened on a
fresh machine with new RAM. `A:TED B:BANNER.ASM` reopened the edited source,
including its exclamation mark. The text therefore came from the saved
file, not from the previous editor's memory. Left restored the position
display and twelve Down presses reached its MSG line at `L13 C1`.

After `^Q` and a successful empty-prompt `^C`, `B:BANNER` runs the program
from B while A remains current. It does not open TED or assemble the source.
The final screen excerpt omits the earlier startup and editor display,
retaining the quit's preservation step, standalone run and final `^C`:

<!-- attempt02 Machine 5, 096-BANNER-final-flush.json, screen rows 2–7.
     Earlier boot/editor display omitted. No intervening text omitted here. -->
```text
A>^C
A>B:BANNER
Hello from TEC-OS!

A>^C
A>
```

Running the COM leaves BANNER.ASM available for your next edit.
