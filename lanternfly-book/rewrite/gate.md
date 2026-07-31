# Language-design gate — Lanternfly book rewrite

Working document for the Wirth-model rewrite. NOT for commit; lives untracked
under `lanternfly-book/rewrite/`. Classifications are against the working
specification, design draft 0.4 **as rewritten at commit 3b31fe4 ("Rewrite
Lanternfly as a structured BASIC"), reread in full 2026-07-31**, with the
conformance contract and the decisions chapter
(`design-book/10-stages-and-decisions.md`). Categories: **Defined** /
**Provisional** / **Incomplete** (route to the project) / **Deferred** —
plus the decisions chapter's stronger word for pointers: **Excluded by
philosophy**, which the book must teach as doctrine, not as a missing
feature.

## Ordinal domains update (faee26b, read 2026-07-31)

The spec adds Pascal-style ordinal types as a fundamental:

- **Three ordinal kinds**: fixed-width integers; nominal `enum Name as u8 …
  end` (explicit representation, members unqualified in the value scope,
  ordinals from zero, no arithmetic/bitwise, conversion to representation
  explicit, integer→enum checked with `F-RANGE`); nominal
  `range Name as Host = lo to|until hi` subranges (widen silently to host;
  assignment/argument/return INTO a subrange is domain-checked, `F-RANGE`).
- **Array index domains** (§6 retitled): every dimension declares an ordinal
  domain; `T[8]` is shorthand for `T[0 until 8]`; explicit bounds
  (`u8[10 to 20]`, `Tile[1 to rows, 1 to cols]`) and enum/subrange
  dimensions (`u8[Colour]`, `Colour[ScreenColumn]`). Domain is part of the
  type for compatibility. **Zero-based is now only the count-shorthand
  default — the published book's "Lanternfly arrays are zero-based" is
  false as stated.** Index must belong to the dimension's root ordinal
  family; a check is elided when the index's TYPE domain is contained —
  bounds checking via types.
- **`lower`/`upper`** join the layout queries (typed results for named
  enum/subrange dimensions); `for row = lower(board, 0) to upper(board, 0)`
  is the declared-domain traversal.
- **`select`** takes any ordinal; case ranges `to`/`until` are now REAL
  (Q3 resolved — no longer Provisional); enum select without `else` is
  exhaustive when cases cover every member.
- **`for`** controls may be enum/enum-subrange, advancing by ordinal.
- **The const-integer state-code idiom is superseded** for states,
  directions and selectors: enums are the type-checked replacement, and
  chapter examples (status codes, payment methods, stations, directions)
  should migrate. Briefs/examples ch02, ch04, ch05, ch07 (grids), ch11,
  ch13 and the published book1 chapters 2, 4, 5, 6, 8 are affected;
  published-book sweep done 2026-07-31, briefs/examples migration pending.
- New diagnostics: `E-TYPE-005`, extended `E-PATH-001`/`E-CONTROL-001`,
  fault `F-RANGE`. New words: `enum`, `range`, `lower`, `upper`.

## Headline language changes absorbed (vs the pre-3b31fe4 draft)

- **No references, ever**: no `ref` type or operator, no `value(...)`, no
  reference variables, results or arrays. Identity = declared paths,
  multidimensional indices, integer selectors into fixed pools. Aggregate
  parameters and local `alias` declarations are temporary, non-escaping
  names; their backend carriers have no source syntax. Not deferred —
  excluded (decisions ch., "Deferred exploration").
- **Loop vocabulary**: inclusive `for ... to`, exclusive `for ... until`
  (canonical for zero-based traversal; the boundary is independently typed,
  so `for index = 0 until count(bytes)` is legal with a `u8` control and
  boundary 256), `for each ... in` (row-major, element binding denotes the
  element, write-through, collection path evaluated once), `while`,
  `while true` as the indefinite form. `loop` removed. New fault
  `F-LOOP-RANGE` when a continuing value cannot fit the control type.
- **`alias name as Type = path`** replaces the old `ref` alias spelling and
  is now a settled part of the grammar (no Provisional marker).
- **Aggregate parameter storage class before the name**:
  `export sub moveActor(near actor as Actor, ...)`; element class stays in
  the type (`far labels as near cstring[8]`). `E-ALIAS-001/002` govern.
- **Hosted early exit is bare `return`** (`exit body` removed); fixture 11
  is now "Hosted return".
- **Routine names are not values** (§11.6): no address-of, no indirect
  calls; `select` is the dispatch story.
- **Arrays contain scalars or records** (§6); multidimensional arrays and
  record fields cover nesting.
- **`cstring` conversions** spelled `near cstring(...)` / `far cstring(...)` /
  `cstring(...)`; `F-ADDRESS` now belongs to checked far-to-near `cstring`
  conversion.

## Per-chapter classification

### Ch 1 — A Program Changes Stored Data
Unchanged by the rewrite: `var`/`const`, assignment
(destination-path-first, §8.7), `sub main()` entry via build manifest,
termination service — **Defined** (§4, §8, §12.6). Manifest format:
**Incomplete** → Q1.

### Ch 2 — Values and Representations
Unchanged: types, literals, exact-literal rules, conversions, `boolean`
(no integer conversions — Deferred), `const` explicit type — **Defined**.

### Ch 3 — Expressions and Assignment
Unchanged: result table, one-sided widening, no third common type,
wrap/folding agreement, precedence (comparisons before `not`; `^`
right-assoc), round-trip exemption, evaluation order — **Defined**.

### Ch 4 — Subroutines and Local State
Unchanged: `sub`, scalar params/results/locals, all-paths-return,
calling convention, recursion as profile capability — **Defined** (§11).
Aggregate returns **Deferred**. Local declaration placement is a bounded
open question (start-of-block vs current start-of-routine) — the book
teaches the current rule and does not speculate.

### Ch 5 — Decisions and Invariants
Unchanged: `if`/`else if`, `select` (integer selection, no fall-through,
overlap rejection) — **Defined**. `case` ranges **Provisional** (omit,
Q3). Named scalar sets (enums) are an open design; the book's
constants-as-states idiom is the current answer and is taught as such.

### Ch 6 — Loops and Termination  **(revised)**
- `for ... to` (inclusive), `for ... until` (exclusive), compile-time
  nonzero `step`, preheader order (start, then boundary, then store),
  no-write control rule (`E-CONTROL-002/003`), post-loop value,
  `F-LOOP-RANGE`: **Defined** (§10.1).
- `while`, `while true`, `exit`, `continue` (loop-only): **Defined**
  (§10.3–10.4). `repeat`/`until`-loop and labelled exits: **Deferred**.
- `for each` belongs thematically to ch 7 (needs arrays); ch 6 names it.

### Ch 7 — Fixed Arrays and Traversal  **(revised)**
- Arrays, zero-based, row-major, bounds (`F-BOUNDS`), index arity,
  `count`/`size`, `clear`/`fill`: **Defined** (§6–8).
- `for each ... in` as the primary traversal (element binding write-through,
  path evaluated once, constant arrays give read-only bindings, volatile
  rejected, `E-CONTROL-005`): **Defined** (§10.2).
- `for index = 0 until count(a)` as the canonical indexed form: **Defined**.

### Ch 8 — Searching Tables
Unchanged in design: `while`-based plain search (short-circuit guard
proves bounds) vs sentinel search (unprovable index keeps `F-BOUNDS`
checks) — **Defined**. `for each` cannot early-deliver an index, so
searches that must report position stay indexed — a teachable contrast.

### Ch 9 — Sorting and Rearranging Data  **(loop idiom revised)**
Outer pass loop becomes `for pass = 1 until count(readings)`; inner
shifting `while` unchanged — **Defined**. Bounded aggregate views are the
project's open design for *reusable* sorts (decisions ch. names
insertion sort as a decision fixture); this chapter sorts its own table
in place and names reusability as deferred → Q5.

