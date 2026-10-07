---
title: "Jobs Come and Go"
parent: "Programming Basie"
nav_order: 10
nav_exclude: true
search_exclude: true
---

# Jobs Come and Go

Chapters 5 and 6 worked with one or two jobs at a time, each owned by a local variable in `main`. In a real queue, jobs arrive, wait their turn, finish and leave. Later jobs take the slots they occupied. The program needs somewhere to keep the owners of all the waiting jobs. It also has to cope when more jobs arrive than it has room for.

## Two kinds of room

The queue needs room for the job records themselves and room for the owners of the waiting jobs:

```basie
pool jobs as Job[3]
```

```basie
var queue as jobs?[3]
```

The pool reserves three slots for `Job` records. The local array `queue` holds three optional owners, which all start as `none`. Each one can later hold a job's owning handle.

The pool limits how many job records can exist at once. The array limits how many positions the queue has. Here both are three, but they needn't be. A program might share one large pool among several small queues, each with its own array of owners.

## Lending an owning place

Adding a job means allocating a record and putting its owner into a queue position. The routine has to store into the caller's array element, so it needs access to the place as well as the record:

```basie
sub addJob(var place as jobs?, value as u16) as boolean
```

A `var` parameter of an optional owner type, such as `var place as jobs?`, is called a **slot-holder**. It lends the routine an owning place, which is a variable, field or array element that holds a handle or `none`. The routine can move an owner into the place, move one out of it or overwrite it. A lease lends the record and can't release it. A slot-holder lends the owner's place, so the routine can change what the place owns.

Inside, `addJob` tries `new?` and selects the result with `move`. If the pool had room, it moves the new owner into `place`:

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

After `place = move allocated`, the caller's queue position is the job's owner. The move emptied `allocated`, so nothing is released when the arm ends. If the pool was full, `addJob` returns `false` and leaves the place as it was.

## Taking a job out

`takeJob` moves the owner out of the queue position and returns the job number:

```basie
select move place
case some(taken)
    return taken.number
case none
    return 0
end
```

`select move place` empties the caller's queue position and moves its owner into `taken`. Returning from the arm ends `taken`, which releases the record. The job number survives because it's a copied scalar. The queue position is now `none` and ready for another job.

Returning zero for an empty position works only because this example never uses zero as a job number. Otherwise the routine would need another way to report an empty position, such as a Boolean returned alongside the number. Basie guarantees that the queue can't corrupt memory, but the meaning of its values is up to your program.

## Tracing the queue

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

The fourth add fails because the pool has no free slot, so `extra` stays `none`. Job 13 then takes the slot that job 7 released.

![Three pool slots fill, one record ends its lifetime, and a later record begins in the available storage.](../../assets/images/basie-book/book1/collection-lifetimes.svg)

Two things are reused here: `queue[0]` as a position in the queue and the slot that held job 7 as storage in the pool. Job 13 is still a different record from job 7. An identifier kept for job 7 would no longer match the slot's generation, so `select` would take its `none` arm.

## Replacing a job

Assigning a new owner to a place that already owns a record releases the old record. `addJob` allocates the new job *before* storing it in `place`. With a full pool the allocation fails first, so the old job survives even though the store would have released it. The cost is that a successful replacement needs a spare slot for a moment, while the old and new records both exist.

To discard the old job first, assign `place = none`, which releases the record. The old job is then gone whether the new allocation succeeds or fails. Neither order is right in every case, so choose the one that fits what the program should do when it runs out of room.

## Records that own records

The queue keeps all its owners in one array. Some structures, such as a linked list or a tree, are better built by letting each record own the next. Basie allows that through optional owning fields:

```basie
forward pool nodes

record Node
    value as u16
    next as nodes?
end

pool nodes as Node[3]
```

The record needs the pool's handle type, and the pool needs the record. `forward pool nodes` introduces the pool's name early, so the record can use `nodes?` ahead of the full pool declaration.

Each node owns the node after it, so the owner of the first node owns the whole chain. Releasing the first node frees every node after it, down to the end of the chain. Basie does this without recursion, using a fixed amount of stack for a chain of any length.

`STACK.BSI` builds a stack this way. `push` adds a value at the front and `pop` removes the front value:

<<< @/basie/book1/examples/STACK.BSI{basie}

`push` takes a slot-holder for the top of the stack. `new? nodes(value, move list)` allocates a node whose `next` field takes over the old top. If the pool is full, `new?` returns `none` without evaluating either argument. The `move list` never happens, and the stack stays as it was. Chapter 7 described this property of `new?`. Here it stops a full pool from losing the stack.

`pop` moves the top node out of `list` into `top`, moves `top.next` back into `list` and returns the value. When the arm ends, `top` is released. The move already emptied its `next` field, so no other node goes with it.

`main` pushes 7, 9 and 11 to fill the pool, so the fourth attempt fails. Popping 11 frees a slot for 13. Then the single assignment `stack = none` releases the whole chain of three nodes. All three slots are free again, so the next three pushes succeed. The pops return 3, 2 and 1, then zero once the stack is empty.

## Guarding against cycles

A chain of owners must end somewhere. Suppose a node owned a node that owned it back. That loop would have no outside owner to release it. Basie checks for this when an owner is stored into a field of a pool record. Before the store, the runtime walks up from the destination record through its owners. If the walk reaches the incoming record, the store would make a loop and the program stops with an `ownership-cycle` trap. Stores that can't form a loop, such as the ones in this example, skip the walk.

Use an identifier field, `id nodes?`, when one record must refer to another without owning it, such as a child's link back to its parent. An identifier owns nothing, so it can refer to any record without creating a cycle.

## Things to try

In `COLLECT.BSI`, take the jobs in a different order, say `queue[2]` before `queue[1]`, and adjust the assertions to match. Then add a second replacement after the first removal and count the live records after every step.

In `STACK.BSI`, remove the line `stack = none` and predict which assertion fails. The three nodes from the first half are still on the stack, so the pool is full and the next push returns `false`.

## Summary

- An array of optional owners, such as `jobs?[3]`, holds the owners of a changing collection. Its capacity is separate from the pool's.
- A `var` parameter of an optional owner type is a slot-holder. It lends an owning place, which the routine can fill, empty or replace.
- `select move` on a slot-holder takes its owner out and leaves the place empty.
- Positions and pool slots are both reused, but a new record is never the old one.
- Allocating before replacing protects the old record when the pool is full, at the cost of needing a spare slot.
- Optional owning fields let a record own another record. Releasing the first record frees the whole chain.
- `forward pool` lets a record refer to its own pool's handles.
- Storing an owner that would create a cycle traps with `ownership-cycle`. Identifiers refer without owning.
