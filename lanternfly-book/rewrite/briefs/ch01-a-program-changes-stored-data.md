# Brief — Chapter 1: A Program Changes Stored Data

## Single job
Establish the book's equation at its smallest scale: a program is a designed
piece of stored data plus statements that change it, run once from an entry
point. The reader leaves able to read a complete Lanternfly program and state
its final stored values.

## What the student already knows
Nothing about Lanternfly. General curiosity about programming a small
machine; possibly BASIC, Python or C habits, addressed where they mislead.

## Data representation introduced
An invoice's running state: `total as u16` (a money amount in whole pence —
can exceed 255, never negative, never past 65,535 for this shop) and
`itemCount as u8`. Prices are `const u16` values. The representation choices
are the chapter's first lesson: each type records a decision about the
largest value the fact can take.

## Algorithm introduced
Accumulation in a straight line: three fixed line items added to the total,
the count stepped after each. No decisions, no loops — sequence alone.

## Ordered themes
1. Programs keep facts as stored data; the two questions (what data? what
   algorithm?) asked of the invoice.
2. Choosing the representation: `u16` for money in pence, `u8` for a count;
   what each choice rules in and out.
3. `const` for fixed facts — a scalar constant normally occupies no storage.
4. `var` for changing facts — static storage, initialized before entry.
5. The entry point: the build names one parameterless `main`; storage is
   installed before it runs; returning from it ends the program via the
   target's termination service.
6. Assignment: destination path, then right-hand expression, then store
   (spec §8.7 — fixes old book's claim, gate F1). Reading
   `total = total + applePrice` as old value in, new value out.
7. Statements run in source order; the program is a finite story from entry
   to return.
8. The trace: final storage is the program's answer (conformance compares
   final storage — the book's pencil-trace culture starts here).
9. Machine consequence: `total` is two bytes at an address the compiler
   chooses; one accumulation is a load, an add and a store; the round-trip
   store back to `u8`/`u16` carries no warning (spec §8.1 exemption).

## Opening example
The three-line fragment `var total as u16 = 0` / `total = total + 120` shown
before the full program, to fix the assignment reading.

## Companion program
`rewrite/examples/ch01-invoice.lf.txt` (below; fixture-1 "Counter" family).

## Hand trace
| after statement | total | itemCount |
| --- | ---: | ---: |
| entry | 0 | 0 |
| + apple 120 | 120 | 1 |
| + bread 95 | 215 | 2 |
| + milk 78 | 293 | 3 |
Return from `main` → termination service. Final storage: total 293 ($0125),
itemCount 3.

## Memory / machine consequence
Variables occupy three bytes of static storage (2 + 1); constants occupy
none. Sketch (not full listing): one `u16` accumulation on a Z80 is roughly
load HL from `total`, load DE with the price, add, store HL — a handful of
instructions, countable in the generated listing.

## Explicitly deferred
Decisions (ch 5), loops (ch 6), routines beyond `main` and parameters
(ch 4), any output (ch 15–16 — the program's observable result is its final
storage), expression-width subtleties (ch 3), binary literals (ch 2).

## Open spec questions touched
Q1 (gate): concrete build-manifest format — the chapter says "the build
names `main`" in prose and shows no manifest file.
