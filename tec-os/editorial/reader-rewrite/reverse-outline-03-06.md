# Existing Chapters 3 to 6: reverse outline

Read all four files completely at `10821b6`, including every command, table,
transcript, recipe, error example and prepared-card instruction.

## Chapter 3: The command line

Opening paragraph classifies built-ins and card programs through the CCP.
The practical distinction is useful. The internal processor name is optional.

### The line

- Paragraph 1 explains Return, length and case conversion through BDOS 10.
- The wildcard capture demonstrates case-insensitive commands and file patterns.
- Paragraph 2 defines command, arguments and built-ins after that example.
- Paragraph 3 introduces chaining punctuation before the ordinary command list.
- Establish command/arguments before a complex pattern. Defer the BDOS entry,
  the line's capacity edge and chaining until a practical use requires them.

### File names and wildcards

- Paragraph 1 defines 8.3 names, an omitted type and drive-qualified names.
- Paragraph 2 lists excluded characters and the parser's part delimiters.
- The failure capture contains overlong names, wildcard TYPE and extra operands.
- Paragraph 3 explains those failures and the argument printed by DIR.
- Paragraph 4 defines the two wildcard forms and internal expansion to question
  marks, including ignored characters after a star.
- Paragraph 5 explains padding spaces and the four-character COM pattern.
- Keep simple names and a useful DIR pattern early. Preserve full parsing and
  matching rules in an operator reference or later command chapter.

### The built-in commands

- The table mixes ordinary file operations with SAVE, user areas, service
  installation and console configuration. Partition by reader task.
- Paragraph 1 explains whole-word matching and the meaning of A:DIR.
- Paragraph 2 gives each command's wildcard policy.
- DIR paragraph 1 explains selection, columns, totals and NO FILE.
- DIR paragraph 2 adds paging, user areas, hidden system files and BDOS 30.
- DIR paragraph 3 compares a historical display layout without a new action.
- TYPE paragraph 1 explains records, end-of-text and the example.
- The STARTUP capture shows a short text file.
- TYPE paragraph 2 explains blank lines, missing files and paging.
- COPY paragraph 1 explains destinations, inferred names, record counts and
  replacement. The alias-type edge is more advanced than an ordinary copy.
- Paragraph 2 introduces rename/erase and the combined copy/rename capture.
- The capture includes successful operations, an existing-name failure and
  an erase repeated after the file is gone.
- Paragraph 3 explains allocation size and those failures.
- Paragraph 4 explains REN's drive rule and conflicting-drive failure.
- Paragraph 5 introduces same-file COPY detection and the next capture.
- That capture compares inferred destination names with two invalid copies.
- Paragraph 6 adds implied current-drive copies and extra-argument failure.
- Paragraph 7 and the ERA confirmation capture explain Y and safe cancellation.
- Paragraph 8 distinguishes subset wildcard erase without confirmation.
- SAVE paragraph 1 explains raw memory pages, loaded code and historical use.
- SAVE paragraph 2 introduces the TPA page limit and its capture.
- SAVE paragraph 3 explains invalid counts, replacement and full-drive partial
  files, then a CP/M implementation difference.
- Preserve exact destructive/replacement rules. Teach ordinary copying and
  recovery of mistakes after file navigation. Raw-memory SAVE needs program
  memory knowledge and is not an opening command.

### Drives and user areas

- Paragraph 1 explains current drive and failure on an unmounted drive.
- The error capture demonstrates C: selection and DIR C: from B.
- Paragraph 2 explains the recovery key and accepted drive-letter range.
- Paragraph 3 introduces user areas, their visibility and prompt number.
- The USER capture demonstrates private files with a shared area-0 program.
- Paragraph 4 explains program fallback, COPY's area limit and PC --user.
- Paragraph 5 describes 0004h persistence, missing-volume fallback and reset.
- Keep drive selection early. User areas and search exceptions belong after
  ordinary file use. The byte encoding belongs in programming memory material.

### Running a program

- Paragraph 1 gives the complete drive/area search order, load address and
  explicit-drive exception, followed by MOUNT/failure examples.
- Paragraph 2 explains ignored extensions and the distinct SVC rule.
- Paragraph 3 explains absent, oversized and unreadable program failures.
- Paragraph 4 explains the command tail and warm-boot persistence through
  page zero and cache flushing.
- The early ordinary path is typing an installed program's name, observing its
  result and returning to a prompt. Retain search rules later without forcing
  page zero, service files and cache mechanics into that first action.

### Several commands on one line

- Paragraph 1 and capture introduce the separator and echo of each command.
- Paragraph 2 defines pieces, empty pieces, case and whitespace.
- Paragraph 3 and capture show drive/user effects lasting across pieces.
- Paragraph 4 explains relative filenames and the boundary of a command tail.
- Paragraph 5 adds maximum length, history and startup-line interaction.
- Paragraph 6 and capture introduce conditional pieces and dropping a line.
- Paragraph 7 explains previous-line status and the three cases in the capture.
- Paragraph 8 distinguishes a printed error from a program's return status,
  then introduces a replacement chained line from TED.
