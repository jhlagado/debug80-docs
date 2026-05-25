# Book 4 Editorial Rewrite Brief

This document consolidates the author's feedback on AZM Book 4 into a rewrite brief for a future writing agent. It is deliberately severe. The current book has useful technical material, but it does not yet work as a teaching manual. It repeatedly circles the same concepts, introduces mechanisms before the reader has the required vocabulary, over-explains secondary features and uses generated prose habits that waste the reader's attention.

The rewrite must produce a shorter, sharper and more progressive book. "Progressive" means that facts arrive in the order the reader needs them. Each paragraph should add a new piece of understanding, prepare the next idea or ground an earlier idea in code. If a paragraph does none of those things, remove it.

## Core Verdict

Book 4 is currently too long for the amount of knowledge it delivers. The problem is not that the manual contains too much content. The problem is that too much of the content is in the wrong order, repeated in several places or padded with prose that sounds like a generated explanation rather than a human technical manual.

The most serious structural failures are:

- The book does not establish a clean progression from source syntax to data layout to structured layout to code organisation.
- Foundational directives such as `.db`, `.dw`, `.ds` and `.org` appear in examples before they are properly introduced.
- Labels, constants, `.equ`, literals, `$`, naming conventions and aliases are revisited too often.
- Layout types, `sizeof`, `offset`, enums and casts are used or previewed before the reader has the required concepts.
- The data-layout and type-layout material appears too late, even though it is central to AZM's value.
- Register-care is explained abstractly and mechanically instead of through a concrete register-collision bug.
- The diagnostics and aliases material is far longer than its teaching value justifies.
- Chapter 9, the porting chapter, does not justify its existence and should be removed.
- `.lst` listing output is deprecated as a documentation topic and should be removed from the book.

The rewrite should be ruthless. Do not try to polish the current book paragraph by paragraph. Use the existing material as raw material, then rebuild the sequence around the reader's learning path.

## Writing Rules For The Rewrite

Apply these rules across the whole book.

### Every Sentence Must Teach

A sentence earns its place by adding knowledge. A sentence that persuades, reassures, decorates, balances vaguely or states the obvious should be cut.

Reject sentences like:

- "That matters more than it sounds."
- "The boundary is clear."
- "Work through this chapter in order the first time."
- "The arithmetic is noise."

These sentences are rhetorical gestures. Replace them with the mechanism, the rule or nothing.

### No Negative Framing

Do not define AZM, a chapter or a feature by saying what it is not. State what exists, what it does and how the reader uses it. A negative is acceptable only when it is part of a concrete operational contrast that teaches the positive rule in the same passage.

The manual must not carry traces of earlier designs by saying that removed features are absent. If the reader does not need a discarded concept, omit it completely.

### No Persuasion Or Advertising

Assume the reader is here to learn and already believes the material is worth reading. Do not sell AZM to them. Do not answer imagined doubts. Do not use product rhetoric.

Words such as "powerful", "elegant", "sophisticated" and "seamless" are banned unless immediately proven by code. In practice, avoid them.

### No Orthography Language

Do not use "spell", "spelling", "spelt" or "spelled" to describe assembler syntax. Use "form", "syntax", "token", "directive form" or "accepted form".

### No Oxford Comma

The author's house style omits the serial comma. Use "A, B and C", not "A, B, and C".

### Use Assemble-Time Terminology

Prefer "assemble time" or "assembler-time" over "compile time". AZM is an assembler. Use "compile" only when quoting or deliberately contrasting with compilers.

### Prefer Omission Over Forward Reference

When an early chapter touches a feature taught later, first ask whether the mention can be deleted. A forward reference is acceptable only when it helps the current explanation. Do not make the reader carry partial concepts such as `sizeof`, `offset`, casts or enums before they need them.

### Use Complete Human Prose

Avoid fragmentary procedural prose and note-card sentences. Generated prose often sounds like this:

> Review generated contracts after first run. Generated contracts are inferred. Verify them before relying on them in production source.

Rewrite as human instruction:

> After the first run, read the generated contract for each routine. AZM inferred those contracts from the instruction stream, so treat them as a draft until you have checked that they match the routine's intended interface.

## Required Structural Rewrite

The current chapter order should be reconsidered. The book is too code-first and too slow to reach memory layout. AZM's strongest distinguishing features are structured layout, typed records, arrays, `sizeof`, `offset`, layout casts and register-care. The reader should encounter the layout system soon after the raw data directives, not after several chapters of repeated labels, constants and expression discussion.

