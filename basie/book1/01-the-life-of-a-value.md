---
title: "The Life of a Value"
parent: "Programming Basie"
nav_order: 1
nav_exclude: true
search_exclude: true
---

# The Life of a Value

Suppose an order costs 120 units and postage costs another 15. You want the amount due, and you want to keep that figure while you start work on the next order. That's about as small as a useful program gets. It shows Basie's most basic idea: a variable is a named piece of storage, and assignment puts a value into it.

## The first declaration

```basie
var subtotal as u16 = 120
```

The line has four parts. `var` declares a variable, a place whose contents can change, and `subtotal` is its name. The type after `as` sets what kind of value the storage holds. The value after `=` is what it holds to begin with.

The type here is `u16`, an unsigned sixteen-bit integer. It holds whole numbers from 0 through 65,535 and occupies two bytes. Sixteen bits is the Z80's natural working size, because the Z80 can add two 16-bit numbers in a single instruction. You'll use `u16` more than any other type. Basie has smaller and larger integer types as well, and Chapter 2 sets them out. Every figure in this chapter fits comfortably in a `u16`.

The type is a fixed part of the variable. Once `subtotal` is declared as `u16`, it holds a `u16` for the whole run. Basie checks every use against that type at compile time. The running program never needs to test what kind of value the variable holds.

## The complete program

We need three variables: the subtotal, the postage and the total. This program calculates the total, then changes the subtotal as if a new order had come in:

<<< @/basie/book1/examples/01-postage.BSI{basie}

The three declarations at the top sit outside any routine, which makes them **program variables** (global variables in some languages). They receive their starting values before the program begins, and their storage lasts for the whole run.

`sub main()` begins the routine where execution starts. `sub` introduces any routine, `main` is the routine the runtime calls first, and the empty parentheses mean it takes no arguments. Everything down to the matching `end` is the routine's body.

The word `fails` after the parentheses and the `else fail` at the end of two lines concern errors. Printing can go wrong on a real machine. Basie requires every call that can fail to say what happens when it does. `else fail` means "if this call fails, pass the failure on". Here the failure passes out of `main` to the runtime, which reports it. Chapter 7 explains failures in full.

The two `include` lines at the top bring in library source for formatting numbers and writing lines of text. The program uses these routines to print its result.

## Calculating and storing a result

The first statement in `main` calculates the amount due:

```basie
total = subtotal + postage
```

Basie evaluates the right-hand side first. It adds the current value of `subtotal` (120) to the current value of `postage` (15). The assignment then stores the result, 135, in `total` in place of its starting zero.

The next statement changes the subtotal:

```basie
subtotal = 200
```

Now `subtotal` holds 200, and `total` still holds 135. The earlier assignment stored the result of the addition at the moment it ran. A spreadsheet cell would hold the formula `subtotal + postage` and recalculate it when the inputs change. A variable holds only the number.

![Two separate storage cells after calculating the total and changing the subtotal.](../../assets/images/basie-book/book1/scalar-copy.svg)

Each box in the diagram is a separate piece of storage. Writing 200 into `subtotal` affects that box alone. The finished total stays put while you prepare the next order.

Here's the trace one statement at a time:

| Point in execution | `subtotal` | `postage` | `total` |
| --- | ---: | ---: | ---: |
| Before the first statement | 120 | 15 | 0 |
| After calculating the total | 120 | 15 | 135 |
| After changing the subtotal | 200 | 15 | 135 |

## Copies, not connections

A single number such as 135 is a **scalar value**. Basie's scalars are the integers, the floating-point numbers and the Booleans `true` and `false`. A scalar is always copied when it moves. Assignment copies it into the destination, and passing it to a routine copies it into the routine's parameter. A routine that returns a scalar copies it back to the caller.

So two variables that hold the same number are still two separate objects. If `total` and some other variable both held 135, a new value in one would leave the other alone.

For single numbers this is obvious. Records and arrays are less clear, because a routine can receive access to the original object instead of a copy. Chapter 4 draws that distinction, and every later chapter depends on keeping the two cases apart.

## Checking a prediction

The two assertions after the assignments check the state we just traced:

```basie
assert subtotal = 200
assert total = 135
```

