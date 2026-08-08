---
layout: "default"
title: "6. Calls, activations, and results"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 6
pageClass: "nucleus-specification"
---
[← 5. Checked access and aggregate copying](05-checked-access-and-aggregate-copying.md) · [Contents](./) · [7. Recoverable failure and traps →](07-recoverable-failure-and-traps.md)

<div id="6-calls-activations-and-results" class="nucleus-source-anchor"></div>

# 6. Calls, activations, and results

<div id="61-argument-evaluation" class="nucleus-source-anchor"></div>

## 6.1 Argument evaluation

The caller evaluates every argument from left to right before the callee begins.
It retains each earlier scalar value or aggregate carrier across evaluation of
later arguments. A trap during argument evaluation prevents the call.

Scalar parameters receive copied values. Aggregate parameters receive fixed,
non-null, non-reseatable address carriers to existing program storage. The
callee may mutate that storage where the language permits.

<div id="62-activation-state" class="nucleus-source-anchor"></div>

## 6.2 Activation state

Each successful call creates distinct logical storage for its scalar
parameters, scalar locals, aggregate-parameter carriers, return address, and
other live implementation state. Recursion uses the same mechanism as an
ordinary call. One active invocation must not overwrite another's state.

The backend may use the hardware stack, a bounded activation arena, static
slots saved around calls, or a measured combination. It publishes both the
maximum active depth and any byte limit. After all source arguments have been
evaluated, but before the callee begins or any caller state is overwritten, a
call that cannot fit performs `activation-capacity` atomically.

<div id="63-results-and-caller-preservation" class="nucleus-source-anchor"></div>

## 6.3 Results and caller preservation

A scalar result is copied to the caller. An aggregate result is one transient
address carrier to existing program storage. The compiler preserves its exact
referent type and keeps the carrier live until its containing source operation
discards, forwards, selects, indexes, or copies it. A nested call during that
operation must not destroy the carrier.

Every return restores the caller state required after the call. Early return,
ordinary return, recoverable failure, direct recursion, and mutual recursion
use the same preservation rule. Nucleus has no source cleanup or unwinding
phase.
