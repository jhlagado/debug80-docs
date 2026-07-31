---
layout: default
title: "Modules, Machine Services and Assembly"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 10
---

# Modules, Machine Services and Assembly

A complete program needs more than calculations. It must obtain input, produce
output, access firmware or communicate with devices. Those operations differ
between computers, so Lanternfly gives them typed interfaces and keeps the
target-specific implementation at a defined boundary.

```lanternfly
extern sub writeNumber(value as i16)
extern sub writeNewLine()

sub showReading(value as i16)
    writeNumber(value)
    writeNewLine()
end
```

From Lanternfly's side, an external service looks like an ordinary call. Its
declaration gives the compiler enough information to check arguments and
results. The selected target profile supplies the machine-level binding.

## Standard operations

Lanternfly defines a small set of target-independent operations:

```lanternfly
change = abs(current - previous)
root = sqrt(area)
dateBytes = size(type Date)
entryCount = count(entries)
qualityOffset = offset(Reading.quality)
clear(workspace)
fill(histogram, 0)
```

`abs` returns an unsigned magnitude. `sqrt` returns the floor of a
non-negative integer square root. Negative runtime input to `sqrt` invokes the
arithmetic-fault service.

`size`, `count` and `offset` are compile-time layout queries. `clear` and
`fill` perform repeated aggregate stores.

The Z80 has no single instruction for many wide arithmetic operations. A
backend may emit an instruction sequence or select a runtime helper for square
root, division, bounds checking or aggregate copying. Helpers are included
only when the program uses the operation, and generated artifacts list them.

## Source modules

A module gives related types, storage and routines one source file. Top-level
declarations are private until marked `export`:

```lanternfly
// counters.lf
export const counterLimit as u16 = 9999

export record Counter
    var value as u16
end

export var processed as Counter

const counterStep as u16 = 1

export sub incrementProcessed()
    if processed.value < counterLimit then
        processed.value = processed.value + counterStep
    end
end
```

Another module imports the exported interface:

```lanternfly
import "counters.lf"

sub recordItem()
    incrementProcessed()
end
```

`Counter`, `counterLimit`, `processed` and `incrementProcessed` become visible
to the importer. `counterStep` remains private. Repeated imports resolve the
same module once during whole-program compilation.

The build manifest names a root module and an entry subroutine. The compiler
loads the import graph, type-checks all modules, allocates static storage,
resolves machine bindings and emits one target program.

## External services

An interface module can publish routines implemented by firmware, assembly or
another substrate:

```lanternfly
export extern sub readByte() as u8
export extern sub writeByte(value as u8)
export extern sub writeNumber(value as i16)
```

Calls receive the same type checking as Lanternfly-defined routines. The
profile also describes argument carriers, result carriers, clobbered machine
state, visible storage effects and device I/O.

An external routine may name its machine binding:

```lanternfly
extern sub printCharacter(ch as u8) at $0008
extern sub waitForKey() from "ROM_WAIT_KEY"
```

`at` supplies an absolute entry address. `from` names a symbol that the
assembler or substrate toolchain will resolve. With neither form, the target
profile binds the Lanternfly name.

This arrangement separates a program's logic from a computer's firmware
details. Two platform modules can export the same service signatures and bind
them to different machines.

## Inline assembly

Typed services are the preferred boundary for reusable platform operations.
An `asm` block supplies target instructions for work that needs direct access
to the selected assembler:

```lanternfly
sub waitForKey()
    asm
        call ROM_WAIT_KEY
    end
end
```

After `asm`, every physical line belongs to the assembler until a line
containing only `end` closes the block. Lanternfly does not interpret comments,
quotes or instruction syntax inside it. An assembly-source backend places the
lines unchanged into the generated source:

```text
Lanternfly module
    → generated assembly plus inline blocks
    → assembler
    → machine code
```

Assembler diagnostics map back to the original inline lines so an invalid
instruction can be reported at its source location.

## The assembly barrier

Arbitrary assembly may read memory, change registers, call routines or perform
device I/O. The compiler treats a statement-level `asm` block as a
conservative barrier. Values needed afterward must be preserved, and visible
mutable storage may have changed.

Control from the block must reach the generated statement that follows it. A
raw return or jump around Lanternfly control flow would bypass routine or host
obligations. Raw symbol names also belong to the assembler; a generated symbol
artifact records which Lanternfly objects are exposed under which assembly
names.

Large amounts of low-level work are easier to describe as an external routine
with a checked interface. Inline blocks suit short, local instruction
sequences where the surrounding Lanternfly control remains clear.

## Module-level assembly

An `asm` block among module declarations can provide assembler definitions,
data or routines:

```lanternfly
asm
ROM_WAIT_KEY = $0038
end
```

This block defines the symbol used by an external binding or statement block.
It has no Lanternfly execution point of its own. A routine implemented there
is exposed through an `extern sub` contract.

Inline assembly makes the containing module target-specific. A platform
project can isolate such blocks in interface modules while ordinary program
modules continue to use the exported Lanternfly signatures.

## Generated artifacts

A source-generating backend records the information needed to inspect the
translation:

- generated assembly or other target source;
- mappings from Lanternfly lines to generated ranges and machine addresses;
- typed symbols, storage addresses and exact layouts;
- selected runtime helpers and imported modules;
- external bindings, calling-convention adapters and native effects;
- initialization work, runtime fault sites and target assumptions;
- optional size and timing estimates when the target profile supplies them.

You can inspect the instructions behind a loop, find the address of a record,
see why a helper was linked or locate the generated code for a source
statement.

## Example

The [chapter listing](/lanternfly-book/book1/code/10-services.txt)
uses standard operations, declares console services and includes one inline
assembly block. The module's `main` routine measures a change and writes the
result through a typed target service.

## Chapter summary

- Modules keep declarations private by default and expose selected names with
  `export`.
- `extern sub` gives machine or host code a checked Lanternfly signature.
- Standard operations keep one source meaning while backends choose
  instructions or runtime helpers.
- `asm` admits target assembly at an explicit boundary and acts as a
  conservative compiler barrier.
- Generated artifacts show how language constructs, storage and services map
  to the target machine.
