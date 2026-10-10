---
title: "Within Bounds"
parent: "Programming Basie"
nav_order: 2
nav_exclude: true
search_exclude: true
---

# Within Bounds

Chapter 1 stored three numbers in `u16` variables and never came close to the edges of that type. Real programs do come close. A byte read from the keyboard has to fit in a byte, and a sensor reading may be negative. A buffer has a last element, and an index one past it points at somebody else's storage.

Each of Basie's types for single values has a fixed range, constants give fixed facts a name and two checks keep values inside their limits. One check makes sure a value fits the type it is being converted to. The other makes sure an index falls inside the object it selects. In C or assembly the same mistakes corrupt memory quietly and surface much later somewhere else.

## Integer and Boolean types

Basie has six integer types, a floating-point type and a Boolean type. Each integer type has a fixed width and range that doesn't change from one machine to another:

| Type | Size | Values |
| --- | ---: | ---: |
| `u8` | 1 byte | 0 through 255 |
| `i8` | 1 byte | -128 through 127 |
| `u16` | 2 bytes | 0 through 65,535 |
| `i16` | 2 bytes | -32,768 through 32,767 |
| `u32` | 4 bytes | 0 through 4,294,967,295 |
| `i32` | 4 bytes | -2,147,483,648 through 2,147,483,647 |
| `boolean` | 1 byte | `false` or `true` |

The `u` types are unsigned and the `i` types are signed. Unsigned types suit bytes, sizes, counts and indexes, which never go below zero. Signed types suit quantities that can cross zero, such as a temperature or a change in position.

Choose the smallest type that comfortably holds the values you need, but don't squeeze. A `u8` saves a byte over a `u16`, and the saving adds up across a large array. A 32-bit type costs extra code for every operation, because the Z80 has no 32-bit arithmetic of its own. For most counts and amounts, `u16` is the natural choice.

The floating-point type `f32` holds fractional values. Chapter 11 introduces it at the point where a calculation needs it.

A Boolean is not a number in Basie. Some languages treat zero as false and anything else as true. In Basie a condition must be a `boolean`, and Booleans and integers can't be converted to each other. A count therefore can't be tested as if it were a flag.

## Constants for fixed facts

A program often starts from facts rather than storage. A screen has a fixed number of rows. A protocol assigns a particular byte to each command. A feature is switched on or off. Basie gives those facts names with `const`:

```basie
const rows = 4
const columns = $08
const enabled = true
const stepBack = -1
```

A constant is a value, not storage. Its value is fixed at compile time and stays the same for the whole run. Using it costs no more than writing the number itself.

The constants above are **untyped**. `enabled` is a Boolean because its initial value is `true`. The other three are **exact integers**: the compiler keeps their mathematical value and gives them a type only when they are used. That lets `rows` serve as a `u8` in one place and a `u16` in another, because 4 fits both. If you used a constant somewhere its value didn't fit, such as 300 where a `u8` was required, the compiler would report that use.

To give a constant one particular type everywhere, write the type:

```basie
const limit: u32 = 70000
```

`limit` is a `u32` wherever it appears, just as a `u32` variable would be. A floating-point constant must always be written this way, as in `const half: f32 = 0.5`.

## Writing numbers

Decimal numbers need no prefix. A `$` introduces a hexadecimal number and a `%` introduces a binary one. `$08`, `%1000` and `8` are all the same value. A character in single quotes, such as `'A'`, is also an integer: the value of that byte, which for `A` is 65. Basie has no separate character type, because a character is just a byte.

All of these forms are exact integers, so the place where they are used determines their type, just as it does for an untyped constant.

## One character at a time

A character typed at the console is a byte as well. This short program reads one and writes it back:

<<< @/basie/book1/examples/CHARS.BSI{basie}

The program first writes a `?` as a prompt. `readInputByte` then waits for a key and returns the byte it read as a `u8`, which the program stores in the local variable `character`. `writeOutputByte` writes that byte back to the console. Both are services built into the runtime, so this program needs no library include.

`readInputByte` echoes the key it reads, so the user sees what they typed. Typing `A` shows the prompt, the echoed `A` and a second `A` from the program, so the screen reads `?AA`. The final `writeText` sends a carriage return and a line feed, written in the string as `\r\n`, to finish the line.

CP/M treats Control-Z as the end of input. `readInputByte` reports that as a failure rather than returning a byte, and `try` passes the failure out of `main`.

Passing `character` to `writeOutputByte` copies the byte, just as the assignments in Chapter 1 did with numbers. The service has no access to the variable `character` itself.

## Checked conversion

Some conversions always keep the value. Every `u8` value also fits in a `u16`, so Basie widens a `u8` to a `u16` automatically wherever one is needed. The same is true for `u8` to `i16`, for either 16-bit type to `i32` and for the other conversions that keep every possible value.

Narrowing can lose information. A `u16` might hold 300, which is too large for a `u8`. Basie therefore narrows a value only when you write the conversion, using the target type's name:

```basie
var byteValue: u8 = u8(wordValue)
```

`u8(wordValue)` means "this value, as a `u8`, provided it fits". The conversion checks the value when the program runs. A value that fits becomes the same number in the smaller type. A value that doesn't fit stops the program with a **trap** before any wrong value can be produced.

