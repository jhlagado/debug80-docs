---
title: Make a small program
parent: TEC-OS
nav_order: 2
nav_group: "Using the machine"
---

# 2. Make a small program

<!-- Source mechanisms inspected at TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     Accepted workflow: Origo attempt02 e77c7ef0, Machines 4 and 5,
     phases 043–096, tested source 8b8664a.
     Scoped actual-result receipt: Origo 4b5b5a50,
     studies/p3-tec-os/reviews/book-opening-workflows.md.
     ROM SHA-256 fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d.
     TED.COM Thorium 128edb7, TAS.COM Thorium dbee66a.
     Exact hashes, source proofs and excerpt boundaries: 02-pass-record.md.
     Whole batch FAILED later. This covered host-model workflow qualifies no
     advanced service, physical-board, browser, audio or publication result.
     Historical HELLO evidence is not transferred into this BANNER session.
     Release card: TED.COM Thorium 967678c (SHA-256 150a19bd…, TEC-OS
     755636b test/inputs.json), whose language table builds an .ASM with
     TAS NAME.ASM as before (Thorium README at 967678c). The captures below
     keep TED 128edb7 and were not rerun with it. At TEC-OS 31b6083 the
     card's TED.COM is Thorium b69d544 (4f622390…), with the same keys.
     At TEC-OS 55114e4dfb234c81da73aea7e2e2ccaaf873b80e the card's TAS.COM
     is Thorium 3d1e2c0 (e648a1d0…, 10,343 bytes; test/inputs.json:4-13,
     docs/compatibility.md:199). The BANNER captures keep TAS dbee66a and
     were not rerun with it. "Several statements on a line" follows Thorium
     3d1e2c0 docs/language.md:55-84 and :124, the CHAIN.ASM listing is
     Thorium 3d1e2c0 demo/chain/chain.asm lines 9-19, and CHAIN's build and
     run are TEC-OS 55114e4 test/starter.test.mjs:337-390. -->

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

A semicolon begins a comment for you to read. Comments and blank lines do
not become instructions in BANNER.COM.

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
B with Ctrl released. For an `.ASM` file it saves the source and runs TAS to
assemble it. Chapter 3 uses the same keys on a BASIC source, which TED builds
with BAZA. The
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

`^T B` now builds the corrected source. TAS writes BANNER.COM and TED opens
again with the source.

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
visible. Space returns to the source at `L1 C1`.

TAS also writes BANNER.DBG beside the source and COM file on B. It contains
information for a debugger. Keep it with the other BANNER files, though this
exercise needs only the source to edit and the COM file to run.

## The printed line

The source you typed contains both instructions and the message they print.
An assembler translates the instructions into bytes the Z80 processor executes.

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

## Several statements on a line

BANNER has one instruction on each line. TAS also takes several statements
on one line, with a backslash, `\`, between them. `CHAIN.ASM` on A is
written that way. Its main part is:

```asm
START:
  ld b,5 \ ld c,'1'             ; count five lines, numbered from 1

LINE:
  push bc \ ld de,TEXT          ; keep the count, point at "LINE "
  ld c,PRINT \ call BDOS        ; print it
  pop bc \ push bc \ ld e,c     ; take the line's digit
  ld c,CONOUT \ call BDOS       ; print it
  ld de,CRLF \ ld c,PRINT       ; point at CR LF
  call BDOS \ pop bc            ; end the line, get the count back
  inc c \ djnz LINE \ ret       ; the next line, or back to the CCP
```

Each `\` ends one statement and starts the next, so the first line of the
loop is `push bc` followed by `ld de,TEXT`. A label stands alone on its
line, as `START:` and `LINE:` do here, or begins the line. A label or an
`EQU` cannot follow a `\`. A comment still runs from the semicolon to the end
of the line, and here it describes the whole line's step rather than each
instruction. Inside quotes a backslash is still an escape, as in `'\\'`
for the backslash character, and does not separate statements.

The layout changes only the source. `TAS CHAIN` writes the same 43 bytes
that the instructions written one to a line would give, and `CHAIN` prints
`LINE 1` to `LINE 5`. Either layout is accepted. The recommended one keeps
labels on their own lines and at most three statements on a line, each line
with its comment.

A line's code, before its comment, can be at most 128 characters long,
blanks included. A longer line is rejected, normally as `line too long` at
column 129, whether it holds one statement or several. A line much longer
than that can be cut by TAS's source window first and then gives the error of
its cut text, but it is rejected either way. A comment may be any length.

## A changed greeting

A status message can replace TED's position display. An arrow restores it
and also moves the cursor normally. Left at the start of the file leaves
the cursor at `L1 C1`.

From `L1 C1`, twelve Down presses reach `L13 C1`, the MSG line. Twenty-six
Right presses move to `L13 C27`, just before the quote after TEC-OS. Typing
`!` inserts it inside the quoted greeting. The cursor moves to `L13 C28`
and the `*` returns. Only this line changes:

<!-- attempt02 packet/BANNER.edited.asm, final source line only. -->
```asm
MSG: db "Hello from TEC-OS!",13,10,"$"
```

`^S` saves the change and `^T B` builds it.

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

Space returns to TED. The extra exclamation mark is in both the saved source
and the rebuilt program. Saving alone would have left the earlier COM unchanged.

## Saved source and the standalone program

`^Q` quits the editor. At `A>`, `^C` completes pending writes before a reset
or removal. Wait for its successful return to the prompt. A write-failure
message has the same consequence as in the earlier save: the prompt alone
does not prove the file was preserved.

In the reviewed host-model session, the preserved card was reopened on a
fresh machine with new RAM. `A:TED B:BANNER.ASM` reopened the edited source,
including its exclamation mark. The text therefore came from the saved
file, not from the previous editor's memory. Twelve Down presses reached
its MSG line at `L13 C1`.

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
