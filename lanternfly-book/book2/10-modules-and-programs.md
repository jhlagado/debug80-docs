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

## Capability imports

The `standard/` prefix carries two kinds of module. A capability module is
an export-free language gate: importing it legalizes an optional facility
and contributes no names. `standard/wide32.lafy` enables `u32` and `i32`,
and `standard/long-strings.lafy` enables string capacities above 254;
future floating-point tiers follow the same form. A service module, such as
the text modules below, exports ordinary names and binds services through
the target profile.

Capability authorization is module-local. Every module that mentions a
gated type, representation or operation states the enabling import in its
own prefix; importing a user module confers none of the capabilities that
module uses.
A capability's ID is its canonical import path, and a compiled
export-interface artifact lists the capability IDs its exports require in
its `requiredCapabilities` field. A gated mention without the import is
`E-CAP-001`. An enabled capability whose target requirements —
representation widths, limits, scalar operations or component bindings —
are unsatisfied is `E-TARGET-001`.

Capability imports are monotone: an import can make more programs legal but
can never change the meaning of a program that was already legal. Operators
are typed families resolved statically, so a capability type extends an
operator's domain without altering any existing operation.

## Standard service modules

The first edition defines three optional standard service modules, importable
independently; only used operations select emitted components:

```lanternfly
import "standard/text-output.lafy"
import "standard/text-input.lafy"
import "standard/program-arguments.lafy"
```

There is no implicit prelude. A service name is visible only after its module
has been imported. Kernel operations such as `abs`, `sqrt` and `clear` require
no import. The `standard/` prefix belongs to the toolchain and cannot be
shadowed by a project file of the same path.

### Text input and output

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

### Program arguments

`standard/program-arguments.lafy` exports two launcher-input operations:

```lanternfly
var argument as string[64]
var count as u8 = 0
var fits as boolean = false

sub readFirstArgument()
    count = argumentCount()
    if count > 0 then
        fits = readArgument(0, argument)
    end
end
```

`argumentCount()` returns the number of user arguments as `u8`, from zero
through 255. The launcher supplies the list before entry; the invocation name
is separate and does not occupy index zero.

`readArgument(index, destination)` evaluates both operands once. The index is
assignable to `u8`, and the destination is any writable `string[N]` path. A
valid argument that fits replaces the destination and returns `true`. An
invalid index clears the destination and returns `false`. An argument that
contains a zero byte or exceeds the destination capacity stores the longest
valid prefix that fits and returns `false`. Repeated reads of one valid index
produce the same payload during the invocation.

The launcher supplies already-separated byte strings. A shell, monitor,
firmware launcher, emulator or test runner defines how its own input becomes
that ordered list. The program declares every destination buffer, so argument
access requires no pointer array or hidden allocation.

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

The rule fixes which programs are accepted while leaving compiler
architecture open. A compiler may retain syntax trees and typed
intermediate forms, or process each source unit once and resolve branch
and address fixups by backpatching. Both must accept the same
declaration-ordered programs.

A program is composed during whole-program compilation; no relocating
link editor is involved.
Libraries reach a program in three forms. A source import compiles the
library into the whole program in dependency order. A compiled
export-interface artifact restates a module's exported declarations —
symbols, not relocatable code — so an unchanged library need not be re-read
from source. A fixed-address library, such as a ROM library on a banked
system, pairs an export-interface artifact with code that is already
placed: its symbols bind to final addresses and the build emits no code for
it. Relocatable object formats and link-time relocation are outside the
Lanternfly toolchain.

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

For an executable build, the manifest names the root module and may name one
entry subroutine. An omitted entry field selects `main` in the root module:

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
- belong to the root module;
- carry either no `fails` clause or one valid error set
  ([chapter 14](14-error-handling.md)).

The default is a build convention rather than a keyword. An explicit entry
field may select another suitable name, and the selected routine may remain
private. Programs receive launcher arguments through the standard service
above rather than entry parameters.

Static storage is allocated and static initializers are installed before
entry. Bare `return` or reaching `end` reports successful termination. `fail`
from a failable entry reports unsuccessful termination with its error-set
member. The enum remains zero-based and opaque inside Lanternfly. A profile
that exposes a numeric exit status maps success to zero and failed ordinal `n`
to `n + 1`; other profiles preserve the same two outcomes through their native
termination contract.

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
