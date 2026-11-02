# Second editorial pass, chapters 1 to 11: independent check

Compared: `tec-os/01-*.md` to `tec-os/11-*.md` at `9d288de` against `origin/tec-os-book` (`951afaa`). Code read at each chapter's named commit: 98c6416 (chapters 1, 2, 4, 6, 7, 8), 08da4d6 (3, 11), bd15528 (5, 9, 10). Nothing was built or run; each code finding rests on reading the source. Line numbers are those of `951afaa`. "Before" is the text at `9d288de`, "After" the text now.

Differences in KS33 words between chapters are not reported.

## Summary

The pass kept the facts almost everywhere. 152 connectives (`because`, `so`, `since`, `therefore`, `so that`, `which`) appear in inserted text, and 143 hold. Nine don't: T1, T2, T3, T4, T6, T8 and T9 state a relation the code doesn't support, and T10 and T12 attach to the wrong thing. The serious one is chapter 3's `because a read of it fails` (T1). Five further findings are not connectives: a blurred condition, two pronouns, an appositive and a line width. Three more are claims the pass left as they were but that the code doesn't support. The prose now connects well. The commonest remaining weakness is a `, and` that joins two unrelated facts, and the reader stops are listed under Question two.

Structure is sound. Every fence, table, HTML comment and heading is unchanged. No blank line was lost around a fence or table. The only list edit is `and` to `so` at `08-programs-and-console.md:376`, which is correct.

## Question one: truth

### T1. Chapter 3, read failure (high)

- File and line: `03-command-line.md:435-438`
- Before: "It also fails when `NAME.COM` is there but doesn't load. A read of it may fail, or it may be too large for the memory between `0100h` and the BDOS."
- After: "It also fails when `NAME.COM` is there but doesn't load, because a read of it fails or because it is too large for the memory between `0100h` and the BDOS."
- Why: the too-large half is true (`LOADLIM`, `src/cpm/ccp.asm`). The read half isn't. A record that can't be read from the card never returns to `LOADCOM`: `READSEQ` does `CALL BIORDS / OR A / CALL NZ,BADSECT` (`src/cpm/bdos.asm:980-982`), and `BADSECT` prints the message and jumps to `CHDROP`, a warm boot. The result is `Bdos Err On A: Bad Sector`, a key and the prompt, with no `NAME?`, as the chapter's own table says at line 472. Function 20 returns only 0 or 1 at this commit. `LOADCOM`'s `LOADBAD` path handles another value, but `test/chain.test.mjs:225-232` reaches it only by forcing `A = 2` at `LOADEND`. The original's "may" stated the same error less firmly.
- Fix: "It also fails when `NAME.COM` is there but is too large for the memory between `0100h` and the BDOS. A `NAME.COM` that is too large is not passed over for a `NAME.PRL`. A read that fails on the card gives the BDOS's `Bad Sector` message, described below, and no question mark."

### T2. Chapter 4, what costs memory (medium)

- File and line: `04-cards-and-volumes.md:288-289`
- Before: "For each drive that has a volume, the BDOS keeps an allocation vector."
- After: "A volume on a drive costs memory, because the BDOS keeps an allocation vector for each drive that has one."
- Why: the cost belongs to the drive and is fixed at cold boot. Mounting a volume costs nothing, and emptying a drive frees nothing: line 303 says a drive keeps its vector when `MOUNT` empties it, and line 325 gives a vector to each of the N drives "whether a volume is on it at cold boot or not". The new subject contradicts both, and the section title and chapter opening ("what each drive costs in memory").
- Fix: "A drive costs memory, because the BDOS keeps an allocation vector for it."

### T3. Chapter 4, the `-` in `tecvol info` (medium)

- File and line: `04-cards-and-volumes.md:167-168`
- Before: "`GAMES` and `SPARE` have `-` for their drive: TEC-OS puts them on no drive at cold boot."
- After: "`GAMES` and `SPARE` have `-` for their drive, because TEC-OS puts them on no drive at cold boot."
- Why: `tecvol` prints `v.drive ?? "-"` from the descriptor (`tools/tecvol.mjs:112`) and never consults TEC-OS. The colon glossed the meaning. The `because` makes one effect of the descriptor the cause of the other.
- Fix: "`GAMES` and `SPARE` have `-` for their drive: their descriptors name none, so TEC-OS puts them on no drive at cold boot."

### T4. Chapter 7, the word is not the size (medium)

