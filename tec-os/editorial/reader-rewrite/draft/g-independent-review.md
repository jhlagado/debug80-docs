# Independent Appendix G review

Review target: book d65a0be, draft/appendix-g-tec-1g.md and g-pass-record.md.
Mechanism authority: product ea3ef3de9133931e925a0220d51c0e971c1fd8dd.
Original: book10821b6, complete tec-os/appendix-g-tec-1g.md and the assigned
old01:146–147 RAM-chip fragment. Read the closed replacement outline and all
44 destination units with the explicit RAM fragment override. This is a
source and prose review, with no product execution, import, build or test.

## Required corrections

### 1. P2: restore the LCD busy-flag bit number

Draft186–190 omits a lookup fact retained explicitly in original G162–163:
“busy flag, bit 7 of port `04h`”. Neither the new port table nor the LCD
section identifies its bit. This matters in a port/bit reference and contradicts
the pass record's statement that no port/bit/command fields were removed.

At ea3ef3d, src/lcd.asm:35–47 sets B=0 for at most256 polls, reads LCDCMD,
rotates bit7 into carry and exits on carry clear or count expiry. LCDCMD's
port04h definition is at src/lcd.asm:8. LCDC:52–58 writes after the wait
returns, including expiry. The draft correctly explains expiry and must keep it.

Suggested replacement opening: “Before a command or character `LCDWAIT` reads
the busy flag, bit 7 of port `04h`, at most 256 times.” Keep the remaining
readiness/expiry explanation. Record this small restoration in g-pass-record.

### 2. P2: restore INFO's returned register location

Draft230–235 says “`INFO` reports that stored bit without a port read” but
omits original G198's explicit “bit 3 of `B`”. CONDEV's location is present,
but the returned register is a different piece of interface information.

At ea3ef3d, src/boot.asm:88–94 calls RTCHAS and sets CONDEV bit3 on success.
src/services.asm:95–105 loads CONDEV, ORs VCLAIM and executes `ld b,a`.
No RTC port is read there. The existing citation covers the implementation.

Suggested replacement: “`INFO` reports it in bit 3 of `B` without a port read.”
Keep RTC's fresh probe on each valid call and its seven-field order. Update
the preservation disposition in g-pass-record rather than leaving a blanket
claim that every field was retained.

## Cleared factual and evidence scope

All44 assigned units have a destination. The required RAM fragment is present
at146–150. Apart from the two small lookup fields above, no missing assigned
technical substance was found. There are no literal assembly, shell or output
fences in this appendix, so there is no executable-example preservation claim.

Read the full draft and record, full original and relevant complete containing
source passages. Reviewed the port, latch, LCD command, RTC and SD bit tables
against their owning definitions and operations, including callers and exit
paths. Explicit citation ranges were checked semantically, not accepted merely
because a symbol or matching words occurred in the range. Some ranges document
definitions while the surrounding explanation requires their callers, which
were also read. No further incorrect citation endpoint was found.

- Serial: src/console.asm:28–45,253–279,361–421,452–492 supports the queued-input
  trigger contract, discarded keypad-port reads, polling, eight-bit sampling,
  output stop interval and interrupt restoration. These establish ROM operations
  and its documented model interface. The underlying imported Debug80 runtime
  was not independently requalified in this review. No physical paste result
  follows from the model queue. Build timing configuration remains4MHz/4800.
- Shared port01h: src/services.asm:114–146 ORs TXIDLE into each digit select
  and restores idle between digits. Its TONE loop:290–310 toggles80h from
  TXIDLE. No invented simultaneous serial/digit performance is claimed.
- Matrix/PICO: console.asm:57–88 reads the switch bit, not keyboard presence.
  tms.asm:17–48 writes/reads5A/A5 at3FFFh. video.asm:22–29 records a successful
  probe and calls PISTART. pico.asm:64–87 tests CDMTX, starts its80-column table
  and requests CRT while CONMOD remainsTTY until selection. video.asm:150–182
  gates nonzero table registration on the same stored switch. The draft's
  “no console setup after the probe” correctly avoids saying VRAM was untouched.
  No TECCompact/40-column default or new qualification is asserted.
