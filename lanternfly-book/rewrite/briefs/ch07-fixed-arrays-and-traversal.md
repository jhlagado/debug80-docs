# Brief — Chapter 7: Fixed Arrays and Traversal
*(revised 2026-07-31 for the 3b31fe4 loop vocabulary)*

## Single job
Open Part II with the representation loops were waiting for — storage
selectable by arithmetic — and the two traversal idioms that walk it:
`for each` when the work needs elements, `for ... until` when it needs
positions. The reader leaves able to declare an array and run the three
traversal shapes (sum, best-so-far, mean) that most table work reduces to.

## What the student already knows
All of Part I. Ch 6 closed naming `for each` and `until` as the forms whose
natural home is this chapter.

## Data representation introduced
`var readings as i16[8]` — eight temperatures, signed because weather is.
Shape in the type; zero-based indices as distances; row-major 2D as a filing
convention (small weekly grid); `count`/`size` tying loops to declarations.

## Algorithm introduced
Traversal: visit every element once. Sum and best-so-far by element
(`for each`), mean from sum and count, grid total by element over 2D.

## Ordered themes
1. Names die at compile time; a runtime choice among storage cells needs
   arithmetic — the array as base + index × size.
2. Declaration: extent constant, storage contiguous, `count(...)` instead of
   a magic 8.
3. `for each element in table`: the traversal that says only "every element,
   in order". The binding *is* the current element — reading it reads the
   array, assigning it writes the array (write-through; `pixel = 0` clears
   as it goes). The collection path is evaluated once; constant arrays give
   read-only bindings (§10.2, `E-CONTROL-005`).
4. When the position matters, the indexed form: `for index = 0 until
   count(readings)` — the half-open boundary takes the count directly, no
   subtract-one, and the boundary's independent typing lets a `u8` control
   walk a 256-entry table to its exact boundary (§10.1; the conformance
   suite tests precisely this).
5. Zero-based indexing read as distance; bounds checking (`F-BOUNDS`)
   unless proven — and both idioms above are the proof shapes, so the
   standard loops emit no checks.
6. Traversal shapes: accumulator, best-so-far with its invariant, derived
   values (mean; truncation noted).
7. 2D as convention: rightmost dimension contiguous, element number
   `row * columns + column` (ch 3's formula, mechanized); `for each` walks
   the whole grid row-major without spelling either index.
8. `clear`/`fill` as intent-revealing bulk stores; `fill` is the loop
   `for each cell in grid / cell = value` said in one word.

## Opening example
Eight named scalar variables failing to be loopable — one paragraph — then
the one-line array and the three-line `for each` sum.

## Companion program
`rewrite/examples/ch07-reading-array.lf.txt`.

## Hand trace
readings = [12, 15, 9, -3, 0, 21, 18, 7]. Sum by element: 12, 27, 36, 33,
33, 54, 72, 79. Coldest: 12, 12, 9, -3, -3, -3, -3, -3. Mean 79 / 8 = 9.
Grid rows [1,0,2,1] and [3,1,0,4] → total 12, visited row-major.

## Memory / machine consequence
`i16[8]` is sixteen contiguous bytes; `readings[index]` is base + index × 2;
`for each` lowers to a stride walk the backend owns — same bytes touched as
the indexed loop, with the index bookkeeping moved into the machinery. The
proven loops emit no bounds machinery; the listing shows it.

## Explicitly deferred
Searching (ch 8 — needs positions, so the indexed idiom carries forward),
reordering (ch 9), records as elements (ch 10–11), byte buffers (ch 12).

## Open spec questions touched
None — §6, §7 and §10.1–10.2 fully Defined.
