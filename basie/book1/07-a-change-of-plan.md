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

When the choice depends on a single integer value, `select` is clearer than a chain of comparisons:

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

`select` evaluates `direction` once and runs the arm whose label matches. A label can be a single constant, a list such as `case 1, 3, 5` or a range such as `case 'A' to 'Z'`. `case else` catches every value the other labels don't cover. The compiler reports an error if two labels cover the same value. An arm never falls through into the next. C's forgotten `break` has no equivalent in Basie.

Both statements appear in this example:

<<< @/basie/book1/examples/04-decisions.BSI{basie}

`direction` is -1, so the `if` sets `observed` to 2 and the `select` adds 10, leaving 12.

## Trying an allocation

Chapter 5's `new` treats a full pool as a bug and traps. When a full pool is a normal outcome, use `new?` instead. It returns an **optional owner**: either an owning handle or `none`.

```basie
var candidate = new? jobs(9)
```

The type of `candidate` is `jobs?`, read as "maybe a `jobs` owner". An optional owner might be empty, so you can't reach a record through it directly. Use `select` to find out which it is:

```basie
select move candidate
case some(job)
    observed = job.number
case none
    observed = 0
end
```

`select move` takes the handle out of `candidate`, leaving it empty, and tests what it took. If there was a handle, the `some` arm runs and `job` is its owner. `job` is an ordinary non-optional owner, so the arm can reach the record through it. When the arm ends, `job` is released unless the arm moves it somewhere else. If `candidate` was empty, the `none` arm runs and has nothing to release.

When the pool is full, `new?` doesn't evaluate its arguments at all. So if an argument would move an owner into the new record, that owner stays exactly where it was. An allocation consumes an owner only when it has room to keep it.

## Selecting without moving

Plain `select` on an optional owner that the routine holds leaves ownership where it is. The `some` arm gets a lease on the record, as in Chapter 6, and the original owner stays responsible for it. While the arm runs, the owner can't be moved or overwritten. The record therefore stays alive for as long as the arm uses it. Choose `select move` to pass ownership into the arm, and plain `select` to leave the record with its owner.

## Both outcomes in one program

This program has a pool with a single slot. It fills the slot, tries for a second and then tries again once the first has gone:

<<< @/basie/book1/examples/CONTROL.BSI{basie}

The `if true` makes a block, so `first` has a shorter lifetime than `main`. The slot therefore comes free partway through. Inside the block, `new jobs(7)` takes the only slot. `new? jobs(9)` finds the pool full and returns `none`, so the `none` arm sets `observed` to 1. When the block ends, its local `first` goes away and job 7 is released. Outside the block, the second `new?` finds the slot free. Its `some` arm reads 9, and `accepted` is released when the arm ends.

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

A routine that can fail says so with `fails` at the end of its declaration. Inside it, `fail` ends the routine with an error code, a `u8` value, instead of a normal result:

```basie
const invalidValue = 7

sub positive(value: i8): u8 fails
    if value < 0
        fail invalidValue
    end
    return u8(value)
end
```

Every call to a failable routine must say what to do if it fails. There are exactly two choices, and the first is to pass the failure on with `try`:

```basie
var result: u8 = try positive(value)
```

If `positive` fails, the routine containing this line fails too, with the same code. That routine must be declared `fails` itself, so the possibility of failure is visible in every signature it passes through. This is the `try` you've been writing since Chapter 1. It goes directly before the call, and the call must be the whole statement, the whole initializer or the whole right side of an assignment.

The second is to handle the failure on the spot with `handle`:

```basie
var code: u8
observed = checked(-1) handle code
    observed = 100 + u16(code)
end
```

If the call succeeds, the assignment happens as usual and the handler block is skipped. If it fails, there is no assignment, so the destination keeps whatever it held before. The error code is stored in `code` and the handler block runs. `code` must be a `u8` variable declared beforehand. Chapter 14 relies on that guarantee to protect a job that's already stored.

Here's the complete program:

<<< @/basie/book1/examples/13-errors.BSI{basie}

`positive` fails with code 7, and `checked` passes the failure on. `main` handles it, so `observed` is set to 100 plus 7, or 107. Suppose `main` passed the failure on instead and nothing handled it. The program would then end with a report of the code, such as `FAIL 7`.

Error codes are plain numbers, named by constants. By convention codes 1 to 31 belong to the runtime's services, 32 to 47 to the standard library and 48 upwards to your programs. Codes from different sources therefore don't collide.

## Failures and traps

Basie separates two kinds of things that go wrong.

A **failure** is an outcome the program is expected to deal with. It comes from a `fail` statement in your code or in a library routine or service. It travels back through `try` until a `handle` catches it.

A **trap** means the program has tried to do something invalid. Examples are an index out of bounds, a conversion that doesn't fit, an access through a stale identifier and a false assertion. A trap stops the program on the spot. Nothing can catch a trap, including `handle` and `try`. The program has a bug at that point, and any further work would use bad data.

## Things to try

Change the pool capacity in `CONTROL.BSI` to 2. The allocation inside the `if` block now succeeds, so `observed` becomes 9 instead of 1. Change the first `assert observed = 1` to match. Sketch the owners at the end of each arm and at the end of the `if` block. The program now takes different paths, but every live record still has exactly one owner at each point.

In `05-loops.BSI`, change `step 2` to `step 1` and work out the new total before you run it.

## Summary

- `if`, `elseif` and `else` choose between blocks by Boolean conditions. Each block is its own scope.
- `select` chooses by an integer value, with single labels, lists and ranges, and `case else`. Arms never fall through.
- `new?` returns `none` instead of trapping when the pool is full, and evaluates no arguments in that case.
- `select move` takes ownership of an optional handle into its `some` arm. Plain `select` leases the record instead.
- `while` repeats while a condition holds. `for` counts with `until` or `to`, an optional constant `step` and a read-only counter that never wraps.
- `continue` starts the next pass and `exit` leaves the loop. Owners in the body are released at the end of every pass.
- A `fails` routine reports expected failures with `fail`. Every call either passes the failure on with `try` or handles it with `handle`.
- A trap is not a failure. It stops the program and can't be caught.
