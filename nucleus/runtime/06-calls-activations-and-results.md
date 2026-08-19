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

Scalar parameters receive copied values. Concrete aggregate parameters receive
fixed, non-null, non-reseatable address carriers to existing program storage.
An open-string parameter receives the same fixed carrier plus its actual
capacity. An open-array parameter receives the fixed carrier plus its actual
16-bit element count. The callee may mutate that storage where the language
permits.

<div id="62-activation-state" class="nucleus-source-anchor"></div>

## 6.2 Activation state

Each successful call creates distinct logical storage for its scalar
parameters, scalar locals, aggregate-parameter carriers and retained open-view
bounds, return address, and other live implementation state. Recursion uses the
same mechanism as an ordinary call. One active invocation must not overwrite
another's state.

In the current Z80 activation, a concrete aggregate parameter occupies its
two-byte alias slot. `string[]` adds one hidden capacity byte immediately after
that slot. `T[]` adds one hidden little-endian count word immediately after the
alias slot. Positive `IX` source displacements therefore include two call-stack
words for either open view, while activation offsets include three bytes for
`string[]` and four for `T[]`. Parameters later in a signature are displaced by
the complete retained size of every earlier binding. Caller cleanup counts both
words for each open-view source argument on success, propagation, and handling.

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

<div id="64-entry-stack-modes-and-interrupts" class="nucleus-source-anchor"></div>

## 6.4 Entry stack modes and interrupts

When `establishStack` is false, startup inherits the caller's stack and does not
write `SP`. The compiler reports the complete per-compilation stack requirement
but performs no capacity validation because the descriptor makes no claim
about the caller's available stack.

When `establishStack` is true, startup establishes `SP` at the mathematical end
of the writable region. Runtime vectors, initialized variables, and BSS grow
upward from `writableBase`; the stack grows downward from that end. The unused
writable extent must cover the published stack requirement plus the two-byte
saved incoming `SP`.

Startup first selects the new stack and pushes the incoming `SP`, placing that
saved value in the top two bytes. It restores the value on every terminal path:
normal return, unhandled recoverable failure, and trap. The value `$0000`
represents a stack end of `$10000`, not an empty region.

After restoration, the generated terminal dispatcher reaches the initialized
RAM vector selected by the recorded run state: success, unhandled failure, or
trap. These vector entries are terminal calls in the target ABI. If an adapter
returns from one during a monitor or proof run, execution returns to the
original caller through the restored stack.

The activation-depth and activation-byte limits remain independent bounded
resources. A call that would exceed either limit performs
`activation-capacity` before the callee begins or caller state changes.

This activation contract is not interrupt-reentrant. The compiler emits no
interrupt entry and the service adapter supplies no interrupt-safe-call
guarantee. A machine interrupt handler must remain outside Nucleus, preserve the
program's complete machine state, and not enter a Nucleus routine or service.

<div id="65-cross-bank-aggregate-restrictions" class="nucleus-source-anchor"></div>

## 6.5 Cross-bank aggregate restrictions

These are banked-target restrictions rather than language type rules. A valid
source program may receive a target diagnostic when it cannot be represented
safely under them.

An aggregate carrier contains a 16-bit address and no bank identity. The
compiler therefore enforces all three restrictions at a cross-bank boundary:

1. an aggregate constant is bank-local and cannot be named from another bank;
2. every aggregate argument must be rooted directly in a top-level program
   variable, including a field or array element selected from that root; and
3. the call cannot return an aggregate result.

A constant-rooted, parameter-rooted, or transient-result-rooted aggregate
argument cannot cross banks because its provenance is not represented in the
runtime carrier. Scalar arguments and results cross without this restriction.
A bank-local accessor may expose a scalar from a banked aggregate constant, and
a banked routine may operate on caller-owned RAM through a directly
variable-rooted aggregate argument. An open-array argument adds no bank field;
it follows the same root and call-placement restrictions as the concrete array
alias from which it is formed.
