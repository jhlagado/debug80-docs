---
layout: default
title: "Chapter 6 - Emission, Fixups and Z80 Encoding"
parent: "Part III - Assembly"
grand_parent: "Understanding the AZM Codebase"
nav_order: 6
---
[<- Assembler-Time Facts](05-assembler-time-facts.md) | [Ops and Visible Expansion ->](../part4/07-ops-expansion.md)

# Chapter 6 - Emission, Fixups and Z80 Encoding

Emission turns source items into a byte map. Fixups resolve symbolic references
inside encoded instruction fragments. Z80 parsing and encoding live under
`src/z80/`, while emission lives under `src/assembly/`.

The orchestration point is `src/assembly/assemble-program.ts`:

```ts
export function assembleProgram(items: readonly SourceItem[]): AssembleProgramResult
```

It builds the address state, emits the program image and returns diagnostics,
symbols, byte maps and source segments.

`assembleProgram()` is intentionally small. Its job is orchestration: build the
environment, ask emission to write bytes, combine diagnostics and return the
assembled result. The detailed decisions live in the modules below it.

## Program Emission

`src/assembly/program-emission.ts` owns byte writing. It walks source items in
order and writes emitted bytes to a map keyed by absolute address. It also
records source segments for the D8 map writer.

The emitted program shape is:

```ts
export interface EmittedProgram {
  readonly image: ReadonlyMap<number, number>;
  readonly sourceSegments: readonly EmittedSourceSegment[];
  readonly initializedAddresses: readonly number[];
}
```

The map representation supports sparse programs. A source can place bytes at
`$0100`, move to another origin and emit more bytes later. Output writers decide
how to serialize the written ranges.

The byte map stores final addresses. If source emits one byte at `$0100` and
another at `$8000`, the map has two entries. A sparse map fits Z80 programs
that place code, data and ROM vectors at separate origins.

## Emission Walkthrough

For this source:

```asm
        .org $0100
Start:
        ld      a,42
        jp      Start
```

address planning records `Start = $0100`. The instruction parser represents
`ld a,42` as an immediate load and `jp Start` as an absolute branch. The encoder
returns literal opcode bytes plus a 16-bit expression fragment for `Start`.
Fixup emission evaluates `Start` to `$0100` and writes the little-endian operand
bytes.

The final byte map contains:

```text
$0100: 3E
$0101: 2A
$0102: C3
$0103: 00
$0104: 01
```

The D8 source segment records that those bytes came from the source lines that
emitted them.

## Fixup Fragments

The Z80 encoder returns fragments: literal bytes, 8-bit immediates, 16-bit
immediates and relative branch targets. `src/assembly/fixup-emission.ts`
evaluates the expression attached to each fragment and writes the final byte or
word.

This split keeps Z80 instruction encoding independent from symbol resolution.
The encoder describes the shape of the instruction. The assembler resolves
names, ranges and relative offsets.

Fragments also give diagnostics the right owner. The encoder can reject an
invalid instruction form. Fixup emission can reject an unresolved symbol or a
relative branch that falls outside its range. Each stage reports the error it is
qualified to understand.

## Z80 Instruction Model

`src/z80/instruction.ts` defines the instruction and operand types. The model is
discriminated by mnemonic and form. This gives the encoder a typed input rather
than raw text.

`src/z80/parse-instruction.ts` parses instruction text into that model. It
recognises registers, register pairs, conditions, indexed operands, ports,
relative branches, ALU forms, bit operations, shifts, rotates and special Z80
instructions.

`src/z80/encode.ts` turns the model into encoded fragments. The large switch in
`encodeZ80Instruction()` is the main instruction dispatch.

The instruction model keeps overloaded Z80 mnemonics manageable. `ld` has many
forms, but the parser classifies the operands before encoding. The encoder then
selects a specific opcode family from typed operands rather than repeatedly
inspecting raw strings.

The parser and encoder work as a pair:

| File | Question |
| --- | --- |
| `parse-instruction.ts` | Which instruction form did the source request? |
| `instruction.ts` | How is that form represented as TypeScript data? |
| `encode.ts` | Which bytes and fixup fragments represent that form? |
| `effects.ts` | Which registers and flags does that form read or write? |

## Effects

`src/z80/effects.ts` describes register and flag effects for instructions. The
register-care subsystem consumes these effects to understand reads, writes,
clobbers and value relations.

Keep instruction encoding and instruction effects aligned. Adding a new Z80 form
usually requires parser support, encoder support, effect support and tests for
each.

## Relative Branches

Relative branches such as `jr` and `djnz` emit an 8-bit displacement from the
next instruction. The encoder returns a relative fragment. Fixup emission
calculates the displacement after labels are known and reports a range
diagnostic when the target is outside `-128..127`.

The parser/encoder/fixup split is visible in relative branches:

1. The parser recognises `jr nz,Loop`.
2. The encoder knows the opcode and that the operand is relative.
3. Fixup emission knows the current address and final target address.

The same principle applies to absolute branches and immediate operands. The
encoder chooses the fragment width. Fixup emission evaluates the expression and
checks the value fits that width.

## Data Emission

Data directives are emitted by `program-emission.ts`. `.db` writes byte values,
strings and character values. `.dw` writes 16-bit words in little-endian order.
String directives call the shared string byte helpers so `.cstr`, `.pstr` and
`.istr` match the size calculations from address planning.

`.ds` reserves storage by advancing placement. Its emitted bytes depend on the
requested output range and the initialized content around it. This behaviour is
kept in the assembly/output boundary so sparse programs and trailing storage can
be represented correctly.

String data is shared between planning and emission. Planning asks how many
bytes a string directive will occupy. Emission asks which bytes it should write.
Using the same helper for `.cstr`, `.pstr` and `.istr` keeps those answers
aligned.

## Source Segments

Every emitted byte range can carry source provenance. `program-emission.ts`
adds `EmittedSourceSegment` records with start address, end address, source file,
line and segment kind. `writeD8m()` later groups these segments by file for
Debug80.

Good source segments are essential for breakpoints and stepping. When changing
emission, verify D8 map tests as well as byte tests.

Source segments classify emitted ranges as code, data, directive output, label
context or unknown output. Debug80 uses this metadata to connect source lines to
addresses. A byte-perfect assembler can still give a poor debugging experience
when source segments are too broad, absent or attached to a different file.

## Maintenance Notes

Instruction changes belong in four places: `parse-instruction.ts`,
`instruction.ts`, `encode.ts` and `effects.ts`. Then add parser/encoder tests
under `test/unit/z80/` and integration fixtures for the user-facing behaviour.

Assembly changes belong in `address-planning.ts`, `program-emission.ts`,
`fixup-emission.ts` or `placement.ts` depending on whether the change affects
facts, emitted bytes, symbolic references or address movement.
