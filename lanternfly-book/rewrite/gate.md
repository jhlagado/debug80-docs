# Language-design gate — Lanternfly book rewrite

Working document for the Wirth-model rewrite. NOT for commit; lives untracked
under `lanternfly-book/rewrite/`. Classifications are against the working
specification, design draft 0.4 (`packages/lanternfly/docs/specification.md`,
read 2026-07-30) and its conformance companion. Categories: **Defined** (spec
gives enough to teach precisely), **Provisional** (spec marks the rule as
awaiting implementation/corpus evidence), **Incomplete** (open semantic
question — route to the Lanternfly project, never settle in the book),
**Deferred** (excluded from the first implementation; the book may name it
only as future work).

## Per-chapter classification

### Ch 1 — A Program Changes Stored Data
- `var`, `const`, scalar assignment, comments: **Defined** (§4.1–4.2, §8.1, §2.4).
- Program entry: `sub main()` (no params/result), named by a build manifest;
  all static storage allocated and initializers installed before entry;
  returning from entry invokes the target termination service: **Defined**
  (§12.6). Concrete manifest format: **Incomplete** → Q1 below.
- Assignment evaluation order (destination path, then right side, then
  store): **Defined** (§8.7). Current book states this wrongly — fix F1.

### Ch 2 — Values and Representations
- Six integer types, `boolean` (one byte, canonical 0/1, no integer
  conversions — `boolean(...)` **Deferred**), literal forms (`42`, `$2a`,
  `%00101010`, `'A'`), exact-literal typing (expected-type contexts; no
  i16-fallback-then-warn; oversized literal is an error; `u8(300)` = 44),
  `const` with mandatory explicit type: **Defined** (§2.4, §3, §3.1, §4.1).
- Type inference for `const`: **Deferred** (§4.1).

### Ch 3 — Expressions and Assignment
- Operator set, result-type table, one-sided value-preserving widening (never
  a third common type), operator-order intermediates, wrapping, constant
  folding agreeing with runtime, precedence (comparisons bind before `not`;
  `^` right-associative, `-2 ^ 2 = -(2 ^ 2)`), short-circuit, conversions,
  round-trip warning exemption, expression statements + `W-EXPR-001`,
  evaluation order: **Defined** (§3.1, §8).
- Compound assignment (`+=`), chained assignment: absent (§8.1) — teach as
  a fact, not a loss.

### Ch 4 — Subroutines and Local State
- `sub`, scalar parameters (pass values), scalar results (integer, Boolean,
  address, `cstr`, typed ref), locals before statements, per-invocation
  freshness, zero-init of owned scalars, declaration-order initializers,
  left-to-right argument evaluation, calling convention & static temporaries,
  recursion as a profile capability: **Defined** (§11, §8.7).
- Aggregate return by value: **Deferred** (§11.1).
- Ordering note: early `return` and all-paths-return checking need decisions
  — teach basic form here, complete `return` story in/after ch 5.
- Aggregate parameters (writable aliases): **Defined** (§11.3) but taught in
  ch 7/13 where arrays/references exist.

### Ch 5 — Decisions and Invariants
- `if` / `else if` / `else`, `select` over integer selection, multi-value
  cases, no fall-through, duplicate/overlap rejection: **Defined** (§9).
- `case` ranges (`case 0 to 9`): **Provisional** (§9.2) — recommend the book
  omits them until the parser decision lands (Q3).
- One-line conditionals: **Deferred** (§9.1).
- Boolean/address/reference selection: **Deferred** (§9.2).

### Ch 6 — Loops and Termination
- `while`, counted `for` (preheader order: start, then limit — limit sees the
  control variable's old value — then store; inclusive limits; compile-time
  nonzero step, independently typed; no-wraparound termination; defined
  post-loop value; body cannot write the control variable, including via
  effect summaries), `loop`/`exit`/`continue`: **Defined** (§10).
- GCD example needs only `while` + `mod`: fully **Defined**.
- `repeat`/`until`, labelled/named loop exits: **Deferred** (§10.3).

### Ch 7 — Fixed Arrays and Traversal
- Declaration, zero-based indices, exact index arity, row-major layout,
  contiguity, initializer shape rules, constant-index compile checks, runtime
  bounds checks (`F-BOUNDS`) unless proven, interleaved index evaluation,
  `count`/`size`, `clear`/`fill` (statement-only, `unit`): **Defined**
  (§6, §7, §8.5).

### Ch 8 — Searching Tables
- Linear search: loops + early return or flag — **Defined**.
- Sentinel search: expressible with an ordinary spare slot in a writable
  array; no special feature needed — **Defined**.

### Ch 9 — Sorting and Rearranging Data
- Insertion/selection sort: nested loops, scalar temp, aggregate element
  copy with snapshot semantics: **Defined** (§7, §10).

### Ch 10 — Records and Data Models
- `record`, exact declaration-order layout, no padding, nested by-value
  records, containment-cycle rejection, named-field initializers (written
  order evaluates; declaration order stores), `size`/`offset`,
  record/callable name rule: **Defined** (§5, §4.5, §8.5, §2.1).
- Record equality: **Deferred** (§8.2) — fields compared explicitly; teach as
  a design point, not a gap.

