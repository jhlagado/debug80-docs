# Review of the editorial pass on Part I (chapters 1 to 11)

Range: `git diff 61372b1 origin/tec-os-book -- tec-os/0*.md tec-os/10-*.md tec-os/11-*.md`. Line numbers are those of the file at `origin/tec-os-book`. Code references are in the TEC-OS repository at the commit the chapter names.

Severity: **high** means a wrong statement or broken rendering, **medium** means a reader can be misled or lose the thread, **low** means a small repair. Origin: **pass** means the edit introduced or worsened it, **earlier** means the text was already so at `61372b1`.

## Summary of what held

- All fenced blocks (transcripts, listings, shell commands) are byte-identical before and after.
- A comparison of every number, code span and chapter or appendix reference found no lost fact. The only changes are counts shifted by rewording (`PICO?` in Chapter 5, `MOUNT` and `VOLS` in Chapter 4, `AREA` in Chapter 10), and each of those was read in place.
- Every caveat about the model and the physical board survives: "has not yet run on a physical TEC-1G", "on the model", "not a proved worst case", the `TAS` stack warning in Chapter 10, the keypad NMI warning, and the prohibition on changing a card on a PC.
- Sentences deleted outright were checked one by one: the "transcript leaves out the boot" lines in Chapter 4 are covered by the style guide's allowance for a transcript that starts at a prompt, and "A drive is the letter...", "The word moves." and "A format 3 file is good under its new name" lose nothing.
- The edits that changed wording toward a firmer claim were checked against the code and are right: `LCD` does not pad, so "a program pads" is correct (`src/hwsvc.asm` `HWSLCD`); the vectors are packed directly below `WSBASE` (`src/vol.asm` `ALVINIT`); a `MOVE` past the word at `0006h` fails as a bank 1 `MOVE` does (`src/xmove.asm`); the `[more]` keys are as listed (`src/cpm/ccp.asm`, `AND $DF` at `PGWAIT`).
- No chapter ends on a recap or a forecast. No changed heading is the target of a link.

## Question one: meaning

### M1. Caps Lock condition detached from the `{` key (high, pass)

File: `tec-os/02-console.md:233-235`

- Before: "With Caps Lock on, the letter keys give capitals, with Shift or without it, and the `{` key gives `[`; the other keys are unchanged."
- After: "With Caps Lock on, the letter keys give capitals, with Shift or without it. The `{` key gives `[`, and the other keys are unchanged."
- Why wrong: the split removes the `{` clause from the "With Caps Lock on" condition, so the sentence states an unconditional fact. It is false: without Caps Lock or Shift the key gives `{`.
- Code (98c6416, `src/console.asm`, `KBALPHA` to `KBUPPER`): the key's code is `7Bh`, and only Shift, or bit 7 of `LATCHV` (Caps Lock), reaches `SUB $20`, which gives `[`.
- Fix: "With Caps Lock on, the letter keys give capitals, with Shift or without it, and the `{` key gives `[`. The other keys are unchanged."

### M2. Warm boot steps in the wrong order (medium, pass)

File: `tec-os/01-introduction.md:385-386`

- Before: "a `^C` typed at the prompt, which ends the CCP and starts it again, writing to the card every change the cache holds."
- After: "a `^C` typed at the prompt, which ends the CCP, starts it again and writes to the card every change the cache holds."
- Why wrong: the participle made no claim of order, but a three-part series reads as a sequence, and that sequence is the reverse of the code. It also disagrees with line 426 of the same chapter ("It writes the cache's changes to the card, starts the CCP again...").
- Code (98c6416, `src/boot.asm`, `WBOOTR`): `CALL CWBOOT` comes before `JP CCPENT`.
- Fix: "which ends the CCP, writes to the card every change the cache holds and starts the CCP again."

### M3. Chapter 8 does not list the BIOS table's entries (medium, pass)

File: `tec-os/10-prl-programs-and-services.md:88`

- Before: "...receives all the console output of a program and of the CCP. Chapter 8 lists the entries."
- After: "The BIOS's table is in RAM, at `BF00h`, and Chapter 8 lists its entries."
- Why wrong: moved beside the table, the sentence now claims the whole table. Chapter 8's table lists `CONST`, `CONIN` and `CONOUT`; the full table is in `tec-os/15-bios-and-console.md`.
- Fix: "The BIOS's table is in RAM, at `BF00h`, and Chapter 15 lists its entries." If Part I should not point into Part II here, use "Chapter 8 lists its console entries."

### M4. `INFO` doesn't test bit 3 (medium, pass)

File: `tec-os/09-hardware-services.md:283`

- Before: "Bit 3 is tested at each call, by reading the clock's seconds, and `INFO` takes about 1,550 T-states as a result."
- After: "`INFO` tests bit 3 at each call by reading the clock's seconds, so it takes about 1,550 T-states."
- Why wrong: giving the passive a subject makes the bit the thing tested. The bit is the result of the test.
- Code (bd15528, `src/hwsvc.asm`, `HWSINFO`): `CALL RTCHAS` reads the clock, and `OR HWBRTC` sets the bit if it answered.
- Fix: "`INFO` sets bit 3 afresh at each call by reading the clock's seconds, so it takes about 1,550 T-states."