### Ch 10 — Records and Data Models
Unchanged: exact layout, initializers, `size`/`offset`, record equality
**Deferred** (field-wise comparison as design) — **Defined**.

### Ch 11 — Tables of Records  **(loop idiom revised)**
Partial-fill pattern loops become `until logCount`. `for each` visits
every element of the fixed array — capacity, not occupancy — so the
partially filled table *requires* the indexed form: a load-bearing
teaching contrast, now in the brief. Aggregate parameters (unqualified
private form; class-before-name for exported) — **Defined** (§11.3).

### Ch 12 — Static Text and Byte Buffers
Unchanged: character literals, `cstring` semantics, buffers as `u8` arrays,
no silent conversion — **Defined**. Bounded writable views: open (Q4).
No byte access through `cstring` (Q4a) — confirmed still true in the
rewrite; §3.2 unchanged on indexing.

### Ch 13 — Storage Identity: Paths, Selectors and Aliases  **(redesigned)**
Replaces the dead "References and Storage Identity" plan. Teaches the
language's doctrine as a positive model:
- paths and multidimensional indices as persistent identity (§7.1);
- integer selectors into fixed pools — store the index, not an address;
  `select` for irregular fixed choices; backend address tables are
  lowering, not semantics: **Defined**;
- local `alias` (evaluated once, non-rebindable, aggregate-only,
  `E-ALIAS-001`, `E-LOCAL-003`): **Defined**;
