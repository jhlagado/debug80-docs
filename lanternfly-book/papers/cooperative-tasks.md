---
layout: default
title: "Cooperative Tasks for Lanternfly"
parent: "Lanternfly White Papers"
nav_order: 1
---

# Cooperative tasks for Lanternfly: an architecture proposal

**Status: proposal.** This paper proposes cooperative multitasking as a
facility of the Lanternfly language: adopted now as a blessed coding
pattern — everything in sections 3 through 5 is legal under specification
0.6 and costs the compiler nothing — and adopted later as built-in syntax
by any implementation whose size budget carries it. The Candlemoth
reference compiler may prove too small for the syntax layer; that risk is
why the syntax is Deferred rather than proposed outright, and it does not
touch the pattern. The paper is written as a complete handoff: the
problem, the pattern, the instance model, a full lowering, the scheduling
machine and the timing doctrine, with worked examples fixing every shape —
a paginated generator closing section 6, a task blocked on a polled keypad
closing section 7, and a rate-limited device poller in section 8.

The document is kept in step with the working specification. Every claim
about the language cites a specification section, and a change to any cited
section obligates a review here. Baseline: specification 0.6 as of this document's last revision;
the pattern uses facilities already present in 0.5, except the
image-fresh reset of section 6, which uses 0.6's constant-name
initializer.

## 1. The problem on the target

A TEC-1G program runs on one Z80 with no operating system. Input arrives by
polling, the display is refreshed by the program, and interrupts carry at most
a timer tick. The platform has no threading tradition because it has no
threads.

Games still need several activities in flight at once: the play field
advances, a cursor blinks, the keypad is watched, a melody plays. Today each
activity is flattened into one main loop by hand — every routine that would
naturally pause must instead be split into flag checks and counters
spread through the loop body. The program works, and the structure of each
activity is gone: reading the cursor-blink logic means reassembling it from
fragments interleaved with everything else.

Cooperative multitasking restores that structure. Each activity keeps its own
small state and advances one step each time the main loop calls it. No
preemption, no stacks to switch, no operating system — a discipline for
organizing what the polling loop already does.

## 2. The proposal

The proposal has four layers, each standing on the one below, each with
its own status.

1. **The pattern — proposed for adoption now.** A task is a record plus a
   step routine (section 3), legal under specification 0.6 with zero
   compiler cost. Adoption means the section 5 convention governs example
   programs, fixtures and teaching material from here on.
2. **Instances — Direction.** The declared-instance model of section 6:
   one task body serving several concurrent instances, each a statically
   allocated record, with no allocation machinery anywhere.
3. **Surface syntax — Deferred.** `task sub`, `yield` and `await`
   (sections 6 and 7), adopted by an implementation only when its size
   budget carries the rewrite. The Candlemoth reference compiler may
   never have the room; a larger implementation can adopt the syntax
   without touching the pattern, because the syntax is defined as a
   lowering onto it.
4. **Scheduling and timing — proposed as library doctrine.** The
   scheduler loop, the mailbox seam and the two-clock timing model
   (sections 7 and 8) are conventions and library material, not language.

The sequencing is deliberate and mirrors the evidence rule of
specification section 16: the manual pattern goes into example programs
and teaching material first, and each further layer advances on the
evidence of real programs, not on anticipation. Section 11 states the
gates.

If the layers survive those gates, this feature belongs in the language
specification as a core facility. The claim of novelty is narrow and
checkable: the BASIC lineage has never carried structured concurrency.
The eight-bit BASICs offered at most an event hook such as
`ON TIMER GOSUB`, with no persistent task state; the modern descendant
that did gain `Async`/`Await` — VB.NET — delivers it through
heap-allocated state machines on a runtime the program cannot see. Await
and generators with every byte statically allocated and every cost
visible in the storage map, on an eight-bit target, has precedent in
Rust's embedded executors and none in BASIC's own family.

A companion paper, [Task-first Lanternfly](task-first.md), proposes the
program-level inversion this mechanism enables — a program as a set of
declared task instances, with the scheduler as the language's implicit
shape — and stages it against the layers above.

The presentation rule for this material, everywhere it appears, comes from
one observation about JavaScript — working experience of that ecosystem,
not a measured corpus. Direct use of generators (`function*`, `yield`) is
rare in everyday JavaScript, while `async`/`await`, which is built on the
same mechanism, is routine. The lesson, if that experience holds: readers adopt
this pattern when it is framed as *running several activities on one Z80*,
and pass it by when it is framed as lazy sequences. Teaching material should
lead with the cooperative-task reading; the generator reading is a closing
observation.

