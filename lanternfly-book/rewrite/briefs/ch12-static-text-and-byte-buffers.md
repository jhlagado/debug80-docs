# Brief — Chapter 12: Static Text and Byte Buffers

## Single job
Teach text as the two representations 0.4 actually provides: immutable
static C strings (`cstr` — a typed view of NUL-terminated bytes) and
writable `u8` buffers with explicit occupancy. The reader leaves able to
hold and compare fixed labels, and to compose a report line byte by byte —
including rendering a signed number as digits.

## What the student already knows
Ch 1–11: the full data machinery; ch 11's partial-fill pattern (the buffer
is that pattern with bytes for elements).

## Data representation introduced
Character literals as byte values ('A', '\n', '\0' — exact untyped
integers). `cstr`: non-null read-only view, no hidden length, appended NUL,
address classes. Writable text: `line as u8[lineCapacity]` +
`lineLength as u8` — deliberately NOT a cstr; no silent conversion exists
(§3.2), and the two representations answer different questions.

## Algorithm introduced
Buffer building: guarded append; number rendering by two divisor loops
(find the leading power of ten, then emit digits high to low — ch 6's
digit-counting loop, matured); signed rendering via sign test + `abs`.

## Ordered themes
1. Text is bytes wearing an agreement (ASCII); a character literal is a
   byte value with a readable spelling.
2. `cstr` for fixed words: literals, `length` (folds for literals, scans
   at runtime), content comparison via all six operators (bytes, unsigned,
   left to right — "FEB" < "JAN" and why).
3. What `cstr` refuses: no mutation, no indexing, no integer conversion —
   the view is for holding, passing, measuring and comparing. The refusal
   is honest: byte access to a label's content is a service or
   future-edition affair (gate Q4a), and the book says so plainly.
4. Writable text is ch 11's occupancy pattern over bytes: capacity in the
   type, length beside it, append guarded, overflow reported not faulted.
5. Digit rendering: divisor loops traced (12 → '1','2'; 0 → '0'); the
   `u8('0' + digit)` conversion — arithmetic on the ASCII agreement.
6. Signed rendering: test, '-', then `abs` into the unsigned path — ch 3's
   abs closing its arc.
7. The terminator as contract, not magic: a service expecting terminated
   bytes gets `'\0'` appended explicitly; length-carrying and
   NUL-terminated conventions compared in one paragraph.

## Opening example
"JAN" drawn as four bytes (74 65 78 0) — the appended terminator visible
before any code.

## Companion program
`rewrite/examples/ch12-report-line.lf.txt`.

## Hand trace
Compose "DAY 12: -3": appends D(68) A(65) Y(89) sp(32) then digits of 12 —
divisor loop: 12≥10 → divisor 10; emit 12/10='1'(49), 12 mod 10 → 2='2'(50)
— then ':'(58) sp(32) '-'(45) digits of abs(-3)='3'(51). Final: lineLength
10, bytes as listed. `length(title)` folds to 10; "FEB" < "JAN" → true
(70 < 74 at byte 0).

## Memory / machine consequence
The literal's bytes live once in static storage (poolable); the `cstr`
value is just its address-class representation — two bytes near on Z80.
The buffer is sixteen bytes you own and index; the label is bytes you may
only look at through the view's four verbs.

## Explicitly deferred
Printing (the composed line meets a service in ch 15/16 — here final
storage is the proof); bounded writable views and string procedures
(Deferred; completeness review — gate Q4); non-ASCII text (out of the
first edition's character set).

## Open spec questions touched
Q4 (writable-text follow-up) plus new finding Q4a: no source-level byte
access to `cstr` content (no indexing through the view), so copying a
label into a buffer requires a service or a future bounded view. Routed to
the project via the gate; the chapter teaches around it honestly.
