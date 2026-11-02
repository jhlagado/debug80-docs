# TEC-OS book: material to salvage from the old book

Old book: `tec-os/*.md` at branch `tec-os-ke75` (0a32a35) in debug80-docs.
New book and code: `book/`, `src/`, `tools/`, `docs/` at tec-os `main` (62d47ed).

Citations are `file:line` at 62d47ed. "Old 03" means `03-the-command-line.md`.

**How the checks were run.** The `dist/` directory in the clone is dated
2026-11-01 and its ROM differs from a build of 62d47ed, so nothing here rests
on it. 62d47ed was exported to a scratch directory, built there with
`npm run build` and `npm run media`, and every example and figure marked
"run" below came from that ROM on the host model. No repository was changed.
That card has no `EDIT.COM`, which affects no figure here.

Branches `tec-os-ks23` and `tec-os-ks20-ks21` were checked: the diff to ke75
only adds, in chapters 3 and 8. Nothing was dropped along the way.

Summary of the result: the new book already holds almost all of old chapters
0 to 6. Eleven facts are missing from existing chapters. Fifteen more belong
in the unwritten Chapters 9 and 10, nearly all from old chapters 7 and 8.

---

## A. Add now to an existing chapter

### A1. COPY: a destination with a type and no name

- **Old:** Old 03, "COPY". "`B:.TXT`, also takes the whole of the source's
  name, type included."
