---
layout: default
title: "Task-first Lanternfly"
parent: "Lanternfly White Papers"
nav_order: 2
---

# Task-first Lanternfly: an architecture direction

**Status: proposal.** This paper proposes an inversion of Lanternfly's
program model: a program is a set of declared task instances, the
scheduler is the language's implicit shape rather than something a
programmer writes, and a synchronous program is the special case of one
task. The companion paper,
[Cooperative tasks for Lanternfly](cooperative-tasks.md), supplies the
mechanism — the task pattern, the instance model, the lowering, the
scheduling machine and the timing doctrine. This paper states what the
language should *emphasize*, on the view that the mechanism changes what
Lanternfly is. Nothing here is in specification
0.6; every layer is staged in section 7 against what exists today.

## 1. The inversion

The ALGOL line — Pascal, C, the BASICs — is synchronous at its core:
a program is one thread of control, and concurrency, where it arrives at
all, arrives decades later as an add-on with a seam down the middle.
Lanternfly has no installed base and no compiler yet, so it can choose
its default. The proposal is to choose the other one:

- A program declares task instances. Running the program runs them,
  round-robin, in declaration order.
- Sequence is the local case: within one segment of one task, calls run
  to completion exactly as in any ALGOL-family language.
- A synchronous program is the degenerate case — one task, one segment,
  never yielding. Nothing is lost; the familiar shape remains available
  and costs what it always cost.

The moment a program has a second task, it has true multitasking on an
eight-bit processor with no operating system: the play field advances, a
cursor blinks, the keypad is watched — and the programmer never wrote a
main loop, because the language's idea of a program already is one.

## 2. Precedent

The inversion is older than the tradition it reverses. Occam on the
Transputer made concurrency ambient and *sequence* the marked construct —
`SEQ` was written explicitly. Hardware description languages make the
same choice: everything concurrent, sequence built. Esterel made `await`
a basic statement, and Céu carried that design to small embedded
targets. Go inverted the surface instead, keeping synchronous-looking
code over a scheduler that multiplexes every blocking call.

What has no precedent is this inversion on the eight-bit hobbyist
baseline. The Z80 programmer who wants several activities in flight
today writes a hand-flattened main loop in assembly — the very structure
the task pattern restores names to. Offering that programmer a language
whose *default* is the architecture they were already fighting toward is
the strongest single reason to choose Lanternfly over both BASIC and raw
assembly. The same shape scales upward to modern microcontrollers, where
the static-frame executor is proven practice; the Z80 is the floor, not
the ceiling.

## 3. The program model

In the proposed surface — hypothetical, staged in section 7 — a complete
interactive program reads:

```lanternfly
// Hypothetical task-first surface. Not part of 0.6.
task WatchKeypad()
    ...
end

task PromptForSpeed()
    ...
end

task BlinkCursor()
    ...
end

var poller as WatchKeypad
var prompt as PromptForSpeed
var blinker as BlinkCursor
```

A task is a type — a record with a body — and an instance is an
ordinary module variable of it. There is no `main`. The build generates
the scheduler over the whole program's task-typed module variables,
arrays elementwise, ordered by import resolution and then declaration;
task-typed record fields and locals are rejected in the first edition.
Every declared instance is scheduled from the first pass, so a task
meant to lie dormant designs its entry state as an idle wait — the
zeroed pool of ready tasks is a pool of tasks awaiting their start
condition, not a pool outside the schedule. The loop increments the
pass clock, advances each instance in order, and repeats. Under the
[reactive layer](reactive.md), the same instances advance in the logic
phase of each instant, after the logic effects — declaration order
within the phase order, which supersedes the bare round-robin
whenever a program declares reactive constructs.
Declaration order is schedule order within a phase, so execution is
deterministic —
the worst-case pass time is the scheduler's own poll and bookkeeping
plus the sum of each task's longest segment, and the whole schedule is
readable from the declarations alone.

Every piece of this exists today in manual form. The keypad machine in
the companion paper's section 7 is this program with the scheduler
written by hand as `main`; the instance records, the wait arms and the
clocks are unchanged. The inversion adds no mechanism — it moves the
mechanism's boilerplate from every program into the language, and
changes which shape a new program naturally takes.

