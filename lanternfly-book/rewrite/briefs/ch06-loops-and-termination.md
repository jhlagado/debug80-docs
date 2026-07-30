# Brief — Chapter 6: Loops and Termination

## Single job
Teach repetition as a stated stopping rule, and termination as something you
argue, not hope. Euclid's algorithm is the centerpiece because its changing
state and its termination argument are both visible in four lines. Closes
Part I: with this chapter the reader has values, routines, decisions and
loops — everything an algorithm needs except structured data.

## What the student already knows
Ch 1–5: typed storage, expressions, routines with parameters/results/locals,
guards and invariants.

## Data representation introduced
None new — deliberate. Part I ends with scalars; Part II opens with the
observation that scalars alone cannot hold a table.

## Algorithm introduced
Euclid's GCD (the book's first named, historic algorithm); digit counting
(`/ 10` until small); accumulation over a counted range. Each loop form gets
the algorithm that justifies it.

## Ordered themes
1. A loop is a body plus a stopping rule; the three forms differ only in
   where the rule is announced (`while` before, `for` as a counted contract,
   `loop` inside).
2. `while`: test first, zero-iterations case as a feature; the progress
   obligation — some quantity must move toward the edge.
3. GCD walked as state: (48, 36) → (36, 12) → (12, 0). The invariant (the
   pair's GCD never changes) and the variant (`b` strictly decreases) — the
   two-question habit applied to a loop.
4. Termination and safety from one condition: `b > 0` both stops the loop
   and guards `a mod b` from `F-DIV-ZERO` — ch 5's invariant discipline,
   inherited by loops.
5. `for`: the counted contract — inclusive range, preheader order (start,
   then limit, then store; the limit sees the old control value), constant
   nonzero step, body cannot write the control variable
   (`E-CONTROL-003`), no wraparound at either boundary, defined post-loop
   value (§10.2 in full — the old book taught half of this).
6. Accumulation (`sumFirst`): the accumulator pattern named; zero-trip trace
   (`limit = 0` → sum 0, index holds converted start).
7. `loop`/`exit`/`continue`: the rule mid-body ("loop and a half");
   `continue` as the guard-clause of loops; both act on the innermost loop,
   flags or early `return` carry a nested result out.
8. Choosing the least powerful form that fits; the opening line as contract
   for reader and backend alike.

## Opening example
The GCD state table before any code — the algorithm as a column of shrinking
pairs, then the four lines that produce it.

## Companion program
`rewrite/examples/ch06-euclid.lf.txt`.

## Hand trace
`greatestCommonDivisor(48, 36)`: b=36: r=12, a=36, b=12; b=12: r=0, a=12,
b=0; return 12. `greatestCommonDivisor(17, 5)` → 1 (coprime).
`countDigits(4072)`: 4072→407→40→4, digits 1→2→3→4. `sumFirst(10)` → 55;
`sumFirst(0)` → 0 with index resting at 1.

## Memory / machine consequence
`a mod b` on a Z80 is a division helper per iteration — GCD's cost is the
helper times the iteration count, and the listing shows both. The counted
loop compiles to test-and-jump plus an increment the compiler controls,
which is why it may not be written to by the body.

## Explicitly deferred
Arrays and traversal (ch 7 — the sentence "loops earn tables" is the Part II
handoff); `repeat`/`until` and labelled exits (Deferred, §10.3); recursion
(profile capability, Part II).

## Open spec questions touched
None — §10 is fully Defined, including the preheader and post-loop rules.
