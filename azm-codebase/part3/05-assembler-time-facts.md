---
layout: default
title: "Chapter 5 - Assembler-Time Facts"
parent: "Part III - Assembly"
grand_parent: "Understanding the AZM Codebase"
nav_order: 5
---
[<- Parsing Source Items](../part2/04-parsing-source-items.md) | [Emission, Fixups and Z80 Encoding ->](06-emission-fixups-z80.md)

# Chapter 5 - Assembler-Time Facts

Assembly begins by building the facts needed to place and evaluate the program.
The central file is `src/assembly/address-planning.ts`. It walks source items,
tracks the current assembly address, defines labels and constants, records
layout metadata and calculates sizes.

The exported entry point is:

```ts
export function buildAddressState(
  items: readonly SourceItem[],
  diagnostics: Diagnostic[] = [],
): AddressState
```

The returned `AddressState` contains symbol facts, equate records, layout
records, enum names, diagnostics and placement information.

This stage is where parsed syntax becomes assembler knowledge. A label item
becomes an address. A type declaration becomes a layout record. A `.ds`
directive becomes a byte count. An expression tree becomes a number if every
name in it can be resolved.

## Placement

`src/assembly/placement.ts` owns placement state. `.org` changes the active
address. Data and instructions advance the current placement by their emitted
size. `.align` advances to the next aligned address. Storage directives reserve
space in the byte map according to the storage rules used during emission.

Placement is separated from byte emission so the assembler can resolve symbols
before every byte has been written. The first pass establishes addresses. The
emission pass uses those addresses to encode references and fixups.

Placement records the current address and the active placement kind. `.org`
sets the address. An instruction advances by its encoded size. `.db` advances by
the number of emitted bytes. `.dw` advances by two bytes per expression. `.ds`
advances by the calculated storage size.

Because placement is computed before final emission, forward references can be
resolved. A branch to a later label can be encoded after address planning has
seen the label definition.

## Labels and Constants

Labels define addresses. `.equ` declarations define assembler-time values.
Enums define qualified constants. All of these end up in the symbol environment,
but their meaning differs:

- labels are addressable symbols
- `.equ` constants are value symbols
- enum members are qualified constants

`defineLabel()`, `defineEquate()` and `defineEnumMembers()` enforce duplicate
rules and record the source span for diagnostics and output metadata.

The code also checks case-insensitive collisions. AZM symbols are
case-sensitive, but collision diagnostics help catch source that was written
with older case-insensitive assembler habits.

The duplicate checks live here because this stage sees all binding forms
together. A name can come from a label, equate, enum or layout declaration.
Address planning can compare those namespaces and report the conflict with the
span that introduced it.

## Layout Records

Record and union declarations become layout records. A record field advances the
offset by its byte size. A union field starts at offset zero and the union size
is the largest field size.

For a record:

```asm
Sprite .type
x      .field byte
y      .field byte
tile   .field byte
flags  .field byte
       .endtype
```

the layout record stores `x = 0`, `y = 1`, `tile = 2`, `flags = 3` and total
size `4`. For a union, each field starts at offset `0`, and the final size is
the largest field expression.

Type aliases bind a name to another type expression:

```asm
SpriteArray .typealias Sprite[16]
```

The alias adds a name to the layout environment. `sizeof(SpriteArray)` resolves
through the alias to the size of `Sprite[16]`, with the same field paths as the
underlying array expression.

## Expression Evaluation

`src/semantics/expression-evaluation.ts` evaluates expression trees against the
assembler-time environment. It owns the rules for:

- literal arithmetic
- symbol lookup
- `sizeof(...)`
- `offset(...)`
- `LSB(...)`
- `MSB(...)`
- layout casts that fold to constant addresses

The evaluator receives maps of labels, equates and layouts. It returns a number
when an expression can be folded. It reports diagnostics when names are missing,
layout paths are invalid or the requested context needs a different expression
kind.

Expression evaluation is context-sensitive. A symbol in an instruction operand
may be a label or constant. A type expression in `.ds Sprite[4]` resolves to a
byte count. A layout cast such as `<SpriteArray>Sprites[3].flags` resolves to an
address only when the base address, type alias, index and field path are all
known at assembly time.

## Data and Storage Size

Address planning needs the byte length of each directive. It contains size
helpers for `.db`, `.dw`, `.ds`, strings and alignment. The same string
directive byte rules are reused during emission so planning and output stay
aligned.

The important storage distinction is:

- initialized data writes bytes through `.db`, `.dw`, `.cstr`, `.pstr` and
  `.istr`
- `.ds` reserves a number of bytes calculated from a numeric expression or
  layout type expression

Layout type expressions are byte-size expressions in storage and field-size
positions.

This rule keeps initialized data and reserved storage separate. `.db` and `.dw`
write explicit values. `.ds` reserves space calculated from numbers or layout
type expressions. The layout system helps calculate storage and field
offsets while leaving emitted initialized bytes explicit in source.

## Fixed-Point Planning

`buildAddressState()` may need more than one pass. Forward references,
expression sizes and layout aliases can become resolvable only after later
facts are known. The planning code repeats until the state signature stops
changing or diagnostics prove the program has unresolved facts.

This fixed-point approach keeps forward references usable while still producing
stable final addresses.

The state signature is the guardrail for this loop. After each pass, the planner
summarises the facts that affect addresses and sizes. When the signature repeats,
the planner has reached a stable environment and emission can proceed with those
facts.

## Maintenance Notes

Changes to symbols, enums, layouts, `.ds`, `.org`, `.align` or expression
folding usually start in `address-planning.ts` and
`expression-evaluation.ts`. Update the parser only when the source syntax has
changed. Update emission when byte output or source segments change.

The assembly fact model is shared by output writers. A symbol or layout change
can affect D8 maps, lowered ASM80 output and public tooling APIs.
