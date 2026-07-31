# Brief — Chapter 11: Tables of Records

## Single job
Assemble the book's first database: a fixed-capacity, variably-occupied
table of records with append, search, update and aggregate operations —
every prior chapter's machinery composed into one working data store.
Introduces aggregate parameters as the repair for ch 10's closing clunk.

## Prior knowledge
Ch 7–10: arrays, search skeletons, sort invariants, the `Reading` model.

## Data representation introduced
The partial-fill pattern: `log as Reading[logCapacity]` plus
`logCount as u8` — fixed storage, variable occupancy, and the invariant
that gives the count its meaning: entries 0..logCount-1 are meaningful, the rest are
noise; every operation preserves it. Fifty bytes of table, one byte of
occupancy.

## Algorithm introduced
The database quartet: append (guarded by capacity — full is an answer, not
a fault), find-by-key (ch 8's skeleton walking record fields), aggregate
(best-so-far and mean over occupied entries only), update-in-place (via an
aggregate parameter aliasing the found entry).

## Ordered themes
1. Ch 10 modelled one reading; real programs keep many — array of records,
   stride `size(type Reading)`, bracket-then-dot paths.
2. Occupancy: capacity is representation, count is state; the
   0..logCount-1 invariant stated once and defended in every routine
   (ch 5's discipline, now guarding a data structure).
3. Append: the capacity guard returns `false` — full is a caller's
   decision, not a fault; boolean results as operation reports.
4. Search by key: the ch 8 skeleton re-aimed at fields
   (`log[index].day = day and ...`); absent stays in-band as `logCount`.
5. Aggregate parameters at last: `markValidated(entry as Reading)` aliases
   the caller's storage — writable alias semantics (§11.3), the argument
   must be a storage path (`E-CALL-001`), and ch 10's clunky comparisons
   collapse into clean two-record routines.
6. Aggregates over occupancy: warmest index, mean temperature — loops
   bounded by `until logCount`, not capacity; empty-table answers defined.
   The contrast with ch 7 is load-bearing: `for each` traverses the whole
   fixed array, capacity and all, so the partially filled table *requires*
   the indexed form — the occupancy invariant lives in the loop bound.
7. One paragraph, promised in ch 9: sorting this table by a key turns each
   shift into a five-byte aggregate copy; the cost table gains a column
   and nothing else changes.

## Opening example
The occupancy invariant stated in prose over a diagram of the half-full
table, before any routine.

## Companion program
`rewrite/examples/ch11-reading-log.lf.txt`.

## Hand trace
Append (11,1,2°), (12,1,-3°), (13,1,5°) → logCount 3.
`findByDate(12, 1)` → 1. `markValidated(log[1])` → entry 1's validated
flag true, in place. `warmestEntry()` → temps 2, -3, 5 → index 2.
`meanTemperature()` → (2 - 3 + 5) / 3 = 4 / 3 = 1. Full-table append
returns false with the table unchanged.

## Memory / machine consequence
`log[index].temperature` is base + index × 5 + 2 — a runtime multiply by a
non-power-of-two stride (helper or shift-add on Z80; listing shows which).
The whole database is 51 bytes; the reader can point at each.

## Explicitly deferred
References into the table ("the current entry" without an index — ch 13);
text labels for reports (ch 12); the capstone owns the full
append/search/report lifecycle with services attached (ch 16).

## Open spec questions touched
None. Aggregate-parameter rules fully Defined (§11.3); the unqualified
shorthand's default-class behaviour is noted for ch 13 to complete.
