---
title: "A Place for Everything"
parent: "Programming Basie"
nav_order: 12
nav_exclude: true
search_exclude: true
---

# A Place for Everything

The readings analyser in Chapter 11 is about forty lines long, plus the library routines it imports. A command-driven utility needs routines to split a line into words and to turn words into numbers. It also needs routines to build its reports and code that ties them together. In one file it's hard to find anything, and hard to reuse the useful pieces in the next program.

Basie splits a program into **source parts**, separate files combined into one compilation.

## Including parts

A part names the other parts it depends on with `include` lines at its very start:

```basie
include "BOARD.BSI"
include "SCORE.BSI"
```

The compiler processes each included part before the declarations that follow. The routines and constants it declares are then available to the rest of the file. A part can have `include` lines of its own. Each part is compiled only once, however many parts name it. A part that ends up including itself, directly or through others, is reported as an error.

The `include` lines must come before any declarations in the file, so the dependencies always come first and the code that uses them follows.

## Importing library modules

The standard library comes as five compiled **modules**. They are `STRINGS.BSM`, `FORMAT.BSM`, `PARSE.BSM`, `RANDOM.BSM` and `TEXTIO.BSM`. A part brings in a module with an `import` line. `import` lines go among the `include` lines, before the first declaration:

```basie
import "TEXTIO.BSM"
import "STRINGS.BSM"
include "BOARD.BSI"
```

The two kinds of line differ in when the code is compiled. An included part is compiled with your program, every time you build it. An imported module was compiled once, earlier. The compiler reads only a short list of the module's routines, constants and types. The linker later adds the code of the routines your program calls.

Imports aren't passed on. `FORMAT.BSM` and `TEXTIO.BSM` both import `STRINGS.BSM`, but importing `FORMAT.BSM` declares only the names from `FORMAT`. A program that calls `append` or `find` imports `STRINGS.BSM` itself. The `import` lines of a part therefore name every module it uses. The disk still needs `STRINGS.BSM` for a program that imports only `FORMAT.BSM`, because `FORMAT.BSM` uses it. Importing the same module twice does no harm.

Use `include` for the parts of your own program and `import` for the library. A program can still include a library part's source, such as `TEXTIO.BSI`. The compiler then compiles that source again in every build.

## One program, in order

Parts organise the source but put no walls between its pieces. The compiler reads all the parts as one stream of declarations, in order, and the ordinary rules apply across the boundaries. A name must be declared before it is used, whether its declaration is in the same part or an earlier one. Public names from every part share one space, so two parts can't both declare a public routine called `parse`.

The interfaces between parts are the routine declarations you already know. A routine's parameters show what it copies, what it reads and what it changes. Its result type shows what it returns, and `fails` shows whether it can fail, and which codes it can fail with. Moving a routine into a different file leaves all of that the same, including lifetimes and ownership.

## Keeping helpers private

A part often has helper routines that only make sense inside it, and `private` keeps them there:

```basie
private sub blank(b: u8): boolean
    return b = ' ' or b = 9
end
```

A private declaration can be used only within its own part. Other parts can't call it, and its name stays out of the shared space. The standard library has two private routines called `blank`, in the sources of `STRINGS` and `PARSE`. They never conflict, and a module doesn't declare its private names in a program that imports it.

`private` works on routines, constants, variables, records, enums and pools. It controls where a name can be used and nothing more. Code that can see a record type can still see its fields, and a private item is stored like any other.

## A command parser

This program imports four library modules to interpret a short command:

<<< @/basie/book1/examples/COMMAND.BSI{basie}

`execute` takes a command such as `double 123` as a read-only open string. It uses `word` from `TEXTIO.BSM` to copy the first word into the local string `command`. Then it checks with `<>` that the word is `double`. It copies the second word into `argument` and uses `parseU16` from `PARSE.BSM` to turn it into a number.

`execute` fails with its own enum, `CommandError`, because the things that can go wrong with a command are its own: an unknown command, a missing argument or a bad number. The routines it calls fail with other enums. `word` fails with `IoError`, as the services do, and `parseU16` fails with `ParseError`. `try` can't pass those on from a routine that fails with `CommandError`, so `execute` handles each one and fails with the `CommandError` member that says what went wrong for the command. A failure never leaves `execute` as something its caller didn't ask for.

The declarations show how the data moves through the calls. The command text reaches `execute` as a read-only alias. `word` also reads the text through a read-only alias, and it fills in `command` or `argument` through a mutable alias. `parseU16` reads `argument` through a read-only alias and returns a copied `u16`. When `execute` returns, its two local strings end, and only the copied number reaches `main`.

The first command in `main`, `double 123`, succeeds and prints `Result: 246`. The second, `double nope`, fails inside `parseU16`, and `execute` turns that `ParseError` into `CommandError.badNumber`. The handler in `main` checks the code and prints `Invalid number`. Because the call failed, the assignment to `result` never happened, so `result` still holds 246.

## Reaching the console

A Basie program has no direct access to the hardware. It can't read a port, write to a screen address or call the operating system itself. It reaches the console, the printer, files, the disk drives and everything else outside the program through **services**. A service is a routine supplied by the runtime, and it's called like any other routine:

```basie
try writeText(console, report)
```

`console` is a predeclared value of type `File` that stands for the terminal. `report` is passed to a read-only `string[]` parameter. `writeText` writes the string's bytes, respecting its length, and keeps no access to it after the call. Like any routine, a service that can fail is declared `fails`, with `IoError` as its failure enum, so every call needs `try` or `handle`.

A string literal can be passed straight to a read-only string parameter:

```basie
try writeText(console, "Ready\r\n")
```

The carriage return and line feed at the end finish the line on CP/M. The literal is a counted string like any other, with no zero byte marking its end.

