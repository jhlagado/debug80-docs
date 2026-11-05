# Terms of the TEC-OS book

This editorial reference fixes prose forms, meanings and explanation locations
in the available drafts. Mechanisms use TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. Historical examples retain their
actual revisions and inputs. These meanings do not qualify a later font,
display default, artifact or run.

The credits identify explanations read in actual draft text, not first use
across the finished book. **Opening pending** means that first-use teaching
awaits the held Chapter 1, First session, Chapter 2, Make a small program,
or Chapter 3, Work with files. The front-door outline does not establish
their wording. The closed outline and movement units control assignments.
Final credits need another pass after all chapters land and navigation is
integrated.

A short prose form follows its full form within a chapter, as in “file
control block, or FCB”. Code identifiers such as IOBYTE and ABICALL retain
their names. Source, commands, paths, literal messages and captured output
retain their exact words. In particular, the historical TOP and AREA
comments still say “program area”. The amendment record gives source proofs,
reading scope and remaining draft-form issues.

## Memory

| Full prose form or literal name | Short form | Meaning | Verified draft explanations | Correct and distinct |
| --- | --- | --- | --- | --- |
| transient program area | TPA | `0100h` to the byte below the address stored as a word at `0006h` | Opening pending. 10, Program space and resident memory. 14, Allocation vectors below the workspace | The word is an exclusive boundary, not a byte count. The COM load ceiling can be lower. “Programs have N bytes” states a size |
| resident workspace | workspace | TEC-OS's variables, buffers and stacks from `WSBASE` up to but excluding `WSEND`, including the RAM BIOS table | 10, Program space and resident memory. 14, The workspace across a program exit. C, The resident workspace | Vectors, the BDOS entry stub and service pages are separate. The build's lower or fixed workspace ends at `BEFFh`. It is in EXPAND 0, not fixed RAM |
| page | | A 256-byte memory unit, aligned when a page address is intended | Opening pending. 4, Programs and resident services. 10, Program space and resident memory | Page zero is `0000h–00FFh`, introduced in 9. A web page and a PICO display page are different uses. Display pages are explained in 16, Cursor cells and display pages |
| BIOS jump table | | CP/M 2.2's seventeen three-byte entry jumps | 10, The raw BIOS console interface. 16, The BIOS boundary | RAM BIOS table names the callable copy at `BF00h`. `BIOSBAS` identifies the ROM template. Direct internal ROM calls can bypass the RAM hooks |
| BDOS entry jump | BDOS entry | A three-byte `JP BENTRY` transferring control to the ROM BDOS routine | 10, Program space and resident memory. 14, Allocation vectors below the workspace. 24, The resident entry and its pages | The original jump is the BDOS entry stub. Each resident service starts with another. `BENTRY` itself is the ROM routine, followed in 19, The call and its drive |
| boot overlay | overlay | The first 2 KiB of ROM also visible at `0000h–07FFh` while latch bit 0 is low | Opening pending. 14, Two banks at the same addresses. 15, The reset instruction | `LATSHAD` is the source constant and SHADOW the latch/board name. Removing the overlay leaves high ROM visible |
| fixed RAM | | `0000h–7FFFh` in TEC-OS's normal memory contract | Opening pending. 10, Program space and resident memory. 14, Two banks at the same addresses | Fixed means unaffected by the EXPAND window switch. Optional model MAIN mappings and extra bank fields require their own configuration |
| EXPAND 0, EXPAND 1 | | The two 16 KiB halves of the required RAM in U9 | Opening pending. 10, Program space and resident memory. 14, Two banks at the same addresses | Expansion RAM names the whole chip. The legacy model's extra banks are not extra physical U9 halves |
| bank window | window | `8000h–BFFFh`, where either EXPAND half is visible | 10, Program space and resident memory. 14, Two banks at the same addresses | An address range, not an additional RAM allocation |
| service resident memory | resident pages, where unambiguous | Whole RAM pages reserved for loaded services | 4, Programs and resident services. 10, Program space and resident memory. 24, The resident entry and its pages | It reduces the TPA and can remain after failed installation. Numbered ROM calls occupy no loaded-service pages |

