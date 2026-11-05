# Appendix G revision record

## Complete reading and allocation

Read the complete original AppendixG, its earlier source-only qualification
and the RAM requirement at old01:146–147. Read the destinationG entries in
the revision ledger and movement-units.json:44 whole units with one explicit
fragment override. The RAM chip requirement moves here while the address-space
lesson remains10. The port/latch/device material is retained throughout.

| Assigned original material | Revised home |
| --- | --- |
| old01:146–147 required chip fragment | Prepared-board paragraph and U9 |
| G opening/front matter and12–23 | Source/evidence scope and prepared board |
| G25–55 port table, model trigger and PICO probe | The ports |
| G57–76 shared output and serial timing | Port01h and the serial line |
| G78–92 status port, switch/document difference | Port03h and the switches |
| G94–122 latch table, overlay, copy and model bank field | The system latch |
| G124–134 installed U9 and RAM check | U9 and the RAM |
| G136–147 keypad/NMI hazard | The hex keypad and its NMI |
| G149–168 LCD ports, commands, bounded wait and rows | The20×4 LCD |
| G170–179 direct LED mapping and board difference | The8×8 LEDs |
| G181–200 RTC port bits, commands, presence and INFO | The DS1302 clock |
| G202–230 SD ports, addressing, waits, bank transfer and diagnostic cost | The SD card adaptor |

There are no executable examples, output fences or capture recipes in the
original or this draft. The existing tables are rewritten for clarity without
removing port/bit/command fields. The354216/678 cost remains explicitly the
historical78127ec diagnostics documentation account, not a new measurement.
No blanket checked-at header upgrades source inspection to physical evidence.

## Source read and own corrections

All current mechanisms use ea3ef3de9133931e925a0220d51c0e971c1fd8dd.
Read layout.asm and lcd.asm completely. Read complete relevant board-run.md
and focused diagnostics.md sections: model-versus-board evidence, T07–T15,
T19/T20/T34 and the device/wiring comparison. These are recorded requirements
and procedures, not a newly supplied physical-board result.

Read owning source paths: CONINIT/Matrix switch, VIDINIT/TMSINIT/PISTART,
DIGIT/TONE and TXIDLE, full serial RXBITS/TXBYTE and poll/queued-input paths,
RSTENT/COLD through banner/card start, full RAMCHK failure path, HGET/HPUT
bank guard and cache transfer contract, keyboard Caps update, RTC read/set,
RTCHAS and byte-transfer routines, GLCD INIT/table, DEMO port definitions,
SD command/transfer routines and container addressing bound. Some paths were
read earlier during complete16/17 review; the owning ranges were revisited.
No code was imported or executed.

Own source review corrected the old unconditional NMI-crash wording to a
possible crash from executing FCB bytes. Matrix enablement is the switch bit,
not a keyboard-response probe. The PICO probe still touches VRAM when no
console is started, so the draft distinguishes console setup from all chip
programming. The ROM jump is atC000h and targetsRSTENT elsewhere in ROM,
not an assertion thatRSTENT itself is atC000h. LCD busy expiry is followed
by a write, not a returned error. RTC's below60h heuristic is not full BCD/date
validation. Mount bound uses last block7FFFFFh and separates direct error9.

Citation endpoint inspection caught and corrected initial table/clock ranges:
LCDSEQ48, LCDROWS51–52, clock probe87–94 and RAM call69–79. The final ranges
are within source files and were matched to the owning statements. Bounds
checking alone is not a semantic or runtime test. External board claims remain
attributed to board documentation as retained by the product's board-run and
diagnostics documents. Their stale service numbers are not copied.

## Actual editorial passes

Drafted the complete reference before trimming. The thematic pass keeps the
port map first, then shared serial constraints, switch input, latch/banks and
each fitted device. The early preparation paragraph supplies the RAM/clock/NMI
requirements without turning the reference into a second first-session lesson.

Read each paragraph with deletion and read-across checks. Removed a sentence
announcing that reasons follow. Kept model-trigger, clock, switch and NMI
qualifications because their removal changes the required setup or evidence
boundary. Device sections end on their specific interface or diagnostic use,
without a concluding recap.

Agency review uses read/write/select/restore for ROM operations. Diagnostic
numbers name procedures and reports, not a claim that an unrun test established
a board fact. Removed optional introductory commas after the Matrix condition
and before LCDWAIT. Read every remaining authorial comma in context, including
all tables. No authorial semicolon, em dash or Oxford comma was introduced.
No code comments or literal output were reformatted as new assembly proof.

Read the whole draft back from title to final diagnostic procedure. Corrected
the reset-address relationship on that read and kept standard-capacity on one
line while wrapping its paragraph. The prose gate reported0 findings before
the final bounded punctuation/address edit. A final gate follows separately.
The mechanical result supplements these reads rather than proving craft.

## Acceptance boundary

The source-only draft is review-ready. Full independent factual/editorial
review, final source/font/profile qualification, navigation and whole-book
reader-order acceptance remain open. Nothing has been published. No assembly,
product import, emulation, build, test or fresh measurement/capture occurred.

Final bounded punctuation/address correction passed the prose gate with0
findings. The complete draft and record pass git diff whitespace checks.
Read the serial poll/RX/TX, transfer range/error and bank-entry/exit bodies
again after the endpoint check rather than relying on endpoints alone.