The console services work at two levels. At the bottom, `readInputByte` and `writeOutputByte` move single bytes and `readLine` reads an edited line. Everything above that, including `writeLine`, `prompt` and all the number formatting, is ordinary Basie source in the library. You can read it and change it.

Terminal control sequences, such as the codes that clear the screen or move the cursor, are ordinary bytes to Basie. You write them like any other text, and the terminal interprets them.

## Files

`File` values also identify open disk files. The runtime has services that open a file for reading, writing or appending and close it again. Others transfer bytes, blocks and lines. Still others check whether a file exists, delete or rename a file and search a directory. Failures are members of `IoError`, such as `IoError.fileNotFound`, `IoError.diskFull` and `IoError.endOfInput`.

A `File` is a value, not an owner. It can be copied and stored like a number, and copying it doesn't open the file twice. Your program closes a file explicitly by calling `close`. When the program ends, the runtime closes any that are still open. A `File` that has been closed stays closed. Any service given it fails with `IoError.fileClosed`, and it can never end up referring to another file opened later. Pools release their records automatically, but nothing closes a file when a variable goes out of scope.

## Failures from two sources

A routine that reads a number from the console calls two routines that can fail. `prompt` fails with an `IoError`, and `parseU16` fails with a `ParseError`. `execute` handled each one and failed with a `CommandError` member instead. That suits a caller that needs only the command's own codes. Other callers need the original code, such as `IoError.endOfInput` at the end of the input.

A **failure set** combines failure enums into one type:

```basie
type LoadFailure = fails IoError, ParseError
```

The members of `LoadFailure` are the members of `IoError` and `ParseError`. A routine can name the set after `fails` in the same way as an enum. One rule then covers `try`, `fail` and `handle`: a routine passes on anything its set names.

```basie
sub readCount(): u16 fails LoadFailure
    var line: string[16]
    try prompt("> ", var line)
    var count = try parseU16(line)
    return count
end
```

`LoadFailure` names both `IoError` and `ParseError`, so `try` passes either failure on. The code keeps its own enum on the way, so the caller still sees `IoError.endOfInput` or `ParseError.badNumber`.

A variable of type `LoadFailure` can receive any of these codes. A handler can deal with some members and pass the rest on:

```basie
count = readCount() handle why
    select why
    case ParseError.badNumber
        continue
    case IoError.endOfInput
        exit
    case else
        fail why
    end
end
```

A `select` on a set takes members of any of its enums. Without `case else`, it must name every member of every enum in the set. Here `case else` covers the other members of `IoError`, and `fail why` passes them on. That works because `main` fails with `LoadFailure` as well.

This program adds up the numbers typed at the console and skips lines such as `nope`:

<<< @/basie/book1/examples/TOTAL.BSI{basie}

Given the lines `12`, `nope` and `15`, the program prints `Total: 27`. The line `nope` fails in `parseU16`, and the loop skips it. On CP/M you end the input by typing Control-Z at the start of a line. `prompt` then fails with `IoError.endOfInput`, and the loop ends.

A set can also name another set. This one holds every code of `LoadFailure` and of `CommandError`:

```basie
type ReportFailure = fails LoadFailure, CommandError
```

The rule goes by the names in the list. A routine that fails with `ReportFailure` can `try` a call to `readCount`, because the list names `LoadFailure`. A set declared as `fails IoError, ParseError` under another name holds the same enums but doesn't name `LoadFailure`. The compiler rejects `try readCount()` in a routine that fails with it, with a `failure-domain` diagnostic.

## The trusted boundary

Basie's safety rules cover your source but not the services, the runtime or CP/M itself. These are trusted to respect the bounds of every string and array passed to them. They must also honour read-only parameters and keep no access after a call returns.

Basie keeps that boundary small. Most of what a program needs, from formatting numbers to parsing commands, is written in Basie and checked like the rest of your code. Only the operations that need the operating system are services. A new device or operating-system feature needs a new service with a typed contract of its own. There's no way to call arbitrary machine code from Basie source.

## Things to try

Take the `sum` routine from Chapter 9 and put it in a part of its own named `SUMS.BSI`. Include that part in a small program that uses `sum`. Then give `sum` a private helper, perhaps one that widens a byte to `u16`. The program behaves exactly as before, but the main program can't call the helper.

In `TOTAL.BSI`, remove the `case else` arm. The compiler now rejects the `select`, because it doesn't name every member of `IoError`.

In `COMMAND.BSI`, change `"double nope"` to `"triple 4"`. The handler's assertion `problem = CommandError.badNumber` now fails, because the code is `CommandError.unknownCommand`. Change both checks to `unknownCommand`, in the handler and after it. The program then runs to the end again.

## Summary

- `include` lines at the start of a part name the parts it depends on. Each part is compiled once.
- `import` lines name compiled modules. An included part is compiled with your program, and an imported module was compiled once, earlier.
- Imports aren't passed on, so a program imports every module whose names it uses.
- All parts form one program, read in order. Names are declared before use across part boundaries.
- `private` limits a declaration to its own part. Private helpers in different parts don't conflict.
- The library modules `STRINGS.BSM`, `FORMAT.BSM`, `PARSE.BSM`, `RANDOM.BSM` and `TEXTIO.BSM` are compiled from ordinary Basie source.
- Programs reach the console and files only through services, called like routines.
- `File` identifies the console, the printer or an open file. It's copied like a value and closed explicitly.
- A failure set, such as `type LoadFailure = fails IoError, ParseError`, combines failure enums. A routine passes on anything its set names.
- A `select` on a set needs `case else` unless it names every member of every enum in the set.
- The services and the runtime are trusted to respect the bounds and permissions of what they're given.
