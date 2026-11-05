# Existing Chapters 16 to 18: reverse outline

All three files were read completely at `10821b6`, including source ranges,
register/offset tables, constructed-card faults, code and all output fences.

## Chapter 16: The BIOS and the console path

Opening paragraph outlines the byte path, then introduces jump-table and
selection mechanisms before the physical endpoints. Retain the path as a
single runtime question after the ordinary console and programming interface.

### The jump table in RAM

- Paragraph 1 and table define all seventeen CP/M BIOS slots and ROM routines.
- Paragraph 2 derives the RAM copy and caller-relative addressing.
- Paragraph 3 explains persistent hooks and restoration before a program ends.
- The hook lifetime is essential to later services. Disk entries need not be
  explained in a console lesson beyond their place in the same fixed interface.

### The IOBYTE and the console mode

- Paragraph 1 and table map logical console selections to physical paths.
- Paragraph 2 distinguishes requested IOBYTE bits from the applied CONMOD state.
- Paragraph 3 explains table selection, fallback, vector copy and display restore.
- Paragraph 4 describes publication of the applied selection to the IOBYTE.
- Paragraph 5 and serial capture demonstrate the first reply on the new console.
- Paragraph 6 identifies the text that remained on the old display.
- Paragraph 7 distinguishes typed GLCD installation, switching and quiet startup.
- Factual question: the BAT table must describe discarded output without
  asserting a call of LIST. Preserve the direct return documented by C16.

### Console input

- Paragraph 1 defines the shared one-byte received-character buffer.
- Paragraph 2 distinguishes non-cursor polling from the public cursor-aware call.
- Paragraph 3 explains keyboard/serial waits, bit stripping and model-specific NUL/input handling.
- Keep the distinction between a model input trigger and a physical keypad read.

### The serial port, the punch and the reader

- Paragraph 1 defines the no-UART, port-bit and terminal-setting contract.
- Paragraph 2 derives TXBYTE's masking, loop, stop bits and measured character cost.
- Paragraph 3 derives RXBITS sampling and masking.
- Paragraph 4 explains generated counts, edge uncertainty and the FAST requirement.
- Paragraph 5 explains the absence of hardware buffering and stream limits.
- Paragraph 6 and three bullets define the fixed list, punch and reader paths.
- Paragraph 7 explains an independent byte channel, pending console bytes and BAT.
- Preserve all timing derivations here or in a timing reference. Earlier serial
  use needs settings and observable limitations, not this cycle accounting.

### The matrix keyboard

- Paragraph 1 specifies port/address selection and the physical key numbering.
- Paragraph 2 defines the Matrix-switch enable condition.
- Paragraph 3 explains incremental/full scans and the two highest keys recorded.
- Paragraph 4 explains evaluation, modifiers, repeat suppression, Caps and queued arrows.
- Paragraph 5 explains table-derived characters and Ctrl/Shift forms.
- Keep electrical scan and modifier semantics distinct from ordinary correction keys.

### The video terminal

- Paragraph 1 contrasts PC terminal interpretation with ROM interpretation.
- Paragraph 2 gives the actual console-output dispatch including direct BAT discard.
- Paragraph 3 defines rendering/row vectors and LINEBUF.
- Paragraph 4 explains attributes, delayed wrap, dropped bytes and controls.
- Paragraph 5 explains scrolling through the shared row buffer.
- Paragraph 6 and sequence table describe the parser's stored state and actions.
- Paragraph 7 gives non-VT100 parameter behaviour, row editing and scroll constraints.
- Paragraph 8 explains cursor inversion, presence tracking and conditional drawing.
- Preserve the exact terminal subset without repeating a second full user-facing
  catalogue where a source explanation and the reference table suffice.

### The displays and the claim

- Paragraph 1 defines the display vector table and dimensions.
- Paragraph 2 explains probing, ROM table construction, width changes and registry record.
- Paragraph 3 records the four-byte light-green palette change at its qualified source.
- Paragraph 4 explains UC1 registration and quiet startup/device rejection.
- Paragraph 5 explains removal and selection invalidation versus an active PICO.
- Paragraph 6 explains hidden page updates and the three page functions.
- Paragraph 7 explains graphics claim suppression and restoration before page zero.
- Preserve the palette and claim contracts. Ordinary startup needs only the
  visible selected console, not probe bytes, vector copies or page-flip internals.

## Chapter 17: The SD card and the volumes

Opening paragraph separates block transport, container validation and BIOS
record mapping. These form a coherent bottom-up implementation route.

### The SD card driver

- Paragraph 1 defines SPI pins and success/error state.
- Paragraph 2 explains send/receive byte loops and end-of-transfer clocks.
- Paragraph 3 defines command bytes, arguments, CRC cases and response polling.
- Paragraph 4 and five ordered steps trace initialisation and error branches.
- Paragraph 5 defines LBA conversion and standard-card overflow rejection.
- Paragraph 6 explains reads, token rejection, timeout and ignored CRC.
- Paragraph 7 explains writes, acceptance token, busy timeout and return meaning.
- Paragraph 8 gives unrolled block loops, I-register use and historical timings.
- Paragraph 9 explains direct EXPAND-1 buffers and the no-stack rule.
- Factual question: distinguish a token-test instruction cost from the complete
  SPI byte-poll cost when refreshing the quoted 11/678 T-state comparison.

### The container's checks

