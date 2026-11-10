---
title: The host model as evidence
parent: TEC-OS
nav_order: 29
nav_group: "Inside TEC-OS"
---

# 29. The host model as evidence

<!-- Source-only mechanisms: TEC-OS a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     Unprefixed source ranges belong to that revision. The six retained
     captures and all their recipes retain TEC-OS 78127ec. The original host
     chapter names @jhlagado/debug80-runtime 0.3.3 for its evidence.
     The same runtime version in the offered package does not repin a run.
     No test, build, import, capture, browser or physical-board run was made.
     Source inventory counts are not passing-test counts. See 28-pass-record.md. -->

A console transcript records bytes from a particular run. It does not by
itself establish what a display drew or what a physical board would do.
TEC-OS's host model supplies several observations of the same execution:
console bytes, serial bytes, display state, memory writes and card bytes.
The observation you choose determines what a result can establish.

## A shared machine

Tests, the web page and the book's capture tool all use `host/machine.mjs`. That
module imports the Debug80 TEC-1G runtime and a byte-string helper without
depending on Node.js. Node supplies file access through the test wrapper while
the browser supplies its own storage and controls (`host/machine.mjs:10-16`,
`test/lib/machine.mjs:3-12`, `web/src/main.mjs:5-12`).

The caller supplies ROM bytes and their symbol map. `symbolsFromD8` turns
the build's D8 symbols into uppercase names and addresses. Input-loop
detection and memory watches use those addresses instead of fixed ROM
offsets. The map must accompany the ROM it describes. Symbol lookup does
not prove that an unrelated map is compatible
(`host/machine.mjs:23-27`, `host/machine.mjs:186-212`,
`host/machine.mjs:240-243`). [Chapter 27](27-build-the-rom-and-media.md)
describes preparing the ROM, media and dependencies.

The constructor exposes the board choices explicitly
(`host/machine.mjs:33-78`):

| Option | Meaning |
| --- | --- |
| `sdImage` | A mutable array of card bytes or no card |
| `highCapacity` | Block addressing when true, standard-card byte addressing when false |
| `tms`, `matrix` | A PICO9918 and an enabled matrix keyboard |
| `glcd` | False makes graphics-LCD reads return FFh, as an absent controller whose busy flag never clears |
| `rtc`, `clock` | Presence of the DS1302 and an optional starting time |
| `ramFill` | The initial RAM byte |
| `windowRam` | False makes reads at 8000h–BFFFh float high and discards writes there |
| `ram96`, `mains`, `expands` | Optional documented MAIN/EXPAND decoding with one or two regions of each kind |
| `onSdWrite` | A callback for card writes |

The runtime supplies the CPU, latch decoding, boot overlay, expansion banks,
keypad, serial timing, LCDs and PICO display. Machine configures RAM at
`0000h–BFFFh`, ROM at `C000h–FFFFh` and entry at zero, then places the 16 KiB
ROM at `C000h`. Its `ram96` option supplies a separate MAIN/EXPAND mapping so a
result must identify which mapping was used (`host/machine.mjs:63-78`,
`host/machine.mjs:143-176`).

The runtime normally emits timed display updates that clear queued LED and
digit scans. Machine disables those updates by setting `updateMs` to
Infinity. Tests and the page read display state directly, avoiding a scan
record that depends on the PC's update timer
(`host/machine.mjs:80-85`). That removes one host-timing dependency, not
every difference between a model and a board.

## Card bytes and time

Machine disables the runtime's automatic SD attachment and connects an
`SdSpi` instance at port `FDh`. A successful model write changes the supplied
array. `swapCard` replaces that instance with another image or an empty
socket. It does not initialise the ROM's card driver or clear TEC-OS's
cached blocks (`host/machine.mjs:59-74`, `host/machine.mjs:122-140`,
`host/machine.mjs:522-526`). [Chapter 6](06-cards-on-the-pc.md) explains
the reset requirement after PC-side card changes.

The range cases in `test/sd-range.test.mjs:36-106` assert separate limits.
In byte-addressed mode the ROM rejects volumes beyond its last addressable
block, `7FFFFFh`. Access beyond the model image returns the card's parameter
error in R1 and the ROM reports SD error 5 without transferring data.
High-capacity mode uses block numbers directly. These are source assertions,
not newly passing tests or measurements of a real card's capacity.
[Chapter 18](18-card-blocks-and-volumes.md) follows the ROM checks.

