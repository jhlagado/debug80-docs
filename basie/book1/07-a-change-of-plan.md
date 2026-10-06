---
title: "A Change of Plan"
parent: "Programming Basie"
nav_order: 7
nav_exclude: true
search_exclude: true
---

# A Change of Plan

Every program so far has run straight through from top to bottom. Real programs have to react. The pool may already be full when a new job arrives. A number typed by the user may not be a number at all. A list of readings has to be worked through one at a time, and the work may need to stop early.

This chapter covers Basie's control flow: choosing between paths with `if` and `select`, repeating work with `while` and `for`, and dealing with operations that are expected to fail sometimes. Most of it will look familiar from other languages. The part that's particular to Basie is that ownership has to come out right on every path. Whichever way the program goes, each live record still needs exactly one owner, and each owner still needs to be released exactly once.

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

The conditions are tested in order. The first one that's true has its block run, and the rest are skipped. If none is true, the `else` block runs. There can be any number of `elseif` clauses, and both `elseif` and `else` are optional. A single `end` closes the whole chain.

Each block is a scope of its own. A local declared inside one arm exists only while that arm runs. If it's an owner, it's released when the arm finishes, unless it was moved somewhere else first.

## Selecting on a value

When the choice depends on one integer value, `select` is clearer than a chain of comparisons:

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

`select` evaluates `direction` once and runs the arm whose label matches. A label can be a single constant, a list such as `case 1, 3, 5` or a range such as `case 'A' to 'Z'`. `case else` catches every value the other labels don't cover. No value may be covered by two labels, and the compiler reports any overlap. There's no fall-through from one arm into the next, so there's nothing like C's forgotten `break`.

Both statements appear in this example:

<<< @/basie/book1/examples/04-decisions.BSI{basie}

`direction` is -1, so the `if` sets `observed` to 2 and the `select` adds 10, leaving 12.

## Trying an allocation

Chapter 5's `new` treats a full pool as a bug and traps. When a full pool is a normal outcome, use `new?` instead. It returns an **optional owner**: either an owning handle or `none`.

```basie
var candidate = new? jobs(9)
```

The type of `candidate` is `jobs?`, read as "maybe a `jobs` owner". You can't reach a record through an optional owner directly, because there might not be one. You have to find out first, with `select`:

```basie
select move candidate
case some(job)
    observed = job.number
case none
    observed = 0
end
```

`select move` takes the handle out of `candidate`, leaving it empty, and tests what it took. If there was a handle, the `some` arm runs and `job` is its owner. `job` is an ordinary, non-optional owner for that arm, so you can reach the record through it. When the arm ends, `job` is released unless the arm moves it somewhere else. If there was no handle, the `none` arm runs and there's nothing to release.

There's also a quieter detail about `new?` that turns out to be useful. When the pool is full, it doesn't evaluate its arguments at all. So if one of the arguments moves an owner into the new record, a full pool leaves that owner exactly where it was. The allocation never consumes something it had no room to keep.

## Selecting without moving

`select` without `move`, on an optional owner the routine holds itself, leaves ownership where it is. The `some` arm gets a lease on the record, exactly like the leases in Chapter 6, and the original owner stays responsible. While the arm runs, the owner can't be moved or overwritten, so the record can't end underneath it. Choose `select move` when the arm should take the record over, and plain `select` when it only needs to use it.

## Both outcomes in one program

This program has a pool with a single slot. It fills the slot, tries for a second and then tries again once the first has gone:

<<< @/basie/book1/examples/CONTROL.BSI{basie}

Inside the `if` block, `new jobs(7)` takes the only slot. `new? jobs(9)` finds the pool full and returns `none`, so the `none` arm sets `observed` to 1. When the `if` block ends, its local `first` goes away and job 7 is released. Outside the block, the second `new?` finds the slot free. Its `some` arm reads 9, and when the arm ends, `accepted` is released.

The `if true` looks odd, and in a real program it would be. It's there to make a block, so that `first` has a lifetime shorter than `main` and the slot comes free partway through.

## Repeating work

`while` repeats a block as long as a condition is true, testing the condition before each pass:

```basie
while value <= 0
    value = value + 1
end
```

`for` counts. The counter must be an integer local declared earlier in the routine:

```basie
var index as u16
for index = 0 until 4
    // process one position
end
```

`until` stops before the bound, so this counts 0, 1, 2 and 3. That fits arrays neatly, because an array of four elements has indexes 0 through 3. `to` includes the bound, so `for index = 1 to 4` counts 1, 2, 3 and 4. A `step` sets a different increment, which may be negative, as in `for index = 10 to 0 step -2`. The step must be a constant and can't be zero.

