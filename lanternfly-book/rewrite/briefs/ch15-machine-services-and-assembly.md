# Brief — Chapter 15: Machine Services and Assembly

## Single job
Cross the boundary between portable meaning and the machine, in the three
sanctioned ways: typed external routines (services), device storage
(`volatile` + `at`), and raw assembly behind a declared barrier. The
language's oldest promise — visible cost — becomes the artifacts ledger.

## Prior knowledge
Ch 1–14: a complete portable program with modules; twelve chapters of "the
observable result is final storage" waiting for a screen.

## Data representation introduced
Device storage: a placed volatile byte (`volatile var keyboardStatus as u8
at $9000`) — storage whose every access is an event. Opaque addresses in
their working role (a VRAM address held for a service).

## Algorithm introduced
None — the chapter is about boundaries. The report line from ch 12 finally
reaches a screen through a platform interface module.

## Ordered themes
1. Arithmetic means the same everywhere; a pixel does not. Portable core,
   platform edge, and the typed door between them (§13.2).
2. `extern sub`: a Lanternfly signature over a native body. The types do
   protective work — the wrong argument width is a compile error here, a
   silent crash in raw assembly. Binding forms: `at` (ROM entry points),
   `from` (substrate symbols), unqualified (profile binds); a missing
   binding is `E-EXTERN-001`, not a runtime mystery.
3. The platform interface module: one file per target collecting its
   services; the game imports the face, never the machinery (ch 14's
   borders earning their keep). Service names illustrative pending Q2.
4. The native contract: value invariants at entry and return (integers at
   width, Booleans 0/1, `cstring` terminated and immutable); effect
   summaries; the conservative fallback and `W-NATIVE-001` — and its bite:
   a conservative call inside a counted loop can be rejected because it
   might write the control variable (`E-CONTROL-003`).
5. `volatile` + `at`: reads and writes as observable events, never cached,
   combined or reordered; declaring a register never writes it; volatile
   storage stays out of aliases and aggregate arguments (§4.3–4.4).
6. `asm` statement blocks: raw lines for the selected assembler, emitted
   verbatim, closed by `end`; the conservative barrier (assume
   reads/writes/calls/clobbers everything visible) priced in the
   surrounding code; control must reach the following statement;
   `W-ASM-001`. Module-level `asm` for directives and symbols, exposed
   only through `extern` contracts.
7. Helpers itemized: the runtime you get is the runtime you used, with the
   receipt (§13.1); fault services as the non-returning floor under
   everything since ch 3.
8. The artifacts ledger (conformance §7): provenance, layouts, helper
   lists, effect summaries, startup order, cost — every "the listing shows
   it" in this book, cashed.

## Opening example
`printText(reportLine)` failing to exist — one paragraph on why no core
keyword prints — then the three-line extern declaration that makes it a
typed call.

## Companion program
`rewrite/examples/ch15-platform-services.lf.txt` (files marked inline:
`platform.lf` and `main.lf`).

## Hand trace
The trace is now an *ordered service trace* (conformance compares those
beside final storage): printText("READINGS"), newline(), printNumber(2),
printChar('-')… the exact call sequence written out, plus the volatile
read of `keyboardStatus` that no optimizer may elide.

## Memory / machine consequence
An `at $0008` binding is a Z80 RST-area entry; the `asm` barrier forces
the backend to spill live values around it (visible in the listing); the
service module adds zero bytes beyond its bindings.

## Explicitly deferred
Narrowed asm effect contracts (Incomplete, §16); native callbacks
(Deferred); the full program assembly (ch 16 composes everything).

## Open spec questions touched
Q2 (standard service names — the module is labelled illustrative until the
project fixes them).