`assert` takes a condition. Inside a condition, `=` compares two values for equality and stores nothing, so `total = 135` is true when `total` holds 135. A true condition lets execution carry on. A false one stops the program at once with an assertion trap.

These two lines turn the trace table into something the machine checks. Suppose the new subtotal had somehow altered `total` as well. The second assertion would then fail, and the program would stop with a report instead of printing its answer. A run that reaches the end has confirmed both predictions. The examples throughout this book use assertions the same way.

## Putting a number on the screen

The number 135 in `total` is a binary value in two bytes. To show it on the screen, the program needs the three characters `1`, `3` and `5`. Turning the number into those characters is a separate job, and Basie does it with ordinary library routines.

The `include` lines at the top make two library parts available. `FORMAT.BSI` contains routines that convert numbers to text, and `TEXTIO.BSI` contains routines for writing lines. They're written in Basie, and their source is compiled along with yours. The last three lines of `main` use them:

```basie
var report as string[16]
appendU16(report, total) else fail
writeLine(console, report) else fail
```

The first line declares a local variable, `report`, inside `main`. Its type is `string[16]`, an empty string with room for up to sixteen bytes. The sixteen is a capacity, fixed when the string is declared, and nothing can write past it. Chapter 8 covers strings in full.

`appendU16` takes a copy of the number in `total` and appends its decimal digits to `report`. If the string didn't have room for the digits, `appendU16` would report a failure rather than write beyond the string's end. Three digits fit easily into sixteen bytes.

`writeLine` sends the string's contents to `console`, followed by a carriage return and a line feed. `console` is the program's standard connection to the terminal. On a CP/M machine that's normally the keyboard and screen, or a serial terminal. Your program never deals with hardware ports or device addresses. It passes text to the console and the runtime handles the device.

The program prints one line:

```text
135
```

Both routines use `report` only for the length of their calls and keep no access to it once they return. Later chapters look closely at this kind of temporary access, once routines share records and arrays.

## Building and running the program

Save the listing as `POSTAGE.BSI` on your CP/M disk. The disk needs the toolchain: `BASIE.COM` with its companion files `BASIE.OVL` and `BASIE.MSG`, the linker `BLINK.COM` and the runtime library `CPM22.BRL`. The program includes `FORMAT.BSI` and `TEXTIO.BSI`, so those files need to be there too. Both of them include `STRINGS.BSI`, so the disk needs that as well.

Two commands build the program and run it:

```text
A>BASIE POSTAGE
A>POSTAGE
135
A>
```

The first command compiles `POSTAGE.BSI` and links the result into `POSTAGE.COM`, a CP/M program you can run on its own. The second command runs it. Both assertions pass, the program prints `135` and CP/M shows its prompt again.

If an assertion fails, you see a trap report instead of the result, something like this:

```text
TRAP assertion at 0801
```

The number is the address in the program where the check failed. Chapter 15 shows how to turn that address back into a line of your source.

## Changing the calculation

Each assignment reads the values that exist at the moment it runs. A second calculation after `subtotal = 200` therefore reads the new subtotal:

```basie
total = subtotal + postage
subtotal = 200
total = subtotal + postage
assert total = 215
```

The first calculation stores 135. The second reads 200 and 15 and replaces the stored total with 215. A variable keeps its value until execution reaches a statement that writes to it.

Try the two changes below, and predict the result of each before you build and run it.

1. Set the initial postage to 20, and keep the original single calculation before `subtotal = 200`. The assertions should now expect a subtotal of 200 and a total of 140. If you leave `assert total = 135` in place, the program stops with an assertion trap, because that condition is no longer true.
2. Move `subtotal = 200` above the calculation. The total then becomes 215, so `assert total = 135` fails until you change it to expect 215. Once it does, the program prints `215`.

## Summary

- A variable is named storage with a fixed type. Its value can change and its type can't.
- `u16` holds whole numbers from 0 through 65,535 in two bytes, the Z80's natural working size.
- Program variables hold their starting values before `main` begins and last for the whole run.
- Assignment copies a value into its destination. Changing an input afterwards leaves an earlier result unchanged.
- `assert` states what should be true at a point in the run and stops the program with a trap if it isn't.
- Formatting turns a number into text in a string with a fixed capacity, and `writeLine` sends that text to the console.
