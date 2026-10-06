---
title: "Coming and Going"
parent: "Programming Basie"
nav_order: 3
nav_exclude: true
search_exclude: true
---

# Coming and Going

The postage calculation in Chapter 1 worked for one order. A shop has many orders, and writing out the same addition for each of them would be tedious and easy to get wrong. The usual answer is to put the calculation in a routine and call it with each order's figures.

That answer brings a new question with it. A routine needs somewhere to keep its working values while it runs, and those values have to stay separate from the caller's. This chapter looks at where a routine's storage comes from, how long it lasts and what can safely come back out of a routine once it has finished.

## A routine for the calculation

Here's the postage calculation as a routine:

```basie
sub amountDue(amount as u16, shipping as u16) as u16
    var due as u16 = amount + shipping
    amount = 0
    return due
end
```

`sub` begins the declaration and `amountDue` is the routine's name. The names inside the parentheses, `amount` and `shipping`, are its **parameters**, each with a type. The `as u16` after the closing parenthesis declares the type of the result the routine gives back.

A call supplies **arguments** for the parameters, one for each, in order:

```basie
total = amountDue(subtotal, postage)
```

The call copies the value of `subtotal` into `amount` and the value of `postage` into `shipping`, runs the body and hands back the value of `due` as the result of the call. Assignment then stores that result in `total`.

The line `amount = 0` looks pointless, and in a real program it would be. It's there to make something visible. A scalar parameter is a copy of the argument, and the routine is free to change its copy. Setting `amount` to zero changes the routine's copy only. The caller's `subtotal` is untouched, and the program checks that with an assertion.

## A place for each call

Each time a routine is called, it gets fresh working storage for that call. This storage is called an **activation**. It holds the call's parameters and its local variables, which in `amountDue` means `amount`, `shipping` and `due`.

A second call gets a second activation with its own parameters and its own `due`. Nothing carries over from the first call. If one routine calls another, both activations exist at the same time, each with its own storage, until the inner one returns.

