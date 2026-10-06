---
title: "In Good Hands"
parent: "Programming Basie"
nav_order: 5
nav_exclude: true
search_exclude: true
---

# In Good Hands

Every record so far has lived either for the whole run, as a program variable, or for the length of one routine call, as a local. Plenty of data fits neither pattern. Take a print queue. A job is created when someone sends a document, waits while other jobs print and is thrown away once it's done. It has to outlive the routine that created it, but keeping it for the whole run would waste space that the next job could use.

Most languages handle this with a heap, a large area of memory that hands out blocks on request. Pascal's `new` and `dispose` work this way, and so do C's `malloc` and `free`. A heap is flexible, and it is also where many of the worst memory bugs come from. Free a block too early and some other part of the program is left reading memory that now belongs to something else. Free it twice and the heap's own bookkeeping gets corrupted. Forget to free it and the memory is gone until the program ends. On a machine with a few tens of kilobytes to spare, that last one alone can sink a long-running program.

Basie has no general heap. Instead it has pools, and a rule about responsibility that makes all three of those mistakes impossible.

## Pools

A **pool** reserves a fixed number of slots for records of one type:

```basie
record Job
    number as u16
end

pool jobs as Job[2]
```

`jobs` has room for two `Job` records. The storage for both slots is reserved when the program is built, just like a program variable, so the size of the pool is known in advance and can't grow. What changes during the run is which slots are in use. At the start both are free. Allocating a record takes a free slot and starts that record's lifetime. Releasing it ends the lifetime and returns the slot for later use.

A fixed capacity can seem like a limitation at first, and it is one. It's also the kind of limit a small machine needs. You decide how many jobs the program can hold at once, and the program can never use more memory than you planned for, however long it runs.

## The handle and the record

`new` allocates a record from a pool:

```basie
var first = new jobs(7)
```

`new jobs(7)` takes a free slot, fills the new record's fields from the arguments in order, so `number` is 7, and returns a **handle** to that slot. The handle's type is `jobs`, the name of the pool. The local variable `first` holds the handle, and `first.number` reaches the record's field through it.

There are now two separate things. The handle lives in `first`, in `main`'s activation. The record lives in a pool slot, outside any activation. The handle is how you reach the record, rather like a cloakroom ticket that identifies your coat. If `main` were to return, its local `first` would end, but that by itself has no effect on the record in the pool.

This is where Basie needs a rule for who is responsible for the record. The answer is **ownership**. A handle of type `jobs` is an **owning handle**, and every allocated record has exactly one owner. The owner is the one place in the program responsible for that record's lifetime. When the owner goes away, the record is released.

## No copies of an owner

A scalar can be copied freely, because each copy is independent. An owner can't, and it's worth seeing why. Suppose this were allowed:

```basie
var first = new jobs(7)
var second = first
```

Now there would be two owners for one record. When `first` goes away, the record is released. When `second` goes away, it would be released again, and by then the slot might already hold a different job. Two owners mean two releases, and one of them is always wrong.

Basie rejects that program. The compiler reports that "an owning handle is moved, not copied: write move". To hand a record to a new owner, you write `move`:

```basie
var second = move first
```

`move first` takes the handle out of `first`, leaves `first` empty and gives the handle to `second`. The record doesn't go anywhere. It stays in the same slot with the same contents. What moves is the responsibility for it.

![An ownership transfer changes the responsible binding while the pool record stays in its slot.](../../assets/images/basie-book/book1/ownership-transfer.svg)

After the move, `first` can't be used to reach the record, because it doesn't hold it any more. The compiler tracks which owning locals have been moved from, through `if`, `select` and loops, and rejects any use of one that might be empty. A fresh handle straight from `new` doesn't need `move`, because there's no previous owner to empty.

## Passing responsibility into a call

A routine can take ownership through a parameter whose type is a pool:

```basie
sub consume(job as jobs) as u16
    return job.number
end
```

The parameter `job` is an owning handle, so calling `consume` hands the record over to the routine. The call has to say so:

```basie
var answer = consume(move first)
```

`move first` empties the caller's `first` and the routine's parameter becomes the owner. `consume` reads the job number and returns a copy of it. When `consume` returns, its parameter goes away, and because the parameter is the owner, the record is released.

The number the caller gets back is still perfectly good. It's a copy, a scalar in the caller's storage, and it has no connection to the record that was just released. This is the same reasoning that made scalar results safe in Chapter 3 when a routine's local storage ended.

## Release on every exit

Basie has no `free` statement. You never release a record by hand. Instead, release happens automatically whenever an owner goes away:

- when an owning local reaches the end of its block, by any path, including an early `return`
- when an owning parameter's routine returns
- when an owning variable is assigned a new handle, which releases the record it held before
- when the record or local array that holds an owner is itself released

An owner that has been moved from is empty, so nothing is released when it goes away. That's what makes the scheme work. Every allocated record has one owner, every owner is released exactly once and a moved-from owner releases nothing. So nothing is released twice, nothing is released while its owner still holds it and nothing is forgotten.

Records and arrays that contain owning handles follow the same rule. An array of owners can't be copied as a whole, because that would copy every owner inside it. Each owner inside it moves out individually, with `move`.

## Two slots, then reuse

This program uses both slots of the pool, releases one and reuses it:

<<< @/basie/book1/examples/OWNERS.BSI{basie}

Tracing the slots makes the sequence clear:

| Step | Slot A | Slot B | Owners in `main` |
| --- | --- | --- | --- |
| `first = new jobs(7)` | job 7 | free | `first` |
| `second = new jobs(9)` | job 7 | job 9 | `first`, `second` |
| `consume(move first)` returns 7 | free | job 9 | `second` |
| `replacement = new jobs(11)` | job 11 | job 9 | `second`, `replacement` |
| `main` ends | free | free | none |

After the first two allocations the pool is full. Calling `consume` moves job 7 into the routine, which releases it on return, so the third allocation finds a free slot. The assertions confirm the returned 7, the new record's 11 and the untouched 9 in the second job. When `main` ends, its two remaining owners go away and both records are released.

## When the pool is full

`new` assumes there is room. If every slot is in use, `new` stops the program with a `pool-full` trap. That's the right behaviour when running out of slots means the program has a bug, such as releasing records more slowly than it should. When running out is a normal possibility, such as a queue that might genuinely fill up, Chapter 7 shows `new?`, which reports a full pool as a value your program can test.

## Things to try

Move the line that allocates `replacement` above the call to `consume`. Both slots are still in use at that point, so `new` traps with `pool-full`. The program has the same allocations as before. Only the order has changed, and with it the number of records alive at the moment of each allocation.

Then restore the original order and mark, on a copy of the listing, where each record's lifetime begins and ends. Counting the live records at each step tells you whether the next allocation has room.

## Summary

- A pool reserves a fixed number of slots for records of one type. Its capacity never changes.
- `new` allocates a record in a free slot and returns an owning handle. `new` traps with `pool-full` if no slot is free.
- Every allocated record has exactly one owner, responsible for its lifetime.
- An owner can't be copied. `move` transfers it and leaves the source empty.
- A routine with an owning parameter takes over the record. It is released when the routine finishes with it.
- There is no `free`. A record is released automatically when its owner goes away or is overwritten.
- Records and arrays containing owners can't be copied as a whole.
