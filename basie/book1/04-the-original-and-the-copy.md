---
title: "The Original and the Copy"
parent: "Programming Basie"
nav_order: 4
nav_exclude: true
search_exclude: true
---

# The Original and the Copy

So far every value has been a single number, and every assignment and call has copied it. Real data rarely comes one number at a time. A reading from a sensor has a value and a flag that says whether the value can be trusted. Basie groups related values like these into **records**. Once data comes in records, a copy is no longer the only useful thing a call can work on. A routine that updates a reading has to change the caller's record itself.

## A record type

A record declaration describes the fields of a new type:

```basie
record Reading
    value: u16
    usable: boolean
end
```

`Reading` is now a type, just like `u16`. Each `Reading` has two fields: a number called `value` and a Boolean called `usable`. You can declare a variable of the new type:

```basie
var current: Reading = (12, true)
```

The initial value lists the fields in the order they were declared, so `current.value` starts at 12 and `current.usable` starts at `true`. A dot selects a field, for reading or writing.

`current` is one piece of storage that holds both fields, three bytes in all: two for the number and one for the flag. Declaring it doesn't allocate anything from a heap or create a pointer. Like any program variable it lasts for the whole run.

## Copying a record

Assignment copies a record just as it copies a number:

```basie
var saved: Reading
saved = current
```

`saved` starts with its number at zero and its flag `false`. The assignment copies both fields of `current` into it. The two records now hold equal values but are separate storage, so a later change to `current.value` leaves `saved.value` as it was. Assignment never makes two names refer to one record.

Both sides of a record assignment must have the same declared type. If you declared a second record type, say `Sample` with a `u16` and a `boolean`, you still couldn't assign a `Sample` to a `Reading`. Two types with the same layout might mean quite different things, so Basie matches record types by name and not by layout.

## Constant records and arrays

Records and arrays can be constants too:

<<< @/basie/book1/examples/08-records.BSI{basie}

`defaultCell` is a constant `Cell` and `masks` is a constant array of four bytes. A constant record or array must name its type, and no statement can change it. It can be read and copied into a variable like any other record or array. Here the program adds `current.value`, `defaultCell.value` and the last mask, 7 plus 7 plus 8, to get 22.

## Passing a record to a routine

A routine that takes a record parameter doesn't receive a copy:

```basie
sub inspect(item: Reading): u16
    return item.value
end
```

When the program calls `inspect(current)`, `item` becomes a second name for `current` itself. A second name for existing storage is called an **alias**. Nothing is copied, however large the record is, which saves time and stack space, both scarce on a Z80.

An alias is read-only, so `inspect` can read every field of the caller's record but can't change any of them. If you add `item.value = 0` to `inspect`, the compiler rejects the routine and reports that `item` is read-only. Because nothing can be changed through it, an alias also accepts a constant record or a string literal.

![An aggregate copy creates independent contents, while a parameter supplies another path to one object.](../../assets/images/basie-book/book1/aggregate-storage-and-access.svg)

The record still belongs to the caller. It is `current`, a program variable that exists before and after the call. The routine has access to it only while the call runs. An alias can't be stored in a variable or a field, or returned. The routine's access ends with the call.

## The word `var`

To change the caller's record, a routine marks the parameter with `var`:

```basie
sub update(var item: Reading, value: u16)
    item.value = value
end
```

`var` makes `item` a **mutable alias**. The call says so too: the program writes `update(var current, 20)`, and `item.value = value` changes `current` itself. Assigning a whole record to `item` would copy new contents into `current`. It can't make `item` refer to a different record. The other parameter, `value`, is a scalar and is still a copy, as in Chapter 3.

`var` is only three letters in the middle of a parameter list, so it would be easy to miss. That is why Basie asks for it at the call as well. Every call that can change your record says `var` where it passes it, and leaving it out, or writing it for a parameter that isn't `var`, is an error. You can see which calls write to a record without reading any routine's body. A mutable alias needs a record that can be changed, so you can't pass it a constant or a string literal.

## One record, several names

A read-only alias stops a routine from writing to the record through that alias, but other code can still change the record. For example, the routine might assign to `current` directly or call another routine that does. The next time the routine reads `item`, it gets the new value, because `item` and `current` are the same record.

Basie allows a record to be reached through more than one name. It makes sure that no alias outlasts the record or reaches outside it, and that is what keeps memory safe. You decide which routines may change a record, and `var`, in the declaration and at each call, shows which ones can.

## The complete comparison

This program copies a record, changes the original through a mutable alias and reads it through a read-only one:

<<< @/basie/book1/examples/ACCESS.BSI{basie}

Here's the state at each step:

| Step | `current.value` | `saved.value` |
| --- | ---: | ---: |
| Start of `main` | 12 | 0 |
| After `saved = current` | 12 | 12 |
| After `update(current, 20)` | 20 | 12 |

`inspect` then reads the 20 and returns a copy of it. The assertions confirm that the original changed and the copy didn't.

## A field or the whole record

Passing `current.value` to a `u16` parameter copies one number, and the routine can't reach the record it came from. A routine that needs only the value should take a `u16`. It can't change the record by accident, and it also works with numbers from anywhere else. Use a record parameter when the routine needs several fields together or needs to change the original.

## Responsibility for a record

Every record so far belongs to a variable. `current` belongs to the program and `saved` to `main`, and each lasts as long as its variable. Any record a caller passes is certain to outlast the call, because the caller is still running while the call happens. A routine with an alias can use the record but can't affect how long it lives.

Chapter 5 introduces records that are created while the program runs and released when they're no longer needed. Once records can end at different times, some part of the program has to be responsible for releasing each one. An alias can't be, because it lasts only for a call. Chapter 5 calls the responsible part the record's **owner**.

## Things to try

Make `update` set `usable` to `false` as well as `value`, then add assertions for both fields of `current` and `saved`. The copy keeps its old flag.

Remove `var` from `update`'s `item` parameter and leave the assignment in place. The compiler rejects the write. Put `var` back and the routine compiles again. Nothing about the record has changed, only the routine's permission to write through that name.

## Summary

- A record groups named fields of different types into one piece of storage.
- Assigning one record to another copies all of its fields. The two records stay separate.
- Record assignment needs the same declared type on both sides.
- Records and arrays can be constants. Nothing can change a constant.
- A record parameter is an alias for the caller's record. Nothing is copied, and the record still belongs to the caller.
- An alias is read-only. `var` on the parameter makes it a mutable alias, through which the routine can change the caller's record.
- A record can be reached through several names, and they all refer to the same storage.
- An alias lasts only for the call. It gives access to the record but no responsibility for its lifetime.
