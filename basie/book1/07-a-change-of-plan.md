---
title: "A Change of Plan"
parent: "Programming Basie"
nav_order: 7
nav_exclude: true
search_exclude: true
---

# A Change of Plan

Every example so far has run straight through from top to bottom, but real programs have to react. The pool may already be full when a new job arrives. A number typed by the user may not be a number at all. A list of readings is processed one at a time, and the loop may need to stop early.

Basie's `if`, `select`, `while` and `for` work much as they do in other languages. Basie also requires ownership to come out right on every path. Whichever way the program goes, each live record still has exactly one owner and each owner is released exactly once. Operations that may fail in normal use have their own mechanism, and every caller must deal with it.

## Choosing a path

`if` runs a block of statements when a Boolean condition is true:

```basie
if direction > 0
    observed = 1
elseif direction < 0
    observed = 2
else
    observed = 3
end
```

The conditions are tested in order, and only the block of the first true one runs. If none is true, the `else` block runs. A chain may have any number of `elseif` clauses. Both `elseif` and `else` are optional, and a single `end` closes the whole chain.

Each block is a scope of its own. A local declared inside an arm exists only while that arm runs. An owner declared there is released when the arm finishes, unless it was moved somewhere else first.

## Selecting on a value

When the choice depends on a single integer or enum value, `select` is clearer than a chain of comparisons:

```basie
select direction
case -1
    observed = observed + 10
case 0
    observed = observed + 20
case else
    observed = observed + 30
end
```

`select` evaluates `direction` once and runs the arm whose label matches. A label can be a single constant, a list such as `case 1, 3, 5` or a range such as `case 'A' to 'Z'`. `case else` catches every value the other labels don't cover. A `select` must have it unless its labels cover every value of the type, so a value with no arm never passes unnoticed; an empty `case else` says that the other values do nothing. The compiler reports an error if two labels cover the same value.

A `select` on an enum usually names every member and needs no `case else`:

```basie
select signal
case Light.red
    wait = 3
case Light.amber
    wait = 1
case Light.green
    wait = 0
end
```

If someone later adds a member to `Light`, this `select` stops compiling until it handles the new member. An empty `case else` says on purpose that the other values need no action:

```basie
select key
case 'q'
    finished = true
case else
end
```
 An arm never falls through into the next. C's forgotten `break` has no equivalent in Basie.

Both statements appear in this example:

<<< @/basie/book1/examples/04-decisions.BSI{basie}

`direction` is -1, so the `if` sets `observed` to 2 and the `select` adds 10, leaving 12.

## Trying an allocation

Chapter 5's `new` treats a full pool as a bug and traps. When a full pool is a normal outcome, use `new?` instead. It returns an **optional owner**: either an owning handle or `none`.

```basie
var candidate = new? HJob(9)
```

The type of `candidate` is `HJob?`, read as "maybe an `HJob` owner". An optional owner might be empty, so you can't reach a record through it directly. Use `select` to find out which it is:

```basie
select move candidate
case some(job)
    observed = job.number
case none
    observed = 0
end
```

`select move` takes the handle out of `candidate`, leaving it empty, and tests what it took. If there was a handle, the `some` arm runs and `job` is its owner. `job` is an ordinary non-optional owner, so the arm can reach the record through it. When the arm ends, `job` is released unless the arm moves it somewhere else. If `candidate` was empty, the `none` arm runs and has nothing to release.

`select move` can also take a fresh value directly, as in `select move new? HJob(9)`. The `some` arm then owns the new record, and no variable is needed.

When the pool is full, `new?` doesn't evaluate its arguments at all. So if an argument would move an owner into the new record, that owner stays exactly where it was. An allocation consumes an owner only when it has room to keep it.

## Selecting without moving

Plain `select`, without `move`, leaves ownership where it is:

```basie
select spare
case some(job)
    observed = job.number
case none
    observed = 0
end
```