- File and line: `07-memory.md:53-55`
- Before: "CP/M programs read the word to find how much memory they have."
- After: "The memory a program has varies with the card and the drivers, so a CP/M program reads the figure when it runs. The figure is the word at `0006h`, the address in page zero's jump at `0005h`, through which every call to the BDOS goes."
- Why: the amount of memory is not the word. Line 145 of the same chapter gives the size as "the word less `0100h`". "A CP/M program reads" also widens a statement about programs that size themselves to every program, against line 39 of chapter 6 ("may read").
- Fix: "The memory a program has varies with the card and the drivers, so a program that needs to know reads its limit when it runs. The limit is the word at `0006h`, the address in page zero's jump at `0005h`, through which every call to the BDOS goes."

### T5. Chapter 10, `its` on the wrong tool (medium)

- File and line: `10-prl-programs-and-services.md:298-299`
- Before: "It writes the same 111 bytes, where `TAS`'s file is rounded up to the record's 128. `makeSvc`'s output can have the type `.SVC` from the start:"
- After: "It writes the same 111 bytes, where `TAS`'s file is rounded up to the record's 128, and its output can have the type `.SVC` from the start:"
- Why: `its` now reads as `TAS`'s, the nearest owner, which states the opposite of lines 221 to 225.
- Fix: restore "`makeSvc`'s output".

### T6. Chapter 6, a `so` with no cause (medium)

- File and line: `06-first-program.md:129-131`
- Before: "The reset loses any change still in the block cache. A `^C` at the prompt before the copy puts those changes on the card first."
- After: "The reset loses any change still in the block cache, so a `^C` at the prompt before the copy puts those changes on the card first."
- Why: the `^C` writes the cache because it is a warm boot, and the reset's loss has no part in that.
- Fix: restore the two sentences.

### T7. Chapter 1, a condition blurred (low to medium)

- File and line: `01-introduction.md:326-328`
- Before: "The 20 × 4 LCD's last row shows `PICO?` on a board with a PICO9918 and the matrix keyboard if no display driver was installed by the time of the first prompt. That board's screen is dark and it may have no serial terminal attached."
- After: "A board with a PICO9918 and the matrix keyboard has a dark screen if no display driver was installed by the time of the first prompt, and it may have no serial terminal attached. The 20 × 4 LCD's last row then shows `PICO?`."
- Why: `then` follows the terminal clause, so a missing terminal reads as a third condition. `STDONE` (`src/drv.asm:413-424`) tests only the keyboard, the PICO9918 and the absence of a driver.
- Fix: "A board with a PICO9918 and the matrix keyboard has a dark screen if no display driver was installed by the time of the first prompt, and the 20 × 4 LCD's last row then shows `PICO?`. That board may have no serial terminal attached."

### T8. Chapter 5, a `so` over the wrong cause (low)

- File and line: `05-startup-and-services.md:268-270`
- Before: "... a file with `GLCD.SVC` first installs both drivers. The PICO9918 takes the console and programs have 1,536 bytes less:"
- After: "... a file with `GLCD.SVC` first installs both drivers, so the PICO9918 takes the console and programs have 1,536 bytes less:"
- Why: the PICO9918 has the console because `PICO.SVC` takes it whenever it installs (`SVCGO`, `src/glcd.asm:72-76`), and the presence of both drivers has no part in that. "Less" also has no comparison, and line 47's table invites 3,072.
- Fix: "... a file with `GLCD.SVC` first installs both drivers. `PICO.SVC` takes the console whenever it installs, so the PICO9918 has it, and programs have 1,536 bytes less than with the starter card's file:"

### T9. Chapter 2, `because` narrows a board (low)

- File and line: `02-console.md:127-129`
- Before: "The startup file's `GLCD.DRV` line installs nothing while the PICO9918 is the console. So on a board with both displays, `CON UC1` is how the console reaches the graphics LCD."
- After: "On a board with both displays `CON UC1` is how the console reaches the graphics LCD, because the startup file's `GLCD.DRV` line installs nothing while the PICO9918 is the console."
- Why: the cause holds at `drivers/glcd.asm:34-42`, but only if a PICO9918 driver ran first. A startup file with `GLCD.DRV` alone reaches the graphics LCD on that board with no `CON UC1`. The stated `because` makes the unstated condition matter.
- Fix: "On a board with both displays and the starter card's startup file, `CON UC1` is how ..."

### T10. Chapter 8, `which` on the IOBYTE (low)

- File and line: `08-programs-and-console.md:79-81`
- Before: "It came from a call that cleared a display after a change to the IOBYTE. That is the deepest path measured and not a proved worst case."
- After: "It came from a call that cleared a display after a change to the IOBYTE, which is the deepest path measured and not a proved worst case."
- Why: `which` attaches to the IOBYTE, or to the change. The deepest path is the call.
- Fix: restore the two sentences.

