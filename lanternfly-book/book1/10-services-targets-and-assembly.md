---
layout: default
title: "Services, Targets and Assembly"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 10
---

# Services, Targets and Assembly

Nine chapters of arithmetic, decisions, loops and layouts, and not one
pixel has reached a screen. That is not an oversight; it is a boundary,
and this final chapter is about crossing it well. Everything the book has
taught so far keeps one meaning across targets — `lives - 1` computes the
same value on a Z80, under a C backend, anywhere. Drawing a pixel or reading a
key depends on target hardware and therefore has no target-independent
definition. Lanternfly crosses this boundary through two layers: typed
services and inline assembly.
Generated artifacts will expose lowering, helper selection and conservative
native-boundary assumptions, with timing information where a target profile
supplies it.

```lanternfly
sub showPlayer()
    screenClear()
    drawPixel(playerX, playerY, playerColour)
end
```

The calls use ordinary subroutine syntax — from the caller's side, a
platform service looks exactly like Chapter 9. A target interface supplies
their parameter types, results and observable effects, and the rest of
this chapter is about where that interface comes from.

## Standard operations

Before platform services come core operations with target-independent
meaning:

```lanternfly
distance = abs(targetX - playerX)
root = sqrt(area)
actorBytes = size(type Actor)
rowCount = count(board, 0)
timerOffset = offset(Actor.timer)
clear(board)
fill(framebuffer, backgroundColour)
```

`abs` returns an unsigned magnitude with the operand's width. `sqrt` returns
the floor of a non-negative integer square root, also in the unsigned integer
type with the operand's width. A negative constant operand is a compile error;
a negative runtime operand invokes the arithmetic-fault service.
The layout queries `size`, `count` and `offset` fold at compile time, as
Chapters 6 and 7 showed. `clear` writes the all-zero representation to a
record or array that permits it, and `fill` writes one scalar value to
every element of an array.

The implementation differs by target. A Z80 backend may call a helper routine
for square root, 32-bit multiplication or division because the processor has
no instructions for those complete operations. A C backend may emit a native
operator or a library call.
Aggregate procedures may become an inline loop or a memory helper. The
required helpers are emitted or linked only when selected operations need
them, and the generated artifact report names each one.

## Platform services

Input, display, sound, random values, firmware and device access arrive
through typed external routines. A platform interface module can declare
and export them without supplying Lanternfly bodies:

```lanternfly
export extern sub screenClear()
export extern sub drawPixel(x as u8, y as u8, colour as u8)
export extern sub showNumber(number as u16)
```

`extern` says the body lives elsewhere — in ROM, hand-written assembly, a C
library, a BASIC runtime or another substrate. Calls are checked against the
declared parameter and result types, so
`drawPixel(playerX, playerY, playerColour)` is checked like any other call.
The target profile must either verify that declaration against the native
calling convention or generate a valid adapter. A wrong hand-written
declaration can still misdescribe the firmware; the type check protects the
Lanternfly side of the boundary, not an inaccurate interface.

`import` asks the whole-program compiler to resolve a source module:

```lanternfly
import "display.lf"
```

The `.lf` suffix is illustrative; the source-file extension remains
undecided.

Private declarations remain inside their module; exported names become
visible to the importer. The rule also applies to ordinary source modules.
For example, `gameRules.lf` may publish a type, constant, variable and
subroutine while retaining private implementation state:

```lanternfly
export const startingLives as u8 = 3

export record Score
    var points as u16
end

export var score as Score

const scoreStep as u16 = 10

export sub addPoint()
    score.points = score.points + scoreStep
end
```

Another file imports that interface:

```lanternfly
import "gameRules.lf"

var lives as u8 = startingLives

sub collectToken()
    addPoint()
end
```

Repeated imports resolve and emit the module once. `startingLives`, `Score`,
`score` and `addPoint` are visible to the importer; `scoreStep` remains
private.

When two target modules export the same service contract and both targets
support the language features used by the game, the game logic can compile
against either interface. Address classes, memory limits, unsupported
operations or target-specific assumptions may still require changes; the
module boundary identifies where those differences enter.

