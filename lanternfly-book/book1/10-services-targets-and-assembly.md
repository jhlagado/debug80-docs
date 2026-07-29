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
same value on a Z80, under a C backend, anywhere. Drawing a pixel or
reading a key is different in kind: it depends on hardware the language
cannot know in advance and would be wrong to guess at. Every compiled
language for real machines needs a story for this boundary. Lanternfly's
story has two layers — typed services for the routine crossings, inline
assembly for the intimate ones — and both keep the language's oldest
promise, that you can always see what a line will cost and touch.

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

Before the platform-specific, the almost-portable. Lanternfly defines a
small set of operations whose source meaning stays fixed on every target:

```lanternfly
distance = abs(targetX - playerX)
root = sqrt(area)
actorBytes = size(type Actor)
rowCount = count(board, 0)
timerOffset = offset(Actor.timer)
clear(board)
fill(framebuffer, backgroundColour)
```

Most are old friends by now. `abs` returns an unsigned magnitude, as in
Chapter 3. `sqrt` returns the floor of a non-negative integer square root.
The layout queries `size`, `count` and `offset` fold at compile time, as
Chapters 6 and 7 showed. `clear` writes the all-zero representation to a
record or array that permits it, and `fill` writes one scalar value to
every element of an array.

What is new here is the frank account of how they are made. A Z80 backend
may call a helper routine for square root or wide arithmetic — the
processor has no such instructions, so somebody must supply the
subroutine. A C backend may emit a native operator or a library call.
Aggregate procedures may become an inline loop or a memory helper. The
part that matters: helpers enter the program only when selected operations
require them, and the cost report names those helpers. Many languages ship
a runtime you carry whole whether you use it or not; Lanternfly's runtime
is itemised, assembled from exactly what your program asked for, with the
receipt attached.

## Platform services

Input, display, sound, random values, firmware and device access arrive
through typed external routines. A platform interface module can declare
and export them without supplying Lanternfly bodies:

```lanternfly
export extern sub screenClear()
export extern sub drawPixel(x as u8, y as u8, colour as u8)
export extern sub showNumber(value as u16)
```

`extern` says the body lives elsewhere — in ROM, or in hand-written
assembly. The declaration's job is the types, and the types are
doing real protective work. A firmware routine is reached by address and
convention; call it with the wrong argument width and nothing checks —
the machine executes your mistake exactly as written. Wrapping the
routine in a typed declaration moves that hazard from runtime to compile
time: `drawPixel(playerX, playerY, playerColour)` is checked like any
other call, and the reader sees a vocabulary of named, typed operations
rather than a scatter of magic addresses.

`import` loads an exported source module once:

```lanternfly
import "display.lf"
```

Private declarations remain inside their module; exported names become
visible to the importer. This is how a platform grows a face: one module,
written once per target, declaring the services that machine offers —
and the game imports the face, never the machinery behind it.

The payoff arrives on the day you port. Move the game to a second
machine and the game logic — every chapter of it, the loops, the
records, the rules — compiles unchanged; what must be written anew is
one interface module, declaring the same service names against the new
machine's ROM and hardware. The port is measured in declarations
rather than rewrites, and the size of that one module is an honest
measure of how platform-bound your game ever was. Programmers of the
eighties ported games by rewriting them; a typed service boundary is
how their successors stopped.

An external routine can name its target binding directly:

```lanternfly
extern sub printChar(ch as u8) at $0008
extern sub waitForKey() from "ROM_WAIT_KEY"
```

`at` supplies an absolute routine address — the natural spelling for ROM
entry points that have sat at fixed addresses since the machine was
designed. `from` supplies a substrate symbol by name. With neither clause,
the target profile binds the Lanternfly name itself. The profile also
defines the argument and result carriers — which registers or cells carry
each value — along with clobbers, visible effects and cost. A missing or
incompatible binding is a compile error, and it is worth pausing on how
much grief that one sentence retires: the traditional version of this
mistake was a program that assembled cleanly and crashed at the first
keypress.

## Inline assembly

Services cover the crossings the platform anticipated. For the rest —
the timing-critical loop, the undocumented trick, the instruction the
compiler has no reason to emit — an instruction sequence can be placed
directly inside a subroutine:

```lanternfly
sub waitForKey()
    asm
        call ROM_WAIT_KEY
    end
end
```

`asm` switches the lexer into raw assembly mode, and the switch is total:
the next physical line whose trimmed content is exactly `end` returns to
Lanternfly, and every line in between belongs to the assembler, including
its comment syntax. The totality is the design. An assembly dialect is its
own language with its own lexical habits, and a half-translated embedding
that reinterpreted quotes or semicolons would corrupt exactly the code you
most need carried faithfully.

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

Honesty cuts both ways at this boundary. The compiler cannot infer
register use or memory effects from arbitrary target assembly, so a statement-level `asm` block
forms a conservative barrier. The compiler assumes the block can read and
write every visible mutable object, call target routines, fault, and
clobber processor registers and flags.

Around that assumption, the backend protects its own work: before the
block, it preserves every generated value needed afterwards. The price is
paid in the surrounding code — values that might have stayed cached in
registers are written safely home instead — which is the real cost of an
`asm` block, and a reason to keep them few and small. In return, one
obligation falls on you: control from the assembly must reach the
generated statement after the block. A direct return or jump around
Lanternfly's control flow breaks the contract and can bypass a
hosted-body epilogue — the block is a guest inside a routine the compiler
is still responsible for, and guests leave by the door.

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
simply teaching the assembler a name for a ROM address, the definition
the earlier `from "ROM_WAIT_KEY"` binding relies on. Symbols defined
inside the raw block stay in the assembly world until an `extern sub`
declaration exposes them to Lanternfly; the two worlds meet only where a
typed declaration says they do.

There is a price of admission, honestly posted: inline assembly commits
that source file to a compatible assembly target. A C or BASIC backend
rejects the block unless its profile supplies an assembly-fragment
pipeline. The practical discipline follows directly — keep `asm` inside
per-target interface modules, behind the typed faces of the previous
section, and the game logic that imports them stays portable to every
backend at once.

## Generated artifacts

The book has promised since Chapter 1 that costs stay visible. Here,
finally, is the ledger. A source-generating backend records:

- generated assembly, C or BASIC;
- source mappings from Lanternfly to generated ranges;
- typed symbols and exact layouts;
- selected helpers and imports;
- inline assembly ranges and conservative effects;
- target-qualified code and timing estimates when available.

For an assembly backend, the assembler adds machine-code addresses and its
own diagnostics to those mappings. Every claim this book has made about
following the generated work — counting the instructions behind an `if`,
pricing a 32-bit addition, watching an aggregate copy choose between loop
and helper — cashes out in these artifacts. They are the difference
between trusting a compiler and being able to check one, and the
language's position is that on a small machine you deserve both.

## Example

The [chapter listing](/lanternfly-book/book1/code/10-services.txt) uses
standard operations, declares display services and contains one inline
assembly block. It is also the end of Book 1, and a fair place to take
stock: you can now read a Lanternfly program from its first declaration to
its last `end`, price its storage byte by byte, and follow any line of it
down to the instructions it becomes. The [working specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
holds the complete rules when you need the fine print, and the exercises
will arrive with the compiler — at which point the pencil traces this book
kept assigning become programs you can finally run against your answers.
