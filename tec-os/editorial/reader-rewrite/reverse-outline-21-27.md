# Existing Chapters 21 to 27: reverse outline

All seven chapters were read completely at `10821b6`, including every example,
table and output fence. The final registry/removal and loader-limits sections
of Chapter 24 were read again separately after combined output was truncated.
These notes preserve paragraph jobs and placement questions, not new claims.

## Chapter 21: Chaining inside

The opening poses the useful implementation question: how can a command line
survive the warm boot that clears command-processing scratch?

### The line kept across a warm boot

- Paragraph 1 defines the retained FCB/line range and cleared range.
- Paragraph 2 defines offset-plus-one CHPOS, PRGCODE and cold-clear lifetime.
- Paragraph 3 compares the keyboard, startup and function-47 length limits.
- Paragraph 4 proves the command-tail terminator stays below 0100h and cannot
  reach the load-drive byte. Keep this proof with page-zero construction.

### The main loop

- Paragraph 1 and ordered list establish chain/startup/keyboard priority.
- Paragraph 2, host fixture and capture demonstrate that priority across startup
  lines, including a failed service and skipped conditional command.
- Paragraph 3 explains whole-line echo, dollar truncation of echo and quiet absence.
- Paragraph 4 traces CHSKIP, empty pieces and trailing separators.
- Paragraph 5 traces per-piece echo before uppercasing.
- Paragraph 6 unifies new-line and remaining-piece handling without double echo.

### Taking a piece

- Six numbered steps give conditional test, argument pointer, capitalisation,
  separator replacement, next position, return-code reset and empty-piece exit.
- Paragraph 1 after the steps identifies drive/built-in/program dispatch.
- Paragraph 2 explains why arguments stop at the current piece's zero.
- Paragraph 3 traces ordinary program and built-in completion to the next piece.
- Paragraph 4 proves low-byte offset subtraction independent of buffer placement.

### The return code and the colon test

- Paragraph 1 defines function 108 query versus store and replicated return bytes.
- Paragraph 2 derives the failure interval and explains echoed-but-unrun pieces.
- Paragraph 3 applies the same test at the beginning of a fresh line.
- Paragraph 4 establishes test-before-clear ordering.
- Paragraph 5 traces ERRGO and every built-in failure message through it.
- Paragraph 6 contrasts missing/oversized programs and failed services with quiet
  absent-device startup and ordinary successful messages.

### The paths that drop the rest

- Opening and three bullets trace CHDROP from empty-line Ctrl-C, paused-output
  Ctrl-C and default-mode BDOS errors.
- Next paragraph distinguishes returned-error modes and their warm-clear lifetime.
- Reset paragraph identifies whole-workspace clearing.
- Pager paragraph separates stop-listing from stop-chain, including masked aliases.
- Write-lost paragraph traces failed cache flush to cleared CHPOS before CCP entry.

### Function 47

- Paragraph 1 identifies DMA input and the two-pass implementation.
- Paragraph 2 traces validation, CR/LF rejection and unchanged state on failure.
- Paragraph 3 traces the fixed-size copy, early copy lifetime and position setup.
- Paragraph 4 follows RAM-BIOS warm boot, cache flush and first-piece processing.
- Paragraph 5 distinguishes ignored E from CP/M 3 drive/user handling.
- Paragraph 6 explains replacement rather than appending and the empty-line case.
- Review the unconditional persistence sentence beside the later failed-flush
  qualification. Do not turn a successful-flush property into a blanket guarantee.

## Chapter 22: Command history

Opening gives the one-page storage mechanism. Early chapters should already
teach recall; this chapter can then explain bounded storage and traversal.

### Recalling a line

- Paragraph 1 defines backwards/forwards navigation and editable recalled text.
  The screen capture demonstrates selecting the older of two lines.
- Paragraph 2 explains screen evidence versus serial erase bytes and shell keys.

### The ring at BD00h

- Paragraph 1 places the private ring and links the no-stack bank rule.
- Paragraph 2 traces masked single-byte HGET/HPUT and interrupt restoration.
- Paragraph 3 derives byte wrap, forward string storage and HHEAD.
- Paragraph 4 establishes the adjacent-zero invariant and oldest-entry stop.

### Storing a line

- Paragraph 1 traces CCP-only HFLAG and nonempty completion.
- Paragraph 2 explains clearing after ordinary or abandoned input.
- Paragraph 3 excludes individual chain pieces, function-47 and startup lines.
- Paragraph 4 and capture prove original-case storage before capitalisation.
- Paragraph 5 explains NUL rejection and consecutive duplicate comparison; its
  capture demonstrates the bounded backwards walk over a repeated command.
- Paragraph 6 traces overwrite, partial-oldest-entry clearing and restored invariant.
- Paragraph 7 relates maximum command length to ring capacity.

