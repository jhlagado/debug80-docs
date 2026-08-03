---
layout: default
title: "Static Frames for Lanternfly"
parent: "Lanternfly White Papers"
nav_order: 3
---

# Static frames for Lanternfly: the storage-model justification

**Status: rationale and doctrine.** The Lanternfly specification
already commits to the storage model this paper defends: routine locals
and parameters are per-invocation in meaning, a backend may keep them in
static storage whenever whole-program analysis proves that invocations
cannot overlap, and recursion is a target-profile capability rather than
a default. This paper collects the justification for that commitment on
the Z80 baseline, states the recursion lowering and its limits, states
the interrupt doctrine — a firewall with a membrane — and records the
industrial precedent. This revision incorporates an adversarial
soundness review; every cost figure below survived it or was corrected
by it.

## 1. The decision being justified

Semantics first: every invocation of a routine receives independent
parameters and locals, and no local value persists between calls. Where
those values live is the backend's choice. The ALGOL tradition answers
"on a stack, always." The Fortran tradition answers "at fixed
addresses, unless recursion forces otherwise." Lanternfly takes the
Fortran answer with a modern guard: the compiler may use fixed
addresses exactly where it can prove no overlapping invocation reaches
them, and the language is shaped so that proof is exact — every call
edge is visible in source, there are no routine values and no indirect
calls, and a mutual cycle cannot even be written without a visible
`forward sub`.

## 2. The cost structure of the Z80

The Z80 has no stack-relative addressing mode. That single absence
drives the whole economy. The ways to reach a local, with their costs
in T-states:

| Access | Byte | 16-bit |
| --- | ---: | ---: |
| Absolute: `LD A,(nn)` / `LD HL,(nn)` | 13 | 16 |
| Frame pointer: `LD r,(IX+d)` | 19 | 38 |
| SP-tracked: `LD HL,n` + `ADD HL,SP`, then `(HL)` | 28 | 41 |
| SP-tracked, address already in HL | 7 | 20 |

A static local is one instruction at 13 or 16 T; the 16 T word form is
`LD HL,(nn)` — the other register pairs take the 20 T `ED`-prefixed
form, so wide traffic goes through HL in either model. The classic C frame is
worse twice over: every access pays the `DD`-prefixed IX penalty, and
every call pays the frame ceremony — `PUSH IX`, `LD IX,0`, `ADD IX,SP`
on entry, `LD SP,IX`, `POP IX` on exit — 68 T of overhead on top of the
27 T that `CALL` and `RET` already cost. The frame pointer also
permanently occupies one of the two index registers.

The stronger stack scheme drops IX entirely: the compiler tracks the
SP offset of every slot at compile time and forms addresses with
`ADD HL,SP`. The 21 T setup amortizes — once HL points into the frame,
each byte costs 7 T and `INC HL` walks to the next for 6 — and there is
no prologue at all. This is the scheme a good modern Z80 backend uses
when it must use a stack, and it is the fair comparison point. Static
addressing still wins it: no setup, no HL pressure (HL is also the
arithmetic workhorse), and 13–16 T unconditionally, from any register
state.

Calls tell the same story. Passing an argument to a static slot is one
absolute store; there is no push, no stack cleanup, no frame. Calls
become cheap enough to change program style — the tax on factoring
work into small routines largely disappears.

## 3. Memory: the overlay bound

Static allocation does not cost RAM proportional to the number of
routines. Two routines that can never be simultaneously live may share
the same slots, so the allocator colors the call graph and the total
local storage is the maximum over call paths — the same worst case a
stack would reach, but computed at build and placed at known addresses,
so local storage cannot overflow. The machine stack itself still
exists — return addresses, save-around spills, native handler frames —
and its bound is a build-time sum plus the profile's declared handler
headroom. On a 64K machine the difference in kind
matters more than the bytes: a stack's worst case is an estimate
defended by a guard; the overlay's worst case is a number in the build
report. Every local also has a fixed address in the symbol table,
which is what makes monitor-ROM debugging, watchpoints and `at`
placement work on real hardware.

## 4. Why the language makes the proof exact

C compilers for small targets discovered all of this decades ago — and
can only apply it after whole-project call-tree analysis that function
pointers, separate compilation and default-legal recursion routinely
break. Lanternfly inverts the burden. Whole-program compilation is the
only mode; routine names are not values; indirect calls do not exist in
the first edition; direct self-recursion is visible at the call site
and mutual recursion requires a `forward sub`. The overlap analysis is
therefore complete and decidable, not heuristic. The language is shaped
so the compiler may always do what the small-target C compilers do only
when the programmer has been careful.

## 5. Recursion: the save-around-call lowering

When the call graph does contain a cycle — a recursion-capable profile
has accepted it — the proposed lowering is not a general frame but a
targeted spill. The routine keeps its static slots and its fast
absolute addressing throughout. At each call site inside the cycle, the
compiler pushes exactly the caller's own slots that are live across
that call and restores them afterward — each activation protects
itself, because the caller alone knows which of its values the nested
activations would clobber:

```
fib:                          ; n in a static slot, absolute addressing
    ...
    LD   HL,(fibN)
    PUSH HL                   ; 11 T: save the live value
    CALL fib                  ; recurse
    POP  HL                   ; 10 T: restore
    LD   (fibN),HL
    ...
```

This is how an assembly programmer writes recursion by hand: the stack
saves machine state around the call; it does not carry an addressing
regime. In a mutual cycle the rule composes by induction: each
activation saves its own live values when it makes the call that
re-enters the cycle, so every level's state reaches the stack placed
there by the activation that owns it. The general per-level cost is 53 T per live 16-bit value — load
from the slot, push, and the mirror after the call — falling to 21 T
only when the value is already register-resident on both sides of the
call. The advantage over a conventional frame is therefore not the
per-level ceremony, which is comparable in the worst case; it is that
every access inside the routine stays at absolute speed, and that
entries from outside the cycle pay nothing at all. The saved set
includes every per-invocation carrier, the hidden address slots behind
aggregate parameters and aliases among them. A callee that exits
through the failure channel must still pass through the restore — the
bracketed call site propagates through a restore stub that preserves
the entire return channel: the result carrier, the failure discriminant
and the error code. The last is easy to break, because the Z80's only
absolute byte moves route through A, so a byte-slot restore clobbers a
code held there. The requirement belongs in the lowering contract.

Save-around covers scalar state, and that limit is doctrine, not
accident. Lanternfly has no aggregate locals: a routine's buffer is
module storage, one object shared by every activation, so recursion
cannot have a per-depth buffer implicitly. Where per-depth aggregate
state is genuinely needed, the language's own idiom supplies it
explicitly — a frame pool:

```lanternfly
record ParseFrame
    buffer as string[40]
    depth as u8
end

var frames as ParseFrame[8]     // eight levels, sized in the storage map
```

The recursive routine works in `frames[level]` and passes
`frames[level + 1]` down. The pool's depth bound is enforced:
an index past the end faults the range check like any other index.
The unguarded residue is the scalar side — the profile's declared
stack bound for save-around recursion is a build-time declaration, not
a runtime guard, and a profile that requires the guard must add it. The reference compiler
itself takes the strictest position available: per its charter it
recurses nowhere, compiling nested structure through explicit bounded
stacks — the frame-pool idiom applied to the compiler's own work.

One register-convention consequence belongs here. Within a
whole-program compilation there is no fixed caller-saves or
callee-saves convention: the compiler compiled both sides of every
call and saves the intersection of live and clobbered. Two boundaries
limit that claim: an `extern` routine's clobbers come from its
declared contract, and a call to a `forward sub` is emitted before the
callee's clobbers are known — a single-pass compiler assumes
all-clobbered there, or fixes a convention at forward boundaries.

## 6. Interrupts: the firewall and the membrane

Statically framed routines are not reentrant, and no analysis can make
an asynchronous entry into them safe: an interrupt can arrive with any
routine mid-flight, its scalars in shared slots and its buffers — which
are module storage, since the language has no aggregate locals — half
written. The doctrine is therefore a firewall, stated as a hard rule
rather than a default:

**Interrupt handlers are native code, and a handler never calls a
Lanternfly routine.** The rule binds every interrupt level. The Z80
baseline always has at least two — the non-maskable interrupt is
accepted regardless of the interrupt flip-flops, and mode 2 hardware
can add prioritized levels beyond that — and the firewall makes the
level count irrelevant to the storage model, because no level can reach
a Lanternfly frame. A handler saves machine state as handlers always
have — the shadow registers serve one level at 4 T per exchange, and
the profile reserves the alternate set for that level, so compiled code
and runtime components never touch it; further levels save to the
stack — does its narrow work, and returns.

The rule extends past Lanternfly routines to everything with static
workspace. A handler may call only native services and runtime
components whose contracts declare interrupt safety, and a
Lanternfly-owned component with static scratch — a division helper, a
copy routine — is never handler-callable, because the base program may
be inside it when the interrupt lands. The shared territory is
three-sided — Lanternfly code, handler code, and the services both
use — and the firewall binds all three sides.

The firewall does not isolate the two worlds; it disciplines their
contact. Communication crosses a *membrane* of volatile storage under
three primitives, each with declared writer and reader roles per
interrupt level:

- **The counter** — one writer, any number of readers, monotonic. The
  frame clock, and version counters generally. A reader compares; it
  never consumes.
- **The one-slot mailbox** — one producer, one consumer, empty/full by
  value. The pending-key cell of the cooperative-task papers.
- **The ring buffer** — one index per direction, each written by
  exactly one owner. Byte-wide indices are inherently atomic; word-wide
  indices depend on the single-instruction rule on both sides,
  hand-written handler code included. Full and empty are distinguished
  by keeping one slot empty, since a shared count would need two
  writers; a wrapped index is computed in a register and published in
  one store, never incremented in place and masked afterward. The
  natural shape for serial input.

