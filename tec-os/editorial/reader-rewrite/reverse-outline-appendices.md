# Existing Appendices A to I: reverse outline

All nine appendices were read completely at `10821b6`, including front matter,
all rows, source listings, commands and captures. These are reference holdings
for the crosswalk, not material to impose on the first-session route.

## A: BDOS functions

Opening defines numerical lookup and a fixed entry order. The summary table
covers 0–40, 44–48, 99 and 108. Preserve every supported and no-op distinction.

### Calling and errors

- Calling paragraph 1 gives C/E/DE, replicated HL/A/B result, destroyed registers
  and private-stack usage. Paragraph 2 gives FCB-selected functions and drive
  interpretation. Paragraph 3 defines the directory code rather than success alone.
- Error introduction distinguishes default nonreturning print/wait/warm boot from
  function-45 returns. Four rows preserve code, cause and source; remedies link D.

### Function entries

Each numbered entry is a contract unit, not an opportunity for generic trimming.
Preserve input, output, side effects, failure and compatibility qualifiers:

- 0 warm boot; 1 pending/echo input and CP/M difference; 2 expanded output,
  pause/list/input preservation; 3–5 fixed auxiliary paths; 6 direct-I/O omissions
  and non-CP/M-3 FD/FE behaviour; 7–8 IOBYTE; 9 dollar termination.
- 10 buffer layout, stop conditions and CCP-only history; 11 pending status;
  12 version; 13 reset/user/optimised CCP exception; 14 selection and errors.
- 15 open/CR ownership; 16 changed/map-only/read-only close; 17 wildcard drive,
  extent and DMA search; 18 continuation; 19 directory-before-free and partial
  deletion; 20 sequential EOF; 21 extent/full/retry/block-ownership failures.
- 22 make without collision test and extent fields; 23 rename layout and protection;
  24–27 vectors/drive/DMA/live mounted pointers; 28 protection lifetime; 29 logged
  card protection; 30 attributes; 31 DPB; 32 five-bit BDOS versus four-bit CCP user.
- 33–34 random record positioning, error codes and restored FCB retry state;
  35 record size; 36 sequential-to-random position; 37 selective logout/protection;
  38–39 no-ops; 40 allocated-block zeroing and DMA restoration after failure.
- 44 single-record-only count; 45 silent/printed return modes and chain lifetime;
  46 three-byte free records without default-drive change; 47 validated fixed-size
  replacement line and warm boot; 48 flush failure/drop; 99 unsupported truncate;
  108 shared return-code query/store and conditional range.
- Other-numbers paragraph preserves unsupported zero returns and BIOS jump-table
  access rather than function 50. Review unconditional flush wording in 47 against
  its failure/drop path before any new qualification.

## B: ROM table and hardware services

Opening distinguishes hardware, volume, driver, registry and font calls.

### ROM table and common call

- Version paragraph explains major/minor compatibility; address table fixes the
  public eight bytes. Following paragraph identifies data after ABIEND.
- Calling paragraph gives arguments and normal/status exceptions. Status table
  separates rejected input from absent device. Next paragraph requires carry/A,
  not an unspecified zero flag after volume/display failures.
- Dispatcher paragraph gives bounded out-of-range return and register preservation.
- Register paragraph gives interrupt state, caller stack and IX/alternate exceptions.
- Summary table preserves all sixteen inputs, stack bounds and measured costs.
- Following paragraph explains published include checks, bounds rather than maxima,
  measurement boundaries and unmeasured variable card/registry costs.

### Hardware entries

- Introduction identifies no-BDOS routines and resident side effects.
- INFO paragraph and bit table distinguish cached presence, claim and dimensions;
  following paragraph qualifies the RTC probe.
- DIGIT describes complete multiplex pass, shared TX-idle and dwell.
- LCD gives bounded row, fixed width and row-3 ownership side effect.
- VIDEO entry gives mode/device checks and measured alternatives; two further
  paragraphs explain claim suppression and conditional restoration on release/boot.