- The event list enumerates all ways the remainder is discarded.
- The following paragraph and BDOS-error capture distinguish reset from a new
  prompt and demonstrate loss of the MOUNT piece.
- Final paragraph distinguishes stop-listing keys from dropping a chain.
- This is a later automation theme after repeated ordinary commands and the
  editor's build/run behaviour have supplied a reason for command chaining.

### Failure messages

- The first table classifies CCP failures by command and cause.
- Paragraph 1 explains the printed offending word and missing-argument exceptions.
- Paragraph 2 and BDOS table distinguish disk-level failures.
- Paragraph 3 explains recovery-key termination, error modes and failed flushes.
- Paragraph 4 prepares a special read-only card before an error capture.
- The shell block and capture demonstrate read-only volume and file failures.
- Paragraph 5 distinguishes drive protection from permanent volume flags.
- Keep ordinary unknown-file/name recovery near initial commands. Preserve the
  complete failure catalogue and constructed faults as reference/deeper use.

### Command history

- Paragraph 1 explains previous/next recall, editing and the screen example.
- The screen shows a recalled DIR command run again.
- Paragraph 2 gives storage capacity, duplicate suppression and reset lifetime.
- Recall actions can support early command use. Byte capacity and backing
  storage need the later history mechanism.

## Chapter 4: Cards and volumes

Opening paragraph makes PC image construction the starting action and defines
an image. It belongs after using the supplied card, not before a first program.

### The container and its volumes

- Paragraph 1 explains CP/M size limits, the container, header and descriptors.
- Paragraph 2 introduces the info command and its complete output.
- Paragraph 3 explains layout offsets and alignment of the starter card.
- Paragraph 4 decodes each info field and written-behind/free-space markers.
- Paragraph 5 gives limits and all-or-nothing header validation with references.
- Keep the drive/volume distinction in ordinary use. Defer header layout and
  offsets to card construction or the container reference.

### The two disk sizes

- The introductory paragraph and table define geometries and allocation units.
- Paragraph 2 derives file allocation, directory capacity, extents and records.
- Paragraph 3 explains external CP/M disk-tool compatibility.
- Preserve as later storage-format knowledge. None is a prerequisite to editing
  and saving a banner on the supplied WORK volume.

### Building a card with tecvol

- Paragraph 1 and create command define volume specifications and four drives.
- Paragraph 2 gives existence, A-drive, label, drive-count and alignment checks.
- Paragraph 3 defines put/dir, names and text conversion with worked commands.
- Paragraph 4 and listing explain the default drive and file size output.
- Paragraph 5 explains record padding, get and reverse text conversion.
- Paragraph 6 gives erase, user selection, attributes and force protection.
- Paragraph 7 distinguishes read-only creation from populated recipes.
- Paragraph 8 states atomic image replacement and introduces the info output.
- Paragraph 9 explains unmounted volumes, format version and verify exit status.
- Factual question: check the stated temporary-file validation order against
  actual saveImage, not earlier documentation. Preserve the atomicity condition.

### Recipes and the starter card

- Paragraph 1 defines reproducible component identity and the recipe command.
- The volume block and component block show the two recipe structures.
- Paragraph 2 explains populating read-only volumes and the web recipe's DEMO.
- Final verification must refresh component bytes and hashes at the offered pin.

### Putting an image on a card

- The install command and first paragraph explain a destructive whole-device
  write, platform device names, exclusive use and reset after PC changes.
- Paragraph 2 introduces card size versus container size and truncation setup.
- The truncated-card capture demonstrates a directory read failure.
- Paragraph 3 distinguishes a later failure after a complete directory.
- Paragraph 4 gives the standard-capacity addressing bound and mount error.
- Keep overwrite warnings with installation. Fault construction and capacity
  mechanics belong after the normal image-install/use path.

## Chapter 5: Drives, the cache and your work

Opening paragraph joins mounted volumes and caching and assumes the custom
four-volume image from Chapter 4. This prerequisite excludes a simple supplied-card path.

### Drives and MOUNT

- Paragraph 1 and boot capture establish the custom card's initial assignments.
- Paragraph 2 and MOUNT capture show listing, labels/indices and live assignment.
- Paragraph 3 explains duplicates, missing labels, unmounting and syntax.
- Paragraph 4 distinguishes memory assignments from the on-card default and
  explains flushing/reselection before a mount ends.
- Paragraph 5 recalls empty-drive errors.
- Paragraph 6 explains vector-sized mount limits before a failed/successful capture.
- Paragraph 7 connects --drives to full-size vectors and later byte accounting.
- Separate observable mount operations from allocation-vector implementation.

### The block cache and the volume written behind

