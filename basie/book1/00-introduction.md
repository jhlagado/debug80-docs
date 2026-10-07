---
title: "Introduction"
parent: "Programming Basie"
nav_order: 0
nav_exclude: true
search_exclude: true
---

# Introducing the Basie language

*Few notes. Make them count.*

A Z80 machine running CP/M has 64K of memory, and the operating system keeps part of that for itself. Whatever is left has to hold your program, its data and the stack its routines run on. The machine has no virtual memory and no guard against a stray write. A program that writes past the end of a buffer overwrites whatever sits next to it: another variable, a return address or the program's own code.

The languages of the CP/M era each struck a different bargain with that machine. BASIC was friendly and safe, but it was interpreted. It ran slowly and spent its memory on the interpreter. Pascal brought structure and static types, but its `new` and `dispose` left you to decide when a record could safely be thrown away. C and assembly gave you speed and complete control, along with complete responsibility for every pointer.

Basie compiles to native Z80 code and checks its types before the program runs. Its memory model keeps a program inside each object and away from storage whose lifetime has ended. Basie needs no garbage collector for this, and every cost stays visible to you. Its guiding principle is this:

> What can be known before the program runs should be decided before it runs. The machine should pay at run time only for what can't be known any earlier.

The name is BASIC with the C dropped. It also nods to Count Basie, the bandleader famous for playing very few notes and making every one of them count.

## Four questions

In this book you learn to write Basie programs and the way of thinking about storage that makes them safe. The same four questions about a piece of data run through every chapter:

- **What is stored?** A number, a record, an array, a string or a handle to a record in a pool.
- **Where does it live?** In program storage for the whole run, in a routine's working storage during a call or in a pool slot while its owner keeps it.
- **Who may read or change it?** A copy belongs entirely to its new variable. Passing a record to a routine gives that routine access to the original, read-only or writable as its parameter declares.
- **When does access end?** A routine's local storage ends when the routine returns. A pool record ends when its owner lets it go. Basie arranges things so that no path to the storage can outlast it.

You already ask these questions when you wonder whether a change a function makes to an object reaches the caller. Basie makes the answers visible in the source and checks them.

The first chapter starts small, with a program that calculates a postage total and prints it. By the end you'll have written three larger programs. A readings analyser sorts and averages its data. A job queue runs jobs that come and go within a fixed number of slots. A small command-processing utility parses input, allocates a record for its result and reports it. You'll also learn why each of those programs is safe, and that reasoning carries over to programs of your own.

## The reader

You should already be comfortable with variables, conditions and loops in some language. JavaScript, Python or a structured BASIC is plenty. You don't need to know C or Pascal or have any experience with pointers or manual memory management. The book explains those ideas from scratch where they help.

Basie compiles straight to machine code, and you can read that code if you're curious. You don't need to know Z80 assembly, though, because nothing in this book depends on it.

## Programs, traces and exercises

Each chapter is built around a complete program that compiles and runs. Most chapters begin with a small task, show the code that does it and follow the values through the program step by step. Tables and diagrams show what each variable holds at each point. The programs check these values with `assert` statements. An assertion states what should be true at that point in the run. A false assertion stops the program with a report. A program that runs to completion has therefore confirmed every prediction it makes.

Most chapters end with changes to try. These are small edits whose outcome you can predict before you run them: a different input, a reordered statement, an extra call. Predicting first and then checking is the quickest way to find out whether your picture of the program matches the machine's.

The chapters fall into four parts:

1. **Values and calls** (Chapters 1 to 4). Variables and types, checked conversions and bounds, routines with their own working storage and the difference between copying a record and giving a routine access to it.
2. **Ownership** (Chapters 5 to 7). Pools of records that outlive the routines that create them, the single owner of each record, temporary loans of a record and the control flow that selects what happens next.
3. **Working with collections** (Chapters 8 to 11). Arrays and strings with fixed capacities, routines that accept arrays of any length, a changing queue of jobs and the numeric types for real calculations.
4. **Whole programs** (Chapters 12 to 15). Splitting source into parts, the limits on nested calls, a complete utility and what to do when a build fails or a program traps.

## Tools and status

To run the examples on CP/M, you need the Basie toolchain on your disk. That means the compiler `BASIE.COM` with its `BASIE.OVL` and `BASIE.MSG` files, the linker `BLINK.COM` and the runtime library `CPM22.BRL`. Programs that print or read text also need the source library parts they include, such as `FORMAT.BSI`, `TEXTIO.BSI` and `STRINGS.BSI`. A real Z80 machine works, and so does an emulator such as Triptych, which has its own [CP/M primer](../../triptych/cpm/index.md). Chapter 1 walks through the first build and Chapter 15 explains the files in more detail.

Every complete example in this book has been compiled with Basie's reference compiler. Each one has run as Z80 code under a CP/M test harness, with its assertions and printed output checked. The native compiler that runs on CP/M itself is still being completed. At the time of writing, it rejects some ownership forms used in Chapters 5 to 7, 10 and 14. Those examples may need the reference toolchain until the native compiler catches up.

## A note on terms

Basie uses a few words in specific ways. Each is defined where it's first needed, and this table collects them for reference:

| Term | Meaning |
| --- | --- |
| **alias** | A routine's access to a record, array or string that belongs to someone else. It lasts for the call and is read-only unless the parameter is marked `var`, which makes it a **mutable alias**. |
| **pool** | A fixed number of slots for records of one type, used for data that comes and goes. |
| **handle** | A value that refers to a pool slot. |
| **owner** | The one handle responsible for a pool record. When the owner goes away, the record is released. |
| **move** | Handing ownership to a new place, written `move x`. The old place is left empty. |
| **lease** | Temporary access to a record that the caller still owns, for the length of a call. |
| **identifier** | A non-owning handle that can be kept and checked later, written `id(h)`. |
| **trap** | A safety check that stops the program before an invalid operation can happen. |

The chapters are meant to be read in order, because each one builds on the storage picture of the one before.
