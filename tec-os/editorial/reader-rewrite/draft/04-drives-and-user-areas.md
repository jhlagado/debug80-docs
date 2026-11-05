---
title: Drives and user areas
parent: TEC-OS
nav_order: 4
nav_group: "Part I: Using TEC-OS"
---

# 4. Drives and user areas

<!-- Source mechanisms read at TEC-OS ea3ef3de9133931e925a0220d51c0e971c1fd8dd.
     All retained captures are historical TEC-OS 78127ec host-model evidence.
     Original old03/05/07 supplied inputs: TED.COM Thorium 128edb7,
     SHA-256 2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f;
     TAS.COM Thorium dbee66a,
     SHA-256 45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
     The service captures from old06 record 78127ec without a separate input pin.
     No capture, application or KS48 font/default result is newly qualified. -->

A file's volume and user area determine where you can use it. Program
lookup can find a tool outside your current drive and area, with a separate
rule for resident services.

## Programs and resident services

The `SAMPLE.COM` and small banner you have used are programs. TEC-OS loads
a COM file into program memory and starts it. When the program finishes
the prompt returns. A program used this way is called transient because
its code need not remain available after it ends.

A file of type SVC installs a resident service. Its code stays in memory
after the installation command ends, including across later program exits.
It remains until reset or successful removal with `UNLOAD`. Services occupy
whole pages of 256 bytes below the BDOS, the resident part of TEC-OS that
supplies file and console operations. Those pages reduce the memory left
for programs. [Chapter 10](10-memory-for-programs.md) explains that boundary.

The starter card's service file is the graphics LCD driver,
`GLCD.SVC`. The PICO9918 console is in ROM and needs no SVC installation.
At `A>`, the installation command is `GLCD.SVC`. The type is required:
`GLCD` alone searches for `GLCD.COM`. A service file can have an explicit drive, as in
`A:GLCD.SVC` or `B:NAME.SVC`.

`SERVICES` lists installed services, newest first, with each name and the
number of pages it occupies. `UNLOAD` removes the newest service if removal
is allowed. The following historical run used both displays with the
PICO9918 as the console. Its automatic startup line had installed no GLCD
driver. Typing the same file name at the prompt installed it while leaving
the PICO9918 as the console:

<!-- node tools/capture.mjs --board pico GLCD.SVC SERVICES UNLOAD SERVICES UNLOAD -->
```text
A>GLCD.SVC

A>SERVICES
GLCD 3
A>UNLOAD

A>SERVICES
A>UNLOAD
UNLOAD?

A>
```

This driver occupied three pages in that build. The first `UNLOAD` removed
it and the next `SERVICES` printed no entries. The second `UNLOAD` had
nothing to remove. `UNLOAD?` also appears when the newest service cannot
be removed. The command does not skip it to remove an older service.
Removal follows the reverse of installation order. A warm boot, the restart
after a program ends, retains the installed services. Reset empties the list.

A missing service file, a wrong format or a failed installation normally
prints the command name with a question mark. A fatal card-read error
instead ends the command with the BDOS's `Bad Sector` message.
A second graphics LCD driver cannot install over the first. In this
historical GLCD-console run, startup had already installed the driver:

<!-- node tools/capture.mjs --board glcd GLCD.SVC SERVICES -->
```text
A>GLCD.SVC
GLCD.SVC?

A>SERVICES
GLCD 3
A>
```

Removing the driver while the graphics LCD is the console selects the
PICO9918 if TEC-OS started its console. Otherwise output returns to
serial. `CON UC1` selects the graphics LCD and installs `A:GLCD.SVC` if
needed. UC1 is the console name for that display. The next historical run
shows selection and removal on a board with both displays:

<!-- node tools/capture.mjs --board pico "CON UC1" SERVICES UNLOAD CON -->
```text
A>CON UC1
CON: UC1:
A>SERVICES
GLCD 3
A>UNLOAD

A>CON
CON: CRT:
A>
```

