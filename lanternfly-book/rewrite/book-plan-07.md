# Book plan for Lanternfly 0.7

Planning document. Not book prose, and not published. Delete once the
rewrite has consumed it.

## The shape

One light introduction that shows the whole language, then slim
specialist books that grow as real Lanternfly code gets written, then an
unnumbered reference.

- **Book One — Introduction to Lanternfly.** Every part of the language,
  none of it deeply. A reader finishes able to write real programs and
  able to see what the rest of the series is for.
- **Book Two — Multitasking in Lanternfly.** The instant, waiting, task
  types and instances, timing, protocols between tasks.
- **Book Three — Reactive Lanternfly.** Watched variables, derivations,
  pulses, input, and the observability that data structures gain when they
  are watched.
- **Book Four — Programs and the Machine.** Modules and services, failure
  in depth, the prologue, external routines, assembly, targets.
- **The Lanternfly Reference.** Unnumbered.

**Numbers mark the reading path, so the reference carries none.** Nobody
reads a reference in order, so giving it a position in a sequence is a
category error, and that is where Book Zero's awkwardness came from. An
unnumbered reference also means adding a fifth book later renumbers
nothing. Topic books stay named, never numbered — *Games in Lanternfly*
and whatever follows.

Books Two through Four begin as placeholders and grow. Five chapters is a
respectable start for any of them; the material arrives as programs get
written and the demands become visible, rather than being invented now.

## The method

Book One's old spine was entry-to-return: a program began at one routine,
ran down the page and finished. Chapter order, listing shape and every
trace hung off that.

Book One's new spine is not a replacement machine model — it is **no
machine model at all**. A reader does not need to know what a task is to
use one. `auto task` is how a program starts, the way `writeText` is how
a program prints; two of them run at once because that is what the
language does. The operational sentence, given once and not elaborated,
is that a task runs until it waits, and while it waits the others run.

Instants, suspension points, the scheduler and the two-phase order belong
to Book Two, where a reader who wants the machine can have it. Book One
never draws an instant table.

Rules for the rewrite:

1. **Light everywhere.** Take the current chapters and thin them. The
   depth is not deleted, it moves to whichever later book owns it.
2. **The whole language is visible.** A reader who stops after Book One
   has met every part of Lanternfly, including watched variables and
   derivations, and knows what the later books are about.
3. **Familiar things stay short.** Arrays, records and strings are the
   same data structures as in every other language; the introduction
   states Lanternfly's version and moves on. What is unfamiliar — a
   watched variable, a task, exact layout — earns the space.
4. **Ontology rule as before.** The book describes what is. No history, no
   provisional caveats, no "this will change", no leakage from design
   discussion.

Reader: an experienced programmer meeting Lanternfly, not someone
learning to program.

## Book One — Introduction to Lanternfly

Twelve short chapters, against the current sixteen long ones.

**1. A First Program** *(replaces "Your First Lanternfly Program")*
`auto task Hello()`, `writeText`, the import that supplies it, the
manifest naming the root module. Presented as how a program is written
and run. Output on the first page.

**2. Doing Two Things** *(new, short)*
A second `auto task`. Both run. `wait on after(n)` so the output
interleaves. One sentence of model and no more — a task runs until it
waits, and while it waits the others run — plus its consequence, that a
task which never waits starves the rest. The reader leaves knowing that
concurrency is ordinary here, not that a scheduler exists.

**3. Values** *(current ch2 + ch3, thinned)*
Fixed-width scalars, literals, the conversion rules that bite.

**4. Decisions** *(current ch4 + ch5, thinned)*
Comparisons, Booleans, masks, enums, `if` and `select`.

**5. Repeating** *(current ch6, thinned)*
Counted, collection and conditional loops.

**6. Collections** *(current ch7 + ch8, thinned)*
Fixed arrays, index domains, characters, counted strings.

**7. Records** *(current ch9, thinned)*
Fields, exact layout, why layout is stated rather than chosen.

**8. Subroutines** *(current ch10, thinned)*
Parameters, results, aggregates by alias, static frames named but not
dissected.

**9. Watched Variables and Derivations** *(new, the one genuinely new chapter)*
`state var` as a qualifier beside `volatile` and `static`. A write to a
variable is invisible; a write to a watched variable schedules whatever
waits on it. A second task that waits on one, and a `derive` line that
computes a value from others the way a spreadsheet cell does. Enough for
the reader to write a program that responds, and to know Book Three
exists.

**10. Modules** *(current ch12, thinned)*
Imports, exports, visibility. What a module can see, it can use. An
imported `auto task` starts wherever it is declared.

**11. When Things Fail** *(current ch14 + ch15, thinned to one)*
`fails`, `fail`, `or fail`, `on error`, `defer`. The mechanisms, not the
design theory.

**12. Talking to the Machine** *(current ch16 + the prologue, thinned)*
A designated start as a prologue, and that it is where blocking belongs.
`extern sub`, one `asm` block, the shape of a target profile.

### Not in Book One

Moved rather than cut: selecting existing storage and aliases (Book Two
or Four), instants and the scheduler (Book Two), task types, instances
and pools (Book Two), derivation chains and the settle phase (Book
Three), pulses (Book Three), propagation design and error sets (Book
Four), placement and targets (Book Four).

### What dies outright

- The entry routine, in every listing and every explanation.
- Blocking `readLine` and `readCharacter` as things a program does.
- "The program begins here and ends when this returns" as a model.
- Number-entry programs built around a blocking read.