## 3. The pattern in Lanternfly 0.5

Code fences in this paper are module excerpts. Routines they call and
imports they need — `toggleCursor`, the standard text modules, the
scheduler's pass-clock increment — belong to the complete module and are
not reshown.

A task is a record plus a step routine. The record holds a state field and
whatever must survive between turns. The step routine is a `select` on the
state field (section 9.2): each case is one segment of the activity, the code
between two pauses. Advancing the state and returning is the pause.

A cursor blinker on a timer tick:

```lanternfly
const blinkRate as u8 = 25

volatile var tickFlag as u8 at $8400

record BlinkState
    state as u8
    countdown as u8
end

sub blinkStep(blink as BlinkState)
    select blink.state
    case 0
        blink.countdown = blinkRate
        blink.state = 1
    case 1
        if tickFlag = 0 then
            return
        end

        tickFlag = 0
        blink.countdown = blink.countdown - 1

        if blink.countdown = 0 then
            toggleCursor()
            blink.countdown = blinkRate
        end
    end
end
```

The address `$8400` is illustrative. State 0 initializes; state 1 waits for
the tick and counts down. Each call to `blinkStep` runs exactly one segment
and returns, so a call costs microseconds whether or not the tick has
arrived. (Section 8 supersedes the tick flag for timekeeping: a consumed
flag serves one reader and drops a tick that lands between test and
clear, so time crosses the boundary as a counter. The flag stays here as
the simplest first illustration.)

A value-producing task — a generator in the JavaScript sense — returns a
value from each segment. A melody player that yields the next note on every
call:

```lanternfly
const melody as u8[8] = [0, 4, 7, 12, 7, 4, 0, 0]

record MelodyState
    state as u8
    position as u8
end

sub nextNote(player as MelodyState) as u8
    select player.state
    case 0
        player.position = 0
        player.state = 1
        return melody[player.position]
    else
        player.position = player.position + 1

        if player.position = 8 then
            player.position = 0
        end

        return melody[player.position]
    end
end
```

The scheduler is the main loop: one module-declared record per task, and
one call to each step routine per pass:

```lanternfly
var blinker as BlinkState
var player as MelodyState

sub runFrame()
    blinkStep(blinker)
    updateSound(nextNote(player))
    updatePlayfield()
end
```

Every piece of this is ordinary 0.5 Lanternfly: records (section 5), `select`
(section 9.2), aggregate parameters aliasing caller storage (section 11.3),
volatile flag bytes (section 4.4). Two instances of the same task are two
records passed to the same step routine. All storage is static and sized
during compilation.

## 4. The fit with existing language decisions

Three 0.5 decisions, made for other reasons, combine to make this the natural
multitasking shape for the language.

**Static frames (section 11.7).** In a stack language, a suspended routine's
frame dies when it returns, so coroutines must capture stacks or allocate on
a heap. Lanternfly locals may live in static temporaries and aggregates are
static always, so a frame that outlives its call is a small variation on how
frames already work. The task record *is* the persistent frame, placed like
any other record.

**Routine names are not values (section 11.7).** A task cannot carry a resume
pointer, and needs none: the specification already permits a backend to lower
a dense `select` to a jump table without exposing code addresses to the
program. Dispatch on the state field is that mechanism, written by hand.

**Aggregate parameters alias caller storage (section 11.3).** The caller's
declaration fixes where each task's record lives — module storage, an array
of tasks, a `far` region. Instantiation is declaration; there is no
allocation to design.

One consequence of section 4.2 is worth adopting as doctrine: zero-initialized
storage of the record types above is a fresh task, because state 0 is the
fresh state. A task array in zeroed RAM is a pool of ready tasks with no
initialization pass.

The stackful alternative — one machine stack per task, switched by swapping
SP — is rejected despite being classically cheap on the Z80. Static
temporaries are invalid wherever overlapping invocations can reach them
(section 11.7); with stack switching, any routine reachable from two tasks
is overlapping, which forces the whole call graph onto stack frames and
abandons the static-frame model. The state-machine form is the coroutine
variant consistent with the language, and it is also the one whose memory
cost is visible in the source: the task record.

## 5. The convention

The convention below is the adoptable core of the proposal. It is strict on
purpose: every example, test and book chapter that follows it becomes a
mechanical test case for the deferred syntax of section 6, because that
syntax is correct exactly when it emits what the convention already prescribes
by hand.

