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
    value as u16
    usable as boolean
end
```

`Reading` is now a type, just like `u16`. Each `Reading` has two fields: a number called `value` and a Boolean called `usable`. You can declare a variable of the new type:

```basie
var current as Reading = (12, true)
```

The initial value lists the fields in the order they were declared, so `current.value` starts at 12 and `current.usable` starts at `true`. A dot selects a field, for reading or writing.

`current` is one piece of storage that holds both fields, three bytes in all: two for the number and one for the flag. Declaring it doesn't allocate anything from a heap or create a pointer. Like any program variable it lasts for the whole run.

## Copying a record

Assignment copies a record just as it copies a number:

```basie
var saved as Reading
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
sub inspect(item as Reading) as u16
    return item.value
end
```

When the program calls `inspect(current)`, `item` becomes a second name for `current` itself. A second name for existing storage is called an **alias**. Nothing is copied, however large the record is, which saves time and stack space, both scarce on a Z80.

An alias is read-only. `inspect` can read every field of the caller's record and return copies of them, but it can't change any of them. If you add `item.value = 0` to `inspect`, the compiler rejects the routine and reports that `item` is read-only. Because nothing can be changed through it, an alias also accepts a constant record or a string literal.

![An aggregate copy creates independent contents, while a parameter supplies another path to one object.](../../assets/images/basie-book/book1/aggregate-storage-and-access.svg)

The record still belongs to the caller. It is `current`, a program variable that existed before the call and goes on existing after it. The routine has access to it only for the length of the call. An alias can't be stored in a variable, kept in a field or returned, so the routine has no way to keep hold of the record once it returns.

## The word `var`

To change the caller's record, a routine marks the parameter with `var`:

```basie
sub update(var item as Reading, value as u16)
    item.value = value
end
```

`var` makes `item` a **mutable alias**. When the program calls `update(current, 20)`, `item.value = value` changes `current` itself. Assigning a whole record to `item` would copy new contents into `current`. It can't make `item` refer to a different record. The other parameter, `value`, is a scalar and is still a copy, as in Chapter 3.

`var` is easy to miss. It's three letters in the middle of a parameter list, and it decides whether a call can change your data. You can find that out from the declaration alone, without reading the routine's body. A record parameter without `var` can't change your record. One with `var` might. A mutable alias needs a record that can be changed, so it can't be given a constant or a string literal.

## One record, several names

An alias without `var` limits what one routine can do through one name. It doesn't freeze the record. If a routine has read-only access to `current` and also changes the program variable `current` by name, or calls another routine that does, the record changes and the change shows through the alias too. There is only one record behind both names.

Basie doesn't guarantee that a mutable alias is the only name for its record. It does guarantee that no alias outlasts the storage it refers to or reaches outside it, and that is what keeps memory safe. Keeping track of who changes what is still part of designing the program, and the `var` in each declaration shows where changes can happen.

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

Passing `current.value` to a `u16` parameter copies one number, and the routine can't reach the record it came from. A routine that needs only the value should take a `u16`. It can't change the record by accident and it works with numbers that don't come from a record at all. Use a record parameter when the routine needs several fields together or needs to change the original.

## Responsibility for a record

Every record so far belongs to a variable. `current` belongs to the program and `saved` to `main`, and each lasts as long as its variable. Any record a caller passes is certain to outlast the call, because the caller is still running while the call happens. A routine with an alias can use the record but can't affect how long it lives.

Chapter 5 introduces records that are created while the program runs and released when they're no longer needed. Once records can end at different times, some part of the program has to be responsible for releasing each one. An alias can't be, because it lasts only for a call. Chapter 5 calls the responsible part the record's **owner**.

## Things to try

Change `update` so that it sets `usable` to `false` as well as changing `value`, then add assertions for both fields of `current` and `saved`. The copy keeps its old flag.

Remove `var` from `update`'s `item` parameter and leave the assignment in place. The compiler rejects the write. Put `var` back and the routine compiles again. Nothing about the record has changed, only the routine's permission to write through that name.

## Summary

- A record groups named fields of different types into one piece of storage.
- Assigning one record to another copies all of its fields. The two records stay separate.
- Record assignment needs the same declared type on both sides.
- Records and arrays can be constants. Nothing can change a constant.
- A record parameter is an alias for the caller's record. Nothing is copied, and the record still belongs to the caller.
- An alias is read-only. `var` on the parameter makes it a mutable alias, through which the routine can change the caller's record.
- Several names may refer to one record, and a change through one shows through the others.
- An alias lasts only for the call. It gives access to the record but no responsibility for its lifetime.
