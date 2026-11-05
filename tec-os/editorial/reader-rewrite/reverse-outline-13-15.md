# Existing Chapters 13 to 15: reverse outline

All three files were read completely at `10821b6`. Source citations, the full
include listing, region/stack tables, ordered boot steps and timing prose were
included. Historical figures are reading material, not newly verified results.

## Chapter 13: The ROM and its build

Opening paragraph changes from using the machine to image construction and
address ownership. A new implementation part needs a deliberate entry point,
not a repeated description of what the preceding part showed.

### The image's parts

- The introduction and table divide the image into reset, interface, data,
  code and free regions.
- Paragraph 2 fixes the historical census pin and used size.
- Paragraph 3 connects the reset instruction to the first code byte.
- Paragraph 4 defines the ABI table and dispatcher.
- Paragraph 5 describes read-only tables/messages and the copied BIOS table.
- Paragraph 6 identifies code extent and FF-filled free space.
- Preserve exact image accounting later, after a reason to inspect or rebuild
  the ROM. Do not introduce all of it as the first implementation experience.

### The source order

- Paragraph 1 and complete include fence show assembly order.
- Paragraph 2 separates equates and RAM reservations from emitted bytes.
- Paragraph 3 derives reset/table/data/code ordering and grouped subsystem files.
- Preserve the source split, including volsvc and ccpmut, at the final offered pin.

### The generated files

- Paragraph 1 identifies generated configuration, geometry and font authorities.
- Paragraph 2 explains workspace origin, version and serial-delay generation.
- Paragraph 3 explains shared format JSON and generated layout/data equates.
- Paragraph 4 states geometry constraints common to ROM and host tools.
- Paragraph 5 explains the shared font and its two display clients.
- These belong with reproducible construction. Serial delay arithmetic needs
  the later serial implementation, while table offsets belong in format reference.

### The two assemblies

- Paragraph 1 and command define TAS production versus explicit ATOM reference.
- Paragraph 2 states backend validation and independence of older standalone examples.
- Paragraph 3 gives pinned input/host preparation and local verified assembly.
- Paragraph 4 gives application precedence, failure conditions and host selection.
- Paragraph 5 explains the probe/real-label workspace placement and final assembly.
- Paragraph 6 preserves the distinction between source-only preparation and
  earlier captured output. Retain this evidence boundary until final qualification.

### The build's checks

- Introductory paragraph defines the placement-check failure boundary.
- Eight bullets check image/reservation bounds, fixed entries/order, ABI,
  console/debugger offsets, service-call discipline, workspace, stack placement
  and minimum program area. Preserve the differing backend checks precisely.
- Final paragraph derives the starter allocation layout without executing the ROM.
- Refresh debugger contracts and source coordinates against the final offer.

### One image for every board

- Paragraph 1 defines ROM, D8 and census outputs and copies into dist.
- Paragraph 2 defines the single profile, runtime device choices and printed build line.
- The text fence is a captured historical build line, not new TAS execution.
- Paragraph 3 gives the historical hash and address provenance.
- Preserve toolchain setup and image identity as a coherent construction chapter
  or reference path, not a hidden prerequisite to the first prompt.

## Chapter 14: The memory map

Opening paragraph distinguishes program-facing memory from operating-system
state, clearing events and historical address provenance.

### The window and the latch

- Paragraph 1 divides fixed RAM, window and ROM.
- Paragraph 2 explains latch bits, boot overlay and the ordinary bank view.
- Paragraph 3 explains the shadow byte and bank switches preserving other bits.
- Paragraph 4 distinguishes resident state from copied program-buffer bytes.
- Keep the no-stack/address-visibility problem before the bank-switch solution.

### Page zero as TEC-OS writes it

- Paragraph 1 and table define reset/warm-boot low-memory contracts.
- Paragraph 2 distinguishes preserved selection bytes and rewritten vectors.
- Paragraph 3 explains the CCP's load-drive byte and unused BIOS range.
- Coordinate with the caller-facing page-zero reference without repeating its
  complete introduction before any program has needed these contracts.

### The workspace and what clears it

- Paragraph 1 and region table connect ownership to clearing events.
- Paragraph 2 distinguishes reserved memory, cold clearing and CPMINIT clearing.
- Paragraph 3 enumerates retained-region mutations during warm boot.
- Paragraph 4 distinguishes placement from clearing and persistent BIOS hooks.
- Paragraph 5 maps the two workspace origins and its three stack-ended blocks.
- Paragraph 6 connects console dimensions to the INFO interface.
- Preserve lifetime distinctions as the theme. Exhaustive byte addresses have
  a lookup role in Appendix C and need not interrupt the lifetime explanation.

### The allocation vectors and the BDOS entry

