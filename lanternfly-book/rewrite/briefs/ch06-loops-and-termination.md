# Brief — Chapter 6: Loops and Termination
*(revised 2026-07-31 for the 3b31fe4 loop vocabulary)*

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
Euclid's GCD (the book's first named, historic algorithm); smallest-divisor
search (the `while true` + mid-body test shape); digit counting; accumulation
over a counted range.

## Ordered themes
1. A loop is a body plus a stopping rule; the forms differ only in where and
   how the rule is announced.
2. `while`: test first, zero-iterations as a feature; the progress
   obligation — some quantity must move toward the edge.
3. GCD walked as state: (48, 36) → (36, 12) → (12, 0). Invariant (the
   pair's GCD never changes) and variant (`b` strictly decreases) — the
   two-question habit applied to a loop. Termination and safety from one
   condition: `b > 0` both stops the loop and guards `a mod b`
   (`F-DIV-ZERO`).
4. Counted ranges, two spellings: `to` includes its limit, `until` excludes
   its boundary. `to` reads naturally for "the numbers 1 through 10";
   `until` is the half-open twin whose natural home — zero-based tables —
   arrives in ch 7. The boundary is evaluated once, after the start, and is
   independently typed (§10.1).
5. The counted contract in full: constant nonzero `step`; body cannot write
   the control variable, including through calls (`E-CONTROL-003`); next
   value computed mathematically and tested *before* storing, so unsigned
   loops cannot wrap — and a continuing value that cannot fit the control
   type is `F-LOOP-RANGE`, not a silent wrap; defined post-loop value.
6. Accumulation (`sumFirst`): the accumulator pattern named; zero-trip trace
   (`limit = 0` → sum 0, control rests at converted start).
7. `while true`: the indefinite loop is the conditional loop told the truth
   — the real stopping rule lives mid-body as `if ... exit` (the
   smallest-divisor search: the "loop and a half" shape). `exit` and
   `continue` act on the innermost loop only; `exit` never leaves a
   routine — `return` does.
8. `for each` named in one paragraph as the traversal form awaiting arrays
   (ch 7 owns it).
9. Choosing the least powerful form that fits; the opening line as contract
   for reader and backend alike.

## Opening example
The GCD state table before any code — the algorithm as a column of shrinking
pairs, then the four lines that produce it.

## Companion program
`rewrite/examples/ch06-euclid.lf.txt`.

## Hand trace
`greatestCommonDivisor(48, 36)`: b=36: r=12; b=12: r=0; returns 12.
`greatestCommonDivisor(17, 5)` → 1. `smallestDivisor(35)`: 2 no, 3 no,
4 no, 5 yes → 5; `smallestDivisor(13)` → 13 (prime). `countDigits(4072)`:
4072→407→40→4, digits 1→2→3→4. `sumFirst(10)` → 55; `sumFirst(0)` → 0 with
the control resting at 1.

## Memory / machine consequence
`a mod b` on a Z80 is a division helper per iteration — GCD's cost is the
helper times the iteration count, and the listing shows both. The counted
loop compiles to a compiler-owned increment and test, which is why the body
may not touch the control variable.

## Explicitly deferred
Arrays, `for each` and `until`-over-`count` in earnest (ch 7);
`repeat`/`until` post-test loop and labelled exits (Deferred, §10.4);
recursion (profile capability).

## Open spec questions touched
None — §10 is fully Defined, including `F-LOOP-RANGE` and the preheader
and post-loop rules.
