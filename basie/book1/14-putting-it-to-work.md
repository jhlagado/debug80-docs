---
title: "Putting It to Work"
parent: "Programming Basie"
nav_order: 14
nav_exclude: true
search_exclude: true
---

# Putting It to Work

The program in this chapter is a small command-processing utility. It reads a command, works out a result, stores that result in a job record allocated from a pool and prints a report. It also has to deal with commands it doesn't understand, numbers that aren't numbers and a pool that has run out of room.

None of the parts is new, but every kind of storage the book has covered is in use at once: copied scalars, read-only and writable aliases, local strings, pool records with owners and a lease. The program is correct only if each one is used for the right job.

## The utility's behaviour

The utility understands one command, `double`, followed by a number. `double 123` creates a job numbered 246. `double nope` is rejected as an invalid number. The pool holds two jobs, so once two exist, a third valid command is rejected because the queue is full. The program runs four commands. One of them, `double 3`, quietly creates a second job, and the other three each print a line:

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
sub execute(text as string[]) as u16 fails
sub createJob(text as string[]) as jobs fails
sub reportJob(item as Job) fails
```

`execute` reads a command through a read-only alias and returns a copied number. `createJob` reads a command and returns an owner, a new job for the caller to be responsible for. `reportJob` reads a `Job` record, which callers supply by leasing it from their owner. All three can fail, and each declaration says so with `fails`.

## Parsing the command

`execute` is the routine from Chapter 12. It copies the command's first word into a local `string[8]` and its second into a local `string[16]`, using `word` from the library. If the first word isn't `double`, it fails with `unknownCommand`. If there's no second word, it fails with `missingArgument`. It converts the second word with `parseU16`, which fails with `badNumber` if the text isn't a number that fits a `u16`.

The two local strings exist only while `execute` runs. They're the routine's scratch space for taking the command apart, and when `execute` returns, they end. The routine returns a `u16`, which is a copy and safe for the reasons Chapter 3 gave.

The program accepts the first two words and ignores anything after them. Rejecting extra words would be easy to add, by calling `word` for a third word and failing if there is one. Whether to do that is a decision about the command language, not about memory.

## A valid number can still be too large

`parseU16` guarantees a number from 0 to 65,535. Doubling it might not fit. Doubling 40,000 in a `u16` would wrap around to 14,464, and the program would carry on with a wrong answer and no complaint. So `execute` checks before it multiplies:

```basie
if value > 32767
    fail badNumber
end

return value * 2
```

The largest accepted input is 32,767, which doubles to 65,534. Basie's safety rules don't make this check for you. Wrapping never touches memory outside the variable, so it's a correctness problem rather than a safety one, and catching it is the program's job.

## Creating the owned result

`createJob` calls `execute`, passing any failure straight on. Only once it has a number does it try to allocate:

```basie
var number = execute(text) else fail
var candidate = new? jobs(number)
select move candidate
case some(allocated)
    return move allocated
case none
    fail queueFull
end
```

If allocation succeeds, `return move allocated` transfers ownership of the new job to the caller. The returned value is a fresh owner, so the caller can bind it to a variable without writing `move`. The job survives the end of `createJob` because it lives in the pool rather than in `createJob`'s activation.

If the pool is full, `createJob` fails with `queueFull` and no job is made. A job either exists, fully initialised and owned by the caller, or it doesn't exist at all.

Parsing comes first and allocation second, so a bad command never takes a slot from the pool, even briefly.

## Reporting without consuming

`reportJob` takes a read-only `Job` parameter. When `main` passes its owner, as in `reportJob(first)`, the call leases the record. The routine reads the job number while `main` keeps ownership.

`reportJob` builds its text in a local `string[32]` using `append` and `appendU16`, each of which could fail if the string ran out of room, and sends it to the console with `writeText`. The local string ends when `reportJob` returns. The job doesn't, because `reportJob` never owned it.

![Command parsing returns a copied number, job creation transfers ownership, and reporting uses a temporary lease.](../../assets/images/basie-book/book1/utility-flow.svg)

## A failed replacement keeps the old job

The second command in `main` assigns a new job to `first`, an owner that already holds job 246:

```basie
first = createJob("double nope") handle code
    assert code = badNumber
    assert first.number = 246
    writeText(console, "Invalid number\r\n") else fail
end
```

If `createJob` succeeded, the assignment would release job 246 and store the new job in its place. But `createJob` fails, because `nope` isn't a number. Chapter 7 said that a failed call skips its assignment, and here that guarantee protects real data. `first` still owns job 246, and the handler checks exactly that before printing its message.

The fourth command is the same shape with a different failure. By then `main` owns two jobs, `first` with 246 and `second` with 6, and the pool is full. `createJob("double 7")` parses its command, tries to allocate and finds no slot, so it fails with `queueFull`. The assignment to `second` is skipped, and `second` still owns job 6.

This works because `createJob` allocates the new job *before* the old one would be released. Chapter 10 explained the trade: the old job is safe if anything goes wrong, but a successful replacement needs a spare slot for a moment. A program that wanted to free the old job first and then try for a new one would have to say so, by assigning `none` to the owner before calling `createJob`. Then a failure would leave it with no job at all.

The handlers check the error code *and* the state of the owner. A program that printed the right messages with the wrong jobs in its pool would pass a test that only looked at the output.

## The complete source

<<< @/basie/book1/examples/CAPSTONE.BSI{basie}

The trace through `main`:

| Step | `first` | `second` | Pool | Output |
| --- | --- | --- | --- | --- |
| `createJob("double 123")` | job 246 | not yet declared | 1 of 2 used | |
| `reportJob(first)` | job 246 | not yet declared | 1 of 2 used | `Result: 246` |
| `createJob("double nope")` fails | job 246 | not yet declared | 1 of 2 used | `Invalid number` |
| `createJob("double 3")` | job 246 | job 6 | 2 of 2 used | |
| `createJob("double 7")` fails | job 246 | job 6 | 2 of 2 used | `Queue full` |
| `main` ends | released | released | 0 of 2 used | |

When `main` finishes, its two owners go away and both jobs are released. There's no cleanup code anywhere in the program, no free list and no special path for the errors. Every way out of every routine releases exactly what it owned.

## Reading real input

The fixed commands make every path repeatable. A real utility would read commands from the user, and that adds one stage at the front: `main` declares a `string[32]`, fills it with `prompt` or `readLine` and passes it to `createJob` in place of the literal. Nothing else changes. `createJob` and `execute` take a read-only `string[]`, so they accept a string literal or a string variable of any capacity, and the ownership of jobs works as before.

## Extending the utility

Add a `square` command that squares its argument. The largest input whose square fits in a `u16` is 255, so fail with `badNumber` above it. Keep recognising the command separate from checking the number, so that an unknown command and a bad number still give different codes. The new operation should leave the creating, reporting and releasing of jobs exactly as it is.

Then add a way to remove a finished job before accepting another command. Decide what should happen if the new command then fails. Should the old job be gone regardless, or kept until a new one is ready? Write it both ways, and trace the jobs and their owners through each.

## Summary

- Splitting work into stages with clear interfaces makes each stage's use of storage visible in its declaration.
- Scratch storage, such as the local strings in `execute`, ends with its routine. Only the returned copy survives.
- Check the range of a value before arithmetic that could wrap.
- Allocate only after all checks have passed, so a rejected request never uses a slot.
- A routine can return a fresh owner. The new record outlives the routine because it lives in the pool.
- A failed call skips its assignment, so assigning a failable result to an owner keeps the old record when the call fails.
- Releasing records needs no cleanup code. Every exit from every routine releases what it owns.
