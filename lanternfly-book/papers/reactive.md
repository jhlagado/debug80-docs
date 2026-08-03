---
layout: default
title: "Reactive Lanternfly"
parent: "Lanternfly White Papers"
nav_order: 4
---

# Reactive Lanternfly: facts, moments and effects

**Status: proposal.** This paper proposes the reactive layer of the
Lanternfly language: the constructs that let a program be written as
facts, derived facts, moments and the effects triggered by them, beside
the tasks of the [cooperative-task paper](cooperative-tasks.md). The
goal is a synthesis, not an addition — the asynchronous layer and the
reactive layer reduce to one machine, already reviewed and adopted as
convention, and the surface adds six contextual head words and a
shared trigger grammar.
Glimmer, the existing reactive framework for Z80 games, supplies the
semantics, which this design adopts with its wiring moved from trust to
proof; Glimmer's platform profiles remain what they are, and Glimmer as
a separate toolchain stage is retired by this proposal. Everything here
is deferred sugar in the same family as the `task` type form: the
kernel lowers to specification-0.6 conventions, and an implementation
without the sugar carries the pattern by hand.

## 1. The kernel

Stripped to its semantics, the whole asynchronous-and-reactive layer
is:

- **One primitive: the triggered body.** Code over static storage that
  runs to completion when a trigger occurs. A body with one standing
  trigger and no memory is an effect; a body with memory and triggers
  in its interior is a task. They are not two mechanisms — an effect is
  a task with one suspension point at the top, and both lower to the
  record-plus-step convention.
- **One clock: the instant.** Triggers are delivered once per instant
  under one rule, taken from Glimmer: *a change is delivered exactly
  once — in the same instant when every dependent sits in a later
  phase, and otherwise at the next instant's start, to all dependents
  at once.* Every dependent of a fact therefore sees a change
  together; each body runs at most once per instant; a chain pointing
  backward advances one step per instant. The instant is the scheduler's
  super-pass: on hardware with a frame interrupt it is locked to the
  frame, and on hardware without one it is the pass itself — the
  elastic pass clock of the timing doctrine serving as the instant, as
  Glimmer's display-scan loop served as its frame.
- **Two storage sorts: facts and moments.** A fact (`state`) persists
  and carries a changed bit. A moment (`pulse`) occurs, is delivered
  once, and is gone. The distinction is the oldest in reactive
  programming — behaviors and events — and every surviving system kept
  it.

Everything else in this paper is spelling.

## 2. The surface

```lanternfly
// Hypothetical syntax; deferred with the task form.
state count as u8 = 0 changed
derived barLength as u8 = count / 8

pulse increase
bind keyPlus held every 6 raises increase

effect on increase
    if count < 64 then
        count = count + 1
    end
end

effect on barLength
    clearMatrix()
    fillRow(3, barLength, colourGreen)
end

task Round()
    while true
        wait on go
        lightOff()
        wait on after(75)
        lightOn()
    end
end
```

Six declaration heads, each declaring one kind of thing, teachable as a
decision tree:

- a stored fact → `state`;
- a fact that is a formula → `derived`;
- a momentary occurrence → `pulse`;
- a hardware edge turned into a moment → `bind`;
- statements that respond to change → `effect on`;
- a process that remembers where it was → `task`.

And one sentence covers every appearance of `on`:

> **`on` always attaches a trigger to a head: to an `effect`
> declaration, to a `wait`, or to the statement whose failure it
> handles.**

The third case is not new syntax — it is `on error`, adopted in
specification 0.6 before this paper existed. The failure channel is a
moment: a discrete occurrence, delivered exactly once at one point,
carrying a payload. The error handler was this paper's construct
arriving early, and the reactive layer inherits its word, its shape and
its teaching.

## 3. Facts

`state` declares a watched cell: ordinary Lanternfly storage plus a
changed bit in the delivery machinery. The initializer is evaluated
once, into the build image; `changed` marks the cell already-changed at
start, so initial renders fire on the first frame. Facts may be
aggregates: `state board as u8[64]` is one fact at the granularity the
declaration chose — a verified write to any part raises the one bit,
and no field diffing or reference comparison exists anywhere, because
notification happens at the write, not by inspection afterward. Finer
waves come from declaring finer cells.

`derived` declares an equation, not an initializer. A state cell is
bound to a value once; a derived cell is bound to other cells
continuously — it has no other writer, no independent existence, and
its formula is its whole meaning. The distinction takes a word because
inferring it from the right-hand side would make `= limit` and
`= count` mean different temporal behaviors depending on what a name
resolves to, and would steal the spelling for initializing a cell from
another cell's boot-time value. Dependencies are read from the
expression; cycles are causality errors at compile time, the
spreadsheet's circular-reference check. A derived cell's dependencies
are state and derived cells only — moments, task fields and the clock
counters are not dependencies in the first edition; the clocks are
sampled, never depended on.