`spare` still owns the record, before, during and after the arm. In the `some` arm, `job` is a weak handle to the record, of type `weak HJob`, as in Chapter 6. The arm can read and write the record's fields through `job`, with a check at every access, but it can't lend the record. `spare` is an ordinary variable inside the arm. If the arm overwrites `spare` or moves its owner away, the record is released. The next access through `job` then traps with `stale-handle`.

Plain `select` on a weak handle, as in Chapter 6, gives its arm a weak handle in the same way.

## Lending what you select

To lend the record to a routine, the arm needs an owner. `select move` provides one, but the arm then owns the record and releases it at the end. To keep the record, the arm moves the owner back where it came from:

```basie
select move spare
case some(job)
    incrementJob(var job)
    spare = move job
case none
end
```

`job` is the arm's own non-optional owner, so `incrementJob(var job)` lends its record as in Chapter 6. The line `spare = move job` puts the owner back. If you forget that line, the program still compiles. `spare` was emptied by `select move`, and `job` releases the record when the arm ends. The record is gone, and `spare` is `none`.

Use plain `select` to look at or change a record where it is. Use `select move` to take ownership into the arm. If the record should survive, the arm must store the owner somewhere before it ends.

## Both outcomes in one program

This program has a pool with a single slot. It fills the slot, tries for a second and then tries again once the first has gone. It then selects the record without moving it, lends it and puts it back:

<<< @/basie/book1/examples/CONTROL.BSI{basie}

The `if true` makes a block, so `first` has a shorter lifetime than `main`. The slot therefore comes free partway through. Inside the block, `new HJob(7)` takes the only slot. `new? HJob(9)` finds the pool full and returns `none`, so the `none` arm sets `observed` to 1. When the block ends, its local `first` goes away and job 7 is released.

Outside the block, the second `new?` finds the slot free, and `spare` owns job 9. The plain `select` reads 9 through the weak handle `job`, and `spare` keeps the record. The `select move` lends the record to `incrementJob` and puts it back, so the last `select` reads 10.

## Repeating work

`while` repeats a block as long as a condition is true, testing the condition before each pass:

```basie
while value <= 0
    value = value + 1
end
```

`for` steps a counter through a range. The counter must be an integer local declared earlier in the routine:

```basie
var index: u16
for index = 0 until 4
    // process one position
end
```

`until` stops before the bound, so this counts 0, 1, 2 and 3, the indexes of a four-element array. `to` includes the bound, so `for index = 1 to 4` counts 1, 2, 3 and 4. A `step` sets a different increment, which may be negative, as in `for index = 10 to 0 step -2`. The step must be a constant and can't be zero.

The start and the bound are evaluated once, before the first pass. The counter is read-only inside the loop, so the body can't upset the count. The loop stops with a `loop-range` trap if the next value would continue the loop but doesn't fit the counter's type. This trap replaces the silent wrap-round that would otherwise keep the loop running forever.

In either kind of loop, `continue` skips to the next pass and `exit` leaves the loop. Locals declared in a loop body are created afresh on every pass. Owners among them are released at the end of each pass, even one ended early by `continue` or `exit`.

Here are both loops and both early exits together:

<<< @/basie/book1/examples/05-loops.BSI{basie}

The `for` loop counts from -3 to 3 in steps of 2, which gives -3, -1, 1 and 3. The body adds one at -3 and at 1, skips the addition at -1 with `continue` and leaves the loop at 3 with `exit`. That makes 2. `firstPositive(-2)` then counts its copy of the value up from -2 to 1 and returns 1, bringing the total to 3.

## Failures you expect

Some operations fail for reasons that aren't bugs. The user might type `nope` where a number was wanted. A file might be missing, or a string might be too short for the digits. Basie requires the program to deal with each of these.

A routine that can fail says so with `fails` at the end of its declaration, followed by the enum its error codes come from. Inside it, `fail` ends the routine with one of that enum's members instead of a normal result:

```basie
type ValueError = enum
    negative
end

sub positive(value: i8): u8 fails ValueError
    if value < 0
        fail ValueError.negative
    end
    return u8(value)
end
```

