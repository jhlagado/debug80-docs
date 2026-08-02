---
layout: default
title: "Machine Services and Assembly"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 16
---

# Machine Services and Assembly

Chapter 13's portable services cover text, and only text. A program that
must format a number, read a joystick, program a sound chip or poke a
video controller has left the portable contract, and what supplies those
operations is a platform interface module — Chapter 12's export mechanism
carrying one machine's own services:

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
end
```

Three kinds of call share this routine. `writeText` and `writeNewline`
are portable standard services from Chapter 13. `writeUnsigned` is a
_custom platform service_: numeric formatting is outside the standard
text modules, so this target's console module supplies it.
`measureChange` is ordinary Lanternfly from an ordinary module. Every
call is checked against a typed declaration; only the platform's own call
is tied to this machine.

## Operations, standard services and platform services

Three tiers now share the page, and telling them apart is the chapter's
first job. _Language operations_ — `abs`, `length`, `clear`, `append` and
the rest — belong to the language: they mean the same everywhere, and
each backend selects instructions or a runtime helper. _Standard services_
(Chapter 13's five) have one portable meaning but optional,
target-supplied implementations, reached through explicit imports. A
_platform service_ such as `writeUnsigned` is someone's routine on a
particular machine, reached through a declaration in the platform
module. The language defines what `abs` means; the standard modules define
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
extern sub playTone(divider as u16) at $0f06
extern sub waitForVBlank() from "ROM_VBLANK_WAIT"
```

`at` supplies an absolute entry address. `from` names a symbol that the
assembler or substrate toolchain will resolve. With neither form, the
target profile binds the Lanternfly name. The addresses and symbols in
this chapter belong to a small fictional teaching machine — call it the
LF-1 — whose monitor ROM documents these entry points; a real platform
module does exactly the same work from the platform's firmware or ABI
documentation.

An interface module collects such declarations and exports them, exactly as
`counters.lafy` exported ordinary routines. This separates a program's
logic from a computer's firmware details: two platform modules can export
the same service signatures and bind them to different machines, and every
program module imports the signatures alone.

The standard text modules share the import form but not the
authorship. Their interfaces are compiler-defined and versioned, targets
bind their stable service IDs rather than project-chosen symbols, and two
of their operations use carriers no ordinary declaration can spell — so a
project module can imitate the pattern, but cannot recreate or shadow the
standard contract.

## Near and far storage

Interfaces are also where storage location starts to matter. The `near`
and `far` spellings describe how a target reaches an aggregate — nothing
more; they are not a return of source pointers. Every static
storage root has a target storage class. Ordinary compiler-allocated
storage is _near_: directly usable in the target's current address context.
A banked or segmented target also provides _far_ storage, which carries extra
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

Opaque addresses exist because video memory, device registers and
firmware structures do: a program needs a way to hold such locations,
and no portable type could describe their contents.

## Inline assembly

Typed services are the preferred boundary for reusable platform operations.
An `asm` block supplies target instructions for work that needs direct
access to the selected assembler:

```lanternfly
sub waitForVBlankDirectly()
    asm
        call ROM_VBLANK_WAIT
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
ROM_VBLANK_WAIT = $0f09
end
```

This block defines the symbol used by an external binding or statement
block. It has no Lanternfly execution point of its own; a routine
implemented there is exposed through an `extern sub` contract. Inline
assembly makes the containing module target-specific, which is one more
reason platform work belongs in interface modules while ordinary program
modules import their exported signatures.

## Generated artifacts

Reading the translation is a practical activity: inspect the instructions
behind a loop, find the address of a record, see why a helper was included,
trace a runtime fault to its source line. A source-generating backend
records what those actions need — the generated assembly, the mappings
from Lanternfly lines to generated ranges and machine addresses, typed
symbols and exact layouts, the selected helpers, and the external
bindings with their adapters.

The mapping is designed to be verified when the toolchain composes the
final program: a map that cannot be validated against the assembled
output is an error, so an inspected map will be either checked or absent,
never a guess.

## Complete program

This chapter's companion program spans three files:
[report.lafy](/lanternfly-book/book1/code/16-report.txt) composes the
program from the standard text output, the measurement model and the
platform console;
[readings.lafy](/lanternfly-book/book1/code/16-readings.txt) is an
ordinary module exporting that model; and
[console.lafy](/lanternfly-book/book1/code/16-console.txt) is a platform
interface module whose module assembly defines the firmware symbols its
external bindings name. The console module also binds `playTone` at an
absolute address, exports a `near` aggregate parameter and an opaque
`far address`; report.lafy waits for vertical blank through a
statement-level `asm` block, plays a tone and clears a shared block. The
change traces to 230 and prints as `CHANGE 230`: the label through a
standard service, the number through the `writeUnsigned` binding that
console.lafy's module assembly names.

## Exercises

1. `playTone` is bound with `at $0f06` and `waitForVBlank` with
   `from "ROM_VBLANK_WAIT"`. Who resolves each?
2. Why must the compiler treat a statement-level `asm` block as a
   conservative barrier?
3. Which operations does a `far address` value support in source, and
   which are refused?

Answers: `at` needs no resolution beyond the profile's address checks,
while `from` is resolved by the assembler or substrate toolchain from
the named symbol; the block may read or write any visible mutable
object, call routines, fault or perform device I/O, so values needed
afterward must be preserved and no assumption survives the block;
assignment, passing and comparison with the same address class are
supported — dereference, arithmetic and conversion to ordinary storage
have no source form.

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

The [language reference](../book2/) holds the exact rules whenever a
chapter's working account is not enough. What this book leaves in your
hands is a method: reading a program as its storage, tracing it by
pencil, and accounting for the code it asks of the machine. When the
compiler arrives, its verified source maps are designed to let every one
of those traces be checked against the real thing.