- TONE gives period/count/zero semantics; instruction and frequency tables preserve
  derivation and last-half-cycle qualification.
- JOY gives shared keyboard row/polarity and unconfirmed physical labels.
- KEYS gives raw matrix rows rather than cooked keyboard input.
- PUTAT gives ownership/clipping/zero-count/cursor/stack cases; following paragraph
  distinguishes direct cells from escape parsing and graphics-LCD independence.
- RTC gives mode, repeated probe, BCD bytes and write protection sequence.

### Other services

- Volume opening, rejected-condition table and two paragraphs preserve failed-flush
  loss without a drive change, slot lifetime, BDOS reentrancy and live pointers.
  Three short entries give exact MOUNT/UNMNT/DESC register contracts.
- DRVR entry distinguishes mode, existing table, keyboard and startup rejection.
  Two following paragraphs define table slots, removal and next-call reselection.
- Registry introduction defines records, bounded lookup, stack and generation.
  FIND/LIST entries distinguish returned table versus record addresses.
- PICO opening and offset table define permanent record and unchecked graphics
  calls. Following paragraph gives claim and width differences plus debugger offsets.
- VTEST setup, complete listing, explanation and capture demonstrate a versioned
  lookup, indirect word call, VRAM round trip and release. Preserve hardware-library
  dependency and no-record alternatives; this belongs after service calls/claims.
- FONT entry gives layout, cost, lifetime and older-minor failure.

## C: Memory map

Opening explicitly binds all figures to historical build/hash and starter-card
geometry. Preserve that boundary until final-source figures are actually qualified.

### Address space and ROM

- CPU-window table, overlay paragraph and use table distinguish physical mapping
  from resident allocations. Latch paragraph gives base/Caps values.
- TPA paragraph and card table show vector-dependent top and resident-service cost.
- ROM table accounts reset, ABI, data/font, code and free bytes. Following paragraph
  explicitly distinguishes historical three-file CCP from four-file C16 source,
  then identifies copied rather than called ROM BIOS table.

### Page zero and workspace

- Full page-zero table preserves vectors, latch, load drive, overlapping FCBs/tail.
- Next paragraph identifies writers/clears, including unload/failed-INIT sweep.
- Next paragraph scopes LATCHV as TEC-OS state while EXPAND 1 is visible; avoid an
  absolute claim about program bytes copied then.
- Resident summary table divides vectors, BIOS/CCP/BDOS, jump table and retained state.
- Placement paragraph distinguishes fixed workspace base from card-dependent vectors.
- Clear-lifetime paragraph warns that “cold-cleared only” does not mean never rewritten.
- BIOS table preserves disk keys, slots/DPHs, LOGINV, shared buffer, stub, PICO block,
  mount scratch, line buffer, display vectors/mode and stack.
- CCP table preserves FCBs/command text across warm boot, scratch record, guard/stack.
- BDOS table preserves argument/input/login/FCB/search state and private stack.
- Above-BIOS table preserves SD/cache/keyboard/vector/history/copy/top/result/loader/
  startup/chain/input/terminal/mount bytes and their lifetimes. SVCRA paragraph
  limits interpretation to the correct loader-result case.

### Banks, stacks and reproduction

- EXPAND table separates cache/key/dirty/history/free space. Following paragraph
  identifies clear and absence of an allocation API, not exclusive physical access.
- Stack table separates boot, BIOS, CCP and BDOS callers. Following paragraph
  separates base sizes from declared service allowance and measured evidence.
- Reproduction paragraph, command and output derive labels from symbol data.
  Final paragraph identifies genuinely fixed addresses versus build-movable state.

## D: Error messages

Opening organises by operational layer. Placeholder paragraph separates literal
messages from variable fields and host tools/diagnostic ROM.

- Cold-boot introduction/table give pre-banner RAM failure, serial-only output
  and required U9 preparation.
- Diagnostic prompt fence/paragraph give current console, case-insensitive retry
  and LCD. SDINIT table retains five causes/remedies; hidden block-code paragraph
  and table distinguish SDERR from visible mount/BDOS/cache reports.