- aggregate parameters with `near`/`far` before the name; independent
  element classes (`far labels as near cstring[8]`): **Defined**;
- opaque `near/far address`: no derivation to or from storage paths —
  **Defined**;
- pointers/references/address-of/dereference/function values: **Excluded
  by philosophy** — taught as the design argument, with the decisions
  chapter's reasoning (what pointer tables become: multidim arrays and
  selectors).

### Ch 14 — Modules and Interfaces
Unchanged: import/export/private, recursive exposure check, cycles
rejected, whole-program build, entry rules — **Defined**. Hosted bodies:
bare `return` to host epilogue (`E-RETURN-002` = value return rejected).

### Ch 15 — Machine Services and Assembly
Unchanged: `extern sub` bindings, native contracts, `W-NATIVE-001`,
volatile + `at` placement, `asm` barriers (`W-ASM-001`), fault services,
itemized helpers, artifacts — **Defined**. Effect-contract narrowing
syntax: **Incomplete** (spec §16).

### Ch 16 — A Complete Lanternfly Program
Everything Defined except Q1 (manifest format) and Q2 (standard platform
service names).

## Fixes the rewrite must make to current published-book claims (F-list)

- **F1**: destination-path-first assignment evaluation (§8.7) — the
  published book says right side first.
- **F2** *(updated)*: the published book teaches `ref`-based references,
  `value(...)`, reference variables and arrays of references (its ch 8) —
  all removed from the language. Its loops chapter teaches bare `loop` —
  removed. Entire chapters of the published book now describe a language
  that no longer exists; the rewrite supersedes rather than patches.
- **F3**: coverage gaps (entry/manifest, termination, volatile, `at`,
  text, post-loop values, `until`, `for each`) — unchanged list, new
  homes.

## Questions for the Lanternfly project (Q-list)

- **Q1**: concrete build-manifest format (ch 1/14/16 need "how to build").
- **Q2**: standard platform-service names for text/number output (align
  book + conformance fixture 10).
- **Q3**: RESOLVED by faee26b — `case` ranges (`to`/`until`) are now part
  of the language; the books may teach them.
- **Q4**: bounded writable-text views / writable string procedures —
  open; ch 12 hand-rolls composition meanwhile. Related fact
  (2026-07-31): AZM emits three string conventions — `.cstr`, `.pstr`
  and `.istr` — so counted and high-bit static data are already
  substrate-expressible via byte arrays or module asm; a typed
  `pstring`/`istring` view is fixture-gated on a target profile whose
  services actually consume those conventions, and the `cstring` name
  deliberately leaves that family open.
- **Q4a**: no source-level byte access to `cstring` content (no indexing
  through the view) — copying a label into a `u8` buffer is
  inexpressible without a native service or bounded views. Confirmed
  against the 3b31fe4 spec. Needs a project ruling for mixed
  label+number report lines.
- **Q5** *(new)*: bounded aggregate views are the decisions chapter's own
  open question, with insertion sort named as a decision fixture — the
  book's ch 9 sorts in place and should feed this design discussion
  rather than anticipate it.
