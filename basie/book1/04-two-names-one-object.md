---
title: "Two Names, One Object"
parent: "Programming Basie"
nav_order: 4
nav_exclude: true
search_exclude: true
---

# Two Names, One Object

So far every value has been a single number, and every move has been a copy. That keeps things simple, but real data rarely comes one number at a time. A reading from a sensor has a value and also a flag that says whether the value can be trusted. A job in a print queue has a number, an owner and a status. Basie groups related values like these into **records**.

Records bring the first real decision about storage. When a routine works with a record, should it get its own copy or should it work on the caller's original? Both are useful, and Basie supports both. This chapter is about telling them apart, because almost every later idea in the book rests on that difference.

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

The record is one object, occupying one piece of storage with room for both fields inside it. A `Reading` takes three bytes, two for the number and one for the flag. Declaring `current` doesn't allocate anything from a heap or create a pointer. The storage is simply there, in the program's data, for the whole run.

## Copying a record

To keep the old reading while you update the current one, make a second record and copy into it:

```basie
var saved as Reading
saved = current
```

`saved` starts with every field at zero, or `false` for the flag. The assignment then copies the whole of `current` into it, both fields at once. Afterwards the two records hold equal values, but they are two separate objects. Changing `current.value` later leaves `saved.value` exactly as it was.

This is the same rule as Chapter 1, applied to a larger value. Assignment copies contents into existing storage. It never makes two names refer to the same record.

Whole-record assignment needs the same declared type on both sides. If you declared a second record type with exactly the same fields, say `Sample` with a `u16` and a `boolean`, you still couldn't assign a `Sample` to a `Reading`. The two types might mean quite different things, and Basie treats a type's name as part of its meaning. Matching layouts don't make two record types interchangeable.

## Working on the original

Now suppose a routine needs to update the current reading. Copying won't help here. The routine has to change the caller's record:

```basie
sub update(var item as Reading, value as u16)
    item.value = value
end
```

`item` is a record parameter, and record parameters behave differently from the scalar parameters of Chapter 3. Basie doesn't copy the record into the routine. Instead `item` becomes another name for the record the caller passed in. The usual word for this is an **alias**. When the program calls `update(current, 20)`, `item` refers to `current` itself, so `item.value = value` changes the caller's record.

The `var` in front of `item` gives the routine permission to write through that alias. The second parameter, `value`, is an ordinary scalar and still arrives as a copy.

![An aggregate copy creates independent contents, while a parameter supplies another path to one object.](../../assets/images/basie-book/book1/aggregate-storage-and-access.svg)

The diagram shows the two operations side by side. On the left, assignment has produced a second record with its own copy of the contents. On the right, the parameter is a second path to the one existing record. Nothing new was allocated.

There are two good reasons for passing records this way. The first is the one you've just seen: an update routine needs to reach the original. The second is cost. Copying a large record or array into every call takes time and stack space, and on a Z80 both are precious. An alias costs the same however large the record is.

An alias lasts only for the call. It can't be stored in a variable, kept in a field or returned to escape the call. Inside the routine, assigning to `item` as a whole copies new contents into the caller's record. It never makes `item` refer to some other record.

## Access with fewer permissions

A routine that only needs to look at a record should say so. Leaving out `var` makes the parameter read-only:

```basie
sub inspect(item as Reading) as u16
    return item.value
end
```

A read-only alias is called a **ticket**, like a ticket to look around a place you don't own. The routine can read every field and return copies of them, but it can't write through `item`. If you add `item.value = 0` to `inspect`, the compiler rejects the routine and reports that `item` is read-only.

The difference between `var` and no `var` is the first thing to check in any routine's declaration. It tells you whether calling the routine might change your data, without reading its body. A ticket also accepts things a writable parameter can't, such as a record constant or a string literal, because its declaration rules out changing them.

## The permission belongs to the path

A ticket restricts what one routine can do through one name. It doesn't freeze the record. Suppose a routine has a ticket for `current` and also changes the program variable `current` directly by name, or calls another routine that does. The record changes, and the change shows up through the ticket too, because there is only one record behind both names.

Basie's rules allow several paths to the same object like this, and make no guarantee that a writable alias is the only path to its record. What they do guarantee is that no path outlives the storage it reaches and no path reaches beyond it. That's the property that keeps memory safe. Keeping track of who changes what is still part of designing the program, and `var` makes that visible at every call.

## The complete comparison

This program puts copying, writing through an alias and reading through a ticket side by side:

<<< @/basie/book1/examples/ACCESS.BSI{basie}

Here's the state at each step:

| Step | `current.value` | `saved.value` |
| --- | ---: | ---: |
| Start of `main` | 12 | 0 |
| After `saved = current` | 12 | 12 |
| After `update(current, 20)` | 20 | 12 |

The copy took a snapshot of `current`'s contents. The update reached the original through an alias and changed it to 20. `inspect` then read that 20 through a ticket and returned a copy of the number. The final assertions confirm that the original changed and the copy didn't.

## A field or the whole record

The expression you pass determines what the routine receives. Passing `current.value` to a `u16` parameter copies one number, and the routine has no way to reach the record it came from. Passing `current` to a `Reading` parameter gives the routine access to the whole record.

So when you write a routine, ask what it actually needs. A calculation that only uses the value should take a `u16`. It's simpler, it can't change the record by accident and it works with numbers that don't come from a record at all. Reach for a record parameter when the routine needs several fields together, or needs to change the original.

## Read-only data

Records and arrays can be constants too. This example declares one of each:

<<< @/basie/book1/examples/08-records.BSI{basie}

`defaultCell` is a constant `Cell` and `masks` is a constant array of four bytes. Constant records and arrays must name their type, and no statement can change them, whether directly or through a `var` parameter. They can be read, copied into variables and passed to tickets. Here the program adds `current.value`, `defaultCell.value` and the last mask, 7 plus 7 plus 8, to get 22.

## Access is not responsibility

An alias gives a routine access to a record. It doesn't give the routine any say over how long that record lives. In `ACCESS.BSI`, `current` lives for the whole run and `saved` lives until `main` returns. When `main` calls `update`, `saved` is still alive and will stay alive until after `update` has returned. Any record a caller can pass is guaranteed to outlast the call, because the caller is still running while the call happens.

That guarantee comes easily when every record lives in program storage or in a routine's activation. Chapter 5 introduces records whose lifetimes are more flexible, records that can be created during the run and released when they are no longer needed. Once lifetimes can end at different times, someone has to be responsible for ending each one, and access alone won't settle who that is.

## Things to try

Change `update` so that it sets `usable` to `false` as well as changing `value`, then add assertions for both fields of `current` and `saved`. The copy should keep its old flag.

Remove `var` from `update`'s `item` parameter and leave the assignment in place. The compiler rejects the write. Put `var` back and the routine compiles again. The record's type and lifetime haven't changed at all. Only the routine's permission to write through that name has.

## Summary

- A record groups named fields of different types into one object.
- Assigning one record to another copies all of its contents. The two records stay separate.
- Record assignment needs exactly the same declared type on both sides.
- A record parameter is an alias for the caller's record. Nothing is copied.
- A `var` parameter may write through the alias. A parameter without `var` is a read-only ticket.
- Several paths may reach one record, and a change through one is visible through the others.
- An alias lasts only for the call and gives no responsibility for the record's lifetime.