In C or assembly, converting 300 to a byte silently keeps the low eight bits and gives you 44. The program carries on with a wrong number, and you find out much later, if ever.

This program converts 300 to a `u8`:

```basie
var wide: u16 = 300

sub main()
    var small = u8(wide)
end
```

Running it produces a trap report instead of a result:

```text
TRAP narrowing at 029D
```

`narrowing` names the failed check, and the number is its address in the program. The compiler makes the check itself when it can work out the value. It rejects `u8(300)` with the constant 300, because that conversion can never succeed.

## Staying inside an object

A value can fit its type perfectly well and still be wrong for the job. Here's an array of two readings:

```basie
var readings: u8[2] = [12, 20]
```

The suffix `[2]` makes `readings` an array of two `u8` elements, stored one after the other inside the array's storage. `readings[0]` is the first element and `readings[1]` is the second. Indexes start at zero, so the element count, 2, is also the first position past the end.

The number 2 fits in a `u8`, so type checking can't catch `readings[2]`. The array's length sets which positions exist. Basie checks every index against the length of the array it selects. An index outside the array stops the program with a `bounds` trap before anything is read or written.

This example converts a measurement to a byte and reads the second element of the array, and Basie checks both operations:

<<< @/basie/book1/examples/VALID.BSI{basie}

Both checks pass here, but a single different number makes either one fail:

- Change `measurement` to 300 and the conversion traps with `narrowing`. 300 is a valid `u16`, but `u8` can't hold it.
- Change `index` to 2 and the array access traps with `bounds`. 2 is a valid `u8`, but `readings` has no element at that position.

In each case the variable holds a valid value. The trap comes from an operation that needs more than the type guarantees. A bounds failure looks like this:

```text
TRAP bounds at 02A0
```

Without that check, `readings[2]` would read whatever byte happens to follow the array in memory, and `readings[2] = 99` would overwrite it. On a CP/M machine that byte could belong to another variable, the program's code or the stack. Such bugs are some of the hardest to find, because the damage shows up far from the line that caused it. The bounds trap stops the program at that line.

## Compile time or run time

Basie checks as much as it can while compiling and leaves the rest to the running program. The compiler evaluates a check whose values are all constants, and rejects the program if it fails. A check that involves a variable happens at run time, when the operation runs.

So `readings[2]` with the constant 2 is a compile error, reported as "index 2 is out of range for u8[2]". `readings[index]` with `index` holding 2 is a run-time trap. The compiler doesn't trace values through variables to predict failures. That keeps the rules for what compiles clear and the same for every compiler.

An array's length doesn't create a special range type for its index. The index is an ordinary `u8` or `u16`, and Basie checks it each time it selects an element of a particular array.

## Assertions that check the design

The constants `rows` and `columns` can be checked together with an assertion:

```basie
assert rows * columns = %100000
```

This one sits at the top level of the program, outside any routine. A top-level `assert` must use only constants. The compiler checks it and generates no code for it. Here it records a design decision, that the screen holds 32 cells. The program stops compiling at this line if someone later edits `rows` and leaves `columns` as it is.

Inside a routine, `assert` is the run-time check from Chapter 1. Both forms state something that must be true. The top-level form is checked once, at compile time. The routine form is checked each time execution reaches it.

## The companion program

This program combines the pieces from this chapter. It uses all three ways of writing a number, a character value, a negative constant, a checked conversion and both kinds of assertion.

<<< @/basie/book1/examples/02-values.BSI{basie}

The calculation in `main` adds three parts:

- `rows * columns` is 32, converted to `u16`.
- `'A'` is 65.
- `i8(stepBack) + 1` converts -1 to an `i8` and adds 1, giving 0, which converts safely to `u16`.

The total is 97, and the final assertion confirms it. Now try setting `stepBack` to -2. The sum inside the last conversion becomes -1, and a negative number can't be converted to `u16`. Every value in that expression is a constant. The compiler therefore finds the failed conversion and rejects the program with a `narrowing` diagnostic.

## Summary

- Basie has six signed and unsigned integer types of 8, 16 and 32 bits, plus `f32` and `boolean`.
- A Boolean is not an integer. Conditions must be Boolean and there is no conversion either way.
- An untyped constant such as `const rows = 4` is an exact integer that takes a suitable type at each use. A typed constant such as `const limit: u32 = 70000` keeps its type. Floating-point constants must be typed.
- `$` introduces hexadecimal, `%` introduces binary and `'A'` is the byte value of a character.
- Widening that keeps every value happens automatically. Narrowing must be written, as `u8(x)`, and traps with `narrowing` if the value doesn't fit.
- Every array index is checked against the array's length, and an index outside it traps with `bounds`.
- A check on constants is made while compiling. A check that depends on a variable is made when the operation runs.
- A top-level `assert` checks a constant condition at compile time and generates no code.

The precise rules are in the specification chapters on [source text](https://github.com/jhlagado/basie/blob/main/spec/03-source-text-and-lexical-rules.md), [types](https://github.com/jhlagado/basie/blob/main/spec/06-types.md) and [declarations](https://github.com/jhlagado/basie/blob/main/spec/08-constants-and-declarations.md).
