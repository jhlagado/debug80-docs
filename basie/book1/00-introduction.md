---
title: "Introduction"
parent: "Programming Basie"
nav_order: 0
nav_exclude: true
search_exclude: true
---

# Introducing the Basie language

*Few notes. Make them count.*

A Z80 machine running CP/M has 64K of memory, and the operating system keeps part of that for itself. Whatever is left has to hold your program, its data and the stack its routines run on. There is no virtual memory behind it and no operating system watching for a stray write. If a program writes past the end of a buffer, the bytes land in whatever sits next to it: another variable, a return address or the program's own code.

The languages of the CP/M era each struck a different bargain with that machine. BASIC was friendly and safe but interpreted, so it was slow and spent its memory on the interpreter. Pascal brought structure and static types, but its `new` and `dispose` left you to decide when a record could safely be thrown away. C and assembly gave you speed and complete control, along with complete responsibility for every pointer.

Basie compiles to native Z80 code, checks its types before the program runs and has a memory model in which a program can't reach outside an object or touch storage after that storage's lifetime has ended. It does this without a garbage collector and without hiding the cost of anything from you. Its guiding principle is short:

> What can be known before the program runs should be decided before it runs. The machine should pay at run time only for what can't be known any earlier.

The name is BASIC with the C dropped, and a nod to Count Basie, the bandleader famous for playing very few notes and making every one of them count.

## Four questions

This book teaches you to write Basie programs and the way of thinking about storage that makes them safe. Every chapter returns to the same four questions about a piece of data:

- **What is stored?** A number, a record, an array, a string or a handle to a record in a pool.
- **Where does it live?** In program storage for the whole run, in a routine's working storage for the length of a call or in a pool slot for as long as its owner keeps it.
- **Who may read or change it?** A copy belongs entirely to its new variable. Passing a record to a routine gives that routine access to the original, read-only or writable as its parameter declares.
- **When does access end?** A routine's local storage ends when the routine returns. A pool record ends when its owner lets it go. Basie arranges things so that no path to the storage can outlast it.

You already ask these questions whenever you wonder whether changing an object inside a function will change it for the caller. Basie makes the answers visible in the source and checks them.

The book starts small. The first chapter calculates a postage total and prints it. By the end you'll have written a readings analyser that sorts and averages its data, a queue of jobs that come and go within a fixed number of slots and a small command-processing utility that parses input, allocates a record for its result and reports it. You'll also learn why each of those programs is safe, and that reasoning carries over to programs of your own.

## The reader

You should already be comfortable with variables, conditions and loops in some language. JavaScript, Python or a structured BASIC is plenty. You don't need to know C or Pascal, and you don't need any experience with pointers or manual memory management. Where those ideas help, the book explains them from scratch.

You also don't need to know Z80 assembly. Basie compiles straight to machine code, and you can read that code if you're curious, but nothing in this book depends on it.

## Programs, traces and exercises

Each chapter is built around a complete program that compiles and runs. Most chapters begin with a small task, show the code that does it and follow the values through the program step by step. Tables and diagrams trace what each variable holds at each point, and the programs themselves check those traces with `assert` statements. An assertion states what should be true at that point in the run. If it's wrong, the program stops and reports it, so a program that runs to completion has confirmed every prediction it makes.

Most chapters end with changes to try. These are small edits whose outcome you can predict before you run them: a different input, a reordered statement, an extra call. Predicting first and then checking is the quickest way to find out whether your picture of the program matches the machine's.

The chapters fall into four parts:

1. **Values and calls** (Chapters 1 to 4). Variables and types, checked conversions and bounds, routines with their own working storage and the difference between copying a record and handing a routine access to it.
2. **Ownership** (Chapters 5 to 7). Pools of records that outlive the routine that creates them, the single owner responsible for each one, temporary loans of a record and the control flow that selects what happens next.
3. **Working with collections** (Chapters 8 to 11). Arrays and strings with fixed capacities, routines that accept arrays of any length, a changing queue of jobs and the numeric types for real calculations.
4. **Whole programs** (Chapters 12 to 15). Splitting source into parts, the limits on nested calls, a complete utility and what to do when a build fails or a program traps.

## Tools and status

To run the examples on CP/M you need the Basie toolchain on your disk: the compiler `BASIE.COM` with its `BASIE.OVL` and `BASIE.MSG` files, the linker `BLINK.COM` and the runtime library `CPM22.BRL`. Programs that print or read text also need the source library parts they include, such as `FORMAT.BSI`, `TEXTIO.BSI` and `STRINGS.BSI`. A real Z80 machine works, and so does an emulator such as Triptych, which has its own [CP/M primer](../../triptych/cpm/index.md). Chapter 1 walks through the first build and Chapter 15 explains the files in more detail.

Every complete example in this book has been compiled with Basie's reference compiler and run as Z80 code under a CP/M test harness, with its assertions and printed output checked. The native compiler that runs on CP/M itself is still being completed. At the time of writing it doesn't yet accept every ownership form used in Chapters 5 to 7, 10 and 14, so those examples may need the reference toolchain until it catches up.

## A note on terms

Basie uses a few words in specific ways. Each is defined where it's first needed, and this table collects them for reference:

| Term | Meaning |
| --- | --- |
| **alias** | A routine's access to a record, array or string that belongs to someone else. It lasts for the call. |
| **ticket** | A read-only alias, the kind a parameter without `var` provides. |
| **pool** | A fixed number of slots for records of one type, used for data that comes and goes. |
| **handle** | A value that refers to a pool slot. |
| **owner** | The one handle responsible for a pool record. When the owner goes away, the record is released. |
| **move** | Handing ownership to a new place, written `move x`. The old place is left empty. |
| **lease** | Temporary access to a record that the caller still owns, for the length of a call. |
| **identifier** | A non-owning handle that can be kept and checked later, written `id(h)`. |
| **trap** | A safety check that stops the program before an invalid operation can happen. |

The chapters are meant to be read in order, because each one adds to the storage picture of the one before.
