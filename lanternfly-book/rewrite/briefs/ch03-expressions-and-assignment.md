# Brief — Chapter 3: Expressions and Assignment

## Single job
Teach formulas as typed calculations: every operation has a resolved result
width, chosen by fixed rules the reader can run by hand. The reader leaves
able to trace both the value and the type through any expression.

## What the student already knows
Ch 1–2: storage, types, binary, conversions, assignment as
destination-then-source-then-store.

## Data representation introduced
None new — this chapter is the algebra over ch 2's representations.
`boolean` gains its producers (comparisons).

## Algorithm introduced
Till arithmetic: change from a payment; pounds and pence via `/` and `mod`
("which group and where inside"); shelf spacing via `abs` of a byte
difference (the signed-intermediate story; conformance fixture 4 family).

## Ordered themes
1. Expressions combine stored values into new ones; the compiler must width
   every intermediate before the first instruction exists.
2. Operator inventory; `/` truncates toward zero; `mod` completes it
   (`left = (left/right)*right + (left mod right)`); zero divisor:
   compile error when constant, `F-DIV-ZERO` at runtime.
3. The result table: byte ops widen to 16 bits (255 × 255 needs them);
   `u8 - u8` → `i16`; 16/32-bit ops keep their type — so `u16 - u16` is
   `u16` and wraps if the true answer is negative (sets up ch 5's guards).
4. One-sided widening; never a third common type; `u8 + i8` requires a
   written decision.
5. Operator order picks intermediates: `x + 1 - y` vs `i16(x) + 1 - i16(y)`.
6. Shifts double and halve; count is mathematical; overshift is defined,
   not a fault.
7. Precedence: school algebra on top, comparisons before `not`
   (`not x = y` is `not (x = y)`), `^` right-associative
   (`-2 ^ 2 = -(2 ^ 2)`).
8. Comparisons produce `boolean`; no chaining; storing a comparison names a
   fact (`isPaid`).
9. `and`/`or`/`xor`/`not`: logical on `boolean` (short-circuit guards),
   bitwise on integers; `(flags and mask) <> 0` idiom.
10. Round-trip exemption: why `total = total + price` never warns (§8.1);
    constant folding agrees with runtime, wrap for wrap.
11. Evaluation order (§8.7): statements, arguments, operands, paths, and
    destination-first assignment — the machine's order is part of meaning.

## Opening example
`change = paid - total` — correct today, wrapping tomorrow; the type trace
(`u16 - u16 → u16`) tells you which.

## Companion program
`rewrite/examples/ch03-till-arithmetic.lf.txt`.

## Hand trace
paid 500, total 293 → isPaid true; change 207; pounds 2, pence 7
(2 × 100 + 7 = 207 reconstructs it); backShelf 250, frontShelf 20 →
`backShelf - frontShelf` is `i16` 230, `abs` → `u16` 230.

## Memory / machine consequence
A 16-bit divide on Z80 lowers to a runtime helper — named in the listing and
cost report; the same line under a C backend is one operator. Source meaning
identical; price visible.

## Explicitly deferred
Guarding the wrap (ch 5); loops over the arithmetic (ch 6); masks in earnest
(worked into flags examples where data needs them, ch 10–11).

## Open spec questions touched
None — Defined throughout (gate ch 3 entry).
