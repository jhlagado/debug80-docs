# Existing Chapters 7 to 9: reverse outline

All three files were read completely at `10821b6`, including assembly listings,
host commands, register tables, screen captures and memory tables.

## Chapter 7: A first program

Opening paragraph moves from supplied SAMPLE to authored HELLO but also
promises PC compilation and a file-reading program. These are separate jobs.

### A program and the BDOS

- Paragraph 1 defines the COM image, origin and hardware-independent calls.
- Paragraph 2 surveys calling registers, results, register preservation, stack
  storage and the TPA boundary before the first source listing.
- Paragraph 3 and the four-function table introduce FCB file operations to
  prepare the second program. Extract only the print operation for the banner.

### A program that prints

- The introduction and HELLO listing provide the small authored print program.
- The explanation defines origin, string address, terminator, line ending,
  return and assembled size. Preserve this useful kernel with verified current
  syntax. Explain only the registers and instructions the example needs.

### Building and running it on the TEC-1G

- Paragraph 1 introduces TED/TAS, B as the work drive, editing, status and save.
- Paragraph 2 and the key table combine essential build/run with open/previous
  file actions and a debugger absent from the starter card.
- Paragraph 3 explains chained drive-qualified commands through 0050h.
- Paragraph 4 introduces an intentional syntax error before the first success.
- The error capture shows the assembler message and TED restart.
- Paragraph 5 and the editor screen show automatic error positioning.
- Paragraph 6 and run capture repair the mistake and demonstrate success.
- Paragraph 7 explains the return key, quit, COM/DBG outputs and project/session files.
- Paragraph 8 explains later standalone runs and explicit-drive use from A.
- Preserve editing and repeatable build/run before the mechanism behind TED's
  chaining or its project files. Establish a successful text change before a
  deliberate error. Defer unavailable debugger keys and host compilation.

### The same program from a PC

- Paragraph 1 and ATOM command establish the alternate host build route.
- Paragraph 2 discusses other assemblers and prepares a copy of the card.
- Paragraph 3 and capture put, list and run the built file on the board.
- Paragraph 4 explains the prompt's blank line.
- Paragraph 5 gives web file import/export and its reset/saving consequence.
- Preserve this route after an ordinary on-board build, with PC-card tool
  prerequisites already taught. Do not require two toolchains in the first edit.

### The command line a program receives

- Paragraph 1 introduces SHOW and three page-zero inputs.
- Paragraph 2 defines the command tail and its capitalised example.
- Paragraph 3 defines the FCB structure and both parsed filenames.
- Paragraph 4 defines sequential record state and caller initialisation.
- Paragraph 5 explains the load-drive byte used by TED.
- Move the complete interface to command arguments/file programming after
  register and buffer concepts. No part is needed to change the banner text.

### A program that reads a file

- The SHOW listing uses open/read, DMA, byte output, register saves and EOF.
- Paragraph 1 explains open status, record reads and overlapping tail/DMA storage.
- Paragraph 2 explains per-byte output, saved registers, EOF and record padding.
- Paragraph 3 explains a tail jump to BDOS as program termination.
- Paragraph 4 and commands build/copy the second program from a PC.
- The capture demonstrates printing the earlier source and a missing file.
- Paragraph 5 gives the no-argument result.
- Preserve as a later complete file-reading lesson with its own prerequisites.

### The ways a program ends

- Paragraph 1 and the six-item list enumerate ordinary warm-boot exits.
- Paragraph 2 traces flush, restored vectors, retained state and drive fallback.
- Paragraph 3 explains the borrowed stack, its limit and a private-stack exit.
- Paragraph 4 gives reset as crash recovery with a loss/retention consequence.
- Keep RET's observable return with the banner. Defer the full exit contract,
  page-zero restoration and stack management until programs require them.

## Chapter 8: Memory for programs

Opening paragraph gives the movable safety boundary and warns about corruption.

### The 64 KiB on a TEC-1G

- The introductory table classifies fixed RAM, bank window and ROM.
- Paragraph 2 describes latch selection and the initial address view.
- Paragraph 3 locates page zero, TPA, allocation vectors and the workspace.

### The limit a program reads

- Paragraph 1 defines the word at 0006h and the exclusive program limit.
- The TOP listing demonstrates hexadecimal printing and a register-preserving helper.
- Paragraph 2 explains that helper and prepares the host-built example card.
- Paragraph 3 and capture record the unextended TPA boundary.
- Paragraph 4 and split-console capture demonstrate a lowered boundary after
  loading the graphics driver. The configuration and services are prerequisites.

### The drives, the services and the word

