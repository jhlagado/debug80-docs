---
layout: default
title: "Services and Targets"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 10
---

# Services and Targets

Arithmetic and control flow have the same meaning on every Lanternfly target.
Drawing a pixel, reading a key or writing to a device depends on the platform.
A typed service connects source code to that platform operation:

```text
SUB ShowPlayer()
    ScreenClear()
    DrawPixel(PlayerX, PlayerY, PlayerColour)
END SUB
```

The calls look like ordinary procedures. An interface supplies each name,
parameter type, result type and visible effect.

## Core language operations

The language defines calculations, comparisons, assignments, control flow and
typed storage. Their results remain the same across backends.

```text
Distance = ABS(TargetX - PlayerX)
Root = ISQRT(Value)
Power = Base ^ Exponent
```

`ABS`, `ISQRT`, `MIN`, `MAX`, `CLAMP`, `SGN`, `POW` and `BITCOUNT` form the
initial scalar library. Aggregate operations include `FILL`, `CLEAR`, `COPY`
and `MOVE`.

A backend may translate one operation to a machine instruction, an inline
sequence, a helper routine or a host-language built-in. Each implementation
must produce the same Lanternfly result.

## Platform services

Input, display, sound, random values, firmware and device operations arrive
through typed interfaces. A display interface might supply:

```text
ScreenClear()
DrawPixel(X, Y, Colour)
ShowNumber(Value)
```

The concrete import-file syntax is still being designed. Its semantic contract
already includes:

- the service name;
- parameter and result types;
- storage or device effects;
- whether the call returns;
- the target capability it requires;
- the native symbol, host function or helper that implements it.

Lanternfly source can call the same service name when several targets provide
compatible implementations.

## Runtime helpers fill target gaps

A small processor may need a helper for multiplication, division, integer
square root or 32-bit arithmetic. A C backend may use its host operations for
some of the same work.

Helpers are selected from the operations a program actually uses. The division
helper is linked only into programs that divide. The cost report can name each
selected helper and its estimated code or cycle cost.

The helper boundary preserves the readable source. A formula remains a formula
when its implementation requires several instructions or a call.

## Native code is an explicit boundary

Some operations depend on an instruction, firmware entry point or precisely
timed sequence. A native declaration binds a Lanternfly signature to that
target implementation. An inline native block can hold substrate source when
the operation belongs inside one routine.

The concrete keywords for native declarations and blocks remain provisional.
Their contract records reads, writes, I/O, returned values, control flow and
target requirements. That information lets the compiler protect surrounding
code and map a native error back to its Lanternfly call.

## One source meaning, several outputs

The same typed program can move through different backends:

```text
Lanternfly source
    -> typed program
    -> target backend
    -> AZM, another assembler, C or BASIC
```

Generated C or BASIC must preserve fixed-width arithmetic, exact layout,
narrowing and evaluation order. Host-language defaults are implementation
details rather than permission to change the result.

Each backend should produce inspectable output, source provenance and the
target assumptions used by its cost report. Those artifacts let you connect a
Lanternfly statement to generated source and then to machine code where the
target supplies it.

## Example

The [chapter listing](/lanternfly-book/book1/code/10-services.txt) uses standard
operations and three assumed platform services. The interface declarations
will be added when their source syntax is selected.

## Summary

- Core operations keep one meaning across targets.
- Platform services enter through typed interfaces and ordinary calls.
- Backends link runtime helpers only when a program uses them.
- Native code has an explicit target-qualified contract.
- Generated source, source maps and cost information are compiler outputs.