## Boot and reset

| Full prose form or literal name | Short form | Meaning | Verified draft explanations | Correct and distinct |
| --- | --- | --- | --- | --- |
| cold boot | | The path through `COLD` checking RAM and reconstructing workspace, card mount and cache | Opening pending. 7, Program exits and resets. 15, Cold-boot order | Entered after reset or through the BIOS cold-boot entry. It clears services/history even when assignments are recovered |
| warm boot | | The path through `WBOOTR` reconstructing the program environment and restarting the CCP | Opening pending. 4, Programs and resident services. 8, Returning to the prompt. 15, Warm boot and pending writes | It retains residents/history. A failed flush can discard pending bytes and cancel a chain |
| reset | | Board or model reset, followed by cold boot under the normal ROM entry contract | Opening pending. 7, Program exits and resets. 15, The reset instruction | Recognised/unrecognised reset describes the `RSLCAP` check. Ordinary exit is warm boot. Disk reset is BDOS function 13, not CPU reset |
| drive selection | selection | The current drive-to-volume assignments, including empty drives | 4, Changing a drive's volume and The drives after a reset. 15, Retained drive selection | Separate from current drive/user area. Recognition alone does not establish successful restoration: all volume matches and slots must pass |
| power cycle | | Power off and on. The page's Power cycle creates a fresh machine using the same in-memory card | Opening pending. 4, The drives after a reset. I, Controls and displayed state | Power cut means unplanned power loss. Card bytes and pending cache bytes have different persistence, explained in 5 |

## Cards, volumes and files

