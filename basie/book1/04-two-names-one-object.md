---
title: "Two Names, One Object"
parent: "Programming Basie"
nav_order: 4
nav_exclude: true
search_exclude: true
---

# Two Names, One Object

So far every value has been a single number, and every assignment and call has copied it. Real data rarely comes one number at a time. A reading from a sensor has a value and a flag that says whether the value can be trusted. A job in a print queue has a number, an owner and a status. Basie groups related values like these into **records**.

A record can be copied like a number. A routine that updates a record, though, has to change the caller's original rather than a copy of it. Basie supports both.

## A record type

A record declaration describes the fields of a new type:

```basie
record Reading
    value as u16
    usable as boolean
end
```

`Reading` is now a type, just like `u16`. Each `Reading` has two fields: a number called `value` and a Boolean called `usable`. You can declare variables of the new type:

```basie
var current as Reading = (12, true)
```

The initial value lists the fields in the order they were declared, so `current.value` starts at 12 and `current.usable` starts at `true`. A dot selects a field: `current.value` reads or writes the number and `current.usable` reads or writes the flag.

The record is one object, a single piece of storage that holds both fields. A `Reading` takes three bytes, two for the number and one for the flag. Declaring `current` doesn't allocate anything from a heap or create a pointer. Its storage is part of the program's data and lasts for the whole run.

## Copying a record

To keep the old reading while you update the current one, make a second record and copy into it:

```basie
var saved as Reading
saved = current
```

`saved` starts with every field at zero, or `false` for the flag. The assignment then copies the whole of `current` into it, both fields at once. Afterwards the two records hold equal values but remain separate objects, so changing `current.value` later leaves `saved.value` as it was.

This is the same rule as Chapter 1, applied to a larger value. Assignment copies contents into existing storage. It never makes two names refer to the same record.

Whole-record assignment needs the same declared type on both sides. If you declared a second record type with exactly the same fields, say `Sample` with a `u16` and a `boolean`, you still couldn't assign a `Sample` to a `Reading`. Two types with the same layout might mean quite different things, so Basie matches record types by name and not by layout.

## Working on the original

A routine that updates the current reading has to change the caller's record:

```basie
sub update(var item as Reading, value as u16)
    item.value = value
end
```

Record parameters behave differently from the scalar parameters of Chapter 3. Basie doesn't copy the record into the routine. Instead `item` becomes another name for the record the caller passed in, which is called an **alias**. When the program calls `update(current, 20)`, `item` refers to `current` itself, so `item.value = value` changes the caller's record.

The `var` in front of `item` gives the routine permission to write through that alias. The second parameter, `value`, is an ordinary scalar and still arrives as a copy.

![An aggregate copy creates independent contents, while a parameter supplies another path to one object.](../../assets/images/basie-book/book1/aggregate-storage-and-access.svg)

An alias is also cheap. Copying a large record or array into every call would take time and stack space, both scarce on a Z80, and an alias costs the same however large the record is.

An alias lasts only for the call. It can't be stored in a variable, kept in a field or returned to escape the call. Inside the routine, assigning to `item` as a whole copies new contents into the caller's record. It never makes `item` refer to some other record.

## Access with fewer permissions

A routine that only needs to look at a record should say so. Leaving out `var` makes the parameter read-only:

```basie
sub inspect(item as Reading) as u16
    return item.value
end
```

A read-only alias is called a **ticket**, like a ticket to look around a place you don't own. The routine can read every field and return copies of them, but it can't write through `item`. If you add `item.value = 0` to `inspect`, the compiler rejects the routine and reports that `item` is read-only.

Whether a parameter has `var` tells you, without reading the routine's body, whether calling it might change your data. A ticket also accepts things a writable parameter can't, such as a record constant or a string literal, because its declaration rules out changing them.

## The permission belongs to the path

A ticket restricts what one routine can do through one name. It doesn't freeze the record. Suppose a routine has a ticket for `current` and also changes the program variable `current` directly by name, or calls another routine that does. The record changes, and the change shows up through the ticket too, because there is only one record behind both names.

Basie allows several paths to the same object like this and doesn't guarantee that a writable alias is the only path to its record. It does guarantee that no path outlives the storage it reaches and no path reaches beyond it, and that is what keeps memory safe. Keeping track of who changes what is still part of designing the program, and `var` makes it visible in every routine's declaration.

## The complete comparison

This program puts copying, writing through an alias and reading through a ticket side by side:

<<< @/basie/book1/examples/ACCESS.BSI{basie}

Here's the state at each step:

| Step | `current.value` | `saved.value` |
| --- | ---: | ---: |
| Start of `main` | 12 | 0 |
| After `saved = current` | 12 | 12 |
| After `update(current, 20)` | 20 | 12 |

`inspect` then reads the 20 through a ticket and returns a copy of the number. The final assertions confirm that the original changed and the copy didn't.

## A field or the whole record

The expression you pass determines what the routine receives. Passing `current.value` to a `u16` parameter copies one number, and the routine has no way to reach the record it came from. Passing `current` to a `Reading` parameter gives the routine access to the whole record.

So give a routine only what it needs. A calculation that only uses the value should take a `u16`. It's simpler, it can't change the record by accident and it works with numbers that don't come from a record at all. Use a record parameter when the routine needs several fields together or needs to change the original.

## Read-only data

Records and arrays can be constants too. This example declares one of each:

<<< @/basie/book1/examples/08-records.BSI{basie}

`defaultCell` is a constant `Cell` and `masks` is a constant array of four bytes. Constant records and arrays must name their type, and no statement can change them, whether directly or through a `var` parameter. They can be read, copied into variables and passed to tickets. Here the program adds `current.value`, `defaultCell.value` and the last mask, 7 plus 7 plus 8, to get 22.

## Access is not responsibility

An alias gives a routine access to a record but no control over how long the record lives. In `ACCESS.BSI`, `current` lives for the whole run and `saved` lives until `main` returns, so both outlast the call to `update`. Any record a caller can pass is guaranteed to outlast the call, because the caller is still running while the call happens.

That guarantee is easy while every record lives in program storage or in a routine's activation. Chapter 5 introduces records that are created during the run and released when they are no longer needed. Once records can be released at different times, some part of the program has to be responsible for releasing each one, and an alias can't be, because it lasts only for a call.

## Things to try

Change `update` so that it sets `usable` to `false` as well as changing `value`, then add assertions for both fields of `current` and `saved`. The copy should keep its old flag.

Remove `var` from `update`'s `item` parameter and leave the assignment in place. The compiler rejects the write. Put `var` back and the routine compiles again. The record's type and lifetime are unchanged. Only the routine's permission to write through that name differs.

## Summary

- A record groups named fields of different types into one object.
- Assigning one record to another copies all of its contents. The two records stay separate.
- Record assignment needs exactly the same declared type on both sides.
- A record parameter is an alias for the caller's record. Nothing is copied.
- A `var` parameter may write through the alias. A parameter without `var` is a read-only ticket.
- Several paths may reach one record, and a change through one is visible through the others.
- An alias lasts only for the call and gives no responsibility for the record's lifetime.