Two rules complete the fact contract. A derived cell's build image is
its formula folded over its dependencies' initial images — every
initializer is constant, so the fold is compile-time — and the cell is
initially changed exactly when any dependency carries `changed`; a
formula that does not preserve zero therefore starts correct, not
coincidentally zero. And a `state` declaration admits neither `at`
placement nor `volatile`: a fact lives in ordinary allocator storage,
because notification happens at the compiled write, and a device-backed
cell would change without one. Device state reaches facts through the
membrane, as always.

## 4. Effects and wiring

An `effect` is an anonymous triggered block. It has no name because
nothing ever references one — names were Glimmer's assembler linkage,
not a language need — and the dependency report identifies it better by
its trigger and location than any invented name would.

**Writes are inferred; triggers are declared.** The compiler sees every
write in a transparent body, so an `updates` clause would state what
the code already proves; it does not exist. Triggers cannot be
inferred, because a trigger is a decision the body cannot express:
reading a fact is not depending on it. The counterexample is the frame
counter — a timed effect *samples* `frames` without meaning to run
every frame — and the depending/sampling distinction is forty years
old. So the `on` list is the one clause that survives: it carries
information found nowhere else. Reading an unlisted fact is sampling
and legal; reading an unlisted moment is an error, since a moment has
no meaning outside its delivery.

**Phases are inferred from what a body is, by a total, ordered
classifier.** Three rules, tried in order, transitive over the call
graph — a helper's device call counts as its caller's:

1. any moment among the triggers → **logic**;
2. otherwise, any device, native or service effect in the body →
   **render**;
3. otherwise → **derivation**.

The rules are ordered, so a moment-triggered effect that both writes
facts and beeps is logic — the ordinary game rule — while render is
the residual class: fact-triggered depiction, and a render writing
facts is a compile error, Glimmer's "a render only depicts," now
checked. One departure from a hand-declared Glimmer port is stated
rather than hidden: a block Glimmer's author declared `effect` but
whose triggers and writes are pure fact-to-fact is classified
derivation here, so it runs before the logic wave and its sampled
reads see the previous instant where a file-earlier logic write would
have been visible. Inference trades that corner for the guarantee that
a phase can never be mis-declared.

**Derived cells settle within the instant.** Acyclic derived chains
are ordered topologically inside the derivation phase, with intra-phase
delivery — a derived feeding a derived resolves in one instant, the
Lustre-faithful reading, and an improvement this design makes
deliberately over Glimmer's one-step-per-frame compute chains. This is
the delivery rule's one stated extension: the topological order makes
every derived-to-derived edge effectively later-phase, so the together
guarantee is preserved, not weakened. Cycles were already rejected, so
the order always exists. Effects are never
reordered: within each phase they run in file order, tasks after them,
and the diagnostics cover the hazards — a warning names any two
same-phase bodies where one writes a cell another writes or samples,
tasks included.

Three guardrails complete the wiring story. A state cell is written
only through its declared path in an effect or task body — passing one
to a routine as a writable aggregate argument, or taking an `alias` to
one, would hide the write from the inference, so the first edition
rejects both; helpers compute and return. An effect body is an
ordinary routine body — scratch locals and all — but it cannot
suspend: `wait on` is confined to task bodies by the grammar of
section 6, so the effect/task distinction is visible in the syntax.
And moments appear only in trigger position — a bare moment has no
value to read — with one standing exemption: `on error` inside any
body consumes its own statement's failure moment, as adopted
specification already provides.

## 5. Moments, binds and tasks

A `pulse` is a bare moment. Bindings turn hardware edges into moments:

```lanternfly
bind keyPlus held every 6 raises increase
```

`raises` is a word where Glimmer wrote an arrow, because this language
marks structure with words. The binding vocabulary between the source
name and `raises` — `held`, `rising`, `every` — belongs to the target
profile, not the core grammar, exactly as external-binding forms do:
the language owns the shape — `bind`, a source name, the profile's
words, `raises`, a pulse name — and the profile owns the middle.

Tasks keep the [task-first](task-first.md) model — types, instances as
module variables, dormancy as a designed idle wait — with two rulings
added here. First, the spelling: the suspension statement is `wait on`
a trigger, sharing the trigger grammar of `effect on`, and `await` is
retired — borrowed vocabulary from call-based asynchrony, and nothing
here awaits a call's result; `wait on go` says what happens in the
language's own words, and a task "started at runtime" is a task woken
by its trigger. Second, the task's place in the instant, which the
sibling papers left to a bare round-robin: **tasks advance in the
logic phase, after the logic effects, in declaration order.** Their
fact writes ride the same delivery rule — same instant when every
dependent is in a later phase, next instant for all dependents
otherwise — and task-first's "declaration order is
schedule order" is amended to declaration order *within* the phase
order. A due `wait on after(n)` deadline counts n instant-clock ticks
from wait entry, under the timing doctrine's wrap-safe comparison and
its 32,767-tick bound.

