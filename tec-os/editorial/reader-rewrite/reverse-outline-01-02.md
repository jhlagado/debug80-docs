# Existing Chapters 1 and 2: reverse outline

Read both files completely at `10821b6`, including every table, command,
transcript and screen fence. These are reading notes, not rewritten prose.

## Chapter 1: Introduction

Opening paragraph: replaces monitor/keypad use with prompt and file use, then
adds historical CP/M compatibility. The visible change is useful at the
opening. Universal compatibility needs qualification for console assumptions.

### TEC-OS and CP/M

- Paragraph 1 locates the operating system in ROM and files on the card.
- Paragraph 2 names CCP, BDOS and BIOS and assigns responsibilities. Defer to
  an implementation overview after practical use and program calls.
- Paragraph 3 adds cache banks, alternative consoles and hardware services.
  Defer each to its justified storage, console or programming theme.

### Turning it on

- Paragraph 1 introduces the serial-board boot transcript.
- The transcript establishes banner, mounted drives, a startup command and
  the final prompt. Keep a real boot example, refreshed at the final pin.
- Paragraph 2 explains version, volumes, drive letters and the status LCD.
- Paragraph 3 defines the current-drive prompt and explains the untyped
  startup line. The early explanation needs only its visible consequence.
- Paragraph 4 distinguishes the three working input/output arrangements.
  Retain enough to locate the prompt and keyboard without teaching switching.

### Drives and files

- Paragraph 1 introduces four possible drives and the starter card's A/B roles.
- Paragraph 2 and DIR capture establish a file listing on the current drive.
- Paragraph 3 explains filename/type and identifies TED, TAS, MOUNT and source.
- Paragraph 4 and drive-change capture show an empty B and a return to A.
- Final paragraph is a route-map reference rather than additional file use.

### Running a program

- Paragraph 1 requires assembling SAMPLE before the first program run. The
  ordinary existing-program path should precede this build operation.
- The TAS/SAMPLE capture demonstrates a build, console text and program exit.
- Paragraph 2 explains LCD, digits, beep and screen-size results. These require
  hardware services and multiple output surfaces too early for a first banner.
- Paragraph 3 and NOSUCH capture explain failure to find a command/program.

### The memory

- Paragraph 1 and address table introduce RAM expansion and the program map.
- Paragraph 2 explains load origin and the upper memory boundary in page zero.
- Paragraph 3 adds bank sharing, cache and history placement.
- Defer the complete section. A successful first edit/build/run needs none of
  these addresses, names or bank relationships.

### Keeping your work

- Paragraph 1 explains written-behind storage through cache batches. Preserve
  the saving requirement early but defer the mechanism.
- Paragraph 2 explains Ctrl-C before reset, removal or power-off. Keep this
  action with the earliest saved work and state the failure qualification.
- Paragraph 3 prevents concurrent PC/board card changes and requires reset
  after reinsertion. The allocation-map reason belongs in later storage detail.

Prerequisites used too early: CP/M architecture, a compiler workflow, page
zero, address notation, RAM banks, caches and numbered hardware calls.
Factual questions: final card listing, first-console capture and flush-failure
wording. No physical-board result is inferred from the existing model captures.

## Chapter 2: The console

Opening paragraph defines the input/output pair and immediately introduces
switching. Normal use needs the first relation, not all configuration choices.

### The four console devices

- Paragraph 1 begins with the IOBYTE address and bits before any practical
  need. It also reverses the naming relation: devices have names, not names
  devices. This sentence must be replaced, not tidied with synonyms.
- The table combines operational names with an internal bit encoding. Split
  the operational mapping from the later IOBYTE programming interface.
- Paragraph 2 supplies dimensions and the physical devices behind each name.
- Paragraph 3 explains BAT through CP/M reader/list names. Later source facts
  distinguish direct BAT discard from an actual call of the list entry.
- Paragraph 4 excludes the status LCD and points at hardware services.