- **Q6** (found writing ch 16, 2026-07-31): §13.2 makes an incomplete
  native effect contract count as "a write to any visible counted-loop
  control variable", and there is no source syntax yet for narrowing a
  contract — so, read literally, *any* extern call inside a `for` loop is
  `E-CONTROL-003` unless the target profile supplies the effect summary.
  Is a routine-local control variable ever "visible" to a native
  boundary? If locals are never visible, the common print-loop shape is
  always legal and the spec could say so; if they can be, every service
  loop in the book depends on profile-supplied contracts, which deserves
  a sentence in §13.2. Either answer is fine for the book; it needs the
  project to pick one.
- Spec §16's remaining open list acknowledged (bare `end`, case
  insensitivity, `at` growth, effect narrowing, callbacks, read-only
  aggregate params, ranges, repeat/until evidence, module aliases,
  float32).

## Strings update (spec revision of 2026-07-31, read same day)

Three surface changes landed after the ordinal addendum; every brief,
example and draft written before this date predates them.

- **Counted strings ratified as the sole text type.** `string[N]`
  (capacity 1–65,534 in the type; one-byte length through 254, two-byte
  beyond; maintained NUL terminator; sealed representation) is now
  specification §3.2. Operations: checked assignment and `append`
  (F-RANGE before any destination write), `clear`, all six content
  comparisons, header-read `length`. Zero storage is the valid empty
  value. Strings follow the aggregate rules: module `var` or `const`
  storage, alias/parameter access in routines, exact-capacity parameter
  matching, no by-value return, `string[24][8]` element arrays.
- **`cstring` removed.** The read-only view type is gone from the
  language; the terminator makes the payload valid C text for native
  contracts, so one type carries both conventions. `F-ADDRESS` fell with
  it. Q4's `pstring`/`istring` family note stands, but the read-only
  half of Q4/Q4a now folds into the read-only-parameter open question:
  until read-only string parameters exist, literal or constant text
  cannot reach a routine (spec §16).
- **Record fields are bare.** `field-decl ::= value-name "as" type-expr`
  — no `var` inside `record`. All rewrite examples were mechanically
  updated on 2026-07-31; prose drafts that describe field syntax were
  not audited beyond ch 1.

Chapter 12 (Static Text and Byte Buffers) is the most affected: its
brief assumes `cstring` labels plus `u8` buffers, and should be
re-planned around `string[N]` as the working text type. Ch 2's value
survey and ch 16's report lines also touch text.

## Declaration-order update (spec commits 29bc3f3 + .lafy revision, read 2026-08-01)

- **Strict declaration-before-use.** No forward references of any kind: a
  type annotation, initializer, domain, capacity or routine body may use
  only imported names and earlier declarations. A routine's own name is
  visible from its header, so direct self-recursion is legal source;
  mutual recursion is unwritable. Record self/mutual containment is now a
  use-before-declaration error rather than a rejected cycle. Imports form
  a contiguous prefix; exports are visible from the point of import.
- **Placement model.** `at` is the only placement clause; target profiles
  declare `memoryRegions` and `placementDefaults`, builds may override; a
  deterministic placement plan is validated against the assembled output
  (`E-PLACE-001/002`). Book1 does not teach storage `at`, so only the
  rewrite's ch 15 brief is affected.
- **Source extension settled: `.lafy`**, exact lowercase, part of every
  import path (`E-MODULE-001` otherwise). The §16 extension question is
  closed. All rewrite examples using `.lf` need the rename.

Book1 updated 2026-08-01: ch 1 teaches the top-to-bottom rule beside its
first module and renames the pipeline source file; ch 7 derives record
acyclicity from field-type completeness; ch 9 gains the calling-order
rule and reframes recursion; ch 10 moves to `.lafy`, the import prefix
and point-of-import visibility. Listings verified declaration-ordered.

## Conformance alignment

Fixture names to echo: Counter (ch 1), Rushlight numeric case (ch 3's
`abs` line), Static text (ch 12), Hosted return (ch 14 mention). New
diagnostics the book can now cite: `E-ALIAS-001/002`, `E-CONTROL-005`,
`F-LOOP-RANGE`. The `until`-to-exact-boundary-256 vector (conformance §6)
is exactly ch 7's canonical traversal teaching point.
