# Terms of the TEC-OS book

This list holds each term's one form, what it means, the chapter that explains
it, and the variants that are correct because they name something else. A
term means what the code at a chapter's commit makes it mean. A short form is the full
form with a word left out, used once the full form has appeared in the chapter.
Fenced blocks and captured output keep their own words, so `README.TXT`'s
"starter disk" and the "program area" in the comments of `TOP` and `AREA` in
Chapter 7 stay as they are.

## Memory

| Form | Short form | Meaning | Explained in | Correct and distinct |
| --- | --- | --- | --- | --- |
| TPA | | `0100h` up to the byte below the word at `0006h` | Chapter 1, again in 7 | "programs have N bytes" is a plain statement of the TPA's size. "Transient Program Area" is the expansion, in Chapters 1 and 7. |
| resident workspace | workspace | TEC-OS's variables, buffers and stacks, `WSBASE` to `WSEND`, with the RAM BIOS table inside it. The allocation vectors and the BDOS entry jump are below it. | Chapter 7, in full 13 | fixed workspace: the part from `WSBASE` to `BEFFh`, whose size the build measures (Chapters 12, 13) |
| page | | 256 bytes | Chapter 3 | page zero, `0000h–00FFh` (Chapter 2); a web page; a PICO9918 page (Chapter 15) |
| BIOS jump table | | CP/M's table of 17 jumps | Chapter 7, in full 15 | RAM BIOS table: the copy at `BF00h` that every caller uses. `BIOSBAS`: the ROM's copy, never called. |
| BDOS entry jump | BDOS's entry | The `JP BENTRY` in RAM directly below the allocation vectors, and the same jump at the start of each service's first page | Chapter 5, in full 13 | `BENTRY`: the routine in the ROM, also "the BDOS's entry" in Chapters 16 and 25, where the code follows |
| boot overlay | overlay | The ROM's first 2 KiB, shown at `0000h–07FFh` while latch bit 0 is low | Chapter 13, in full 14 | Chapter 1 says "the copy" for a reader who has no need of the name. `LATSHAD` and SHADOW are the code's and the board's names for the bit. |
| fixed RAM | | `0000h–7FFFh`; MAIN 0 is its name beside MAIN 1 | Chapters 1 and 7 | MAIN 1, the second 32 KiB a board may have |
| EXPAND 0, EXPAND 1 | | The two halves of the RAM in U9 | Chapter 1 | expansion RAM: the chip as a whole. Bank 1: CP/M 3's name for EXPAND 1 in `MOVE` and `XMOVE`. The diagnostics ROM's "banks" are the runtime's. |
| window | | `8000h–BFFFh`, showing one half of U9 | Chapter 7 | |
| service resident memory | | The pages loaded services hold | Chapter 5 | |

## Boot and reset

| Form | Short form | Meaning | Explained in | Correct and distinct |
| --- | --- | --- | --- | --- |
| cold boot | | The start at `COLD`, after power-on or a reset | Chapter 1, in full 14 | |
| warm boot | | The restart of the CCP at `WBOOTR` | Chapter 1, in full 14 | |
| reset | | The board's reset, always a cold boot | Chapter 1 | recognised reset and unrecognised reset (Chapter 5): whether `RSLCAP` passes. Ordinary exit (Chapter 5): a warm boot. Disk reset: BDOS function 13. |
| selection | | The volumes on the drives, as a recognised reset keeps them | Chapter 4, in full 14 | |
| power cycle | | Off and on, the page's "Power cycle" | Chapter 1 | power cut: an unplanned loss of power (Chapter 4) |

## Cards, volumes and files

| Form | Short form | Meaning | Explained in | Correct and distinct |
| --- | --- | --- | --- | --- |
| SD card | the card | The card in the board's SD card adaptor | Chapter 1 | video card: the PICO9918. A "card" in `tecvol` and the page is a card or its image. |
| starter card | | The image `npm run media` builds, and a card holding it | Chapter 1 | |
| image | | A card image, in Chapters 1, 4 and F | Chapter 4 | ROM image (Chapter 1). A service's bytes after the header are its image (Chapter 10). |
| container | | The header and the volumes on a card | Chapter 4 | |
| volume | | One CP/M disk in the container | Chapter 1 | CP/M's word *disk* stays where CP/M is the subject: disk parameters, disk reset, the BIOS's disk entries |
| drive | | A letter, A to D, through which programs reach a volume | Chapter 1 | |
| current drive | | The drive the prompt shows, used by a name with no drive | Chapter 1 | default drive: the same drive in the BDOS's terms, `DEFDRV`, what an FCB's 0 selects (Chapters 16, A). Bound drive: `CURDRV`, the drive the running function works on, which an FCB may change (Chapter 16). Function 25's name, "Return current disk", is CP/M's. |
| drives field | | Byte 22 of a 1.1 header, the number of drives to set up | Chapter 4, in full E | |
| block | | The card's 512 bytes | Chapter 4 | allocation block: 2 or 4 KiB of a volume (Chapter 4). Chapter 16 states that its *block* alone means an allocation block, and it writes *card block* for the other. Data block and directory block: card blocks holding those. The data block of the ROM (Chapter 12) and the BIOS's, CCP's and BDOS's blocks of RAM (Chapter 13) are regions of memory. |
| record | | CP/M's 128 bytes | Chapter 3, in full 4 | a service's record (Chapter 5) |
| sector | | CP/M's number for a record within a track | Chapters 16 and 18 | `Bad Sector`, a message |
| extent | | 128 records of a file | Chapter 16 | |
| directory mark | mark | The number of directory entries up to the last in use | Chapter 16 | low mark, `XMARK` (Chapter 13) |
| logged in | | A drive whose allocation vector the BDOS has built | Chapter 13, in full 16 | |
| check vector | | CP/M's checksum of a directory, unused here | Chapter 16 | |
| DMA address | | The address the BDOS reads a record to or writes it from | Chapter 6 | default DMA buffer: `0080h–00FFh` |
| FCB | | A file control block | Chapter 1 by name, in full 6 and 16 | `CR` in an FCB is its current record, and CR elsewhere is a carriage return |
| drive table | | `DRVTAB` | Chapter 18 | |
| vector slot | slot | The space cold boot gives a drive's allocation vector | Chapter 14 | |
| BDOS error | | A `Bdos Err On` message | Chapter 4 | |

