---
layout: default
title: "Reactive Lanternfly"
parent: "Lanternfly White Papers"
nav_order: 4
---

# Reactive Lanternfly: facts, moments and effects

**Status: proposal.** This paper defines the reactive layer of the
Lanternfly language, beside the tasks of the
[cooperative-task paper](cooperative-tasks.md). The constructs are
deferred sugar in the same family as the `task` type form: the
semantics lower to specification-0.6 conventions, and an implementation
without the sugar carries the pattern by hand. The delivery semantics
are Glimmer's. Glimmer's platform profiles are unchanged; Glimmer as a
separate toolchain stage is retired.

## 1. The kernel

- **One primitive: the triggered body.** Code over static storage, run
  to completion when a trigger occurs. A body with one standing
  trigger and no memory is an effect or a render; a body with memory
  and triggers in its interior is a task. Both lower to the
  record-plus-step convention.
- **One clock: the instant.** A change is delivered exactly once: in
  the same instant when every dependent sits in a later phase,
  otherwise at the next instant's start, to all dependents at once.
  Each body runs at most once per instant. The instant is the
  scheduler's super-pass — locked to the frame where a frame interrupt
  exists, the pass itself where none does.
- **Two storage sorts.** A fact (`state`) persists and carries a
  changed bit. A moment (`pulse`) occurs, is delivered once, and is
  gone.

## 2. The surface

```lanternfly
// Hypothetical syntax; deferred with the task form.
state count as u8 = 0 changed
derive barLength as u8 from count / 8

pulse increase from keyPlus held every 6

effect on increase
    if count < 64 then
        count = count + 1
    end
end

render on barLength
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

Six declaration heads:

- a stored fact → `state`;
- a fact that is a formula → `derive … from`;
- a momentary occurrence → `pulse`, with its hardware source named
  `from` its own declaration;
- statements that respond to change → `effect on`;
- statements that depict facts → `render on`;
- a process that remembers where it was → `task`.

The phase is written in the head: `derive` settles first, `effect`
runs in the middle, `render` runs last.

`on` always attaches a trigger to a head: an `effect` or `render`
declaration, a `wait`, or the statement whose failure it handles. The
third is `on error`, already in the specification; the failure channel
is a moment — delivered once, at one point, carrying a payload. One
preposition covers the sources: a fact is derived `from` facts, and a
moment comes `from` the machine — the word `extern` routines already
use for a symbol's source.

## 3. Facts

`state` declares a watched cell: ordinary storage plus a changed bit in
the delivery machinery. The initializer is installed in the build
image; `changed` marks the cell already-changed, so initial renders
fire on the first instant. Facts may be aggregates:
`state board as u8[64]` is one fact at the declared granularity — a
write anywhere in it raises the one bit. There is no diffing and no
reference comparison; notification happens at the compiled write. For
the same reason a `state` declaration admits neither `at` nor
`volatile` — a device-backed cell would change without a compiled
write. Device state reaches facts through the membrane.

`derive` declares an equation. Bound-once takes `=`; bound-always takes
`from`. A derived cell has no other writer, and its formula is its
whole meaning. Dependencies are read from the expression and must be
state or derived cells; the clock counters may be sampled, never
depended on; cycles are compile errors. The cell's build image is the
formula folded over its dependencies' initial images, and it is
initially changed exactly when a dependency carries `changed`.

## 4. Blocks and wiring

`effect on` and `render on` declare anonymous triggered blocks. A
block's body is an ordinary routine body. A `render` may not write a
fact; a `derive` is pure by form; an `effect` may do anything a body
may do. The checks see through helper calls.

Writes are inferred; triggers are declared. The compiler reads every
write from the body, so there is no updates clause, and the dependency
report is generated from the code. Triggers are the one thing a body
does not express: reading a fact is sampling, not depending — a timed
effect samples the frame counter without running every frame — so the
`on` list alone decides when a block runs. Reading an unlisted fact is
legal. A moment appears only in trigger position, except that
`on error` consumes its own statement's failure moment.

Within a phase, blocks run in file order. Derived cells settle in
dependency order inside the derivation phase, so an equation chain
resolves in one instant. A warning names any two same-phase bodies
where one writes a cell another writes or samples.

Two rules protect the wiring. A state cell is written only through its
declared path in an effect or task body; passing one to a routine as a
writable aggregate argument, or taking an `alias` to one, is rejected —
helpers compute and return. And a block cannot suspend: `wait on`
belongs to task bodies only.

## 5. Moments and tasks

```lanternfly
pulse increase from keyPlus held every 6
pulse fire from keyGo rising
```

The vocabulary after the source name — `held`, `rising`, `every` —
belongs to the target profile, as external-binding vocabulary does, and
the clause runs to the end of the line. A pulse without a `from` clause
is an internal moment; its emitter is an open question (section 9).

Tasks keep the [task-first](task-first.md) model: types, instances as
module variables, dormancy as an idle wait. The suspension statement is
`wait on` a trigger, with the same trigger grammar as the block heads.
`wait on after(n)` counts n instant-clock ticks from wait entry, under
the timing doctrine's wrap-safe comparison and its 32,767-tick bound.
Tasks advance in the middle of the instant, after the effects, in
declaration order — declaration order within the phase order — and
their fact writes ride the delivery rule.

## 6. The grammar

```text
reactive-decl       ::= state-decl | derive-decl | pulse-decl
                      | block-decl