- Startup: ccpcmd.asm:874–900 samples03h bit6 once before opening startup.
  This is distinct from serial bit7 polling. The diagnostics document's stale
  statements that TEC-OS reads only bits0/7 are not copied into the draft.
- Latch/reset: layout.asm:14–45,78–90, reset.asm:1–14 and boot.asm:38–80 support
  the port, shadow, values, overlay jump and cold stack. RSTENT is correctly
  distinguished from the jump atC000h. history.asm:35–74 restores LATCHV before
  POP/RET, with interrupts excluded during bank visibility. sd.asm:525–644,
  653–724 likewise restores the latch before returning. The no-stack statement
  is scoped to the interval with EXPAND1 visible, not the whole routine.
  keyboard.asm:135–142 updates both shadow and port on Caps Lock.
- RAM: boot.asm:579–632 writes both ends before reading them, repeats with
  complementary patterns, checks DETEXP for two regions and enters a serial
  failure loop on failure. The boot stack is fixed below8000h. The source check
  is not an exhaustive physical RAM qualification. The revised paragraph does
  not claim it is one.
- LCD: lcd.asm's bounded wait, command writer, row writer and ownership routines,
  tables.asm:48–52 and services.asm:157–192 support the command/row table and
  complete-row service. Row3 clears CONDEV7 before output. The draft preserves
  the program-text ownership boundary and correctly says a timeout still writes.
- LEDs: test/programs/demo.asm:14–17 defines05/06/F8/F9, with DEMO's scan owning
  those writes. The ROM service distinction and documented single-colour board
  alternative are correctly separated. A host picture is not board evidence.
- RTC: services.asm:443–519 rejects invalid direction before probing, checks
  seconds below60h, transfers seven fields and bounds INFO to stored status.
  Its transfer bodies:540–594 support LSB-first command/data and port bits.
  The below60h heuristic is correctly not promoted to full BCD/date validation.
- SD: sd.asm's SPI bodies, LBAARG:398–438 and read/write entry paths:447–452,
  735–740 support bit mapping, idle05h, standard byte-address conversion and
  pre-command error9. vol.asm:349–385 checks the exclusive end:800000h itself
  is allowed as an end, not as an included standard-card block. The draft
  correctly names last included block7FFFFFh and mount27h. Waits remain bounded.

Board-model comparisons were checked against the retained product documents,
including docs/board-run.md:41–75 and docs/diagnostics.md's T09–T15, device
comparison and NMI procedures. These are documented wiring/requirements and
proposed diagnostic observations, not a supplied physical-board result. The
board's write-only latch, recommended-empty U9, bank-field difference, LED
wiring and keypad NMI setup remain explicitly separated from host behaviour.
No independent external schematic or physical-board qualification is claimed.

The historical cost boundary is correct. At78127ec, docs/diagnostics.md:282–291
records354216 T-states plus678 per token poll. At ea3ef3d, diag/diag.asm:10
includes the diagnostics' own sd.asm, whose SPIR:23–35 and SDREAD:230–270 use
byte loops and stack saves. diag/sd.asm:448–450 explicitly records that cost
as measured on the Debug80 model with no polls. This is distinct from the
product's unrolled bank-switching block loop. Keeping the old documentation
pin is appropriate. It is not a fresh ea3 TEC-OS or physical-board measurement.
T20 records errors/token waits; the separately timed T34 procedure supplies
board timing. The revised text does not claim T20 alone measures elapsed time.

## Editorial, ordering and readback

Read every paragraph/table for purpose, thematic order, deletion, agency and
commas, then read the whole appendix sequentially. Explicit pattern searches
were also reviewed in context. The prepared-board requirements precede lookup;
shared serial constraints precede switch/latch/bank details; device sections
supply actual interfaces. This is appropriate reference ordering rather than a
second first-session tutorial. Noun-phrase headings and short connected
explanations work. The operational contrasts earn their space: model queue
versus physical buffering, switch state versus presence, and diagnostics cost
versus current driver cost affect actual interpretation.

No additional substantive craft finding, authorial Oxford comma, false agency,
hollow recap or mechanical roadmap was found. The final diagnostic sentence
has a concrete evidence purpose. Chapter references name intended final homes;
root integration, current profile qualification and physical-board proof are
outside this source-only review. Correct the two omitted lookup fields and
record those corrections before accepting complete substance preservation.
