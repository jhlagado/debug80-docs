---
layout: default
title: "Modules, Programs and Hosted Bodies"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 10
---

# Modules, Programs and Hosted Bodies

Chapter 1 defines source modules and imports. This chapter completes the module
model with exports, whole-program compilation, startup order and program entry.

## Exports

Top-level declarations are private by default:

```lanternfly
export const actorCount as u8 = 8

export record Actor
    x as i16
    y as i16
end

export var actors as Actor[actorCount]

export sub updateActors()
end
```

An exported declaration cannot expose a private user-defined type. The check
reaches through arrays and record fields and applies to constants, variables,
parameters and results.

Exporting a record exports its complete field layout. Every aggregate
parameter in an exported routine must state `near` or `far`; the compiler
checks every importing call against that storage class.

Exporting an enum exports all of its members. The importer receives the enum
in its type scope and those unqualified member names in its value scope.

Exports enter the importer without qualification. A same-namespace
case-insensitive collision is a compile error. Module aliases and explicit
re-exports are deferred.

Imported exports enter the importing module's type and value scopes before its
local declarations are checked. They participate in the ordinary collision and
shadowing rules.

## Standard text modules

The first edition defines two optional standard modules. A program imports
only the part it uses:

```lanternfly
import "standard/text-output.lafy"
import "standard/text-input.lafy"
```

There is no implicit prelude. Without an import, the standard operation names
are not visible. The `standard/` prefix belongs to the toolchain and cannot be
shadowed by a project file of the same path.

The output module exports three operations:

```lanternfly
writeCharacter('A')
writeText("READY")
writeNewline()
```

`writeCharacter` accepts a value assignable to `u8`. `writeText` accepts a
string literal or any `string[N]` storage path, reads its payload once in
order, and does not modify the string. Constant and mutable strings of any
capacity are valid. `writeNewline` transfers the target's appropriate line
break; source does not assume a particular byte sequence.

The input module exports two operations:

```lanternfly
var command as string[32]

sub readOne() as u8
    return readCharacter()
end

sub readCommand() as boolean
    return readLine(command)
end
```

`readCharacter` waits until the selected input device supplies one character
byte and returns it as `u8`.

`readLine` accepts any writable `string[N]` path, waits for one line and
consumes its line ending without storing it. It replaces the destination and
returns `true` when the complete line fits. An empty line produces an empty
string. If a zero byte arrives or the line exceeds the destination capacity,
the operation retains the longest valid fitting prefix, consumes and discards
the rest through the line ending, and returns `false`. The next input operation
therefore begins with a new line, and an implementation needs no unbounded
scratch buffer.

The portable contract does not define local echo or interactive editing. A
target device may perform either before supplying the resulting line. The
first-edition interface has no nonblocking form or end-of-file result.

These modules define portable character and text transfer, not an operating
system interface. They introduce no streams, handles, buffering, redirection,
files, directories or seeking. File loading and saving can later occupy
separate modules without changing the meaning of standard text input and
output.

## Whole-program compilation

The compiler:

1. loads the root module;
2. resolves each module's import prefix depth first;
3. checks declarations in source order, making each completed declaration
   visible to those that follow;
4. resolves external bindings and adapters;
5. lowers the required routines, data and runtime helpers;
6. builds and validates the placement plan;
7. emits one target program and validates its final memory map and debug
   artifacts.

The rule fixes which programs are accepted while leaving compiler architecture
open. A desktop compiler may retain syntax trees and typed intermediate forms.
A small self-hosted compiler may process a source unit once and leave branch
and address fixups to its backend. Both must accept the same
declaration-ordered programs.

## Startup order

When initialization has observable effects, their order is deterministic:

1. Start at the root module.
2. Visit imports depth first in source order.
3. Process each resolved module once.
4. Install a module after its imports.
5. Within the module, process runtime writes and copies in declaration order.

Preloaded image bytes appear in the startup-effect artifact under the same
logical ordering. Chapter 6 defines the corresponding traversal order inside
each aggregate.

## Program entry

For an executable build, the manifest names the root module and one entry
subroutine:

```lanternfly
sub main()
    initialiseGame()
    gameLoop()
end
```

The entry must:

- have no parameters;
- have no result;
- be source-defined rather than external;
- be unique in the executable manifest.

It may remain private to the root module. Static storage is allocated and
static initializers are installed before entry. Returning from entry invokes
the target profile's normal termination service.

A library build has no entry.

## Hosted bodies

A hosted body lets another system provide the surrounding program context.
The host manifest supplies that context, while the body itself contains local
declarations followed by statements:

```lanternfly
var nextX as i16 = playerX + velocityX

if nextX < screenWidth then
    playerX = nextX
end
```

It cannot contain imports, exports, module storage, type declarations or
subroutine declarations.

The host manifest supplies:

- typed constants;
- typed storage;
- enum, subrange, string, record and array definitions with their ordinary
  domains and exact layouts;
- routine signatures and effects;
- the body epilogue;
- source identity and target-profile context.

Manifest names follow the ordinary module namespace and collision rules.
Hosted locals follow the scope and initialization rules for routine locals,
and cannot shadow a manifest value.

## Host constants and types

An eligible scalar host constant can appear in hosted constant-expression
contexts, including case values, range endpoints and counted-loop steps.
Provider-bound opaque addresses are runtime values and cannot appear there;
immutable aggregate constants follow their ordinary initializer and layout
rules instead. Manifest enums, subranges, records and ordinal arrays use the
ordinary nominal typing, domain and exact-layout rules.

Lanternfly has no `resource` declaration. A host maps each resource to an
existing language category: constant, opaque address, storage object or
routine.

## Hosted invocation and return

Each host entry creates fresh scalar locals and runs their initializers. A
backend may use static scratch only when the host contract guarantees that
entries cannot overlap, re-enter or be interrupted by another entry using the
same scratch.

Normal completion reaches the host epilogue. Bare `return` reaches that same
epilogue early; it must not become a machine return. A hosted body cannot
return a value.

## Host output

The compiler returns a summary of:

- imported storage reads and writes;
- routines called and native effects;
- early-return paths;
- runtime helpers;
- static scratch or local-frame allocation;
- estimated cost;
- source mappings.

A host can compare that summary with explicit dependency declarations or use
it to derive change tracking.
