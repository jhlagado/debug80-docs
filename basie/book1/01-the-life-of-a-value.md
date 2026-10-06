---
title: "The Life of a Value"
parent: "Programming Basie"
nav_order: 1
nav_exclude: true
search_exclude: true
---

# The Life of a Value

Suppose an order costs 120 units and postage costs another 15. You want the amount due, and you want to keep that figure while you start work on the next order. That's about as small as a useful program gets, and it's enough to show the first and most basic idea in Basie: a variable is a named piece of storage, and assignment puts a value into it.

## The first declaration

Here is a variable for the subtotal:

```basie
var subtotal as u16 = 120
```

The line has four parts. `var` says that this is a variable, a place whose contents can change. `subtotal` is its name. The type after `as` says what kind of value the storage holds, and the value after `=` is what it holds to begin with.

The type here is `u16`, an unsigned sixteen-bit integer. It holds whole numbers from 0 through 65,535 and occupies two bytes. Sixteen bits is the Z80's natural working size: it can add two 16-bit numbers in a single instruction, so `u16` is the type you'll reach for most often. Basie has smaller and larger integer types as well, and Chapter 2 sets them out. Every figure in this chapter fits comfortably in a `u16`.

The type is a fixed part of the variable. Once `subtotal` is declared as `u16`, it holds a `u16` for the whole run. Basie checks every use against that type when it compiles the program, so nothing at run time has to work out what kind of value is in there.

## The complete program

We need three variables: the subtotal, the postage and the total. This program calculates the total, then changes the subtotal as if a new order had come in:

<<< @/basie/book1/examples/01-postage.BSI{basie}

The three declarations at the top sit outside any routine, which makes them **program variables**. Some languages call these global variables. They receive their starting values before the program begins, and their storage lasts for the whole run.

`sub main()` begins the routine where execution starts. `sub` introduces any routine, `main` is the routine the runtime calls first, and the empty parentheses mean it takes no arguments. Everything down to the matching `end` is the routine's body.

The word `fails` after the parentheses and the `else fail` at the end of two lines concern errors. Printing can go wrong on a real machine, and Basie requires every call that can fail to say what should happen if it does. `else fail` means "if this call fails, pass the failure on". Here it passes out of `main` to the runtime, which reports it. Chapter 7 explains this properly. For now you can read each `else fail` as "and stop if that didn't work".

The two `include` lines at the top bring in library source for formatting numbers and writing lines of text. We'll come to them when we print the result.

## Calculating and storing a result

The first statement in `main` calculates the amount due:

```basie
total = subtotal + postage
```

The right-hand side is evaluated first. It reads the current value of `subtotal`, which is 120, and the current value of `postage`, which is 15, and adds them. The assignment then stores the result, 135, in `total`, replacing the zero it started with.

The next statement changes the subtotal:

```basie
subtotal = 200
```

Now `subtotal` holds 200. The question that the rest of this chapter turns on is what happens to `total`. It still holds 135. The earlier assignment stored a number in `total`, the result of the addition at the moment it ran. It didn't store the formula `subtotal + postage` to be worked out again whenever the inputs change. A spreadsheet cell behaves the second way. A variable behaves the first.

![Two separate storage cells after calculating the total and changing the subtotal.](../../assets/images/basie-book/book1/scalar-copy.svg)

Each box in the diagram is a separate piece of storage. Writing 200 into `subtotal` changes that box and nothing else. This is exactly what you want when you need a finished result to stay put while you prepare new input.

Tracing the program one statement at a time makes the sequence plain:

| Point in execution | `subtotal` | `postage` | `total` |
| --- | ---: | ---: | ---: |
| Before the first statement | 120 | 15 | 0 |
| After calculating the total | 120 | 15 | 135 |
| After changing the subtotal | 200 | 15 | 135 |

## Copies, not connections

A single number such as 135 is a **scalar value**. Basie's scalars are its integer types, its floating-point type and its Boolean type, which holds `true` or `false`. Whenever a scalar moves from one place to another, it is copied. Assignment copies it into the destination. Passing it to a routine copies it into the routine's parameter, and returning it from a routine copies it back to the caller.

So two variables that hold the same number are still two separate objects. If `total` and some other variable both held 135, changing one would leave the other alone. There is never a hidden link from one to the other.

That sounds too obvious to mention, and for single numbers it is. It becomes far less obvious once values are grouped into records and arrays and handed to routines, because then a routine can be given access to the original object rather than a copy of it. Chapter 4 makes that distinction. Everything after it depends on keeping the two cases apart, and the scalar case, where every move is a copy, is the solid ground to start from.