- Container introduction/table preserve first-failure order, full unmount and every
  20h–2Ah cause. Recovery paragraph directs work on a copy and distinguishes retry.
- LCD table preserves CARD?/GLCD? cause, retained console and clearing conditions.
- CCP failure introduction records return-code/chain consequence. Table distinguishes
  missing files, collisions and partially preserved SAVE/COPY destinations.
- NAME? introduction explains which word is echoed. Full table preserves program
  search, parser/capacity, format/INIT/records, loader removal and each command's
  exact rejection. Forbidden-character paragraph is exhaustive reference.
- Quiet-startup paragraph distinguishes typed/startup outcomes. Factual recheck:
  “is replaced by the PICO9918 as the console” can imply a switch that never occurred;
  describe retention where that is what source and capture establish.
- Older-card paragraphs, fixture and capture preserve format-4 rename limits,
  obsolete PICO-driver rejection and separately updating STARTUP.CMD.
- BDOS opening scopes default nonreturning versus returned errors. Complete table
  retains protection layers, partial deletions, short cards and damaged allocation.
- Three Write-lost paragraphs distinguish delayed data loss, immediate directory
  failure, retained failed data, conditional reinsertion and explicit flush.
- MOUNT opening/table preserve its unusual zero return even after printed errors,
  slots, failed-flush loss and ABI requirements.
- No-fault table interprets normal banner/drive/DIR/pager/confirmation/copy/console/
  service/mount output without mislabelling it as an error.

## E: Container format

Opening defines format authority, common generators, endianness and block origin.

- Header command/dump and field table locate both versions' fields/descriptors.
  Checksum paragraph defines included bytes and subtraction. Version paragraph
  distinguishes host creation policy from ROM treatment of nonzero minor versions.
- Descriptor table preserves ids/start/length/geometry/protection/drive/cache/label.
  Example paragraph decodes SYSTEM/WORK. Following paragraph separates default
  drive from persistent id, host policy from alignment and empty-payload fill.
- Beyond-block-zero paragraphs derive descriptor position, capacity and table sum.
- Checks introduction/table preserve exact order and all-or-nothing failure.
- Order-check paragraph, corruption script, verify output and capture reproduce
  code28. Following paragraph limits normal creator guarantees.
- Drive-field paragraph and rejected create show code29. Further-check table and
  paragraph distinguish host checks from ROM omissions and unknowable card length.
- Geometry paragraphs/tables derive record/block/extent/directory/vector sizes;
  final paragraph gives generated ROM table and descriptor length comparison.

## F: tecvol

Opening establishes Node/repository prerequisite and nine-command scope.

- Common syntax fence preserves all options. Subsequent paragraphs give argument
  parsing, container validation, temporary-file replacement, volume identifiers,
  user areas, failure statuses and exclusive card access/flush/reset ordering.
- Create entry/table defines volume spec; option paragraph gives integer bounds,
  multiple-of-eight alignment, version selection and required drive A.
  Example constructs SYSTEM/WORK/ARCHIVE and specifies silent success.
- Info/verify commands/output and explanation decode geometry/free space, directory
  faults versus fatal bad-block checks and changed-checksum failure.
- Dir entry/capture distinguish logical byte size from record padding/attributes.
- Put entry explains replacement/protection/atomic image failure; next paragraph
  defines binary/text padding. Examples cover ordinary copies, read-only volume
  and early rejected user option.
- Get entry distinguishes padded binary, text EOF/conversion, sparse zeros and
  damaged-block refusal before output. Example reads text.
- Era entry/examples distinguish missing-user exit2 and read-only force behaviour,
  with unchanged image on rejection.
- Recipe paragraphs define schema, provenance/hash checks, read-only flags last
  and page recipe. Rebuild/hash capture demonstrates reproducibility.
- Install entry/command names destructive device scope and lack of target identity
  checks. Keep this concrete consequence beside the action, not in first boot.
- Worked example joins prior steps to a real boot/TYPE/MOUNT capture; final paragraph
  explains no startup file and the unmounted archive.