## The block cache

| Form | Short form | Meaning | Explained in | Correct and distinct |
| --- | --- | --- | --- | --- |
| block cache | the cache | 30 lines in EXPAND 1 | Chapter 1, in full 4 and 19 | |
| cache line | line | The place for one card block | Chapter 7, again in 19 | a line of text, a command line, the serial line, a screen row |
| dirty line | | A line holding changes the card lacks | Chapter 14, in full 19 | Part I and Appendix D say "changes" and "changed block", for a reader with no lines in view |
| flush | | Writing the dirty lines to the card | Chapter 4, in full 19 | |
| written behind | | A volume whose writes wait in the cache; *written-behind* before a noun | Chapter 1, in full 4 | written through, *written-through* before a noun |

## The console

| Form | Short form | Meaning | Explained in | Correct and distinct |
| --- | --- | --- | --- | --- |
| console | | The device commands and replies go through | Chapter 1 | `CON:`, `TTY:`, `CRT:`, `BAT:` and `UC1:`, the console devices (Chapter 2) |
| console field | | The IOBYTE's low two bits | Chapter 2 | console mode, `CONMOD`, the mode in effect (Chapter 15) |
| serial terminal | | The terminal program on a PC, as the console | Chapter 1 | terminal program: the PC's program itself. Video terminal: the ROM's terminal code (Chapter 8). |
| serial port | | The bit-banged port | Chapter 1 | serial line: the wire or signal |
| display | | The PICO9918 or the graphics LCD | Chapter 1 | |
| video console | | The console on a display | Chapter 2 | |
| display driver | | The file that holds a display's console | Chapter 1 | |
| PICO9918 | the chip, in sections about claiming it | The video card | Chapter 1 | |
| VRAM | | The PICO9918's video memory | Chapter 9 | |
| graphics LCD | | The 128 × 64 LCD | Chapter 1 | `GLCD` in file names, symbols and messages |
| 20 × 4 LCD | the LCD | The character LCD, never the console | Chapter 1 | |
| matrix keyboard | | The board's keyboard on port `FEh` | Chapter 1 | "the keyboard" alone: whatever the console reads keys from, in sentences about typing a line. Hex keypad, short form *keypad*: the board's keypad. |
| keypad NMI jumper | | The jumper that makes a keypad press an NMI | Chapter 1 | |
| reverse image | | A cell drawn with bit 7 set | Chapter 2 | reverse video: the terminal's mode (Chapter 8) |
| list device | | CP/M's printer, which discards here | Chapter 2 | |

## Commands and programs

| Form | Short form | Meaning | Explained in | Correct and distinct |
| --- | --- | --- | --- | --- |
| prompt | | `A>`, where the CCP reads a line | Chapter 1 | diagnostic prompt (Chapter 1); the prompt of `ALL (Y/N)?` is not called one |
| built-in | | A command in the CCP | Chapter 3 | |
| command line | line | What is typed at the prompt | Chapter 2 | startup line; display line (Chapter 5) |
| command tail | tail | The rest of a line, at `0080h` | Chapter 3, in full 6 | |
| chained line | | A line split at `!` | Chapter 11 | piece: one command of it (Chapter 11) |
| return code | | The word function 108 sets | Chapter 11 | |
| user area | | One of CP/M's 16 groups of files | Chapter 1 | user number: its number in a directory entry, the BDOS or the byte at `0004h` |
| startup file | | `STARTUP.CMD` | Chapter 1 | |
| `MOUNT` | | The starter card's program | Chapter 4 | the ROM's `MOUNT` routine, its check of the container (Chapters 14, 18). The mount entry, `ABIVOL` (Chapter 18). |
| ABI | | The ROM table's application binary interface | Chapter 8, again in 9 | |
| signature | | The letters `TNA` | Chapter 12 | Chapters 8 and 9 say "the letters" |