- Paragraph 1 and table distinguish TPA size from maximum loaded file size.
- Paragraph 2 explains vector bits, sizes and placement below the workspace.
- Paragraph 3 distinguishes header-sized from full-drive vector allocation.
- Paragraph 4 explains page-rounded service placement and lost partial-page bytes.
- Paragraph 5 and AREA listing calculate and print available program bytes.
- Paragraph 6, host commands and capture explain repeated-subtraction decimal output.
- Preserve numeric methods and their source pins. Separate the caller's buffer
  boundary from the later allocation/vector/loader accounting that determines it.

### The largest program that loads

- Paragraph 1 derives record/page loading limits versus writable program memory.
- Paragraph 2 warns about crossing the boundary and explains the borrowed stack.
- Paragraph 3 contrasts the ROM CCP with historical RAM CCP overlaying.

### Page zero

- The table specifies CP/M and TEC-OS low-memory contracts.
- Paragraph 2 derives the BIOS table from the warm-boot word.
- Paragraph 3 explains restart-vector ownership and sweeping.
- Paragraph 4 explains interrupt mode, default masking and temporary masks.
- Paragraph 5 states the keypad NMI/FCB collision and required jumper condition.
- Programming contracts belong before BIOS hooks and private stacks. Detailed
  sweep mechanics belong with reset and resident services, not the first banner.

### The latch byte

- Paragraph 1 explains the shadow byte and bank-independent visibility.
- Paragraph 2 states the caller's obligation after a direct latch write.

### EXPAND 1

- The table identifies cache/history/free ranges.
- Paragraph 2 explains the missing BDOS, BIOS, workspace and stack under a switch.
- Paragraph 3 describes an EXPAND-1 exit reaching warm boot through the ROM.
- Preserve as advanced bank/interrupt programming with a concrete corruption
  risk. Do not impose bank-switching knowledge on ordinary file users.

## Chapter 9: Programs and the console

Opening paragraph introduces BDOS and BIOS levels and a byte-level route.

### The BDOS's console functions

- The table gives ordinary, direct, string, line and status calls.
- Paragraph 2 explains tab expansion, list copying, pause keys and edited input.
- Paragraph 3 distinguishes direct I/O for an interactive or full-screen program.
- Develop from the banner's print call toward an interactive need before the
  full function survey. Preserve each control-key and pending-byte condition.

### The BIOS's console calls

- Paragraph 1 and table locate the three raw console calls from page zero.
- Paragraph 2 distinguishes bytes from interpreted control actions.
- Paragraph 3 explains interrupt/cursor state, non-reentrancy and stack cost.
- Paragraph 4 and KEY listing demonstrate raw key-code output on a private stack.
- Paragraph 5 and host commands explain self-patched jumps and termination.
- Paragraph 6 and capture supply raw serial control-key results.
- Paragraph 7 contrasts raw Ctrl-C with edited-line termination.
- The raw BIOS path needs stack and program-memory prerequisites, unlike the
  first printed line. Preserve as a later interface/extension lesson.

### One level or the other

- Paragraph 1 explains lost keys when pending BDOS input and BIOS reads are mixed.
- Paragraph 2 explains hookable jumps, one direct ROM exception and restoration.

### The video terminal

- Paragraph 1 and control table define rendering and six controls.
- Paragraph 2 specifies ignored bytes.
- Paragraph 3 explains delayed wrap and exact-width line endings.
- Paragraph 4 and sequence table define the supported ANSI subset.
- Paragraph 5 gives scroll-region behaviour and reset lifetime.
- Paragraph 6 explains unsupported sequences and discarded bytes.
- Paragraph 7 gives queried screen size and the serial limitation.
- Paragraph 8 prepares TERM to demonstrate cursor/clear/reverse effects.
- Paragraph 9 and screen capture explain the screen renderer's loss of attributes.
- Paragraph 10 gives TERM's scrolling variant.
- Preserve full terminal semantics as an interface reference linked to a later
  screen-program lesson. Host fixture construction is not an early paging step.

### The cursor

The paragraph explains reverse-cell drawing only during input waits, removal
on output and suppression during pending wrap. Keep every condition.

### The other devices

- Paragraph 1 defines all IOBYTE fields and the three fixed non-console devices.
- Three bullets give list discard/status, serial punch and serial reader contracts.
- Paragraph 2 explains a separate serial byte channel with a video console and
  the absence of an input queue. This is an advanced communications use case.

Last headings read: The ways a program ends; EXPAND 1; The other devices.
All assembly and transcript fences were read. No new execution qualification
is implied by this outline.