1. A task type is a record whose first field is `state as u8`. An
   enumeration declared `as u8` whose ordinal-0 member is the fresh state
   satisfies this rule, and section 9.2's exhaustiveness warning then
   covers the step routine's `select`.
2. State 0 is the fresh state. Zero-initialized storage is therefore a
   fresh task. A task type with per-instance start values is instead
   image-fresh: its instances initialize from a `const` template record,
   and reset is aggregate assignment from the template rather than
   `clear` (section 6).
3. A task that terminates reserves state 255 as the done state. Its step
   routine returns immediately in that state, so driving a finished task is
   harmless. Perpetual tasks (the blinker, the melody) omit it. In the
   enumeration form the done member's ordinal is immaterial; the name
   carries the rule.
4. Each task type has exactly one step routine, taking the record as its
   first parameter. Additional parameters carry per-turn inputs.
5. Each `case` arm is one segment. A segment ends by assigning the next
   state and returning, or by returning with the state unchanged to wait.
6. A value-producing step routine declares a result and returns a value on
   every path; its wait states return a designated idle value, or the
   calling code reads the state field before the call. A producer whose
   sequence can end instead returns a continuation Boolean — `true` after
   storing a value in a record field, `false` when finished — which is the
   shape the section 6 lowering synthesizes.
7. Interrupt handlers and hardware communicate with tasks only through
   `volatile` module storage (section 4.4). A step routine reads flags; it
   never busy-waits on them, and it never calls a routine that blocks by
   contract, such as the standard `readCharacter`. Handlers are native
   code and never call
   Lanternfly routines — the firewall of the
   [static-frames paper](static-frames.md); this rule is its task-side
   face.
8. A step routine calls ordinary routines freely, but only the step
   routine's own body writes the state field. Pausing inside a
   callee is not expressible, which is the stackless restriction of
   section 6 arriving early.

## 6. Deferred surface syntax

**Deferred.** If the convention proves common in real programs, the compiler
can write the boilerplate. A marked routine — the working placeholder is a
word such as `task sub`, since Lanternfly marks every construct with words
and a JavaScript-style `*` sigil fits nothing else in the language — would be
written as a straight-line body with `yield` statements, and the compiler
would derive the record, the state numbering and the `select` skeleton:

```lanternfly
// Hypothetical syntax, not part of 0.6.
task sub blink()
    var countdown as u8 = blinkRate

    while true
        yield

        if tickFlag = 1 then
            tickFlag = 0
            countdown = countdown - 1

            if countdown = 0 then
                toggleCursor()
                countdown = blinkRate
            end
        end
    end
end
```

The semantic contract of the marked form, stated precisely because it
differs from the manual pattern underneath it: `yield` suspends the routine,
it does not return from it. Every local variable retains its value across
the suspension — the `countdown` above is initialized once and survives
every yield — exactly as a JavaScript generator's locals survive its
yields. In the manual pattern of section 3 the same pause is spelled
`return`, which ends the invocation and its locals with it; that is why the
convention requires all cross-turn state in the record. The sugar delivers
persistence by making the same move mechanically: locals of a marked
routine are hoisted into the synthesized frame record, so each becomes a
per-instance field, distinct between two instances and alive between turns.
Where JavaScript pays for this with a runtime-managed generator object, here
the caller-declared record is that object, and each persistent local's cost
is visible as bytes in every instance's record, reportable per task type
during compilation.

The transformation is a rewrite after name and type resolution, inside the
reference compiler rather than a preprocessing stage: it requires resolved
types to build the record and resolved control structure to place resume
points. Its output is not structured source but the compiler's control-flow
form — the lowering contract's IR, where a resume point is an ordinary
block label whatever loop it sits inside. For the single-pass,
direct-emitting reference architecture the real obstacle is not the
rewrite's bytes but buffering: a marked routine's resolved control-flow
form must be held whole before emission, a structural departure the size
gate alone does not measure. That is the reason the
transformation lives after parsing, and the reason no structured
source-to-source rewrite could express it. Its budget therefore counts
against the reference-compiler size gate. Two decisions keep that budget
small:

- **Frame contents.** The precise rule hoists into the record only locals
  live across a `yield`, which requires liveness analysis. The conservative
  rule hoists every local of the marked routine. The conservative rule costs
  a few bytes of RAM per task and no compiler analysis, and is the intended
  first implementation; a later compiler may shrink frames without changing
  any program's meaning.
- **Resume dispatch.** Each `yield` site becomes a labelled resume block in
  the control-flow form, and the routine's entry dispatches on the state
  byte to the matching label. The obligation is backend-neutral. A backend
  may realize the dispatch as a jump table — the section 11.7 permission
  applied to compiler-owned dispatch, roughly a dozen bytes per task type
  on the Z80 — or as a compare chain where a table pays worse.