## 6. The grammar, examined

The additions in the specification's section-15 style:

```text
reactive-decl       ::= state-decl | derived-decl | pulse-decl
                      | bind-decl | effect-decl

state-decl          ::= "state" value-name "as" type-expr
                        ("=" constant-initializer)? "changed"? newline
derived-decl        ::= "derived" value-name "as" type-expr
                        "=" expression newline
pulse-decl          ::= "pulse" value-name newline
bind-decl           ::= "bind" source-name profile-word*
                        "raises" value-name newline
effect-decl         ::= "effect" trigger-clause newline
                        routine-block "end" newline

trigger-clause      ::= "on" trigger ("," trigger)*
trigger             ::= value-name

task-body           ::= local-decl* (statement | wait-stmt)*
wait-stmt           ::= "wait" "on" wait-trigger ("," wait-trigger)*
                        newline
wait-trigger        ::= trigger | "after" "(" expression ")"
```

Counting the cost, because economy is a stated goal:

- **Eleven productions**, with `trigger-clause` written once and used
  by effects, `trigger` reused by waits, and the adopted
  `on-error-clause` as their named sibling. A trigger names a pulse
  (its occurrence) or a state cell (its change); `after` belongs to
  wait position only, so an effect cannot trigger on a deadline —
  time-driven work is a task's.
- **Six new words, none reserved.** `state`, `derived`, `pulse`,
  `bind`, `effect` and `wait` are contextual in head position — the
  module grammar already begins every declaration with a head word,
  and `wait` heads only a task-body statement — exactly as `error` is
  contextual after `on`. `changed` and `raises` are likewise
  contextual inside their own productions, and `after` inside a wait
  trigger. Nothing joins the reserved inventory, so the task
  convention's own `state as u8` record field, and every other use of
  these words as value names, stays legal.
- **The bind middle is profile-owned with a stated delimiter.** The
  words between the source name and `raises` belong to the target
  profile, as external-binding vocabulary does; the parse rule is
  one sentence — a bind line is scanned to its `raises` — so the
  profile extends the vocabulary without touching the grammar.
- **Effect bodies are routine bodies.** Scratch locals and every
  statement form are available; what an effect body cannot contain is
  `wait-stmt`, which appears only in `task-body` — the may-not-suspend
  rule enforced by the productions above, costing no semantic check.
- **No collisions.** The handler and trigger readings of `on`
  disambiguate on one token; the six heads join a module grammar in
  which every declaration already begins with a head word — a bare
  `on` block was rejected in design precisely because it would have
  been the only headless declaration in the language.

The shape stays the language's shape: linear, word-marked, sparing
with punctuation — readable aloud, in the BASIC line, with nothing to
balance but `end`.

## 7. Two worked programs

**The level meter** — Glimmer's own teaching program, native:

```lanternfly
state count as u8 = 0 changed
derived barLength as u8 = count / 8

pulse increase
pulse decrease

bind keyPlus  held every 6 raises increase
bind keyMinus held every 6 raises decrease

effect on increase
    if count < 64 then
        count = count + 1
    end
end

effect on decrease
    if count > 0 then
        count = count - 1
    end
end

effect on barLength
    clearMatrix()
    fillRow(3, barLength, colourGreen)
end

effect on count
    writeHudNumber(count)
end
```

One press of plus, traced by instants: frame N, the binding raises
`increase`; the first effect runs in the logic phase and writes
`count`, whose dependents include the derivation — an earlier phase —
so the change defers. Frame N+1: `barLength` recomputes, and both
render-phase effects fire together — bar and digits change in the same
frame, the delivery rule's exactly-once guarantee at work.

**A reaction timer** — sequence beside reactivity, which is the
synthesis in one program:

```lanternfly
state armed as boolean = false
state startFrame as u16 = 0
state score as u16 = 0
state best as u16 = 65535

pulse go
pulse pressed

bind keyGo rising raises go
bind anyKey rising raises pressed

task Round()
    while true
        wait on go
        armed = false          // a GO during a stale round scores nothing
        lightOff()
        wait on after(75)
        lightOn()
        startFrame = frames
        armed = true
    end
end

var round as Round

effect on pressed
    if armed then
        armed = false
        score = frames - startFrame
    end
end

effect on score
    if score < best then
        best = score
    end
end

effect on score
    writeHudNumber(score)
end

effect on best
    writeBestNumber(best)
end
```

