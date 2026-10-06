---
title: "Room to Work"
parent: "Programming Basie"
nav_order: 8
nav_exclude: true
search_exclude: true
---

# Room to Work

A list of readings, a line of input and a report waiting to be printed all have something in common. Each is a collection of values stored together, and the number of values in use changes as the program runs. On a large machine you might reach for a list that grows as needed. On a Z80, every collection has to declare up front how much room it takes, and the program has to keep track of how much of that room is actually in use.

This chapter looks at Basie's two built-in collections, arrays and strings, and at the difference between a collection's **capacity**, which is fixed, and its **contents**, which change.

## Arrays and their shape

Chapter 2 declared a one-dimensional array, `u8[2]`. Arrays can also contain arrays:

```basie
var grid as u8[3][2] = [[1, 2], [3, 4], [5, 6]]
```

Read the type from left to right. `grid` is an array of three elements, and each of those elements is an array of two `u8` values. So `grid[0]` is the whole first row, `[1, 2]`, and `grid[0][1]` is the second byte of that row, 2. The initial value spells out the same shape, as three rows of two.

In storage the six bytes sit one after another, row by row: 1, 2, 3, 4, 5, 6. The last index changes fastest. That's how the bytes are laid out, but a Basie program never depends on it. A program always selects an element through its indexes, so the layout is a fact about the machine rather than something your code has to manage.

Every selection keeps its type and its bounds. `grid[row]` is a `u8[2]` and can be passed anywhere a `u8[2]` is accepted. `grid[row][column]` checks `row` against 3 and `column` against 2, each at its own level. A value that fits within six bytes overall but is wrong for one level, such as a column of 2, still traps with `bounds`.

## Index types

An index must be a `u8` or a `u16`, or a constant that fits a `u16`. Signed values aren't accepted directly. If you have an `i16` that you know should be a valid index, convert it with `u16(...)`. The conversion traps if the value is negative, so a negative number can never sneak in and wrap around to a large index that happens to be valid. In C, `a[-1]` reads the bytes just before the array. In Basie that can't happen.

## Walking an array

A nested loop follows the shape of the array, one loop for each level:

```basie
for row = 0 until 3
    for column = 0 until 2
        observed = observed + u16(grid[row][column])
    end
end
```

The outer loop takes each row in turn and the inner loop takes each element of that row. Each byte is widened to `u16` before it's added, so the sum is calculated in sixteen bits. Here's the complete program:

<<< @/basie/book1/examples/06-arrays.BSI{basie}

The six elements add up to 21, and the assertion confirms it. The loop bounds, 3 and 2, are written out to match the declaration. Chapter 9 shows how a routine can read an array's length instead.

## Capacity and contents

An array always has exactly the number of elements it was declared with. They exist from the moment the array does, each starting at its initial value or at zero. An array can't grow or shrink, and there's no way to make one of its elements stop existing.

Most programs need something more flexible than that. A buffer for readings might have room for eight, of which three have been recorded so far. The usual approach is to keep a separate count of how many elements are in use:

![Reserved capacity and current contents are separate quantities.](../../assets/images/basie-book/book1/capacity-and-length.svg)

The array has eight elements throughout. The count says that the first three hold real readings and the other five are spare. Basie checks indexes against the eight, because that's what keeps memory safe. Whether element 5 holds a meaningful reading is a question about your program's data, and the count is how your program answers it. A loop over the count processes the readings. A loop over the full array processes the storage. They're different jobs, and choosing the wrong one is a logic error that bounds checking can't catch, because every index in both loops is valid.

## Strings

Text is common enough that Basie gives it a type of its own. A `string[N]` has a fixed capacity of `N` bytes and a current length that can be anything from zero up to `N`. The capacity can be from 1 to 253.

```basie
var source as string[6] = "A\0B"
```

This string has room for six bytes and currently holds three: `A`, a zero byte and `B`. The `\0` is an escape for the byte with value zero. Other escapes include `\r` for carriage return, `\n` for line feed, `\t` for tab and `\x41` for a byte given in hexadecimal.

A Basie string is not terminated by a zero byte, the way C strings are. The length is stored with the string, so a zero byte in the middle is just another byte, and finding the length never means scanning for an end marker. In storage a `string[6]` takes eight bytes: one for the length, six for the contents and one more that the implementation keeps as zero.

