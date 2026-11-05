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

## Independent preservation corrections

The complete independent44-unit/one-fragment review identified two omitted
lookup fields. Restored busyflagbit7 ofport04h in the LCD section and the
returned RTC-presence location, INFO bit3 ofB. The lead reread LCDWAIT35–47
and HWSINFO95–105, already in the source proofs, before restoring them. The
first preservation claim was too broad without these fields. All remaining
source, table, evidence and craft checks were clear in the full review.
Bounded confirmation remains pending. No execution accompanied correction.

## Receiver source adoption at book 9ba1f59

This section supersedes the earlier current-source and pending-default
statements in this record. Earlier readings and measurements retain their
original provenance. The reader now uses TEC-OS
`962853f499f05faf281f6cdff1deca8959f58c2b` for current mechanisms. All six owned
chapters and their existing records were read completely before editing. The
impact inventory and confirmation cover 35 contexts, 29 proof spans and nine
historical exceptions. Their source and reader scopes were read alongside the
actual ea3ef3d-to-962853f code changes.

Port and latch definitions, Matrix switch sampling, probe/console separation,
LCD busy bit and bounded writes, RTC heuristic and INFO bit 3, SD address bounds
and no-stack bank loops were checked in their owning routines. Board/model
differences and diagnostic cost remain attributed evidence rather than physical
results.

Current source proof: `src/console.asm:57-88` samples the Matrix switch.
`src/tms.asm:17-48` and `src/video.asm:22-29` gate PISTART on the VRAM probe.
`src/pico.asm:36-92` sets PIDEFLT to 40 and installs the console only with CDMTX
set. `src/pico.asm:94-196` accepts explicit 80/40/32 widths and rejects a claim.
`src/cpm/ccpcmd.asm:120-208` bypasses that entry for bare selectors.
`src/console.asm:165-199` preserves a claimed PICO display during selection.
`src/boot.asm:178-215` and `src/ram.asm:359-365` preserve the width over warm
boot.

PICO remains record version 3 (`src/abi.inc:219-243`). The selected font retains
96 glyphs of eight rows with five pixel bits at 7–3 (`tools/lib/font.mjs:9-43`).
Six-pixel display cells do not change that encoding. Native 16020 used/364 free
already appears at ea3ef3d in `docs/memory-map.md:22-30`. No font-growth or
historical-map equality claim follows. The accepted offer retains these exact
artifact identities:

- ROM SHA-256: `fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d`.
- D8 SHA-256: `9a87dec39a63efc8fdf38ae13d6ec6299763c833fc891de121e2b30f4a1a36ac`.

Selection authority is P3 proposal 18 / Origo 43d5f328, mechanism source 962853f
and tested source 8b8664a. Opening workflow receipt 4b5b5a50 and the closed
d9d57d2/b911e84 reviews remain scoped acceptance. No local execution supplies a
new artifact or example result.

Citation coverage: 53 incoming unprefixed file/range occurrences; 53 final
occurrences. Every incoming occurrence was checked in its complete reader
passage against the owning source and relevant callers. The table lists all
final range identities. Identical bytes establish source identity only.
Historical examples remain historical even when their program source is
unchanged.

