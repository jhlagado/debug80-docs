---
layout: default
title: "Language Model and Source Form"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 1
---

# Language Model and Source Form

Lanternfly 0.4 is a statically typed structured BASIC for fixed-memory
systems. It compiles complete programs ahead of time. A backend may emit AZM,
another assembly language, C or a selected BASIC dialect, but every backend
must preserve the same source-language meaning.

The first compiler is planned as a desktop-hosted compiler that emits AZM for
Z80 systems. The language itself does not expose Z80 registers, stack-frame
conventions or instruction selection.

## Language boundary

The 0.4 language includes:

- signed and unsigned integers with fixed widths;
- Boolean values, character bytes and static NUL-terminated text;
- constants and statically allocated variables;
- exact records and fixed arrays;
- field access, runtime indexing and temporary aggregate aliases;
- expressions, assignment, conditions and loops;
- routines with scalar locals, parameters and optional scalar results;
- private source modules with explicit exports;
- typed target services and explicit inline assembly.

Persistent storage identity comes from declared paths and integer indices into
fixed pools. Aggregate parameters and local aliases temporarily name existing
records or arrays. Their backend carrier may be an address, but Lanternfly
source has no pointer or reference value.

Heap allocation, garbage collection, exceptions, dynamic collections,
closures and indirect calls lie outside the first edition.

## Glimmer hosting

Lanternfly is independent of Glimmer. A Glimmer integration can supply typed
storage, constants, records and routines through a host manifest. Glimmer
retains state scheduling, pulses, effects, rendering, cards and platform
resources.

A hosted Lanternfly body contains local declarations followed by statements.
It is a separate compilation-unit form rather than an ordinary module.
[Chapter 10](10-modules-and-programs.md#hosted-bodies) defines its restrictions.

## Source files

An ordinary source file is a module containing imports and declarations.
Executable statements appear inside `sub` bodies:

```lanternfly
const maximumCount as u8 = 10
var count as u8 = 0

sub main()
    if count < maximumCount then
        count = count + 1
    end
end
```

A build manifest names the root module and the entry subroutine. The source
extension remains open in 0.4; `.lf` is illustrative.

## Source text

Source files use UTF-8. Identifiers are restricted to ASCII letters, digits
and `_` for portable interoperation. An identifier begins with a letter.

A physical newline ends a declaration or statement except inside parentheses
or square brackets. Multiline expressions outside those delimiters need
parentheses. End of file supplies a final logical newline when the final
physical line has no line-ending character.

There is one statement per logical line. Lanternfly has no semicolon
separator.

## Comments

`//` begins a line comment outside a string literal and continues through the
physical newline:

```lanternfly
// Advance the frame when the delay reaches zero.
if frameDelay = 0 then
    currentFrame = currentFrame + 1  // Stored as u8.
end
```

Block comments are absent from the first edition.

## Blocks

Every structured block closes with `end`:

```lanternfly
while active
    updateActor()
end
```

The parser closes the innermost open block. Indentation is whitespace, while
the formatter emits canonical indentation. Bare `end` is provisional pending
experience with long nested routines.

## Statement forms

The language has these statement categories:

- assignment;
- a discarded expression, including a routine call;
- `clear` and `fill`;
- `if` and `select`;
- counted, collection and conditional loops;
- `exit`, `continue` and `return`;
- statement-level `asm`.

Loose executable statements are invalid in an ordinary module.

## Implementation stages

K0, K1 and K2 are development milestones within edition 0.4, not smaller
language editions. A development build may reject a later-stage construct
with `D-STAGE-001`. It cannot report that construct as invalid Lanternfly or
claim a conforming 0.4 front end until the full required inventory passes.