| Full prose form or literal name | Short form | Meaning | Verified draft explanations | Correct and distinct |
| --- | --- | --- | --- | --- |
| SD card | the card | The storage card connected through the SD card adaptor | Opening pending. 5, A copy before a change. 17, Bytes on the card interface | Video card names the PICO9918. Host/page card operations can mean an image when the context is explicit |
| starter card | | At `ea3ef3d`, the media image and a card holding it: MOUNT.COM, GLCD.SVC, STARTUP.CMD, TED.COM, SAMPLE.ASM and TAS.COM on A, with B empty | Opening pending. 4, Drive letters and volumes. 26, Matching the ROM and media | Six files, not seven. No PICO.SVC. The page recipe adds DEMO.COM. An empty model fixture is not the populated starter |
| card image | image, in card context | A sequence of card blocks held in a PC file or memory array | Opening pending. 5, Opening and A copy before a change. I, Saving the card | ROM image names ROM bytes. Service image names code/data after its file header, as 13/H explain. Name the kind when both are in view |
| container | | The header, descriptor table, volume payloads and intervening space on a card | 4, Drive letters and volumes. 5, The container and its volumes. E, The header | Declared container length is not measured physical capacity |
| volume | | One CP/M disk payload described by a container descriptor | Opening pending. 4, Drive letters and volumes. 5, The container and its volumes | A volume can be unassigned. CP/M's disk stays in disk parameters, disk reset and BIOS disk-entry names |
| drive | | A logical letter for accessing an assigned volume. TEC-OS supplies A to D | Opening pending. 4, Drive letters and volumes | Parser/FCB letters A to P do not establish sixteen TEC-OS drives. Missing selection gives Select |
| current drive | | The logical default for a file reference with no explicit drive | Opening pending. 4, Drive letters and volumes. 19, The call and its drive | Default drive is `DEFDRV`, selected by FCB drive 0. Bound drive is `CURDRV`, used by the operation in progress. Function 25's CP/M name remains Return current disk |
| drives field | | Byte 22 of a 1.1 header. A nonzero value requests that many full-sized vector slots beginning with A | 5, Preparing the four-volume card. 14, Allocation vectors below the workspace. E, The header | Zero follows mounted-volume sizing even on a 1.1 card. Separate from volume count and descriptor drive bytes |
| card block | block, where its size is unambiguous | A 512-byte SD transfer unit | 5, Record sizes and allocated space. 17, Opening | Allocation block is 2 KiB on G1M or 4 KiB on G8M. In 19, block alone explicitly means allocation block. Data/directory card blocks name contents. ROM/workspace blocks are memory regions |
| CP/M record | record, in file context | A 128-byte file-transfer unit | Opening pending. 5, Record sizes and allocated space. 7, The first 128 bytes. 9, A file's position in the FCB | A service record is a registry structure |
| sector | | A BIOS logical record number within a track, 0–63 for both geometries | 17, From a record to a card block. 19, A record's card address | A 128-byte record here, not a 512-byte SD block. Bad Sector is a literal message |
| logical extent | extent | A group of 128 file records, 16 KiB | 9, A file's position in the FCB. 19, The file in memory and on disk | One directory entry holds one logical extent on G1M or two on G8M |
| directory mark | mark | A retained upper bound on directory entries that may need scanning | 19, Directory searches and Rebuilding after warm boot | It can exceed the last live entry. A BIOS directory write raises it to cover its card block. Not a live-file count |
| logged-in drive | logged in | A drive whose allocation vector is established and whose login bit is set | 14, Allocation vectors below the workspace. 19, Free space and drive login | Warm boot can retain login or require partial/full rebuilding. This is not a user sign-in |
| check vector | | CP/M directory-check storage, unused here because CKS is zero | 17, Drive entries and disk parameters. 19, The compatibility boundary | Separate from allocation vectors and their retained sums. It does not detect a PC-changed card here |
| DMA address | | CP/M's memory address for record transfers and certain returned buffers | 9, A record buffer. A, function 26 | Default DMA buffer is `0080h–00FFh`, overlapping the command tail. This uses a memory buffer, not a hardware DMA controller |
| file control block | FCB | A 36-byte structure for file identity and operation state | Opening name credit pending. 9, The name from your command line and A file's position in the FCB. 19, The file in memory and on disk | Defaults at `005Ch` and `006Ch` overlap. CR in an FCB means current record. CR in text means carriage return |
| drive table | | `DRVTAB`: four eight-byte entries for start, length, geometry and flags | 17, Drive entries and disk parameters | `DRVIDX` records descriptor index plus one. `DRVSLOT` records vector capacity. These name drives, not service drivers |
| allocation-vector slot | vector slot or slot | RAM capacity reserved at cold boot for a drive's allocation vector | 4, Changing a drive's volume. 14, Allocation vectors below the workspace | An empty drive can retain a slot. A later mount must fit it. Separate from directory entries/cache lines |
| BDOS error | | One of four disk-operation causes, printed by default or returned under function 45 | 4, Drive letters and volumes and Volume and file protection. 9, Close, flush and errors. A, The errors | Distinct from ordinary absent-file, EOF or full-directory results. D gives recovery and partial-result scope |

## The block cache

| Full prose form or literal name | Short form | Meaning | Verified draft explanations | Correct and distinct |
| --- | --- | --- | --- | --- |
| block cache | the cache | Thirty card-block lines in EXPAND 1 | Opening consequence pending. 4, Changing a drive's volume. 18, Thirty lines and their table | The browser's saved image is not this ROM cache |
| cache line | line, in cache context | Space for one 512-byte card block, with separate key/dirty state | 10, The bank window and latch copy. 18, Thirty lines and their table | Text line, command line, serial line and screen row retain their meanings |
| dirty cache line | dirty line | A line marked for a pending card write | 18, Thirty lines and their table and Collecting records before the directory write | The flag is not a byte comparison against the card. Operator prose can say pending changes |
| cache flush | flush | An attempt to write the applicable dirty lines to the card | Opening preservation action pending. 4, Changing a drive's volume. 9, Close, flush and errors. 18, Flush order and interrupted updates | Failure can follow successful writes. CFLALL drops failed lines. The directory preflush retains failed data lines. FCB close and browser save are separate operations |
| written behind | | A volume policy allowing ordinary data writes to complete in cache before reaching the card | Opening consequence pending. 5, The container and its volumes. 18, Collecting records before the directory write | Write-behind is a valid policy noun. Written-behind and written-through are adjective forms before nouns. Directory writes, eviction and flushes can write earlier. Written through means a successful BIOS write reaches card completion before return. Preserve literal writeBehind, :wb and options |

