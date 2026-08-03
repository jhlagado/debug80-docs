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
convention, and the surface adds six words and a shared trigger grammar.
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
- **One clock: the instant.** Each frame, triggers are delivered under
  one rule, taken verbatim from Glimmer: *a change is delivered exactly
  once — to later phases in the same frame, otherwise at the next
  frame's start.* Every dependent of a fact sees a change together;
  each body runs at most once per instant; a chain pointing backward
  advances one step per frame.
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
spreadsheet's circular-reference check.

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

**Phases are inferred from what a body is.** An effect triggered by
facts alone, writing facts, touching no device, runs in the derivation
phase; an effect triggered by any moment runs in the logic phase; an
effect that calls display services runs in the render phase, and a
render writing facts is a compile error — Glimmer's "a render only
depicts," now checked. File order never selects a phase; within one
phase, bodies run in file order, and two same-phase effects touching
one cell draw a warning naming the pair. The delivery rule then needs
no further machinery: phase order is the topology, and cross-frame
deferral handles every backward edge, one step per frame,
deterministically.

Two guardrails complete the wiring story. A state cell is written only
through its declared path in an effect or task body — passing one to a
routine as a writable aggregate argument would hide the write from the
inference, so the first edition rejects it; helpers compute and return.
And an effect body cannot suspend: `wait on` is grammatically confined
to task bodies, so the effect/task distinction is visible in the
syntax rather than policed behind it.

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

Tasks are unchanged from the [task-first](task-first.md) model — types,
instances as module variables, dormancy as a designed idle wait — with
one spelling change ratified here: the suspension statement is
`wait on` a trigger, sharing the trigger grammar of `effect on`, and
`await` is retired. It was borrowed vocabulary from call-based
asynchrony, and nothing here awaits a call's result; conditions occur
and bodies resume. `wait on go` says what happens in the language's own
words, and a task "started at runtime" is a task woken by its trigger.

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
bind-decl           ::= "bind" source-name profile-binding
                        "raises" value-name newline
effect-decl         ::= "effect" trigger-clause newline
                        statement* "end" newline

trigger-clause      ::= "on" trigger ("," trigger)*
trigger             ::= value-name
                      | "after" "(" expression ")"

wait-stmt           ::= "wait" trigger-clause newline
```

Counting the cost, because economy is a stated goal:

- **Eight productions**, one of which — `trigger-clause` — is written
  once and used in two positions, with the adopted `on-error-clause` as
  its named sibling in a third. A trigger names a pulse (its
  occurrence) or a state cell (its change); `after` is contextual in
  trigger position, not a reserved word.
- **Six reserved words**: `state`, `derived`, `pulse`, `bind`,
  `effect`, `wait`. Set against the ledger of what this design killed
  during its own derivation — `compute`, `render`, `rule`, `updates`,
  `await`, block names, and the arrow sigil — the surface is smaller
  than the first sketch of itself, and each survivor carries
  information a body cannot express.
- **No new statement forms inside effects.** An effect body is
  `statement*` — the existing language, unchanged. The one new
  statement, `wait-stmt`, appears only in the task-body production, so
  the may-not-suspend rule is enforced by the grammar, costing zero
  semantic checking.
- **No collisions.** `error` is already contextual after `on`, so
  the handler and trigger readings of `on` disambiguate on one token;
  `effect`
  and `wait` head their own forms; the declaration heads join a module
  grammar in which every declaration already begins with a head word —
  a bare `on` block was rejected in design precisely because it would
  have been the only headless declaration in the language.

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
task, dormant in `wait on go` until signalled. `best` shows why
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
The equation cell is Lustre's, whose industrial descendant is certified
for avionics, and whose compiler discipline — causality analysis, a
constant-memory step function per instant — is this paper's lowering
by another name. The imperative process with `wait` beside declarative
equations is Esterel's synthesis, carried to embedded targets by Céu.
The instant-clocked delivery rule is Glimmer's, proven in shipped Z80
games. The compiler-is-the-framework stance — inferred writes, no
runtime graph, plain assignment as the notification site — is
Svelte's argument, which this design extends from inference to proof.
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
