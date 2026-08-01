---
layout: default
title: "Modules and Imports"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 11
---

# Modules and Imports

Every program so far has fitted in one source file. Real programs outgrow
that, and the growth has a shape: a measurement model here, its display
there, the program that composes them somewhere else. Lanternfly's unit of
growth is the module, one `.lafy` source file of imports and declarations,
and the reading order we have kept since Chapter 1 stretches across the
boundary: everything a declaration uses is either imported above it or
declared above it.

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
The file contains imports and declarations; loose executable statements
have no legal place in it, which is why statements have lived inside
routines since Chapter 1.

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

Imports stand together at the top of a module, before any declaration, and
each one's exports are visible from that point on. Everything `recordItem`
uses is therefore above it, with the imported routine arriving through the
import line.

Private by default is the useful direction. A module's exports are its
promise to other modules; everything unexported can be reorganised freely,
because no other file can have grown to depend on it. Chapter 13 builds its
platform boundary on exactly this mechanism.

## The standard modules

Some modules ship with the toolchain rather than with the project, and they
come in two kinds. A *service module* exports names that a target must
support — the first edition defines two, and a program imports them like
any others:

```lanternfly
import "standard/text-output.lafy"
import "standard/text-input.lafy"
```

A *capability module* is the other kind, and chapters 2 and 7 have already
shown the two current capability modules. `import "standard/wide32.lafy"`
legalizes the 32-bit integer types, and
`import "standard/long-strings.lafy"` legalizes string capacities above 254.
A capability import exports no names at all: it
legalizes an optional facility for the module that states it, and only for
that module — importing a neighbour that uses `u32` does not
license your own source to mention it. Everything else about these imports
is ordinary: they sit in the same contiguous prefix and obey the same
`standard/` rules below.

Nothing is imported implicitly — Lanternfly has no prelude, so a module
that imports nothing receives no imported names at all. The
`standard/` path belongs to the toolchain: a project cannot place its own
files there or shadow those names with its own modules. Once imported,
standard exports enter the same unqualified value scope as any other
import, under the same contiguous-prefix rule, and a program imports only
the standard modules it actually uses. The next chapter puts both of these
to work.

## The root program

A build manifest names one root module and, for an executable program, one
entry subroutine with no parameters and no result. The compiler follows
each import to its module and finishes resolving that module — including
its own imports — before checking the module that imported it, and it
processes each module once however many times it is imported. (The
toolchain's name for this order is _depth first_.) It then checks
declarations in source order, allocates static storage, resolves machine
bindings and emits one target program.

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

Two calls arrive in `main`, each reaches `incrementProcessed` through the
import, and `processed.value` finishes at 2 — storage declared in one file,
counted from another, with every access checked against the exported
types.

## Example

This chapter's companion program spans two files:
[counters.lafy](/lanternfly-book/book1/code/11-counters.txt) declares the
counter model and exports its interface, and
[tally.lafy](/lanternfly-book/book1/code/11-tally.txt) imports it and
drives it from `main`. The listings use `.txt` filenames for browser
display; each represents a `.lafy` source module.

## Chapter summary

- A module is one `.lafy` file of imports and declarations; statements
  live inside its routines.
- Declarations are private by default; `export` publishes a chosen
  interface, and unexported names stay free to change.
- Imports form a contiguous prefix, their exports visible from the point
  of import — reading order holds across files.
- A build manifest names the root module and entry; the compiler finishes
  each imported module before its importer and processes every module
  once.
- Standard modules are imported explicitly like any others: two service
  modules export the text operations, and two capability modules legalize
  the wide integer types and long strings; the `standard/` namespace
  belongs to the toolchain, and no prelude exists.

Modules let one program keep its concerns in separate files. In the next
chapter we import the two text service modules, and after eleven chapters of
results left quietly in storage, our programs read and write their first
lines.
