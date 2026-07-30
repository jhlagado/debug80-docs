# Brief — Chapter 4: Subroutines and Local State

## Single job
Give the reader the tools algorithms are built from — parameters carrying
values in, results carrying values out, locals holding private working state
— before the algorithms arrive. Moved forward from old ch 9 so that chs 5–9
never depend on global-only examples.

## What the student already knows
Ch 1–3: storage, types, expressions, one routine (`main`) with no inputs.

## Data representation introduced
The routine frame as a concept: per-invocation scalar parameters and locals;
where they live is the backend's business (registers, stack slots,
proven-safe static scratch), what they mean is fixed.

## Algorithm introduced
Decomposition of the till program into named operations: `addSale` (action),
`poundsPart`/`pencePart` (value-producers), `totalWithService` (local used
for an intermediate). Straight-line bodies only; branching arrives ch 5.

## Ordered themes
1. One routine served ch 1–3; a program of any size is a vocabulary of them.
2. `sub` declares both species: omit the trailing `as Type` for an action,
   write it for a value-producer (Pascal split, one keyword).
3. Parameters: `name as Type`, values fresh per invocation; arguments
   evaluate left to right (§8.7) — order is meaning.
4. Results: `return expression`; a call with a result is an expression and
   stands wherever its type stands.
5. Scalar locals: declared before statements, visible after declaration,
   zero-initialized when owned and uninitialized, initializers run in order
   per invocation (§4.2). Privacy shrinks the world a reader must consider.
6. Parameters vs module storage: particulars travel in through the front
   door; ambient facts stay ambient — a line drawn per routine, on purpose.
7. Preconditions: `meanPrice` requires `saleCount > 0` or `F-DIV-ZERO`;
   ch 4 documents the obligation, ch 5 enforces it (the book's first
   invariant, one chapter early on purpose).
8. Calling convention: fresh values are semantics; lodging is backend
   economics (static scratch as the Z80 economy, valid only when proven).
9. Recursion previewed as a profile capability (§11.6); deferred to Part II
   examples.

## Opening example
`addSale(price as u16)` called twice with different arguments — one
transaction description, many transactions.

## Companion program
`rewrite/examples/ch04-till-routines.lf.txt`.

## Hand trace
`addSale(120)`; `addSale(95)` → total 215, saleCount 2.
`totalWithService(200)`: local `service = 200 / 10 = 20`; returns 220.
`meanPrice()` with the traced state → 215 / 2 = 107 (truncating division —
ch 3 pays its way). Precondition holds in this run; the comment marks the
debt.

## Memory / machine consequence
A scalar parameter is a value delivered per call — register or scratch cell;
the frame report (§11.6 artifacts) prices each routine. Calling `addSale`
twice costs two calls, not two copies of the routine.

## Explicitly deferred
Early `return` and all-paths-return checking (ch 5, where branches make them
meaningful); aggregate parameters (ch 7/11 — writable aliases need arrays);
reference-class results (ch 13); recursion in practice (Part II).

## Open spec questions touched
None. Note §11.3: parameter-free routines are the first implementation
stage — staging fact, not semantics; the book teaches the full form.