## Services and the ROM's entries

| Form | Short form | Meaning | Explained in | Correct and distinct |
| --- | --- | --- | --- | --- |
| service | | What a `.SVC` file installs: code in pages below the BDOS, kept until a reset or `UNLOAD` | Chapter 5, in full 10 and 20 | hardware service, a call in the ROM. `SERVICES`, the built-in that lists loaded services. |
| library | | A service that provides routines for programs | Chapter 5, again in 10 | |
| driver | | A service that drives hardware | Chapter 5 | display driver, one that holds a display's console. The SD card driver and the hardware drivers of Chapter 15 are code in the ROM. |
| record, of a service | | What a service publishes in the registry | Chapter 5, in full 10 | CP/M's record of 128 bytes |
| hardware service | | A numbered call in the ROM, through `ABIHW` | Chapter 1 by name, in full 9, 20 and B | a service, which is loaded from the card |
| ROM table | | The ROM's table at `C003h` | Chapter 1 by name, in full 9 | RAM BIOS table, the copy at `BF00h` |
| mount entry | | The ROM table's jump `ABIVOL` at `C00Fh`, which goes to `VOLSVC` | Chapter 18 | `MOUNT`, the program and the ROM routine |
| stub | | The BDOS entry jump directly below the allocation vectors, at `STUBAD`, which `(0006h)` addresses when no service is in | Chapter 20 | a service's entry at `xx00h`, which `(0006h)` addresses when a service is in |

## The model and the page

| Form | Short form | Meaning | Explained in | Correct and distinct |
| --- | --- | --- | --- | --- |
| host model | the model | `host/machine.mjs` on the runtime, the software TEC-1G | Chapter 1, in full 26 | Debug80 TEC-1G runtime, short form *the runtime*: the npm package under it, and the name to use for what the runtime does (Chapters 15, 26, G). `Machine`, "the machine": the class in Chapter 26. |
| serial board | | A board with only a serial terminal | Chapter 1 | `--board serial` |
| web page's board | | A board with the PICO9918, the graphics LCD and the matrix keyboard, with Display on the PICO9918 | Chapter 1 | `--board pico`. With Display on the graphics LCD the page's board is `--board glcd`. |
| web page | the page | The browser build | Chapter 1 | |

## Forms changed to these

| Old form | Form now |
| --- | --- |
| program area; "the memory programs have" as a name | TPA |
| working memory | workspace, or the CCP's or BDOS's state |
| TEC-1G model, Debug80 model | host model, or Debug80 TEC-1G runtime for the runtime's own behaviour |
| serial-only board | serial board |
| PC's terminal | serial terminal |
| BIOS's jump table, BIOS's table, BIOS table, RAM table | BIOS jump table, or RAM BIOS table for the copy at `BF00h` |
| drive count | drives field |
| SD driver, SPI driver | SD card driver |
| SD adaptor | SD card adaptor |
| video driver | display driver |
| video display | display |
| video RAM | VRAM |
| character LCD, after Chapter 1 | 20 × 4 LCD |
| GLCD, in prose | graphics LCD |
| write-behind | written behind |
| keypad's NMI jumper | keypad NMI jumper |
| IOBYTE's bits, IOBYTE's field, `CON:` field | console field |
| disk error | BDOS error |
| reset of the disk system | disk reset |
| chained command line | chained line |
| default DMA record | default DMA buffer |
| the choice, of drives | the selection |
| drawn inverted | drawn as its reverse image |
| changed line, in Part II and Appendix B | dirty line |
| checksum vector | check vector |
| hex, in prose | hexadecimal |
| `.DRV`, for a file on a current card | `.SVC` |
| `DRIVERS` | `SERVICES` |
| module, resident module, resident driver, for a loaded file | service |
| driver loader | service loader |
| driver registry | registry |
| table at `C003h`, table of services, ROM's table of services | ROM table |
| ROM services, for the calls through `ABIHW` | hardware services |
| mount service | mount entry |
| `book/capture.mjs` | `tools/capture.mjs` |
| ATOM on the card | `TAS` |

## Words in force

A *service* is what a `.SVC` file installs. A *library* is a service that
provides routines for programs, and a *driver* is a service that drives
hardware. What a service publishes in the registry is a *record*. The numbered
calls through `ABIHW` are *hardware services*, the table at `C003h` is the *ROM
table* and its jump `ABIVOL` is the *mount entry*. *Service resident memory* is
the pages services hold.

`.DRV` names appear only where the text is about an old card, as in Chapters 1,
5, 22 and 26 and Appendix D. `DRVTAB`, `DRVIDX` and `DRVSLOT` name
disk drives. `VOLSVC` is the routine behind the mount entry. The SD card driver
and the hardware drivers of Chapter 15 are code in the ROM, so *driver* there
has its older sense. "Registry's records" and "service's records" are in use,
and every 128-byte record is CP/M's. A JavaScript module is a module.
