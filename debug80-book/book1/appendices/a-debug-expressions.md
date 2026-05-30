---
layout: default
title: "Appendix A — Debug Expressions"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 101
---

[← Send To TEC-1G Hardware](../07-send-to-hardware-and-keep-working.md) | [Book 1](../index.md) | [Appendix B — Command Reference →](b-command-reference.md)

# Appendix A — Debug Expressions

Debug80 supports Z80-focused expressions in the standard VS Code **Watch** panel and in conditional breakpoints. Add Watches while the program is paused. Add a breakpoint condition by right-clicking a breakpoint and choosing **Edit Breakpoint**.

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
PC eq MainLoop
[PACMO_LIVES] eq 0
zero and A eq 0
(A ^ $ff) eq $df
```

## Registers

Watch expressions can refer directly to Z80 registers:

```asm
A
B
C
BC
DE
HL
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

```asm
zero
not carry
zero and A eq 0
```

## Symbols

Symbols from the active source map can be used by name. A symbol by itself evaluates to its address or constant value.

```asm
MainLoop
PACMO_LIVES
PC eq MainLoop
```

Build the active target again when a symbol Watch needs to be generated or refreshed.

## Memory Reads

Square brackets read one byte from memory at the address inside the brackets:

```asm
[HL]
[PACMO_LIVES]
[IX + 4]
```

Parentheses group expressions:

```asm
(A + 1) eq $21
([FLAGS] & $80) ne 0
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

Comparison operators:

```asm
eq ne lt le gt ge
```

Logical operators:

```asm
and or not
```

The `^` operator is bitwise XOR.

## Truth Values

Debug80 treats zero as false and any non-zero value as true:

```asm
A
[PLAYER_LIVES]
not [PLAYER_LIVES]
carry or zero
```

Conditional breakpoints use the same syntax. When execution reaches a conditional breakpoint, a true or non-zero expression stops the program. A false or zero expression lets execution continue. Expression errors stop the program and appear in the Debug Console.

[← Send To TEC-1G Hardware](../07-send-to-hardware-and-keep-working.md) | [Book 1](../index.md) | [Appendix B — Command Reference →](b-command-reference.md)
