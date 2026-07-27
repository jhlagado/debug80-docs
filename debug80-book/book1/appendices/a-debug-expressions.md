---
layout: default
title: "Appendix A — Debug expressions"
parent: "Debug80 Book 1 — Getting started"
nav_order: 101
---

# Appendix A — Debug expressions

Debug80 supports Z80-focused expressions in the standard VS Code
**Watch** panel and in conditional breakpoints. Watches can be added
while the program is paused. **Edit Breakpoint** in a breakpoint's
context menu adds a condition.

## Examples

These examples show the shape of the expression language:

```asm
A
HL
PC
zero
not carry
PACMO_LIVES
[PACMO_LIVES]
[HL]
[IX + 4]
PC = MainLoop
[PACMO_LIVES] = 0
zero and A = 0
(A ^ $ff) = $df
```

## Registers

Watch expressions can refer directly to Z80 registers:

```asm
A
B
C
D
E
F
H
L
BC
DE
HL
AF
IX
IY
SP
PC
I
R
```

Alternate registers are supported:

```asm
A'
B'
C'
D'
E'
F'
H'
L'
BC'
DE'
HL'
AF'
```

Index-register and stack-pointer halves are supported:

```asm
IXH
IXL
IYH
IYL
SPH
SPL
```

## Flags

Flags use spelled-out names:

```asm
zero
carry
sign
parity
halfCarry
```

This keeps `carry` separate from the `C` register.

Flags combine with `not` and `and`:

```asm
zero
not carry
zero and A = 0
```

## Symbols

Symbols from the active source map can be used by name. A symbol by itself evaluates to its address or constant value.

```asm
MainLoop
PACMO_LIVES
PC = MainLoop
```

If a symbol is missing or stale in Watch, build the active target again.

## Memory reads

Square brackets read one byte from memory at the address inside the brackets:

```asm
[HL]
[PACMO_LIVES]
[IX + 4]
```

Z80 assembly normally uses parentheses for indirect references, as in `(HL)`. Debug80 expressions use square brackets for memory reads so parentheses can keep their ordinary expression-grouping role.

```asm
(A + 1) = $21
([FLAGS] & $80) != 0
([PACMO_LIVES] = 3) or carry
```

## Operators

Arithmetic operators:

```asm
+ - * / %
```

Bitwise operators:

```asm
& | ^ ~
```

`&` is bitwise AND. `|` is bitwise OR. `^` is bitwise XOR. `~` is bitwise invert.

Comparison operators:

```asm
= == != <> < <= > >=
```

`=` and `==` test equality. `!=` and `<>` test inequality. `<` tests less than. `<=` tests less than or equal. `>` tests greater than. `>=` tests greater than or equal.

The word forms `eq`, `ne`, `lt`, `le`, `gt` and `ge` are also accepted. They mean the same thing as `=`, `!=`, `<`, `<=`, `>` and `>=`.

Logical operators:

```asm
and or not
```

## Truth values

Debug80 treats zero as false and any non-zero value as true:

```asm
A
[PACMO_LIVES]
not [PACMO_LIVES]
carry or zero
```

When execution reaches a conditional breakpoint, a true or non-zero expression stops the program. A false or zero expression lets execution continue. Expression errors appear in the Debug Console and the condition is treated as false.