### T11. Chapter 7, `them` on banks (low)

- File and line: `07-memory.md:318-320`
- Before: "... separately switched regions of memory that share addresses. TEC-OS has them with CP/M 3's numbers and registers."
- After: "... separately switched regions of memory that share addresses, and TEC-OS has them with CP/M 3's numbers and registers."
- Why: after the join, `them` reads as banks. The calls are meant.
- Fix: "and TEC-OS has both calls with CP/M 3's numbers and registers."

### T12. Chapter 1, `which show` (low)

- File and line: `01-introduction.md:169-171`
- Before: "... the SHA-256 of the card and of the card's `EDIT.COM`. They show whether your card is the one an example was captured from."
- After: "... the SHA-256 of the card and of the card's `EDIT.COM`, which show whether your card is the one an example was captured from."
- Why: the nearest noun is `EDIT.COM`, singular, and the verb is plural.
- Fix: restore the two sentences, with "The two hashes show".

### T13. Chapter 1, the appositive on two nouns (low)

- File and line: `01-introduction.md:94-95`
- Before: "... the tools for building it and the card, the host model, a software TEC-1G, and the web page."
- After: "... the tools for building it and the card, the web page and the host model, a software TEC-1G."
- Why: the appositive now reads as describing the page and the model together.
- Fix: restore the original order.

### T14. Chapter 11, line width (format)

- File and line: `11-chaining-commands.md:128`
- After: a 148-character line, the only prose line in these chapters the pass left unwrapped.
- Fix: rewrap at 80 columns.

### Claims the pass kept that the code doesn't support

These are not faults of the pass, but each sits in a paragraph it rewrote.

- **P1.** `04-cards-and-volumes.md:364-365`, "a block written many times between two flushes reaches the card once". When every line is dirty, one line is written alone and may be written again (`src/cache.asm:238`), as this chapter's own list says at line 356. Fix: add "unless the cache fills between them".
- **P2.** `09-hardware-services.md:236`, "it blanks the row". The code writes five blanks, `PICCLR` (`src/data3.asm:105`), and chapter 5 lines 404 and 409 say so. Fix: "and it blanks the word when a display driver takes the console, but only while the word is there."
- **P3.** `10-prl-programs-and-services.md:420-421`, "a list that the ROM holds". The head is `REGHEAD`, in RAM (`src/ram.asm:234`), and line 421 puts the records in each service's memory. Fix: "a list that TEC-OS keeps".

### Requested tests that pass

- `01-introduction.md:119`, "You can try TEC-OS with no board at all": true. The page runs the same model with the ROM in it. The sentence claims nothing about a clone or a build, and the commands follow.
- `02-console.md:293`, "A long listing would scroll off the screen before you could read it": true. A full 80 × 24 screen takes about 4.4 seconds at 4800 baud with 11 bits a character, and on the graphics LCD eight rows go by far sooner. The `so` states why the count exists, and the count is real.
- `03-command-line.md:509`, "You can bring back an earlier command line and save typing it again": true of lines typed at the prompt, which is all the `because` clause claims. Startup lines are excluded at line 539.
- `07-memory.md:253-255`, the new `therefore` on the restart vectors: supported by `PZINIT` (`src/boot.asm:235-265`).
- `09-hardware-services.md:133-134`, `A` takes no argument: supported, since `HWSVC` does `LD A,C` first (`src/hwsvc.asm:52`).
- `09-hardware-services.md:806`, "`PUTAT` is also faster": both table columns agree.
- `10-prl-programs-and-services.md:358-361`, a warm boot during `INIT`: `src/boot.asm:70-72` clears the busy flag and rebuilds `0005h` from `PZTOP`. The hook that points into free memory follows from that.
- `01-introduction.md:506`, "With no card no block was read, so the bytes are zeros": `BLKBUF` is in the workspace cold boot clears.
- `08-programs-and-console.md:229`, "which leaves `AB`": matches the capture.
- All moved citations remain on their claims. The closest case is `01-introduction.md:252-253`, where "which Chapter 4 describes" now sits on either the header or the container, and Chapter 4 describes both.

## Question two: the reader

Read as someone who knows a Z80 board and is new to the project, the eleven chapters hold together. Each section starts from something wanted, and the chapters hand over cleanly. Chapters 7, 9 and 10 read best. The stops below are the places where this reader goes back a sentence or loses the thread.