`yield` would be legal only in the marked routine's own body, never in a
callee — the restriction rule 8 already imposes on the manual form, and the
same restriction Rust spells "await only inside async fn". Lifting it
requires capturing nested frames, which reintroduces everything section 4
rejected.

**Instance identity — Direction.** An instance is declared, not created.
A declaration form — the working placeholder is
`task directoryItems using readItems` — names one instance and statically
allocates its synthesized record, exactly as `var` allocates a declared
record. Several declarations over one routine are several instances: the
code exists once, the records separately. A fixed pool of instances is an
array of them, indexed like any table, so even a varying number of live
tasks is a build-time quantity. The synthesized record needs no
user-visible type name for any of this — the instance name is the
program's handle — which dissolves the name-collision question that
previously held this contract open; a name for the record type becomes
necessary only if instances cross a module interface, and that narrow
question stays open. Advancing names the instance: the step call is made
through the instance name, and its result reports completion exactly as
the manual convention prescribes. The initializers of retained locals run
on an instance's first advance and never again — in the lowered form they
are the opening assignments of a distinct entry state that only the first
advance visits. The fresh-state label may coincide with a loop's re-entry
point only when every initializer is zero and the entry state has nothing
to do, as in the reader below; a nonzero initializer forces its own entry
member. When every initializer is zero they cost nothing, because the
all-zero record is the fresh instance under convention rule 2; for an instance without arguments, `clear`
remains the reset, and the instance-arguments contract below adjusts it
for the rest. The
closure rule is rule 8 unchanged: only the marked routine's own locals are
hoisted, every callee remains an ordinary per-invocation routine, and
state smuggled into a callee is exactly the overlap section 4 rejects.
One grammar consequence is recorded explicitly: a marked routine admits
aggregate `var` declarations — the reader's `page` buffer below —
precisely because every such declaration denotes a field of the
synthesized record, never automatic storage; ordinary routines remain
scalar-only under section 11.4.

**Instance arguments.** A parameter of a marked routine is bound once
per instance and persists — exactly as a JavaScript generator's
arguments outlive its creation call — so the lowering treats it as one
more retained local: hoisted into the synthesized record, every access
rewritten to a field read. The only distinction is where the initial
value comes from: an argument's from the instance declaration, a
retained local's from its initializer. At the record level even that
distinction dissolves — every hoisted field has exactly one
initial-image value per instance, so an argument with a default value
and a retained local with an initializer are the same field, differing
only in whether the instance declaration may override the value.
Defaults therefore cost the lowering nothing; whether the surface
admits them is a deferred choice, since ordinary routines have no
parameter defaults and the asymmetry would need a ruling.

Because the step code is shared while argument values differ per
instance, those values must live in each instance's initial record
image — and that adjusts the reset doctrine. An argument-less task
keeps rule 2 unchanged: all-zero is fresh, `clear` is the reset. An
instance with arguments is *image-fresh*, and every piece of that is
legal 0.6: a record initializer expresses the image, a `const` template
names it, a declaration may take the template by name, and reset is one
aggregate assignment:

```lanternfly
// Hypothetical: task fastBlink using blinkAt(10)
// The manual form today:
record BlinkTask
    state as u8
    rate as u8
    countdown as u8
end

const fastImage as BlinkTask = BlinkTask(state = 0, rate = 10, countdown = 0)

var fastBlink as BlinkTask = fastImage    // declared fresh, argument installed

// Reset, wherever the owner needs it:
fastBlink = fastImage
```

With an enumeration state field, the template writes the member name —
`state = needPage` — never its ordinal, since an integer does not
convert to an enumeration in an initializer.

Instance arguments in a static declaration are compile-time constants,
because the image is static storage. A start value computed at runtime
is, in the manual form, the owner's assignment to the record's fields
before the first advance; a start operation carrying runtime arguments
is a further sugar decision, deferred with the rest. Per-turn inputs
are a different thing and stay rule 4's: extra step-routine parameters
carry fresh data into one advance and are never hoisted — the analogue
of the JavaScript `next(value)` channel.

The feature selects no runtime helper, places no bytes in programs that
do not use it, and has one meaning everywhere. What it is not,
necessarily, is kernel material in section 1.1's full sense: the kernel
is the closure the reference compiler is written in, and this paper
itself allows that Candlemoth may never carry the syntax. The natural
home is a declared capability in the style of recursion, which is what
the adoption path proposes; the size budget remains the deciding
constraint.