### M5. "Its output" points at the wrong tool (medium, pass)

File: `tec-os/10-prl-programs-and-services.md:296-298`

- Before: "It writes the same 111 bytes, where `TAS`'s file is rounded up to the record's 128, and its output can have the type `.SVC` from the start:"
- After: "It writes the same 111 bytes, where `TAS`'s file is rounded up to the record's 128. Its output can have the type `.SVC` from the start:"
- Why wrong: in a new sentence the nearest owner is `TAS`, and the claim is false of `TAS`, which makes a service only for the type `.DRV` (same chapter, line 219).
- Fix: "`makeSvc`'s output can have the type `.SVC` from the start:"

### M6. Two meanings of "it" in one sentence (low, pass)

File: `tec-os/01-introduction.md:27-28`

- Before: "To read a key, print a character, open a file or read 128 bytes of it, the program puts a function number..."
- After: "A program uses it to read a key, print a character, open a file or read 128 bytes of it."
- Why wrong: the first "it" is the interface and the second is the file.
- Fix: "A program uses it to read a key, print a character, open a file or read 128 bytes of the file."

### M7. Moved phrase attaches to "installed" (low, pass)

File: `tec-os/05-startup-and-services.md:348-349`

- Before: "`PICO?` appears once, at the first prompt after startup, on a board with a PICO9918 and a matrix keyboard if no display driver is installed."
- After: "`PICO?` appears once, at the first prompt after startup, if no display driver is installed on a board with a PICO9918 and a matrix keyboard."
- Why wrong: the board was the place the word appears, and it now reads as the place the driver is installed.
- Fix: restore the earlier order, or "On a board with a PICO9918 and a matrix keyboard, `PICO?` appears once, at the first prompt after startup, if no display driver is installed."

## Question two: the reader

### R1. Three-item list collapsed into one bullet (high, pass)

File: `tec-os/05-startup-and-services.md:186-194`

- Before: three bullets, *ordinary exit*, *recognised reset* and *unrecognised reset*.
- After: one bullet, with literal " - " in the running text at lines 188 and 192: "startup file doesn't run. - A *recognised reset* is..."
- Why wrong: the page renders stray dashes and loses the three paths that "TEC-OS restarts by one of three paths:" announces. The bullet count falls from 12 to 10.
- Fix: put each of the three on its own `- ` line, wrapped as before. The only wording change kept is the dropped comma in "the volumes they held and the startup file".

### R2. Blank lines missing around the new sentence (medium, pass)

File: `tec-os/06-first-program.md:163-165`

- Before: heading, blank line, fence.
- After: `## A program that reads a file`, then `This is `SHOW`:`, then the fence, with no blank lines. It is the only such place in Part I.
- Why wrong: a fence that follows a paragraph with no blank line may not start a code block under the site's parser, which would run the listing into the paragraph. No build was run to confirm the rendering.
- Fix: add a blank line after the heading and one before the fence.

### R3. Chapters at different commits contradict one another (high, earlier)

Files: `tec-os/05-startup-and-services.md:53`, `:258`, `:495`; `tec-os/01-introduction.md` throughout; `tec-os/03-command-line.md:127`; `tec-os/06-first-program.md:101`; `tec-os/07-memory.md:117`; `tec-os/08-programs-and-console.md:75`; `tec-os/09-hardware-services.md:193`.

- Text: Chapter 5 says of `PICO.SVC` and `GLCD.SVC` "the two you saw in Chapter 1", and Chapter 1 shows `PICO.DRV` and `GLCD.DRV`. Chapter 5 then says "this ROM doesn't load" `.DRV` files, and Chapters 6, 7, 8 and 11 go on using `.DRV`. Chapter 3 teaches `DRIVERS`, and Chapter 5 teaches `SERVICES`. Chapter 1 names `book/capture.mjs`, and Chapter 5 names `tools/capture.mjs`. Chapter 9 puts `TAS` on the starter card, whose listing in Chapter 1 has no `TAS.COM`.
- Why wrong: each chapter is true of its own commit, but a reader goes through them in order and with one clone. "The two you saw in Chapter 1" is false as printed. The heads don't tell the reader that the names change and change back.
- Code: 98c6416 and 08da4d6 have `DRIVERS` in `src/data3.asm`; bd15528 has `SERVICES` and no `DRIVERS`. `book/capture.mjs` is at 08da4d6, `tools/capture.mjs` is at bd15528, and neither is at 98c6416, the commit named by Chapters 1, 2, 4, 6, 7 and 8.
- Fix: recheck Part I against one commit, the only fix that removes the contradiction. Until then, change Chapter 5:53 to "the two you saw in Chapter 1, under the `.SVC` type this ROM loads", and add a line where Chapter 6 returns to `.DRV`.

### R4. Sentence no longer introduces its transcript (medium, pass)

File: `tec-os/09-hardware-services.md:341`

