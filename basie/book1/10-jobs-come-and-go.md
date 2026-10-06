---
title: "Jobs Come and Go"
parent: "Programming Basie"
nav_order: 10
nav_exclude: true
search_exclude: true
---

# Jobs Come and Go

Chapters 5 and 6 worked with one or two jobs at a time, each owned by a local variable in `main`. A real queue is busier than that. Jobs arrive, wait their turn, finish and leave, and the slots they occupied are taken by later jobs. The program needs somewhere to keep the owners of all the waiting jobs, and it needs to cope when more jobs arrive than it has room for.

This chapter builds a small queue of jobs and then a stack in which each record owns the next. Both use only the rules you already know. What's new is putting those rules to work on a collection whose membership keeps changing.

## Two kinds of room

The queue needs room for two different things. It needs room for the job records themselves, and it needs room for the owners that keep track of which jobs are waiting:

```basie
pool jobs as Job[3]
```

```basie
var queue as jobs?[3]
```

The pool reserves three slots for `Job` records. The local array `queue` holds three optional owners, each of which is either a job's owning handle or `none`. Every element starts as `none`.

These are separate capacities with separate jobs. The pool limits how many job records can exist at once. The array limits how many places the queue has to keep them. Here both are three, but they needn't be. A program might have one large pool shared by several small queues, each with its own array of owners.

## Lending an owning place

Adding a job means allocating a record and putting its owner into one queue position. A routine that does this needs to put something *into* the caller's array element, which means it needs access to the place as well as the record:

```basie
sub addJob(var place as jobs?, value as u16) as boolean
```

A `var` parameter of an optional owner type, such as `var place as jobs?`, is called a **slot-holder**. It lends the routine an owning place: a variable, field or array element that holds a handle or `none`. The routine can move an owner into the place, move one out of it or overwrite it. That's quite different from a lease, which lends the record but gives no way to release it. A slot-holder lends the owner's place, so the routine can change what the place owns.

Inside, `addJob` tries `new?`, selects the result with `move` and, if there was room, moves the new owner into `place`:

```basie
var candidate = new? jobs(value)
select move candidate
case some(allocated)
    place = move allocated
    return true
case none
    return false
end
```

After `place = move allocated`, the caller's queue position is the job's owner. `allocated` has been emptied by the move, so nothing is released when the arm ends. If the pool was full, `addJob` returns `false` and the place is left exactly as it was.

## Taking a job out

Removing a job works the other way round. `takeJob` moves the owner out of the queue position and returns the job number:

```basie
select move place
case some(taken)
    return taken.number
case none
    return 0
end
```

`select move place` empties the caller's queue position and gives its owner to `taken`. Returning from the arm ends `taken`, which releases the record. The job number survives as a copied scalar, and the queue position is now `none`, ready for another job.

Returning zero for an empty position is a convenience for this example, and it works only because the example never uses zero as a job number. If zero could be a real job number, the routine would need a different way to say that the position was empty, such as returning a Boolean alongside the number. Memory safety doesn't make that choice for you. It guarantees the queue can't corrupt memory, and it leaves what the queue's values mean up to your program.

## Following the membership

<<< @/basie/book1/examples/COLLECT.BSI{basie}

The trace follows the queue positions and the pool together:

| Step | `queue[0]` | `queue[1]` | `queue[2]` | Live records |
| --- | --- | --- | --- | ---: |
| Add 7, 9 and 11 | job 7 | job 9 | job 11 | 3 |
| Add 13 into `extra` fails | job 7 | job 9 | job 11 | 3 |
| Take `queue[0]`, returns 7 | none | job 9 | job 11 | 2 |
| Add 13 into `queue[0]` | job 13 | job 9 | job 11 | 3 |
| Take `queue[1]`, returns 9 | job 13 | none | job 11 | 2 |
| Take `queue[2]`, returns 11 | job 13 | none | none | 1 |
| Take `queue[0]`, returns 13 | none | none | none | 0 |
| Take `queue[0]`, returns 0 | none | none | none | 0 |

The first three calls fill the pool. Adding a fourth job fails, because there's no free slot, and `extra` stays `none`. Taking job 7 releases its slot, and job 13 takes it. The remaining calls empty the queue, and the last one finds nothing and returns zero.

![Three pool slots fill, one record ends its lifetime, and a later record begins in the available storage.](../../assets/images/basie-book/book1/collection-lifetimes.svg)

