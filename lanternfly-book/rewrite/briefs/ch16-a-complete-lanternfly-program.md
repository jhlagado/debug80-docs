# Brief — Chapter 16: A Complete Lanternfly Program

## Single job
Assemble the book into one working, non-game program — a weather-station
report utility — and let the reader watch the two questions answered at
program scale: the data model (a record table behind a module interface),
and the algorithms over it (append, sort, aggregate, render, print). The
chapter adds nothing new on purpose; its lesson is composition.

## Prior knowledge
Everything. Each section of this chapter names the chapter it spends.

## Data representation introduced
None. The `Reading` table (ch 10–11) behind a module border (ch 14), a
report buffer (ch 12), a platform face (ch 15) — and one deliberate
addition forced by the language: `var carried as Reading` at module level,
the static scratch slot the sort needs because locals cannot own
aggregates (ch 4/13's rule, finally met as written).

## Algorithm introduced
Insertion sort over the record table — ch 9's promise cashed: the shift
becomes a five-byte aggregate copy, the travelling value lives in static
scratch, and the invariant argument transfers word for word. Otherwise:
the database quartet (ch 11) and digit rendering through services (ch
12/15).

## Ordered themes
1. The program stated in ordinary language first (the plan's example-first
   discipline shown to the reader): collect a week's readings, order them,
   report coldest, warmest and mean.
2. Module map: `model.lf` (table + invariant, private), `platform.lf`
   (services, illustrative names), root `report.lf` (composition + main).
   Each border justified in one sentence.
3. The sort over records: identical structure to ch 9, new cost column
   (five-byte copies), plus `carried` — why it is module-level, why that
   is the small-machine pattern anyway, and what the frame report shows.
4. Rendering: sign, digits, labels through services; the ch 12 buffer
   idiom vs direct service calls, chosen per line and argued.
5. The observable program: an ordered service trace plus final storage —
   the conformance lens the book has used since ch 1, now covering
   everything at once.
6. The build: manifest names root and `main` (Q1 open, stated); the
   artifacts to read afterwards (listing, helper receipt, cost report) —
   the reader is told exactly which claims of chs 1–15 they can now
   verify against which artifact.
7. Close of the book: the two questions, asked once more of the next
   program the reader will write without this book.

## Opening example
The report's intended output, as text, before any code — the program
specified by its observable trace.

## Companion program
`rewrite/examples/ch16-weather-report.lf.txt` (files marked inline:
`model.lf`, `platform.lf`, `report.lf`).

## Hand trace
Appends: (11,1,2), (12,1,-3), (13,1,5), (14,1,0), (15,1,-1) → count 5.
Sort by temperature: [-3, -1, 0, 2, 5] with pass table (4 aggregate
copies… traced per pass: pass1 1 copy, pass2 0, pass3 2, pass4 1).
Stats: coldest -3, warmest 5, mean 3/5 = 0. Service trace: title,
newline, five day/temperature lines, three stat lines — written out call
by call in the example's tail comment.

## Memory / machine consequence
The whole program's static budget itemized: 50-byte table + 1 count +
5-byte scratch + buffer + strings — a complete program the reader can
price byte by byte, which is the book's thesis held to at the finish.

## Explicitly deferred
Input services and interactive loops (a second target profile's worth of
services — named as the natural sequel); bounded views for a reusable
sort (Q5, handed to the project).

## Open spec questions touched
Q1, Q2 (stated in prose as open); Q5 (the in-place sort is the fixture
the decisions chapter asks for).