Ownership is per interrupt level, not per side. The handler world spans
every level and levels preempt each other, so each written index, each
counter, each mailbox slot — and each consumed device register — is
owned by exactly one level or by the base program. Two levels feeding
one ring would be two writers on one index, and the discipline rejects
it.

A cooperative task blocked on input is then exactly the machine the
task papers describe: its wait arm tests a membrane object and returns
until the handler's posting satisfies it. The handler never resumes a
task, never touches a frame, and carries no reference to any task; it
deposits a value and returns. Whether a task should own an addressable
mailbox of its own — the actor discipline — is left as a pattern to
build on these primitives if real programs ask for it; the primitives,
not the addressing, are the fundamental layer.

One machine fact underwrites the membrane's atomicity, and it becomes
a compiler obligation: the Z80 recognizes interrupts only at
instruction boundaries, so a 16-bit value crossing the membrane is
coherent only when each side touches it in a single instruction —
`LD HL,(nn)` and `LD (nn),HL`, never a pair of byte transfers a handler
can split. Volatile word access on a membrane object must lower to the
single-instruction form or be guarded. The rule's edge is the block
instructions: `LDIR` and its family accept interrupts between
repetitions, so a compiled aggregate copy is never atomic, and a
membrane object wider than a word needs a protocol, not a copy. One
specification consequence shapes any membrane library: the first
edition rejects volatile aggregates as aggregate arguments, so ring
operations address their declared storage directly rather than through
a parameterized routine.

The precedent for the membrane is broad and direct. It is the
top-half/bottom-half discipline of Unix interrupt handling; it is
FreeRTOS's deliberately separate `FromISR` interface family; it is the
wake-flag contract of Rust's embedded executors. The conceptual shape —
two worlds that never call each other, a typed boundary that only
values cross — is the effect-isolation move functional languages make
between pure code and I/O, applied here to the boundary that matters on
this machine: the one between synchronous, run-to-completion Lanternfly
and the asynchronous machine code beneath it.

## 7. Precedent after the stack won

The stack did not win everywhere. It lost precisely on processors
shaped like this one, and the model this paper defends has been
industrial practice ever since:

- **Keil C51 (8051), 1980s to the present.** The mainstream compiler
  for one of the most-shipped processor families in history allocates
  locals and parameters statically by default, overlaid by call-tree
  analysis, with per-interrupt-level overlay areas. A function shared
  across call trees draws a linker warning, and the `reentrant`
  keyword's simulated stack is one remedy among several. Lanternfly's
  per-routine hybrid, shipping for forty years.
- **HI-TECH C and Microchip XC8 (PIC).** The "compiled stack":
  call-graph coloring of static locals, because the hardware cannot
  address a data stack at all.
- **Safety-critical C.** MISRA bans recursion; the JPL coding rules
  forbid it specifically so that a static call graph and a provable
  memory bound exist. That world spends real money retrofitting this
  discipline onto C; here it is the semantic default.
- **The newest platforms.** GPU shader compilers allocate statically
  and ban recursion; eBPF verifies static bounds; Rust's embedded
  executors allocate task frames statically on machines with kilobytes
  of RAM. The constrained and the verified environments keep
  converging on the same model from both ends of the industry.

## 8. The performance claim, stated checkably

The comparison must be same-terms, so take one named call shape — two
16-bit arguments, five accesses to locals inside the callee — through
each model:

- **Static:** `CALL` and `RET` at 27 T; two argument stores at 16 T
  each; five absolute accesses at 13–16 T. About 140 T, from any
  register state, with both index registers free.
- **Classic IX frame:** two pushes, the 68 T ceremony, `CALL`/`RET`,
  caller stack cleanup, five accesses at 19–38 T. Roughly 230–320 T.
- **Good SP-tracked compilation:** two pushes, `CALL`/`RET`, cleanup,
  first access at 28 T and the rest at 7 T per byte while HL holds the
  frame address — byte figures, where the static line counts words.
  Roughly 130–170 T when the access pattern cooperates —
  competitive, at the price of HL occupancy and re-forming the address
  whenever HL is needed for arithmetic.

In sum: against the classic frame the static model is
about twice as fast; against the best stack compilation the advantage
narrows to the access side and register freedom — an argument store at
16 T is dearer than a push at 11, and the win is that the callee reads
its slots at 13–16 T unconditionally. Beyond speed:

- worst-case local RAM is a build-time number; local storage cannot
  overflow, and the return-address stack bound is a build-time sum
  plus the profile's declared handler headroom;
- recursion, where a profile admits it, pays 21–53 T per live word at
  its own call sites and nowhere else, with the declared depth bound
  as its stated, unguarded assumption.

The comparison is with the compilation that ALGOL semantics force on a
separately compiled language with routine pointers. The point of
Lanternfly's storage model is that the language's own rules — whole
program, no routine values, visible cycles — make the fast path the
always-available default, and the historically slow machine turns out
to be the one this model fits best.