### Recall in function 10

- Paragraph 1 separates ordinary program control bytes from CCP history actions.
- Paragraph 2 introduces HPOS and two traversal bullets derive both directions.
- Paragraph 3 explains erasing, copying, echo and continued editing at boundaries.

### Warm boot and reset

- Paragraph 1 and capture demonstrate retained ring and retained head on warm boot.
- Paragraph 2 and capture derive reset's empty-ring invariant, even when selected
  volumes survive. Final paragraph interprets the immediate empty-entry stop.

## Chapter 23: The hardware services in the ROM

Opening gives a routine-by-routine implementation route after the programming
interface. Preserve shared-port and stack constraints without repeating the
whole user-facing API reference.

### The table and the dispatcher

- Paragraph 1 establishes signature/version, jump and argument register contract.
- Paragraph 2 derives range rejection without changing argument registers.
- Paragraph 3 follows saved pairs, doubled index, EX (SP),HL and RET dispatch.
- Paragraph 4 defines success/error exits and preservation exceptions.

### The routines

- Opening assigns hardware, font, volume, driver and registry implementations.
  The size table preserves dispatcher/routine accounting at the checked build.
- INFO paragraph reads cached presence, claim, version and adjacent dimensions.
- DIGIT paragraph explains shared TX-idle bit and multiplexing loop.
- LCD paragraph follows row validation, ROM-word ownership and fixed-width output.
- TONE paragraph derives half-cycle cost, zero-count interpretation and idle exit.
- JOY/KEYS paragraph explains address-line scanning, shared row and polarity.
- RTC paragraph traces mode check, presence probe, serial bit order and burst modes.
- VIDEO paragraph validates mode/device, hides cursor and records the claim.
- Release paragraph explains no-op cases, restore vector and early warm-boot release.
- PUTAT paragraph traces ownership, clipping, cursor removal and driver dispatch.
- FONT paragraph defines address/extent and older-ABI rejection by GLCD INIT.

### The shared rules

- Paragraph 1 separates no-BDOS services from mount restrictions and identifies
  resident side effects. Keep the scope of “these routines” explicit.
- Paragraph 2 explains caller stacks and conservative bounds, with PUTAT's nested
  draw path. Bounds must not be relabelled measured maxima.

## Chapter 24: The service loader

Opening connects temporary file load, resident pages, registry and removal.
This supports the service-authoring chapter after calls, stacks and lifetimes.

### A service's entry

- Paragraph 1 gives the dual BDOS-entry/TPA-top contract and TAS stack example.
- Paragraph 2 derives page-aligned entry, safe downward stack and two jumps.
- Paragraph 3 explains the no-service stub and variable low byte.
- Paragraph 4 and address table account for first-load alignment loss and GLCD.
- Paragraph 5 and table distinguish file header from overwritten resident fields.
- Paragraph 6 derives the older-owner boundary instead of a saved old-top word.

### Relocation by pages

- Paragraph 1 explains unchanged low bytes and high-byte fixups.
- Paragraph 2 traces two assemblies, strict origin line, required entry labels
  and ROM-address source checks.
- Paragraph 3 separates unchanged, plus-one and invalid differences, preserving
  absolute external addresses.
- Paragraph 4 explains image-relative gaps, 255 skips and the format reference.

### The seven steps

- Introductory paragraphs trace CCP load/status fields and identify PZTOP commit.
- Step 1 validates busy state, magic/format, bounds and entry offsets, then derives
  page demand, overflow/borrow rejection and the 8000h floor.
- Step 2 bounds dependency entries and performs versioned lookup.
- Step 3 subtracts declared stack costs and stores remaining room in the header.
- Step 4 walks every gap with bounds checked before skip/fixup; it then shows
  relocated GLCD vectors, page costs and PICO startup's rejected quiet load.
- Step 5 checks claimed restart slots before any move, writes resident fields and
  moves the image while leaving committed PZTOP unchanged.
- Step 6 calls INIT under busy state and explains rollback on warm boot, orphaned
  hooks, restart vectors and recognised-reset tests.
- Step 7 validates record/page bounds, limits publication count, splices records
  and commits owner/top state. Preserve empty-registry count arithmetic.

### A failed load

- Opening and outcome table distinguish untouched, undone and retained-page cases.
- Paragraph 1 separates failed INIT from bad published records and failed REMOVE.
- Paragraph 2 traces RAM-BIOS hook scanning, claimed-vector cleanup, swept vectors
  and flags cleared on retained pages. DRVR's recorded table is outside that scan.
- Paragraph 3 explains SERVICES using the owner list even without registry records.

### The registry and removal

