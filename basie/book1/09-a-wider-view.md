---
title: "A Wider View"
parent: "Programming Basie"
nav_order: 9
nav_exclude: true
search_exclude: true
---

# A Wider View

A routine that adds up an array of bytes ought to work for two bytes or for forty. The tools so far can't do that, because a parameter of type `u8[4]` accepts only a `u8[4]`. Summing arrays of three different lengths would need three routines with identical bodies.

C passes a pointer to the first element and leaves the length to a separate argument. The routine can't check its indexes, and a wrong length reads straight past the end of the array. Basie passes the length with the array.

## Open arrays

An **open array** parameter leaves the length out of the type:

```basie
sub sum(values: u8[]): u16
```

`u8[]` accepts any array of `u8`, whatever its length. A read-only one also accepts part of an array or a string, as later sections show. The element type can be anything an array holds, including records, handles and enums. The element type is still fixed and only the length is open. Each call passes the array with its real length, which the routine reads as `values.length`.

Like every record or array parameter, `values` is an alias for the caller's array, not a copy. Without `var` it's read-only, and it lasts for the call.

## One loop for every length

With the length available, the loop can use it as its bound:

```basie
for index = 0 until values.length
    total = total + u16(values[index])
end
```

This loop is right for every array the routine receives. The bound comes from the array itself, so the drift from the last exercise in Chapter 8 can't happen. Each index is still checked against the length passed with the call. Even a wrong loop can't read past the end of a short array.

An open array can't be stored in a variable or a field. Open arrays exist only as parameter types. That is part of how Basie guarantees the view never outlives the array.

## Part of an array

An open array parameter can also receive part of an array. A **slice** gives the first index and the index just past the end, joined by `until` as in a `for` loop:

```basie
observed = sum(readings[2 until 6])
```

This call passes elements 2, 3, 4 and 5 of `readings`. Inside `sum`, `values.length` is 4, and `values[0]` is the caller's `readings[2]`. Nothing is copied, and the routine reads the caller's elements where they are.

The call checks the slice before the routine starts. The start must not be past the end, and the end must not be past the array's length. If either check fails, the program traps with `bounds`. The slice's length is worked out only after both checks pass. A reversed range therefore can't wrap round to a huge length.

A slice whose start equals its end is empty. `readings[0 until count]` passes the first `count` elements, and it passes none when `count` is 0. No `count - 1` appears anywhere, so nothing can wrap below zero.

A slice is read-only. It can be passed only to an open array parameter without `var`, and nowhere else. It can't be stored, and nothing can follow it in the same path. Inside the routine it is an ordinary open array, so the routine can slice it again. The `writeBlock` service accepts a slice too, so a program can write part of a buffer.

<<< @/basie/book1/examples/09-slices.BSI{basie}

The first call adds the first four readings, 3, 5, 7 and 9, to get 24. The second adds elements 2 to 5 and gets 40. The last call passes an empty slice, and the sum is 0.

## Building text in the caller's string

An open string parameter, `string[]`, works the same way. It accepts a string of any capacity and passes both the current length and the capacity into the call. Inside the routine, `.length` gives the length and `.capacity` gives the capacity.

A `var string[]` parameter is the only place where a string's length can be assigned directly. Routines use it to build text in a string the caller supplies:

```basie
sub writeOK(var text: string[])
    text.length = 2
    text[0] = 'O'
    text[1] = 'K'
end
```

Setting the length to 2 makes room for two bytes, and the next two lines fill them. Any bytes the new length exposes start at zero, so a string never shows stale contents from earlier use. If the caller's string had a capacity below 2, the length assignment would trap with `bounds` before anything was written.

A library routine can check `.capacity` before it changes the length and report a failure instead of trapping. `append` and `appendU16` work this way and fail with `IoError.lineTooLong` when the text won't fit.

The caller supplies the string and chooses its capacity, and the routine fills it in. The finished text sits in the caller's storage. It remains there after the routine returns, and passing it back took no extra storage. A program that formats many reports can reuse one buffer for all of them.

## Both together

<<< @/basie/book1/examples/09-open-views.BSI{basie}

`sum` adds 2, 4, 6 and 8 to get 20. `writeOK` sets the length of `message` to 2. The program adds the two results to get 22.

## Strings as bytes

A program can hold text in two forms. A string suits short text such as a name or a command. It knows its own length, but its capacity is at most 253 bytes. Longer text goes in a byte array such as a `u8[2048]`. The program keeps a separate count of the bytes in use, just as Chapter 8 kept a count beside an array.

A routine that only reads text can work on both forms. A read-only `u8[]` parameter accepts a string, a `string[]` parameter or a string literal. The routine sees the string's bytes as an ordinary open array. Its `.length` is the string's length at the moment of the call. The rest of the capacity is outside the view. A byte array passes only its used part, as a slice such as `buffer[0 until used]`.

The parameter must be read-only, and a `var u8[]` parameter refuses a string. The compiler reports `not-writable` at the argument. A write through a byte view could leave the string's length wrong for its contents.

<<< @/basie/book1/examples/09-bytes.BSI{basie}

