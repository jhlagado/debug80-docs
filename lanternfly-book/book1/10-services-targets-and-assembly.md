---
layout: default
title: "Services, Targets and Assembly"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 10
---

# Services, Targets and Assembly

Arithmetic keeps one meaning across targets. Drawing a pixel or reading a key
depends on the platform. Typed services and inline assembly connect portable
Lanternfly code to platform operations.

```lanternfly
sub showPlayer()
    screenClear()
    drawPixel(playerX, playerY, playerColour)
end
```

The calls use ordinary subroutine syntax. A target interface supplies their
parameter types, results and observable effects.

## Standard operations

Lanternfly defines a small set of operations whose source meaning stays fixed:

```lanternfly
distance = abs(targetX - playerX)
root = sqrt(area)
actorBytes = size(Actor)
rowCount = count(board, 0)
timerOffset = offset(Actor.timer)
clear(board)
fill(framebuffer, backgroundColour)
```

`abs` returns an unsigned magnitude. `sqrt` returns the floor of a non-negative
integer square root. The layout queries `size`, `count` and `offset` fold at
compile time. `clear` writes the all-zero representation to a record or array
that permits it. `fill` writes one scalar value to every element of an array.

A Z80 backend may call a helper for square root or wide arithmetic. A C backend
may emit a native operator or library call. Aggregate procedures may become an
inline loop or a memory helper. Helpers enter the program only when selected
operations require them, and the cost report names those helpers.

## Platform services

Input, display, sound, random values, firmware and device access arrive through
typed external routines. A platform interface module can declare and export
them without supplying Lanternfly bodies:

```lanternfly
export extern sub screenClear()
export extern sub drawPixel(x as u8, y as u8, colour as u8)
export extern sub showNumber(value as u16)
```

`import` loads an exported source module once:

```lanternfly
import "display.lf"
```

Private declarations remain inside their module. Exported names become visible
to the importer. Calls still use ordinary subroutine syntax:

```lanternfly
screenClear()
drawPixel(playerX, playerY, playerColour)
```

An external routine can name its target binding directly:

```lanternfly
extern sub printChar(ch as u8) at $0008
extern sub waitForKey() from "ROM_WAIT_KEY"
```

`at` supplies an absolute routine address. `from` supplies a substrate symbol.
With neither clause, the target profile binds the Lanternfly name. The profile
also defines argument and result carriers, clobbers, visible effects and cost.
A missing or incompatible binding is a compile error.

## Inline assembly

An instruction sequence can be placed directly inside a subroutine:

```lanternfly
sub waitForKey()
    asm
        call ROM_WAIT_KEY
    end
end
```

`asm` switches the lexer into raw assembly mode. The next physical line whose
trimmed content is exactly `end` returns to Lanternfly. Every line in between
belongs to the assembler, including its comment syntax.

An assembly-source backend emits the payload verbatim at that position:

```text
Lanternfly source
    -> generated assembly with inline blocks
    -> selected assembler
    -> machine program
```

Assembler diagnostics retain the original inline source lines.

## The assembly barrier

The compiler cannot infer register use or memory effects from arbitrary target
assembly, so a statement-level `asm` block forms a conservative barrier. The
compiler assumes that it can read and write every visible mutable object, call
target routines, fault and clobber processor registers or flags.

Before the block, the backend preserves every generated value needed
afterwards. Control from the assembly must reach the generated statement after
the block. A direct return or jump around Lanternfly control breaks that
contract and can bypass a hosted-body epilogue.

Raw names are assembler names. The backend's symbol artifact shows which
generated Lanternfly names are available to inline source.

## Module-level assembly

An `asm` block can also appear among module declarations:

```lanternfly
asm
ROM_WAIT_KEY = $0038
end
```

This form can provide target directives, labels, routines or data. Symbols
defined inside the raw block stay in the assembly world until an `extern sub`
declaration exposes them to Lanternfly.

Inline assembly commits that source file to a compatible assembly target. A C
or BASIC backend rejects the block unless its profile supplies an
assembly-fragment pipeline.

## Generated artifacts

A source-generating backend records:

- generated assembly, C or BASIC;
- source mappings from Lanternfly to generated ranges;
- typed symbols and exact layouts;
- selected helpers and imports;
- inline assembly ranges and conservative effects;
- target-qualified code and timing estimates when available.

For an assembly backend, the assembler adds machine-code addresses and its own
diagnostics to those mappings.

## Example

The [chapter listing](/lanternfly-book/book1/code/10-services.txt) uses standard
operations, declares display services and contains one inline assembly block.
