# Brief — Chapter 13: Storage Identity — Paths, Selectors and Aliases

## Single job
Teach the language's distinctive doctrine as a positive model: a program
keeps track of *which thing* by declared paths, integer indices and stored
selectors — data, not addresses. Aliases and aggregate parameters are
temporary names for existing storage, not values. The reader leaves able to
build every "pointer" idiom of classic small-machine code without pointers,
and able to say why the language refuses them.

## Prior knowledge
Ch 1–12: the full data and algorithm machinery; aggregate parameters used
practically since ch 11.

## Data representation introduced
Identity as data: a stored `u8` selector ("the current entry is index 1")
that survives, travels and compares like any value. Storage classes
(`near`/`far`) as capabilities on aggregate parameters. Opaque
`near/far address` as the boundary case: a location the program may hold
but never open.

## Algorithm introduced
None new — deliberately, like ch 6's close. The chapter re-runs ch 11's
selection and update through the identity model: select an entry, work
through an alias, dispatch among separately declared tables with `select`.

## Ordered themes
1. The question every program answers constantly: *which one?* Assembly's
   answer was an address; Lanternfly's answer is data — an index into the
   pool that owns the thing. `var selectedEntry as u8` is a persistent,
   storable, comparable identity; an address would be none of those safely.
2. Paths as identity: `log[selectedEntry].validated` — the pool plus the
   selector *is* the reference. Bounds checking guards a stale selector
   (`F-BOUNDS`); no pointer model can promise that.
3. Regular shapes: multidimensional arrays replace row-pointer tables
   (`stationGrids[station, day]` — ch 7's row-major formula as the
   "pointer arithmetic" you never write).
4. Irregular fixed choices: store a selector, `select` the named object
   (spec §7.1's own doctrine). The backend may compile it to an address
   table; source semantics stay selectors and declared storage — lowering
   is not meaning.
5. `alias name as Type = path`: a routine-local nickname — evaluated and
   checked once, non-rebindable, aggregate-only (`E-ALIAS-001`,
   `E-LOCAL-003`). When it earns its name: repeated access, or handing the
   aggregate onward.
6. Aggregate parameters revisited as the same machinery at the call
   boundary; storage class before the name (`near`/`far`), mandatory on
   exports (`E-ALIAS-002`); element class independent
   (`far labels as near cstring[8]`).
7. The carrier is not a value: no source expression names it; it cannot be
   stored, returned, compared, rebound or converted. `destination = entry`
   copies the referent; identity that must persist goes back to being an
   index.
8. Opaque addresses: hold, pass, compare same-class — never index, never
   derive. Device address spaces (VRAM) are the honest use; ch 15 crosses
   that boundary.
9. The doctrine argued, not asserted: what pointers would cost (dangling,
   aliasing analysis, unched arithmetic) against what the model already
   expresses (every corpus pointer table = multidim array or selector —
   the decisions chapter's evidence). Excluded by philosophy, and the
   philosophy is on the page.

## Opening example
Two lines side by side: `var current as u8 = 1` and the assembly
address-register idiom it replaces — identity as data vs identity as
location.

## Companion program
`rewrite/examples/ch13-station-selectors.lf.txt`.

## Hand trace
`selectedEntry = 1`; `touchSelected()` aliases `log[1]`, marks it
validated. `snapshot = entry` copies five bytes out; the selector still
identifies the table entry — copy vs identity, visible in one trace.
`stationMean(southStation)` selects `southLog`, aliases it into
`meanOfWeek`, sums by element: (4+6+8+2+0+-2+3)/7 = 21/7 = 3.

## Memory / machine consequence
A selector is one byte; the Z80 backend may hold an alias in a register
pair for the routine's duration — the address exists in lowering, priced in
the listing, absent from the language. The `select` dispatch may become a
jump or address table; the cost report shows which.

## Explicitly deferred
Bounded aggregate views (open design, gate Q5); read-only aggregate
parameters (spec §16); scalar output parameters (open).

## Open spec questions touched
Q5 acknowledged. Doctrine items are Chosen (decisions ch. items 13–14),
not open — the book presents them as settled.