Every call to a failable routine must say what to do if it fails. There are exactly two choices, and the first is to pass the failure on with `try`:

```basie
var result: u8 = try positive(value)
```

If `positive` fails, the routine containing this line fails too, with the same code. That routine must be declared `fails ValueError` itself, so the possibility of failure, and its kind, is visible in every signature it passes through. This is the `try` you've been writing since Chapter 1. It goes directly before the call, and the call must be the whole statement, the whole initializer or the whole right side of an assignment.

The second is to handle the failure on the spot with `handle`:

```basie
var code: ValueError
observed = checked(-1) handle code
    if code = ValueError.negative
        observed = 107
    end
end
```

If the call succeeds, the assignment happens as usual and the handler block is skipped. If it fails, there is no assignment, so the destination keeps whatever it held before. The error code is stored in `code` and the handler block runs. `code` must be a variable of the failure's enum, declared beforehand. Chapter 14 relies on that guarantee to protect a job that's already stored.

Here's the complete program:

<<< @/basie/book1/examples/13-errors.BSI{basie}

`positive` fails with `ValueError.negative`, and `checked` passes the failure on. `main` handles it, so `observed` is set to 107. Suppose `main` passed the failure on instead and nothing handled it. The program would then end with a report of the code's position in its enum, such as `FAIL 0`.

Each kind of failure has its own enum. The runtime's services fail with the predeclared `IoError`, whose members include `IoError.endOfInput` and `IoError.fileNotFound`, and the standard library's number parsing fails with `ParseError`. `try` passes a failure on only within the same enum or to a failure set that names it. A file error therefore never turns up where only a parsing error was expected. A routine can still pass on a failure of another kind. It can handle the failure and fail with a member of its own enum, or it can fail with a failure set. Chapter 12 shows both.

## Failures and traps

Basie separates two kinds of things that go wrong.

A **failure** is an outcome the program is expected to deal with. It comes from a `fail` statement in your code or in a library routine or service. It travels back through `try` until a `handle` catches it.

A **trap** means the program has tried to do something invalid. Examples are an index out of bounds, a conversion that doesn't fit, an access through a stale weak handle and a false assertion. A trap stops the program on the spot. Nothing can catch a trap, including `handle` and `try`. The program has a bug at that point, and any further work would use bad data.

## Things to try

In `CONTROL.BSI`, delete the line `spare = move job` and predict which assertion fails. The record is released at the end of the `select move` arm, so the last `select` takes its `none` arm and `observed` is 0.

Change the pool capacity in `CONTROL.BSI` to 2. The allocation inside the `if` block now succeeds, so `observed` becomes 9 instead of 1. Change the first `assert observed = 1` to match. Sketch the owners at the end of each arm and at the end of the `if` block. The program now takes different paths, but every live record still has exactly one owner at each point.

In `05-loops.BSI`, change `step 2` to `step 1` and work out the new total before you run it.

## Summary

- `if`, `elseif` and `else` choose between blocks by Boolean conditions. Each block is its own scope.
- `select` chooses by an integer or enum value, with single labels, lists and ranges, and `case else`, which it needs unless its labels cover every value. Arms never fall through.
- `new?` returns `none` instead of trapping when the pool is full, and evaluates no arguments in that case.
- `select move` takes ownership of an optional owner, or a fresh `new?`, into its `some` arm. The arm releases the record at its end unless it moves the owner on or back.
- Plain `select` leaves ownership where it is. Its `some` arm names the record through a weak handle, checked at every access, which can't be lent.
- `while` repeats while a condition holds. `for` counts with `until` or `to`, an optional constant `step` and a read-only counter that never wraps.
- `continue` starts the next pass and `exit` leaves the loop. Owners in the body are released at the end of every pass.
- A `fails` routine names the enum of its failures and reports them with `fail`. Every call either passes the failure on with `try` or handles it with `handle`. `try` needs the same enum or a failure set that names it.
- A trap is not a failure. It stops the program and can't be caught.
