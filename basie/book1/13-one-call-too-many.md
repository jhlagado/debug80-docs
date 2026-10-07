---
title: "One Call Too Many"
parent: "Programming Basie"
nav_order: 13
nav_exclude: true
search_exclude: true
---

# One Call Too Many

Chapter 3 gave every routine call its own activation, the working storage for its parameters and locals. When one routine calls another, both activations exist at once. When that routine calls a third, there are three. Every one of them has to fit in memory together, on the stack, alongside the program's code, its program variables and its pools.

On a 64K machine the stack isn't large, and in most languages nothing stops it growing into whatever memory lies below it. A routine that calls itself too deeply in C or assembly keeps writing activations over the program's data until something breaks, often somewhere that looks unrelated. Basie keeps the stack within its bounds, and the routine that makes this hard is one that calls itself.

## Declaring ahead

Basie's compiler reads the source once from top to bottom, and every routine must be declared before it's called. Two routines that call each other can't both meet that rule, because whichever comes first in the file calls one that hasn't been declared yet.

A **forward declaration** gives a routine's complete signature in advance and leaves the body for later:

```basie
forward sub odd(value as u8) as boolean
```

The body comes later, with a short header that names the routine and nothing else:

```basie
sub odd
    if value = 0
        return false
    end
    return even(value - 1)
end
```

The forward declaration is the only place the parameters, result and `fails` are written. The later `sub odd` uses them as they were declared, so the two can never disagree.

A routine that calls itself needs a forward declaration too. While the compiler is reading a routine's body the routine isn't complete, so a call to itself is a call to something unfinished. The rule covers both cases: any call to a routine whose body hasn't been completed must go through a forward declaration.

## Odd and even

This example defines evenness and oddness in terms of each other:

<<< @/basie/book1/examples/12-forwards.BSI{basie}

`even` says that zero is even and that any other number is even if one less is odd. `odd` says the reverse. Because `odd` is declared forward at the top, `even` can call it. By the time `odd`'s body appears, `even` has been fully declared, so `odd` can call `even` directly. `odd(7)` returns `true`, and `observed` becomes 1.

It's a deliberately slow way to test a number, and it builds a long chain of calls.

## The live calls

Calling `odd(7)` calls `even(6)`, which calls `odd(5)`, and so on down to `even(0)`, which returns `true` without calling anything. At that moment eight activations are alive, each with its own `value`:

![Nested calls retain their working storage until their inner calls return.](../../assets/images/basie-book/book1/activation-depth.svg)

The calls then return one at a time in reverse order. Each call's parameter is a separate copy in its own activation, so the eight values of `value`, from 7 down to 0, are all stored at once. A recursive routine's parameters and locals are never a single shared cell that each call overwrites.

The same property keeps aliases safe. While an inner call is running, every outer activation and every local record or array in it is still alive. An alias that an outer routine passed down stays valid until the call that received it returns.

## Iteration or recursion

Factorial makes a good comparison. The factorial of 5 is 5 × 4 × 3 × 2 × 1, which is 120. It can be calculated either way:

<<< @/basie/book1/examples/FACTOR.BSI{basie}

`product` uses a loop. It needs one activation, with one accumulator and one counter, whatever the input. `factorial` uses recursion. `factorial(12)` builds a chain of eleven unfinished calls before the innermost one returns 1 and the multiplications happen as each call returns. Both give 479,001,600 for 12, and the program checks that they agree.

12 is as far as either routine can go. The factorial of 13 is 6,227,020,800, which is larger than a `u32` can hold, and integer arithmetic wraps, as Chapter 11 explained. The useful inputs are 0 to 12, and a real program would check its input against that limit.

The two versions do the same arithmetic with very different amounts of stack. When a loop with an accumulator does the job, as it does here, it's the better choice on a small machine. Recursion is worth its stack when the problem itself is nested, such as walking a tree or parsing an expression with brackets inside brackets. There the chain of unfinished calls is the bookkeeping the problem needs.

## Checking before the next call

Basie lets you write recursion and guarantees that it can't overrun the stack. The guarantee has three parts.

First, when the compiler finishes compiling a routine, it works out the most stack that routine can use. That's its own activation, plus the stack used by any runtime helpers it calls, plus the largest amount needed by any routine it calls in turn. For a routine with no recursion anywhere below it, that figure covers every call it can make.

Second, before startup calls `main`, it checks the figure for `main` against the memory that's actually free. If there isn't room, the program reports that there isn't enough memory and returns to CP/M without running.

Third, the figure can't be calculated in advance for recursion, because the depth of the calls isn't known until the program runs. Recursion must go through a forward declaration, so every cycle of calls passes through at least one forward-declared routine, and each forward-declared routine starts with a check of its own. Before its locals are set up and its body begins, it checks whether the stack it needs would reach into free memory. If it would, the program stops with an `activation-capacity` trap, and no activation is ever written over other storage.

The check runs after the call's arguments have been evaluated. Anything those arguments did, such as calling another routine that changed a variable, has already happened. The trap stops the new call from starting.

Routines that aren't forward-declared don't need the check, because the compiler has already counted their needs into the figure for whoever calls them. Only routines that can recurse pay for the check.

## Two different limits

`activation-capacity` and `pool-full` both mean the program ran out of room, but not the same room. `pool-full` means a pool has no free slot for a new record, and a pool's capacity is fixed when the program is built. `activation-capacity` means the stack has no room for another call. That depends on how deep the calls go at run time and how much memory the program's other storage leaves free.

The two compete for the same memory. Every pool slot, every program variable and every large local buffer takes space the stack could otherwise use, so making a pool bigger can make deep recursion fail sooner. When you plan a program's memory, count the pools, the program variables, the largest locals of the deepest call chain and the depth of any recursion, and make sure they fit together. The `freeMemory` service reports how much space is left between the program's storage and the stack while the program runs.

## Things to try

Change the input of `12-forwards.BSI` to `odd(8)`. 8 is even, so `odd(8)` returns `false`, `observed` stays at 0 and the assertion needs to expect 0. Sketch the chain of calls just before `even(0)` returns, and mark which values are separate copies.

In `FACTOR.BSI`, try `product(13)`. The program compiles and runs, but the multiplication wraps and the result is not 6,227,020,800. `product(13)` agrees with `product(12) * 13` calculated in `u32`, both wrong in the same way. Wrapping is predictable, and a predictable wrong answer is easy to miss.

## Summary

- A forward declaration gives a routine's complete signature ahead of its body. The body uses a short header, `sub name`.
- Any call to a routine whose body isn't complete yet, including recursion, needs a forward declaration.
- Each active call has its own activation. A recursive routine's parameters and locals are separate in every call.
- Iteration with an accumulator needs one activation. Recursion needs one for each unfinished call.
- The compiler works out each routine's stack need. Startup checks the need of `main` before running.
- Every forward-declared routine checks the stack on entry and traps with `activation-capacity` rather than overrun it.
- Pools, program storage and the stack share one memory budget. Plan them together.