The 0.6 entry rule is untouched for the synchronous case: a program with
an entry routine and no task declarations behaves exactly as the
specification states. The proposed extension is that a build manifest
may select the task-first shape instead of naming an entry; the
instances are the program's task-typed module variables, and the
generated scheduler is then the program.

## 4. Two worked programs

Both programs below are stage-1 doctrine: manual form, legal under 0.6,
with the scheduler written by hand as `main`. They assume the companion
paper's machinery — the `pendingKey` mailbox with its `pollInput` poller,
the `frames` counter incremented at the blanking interval, and the
section 3 blinker — and they are written the way a programmer would
write them, not the way a lowering would emit them.

### A pedestrian crossing

A traffic light cycles red, green, amber on the frame clock. A button
task consumes key presses and posts a crossing request; the light
consults the request during green and cuts the green phase short. Two
tasks, one shared byte, no main loop logic beyond the schedule itself:

```lanternfly
extern sub showRed()
extern sub showGreen()
extern sub showAmber()

const redFrames as u8 = 150      // three seconds at 50 Hz
const greenFrames as u8 = 200
const amberFrames as u8 = 100

enum LightState as u8
    starting
    inRed
    inGreen
    inAmber
end

record LightTask
    state as LightState
    wakeAt as u16
end

var crossingRequested as boolean = false

sub advanceLight(t as LightTask)
    select t.state
    case starting
        showRed()
        t.wakeAt = frames + redFrames
        t.state = inRed
    case inRed
        if frames - t.wakeAt >= $8000 then
            return                        // asleep until red expires
        end
        showGreen()
        t.wakeAt = frames + greenFrames
        t.state = inGreen
    case inGreen
        if not crossingRequested and frames - t.wakeAt >= $8000 then
            return                        // green holds unless requested
        end
        crossingRequested = false
        showAmber()
        t.wakeAt = frames + amberFrames
        t.state = inAmber
    case inAmber
        if frames - t.wakeAt >= $8000 then
            return
        end
        showRed()
        t.wakeAt = frames + redFrames
        t.state = inRed
    end
end

record ButtonTask
    state as u8
end

sub advanceButton(t as ButtonTask)
    select t.state
    case 0
        if pendingKey = 0 then
            return                        // the wait: no press yet
        end
        pendingKey = 0
        crossingRequested = true
    end
end

var light as LightTask
var button as ButtonTask

sub main()
    while true
        pollInput()
        advanceLight(light)
        advanceButton(button)
    end
end
```

The program demonstrates the shape's economies. Timed sequencing is the
sleep idiom four times over, and the pedestrian feature — normally a
tangle of flags threaded through a main loop — is one shared Boolean
with one writer and one consumer. The all-zero rule holds throughout:
both task records start at their fresh states with nothing initialized
by hand. On hardware without the blanking interrupt, the same program
runs on the pass clock with calibrated constants.

### A background checksum

Long work beside a live display. The worker sums a kilobyte of storage
in 64-byte chunks — one chunk per step, position and running sum in the
record — while the companion paper's blinker keeps the cursor alive.
When the sum completes, the program reports it:

```lanternfly
const chunkSize as u16 = 64

var sample as u8[1024]

enum SumState as u8
    summing
    finished
end

record SumTask
    state as SumState
    position as u16
    checksum as u16
end

sub advanceSum(t as SumTask) as boolean
    var counted as u16 = 0

    select t.state
    case summing
        while counted < chunkSize
            t.checksum = t.checksum + sample[t.position]
            t.position = t.position + 1
            counted = counted + 1
        end

        if t.position = count(sample) then
            t.state = finished
            return false
        end

        return true
    case finished
        return false
    end

    return false
end

var background as SumTask
var blinker as BlinkState

sub main()
    while advanceSum(background)
        blinkStep(blinker)
    end

    writeUnsigned(background.checksum)
end
```