The DS1302 is attached separately at `FCh`, with the runtime's automatic
RTC attachment disabled. Without a `clock` argument it uses host time.
With a supplied date it advances from that date using emulated cycles at
4 MHz. After a time write it advances from the written value using the
same cycle-based seconds. A halted or slow host therefore does not advance
this supplied clock merely because wall time passed
(`host/machine.mjs:72-119`, `host/machine.mjs:126-137`).

The test fixture starts at 1 January 2026, 12:00. The capture tool starts
at 1 November 2026, 12:00. Record the chosen clock with the other inputs
when reproducing a time-dependent result
(`test/lib/fixtures.mjs:72-73`, `tools/capture.mjs:72`). Times expressed in
T-states are Z80 clock cycles. At 4 MHz one T-state is a quarter of a
microsecond and four million T-states are one emulated second. A host
wall-clock duration is a different measurement.

## Write watches

Machine records attempted CPU writes to `C000h–FFFFh` as `rom-write`
and writes below `0800h` with the overlay active as `overlay-write`.
Each entry in `violations` contains the address and program counter.
Recording happens before the underlying memory hook processes the write
(`host/machine.mjs:215-233`). The watch reports an attempted operation,
not proof that a ROM byte changed.

Ordinary TEC-OS tests assert an empty violations list. At `a1023bd` the tests
of the since-retired diagnostics ROM deliberately exercised ROM and overlay
writes and checked their recorded locations instead
(`test/system.test.mjs:14`, `a1023bd:test/diag.test.mjs:78-90`).
At the inspected source, 29 top-level test files contain violation checks
outside the diagnostics file. This is a source inventory, not 29 passing
test files and not a guarantee about unexercised program paths.

A second watch covers EXPAND 1 after cold boot's clear. Writes to
`8000h–BCFFh` are permitted for the cache's recognised writers. Writes to
the free pages `BE00h–BFFFh` are reported. The history page `BD00h–BDFFh`
is outside that watch because the history ring writes it. The model locates
the clear's end from MEMINIT's first LDIR and identifies writers through
symbols, including the SD block loops, cold-boot cache initialisation and
MVCOPY when called from the cache (`host/machine.mjs:177-225`).

Unexpected writes go into the machine's `expand1Writes`. The first sixteen
also go into the process-wide `EXPAND1_WRITES`. The Node test wrapper has
an after-file assertion that this shared list is empty. Its optional
`TEST_TRACE` log associates writes with test names
(`test/lib/machine.mjs:14-34`). The assertion applies to test files using
that wrapper, not automatically to every caller of Machine.

The source in `test/expand.test.mjs:67-77` deliberately writes `BF80h` with
EXPAND 1 visible and checks that the watch reports it. The test then removes its
intentional entry from the shared list. The model still performs the underlying
write. It adds a report that ordinary board RAM does not provide, rather than
preventing the write (`host/machine.mjs:223-233`). Fixture writes through
`Machine.write` and force-write helpers bypass this CPU-write watch so its scope
must remain explicit (`host/machine.mjs:175`, `host/machine.mjs:237`).

## Console bytes, serial bytes and screens

`step` samples register C when the program counter reaches ROM BCONOUT,
then executes an instruction and adds its cycle count. The sampled bytes
form `output`. Bytes decoded from the emulated serial line form `serial`
(`host/machine.mjs:51-55`, `host/machine.mjs:77`,
`host/machine.mjs:259-267`). Output intercepted by another hook before
BCONOUT and drawing that bypasses BCONOUT are outside that byte record.

These historical `78127ec` captures show why the two byte records differ.
They used the graphics LCD and matrix keyboard with no PICO9918. The
console-byte capture includes the boot and the command after GLCD took
the console:

<!-- node tools/capture.mjs --board glcd CON -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>GLCD.SVC

A>CON
CON: UC1:
A>
```

The serial capture ends at that switch:

<!-- node tools/capture.mjs --board glcd --serial CON -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>GLCD.SVC

```

The retained graphics-LCD screen excerpt contains the later command because
the driver cleared the display when it started:

<!-- the same --screen run's screen -->
```text

A>CON
CON: UC1:
A>
```

PICO `screen` decodes the name table into text rows. Its layout comes from the
display registers unless the caller supplies a width or base. Bit 7 is masked so
reversed cells appear as plain characters. `cell` returns a raw name-table byte.
Neither observation by itself establishes glyph pixels or reverse-video
appearance (`host/machine.mjs:380-410`).

