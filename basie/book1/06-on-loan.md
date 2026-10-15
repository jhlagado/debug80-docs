---
title: "Using Without Owning"
parent: "Programming Basie"
nav_order: 6
nav_exclude: true
search_exclude: true
---

# Using Without Owning

In Chapter 5 a routine took ownership of a job and released it when it returned. That suits a routine whose purpose is to finish a job. A routine that prints a job's details or changes its number should leave the job alive. If ownership had to move on every call, every inspection would end the job.

Basie has two ways to use a pool record without owning it. The owner can **lend** the record to a routine for the length of a call. A **weak handle** refers to a record for as long as you keep it, and every use of it checks that the record still exists.

## Lending a record

A routine that only reads a job can take an ordinary record parameter, exactly like the `Reading` parameters in Chapter 4:

```basie
sub inspectJob(item: Job): u16
    return item.number
end
```

`item` is a read-only alias for a `Job` record and doesn't mention the pool at all. The caller passes its owner, as in `inspectJob(first)`. The record still belongs to the caller, and the routine uses it for the length of the call. Basie calls this **lending** the record. The routine receives a `Job` record rather than a handle. It reads the record and returns, and the job carries on.

The call has no `move`, because ownership doesn't change hands. Writing `inspectJob(move first)` is an error, and the compiler reports that a record parameter doesn't take ownership.

## Lending writable access

A `var` record parameter lends the record with permission to change it:

```basie
sub incrementJob(var item: Job)
    item.number = item.number + 1
end
```

The call is written `incrementJob(var first)`, with `var` before the argument as well as on the parameter. The call changes the job's number in its pool slot, but ownership stays with `first`. When the call returns, the caller carries on using `first` as before.

![The owner remains responsible while a routine has temporary access to its record.](../../assets/images/basie-book/book1/record-lending.svg)

## Records that can be lent

A routine can lend two kinds of record. The first is the record of its own non-optional owner, a local or parameter of a type such as `HJob`. Chapter 7 introduces optional owners, which might be empty. The second is a record parameter that the routine was itself lent. A routine that receives `item: Job` can pass `item` on to another record parameter.

A fresh value can't be lent, because nothing would own its record. Store `new HJob(3)` in a variable first and lend that variable.

## The safety of lending

Lending is safe because the record can't be released while the routine is using it. The routine receives a record rather than the owner, so it can't move, overwrite or release the record. The caller can't release it during the call either.

The rule that ensures this is the **statement rule**. A statement that moves an owner can't also reach through that owner. Reaching through means selecting a field, as in `first.number`, or lending the record. The compiler rejects this statement because it does both:

```basie
var total = inspectJob(first) + consumeJob(move first)
```

Here `consumeJob` takes ownership, like Chapter 5's `consume`. The left call would use a record that the right call releases.

Overwriting an owner is allowed, even when the new value reads the old record:

```basie
first = new HJob(first.number + 1)
```

The right side is evaluated first, and the old record is released only after the new one is stored. The pool needs a free slot for a moment while both records exist.

None of this needs a check at run time. Lending protects the record's *lifetime*, which is what keeps memory safe. Other code can still change the record's fields, and `var` controls whether the routine itself may change them.

## Weak handles

A loan ends with the call, but sometimes you need to refer to a record for longer without owning it. A display routine might keep track of which job is selected. A job might record which other job it's waiting for. Neither should be responsible for releasing the job, but both need to find it again later.

A **weak handle** refers to a record without owning it. Its type is the pool's name with `weak` in front, as in `weak HJob`. To make one, write an owner where a weak handle is expected:

```basie
var remembered: weak HJob = first
```

The declared type of `remembered` decides what it receives. It is weak, so it gets a weak handle to the record that `first` owns. `first` is unchanged and still owns the record.

The type has to be written, because `var remembered = first` would copy an owner. The compiler rejects that with "an owner is moved, not copied". The same rule applies wherever a weak handle is expected: a weak field of a record, a weak parameter or a routine's weak result.

A weak handle can be copied, stored in a variable or a field and passed to other routines freely. It can be compared with `=` and `<>` against another weak handle or an owner of the same pool. `remembered = first` is true while both refer to the same record. A weak handle never keeps its record alive, and it can never become an owner.

## Checked at every use

The record might be released while a weak handle to it still exists. To detect this, every weak handle carries two things: the slot and that slot's **generation**. Each slot has a generation number that changes every time a record in it is released. A weak handle made for job 7 records the slot and the generation job 7 had. Suppose job 7 is released and job 11 later takes the same slot. The slot's generation has then moved on, and the weak handle no longer matches.