| Source at 962853f | Inspected ranges | Complete file SHA-256 |
| --- | --- | --- |
| `src/boot.asm` | 38–58, 69–79, 87–94, 566–636 | `babbd9b2137a60c0fa0fec1cb461d7cd311d7e785413fcd88500c9cb6b9e5428` |
| `src/cache.asm` | 18–26 | `e97a1b16ebae2a6710d7e78972590a141708e6e5c6ebb195d25c45d409c1e09b` |
| `src/console.asm` | 28–45, 82–88, 253–279, 361–377, 361–421, 387–421, 452–492 | `988297527d3be3859f389b0cbdb48ada68d85487d18e65bd12f1df4524ac4ab2` |
| `src/cpm/ccpcmd.asm` | 883–887 | `6c16f68385d13cb371f397fa48b0b868e1cfe627d70a412ffed85ac53e0ca86d` |
| `src/history.asm` | 25–75 | `20892e35788463e132cf20685406a540d2293d4955133508466f54db391f12c7` |
| `src/keyboard.asm` | 15–28 | `133d25f87d2b388e47ee9f09a4225ccd1960e4727a38af207ba467e3d2d570f2` |
| `src/layout.asm` | 13–26, 21–24, 25–42, 78–90 | `10aa9ee6cc80be14363ca61aa71eac4ac90839ea3c62147199eb201188a542fa` |
| `src/lcd.asm` | 7–11, 18–28, 35–61, 128–160 | `99b63f5d153e2e052cbd2e445a97d9f3bda641e2d37c32d3b7083efee2c79c77` |
| `src/pico.asm` | 69–73, 69–92 | `c72090deca38228a1fa94b9dce912b97cf50b7b90c179e3ac8a2a2741f9131a4` |
| `src/reset.asm` | 1–14 | `48ace55415f22e531574dfb999df57934fe12a678a2e9c9aaa732fbf56e7cfe5` |
| `src/sd.asm` | 1–11, 40–106, 398–438, 447–452, 525–541, 632–659, 715–724, 735–740 | `8b9545476d16c2a84f8135c7b1bbfe405e0cf34497a7d232de5f3c0c95582f49` |
| `src/services.asm` | 25–29, 31–35, 95–105, 114–149, 157–192, 289–310, 441–499, 501–526, 533–594 | `ef737171462184d5716bbb2a1d3dd879ce8c0d46cd609974a9effdfc70ae8a5b` |
| `src/tables.asm` | 48–52, 51–52 | `a2a326ed74a01f28bd0b6a25a15c48847de786d02dc2b434c23aa28e8cc1e3da` |
| `src/tms.asm` | 17–48 | `e3f4eec122f4ae9fb378d9f26c6996280793f474345fef2d504202990b51ec50` |
| `src/video.asm` | 22–29, 150–182 | `984df3e6d1fdb7f865586c9e4a9c4690cf9300fe7df226c0450c71fbab8ef560` |
| `src/vol.asm` | 349–385 | `f9fdf15b2080776230524cb9f5d22218c01f1c3438f1246ef2bcdc10eef38cd8` |
| `test/programs/demo.asm` | 14–17 | `328e3ee35787eb96c1544209550bd2d2f8fdcdb7bca80d04699abaa981f1a657` |
| `tools/build.mjs` | 26–27, 38–77 | `fccb013b93d4f6bff359cb7302aed1b027e6fd88983b9f44463ae3f5292887a9` |

Protected readback: 0 complete fences and 0 command comments match the
pre-adoption reader byte for byte. All explicit historical pins, 64-digit hashes
and link destinations are unchanged. Historical measurements, map addresses and
output were not repinned or regenerated.

The thematic pass keeps the existing operator/reference route. The deletion pass
removes the obsolete current-80 premise while retaining historical-80
explanations. The agency pass uses the actual switch, probe and handler
conditions. Each changed paragraph and its neighbours were read again after
editing. Every comma in those paragraphs was checked for its grammatical job.
The width enumeration commas separate values. The host-default comma, where
present, separates its explanatory qualification. No optional conjunction comma
was introduced. No listing, recipe or screen was rewritten.

Editorial input SHA-256:
`28addf1915720cfe8e9eb1a013c6aa3fba956e7342d4969f2116b36aaf54e290`. Final
reader SHA-256:
`0fa220119b5e8fe009b28f7f200db7c4c2f7aaf90959460ee4e7d72f8a11d843`. Pre-append
record SHA-256:
`52fbc0464b28b3962bd7af5daf9ac7a8c4c971bb3e74356f49d266193ae4d07e`. Actual
prose gate: zero findings in all six readers. The existing record findings are
Chapter 15 lines 104 and 176, HW008: both quoted uses of `source offer` name the
proposed source revision rather than an intentional actor. Retain the historical
wording with this disposition. No hard finding occurred.

