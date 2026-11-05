# Existing Chapters 10 to 12: reverse outline

Read all three chapters completely at `10821b6`. The output truncation near
NOW in the first Chapter 10 read was recovered by rereading lines 460-585.
Every assembly routine, host command, output fence and table was read.

## Chapter 10: The hardware services

Opening paragraph distinguishes CP/M facilities from board-specific devices
and sets a complete hardware-call survey as the job.

### The shared ports

The paragraph explains shared digit/speaker/serial bits and PICO console state.
The concrete failure is interference with a working console. Retain this
reason beside hardware access rather than as an opening operator prerequisite.

### The ROM table

- Paragraph 1 introduces the fixed ROM interface after the reset jump.
- The table specifies signature, version and dispatcher address.
- Paragraph 2 explains ABI compatibility and all sixteen service roles.
- Paragraph 3 identifies the shared include file and its published copy.
- Preserve interface checking before a direct board call. Distinguish fixed
  reset/interface addresses precisely rather than saying nothing else is fixed.

### The check for TEC-OS

- Paragraph 1 defines signature/major-version checks and minor compatibility.
- Paragraph 2 introduces safe failure and the common helper file.
- HWLIB contains the check, failure string, string output and two hex helpers.
- Paragraph 3 explains the print helpers and packed decimal output.
- A large reusable helper listing interrupts the first device action. Consider
  one minimal device example first, with reusable formatting in a later listing
  or a complete companion source file. Preserve the safety check itself.

### The call

- Paragraph 1 defines argument registers and status exceptions.
- The status table defines success and the two failure classes.
- Paragraph 2 states branch tests, register contracts and unknown numbers.
- The nine-entry table is the hardware-call catalogue.
- Paragraph 3 explains caller stacks, bounds and calling from inside BDOS hooks.
- Preserve as a later board-programming interface. Hook/reentrancy consequences
  require the resident-service and stack prerequisites when first used.

### The board's report

- Paragraph 1 and bit table define discovered devices and console dimensions.
- Paragraph 2 introduces version formatting and deliberate out-of-range dispatch.
- BOARD lists the full check, query, saved results and formatted error status.
- Paragraph 3 and host commands prepare includes, helpers and source on a card.
- Paragraph 4 and serial capture explain on-board assembly and program search.
- Paragraph 5 and PICO capture interpret hardware bits and dimensions.
- Paragraph 6 gives the GLCD-only result.
- Paragraph 7 explains size-dependent screen programs and serial fallback.
- Keep dimensions with a screen-layout use case. Whole device-bit decoding is
  lookup material after the reader can make one successful call.

### The LCD and the speaker

- Paragraph 1 defines row buffers, LCD bounds and TONE before LCDMSG.
- LCDMSG writes a fixed-width row and makes a sound after the ABI check.
- The run and second output fence separate console output from status-LCD rows.
- Paragraph 2 explains persistence and safe behaviour on another ROM.
- Paragraph 3 explains the ROM-word mark and a program's row content.
- Paragraph 4 derives pitch, duration and all zero/edge values in T-states.
- Paragraph 5 explains blocking sound and serial-idle restoration.
- The device action is a useful board-programming step. Preserve the full
  timing derivation later, without making arithmetic a prerequisite to a beep.

### The digits and the clock

- Paragraph 1 explains multiplexing through shared ports.
- Paragraph 2 defines one digit pass, its buffer and the need to repeat calls.
- Paragraph 3 defines clock fields, read/set arguments and missing-device status.
- Paragraph 4 introduces DIGCLK's main loop and periodic clock update.
- DIGCLK includes the scan loop, BCD-to-segment conversion and pattern data.
- Paragraph 5 connects other work to brightness/flicker and the dark exit state.
- Paragraph 6 introduces NOW and its full clock/date formatting listing.
- Paragraph 7 and capture explain a table-driven output order.
- Paragraph 8 fixes the model-clock epoch and weekday convention.
- These examples support separate refresh-loop and time-data questions. Preserve
  them without requiring all clock arithmetic in a first hardware success.

### The keys and the joystick