![Program storage persists while a routine's parameters and locals exist during its call.](../../assets/images/basie-book/book1/call-lifetime.svg)

The diagram shows two kinds of storage side by side. The program variables at the top last for the whole run. The activation in the middle exists only while `amountDue` is running. When the routine returns, its result is copied out to the caller and the activation ends. The result survives because it's a copy. The storage it was computed in doesn't.

Under the hood the activation lives on the Z80's stack, which grows when a routine is called and shrinks when it returns. You never manage that stack yourself. The compiler works out how much each routine needs, and Chapter 13 shows how Basie makes sure the stack can't grow into other storage.

## Scope and lifetime

Two separate ideas describe a local variable such as `due`, and it pays to keep them apart.

A name's **scope** is the part of the source where you can use that name. `due` can be used from its declaration down to the end of the block it's declared in, which here is the end of the routine.

A piece of storage's **lifetime** is the stretch of the run during which it exists. `due` comes into existence when execution reaches its declaration and gets its initial value then. Its lifetime ends when execution leaves the enclosing block, whether by reaching `end`, by `return` or by any other way out. A local declared without an initial value starts at zero, or the equivalent for its type.

Scope is about the text of the program and lifetime is about the run. A local's scope and lifetime line up neatly, which is why the two are easy to confuse. They come apart once storage can be reached from somewhere other than its name, and from Chapter 4 onwards that happens all the time.

## One name, one meaning

You may have spotted that the routine's parameters are `amount` and `shipping`, not `subtotal` and `postage`. It's a rule, not a style choice. A Basie local or parameter can't reuse a name that is already visible where it is declared, including a program variable, a constant or a built-in service. Many languages allow an inner name to hide an outer one. Basie doesn't, so every use of a name refers to exactly one declaration, and you never have to wonder which `postage` a line means.

Names must also be declared before they are used. The compiler reads the source once, from top to bottom, so a routine must be declared above any routine that calls it. Chapter 13 shows the one exception, for routines that call each other.

## Results that survive a return

A routine with a result type must return a value on every path through its body. If the compiler finds a way to reach the closing `end` without a `return`, it rejects the routine. A routine with no result type, such as `main`, can simply reach its `end`, or use `return` on its own to leave early.

Returning a number is always safe because the caller receives a copy. Returning *access* to the routine's local storage would be a different thing altogether. If a routine handed back a way to reach one of its own local records, the caller would be holding a path into storage whose lifetime had already ended. In C this is the classic dangling pointer: the program reads whatever the stack happens to contain by then, which is usually the working storage of some later call.

Basie rejects this at compile time. Chapter 4 introduces records and the way routines receive access to them, and the reason for this rule will become concrete there. For now, here is the shape of a routine the compiler rejects:

```basie
sub bad() as Pair
    var localPair as Pair
    return localPair
end
```

The compiler reports that "a result can't refer to a local". Chapter 9 shows the routines that *can* return access to a record, because the record they return outlives the call.

## The complete calculation

<<< @/basie/book1/examples/CALLS.BSI{basie}

The first call copies 120 and 15 into the parameters, sets its own copy of `amount` to zero after the addition and returns 135. The assertions confirm that `total` is 135 and that `subtotal` is still 120. The second call passes the constant 200 directly and returns 215. Each call runs the same code with fresh storage, and the second call has no trace of the first one's values.

## The order of arguments

When a call has several arguments, Basie evaluates them from left to right, and each one is finished before the next one starts. That's only noticeable when evaluating an argument has an effect of its own, such as calling a routine that changes a variable. This example makes the order visible:

<<< @/basie/book1/examples/10-routines.BSI{basie}

`mark` appends a digit to `sequence` and returns the digit unchanged. In `choose(mark(2), mark(7))`, the left argument runs first and sets `sequence` to 2, then the right argument sets it to 27. `choose` returns the larger argument, 7, and the final value of `observed` is 7 plus 27, or 34. If the arguments were evaluated right to left, `sequence` would be 72 and the assertion would fail.

## Reading into local storage

Keyboard input gives a routine another useful job, and a reason for a local variable that holds more than one number. A name can be any length up to some limit, so the program reserves room for the longest name it's prepared to accept:

<<< @/basie/book1/examples/ECHO.BSI{basie}

The local `answer` is an empty string with room for thirty-two bytes. `prompt`, a routine from `TEXTIO.BSI`, writes `Name? ` and then reads a line from the keyboard into `answer`. On CP/M the user can correct typing mistakes with the usual line-editing keys before pressing Return. The characters go into the existing string, which grows to hold them. The Return key itself isn't stored.

You could call the input service directly instead of using `prompt`:

```basie
readLine(console, answer) else fail
```

That reads the line without writing a prompt and leaves the cursor where the user's typing finished. `prompt` packages the prompt, the read and a line feed to finish the input line, because CP/M's line editing echoes Return as a carriage return alone. It's an ordinary library routine written in Basie, so you can read its source to see exactly what it does.

The rest of the program writes `Hello, ` without ending the line and then uses `writeLine` to write the stored name and end the line:

```text
Name? Ada
Hello, Ada
```

The input can never overflow `answer`. The runtime gives CP/M the string's capacity as the line limit, and once thirty-two characters have been typed CP/M ends the line as if Return had been pressed. A fixed buffer and an input routine that doesn't check its length are behind a long history of security holes in other languages. Here the string's capacity travels with it into the call, and the input routine works within it.

`answer` lives until `main` returns. `prompt`, `writeText` and `writeLine` each use it during their own calls, and none of them keeps any hold on it afterwards. Two of those calls read it and one writes into it. The next chapter shows how a routine's declaration says which it does.

## Things to try

Add a third call that charges 80 with postage of 15 and assert that the result is 95. The routine needs no new program variables to handle another order, because its parameters and local are all it needs.

Next, move `amount = 0` above the declaration of `due`. The routine now adds zero to the shipping and returns 15, so the first assertion fails. `subtotal` is still 120, though. Changing the routine's copy earlier changes the result, and it still can't reach the caller's variable.

## Summary

- A routine's parameters receive copies of scalar arguments, and changing a parameter changes only the copy.
- Each call gets its own activation holding its parameters and locals. The activation ends when the call returns.
- Scope is where a name can be used in the source. Lifetime is when its storage exists during the run.
- A local or parameter can't reuse a name that is already visible, and every name is declared before it is used.
- A routine with a result must return a value on every path. A scalar result is copied out, so it survives the end of the call.
- A routine can't return access to its own local storage. The compiler rejects it.
- Arguments are evaluated from left to right.
- Line input fills a string up to its capacity and never beyond it.
