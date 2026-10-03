---
title: A first program
parent: Programming Skate
nav_order: 1
nav_group: First programs
prev:
  text: Introduction
  link: /skate/book1/00-introduction
next: false
---

[Skate](../) · [Book overview](./)

# A first program

A purchase costs 120 cents and postage costs another 15 cents. We can calculate
the total with a small program and print it at the CP/M terminal. This gives us
a complete edit, compile and run session with an answer we can check ourselves.

## Your work disk

Use a writable CP/M disk containing `EDIT.COM`, `SKATE.COM` and `SKATE.RT`.
The [Skate browser starter](https://jhlagado.github.io/Skate/) provides an older
release with the facilities used here. On that setup, B is the writable work
disk. At the CP/M prompt, enter:

```text
B:
DIR
```

`B:` selects the drive. `DIR` lists its files so you can check that the three
tools are present. The `B>` prompt identifies the selected drive. CP/M prompts
shown in transcripts are printed by the operating system and are not part of
the command you type.

## Write the source

To create the program, enter:

```text
EDIT POSTAGE.SK8
```

Type these three expressions in the editor:

<<< @/skate/book1/examples/POSTAGE.SK8{scheme}

The first expression prints the text inside the quotation marks. In the second
expression, `(+ 120 15)` adds the two numbers. `write` prints the resulting
135. The last expression prints a newline so the next terminal output begins
on a fresh line.

A procedure call places its procedure first, followed by its arguments inside
parentheses. `+` takes the two numbers as arguments. The outer call to `write`
takes the result of that addition. The parentheses show which calculation
belongs inside which call.

Press Ctrl-S to save the source and Ctrl-Q to return to CP/M. These are Control
key combinations on a Mac as well. The source file is `POSTAGE.SK8`; its name
has seven letters and its extension has three, within CP/M's filename limits.

## Compile and run

Compile the saved source with:

```text
SKATE POSTAGE.SK8
```

After successful compilation, run the generated program by entering its name:

```text
POSTAGE
```

The program output is:

```text
Total: 135
```

CP/M then prints its prompt again. Skate has produced `POSTAGE.COM`, which
contains Z80 machine code and runtime support. It also writes `POSTAGE.NOB`,
the object file. CP/M runs the `.COM` file when you enter `POSTAGE`.

`SKATE.RT` must be available during compilation because the compiler copies
runtime support into the executable. Once compiled, `POSTAGE.COM` can run
without that separate provider file.

## Change the calculation

Run `EDIT POSTAGE.SK8` again and change the postage from 15 to 20. Save, quit
and compile the source again before running `POSTAGE`. The new total is 140.
Saving the source alone leaves the previous executable in place. Recompilation
produces the program that performs the changed calculation.

The editor saves into the emulated disk. Browser persistence and an external
backup are separate operations. Keep a downloaded copy of your work before
clearing browser storage or moving to another computer. Reopening
`POSTAGE.SK8` lets you check that the saved source contains the change.