The capture tool's PICO screen option supplies the console width from PIWID so
the offered 40- and 32-column modes decode at those widths rather than the
80-column fallback (`tools/capture.mjs:147-153`). This is a decoder parameter,
not evidence that a new width or font was run.

`glcdScreen` instead matches each six-by-eight pixel cell against
`Machine.font`, including inverted patterns. Unknown patterns become `?`.
The test wrapper and capture script supply the font through the repository's
font parser (`host/machine.mjs:412-450`, `test/lib/machine.mjs:8-10`,
`tools/capture.mjs:43-50`). A decoded string depends on that supplied font.
Matching strings alone do not qualify a new font, display default or editor
layout. The retained captures keep their original configuration.

## Commands and stopping conditions

`runUntil` executes until a predicate holds or a cycle limit is exceeded.
A halted CPU before the predicate also fails the wait. `expect` checks a
console-output pattern only after output grows, then allows bounded settling
time for the last character to reach the display
(`host/machine.mjs:269-321`). An output match is therefore a stopping
condition, not proof of every state change a command should make.

`waitingForInput` recognises named console polling ranges. `ready` additionally
checks that startup has finished and the CCP is reading a command line. The
capture tool combines that state with a prompt suffix and handles `[more]` and
the diagnostic retry prompt separately (`host/machine.mjs:323-342`,
`tools/capture.mjs:76-96`). Program output that resembles a prompt can confuse a
suffix-based wait so a workflow must check the state or persisted result that
distinguishes real completion.

`type` sends serial characters only when the ROM is waiting and waits for
each character's reception. With a video console it uses matrix keys,
holding a key and its modifier until the keyboard scan consumes it, then
releasing it. `enqueueInput` and `pumpInput` provide a nonblocking queue for
the page and capture tool. Unsupported queued matrix characters can fall
back to serial (`host/machine.mjs:354-371`, `host/machine.mjs:453-520`).
This pacing differs from a physical terminal sending characters as typed.

The capture tool accepts ordinary command lines and control-key notation.
Its special inputs include `@key`, `@press`, `@start`, `@run` and `@reset`.
The tool source gives their waits and cycle limits. At the inspected source
it also prints the input card's SHA-256 on stderr. That hash identifies the
starting bytes, not the card after the commands
(`tools/capture.mjs:5-39`, `tools/capture.mjs:67-73`,
`tools/capture.mjs:98-132`). Reproduction needs the ROM, matching symbols,
runtime, card and application inputs as well as the command sequence.

`reset` restarts the CPU and latches while retaining RAM and the card.
`ramImage` copies the currently mapped `0000h–BFFFh` and a selected EXPAND 1
window into a 64 KiB array. `loadRam` restores that layout. They are not
snapshots of every optional MAIN region, device register, CPU register or
pending input (`host/machine.mjs:528-550`, `host/machine.mjs:579-587`).

## A complete pagination fixture

The historical GLCD pagination example used ten lines, longer than its
starter STARTUP.CMD. Its separate card is not needed for Chapter 4's
prepared SAMPLE reading route. The following preparation requires the host
setup from Chapter 6 and the historical prepared media:

```sh
printf 'The graphics LCD has 8 rows of 21 characters.\nA line wider than that goes on in the next row.\nThree\nFour\nFive\nSix\nSeven\nEight\nNine\nTen\n' > lines.txt
cp dist/starter.img long.img
node tools/tecvol.mjs put long.img A lines.txt --text
```

The GLCD has eight rows of 21 characters. TYPE's pager leaves its final row for
`[more]` so this historical first pause follows seven text rows:

<!-- node tools/capture.mjs --card long.img --board glcd --screen "TYPE LINES.TXT" -->
```text
The graphics LCD has
8 rows of 21 characte
rs.
A line wider than tha
t goes on in the next
 row.
Three
[more]
```

Each of the first two file lines occupies three rows. Counting begins with the
listing's first row so the command line has scrolled away by the pause. The next
run supplies `x` to erase the pause prompt and continue:

<!-- node tools/capture.mjs --card long.img --board glcd --screen "TYPE LINES.TXT" "@key x" -->
```text
Four
Five
Six
Seven
Eight
Nine
Ten
[more]
```

