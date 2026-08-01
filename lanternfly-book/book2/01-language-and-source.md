---
layout: default
title: "Language Model and Source Form"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 1
---

# Language Model and Source Form

Lanternfly 0.4 is a statically typed structured BASIC for fixed-memory
systems. It combines the directness of C or Pascal with a syntax intended to
be read without first decoding a thicket of punctuation. It is a compiled
language: a complete Lanternfly program becomes native or translated target
code rather than running through an interpreter.

A backend may emit AZM or another assembly language directly, or lower
Lanternfly through C, Zig, LLVM IR or another suitable intermediate form. The
route to native code may change, but the meaning of the source program may not.

The first compiler is planned as a desktop-hosted compiler that emits AZM for
Z80 systems. The language itself does not expose Z80 registers, stack-frame
conventions or instruction selection.

## Language boundary

The 0.4 language includes:

- signed and unsigned integers with fixed widths;
- nominal enums and checked subrange types;
- Boolean values, character bytes and fixed-capacity strings;
- constants and statically allocated variables;
- exact records and fixed arrays;
- field access, runtime indexing and temporary aggregate aliases;
- expressions, assignment, conditions and loops;
- routines with scalar locals, parameters and optional scalar results;
- private source modules with explicit exports;
- optional standard modules for portable character and text I/O;
- typed target services and explicit inline assembly.

This inventory reflects one central design choice: storage is explicit and
finite. Persistent identity comes from declared paths and ordinal indices into
fixed pools. Aggregate parameters and local aliases temporarily name existing
counted strings, records or arrays. Their backend carrier may be an address,
but Lanternfly source has no pointer or reference value.

Heap allocation, garbage collection, exceptions, dynamic collections,
closures and indirect calls lie outside the first edition.

## Source files

An ordinary source file is a module containing imports and declarations.
Executable statements belong inside `sub` bodies, so the point at which code
can run is always visible:

```lanternfly
const maximumCount as u8 = 10
var count as u8 = 0

sub main()
    if count < maximumCount then
        count = count + 1
    end
end
```

A build manifest names the root module and the entry subroutine. Every
Lanternfly source module has the exact lowercase `.lafy` extension.

## Imports

`import` adds another source module to the program:

```lanternfly
import "actors.lafy"
```

The double-quoted path is compile-time text. It accepts only `\"` and `\\`,
allocates no runtime string storage, and resolves relative to the importing
file and configured search paths.

Imports form one uninterrupted prefix at the beginning of a module. Once a
declaration or module-level assembly block appears, no later `import` is
valid. This keeps module dependencies visible before the declarations that
use them.

Each resolved source unit has one canonical identity. Repeated imports load it
once, so a diamond-shaped import graph does not duplicate code or data. Import
cycles are errors and include their path.

Only declarations marked `export` become visible to an importer. Chapter 10
defines [exports](10-modules-and-programs.md#exports); private declarations
remain private, and imports do not re-export declarations from another module.
Lanternfly has no textual `include`.

## Source text

Source files use UTF-8. Identifiers are restricted to ASCII letters, digits
and `_` for portable interoperation. An identifier begins with a letter.

A physical newline ends a declaration or statement except inside parentheses
or square brackets. To split an expression anywhere else, enclose it in
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

The parser closes the innermost open block. Indentation does not determine
meaning, although the formatter emits it consistently to show structure.
Bare `end` is provisional pending experience with long nested routines.

## Statement forms

The language has these statement categories:

- assignment;
- a discarded expression, including a routine call;
- `clear`, `fill` and `append`;
- `if` and `select`;
- counted, collection and conditional loops;
- `exit`, `continue` and `return`;
- statement-level `asm`.

Loose executable statements are invalid in an ordinary module.