- Paragraph 1 maps FIND/LIST arguments to internal lookup registers.
- Paragraph 2 explains newest matching version, generation and permanent ROM record.
- Paragraph 3 distinguishes bounded client lookup from unbounded loader counting
  on a corrupted cycle, missing removal API and unpublished INIT records.
- Paragraph 4 explains lowest-first removal as stacked saved state.
- Paragraph 5 validates busy/owner/removable flags.
- Paragraph 6 traces REMOVE failure, function-47 exit, claimed-slot clearing,
  restored heads, generation increment, rebuilt top and final sweep.
- Paragraph 7 explains address lifetime, byte-generation wrap and dependencies.
- Paragraph 8 distinguishes warm retention from cold clearing of both lists.

### The limits of the loader's checks

- Opening distinguishes observable memory checks from header declarations.
- Paragraph 1 connects swept-vector bounds to freed pages and reset.
- Paragraph 2 explains declared claims, occupied slots, unclaimed external jumps
  and INIT/REMOVE responsibility for interrupts. Preserve failure qualifications.
- Paragraph 3 gives three measured-base allowances and GLCD's declared costs.
- Paragraph 4 demonstrates that declared usage is not enforced actual usage.

## Chapter 25: Startup

Opening poses a bounded state-lifetime mechanism, separate from earlier startup
configuration. Retain actual display policy; no startup or driver-policy edits.

### One record of state

- Paragraph 1 and table define STPOS's unseen, active and finished encodings.
- Paragraph 2 contrasts warm-preserved position/record with cold reset.
- Paragraph 3 explains diagnostic retry before CCP's first startup read.

### Starting the file

- Paragraph 1 follows disk reset, restored user and first-call-only STBOOT.
- Paragraph 2 explains marking finished before an error-prone read.
- Paragraph 3 gives one-time keypad bypass, measured deadline and recovery tests.
- Paragraph 4 and call list trace fixed A/user-0 FCB, selected volume and DMA/open/read.
- Paragraph 5 traces success position and restoration of default DMA on every path.
- Paragraph 6 explains the single cached record, no close and no reread after USER.

### Taking a line

- Paragraph 1 orders sources and explains why startup bypasses command history.
- Paragraph 2 decodes state and derives pointers within a single page.
- Paragraph 3 scans bounds/terminators and discards overflow while locating line end.
- Paragraph 4 distinguishes delimiter versus record/end-marker exits.
- Paragraph 5 derives 80h/81h and the special last-byte start exclusion.
- Paragraph 6 and table trace CR/LF/EOF across the supplied startup record.
- Paragraph 7 explains whole-command execution despite dollar-truncated echo.
- Paragraph 8 proves harmless temporary use of BOOTDRV for the echo terminator.
- Paragraph 9 unifies typed/startup dispatch and original-case echo.
- Paragraph 10 traces all routes back to the next startup line across warm boot.

### The display line's two outcomes

- Paragraph 1 distinguishes ROM PICO console from service GLCD and external programs.
- Paragraph 2 traces FONT/device/DRVR rejections and keyboard/slot requirements.
- Paragraph 3 distinguishes loaded-table matching, console retention and switching.
- Paragraph 4 summarises typed versus startup outcomes and page-prepared media.

### The LCD's words

- Paragraph 1 defines row-3 message output and carry-set failure exit.
- Paragraph 2 follows GLCD? and restoring a failed console selection.
- Paragraph 3 and table define device/claim/message bits.
- Paragraph 4 explains message ownership, clears and direct-port bypass consequences.
- Paragraph 5 distinguishes CARD? and full LCD reinitialisation on diagnostic retry.

### The quiet rule

- Paragraph 1 derives typed/startup origin flags and inherited chain-piece origin.
- Paragraph 2 traces status plus loader-result gating after INIT and record checking.
- Paragraph 3 separates quiet device absence from missing/damaged files or keyboard.
- Paragraph 4 applies the same policy to unavailable PICO width commands.
- Paragraph 5 connects quiet success to the following conditional command.

## Chapter 26: Diagnostics

Opening separates card diagnostic prompt from a separate hardware-test ROM.
Avoid the absolute “everything else” claim: a finite test suite has finite scope.

### The diagnostic prompt

- Paragraph 1 places card/container errors after banner and RAM/device checks.
- Paragraph 2 follows known stack state, CARD? and hexadecimal error output.
- Paragraph 3 defines case-insensitive retry, visible console and keyboard, then
  the no-card PICO capture. Preserve non-PICO serial/LCD distinction.
- Paragraph 4 explains retry reinitialising LCD/card and bypassing cached table bytes.
- Paragraph 5 proves retained-volume scratch survives the path to retry.

### The diagnostics ROM