Two kinds of reuse are going on here, and it helps to keep them apart. `queue[0]` is reused as a place in the queue, and the slot that held job 7 is reused as storage in the pool. Job 13 is not job 7 in any sense. An identifier kept for job 7 would no longer match the slot's generation, so `select` would take its `none` arm.

## Replacement has a cost

Assigning a new owner to a place that already owns a record releases the old record. In `addJob`, though, the new job is allocated *before* it's stored in `place`. If the pool is full, the allocation fails first, even when storing the new job would have released an old one. The order protects the old job: when allocation fails, it's still there. The price is that a successful replacement needs a spare slot for a moment, while the old and new records both exist.

If you really mean to discard the old job before trying for a new one, the program can empty the place first, with `place = none`, which releases the record. That's a different operation with a different outcome on failure. The old job is gone whether the new allocation succeeds or not. Neither order is right in general. The choice depends on what the program should do when it runs out of room, and it's worth making on purpose.

## Records that own records

The queue keeps all its owners in one array. Some structures are better built by letting each record own the next, as in a linked list or a tree. Basie allows that through optional owning fields:

```basie
forward pool nodes

record Node
    value as u16
    next as nodes?
end

pool nodes as Node[3]
```

The record needs to mention the pool's handle type, and the pool needs to name the record. `forward pool nodes` breaks the circle by declaring the pool's name first, so the record can use `nodes?` before the pool itself is declared.

Each node owns the node after it, and whoever owns the first node owns the whole chain. Releasing the first node releases the node it owns, which releases the next, all the way to the end. Basie does this without recursion, using a fixed amount of stack however long the chain is.

Here is a stack built that way. `push` adds a value at the front, and `pop` removes the front value:

<<< @/basie/book1/examples/STACK.BSI{basie}

`push` takes a slot-holder for the top of the stack. `new? nodes(value, move list)` allocates a node whose `next` field takes over the old top. If the pool is full, `new?` returns `none` without evaluating either argument, so `move list` never happens and the stack is left exactly as it was. That's the property of `new?` from Chapter 7 turning out to be more than a detail.

`pop` moves the top node out of `list` into `top`, moves `top.next` back into `list` and returns the value. When the arm ends, `top` is released. Its `next` field was emptied by the move, so releasing it releases nothing else.

`main` pushes 7, 9 and 11, which fills the pool, and the fourth push fails. Popping 11 frees a slot for 13. Then `stack = none` releases the whole chain of three nodes in one assignment. The three pushes that follow succeed, which shows that all three slots really did come free. The pops then return 3, 2 and 1 in reverse order, and a pop on the empty stack returns zero.

## Guarding against cycles

A chain of owners must end somewhere. If a node could own a node that owns it back, the chain would have no first owner outside the loop, so nothing could ever release it. Basie prevents this with a check when an owner is stored into a field of a pool record. Before the store, the runtime walks up from the destination record through its owners. If it meets the record being stored, the store would make a loop, and the program stops with an `ownership-cycle` trap. Stores that can't possibly form a loop, such as the ones in this example, skip the walk.

When one record needs to refer to another without owning it, such as a child pointing back to its parent, use an identifier field, `id nodes?`. Identifiers don't own anything, so they can point anywhere without creating a cycle of responsibility.

## Things to try

In `COLLECT.BSI`, take the jobs in a different order, say `queue[2]` before `queue[1]`, and adjust the assertions to match. Then add a second replacement after the first removal and count the live records after every step.

In `STACK.BSI`, remove the line `stack = none` and predict which assertion fails. The three nodes from the first half are still on the stack, so the pool is full and the next push returns `false`.

## Summary

- An array of optional owners, such as `jobs?[3]`, holds the owners of a changing collection. Its capacity is separate from the pool's.
- A `var` parameter of an optional owner type is a slot-holder. It lends an owning place, which the routine can fill, empty or replace.
- `select move` on a slot-holder takes its owner out and leaves the place empty.
- Positions and pool slots are both reused, but a new record is never the old one.
- Allocating before replacing protects the old record when the pool is full, at the cost of needing a spare slot.
- A record can own other records through optional owning fields. Releasing the first releases the whole chain.
- `forward pool` lets a record refer to its own pool's handles.
- Storing an owner that would create a cycle traps with `ownership-cycle`. Identifiers refer without owning.
