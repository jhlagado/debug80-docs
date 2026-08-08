---
layout: default
title: "Modules and Imports"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 12
---

# Modules and Imports

Every program so far has fitted in one source file. Larger programs
separate their concerns: a measurement model in one file, its display in
another, the program that composes them in a third. Each file is a
module — one `.lafy` source file of imports and declarations — and the
reading order we have kept since Chapter 1 holds across the boundary:
everything a declaration uses is either imported above it or declared
above it.

## A source module

A module gives related types, storage and routines one file. Top-level
declarations are private until marked `export`:

```lanternfly
// counters.lafy
export const counterLimit as u16 = 9999

export record Counter
    value as u16
end

export var processed as Counter

const counterStep as u16 = 1

export sub incrementProcessed()
    if processed.value < counterLimit then
        processed.value = processed.value + counterStep
    end
end
```

A source module's filename ends in the exact lowercase `.lafy` extension.
The file contains imports and declarations; executable statements are
legal only inside routines, as they have been since Chapter 1.

## Imports and exports

Another module imports the exported interface:

```lanternfly
// tally.lafy
import "counters.lafy"

sub recordItem()
    incrementProcessed()
end
```

`Counter`, `counterLimit`, `processed` and `incrementProcessed` become
visible to the importer; `counterStep` remains private. The extension is
part of the import path.

Imports stand together at the top of a module, before any declaration,
and each one's exports are visible from that point on. Everything
`recordItem` uses is therefore either declared above it or exported by an
import above it.

A module's exports are its contract with other modules. Unexported
declarations can be renamed, reordered or removed without touching any
other file, because no other file can name them. In Chapter 16 we build a
platform boundary on this mechanism.

## The standard modules

Some modules ship with the toolchain rather than with the project, and they
come in two kinds. A *service module* exports names that a target must
support. The first edition defines three, imported like any other module:

```lanternfly
import "standard/text-output.lafy"
import "standard/text-input.lafy"
import "standard/program-arguments.lafy"
```

The text modules provide Chapter 13's five portable text operations. The
program-arguments module provides `argumentCount()` and
`readArgument(index, destination)`. A program declares the destination as a
fixed-capacity string, and `readArgument` reports whether the complete argument
fitted.

A *capability module* is the other kind: it exports no names at all,
and instead legalizes an optional facility for the module that states
it, and only for that module. The two current ones appeared in chapters
2 and 8: `import "standard/wide32.lafy"` legalizes the 32-bit integer
types, and `import "standard/long-strings.lafy"` legalizes string
capacities above 254.

Nothing is imported implicitly — Lanternfly has no prelude — and the
`standard/` namespace belongs to the toolchain.
[Book Two, Chapter 10](../book2/10-modules-and-programs.md) states the
remaining standard-module rules.

## The root program

A build manifest names one root module. An executable starts with `main` in
that module unless the manifest names another entry. The selected subroutine
is parameter-free, result-free and source-defined; Chapter 14 permits it to
declare an error set with `fails`.

The compiler follows each import to its module and finishes resolving
that module — including its own imports — before checking the module that
imported it, and it processes each module once however many times it is
imported. (The toolchain's name for this order is _depth first_.) It then
checks declarations in source order, allocates static storage, resolves
machine bindings and emits one target program.

The root module composes the program:

```lanternfly
// tally.lafy
import "counters.lafy"

sub recordItem()
    incrementProcessed()
end

sub main()
    recordItem()
    recordItem()
end
```

`main` makes two calls, each reaches `incrementProcessed` through the
import, and `processed.value` finishes at 2 — storage declared in one file,
counted from another, with every access checked against the exported
types.

## Complete program

The complete program spans two modules. `counters.lafy` declares the counter
model and exports its interface. `tally.lafy` imports it and drives it from
`main`.

### counters.lafy

<<< @/lanternfly-book/book1/code/12-counters.txt{lanternfly}


### tally.lafy

<<< @/lanternfly-book/book1/code/12-tally.txt{lanternfly}

## Exercises

1. `tally.lafy` imports `counters.lafy` and mentions `counterStep`. What
   happens, and why?

Answer: a compile error. `counterStep` is private to `counters.lafy`, and
only exported names become visible to an importer.

## Chapter summary

- A module is one `.lafy` file of imports and declarations; statements
  live inside its routines.
- Declarations are private by default; `export` publishes a chosen
  interface, and unexported names stay free to change.
- Imports form a contiguous prefix, their exports visible from the point
  of import — reading order holds across files.
- A build manifest names the root module and may override the entry name;
  `main` is the default. The compiler finishes each imported module before its
  importer and processes every module once.
- Standard modules are imported explicitly like any others: two service
  modules export the text operations, a third supplies launcher arguments,
  and two capability modules legalize the wide integer types and long strings;
  the `standard/` namespace belongs to the toolchain, and no prelude exists.
