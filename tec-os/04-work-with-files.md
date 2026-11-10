---
title: Work with files
parent: TEC-OS
nav_order: 4
nav_group: "Using the machine"
---

# 4. Work with files

<!-- Source mechanisms read at TEC-OS a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     Current COPY and pager excerpts: tested 8b8664a7d93c6dc2e8bce509b9770585e106eedc,
     landed 962853f with qualification-record differences only.
     Origo attempt02 e77c7ef0, scoped result receipt 4b5b5a50,
     studies/p3-tec-os/reviews/book-opening-workflows.md.
     The whole batch remains FAILED after a later service-observer defect.
     These excerpts qualify no advanced service, physical, browser or audio case.
     Historical TYPE/COPY/REN/ERA captures remain TEC-OS 78127ec.
     Old03 input pins: TED.COM Thorium 128edb7,
     SHA-256 2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f;
     TAS.COM Thorium dbee66a,
     SHA-256 45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
     Source inspection is separate from each captured result. -->

BANNER.ASM and its saved outputs stay on B while you read other text. A listing
helps you choose the file before a command changes it. Long text can be read
a screenful at a time.

## Names in a listing

`DIR` lists files on the current drive. `DIR B:` lists B without changing the
current drive. Each entry gives a name and a type, such as `BANNER.ASM`. Names
appear in columns fitted to the console. The final line reports the number
listed and the drive's free space in KiB. A KiB is 1,024 bytes.
`NO FILE` means that no visible file matched the request.

A name has up to eight characters followed by a full stop and a type of up to
three characters. Both the full stop and type can be omitted. A drive letter
and colon select a file on another drive: `A:SAMPLE.ASM` names the supplied source
on A. Without that prefix a name refers to the drive in your prompt. DIR is
built into the command processor that reads each line you enter. TAS is a
program stored on the card.

A wildcard lets you narrow a listing without typing every complete name.
`DIR B:*.ASM` lists B's files with type ASM. The `*` matches the rest of the
name or type in which it occurs. `?` matches one character in its position. For
example, `G*.*` matches names beginning with G, whatever their type. TYPE, COPY
and REN each require unambiguous names instead of a wildcard pattern.
[Appendix J](appendix-j-command-reference.md) gives the complete name rules and
wildcard forms.

## Read a text file

`TYPE A:SAMPLE.ASM` prints the supplied source without changing it. TYPE reads
text until its first `^Z` end marker or the end of its recorded contents. It
does not assemble the source or run commands found in a file.

A short file fits before the next prompt. This retained earlier starter-card
session read `STARTUP.CMD`, whose one line was the automatic startup command. It
is a historical example, separate from your BANNER session and the 40-column
screen below:

<!-- node tools/capture.mjs "TYPE STARTUP.CMD" -->
```text
A>TYPE STARTUP.CMD
GLCD.SVC

A>
```

The file's carriage return and line feed end its line. The extra blank line
before the prompt is printed by the command processor. TYPE with a missing file
or no name prints `NO FILE`. A mistyped name therefore gives you a chance to
check the spelling and try again without changing a file.

## Read a screenful

SAMPLE.ASM is longer than one screen. TYPE and DIR pause with `[more]` on the
last row rather than scrolling the whole listing away. A long text line that
wraps at the right edge uses more than one screen row. The prepared 40-column
PICO console shows 23 rows of listing before the pause.

These 24 rows are the complete first paused screen of the source supplied with
the tested build. The command echo has already scrolled away. The release-1
SAMPLE.ASM sets its equates and data in aligned columns with whole-sentence
comments, so its screens differ from these two excerpts row by row:

<!-- Actual retained fixture input: TYPE A:SAMPLE.ASM!USER 1 followed by CR.
     Do not relabel the full fixture as plain TYPE A:SAMPLE.ASM.
     Attempt02 archive member stage/results/098-type-continue.json:
     complete 24-row screen. Companions retain raw VRAM/registers/foreground.
     Later command effects and final prompts are omitted from this excerpt.
     Their chain/user-area meaning belongs in Chapters 13/5. -->
```text
; A first program for TEC-OS. Build it
; with TAS SAMPLE. Run it with SAMPLE.
;
; Say hello through CP/M BDOS, then
; check for the TEC-OS ABI 5 table.
; Print the screen size, write to LCD
; row 2, show 123456 and beep.

; TEC-OS's table and service numbers, by
; the names abi.inc gives them. "TNA",
; then the major version

ABITAB EQU $C003

; the major version this speaks: 5

ABIMAJ EQU $C006

; CALL here with the service in C

ABICALL EQU $C008
TNINFO EQU 0     ; -> L = columns, H =
                 ; rows
[more]
```

Space continues the listing. The pause disappears and the next rows follow. The
next excerpt contains only the first eight rows of the following paused screen.
The remaining rows of that screen and its final `[more]` are omitted:

<!-- Same reviewed continue case, actual Space input 20h.
     stage/results/099-type-continue-1.json, screen rows 1–8 only.
     This is not a new invocation or a return-to-prompt capture. -->
```text
TNDIGIT EQU 1    ; HL -> six digit
                 ; patterns
TNLCD EQU 2      ; B = row 0-3, HL -> 20
                 ; characters
TNTONE EQU 4     ; B = pitch, DE =
                 ; length
BDOS EQU 5       ; CP/M's entry, for the
                 ; console
```

Space continues at each pause until the text ends. Esc, Q or q stops a listing
before its unread remainder. `^C` stops there too. Each of these keys erases
`[more]`.

`^R` at the command prompt marks a hard-to-read line with `#` and reprints
it on a new line. `^E` starts a new screen line while leaving the command
being typed intact. Neither key changes a stored file.