### A worked lowering: a paginated reader

The demanding test of the transformation is a `yield` inside nested loops,
because that is the case that looks as though it needs machinery beyond a
state byte. It does not. The task below reads items from a paged source —
a directory, a stored table, a device — and yields them one at a time
across page boundaries:

```lanternfly
// Hypothetical syntax, not part of 0.6.
task sub readItems() yields u16
    var pageNumber as u16 = 0
    var itemIndex as u8 = 0
    var itemCount as u8 = 0
    var page as u16[8]

    while true
        itemCount = fetchPage(pageNumber, page)
        if itemCount = 0 then
            return
        end

        for itemIndex = 0 until itemCount
            yield page[itemIndex]
        end

        pageNumber = pageNumber + 1
    end
end

task directoryItems using readItems
task archiveItems using readItems
```

`fetchPage` is an ordinary routine —
`sub fetchPage(pageNumber as u16, page as u16[8]) as u8` — that fills the
caller's array and returns how many items it placed. Under rule 8 it keeps
no cross-turn state of its own; everything that must survive a yield lives
in the task.

The lowering is legal 0.6 source today. The compiler derives one record —
the state first, then a field per retained local, plus one field as the
yield channel — and one step routine, a `select` inside a loop so that a
step runs to completion:

```lanternfly
enum ItemsState as u8
    needPage
    inPage
    done
end

record ItemsTask
    state as ItemsState
    current as u16
    pageNumber as u16
    itemIndex as u8
    itemCount as u8
    page as u16[8]
end

var directoryItems as ItemsTask
var archiveItems as ItemsTask

sub advanceItems(t as ItemsTask) as boolean
    while true
        select t.state
        case needPage
            t.itemCount = fetchPage(t.pageNumber, t.page)
            if t.itemCount = 0 then
                t.state = done
                return false
            end
            t.itemIndex = 0
            t.state = inPage
        case inPage
            if t.itemIndex < t.itemCount then
                t.current = t.page[t.itemIndex]
                t.itemIndex = t.itemIndex + 1
                return true
            end
            t.pageNumber = t.pageNumber + 1
            t.state = needPage
        case done
            return false
        end
    end
end

sub consumeDirectory()
    while advanceItems(directoryItems)
        recordItem(directoryItems.current)
    end
end
```

The correspondence, piece by piece:

- Each `yield` becomes three operations — store the value in the channel
  field, set the state to the resume point, return `true` — and resumption
  is the next call's `select` landing on the arm whose first line is the
  code that textually follows the yield. The program counter is an enum
  field.
- The nested loops dissolve into the state graph: `needPage` is the outer
  loop body, `inPage` the inner one, and the `while true` around the
  `select` stitches them, so one step fetches a page and yields its first
  item in a single call. A counted loop whose body yields cannot survive as
  a `for` — its control must persist across calls — so the lowering
  rewrites it to a field and explicit arithmetic, as the manual form
  writes it directly.
- Retained locals become fields. A temporary used only between yields
  would remain an ordinary scalar local under the precise frame rule; the
  conservative first implementation hoists it too, at a few bytes per
  instance.
- Every initializer here is zero, and `needPage` is ordinal 0, so a
  zero-initialized `ItemsTask` is a rewound reader and `clear` restarts
  it; nothing runs before the first advance.
- The lowered program contains no persistent locals at all. Persistence is
  two records of 23 bytes each (1 + 2 + 2 + 1 + 1 + 16), visible in the
  build-time storage map, placeable with `at`, while `advanceItems` exists
  once.

## 7. Awaiting and scheduling

**Proposed as library doctrine; the service-module packaging is Open.**
`async`/`await` is this pattern plus a scheduler. An awaiting
routine is a task whose yields mean *waiting on a condition* rather than
*here is a value*; `await keypress()` records what is awaited, yields, and on
resume checks the flag, yielding again if it is still clear. The manual form
of section 3 already expresses this — the blinker's state 1 is an await of
the tick flag.

The scheduler for a closed-world language is small. The set of tasks is
known during compilation, so the scheduler is a static task table driven by
a loop that calls the step routine of each entry whose ready flag is set.
Routine names are not values, so the dispatch is a `select` over task
identifiers — hand-written in the library form, compiler-synthesized in the
full form. Interrupt handlers and polled device reads set the volatile ready
flags; the loop clears them as tasks run.