At a pause, Ctrl-C, Esc or Q stops the listing. Q is case-insensitive.
Ctrl-C also drops the remaining command chain. Esc and Q stop only the
listing, as Chapter 13's chain rules require. The pager erases `[more]`
before returning. In this final retained run, `q` at the first pause left
the rest of the file unprinted and the new prompt below the erased row:

<!-- node tools/capture.mjs --card long.img --board glcd --screen "TYPE LINES.TXT" "@key q" -->
```text
8 rows of 21 characte
rs.
A line wider than tha
t goes on in the next
 row.
Three

A>
```

The pager's width/height setup and stop paths remain visible in the source
(`src/cpm/ccpfile.asm:279-303`, `src/cpm/ccpfile.asm:390-451`). These literal
screens remain `78127ec` evidence. Source inspection of the same mechanism
does not make them a current screen result.

## Fixtures, assertions and pinned inputs

The package test command selects top-level `test/*.test.mjs` files with
Node's test runner and concurrency set to one (`package.json:18`). A Git-tree
inventory at `a1023bd` contains 59 matching files, from arith.test.mjs through
write.test.mjs. That is a source-only file count. It does not count test cases,
executed files or successful assertions.

`romFor` reads `build/tecos/tecos.rom` and its D8 map. `boot` prepares the
card for the requested display and waits for the first prompt with the fixed
test clock. `withDisplay` preserves an existing STARTUP.CMD. With matrix
input and no PICO it can add GLCD.SVC and startup. With PICO and matrix
input, a width other than the raw cold 40 can add a CON PICO line when
startup is absent. The helper's default width argument remains 80
(`test/lib/fixtures.mjs:21-27`, `test/lib/fixtures.mjs:93-121`).

`program` uses ATOM to assemble `test/programs/NAME.asm` and caches bytes and
symbols under `build/test-programs`. Its key includes the origin and a recursive
digest of the source and included files. A changed included file changes the
key. That key does not include every assembler or runtime dependency so it is
not a complete artifact identity (`test/lib/fixtures.mjs:29-55`). `service`
calls makeSvc for a resident image (`test/lib/fixtures.mjs:75-79`). Chapter 14
describes that file writer.

`standardCard` creates empty SYSTEM on A and WORK on B, with optional extra
volumes. It is not the populated supplied starter. `volume` opens the payload
as a CpmVolume and deliberately passes `readOnly: false`, allowing test setup
to populate it (`test/lib/fixtures.mjs:57-70`). The shared CpmVolume library
also serves tecvol and the page. Its ordinary read rejects references beyond
DSM and its write/erase enforce file attributes unless force is supplied
(`tools/lib/cpmfs.mjs:128-173`, `tools/lib/cpmfs.mjs:175-233`). A fixture's
privileged setup must not be mistaken for a successful protected operation
through the ROM.

TED.COM and TAS.COM are external inputs. `test/inputs.json` records their
repository, full commit, path, byte count and SHA-256. Selection uses an
explicit environment override, then `.inputs/`, then the legacy sibling
path. A selected entry remains authoritative even if broken or stale
(`tools/lib/pins.mjs:10-49`). `npm run inputs` prepares missing pinned files
as described in Chapter 27. A missing test input is skipped unless STRICT=1
makes it fail. A hash mismatch is a failure, not a reason to try another
candidate (`test/lib/inputs.mjs:24-41`, `package.json:19`).

No test in the repository drives a browser. The page's browser tests
moved to the TEC-OS Viewer, which owns the page. Playwright stays pinned
at 1.62.1 so that Chromium can be driven against the local page that
`npm start` serves. The README gives `npx playwright install chromium` for
that browser. The dependency test checks the declared and locked versions and
that documented install (`README.md:73-77`, `package.json:29`,
`test/deps.test.mjs:15-27`). A run record must identify the installed browser
and actual outcome. Dependency declarations alone establish neither.

## The browser as another caller

`npm run web` builds `web/dist` after ROM and media preparation. esbuild
bundles the page with Machine and the container/file libraries into app.js.
The build config aliases fs to a stub, clears the previous output directory
and copies the page, style, one ROM and its symbols, recipe and distribution
files (`web/build.mjs:1-45`). The page recipe adds DEMO.COM to the starter
files. At the inspected source the media tool builds that program from
test/programs/demo.asm (`tools/media.mjs:206-238`). At TEC-OS `12b2ec5` the
page recipe adds DEMO.COM, its source DEMO.ASM and BOUNCE.BAS, twelve files
in all, and DEMO.COM is built from programs/DEMO.ASM
(`12b2ec5:tools/media.mjs:213-252`, `12b2ec5:web/build.mjs:41-42`).

