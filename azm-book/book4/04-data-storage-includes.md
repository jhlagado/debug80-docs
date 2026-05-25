---
layout: default
title: "Chapter 4 — Data, Storage, and Includes"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 4
---
[← Addresses, Constants, and Expressions](03-addresses-constants-expressions.md) | [Manual](index.md) | [The Layout System →](05-layout-system.md)

# Chapter 4 — Data, Storage, and Includes

Every assembly program has two kinds of memory content: bytes you know at assemble time, and storage you initialize at runtime. AZM's data directives write known bytes directly into the binary. Its storage directive reserves address space that the program fills in when it runs. This chapter covers both, along with the include system that lets you split a program across multiple files.

---

## `.db` — define bytes

`.db` emits one or more 8-bit values:

```asm
        .db 0              ; one zero byte
        .db $FF            ; one byte: 255
        .db 1,2,3,4        ; four bytes
        .db $48,$65,$6C,$6C,$6F   ; "Hello" in hex
```

String literals are also valid in `.db`:

```asm
        .db "Hello, AZM",0        ; text followed by NUL terminator
        .db "Error: ",MSG_CODE    ; mix of string and expression
```

Each character in a double-quoted string contributes one byte at its ASCII value. The `0` at the end is a separate expression, not part of the string literal.

Multiple operands can appear on one `.db` line, separated by commas, or across multiple `.db` lines:

```asm
MSG:
        .db "Hello"
        .db ","
        .db " World",0
```

This emits the same bytes as `.db "Hello, World",0` — labels and `.db` directives can interleave freely.

Interleaving labels with data lines is how you build tables. A label at the top names the start, a label at the bottom names the end, and `$ - TABLE_START` gives the length as a compile-time constant. You will see this pattern throughout Z80 source.

## `.dw` — define words

`.dw` emits one or more 16-bit little-endian values:

```asm
        .dw $1234         ; two bytes: $34 $12
        .dw 1000,2000     ; four bytes: $E8 $03 $D0 $07
        .dw VECTOR_TABLE  ; address of the label, low byte first
```

The Z80 is little-endian: the low byte comes first. `$1234` emits `$34` then `$12`. Every 16-bit immediate and address in AZM follows this rule.

`.dw` accepts any expression that fits in 16 bits (0–65535).

Any address you want to store as a 16-bit pointer — a jump vector, a callback address, a table entry — goes into `.dw`. The little-endian byte order is handled for you; you write the address, and the two bytes come out low byte first.

## Labels inside data

Labels can appear between or before any `.db` / `.dw` line:

```asm
JUMP_TABLE:
        .dw HANDLER_A
        .dw HANDLER_B
        .dw HANDLER_C
JUMP_TABLE_END:
TABLE_LEN .equ JUMP_TABLE_END - JUMP_TABLE   ; = 6 bytes = 3 entries
```

## String directives

AZM provides three string-specific directives that set a termination policy explicitly:

**`.cstr` — C-style string (NUL terminated):**

```asm
        .cstr "Hello"   ; emits: H e l l o $00
```

Equivalent to `.db "Hello",0` but makes the termination policy explicit.

**`.pstr` — Pascal-style string (length prefix):**

```asm
        .pstr "Hello"   ; emits: $05 H e l l o
```

The first byte is the string length (0–255). The string itself follows. There is no NUL terminator. Strings longer than 255 characters are a range error.

**`.istr` — inverted terminator string:**

```asm
        .istr "Hello"   ; emits: H e l l (o | $80)
```

All bytes emit at their ASCII value except the last character, which has bit 7 set (`$6F | $80 = $EF` for lowercase `o`). Some older ROM routines use this encoding. The receiving loop checks for bit 7 to detect the final byte.

## Jump and call tables

Dispatch tables are a natural use of `.dw`:

```asm
CMD_TABLE:
        .dw do_draw     ; 0
        .dw do_move     ; 1
        .dw do_rotate   ; 2
        .dw do_erase    ; 3
CMD_COUNT .equ ($ - CMD_TABLE) / 2

; Dispatch: A = command index (0 to CMD_COUNT-1)
        ld   hl,CMD_TABLE
        ld   b,0
        ld   c,a
        add  hl,bc
        add  hl,bc        ; HL = CMD_TABLE + A * 2
        ld   a,(hl)
        inc  hl
        ld   h,(hl)
        ld   l,a          ; HL = handler address
        jp   (hl)
```

`CMD_COUNT` uses `$ - CMD_TABLE` divided by 2 because each `.dw` entry is two bytes.

Dispatch tables are worth understanding because they are how structured dispatch works on the Z80. There is no function-pointer call syntax built into the instruction set; you build the table yourself, compute the index, load the address, and jump to it. The assembler gives you the addresses. You write the arithmetic.

## Mixed data structures

`.db` and `.dw` can be mixed on the same label block when the layout demands it:

```asm
; Hardcoded initialized Sprite record:
; x: byte, y: byte, flags: byte, ptr: word
INIT_SPRITE:
        .db  10        ; x
        .db  20        ; y
        .db  %00000001 ; flags
        .dw  SpriteGfx ; ptr
```

When you use `.type` declarations (Chapter 5), you know the field offsets and can verify this layout against the definition.

---

## `.ds` — reserve storage

The data directives above write bytes you know at assemble time. Storage is different: you reserve the space now, but the program fills it at runtime. The distinction is reflected in the output — `.db` and `.dw` appear in the binary as the bytes you wrote; `.ds` advances the address counter without writing anything.

`.ds count` reserves address space without initialized bytes. `.ds count,fill` reserves the same space and writes the fill byte into the output image. The bytes at those addresses contain whatever is in memory when the program runs. Use `.ds` for variables, buffers, and workspace that the program initializes at runtime.

`.db` and `.dw` always write initialized values. `.ds count` only advances the address counter; `.ds count,fill` also writes the fill byte across the reserved range.

### Basic syntax

```asm
COUNTER:
        .ds 1          ; reserve 1 byte

BUFFER:
        .ds 64         ; reserve 64 bytes

STACK:
        .ds 256        ; reserve 256 bytes
```

The operand is a byte count expression. Labels placed before `.ds` name the start of the reserved block.

### Optional fill byte

A second operand specifies a fill value for the reserved region in the flat binary output:

```asm
PAGE:
        .ds 256,0      ; reserve 256 bytes filled with zero
```

Without a fill value, the content of the reserved region in the binary is undefined (typically zero in a flat binary starting from the origin, but this should not be relied upon). Use the fill byte when you need a known initial state in the binary image itself — for ROM initialization tables, for example.

For most RAM variables, the fill byte is irrelevant — the program initializes them before reading them. The fill byte matters when the binary itself is the initialization: a ROM that copies its data section into RAM on startup needs the bytes to be there.

### Trailing `.ds` behavior

A `.ds` that comes after all emitted bytes, at the end of a source file, advances the assembly address without extending the flat binary:

```asm
        .org $0100
        ; ... code ...
        halt

WORKSPACE:
        .ds 128        ; if nothing follows, .bin is not extended
```

The binary is cropped at the last byte of real content — useful when your program loads into limited RAM and binary size matters.

### Type expressions in `.ds`

Layout types (Chapter 5) extend `.ds` to accept structured size expressions. You do not need to read Chapter 5 to use `.ds` with ordinary byte counts, but the examples below show what becomes available once you have layout declarations in place.

Chapter 5 introduces layout type expressions such as `byte[32]`, `addr`, and `Sprite[16]`. `.ds` accepts those expressions wherever it expects a byte count:

```asm
BYTE_BUF:  .ds byte[32]      ; 32 bytes
PLAYER:    .ds Sprite        ; sizeof(Sprite) bytes
TABLE:     .ds Sprite[16]    ; sizeof(Sprite) * 16 bytes
```