This is the loop doctrine of the companion paper's section 9 in one
routine. The inner `while` is a bounded data loop — 64 iterations, a
known, summable segment cost — so it runs inline and stays atomic. The
outer traversal of 1,024 bytes is too long for one segment, so it is
chunked: sixteen steps, with the cursor blinking between every pair.
`counted` is scratch and stays a local; `position` and `checksum` must
survive between steps and live in the record. `chunkSize` is the whole
latency-throughput trade, adjustable in one place. And the finished sum
is not an event to catch: it sits in `background.checksum`, ordinary
storage, read whenever the reader is ready.

## 5. What does not change

The inversion is an emphasis, not a new machine. Everything that makes
Lanternfly what it is survives untouched:

- **Static allocation.** Every task instance is a record of known size
  in the build-time storage map, placeable with `at`. Two tasks or
  twenty, the program's memory is fully accounted before it runs.
- **The stackless rule.** A task pauses only in its own body, never
  inside a callee. This is what lets every ordinary routine keep its
  static frame and be shared by all tasks; it is load-bearing and it
  stays.
- **Run-to-completion.** A segment finishes before anything else runs.
  There is no preemption, no interleaving inside a statement, and no
  synchronization vocabulary to learn, because there is nothing to
  synchronize against.
- **Predictability.** The scheduler is a loop; its cost is the sum of
  its parts; the parts are visible in source. Nothing is deferred to a
  runtime the programmer cannot read.

The cognitive claim, stated as the design intends it: a programmer pays
for the second task by learning one idea — a task advances one step and
returns — and receives what reads as true multitasking. The explosion of
expressive power comes from composition, not from new machinery per
task.

## 6. The reactive consequence

Task-first is what makes a Lanternfly Glimmer natural rather than
grafted, and the account this section first gave — version counters on
state variables, effects as tasks comparing remembered versions — is
superseded by [Reactive Lanternfly](reactive.md), which replaces the
per-effect version bookkeeping with changed-bit masks, phased delivery
and compiler-inferred wiring. What survives of this section is its
claim, which the reactive paper makes good: the dependency graph is not
a runtime data structure but compile-time wiring; there is no virtual
display list, no diffing and no subscription table; and
Glimmer-for-Lanternfly is language constructs plus a platform drawing
module — not a preprocessor.

## 7. Staging

The direction is adoptable in steps, each useful without the next:

1. **Doctrine, now.** Programs in examples and teaching material are
   written as tasks with a hand-written scheduler `main` — the companion
   paper's machine. This costs nothing and is legal 0.6.
2. **The generated scheduler.** Task instance declarations and the
   implicit scheduler enter the language. This is a small, bounded
   compiler feature — a loop and a dispatch, both derivable from the
   declarations — and it is the step that inverts the default. It does
   not require the `yield`/`wait on` sugar: manual step routines under the
   declared-instance model already read task-first.
3. **The full surface.** The `task` type form, `yield` and `wait on`,
   as the companion papers define them — budget-gated, and at real risk on the
   Candlemoth reference compiler. A larger implementation adopts
   them without touching layers 1 and 2.

The layering protects the Candlemoth goal: the emphasis can lead the
language's books, examples and libraries long before any compiler
carries the syntax, and a minimal compiler carries a maximal paradigm.

## 8. Open questions

- **Failure.** How a failable step routine reports to the scheduler —
  whether a task may `fail`, and what answers it — is undesigned. The
  working assumption is that step routines are non-failable and handle
  their errors internally, as `main` must today.
- **Ordering beyond round-robin.** Priorities, or tasks that run only
  when signalled, are refinements with an Embassy-shaped answer; none is
  needed for the first evidence.
- **Interrupts.** The companion paper's boundary stands — handlers set
  counters and mailboxes, the scheduler resumes tasks — and preemptive
  resumption stays out of scope.
- **Naming.** Whether the declared-instance program model is a language
  rule or a target capability, and what a mixed program (entry plus
  tasks) means, belongs to the specification work of stage 2.

## 9. Relation to the evidence plan

This paper adds one item to the companion paper's adoption path: the
first real program written task-first end to end — Tetro is the
candidate — judged on whether the task decomposition reads more clearly
than the equivalent flattened loop. If it does not, the inversion fails
its own test and the pattern remains what it already is: a good library
convention. If it does, stage 2 is justified, and Lanternfly's books
teach programs as sets of tasks from the start.