### The console at cold boot

- Paragraph 1 explains page-zero clearing, the IOBYTE default, device probing,
  the Matrix switch and the resulting selection. Defer the mechanism.
- Paragraph 2 contrasts warm-boot retention with reset selection. Introduce
  the visible reset/program-end distinction only when needed by use.

### The serial terminal

- Paragraph 1 joins essential terminal settings to ports and T-state timing.
  Separate working connection requirements from implementation timing.
- Paragraph 2 explains unchanged serial bytes, ANSI support and unknown size.
- Paragraph 3 explains polling and lost type-ahead/pasted input. Keep the
  practical limitation near relevant terminal use, the polling path later.

### A display as the console

- Paragraph 1 gives the ROM PICO console and its startup conditions.
- Paragraph 2 explains loading GLCD.SVC and the resulting console.
- Paragraph 3 defines video-console terminal behaviour, cursor and escapes.
- Optional display behaviour belongs after ordinary command and program use.

### Moving the console with CON

- Paragraph 1 defines the query and its four replies.
- Paragraph 2 gives selection names, aliases, IOBYTE writes and invalid input.
- The XYZ example demonstrates invalid selection.
- Paragraph 3 introduces the PICO-to-serial transfer and its split echo/reply.
- The serial capture records the new console's reply and prompt.
- Paragraph 4 explains the old screen and return transfer, then screen clear.
- The CRT screen capture shows the visible consequence of that clear.
- Paragraph 5 gives absent-device fallback and automatic GLCD driver loading.
- The serial capture demonstrates both selections leaving a serial board there.
- Paragraph 6 explains both-display startup and later GLCD selection.
- The GLCD capture demonstrates a new prompt and a query there.
- Paragraph 7 contrasts the ROM PICO path with a driver load.
- Paragraph 8 and BAT capture demonstrate silent output and blind recovery.
- Paragraph 9 explains a program's IOBYTE change and external STAT behaviour.
- Paragraph 10 introduces widths, modes, clear/reset retention and its example.
- The width capture combines MOUNT with DIR on a narrow display.
- Paragraph 11 explains the different DIR layout and invalid width forms.
- The invalid-width capture demonstrates unchanged selection after errors.
- Paragraph 12 adds absent-PICO startup versus typed-line quiet/error behaviour.
- Preserve these mechanisms and examples later. They do not justify placing
  this entire selection catalogue before the first program.

### The keyboard and the line

- Paragraph 1 maps the active console to a keyboard source.
- Paragraph 2 explains modifiers and Ctrl notation, mixed with control codes.
- Paragraph 3 explains Caps behaviour but also exposes the latch-bit number.
- Paragraph 4 and arrow table describe Return, Esc and ANSI key bytes.
- Paragraph 5 connects arrow sequences to TED and lists unavailable keys.
- Paragraph 6 explains no repeat and scanning-related missed keys.
- Paragraph 7 and editing table give command-line editing through BDOS 10.
- Paragraph 8 adds capacity, ignored in-line Ctrl-C and history references.
- Paragraph 9 explains pause keys during output, list copying and pending input.
- Keep editing actions where commands first require them. Separate byte codes,
  BDOS function numbers and scan mechanisms from those observable actions.

### Pausing output

- Paragraph 1 explains wrapped-row counting and the more prompt.
- Paragraph 2 prepares a long file with PC tools before card tools are taught.
- The shell block constructs the special card and file.
- Paragraph 3 and screen show the first pause on the small display.
- Paragraph 4 explains wrapping and gives the next-page action and screen.
- Paragraph 5 explains stop keys, chained-line effects and the final screen.
- Ordinary paging belongs with reading files. GLCD dimensions, prepared-card
  tooling and chain-drop details belong with later questions that require them.

Last heading read: “Pausing output”, through the final A> screen fence.
Factual questions: final console defaults, BAT implementation wording, current
key set and the smallest ordinary paging example without a PC setup detour.