- Paragraph 1 gives replacement-ROM purpose and captured build command/output.
- Paragraph 2 traces generated configuration/font, selected assembler and artifacts.
- Paragraph 3 defines image ID and checksum, including excluded bytes.
- Paragraph 4 lists entry/layout/handler build checks.
- Paragraph 5 follows overlay start, initial NMI return, outputs and fixed stack/state.

### The run

- Paragraph 1 proves home RAM before stack use and derives repeating failure timing.
- Paragraph 2 follows banner, interactive selection, timeout and keypad translation.
- Paragraph 3 traces test headings, result/report copies and LCD totals; result table
  distinguishes verdicts from measured, visual, skipped and absent-device outcomes.
- Paragraph 4 and Node command define the actual model configuration/report source.
  The excerpt records first results, not board evidence.

### The tests

- Paragraph 1 explains ordering exceptions; the full table preserves all 37 test
  identities, hardware questions and interactive scope.
- Paragraph 2 connects shared TEC-OS paths versus required hardware properties.
- Paragraph 3 limits card writes to T37, reserved block 7 and restoration afterwards.

### The report

- Paragraph 1 defines report structure/reprint controls and supplies the complete
  model report, with measured and LOOK/NONE outcomes distinct from PASS.
- Paragraph 2 identifies three model/document differences and why TEC-OS avoids
  depending on their disputed behaviours.

### Comparing a board's report with the model's

- Opening and seven setup actions cover ROM duplication, RAM, switches, terminal,
  prepared card, interactive choice and restricted keypad use.
- Paragraph 1 explains NMI/PROTECT hazards rather than offering a vague warning.
- Paragraph 2 and command identify the terminal log as comparison input.
- Paragraph 3 traces identity check, comparison rules, measured-form matches and
  exit statuses. Visual PASS can match model LOOK without inventing observation.
- Paragraph 4 interprets documented expected differences and remaining agreement.
- Keep preparation and hazardous operations in this later diagnostic workflow.

## Chapter 27: The host model

Opening makes transcript provenance explicit. Retain a concise version in the
front matter; the full implementation belongs with reproducible evidence.

### One machine for tests, page and book

- Paragraph 1 explains shared browser/Node module and symbol-map indirection.
- Options list defines media, devices, RAM arrangements and write callback.
- Paragraph 2 traces runtime components, memory arrangement and ROM load.
- Paragraph 3 explains disabling host-timed display updates for deterministic reads.

### The card and the clock

- Paragraph 1 explains caller-owned card bytes, swap and persistence.
- Paragraph 2 specifies image-bound failure and standard/high-capacity addresses.
- Paragraph 3 traces optional RTC attachment and cycle-based fixed time.
- Paragraph 4 contrasts reproducible test/capture dates with host time.

### Checks on every write

- Paragraph 1 defines ROM/overlay violation records.
- Paragraph 2 distinguishes runtime writes from documented board behaviour.
- Paragraph 3 defines cache/history/free EXPAND pages and permitted writers.
- Paragraph 4 explains local/global records and test-file failure versus accepted
  physical writes. Do not imply that the model prevents the write.

### Driving the machine

- Paragraph 1 distinguishes hooked logical console output from decoded serial.
- Paragraph 2 and three fences show GLCD handover across logical/serial/screen records.
- Paragraph 3 defines bounded stepping, output settling, waiting and prompt readiness.
- Paragraph 4 distinguishes paced serial and matrix transport from physical typing.
- Paragraph 5 explains display decoding, RAM snapshots and reset preserving RAM/card.

### The tests

- Paragraph 1 defines runner, count, boot fixtures and display-dependent preparation.
- Paragraph 2 traces assembled fixture caching, services, empty cards and CP/M access
  validation. Distinguish fixture mutation from an untouched starter-card run.
- Paragraph 3 identifies external input provenance, fetching, strict missing-input
  behaviour and browser dependency installation.

### The web page

- Paragraph 1 follows build/bundle/stub, clean output, recipe and added DEMO.
- Paragraph 2 explains bounded frame stepping, displays, status and host-time RTC.
- Paragraph 3 separates focused matrix input from serial terminal input.
- Paragraph 4 traces changed-card storage, prepared display line and rewrite reference.
- Paragraph 5 traces copy-on-import, persistence-before-reset and dirty-cache risk.
  Preserve successful-flush qualification in any early safety extraction.

### The model's evidence and its limit

- Paragraph 1 scopes all captures/timings/tests to model and historical README status.
- Paragraph 2 distinguishes instrumentation from board behaviour, with stated scope.
- Paragraph 3 lists overlay/bank/latch differences and limits passing-test inference.
- Paragraph 4 connects board diagnostics to per-property evidence, not blanket proof.

All reads reached their final paragraphs. No new capture, build or device run
was performed for this reading record.