The precedent is Rust on microcontrollers: the Embassy executor runs
compiler-generated state machines in statically allocated task frames, with
a poll loop and interrupt-set wake flags, on machines with a few kilobytes
of RAM and no heap. That architecture transplants to the Z80 directly, and
at TEC-1G scale the executor is tens of bytes.

Two specification interactions are worth recording before this layer firms
up:

- **Overlap.** This model creates none. A step routine runs to completion
  before the loop calls another, suspension inside a callee is not
  expressible under convention rule 8, and interrupt handlers only set
  flags. Two live task records that call the same ordinary routine
  therefore call it at different times, so the static temporaries of
  section 11.7 stay valid with no new analysis. An overlap check becomes
  necessary only if a later edition admits nested suspension or preemptive
  resumption, and its cost belongs to whichever edition proposes them.
- **Interrupt resumption.** Everything above resumes tasks from the main
  loop only; interrupt handlers set flags and return. Resuming a task from
  an interrupt handler is preemption and is out of scope for this
  direction.

### The machine in full: a task blocked on a polled keypad

The simplest complete machine on a Z80-class system is keyboard input.
The standard text-input service blocks by contract — `readCharacter` does
not return until a byte arrives — so a cooperative program takes its input
from a platform polled service instead, and the seam between the device
and the tasks is a one-slot mailbox:

```lanternfly
// Platform service: one non-blocking scan. 0 means no key, so the
// platform maps every scan code — the 0 key's included — to nonzero.
extern sub readKeypad() as u8

const carriageReturn as u8 = '\r'

// One-slot mailbox between the poller and its consumer.
var pendingKey as u8 = 0

sub pollInput()
    if pendingKey = 0 then
        pendingKey = readKeypad()
    end
end
```

A task awaiting a key is blocked in the form of a wait state: its arm
tests the mailbox and, finding it empty, returns with the state
unchanged. Those two lines are the await. A sugared
`key = await keyPress()` would lower to exactly this arm:

```lanternfly
enum PromptState as u8
    awaitingKey
    finished
end

record PromptTask
    state as PromptState
    keysHandled as u16
end

sub advancePrompt(t as PromptTask) as boolean
    var key as u8

    select t.state
    case awaitingKey
        if pendingKey = 0 then
            return true          // the await: no key yet, yield control
        end

        key = pendingKey
        pendingKey = 0
        writeCharacter(key)
        t.keysHandled = t.keysHandled + 1

        if key = carriageReturn then
            t.state = finished
            return false
        end

        return true
    case finished
        return false
    end

    return false
end
```

The trailing `return false` satisfies the definite-return rule of
specification section 11.5, which exempts only `while true` from the
fall-past path — an exhaustive selection does not yet earn the same
credit. `key` demonstrates the scratch rule: it lives and dies within one step, so
it is an ordinary local, not a record field. The scheduler is the main
loop — poll the device, advance each task, repeat — and the section 3
blinker runs beside the prompt untouched, which is the cooperation made
visible: while one task waits, the other works.

```lanternfly
var prompt as PromptTask
var blinker as BlinkState

sub main()
    var promptAlive as boolean = true

    while promptAlive
        pollInput()
        promptAlive = advancePrompt(prompt)
        blinkStep(blinker)
    end
end
```

The costs are computable in advance. A blocked task's step is a `select`
dispatch, one compare and a return — a dozen or so Z80 instructions per
scheduler pass — and the loop's worst-case pass time is the sum of each
of the scheduler's own terms — the device poll, the pass-clock
increment, the loop jump — plus the sum of each
task's longest segment, so the machine is not merely deterministic but
predictable by addition. Nothing is allocated at any point: the mailbox is
one static byte, each task is one static record.

The JavaScript reading, for readers who arrive with it: `main`'s loop is
the event loop, `pollInput` is its I/O phase, each task record is the
closure a pending callback would capture, and `await` is a return to the
loop with the position saved in the record. `async`/`await` is a
generator wired to an event loop, and this is that machine with the task
set fixed at build — the "task list" is the visible sequence of calls in
the loop, not a heap of closures discovered at runtime. An
interrupt-driven variant changes one thing only: the handler fills the
mailbox, the mailbox becomes `volatile` under rule 7, and the tasks and
scheduler are unchanged. One consumer per mailbox is the working
doctrine; a key claimed by one task is gone from the slot.

## 8. Timing

**Proposed as convention.** A cooperative system needs delays: poll the
keypad no more than so often, blink at a steady rate, go away for roughly
half a second. The default hardware has no timer interrupt, and the
design builds from that constraint.

