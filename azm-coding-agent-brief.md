# AZM Coding Agent Brief

This brief turns the accumulated implementation notes into a prioritised task list for the AZM coding agent. It separates implementation work from documentation work. The goal is to improve AZM's native language design, reduce loose compatibility behaviour and support the structured layout model that Book 4 now wants to teach.

Priorities:

- **P1**: implement or design immediately; these unblock the manual and improve core AZM.
- **P2**: useful tightening or consistency work; do after P1 or when touching the relevant parser area.
- **P3**: future direction only; do not implement without a separate design discussion.

## P1 — Core Layout And Native Syntax

### P1.1 Name-left declaration grammar and type aliases

This is the highest priority language-cleanup direction.

Core rule:

```asm
Label:                  ; address label

Name        .equ ...    ; named constant
Name        .enum ...   ; named enum
Name        .type       ; named record/layout body
Name        .type = ... ; named type alias
```

Colon means "this is an address label at this location." No colon means "this is a declaration or binding." This keeps the grammar teachable and prevents constants, enums and types from looking like addresses.

Native declarations should use name-left dotted directives:

```asm
COUNT       .equ 8
Colour      .enum Red, Green, Blue

Sprite      .type
x           .byte
y           .byte
tile        .byte
flags       .byte
            .endtype

SpriteArray .type = Sprite[16]
```

Reject colons on declarations:

```asm
COUNT:       .equ 8                  ; reject in native AZM
Colour:      .enum Red, Green, Blue  ; reject in native AZM
Sprite:      .type                   ; reject in native AZM
SpriteArray: .type = Sprite[16]      ; reject in native AZM
```

Compatibility note:

Old forms such as `enum Colour ...` and `.type Sprite` may remain temporarily if needed, but classify them as compatibility or legacy AZM syntax. They should not be the native teaching path.

Type alias implication:

The already-landed alias syntax:

```asm
.type SpriteArray = Sprite[16]
```

works, but it is stylistically the odd one out if AZM adopts name-left declarations. The cleaner native form is:

```asm
SpriteArray .type = Sprite[16]
```

The `=` makes it visually clear that this is a type alias, not a record body.

Implementation goals:

- Support `Name .type = TypeExpr` as the native type-alias form.
- Support `Name .type ... .endtype` as the native record/layout declaration form.
- Support `Name .enum ...` as the native enum declaration form.
- Keep `Name .equ ...` as the native constant declaration form.
- Reject colons on `.equ`, `.enum`, `.type` and `.type =` declarations in native mode.
- Decide which old forms remain as compatibility syntax and how they warn or migrate.

Acceptance criteria:

- Tests cover native `Name .equ`, `Name .enum`, `Name .type` and `Name .type = TypeExpr`.
- Tests reject colon forms for all declaration types in native mode.
- Tests cover legacy/current `enum Name`, `.type Name` and `.type Name = TypeExpr` according to the chosen compatibility policy.
- Diagnostics explain the native name-left form.
- Book 4 can teach one declaration family consistently.

### P1.2 Named array type aliases

Problem:

AZM can use array type expressions such as `Sprite[16]`, but there is no clean way to name that type expression. The documentation currently has to use full array expressions in casts, or awkward wrapper records. Wrapper records work mechanically, but they are a workaround and add an artificial field level.

Goal:

Support naming a layout type expression directly, especially array expressions.

Example direction:

```asm
SpriteArray .type = Sprite[16]

SPRITES:
        .ds SpriteArray

        ld   hl,<SpriteArray>SPRITES[3].flags
```

Required behaviour:

- A named alias can refer to a scalar, record, union or array type expression.
- `sizeof(Alias)` works.
- `.ds Alias` works.
- `.field Alias` works.
- `offset(Alias, path)` works.
- Layout casts can use the alias inside angle brackets.
- Errors should point through aliases clearly when a field path is invalid.

Design questions for the coding agent:

- What syntax best fits the existing parser?
- Can `Name .type = TypeExpr` replace or supersede the landed `.type Name = TypeExpr` form?
- Should aliases be restricted to type expressions only, or also support numeric aliases?
- Should aliases be first-class symbols in the same namespace as `.type` names?
- Can recursive aliases be detected and diagnosed cleanly?

Acceptance criteria:

- Tests cover aliasing `Sprite[16]`, `byte[32]` and a single record type.
- Tests cover `.ds`, `.field`, `sizeof`, `offset` and layout casts using the alias.
- Tests cover invalid field paths through an alias.
- Tests cover recursive or undefined aliases.
- Book 4 can remove the wrapper-record workaround after this lands.
- Book 4 can teach `Name .type = TypeExpr` as the native alias syntax.

### P1.3 Deprecate `addr` / `.addr`

Decision:

`addr` / `ADDR` should be deprecated. It remained because it had not been formally deprecated, not because it has a strong continuing role.

Reason:

On the Z80, words and addresses are both 16-bit values and are used fluidly in register pairs. `addr` has the same size as `word` and does not enforce typed pointer semantics. It adds vocabulary and cognitive load without adding a real capability.

Implementation direction:

- Prefer `word` for all 16-bit layout fields.
- Mark `addr` and `.addr` as deprecated.
- Decide whether current use emits a warning immediately or remains accepted silently for one compatibility window.
- Keep `addr` out of native examples and generated recommendations.
- If compatibility mode exists, consider accepting `addr` only there in a later release.

Acceptance criteria:

- Parser behaviour for `addr` / `.addr` is explicit and tested.
- Deprecated use produces the agreed diagnostic or compatibility behaviour.
- `sizeof(addr)` behaviour is either deprecated with warning or removed under the chosen policy.
- The directive/function references can be updated to stop teaching `addr` as normal syntax.

### P1.4 Reject colon form for `.equ` in native syntax

Problem:

AZM currently accepts:

```asm
COUNT:  .equ 8
```

This makes a constant look like an address label. Constants and labels serve different purposes. The colon should mark address labels, not `.equ` symbols.

Goal:

Native AZM should use:

```asm
COUNT   .equ 8
```

Implementation direction:

- Treat `NAME: .equ value` as an error in native syntax.
- If legacy compatibility is needed, accept it only under an explicit compatibility mode or alias/profile path.
- Produce a diagnostic that explains the native form: `COUNT .equ 8`.

Acceptance criteria:

- `NAME .equ expr` succeeds.
- `NAME: .equ expr` fails in native mode.
- If compatibility mode is retained, tests prove the mode boundary.
- Error text distinguishes constants from address labels.

### P1.5 Verify and fix listing deprecation surface

Problem:

The documentation is moving away from `.lst` output. The implementation and CLI may still expose listing generation and `--nolist`.

Goal:

Decide the implementation status of listing output so the manual can be accurate.

Implementation tasks:

- Audit current `.lst` generation.
- Audit `--nolist`.
- Decide whether `.lst` is deprecated, hidden, warning-producing or removed.
- If retained for compatibility, document it as deprecated in CLI help or changelog material rather than as a normal workflow.

Acceptance criteria:

- CLI help and tests reflect the chosen status.
- Default output behaviour is explicit.
- Book 4 can truthfully omit listing output from the main workflow.

## P2 — Parser Strictness And Consistency

### P2.1 Colon consistency audit

Problem:

Colon handling may be inconsistent or overly tolerant. Loose colon handling encourages historical assembler ambiguity.

Audit tasks:

- Identify every parser context where `:` is accepted.
- Classify each use as native syntax, compatibility syntax or accidental tolerance.
- Decide whether colons are required for address labels, optional for address labels or removable entirely.
- Reject colons in non-address declarations unless a compatibility mode explicitly allows them.

Design principle:

AZM should be stricter than many historical assemblers. Native syntax should report loose or ambiguous forms rather than silently accepting them.

Acceptance criteria:

- A short grammar report lists all colon-accepting contexts.
- Tests cover accepted and rejected colon positions.
- `.equ` colon handling follows P1.3.

### P2.2 Quote syntax policy

Current behaviour:

- In expression context, both `'A'` and `"A"` parse as a one-character numeric value.
- Multi-character quoted values are rejected as expressions.
- `.db` currently accepts both double-quoted and single-quoted multi-character string fragments.
- `.cstr`, `.pstr` and `.istr` currently require one double-quoted string.

Preferred native style:

- Single quotes are for character literals: `'A'`.
- Double quotes are for strings: `"Hello"`.
- `.db` accepts double-quoted strings and single-quoted one-character expressions.
- `.cstr`, `.pstr` and `.istr` accept double-quoted strings.

Implementation task:

Decide whether to enforce the preferred style or only document it. If enforcing, decide whether multi-character single-quoted `.db` strings become warnings, errors or compatibility-only.

