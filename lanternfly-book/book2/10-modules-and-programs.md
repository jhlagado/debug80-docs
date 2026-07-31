---
layout: default
title: "Modules, Programs and Hosted Bodies"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 10
---

# Modules, Programs and Hosted Bodies

An ordinary Lanternfly source file is a module. Each module keeps its
declarations private unless they are deliberately exported. Together, the
modules contribute their types, storage and routines to one whole-program
build.

## Imports

`import` brings another source unit into the program:

```lanternfly
import "actors.lf"
```

An import:

- resolves relative to the importing file and configured search paths;
- loads a canonical resolved source unit once;
- keeps the unit's private declarations;
- exposes only explicit exports;
- contributes code and data to the same program;
- may be repeated without duplicating the module.

Lanternfly has no textual `include`. Import cycles are rejected with their
path. Imports do not re-export another module's declarations.

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

Exporting an enum exports all of its members. The importer receives the enum
in its type scope and those unqualified member names in its value scope.

Exports enter the importer without qualification. A same-namespace
case-insensitive collision is a compile error. Module aliases and explicit
re-exports are deferred.

## Whole-program compilation

The compiler:

1. loads the root module;
2. resolves the import graph;
3. collects declarations and exports;
4. type-checks the complete program;
5. allocates static storage;
6. resolves external bindings and adapters;
7. lowers routines, data and runtime helpers;
8. emits one target program and its debug artifacts.

Because each resolved module has one canonical identity, even a diamond-shaped
import graph emits it only once.

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