## The console

| Full prose form or literal name | Short form | Meaning | Verified draft explanations | Correct and distinct |
| --- | --- | --- | --- | --- |
| console | | The selected input/output path for commands and program text | Opening pending. 6, Devices and their names. 16, Requested and applied consoles | CON: is logical. TTY:, CRT:, BAT: and UC1: are physical selections. BAT reads serial input and discards console output |
| console field | | IOBYTE bits 0–1 at `0003h`, the requested console | 16, Requested and applied consoles | Console mode, `CONMOD`, is the applied selection. A console call applies a changed request and can fall back to serial |
| serial terminal | terminal, after its route is established | A PC terminal program connected to the board's serial port | Opening pending. 6, Devices and their names and The serial terminal | Terminal program names the PC software. Video terminal names ROM character/control processing in 16, Bytes to display cells |
| serial port | | The board's software-timed serial interface | Opening pending. 6, The serial terminal. 16, Serial bits and timing | Serial line means the wire/signal. Software pending bytes and model queues do not establish physical paste reception |
| display | | The PICO9918 screen or graphics LCD in console/display operations | Opening pending. 6, Devices and their names | Name the separate 20 × 4 LCD when it is in view |
| video console | | A console using a display and matrix keyboard | Opening pending. 6, Devices and their names. 16, Requested and applied consoles | Video identifies the ROM PICO or GLCD route, even though a serial terminal also displays text |
| display driver | | Console-handling code. At `ea3ef3d` PICO is in ROM and GLCD.SVC loads from the card | Opening pending. 4, Programs and resident services. 6, An unavailable display. 16, Display registration and claims | A driver need not be a loaded file. The PICO console needs no PICO.SVC |
| PICO9918 | PICO or the chip, in explicit hardware context | The video card and its video hardware | Opening pending. 6, Devices and their names. 11, Claiming the PICO9918 | Distinguish card from chip where the operation requires it. PICO is also a literal registry name and CON alias |
| video memory | VRAM | The PICO9918's video RAM, accessed through ports or graphics entries | 11, Claiming the PICO9918. B, The PICO record | Separate from Z80 program/resident RAM. A literal VRAM EQU can name an address within it |
| graphics LCD | | The 128 × 64 pixel display driven by GLCD.SVC | Opening pending. 6, Devices and their names. G, The ports | GLCD stays in file names, symbols, aliases and messages |
| 20 × 4 LCD | the LCD, after distinguishing the graphics LCD | The status/program-output character LCD, never the console | Opening pending. 6, Devices and their names. 11, The LCD and the speaker | Character LCD is valid descriptive prose. Preserve LCD in service names and symbols |
| matrix keyboard | | The board keyboard scanned at port `FEh` when enabled by the Matrix switch | Opening pending. 6, The matrix keyboard. 16, Matrix scan and key bytes | The keyboard alone can mean current console input in typing instructions. Hex keypad, shortened to keypad, is separate |
| keypad NMI jumper | | The jumper connecting keypad presses to non-maskable interrupt entry | Opening pending. 7, Bypassing a bad startup file. G, The hex keypad and its NMI | Expand non-maskable interrupt before NMI when explaining it. The normal setup leaves the jumper off: `0066h` is inside the default FCB |
| reverse image | | A character cell using the reverse glyph selected by cell-byte bit 7 | Opening pending. 6, Text and the cursor on a display. 11, Text at a screen position | Reverse video is the terminal attribute mode in 16. This is not an arbitrary bitmap inversion rule. A text capture can omit the attribute |
| list device | | CP/M's printer-output interface. TEC-OS normally discards bytes and reports ready | 8, Input while output is running. 16, Reader, punch and list | Numbered registry LIST is different. BAT output discards directly, not through the list hook |

## Commands and programs