Acceptance criteria:

- Tests cover expression context, `.db`, `.cstr`, `.pstr` and `.istr`.
- Diagnostics guide users toward single quotes for characters and double quotes for strings if stricter behaviour is adopted.

### P2.3 Make alias matching case-sensitive

Problem:

Alias matching is currently described as case-insensitive. That may be too tolerant for native AZM and makes compatibility behaviour less visible.

Goal:

Alias profiles should match explicit forms. If `DB`, `db` and `Db` are all intended, they should be listed explicitly rather than accepted through a broad case-insensitive match.

Implementation direction:

- Make directive alias matching case-sensitive, or add a strict mode that does this.
- Update built-in alias profiles to list accepted forms explicitly.
- Keep canonical native directives lowercase and dotted.

Acceptance criteria:

- Tests prove alias matching respects case under the chosen policy.
- Built-in aliases still cover intended legacy forms.
- Mixed-case accidental aliases are rejected unless explicitly declared.

### P2.4 Case-style flag review

Problem:

`--case-style` currently checks mnemonics, op invocation heads and register tokens. It does not lint labels or constants. It emits warnings and does not fail the build.

Question:

Is this feature useful enough to keep, or does it distract from the more important rule that user-defined symbols are case-sensitive?

Task:

- Review current `--case-style` behaviour and tests.
- Decide whether it remains a CLI lint feature, moves to a less prominent reference status or is deprecated.
- If kept, ensure documentation says exactly what it checks and does not check.

Acceptance criteria:

- Behaviour is tested for `upper`, `lower`, `consistent` and `off`.
- Documentation can describe it without implying it checks labels or constants.

## P3 — Future Directions, Do Not Implement Yet

These items may be good ideas, but they need design work before implementation. Do not start coding them without a separate design brief.

### P3.1 `.import` with public `@` entry symbols

Idea:

Add a new `.import` directive distinct from `.include`.

Proposed distinction:

- `.include` remains textual inclusion. All labels merge into one global translation unit.
- `.import` treats another file as a module-like dependency.
- Only public symbols are exposed.
- `@` entry labels may become public routine symbols.
- Plain labels inside imported files become private.

Reason:

This would turn `@` entries into something closer to a public API and reduce pressure for globally unique internal labels.

Open questions:

- Does `.import` assemble and merge bytes, or import only symbols/contracts?
- How are origins coordinated?
- Are public data symbols allowed?
- How do register-care contracts flow?
- How do `.asmi` files relate?
- How are circular imports handled?

Status:

Major future feature. Do not implement without a dedicated design phase.

### P3.2 Op value-pattern overloads

Idea:

Allow op overloads to match compile-time numeric values, especially a terminating `0` case for recursive expansion.

Example:

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

Open questions:

- Exact numeric match syntax.
- "non-zero" or general numeric constraints.
- Arithmetic on op parameters.
- Recursion depth limits.
- Whether this should instead be a small compile-time conditional system.

Status:

Do not implement yet.

### P3.3 `LSW` / `MSW`

Idea:

Add least-significant-word and most-significant-word functions analogous to `LSB` and `MSB`.

```asm
LSW(expr)
MSW(expr)
```

Open questions:

- Whether AZM's numeric model makes 32-bit word extraction useful enough.
- Whether they mask to 16 bits.
- Whether the names are clear in a Z80 context.

Status:

Potential small feature, but still a design question. Do not implement until the expression numeric model and use cases are clear.

## Suggested Delivery Order

1. Design and implement the name-left declaration grammar, including `Name .type = TypeExpr`.
2. Implement named type aliases for array type expressions.
3. Deprecate `addr` / `.addr` and update tests.
4. Reject `NAME: .equ value` in native syntax, or fence it behind compatibility mode.
5. Audit listing output and decide deprecation/removal behaviour.
6. Run the colon consistency audit.
7. Decide quote syntax policy.
8. Make alias matching case-sensitive if compatibility impact is acceptable.
9. Review `--case-style`.
10. Leave P3 features for separate design briefs.

## Notes For The Coding Agent

- Keep compatibility behaviour explicit. If old syntax remains accepted, it should be clear whether that is native syntax or compatibility syntax.
- Prefer parser errors or warnings that guide users toward the native form.
- Do not implement speculative future features during P1/P2 work.
- Any implementation change that affects Book 4 should include a short note describing how the manual should change.