The start and the bound are evaluated once, before the first pass. The counter is read-only inside the loop, so the body can't change it and upset the count. And the counter never wraps around. If the next value would continue the loop but doesn't fit the counter's type, the loop stops with a `loop-range` trap instead of quietly wrapping back to zero and running forever.

Inside either kind of loop, `continue` skips to the next pass and `exit` leaves the loop altogether. Locals declared in a loop body are created afresh on every pass, and owners among them are released at the end of every pass, including passes ended early by `continue` or `exit`.

Here are both loops and both early exits together:

<<< @/basie/book1/examples/05-loops.BSI{basie}

The `for` loop counts from -3 to 3 in steps of 2, which gives -3, -1, 1 and 3. At -3 the body adds one. At -1 it reaches `continue` and skips the addition. At 1 it adds one again. At 3 it reaches `exit` and leaves the loop. That makes 2. `firstPositive(-2)` then counts its copy of the value up from -2 to 1 and returns 1, bringing the total to 3.

## Failures you expect

Some operations fail for reasons that aren't bugs at all. The user types `nope` where a number was wanted. A file isn't there. A string doesn't have room for the digits. A program should handle these, and Basie makes sure it does.

A routine that can fail says so with `fails` at the end of its declaration. Inside it, `fail` ends the routine with an error code, a `u8` value, instead of a normal result:

```basie
const invalidValue = 7

sub positive(value as i8) as u8 fails
    if value < 0
        fail invalidValue
    end
    return u8(value)
end
```

Every call to a failable routine must say what to do if it fails. There are exactly two choices. The first is to pass the failure on, with `else fail`:

```basie
var result as u8 = positive(value) else fail
```

If `positive` fails, the routine containing this line fails too, with the same code. That routine must be declared `fails` itself, so the possibility of failure is visible in every signature it passes through. Nothing propagates silently. This is the `else fail` you've been writing since Chapter 1.

The second choice is to handle the failure on the spot, with `handle`:

```basie
var code as u8
observed = checked(-1) handle code
    observed = 100 + u16(code)
end
```

If the call succeeds, the assignment happens as usual and the handler block is skipped. If it fails, the assignment doesn't happen, the error code is stored in `code` and the handler block runs. `code` must be a `u8` variable declared beforehand. Because a failed call skips the assignment, the destination keeps whatever it held before. That's a guarantee you can build on, and Chapter 14 does.

Here's the whole thing:

<<< @/basie/book1/examples/13-errors.BSI{basie}

`positive` fails with code 7. `checked` passes the failure on. `main` handles it, so `observed` is set to 100 plus 7, or 107. If `main` passed a failure on instead and nothing handled it, the program would end with a report of the code, such as `FAIL 7`.

Error codes are plain numbers, and constants give them names. By convention, codes 1 to 31 belong to the runtime's services, 32 to 47 to the standard library and 48 upwards to your programs, so codes from different sources don't collide.

## Failures and traps

There are two kinds of things that can go wrong in a Basie program, and they're treated very differently.

A **failure** is an outcome the program is expected to deal with. It comes from a `fail` statement, either in your code or in a library routine or service, and it travels back through `else fail` until a `handle` deals with it.

A **trap** means the program has tried to do something invalid: an index out of bounds, a conversion that doesn't fit, an access through a stale identifier, a false assertion. A trap stops the program on the spot. `handle` and `else fail` don't catch traps, and nothing else does either. The program has a bug at that point, and carrying on would mean carrying on with bad data.

So a failure leaves the program with a choice about what to do next, and a trap ends the run.

## Things to try

Change the pool capacity in `CONTROL.BSI` to 2. The allocation inside the `if` block now succeeds, so `observed` becomes 9 instead of 1 and the first `assert observed = 1` needs to change to match. Sketch the owners at the end of each arm and at the end of the `if` block. The paths are different now, and every live record still has one owner at every point.

In `05-loops.BSI`, change `step 2` to `step 1` and work out the new total before you run it.

## Summary

- `if`, `elseif` and `else` choose between blocks by Boolean conditions. Each block is its own scope.
- `select` chooses by an integer value, with single labels, lists and ranges, and `case else`. Arms never fall through.
- `new?` returns `none` instead of trapping when the pool is full, and evaluates no arguments in that case.
- `select move` takes ownership of an optional handle into its `some` arm. Plain `select` leases the record instead.
- `while` repeats while a condition holds. `for` counts with `until` or `to`, an optional constant `step` and a read-only counter that never wraps.
- `continue` starts the next pass and `exit` leaves the loop. Owners in the body are released at the end of every pass.
- A `fails` routine reports expected failures with `fail`. Every call either passes the failure on with `else fail` or handles it with `handle`.
- A trap is not a failure. It stops the program and can't be caught.
