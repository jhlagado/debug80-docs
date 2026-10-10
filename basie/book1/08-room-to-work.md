---
title: "Room to Work"
parent: "Programming Basie"
nav_order: 8
nav_exclude: true
search_exclude: true
---

# Room to Work

A list of readings, a line of input and a report waiting to be printed are each a collection of values stored together. The number of values in use changes as the program runs. On a large machine you might reach for a list that grows as needed. On a Z80 every collection declares its size up front. The program then tracks how much of that space is in use. Basie has two built-in collections, arrays and strings. Each keeps a fixed **capacity** apart from its **contents**, which change.

## Arrays and their shape

Chapter 2 declared a one-dimensional array, `u8[2]`. An array's elements can themselves be arrays:

```basie
var grid: u8[3][2] = [[1, 2], [3, 4], [5, 6]]
```

The type reads from left to right. `grid` is an array of three elements, and each of those elements is an array of two `u8` values. So `grid[0]` is the whole first row, `[1, 2]`, and `grid[0][1]` is the second byte of that row, 2. The initial value spells out the same shape, as three rows of two.

In storage the six bytes sit in row order, 1, 2, 3, 4, 5, 6, with the last index changing fastest. A Basie program never depends on that layout, because it always selects an element through its indexes.

Every selection keeps its type and its bounds. `grid[row]` is a `u8[2]` and can be passed anywhere a `u8[2]` is accepted. `grid[row][column]` checks `row` against 3 and `column` against 2, each at its own level. A column index of 2 traps with `bounds`, even though `grid[0][2]` would fall inside the six bytes.

## Index types

An index must be a `u8` or a `u16`, or a constant that fits a `u16`. A signed value such as an `i16` must be converted with `u16(...)` before it can be used as an index. In C, `a[-1]` reads the bytes just before the array. In Basie the conversion traps on a negative value, so it can't wrap around to a large index that happens to be valid.

## Walking an array

A nested loop follows the shape of the array, one loop for each level:

```basie
for row = 0 until 3
    for column = 0 until 2
        observed = observed + u16(grid[row][column])
    end
end
```

The outer loop takes each row in turn and the inner loop takes each element of that row. Each byte is widened to `u16` before it's added, so the sum is calculated in sixteen bits. The complete program is `06-arrays.BSI`:

<<< @/basie/book1/examples/06-arrays.BSI{basie}

The six elements add up to 21, and the assertion confirms it. The loop bounds, 3 and 2, are written out to match the declaration. Chapter 9 shows how a routine can read an array's length instead.

## Capacity and contents

An array always has exactly the number of elements it was declared with. Each element starts at its initial value or at zero and lasts as long as the array does. The array can't grow, shrink or lose an element.

Most programs need more flexibility than that. A buffer might have room for eight readings with only three recorded so far. The usual approach is to keep a separate count of the elements in use:

![Reserved capacity and current contents are separate quantities.](../../assets/images/basie-book/book1/capacity-and-length.svg)

Basie checks indexes against all eight elements, because that's what keeps memory safe. The count records how many elements hold real readings. That's a fact about your program's data. A loop up to the count processes the readings, and a loop over the full array processes the storage. Choosing the wrong loop is a logic error. No bounds check traps it, because every index in both loops is valid.

## Strings

Text is common enough that Basie gives it a type of its own. A `string[N]` has a fixed capacity of `N` bytes and a current length that can be anything from zero up to `N`. The capacity can be from 1 to 253.

```basie
var source: string[6] = "A\0B"
```

This string has room for six bytes and currently holds three: `A`, zero and `B`. The `\0` is an escape for the byte with value zero. Other escapes include `\r` for carriage return, `\n` for line feed, `\t` for tab and `\x41` for a byte given in hexadecimal.

A Basie string stores its length with its contents. Unlike a C string, it isn't terminated by a zero byte, so a zero in the middle is ordinary content. Finding the length never means scanning for an end marker. In storage a `string[6]` takes eight bytes: a length byte, six bytes of contents and a final byte that the implementation keeps as zero.

`source.length` gives the current length, here 3. It's a `u8`, because a string holds at most 253 bytes.

## Copying strings

Assigning one string to another copies its contents and its length:

```basie
var copy: string[6]
copy = source
copy[2] = 'C'
```

