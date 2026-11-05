---
title: TEC-OS
nav_order: 13
has_children: true
nav_exclude: true
---

# TEC-OS on the TEC-1G

With TEC-OS in its ROM, the TEC-1G starts at a command prompt. You can list
files on an SD card and run a supplied program before using the editor and
assembler to make one of your own. TEC-OS provides the CP/M 2.2 programming
interface and calls for the board's devices.

## Starting with a prepared machine

The first session uses an 80-column PICO9918 display and the matrix keyboard,
with the Matrix switch enabled. The board needs a 32,768-byte RAM chip in U9, the
4 MHz FAST setting, the TEC-OS ROM and a prepared starter card. The keypad
NMI jumper is off. SYSTEM is on drive A and WORK is on drive B. Hardware
preparation is described in [Appendix G](appendix-g-tec-1g.md).

[First session](01-first-session.md) begins with that preparation complete.
The commands have visible results, from the initial file listing to building
and running the supplied SAMPLE. [Make a small program](02-make-a-small-program.md)
continues with a short banner entered in TED. You save it, build it with TAS,
change its text and run it again. These two sessions introduce the keys and
commands they use without requiring an earlier CP/M or assembly course.

The banner is a guided copy-and-change exercise. Its instructions and data
are explained beside the listing. The later programming chapters assume you
can read a short Z80 listing with labels, registers and branches. They explain
the TEC-OS call, buffer and stack contracts before examples depend on them.

Serial terminals, the graphics LCD and other display widths have their own
configuration chapter. The web page is an optional way to use the software
machine, with its controls and card-saving rules in
[Appendix I](appendix-i-web-page.md).

## Runs and source

The demonstrations and measurements are from the Debug80 TEC-1G host model,
a software implementation of the machine. They are not physical-board runs.
The diagnostics chapter
separates what a test establishes in software from what a board report can
establish about that board.

Each chapter records the source revision used to check its claims. A retained
historical capture also records the revision and inputs that produced it.
Source references name the file and lines for the stated revision. A source
change may move those lines even when the assembled program is unchanged.
When the prose and its stated source disagree, the source is the authority
and the prose needs correction.

A transcript includes the prompt and the command typed after it, followed by
the output. It may begin at an already-running prompt. Any other omitted output
is identified with the example. Control keys are written with a caret: `^C`
means Ctrl and C together. Reproducing the runs on a PC requires the setup and tools in
[Reproduce the evidence](28-reproduce-the-evidence.md).

Addresses and bytes use hexadecimal with a trailing `h`, as in `0100h`.
Sizes in bytes are decimal. A KiB is 1,024 bytes and a MiB is 1,024 KiB.

## Using the machine

| Chapter | Use |
| --- | --- |
| [1. First session](01-first-session.md) | Power on, find files, run supplied SAMPLE and preserve work |
| [2. Make a small program](02-make-a-small-program.md) | Enter, save, build, change and run a banner |
| [3. Work with files](03-work-with-files.md) | Read, copy, rename and erase files and control long listings |
| [4. Drives and user areas](04-drives-and-user-areas.md) | Locate programs, select volumes and use resident services |
| [5. Cards on the PC](05-cards-on-the-pc.md) | Copy, check, recover and prepare card images |
| [6. Choose a console](06-choose-a-console.md) | Select a display or serial terminal and its settings |
| [7. Commands at startup](07-commands-at-startup.md) | Set up a startup file and bypass it when necessary |

## Writing programs

| Chapter | Use |
| --- | --- |
| [8. Call TEC-OS](08-call-tec-os.md) | Read keys and print through the BDOS |
| [9. Read and write a file](09-read-and-write-a-file.md) | Use file control blocks and record buffers |
| [10. Memory for programs](10-memory-for-programs.md) | Allocate program space and stacks and use raw BIOS calls |
| [11. Use the board's devices](11-use-the-boards-devices.md) | Call hardware services and share the display |
| [12. Results and command chains](12-results-and-command-chains.md) | Report a result and start the next command |
| [13. Write a resident service](13-write-a-resident-service.md) | Install a hook, publish routines and remove the service |

## Inside TEC-OS

| Chapter | Mechanism |
| --- | --- |
| [14. State and memory](14-state-and-memory.md) | Workspace, banks, stacks and state lifetimes |
| [15. Reset and boot](15-reset-and-boot.md) | Reset recognition, cold boot and warm boot |
| [16. Console paths](16-console-paths.md) | BIOS routing, keyboard, serial and terminal code |
| [17. Card blocks and volumes](17-card-blocks-and-volumes.md) | Card commands, container checks and record mapping |
| [18. Cache and persistence](18-cache-and-persistence.md) | Read reuse, write ordering and failed writes |
| [19. A file through the BDOS](19-a-file-through-the-bdos.md) | Directory entries, allocation and file operations |
| [20. From prompt to program](20-from-prompt-to-program.md) | Parsing, lookup and program launch |
| [21. Chains across a warm boot](21-chains-across-warm-boot.md) | Retained command text and conditional continuation |
| [22. The history ring](22-the-history-ring.md) | Bounded storage and recall of command lines |
| [23. Numbered-service dispatch](23-numbered-service-dispatch.md) | Register handling and device routines |
| [24. Loading and removing services](24-loading-and-removing-services.md) | Relocation, publication and rollback |
| [25. Startup inside the CCP](25-startup-inside-the-ccp.md) | Reading lines and handling absent displays |
| [26. Build the ROM and media](26-build-the-rom-and-media.md) | Source, generated data and qualified artifacts |
| [27. Diagnose the machine](27-diagnose-the-machine.md) | Card errors and the separate diagnostics ROM |
| [28. Reproduce the evidence](28-reproduce-the-evidence.md) | Host machine, captures, tests and their limits |

## Reference

| Appendix | Lookup |
| --- | --- |
| [A. BDOS functions](appendix-a-bdos-functions.md) | Registers, effects and errors by function number |
| [B. ROM interfaces](appendix-b-rom-services.md) | Numbered services, the PICO record and font |
| [C. Memory map](appendix-c-memory-map.md) | Addresses and the state cleared at each boot |
| [D. Messages and recovery](appendix-d-error-messages.md) | Causes, partial results and next actions |
| [E. Container format](appendix-e-container-format.md) | Header, descriptors, checks and geometries |
| [F. tecvol](appendix-f-tecvol.md) | Host commands and options |
| [G. Hardware preparation](appendix-g-tec-1g.md) | Required setup, ports and hardware constraints |
| [H. Service format](appendix-h-service-file-format.md) | Header fields, dependencies and relocation data |
| [I. Web page](appendix-i-web-page.md) | Controls, input, saved cards and imports |
| [J. Command reference](appendix-j-command-reference.md) | Exact syntax, names, wildcards and search rules |