### Ch 11 — Tables of Records
- Arrays of records, composed paths, aggregate copy, true stride: **Defined**.

### Ch 12 — Static Text and Byte Buffers
- Character literals (byte values, escape set), `cstr` (near/far classes,
  immutable view, no hidden length, literal gets appended NUL, 65,534-byte
  cap, content comparison via all six operators, `length` → `u16` with
  literal folding), writable text as plain `u8` arrays with explicit
  capacity, NO implicit array→`cstr` conversion: **Defined** (§2.4, §3.2).
- Bounded writable-text views and writable string procedures: **Deferred** —
  named follow-up in the language completeness review; the book must teach
  the u8-array pattern without inventing library helpers (Q4).
- Printing needs extern contracts (ch 15); fixture 10 "Static text" expects
  an external print-style call — align names (Q2).

### Ch 13 — References and Storage Identity
- Typed references (non-null, scalar), formation rules and address-class
  logic, `value(...)`, rebind vs referent write, reference equality only,
  arrays of references, checked far→near conversion (`F-ADDRESS`), opaque
  `near/far address` (assignment + same-class equality only), class
  qualifiers mandatory on stored/public references and all results:
  **Defined** (§7.1).
- Local aggregate alias `ref x as T = path`: semantics defined, **spelling
  Provisional** (§11.4, §16) — book should note the spelling may change.
- References to owned scalar locals; read-only references; null references:
  **Deferred**.
- Volatile storage: **Defined** (§4.4) with hard restrictions (no refs,
  aliases or aggregate arguments rooted in volatile) — teach in ch 15 with
  devices.

### Ch 14 — Modules and Interfaces
- `import` (once-per-compilation, private-by-default, explicit `export`),
  recursive private-type-exposure check, collision and cycle rejection,
  whole-program build pipeline, executable vs library builds, entry rules:
  **Defined** (§12).
- Module aliases, re-exports, source file extension: **Deferred/open** (§16).
- Hosted bodies (Glimmer): **Defined** (§12.6, §13.3) — a mention plus
  pointer, not a chapter.

### Ch 15 — Machine Services and Assembly
- `extern sub` with `at`/`from`/profile binding, target-address constant
  expressions, native contracts (value invariants, effect summaries,
  `W-NATIVE-001`), no native→Lanternfly callbacks, `volatile` + `at` placed
  storage (installation rules, startup-effect ordering), statement/module
  `asm` (raw mode, verbatim emission, conservative barrier, `W-ASM-001`,
  control must reach the following statement), fault services, itemized
  helpers, required artifacts: **Defined** (§4.3–4.4, §12.4, §13).
- Source syntax for narrowing an asm effect contract: **Incomplete** (§16) —
  teach the conservative barrier only.

### Ch 16 — A Complete Lanternfly Program
- Everything needed is Defined *except*: concrete build-manifest format (Q1)
  and a standard illustrative platform-service module (Q2). Number-to-text
  output needs only `/` and `mod` — no gap.

## Fixes the rewrite must make to current book claims (F-list)

- **F1**: Current ch 1 says the right-hand expression is evaluated first in
  an assignment. Spec §8.7: destination path first, then right side, then
  store. Observable with effectful index/reference expressions.
- **F2**: Current book presents the local alias form as settled; §11.4 marks
  the spelling provisional.
- **F3**: Current book is silent on: entry point/manifest, program
  termination, `volatile`, `at` placement, `length`/`cstr`/character
  literals, post-loop control-variable value, `select` integer-only
  restriction, power's right associativity, statement-per-line/parenthesised
  continuation. The new structure covers each in its proper chapter.

## Questions for the Lanternfly project (Q-list — not settled by the book)

- **Q1**: What is the concrete build-manifest format (name, file shape,
  entry declaration)? Ch 1/14/16 need to show "how to build and run" and
  currently cannot.
- **Q2**: Which platform-service names should the book and the conformance
  corpus standardize for text/number output (fixture 10 implies a
  print-style call; the old book used `printChar`/`showNumber`)? The book
  will mark its interface module illustrative until this is fixed.
- **Q3**: Will `case` ranges survive the first parser (spec §16)? Book omits
  them until decided.
- **Q4**: Bounded writable-text views / writable string procedures are
  named follow-up work in the completeness review; ch 12's buffer examples
  will hand-roll a terminator-writing loop — confirm that is the intended
  teaching story for edition 0.4.
- Spec §16's own open list (bare `end`, alias spelling, case-insensitive
  resolution, `at` vs section placement, effect-contract syntax, callbacks,
  volatile references, read-only references, ranges, module aliases,
  `float32`) is acknowledged; the book treats each as its classification
  above dictates.

## Conformance alignment

Companion programs should carry fixture-style names and note which mandatory
vectors they exercise (conformance §5–6): the ch 1 invoice program is close
to fixture 1 "Counter"; ch 12's program should align with fixture 10 "Static
text"; the ch 16 capstone should compose services in the fixture-8/9 style.
Diagnostics quoted in prose use the contract IDs (`W-CONVERT-001`,
`F-BOUNDS`, `E-CONTROL-003`, …) so the book and toolchain speak one language.
