---
title: "Following the Clues"
parent: "Programming Basie"
nav_order: 15
nav_exclude: true
search_exclude: true
---

# Following the Clues

Every program in this book came with a prediction, written down as assertions and trace tables, of what it would do. Sometimes the prediction is wrong, or the program is. When that happens Basie gives you two kinds of evidence: a diagnostic from the compiler when the source breaks a rule, and a trap report from the running program when an operation can't safely go ahead. Each names a place in the program, and from there you work back to the line that needs to change.

Tracing a trap back to the source uses a file the build writes, so it helps to know what a build produces.

## From source to program

Basie source files use the `.BSI` extension. With the toolchain on your disk, one command builds a program:

```text
A>BASIE CAPSTONE
```

`BASIE.COM` compiles `CAPSTONE.BSI`, along with every part it includes, and writes intermediate files. If compilation succeeds, it starts the linker, `BLINK.COM`, which combines the compiled code with the runtime helpers it needs from `CPM22.BRL` and writes `CAPSTONE.COM`. The compiler's companions, `BASIE.OVL` and `BASIE.MSG`, hold the less used parts of the compiler and the text of its messages, and they must come from the same release as `BASIE.COM`.

```text
.BSI source → BASIE compiler → intermediate files → BLINK linker → .COM program
                                                       ↑
                                                  runtime library
```

The compiler generates Z80 machine code directly, so there's no assembler step. The linker places only the routines, data and runtime helpers that the program can reach from `main`. Routines you don't call cost nothing, so including `STRINGS.BSI` for one routine doesn't bring in the rest of it. If you build with the `M` option, as in `BASIE CAPSTONE [M]`, the linker writes a map that lists what it kept and what it removed.

A successful build also writes `CAPSTONE.LIN`, a line table that connects addresses in the program back to lines in the source. It's how a trap's address is traced to a source line.

Typing `CAPSTONE` at the prompt runs the program. A clean build shows that the source passed every check the compiler makes. What happens at run time still depends on the input and on the checks that can only be made while the program runs.

## When the build fails

If the compiler finds a problem, it reports the source file, the line and column where the problem starts, and a message. It then stops without touching the existing output. If `CAPSTONE.COM` was built earlier, it's still there after a failed build, and running it runs the *old* program. Check that a build succeeded before treating a run as evidence about your latest edit.

Start with the position the diagnostic gives, and work out what that operation was meant to do. Most diagnostics in the ownership and access rules come down to a few patterns, each of which you've met in this book:

- *`item` is read-only.* A routine writes through a parameter without `var`. If the routine is meant to change its argument, add `var`. If it's only meant to inspect it, the write is the mistake.
- *An owning handle is moved, not copied: write move.* The source copies an owner. Decide whether the record should really change hands. If so, write `move`. If you only needed to look at the record, pass the owner to a record parameter and lease it instead.
- *A result can't refer to a local.* A routine returns access to its own local storage. Return a copy of the value, or have the caller pass in the storage the result should live in.
- *A name is not declared.* The name is misspelled, or it's declared further down the file. Basie reads the source in order, so move the declaration up or add a forward declaration.
- *Index out of range.* A constant index is outside a constant bound, so the access could never succeed and the compiler rejects it.

In every case the right fix depends on what the program is supposed to do. Adding `var` will make a write compile, but if the routine was meant to be read-only, the program now does something you didn't intend. Adding `move` will make an owner copy compile, but if the code was meant to inspect the job, the job will now be released by a routine that should only have looked at it. A change that gets past the compiler is correct only if it still describes what you meant.

## When a program traps

A trap report names the check that failed and the address in the program where it happened:

```text
TRAP bounds at 02A0
```

The address is the place in the program that called the failing check. To turn it into a source line, run the compiler's lookup mode with the address as an option:

```text
A>BASIE BOUNDS [T=02A0]
```