- Paragraph 1 explains thirty cached blocks in a bank with measured read times.
- Paragraph 2 defines written-through success and failed-line invalidation.
- Paragraph 3 and the five-event list define written-behind flushing conditions.
- Paragraph 4 explains batched-record performance and SAVE timings.
- Paragraph 5 states directory-after-data ordering and its guarantee.
- Paragraph 6 distinguishes retained data-write failures from dropping flushes.
- Paragraph 7 introduces a deliberately truncated data-area card.
- The setup and capture demonstrate Bad Sector followed by Write lost.
- Paragraph 8 traces the file's empty on-card entry and failed close.
- Paragraph 9 makes an unconditional reinsertion/failure claim. Align it with
  the conditional source-supported treatment already recorded by C16.
- Preserve flush-before-power-off early. Move timing, banks, record grouping
  and the failure mechanism to a later storage/recovery theme.

### The drives after a reset

- Paragraph 1 defines reset's discarded state and conditional volume retention.
- The capture demonstrates a retained mount and unmounted B across reset.
- Paragraph 2 explains all-or-nothing retention and power-loss differences.
- Paragraph 3 explains reset after external changes through cached allocation
  state. Teach the observable safe action before this internal reason.

### Recovering after a power cut

- Paragraph 1 states no rollback/journal and partial persistence before close.
- Three bullets distinguish written-through overwrite/new allocation,
  written-behind persistence and a torn physical block/directory write.
- Paragraph 2 and dd/verify commands establish recovery on a copy.
- Paragraph 3 and fault list describe directory validation and its limits.
- Final paragraph explains extraction and rebuilding rather than in-place repair.
- Keep all failure qualifications. Establish successful saving first, then the
  recovery procedure and finally the implementation explanation of its limits.

## Chapter 6: The startup file

Opening paragraph explains the untyped boot line and configuration purpose.
The opening use chapter needs only that visible explanation, not configuration.

### The startup file

- Paragraph 1 and TYPE capture show the starter file's one line.
- Paragraph 2 defines resident service code and previews later service commands.
- Paragraph 3 prepares a six-line file through PC text conversion.
- The boot capture demonstrates line echo, user/drive effects and failure continuation.
- Paragraph 4 explains each command's effect and identifies the first interactive prompt.

### The rules of a line

- Paragraph 1 and a cut-record setup/capture demonstrate the one-record limit.
- Four bullets give delimiters, end markers and line/record boundary rules.
- Paragraph 2 and dollar-name setup/capture separate echo truncation from execution.
- Paragraph 3 distinguishes program termination, line drop and file continuation.
- Paragraph 4 introduces quiet device failures and conditional commands.
- The two-line setup/capture contrasts absent hardware with absent files.
- Paragraph 5 explains quiet success versus typed failure.
- Preserve exact record/echo/quiet conditions later. They are advanced startup
  semantics, not prerequisites for running TED or the first banner.

### When the file runs

- Introductory paragraph and three bullets classify exits and recognised resets.
- Paragraph 2 specifies reset's cleared state, default console and file replay.
- Paragraph 3 prepares distinct startup files on two possible A volumes.
- The reset capture shows the selected volume's startup file taking effect.
- Paragraph 4 explains the resulting missing-MOUNT/GLCD recovery limitation.

### Display lines

- Paragraph 1 defines the ordinary PICO/GLCD startup relationship.
- Three bullets state the board-dependent GLCD outcomes without changing the script.
- Paragraph 2 and table give absent-keyboard failure and the capture-board mapping.
- Paragraph 3 and SERVICES/CON capture show no resident driver for PICO.
- Paragraph 4 explains the pre-driver serial banner on the other boards.
- Paragraph 5 and width-card setup introduce a persistent width preference.
- Paragraph 6 and screen show the visible clear and narrower DIR.
- Paragraph 7 and serial capture show quiet failure of an inapplicable width line.
- Paragraph 8 points at the web page's rewriting policy.
- Product policy remains unchanged. The exploratory GLCD question is separate.

### Services at the prompt

- Paragraph 1 defines residence, memory cost and the ROM console distinction.
- Paragraph 2 and capture give explicit SVC selection, listing and unloading.
- Paragraph 3 explains list ordering, removal order and reset/warm-boot lifetime.
- Paragraph 4 and capture demonstrate duplicate-driver installation failure.
- Paragraph 5 and capture demonstrate fallback when the current driver is removed.
- Paragraph 6 gives old-card format/type migration and the obsolete PICO driver.
- Move after ordinary editing and program use. Preserve the whole mechanism in
  the later resident-service theme and migration reference.

### When the file goes wrong

- Paragraph 1 explains skip timing and the keypad NMI jumper hazard.
- Paragraph 2 gives post-skip console, drive retention and board/web recovery.
- Paragraph 3 and two bullets define the status LCD's two failure words.
- Paragraph 4 and setup/capture demonstrate GLCD? on a serial-only board.
- Paragraph 5 and renamed-driver setup/capture demonstrate clearing the word.
- Paragraph 6 explains which output went to each console.
- Paragraph 7 distinguishes clearing the ROM's word, a program's LCD row and
  direct port output, then CARD? clearing on retry.
- Preserve safety and recovery procedures with their prerequisites. Defer the
  row-ownership and direct-port interaction until hardware programming.

Last headings read: Command history; Putting an image on a card; Recovering
after a power cut; When the file goes wrong. Every file was read through its end.