### Proposed Main Flow

Use this as the starting shape for the rewrite:

1. **Getting Started**
   - State plainly that AZM is a modern Z80 assembler for the Debug80 toolchain.
   - Explain what an assembler does: source text becomes machine code and build metadata.
   - Show one small program.
   - Give only light orientation to labels, directives, constants and output.
   - Do not teach `.lst` output.

2. **Native Source Syntax**
   - Teach native AZM source forms only.
   - Cover line structure, comments, canonical dotted lowercase directives, labels, entry labels, case-sensitive user symbols, opcode/register case and literal basics.
   - Strip out alias and compatibility discussion. Put that later.
   - Give a short early foothold for `.db`, `.dw`, `.ds` if examples use them repeatedly.

3. **Addresses, Constants And Expressions**
   - Make this the definitive home for `.org`, labels as addresses, `$` as current address, `.equ`, expression arithmetic, numeric literals and enums as grouped constants.
   - Keep it clean of layout-system functions unless they are only named as later features.
   - Use conventional assembler arithmetic in examples.
   - Refer to Appendix B for the full operator table.

4. **Raw Data And Storage Layout**
   - Move this material earlier.
   - Teach `.db`, `.dw`, strings, string directives, little-endian word storage and `.ds`.
   - Keep includes out of this chapter.
   - Let `.ds` lead directly into structured layout.
   - Treat strings as data layout, not early syntax decoration.

5. **Structured Layout**
   - Teach `.type`, fields, arrays, `sizeof`, `offset`, typed `.ds` allocation and layout casts as the structured continuation of `.db`, `.dw` and `.ds`.
   - Start from simple records before arrays.
   - Define type vocabulary before using it.
   - Explain casts from first principles.
   - Cut union material sharply unless richer examples justify it.

6. **Register Care**
   - Rebuild around one worked register-collision example.
   - Introduce caller, callee, clobber, preserves, liveness, contracts and fixes through that example.
   - Verify claims against implementation.
   - Remove CI-pipeline framing from the teaching path.

7. **Ops And Aliases**
   - Keep ops progressive and practical.
   - Make aliases a short compatibility section, or split them into a later compatibility appendix.
   - Alias material should not appear in Chapter 2.

8. **Diagnostics And Output**
   - Cut hard.
   - Teach diagnostic shape, how to read one failing example, warnings versus errors and the output artifacts that matter.
   - Move exhaustive tables to appendices.
   - Remove listing output discussion.

9. **Delete Porting Chapter**
   - Remove Chapter 9 from the main book.
   - Salvage only genuinely useful reference details into an appendix or short compatibility note.

## Theme-Tag Audit Requirement

Before rewriting, perform a paragraph-level theme audit across Book 4. This is not optional. The current book's main failure is that the same topics recur without a controlled teaching hierarchy.

For each paragraph, tag the themes it teaches. Suggested tags:

- AZM identity
- assembler role
- line structure
- comments
- labels
- entry labels
- constants
- `.equ`
- directives
- `.org`
- `.db`
- `.dw`
- `.ds`
- numeric literals
- string literals
- `$` current address
- expression operators
- enums
- case-sensitive symbols
- opcode/register case
- naming conventions
- aliases
- compatibility
- raw layout
- structured layout
- type expressions
- `sizeof`
- `offset`
- casts
- unions
- register-care
- caller/callee
- clobbers
- diagnostics
- output artifacts
- listing output
- includes
- project organisation

For each theme, identify:

- first mention,
- first real definition,
- main teaching home,
- later references,
- repeated or unnecessary appearances.

Then enforce this rule:

- One theme gets one main explanation.
- Earlier mentions are brief footholds only.
- Later mentions use the concept without reteaching it.
- If an early mention is not needed, delete it.

This audit should expose the current circularity around labels, constants, `.equ`, literals, `$`, naming conventions, aliases, `sizeof`, `offset`, data layout and output formats.

## Chapter-Level Instructions

### Chapter 1 — Getting Started

The opening must say what AZM is. Do not let a general explanation of assemblers swallow the identity of the tool.

Required opening direction:

- AZM is a modern Z80 assembler for the Debug80 toolchain.
- An assembler turns assembly source into machine-code bytes.
- AZM also produces metadata that helps Debug80 connect source to generated code.
- AZM adds structured layout, register-care analysis and op declarations while keeping byte output explicit.

Remove persuasion. The section must not tell readers that something "matters more than it sounds". State the concrete fact.