An external routine can name its target binding directly:

```lanternfly
extern sub printChar(ch as u8) at $0008
extern sub waitForKey() from "ROM_WAIT_KEY"
```

`at` supplies an absolute routine address, such as an entry point documented
by a target's ROM interface. `from` supplies a substrate symbol by name. With
neither clause,
the target profile binds the Lanternfly name itself. The profile also
defines the argument and result carriers — which registers or cells carry
each value — along with clobbers, visible effects and cost. A missing or
incompatible binding is a compile error.

## Inline assembly

Typed services cover platform operations declared in interface modules. An
`asm` block supplies target instructions that fall outside those declarations
or cannot be expressed through generated Lanternfly operations:

```lanternfly
sub waitForKey()
    asm
        call ROM_WAIT_KEY
    end
end
```

`asm` switches the lexer into raw assembly mode, and the switch is total:
the next physical line whose trimmed content compares case-insensitively equal
to `end` returns to Lanternfly. Every line in between belongs to the assembler,
including its comment syntax. Lanternfly does not reinterpret quotes,
semicolons or assembler-specific tokens inside the block.

An assembly-source backend emits the payload verbatim at that position:

```text
Lanternfly source
    -> generated assembly with inline blocks
    -> selected assembler
    -> machine program
```

Your instructions travel unaltered into the same stream the compiler is
writing, and assembler diagnostics retain the original inline source
lines, so an error in your hand-written code points home to the line you
wrote.

## The assembly barrier

The compiler cannot infer register use or memory effects from arbitrary
target assembly, so a statement-level `asm` block
forms a conservative barrier. The compiler assumes the block can read and
write every visible mutable object, call target routines, fault, perform
device I/O and clobber processor registers and flags.

Before the block, the backend preserves generated values that remain live
after it. Reducing barrier crossings can therefore reduce spills when much
state is live. Control from the assembly must reach the generated successor
statement; a direct return or jump around Lanternfly control flow violates the
contract and may bypass a hosted-body epilogue.

Raw names inside the block are assembler names, not Lanternfly names. The
backend's symbol artifact shows which generated Lanternfly names are
available to inline source, so the crossing is made with the map open
rather than by guessing at name-mangling.

## Module-level assembly

An `asm` block can also appear among module declarations:

```lanternfly
asm
ROM_WAIT_KEY = $0038
end
```

This form can provide target directives, labels, routines or data — here,
giving the assembler a name for a ROM address, the definition
the earlier `from "ROM_WAIT_KEY"` binding relies on. A routine label defined
inside the raw block can be bound through `extern sub`. Other raw symbols,
including data labels, remain assembly-only in the working 0.3 language.

Inline assembly commits that source file to a compatible assembly target. A
C or BASIC backend
rejects the block unless its profile supplies an assembly-fragment
pipeline. Keeping `asm` in per-target interface modules isolates it when each
module exports the same service contract and the game uses features supported
by every selected backend.

## Generated artifacts

A source-generating backend records:

- canonical generated assembly, C or BASIC;
- mappings from Lanternfly source to generated ranges and, where available,
  from generated code to machine addresses;
- typed symbols and exact layouts;
- selected helpers and imports;
- external bindings and generated ABI adapters;
- read, write, call, fault and device-I/O summaries;
- startup-initialization effects;
- module-assembly provenance and statement-assembly conservative effects;
- target assumptions and an optional cost report, including timing estimates
  where the profile supplies them.

For an assembly backend, the assembler adds machine-code addresses and its
own diagnostics to those mappings. The artifacts let a programmer count the
instructions behind an `if`, inspect a 32-bit helper or see how an aggregate
copy was lowered.

## Example

The [chapter listing](/lanternfly-book/book1/code/10-services.txt) uses
standard operations, declares display services and contains one inline
assembly block. Together, the chapters have built a boundary: portable logic
uses exact integer and layout rules, typed services describe what a target
provides, and native code can be kept in target-facing modules. The
[working specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
records the current normative 0.3 rules. When compiler backends are available,
their generated artifacts will show how each target implements those rules.