`CRT:` names the PICO9918 console in that report.
[Chapter 6](06-choose-a-console.md) explains console selection and
[Chapter 7](07-commands-at-startup.md) explains automatic startup commands,
including the quiet result for an unavailable device. Service authoring and
installation internals have their separate homes in
[Chapter 13](13-write-a-resident-service.md) and
[Chapter 24](24-loading-and-removing-services.md).

## Drive letters and volumes

TEC-OS has four drives, A to D. A drive letter identifies a current
assignment, not a separate card. Each drive can hold one volume from the
card's container, the collection of CP/M disks stored on that card.
The starter assigns SYSTEM to A and WORK to B. They are volumes with
labels as well as drive letters.

`MOUNT` with no arguments lists every volume, including those assigned to
no drive. Each line gives the volume's container index, label, geometry
and current drive. The starter's list has SYSTEM at index 00 and WORK
at 01. G1M is the 1 MiB geometry and G8M is the 8 MiB geometry. Their
directory layouts are described in [Appendix E](appendix-e-container-format.md).

A drive letter followed by a colon selects that drive. The prompt changes
and a file name without a drive then refers to it. A file on another
drive can be named explicitly, as in `DIR B:` or `TYPE A:SAMPLE.ASM`.
Selecting an empty drive or naming a file on it gives `Select`. This
historical starter-card run selected B and then used empty drive C:

<!-- node tools/capture.mjs B: "@start C:" "@key x" "@start DIR C:" "@key x" -->
```text
A>B:
B>C:
Bdos Err On C: Select
B>DIR C:

Bdos Err On C: Select
B>
```

The default error path waits for a key, `x` in this capture, then ends
the command with a warm boot. The prompt stays on B. The CP/M drive
letters E through P are accepted as names but have no TEC-OS volume and
give the same error. Q and later letters are outside that range, so
`Q:` gives `Q:?`. [Appendix D](appendix-d-error-messages.md) explains these
messages and the returned-error option for programs.

## User areas

Each drive has sixteen user areas, numbered 0 to 15. Every file belongs
to one area. `USER 3` selects area 3 on all drives, not a separate area
for each drive. The prompt includes a nonzero area number before the
drive letter, as in CP/M 3. Thus `3A>` means area 3 with A current.
TEC-OS starts in area 0, where all starter-card files are stored.

File commands use the current area. A file made in area 3 remains out
of area 0's listing even on the same volume. This historical run saved
one page of program memory as `B:MINE.COM` in area 3. It did not create
or move a file in area 0:

<!-- node tools/capture.mjs "USER 3" "SAVE 1 B:MINE.COM" "DIR B:" MOUNT "USER 0" "DIR B:" -->
```text
A>USER 3
3A>SAVE 1 B:MINE.COM
3A>DIR B:
MINE.COM    
1 file, 8172K free
3A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

3A>USER 0
A>DIR B:
NO FILE
A>
```

The `MOUNT` program still ran in area 3 because program lookup also
checks area 0. Its volume list is independent of the files' user areas.
`COPY` works within the current area, so it cannot transfer a file between
areas. On a PC, `tecvol put --user N` places a file in a chosen area,
as [Chapter 5](05-cards-on-the-pc.md) explains. `USER` without a number or
with a number outside 0 to 15 fails with a question mark.

The system attribute is a separate property of a file. `DIR` omits system
files as well as files outside the current area. A system file remains
available to `TYPE` and other file commands in its area, and a program
command can run it. The attribute does not make the file available in
every user area or protect it against modification.

## Program lookup

A command not built into TEC-OS normally names a COM program. On the
named drive or the current drive when none is named, the command processor
searches the current user area first. If the file is absent and the area
is not 0, it searches area 0 on the same drive. The file needs no system
attribute for this fallback. The selected user area remains unchanged.

A plain command has a further fallback to A when the current drive is
not A and neither area on that drive contained the file. On A it again
checks the current area before area 0. At `3B>` the complete order for
`TOOL` is therefore:

| Search | File |
| --- | --- |
| 1 | B, area 3: `TOOL.COM` |
| 2 | B, area 0: `TOOL.COM` |
| 3 | A, area 3: `TOOL.COM` |
| 4 | A, area 0: `TOOL.COM` |

An explicit drive prevents the drive-A fallback. `B:TOOL` checks B's
current area and area 0 only. Loading a tool from A does not itself select A.
In the following historical starter-card capture, both `A:MOUNT` and
plain `MOUNT` run A's program while the prompt stays on B:

<!-- node tools/capture.mjs B: "A:MOUNT" MOUNT "STARTUP.CMD" -->
```text
A>B:
B>A:MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

B>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

B>STARTUP.CMD
STARTUP.CMD?

B>
```

A type written after the program's name is replaced by COM. `MOUNT.COM`
and `MOUNT.TXT` both search for `MOUNT.COM`. In this run `STARTUP.CMD`
searched for `STARTUP.COM` on B and then A. Neither drive had that program.
Typing a startup file's name does not run its text as commands.

The exception is type SVC. A service command reads only the current user
area on the named or current drive. It has neither area-0 fallback nor
drive-A fallback. At `B>` the starter's driver therefore needs the explicit
command `A:GLCD.SVC`. The special command `CON UC1` also names A's driver
explicitly when it loads it.

Lookup stops when a file is found but cannot load. A `TOOL.COM` too large
on B is not skipped for a smaller copy on A or in another area. An absent
file or an oversized program prints the command name with a question mark.
A card-read failure in the default error mode gives `Bad Sector` and ends
the command through the BDOS instead. It does not print that question mark.

A COM file starts at `0100h` in program memory. The small program from
Chapter 2 is stored on B, so its plain name works at `B>`. At `A>` its
plain name gives a question mark unless another copy is available there.
An explicit `B:` before the name selects its file without changing the
current drive. [Chapter 20](20-from-prompt-to-program.md) follows lookup
and loading inside the command processor.

## Changing a drive's volume

`MOUNT C: GAMES` assigns the volume labelled GAMES to C. An index can be
used instead of the label, as in `MOUNT D: 3`. A volume can occupy at
most one drive. A drive can be emptied with `MOUNT B:` and filled again
without changing the card's saved assignments. Drive A must keep a volume,
so `MOUNT A:` cannot empty it. A different volume can replace A's current one.

Mounting is also limited by the drive slots prepared at cold boot, the
full start after reset. The starter has a G1M-sized slot for A and a
G8M-sized slot for B. A can take G1M volumes. B can take either geometry.
C and D have no slots and cannot
take a volume on that card. Emptying B leaves its slot available for reuse.
This historical starter-card run shows that difference:

<!-- node tools/capture.mjs "MOUNT B:" "MOUNT C: WORK" "MOUNT B: WORK" -->
```text
A>MOUNT B:
Unmounted

A>MOUNT C: WORK
Cannot mount: in use or too large

A>MOUNT B: WORK
B: WORK       

A>
```

