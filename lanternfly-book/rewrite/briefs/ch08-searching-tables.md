# Brief — Chapter 8: Searching Tables

## Single job
The first chapter centred on a complete algorithm: linear search. Teach the
two questions a search answers (present? where?), the in-band absent
convention, and the sentinel technique — including what mandatory bounds
checking does to a trick invented for unchecked languages. Decision from the
finished examples: search and sorting stay separate chapters; both carry
full weight.

## Prior knowledge
Part I complete; ch 7's array and traversal skeleton.

## Data representation introduced
A spare slot: `samples as i16[9]` holds eight payload values plus one cell
reserved for a sentinel. Representation serving algorithm — the first time
storage is shaped for a technique rather than for the data alone.

## Algorithm introduced
Linear search, twice. Plain: test position and value each step, stop at
match or end; absent reported in-band as `sampleCount`. Sentinel: plant the
target in the spare slot so the value test alone terminates the loop.

## Ordered themes
1. "Is it there, and where?" — one scalar result can answer both when one
   index value is reserved for "absent"; the caller's contract.
2. Plain search: the compound condition
   `index < sampleCount and samples[index] <> target` — ch 3's
   short-circuit guard protecting the access; zero-length and
   absent traces as first-class cases.
3. Loop choice: `while`, not `for` — the stopping rule is not a counted
   range (ch 6's least-powerful-form rule paying off).
4. The sentinel: move the boundary test into the data. One comparison per
   step instead of two — Wirth-era arithmetic.
5. The full 0.4 accounting: the sentinel guarantees termination
   dynamically, but the compiler cannot prove `index` in range, so each
   access carries a runtime bounds check (`F-BOUNDS`, §6). The trick that
   removed one comparison re-buys another. Cost report comparison: plain
   (proven, checkless) vs sentinel (checked). On a conforming target the
   sentinel is a historical lesson in moving tests into data, not a speedup
   — and unchecked modes are explicitly nonconforming (§6).
6. Restoring state: the sentinel slot is scratch; what a routine borrows it
   documents (invariant discipline over storage the caller sees).

## Opening example
The two-question contract stated in prose, then `findPlain`'s four lines.

## Companion program
`rewrite/examples/ch08-search.lf.txt`.

## Hand trace
samples payload [12, 15, 9, -3, 0, 21, 18, 7]. `findPlain(-3)`: indices
0,1,2 mismatch; 3 matches → 3. `findPlain(99)`: eight mismatches, index
reaches 8, left test fails → returns 8 = absent. `findWithSentinel(21)`:
plant 21 at slot 8; hits at 5 → 5. `findWithSentinel(99)`: runs to the
plant at 8 → absent.

## Memory / machine consequence
Plain search: compare-index, compare-value, increment per step — with the
index test proven, the checked build emits no bounds machinery. Sentinel:
compare-value, increment, plus the target's bounds check per access; the
listing makes the trade visible instead of folkloric.

## Explicitly deferred
Sorted data and what it buys a search (binary search — Part II follow-up if
an example earns it; otherwise the capstone's log stays linear and says
why); searching record tables (ch 11 reuses this skeleton over fields).

## Open spec questions touched
None. The sentinel/checking interaction is Defined behaviour worth a line
in the book's conformance notes, not a spec question.