Whole-string assignment needs both strings to have the same capacity, just as record assignment needs the same record type. After the assignment, `copy` holds `A`, zero and `B`, and its length is 3. Setting its third byte to `C` leaves `source` unchanged. Like every copy in Basie, the two strings are separate objects.

## Existing bytes and spare room

String indexing is checked against the current length, not the capacity. A `string[6]` holding three bytes accepts indexes 0, 1 and 2. Index 3 is within the capacity, but there's no byte there yet. Reading or writing `copy[3]` traps with `bounds`.

Indexing therefore can't make a string longer. Writing `copy[2] = 'C'` replaces an existing byte and leaves the length at 3. The library's `append` routines add bytes to a string. They check the capacity first and fail cleanly if the text won't fit. Chapter 1's `appendU16` was one of them.

On an ordinary string variable you can read `.length` but can't assign it. A routine such as `append` changes the length through a `var string[]` parameter, which Chapter 9 introduces.

Here's a short program that checks all of this:

<<< @/basie/book1/examples/07-strings.BSI{basie}

The copy has length 3. Its first byte, `A`, is 65 and its new third byte, `C`, is 67. The program combines them as 3 times 100, plus 65, plus 67, giving 432.

## Library help for strings

`STRINGS.BSI` contains routines for the common jobs. All of them check each string's capacity and fail with a `lineTooLong` code if the result won't fit:

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

They're ordinary Basie routines, and their source uses the techniques Chapter 9 explains.

## Reading a line

Keyboard input also goes into a string. This program reads a name from the keyboard and writes a greeting:

<<< @/basie/book1/examples/ECHO.BSI{basie}

`answer` is a local `string[32]` that starts empty. `prompt`, a routine from `TEXTIO.BSI`, writes `Name? ` and then reads a line from the keyboard into `answer`. On CP/M the user can correct typing mistakes with the usual line-editing keys before pressing Return. The characters go into the string and set its length, but the Return key isn't stored. Next the program prints `Hello, ` with no line ending. Then `writeLine` prints the name and finishes the line:

```text
Name? Ada
Hello, Ada
```

The input service underneath `prompt` is `readLine`:

```basie
try readLine(console, answer)
```

It reads the line without a prompt and leaves the cursor at the end of the user's typing. CP/M's line editing echoes Return as a carriage return alone, so `prompt` also writes a line feed. `prompt` is ordinary Basie in the library, and you can read its source to see exactly what it does.

The runtime passes the string's capacity to CP/M as the line limit, so the input can't overflow `answer`. After thirty-two characters CP/M ends the line as if Return had been pressed. In other languages, input routines that write past fixed buffers are behind a long history of security holes. A Basie string carries its capacity into the call, and the input routine stays within it.

## Choosing a capacity

A larger string accepts longer input, but each variable of that type reserves its full capacity even when it's empty. An array of fifty `string[80]` records takes four kilobytes before a single character is stored. That's a real cost on a 64K machine.

Choose the capacity from the longest reasonable input for the job. Then decide what the program should do with longer input, because sooner or later it will arrive. The library's routines report that case as a failure, which gives your program a chance to respond.

## Things to try

In `07-strings.BSI`, set the last byte of `copy` to `'D'` instead of `'C'`. Check that the length is still 3 and that `observed` becomes 433. Next change the index from 2 to 3. The number 3 fits a `u8` and is less than the capacity of 6, but the string has no byte at that position. The compiler can't reject the constant index, because the string's length is only known when the program runs. So the program compiles, and the assignment traps with `bounds`.

In `06-arrays.BSI`, change `grid` to `u8[4][2]` and add a fourth row, `[7, 8]`. The outer loop still counts to 3, so the sum stays at 21 even though the array now holds 36. The loop and the declaration have drifted apart. Nothing traps, because every index the loop uses is still valid. Chapter 9 shows how to avoid that kind of drift.

## Summary

- Each index into an array of arrays is checked against its own level.
- Indexes are `u8` or `u16`. A signed index must be converted first, and the conversion traps if it's negative.
- An array always has its declared number of elements. A separate count tracks how many hold meaningful data.
- A `string[N]` has a fixed capacity of 1 to 253 bytes and a current length that changes.
- Strings store their length. Zero bytes are ordinary content.
- String assignment copies contents and length, and needs equal capacities.
- String indexing is checked against the current length, so indexing can't extend a string.
- The library's string routines check capacity and fail cleanly when text won't fit.
- Line input fills a string up to its capacity and never beyond it.