Sentence-complexity prompts below were read in their containing paragraphs.
Short mechanism statements and navigation sentences remain connected to their
explanations. Numbered-list fragments are parser segmentation, not new prose
fragments. Repeated defined terms preserve exact relations. Longer sentences
retain their required conditions or ordered operations. Each prompt is retained
for the case recorded here rather than automatically shortened.

| Reader input line | Prompt | Sentence readback | Disposition |
| ---: | --- | --- | --- |
| 22 | LONG(33) | For the prepared board, fit a 32 KiB RAM chip in U9, set the CPU clock to FAST with the 4 MHz oscillator and leave the hex-keypad non-maskable interrupt (NMI) jumper off. | Retain necessary condition or ordered operations. |
| 65 | SHORT(6) | Chapter 11 gives their calling interface. | Retain direct fact in its explanatory paragraph. |
| 79 | SHORT(6) | There is no hardware receive buffer. | Retain direct fact in its explanatory paragraph. |
| 87 | SHORT(6) | TEC-OS reads these three input bits: | Retain direct fact in its explanatory paragraph. |
| 95 | SHORT(5) | CODE records bit 0 directly. | Retain direct fact in its explanatory paragraph. |
| 123 | SHORT(6) | At reset the latch is CODE. | Retain direct fact in its explanatory paragraph. |
| 131 | ECHO(stack/stacks) | They perform no stack operation while that bank is visible because it hides the resident stacks in EXPAND 0 (CODE, CODE). | Retain exact defined-term relation. |
| 131 | SHORT(6) | Chapter 14 explains the memory boundary. | Retain direct fact in its explanatory paragraph. |
| 145 | SHORT(6) | The board's fixed RAM provides CODE. | Retain direct fact in its explanatory paragraph. |
| 151 | CLAUSES(1+2) | Chapters 10 and 14 give the program and resident layouts once this check succeeds. | Retain necessary condition or ordered operations. |
| 160 | SHORT(6) | TEC-OS reads no hex-keypad key codes. | Retain direct fact in its explanatory paragraph. |
| 160 | SHORT(6) | Chapter 7 gives the recovery procedure. | Retain direct fact in its explanatory paragraph. |
| 164 | SHORT(6) | TEC-OS installs no NMI handler there. | Retain direct fact in its explanatory paragraph. |
| 190 | CLAUSES(0+3) | Cold boot writes the banner on row 0 and drives A and B on rows 1 and 2. | Retain necessary condition or ordered operations. |
| 190 | SHORT(6) | Chapter 25 explains that ownership boundary. | Retain direct fact in its explanatory paragraph. |
| 199 | NEG(2) | The ROM supplies no service for the 8 × 8 LEDs and does not write their ports. | Retain ROM/service exclusion and separately attributed DEMO mapping. |
| 199 | SHORT(4) | DEMO writes them itself. | Retain direct fact in its explanatory paragraph. |
| 199 | CLAUSES(0+3) | Its host-model mapping uses CODE for row selection and CODE, CODE and CODE for red, green and blue column patterns (CODE). | Retain ROM/service exclusion and separately attributed DEMO mapping. |
| 199 | SHORT(6) | It is not a starter-card file. | Retain direct fact in its explanatory paragraph. |

These are editorial checks only. The full attempt02 batch remains failed at a
later CPU-flag observer. The closed opening workflow receipt and chapter reviews
do not qualify advanced services, a physical board, browser operation, audio or
publication. No product import, syntax check, assembly, build, test, model
session or capture was performed for this adoption.

Editorial utility identities and stable reader run:

- prose gate script SHA-256: `0fb52353cf22dc3a1a079c819f9d7df174a1961084689b946857747b5862ee66`.
- complexity script SHA-256: `59ef44ca92c947b97c8f73a6e425cb3c3b321190f0f892590c25190300d286a8`.
- six-reader gate output SHA-256: `37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570`.
- six-reader complexity output SHA-256: `8644f5011f76f6362b414753452a28f7a6ad2f8b0d826850666fda7d5833a08e`.

Record-only complexity prompts retain historical identifiers, unit accounting
and audit scope. They do not require shortening the reader text. The earlier
record sections remain evidence of their dated editorial work.