With option `T`, `BASIE` doesn't compile anything. It reads the line table and prints the source file, line and column of the statement that trapped, followed by the line itself. If the line table is missing, or the program has been rebuilt since the table was written, it says so instead of reporting a wrong line.

Each trap reason points to a particular question about your program:

| Reason | Question to investigate |
| --- | --- |
| `bounds` | Which object was indexed, and what was its length or the string's current length at that moment? |
| `narrowing` | What value was converted, and can the target type hold it? |
| `division-by-zero` | Where did the divisor come from, and should it have been checked first? |
| `loop-range` | What are the counter's type and the loop's bound, and can the counter reach the bound? |
| `float-overflow` | Which floating-point value grew too large, and from what inputs? |
| `stale-handle` | When was the identified record released, and why is the identifier still in use? |
| `pool-full` | Which records still hold slots at this allocation, and should any of them have been released? |
| `activation-capacity` | Which calls are nested at this point, how deep is the recursion and how much memory do pools and buffers take? |
| `ownership-cycle` | Which store would make a record own itself through a chain of records? |
| `assertion` | Which earlier step produced a state different from the one predicted? |

A failure that passes all the way out of `main` without being handled is reported as `FAIL` followed by the error code, such as `FAIL 48`. That's not a trap. Some routine reported an expected failure and nothing in the program handled it. The code identifies the failure. Codes 1 to 31 come from services, 32 to 47 from the standard library and 48 upwards from your program's own constants.

## After a trap

A trap stops the program at the failing operation. That operation stores nothing, and nothing after it runs. Everything that happened before it has already happened, so output that was printed stays printed.

A trap doesn't run any of the program's release logic either. The automatic releases of Chapter 5 belong to normal returns and expected failures, which leave routines through their ends. A trap doesn't leave routines at all. It ends the program. The runtime does tidy up files on the way out. Files opened for appending or updating are closed, so the data already written to them is kept. A file being written with `openWrite` is abandoned instead, and the old file of that name, if there was one, stays as it was. A half-finished replacement never takes the place of a good file.

## Working back from the evidence

A trap tells you where the program detected a problem, which isn't always where the problem started. Take Chapter 1's postage program and change `assert total = 135` to `assert total = 215`, leaving the calculation alone. The program traps at that assertion. The assignment is fine. The assertion's expectation is wrong, because the calculation ran before the subtotal changed.

The same reasoning applies to the other traps. For a `bounds` trap, look at the exact object being indexed and its length at that moment. An index of the right type can still be out of range. For a `stale-handle` trap, follow the old record's life and find the point where it was released. The slot now holds a different record, so its contents won't help. For `pool-full`, list the live records at the moment of the allocation. One of them has probably outlived its usefulness.

## Building evidence for a fix

Keep each test small enough to predict. For any routine with an interesting boundary, try an ordinary input, an input right at the boundary and an input that should fail. Use assertions to check the program's internal state and console output to check what the user sees. For a handled failure, check that the program's data is in exactly the state the routine's interface describes, as Chapter 14's handlers did.

When you've made a fix, run the case that failed and the cases that already worked. A fix that gets an ownership error past the compiler by turning an inspection into a consuming call will pass the first test and quietly release a job in the second. The program is correct when it gives the right results *and* every record still has the owner it was meant to have.

## Further reading

This book has covered the language as you need it to write complete programs. The [Basie specification](https://github.com/jhlagado/basie/tree/main/spec) gives the precise rule behind every feature, and the [toolchain documentation](https://github.com/jhlagado/basie/blob/main/docs/toolchain.md) covers every build option, file and lookup mode. The [standard library](https://github.com/jhlagado/basie/blob/main/docs/standard-library.md) document lists every library routine and its failure codes.

The questions from the introduction still apply to every program you write: what is stored, where it lives, who may change it and when access ends. Basie checks the answers. Writing programs whose answers are the ones you intended is still your part of the work.