**Time is a counter, and the clock is whoever increments it.** Tasks
never wait on a flag for time; they compare against a monotonically
increasing counter. A flag is consumed by its first reader — one consumer
per flag, as with the mailbox — while a counter is read without being
destroyed, so one clock serves every task. The task-side idiom is
independent of the tick source, so the clock is a platform decision
rather than a language one.

Two clocks, two guarantees:

- **The pass clock — always available.** The scheduler increments
  `passes as u16` once per loop pass. The clock is elastic: a tick lasts
  as long as the current pass, so it slows as the system works harder.
  On a 4 MHz Z80 with short, non-blocking segments it runs in the low
  kilohertz. It costs one increment and no hardware, and it is the right
  clock for frequency ceilings: polling rate limits, debounce, retry
  spacing.
- **The frame clock — present when the platform provides it.** A display
  controller such as the TMS9918 interrupts at the blanking interval, 50
  or 60 times a second; the handler increments
  `volatile var frames as u16` and returns. The clock is rigid but
  low-rate: right for animation tempo, melodies and delays meant in real
  time, and it doubles as the display synchronization point, because a
  display task's natural await is the next frame. Only this counter is
  volatile, because only it has an asynchronous writer.

**Sleep is the await idiom with a clock as the condition.** A sleepable
task adds a deadline field, and its wait arm compares. The section 7
machine called `pollInput` on every pass; rate-limited, the poller
becomes one more task, asleep between scans:

```lanternfly
const pollInterval as u8 = 5    // pass-clock ticks

var passes as u16 = 0           // incremented once per scheduler pass

record PollerTask
    state as u8
    wakeAt as u16
end

sub advancePoller(t as PollerTask)
    select t.state
    case 0
        if passes - t.wakeAt >= $8000 then
            return              // sleeping: not due yet
        end

        if pendingKey = 0 then
            pendingKey = readKeypad()
        end

        t.wakeAt = passes + pollInterval
    end
end
```

The comparison is wrap-safe: `passes - t.wakeAt` wraps modulo 65,536, and
a result under `$8000` means the deadline has passed. The bound that
buys: no single sleep may exceed 32,767 ticks — eight seconds to half a
minute across the low-kilohertz pass-clock range, around ten minutes on
a 50 Hz frame clock — which is ample, and cheaper than widening the
counters to `u32`. In a
sugared form, `await sleep(pollInterval)` lowers to this arm exactly as
`await keyPress()` lowers to the mailbox test.

**A delay is a lower bound.** A sleep means *not before the deadline*,
never *exactly at it*. On the pass clock a tick is not even a fixed
duration; on the frame clock a long segment can push a wake past its
frame. Real time maps to ticks through a platform constant — half a
second is 25 on a 50 Hz frame clock — or, on the pass clock, through a
calibration figure. Because the call graph is fully static, a toolchain
report can sum worst-case cycles per segment and estimate the true pass
rate; the estimate calibrates delays without guaranteeing them.

**Segment size is the timing discipline.** The worst-case pass is the
sum of every task's longest segment, so the clock's resolution is only
as good as the largest segment is small. A segment whose cost rivals the
rest of the pass combined is split across two states — the pattern's own
mechanism, applied to itself. This, not any scheduler feature, is what
keeps missed frames rare.

Two refinements are recorded and deferred. A scheduler that reads a
conventional `wakeAt` slot could skip sleeping tasks without dispatching
them — the Embassy timer queue, which at this scale is a linear scan of
a static table. And on interrupt-clocked hardware an idle system could
`HALT` until the next frame; the default hardware has no interrupt to
wake on, so the spinning loop is the idle, and on this class of machine
idle spin has no cost that matters.

## 9. Loops and blocking

**Proposed as doctrine.** The one pathology a cooperative system admits
is the task that does not come back: a loop that runs too long blocks
every other task for its duration. The tempting language-level cure —
insert a yield into every loop automatically — is refused, for four
reasons in order of force:

- **The stackless rule already forbids it almost everywhere.** A yield
  is expressible only in a task's own body (rule 8). A loop inside an
  ordinary routine cannot yield without capturing the frames between the
  task and the loop — the machinery section 4 rejected. An automatic
  yield could therefore apply only to loops written directly in task
  bodies: a special case, not a language rule.
- **Atomicity between yields is the model's contract.** A step runs to
  completion, so between yields a task has the machine to itself and
  shared state is consistent whenever any other task runs. That is why
  the system needs no locks and no synchronization vocabulary. An
  implicit yield inside a loop exposes the loop's intermediate state to
  every other task, and the lock vocabulary returns through the back
  door. A yield point is where the programmer asserts that state is
  consistent; it must be visible in source.
