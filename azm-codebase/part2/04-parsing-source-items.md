---
layout: default
title: "Chapter 4 - Parsing Source Items"
parent: "Part II - Loading and Parsing"
grand_parent: "Understanding the AZM Codebase"
nav_order: 4
---
[<- Source Loading and Logical Lines](03-source-loading.md) | [Assembler-Time Facts ->](../part3/05-assembler-time-facts.md)

# Chapter 4 - Parsing Source Items

Parsing converts logical lines into the typed `SourceItem` stream consumed by
assembly, tooling and register care. The main orchestration lives in
`src/core/compile.ts`, with line parsing in `src/syntax/parse-line.ts` and
expression parsing in `src/syntax/parse-expression.ts`.

The key function is `parseNextSourceItems()`:

```ts
export function parseNextSourceItems(
  lines: readonly LogicalLine[],
  options: ParseNextSourceItemsOptions = {},
): ParseNextSourceItemsResult
```

It applies conditional assembly, collects op definitions, expands op invocations
and parses the remaining logical lines into source items.

The parser is the first place where AZM source becomes compiler data. Before
this point, a line is text with a file name and line number. After this point, a
line is a label, an instruction, a directive, a layout declaration or a comment
item. That conversion gives later stages precise structured input.

## Source Item Model

`src/model/source-item.ts` defines the parser output. The model includes:

- labels
- `.org`, `.equ`, `.db`, `.dw`, `.ds`, `.align`, string directives and `.end`
- instructions
- record and union layout declarations
- type aliases
- enums
- op-expanded items
- comments

Each item carries a source span where appropriate. Assembly uses the item kind
to decide size and emission. Register care uses instruction, label and comment
items to build routines. D8 map output uses spans to connect emitted bytes back
to files and lines.

The model also protects the compiler from accidental syntax drift. Once a
directive has become a `SourceItem`, assembly handles the canonical item shape.
Compatibility syntax, aliases and surface-level punctuation are resolved before
the item reaches address planning.

## The Source Item Handoff

The handoff from parser to assembler is easiest to see with a short example:

```asm
COUNT .equ 4

Loop:
        djnz Loop
```

The parser emits an equate item for `COUNT`, a label item for `Loop` and an
instruction item for `djnz Loop`. Address planning then assigns the label's
address. Fixup emission later calculates the branch displacement from that
address.

This separation lets parser tests ask "did the source become the right item?"
and assembly tests ask "did the item produce the right address and bytes?"

## Top-Level Parse Order

`parseNextSourceItems()` handles constructs that span multiple lines before
falling through to normal line parsing:

1. Conditional assembly filters the logical line stream.
2. `collectOps()` records top-level `op` definitions and marks their body lines.
3. Name-left `.typealias` declarations are parsed.
4. Record and union headers collect `.field` declarations until `.endtype` or
   `.endunion`.
5. Visible op invocations expand into ordinary source items.
6. `parseLogicalLine()` handles single-line labels, directives, data and
   instructions.

This order matters. Ops must be collected before invocation expansion. Layout
declarations must collect their body lines as one source item. Ordinary
instruction parsing should see only the lines that remain after those structural
forms have been handled.

The sequence also keeps error recovery manageable. A malformed layout body can
produce layout diagnostics while the parser continues at the following
top-level line. An invalid op expansion can report the op call and preserve the
rest of the file. A normal instruction line can fall through to the Z80 parser
with a small local context.

## Layout Declarations

Name-left layout syntax is parsed in `parseNextSourceItems()` because a record
or union body spans multiple lines:

```asm
Sprite .type
x      .field byte
y      .field byte
tile   .field byte
flags  .field byte
       .endtype
```

Fields are parsed as `LayoutField` values. Each field has a name and a type
expression. The parser checks the shape of the declaration, while
`address-planning.ts` later checks duplicate field names, layout size and type
references.

Type aliases are parsed as named bindings:

```asm
SpriteArray .typealias Sprite[16]
```

The parser stores the alias target as a type expression. Assembly later resolves
the target against scalar layout names, record names, union names and other type
aliases.

Record and union parsing deliberately creates one item for the whole layout.
That gives address planning the complete field list at once, which is necessary
for duplicate field checks, field offsets and final layout size.

## Directive Forms

`parseLogicalLine()` recognises the ordinary one-line directives. The native
forms are represented by direct source-item kinds:

```asm
Origin .equ $8000
        .org Origin
        .db 1,2,3
        .dw Origin
        .ds 16
```

Data directives carry parsed `DataValue` records. Instruction items carry a
typed `Z80Instruction`. String directives carry their string value and the
directive kind. This gives emission enough information to write bytes while
preserving source spans for map output.

## Labels and Declarations

The parser distinguishes address labels from declarations. An address label
uses a colon and becomes a label item. Name-left declarations become equate,
enum, type, union or type-alias items.

```asm
Start:
        ret

COUNT .equ 8
```

This distinction is important for the source model. A label contributes an
address based on placement. An equate contributes an assembler-time value based
on expression evaluation.

## Single-Line Parsing

`src/syntax/parse-line.ts` recognises the ordinary source line forms: labels,
declarations, directives, instructions and comments. It calls the Z80 parser
for instruction text and emits parse diagnostics for malformed lines.

Keep line parsing focused on syntax. A line parser may know that `.dw` receives
expressions or that `.include` receives a path-like argument. Address planning
and expression evaluation decide final addresses, expression values and symbol
fixups.

## Expression Parsing

`src/syntax/parse-expression.ts` parses numeric expressions, names, unary and
binary operators, function calls, layout casts and type expressions. It is used
by `.equ`, data directives, instruction operands, layout functions, `.ds` and
layout fields.

The parser produces expression trees from `src/model/expression.ts`.
`src/semantics/expression-evaluation.ts` evaluates those trees when the
assembler-time environment is available, including symbols that depend on later
declarations.

## Conditional Assembly

Conditional assembly is handled before final line parsing. The conditional pass
keeps the active lines and removes inactive branches from the stream seen by
later stages. This keeps the rest of the parser simple: ordinary parsing deals
with a single effective source program.

Condition expressions still use the same expression parser. A change to
expression syntax may affect directives, instruction operands, layouts and
conditionals.

The conditional stage receives logical lines and emits logical lines. That makes
conditional assembly a source-filtering pass rather than a separate item kind.
The downstream compiler sees the source that is active for the selected
configuration.

## Parse Diagnostics

`src/syntax/parse-diagnostics.ts` contains shared helpers for syntax errors.
Diagnostic IDs come from `src/model/diagnostic.ts`. Use those helpers when
adding new parse failures so source positions, severity and code shape stay
consistent.

Parsing should recover where useful. A malformed line should usually produce a
diagnostic and let the parser continue, because later diagnostics are valuable
to both CLI users and editor integrations.

The parser's recovery strategy is especially important for editors. A user may
have a half-written line while typing. Tooling still needs symbols, diagnostics
and register-care hints for the surrounding source. Recoverable diagnostics make
that possible.

## Maintenance Notes

Add new syntax by deciding its source-item shape first. A clean source-item
model keeps later stages clear. If a feature needs multi-line parsing, handle it
in `parseNextSourceItems()`. If it fits on one line, prefer `parse-line.ts`.

When a syntax change affects expressions, update expression parser tests,
integration tests and any output tests that observe the emitted result.