The storage rule stays the same: `.ds` reserves bytes. Layout types only compute the count.

### Named counts

When the size comes from a named constant, use it directly:

```asm
RING_CAP    .equ 8

RING_BUF:
        .ds RING_CAP          ; idiomatic when capacity is named
```

Use `RING_CAP` directly when the count is already named.

### Storage maps

For programs with several independent storage areas, collect all `.ds` blocks under a dedicated `.org`:

```asm
; --- RAM layout: $8000–$8FFF ---
        .org $8000

; ring buffer
RING_BUF:       .ds RING_CAP
RING_HEAD:      .ds 1
RING_TAIL:      .ds 1
RING_COUNT:     .ds 1

; display workspace
FRAME_BUF:      .ds FRAME_W * FRAME_H

; sprite table
SPRITES:        .ds MAX_SPRITES * sizeof(Sprite)

; stack (grows downward from top)
        .org $8FFE
STACK_TOP:      .ds word    ; two bytes of reserved headroom
```

Collecting storage blocks under one `.org` lets you verify that no areas overlap and that the total fits available RAM.

A storage map section is also where bugs hide less often. When RAM layout is scattered throughout a source file, it is easy to accidentally place two variables at the same address, or reserve more storage than the hardware provides. Putting everything in one place lets you read the whole layout at once and catch those mistakes before assembly rather than at runtime.

---

## `.include` — file inclusion

Most real programs are too large to live in a single file. AZM's include system is the mechanism for splitting source across files — not a module system with separate namespaces, but a way to write source text in separate files and pull them together at assembly time.

`.include` inserts the contents of another source file at the point of the directive, as if you had typed that file's text inline:

```asm
        .include "hardware.asm"
        .include "sprites.asm"
```

Paths are relative to the file containing the `.include` directive, not to the current working directory. Given this project layout:

```
project/
  main.asm
  lib/
    strings.asm
    sprites.asm
```

From `main.asm`:

```asm
        .include "lib/strings.asm"
        .include "lib/sprites.asm"
```

Add search directories with `-I` when you want to include from a shared library path:

```sh
azm -I /path/to/shared/lib main.asm
```

Then in source:

```asm
        .include "mon3_contracts.asm"    ; found in -I search path
```

AZM searches the source file's directory first, then the `-I` paths in order.

## Include and the translation unit

AZM has no module system. All included files merge into a single translation unit — every label and constant defined anywhere is visible everywhere. This has three practical consequences:

- Every label must be globally unique across all included files
- The order of includes can matter, since some expressions depend on earlier definitions
- Including the same file twice defines its labels twice, which is a duplicate-symbol error

The single-namespace rule means you need to manage name uniqueness across all files. For a small project this is straightforward. For a larger one, a naming convention helps: prefixing branch labels with the routine name keeps `ScanLoop` and `DrawLoop` from colliding across different source files.

Avoid recursive includes — a file that includes itself will loop until the process runs out of resources.

## Project file organization

Most AZM projects keep definitions and code in separate files: hardware constants, layout declarations, enum definitions, op declarations, and subroutines each in their own file, all included from a single entry file. Definitions come before the code that uses them; storage reserves sit under their own `.org` at the end. Hardware constants belong in one file so porting means editing a single place.

Subroutine files define `@` entry labels and AZMDoc contracts. For library routines whose source is not assembled with yours, write contracts in an `.asmi` file and load with `--interface`. Chapter 9 covers project organization in detail.

## Avoiding include cycles

AZM does not guard against a file including itself or a file including another that eventually includes the first. Both produce infinite inclusion loops. Avoid them by keeping includes one-directional: `main.asm` includes everything; individual files include nothing. If a subroutine file needs layout constants, put those constants in a shared file that everything includes, rather than having subroutine files include each other.

---

[← Addresses, Constants, and Expressions](03-addresses-constants-expressions.md) | [Manual](index.md) | [The Layout System →](05-layout-system.md)