The waiting is sequence — inexpressible as an effect, natural as a
task, dormant in `wait on go` until signalled. The task advances after
the logic effects, so on the very instant the light comes on, an
already-falling keypress finds `armed` still false and scores
nothing — a sub-instant reaction is rejected by the schedule itself,
and the round's own `armed = false` makes a stale GO equally harmless.
`best` shows why
equations and effects are different sorts: the minimum ever seen is
memory, not a function of current facts, so it is a fact written by an
effect. And the first effect reads `frames`, `armed` and `startFrame`
while triggering only on `pressed` — sampling and depending, side by
side, which is the case that rules out inferred triggers.

## 8. What was dissolved, and by what argument

The design shed most of its first draft, each cut by argument:

- `compute` blocks — derivations are equations (`derived`), the
  spreadsheet's and Lustre's form; the block was React-shaped habit.
- `render` and `effect` as phase keywords — phases are a function of
  what a body does, and the compiler can read bodies.
- `updates` — writes are visible in transparent bodies; the clause
  restated what the compiler proves, and Glimmer only needed it
  because its bodies were opaque assembly.
- `rule` and block names — nothing in the language ever consumed a
  name; they were Glimmer's assembler linkage.
- `await` — borrowed intuition from a call-based world this model
  never was.
- The bind arrow — words, not sigils.

What survived, survived because it carries information the body cannot
express: `state` versus `derived` (bound once versus bound always),
`pulse` (moment versus fact), `on` (triggering is a decision, not a
read), `task` (memory), `bind` (the platform edge).

## 9. Precedent

The two-sorted storage — facts and moments — is Fran's behaviors and
events, the founding distinction of functional reactive programming.
The equation cell is Lustre's, whose industrial descendant's qualified
code generator is certified for avionics under DO-178, and whose
compiler discipline — causality analysis, a constant-memory step
function per instant — is this paper's lowering by another name. The
imperative process with `wait` comes from Esterel, the equations from
Lustre, and their coexistence in one language is the Esterel family's
own later synthesis, carried to embedded targets by Céu.
The instant-clocked delivery rule is Glimmer's, proven in shipped Z80
games. The compiler-is-the-framework stance — inferred writes, no
runtime graph, plain assignment as the notification site — was
Svelte's founding argument, which this design extends from inference
to proof.
The retreat from wiring-heavy surfaces toward few constructs is Elm's
lesson, learned when it removed signals from its own language. And the
claim that a reactive view layer is half a model without transition
structure is the statechart tradition's — answered here by tasks,
present from the start. What has no precedent on record is this
combination — verified reactive wiring, static instants, and
sequential processes in one language — delivered on an eight-bit
target with every byte in the storage map.

## 10. Open seams

Stated as open, in the order they should be settled:

1. **The emit family.** `fail` emits the failure moment with a payload;
   `yield` emits a value; a raised pulse emits a bare moment. Three
   emitters, three words, one family resemblance. `fail` is adopted
   specification and stays; whether `yield` and pulse-raising share a
   word — `raises` already exists in bind position — is the mirror of
   the `on` unification and calls for the same walk.
2. **Valued moments.** Elm's messages carry payloads; Glimmer's pulses
   are bare bits with payloads smuggled through state cells, which has
   a race's shape. `pulse keyDown as u8` is the candidate; `on error
   code` already shows a moment binding a payload name.
3. **Multi-statement derivations.** Whether `derived` may take a block
   body, or whether anything beyond an expression must be an effect —
   economy says expression-only, with helpers for the rest.
4. **Same-phase order.** File order within a phase is inherited from
   Glimmer with a warning on shared cells; whether the warning should
   be an error is an evidence question.
5. **Evidence.** The adoption ladder of the sibling papers applies
   unchanged: Meter and Rover rewritten in the manual lowering first,
   then this surface; then a Tetro-sized sketch; the sugar is judged by
   comparing its emission against the hand-written form, and the
   reference-compiler budget judges the rewrite.

## 11. Adoption and lowering

Nothing in this paper adds machinery beneath the surface. A fact is a
variable plus a bit in a mask byte; a moment is a bit cleared at frame
end; the delivery rule is three mask bytes and two merges per frame; an
effect is a task record with no fields and a generated wait; the whole
reactive program is the task-first scheduler with phases. The manual
lowering is legal 0.6 today and is the conformance oracle for the
sugar, exactly as the task convention is for the task form. The sugar
itself joins the same deferred family, gated by the same
reference-compiler budget, declared by the same capability mechanism —
present in a large-target compiler, absent from a minimal one, with the
language unchanged either way.