### R1. A sentence about text the reader can't see

- File and lines: `03-command-line.md:279-280` and `:536-537`
- Now: "`$'@key n\r'` in the capture command above is the shell's way of writing the keys `n` and Return." and "`$'\x17'` is the shell's way of writing `^W`, and the capture's `@start` line types its keys and a Return together."
- Why: the capture commands are in HTML comments, which don't appear on the rendered page. The first sentence was moved in this pass and now says "above", pointing at nothing visible. This is the hardest stop in chapters 1 to 3.
- Fix: delete both sentences. If the explanation is wanted for someone re-running the capture, put it in the comment. Line 537's next sentence then starts the paragraph: "The history holds 256 bytes of lines, ..."

### R2. Chapter 5, three steps with one missing

- File and line: `05-startup-and-services.md:240-243`
- Now: "... until the board loses power or you mount the other volume back. That needs `MOUNT.COM` on a drive that is mounted. On this card only a loss of power puts `SYSTEM` back on drive A."
- Why: the reader must work out that `MOUNT.COM` is on `SYSTEM` alone, and `SYSTEM` is the volume now off the drives.
- Fix: "That needs `MOUNT.COM` on a drive that is mounted. On this card it is only on `SYSTEM`, so only a loss of power puts `SYSTEM` back on drive A."

### R3. Chapter 5, "at `NAME` alone"

- File and line: `05-startup-and-services.md:417-418`
- Before: "The type must be typed: `NAME` alone looks for `NAME.COM` and then `NAME.PRL`."
- Now: "The command must include the type: at `NAME` alone the CCP searches for `NAME.COM` and then `NAME.PRL`."
- Fix: "The command must include the type, because `NAME` alone makes the CCP search for `NAME.COM` and then `NAME.PRL`."

### R4. Chapter 5, "on the board recovery"

- File and line: `05-startup-and-services.md:338`
- Before: "On the board, recovery needs the serial terminal"
- Now: "So on the board recovery needs the serial terminal"
- Why: with the comma gone, "board recovery" parses as a noun phrase.
- Fix: "So on the board, recovery needs the serial terminal".

### R5. Chapter 1, what survives a reset

- File and line: `01-introduction.md:465-467`
- Now: "One thing survives a reset pressed after TEC-OS has reached a prompt: the drives hold again any other volumes put there while TEC-OS ran, as long as the card still has those volumes."
- Why: "hold again any other volumes" has to be read twice, and the colon promises a thing and delivers a clause.
- Fix: "One thing survives a reset pressed after TEC-OS has reached a prompt: the choice of volumes on the drives. A volume put on a drive while TEC-OS ran is on that drive again after the reset, as long as the card still has it."

### R6. Chapter 1, a stacked sentence at the first T-state

- File and line: `01-introduction.md:399-401`
- Now: "Here it ran on the serial board, the one with only a serial terminal, until a key press stopped it after 50 million T-states, the Z80's clock cycles, which is 12.5 seconds:"
- Why: three appositions in one sentence, one of them the definition of a term used throughout the book.
- Fix: "Here it ran on the serial board, the one with only a serial terminal, until a key press stopped it. The run took 50 million T-states, the Z80's clock cycles, which is 12.5 seconds:"

### R7. Chapter 2, counting for what

- File and line: `02-console.md:183-185`
- Now: "The serial terminal has no size that TEC-OS can read, so the CCP counts lines and columns for 80 columns and 24 rows, which is what most programs written for CP/M use."
- Why: nothing yet says what is counted or why. The `[more]` pause is a hundred lines off.
- Fix: "The serial terminal has no size that TEC-OS can read, so the CCP takes it to be 80 columns by 24 rows, which is what most programs written for CP/M use."

### R8. Chapter 2, "while it waits there"

- File and line: `02-console.md:287-289`
- Now: "The first other key typed during output is kept for the program's next console read, and while it waits there TEC-OS reads no further key."
- Why: "there" has no place to refer to, and "it" could be the program.
- Fix: "The first other key typed during output is kept for the program's next console read, and until the program reads it TEC-OS reads no further key."

### R9. Chapter 2, a join with no relation

- File and line: `02-console.md:279-281`
- Now: "Chapter 3 describes the history of command lines behind `^W` and `^N`, and in a line read by a program they are characters like any other."
- Fix: restore the two sentences, with the fact first: "In a line read by a program, `^W` and `^N` are characters like any other. Chapter 3 describes the history of command lines behind them."

### R10. Chapter 1, the same kind of join

