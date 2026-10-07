---
title: "A Wider View"
parent: "Programming Basie"
nav_order: 9
nav_exclude: true
search_exclude: true
---

# A Wider View

A routine that adds up an array of bytes ought to work for an array of two bytes and for an array of forty. With what we've seen so far, it can't. A parameter of type `u8[4]` accepts exactly a `u8[4]`, so summing arrays of three different lengths would mean three routines with identical bodies.

C passes a pointer to the first element and leaves the length to a separate argument. The routine then has no way to check its indexes, and a wrong length reads straight past the end of the array. Basie passes the length with the array.

## Open arrays

An **open array** parameter leaves the length out of the type:

```basie
sub sum(values as u8[]) as u16
```

`u8[]` accepts any complete array of `u8`, whatever its length. The element type is still fixed and only the length is open. Each call passes the array together with its real length, and inside the routine `values.length` gives that length.

Like every record or array parameter, `values` is an alias for the caller's array, not a copy. It's read-only here because there's no `var`, and it lasts for the call.

## One loop for every length

With the length available, the loop can use it as its bound:

```basie
for index = 0 until values.length
    total = total + u16(values[index])
end
```

This loop is right for every array the routine is given. There's no constant to keep in step with a declaration somewhere else, which is the drift that the last exercise in Chapter 8 produced. Every index is still checked against the length passed with this particular call, so the routine can't read past the end of a short array even if its loop were wrong.

An open array is a view of a whole array. It isn't a slice, so you can't use it to pass part of an array, such as elements 2 through 5. It also can't be stored in a variable or a field. It's a parameter type and nothing else, which is part of what lets Basie guarantee it never outlives its array.

## Building text in the caller's string

An open string parameter, `string[]`, works the same way. It accepts a string of any capacity and passes both the current length and the capacity into the call. Inside the routine, `.length` gives the length and `.capacity` gives the capacity.

A `var string[]` parameter is the one place where a string's length can be assigned directly. That's how routines build text in a string the caller supplies:

```basie
sub writeOK(var text as string[])
    text.length = 2
    text[0] = 'O'
    text[1] = 'K'
end
```

Setting the length to 2 first makes room for two bytes, which the next two lines fill. Any bytes the new length exposes start at zero, so a string never shows stale contents from some earlier use. If the caller's string had a capacity below 2, the length assignment would trap with `bounds` before anything was written.

A library routine can check `.capacity` before it changes the length and report a failure instead of trapping. `append` and `appendU16` do exactly that, which is why they can fail with `lineTooLong` rather than stopping the program.

The caller supplies the string and decides how big it is, and the routine fills it in. The finished text is in the caller's storage, so it's still there after the routine returns, and no new storage was needed to get it out. A program that formats many reports can reuse one buffer for all of them.

## Both together

<<< @/basie/book1/examples/09-open-views.BSI{basie}

`sum` adds 2, 4, 6 and 8 to get 20. `writeOK` makes `message` two bytes long, so its length is 2. The final value is 22.

## Returning access to existing data

Chapter 3 showed that a routine can't return access to its own local storage, because that storage ends when the routine returns. Returning access to storage that *outlives* the routine is safe and often useful. A routine that picks one record out of an array, for example, can return the record itself instead of a copy:

```basie
sub pick(items as Pair[2], index as u8) as Pair from items
    return items[index]
end
```

The result clause `as Pair from items` says that the routine returns a `Pair` and that the `Pair` lives inside whatever the caller passed as `items`. The `from items` makes this safe. It tells the compiler and anyone reading the declaration that the result lives exactly as long as that argument. The argument is the caller's storage, which outlasts the call, so the result does too.

The result is an alias, like a parameter, and it's equally short-lived. The caller has to use it within the same statement: read a field from it, pass it to another routine, or copy it into storage of its own. It can't be kept in a variable as an alias for later.

## Copying out and reading through

This example shows the difference between copying a returned record and reading through it:

<<< @/basie/book1/examples/PICK.BSI{basie}

`var saved = pick(pairs, 0)` declares a new local and copies the selected record into it. `saved` is a separate `Pair` with its own storage holding 3 and 4. The program then changes the original's `left` to 7. `saved` still holds 3, because it's a copy. A fresh `pick(pairs, 0).left` reads through the alias into the array and finds 7.

If you passed `pick(pairs, 0)` straight to a routine with a `var Pair` parameter, the routine would be working on the record inside `pairs`, not a copy. That's only allowed when the result is writable, which the next section covers.

## Results from program storage

A routine can also return access to a program variable. Program storage lasts for the whole run, so no `from` clause is needed:

<<< @/basie/book1/examples/11-aggregate-results.BSI{basie}

`selected(true)` returns access to the program variable `first`. It's passed straight to `copyPair`, which copies it into `second`. The call to `selected` copies nothing. The only copy is the assignment inside `copyPair`. The result is 34, from the 3 and 4 that ended up in `second`.

A result is read-only unless its declaration says `as var`, as in `as var Pair from items`. A writable result must come from a `var` parameter, or from a program variable that isn't a constant, so a routine can't hand out write access to something it was only allowed to read.

## The rules in one place

All of this comes down to a few rules about lifetimes:

- A parameter alias is safe because the caller's storage outlasts the call.
- A result rooted in a parameter named by `from` is safe because it lives as long as that argument.
- A result rooted in program storage is safe because program storage never ends.
- A result rooted in the routine's own locals would outlive its storage, so it's rejected.

The compiler checks every one of these when it compiles the routine. None of them costs anything at run time.

## Things to try

Add a second array to `09-open-views.BSI`, say a `u8[3]` holding 1, 2 and 3, and assert that `sum` returns 6 for it. The same routine handles both lengths.

Then declare a second string, a `string[4]`, pass it to `writeOK` and check its length. Both strings fit two bytes. Finally try a `string[1]`. The program compiles, and when it runs, the length assignment inside `writeOK` traps with `bounds`, because the routine sets a length of 2 and that string only has room for 1.

## Summary

- An open array, `T[]`, accepts a complete array of any length, and `.length` gives the real length inside the routine.
- An open string, `string[]`, accepts a string of any capacity, with `.length` and `.capacity` available.
- A `var string[]` parameter can set the string's length, which is how library routines build text in caller storage.
- Every index through an open view is checked against the real bounds of the caller's object.
- Open views can't be stored and don't select part of an array.
- A routine may return access to a parameter named in its `from` clause, or to program storage, but never to its own locals.
- A returned alias must be used within the statement. Assigning it to a new variable copies the record.
- `as var` makes a result writable, and only a writable source can supply one.