- Paragraph 1 defines vector bits and sizes from disk geometry.
- Paragraph 2 explains DPHs, allocation policy and slot encodings.
- Paragraph 3 derives the stub immediately below the vectors.
- Paragraph 4 explains service page placement and the lowered entry word.
- Paragraph 5 derives starter/worst-card TPA and the build's bound.
- This is the implementation explanation of the program memory contract already
  used for buffers, not an introductory storage lesson.

### The four stacks

- The opening distinguishes boot storage from the three resident stacks.
- Paragraph 2 explains the boot stack before RAM has been proved.
- Paragraph 3 gives the warm-boot BIOS stack.
- Paragraph 4 explains the CCP/program stack, return word and guard.
- Paragraph 5 explains the BDOS's private stack and its cold-boot reuse.
- Paragraph 6 gives sizing policy and quarter-free margin.
- Paragraph 7 describes instrumented workloads, depth checks and NMI limits.
- Paragraph 8 and table add declared service allowances to measured bases.
- Paragraph 9 explains the margin arithmetic and loader enforcement.
- Preserve measured-versus-declared distinctions and the absence of a physical
  NMI proof. Final source and allocated validation govern refreshed figures.

### EXPAND 1 and the no-stack rule

- Paragraph 1 and table define cache, history and free bank ranges.
- Paragraph 2 connects fixed addresses and MVCOPY to their mechanism chapters.
- Paragraph 3 explains why a resident stack disappears and identifies callers
  that must avoid it. This is a concrete correctness theme for banked routines.

## Chapter 15: Reset, cold boot and warm boot

Opening paragraph defines two restart mechanisms, their state effects and the
chapter's chronological route, then promises a timing survey.

### The first instruction

- Paragraph 1 explains the overlay enabling the initial jump into high ROM.
- Paragraph 2 distinguishes reset from an EXPAND-1 program exit via 0002h.
- Paragraph 3 establishes latch, stack and interrupt state.
- Factual question: the unqualified statement that every boot writes EI at
  0038h must retain the condition that no resident jump was kept there.

### Cold boot's steps

- The introduction and fourteen ordered steps trace prerequisites: preserve
  reset state before clearing, prove RAM, initialise workspace/console/cache,
  start the card, mount and allocate drives, copy vectors and enter warm boot.
- Paragraph 2 explains the ordering dependencies and source chapter links.
- Paragraph 3 explains absent-LCD cost and its two warning words.
- Paragraph 4 explains diagnostic retry from COLDRT without another banner.
- The sequence is justified by data/control prerequisites. Retain the order
  without repeating it later as a second syllabus or summary.

### The RAM check

- Paragraph 1 states required RAM regions and the cache dependency.
- Paragraph 2 explains write/read ordering, floating bus and the failure path.
- Paragraph 3 explains DETECT's aliasing test, restoration and no-stack condition.
- Paragraph 4 explains clearing/marking EXPAND 1 after the check.

### The reset test

- Paragraph 1 distinguishes power-up RAM from retained reset RAM and its purpose.
- Paragraph 2 and four bullets specify recognition without executing arbitrary RAM.
- Paragraph 3 explains the floor, service-lowered boundary and build-dependent marks.
- Paragraph 4 explains failed recognition during incomplete cold boot.
- Paragraph 5 explains the saved table's fixed-RAM copy and invalid marker.
- Paragraph 6 explains RESEL's no-change validation phase and failure fallback.
- Paragraph 7 explains the second phase and retaining an empty drive.
- Paragraph 8 and reset capture demonstrate retained unmounted B.
- Paragraph 9 distinguishes retained assignments from discarded state, persisted
  writes and a later fallback to card defaults.
- This explains the earlier operator distinction between reset and power-off.
  Keep cache loss and retained selections tied to the precise recognition conditions.

### Page zero

- Paragraph 1 explains the shared cold/warm initialisation and three jumps.
- Paragraph 2 explains vector lifetime, exact top-of-TPA boundary and defaults.
- Final lines preserve selection bytes and connect claims/unload to the loader.

### Warm boot

- Paragraph 1 lists program routes to WBOOTR.
- Paragraph 2 and three bullets distinguish CHDROP termination paths.
- Paragraph 3 and Ctrl-C capture give a visible ordinary case.
- Eight ordered steps restore the bank, stack, display, page zero, cleared
  runtime state and cached writes before entering the CCP.
- Paragraph 4 links retained state, the flagged disk reset and one-time startup.
- Preserve the difference between restarting a program environment and resetting
  the board. Do not require this complete trace to teach Ctrl-C safely.

### The cost of each boot

- Paragraph 1 states cold-boot and first-input measurements and dominant costs.
- Paragraph 2 states warm-boot measurement boundaries and component costs.
- Paragraph 3 compares modified-drive rebuild, complete disk reset and B login,
  then distinguishes the test's own card and upper-bound assertion.
- Keep performance as a motivated implementation analysis with reproducible
  method, not an assertion that source-derived counts are new measurements.

Last headings read: One image for every board; EXPAND 1 and the no-stack rule;
The cost of each boot. Full source and timing tables were included in the read.