The loop copies the 13 bytes of `line` into `buffer` and counts them in `used`. `count` then reads three kinds of text. It finds two `t` bytes in the string, three `a` bytes in the literal and the same two `t` bytes in the buffer's used part. The last two assertions use `equal` and `find` from `STRINGS.BSI` on the buffer.

The library's reading routines take `u8[]` parameters for this reason. `equal`, `compare` and `find` accept a string, a literal or a buffer's used part. So do the `parse` routines in `PARSE.BSI` and `word` in `TEXTIO.BSI`. Positions in these routines are `u16`, because a view's length is a `u16`. Routines that change a string, such as `append` and `trim`, still take a `var string[]`.

## Returning access to existing data

Chapter 3 showed that a routine can't return access to its own local storage, because that storage ends with the call. Returning access to storage that *outlives* the routine is safe and often useful. For example, a routine that picks a record out of an array can return the record itself instead of a copy:

```basie
sub pick(items: Pair[2], index: u8): Pair from items
    return items[index]
end
```

The result clause `: Pair from items` says that the routine returns a `Pair` from inside whatever the caller passed as `items`. The `from items` part makes this safe, because it tells the compiler and the reader that the result lives exactly as long as that argument. The argument is the caller's storage, which outlasts the call, so the result outlasts it too.

Like a parameter, the result is an alias and just as short-lived. The caller must use it within the same statement. It can read a field, pass the result to another routine or copy it into its own storage. It can't keep the alias in a variable for later.

## Copying out and reading through

This example shows the difference between copying a returned record and reading through it:

<<< @/basie/book1/examples/PICK.BSI{basie}

`var saved = pick(pairs, 0)` declares a new local and copies the selected record into it. `saved` is a separate `Pair` holding 3 and 4 in its own storage. The program then changes the original's `left` to 7. `saved` still holds 3, because it's a copy. A fresh `pick(pairs, 0).left` reads through the alias into the array and finds 7.

Passing `pick(pairs, 0)` straight to a routine with a `var` parameter of type `Pair` would let that routine work on the record inside `pairs` itself. That's only allowed when the result is writable, which the next section covers.

## Results from program storage

A routine can also return access to a program variable. Program storage lasts for the whole run, so no `from` clause is needed:

<<< @/basie/book1/examples/11-aggregate-results.BSI{basie}

`selected(true)` returns access to the program variable `first`, and that alias goes straight to `copyPair`. The call to `selected` copies nothing, and the only copy is the assignment inside `copyPair`. That assignment writes `first` into `second`, so the result is 34.

A result is read-only unless its declaration says `: var`, as in `: var Pair from items`. A writable result must come from a `var` parameter or from a program variable that isn't a constant. A routine therefore can't hand out write access to something it could only read.

## The rules in one place

All of this comes down to a few rules about lifetimes:

- A parameter alias is safe because the caller's storage outlasts the call.
- A result rooted in a parameter named by `from` is safe because it lives as long as that argument.
- A result rooted in program storage is safe because program storage never ends.
- A result rooted in the routine's own locals would outlive its storage, so it's rejected.

All of these checks happen at compile time and cost nothing at run time.

## Things to try

Add a second array to `09-open-views.BSI`, such as a `u8[3]` holding 1, 2 and 3. Assert that the same `sum` routine returns 6 for it.

Pass a slice of `numbers` to `sum`, such as `numbers[1 until 3]`, and assert that the result is 10. Then try `numbers[3 until 1]`. The compiler rejects it with `bounds`, because both endpoints are constants and the range is reversed. Put the 3 in a variable instead. The program now compiles, and the call traps with `bounds` when it runs.

Then pass a `string[4]` to `writeOK` and check that its length is also 2. Finally pass a `string[1]` to `writeOK`, and the program still compiles. At run time the length assignment traps with `bounds`, because a length of 2 doesn't fit a capacity of 1.

In `09-bytes.BSI`, declare the parameter of `count` as `var text: u8[]` and write the first call as `count(var line, 't')`. The compiler rejects that call with `not-writable`, because a string's bytes are passed read-only.

## Summary

- An open array, `T[]`, accepts an array of any length, or a slice of one if the parameter is read-only. `.length` gives the real length inside the routine.
- An open string, `string[]`, accepts a string of any capacity, with `.length` and `.capacity` available.
- A `var string[]` parameter can set the string's length, which is how library routines build text in caller storage.
- A read-only `u8[]` parameter also accepts a string, a `string[]` or a string literal, with the string's length at the call. A `var u8[]` parameter refuses a string.
- The library's `equal`, `compare`, `find`, the `parse` routines and `word` take `u8[]`. They read a string or a byte buffer's used part.
- Every index through an open view is checked against the real bounds of the caller's object.
- Open views can't be stored.
- A slice, `xs[start until end]`, passes part of an array to a read-only open array parameter without copying it. The call traps with `bounds` unless the start is no later than the end and the end is within the array.
- A routine may return access to a parameter named in its `from` clause, or to program storage, but never to its own locals.
- A returned alias must be used within the statement. Assigning it to a new variable copies the record.
- `: var` makes a result writable, and only a writable source can supply one.
