# Brief — Chapter 9: Sorting and Rearranging Data

## Single job
Insertion sort taught by its invariant — "the prefix is sorted; each pass
grows it by one" — so the reader can argue the algorithm correct after every
pass instead of receiving finished code as magic.

## Prior knowledge
Ch 7–8: arrays, traversal, search, the in-band conventions; Part I's
invariant/variant habit from GCD.

## Data representation introduced
None new — the same `i16[8]` readings. The chapter's point is that
rearrangement is pure algorithm over an unchanged representation.

## Algorithm introduced
Insertion sort. Chosen over selection sort: its invariant is the cleaner
sentence, its inner loop showcases the guarded compound condition a third
time, and it moves elements by shifting — the pattern record tables reuse.
Selection sort appears in one paragraph as the fewer-moves alternative,
with the trade stated (fewer writes, same comparisons, weaker invariant
sentence).

## Ordered themes
1. Sorted order as an invariant worth paying for (ch 8's searches; every
   report the capstone will print).
2. The insertion idea run on paper first: a hand of cards, one card taken
   into a sorted hand — before any code.
3. The two-loop structure: outer `for pass = 1 until count(...)` (counted
   contract in ch 7's half-open idiom — each pass takes exactly one new
   element), inner `while` (uncounted shifting — the stopping rule is
   data-dependent; ch 6's form-choice rule again). `for each` is the wrong
   tool here and saying why teaches both forms: sorting moves values
   *between* positions, and only the indexed loop has positions.
4. The inner guard: `slot > 0 and readings[slot - 1] > value` — short-
   circuit protects both the underflow (`u8` 0 - 1 would index as i16 -1)
   and the bounds check; third appearance of the pattern, now load-bearing.
5. Invariant after each pass, traced as a table: prefix sorted, suffix
   untouched; the variant: unsorted suffix shrinks by one per pass —
   termination argued as in GCD.
6. Shifting vs swapping: the hole moves left until the value fits; element
   count of moves traced (best case one test, worst case the full prefix —
   cost is data-dependent and the trace shows both).
7. Stability mentioned in one sentence (equal elements keep their order —
   matters when records arrive in ch 11).

## Opening example
The card-hand paragraph and the pass table for [12, 15, 9, ...] — invariant
visible before syntax.

## Companion program
`rewrite/examples/ch09-insertion-sort.lf.txt`.

## Hand trace
[12, 15, 9, -3, 0, 21, 18, 7] →
pass 1: [12, 15 | ...] (no shift); pass 2: [9, 12, 15 | ...] (two shifts);
pass 3: [-3, 9, 12, 15 | ...] (three); pass 4: [-3, 0, 9, 12, 15 | ...]
(three); pass 5: 21 stays (zero shifts — already greatest);
pass 6: [..., 18, 21 | 7] (one); pass 7: [-3, 0, 7, 9, 12, 15, 18, 21]
(five). Sorted; 14 shifts total, traced per pass.

## Memory / machine consequence
A shift is one two-byte element copy; the pass table doubles as a cost
table (shifts × copy cost + comparisons × test cost). Sorting in place uses
zero extra table storage — one scalar holds the travelling value.

## Explicitly deferred
Sorting record tables by a key field (ch 11 — the shift becomes an
aggregate copy and the cost table gets a column); faster orders
(merge/quick need either recursion-capable profiles or explicit stacks —
named outright as beyond this book's first edition).

## Open spec questions touched
None.
