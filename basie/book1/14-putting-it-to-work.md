---
title: "Putting It to Work"
parent: "Programming Basie"
nav_order: 14
nav_exclude: true
search_exclude: true
---

# Putting It to Work

The program in this chapter is a small command-processing utility. It reads a command, works out a result, stores that result in a job record allocated from a pool and prints a report. It also has to handle an unknown command, a number it can't parse and a full pool.

None of the parts is new, but the program uses every kind of storage the book has covered. It has copied scalars, local strings, read-only and mutable aliases, owned pool records and a lease. The program is correct only if each one does the right job.

## The utility's behaviour

The utility understands one command, `double`, followed by a number. `double 123` creates a job numbered 246. `double nope` is rejected as an invalid number. The pool holds two jobs, so a third valid command is rejected because the queue is full. The program runs four commands, and `double 3` creates a second job without printing anything. The other three each print a line:

```text
Result: 246
Invalid number
Queue full
```

The commands are written into the program as string literals so that every run follows the same paths and the assertions can check them. Reading them from the keyboard instead is a small change, shown at the end of the chapter.

## Three stages

The work is split into three routines, each with one job:

1. `execute` turns a command into a number. It parses and checks, and allocates nothing.
2. `createJob` turns a number into a job. It calls `execute`, then allocates.
3. `reportJob` turns a job into a line of text on the console. It reads the job and changes nothing.

Each stage's declaration says what it does with its data.

```basie
sub execute(text: string[]): u16 fails CommandError
sub createJob(text: string[]): jobs fails CommandError
sub reportJob(item: Job) fails CommandError
```

`execute` reads a command through a read-only alias and returns a copied number. `createJob` reads a command and returns an owner, a new job that the caller is responsible for. `reportJob` reads a `Job` record, which callers supply by leasing it from their owner. All three can fail, and each declaration says so with `fails CommandError`. That enum lists everything that can go wrong with a command, from `unknownCommand` to `queueFull`, so the whole utility reports its failures in one vocabulary.

## Parsing the command

`execute` is the routine from Chapter 12. It copies the command's first word into a local `string[8]` and its second into a local `string[16]`, using `word` from the library. If the first word isn't `double`, it fails with `CommandError.unknownCommand`. If there's no second word, it fails with `CommandError.missingArgument`. It converts the second word with `parseU16`, which fails with `ParseError.badNumber` if the text isn't a number that fits a `u16`; `execute` handles that and fails with `CommandError.badNumber`.

The two local strings exist only while `execute` runs. They're the routine's scratch space for taking the command apart, and they end when `execute` returns. The `u16` it returns is a copy, safe for the reasons Chapter 3 gave.

The program accepts the first two words and ignores anything after them. To reject extra text, `execute` could call `word` a third time and fail if it finds anything. That choice concerns the command language, not memory.

## A valid number can still be too large

`parseU16` guarantees a number from 0 to 65,535, but twice that number might not fit. In a `u16`, 40,000 doubled would wrap around to 14,464, and the program would carry on with a wrong answer and no complaint. To prevent this, `execute` checks the value before it multiplies:

```basie
if value > 32767
    fail CommandError.badNumber
end

return value * 2
```

The largest accepted input is 32,767, which doubles to 65,534. Basie's safety rules leave this check to you. Wrapping stays inside the variable's own memory, so it's a correctness problem rather than a safety problem.

## Creating the owned result

`createJob` calls `execute`, passing any failure straight on. It tries to allocate only after it has a number:

```basie
var number = try execute(text)
var candidate = new? jobs(number)
select move candidate
case some(allocated)
    return move allocated
case none
    fail CommandError.queueFull
end
```

If allocation succeeds, `return move allocated` transfers ownership of the new job to the caller. The returned value is a fresh owner, so the caller can bind it to a variable without writing `move`. The job survives the end of `createJob` because it lives in the pool rather than in `createJob`'s activation.

If the pool is full, `createJob` fails with `CommandError.queueFull` and no job is made. The caller receives either a fully initialised job that it owns or nothing at all.

Parsing comes first and allocation second, so a bad command never takes a slot from the pool, even briefly.

## Reporting without consuming

`reportJob` takes its `Job` parameter as a read-only alias. When `main` passes its owner, as in `reportJob(first)`, the call leases the record. The routine reads the job number while `main` keeps ownership.