- Before: "Here it is on the board with only a serial terminal, where the clock is the one device:"
- After: "On the board with only a serial terminal, the clock is the one device:"
- Why wrong: the program's run has dropped out of the sentence, so a claim about the clock is followed by a colon and a transcript of `TAS` and `BOARD`.
- Fix: "On the board with only a serial terminal, where the clock is the one device, `BOARD` prints this:"

### R5. Contrast lost at a split (low, pass)

File: `tec-os/02-console.md:188-189`

- Before: "Keys typed by hand at the prompt are caught, but text pasted into the terminal program, or typed ahead of a busy program, can lose characters."
- After: "Keys typed by hand at the prompt are caught. Text pasted into the terminal program, or typed ahead of a busy program, can lose characters."
- Why wrong: the two sentences are one contrast, and it follows "A byte that arrives while TEC-OS is doing anything else is lost", so the reader needs the turn.
- Fix: restore the "but".

### R6. Opening reads as three "It" sentences with a mismatched verb (low, pass)

File: `tec-os/08-programs-and-console.md:15-20`

- Before: "This chapter describes it as a program uses it: the BDOS's console functions and the BIOS's own console calls beneath them, the control characters and escape sequences TEC-OS acts on when the console is a display, the cursor, the console's size and where a program reads it, and the IOBYTE's other devices..."
- After: "This chapter describes it as a program uses it. It starts with the BDOS's console functions... It then gives the control characters and escape sequences TEC-OS acts on when the console is a display, and the cursor. It ends with..."
- Why wrong: "it" is the console twice and then the chapter, and "gives ... the cursor" doesn't parse as a route step.
- Fix: "This chapter describes it as a program uses it, starting with the BDOS's console functions and the BIOS's own console calls beneath them. It then explains the control characters and escape sequences TEC-OS acts on when the console is a display, and how the cursor is drawn. It ends with..."

### R7. "gives the board" (low, pass)

File: `tec-os/01-introduction.md:174-175`

- Before: "This section describes the board as the code and the repository's documents describe it."
- After: "This section gives the board as the code and the repository's documents describe it."
- Why wrong: "gives the board" has no plain sense. The caveat that this is from the code and documents, not a run, is the sentence's job and should read cleanly.
- Fix: "What follows comes from the code and the repository's documents."

### R8. "The IOBYTE goes with it" (low, pass)

File: `tec-os/02-console.md:49-50`

- Before: "clears page zero, the first 256 bytes of memory, and with it the IOBYTE, so it always starts on `TTY:`."
- After: "clears page zero, the first 256 bytes of memory. The IOBYTE goes with it, so the console always starts on `TTY:`."
- Why wrong: "goes" replaces "clears", so the reader isn't told the byte becomes 0, which is why the console is `TTY:`. Code (98c6416, `src/boot.asm`, `COLDZ`): the `LDIR` zeroes the page.
- Fix: "That sets the IOBYTE to 0, so the console always starts on `TTY:`."

### R9. New gloss for an FCB uses the book's word "record" (low, pass)

File: `tec-os/01-introduction.md:213`

- After: "CP/M's default file control block at `005Ch`, the record of a file name that a program uses."
- Why wrong: *record* is a defined term in the book, the 128-byte unit, and Chapter 5 goes on to separate it from a service's records. Chapter 6:42 glosses the same thing differently.
- Fix: use Chapter 6's words: "the block of memory that names a file for a program."

### R10. `^C` used before its notation is explained (low, earlier)

File: `tec-os/01-introduction.md:366`, `:385`

- Text: "a `^C` typed at the prompt". The notation is explained at `tec-os/02-console.md:228`. The style guide allows that the reader of Chapters 1 to 5 may never have used CP/M.
- Fix: at line 385, "a `^C`, Ctrl and C together, typed at the prompt".

### R11. "ABI" appears a chapter before its definition (low, earlier)

File: `tec-os/08-programs-and-console.md:278`, `:330`

- Text: the listing's comment and its message read "ABI 4". The prose around it says "the table's major version". `tec-os/09-hardware-services.md:49` defines ABI.
- Fix: in the sentence at line 265, "the table's major version, 4, its ABI version".

### R12. "VDP" never explained (low, earlier)

File: `tec-os/10-prl-programs-and-services.md:669`

- Text: "They write a VDP register, fill VRAM and copy between RAM and VRAM." This is the only use in Part I.
- Fix: "They write a register of the PICO9918's video chip, fill VRAM and copy between RAM and VRAM."

### R13. "the signature" not named as such in the prose (low, earlier)

File: `tec-os/09-hardware-services.md:801-802`

- Text: "A portable program uses `PUTAT` only after it has found the signature". The prose calls these "the letters `TNA`" and "the three letters", and only a listing comment says "signature".
- Fix: "only after it has found the table's letters and version".

## Counts

| | High | Medium | Low | Total |
| --- | ---: | ---: | ---: | ---: |
| Meaning | 1 | 4 | 2 | 7 |
| Reader | 2 | 2 | 9 | 13 |
| Total | 3 | 6 | 11 | 20 |

Origin: 15 from the pass, 5 earlier.
