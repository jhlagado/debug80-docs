# Brief — Chapter 5: Decisions and Invariants

## Single job
Teach `if` and `select` as the machinery that keeps stored data truthful —
rules about data, enforced at the moments data changes — rather than as
branching syntax. The reader leaves asking "what must stay true?" before
asking "what do I test?".

## What the student already knows
Ch 1–4: typed storage, expressions and comparisons, routines with
parameters, results and locals; one documented precondition (`meanPrice`).

## Data representation introduced
None new. A state code held in named constants (payment methods) — the
constants-as-states idiom.

## Algorithm introduced
Guarding: the wrap-prone subtraction and the zero-count division from chs
3–4, each wrapped in the test that makes it safe. Classification: delivery
fee from weight (ordered chain), surcharge from payment method (`select`).

## Ordered themes
1. Ch 3 left `change = paid - total` correct only when paid covers total;
   ch 4 left `meanPrice` one empty till from a fault. Neither line is wrong;
   each has an unstated rule. A decision states the rule in code.
2. `if`/`then`/`end`: the guard — the difference between a precondition
   (comment, hope) and an invariant (mechanism).
3. `else` is exhaustiveness: every case acts, no state falls through with
   stale data.
4. `else if` ranks overlapping rules; order is policy (the fee bands: the
   dead-heat case decided by position).
5. All-paths-return (§11.5) now has teeth: the compiler proves the guarded
   `meanPrice` returns on every branch — ch 4's promise, cashed.
6. Early `return`: dispose of the empty-till case first, write the real work
   flat (guard-clause shape; `continue` echoes it in ch 6).
7. `select`: one integer expression against constant cases; no fall-through;
   duplicates/overlaps rejected (`E-CONTROL-001`); `else` as the defensive
   default. Chain vs select: different questions vs one classified value.
8. Invariant discipline: name the rule, guard every write that could break
   it, let `else` cover the remainder — the pattern Part II's algorithms
   (search misses, sort passes) will reuse.

## Opening example
`safeChange`: `if paid >= total then return paid - total end return 0` —
the ch 3 wrap, retired in four lines.

## Companion program
`rewrite/examples/ch05-guarded-till.lf.txt`.

## Hand trace
`safeChange(500, 293)` → 207; `safeChange(200, 293)` → 0 (no wrap).
`meanPrice()` empty → 0; after two sales → 107.
`deliveryFee(450)` → 95; `deliveryFee(2000)` → 250 (boundary lands in the
middle band — inclusive `<=` decides); `surcharge(voucher)` → else branch
rejects: 0 and `accepted = false`.

## Memory / machine consequence
A comparison is arithmetic plus a conditional jump — among the cheapest
things the machine does; a chain costs by distance travelled; `select`
evaluates its subject once.

## Explicitly deferred
`case` ranges (Provisional, gate Q3 — omitted); loops (ch 6); Boolean
selection (Deferred, §9.2).

## Open spec questions touched
Q3 acknowledged; otherwise Defined.