- Paragraph 1 distinguishes simultaneous physical state from character input.
- Paragraph 2 introduces the INFO guard and ROWS example.
- ROWS scans, captures the joystick, prints rows and drains held keys.
- Paragraph 3 and capture identify the test key's row.
- Paragraph 4 and the alternative-run comment explain the shared electrical
  row and its joystick/keyboard consequence. Keep this operational limitation.

### Claiming the PICO9918

- Paragraph 1 defines claim/release modes and absence/invalid-mode results.
- Paragraph 2 explains console suppression and permitted direct VRAM/port use.
- Paragraph 3 gives release restoration, absent-console behaviour and warm-boot release.
- Paragraph 4 connects that contract to DEMO.
- Keep claim ownership before direct graphics writes, after ordinary text use.

### Text at a screen position

- Paragraph 1 defines PUTAT coordinates, clipping, cursor and zero-count behaviour.
- Paragraph 2 and PLACE listing demonstrate plain/reverse cells.
- Paragraph 3 and capture distinguish byte rendering from the ordinary terminal path.
- Paragraph 4 explains exact row placement, small-screen clipping, serial/claim
  failure and the required fallback path.
- Paragraph 5 states measured relative performance and its display-dependent cause.
- Preserve both the interface conditions and historical measurement provenance.

### DEMO

- Paragraph 1 combines the services into a refresh loop with claim/release.
- Paragraph 2 and commands distinguish the supplied web program from the CLI
  card and prepare the latter's demo.
- The capture shows the console's complete text stream.
- Paragraph 3 and screen fence explain why only the post-release text remains.
- Paragraph 4 distinguishes direct LED ports from protected shared devices.
- Keep the useful supplied-program experience early, as the opening review
  requires, without forcing this implementation survey into that experience.

## Chapter 11: Return codes and chaining

Opening paragraph uses SHOW's printed error to motivate machine-readable status.
The wording about what the CCP can tell needs an operation-based replacement.

### The return code

- Paragraph 1 specifies function 108, query/set and the failure interval.
- Paragraph 2 explains zero initialisation and ordinary program/built-in success.
- Paragraph 3 gives CCP failure classification and cancelled ERA success.

### A program that sets the code

- Paragraph 1 and EXISTS listing turn a missing-file test into a failure status.
- Paragraph 2 and setup commands build two later examples in advance.
- Paragraph 3 and capture compare conditional TYPE before and after a file exists.
- Paragraph 4 explains blank lines and discarded remainder.
- Paragraph 5 and capture show an unconditional piece and a later leading colon.
- Paragraph 6 explains status retained across typed lines and a successful USER.
- Preserve the result distinction after ordinary command chaining. Avoid requiring
  a full file API before a simpler status-setting example can demonstrate it.

### The rule a program follows

- Paragraph 1 distinguishes printed messages from stored return status.
- Paragraph 2 distinguishes default disk-error termination from returned errors.

### A program that starts another

- Paragraph 1 defines function 47, DMA input, copy/exit semantics and TED's use.
- Paragraph 2 and RUN listing chain the command tail.
- Paragraph 3 and capture demonstrate replacing the prior line remainder.
- Paragraph 4 explains echo, missing programs and an empty chained line.
- Paragraph 5 gives length, conditional status, copy lifetime and CP/M differences.
- Paragraph 6 gives rejected newline/unterminated input and the return status.
- Paragraph 7 applies the mechanism to service INIT/REMOVE.
- Keep TED's visible build/run earlier without explaining DMA and CCP replacement.
  This implementation-facing programming facility needs command tails first.

### Chaining from the startup file

- Paragraph 1 states ordering across a program's chained line and the next file line.
- Paragraph 2 and special-card setup/capture demonstrate final startup failure.
- Paragraph 3 explains the leading-colon result and quiet device-failure exception.
- Preserve in automation/startup programming after both mechanisms are established.

## Chapter 12: Writing services

Opening paragraph motivates residence through a character-counting hook and its client.

### Code that stays

