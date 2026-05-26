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

## Fixup Fragments

The Z80 encoder returns fragments: literal bytes, 8-bit immediates, 16-bit
immediates and relative branch targets. `src/assembly/fixup-emission.ts`
evaluates the expression attached to each fragment and writes the final byte or
word.

This split keeps Z80 instruction encoding independent from symbol resolution.
The encoder describes the shape of the instruction. The assembler resolves
names, ranges and relative offsets.

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

This is a good example of the parser/encoder/fixup split:

1. The parser recognises `jr nz,Loop`.
2. The encoder knows the opcode and that the operand is relative.
3. Fixup emission knows the current address and final target address.

## Data Emission

Data directives are emitted by `program-emission.ts`. `.db` writes byte values,
strings and character values. `.dw` writes 16-bit words in little-endian order.
String directives call the shared string byte helpers so `.cstr`, `.pstr` and
`.istr` match the size calculations from address planning.

`.ds` reserves storage by advancing placement. Its emitted bytes depend on the
requested output range and the initialized content around it. This behaviour is
kept in the assembly/output boundary so sparse programs and trailing storage can
be represented correctly.

## Source Segments

Every emitted byte range can carry source provenance. `program-emission.ts`
adds `EmittedSourceSegment` records with start address, end address, source file,
line and segment kind. `writeD8m()` later groups these segments by file for
Debug80.

Good source segments are essential for breakpoints and stepping. When changing
emission, verify D8 map tests as well as byte tests.

## Maintenance Notes

Instruction changes belong in four places: `parse-instruction.ts`,
`instruction.ts`, `encode.ts` and `effects.ts`. Then add parser/encoder tests
under `test/unit/z80/` and integration fixtures for the user-facing behaviour.

Assembly changes belong in `address-planning.ts`, `program-emission.ts`,
`fixup-emission.ts` or `placement.ts` depending on whether the change affects
facts, emitted bytes, symbolic references or address movement.
