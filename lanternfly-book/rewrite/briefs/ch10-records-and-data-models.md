# Brief — Chapter 10: Records and Data Models

## Single job
Teach modelling: a record is a designed answer to "what must the program
remember about this thing?", with field types following from the facts
represented — and an exact layout you can derive by eye. Decision from the
finished examples: records (ch 10) and tables of records (ch 11) stay
separate; modelling and database algorithms are each a full chapter.

## Prior knowledge
Ch 1–9: scalars and their design (ch 2), arrays and algorithms over them.
Everything so far described *quantities*; this chapter models a *thing*.

## Data representation introduced
```
record Reading
    var day as u8          // 1..31
    var month as u8        // 1..12
    var temperature as i16 // whole degrees, negative welcome
    var validated as boolean
end
```
Five bytes, offsets 0/1/2/4 — every field type argued from the fact it
holds (the plan's requirement made visible). Blueprint vs building; nominal
typing; `size(type Reading)`/`offset(...)` as derivable facts.

## Algorithm introduced
Light by design (ch 11 carries the algorithms): whole-record copy as
snapshot, field-by-field date comparison — written out because record
equality is Deferred (§8.2), taught as a modelling point: *which* fields
mean "same" is a design decision equality operators would hide.

## Ordered themes
1. Two loose variables per fact don't scale and can't travel together; the
   record gathers fields under one name and one type.
2. Modelling discipline: each field earns its place and its type; what is
   left out (units? station id?) is part of the model.
3. Layout is exact: declaration order, no padding, derivable offsets;
   `size`/`offset` queries confirm by construction (contrast C's padding).
4. Declaration vs storage: the blueprint costs nothing; each `var` building
   costs exactly `size(type Reading)`.
5. Initializers name every field exactly once (written order evaluates,
   declared order stores); the record/callable name rule keeps
   `Reading(...)` unambiguous.
6. Aggregate copy: one statement, snapshot semantics; `previous = current`
   as the model's first payoff.
7. Field-wise equality: `sameDate` compares day and month and deliberately
   ignores temperature — equality as design, not operator.
8. The closing clunk, on purpose: comparing two module records via scalar
   parameters is ugly; the chapter ends naming the problem ch 11's
   aggregate parameters solve.

## Opening example
The four facts of one measurement listed in prose, then the record that
holds them.

## Companion program
`rewrite/examples/ch10-reading-record.lf.txt`.

## Hand trace
`current = Reading(day = 12, month = 1, temperature = -3, validated =
false)` laid out byte by byte: 12, 1, FD FF (two's complement -3,
little-endian on Z80 noted as target detail), 0. `previous = current`
copies five bytes. Offsets: day 0, month 1, temperature 2, validated 4;
`size(type Reading)` = 5.

## Memory / machine consequence
`monthOffset` etc. exist at compile time only — field names are free; a
field access is base + constant offset, no lookup. The five-byte copy is a
short inline move, visible in the listing.

## Explicitly deferred
Arrays of records and aggregate parameters (ch 11); references to records
(ch 13); nested records (shown once here, exercised in ch 11's model only
if the example earns it).

## Open spec questions touched
None. Record equality Deferred (§8.2) is taught as design, not gap.
