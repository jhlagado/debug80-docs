---
layout: default
title: "Modules, Programs and Hosted Bodies"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 10
---

# Modules, Programs and Hosted Bodies

An ordinary Lanternfly source file is a module. Modules contribute types,
storage and routines to one whole-program build.

## Imports

`import` loads another source unit:

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
    var x as i16
    var y as i16
end

export var actors as Actor[actorCount]

export sub updateActors()
end
```

An exported declaration cannot expose a private user-defined type. The check
reaches through arrays and record fields and applies to constants, variables,
parameters and results.

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

Canonical module identity prevents duplicate emission through a diamond import
graph.

## Program entry

A build manifest names the root module and one entry subroutine for an
executable build:

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

A hosted body is supplied through a host manifest. Its source contains local
declarations followed by statements:

```lanternfly
var nextX as i16 = playerX + velocityX

if nextX < screenWidth then
    playerX = nextX
end
```

It cannot contain imports, exports, module storage, record declarations or
subroutine declarations.

The host manifest supplies:

- typed constants;
- typed storage;
- record definitions;
- routine signatures and effects;
- the body epilogue;
- source identity and target-profile context.

Manifest names follow the ordinary module namespace and collision rules.
Hosted locals follow routine local scope and initialization rules. A hosted
local cannot shadow a manifest value.

## Host constants and records

A typed host constant can appear in every hosted constant-expression context,
including case values, range endpoints and counted-loop steps. Manifest
records use ordinary nominal typing and exact layout.

Lanternfly has no `resource` declaration. A host maps each resource to an
existing language category: constant, opaque address, storage object or
routine.

## Hosted invocation and return

Each host entry creates fresh scalar locals and runs their initializers. A
backend may use static scratch only when the host contract guarantees that
entries cannot overlap, re-enter or be interrupted by another entry using the
same scratch.

Normal completion reaches the host epilogue. Bare `return` reaches the same
epilogue early and must not become a machine return. A hosted body cannot
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