- File and line: `01-introduction.md:168-169`
- Now: "`--card none` boots with the socket empty, and the comment at the top of the script lists the rest."
- Why: "the rest" belongs to all the options, and the join ties it to `--card none`.
- Fix: restore the full stop: "... with the socket empty. The comment at the top of the script lists the rest."

### R11. Chapter 6, "keeps the original as it was"

- File and line: `06-first-program.md:93-94`
- Now: "`tecvol`, from Chapter 4, puts the program on a card image, and a copy of the starter card keeps the original as it was:"
- Fix: "`tecvol`, from Chapter 4, puts the program on a card image. These commands work on a copy, so the starter card stays as it was:"

### R12. Chapter 6, two subjects joined

- File and line: `06-first-program.md:101-103`
- Now: "`book/capture.mjs` boots `work.img` and types the commands, and on a board `tecvol install` from Chapter 4 writes `work.img` to the card."
- Why: "the commands" have not been shown, and the sentence jumps from the model to a board.
- Fix: "`book/capture.mjs` boots `work.img` and types the commands in the transcript below. On a board, `tecvol install` from Chapter 4 writes `work.img` to the card."

### R13. Chapter 4, `put` "fills"

- File and line: `04-cards-and-volumes.md:114-115`
- Now: "`tecvol put` fills the empty volumes, copying a file from the PC onto a volume named by its drive letter or its label, and `tecvol dir` lists a volume."
- Why: `put` copies one file to one volume, and it works on a volume that isn't empty. The participle puts the actual operation second.
- Fix: "`tecvol put` then copies a file from the PC onto a volume, named by its drive letter or its label, and `tecvol dir` lists a volume."

### R14. Chapter 9, `TAS` with no introduction

- File and line: `09-hardware-services.md:192-193`
- Now: "`TAS`, on drive A of the starter card, assembles the program on the board, so `ABI.INC` and `HWLIB.ASM` go on the card beside the source."
- Why: the sentence is the book's first mention of `TAS` in prose. Chapter 6 taught `ATOM`, and the listings in chapters 1 and 3 show no `TAS.COM`, so the reader goes looking for it. The listings differ because the chapters are at different commits, which is known, but the assembler still has to be introduced.
- Fix: "`TAS` is a Z80 assembler that runs on TEC-OS, and the starter card at this chapter's commit has it on drive A. It assembles the program on the board, so `ABI.INC` and `HWLIB.ASM` go on the card beside the source."

### R15. Chapter 9, an apposition adrift

- File and line: `09-hardware-services.md:832-834`
- Now: "... writing their ports itself, as Appendix G describes, a pass of the eight rows in each round of the loop."
- Fix: "... writing their ports itself, one pass of the eight rows in each round of the loop, as Appendix G describes."

### R16. Chapter 10, "with it"

- File and line: `10-prl-programs-and-services.md:637-638`
- Before: "With no `COUNT.SVC` the load fails. With it the two go in and come out last in, first out:"
- Now: "With no `COUNT.SVC` the load fails, and with it the two go in and come out last in, first out:"
- Why: after the join, "with it" first reads as "along with the failure".
- Fix: restore the full stop, with "With `COUNT.SVC` in, the two go in ...".

### R17. Chapter 11, a contrast written as `and`

- File and line: `11-chaining-commands.md:19-20`
- Now: "CP/M 2.2 runs one command per line, and TEC-OS takes these rules from CP/M 3's CCP."
- Fix: "CP/M 2.2 runs one command per line, but TEC-OS takes these rules from CP/M 3's CCP."

### Staccato and tangle

No chapter remains staccato in the sense of the first pass. The runs of short sentences still in the text are reference material in prose form, such as `02-console.md:228-234` and `04-cards-and-volumes.md:145-148`, and they suit their job. Tangling is local, not systematic: R5, R6 and R3 are the three worst sentences. The join most worth watching in later chapters is `, and` between two facts with no relation (R9, R10, R12).

## Counts

- Inserted connectives tested: 152. Faulty: 9 (T1, T2, T3, T4, T6, T8, T9, T10, T12). Sound: 143.
- Truth findings: 14 (1 high, 5 medium, 1 low to medium, 6 low, 1 format).
- Claims kept by the pass and not supported by the code: 3.
- Reader findings: 17.
- Total findings: 34.
- Findings by chapter: 1: 6; 2: 4; 3: 2; 4: 4; 5: 4; 6: 3; 7: 2; 8: 1; 9: 3; 10: 3; 11: 2.
- Lists collapsed: 0. Blank lines lost around a fence or table: 0. Citations moved off their claims: 0.
