---
title: "Diagnostic Messages"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 111
nav_group: "Reference tables"
---

# Diagnostic Messages

Atom reports an assembly error as the file, line and column followed by one
sentence:

```text
HANDLES.ASM:230:5: relative jump to .NONE is out of range (offset 131); .NONE is on line 303
```

The wording is the same on CP/M and Node. Line and column numbers start at
one, and the column counts bytes in the source line. When an included file
causes the error, Atom names that file rather than the root source. In the
tables below, `NAME` stands for a symbol, `N` for a number and `L` for a line.

## Source text

| Message | Cause |
| --- | --- |
| `invalid character` | The line contains a byte Atom does not accept in source, such as a control character. |
| `name is longer than 8 characters` | A label or symbol has more than eight characters. A private name may have eight after its period. |
| `malformed number` | A number has a digit that its base does not allow, or an unknown suffix. |
| `number does not fit in 16 bits` | A number is larger than 65,535. |
| `unterminated string` | A quoted string has no closing quote on the same line. |
| `unsupported escape sequence` | A backslash in a string or character constant is followed by an unknown character. |
| `string is too long` | A string is longer than Atom's string buffer. |
| `unterminated character constant` | A character constant such as `'A'` has no closing quote. |
| `invalid character constant` | A character constant is empty or holds more than one character. |
| `% directive is not allowed here` | A `%` line appears where a preprocessing directive cannot be used. |

## Statements and operands

| Message | Cause |
| --- | --- |
| `expected a label, instruction or directive` | A line starts with something other than a name, such as a number. |
| `unknown instruction or directive` | The name in the operation position is neither a Z80 instruction nor a directive. A label that is missing its colon also produces this message. |
| `expected an operand` | An operand is missing, for example after a comma. |
| `this operand cannot be used in brackets` | A register or value that cannot address memory is written in brackets. |
| `expected a comma or the end of the line` | Something follows an operand where only a comma or the end of the line can. |
| `too many operands` | The instruction has more operands than any Z80 form takes. |
| `operands are not valid for this instruction` | No form of the instruction takes this combination of operands, as in `LD (BC),B`. |
| `unexpected text after the operands` | A directive such as `ORG` or `DS` is followed by more than it accepts. |
| `strings are only allowed in DB` | A quoted string appears in `DW` or another directive that takes numbers. |
| `expected a quoted string` | `CSTR`, `PSTR` or `ISTR` is not followed by a string. |

## Values and expressions

| Message | Cause |
| --- | --- |
| `expected a value` | An expression is missing a number, symbol or bracketed term. |
| `missing closing parenthesis` | An opening parenthesis has no match. |
| `division by zero` | `/` or `%` has a divisor of zero. |
| `value is out of range` | A calculation goes outside -32,768 to 65,535, or a directive's value is unusable, such as `ALIGN 0`. |
| `value is out of range for this operand` | The value does not fit the field, for example 300 in `LD A,300`. |
| `value N is out of range for this operand` | A forward value turned out not to fit its field when its symbol was defined. |
| `value of NAME (N) is out of range for this operand` | The same, with the symbol named. The error points at the instruction that used `NAME`. |
| `value uses a symbol that is not defined yet` | `EQU`, `ORG`, `DS` or `ALIGN` needs a value now, but its expression names a later symbol. |
| `a forward reference here must be one symbol plus or minus a small number` | An expression that uses a later symbol does more than add or subtract a small number, for example `FWD*2`. |
| `this operand cannot refer to a symbol defined later` | The instruction cannot be patched later, as with `BIT FWD,A` or `RST FWD`. Define the symbol first. |
| `expression is too complex` | An expression nests more deeply than Atom's evaluator allows. |

## Jumps

| Message | Cause |
| --- | --- |
| `relative jump is out of range (offset N)` | A `JR` or `DJNZ` target is more than 128 bytes back or 127 bytes forward. `N` is the offset it would need. |
| `relative jump to NAME is out of range (offset N); NAME is on line L` | The same for a forward jump. The error points at the jump, and `L` is the line that defines `NAME`. |

Use `JP` for a jump that cannot reach. On Node, a `.lst` listing names every
relative jump within four bytes of its limit, and every `JP` close enough to
be a shorter `JR`.

## Symbols

| Message | Cause |
| --- | --- |
| `undefined symbol NAME` | `NAME` is used but never defined. The error points at its first use. |
| `symbol is already defined` | A label or `EQU` name is defined twice. |
| `private label used before any global label` | A name starting with `.` appears before the first global label. |
| `private label NAME is not defined before this global label` | A private label is used in a routine but not defined before the next global label, which ends its scope. The error points at that global label. |
| `too many symbols` | The build has more symbols than Atom's symbol table holds. |
| `too many forward references` | Too many references to later symbols are waiting at once. |
| `too many forward references in one instruction` | One instruction refers to more than two later symbols. |

[Limits and capacities](05-limits-and-capacities.md) gives the symbol and
forward-reference capacities.

Three further messages, `expected an instruction`, `unknown instruction` and
`symbol not found`, belong to Atom's parser and symbol table. Ordinary source
reaches the more specific messages above instead.

## Output and Atom itself

| Message | Cause |
| --- | --- |
| `program does not fit in the output range` | Code or an `ORG` lies outside the output range. On CP/M that range is `0100H` to the end of memory. |
| `could not write the output` | The output file could not be written, for example because the disk is full. The message names the output file instead of a source line. |
| `stack overflow` | CP/M only. Atom's stack grew past its 512 bytes. Please report it with the source that caused it. |
| `internal error in Atom; please report it` | Atom found an inconsistency in its own state. Please report it with the source that caused it. |

On Node, a failure detected by the host, such as `IMAGE records descend or
overlap` for an `ORG` that moves backwards over earlier output, keeps the
host's own wording.