Improve the register-care table entry. It should say that register-care detects register-use conflicts across routine calls. "Analysis and metadata" is too vague.

Repurpose the Getting Started listing example as a virtual assembly walkthrough. The current documented listing does not match the real `.lst` file. Show generated bytes and addresses as an explanatory view, not as an AZM output file.

Remove `.lst` from the list of recommended outputs.

### Chapter 2 — Source Syntax And Symbols

This chapter should teach native AZM syntax. It must stop drifting into compatibility forms.

Required cuts:

- Remove alias discussion.
- Remove undotted directive discussion.
- Remove repeated dotted-token explanations after the case section.
- Keep only canonical lowercase dotted directives in the native syntax path.
- Refer to the aliases chapter or appendix for compatibility forms.

Required additions or clarifications:

- Introduce labels and user symbols as case-sensitive.
- Separate this from opcode/register case-insensitivity.
- Explain naming conventions instead of saying "choose a casing convention".
- Show uppercase underscore constants and PascalCase or camelCase labels.
- Explain that globally unique labels need careful naming.
- Briefly explain `;!` register-care comments as machine-readable contract comments, with the full workflow deferred to Chapter 6.
- Put numeric literals before string literals.
- Avoid relying on `.db`, `.dw` or `.ds` before the reader has a foothold.

The chapter currently feels scattered. After compatibility material is removed, reorder it around the actual source line: labels, directives/instructions, operands, comments and symbol rules.

### Chapter 3 — Addresses, Constants And Expressions

This should be the definitive chapter for `.org`, address labels, `.equ`, `$` and expression arithmetic.

Required changes:

- Define `.org` as origin: the assembly address where subsequent bytes are placed.
- Consider removing or moving "assembly address versus file offset" unless it clearly helps the current topic.
- Use a start label in code-size examples: `CODE_SIZE .equ CODE_END - CODE_START`, not `$ - 0`.
- Move jump-stride verification away from the `$` section if it does not use `$`.
- Remove listing references from gap/origin discussion.
- State `.equ` redefinition directly: a name is global in the translation unit and can be defined once.
- Remove premature `sizeof(Type, field)`, `offset(Type, field)` and `.type` references.
- Use conventional arithmetic in expression examples until the layout chapter has introduced type functions.
- Remove casual claims about 32-bit expression arithmetic unless the numeric model is documented rigorously.
- Consolidate numeric-literal discussion so it is not reintroduced later.
- Keep the full operator set in Appendix B and point to it.

Enums belong near constants if they remain in the book. Treat them as grouped qualified constants, not as a large separate conceptual world. Collapse enum material into one concise section or two at most.

Do not mix `$` as a hex prefix with `$` as current address in a long combined explanation. Discuss `$FF` under numeric literals and bare `$` under address arithmetic. Apply the same separation to `%` as binary prefix and `%` as modulo operator.

### Chapter 4 — Raw Data, Storage And Strings

Move this material earlier. A Z80 assembler manual should not wait until the fourth chapter before giving a solid definition of `.db`, `.dw` and `.ds`.

Required shape:

1. `.db` writes bytes.
2. `.dw` writes 16-bit words in Z80 little-endian order.
3. String literals are byte data.
4. `.cstr`, `.pstr` and `.istr` are string storage conventions.
5. `.ds` reserves storage.
6. `.ds` naturally leads into structured layout and type expressions.

Add a short endianness subsection:

- Z80 is little-endian.
- `.dw $1234` writes `$34 $12`.
- Later uses of "little-endian" can refer back to this.

Move includes out of this chapter. Includes are project organisation, source composition or compatibility material. They interrupt the data-to-layout progression.

Move trailing `.ds` behaviour to an appendix or advanced note. It is an edge case, not core teaching material.

Clarify quote rules:

- Use single quotes for character values in examples if that becomes the style rule.
- Use double quotes for strings.
- Document current parser behaviour only after the implementation decision is clear.

For string directives:

- `.cstr` is a C-style null-terminated string.
- `.pstr` is a Pascal-style counted string with a one-byte length, maximum 255 characters.
- `.istr` should be explained as an inverted-terminator string only after its history is verified.

### Chapter 5 — Structured Layout

This chapter is central to AZM and should move earlier, directly after raw data and storage.

Reframe it as structured layout, not as an isolated feature. `.db`, `.dw`, `.ds`, `.type`, arrays, records, `sizeof`, `offset` and casts are one layout progression.

Required teaching order:

1. Raw storage becomes hard to maintain when fields are inserted or resized.
2. A record type names fields and lets AZM calculate offsets.
3. `.field` declares a named field and consumes a layout type expression.
4. Scalar layout types have sizes.
5. Array type expressions describe repeated storage.
6. `sizeof` produces a numeric size when a numeric expression needs it.
7. `offset` produces the byte offset of a field.
8. `.ds` can reserve structured storage.
9. A layout cast imposes a type on an address expression for address calculation.

Define terminology:

- Scalar type: a fixed-size value such as `byte` or `word`.
- Record type: a `.type` layout with named fields.
- Array type: repeated elements such as `byte[32]` or `Sprite[16]`.
- Composite type: a record or array built from smaller layout types.

Avoid `addr` unless the implementation keeps it and it has a strong justification. It currently appears to add cognitive load without enforcing real pointer typing.

Explain casts from first principles. Do not assume C/Pascal knowledge. A cast tells AZM to treat an address as a particular layout while calculating field offsets. It does not change runtime memory.

Start cast examples with one record:

```asm
PLAYER:
        .ds Sprite

        ld   a,(<Sprite>PLAYER.flags)
```

Only after that should examples move to arrays.

Clarify type expressions versus numeric expressions:

- `byte[32]` is a type expression.
- `.ds byte[32]` consumes it directly as storage size.
- `SIZE .equ sizeof(byte[32])` uses `sizeof` because `.equ` needs a numeric value.

Union material must be cut or improved. The current repeated byte/word examples are boring and too long. Keep one scalar overlay example, then show a richer union of record shapes if unions are kept in the main chapter. Otherwise move unions to an advanced note.

Remove clever prose. Say the rule plainly.

### Chapter 6 — Register Care

This chapter needs the most severe rewrite. It currently reads like generated internal notes: abstract, mechanical, overlong and under-grounded. It must be rebuilt from a real worked example.

Required spine:

1. Show a caller with a live register across a subroutine call.
2. Use `B` as a `djnz` loop counter.
3. Call a subroutine inside the loop.
4. The callee clobbers `B`.
5. The loop is now wrong because the caller needed `B`.
6. Register-care reports the conflict.
7. Show the contract that exposes the clobber.
8. Show repair options.

Define terms at the point they are needed:

- caller: the code that executes `call NAME`;
- callee: the subroutine named by that call;
- clobber: overwrite a register value the caller still needed;
- preserves: the register exits with the same value it had on entry.

Do not define `preserves` as push/pop. Push/pop is one possible implementation. Preservation is an observable entry/exit property.

Remove CI-pipeline framing from the main chapter. Automated checking can be a short CLI/reference note.

Verify all AZMDoc and register-care claims before rewriting. If generated `;!` blocks can be hand-reviewed or hand-written, document the actual workflow accurately. Avoid hard rules such as "never hand edit" unless the implementation requires that.

### Chapter 7 — Ops And Aliases

The ops material is better than register-care, but it is still too long. It should be sharper and more progressive.

Ops should teach:

- an op expands inline;
- operands are matched by class;
- overloads select by operand shape;
- labels inside op bodies must avoid collisions;
- recursive expansion is diagnosed;
- ops differ from subroutines because they generate instructions at the call site.

Cut repeated examples. Keep examples only when they introduce a new rule.

Aliases should be much shorter. They are compatibility mappings from legacy directive heads to canonical AZM directives. That concept does not need a long chapter section.

Alias section target:

1. Existing source may use old directive forms.
2. Aliases map those directive heads to AZM directives.
3. Built-in aliases cover common forms.
4. Project alias files cover additional forms if needed.
5. Aliases map directive heads, not whole instruction syntaxes.

Show only common forms such as `DB`, `DW`, `DS`, `EQU` and `ORG`. Refer elsewhere for the full list.

Implementation note to keep separate: alias matching may need to become case-sensitive. Do not over-document current case-insensitive behaviour if it is likely to change.

### Chapter 8 — Diagnostics And Output

Cut this chapter substantially. It currently tries to be a reference chapter and becomes tedious.

Keep:

- diagnostic format;
- how to read a diagnostic;
- one worked failing-build example;
- warnings versus errors;
- the few output artifacts users need.

Move:

- diagnostic-code tables;
- exhaustive output flag combinations;
- detailed artifact reference material;
- CLI flag tables.

Remove:

- the entire listing section;
- `.lst` references;
- `--nolist` guidance;
- any prose that treats the listing as a recommended verification tool.