The writing is done by `writeReport`, which builds the text in a local `string[32]` with `append` and `appendU16` and sends it to the console with `writeText`. Any of those calls could fail with an `IoError`, if the string ran out of room or the console failed. `reportJob` calls `writeReport` and handles such a failure by failing with `CommandError.cannotReport`, so the rest of the program deals only in `CommandError`. `say` does the same for the program's other messages. The local string ends when `writeReport` returns, but the job survives because neither routine ever owned it.

![Command parsing returns a copied number, job creation transfers ownership, and reporting uses a temporary lease.](../../assets/images/basie-book/book1/utility-flow.svg)

## A failed replacement keeps the old job

The second command in `main` assigns a new job to `first`, an owner that already holds job 246:

```basie
first = createJob("double nope") handle code
    assert code = CommandError.badNumber
    assert first.number = 246
    try say("Invalid number\r\n")
end
```

If `createJob` succeeded, the assignment would release job 246 and store the new job in its place. Here `createJob` fails because `nope` isn't a number. Chapter 7 showed that a failed call skips its assignment, and here that rule protects real data. `first` still owns job 246, and the handler checks exactly that before printing its message.

The fourth command is the same shape with a different failure. By then `main` owns two jobs, `first` with 246 and `second` with 6, and the pool is full. `createJob("double 7")` parses its command, tries to allocate and finds no slot, so it fails with `CommandError.queueFull`. The assignment to `second` is skipped, and `second` still owns job 6.

This works because `createJob` allocates the new job *before* the old one would be released. As Chapter 10 explained, the old job is safe if anything goes wrong, but a successful replacement briefly needs a spare slot. To free the old job first, a program must assign `none` to the owner before it calls `createJob`. A failure would then leave the owner with no job at all.

The handlers check the error code *and* the state of the owner. A program that printed the right messages with the wrong jobs in its pool would pass a test that only looked at the output.

## The complete source

<<< @/basie/book1/examples/CAPSTONE.BSI{basie}

The table traces `main` one step at a time:

| Step | `first` | `second` | Pool | Output |
| --- | --- | --- | --- | --- |
| `createJob("double 123")` | job 246 | not yet declared | 1 of 2 used | |
| `reportJob(first)` | job 246 | not yet declared | 1 of 2 used | `Result: 246` |
| `createJob("double nope")` fails | job 246 | not yet declared | 1 of 2 used | `Invalid number` |
| `createJob("double 3")` | job 246 | job 6 | 2 of 2 used | |
| `createJob("double 7")` fails | job 246 | job 6 | 2 of 2 used | `Queue full` |
| `main` ends | released | released | 0 of 2 used | |

When `main` finishes, its two owners end and both jobs are released. The program has no cleanup code, free list or special error path. Every exit from every routine releases exactly what it owned.

## Reading real input

The fixed commands make every path repeatable. A real utility would read commands from the user, which adds a stage at the front. `main` declares a `string[32]`, fills it with `prompt` or `readLine` and passes it to `createJob` in place of the literal. Nothing else changes, because `createJob` and `execute` take a read-only `string[]`. That parameter accepts a string literal or a string variable of any capacity, and job ownership works as before.

## Extending the utility

Add a `square` command that squares its argument. The largest input whose square fits in a `u16` is 255, so fail with `CommandError.badNumber` above it. Keep recognising the command separate from checking the number, so that an unknown command and a bad number still give different codes. The new operation should leave job creation, reporting and release unchanged.

Then add a way to remove a finished job before accepting another command. Decide what should happen if the new command then fails. Should the old job be gone regardless, or kept until a new one is ready? Write it both ways, and trace the jobs and their owners through each.

## Summary

- Splitting work into stages with clear interfaces makes each stage's use of storage visible in its declaration.
- Scratch storage, such as the local strings in `execute`, ends with its routine. Only the returned copy survives.
- Check the range of a value before arithmetic that could wrap.
- Allocate only after all checks have passed, so a rejected request never uses a slot.
- A routine can return a fresh owner. The new record outlives the routine because it lives in the pool.
- A failed call skips its assignment, so an owner keeps its old record when a new one can't be made.
- Releasing records needs no cleanup code. Every exit from every routine releases what it owns.