## Checking a prediction

The two assertions after the assignments check the state we just traced:

```basie
assert subtotal = 200
assert total = 135
```

`assert` takes a condition. Inside a condition, `=` compares two values for equality rather than storing anything, so `total = 135` is true when `total` holds 135. If the condition is true, execution carries on. If it's false, the program stops at once and reports an assertion trap.

These two lines turn the trace table into something the machine checks. If changing `subtotal` had somehow changed `total` as well, the second assertion would fail and the program would stop with a report instead of printing its answer. A run that reaches the end has confirmed both predictions.

Assertions are cheap to write and they make good habits. Throughout this book the examples use them to state what each step should have done, so that a successful run is evidence rather than hope.

## Putting a number on the screen

The number 135 in `total` is a binary value in two bytes. To show it on the screen, the program needs the three characters `1`, `3` and `5`. Turning the number into those characters is a separate job, and Basie does it with ordinary library routines.

The `include` lines at the top make two library parts available. `FORMAT.BSI` contains routines that convert numbers to text, and `TEXTIO.BSI` contains routines for writing lines. They're written in Basie, and their source is compiled along with yours. The last three lines of `main` use them:

```basie
var report as string[16]
appendU16(report, total) else fail
writeLine(console, report) else fail
```

The first line declares a local variable, `report`, inside `main`. Its type is `string[16]`, a string with room for up to sixteen bytes. It starts empty. Chapter 8 explains strings fully. The important point here is that the sixteen is a capacity, fixed when the string is declared, and nothing can write past it.

`appendU16` takes a copy of the number in `total` and appends its decimal digits to `report`. If the string didn't have room for the digits, `appendU16` would report a failure rather than write beyond the string's end. Three digits fit easily into sixteen bytes.

`writeLine` sends the string's contents to `console`, followed by a carriage return and a line feed. `console` is the program's standard connection to the terminal. On a CP/M machine that's normally the keyboard and screen, or a serial terminal. Your program never deals with hardware ports or device addresses. It hands text to the console and the runtime does the rest.

The program prints one line:

```text
135
```

Both routines use `report` only for the length of their calls. Once they return, they keep no hold on it. We'll look much more closely at that kind of temporary access when routines start sharing records and arrays.

## Building and running the program

Save the listing as `POSTAGE.BSI` on your CP/M disk. The disk needs the toolchain: `BASIE.COM` with its companion files `BASIE.OVL` and `BASIE.MSG`, the linker `BLINK.COM` and the runtime library `CPM22.BRL`. Because the program includes `FORMAT.BSI` and `TEXTIO.BSI`, those need to be there too, along with `STRINGS.BSI`, which they both include.

Two commands build the program and run it:

```text
A>BASIE POSTAGE
A>POSTAGE
135
A>
```

The first command compiles `POSTAGE.BSI` and links the result into `POSTAGE.COM`, a CP/M program you can run on its own. The second runs it. Both assertions pass, the program prints `135` and CP/M shows its prompt again.

If an assertion fails, you see a trap report instead of the result, something like this:

```text
TRAP assertion at 0801
```

The number is the address in the program where the check failed. Chapter 15 shows how to turn that address back into a line of your source.

## Changing the calculation

What would `total` hold if you repeated the calculation after changing the subtotal? Each assignment reads the values that exist at the moment it runs, so a second calculation reads the new subtotal:

```basie
total = subtotal + postage
subtotal = 200
total = subtotal + postage
assert total = 215
```

The first calculation stores 135. The second reads 200 and 15 and replaces the stored total with 215. Nothing changes until execution reaches a statement that changes it.

Here are two changes to try. Predict the result of each before you build and run it.

1. Change the initial postage to 20, keeping the original single calculation before the subtotal changes. The assertions should now expect a subtotal of 200 and a total of 140. If you leave `assert total = 135` in place, the program stops with an assertion trap, because that condition is no longer true.
2. Move `subtotal = 200` above the calculation. The total then becomes 215, so `assert total = 135` fails until you change it to expect 215. Once it does, the program prints `215`.

## Summary

- A variable is named storage with a fixed type. Its value can change and its type can't.
- `u16` holds whole numbers from 0 through 65,535 in two bytes, the Z80's natural working size.
- Program variables hold their starting values before `main` begins and last for the whole run.
- Assignment copies a value into its destination. Changing an input afterwards leaves an earlier result unchanged.
- `assert` states what should be true at a point in the run and stops the program with a trap if it isn't.
- Formatting turns a number into text in a string with a fixed capacity, and `writeLine` sends that text to the console.