- **Cost.** A yield-and-resume cycle costs on the order of a `select`
  dispatch, a return and a scheduler pass; a tight loop body on the Z80
  can cost less than that per iteration. A per-iteration yield would
  make the cheapest loops several times slower — and the loops that
  most need to stay cheap are exactly the ones a compiler lowers to
  tight code.
- **Predictability.** The worst-case pass is the sum of explicit
  segments. Implicit yields make timing a function of the data flowing
  through loops, invisible in source.

The doctrine distinguishes three kinds of loop:

1. **Bounded data loops run inline and stay atomic.** Lanternfly's
   arrays have compile-time shapes, so most trip counts are static: a
   traversal of `u8[64]` is a known, summable segment cost. At a 50 Hz
   frame rate a 4 MHz Z80 has roughly 80,000 cycles per frame, and a
   bounded loop over a small array spends a fraction of that. These
   loops are the common case and need nothing.
2. **Wait loops are forbidden, and were already.** Rule 7: a step
   routine reads flags and never busy-waits. Waiting is a wait arm —
   the await idiom — never a loop.
3. **Long or unbounded work is chunked.** A traversal too large for one
   segment saves its position in the task record and processes a fixed
   chunk per step. The section 6 paginated reader is this shape, and
   the checksum worker among the companion paper's worked programs is
   the minimal example. The chunk size is the programmer's explicit
   trade between throughput and latency, made in one visible constant.

Because trip counts are largely static, the anti-blocking answer is a
report rather than a runtime: the toolchain that sums worst-case cycles
per segment (section 8) can flag any segment exceeding a stated budget,
with a fraction of a frame as the natural unit. Blocking becomes a
visible, reviewable property at build, which is where this language
places its guarantees. The precedents that do insert implicit
preemption — Erlang's reduction counting, Go's runtime preemption —
own a virtual machine or a signal-driven runtime; a language with
neither makes the cost visible and lets the programmer place the cut.

On dispensing with loops in favour of bulk operations: the
map-filter-reduce vocabulary requires routine values, which the language
deliberately lacks. Lanternfly's counterparts are `for each` — traversal
without index bookkeeping — and the aggregate operations `clear`,
`fill`, `append` and whole-value copies. Those operations stay atomic by
design: a bulk operation that could yield halfway would expose a torn
aggregate, and at the array sizes an eight-bit machine holds, their
whole cost sits comfortably inside a segment budget. If evidence shows
chunked traversals dominating real programs, an explicit chunked-loop
form — a loop that names its yield interval — is the sugar to consider;
nothing implicit.

## 10. Consequences for Glimmer

Glimmer currently hosts Z80 assembly bodies inside a preprocessed page
structure. A Lanternfly with cooperative tasks inverts that relationship: the
framework becomes a library — task records, step conventions, a scheduler
routine — and a game becomes ordinary Lanternfly importing it, the way a
JavaScript application imports React rather than being preprocessed by it.
Pages, animations and input watchers are tasks; the Glimmer preprocessor's
sequencing role is absorbed by the scheduler.

This is the most speculative claim in the document and the one with the
largest payoff: it would retire a whole toolchain stage. It becomes testable
only after the compiler exists, by rewriting one real Glimmer program —
Book 2's Skyfall or Rushlight are the right size — in library form.

## 11. Adoption path

In order, each step gated on the one before:

1. Example programs under the section 5 convention, compiled by the first
   working compiler: Tetro's input handling and one Glimmer-style animation
   are the candidate bodies. The section 6 paginated reader and the
   keypad and poller machines of sections 7 and 8 are the fixture
   sketches.
2. A teaching chapter presenting the manual pattern as cooperative tasks on
   the TEC-1G, per the framing rule of section 2.
3. If the examples show the boilerplate dominating real task bodies, a
   design decision on the section 6 syntax, tested by compiling the
   existing examples and comparing emitted code against the hand-written
   form.
4. The scheduler and timing conventions of sections 7 and 8 as a standard
   service module, and the section 10 Glimmer experiment.
5. With those gates passed, a specification section: the task convention
   and clock doctrine as normative text, and the syntax as a capability an
   implementation declares — present in a large-target compiler, absent
   from a minimal one — so that Candlemoth's budget bounds Candlemoth,
   not the language.

Findings that would close this direction: task records proving too large
for real programs at TEC-1G RAM budgets, or the manual pattern proving so
workable in the books that the syntax would save too little. The second
outcome would still be a success — the pattern, not the syntax, is the
substance of this document.
