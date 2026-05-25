# AZM Implementation Notes

Working notes for future coding-agent tasks. These are design questions or potential assembler changes, not documentation edits to apply now.

## Potential Syntax Errors and Grammar Tightening

### Colon form for `.equ`

Current accepted form:

```asm
COUNT:  .equ 8
```

Concern:

Allowing a label-colon form for an equate constant may encourage poor style by making a constant look like an address label. Constants and labels serve different purposes, and the syntax should probably keep that distinction clear.

Potential change:

- Treat `NAME: .equ value` as an error.
- Prefer only:

```asm
NAME    .equ value
```

Rationale:

This would prevent address-label syntax from leaking into constant definitions and keep `.equ` declarations visually distinct from labels. Colons should mark address labels. `.equ` symbols are constants, so they do not need label-colon syntax.

Documentation direction:

- Remove sections that present `NAME: .equ value` as tolerated or valid AZM style.
- State the native form as `NAME .equ value`.
- If useful, mention briefly that some older assemblers allow a colon before `.equ`, but AZM treats that as an error in native syntax.

Compatibility question:

If this breaks useful legacy source, consider accepting the colon form only under an explicit compatibility or alias mode. It should not be part of native AZM syntax.

### Colon consistency audit

Concern:

Colon handling for labels appears potentially inconsistent or overly tolerant. Address labels need colons; constants and other symbol declarations should use their own directive syntax. Unpredictable colon tolerance makes the language feel loose and encourages poor standards.

Open design discussion:

Before locking the rule down, have a wider discussion about what semantic information the colon actually carries in AZM syntax.

Questions:

- Is the colon semantically significant, or is it only a visual marker inherited from assembler tradition?
- Are there contexts where the colon disambiguates a real grammar ambiguity?
- If the colon is optional or ignorable in some contexts, does that mean the grammar should either require it consistently or omit it entirely?
- Could AZM adopt a stricter rule that omits colons completely for labels?
- If labels keep colons, should the rule be "colon only marks address labels"?
- How does this interact with `.equ`, proposed `.enum` and proposed `.type` name-first syntax?
- What compatibility cost would follow from removing optional colon tolerance?

Potential task:

- Audit the grammar and parser around colon handling.
- Identify every context where a colon is accepted.
- Classify each context as native syntax, compatibility syntax or accidental tolerance.
- Enforce a consistent rule: colons introduce address labels.
- Reject colons in `.equ` declarations and any other non-address symbol declarations unless an explicit compatibility mode is active.

Design principle:

AZM should be a stricter assembler. Historical assemblers have often been highly tolerant, which encourages inconsistent source style. Native AZM syntax should set a higher standard and report loose or ambiguous forms as errors.

## Experimental Syntax Ideas

## Potential Built-in Functions

### `LSW` / `MSW`

Question:

Should AZM provide least-significant-word and most-significant-word functions, analogous to `LSB` and `MSB`?

Possible names:

```asm
LSW(expr)    ; least significant word
MSW(expr)    ; most significant word
```

Discussion points:

- Would these be useful for 32-bit constants, address tables or data formats that need 16-bit lanes?
- What numeric range should the expression model support before these functions are meaningful?
- Should they mask to 16 bits in the same way `LSB` / `MSB` mask to 8-bit lanes?
- Would the names be clear enough to assembly programmers, or would they be confused with Z80 word-sized registers?
- If added, should they live in the same built-in function family as `LSB` and `MSB`?

## Quote Syntax

### Single quotes vs double quotes

Current implementation summary:

- In expression context, both `'A'` and `"A"` parse as a one-character numeric value.
- Multi-character quoted values are rejected as expressions.
- `.db` values are parsed as expressions first, then as string fragments.
- `.db` currently accepts both double-quoted and single-quoted multi-character string fragments.
- `.cstr`, `.pstr` and `.istr` currently require one double-quoted string.
- Recognised escapes in quoted byte expressions include `\0`, `\n`, `\r`, `\t`, `\'`, `\"` and `\\`.

Design question:

Should AZM keep both quote forms in all currently accepted contexts, or should the language distinguish them more strictly?

Possible stricter rule:

- Single quotes are for character literals in expressions: `'A'`.
- Double quotes are for strings: `"Hello"`.
- `.db` can accept double-quoted string fragments and single-quoted one-character expressions.
- `.cstr`, `.pstr` and `.istr` accept double-quoted strings.

