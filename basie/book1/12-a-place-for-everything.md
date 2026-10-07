---
title: "A Place for Everything"
parent: "Programming Basie"
nav_order: 12
nav_exclude: true
search_exclude: true
---

# A Place for Everything

The readings analyser in Chapter 11 is about forty lines long, plus the library routines it includes. A command-driven utility needs routines to split a line into words and to turn words into numbers. It also needs routines to build its reports and code that ties them together. In one file it's hard to find anything, and hard to reuse the useful pieces in the next program.

Basie splits a program into **source parts**, separate files combined into one compilation.

## Including parts

A part names the other parts it depends on with `include` lines at its very start:

```basie
include "PARSE.BSI"
include "TEXTIO.BSI"
include "FORMAT.BSI"
```

The compiler processes each included part before the declarations that follow. The routines and constants it declares are then available to the rest of the file. A part can have `include` lines of its own. `FORMAT.BSI` and `TEXTIO.BSI` both include `STRINGS.BSI`, for instance. Each part is compiled only once, however many parts name it. A part that ends up including itself, directly or through others, is reported as an error.

The `include` lines must come before any declarations in the file, so the dependencies always come first and the code that uses them follows.

## One program, in order

Parts organise the source but put no walls between its pieces. The compiler reads all the parts as one stream of declarations, in order, and the ordinary rules apply across the boundaries. A name must be declared before it is used, whether its declaration is in the same part or an earlier one. Public names from every part share one space, so two parts can't both declare a public routine called `parse`.

The interfaces between parts are the routine declarations you already know. A routine's parameters show what it copies, what it reads and what it changes. Its result type shows what it returns, and `fails` shows whether it can fail. Moving a routine into a different file leaves all of that the same, including lifetimes and ownership.

## Keeping helpers private

A part often has helper routines that only make sense inside it, and `private` keeps them there:

```basie
private sub blank(b as u8) as boolean
    return b = ' ' or b = 9
end
```

A private declaration can be used only within its own part. Other parts can't call it, and its name stays out of the shared space. The standard library has three private routines called `blank`, in `STRINGS.BSI`, `PARSE.BSI` and `TEXTIO.BSI`, and they never conflict.

`private` works on routines, constants, variables, records and pools. It controls where a name can be used and nothing more. Code that can see a record type can still see its fields, and a private item is stored like any other.

## A command parser in three parts

This program uses three library parts to interpret a short command:

<<< @/basie/book1/examples/COMMAND.BSI{basie}

`execute` takes a command such as `double 123` as a read-only open string. It uses `word` from `TEXTIO.BSI` to copy the first word into the local string `command`. Then it uses `equal` from `STRINGS.BSI` to check that the word is `double`. It copies the second word into `argument` and uses `parseU16` from `PARSE.BSI` to turn it into a number. Each step that can fail passes the failure on with `else fail`. `execute` also has two failure codes of its own, for an unknown command and a missing argument.

`badNumber` isn't declared in this file at all. It's a constant from `PARSE.BSI`, the code that `parseU16` fails with when the text isn't a number. `execute` uses it for a number too large to double.

The declarations show how the data moves through the calls. The command text reaches `execute` as a read-only alias. `word` also reads the text through a read-only alias, and it fills in `command` or `argument` through a mutable alias. `parseU16` reads `argument` through a read-only alias and returns a copied `u16`. When `execute` returns, its two local strings end, and only the copied number reaches `main`.

The first command in `main`, `double 123`, succeeds and prints `Result: 246`. The second, `double nope`, fails inside `parseU16`. The handler in `main` checks the code and prints `Invalid number`. Because the call failed, the assignment to `result` never happened, so `result` still holds 246.

## Reaching the console

A Basie program has no direct access to the hardware. It can't read a port, write to a screen address or call the operating system itself. It reaches the console, the printer, files, the disk drives and everything else outside the program through **services**. A service is a routine supplied by the runtime, and it's called like any other routine:

```basie
writeText(console, report) else fail
```

`console` is a predeclared value of type `File` that stands for the terminal. `report` is passed to a read-only `string[]` parameter. `writeText` writes the string's bytes, respecting its length, and keeps no access to it after the call. Like any routine, a service that can fail is declared `fails`, so every call needs `else fail` or `handle`.

A string literal can be passed straight to a read-only string parameter:

```basie
writeText(console, "Ready\r\n") else fail
```

The carriage return and line feed at the end finish the line on CP/M. The literal is a counted string like any other, with no zero byte marking its end.

The console services work at two levels. At the bottom, `readInputByte` and `writeOutputByte` move single bytes and `readLine` reads an edited line. Everything above that, including `writeLine`, `prompt` and all the number formatting, is ordinary Basie source in the library. You can read it and change it.

Terminal control sequences, such as the codes that clear the screen or move the cursor, are ordinary bytes to Basie. You write them like any other text, and the terminal interprets them.

## Files

`File` values also identify open disk files. The runtime has services that open a file for reading, writing or appending and close it again. Others transfer bytes, blocks and lines. Still others check whether a file exists, delete or rename a file and search a directory. Failures are reported as named codes such as `fileNotFound`, `diskFull` and `endOfInput`.

A `File` is a value, not an owner. It can be copied and stored like a number, and copying it doesn't open the file twice. Your program closes a file explicitly by calling `close`. When the program ends, the runtime closes any that are still open. A `File` that has been closed stays closed. Any service given it fails with `fileClosed`, and it can never end up referring to another file opened later. Pools release their records automatically, but nothing closes a file when a variable goes out of scope.

## The trusted boundary

Basie's safety rules cover your source but not the services, the runtime or CP/M itself. These are trusted to respect the bounds of every string and array passed to them. They must also honour read-only parameters and keep no access after a call returns.

Basie keeps that boundary small. Most of what a program needs, from formatting numbers to parsing commands, is written in Basie and checked like the rest of your code. Only the operations that need the operating system are services. A new device or operating-system feature needs a new service with a typed contract of its own. There's no way to call arbitrary machine code from Basie source.

## Things to try

Take the `sum` routine from Chapter 9 and put it in a part of its own named `SUMS.BSI`. Include that part in a small program that uses `sum`. Then give `sum` a private helper, perhaps one that widens a byte to `u16`. The program behaves exactly as before, but the main program can't call the helper.

In `COMMAND.BSI`, change `"double nope"` to `"triple 4"`. The handler's assertion `code = badNumber` now fails, because the code is `unknownCommand`. Change both checks of `badNumber` to `unknownCommand`, in the handler and after it. The program then runs to the end again.

## Summary

- `include` lines at the start of a part name the parts it depends on. Each part is compiled once.
- All parts form one program, read in order. Names are declared before use across part boundaries.
- `private` limits a declaration to its own part. Private helpers in different parts don't conflict.
- The library parts `STRINGS.BSI`, `FORMAT.BSI`, `PARSE.BSI` and `TEXTIO.BSI` are ordinary Basie source.
- Programs reach the console and files only through services, called like routines.
- `File` identifies the console, the printer or an open file. It's copied like a value and closed explicitly.
- The services and the runtime are trusted to respect the bounds and permissions of what they're given.