- **Code:** `src/cpm/ccp.asm:987-991` (a blank name takes all 11 bytes of the
  source's). `docs/compatibility.md:83-86` gives `B:.TXT` and `B:.*`.
  `test/copy.test.mjs:77-78`. Run: `COPY README.TXT B:.TXT` makes
  `B:README.TXT`.
- **Destination:** `03-command-line.md`, "COPY, REN and ERA". That section has
  only the drive-alone form, and `17-ccp.md` has one clause on it, without
  the surprise that the typed `.TXT` is ignored.

### A2. COPY: what counts as copying a file onto itself

- **Old:** Old 03, "COPY". `COPY EDIT.COM` with no destination answers
  `COPY?`, and "`COPY A:EDIT.COM EDIT.COM` on drive A is refused too".
- **Code:** `src/cpm/ccp.asm:993-1005` compares all 12 bytes after the current
  drive is filled in. `docs/compatibility.md:87-89`. Run: both forms print
  `COPY?`.
- **Destination:** `03-command-line.md`, "COPY, REN and ERA". It gives one
  form, `COPY README.TXT A:`. Add the two others and the rule: a name with no
  drive means the current drive.

### A3. Overwriting the CCP gains a program nothing

- **Old:** Old 05, "A program's view". The CCP and BDOS "take no space in the
  program area. A program can't gain memory by overwriting them."
- **Code:** `src/rom.asm:24-25` (both in the ROM), `src/ram.asm:1`,
  `docs/compatibility.md:186-187`.
- **Destination:** `07-memory.md`, "The program area and the word at 0006h".
  `16-bdos.md` covers a write to the BDOS's code only. A CP/M programmer
  expects to reclaim about 2 KiB this way, so the fact belongs in Part I.

### A4. With EXPAND 1 in view, the workspace and the top of the program are gone

- **Old:** Old 05, "EXPAND 1". "With EXPAND 1 in view, the BDOS entry and
  TEC-OS's workspace are gone, and so is the top of the program."
- **Code:** `src/layout.asm:18` (the window at `8000h–BFFFh`), `src/ram.asm:6`
  (the workspace, in that window), `src/layout.asm:73`. `src/history.asm:16-18`
  shows TEC-OS itself using no stack while EXPAND 1 is in view.
- **Destination:** `07-memory.md`, "EXPAND 1". It warns only that a write
  damages the cache. The old reason is the stronger one: a program that
  switches the window has lost its own stack, if that is the CCP's, and the
  BDOS, before it writes anything.

### A5. The memory a program can count on, whatever the card

- **Old:** Old 04, "Drives and memory". 46,086 bytes is "the smallest any card
  gives", and "a program that fits in 45,318 bytes runs on any board with any
  card".
- **Code:** the idea holds and the second figure is stale.
  `docs/compatibility.md:179-181`; `src/vol.asm:503` (vectors placed down from
  the workspace). Four drives with 256-byte vectors give `B506h`, 46,086
  bytes; each display driver takes 1,536. Run on a four-drive card: `AF06h`
  with `PICO.DRV`, `A906h` with both drivers.
- **Corrected figures:** 46,086 with no driver, 44,550 with one, 43,014 with
  both. The largest `.COM` file on the last is 43,008 bytes, by the rule in
  `07-memory.md`.
- **Destination:** `07-memory.md`, after the figures for the starter card and
  `my.img`. Chapter 7 gives each case and never the floor.

### A6. What the cache and writing behind buy, in figures

- **Old:** Old 04, "The block cache". A 12 KiB file read a second time is
  "about five times faster"; a 16 KiB `SAVE` "about three times faster".
- **Code:** mechanism at `src/cache.asm`; the ratios still hold. Run on the
  model:

  | Case | T-states | Seconds |
  | --- | ---: | ---: |
  | 12 KiB file, first read | 6,614,890 | 1.65 |
  | The same, second read | 1,316,726 | 0.33 |
  | `SAVE 64`, written through (G8M) | 30,403,985 | 7.60 |
  | `SAVE 64`, written behind (G8M) | 9,691,884 | 2.42 |

  That is 5.0 times and 3.1 times. The read program was a small `.COM` that
  reads records to `0080h`, and the figures include loading it from drive A.
- **Destination:** `04-cards-and-volumes.md`, "The block cache and the volume
  written behind", with the method in `19-block-cache.md`. Chapter 19 gives
  per-record costs, and neither chapter gives a whole-command gain.

### A7. Any assembler will do

- **Old:** Old 06, "Assembling it". "Any assembler that writes a binary for
  origin `0100h` will do, though the syntax of `EQU` lines and strings varies
  between them."
- **Code:** `src/cpm/ccp.asm:19` and `:359-366` (a `.COM` file is read to
  `TPA`, `0100h`, as raw records).
- **Destination:** `06-first-program.md`, "A program that prints". The chapter
  presents ATOM with no mention of an alternative.

### A8. HELLO: the size of the program area in decimal, and PUTDEC

- **Old:** Old 06, "Hello". A program that prints the program area's size, and
  `PUTDEC`, a 16-bit decimal printer of about 20 lines.
- **Code:** run unchanged: 116 bytes, as the old book says, printing
  `Program area: 46854 bytes`. The word it reads is `0006h`
  (`src/boot.asm:218`, `PZINIT`).
- **Destination:** `07-memory.md`, "The program area and the word at 0006h",
  beside `TOP`. The new book's only decimal routine, `DEC` in Chapter 8, stops
  at 99, and a reader who wants the size in bytes must otherwise convert `TOP`'s
  hex. Its leading zeros are a known wart: `PUTDEC` always prints five digits.

### A9. TERM S

- **Old:** Old 02, "The video terminal". "`TERM S` also tests the scroll
  region." This is inaccurate, and the true form is the fact worth having.
- **Code:** `test/programs/term.asm:1-4` and `:12-14`. Any command tail prints
  30 numbered lines, `L00` to `L29`, to scroll the screen. No scroll-region
  sequence is sent. Run: as stated.
- **Destination:** `08-programs-and-console.md`, "The video terminal", where
  `TERM` is described. The only mention in the new book is the `README.TXT`
  line in Chapter 1.

### A10. The console's routines run on the caller's stack and interrupt state

- **Old:** Old 08, "The graphics LCD console". "An interrupt routine must not
  print through the console. A program that pushes anything on its stack
  before calling the BIOS's console output directly should set up a stack of
  its own first."
- **Code:** `docs/rom-services.md:127-130`. It holds for both display drivers,
  not only the GLCD.
- **Destination:** `08-programs-and-console.md`, "The BIOS's console calls".
  `17-ccp.md`, `15-bios-and-console.md` and `07-memory.md` do not state it.
  See also item G3: Chapter 8's own `KEY` breaks the second rule.

### A11. Where the PRL format comes from

- **Old:** Old 08, intro and "The PRL format". Digital Research "defined the
  format for MP/M and CP/M 3", it is in Appendix B of the CP/M 3 Programmer's
  Guide, and a PRL "made by Digital Research's `LINK` with its `[OP]` option
  loads on TEC-OS too".
- **Code:** `src/prl.asm:1-6`, `docs/compatibility.md:116-119`. No test feeds
  the loader a file from LINK-80; `test/prl.test.mjs` makes its files with the repository's own tools. The
  claim rests on the format's match, and the text should not call it tried.
- **Destination:** `21-prl-relocation.md`, "The PRL file". It names Digital
  Research but gives neither the source document nor LINK. This is half of the
  0a32a35 point; see section F.

---

## B. Hold for a planned part

All of these are true of the code in the form given, which often differs from
the old text. The old numbers and names must not be copied across.

### Chapter 9, The hardware services (and Appendix B)

**B1. Calling convention.** Old 07, "Calling a service". Service number in `C`,
status back in `A`, zero set and carry clear on success, `IX`, `IY` and the
alternate registers kept. **Changed:** arguments are in `B`, `DE` and `HL`,
never `A`. Code: `src/hwsvc.asm:1-4`, `:48-76`; `docs/rom-services.md:89-96`.

**B2. Status codes.** Old 07, same section. 0 success, 1 no such service or
argument out of range, 2 device not fitted or not the console. **Codes 3, 4 and
5 are gone.** Code: `src/hwsvc.asm:29-30`, `src/abi.inc`.

**B3. Check first, and carry on without.** Old 07, "The table at FF00h". A
program checks the signature and version, and one that finds no signature is on
another system and carries on without the board's devices. **Changed:** the
major must be 4 exactly. Code: `src/abi.asm:7-8`, `docs/rom-services.md:32-33`,
`:91-96`, `test/programs/demo.asm:29`. `SIZE` in Chapter 8 is a model.

**B4. Safe inside a BDOS call.** Old 07, "Calling a service". "No service calls
the BDOS, so a program can call one from code that runs inside a BDOS call,
such as a hook on the BIOS jump table." Code: `docs/rom-services.md:111-112`,
`src/hwsvc.asm:4-6`. **Changed:** at most 22 bytes of stack, not 16
(`src/hwsvc.asm:5`, `docs/rom-services.md:106-108`).

**B5. The service table.** Old 07, "The services". Nine of the 19 rows survive,
with new numbers and some new names:

| New `C` | Name | Old `C` and name |
| ---: | --- | --- |
| 19 | `INFO` | 0 `INFO` |
| 20 | `DIGIT` | 1 `DIGITS` |
| 21 | `LCD` | 4 `LCDROW` |
| 22 | `VIDEO` | 5 `VIDEO` |
| 23 | `TONE` | 6 `TONE` |
| 24 | `JOY` | 7 `JOY` |
| 25 | `KEYS` | 8 `KEYS` |
| 26 | `PUTAT` | 16 `PUTAT` |
| 27 | `RTC` | 18 `RTC` |

Code: `src/hwsvc.asm:13-27`, `docs/rom-services.md:148-156`. `INFO` now also
reports bit 4, claimed, and bit 7, a word on LCD row 3; bit 2 now means
`GLCD.DRV` is in (`src/hwsvc.asm:34-39`). Destination also Appendix B.

**B6. The LCDMSG example.** Old 07, "A message on the LCD". Writes an LCD row
and beeps, checking the signature first. Run with the numbers changed to 21 and
23, the table to `C003h` and `HWSVC` to `C00Ah`: 79 bytes; the LCD's second row
reads `Hello on the LCD` and the third keeps `B: WORK`, as the old text says.
**Add** the major-version check, which is mandatory now. Code:
`src/hwsvc.asm:109-132`, `:179-196`.

**B7. TONE's pitch, worked.** Old 07, same section. `B = 120` gives about 1 kHz
and `DE = 400` lasts 0.2 s. Still true to the figures given. The formula
16 × `B` + 59 is not exact; see item G1. Code: `src/hwsvc.asm:177-196`.

**B8. Why the digits need a loop.** Old 07, "The digits and the LEDs". The board
lights one digit at a time, so the display looks steady only while the Z80
cycles through them; `DIGIT` makes one pass, about 0.8 ms a digit, then all off,
so a program calls it in its main loop. Code: `src/hwsvc.asm:93-107`,
`docs/rom-services.md:165-166`. **Drop** the LED half: no service drives them
(Appendix G already says so). The new book has no account of multiplexing.

**B9. Claiming the PICO9918.** Old 07, "The PICO9918". After a claim the console
writes nothing there and the program may set any mode and use all the VRAM; a
release, or a warm boot, restores text mode, font and screen and clears it.
`DEMO` claims it for its colour bars and releases on a key. **Changed:** the
restore needs `PICO.DRV` in; with none, nothing is restored. The program reaches
the chip by its ports or `PICO.DRV`'s entries, not `VREG` and its three
siblings. Code: `src/hwsvc.asm:134-174`, `docs/rom-services.md:167-172`,
`test/programs/demo.asm:77`, `:114`. `15-bios-and-console.md` has the mechanism
and no programmer's account.

**B10. PUTAT.** Old 07, "Fast screen output". Writes at a row and column without
moving the cursor or passing the escape parser, status 2 on serial and while
claimed, and a portable program uses it only when it finds the signature. Code:
`src/hwsvc.asm:214-256`. **Add** the figures in `docs/rom-services.md:173-177`:
about 445 T-states a cell against 4,500 on `PICO.DRV` at 80 columns, and within
4 percent on the GLCD. The old "much faster" is true only of the PICO9918.
**Also the true half of a stale claim:** old 02 says `80h–FFh` are the reverse
images of `00h–7Fh`. Through `CONOUT` those bytes are dropped
(`src/term.asm:31-32`, as Chapter 8 says), but `PUTAT` passes bytes straight to
`VPUT` (`src/hwsvc.asm:243-249`), and the drivers draw them reversed
(`drivers/pico.asm:16`, `drivers/glcd.asm:336`). `PUTAT` is therefore how a
program draws reverse characters with no escape sequence.

**B11. The clock.** Old 07, "The clock". Seven BCD bytes in the order seconds,
minutes, hours, date, month, weekday, year; status 2 with no clock; `INFO` bit 3
reports it. Code: `src/hwsvc.asm:258-289`. Appendix G gives the hardware only.

### Chapter 10, PRL programs and drivers

**B12. What resident code is for, and the console-counting hook.** Old 08,
"Residents". Code that stays after its command ends can watch the console or
patch a BIOS entry, and goes on working under other programs. `COUNT.PRL`'s
`INIT` saves `CONOUT`'s target from `(0001h)` + 10 and chains to it, and
`REMOVE` puts it back. **Changed:** it must be a `.DRV`. The same code already
exists in that form as `test/programs/res.asm`, used by
`test/commands.test.mjs:17`, and is the natural worked example for "writing and
installing a small driver". `INIT` must now return `HL = 0` and carry clear
(`test/programs/res.asm:24-26`, `docs/drivers.md:143-146`). The old text's
explanation of the `+ 9 + 1` arithmetic is worth keeping. Chapter 8 gives the
entries' addresses but not the offset of the jump's target.

**B13. Before and after a resident.** Old 08, "Residents". A transcript in which
`HELLO` reports 46,598 bytes with the one-page resident in and 46,854 after
`UNLOAD`. The figures follow for any one-page driver from `src/drv.asm:80-86`,
`docs/drivers.md:234-241`; recapture with `RES.DRV` when writing. Depends on
item A8 if `HELLO` is to be available.

**B14. Loading a PRL at another page.** Old 08, "The PRL format". "The loader
adds `p - 1` to every byte whose bit is set." True of the format, for code made
for `0100h`, and worth stating as what the bitmap is for. TEC-OS's own loader
never does this: `src/prl.asm:5-6`, `:54-57` move the code down one page and
change nothing. The text must say so. Part of the 0a32a35 point; see section F.

**B15. The source's ORG line.** Old 08, "Making a PRL". "The source must contain
the line `ORG $0100` exactly once." Code: `tools/lib/prl.mjs:15-16`. More
exactly: it must exist, indented, in that spelling, or `assembleAt` throws; the
pattern replaces only the first match, so a second one is left at `0100h` and
the two assemblies then disagree. `makeDrv` goes through the same path. Chapter
21 mentions the line and not the requirement.

### Other planned parts

Nothing unique in the old book is left for Chapters 5, 20 and 22 or Appendix D.
Old statements on startup, the LCD's words and the driver loader are stale
(section C), and the old book's error messages are all in Chapters 1, 3 and 4.
Those parts are to be written from `docs/drivers.md` and the source.

---

## C. Stale: not to be carried over

| # | Old file | Claim | Why stale |
| ---: | --- | --- | --- |
| C1 | 02, 05, 07, 08, index | Table at `FF00h`: every `FFxxh` address, major 2, minor 7 | Table is at `C003h`, ABI 4.0, with other offsets (`src/abi.asm:7-19`). The build refuses `FF00h` addresses (`docs/rom-services.md:25-26`) |
| C2 | 07 | Entries only added at the end, so a program runs on every later version | A new major may move entries and renumber services, and 4 isn't frozen (`docs/rom-services.md:32-35`) |
| C3 | 00, 07 | Services `HEXSEG`, `LEDS`, `SERIAL`, `BLOCK`, `DELAY`, `VREG`, `VFILL`, `VWRITE`, `VREAD`, `RANDOM` | Removed; numbers 0 to 18 return status 1 (`src/hwsvc.asm:52-56`, `docs/rom-services.md:159`). The LEDs, segment patterns and random numbers are the program's own (`docs/rom-services.md:200-202`); `SERIAL`'s job is the punch and reader (Chapter 8) |
| C4 | 07 | Arguments in `A`; status 3, 4, 5; 16 bytes of stack | See B1, B2, B4 |
| C5 | 05, 07 | `XMOVE` at `FF12h`, `MOVE` at `FF15h`, the low-mark word at `FF18h` | Reached by BDOS function 50; the mark has no public word (`docs/rom-services.md:57-62`; Chapter 7 has it right) |
| C6 | 01, 02, 05, 08 | `GLCD.PRL`, a resident of 3 pages, 768 bytes; 46,086 with it; `B506h` | `GLCD.DRV`, 6 pages, 1,536 bytes (`docs/console.md:101-103`). The font is the driver's own, so `FF23h` has no successor |
| C7 | 01, 02 | Cold boot picks the console: PICO9918, then GLCD, then serial | The console starts on serial, and `STARTUP.CMD`'s lines move it (`docs/drivers.md:68-80`) |
| C8 | 02 | The burned ROM image sets the PICO9918's width | One image; the width is a startup line, `PICO40.DRV` or `PICO32.DRV` (`README.md:46-49`) |
| C9 | 02 | On a GLCD-only board a missing file shows `GLCD?` | `GLCD?` comes only from `CON UC1` (`src/glcd.asm:50-63`). `STDONE` shows `PICO?`, and only with a PICO9918 (`src/drv.asm:420-431`). Run: nothing on the LCD |
| C10 | 03, 04, 05, 08, index | `CCP`, `EXIT`, nested command processors, shelling out, `FF1Ah`, `FF1Dh`, `UNLOAD` refused when nested, saved state at `BE00h` | No such commands (`src/cpm/ccp.asm:234-262`, `src/data3.asm:22-39`). `BE00h` is free (Chapter 7) |
| C11 | 08 | `TNM` module header, kinds, residents from `.PRL` | Not read (`docs/compatibility.md:120-121`); a `.PRL` is a program and residents are drivers (`src/prl.asm:6`) |
| C12 | 08 | `GLCD.PRL`'s `REMOVE` puts the console on serial; one `FF25h` table | Each mode has its own table, and `GLCD.DRV`'s `REMOVE` returns the console to `CRT:` if `PICO.DRV` is in (`docs/drivers.md:63-65`). Chapter 15 has it right |
| C13 | 01 | SD errors `01h–0Fh`, container checks `20h–2Fh` | The codes in use are `01–08` (`src/sd.asm:10-17`) and `20–2A` (Chapter 1) |
| C14 | 01, 03 | Starter card of 8 files, 994K free | 11 or 12 files now (Chapter 1) |
| C15 | 03 | Built-ins' names "can't be used for programs" | `A:DIR` runs `DIR.COM` (Chapter 3) |
| C16 | 03 | To run a program from another area, "copy it into that area first" | `COPY` works within one user area (`docs/compatibility.md:83`); only `tecvol put --user` crosses areas |
| C17 | 04 | Mounts last until a reset, which restores the card's assignments | A reset keeps them if the volumes match (`docs/recovery.md`, Chapter 4) |
| C18 | 04 | `verify` reports "missing directory entries" | Gaps between entries are legal (`tools/lib/cpmfs.mjs:232`) |
| C19 | 02 | Bytes `80h–FFh` through the console are drawn reversed | Dropped by `VTOUT` (`src/term.asm:31-32`). True only through `PUTAT`; see B10 |
| C20 | 02 | `TERM S` tests the scroll region | It only scrolls; see A9 |

---

## D. True but not verifiable from the TEC-OS repository

**D1. Stepping a program in the Debug80 extension.** Old 06, "Testing in the
browser", and old 00: the extension for VS Code runs the TEC-1G model with a
debugger, and "runs TEC-OS in VS Code". The tec-os repository depends only on
`@jhlagado/debug80-runtime` (`package.json:24`), and a search of
`~/projects/debug80`'s `src/` and `docs/` finds no mention of TEC-OS. The
extension is real; that it boots this 16 KiB ROM was not shown. If it does, the
destination is `06-first-program.md`, which offers no debugger at all. Worth
one trial before adding.

---

## E. Superseded by an equal example

- **E1. `LINES.COM`**, old 06. Teaches what `SHOW` in Chapter 6 teaches: the FCB
  at `005Ch`, the current record, functions 15 and 20, `^Z`, a blank name.
- **E2. `mkprl.mjs`**, old 08. Chapter 21 gives the same call to `makePrl` as a
  one-line `node` command.

---

## F. The 0a32a35 point

Commit 0a32a35 corrected the PRL account to origin `0100h`, Digital Research's
form. **The new book has the substance and two details are missing.**

| Point in 0a32a35 | In the new book |
| --- | --- |
| Code is assembled for origin `0100h` | Yes: `21-prl-relocation.md`, "The PRL file" |
| Word at offset 4, extra memory | Yes: same section, with the note that the loader doesn't read it |
| The code in the file comes from the `0100h` assembly, the bitmap from the differences | Yes: same section |
| A PRL program at `0100h` needs no relocation | Yes: "A PRL program at 0100h" |
| It is Digital Research's format | Partly: named, without the Programmer's Guide or LINK. See A11 |
| A loader adds `p - 1` at page `p` | No. See B14 |

---

## G. Faults noticed on the way

These are outside the salvage, and none is acted on.

- **G1. TONE's constant.** `src/hwsvc.asm:177-178`, `docs/rom-services.md:152` and
  old 07 give 16 × `B` + 59 T-states a half cycle. An instruction count of
  `src/hwsvc.asm:183-193` gives 16 × `B` + 51. On the model, `B = 100` over 2,000
  half cycles took 1,652.7 each, not 1,659. The test at
  `test/hwsvc.test.mjs:119-120` divides a whole call by 20 half cycles, so the
  dispatcher's cost falls into its figure, and its bounds pass either way.
  Chapter 9 should use the corrected constant, after a check.
- **G2. `dist/` is behind.** The clone's `dist/` predates 62d47ed and its ROM
  differs. The book's transcripts should be recaptured after a rebuild.
- **G3. `KEY` in Chapter 8.** It pushes `AF`, calls `HEX`, pushes again and calls
  `DIGIT` before reaching `CONOUT` directly, on the CCP's stack, which breaks
  the rule at `docs/rom-services.md:128-129` that item A10 would state. The
  transcript was taken on serial. Either `KEY` sets a stack of its own or the
  rule needs narrowing.
- **G4. The header comment at `src/term.asm:15-16`** says characters `80h–FFh`
  are reverse images, without saying that `VTOUT` drops them. Chapter 8 and
  `15-bios-and-console.md:257` agree with the code.
- **G5. Chapters' line citations.** Those in Chapter 21 and others name 98c6416
  and no longer match: `LOADCOM` is cited at `src/cpm/ccp.asm:271` and is at
  `:359`, and the call of `PRLGO` at `:208` is at `:292`.