| Full prose form or literal name | Short form | Meaning | Verified draft explanations | Correct and distinct |
| --- | --- | --- | --- | --- |
| command prompt | prompt | The drive/user prefix ending in > where the CCP reads commands | Opening pending. 4, User areas. 20, The prompt and its input | A> is area 0 on A. Diagnostic prompt means R retry>, explained in 27. ALL (Y/N)? is an erase-confirmation question |
| built-in command | built-in | A command with a handler in the CCP | Opening pending. 20, The parsed command and The built-in handlers. J, Command forms | MOUNT.COM is a program, not an eleventh built-in. A drive/type on a name can bypass built-in matching |
| command line | line, in command context | Text supplied to the CCP by typing, startup or function 47 | Opening pending. 12, Several commands on one line. 20, The prompt and its input | Startup line and display line describe source or role. Echo, stored text and uppercase execution pieces are distinct |
| command tail | tail | Text after a loaded program's name within its command piece | Opening pending. 9, The name from your command line. 20, Page zero before entry | `0080h` holds length and `0081h` begins characters. The tail includes its initial space and excludes later pieces |
| chained line | | A command line split at ! | 12, Several commands on one line. 21, Finding and taking a piece | A piece is text between separators/edges, including empty or conditional pieces. A leading : tests the previous code |
| program return code | return code | The shared 16-bit result read/set through function 108 and updated by the CCP | 12, The return code. 21, The result before the next piece | FFFFh selects a query and cannot be set by that call. FF00h–FFFEh is failure. Other values are success. Immediate BDOS call results are separate |
| user area | area | A group of files identified by a user number | Opening pending. 4, User areas. A, function 32 | USER accepts 0–15. BDOS function 32 stores five bits, permitting 0–31. `0004h` saves four user bits across CCP entry. Host tecvol restricts its user option to 0–15. Do not generalise the operator range to every API/directory value |
| startup file | | STARTUP.CMD in user 0 of the volume assigned to A | Opening pending. 7, A short file of commands. 25, The first read and the bypass | Only its first 128-byte record is read. A retained replacement volume on A can supply a different file |
| `MOUNT` | | MOUNT.COM, listing volumes with no argument or changing assignments with drive/volume arguments | 4, Drive letters and volumes and Changing a drive's volume. 17, Volume services and publication | Separate from internal container routine MOUNT in vol.asm and numbered MOUNT, 9, in volsvc.asm. Volume services are 9–11 |
| `TED` | | TED.COM, the starter's external pinned editor | Opening pending. 12, TED's build and return. 26, HELLO as a historical tool round | Attribute results to the actual input. Historical editing does not qualify the held Chapter 2 exercise |
| `SAMPLE.ASM` | | Supplied TAS source that TAS SAMPLE builds into SAMPLE.COM | Opening workflow pending. 26, Matching the ROM and media | Source, not the COM program. Its hardware calls do not qualify a changed font/default |
| TED project file | project file, in TED context | THOR.PRJ, a current-drive file identifying source/build settings for TED's build keys | Opening use pending. 12, TED's build and return. 26, HELLO as a historical tool round | This follows pinned historical TED. THOR.SES holds session/file-position state. Project elsewhere can mean a repository |
| application binary interface | ABI | Entry-address, argument, result and version contracts used by compiled programs | 11, The ABI and its entry address. B, The ROM table | The ROM table is the fixed eight-byte representation. ABI 5.1 and product version 0.1 are separate |
| ROM signature | signature | TNA at the start of the ROM table | 11, The ABI and its entry address. B, The ROM table | Container magic is TECOSVOL. Signature checking does not replace required version checks |

## Services and the ROM's entries