- Paragraph 1 defines the header/descriptors and generated format authority.
- Paragraph 2 explains cached table-block acquisition, SDLBA restoration and MNBUF.
- Paragraph 3 gives ordered header checks and the first-failure boundary.
- Paragraph 4 explains format variants, drive count, extra checksum blocks and summing.
- Paragraph 5 walks descriptor checks, placement and drive validity.
- Paragraph 6 derives non-overlap and tolerated cache-byte bits.
- Paragraph 7 explains all-or-nothing mount, capacity limits and the standard-card tests.
- Paragraph 8 and short-card capture distinguish model bounds and surviving drive A.
- Paragraph 9 and corrupt-header capture show diagnostic prompt entry.
- Paragraph 10 explains case-insensitive retry and external byte inspection.
- Keep model rejection distinct from physical-card behaviour that the ROM cannot probe.

### The drive table and the DPHs

- Paragraph 1 defines drive entries, volume indexes and empty-drive selection.
- Paragraph 2 and DPH table map the BDOS's disk parameters and shared buffers.
- Paragraph 3 defines both DPBs, fixed-media assumptions and warm-login scratch.
- The reader needs these structures for deblocking and directory/allocation code,
  not to list a volume or select B at a prompt.

### Deblocking and the write decision

- Paragraph 1 states track/sector/record arithmetic and setup calls.
- Paragraph 2 traces bounded MAPREC conversion to a card block and quarter.
- Paragraph 3 defines write types and layered read-only checks, including close.
- Paragraph 4 explains directory-change marks for later vector rebuilds.
- Paragraph 5 explains the one merge/write path through the cache.
- Paragraph 6 explains skipping reads of new blocks and the retained key condition.
- Paragraph 7 distinguishes through/behind control flags.
- Paragraph 8 derives a sequential-write trace with no data reads.
- Preserve the zeroing/random-write safety condition and full layered failure scope.

### The volume services

- Paragraph 1 and three bullets define the MOUNT program's numbered interfaces.
- Paragraph 2 gives entry state, return contract, failures, slot rules and stack bounds.
- Paragraph 3 traces flush-before-change, reset/reselection and retained DPB pointers.
- Paragraph 4 distinguishes live state from card header defaults.
- Paragraph 5 and capture demonstrate slot failure and describe-service listing.
- Paragraph 6 gives the full-drive-slot alternative and its TPA cost.
- Separate user mounting from this implementation contract while retaining its
  exact lifetime, error and non-reentrant BDOS-call qualifications.

## Chapter 18: The block cache

Opening paragraph derives repeated-read and write-batching needs from expensive
bit-banged transfers. This supplies a reason for the mechanism.

### Thirty lines and their table

- Paragraph 1 defines line size, address range and CLADR arithmetic.
- Paragraph 2 defines keys, dirty bytes and the three line states after cold boot.
- Paragraph 3 states the card-block key invariant independent of drive names.
- Paragraph 4 and list identify the four resident state bytes, including CIFF's word.
- Paragraph 5 explains latch restoration and stack prohibition during bank access.

### Reads through the cache

- Paragraph 1 traces hit/miss data flow from BIOS READ.
- Paragraph 2 explains direct card-to-cache fill and failed-line invalidation.
- Paragraph 3 gives clean-line preference, round-robin replacement and dirty eviction.
- Paragraph 4 states measured hit, miss and lookup costs.
- Paragraph 5 explains cross-bank copying and its measured low/high-buffer costs.
- Paragraph 6 interprets the supplied card's DIR cache hits.
- Paragraph 7 and READ listing define the file-read measurement workload.
- Paragraph 8 and host commands prepare a controlled timing card.
- Paragraph 9 specifies exact prompt-to-prompt measurement boundaries.
- Paragraph 10 demonstrates a cache-size boundary with a larger file.
- Preserve reproducible method and data, with new measurement only after allocation.

### Writes through

- Paragraph 1 defines synchronous write success and invalidation on failure.
- Paragraph 2 explains the recently assigned line's replacement-pointer reuse.

### Writes behind and the directory rule

- Paragraph 1 traces descriptor/drive/write flags and the supplied WORK volume.
- Paragraph 2 explains finding, filling or clearing the line before a record copy.
- Paragraph 3 distinguishes data success from directory ordering and retained failures.
- Paragraph 4 identifies creation, close and extent boundaries as directory writes.
- Paragraph 5 traces the six physical writes of a controlled SAVE.
- Paragraph 6 explains early eviction during a larger file.
- Paragraph 7 compares controlled through/behind timings.
- Keep successful close, failed close and overwritten existing blocks distinct.

### The order of a flush and its five occasions

- Paragraph 1 separates line order from block order.
- Paragraph 2 explains directory/data ordering, partial persistence and no rollback.
- Paragraph 3 distinguishes clean, retained-failed and dropped-failed lines.
- The five-item list records directory, eviction, warm-boot, mount and explicit flush.
- Paragraph 4 connects Ctrl-C with flushing and reset with loss of unwritten lines.
- Factual question: “after it every change is on the card” needs a successful-flush
  condition consistent with the following Write lost section.

### Write lost

- Paragraph 1 defines delayed failure reporting, dropping lines and chain state.
- Paragraph 2 distinguishes immediate directory errors and repeated data attempts.
- Paragraph 3 explains card removal, conditional post-reinsertion failures and pressure
  from retained dirty lines. Preserve the conditional source-supported statement.

### Interrupts held off

- Paragraph 1 derives the masking requirement from the disappearing stack.
- Paragraph 2 explains NMOS IFF testing, stored flags, result preservation and callers.
- Paragraph 3 enumerates restore-only EI paths and the conditional RST7 default.
- Paragraph 4 states measured latency and scheduling/storage choices for an
  interrupt-dependent program. Preserve this advanced consequence after the
  caller understands stacks, banks and synchronous disk operations.

Last headings read: The displays and the claim; The volume services;
Interrupts held off. All three chapter reads reached their final paragraph.