## Book Two — Multitasking in Lanternfly

Opening five: the instant and its two phases; waiting; task types,
instances and pools; timing and deadlines; protocols between tasks. Absorbs the machine model
Book One withholds, and the current book's storage-selection material
where task records need it.

### Protocols between tasks — the chapter's content

The chapter opens on what the substrate has already deleted. A task runs
from one suspension point to the next with nothing else observing it, so
there are no locks, no semaphores, no atomics and no barriers, and a
sequence of statements within one advance cannot be seen half-finished.
The specification states this, so programs may rely on it. Its mirror is
the chapter's one hazard: a protocol that *spans* a suspension point is
not protected, and another task can overwrite what you left behind while
you were waiting.

Then the idioms:

**Doorbell and parcel.** Data in an ordinary `var`, notification in a
`state var`, the doorbell written last. This is the practical answer to
why the language has both kinds of storage, and it avoids a changed bit
per byte.

**One index each.** A ring buffer gives the producer the tail and the
consumer the head, so no index has two writers. `standard/character-input.lafy`
is this shape and is the worked example. Overflow policy is stated out
loud — drop oldest, drop newest, or set an overrun cell — because silence
there is where lost input hides.

**Counter and last-seen, never a flag someone must clear.** With several
interested tasks, a flag raises the question of who clears it and loses
the event for the others. A monotonic counter with a private last-seen
value per consumer has no such question.

*Sizing the counter*, with the numbers on the page, because the rule
reads as arbitrary without them. Detection needs only inequality, so what
matters is that the counter cannot advance a whole period between two
consecutive looks by the slowest consumer — a wrap landing back on
last-seen is silent. Sizing is period against worst-case observation
latency, never total events. Between tasks a byte is ample: a producer
increments at most once per run and a consumer waiting on the counter
wakes the same instant, so 255 units of slack is far more than any
consumer needs. A byte fails when the producer is not scheduled: 50 Hz
frames wrap a byte in 5.12 seconds, which is why the frame clock is a
`u16` at about 21.8 minutes, and 9600 baud arrives roughly 960 bytes a
second, wrapping in 0.27 seconds so that a 300 ms sleep silently loses a
lap. Across the interrupt membrane the byte wins for a second reason: an
ISR-incremented byte is read without tearing, where a word on this
processor is not and needs the read-twice or masked-read discipline. Last,
the precision that catches people — equality and difference get the full
period, ordering gets only half, which is why a `u16` deadline is bounded
at 32,767 ticks rather than 65,535.

**A slot per client.** The set of tasks is known at build time, so a
service task can hold one request slot per client instead of a queue. No
contention, no allocation, no fairness policy: the array index is the
client's identity. Static allocation turning a hard problem into an array
is worth stating as such.

**Publish facts rather than send messages.** Often the best communication
between two tasks is none: one writes inputs, a `derive` rule computes the
shared value, the other waits on it. The coupling is to the published
fact, so a third consumer costs nothing. The chapter closes here, pointing
at Book Three.

**Mutual waiting** is the failure mode that survives, and nothing detects
it statically. A rendezvous carries a deadline — `wait on answerReady,
after(n)` — so a stalled partner surfaces as a timeout rather than a dead
machine.

## Book Three — Reactive Lanternfly

Opening five: watched variables in depth, including aggregates and
granularity; derivations and the settle phase; pulses; input; designing a
reactive program. The wrinkle this book exists for is what a familiar
data structure becomes once it is watched.

## Book Four — Programs and the Machine

Opening five: modules, visibility and services; failure, propagation and
cleanup; the prologue; external routines and assembly; targets and
placement.

## The Lanternfly Reference — revision map

The reference tracks the specification section for section. Nothing is
reordered; chapters are revised in place, and one is added.

- **1. Language Model and Source Form** — root module, imports, a start
  that is declared, designated or both.
- **2. Names and Scopes** — the contextual words, `state` recognised only
  before `var`.
- **3. Types, Literals and Strings** — unchanged.
- **4. Integer Expressions** — unchanged.
- **5. Constants, Variables and Placement** — `state var` as a qualifier
  alongside `volatile` and `static`.
- **6. Records, Arrays and Storage Paths** — task types as a type form.
- **7. Assignment and Standard Operations** — unchanged.
- **8. Conditions and Loops** — unchanged.
- **9. Routines** — prologue eligibility; a subroutine carries no phase;
  the transitive write closure that phase checks run over.
- **10. Modules, Programs and Hosted Bodies** — the largest rewrite:
  declared and designated starts, the prologue, instants, termination at
  quiescence, the scheduler as a fixed call sequence, and the
  cross-module rules for cells, pulses, instances and derivations.
- **NEW 11. Tasks, State, Pulses and Rules** — the reference form of
  specification section 17.
- **12. Targets, External Routines and Assembly** *(was 11)* — the
  blocking class, and where bounded and unbounded calls may appear.
- **13. Grammar and Word Inventory** *(was 12)* — the new productions.
- **14. Diagnostics and Conformance** *(was 13)* — the `E-ENTRY` family.
- **15. Failable Routines and Error Handling** *(was 14)* — prologue
  failure; `on error` otherwise unchanged.

## Order of work

1. Book One, written through. It is the only volume that must be
   complete.
2. Books Two to Four as outlines with their opening chapters, growing
   from real programs.
3. The reference, revised in place against the settled specification.
