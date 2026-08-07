---
layout: "default"
title: "9. Instruction encoding"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 9
pageClass: "nucleus-specification"
---
[← 8. Virtual-slot organization](08-virtual-slot-organization.md) · [Contents](./) · [10. Data movement and memory access →](10-data-movement-and-memory-access.md)

<div id="9-instruction-encoding" class="nucleus-source-anchor"></div>

# 9. Instruction encoding

<div id="91-general-form" class="nucleus-source-anchor"></div>

## 9.1 General form

Every instruction begins with one opcode byte. The opcode fixes the number and width of all following operands. A slot, argument index, routine ordinal, service ordinal, trap number, or byte immediate occupies one byte. A word immediate and code target occupy two little-endian bytes.

The notation in the table uses:

- `s`, `a`, `b`, and `d` for slots;
- `q` for an argument index;
- `r` for a routine ordinal;
- `v` for a service ordinal;
- `t` for a trap number;
- `i8` and `i16` for constants;
- `x` for a data offset; and
- `p` for a code offset.

Multi-source operations encode sources before the destination. The instruction width never depends on an operand value.

<div id="92-complete-opcode-assignment" class="nucleus-source-anchor"></div>

## 9.2 Complete opcode assignment

| Opcode | Mnemonic  | Operands after opcode | Width | Meaning                              |
| -----: | --------- | --------------------- | ----: | ------------------------------------ |
| `0x00` | `NOP`     | —                     |     1 | no effect                            |
| `0x01` | `LDI8`    | `i8, d`               |     3 | byte constant                        |
| `0x02` | `LDI16`   | `i16, d`              |     4 | word constant                        |
| `0x03` | `MOV`     | `s, d`                |     3 | complete slot copy                   |
| `0x04` | `ARG`     | `s, q`                |     3 | stage one argument                   |
| `0x05` | `GETR`    | `d`                   |     2 | consume a successful result          |
| `0x06` | `GETE`    | `d`                   |     2 | consume a recoverable error code     |
| `0x08` | `JMP`     | `p`                   |     3 | unconditional branch                 |
| `0x09` | `JZ`      | `s, p`                |     4 | branch when zero                     |
| `0x0a` | `JNZ`     | `s, p`                |     4 | branch when nonzero                  |
| `0x0b` | `JFAIL`   | `p`                   |     3 | branch on failed completion          |
| `0x0c` | `TRAP`    | `t`                   |     2 | explicit safety trap                 |
| `0x10` | `ADD8`    | `a, b, d`             |     4 | byte addition                        |
| `0x11` | `SUB8`    | `a, b, d`             |     4 | byte subtraction                     |
| `0x12` | `MUL8`    | `a, b, d`             |     4 | byte multiplication                  |
| `0x13` | `DIV8`    | `a, b, d`             |     4 | byte division                        |
| `0x14` | `AND8`    | `a, b, d`             |     4 | byte bitwise and                     |
| `0x15` | `OR8`     | `a, b, d`             |     4 | byte bitwise or                      |
| `0x18` | `ADD16`   | `a, b, d`             |     4 | word addition                        |
| `0x19` | `SUB16`   | `a, b, d`             |     4 | word subtraction                     |
| `0x1a` | `MUL16`   | `a, b, d`             |     4 | word multiplication                  |
| `0x1b` | `DIV16`   | `a, b, d`             |     4 | word division                        |
| `0x1c` | `AND16`   | `a, b, d`             |     4 | word bitwise and                     |
| `0x1d` | `OR16`    | `a, b, d`             |     4 | word bitwise or                      |
| `0x20` | `NEG8`    | `s, d`                |     3 | byte negation                        |
| `0x21` | `NEG16`   | `s, d`                |     3 | word negation                        |
| `0x22` | `NOT8`    | `s, d`                |     3 | byte complement                      |
| `0x23` | `NOT16`   | `s, d`                |     3 | word complement                      |
| `0x24` | `LNOT`    | `s, d`                |     3 | Boolean not                          |
| `0x25` | `NARROW8` | `s, d`                |     3 | checked word-to-byte conversion      |
| `0x28` | `EQ8`     | `a, b, d`             |     4 | byte equality                        |
| `0x29` | `NE8`     | `a, b, d`             |     4 | byte inequality                      |
| `0x2a` | `LT8`     | `a, b, d`             |     4 | unsigned byte less-than              |
| `0x2b` | `LE8`     | `a, b, d`             |     4 | unsigned byte less-or-equal          |
| `0x2c` | `GT8`     | `a, b, d`             |     4 | unsigned byte greater-than           |
| `0x2d` | `GE8`     | `a, b, d`             |     4 | unsigned byte greater-or-equal       |
| `0x30` | `EQ16`    | `a, b, d`             |     4 | word equality                        |
| `0x31` | `NE16`    | `a, b, d`             |     4 | word inequality                      |
| `0x32` | `LT16`    | `a, b, d`             |     4 | unsigned word less-than              |
| `0x33` | `LE16`    | `a, b, d`             |     4 | unsigned word less-or-equal          |
| `0x34` | `GT16`    | `a, b, d`             |     4 | unsigned word greater-than           |
| `0x35` | `GE16`    | `a, b, d`             |     4 | unsigned word greater-or-equal       |
| `0x40` | `ADDRI`   | `x, d`                |     4 | constant data address                |
| `0x41` | `ADDO`    | `a, i16, i16, d`      |     7 | checked constant-offset address      |
| `0x42` | `INDEX`   | `a, s, i16, i16, d`   |     8 | checked fixed-array element address  |
| `0x43` | `STRLEN`  | `a, i8, d`            |     4 | checked bounded-string length        |
| `0x44` | `STRIDX`  | `a, s, i8, d`         |     5 | checked existing string-byte address |
| `0x48` | `LOAD8`   | `a, d`                |     3 | data byte load                       |
| `0x49` | `LOAD16`  | `a, d`                |     3 | data word load                       |
| `0x4a` | `STORE8`  | `s, a`                |     3 | data byte store                      |
| `0x4b` | `STORE16` | `s, a`                |     3 | data word store                      |
| `0x50` | `CALL`    | `r`                   |     2 | invoke a bytecode routine            |
| `0x51` | `SVC`     | `v`                   |     2 | invoke a standard service            |
| `0x52` | `RET`     | —                     |     1 | successful result-free return        |
| `0x53` | `RETV`    | `s`                   |     2 | successful value return              |
| `0x54` | `FAIL`    | `s`                   |     2 | failed return with byte code         |

All other opcode bytes are reserved and invalid in an NVM 0.1 image. The highest assigned opcode is below `0x80`; a Z80 implementation may therefore use one 256-byte page containing 128 two-byte dispatch addresses.

<div id="93-source-first-order" class="nucleus-source-anchor"></div>

## 9.3 Source-first order

`STORE8` and `STORE16` name the value before the address. Arithmetic, comparison, and address formation name every read before the destination. `ARG` names the source slot before its staging index. This order keeps compiler emission regular and avoids a destination-first special case in the most common three-slot handlers.

<div id="94-no-embedded-source-types" class="nucleus-source-anchor"></div>

## 9.4 No embedded source types

An opcode width is the only runtime width selection. No instruction contains a source type ID, record ID, mutability flag, array type, or result type. Static metadata determines the opcode and immediate layout facts during compilation.
