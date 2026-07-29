---
layout: default
title: "A First Program"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 1
---

# A First Program

> [!IMPORTANT]
> This chapter uses the pre-0.3 draft syntax. See the
> [book revision notice](index.md).

A player begins a round with three lives. When the player loses a life, the
program subtracts one, stopping at zero. Here is the complete routine:

```text
DIM Lives AS INTEGER = 3

SUB LoseLife()
    IF Lives > 0 THEN
        Lives = Lives - 1
    END IF
END SUB
```

You can follow the rule before learning each keyword. `Lives` starts at 3. The
subtraction runs only while `Lives` is greater than zero. The words divide the
source into a declaration, a routine and a decision.

## A name for stored information

```text
DIM Lives AS INTEGER = 3
```

`DIM` introduces storage. `Lives` is the name used by the rest of the source.
`AS INTEGER` says that the storage holds a signed whole number. The final `= 3`
sets its starting value.

Read the line from left to right: declare `Lives` as an integer and initialise
it to three. A declaration gives the compiler enough information to choose a
representation and reject operations that do not fit that representation.

## A named action

```text
SUB LoseLife()
    ...
END SUB
```

`SUB` begins a procedure: a named action that returns no value. Its name is
`LoseLife`. The parentheses will hold inputs in later examples. Empty
parentheses say that this procedure receives none.

`END SUB` closes the procedure. Repeating the opening word at the end makes a
longer source file easier to scan. `END SUB`, `END IF` and `NEXT` name the
structure that each closing line completes.

## A decision written as a block

```text
IF Lives > 0 THEN
    Lives = Lives - 1
END IF
```

The expression after `IF` asks whether `Lives` is greater than zero. When that
comparison is true, the indented assignment runs. `END IF` marks the end of the
decision.

The indentation shows the same structure as the keywords. `IF` and `END IF`
give a formatter an unambiguous block to indent.

## Words for structure, symbols for formulas

The opening example establishes the source style used throughout the book:

| Job                       | Lanternfly form        |
| ------------------------- | ---------------------- |
| declare a value           | `DIM Lives AS INTEGER` |
| begin a decision          | `IF Lives > 0 THEN`    |
| close a decision          | `END IF`               |
| subtract one              | `Lives - 1`            |
| store a result            | `Lives = Lives - 1`    |
| begin and end a procedure | `SUB` and `END SUB`    |

Words carry the grammar of the program. Symbols keep arithmetic and
comparisons in the notation used on paper. Parentheses group expressions and
hold call arguments. Square brackets will select array entries and a dot will
select a record field.

This division gives Lanternfly the reading shape associated with structured
BASIC and Visual Basic. Lanternfly borrows that source convention while
specifying its own fixed integer widths, exact data layouts and
machine-independent arithmetic rules.

## The working punctuation budget

The first language draft uses punctuation where it has a familiar job:

- `+`, `-`, `*` and `/` write arithmetic;
- `=`, `<>`, `<`, `<=`, `>` and `>=` write comparisons;
- parentheses group calculations and enclose call arguments;
- square brackets select array entries;
- a dot selects a named field.

Control flow uses words: `IF`, `ELSE`, `FOR`, `WHILE`, `SELECT CASE`, `SUB` and
`FUNCTION`. Word operators such as `AND`, `OR`, `NOT`, `MOD`, `SHL` and `SHR`
replace punctuation whose meaning is less obvious to a new programmer.

## Example

The [chapter listing](/lanternfly-book/book1/code/01-first-program.txt) contains
the complete routine.

## Summary

- `DIM` declares stored information and `AS` gives it a type.
- `SUB` and `END SUB` enclose a named action.
- `IF`, `THEN` and `END IF` enclose a conditional block.
- Words show program structure while symbols write formulas and comparisons.