A card prepared with `tecvol create --drives N` reserves full-size slots
for drives A through the Nth, including drives empty at cold boot. Each
can then take either geometry. These slots use system memory. Their byte
cost and placement belong to [Chapter 14](14-state-and-memory.md#allocation-vectors-below-the-workspace).
`MOUNT` cannot add a slot to the running starter card.

The next two captures retain a historical four-volume card named `my.img`.
They are additional-card examples, not steps required on the supplied starter.
[Chapter 5](05-cards-on-the-pc.md) gives its PC preparation: SYSTEM and WORK
start on A and B, GAMES and SPARE start unassigned and `--drives 4` reserves
all four slots. GAMES contains `TAS.COM` and SPARE contains `HELLO.TXT`
with the line `Hello from the PC.`. This card had no startup file, so
its initial prompt followed the mounted-drive list directly:

<!-- node tools/capture.mjs --card my.img -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>
```

The list's first column is the container index. A line without a drive
at the right is an unassigned volume. The following historical run mounted
GAMES by label and SPARE by index, then accessed files on both:

<!-- node tools/capture.mjs --card my.img MOUNT "MOUNT C: GAMES" "MOUNT D: 3" MOUNT "DIR C:" "TYPE D:HELLO.TXT" "MOUNT C: SPARE" -->
```text
A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:
02 GAMES       G8M
03 SPARE       G1M

A>MOUNT C: GAMES
C: GAMES      

A>MOUNT D: 3
D: SPARE      

A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:
02 GAMES       G8M C:
03 SPARE       G1M D:

A>DIR C:
TAS.COM     
1 file, 8164K free
A>TYPE D:HELLO.TXT
Hello from the PC.

A>MOUNT C: SPARE
Cannot mount: in use or too large

A>
```

The last command failed because SPARE was already on D. The same message
can mean the destination slot is too small or absent. TEC-OS holds some
recent writes in memory in its cache. A flush writes those pending changes
to the card. A failed flush can also prevent the mount and the assignment
changes only after the writes succeed. A label or index not found in the
table gives `No such volume`. Invalid command syntax prints
`MOUNT [D: [NAME or INDEX]]`. An attempt to empty A gives `Cannot unmount`.

`MOUNT` changes the running assignments in memory, not the drive fields
saved in the card's header. Before changing an assignment it flushes pending
writes to the card. The changed drive's directory is read afresh on its
next use. Mounting a volume on the current drive selects it again at once,
so that access uses the new volume.

## Volume and file protection

A volume can be read-only. Its files can be read and its programs can run,
but creating, writing, renaming or erasing a file there gives `R/O`.
`MOUNT` marks such a volume `R/O` in its list. This property belongs to
the volume, so changing its drive or warm-booting does not remove it.
Chapter 5 explains how a prepared card receives that flag.

A file's read-only attribute is separate. It prevents writing, renaming
or erasing that file and gives `File R/O`. It does not hide the file from
`DIR`. The system attribute controls that omission. The PC card tool can set
file attributes and a program can change them through the BDOS.

A program can also make the current drive read-only temporarily with
BDOS function 28. The next warm boot clears that temporary state. A volume
whose descriptor is read-only remains protected. In the default error mode
the `R/O` and `File R/O` messages wait for a key before ending the command.
[Appendix D](appendix-d-error-messages.md) gives the full error and recovery rules.

## The drives after a reset

A program's ordinary end retains the current drive and user area. Removing
the current drive's volume makes the next prompt fall back to A. Reset
starts at A in area 0, though the volume assignments can survive.

Cold boot rebuilds TEC-OS's working memory and clears the installed services,
open-file state, command history and cache. Changes held only in that cache
are lost. Writes already accepted by the card remain.
The drive assignments can be reconstructed from recognised TEC-OS state
left in RAM. Each assigned volume must still match a descriptor on the card
in location, size, geometry and flags and fit the drive's slot.

This historical `my.img` run mounted GAMES on C and emptied B before
reset. The reconstructed selection kept both changes:

<!-- node tools/capture.mjs --card my.img "MOUNT C: GAMES" "MOUNT B:" "@reset" MOUNT -->
```text
A>MOUNT C: GAMES
C: GAMES      

A>MOUNT B:
Unmounted

A>
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
C: GAMES      

A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M
02 GAMES       G8M C:
03 SPARE       G1M

A>
```

No saved drive assignment is applied if a required volume no longer matches
or a required slot cannot hold it. The card's header assignments then stand.
The same defaults apply when RAM fails recognition, including a reset during
the incomplete cold boot after page zero has been cleared. A normal power
cycle also loses the RAM selection. [Chapter 15](15-reset-and-boot.md#retained-drive-selection)
explains the exact recognition test and its recovery from an interrupted
service installation.

A card changed on a PC needs a reset when returned to the board. Warm boot
retains cached card blocks and the drives' free-space state, so it does not
reinitialise the card or discard those old copies. Only cold boot starts
the card again. Do not let TEC-OS and a PC write the same card at the same time.
