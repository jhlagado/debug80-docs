---
layout: default
title: "Machine Services and Assembly"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 13
---

# Machine Services and Assembly

Chapter 12's portable services cover text, and only text. A program that
must format a number, read a joystick, program a sound chip or poke a
video controller has left the portable contract — and that is not a
failure but a boundary. Lanternfly crosses it with typed interfaces, and
Chapter 11's modules are exactly the right container:

```lanternfly
// report.lafy
import "standard/text-output.lafy"
import "readings.lafy"
import "console.lafy"

sub showChange()
    writeText("CHANGE ")
    writeUnsigned(change)
    writeNewline()
end

sub main()
    measureChange()
    showChange()
    waitForKey()
end
```

One routine, three kinds of call. `writeText` and `writeNewline` are
portable standard services from Chapter 12. `writeUnsigned` is a *custom
platform service*: numeric formatting is outside the standard text
modules, so this target's console module supplies it. `measureChange` is
ordinary Lanternfly from an ordinary module. Every call is checked against
a typed declaration; only the middle one is this platform's own.

## Operations, standard services and platform services

Three tiers now share the page, and telling them apart is the chapter's
first job. *Language operations* — `abs`, `length`, `clear`, `append` and
their kin — belong to the language: they mean the same everywhere, and
each backend chooses instructions or a runtime helper. *Standard services*
(Chapter 12's five) have one portable meaning but optional,
target-supplied implementations, reached through explicit imports. A
*platform service* such as `writeUnsigned` is someone's routine on a
particular machine, reached through a declaration the platform module
wrote. The language defines what `abs` means; the standard modules define
what `writeText` means; a target profile and its modules define what
`writeUnsigned` does.

## External routines

`extern sub` gives machine or host code a checked Lanternfly signature:

```lanternfly
export extern sub writeUnsigned(value as u16)
```

Calls receive the same type checking as Lanternfly-defined routines. The
target profile also describes argument carriers, result carriers, clobbered
machine state, visible storage effects and device I/O.

An external routine may name its machine binding:

```lanternfly
extern sub printCharacter(ch as u8) at $0008
extern sub waitForKey() from "ROM_WAIT_KEY"
```

`at` supplies an absolute entry address. `from` names a symbol that the
assembler or substrate toolchain will resolve. With neither form, the
target profile binds the Lanternfly name.

An interface module collects such declarations and exports them, exactly as
`counters.lafy` exported ordinary routines. This separates a program's
logic from a computer's firmware details: two platform modules can export
the same service signatures and bind them to different machines, and every
program module imports the signatures alone. The standard text modules are
the same pattern with the toolchain as author — which is why they were
never keywords, just imports.

## Near and far storage

Interfaces are also where storage location starts to matter. Every static
storage root has a target storage class. Ordinary compiler-allocated
storage is *near*: directly usable in the target's current address context.
A banked or segmented target also offers *far* storage, which carries extra
context such as a bank number alongside a 16-bit offset. A flat-memory
target may treat the two classes identically while preserving their source
meaning.

Inside one module the class is the profile's concern. At an exported
interface it becomes part of the contract, stated before the parameter's
name:

```lanternfly
export sub clearSharedBlock(near block as u8[8])
    var index as i16

    for index = 0 until count(block)
        block[index] = 0
    end
end
```

The leading `near` fixes the storage class that every importing module and
the target calling convention are checked against. It qualifies the
aggregate itself; an element type carries its own spelling, so an array of
near opaque addresses held in far storage is written
`far handles as near address[8]`.

## Opaque addresses

Some machine interfaces expose a location whose contents have no Lanternfly
type:

```lanternfly
var deviceBuffer as far address
```

`near address` and `far address` are opaque scalar values with a precise
contract. A program can store one, pass it and compare it with another of
the same address class — a service result can be kept in a record today and
handed back to a service tomorrow. What Lanternfly source can never do is
look inside: there is no dereference, no address arithmetic, and no
conversion connecting an opaque address to ordinary storage in either
direction. Only the receiving target routine interprets the value.

Opaque addresses are the language's acknowledgement that video memory,
device registers and firmware structures exist — held safely, spent only at
the boundary that understands them.

## Inline assembly

Typed services are the preferred boundary for reusable platform operations.
An `asm` block supplies target instructions for work that needs direct
access to the selected assembler:

```lanternfly
sub waitForKeyDirectly()
    asm
        call ROM_WAIT_KEY
    end
end
```

After `asm`, every physical line belongs to the assembler until a line
containing only `end` closes the block. Lanternfly does not interpret
comments, quotes or instruction syntax inside it. An assembly-source
backend places the lines unchanged into the generated source, and
assembler diagnostics map back to the original inline lines.

Arbitrary assembly may read memory, change registers, call routines or
perform device I/O, so the compiler treats a statement-level `asm` block as
a conservative barrier: values needed afterward must be preserved, and
visible mutable storage may have changed. Control from the block must reach
the generated statement that follows it. Large amounts of low-level work
are easier to describe as an external routine with a checked interface;
inline blocks suit short, local instruction sequences.

## Module-level assembly

An `asm` block among module declarations can provide assembler definitions,
data or routines:

```lanternfly
asm
ROM_WAIT_KEY = $0038
end
```

This block defines the symbol used by an external binding or statement
block. It has no Lanternfly execution point of its own; a routine
implemented there is exposed through an `extern sub` contract. Inline
assembly makes the containing module target-specific, which is one more
reason platform work belongs in interface modules while ordinary program
modules import their exported signatures.

## Generated artifacts

A source-generating backend records the information needed to inspect the
translation: the generated assembly, the mappings from Lanternfly lines to
generated ranges and machine addresses, typed symbols and exact layouts,
the selected helpers, the external bindings and their adapters, and the
runtime fault sites. You can inspect the instructions behind a loop, find
the address of a record, see why a helper was linked or locate the
generated code for a source statement.

The mapping is verified when the toolchain composes the final program: a
map that cannot be validated against the assembled output is an error, so
the map you inspect is either checked or absent, never a guess.

## Example

This chapter's companion program spans three files:
[report.lafy](/lanternfly-book/book1/code/13-report.txt) composes the
program from the standard text output, the measurement model and the
platform console;
[readings.lafy](/lanternfly-book/book1/code/13-readings.txt) is an
ordinary module exporting that model; and
[console.lafy](/lanternfly-book/book1/code/13-console.txt) is a platform
interface module whose module assembly defines the firmware symbol its
external binding names. The change traces to 230 and prints as
`CHANGE 230` — the label through a standard service, the number through
this platform's own.

## Chapter summary

- Language operations mean the same everywhere; standard services add
  portable, optional contracts; platform services are one machine's own
  routines behind typed `extern sub` declarations.
- Interface modules export service signatures; `at` and `from` name
  machine bindings, and programs import signatures, never addresses.
- Storage classes and opaque addresses carry target facts — where storage
  lives, and locations only the target can interpret — under source rules
  that keep them from becoming pointers.
- `asm` admits target assembly at an explicit boundary and forms a
  conservative compiler barrier.
- Generated artifacts connect source to machine, and their source map is
  validated or absent, never guessed.

You can now read a Lanternfly program from its first declaration to its
final `end`, account for its storage byte by byte, and connect any source
statement to generated assembly, an address and an execution trace. The
[language reference](../book2/) holds the exact rules whenever you need
them — and when the first compiler arrives, the programs you have traced
in these chapters will be among the first it runs.
