---
title: Relocatable programs, residents and drivers
parent: TEC-OS
nav_order: 8
---

# Relocatable programs, residents and drivers

A `.COM` file runs at `0100h` and nowhere else, because its addresses are
fixed when it is assembled. A `.PRL` file can be loaded at any page. It
carries a map of the bytes that hold addresses, and the loader adjusts those
bytes for wherever it puts the code. Digital Research defined the format
for MP/M and CP/M 3. TEC-OS loads three kinds of code from PRL files: ordinary programs,
residents that stay below the BDOS after they run, and drivers in
EXPAND 1.

## The PRL format

A PRL file has three parts:

1. A 256-byte header. The word at offset 1 is the length of the code in
   bytes. The rest of the header is zero for the files in this chapter.
2. The code, assembled for origin `0000h`.
3. A bitmap with one bit for each byte of code, the most significant bit
   first. A set bit marks the high byte of an address.

To load the code at a page `p`, the loader adds `p` to every byte whose bit
is set. Only the high bytes need it, because the code moves by whole pages
and the low byte of every address stays the same.

## Making a PRL

The usual way to make the bitmap is to assemble the source twice, once at
`0000h` and once at `0100h`, and compare the two results. A byte that holds
the high half of an address is one greater in the second assembly. Every
other byte is the same. Any other difference means the source does something
the format can't relocate, such as dividing an address by two.

The TEC-OS repository makes its own PRL files this way, with the function
`makePrl` in `tools/lib/prl.mjs`. A short script saved in the root of a
clone of the repository uses it:

```js
// mkprl.mjs SOURCE.asm OUTPUT.PRL, run from a clone of the TEC-OS repository.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { makePrl } from "./tools/lib/prl.mjs";

const [source, output] = process.argv.slice(2);
writeFileSync(output, await makePrl(resolve(source), resolve("build/prl")));
```

```sh
node mkprl.mjs count.asm COUNT.PRL
```

The source must contain the line `ORG $0100` exactly once. `makePrl`
assembles it with Atom as it stands, then assembles a copy with the line
changed to `ORG $0000`, and builds the file from the two results. It
reports any byte that differs by more than one.

## Running a PRL

The command processor looks for `NAME.COM` first and, if there is none, for
`NAME.PRL`. What it does with a PRL depends on the first bytes of the code:

- **A program.** Code that doesn't begin with TEC-OS's module header is an
  ordinary program. TEC-OS relocates it for `0100h` and runs it there, as
  if it were a `.COM` file.
- **A resident.** Code with the module header and kind 1 is installed below
  the BDOS and stays there.
- **A driver.** Code with the module header and kind 2 is installed in
  EXPAND 1.

## The module header

A resident or a driver starts with this header:

| Offset | Size | Contents |
| ---: | ---: | --- |
| 0 | 3 | `TNM` |
| 3 | 1 | Version, 1 |
| 4 | 1 | Kind: 1 resident, 2 driver |
| 5 | 1 | Zero |
| 6 | 3 | `JP 0`, which TEC-OS fills in for a resident |
| 9 | 2 | The address of `INIT`, called once after loading |
| 11 | 2 | The address of `REMOVE`, called before unloading |
| 13 | 8 | A name, padded with spaces |
| 21 | | A driver's list of hooks |

The addresses at 9 and 11 are assembled like any others, so the loader
relocates them along with the code.

## Residents

A resident is code that stays in memory after the command that loaded it
has finished. It can add a command, watch the console or patch a BIOS
entry, and it keeps working while other programs run.

TEC-OS places a resident in whole pages just below the BDOS entry. It
points the `JP` at offset 6 of the resident at the old BDOS entry, and
moves the word at `0006h` down to that `JP`. Programs that read `0006h` for the top of their memory now stop below the
resident. Every BDOS call through `0005h` now goes through the resident's
`JP` on its way to the BDOS. TEC-OS then calls the resident's `INIT`.

This resident counts the characters written to the console. Its `INIT` puts the address of its own routine into the console output
entry of the BIOS jump table. The routine adds one to a counter and then
jumps to the address that was there before:

```asm
; COUNT.PRL: a resident module. Its INIT replaces CONOUT in the RAM BIOS table
; with a routine that counts the characters passing through it and chains to
; the entry it replaced; its REMOVE puts that entry back. Assembled at 0000h
; and 0100h, the two images give the PRL's relocation bitmap.
;
; The module header: "TNM", version 1, kind 1 (resident), a zero, the JP the
; loader points at the BDOS, the addresses of INIT and REMOVE (relocated
; with the code) and a name.

        ORG     $0100
HDR:    DB      "TNM",1,1,0
BDOSJ:  JP      0               ; the loader points this at the old (0006h)
        DW      INIT            ; relocated with the code, so the loaded address
        DW      REMOVE
        DB      "COUNT   "

; Replace CONOUT, the table's fourth entry after WBOOT: (0001h) + 9.
INIT:   LD      HL,($0001)
        LD      DE,9+1
        ADD     HL,DE           ; HL = the JP's target in the table
        LD      E,(HL)
        INC     HL
        LD      D,(HL)
        LD      (OLDCO),DE
        LD      DE,MYCO
        LD      (HL),D
        DEC     HL
        LD      (HL),E
        RET

REMOVE: LD      HL,($0001)
        LD      DE,9+1
        ADD     HL,DE
        LD      DE,(OLDCO)
        LD      (HL),E
        INC     HL
        LD      (HL),D
        RET

MYCO:   PUSH    HL
        LD      HL,(COUNT)
        INC     HL
        LD      (COUNT),HL
        POP     HL
        DB      $C3             ; JP to the entry replaced
OLDCO:  DW      0
COUNT:  DW      0
```

The BIOS jump table is in RAM at `BF00h`, and the word at `0001h` points to
its warm boot entry. Each entry is a 3-byte `JP`, so the console output
entry's `JP` is 9 bytes further on and its target address 10 bytes on. The
BDOS calls the BIOS through this table, so the hook sees every character
the BDOS writes.

The code is 71 bytes and takes one page. Running it lowers the BDOS entry
by 256 bytes, which `HELLO` from Chapter 6 shows:

```text
B>COUNT

B>HELLO
Hello from TEC-OS.
Program area: 46598 bytes

B>UNLOAD

B>HELLO
Hello from TEC-OS.
Program area: 46854 bytes

B>
```

`UNLOAD` removes the most recent resident. It calls the resident's
`REMOVE`, which puts back the entry `INIT` replaced, and raises `0006h`
again. Residents come off in the reverse of the order they went on. With
none left, `UNLOAD` answers `UNLOAD?`.

A resident survives warm boot, so it stays through any number of programs.
A reset clears it and rebuilds the BIOS jump table it patched.

## Drivers

A driver goes into EXPAND 1 instead of the program area, so it costs
programs no memory at all. TEC-OS takes whole pages for it from the top of
EXPAND 1's free space and lowers the low mark at `FF18h`.

Code in EXPAND 1 can't be called directly, because EXPAND 0 is normally in
view at the same addresses. TEC-OS reaches a driver through a dispatcher
called `XCALL`. A call through `XCALL` switches EXPAND 1 in with interrupts
off, moves to a stack in EXPAND 1, calls the driver's routine, then
switches back. The driver lists its routines after its module header: a
count, then a slot number and an address for each one. The slots are fixed
points in TEC-OS where a driver can take over.

The graphics LCD console on the starter card, `GLCD.PRL`, is a driver. It takes the six slots the video terminal draws through. They put a
character, read a character back, clear to the end of a line, restore the
screen after a program, read a row and write a row. TEC-OS's own terminal code, from Chapter 2, interprets the
escape sequences and calls those six routines to draw the result. The
driver's code, its copy of the screen's text and its stack are all in
EXPAND 1.

A driver never touches EXPAND 0, which is out of view while it runs. It reads
the console font through the address at `FF23h` and moves rows through a
transfer buffer in EXPAND 1. `UNLOAD` removes a driver once no resident is
left above it.