## G: TEC-1G hardware

Opening scopes source use, board documents and model-only execution separately.

- Port table preserves all directions/bit uses; following paragraphs explain model
  queue trigger and PICO/keyboard probe prerequisites.
- Shared-port paragraph explains idle serial bit safety; serial paragraph gives
  usable settings/FAST then transport and unbuffered-input limitation.
- Switch table defines read occasions; following paragraph distinguishes disputed
  document/runtime bits and ignored switches.
- Latch introduction/table gives write-only shadow and used/unused bits. Reset
  paragraph follows overlay and shadow contract. Bank paragraph explains no-stack
  accesses and model-only extended decode.
- U9 paragraph gives required chip, jumper setup and serial failure path.
- Keypad paragraphs distinguish startup skip from unsafe NMI jumper and FCB overlap.
- LCD command table and paragraph explain bounded busy wait, rows and messages.
- LED paragraph separates model RGB ports from physical document's single-colour
  device and unconfirmed pattern; no physical observation is invented.
- Clock bit table/paragraph define mode/probe/INFO versus repeated RTC checks.
- SD bit table and paragraphs define SPI edges, addressing bound, finite failures,
  bank transfer and diagnostic measurement provenance.

## H: Service format

Opening separates on-disk reference from resident-header changes.

- File table and paragraph define four parts, origin, rounding and ignored padding.
- Header/check table preserves every field and rejection; following paragraph
  connects magic to SVCFMT. Writer table distinguishes source declarations from
  tool-computed fields, with zeros reserved for the latter.
- Dependency paragraph defines nine-byte entries, version/name lookup and both
  makeSvc option and TAS DEPS encodings.
- Gap introduction/table gives byte-relative positions, skips and zero remainder.
  Following paragraphs derive examples, bound every step and distinguish first-gap
  zero accepted by loader from encoder output, plus comparison encodings.
- First-gap-zero script/capture proves header-name modification. Interpretation
  gives relocated byte plus PUTTRIM mask; preserve exact observed COUNTX result.
- GLCD dump/header table and final paragraph derive image size, vectors, gap count,
  last fixup and bitmap comparison, and shared ROM font dependency.

## I: Web page

Opening gives build/serve prerequisite; keep this separate from prepared-board
first route and from browser evidence not yet executed for the rewrite.

- Controls table distinguishes reset/power, pause, fresh/open/download image,
  per-drive import and text conversion. Following paragraph gives page-only DEMO,
  file refresh, remembered width/display and speed.
- Typing table separates matrix and serial routes; following paragraph explains
  focus, console changes, terminal subset and touch controls.
- Storage paragraph traces saved-card load and two-second saves. Notice table
  distinguishes transient/repeated save failure from disabled saves after read
  failure. Reload/download paragraph states the actual preservation consequence.
- Card-type paragraph distinguishes high-capacity page bounds from physical/model
  short-card examples. Recheck any absolute exclusion of code27 against all causes.
- Import paragraphs trace pause/copy/save/reset transaction, failed-save/overlap
  notices, dirty-cache reset risk and serialized preparation/import changes.
- Startup opening defines copy-on-change/user0/protection and no driver writes.
  First-line table gives three PICO widths and GLCD. Following paragraph explains
  absent other-display line and later CON UC1.
- Rewrite paragraph defines removable driver/width pieces. Three-case table keeps
  same-line colon inheritance, next-line inherited colon and removal otherwise.
  Following paragraph covers blank/equal text and the supplied starter file.
- Left-alone introduction/table preserve readiness checks, notice location and
  missing drive/driver/old format/protection/full-directory failures. Final paragraph
  explains old-name selection, no forced overwrite and copying original media.

## Cross-reference and qualification work

Retain all nine reference purposes. Add an exhaustive command reference destination
for the early command catalogue rather than burying that grammar in first use.
Every moved link and source pin must be checked after the structural rewrite.
No example was run for this reading. Historical measurements and captures keep
their original provenance until the final offered source and allocated runs exist.
