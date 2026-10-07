# Alternatives and variants analysis for Programming Basie

Private analysis of named alternatives, application invariants and payload ownership.

## Central distinction

A record combines fields that exist together. A tagged union chooses one alternative and includes only the data belonging to that choice. A language-enforced variant connects construction, tag and payload access, preventing a caller from interpreting one alternative's bytes as another type.

The teaching argument begins with a practical representation problem, compares conventional workarounds, demonstrates their invalid combinations and introduces a type that expresses precisely the allowed alternatives. Pattern matching then supplies safe access to the selected data. Exhaustiveness makes omitted alternatives visible during compilation.

## Lessons applicable now

Teach validity as a property of a representation as well as an individual operation. Two independently optional fields may permit four combinations when the application intends only two. Checking those combinations in routines can preserve application invariants, but the representation still permits invalid states. Distinguish that limitation from a memory-safety failure: a memory-safe program can still represent contradictory application state.

Use Basie's optional pool handles as a concrete, specified example of absence versus presence. Its select mechanism requires testing the optional handle before reaching the record. Explain select on an owner separately from select move, which transfers responsibility. This provides a narrow practical connection between alternatives, controlled access and ownership without pretending that Basie has general tagged unions.

Keep recoverable failures and optional absence distinct. Basie's fails and handle mechanism already carries checked obligations. Do not present it as an unchecked pair of result and error variables, or describe Result as necessary to obtain any safe error handling.

The lesson's storage argument suits a small machine: alternatives can occupy inline storage sized for the largest payload plus tag and alignment. General variants need not require allocation for their own representation. A selected payload may itself own allocated storage, so inline representation does not mean all payloads are allocation-free. Exact Basie layouts and costs require a design and measurement.

## Stretch-feature justification

General enumerations and tagged unions would add the ability to express closed sets of valid application states and enforce tag/payload consistency. Exhaustive selection could make changes to that set visible to every affected caller. Payload ownership would require rules for construction, reading, mutation, transfer, replacement and automatic release of the active alternative. These are central requirements, not syntax refinements.

An enumeration with no payload and a tagged union with payloads are separate scopes. Neither requires enum-indexed arrays, traits, dynamic dispatch, generic Result, nested pattern syntax or Rust's full match expression machinery. Assess each additional facility independently.

A useful Basie design example is a parsed command: quit carries no data, move carries a direction and take carries an item identifier. Compare the valid commands with a record containing a numeric code and every possible payload. A second example is an operation with success, ordinary absence and failure, when that distinction is required by the application.

For related alternatives, put the relationship inside one choice. The lesson's paired-address example removes mixed address-family states by representing either a pair of one family or a pair of the other. The general principle applies to any correlated fields. Use a CP/M application example rather than requiring readers to learn networking first.

## Book placement

The current book can introduce presence/absence and safe selection alongside optional allocation and expected failure. It can later explain application invariants through a complete program. General enums remain outside the product tutorial until specified and implemented. Their rationale belongs in separate language-design work, not a chapter that presents them as available Basie constructs.

If adopted, introduce simple alternatives after records and decisions, then associated data, selection and ownership consequences. Place them before a capstone whose representation benefits from them. Each addition must have an actual programming problem and a prerequisite-supported place in the progression.

## Illustration and exercise briefs

- Valid-state matrix: two independent flags produce extra combinations, contrasted with exactly the intended alternatives.
- Inline variant layout: one tag and alternative payloads sharing storage, without promising a particular ABI.
- Optional handle selection: absent versus live allocated record, with access confined to the valid branch.
- Owning alternative transition: replacing the active payload ends its responsibility before a new owned alternative is established, subject to the eventual specification.
- Prediction exercise: distinguish a valid memory access from a contradictory application state. Safety of storage does not prove the application's logic correct.

## Qualifications

The video uses deliberately simplified sketches. Object-oriented polymorphism does not inherently require heap allocation in every implementation. Rust enum layout can use optimisations rather than a literal separate tag. Exhaustiveness applies even when a match is used for effects rather than a returned value. Avoid importing broad slogans where the precise language rule is narrower.