## Copy, rename and selectively erase

COPY makes another file from a source. The destination can give a new name, a
drive or both. With a drive alone, as in `COPY STARTUP.CMD B:`, the copy keeps
the source's name. An existing destination of that name is erased before the
replacement is made. Check the source and destination before copying over work
you need to keep.

A working copy of SAMPLE's source on B gives you a file of your own to read
or edit. `COPY A:SAMPLE.ASM B:SAMPLE.ASM` names both source and destination.
Keep an existing B:SAMPLE.ASM rather than overwriting it for this exercise.

The recorded copy below started at A on a fresh starter card with B empty.
It is separate from the BANNER session. On your working card, BANNER's files
have different names. This command writes only B:SAMPLE.ASM:

<!-- Accepted attempt02 Machine 2, stage/results/009-copy-sample.json,
     screen rows 8–11. Fresh starter card, B initially empty.
     Earlier boot rows and unused rows after the prompt omitted. -->
```text
A>COPY A:SAMPLE.ASM B:SAMPLE.ASM
COPIED 0028

A>
```

The count after `COPIED` is hexadecimal. Here `0028` means 40 records of
128 bytes. The release-1 SAMPLE.ASM is shorter. On the starter card it occupies
4,485 bytes with its line ends and end marker, which is 36 records, `0024`. The source on A remains in place. `TYPE B:SAMPLE.ASM` reads the
new copy without changing the current drive.

REN changes a name on the same drive. Its form is `REN NEW=OLD`, with the new
name first and no spaces around `=`. ERA removes the named file. A rename to an
existing name gives `FILE EXISTS` and changes nothing. Erasing a name that is
absent gives `NO FILE`.

The following complete historical example began on a separate starter card with
B empty. It did not contain BANNER.ASM, BANNER.COM or BANNER.DBG. Read it as
that separate session, not as a sequence to repeat on your current card. It
copies A's STARTUP.CMD under two names, renames one copy and erases only
NOTES.TXT. The listings and free-space figures belong to that card:

<!-- node tools/capture.mjs "COPY STARTUP.CMD B:" "COPY STARTUP.CMD B:COPY.TXT" B: DIR "REN NOTES.TXT=COPY.TXT" "REN NOTES.TXT=STARTUP.CMD" DIR "ERA NOTES.TXT" "ERA NOTES.TXT" DIR -->
```text
A>COPY STARTUP.CMD B:
COPIED 0001

A>COPY STARTUP.CMD B:COPY.TXT
COPIED 0001

A>B:
B>DIR
STARTUP.CMD  COPY.TXT    
2 files, 8168K free
B>REN NOTES.TXT=COPY.TXT
B>REN NOTES.TXT=STARTUP.CMD
FILE EXISTS
B>DIR
STARTUP.CMD  NOTES.TXT   
2 files, 8168K free
B>ERA NOTES.TXT
B>ERA NOTES.TXT
NO FILE
B>DIR
STARTUP.CMD 
1 file, 8172K free
B>
```

`COPIED 0001` reports one 128-byte record copied. The count is hexadecimal:
`000A` means ten 128-byte records (1,280 bytes). It counts copied records rather
than space allocated to the file. Space is allocated in larger units, explained
in [Cards on the PC](06-cards-on-the-pc.md#record-sizes-and-allocated-space).

The first REN made NOTES.TXT from COPY.TXT. The next REN left both files alone
because NOTES.TXT already existed. The first ERA removed NOTES.TXT. The repeated
ERA found no such file. STARTUP.CMD remained on B and the source on A was not
renamed or erased.

On your working card, retain BANNER.ASM, BANNER.COM and BANNER.DBG. Use an exact
name when erasing a disposable copy. A selective pattern such as `*.TXT` is
erased without a confirmation question so it can remove more than one file.
Checking it with DIR first helps you avoid erasing a file you meant to keep. The
all-files erase form and its confirmation grammar are in
[Appendix J](appendix-j-command-reference.md#era).

## Recognise a failed file command

A failed command does not always mean a damaged card. A missing file, a taken
name and an invalid argument have different messages:

| Message | Meaning for these commands |
| --- | --- |
| `NO FILE` | DIR matched no visible file or TYPE, REN or ERA found no file. TYPE with no name gives it too. |
| `FILE EXISTS` | REN's new name already exists. Nothing is renamed. |
| `NAME?` | A command name or argument is invalid or a named program could not be found or loaded. |
| `NO SOURCE` | COPY did not find its source. |
| `CANNOT MAKE DEST` | COPY could not make the destination. An old destination may already have been erased. |
| `WRITE ERROR` | COPY could not write a record and attempted to close the partial destination. |
| `CLOSE ERROR` | COPY could not close the completed copy. |

The word before a question mark can be an argument rather than the command. For
example, TYPE with a wildcard names that invalid argument. COPY instead prints
`COPY?`. The exact grammar and remaining built-ins are listed in Appendix J.
[Appendix D](appendix-d-error-messages.md) gives the complete messages, causes
and recovery actions.

After COPY's `WRITE ERROR`, a successful close preserves the records already
written. The message does not prove that the close succeeded. Check a failed
copy before you depend on it. Keep the source until the copied file has been
checked.

A card-operation failure can instead produce `Bdos Err On`, a drive letter and a
cause such as `Bad Sector`, `Select`, `R/O` or `File R/O`. In the normal command
environment it waits for a key before ending the command. The warm boot restarts
the command processor. Repeating an erase or copy can change more files or
replace an incomplete destination. Keep the card and any recoverable original
while checking the cause in Appendix D. Pending-write failures and recovery are
explained there without assuming that every failed operation was rolled back.
