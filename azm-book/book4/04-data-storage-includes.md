---
layout: default
title: "Chapter 4 — Data, Storage, and Includes"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 4
---
[← Addresses, Constants, and Expressions](03-addresses-constants-expressions.md) | [Manual](index.md) | [The Layout System →](05-layout-system.md)

# Chapter 4 — Data, Storage, and Includes

Data directives emit initialized bytes into the output image; storage directives reserve address space without writing anything. This chapter covers `.db` and `.dw` for initialized data, `.ds` for uninitialized storage, and `.include` for splitting source across multiple files and organizing a project.

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

## `.dw` — define words

`.dw` emits one or more 16-bit little-endian values:

```asm
        .dw $1234         ; two bytes: $34 $12
        .dw 1000,2000     ; four bytes: $E8 $03 $D0 $07
        .dw VECTOR_TABLE  ; address of the label, low byte first
```

The Z80 is little-endian: the low byte comes first. `$1234` emits `$34` then `$12`. Every 16-bit immediate and address in AZM follows this rule.

`.dw` accepts any expression that fits in 16 bits (0–65535).

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

---

## `.include` — file inclusion

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

Avoid recursive includes — AZM has no cycle detection, and a file that includes itself will loop until the process runs out of resources.

## Typical project structure

A small AZM project might look like this:

```
project/
  main.asm          — entry, .org, top-level call
  hardware.asm      — port addresses, ROM entry points as .equ
  layout.asm        — .type and .union declarations
  enums.asm         — enum declarations
  ops.asm           — op declarations
  platform.asm      — .asmi or inline contracts for external routines
  routines/
    sound.asm       — subroutines with @entry labels and ;! contracts
    graphics.asm    — subroutines
    input.asm       — subroutines
  ram.asm           — .org $XXXX followed by all .ds storage blocks
```

`main.asm` includes everything:

```asm
        .include "hardware.asm"
        .include "layout.asm"
        .include "enums.asm"
        .include "ops.asm"
        .include "routines/sound.asm"
        .include "routines/graphics.asm"
        .include "routines/input.asm"

        .org $0100
@main:
        ; ...

        .include "ram.asm"
```

Constants, layouts, enums, and ops come before the code that uses them. Storage comes last, at its own `.org`.

## Hardware definition files

Platform-specific constants belong in one file:

```asm
; hardware.asm — TEC-1G hardware map

LCD_DATA    .equ $00
LCD_CTRL    .equ $01
KEY_PORT    .equ $00
TIMER_PORT  .equ $02

; MON3 ROM routines
MON_PUTC    .equ $0008
MON_GETC    .equ $000B
MON_PRTHL   .equ $0020
MON_PRTDE   .equ $0023
```

When you port to different hardware, edit this file. The rest of the source uses the symbolic names and does not need to change.

## Shared layout files

Layout declarations (Chapter 5) belong in a shared file included before any code that references them:

```asm
; layout.asm
.type Sprite
x       .byte
y       .byte
flags   .byte
ptr     .addr
.endtype

.type Actor
pos     .field Sprite
state   .byte
timer   .word
.endtype
```

Both `Sprite` and `Actor` are available to every file that includes `layout.asm`. The `sizeof` and `offset` queries on those types work in any expression context.

## Library routines and contracts

Subroutine files should define `@` entry labels and include AZMDoc contracts:

```asm
; routines/sound.asm

; Play tone. A = frequency byte, B = duration.
;!      in        A,B
;!      clobbers  AF,BC
@PLAY_TONE:
        ; ... body ...
        ret
```

When the project builds with `--rc warn` or `--rc error`, the contracts are checked against call sites throughout the translation unit.

For library routines whose source you cannot include — ROM monitors, third-party binaries — write their contracts in an `.asmi` file:

```asm
; mon3.asmi
extern MON_PUTC
in A
clobbers A
end

extern MON_GETC
out A
out zero
clobbers A
end
```

Load it at assembly time:

```sh
azm --interface mon3.asmi main.asm
```

## Avoiding include cycles

AZM does not guard against a file including itself or a file including another that eventually includes the first. Both produce infinite inclusion loops. Avoid them by keeping includes one-directional: `main.asm` includes everything; individual files include nothing. If a subroutine file needs layout constants, put those constants in a shared file that everything includes, rather than having subroutine files include each other.

---

[← Addresses, Constants, and Expressions](03-addresses-constants-expressions.md) | [Manual](index.md) | [The Layout System →](05-layout-system.md)
