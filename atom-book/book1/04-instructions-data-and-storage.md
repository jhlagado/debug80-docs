---
layout: default
title: "Instructions, Data and Storage"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 4
---

# Instructions, Data and Storage

Atom accepts the complete documented Z80 instruction set together with the
classic undocumented forms listed in the instruction reference. It rejects
operand combinations that the processor cannot encode.

## Instruction families

The supported surface includes base, CB, ED, DD, FD, DDCB, and FDCB encodings:

```asm
LD A,(HL)
ADC HL,DE
BIT 3,(IX+2)
LD I,A
LDIR
SET 6,(IY-1)
```

Atom also accepts the classic undocumented index-half registers `IXH`, `IXL`,
`IYH`, and `IYL`. `SLL` and `SLS` are two names for the same undocumented
shift operation.

Branch width remains explicit. Atom never changes `JR` into `JP`. A forward
`JR` whose final displacement lies outside −128 through 127 is an error.

Enumerated fields are checked:

- `BIT`, `RES`, and `SET` accept bit numbers 0 through 7;
- `RST` accepts 0, 8, 16, 24, 32, 40, 48, or 56; and
- `IM` accepts 0, 1, or 2.

The DD/FD rules follow the processor's real encodings. `LD A,IXH` and
`LD IXH,IXL` are valid. `LD IXH,H` is not encodable. In `LD H,(IX+1)`, the
destination is the ordinary H register, not IXH.

The [Z80 instruction reference](../appendices/10-z80-instruction-reference.md)
lists the exact standard and classic-undocumented forms accepted for each
mnemonic.

## `DB` — define bytes

`DB` emits comma-separated numeric expressions and double-quoted byte strings:

```asm
DB 0,$FF,%10101010
DB "ATOM",0
DB 'A','Z'
```

Each numeric result contributes its low byte. A forward affine expression is
resolved when its symbol is declared.

String escapes are `\0`, `\n`, `\r`, `\t`, `\'`, `\"`, `\\`, and `\xHH`.
Strings and numeric items may share one list.

## `DW` — define words

`DW` emits each expression as a 16-bit little-endian word:

```asm
DW 1234H              ; EMITS $34,$12
DW START,TABLE+2
```

Strings are not accepted. A forward affine expression is resolved to a
little-endian word when its symbol is declared.

## `DS` — reserve or fill storage

`DS COUNT` advances the logical cursor without emitting IMAGE bytes:

```asm
BUFFER:
    DS 64
```

`DS COUNT,FILL` emits `COUNT` initialized bytes:

```asm
PAGE:
    DS 256,0
```

Both operands must already be resolved. Count and capacity are checked before
the first output operation, so a failed directive publishes no partial span.

Uninitialized reservations still affect later labels, the output length,
listing rows, and D8 source ranges. The command-line hosts use zero bytes for
their BIN and HEX materialisation; the JavaScript API can select another fill
value. NOBJ records the span as reserved storage.

## `ALIGN`

`ALIGN BOUNDARY` emits zero bytes until the cursor reaches the next address
divisible by the boundary:

```asm
ALIGN 16
TABLE:
    DB 1,2,3,4
```

The boundary is a resolved positive value and need not be a power of two. An
already aligned address emits no byte.

## String directives

Three directives state a string's storage convention directly:

```asm
CSTR "READY"     ; BYTES FOLLOWED BY $00
PSTR "NAME"      ; LENGTH BYTE FOLLOWED BY BYTES
ISTR "TOKEN"     ; BIT 7 SET ON THE FINAL BYTE
```

`CSTR` and `PSTR` accept decoded payloads of at most 255 bytes. `CSTR` adds its
terminator to the output-capacity requirement. `ISTR ""` emits nothing; a
non-empty payload receives bit 7 on its last byte.

Each directive requires one double-quoted string and accepts the same escapes
as `DB`.

## `INCBIN`

`INCBIN` is a desktop-host facility that emits one complete file as initialized
bytes:

```asm
FONT: INCBIN "ASSETS/FONT.BIN"
```

The path is relative to the source file containing the directive. It must use
ASCII, resolve inside the project root, and match the filename's capitalisation.
Symlink targets outside the root are rejected. Atom reads the complete binary
before assembly, so one build uses one stable copy of the file.

One binary may contain 0 through 65,535 bytes. Atom does not accept offset or
length operands. During source preparation, Atom replaces the line with an
equal-length reservation for address calculation and attaches the saved binary
bytes to the resulting output. Listings and D8 maps retain the original
`INCBIN` line. Native CP/M Atom does not implement `INCBIN`.

## Directive summary

The assembler reserves the bare words `EQU`, `ORG`, `DB`, `DW`, `DS`,
`ALIGN`, `INCBIN`, `CSTR`, `PSTR`, and `ISTR`. Dotted aliases are invalid.
The complete table appears in [Appendix 1](../appendices/01-directives.md).