Each animation frame targets 4 MHz for the elapsed wall time, capped at 100 ms.
Every 1,024 instructions it checks a 30 ms execution budget and can stop the
frame early. Rendering reads the runtime's display state and shows the PICO
screen, digits, LEDs, LCD, GLCD, latch, window bank and Caps state. A
once-per-second display reports achieved MHz, not an unconditional 4 MHz
execution rate (`web/src/main.mjs:174-233`). The page supplies no fixed clock so
its DS1302 follows host time (`web/src/main.mjs:82-95`).

Focused video displays route ordinary keys to the matrix queue. The serial
terminal routes them to serial. Unsupported multi-character sequences can use
serial even from a video focus. The page's serial display strips escape
sequences and handles backspace so its text is a presentation of serial bytes
rather than a complete terminal implementation (`web/src/main.mjs:358-427`).

Card writes mark the in-memory card dirty. A two-second timer attempts to
save it in IndexedDB database tecos, store cards, key current. Failed saves
leave it dirty and produce an unsaved notice. A stored image does not include
changes that remain only in the ROM's block cache
(`web/src/main.mjs:92-152`, `web/src/store.mjs:6-8`,
`web/src/store.mjs:42-59`).

Power-on prepares a staged copy of STARTUP.CMD for the selected display and
width, publishing the change only after successful preparation. GLCD uses
GLCD.SVC. Every selected PICO width gets an explicit CON PICO line,
including 80. The page's fallback preference remains 80 columns, distinct
from the ROM's raw cold width of 40. Other display pieces are removed under
the rewrite rules in [Appendix I](appendix-i-web-page.md)
(`host/card.mjs:58-72`, `host/card.mjs:104-117`,
`web/src/main.mjs:17-43`, `src/pico.asm:19-68`). This source account does not
establish a browser run.

File import stages every selected file on a copy. It waits for any older
save, attempts to save the staged card and then copies the bytes into the
running card before reset. Failed persistence normally prevents publication.
When prior storage loading has disabled saving, import can remain in memory
only. Appendix I gives that recovery mode and its notices
(`web/src/main.mjs:144-166`, `web/src/main.mjs:617-649`). The reset clears
TEC-OS's cached blocks and rebuilds its free-space state. A successful Ctrl-C
flush before import preserves changes still pending in that cache. Import
does not perform that flush itself.

## From a model result to a board observation

The historical transcripts and T-state figures are model evidence. The offered
README also records model-only execution (`README.md:27-28`). A source
assertion describes a condition to check. A recorded passing run establishes
that condition only for its actual ROM, runtime, inputs and exercised paths.
A matching code range at a later pin cannot transfer that result to a new
artifact or board.

The runtime sends overlay writes to underlying RAM and permits latch readback.
The board documentation instead selects ROM under the overlay and describes the
latch as write-only. The legacy bank-field decode uses latch bits 3–6. The
retired diagnostics ROM's test asserted its nine window banks plus the base
mapping, which must not be attributed to the documented board
(`a1023bd:test/diag.test.mjs:121-123`). The `ram96` mapping is a separate
configuration, not a repair to every legacy-model result. That ROM's T08,
T10 and T12 probed these differences. TEC-OS avoids overlay writes and latch
reads so checked ordinary paths can satisfy those restrictions on a more
permissive model (`host/machine.mjs:40-46`, `host/machine.mjs:155-172`,
`a1023bd:docs/diagnostics.md:147-164`, `a1023bd:docs/diagnostics.md:187-196`,
`755636b:docs/diagnostics.md:383-399`).

[Chapter 28](28-diagnose-the-machine.md) describes the board diagnostics,
a program that MON3 loads on a physical board. Their host-model test
establishes the program's logic, not a board's behaviour. Each line of a
board log reports whether that board did what TEC-OS relies on, with no
model report to compare against (`755636b:docs/diagnostics.md:15-18`,
`755636b:docs/diagnostics.md:104-127`). The retired ROM's comparison tool,
`tools/diag-check.mjs`, is absent at that source. A board log's line
supports that particular board observation. It does not turn an untested
timing, device or application workflow into physical evidence.
