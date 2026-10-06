---
title: "On Loan"
parent: "Programming Basie"
nav_order: 6
nav_exclude: true
search_exclude: true
---

# On Loan

Chapter 5 passed a job to a routine by handing over ownership, and the routine released the job when it finished. That's right for a routine whose purpose is to finish a job. It's wrong for nearly everything else. A routine that prints a job's details or bumps its priority should leave the job alive afterwards. If the only way to pass a job to a routine were to give it away, every inspection would end the job.

This chapter covers the two ways to reach a pool record without owning it. A **lease** lends the record to a routine for the length of one call. An **identifier** is a handle you can keep for as long as you like, which checks on every use that its record still exists.

## Lending a record

A routine that only reads a job can take an ordinary record parameter, exactly like the `Reading` parameters in Chapter 4:

```basie
sub inspectJob(item as Job) as u16
    return item.number
end
```

`item` is a ticket for a `Job` record. It doesn't mention the pool at all. When the caller passes an owning handle, as in `inspectJob(first)`, Basie lends the record in that handle's slot to the routine for the call. This is a **lease**. The caller keeps ownership throughout. The routine receives a `Job` record, reads it and returns, and the job carries on.

The routine receives no handle, so it has nothing it could move, overwrite or release. There's no way to end the job through `item`.

## Lending writable access

A `var` record parameter leases the record with permission to change it:

```basie
sub incrementJob(var item as Job)
    item.number = item.number + 1
end
```

Calling `incrementJob(first)` changes the job's number in its pool slot. Ownership doesn't move. When the call returns the lease is over, and the caller carries on using `first` as before.

![The owner remains responsible while a routine has temporary access to its record.](../../assets/images/basie-book/book1/lease-access.svg)

## The safety of a lease

A lease is safe because the record can't be released while the routine is using it. Only the owner can release a record, and Basie makes sure that nothing can reach the owner while the lease lasts.

The rule that does this is short. While a statement leases a record from an owner, that owner can't appear anywhere else in the same statement, apart from reading one of its scalar fields or taking `id(...)` of it. So a statement can't lend `first` to one argument while moving `first` into another, or assign a new handle to `first` while a call is using its record. The routine itself never receives the owner, so it can't release the record either. Between them those two facts cover every way the record could end during the call, and none of this needs a check at run time.

A lease doesn't stop the routine from changing the record's fields, and it doesn't stop other code from changing them. It protects the record's *lifetime*, which is the property that keeps memory safe. Changing fields is the routine's ordinary business, and `var` says whether it's allowed to.

## Keeping an identity

A lease ends when the call ends. Sometimes you need to refer to a record for longer than that without owning it. A display routine might keep track of which job is selected, or one job might record which other job it's waiting for. Neither should be responsible for releasing the job, but both need to find it again later.

`id(first)` makes an **identifier** for the record that `first` owns:

```basie
var remembered = id(first)
```

An identifier is an ordinary value. It can be copied, stored in a variable or a record field, compared and passed around freely. It doesn't own the record, so it never keeps the record alive and never releases it. Copying it doesn't create a second owner.

The catch is that the record might be released while the identifier still exists. Basie deals with this by making every identifier carry two things: the slot and that slot's **generation**. Each slot has a generation number that changes every time a record in it is released. An identifier made for job 7 records the slot and the generation job 7 had. If job 7 is released and job 11 later takes the same slot, the slot's generation has moved on, and the identifier no longer matches.

Every access through an identifier compares the two. If they match, the access goes ahead. If they don't, the program stops with a `stale-handle` trap rather than quietly reading job 11 as if it were job 7. In a language with ordinary pointers, that quiet wrong read is exactly what would happen, and a program could run for a long time on the wrong record before anything looked amiss.

## Testing an identifier first

A trap is right when a stale identifier means the program has a bug. Often, though, the record ending is a normal event, and the program should simply check. `select` tests an identifier without trapping:

```basie
select remembered
case some(found)
    result = found.number
case none
    result = 99
end
```

If the identifier's record is still alive, the `some` arm runs and `found` is a checked identifier for it. If the record has been released, or the identifier was empty to begin with, the `none` arm runs instead. Each arm is a block of its own, and `found` exists only inside the `some` arm.

The check is good at the moment it's made. If the `some` arm calls something that releases the record, a later access through `found` is checked again and traps as usual. An identifier never extends a record's life. When you need the record kept alive for the length of an operation, a lease is the tool for that, not an identifier.

## A visit, then a departure

This program leases a job twice, consumes it and then checks an identifier made before the job ended:

<<< @/basie/book1/examples/LEASE.BSI{basie}

The pool has a single slot, which makes the reuse easy to follow:

| Step | The slot | `first` | `remembered` |
| --- | --- | --- | --- |
| `first = new jobs(7)` | job 7 | owns job 7 | not yet declared |
| `remembered = id(first)` | job 7 | owns job 7 | identifies job 7 |
| `inspectJob(first)` returns 7 | job 7 | owns job 7 | identifies job 7 |
| `incrementJob(first)` | job 8 | owns job 8 | identifies job 8 |
| `consumeJob(move first)` returns 8 | free | empty | stale |
| `replacement = new jobs(11)` | job 11 | empty | stale |

The first inspection reads 7 and leaves the job alive. The writable lease changes the number to 8. `consumeJob` then takes ownership and releases the job when it returns, handing back the scalar 8. A new job, number 11, takes the pool's only slot.

`remembered` still refers to the slot, but to the old generation. When `select` tests it, the `none` arm runs, even though the slot is occupied again, and `result` becomes 99. The final assertion confirms it. An identifier refers to a particular record, not to whatever happens to be in the slot it once used.

## Choosing the right interface

With leases and identifiers in hand, every routine that works with a job can take exactly what it needs:

| The routine needs to | Give it |
| --- | --- |
| use the job's number in a calculation | a `u16`, copied |
| read the job | a `Job` ticket, leased |
| change the job | a `var Job` parameter, leased |
| finish with the job and release it | a `jobs` owner, moved |
| find the job again later | an `id jobs` identifier, copied |

Choosing from that list is one of the main design decisions in a Basie program, and the declaration of each routine records the choice where every caller can see it.

## Things to try

Add a second call to `inspectJob` just after `incrementJob` and assert that both inspections around it see the right number, 7 before and 8 after. Both visits use the same live record, and neither creates an owner.

Then replace the whole `select remembered` statement with a direct access, `result = remembered.number`. The program still compiles, because `remembered` is a non-optional identifier and the generation check happens when the access runs. Running it stops with a trap:

```text
TRAP stale-handle at 0673
```

That's the generation check at work. The slot holds job 11 at that point, and reading it as if it were the old job is exactly the mistake the check exists to stop.

## Summary

- Passing an owning handle to a record parameter lends the record for the call. This is a lease.
- A leased routine gets a record, not a handle, so it can't release it. A `var` lease may change its fields.
- While a statement leases a record, its owner can't be used anywhere else in that statement, so the record can't end during the call.
- `id(h)` makes an identifier: a copyable, storable reference that never owns its record.
- Each identifier records its slot's generation. Access through a stale identifier traps with `stale-handle`.
- `select` tests an identifier without trapping and runs `some` or `none`.
- A stale identifier never matches a later record in the same slot.