Questions for coding-agent discussion:

- Would restricting multi-character single-quoted `.db` fragments break useful compatibility?
- Should compatibility mode tolerate old single-quoted string fragments while native AZM style prefers double-quoted strings?
- Should diagnostics guide users toward single quotes for characters and double quotes for strings?
- Should documentation describe the current permissive behaviour or the desired stricter style?

## Future Module / Import System

### `.import` with public `@` entry symbols

Future direction:

Consider adding a new `.import` directive that assembles another AZM file with module-like symbol visibility. This would be distinct from `.include`, which remains textual inclusion for legacy source and simple projects.

Proposed distinction:

- `.include` keeps current behaviour: inserts source text into the current translation unit. All labels are global and must be globally unique.
- `.import` assembles or loads another file as a dependency and exposes only its public symbols.
- Public routine symbols are marked with `@` entry labels.
- Plain labels inside an imported file are private to that file/module.

Rationale:

The register-care system already treats `@` labels as important routine boundaries. They could also become part of the public API of a file. Plain labels would become implementation details. This would give AZM a path toward local namespaces and cleaner dependency boundaries without breaking legacy include behaviour.

Possible semantics:

```asm
.import "sprites.asm"
```

Only `@DrawSprite`, `@InitSprites` and other `@` entries from `sprites.asm` become visible to the importing file, under their callable names (`DrawSprite`, `InitSprites`). Internal branch labels and private data labels remain local to `sprites.asm`.

Design questions:

- Does `.import` assemble the imported file once and merge its emitted bytes, or does it import only symbols/contracts?
- How are memory origins coordinated across imported files?
- Are public data symbols allowed, or only `@` routine entries?
- Should there be an explicit export marker for data, distinct from `@` routine entries?
- How do register-care contracts flow across imports?
- How do `.asmi` interface files relate to imported source files?
- What diagnostics appear when an imported file references private labels from another file?
- How should circular imports be handled?

Relationship to block/local labels:

This may reduce the need to reproduce ASM80-style block directives. A future `.import` could effectively wrap each imported file in its own namespace, with only public `@` entries exported. That may be a cleaner AZM-native route to local/global label structure.

Roadmap note:

This is a significant feature. It requires a real model for local namespaces, global/public symbols, imported dependency assembly and interaction with register-care analysis. Keep `.include` stable for legacy compatibility while exploring `.import` as a more modern AZM dependency mechanism.

## Future Op System

### Value-pattern overloads for compile-time recursion

Experimental idea:

Extend op overload matching so an op can match on specific numeric values, not only operand classes such as `imm8`, `reg8`, `reg16` and so on.

Motivating problem:

Ops can currently be parameterised by operand shape, but they cannot dispatch on a particular immediate value such as `0`. That makes it difficult to express recursive op expansion with a terminating base case.

Example idea:

Generate a variable number of `nop` instructions:

```asm
; possible future syntax only
op nops(0)
end

op nops(n number)
  nop
  nops n - 1
end

        nops 6
```

The overload matching would select the `0` case when the argument reaches zero, terminating recursion. The non-zero or general numeric case would emit one `nop` and recurse with a smaller value.

Design questions:

- Should op overloads be able to match exact numeric values?
- Is there a way to express "non-zero number" as an overload constraint?
- Should the argument be called `number`, `const`, `value` or something else to avoid confusion with instruction immediates?
- Should op bodies allow arithmetic on compile-time numeric parameters?
- How should recursive op expansion be bounded to prevent infinite expansion?
- Would this require a limited compile-time conditional system instead?

Status:

This is only a future direction note. Do not implement without a fuller design discussion.

## Alias System

### Make alias matching case-sensitive

Current concern:

Alias matching is currently described as case-insensitive. That may be too tolerant and inconsistent with the goal of stricter AZM syntax.

Potential change:

- Make directive alias matching case-sensitive.
- If multiple case forms are accepted, list each accepted form explicitly in the alias table/profile.
- Avoid one broad case-insensitive alias accepting arbitrary mixed-case forms.

Rationale:

Explicit case-sensitive aliases make compatibility behaviour visible and controlled. They avoid turning aliases into another loose parsing layer.

Documentation impact:

If changed, Chapter 7 should stop saying alias matching is case-insensitive. It should say aliases match the forms declared by the built-in profile or project alias file.

### Name-first enum syntax

Current rough idea:

Move enum declarations toward the same name-first pattern as `.equ`.

Possible syntax:

```asm
Mode    .enum Read, Write, Append
```

instead of:

```asm
enum Mode Read, Write, Append
```

Rationale:

This would make the declared symbol name appear first, aligning enum declarations with `NAME .equ value`.

### Name-first type syntax

Current rough idea:

Move type declarations toward a name-first directive form.

Possible syntax:

```asm
Sprite  .type
x       .byte
y       .byte
tile    .byte
flags   .byte
        .endtype
```

instead of:

```asm
.type Sprite
x       .byte
y       .byte
tile    .byte
flags   .byte
.endtype
```

Rationale:

This would make the declared type name appear first, aligning type declarations with `NAME .equ value` and the proposed `NAME .enum ...` form.

Open question:

These are experimental syntax ideas only. They need design review before implementation, especially around parser ambiguity, backward compatibility and whether existing `.type Name` / `enum Name ...` forms should remain accepted, warn or become errors.

### Named array type signatures / type aliases

Question:

Should AZM support naming an array type expression so examples and source can refer to a structured array by a type name?

Motivating example:

Today, layout casts may need to write the full array type expression:

```asm
ld   hl,<Sprite[16]>SPRITES[3].flags
```

A future type-alias or named-array feature could allow a named signature:

```asm
; possible future syntax only
SpriteArray .typealias Sprite[16]

ld   hl,<SpriteArray>SPRITES[3].flags
```

Discussion points:

- What syntax should name a type expression?
- Should this be a true type alias, an array typedef or a wrapper record convention?
- How should it interact with `sizeof`, `offset` and layout casts?
- Would it simplify documentation enough to justify the feature?

Updated direction:

Real type aliases for array type expressions are needed. The wrapper-record workaround is a hack: it works by creating a record with an array field, but that adds an artificial field level and does not express the idea directly.

Implementation goal:

- Support naming a type expression directly, especially array expressions such as `Sprite[16]`.
- Let `sizeof`, `offset`, `.ds`, `.field` and layout casts use the alias naturally.
- Avoid requiring wrapper records solely to give an array type a name.

Documentation impact:

Once implemented, the manual should use the real alias form instead of teaching wrapper records as a normal pattern.

### Coherent layout type taxonomy

Question:

Does AZM have a coherent type taxonomy, and should the implementation make more of these concepts first-class?

Concepts to review:

- Scalar types: `byte`, `word`, `addr`.
- Pointer/address types: `addr` as an address-sized scalar, plus possible future typed pointers.
- Record types: `.type` declarations with named fields.
- Array type expressions: `byte[32]`, `Sprite[16]`.
- Composite types: records and arrays built from smaller layout types.

Current concern:

The implementation and documentation appear strongest around record layouts. Arrays exist as type expressions and fields, but named array types/type aliases are not yet well defined. Pointer semantics are also mostly implicit: `addr` is an address-sized value, but "pointer to Sprite" is expressed through layout casts rather than a typed pointer declaration.

Discussion points:

- Should array types be nameable?
- Should typed pointers exist, or should casts remain the mechanism for imposing a layout on an address?
- Should `addr` remain only a 16-bit scalar with pointer intent?
- Which of these concepts should be parser features versus documentation vocabulary?

### Deprecate or remove `addr`

Current concern:

`addr` is currently the same size as `word`: a 16-bit layout scalar. Its only distinction is semantic intent, suggesting that the field holds an address or pointer.

Reason to remove:

- On the Z80, words and addresses are both 16-bit values and are used fluidly in register pairs.
- `addr` does not provide true typing or enforce pointer semantics.
- Introducing it adds another data concept for the reader to carry.
- The semantic distinction may not justify the cognitive load.

Potential change:

- Deprecate `addr` in documentation and implementation.
- Prefer `word` for all 16-bit layout fields.
- If pointer intent needs documentation, use field names or comments rather than a separate scalar keyword.

Migration question:

If existing source uses `.addr`, should AZM:

- continue accepting it with a warning for one release,
- accept it only under compatibility mode, or
- remove it directly if the feature is still experimental enough?