| Full prose form or literal name | Short form | Meaning | Verified draft explanations | Correct and distinct |
| --- | --- | --- | --- | --- |
| resident service | service, after distinguishing numbered calls | What a .SVC file installs in allocated resident RAM pages, retained until reset or successful removal | 4, Programs and resident services. 13, Code that stays. 24, Installation before commit | Failed installation can retain pages without proposed records. SERVICES lists loaded owners, not numbered calls or all registry records |
| service library | library, in resident-service context | A resident service providing routines to clients | 13, Code that stays and Publishing a record | A host JavaScript library/module is not automatically a resident service |
| service driver | driver, in resident-service context | A resident service operating hardware | 6, An unavailable display. 13, Code that stays | Display driver also includes ROM PICO code. The SD card driver and other ROM drivers are not loaded services |
| service record | record, in registry context | A thirteen-byte linked structure with an eight-byte name, version and table pointer | 13, Publishing a record. 24, Registry lookup and lifetime. B, The registry | A loaded owner can publish none or several. ROM PICO can publish a permanent record without a loaded owner. CP/M record is 128 transfer bytes |
| numbered service | numbered call | A ROM routine selected by C through ABICALL, numbered 0–15 at `ea3ef3d` | 11, Numbered calls and shared ports. 23, From a number to a routine. B, Calling a service | Resident services load from files. Number 16 is out of range, not a registry-removal operation |
| hardware service | | Numbered services 0–8 in services.asm | Opening name credit pending. 11, Registers, status and stack. 23, The code behind the table. B, The hardware services | Volume services are 9–11, DRVR 12, registry FIND/LIST 13/14 and FONT 15 |
| volume services | | Numbered MOUNT, UNMNT and DESC, 9–11, in volsvc.asm | 11, Registers, status and stack. 17, Volume services and publication. B, The volume services | The program MOUNT and internal container mount are different interfaces |
| ROM table | | Eight bytes at `C003h`: TNA, ABI major/minor and the ABICALL jump | Opening name credit pending. 11, The ABI and its entry address. B, The ROM table | Separate from RAM BIOS table, internal SVTAB and a PICO record's entry table |
| BDOS entry stub | stub | Three-byte JP BENTRY reserved directly below the allocation vectors. STUBAD holds its address | 10, Program space and resident memory. 14, Allocation vectors below the workspace. 15, Page zero and vector lifetime. 24, The resident entry and its pages | Without a service, the word at `0006h` addresses the stub. With one, it addresses that service's entry jump. Introduce the full form before stub. The browser fs stub is unrelated |

## The model and the page

| Full prose form or literal name | Short form | Meaning | Verified draft explanations | Correct and distinct |
| --- | --- | --- | --- | --- |
| host model | the model | The software TEC-1G exposed through host/machine.mjs on the Debug80 runtime | Opening evidence credit pending. 28, A shared machine | Debug80 TEC-1G runtime, then the runtime, names the underlying package. Machine is the wrapper class. Source assertions, model runs and physical observations are separate evidence |
| serial board | | The capture profile with serial console and no PICO9918, graphics LCD or matrix keyboard | Opening pending. 6, An unavailable display. 28, Console bytes, serial bytes and screens | Literal --board serial selects it. Character LCD, card and clock are separate options. It does not mean all peripherals are absent |
| web page's board | | The selected page configuration. With PICO it has both displays and an enabled matrix keyboard | Opening optional-route credit pending. I, Controls and displayed state. 28, The browser as another caller | Display/input corresponds to --board pico or --board glcd for GLCD only. That does not make a host capture a browser capture or equate clocks/storage |
| web page | the page | The browser build with controls and its own card-storage/import paths | Opening optional-route credit pending. I, Opening and Saving the card. 28, The browser as another caller | At `ea3ef3d` the fallback PICO preference is 80 columns. Stored choices can differ. KS48's planned 40-column opening awaits adopted source and qualification |

## Prose forms and literal exceptions

These substitutions apply to prose, not blindly to code or evidence. A legacy
spelling stays when its old behaviour is the subject. Distinct source names
retain their literal spelling.