state-decl          ::= "state" value-name "as" type-expr
                        ("=" constant-initializer)? "changed"? newline
derive-decl         ::= "derive" value-name "as" type-expr
                        "from" expression newline
pulse-decl          ::= "pulse" value-name
                        ("from" source-name profile-word*)? newline
block-decl          ::= ("effect" | "render") trigger-clause newline
                        routine-block "end" newline

trigger-clause      ::= "on" trigger ("," trigger)*
trigger             ::= value-name

task-body           ::= local-decl* (statement | wait-stmt)*
wait-stmt           ::= "wait" "on" wait-trigger ("," wait-trigger)*
                        newline
wait-trigger        ::= trigger | "after" "(" expression ")"
```

- Ten productions. `trigger-clause` serves both block heads, and the
  specification's `on-error-clause` is its sibling. A trigger names a
  pulse or a state cell; `after` belongs to wait position, so a block
  cannot trigger on a deadline — time-driven work is a task's.
- Six new words — `state`, `derive`, `pulse`, `effect`, `render`,
  `wait` — all contextual in head position, none reserved. `changed`
  is contextual inside the state declaration, `after` inside a wait
  trigger, and `from` keeps its existing job. Every use of these words
  as value names stays legal, the task convention's `state as u8`
  field included.
- The pulse source clause is profile-owned and runs to the end of the
  line.
- `wait-stmt` appears only in `task-body`, so a block cannot suspend,
  by grammar rather than by check.
- Block bodies are `routine-block`: scratch locals and every statement
  form.

## 7. Two worked programs

The level meter — plus and minus move a count; a bar and digits show
it:

```lanternfly
state count as u8 = 0 changed
derive barLength as u8 from count / 8

pulse increase from keyPlus held every 6
pulse decrease from keyMinus held every 6

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

render on barLength
    clearMatrix()
    fillRow(3, barLength, colourGreen)
end

render on count
    writeHudNumber(count)
end
```

One press of plus, by instants: at instant N the bound pulse fires and
the first effect writes `count`. Its dependents include the
derivation — an earlier phase — so the change defers. At instant N+1,
`barLength` recomputes and both renders fire: bar and digits change
together.

A reaction timer — press GO, wait for the light, hit any key; the time
in instants is the score:

```lanternfly
state armed as boolean = false
state startFrame as u16 = 0
state score as u16 = 0
state best as u16 = 65535

pulse go from keyGo rising
pulse pressed from anyKey rising

task Round()
    while true
        wait on go
        armed = false
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

render on score
    writeHudNumber(score)
end

render on best
    writeBestNumber(best)
end
```

The waiting is sequence, so it is a task, dormant in `wait on go` until
signalled. The task advances after the effects, so a press landing on
the instant the light comes on finds `armed` still false and scores
nothing. `best` is memory — the minimum ever seen — so it is a fact
written by an effect, not an equation. The first effect samples
`frames`, `armed` and `startFrame` while triggering only on `pressed`.

## 8. Precedent

Facts and moments are the behaviors and events of Fran, the founding
functional-reactive system. The equation cell, the causality check and
the constant-memory step function per instant are Lustre's; SCADE, its
industrial descendant, has a code generator qualified under DO-178. The
sequential process with `wait` is Esterel's, carried to embedded
targets by Céu. The delivery rule is Glimmer's, proven in shipped Z80
games. Compile-time wiring with no runtime graph was Svelte's founding
argument. The statechart tradition holds that a view layer without
transition structure is half a model; tasks are the other half. The
combination — verified reactive wiring, static instants and sequential
processes in one language on an eight-bit target — has no precedent on
record.

## 9. Open questions

1. The emitter for internal pulses, and whether it shares a word with
   `yield`. `fail` is adopted specification and stays.
2. Valued moments: `pulse keyDown as u8`. `on error code` already
   binds a payload name to a moment.
3. A block form for multi-statement derivations. In this edition,
   fact-to-fact work beyond an equation is an effect.
4. Whether the same-phase conflict warning should be an error.
5. Evidence: Meter and Rover in the manual lowering, then in this
   surface; then a Tetro-sized sketch. The sugar is judged by
   comparing its emission against the hand-written form, and the
   reference-compiler budget judges the rewrite.

## 10. Lowering

A fact is a variable plus a bit in a mask byte. A moment is a bit
cleared at instant end. The delivery rule is three mask bytes and two
merges per instant. A block is a task record with no fields and a
generated wait. The whole reactive program is the task-first scheduler
with phases. The manual lowering is legal 0.6 today and is the
conformance oracle for the sugar; the sugar joins the deferred family,
gated by the reference-compiler budget and declared as a capability —
present in a large-target compiler, absent from a minimal one, the
language unchanged either way.