Every access through a weak handle compares its generation with the slot's. If they match, the access goes ahead. If they don't, the program stops with a `stale-handle` trap rather than quietly reading job 11 as if it were job 7. With ordinary pointers, that quiet wrong read is exactly what would happen. A program could then run for a long time on the wrong record before anything looked amiss.

Access through `first` needs no check, because `first` is the routine's own non-optional owner. The statement rule stops anything from releasing its record while the routine reaches through it. A record parameter needs no check for the same reason, and every other access is checked.

The check holds only at the moment it's made, so a record reached through a weak handle can't be lent. The compiler rejects `inspectJob(remembered)` and reports that a record reached through a weak handle can't be lent. During the call, the record's owner could release it. If a routine needs a value from the record, copy it into a local first, as in `var number = remembered.number`. Chapter 7 shows how to take ownership of a record so it can be lent.

## Testing a weak handle first

A trap is right when a stale weak handle means the program has a bug. Often, though, the record ending is a normal event. The program should then check with `select`, which tests a weak handle without trapping:

```basie
select remembered
case some(found)
    result = found.number
case none
    result = 99
end
```

If the record still exists, the `some` arm runs and `found` is a weak handle to it. If the record has been released, the `none` arm runs instead. Each arm is a block of its own, and `found` exists only inside the `some` arm.

`select` is the only test for a weak handle. Comparing one with `none` is an error, because a stale weak handle isn't `none`. The check also holds only at the moment it's made. If the `some` arm calls something that releases the record, a later access through `found` is checked again and traps as usual.

## Lending, then a stale weak handle

This program lends a job twice, consumes it and then tests a weak handle made before the job ended:

<<< @/basie/book1/examples/LENDING.BSI{basie}

The pool has a single slot, which makes the reuse easy to follow:

| Step | The slot | `first` | `remembered` |
| --- | --- | --- | --- |
| `first = new HJob(7)` | job 7 | owns job 7 | not yet declared |
| `remembered: weak HJob = first` | job 7 | owns job 7 | refers to job 7 |
| `inspectJob(first)` returns 7 | job 7 | owns job 7 | refers to job 7 |
| `incrementJob(var first)` | job 8 | owns job 8 | refers to job 8 |
| `consumeJob(move first)` returns 8 | free | empty | stale |
| `replacement = new HJob(11)` | job 11 | empty | stale |

The assertion `remembered.number = 8` reads the job through the weak handle, with a check. `consumeJob` then returns the scalar 8 and releases the job, and job 11 takes the pool's only slot. `remembered` still refers to that slot but to the old generation. It is no longer equal to `replacement`, even though both name the same slot. When `select` tests it, the `none` arm runs, and `result` becomes 99. A weak handle refers to a particular record, not to whatever is in the slot it once used.

## Choosing the right interface

Every routine that works with a job can now take exactly what it needs:

| The routine needs to | Give it |
| --- | --- |
| use the job's number in a calculation | a `u16`, copied |
| read the job | a read-only `Job` parameter, lent |
| change the job | a `var` parameter of type `Job`, lent |
| finish with the job and release it | an `HJob` owner, moved |
| find the job again later | a `weak HJob` handle, copied |

Choosing from that list is one of the main design decisions in a Basie program. Each routine's declaration records the choice where every caller can see it.

## Things to try

Add a second call to `inspectJob` just after `incrementJob` and assert that it sees 8. Both calls reach the same live record, and neither creates an owner.

Then replace the whole `select remembered` statement with a direct access, `result = remembered.number`. The program still compiles because `remembered` is a non-optional weak handle. The generation check happens when the access runs, and it stops the program with a trap:

```text
TRAP stale-handle at 071F
```

At that point the slot holds job 11, and the trap prevents the program from reading job 11 as the old job.

## Summary

- Passing an owner to a record parameter lends the record for the call. The caller keeps ownership, and the call has no `move`.
- A routine can lend its own non-optional owner's record, or a record parameter it was lent. A fresh value is stored in a variable before it is lent.
- The routine gets a record rather than a handle, so it can't release it. A `var` parameter may change its fields.
- A statement can't both move an owner and reach through it. Overwriting an owner is allowed.
- A weak handle, of type `weak HJob`, refers to a record without owning it. Writing an owner where a weak handle is expected makes one, and the declared type decides.
- Every access through a weak handle checks the slot's generation. A stale access traps with `stale-handle`.
- A record reached through a weak handle can't be lent.
- `select` tests a weak handle without trapping and runs `some` or `none`. A weak handle is never compared with `none`.
