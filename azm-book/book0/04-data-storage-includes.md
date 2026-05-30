---
layout: default
title: "Chapter 4 — Raw Data, Storage and Strings"
parent: "AZM Book 0 — Assembler Manual"
nav_order: 4
---
[← Addresses, Constants and Expressions](03-addresses-constants-expressions.md) | [Manual](index.md) | [The Layout System →](05-layout-system.md)

# Chapter 4 — Raw Data, Storage and Strings

Every assembly program has two kinds of memory content: bytes you know at assemble time, and storage you fill at runtime. AZM's data directives write known bytes directly into the binary. Its storage directive reserves address space that the program fills when it runs.

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
Msg:
        .db "Hello"
        .db ","
        .db " World",0
```

This emits the same bytes as `.db "Hello, World",0`. Labels and `.db` directives can interleave freely.

## `.dw` — define words

`.dw` emits one or more 16-bit values in Z80 byte order.

### Little-endian byte order

The Z80 is little-endian: the low byte of a 16-bit value is stored at the lower address. `.dw $1234` writes `$34` at the current address and `$12` at the next address. Every 16-bit immediate and address in AZM follows this rule.

```asm
        .dw $1234         ; two bytes: $34 $12
        .dw 1000,2000     ; four bytes: $E8 $03 $D0 $07
        .dw VECTOR_TABLE  ; address of the label, low byte first
```

`.dw` accepts any expression that fits in 16 bits (0–65535). When you store an address as a 16-bit pointer — a jump vector, a callback address, a table entry — `.dw` handles the byte order for you.

## Labels inside data

Labels can appear between or before any `.db` / `.dw` line:

```asm
JumpTable:
        .dw HANDLER_A
        .dw HANDLER_B
        .dw HANDLER_C
JumpTableEnd:
TABLE_LEN .equ JumpTableEnd - JumpTable   ; = 6 bytes = 3 entries
```

---

## String directives

AZM provides three string-specific directives that set a termination policy explicitly.

**`.cstr` — C-style string (NUL terminated):**

```asm
        .cstr "Hello"   ; emits: H e l l o $00
```

Equivalent to `.db "Hello",0` but makes the termination policy explicit. Use `.cstr` when a routine scans forward until it reads a zero byte.

**`.pstr` — Pascal-style string (length prefix):**

```asm
        .pstr "Hello"   ; emits: $05 H e l l o
```

The first byte is the string length (0–255). The string itself follows. Strings longer than 255 characters are a range error. Use `.pstr` when the routine wants the byte count first.

**`.istr` — inverted terminator string:**

```asm
        .istr "Hello"   ; emits: H e l l (o | $80)
```

All bytes emit at their ASCII value except the last character, which has bit 7 set (`$6F | $80 = $EF` for lowercase `o`). Some older ROM routines use this encoding; the receiving loop checks for bit 7 to detect the final byte.

If none of these match your target routine's expected format, use `.db` directly.

---

## Jump and call tables

Dispatch tables are a natural use of `.dw`:

```asm
CmdTable:
        .dw do_draw     ; 0
        .dw do_move     ; 1
        .dw do_rotate   ; 2
        .dw do_erase    ; 3
CMD_COUNT .equ ($ - CmdTable) / 2

; Dispatch: A = command index (0 to CMD_COUNT-1)
        ld   hl,CmdTable
        ld   b,0
        ld   c,a
        add  hl,bc
        add  hl,bc        ; HL = CmdTable + A * 2
        ld   a,(hl)
        inc  hl
        ld   h,(hl)
        ld   l,a          ; HL = handler address
        jp   (hl)
```

`CMD_COUNT` uses `$ - CMD_TABLE` divided by 2 because each `.dw` entry is two bytes.

---

## `.ds` — reserve storage

`.db` and `.dw` write bytes you know at assemble time. Storage is different: you reserve the space now, but the program fills it at runtime. `.ds count` advances the address counter without writing bytes. `.ds count,fill` also writes the fill byte across the reserved range.

### Basic syntax

```asm
Counter:
        .ds 1          ; reserve 1 byte

Buffer:
        .ds 64         ; reserve 64 bytes

Stack:
        .ds 256        ; reserve 256 bytes
```

The operand is a byte count expression. Labels placed before `.ds` name the start of the reserved block.

### Optional fill byte

A second operand specifies a fill value for the reserved region in the flat binary output:

```asm
Page:
        .ds 256,0      ; reserve 256 bytes filled with zero
```

A fill value gives the reserved region a known initial state in the binary image — for ROM initialization tables, for example.

### Storage maps

For programs with several independent storage areas, collect all `.ds` blocks under a dedicated `.org`:

```asm
; --- RAM layout: $8000–$8FFF ---
        .org $8000

RingBuf:        .ds 8
RingHead:       .ds 1
RingTail:       .ds 1
RingCount:      .ds 1

FrameBuf:       .ds FRAME_W * FRAME_H

        .org $8FFE
StackTop:       .ds 2
```

Collecting storage blocks under one `.org` lets you verify that no areas overlap and that the total fits available RAM.

---

`.ds` reserves storage by byte count. The storage map above is the manual approach — field offsets are implicit in declaration order. Chapter 5 shows the structured equivalent: name the fields once in a `.type` declaration and the layout system computes every offset.

[← Addresses, Constants and Expressions](03-addresses-constants-expressions.md) | [Manual](index.md) | [The Layout System →](05-layout-system.md)