- Paragraph 1 defines residence, removal, driver and library terms.
- Paragraph 2 distinguishes TPA costs from ROM calls and named records.
- Paragraph 3 defines BIOS hooks, persistent jumps and bypassing console paths.

### COUNT.SVC

- The introduction and full listing implement a header, INIT, REMOVE, hook,
  preserved old target, counter and published record.
- Header paragraph 1 defines tool-filled fields, required labels, flags,
  format, extra memory and the printed name.
- The header table is a complete format reference within the example lesson.
- Header paragraph 2 gives on-disk ordering and record padding.
- INIT paragraph 1 derives the BIOS slot and publication ordering.
- INIT paragraph 2 defines success and the returned record pointer.
- Hook paragraph explains register preservation and a tail jump to the old target.
- REMOVE paragraph specifies restoration and success/failure.
- Preserve a working service lesson, but relocate exhaustive format tables to
  the service-file appendix unless a field is needed for this example.

### Assembling, installing and measuring

- Paragraph 1 defines TAS output-name selection and rejected output types.
- Paragraph 2 and commands prepare helper sources and a card.
- First capture assembles the two clients and service.
- Paragraph 3 introduces the second half of the run: measurement and uninstall.
- Second capture records TPA and counter effects before/after removal.
- Paragraph 4 explains file/page costs and console-character counting.
- Paragraph 5 and host script give the alternate makeSvc route and identical bytes.
- The current production assembler backend may require updated makeSvc facts
  at the final offer. Preserve source-based identities, not assumed equivalence.

### Beyond the loader's checks

- Introductory paragraph separates validation from arbitrary service-code effects.
- Hook-order paragraph 1 traces an interrupted INIT into a dangling BIOS target.
- Paragraph 2 explains retained pages when the loader finds a live BIOS pointer.
- Failed-INIT paragraph 1 and FAIL listing provide the smallest failed load.
- Its capture compares empty SERVICES with unchanged program space.
- Paragraph 2 states no REMOVE on failed INIT and interrupt-source cleanup.
- Paragraph 3 connects missing-device status to quiet startup behaviour.
- Hook-on-hook paragraph explains restoration order, post-registration cleanup
  and function 47 during REMOVE. It contains several distinct contracts.
- Restart-vector paragraph 1 defines claims and prior-JP conflict checks.
- Paragraph 2 explains sweeping, defaults, declared claims and interrupt state.
- ROM-address paragraph gives fixed-interface use, tool differences and reentrancy.
- Preserve each failure contract in a dependency order after one successful
  install/remove cycle. These are advanced correctness conditions, not asides.

### Stacks

- Paragraph 1 assigns the hook's pushes to three caller stacks.
- Paragraph 2 and CHEAT capture demonstrate limits and cross-service exclusion.
- Paragraph 3 states declaration trust, caller documentation and BDOS reentrancy.

### Publishing a record

- Paragraph 1 and table define the resident registry and record fields.
- Paragraph 2 gives registration, bounds, total limits and cleanup on rejection.
- Paragraph 3 defines interface versioning and compatible extension.
- Paragraph 4 and CHARS listing demonstrate FIND and indirect call/output.
- Paragraph 5 explains the indirect-call idiom, ABI guard and absent record.
- Paragraph 6 and RECS listing demonstrate indexed enumeration.
- Paragraph 7 and capture prepare/observe two records.
- Paragraph 8 distinguishes the ROM's PICO record, recordless drivers and shadowing.

### Depending on another service

- Paragraph 1 and three bullets separate program pointers, declared dependencies
  and late lookups that cannot safely retain a pointer.
- Paragraph 2 gives generation invalidation and byte-wrap ambiguity.
- Paragraph 3 and NEEDS listing define a declared binding and tool extraction.
- Paragraph 4 and capture compare loading with and without its dependency.
- Paragraph 5 explains removal order as the lifetime guarantee.
- Preserve lifetime, generation-wrap and declaration qualifications. A service
  lesson may need multiple bounded chapters to avoid conflating a working hook,
  publication, dependency lifetimes and loader correctness.

Last headings read: DEMO; Chaining from the startup file; Depending on another
service. No unread subsection remains in these three files.