`source.length` reads the current length, here 3. It's a `u8`, since a string can never be longer than 253.

## Copying strings

Assigning one string to another copies its contents and its length:

```basie
var copy as string[6]
copy = source
copy[2] = 'C'
```

Whole-string assignment needs both strings to have the same capacity, just as record assignment needs the same record type. After the copy, `copy` holds `A`, zero, `B` and has length 3. Changing its third byte to `C` changes `copy` and leaves `source` alone. They're two separate objects, as every copy in Basie is.

## Existing bytes and spare room

String indexing is checked against the current length, not the capacity. A `string[6]` holding three bytes accepts indexes 0, 1 and 2. Index 3 is within the capacity, but there's no byte there yet, so `copy[3]` traps with `bounds`, whether you read it or write it.

That means indexing can't make a string longer. Writing `copy[2] = 'C'` replaces an existing byte and leaves the length at 3. To add bytes to a string, use the library's `append` routines, which check the capacity first and fail cleanly if the text won't fit. Chapter 1's `appendU16` was one of them.

You can read `.length` but you can't assign it on an ordinary string variable. A routine that builds strings changes the length through a writable string parameter, which Chapter 9 introduces. Behind the scenes, that's how `append` works.

Here's a short program that checks all of this:

<<< @/basie/book1/examples/07-strings.BSI{basie}

The copy has length 3, its first byte is `A`, which is 65, and its changed third byte is `C`, which is 67. The program combines them as 3 times 100, plus 65, plus 67, which is 432.

## Library help for strings

`STRINGS.BSI` contains routines for the common jobs. All of them respect each string's capacity and fail with a `lineTooLong` code if the result won't fit:

| Routine | Effect |
| --- | --- |
| `clear(s)` | makes `s` empty |
| `append(s, t)` | adds the text of `t` to the end of `s` |
| `appendByte(s, b)` | adds one byte to the end of `s` |
| `copyFrom(dest, src, start, count)` | copies part of `src` into `dest` |
| `equal(a, b)` | tests whether two strings hold the same bytes |
| `compare(a, b)` | gives -1, 0 or 1 for sorting |
| `find(s, t)` | gives the position of `t` within `s` |
| `toUpper(s)`, `toLower(s)` | change letter case |
| `trim(s)` | removes leading and trailing spaces and tabs |

They're ordinary Basie routines, and reading their source is a good way to see the techniques in the next chapter at work.

## Choosing a capacity

Every capacity is a trade. A larger string accepts longer input, but every variable of that type reserves the full capacity whether it's used or not. An array of fifty `string[80]` records takes four kilobytes before a single character is stored. On a 64K machine that's a real cost.

Decide what the longest reasonable input is for the job and choose the capacity from that. Then decide what the program should do when input is longer, because sooner or later it will be. The library's routines report that case as a failure, which gives your program a chance to respond. A count of active elements and a bounds check do different jobs: the count tracks what your data means and the check protects the storage. You need both.

## Things to try

In `07-strings.BSI`, change the last byte of `copy` again, to `'D'`, and check that the length is still 3 and that `observed` becomes 433. Then change the index to 3. The number 3 fits a `u8` and is less than the capacity of 6, but the string has no byte at that position. The index is a constant, but the string's length is only known when the program runs, so the program compiles and the assignment traps with `bounds`.

In `06-arrays.BSI`, change `grid` to `u8[4][2]` and add a fourth row, `[7, 8]`. The outer loop still counts to 3, so the sum stays at 21 even though the array now holds 36. The loop and the declaration have drifted apart, and nothing traps, because every index the loop uses is still valid. Chapter 9 shows how to avoid that kind of drift.

## Summary

- An array of arrays is indexed one level at a time, and each index is checked against its own level.
- Indexes are `u8` or `u16`. Signed values must be converted first, which traps on a negative value.
- An array always has its declared number of elements. A separate count tracks how many hold meaningful data.
- A `string[N]` has a fixed capacity of 1 to 253 bytes and a current length that changes.
- Strings store their length. Zero bytes are ordinary content.
- String assignment copies contents and length, and needs equal capacities.
- String indexing is checked against the current length, so indexing can't extend a string.
- The library's string routines check capacity and fail cleanly when text won't fit.