Target length may be 20 to 30 percent of the current chapter. That is acceptable if the remaining material is denser and more useful.

### Chapter 9 — Porting To AZM

Delete it.

The book should teach AZM as the native language and toolchain, not devote a chapter to migration framing. Compatibility material that remains useful belongs in the alias section or appendices.

After deleting the chapter:

- remove cross-references to Chapter 9;
- move genuinely useful compatibility reference material, if any, to an appendix;
- do not preserve porting prose merely because it exists.

## Appendix Instructions

Appendices should carry reference material that interrupts the main teaching flow.

Appendix A should be the directive reference. Do not duplicate exhaustive directive lists in early chapters.

Appendix B should be the operator reference. Keep the operator table concise and clear. The bitwise OR table cell must render as `|`, not `\|`; use an HTML code entity if needed inside a Markdown table.

Appendix C should carry CLI flag reference material. Remove `.lst` and `--nolist` if listing output is being deprecated from the docs.

Appendix D should carry built-in functions such as `LSB`, `MSB`, `sizeof` and `offset`. Cross-reference Appendix B where useful because operators and functions are both expression tools.

## Implementation Notes To Keep Separate

Do not turn implementation questions into current documentation until the language decision is made.

Keep these in the coding-agent notes:

- whether `NAME: .equ value` should become an error;
- a full colon syntax audit;
- possible name-first `.enum` syntax;
- possible name-first `.type` syntax;
- named array type aliases;
- deprecating or removing `addr`;
- quote syntax rules;
- case-sensitive alias matching;
- `LSW` and `MSW` functions;
- future `.import` with `@` public entries and private plain labels;
- op overloads that match numeric values for recursive expansion.

The documentation should describe the language that exists or the language that has been explicitly decided. It should not preserve speculative design history.

## Review Criteria For The Rewritten Book

Use these checks before accepting the rewrite.

### Progression Check

For each chapter, answer:

- What does the reader know at the start?
- What new capability do they gain by the end?
- Which concepts are introduced for the first time?
- Which concepts are explained in full?
- Which concepts are merely referenced?

If a chapter cannot answer those questions clearly, it is not structured enough.

### Redundancy Check

Search for repeated treatment of:

- labels;
- `.equ`;
- constants;
- naming conventions;
- numeric literals;
- string literals;
- `$`;
- `%`;
- `.db`, `.dw` and `.ds`;
- `sizeof` and `offset`;
- aliases;
- listing output;
- CI pipelines.

Each repeated section must either add a genuinely new point or be cut.

### Assumed-Knowledge Check

Flag every example that uses:

- `.db`, `.dw`, `.ds`;
- `.org`;
- `$`;
- enum syntax;
- `.type`;
- `sizeof`;
- `offset`;
- casts;
- unions;
- register-care comments;
- alias files.

Then confirm the concept has already been introduced. If it has not, either move the introduction earlier, simplify the example or delete the mention.

### Prose Quality Check

Search for:

- "not", "no", "never", "without", "unless" and other negative framing;
- "That matters", "you might think", "it may seem" and other persuasion;
- "spell", "spelling", "spelt" and "spelled";
- "Note that", "It is worth", "This is the standard way";
- "however", "therefore", "moreover", "in addition" and similar padding;
- hard blacklist words from the course-writing rules;
- serial commas;
- fragmentary procedural sentences;
- clever phrases that hide the direct rule.

Cut aggressively.

### Technical Verification Check

Every code example must be assembled or verified against AZM where practical. The Getting Started listing mismatch shows why this matters. Do not document output formats, diagnostics, contract generation or listing behaviour from memory.

Particular verification targets:

- actual AZM output artifacts;
- actual `.lst` behaviour if any remaining mention survives;
- register-care diagnostics and generated contracts;
- `.cstr`, `.pstr`, `.istr` quote rules;
- enum syntax and qualified names;
- type expressions, `sizeof`, `offset` and layout casts;
- alias matching behaviour;
- `--case-style` semantics.

## Final Instruction To The Writing Agent

Do not produce a longer book. Produce a clearer book.

The current material must be reorganised around the reader's path through the ideas. Put each concept where it first becomes useful, teach it once, use it thereafter and remove all filler. AZM should emerge as a modern assembler because the examples demonstrate structured layout, register-care and readable source, not because the prose repeatedly claims significance.

The author is willing to cut whole chapters, move major topics and delete large sections. Treat that as permission to rebuild the book, not merely edit sentences.