| Old or ambiguous form | Preferred form or distinction |
| --- | --- |
| program area or “the memory programs have” as a region name | transient program area, then TPA. Preserve TOP/AREA comments |
| working memory | resident workspace or the particular CCP/BDOS state intended. Broad RAM descriptions need their own scope |
| TEC-1G model, Debug80 model | host model or Debug80 TEC-1G runtime for runtime behaviour |
| serial-only board | serial board for the capture profile. Physical descriptions may state which console is connected |
| PC's terminal | serial terminal when it is the board's console |
| BIOS's jump table, BIOS's table, BIOS table, RAM table | BIOS jump table or RAM BIOS table for BF00h |
| drive count | drives field for header byte 22. Counts elsewhere and literal field labels retain their meanings |
| SD driver, SPI driver | SD card driver for the complete interface. A byte-transfer helper remains an SPI routine |
| SD adaptor | SD card adaptor |
| video driver | display driver |
| video display | display, once distinguished from the status LCD |
| video RAM | video memory, then VRAM |
| character LCD | 20 × 4 LCD when distinguishing it from GLCD. Character LCD remains valid description |
| GLCD in prose | graphics LCD. Preserve CON GLCD, files, symbols and messages |
| write-behind | written behind when describing a volume. Write-behind is a valid policy noun. Preserve literal fields/options |
| keypad's NMI jumper | keypad NMI jumper |
| IOBYTE's bits, IOBYTE's field, CON: field | console field only for the low two bits. Other fields are not console field |
| disk error | BDOS error for its four causes. SD-driver, container and physical errors retain their actual layer |
| reset of the disk system | disk reset. Preserve Reset disk system as function 13's name |
| chained command line | chained line |
| default DMA record | default DMA buffer |
| the choice of drives | drive selection, then selection. Current-drive selection is different |
| drawn inverted | drawn as its reverse image for a cell. Describe bitmap operations separately |
| changed line in cache implementation prose | dirty cache line, then dirty line. Operator prose can retain pending changes |
| checksum vector | check vector for CP/M directory-check storage. Allocation-vector sum is separate |
| hex in prose | hexadecimal. Preserve identifiers, commands and source comments |
| .DRV for a current service file | .SVC. Preserve .DRV in old-card history/examples |
| DRIVERS as the current listing command | SERVICES. Preserve historical command output |
| module, resident module, resident driver for an arbitrary loaded file | resident service, then service. Hardware service drivers and JavaScript modules retain distinct meanings |
| driver loader | service loader for .SVC installation |
| driver registry | registry or service registry. A ROM-owned PICO record can also be present |
| table at C003h, table of services, ROM's table of services | ROM table. Internal SVTAB and record entry tables remain distinct |
| ROM services for ABICALL calls | numbered services or hardware services specifically for 0–8 |
| mount service, mount entry, ABIVOL | volume services for the group. Name numbered MOUNT for number 9. Preserve historical identifiers |
| ABIHW, ABIGLCD, ABISVC | ABICALL with the service number in current prose. Preserve historical interfaces |
| PRL program or .PRL file as a current loadable file | No current load command. COM/SVC have their own paths. PRL helper names and historical relocation discussion remain valid |
| book/capture.mjs | tools/capture.mjs in current instructions. Historical paths can remain identified provenance |
| ATOM on the card | TAS. ATOM names the host assembler in its route |
| VOLS as the current volume-list command | MOUNT with no argument. Preserve historical output |
| EDIT or Edit for the starter editor | TED. Preserve another named product or historical input |

## Words in force and remaining integration

A resident service reserves pages. A service library provides routines and a
service driver operates hardware. A service record is a registry structure.
Numbered services are ROM calls: hardware 0–8, volume operations 9–11,
display registration 12, registry lookup/enumeration 13–14 and font access 15.
These prose distinctions apply even when a source label uses an older name.

The bounded c722ace corrections remain in force: the six-file starter, ROM
PICO versus loaded GLCD, allocated resident-page lifetime, numbered range
0–15 with FONT at 15 and volume-service ownership in volsvc.asm. The full
meaning audit and credit reconciliation are recorded in
[terms-amendment-record.md](reader-rewrite/terms-amendment-record.md).

Opening first-use credits remain pending for Chapters 1–3. The available
drafts' local form follow-ups have a bounded review recorded in
[form-pass-record.md](reader-rewrite/form-pass-record.md). Final source adoption,
integration and a complete reader-order pass are separate acceptance steps.
This table does not close the glossary for publication.
