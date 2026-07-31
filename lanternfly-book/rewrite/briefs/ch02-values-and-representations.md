# Brief — Chapter 2: Values and Representations

## Single job
Make representation a design act: every stored fact has a width and a sign,
chosen by the programmer and enforced by the compiler. The reader leaves able
to derive every range in the type table from binary counting and to predict
the result of any width or signedness conversion.

## Prior knowledge
Ch 1: stored data, `var`/`const`, assignment, `main`, straight-line
execution, final storage as the answer.

## Data representation introduced
The full scalar family: six integer types, `boolean`. Binary and hexadecimal
literal spellings. Two's complement as the agreement that gives the top bit
a negative place value.

## Algorithm introduced
None beyond assignment — deliberately. The chapter's "operations" are
conversions: implicit widening, explicit narrowing, same-width signedness
reinterpretation.

## Ordered themes
1. Counts outgrow bytes; every fact has a size and sign whether stated or not.
2. Binary counting: place values double; eight columns reach 255; each new
   bit doubles the reach. Ranges derived, not memorised.
3. The six types and the naming scheme; `boolean` as one byte, canonical 0/1,
   no integer conversions (`boolean(...)` deferred).
4. Two's complement: the same bits, a different agreement; -1 and 255 share
   a pattern.
5. One value, three spellings: `42`, `$2a`, `%00101010`; literals are exact
   values that adopt a type from context; an oversized literal in a typed
   context is a compile error, not a warning (spec §3.1).
6. `const` requires its explicit type; the type fences the value
   (`E-CONST-004`, range check).
7. Conversion principle: value-preserving widening is silent (zero-extend vs
   sign-extend); information-losing conversion is written (`u8(300)` = 44,
   low-bit rule); same-width signedness conversion preserves bits
   (`u8(i8 -1)` = 255).
8. The cost of width: bytes on the target, instructions per operation —
   choosing a representation is choosing a price.

## Opening example
The `-4` temperature reading that no unsigned type can hold.

## Companion program
`rewrite/examples/ch02-representations.lf.txt` — a sensor-calibration record
sheet storing one measured value under different representations.

## Hand trace
`exact` = 300 (i16). `clipped = u8(exact)` → 300 is `%100101100`; low eight
bits `%00101100` = 44. `widened as i32 = exact` → sign-extend, still 300.
`negativeOne` (i8) = -1 = `%11111111`; `sameBits = u8(negativeOne)` → 255.
Final storage: 44, 300, 255 — every value explained by one bits diagram.

## Memory / machine consequence
`i32` occupies four bytes and its arithmetic runs byte-by-byte with carries
on a Z80; `u8` occupies one. The table of types is a price list.

## Explicitly deferred
Expressions and the operator width table (ch 3); character literals and text
(ch 12); `at` placement and volatile (ch 15).

## Open spec questions touched
None — every fact here is Defined (gate ch 2 entry).
