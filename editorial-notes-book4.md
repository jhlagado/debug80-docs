# Book 4 Editorial Notes

Working notes only. Do not apply these as edits until we decide the rewrite plan.

Consolidated rewrite brief:

- See `book4-editorial-rewrite-brief.md` for the structured critique and instructions to the writing agent.
- This file remains the chronological collection of author feedback.
- The rewrite brief is the document to use when planning, executing and reviewing a major Book 4 rewrite.
- The chronological order of this file is important. It captures the author's first impressions while reading the book in order, including the rising frustration when the book repeats itself or fails to progress.
- Use this file as evidence during review: repeated complaints in these notes usually indicate repeated structural faults in the book, not redundant feedback.
- During review of any rewrite, read this file in order and ask whether the rewritten book would still produce the same reaction at the same stage. If yes, the rewrite has not solved the structural problem.
- When there is pushback against a note, clarify the author's intent or investigate the technical basis. Do not weaken the critique merely because a paragraph can be defended in isolation.

## Document-Wide Style and Terminology

### Use "assemble time" consistently

Current concern:

The manual may alternate between "compile time" and "assemble time". Since AZM is an assembler, the terminology should be consistent.

Suggested direction:

- Prefer "assemble time" throughout the manual.
- Use "assembler-time" as an adjective if needed.
- Avoid "compile time" unless quoting or deliberately contrasting with a compiler.
- Sweep Book 4 for `compile-time`, `compile time`, `runtime`, `run time`, `assemble-time` and `assemble time` so terminology is consistent.

### Deprecate `addr` / `ADDR`

Current decision:

`addr` / `ADDR` should be deprecated. It appears to have remained because it had not been officially deprecated, not because it should remain part of the main language path.

This should be treated as an active deprecation direction, not merely a possible cleanup. The normal documentation path should move to `word` for 16-bit storage and avoid introducing `addr` as a separate concept.

Editorial direction:

- Remove `addr` / `ADDR` from main-flow Book 4 prose and examples.
- Do not present `addr` / `ADDR` as current recommended syntax.
- If it must be mentioned, put it in deprecated compatibility/reference material only.
- Treat any ordinary use of `addr` / `ADDR` in the rewritten book as a review finding.

Implementation note:

The implementation notes now include a matching `addr` / `ADDR` deprecation item.

## Chapter 1 — Getting Started

### "What is AZM?"

The section should restate what AZM actually is before explaining assembler behaviour.

Suggested direction:

- Open by saying that AZM is a modern Z80 assembler for the Debug80 toolchain.
- Then explain what an assembler does: it turns source text into machine code and related build artifacts.
- After that, explain AZM's particular character: it adds layout types, register-care analysis, op declarations and Debug80 metadata while keeping the emitted bytes visible.

Current concern:

The section is trying to explain what an assembler does, which is useful, but the identity of AZM gets lost. The reader should first be told plainly that AZM is an assembler, then be taken into the explanation of what assemblers do and what AZM adds.

### Persuasion sentence

Sentence flagged:

> That matters more than it sounds.

Problem:

This assumes doubt in the reader's mind and tries to persuade them that the point matters. The manual should assume the reader is here in good faith to learn. It should teach, not reassure, sell or advertise.

Suggested direction:

- Remove the sentence completely unless it can be replaced by a concrete fact.
- Apply the test: does this sentence add to the reader's knowledge? If it only adds emphasis, cut it.
- In this case, the next sentence already carries the useful content about register management and assemble-time computation, so the rhetorical lead-in is probably unnecessary.

### Register-care summary in the "At a glance" table

Current concern:

The table entry for register-care is too thin. It says "Analysis and metadata; source repair only with `--fix`", but that describes mechanism and output rather than why the feature exists.

What needs to come across:

- Register-care is an innovative AZM feature.
- It is designed to catch conflicts in register use.
- Register collisions are a common class of assembly-language bugs.
- The brief table definition should still be compact, but it needs to communicate the purpose, not just the artifact behaviour.

Possible direction:

Use wording along the lines of:

> Register-care | Checks routine calls for register-use conflicts; optional source repair with `--fix`

or:

> Register-care | Detects register collisions across routine calls; optional source repair with `--fix`

The important point is that "register-care" must be defined as a bug-catching feature for a common assembly problem, not merely as "analysis and metadata".

### Example label case convention

Current concern:

Examples are inconsistent about label style. Some older examples use all-uppercase with underscores for labels that are addresses, routines or branch targets. That style is acceptable for constants, but it does not show idiomatic AZM if AZM is meant to use modern case-sensitive symbol names.

Housekeeping direction:

- Sweep examples for label case consistency.
- Keep constants in uppercase with underscores where appropriate: `MAX_SPRITES`, `LCD_DATA`, `SCREEN_WIDTH`.
- Choose one convention for address labels, routine labels and branch labels.
- Likely candidates are PascalCase (`DrawSprite`, `CopyRowLoop`) or camelCase (`drawSprite`, `copyRowLoop`).
- PascalCase may be more familiar and readable for public routines; camelCase may suit internal branch labels. Decide the convention explicitly before editing.
- Once chosen, apply it consistently across examples so the manual teaches the intended AZM style by example.

Key distinction:

Constants can use uppercase underscore. Labels that name code or storage addresses should use the chosen case-sensitive label convention rather than the older all-uppercase assembler style.

### Getting Started listing example does not match AZM output

Verification:

I assembled the Getting Started `counter.asm` example with the local AZM checkout at `/Users/johnhardy/projects/AZM` using `npm run azm -- /tmp/.../counter.asm`.

Actual generated `counter.lst`:

```text
; AZM listing
; range: $0100..$010A (end exclusive)

0100: 06 08 21 09 01 34 10 FD 76 00                    |..!..4..v.|

; symbols:
; label main = $0100
; label Loop = $0105
; label counter = $0109
; constant LIMIT = $0008 (8)
```

Problem:

The manual currently shows a line-correlated listing with source line numbers, source text and placeholder bytes (`XX XX`) for the forward reference. That is not what the current `.lst` file produces. The actual listing is a compact address-range hex dump followed by a symbol table.

Revised direction:

- Repurpose the Getting Started "Reading the listing" section as a virtual assembly walkthrough.
- Show a two-sided demonstration: source on the right, generated addresses and bytes on the left.
- Make clear that this is an explanatory view of what AZM assembled, not the literal `.lst` file format.
- Use it to teach what bytes get generated and where they land in memory.
- Remove discussion of `.lst` output from Book 4, including how to suppress it.
- Treat `.lst` as a feature likely to be deprecated or removed from AZM, so the manual should act as if it is not part of the recommended output surface.
- Check Chapter 8 carefully, because it currently contains a substantial listing section and references suppression flags such as `--nolist`.

## Chapter 2 — Source Syntax and Symbols

### `;!` register-care comments

Current concern:

Chapter 2 mentions the `;!` comment form, but it should also tell the reader how to treat those comments operationally.

Suggested direction:

- Explain that `;!` lines are machine-readable register-care comments.
- Say that they are normally generated or maintained by AZM.
- Tell the reader that hand-editing them is usually discouraged; leave them for the machine unless Chapter 6 specifically tells you to write or review a contract.
- Keep the Chapter 2 explanation brief and defer the contract workflow to Chapter 6.

### Number formats: `$` hex prefix vs current address

Current concern:

The number-format section currently explains trailing-`H` hex and then immediately explains the two roles of `$`. The `$` explanation may be confusing because it mixes `$` as a hex prefix with `$` as the current assembly address.

Suggested direction:

- Keep the trailing-`H` note if needed: `0FFH` starts with a digit and is parsed as hex; `FFH` starts with a letter and is parsed as a symbol.
- In Chapter 2, describe `$FF` simply as the dollar-prefixed hex form.
- Mention briefly that bare `$` also has a special meaning as the current assembly address.
- Defer the real explanation of `$` as the current assembly address to Chapter 3, where placement, `.org` and address arithmetic are discussed.
- Tease apart the two concepts so the reader does not have to understand current-address arithmetic while they are only learning number literal forms.

### Literal ordering: strings before `.db`

Current concern:

Chapter 2 introduces string literals through `.db`, `.cstr`, `.pstr` and `.istr` before the reader has been taken through the data directives themselves. That can feel out of order: the text is using `.db` semantics before the manual has established what `.db` does.

Suggested direction:

- Organise the topics in a rational dependency order.
- Introduce numeric and byte literal forms before string literals.
- Introduce `.db` and `.dw` before relying on them to explain string storage.
- If Chapter 2 remains a syntax chapter, keep literal syntax lightweight and defer data-directive behaviour to Chapter 4.
- Do not make the reader understand string literals, terminators or length-prefix directives before byte and word data have been introduced.

Underlying point:

The reader may know assembly, but the manual still needs to progress cleanly. If labels, bytes and words are the foundation, string literals should come after byte literals and the basic data directives that consume them.

### Dotted directive list should not be exhaustive

Current concern:

The list of dotted directive names in Chapter 2 is likely to drift as AZM changes. Maintaining a full directive list in the chapter creates a second source of truth alongside the appendix.

Suggested direction:

- Show a few representative dotted directives, such as `.org`, `.equ`, `.db`, `.dw`, `.include`.
- State the rule: canonical AZM directives are lowercase and dotted.
- Refer the reader to Appendix A for the current full directive reference.
- Avoid trying to keep an exhaustive directive list in Chapter 2.

### Undotted directives belong in alias compatibility discussion

Current concern:

Chapter 2 should not introduce undotted directive forms as if they are first-class AZM syntax. Their purpose is compatibility with other assemblers, and that belongs in the aliasing section.

Suggested direction:

- In Chapter 2, introduce only canonical lowercase dotted directives.
- Avoid discussing undotted forms, uppercase forms and case variations in the early syntax chapter.
- Move that material to Chapter 7, where aliases are explained as a compatibility layer for existing assembly source.
- Couch aliases explicitly in terms of compatibility, not as an equal alternative style for new AZM source.

Additional structural concern:

There is another section after the case-sensitivity discussion that returns to dotted tokens and aliases. That material should also come out of Chapter 2. Chapter 2 should not keep circling back to compatibility forms after it has introduced native AZM syntax.

Required direction:

- Remove the post-case-sensitivity discussion of dotted tokens, undotted tokens and alias behaviour from Chapter 2.
- Keep Chapter 2 focused on native AZM source forms.
- Move all alias and backward-compatibility material to Chapter 7.
- Present aliases there as compatibility tools for existing source, not part of the normal syntax path for new AZM code.
- Avoid "faffing around" with non-native forms in the early syntax chapter.

### Chapter 2 needs a readability pass

Current concern:

Chapter 2 is currently too distracted by aliases and compatibility forms. The repeated alias discussion interrupts the basic syntax progression and makes the chapter feel scattered.

Required direction:

- Strip Chapter 2 of alias discussion.
- Leave at most one short pointer: compatibility aliases are covered in Chapter 7.
- Keep Chapter 2 on native AZM syntax: line structure, comments, labels, canonical directives, literals and symbol rules.
- Reorder the chapter so each topic depends naturally on what came before it.
- After removing alias material, do a readability edit for flow, because the chapter currently feels "all over the place".

### Introduce repeated building blocks before relying on them

Current concern:

Chapters 1 and 2 repeatedly use `.db`, `.dw` and `.ds` in examples before giving even a short explanation of what those directives are. An experienced assembly programmer may recognise them, but the manual should still introduce concepts before it repeatedly depends on them.

Suggested direction:

- Revisit Chapters 1 and 2 for dependency order.
- Identify the building blocks that later examples rely on: labels, constants, directives, `.db`, `.dw`, `.ds`, numbers, strings, comments and entry labels.
- Give repeated concepts a brief introduction before examples lean on them.
- This does not require fully explaining every concept before first mention. A one-sentence orientation is enough when a full chapter follows later.
- Avoid using `.db`, `.dw` and `.ds` as if their meaning is already established unless Chapter 1 or early Chapter 2 has introduced them.

Underlying principle:

The manual should not stop every time it uses an unfamiliar form, but if a concept appears repeatedly, the reader needs a foothold first.

### Book 4 needs a theme-tag audit, starting with Chapters 1–3

Current concern:

Chapters 1 and 2 still feel too heavy and repetitive, especially around labels, constants, directives and `.equ`. Chapter 3 can be the definitive reference for addresses, constants and expressions, but earlier chapters should only orient the reader lightly and then point forward. The same kind of repetition may exist later in Book 4; Chapters 1–3 are simply the portion reviewed so far.

Proposed audit method:

- Annotate every paragraph in Book 4 with theme tags, starting with Chapters 1–3.
- Example tags: `AZM identity`, `assembler role`, `line structure`, `labels`, `entry labels`, `constants`, `.equ`, `directives`, `.db/.dw/.ds`, `number literals`, `string literals`, `$ current address`, `.org`, `case-sensitive symbols`, `opcode/register case`, `aliases`, `compatibility`.
- Use the tags to identify where a theme is introduced, where it is explained in depth and where it is repeated.
- For each section, describe the thematic progression in one sentence. If the section cannot be summarised as a progression, it probably needs to be cut or reorganised.
- Decide one home for each deep explanation.
- Earlier mentions should be either:
  - a brief orientation plus a forward reference, or
  - removed entirely if they do not help the immediate section.
- Prefer deletion over forward references when an earlier mention of a later feature is not needed for the current topic.

Likely target structure:

- Chapter 1: what AZM is, what an assembler does, one small program, very light orientation to source forms.
- Chapter 2: native AZM source syntax only, kept light and orderly.
- Chapter 3: definitive treatment of `.org`, labels as addresses, constants, `.equ`, `$` and expression arithmetic.
- Later chapters: check for the same theme being reintroduced instead of referenced, especially where layout, storage, labels, constants, register-care and output formats overlap.

Purpose:

The goal is to stop the reader feeling that labels, constants and `.equ` are being re-discussed in several places. The progression should make clear when a concept is being named briefly and when the manual has arrived at the main explanation.

The audit is also meant to break the "machine-generated slot" feeling: sections should not circle around a topic with repeated variants of the same point. Each paragraph should move the reader to the next idea.

Deletion policy:

When a paragraph, sentence or example in an early chapter touches a theme that belongs later, ask first: can this be deleted? If the later chapter will explain the feature properly, the earlier chapter should not make the reader carry a partial concept forward. Passing mentions of `sizeof`, `offset`, `.type`, enums or layout machinery should be removed unless the current explanation genuinely depends on them.

### Numeric literals are repeated instead of placed once

Current concern:

Numeric literals appear to be introduced, then discussed again later as if the reader has not already seen them. This mirrors the string-literal ordering problem in reverse: either literals were introduced too early and too lightly, or the later chapter is reteaching something that should already be established.

Suggested direction:

- Choose one primary home for numeric literal syntax.
- Later chapters should use numeric literals without reteaching the same forms.
- If a later chapter needs a specific numeric-literal detail, keep it local and avoid repeating the full list.
- The theme-tag audit should tag every numeric-literal paragraph and decide which one is the actual introduction.

Underlying point:

The book needs a thematic order that works. Literals should not be repeatedly introduced in multiple places.

### Expression operators belong in the appendix, with a light pointer from Chapter 3

Current concern:

Expression operators such as `%`, `^`, `&`, `|`, `~`, `<<` and `>>` are not self-evident. The manual should not assume that the reader already knows what a percent sign, caret or shift operator means in an assembler expression.

Current state:

Appendix B already contains an expression-operator table. That is the right general location. It sits near Appendix D, which documents built-in functions such as `sizeof`, `offset`, `LSB` and `MSB`.

Suggested direction:

- Keep the full operator table in Appendix B.
- Make Chapter 3 point to Appendix B instead of re-explaining the full operator set.
- In Chapter 3, define only the operators needed for the immediate examples.
- Keep the appendix table concise but clear enough that each symbol has a plain-English meaning.
- Consider whether Appendix B and Appendix D should cross-reference each other because operators and built-in functions are both expression tools.

### Consolidate `$` current-address discussion

Current concern:

The manual keeps returning to `$` as the current assembly address: first in numeric literal discussion, then again in expression sections. This repeats the concept and contributes to the feeling that the chapter is circling.

Suggested direction:

- Choose one main place to explain bare `$` as the current assembly address.
- Likely home: Chapter 3, near `.org`, labels and address arithmetic.
- Earlier number-literal discussion should only say `$FF` is the dollar-prefixed hex form and, if necessary, mention that bare `$` is explained in Chapter 3.
- Later expression sections should use `$` only after that explanation, without reintroducing it.
- The theme-tag audit should tag every `$` paragraph and merge repeated explanations.

### Separate `%` binary prefix from `%` modulo operator

Current concern:

The manual has the same problem with `%` that it has with `$`: it mixes a literal prefix discussion with an operator discussion because both use the same character. `%10101010` as binary notation and `%` as the modulo operator are separate topics.

Suggested direction:

- Discuss `%` as a binary literal prefix only in the numeric-literal section or appendix table.
- Discuss `%` as modulo only in the expression-operator table.
- Avoid long explanations about the character having two roles.
- If needed, include a short footnote such as: "A leading `%` begins a binary literal; between expressions, `%` is modulo."
- Do not revisit binary literal notation when teaching expression operators.
- Do not revisit modulo when teaching numeric literal prefixes.

Underlying principle:

Shared characters do not require a long combined explanation. Keep unrelated topics separate, and trust the reader to understand prefixes and operators once each is defined in its own place.

### Ban "spell" / "spelling" wording

Current concern:

The text still contains phrases such as "Two valid spellings". The words "spell", "spelling", "spelt" and "spelled" should be banished from the documentation.

Specific replacement direction:

- Replace "Two valid spellings" with "Two valid forms" or "Two accepted forms".
- Replace "directive spellings" with "directive forms".
- Replace "how AZM spells..." with "how AZM writes..." only if needed; usually rewrite the sentence around syntax or accepted forms.

Rule:

Search for `spell`, `spelling`, `spelt` and `spelled` before finalising edits.

## Chapter 3 — Addresses, Constants and Expressions

### Define traditional assembler abbreviations

Current concern:

Traditional assembler directive names are often abbreviations or inherited terms. The manual should define them when they first appear, even if experienced assembly programmers may already know them.

Specific example:

- `.org` should be introduced as "origin".
- Explain that the origin is the assembly address where the assembler starts placing subsequent bytes.
- Then explain that `.org $0100` tells AZM to assemble the next byte at address `$0100`.

General direction:

- When a directive name is a shortened English word or traditional assembler term, give the expansion or plain meaning.
- Do this briefly, without turning the manual into an etymology lesson.
- The goal is to prevent non-obvious inherited terms from feeling like unexplained jargon.

### "Assembly address vs file offset" may be too much for Chapter 3

Current concern:

The "Assembly address vs file offset" section may not belong in the main Chapter 3 progression. It feels like a lower-level output-format detail rather than a concept the reader needs at that point.

Question to decide:

- Does this section help the reader understand `.org`, labels and address arithmetic now?
- Or does it interrupt the flow with a binary-file detail that belongs later?

Possible direction:

- Cut the section if it does not advance the Chapter 3 learning path.
- Move the detail to an appendix or output-format reference if it remains useful.
- Keep Chapter 3 focused on assembly addresses, origins, labels, `$`, constants and expressions.
- Mention file offsets only when the output format or `.binfrom` / `.binto` discussion requires it.

### Code size example should use a start label

Current concern:

The current code-size example uses `$ - 0`, which is less convincing and less idiomatic than measuring between two labels.

Current form:

```asm
        .org $0000
        ; ... code ...
CODE_END:
CODE_SIZE   .equ $ - 0
```

Suggested form:

```asm
        .org $0000

CODE_START:
        ; ... code ...
CODE_END:
CODE_SIZE   .equ $ - CODE_START
```

Reason:

The label form teaches the general pattern: mark the start, mark the end and subtract the two labels. It works at any origin and avoids tying the example to address zero.

### Jump-stride verification example belongs with label arithmetic

Current concern:

The jump-stride verification example does not use `$`, so it is confusing inside a section that is specifically teaching `$` as the current assembly address.

Suggested direction:

- Keep the example if it is useful, because label subtraction is common and valuable.
- Move it out of the `$` section.
- Group it with other label arithmetic examples, or give it its own short subsection on label-to-label arithmetic.
- In the `$` section, use examples where `$` is actually the active mechanism: table length, code size from current address, reserve/checkpoint calculations and similar.

### Gaps between origins: remove listing reference

Current concern:

The "Gaps between origins" discussion is useful, but it mentions the listing format. That appears to mean the `.lst` output, which should be treated as deprecated and removed from the manual.

Suggested direction:

- Keep the explanation of how flat binary and Intel HEX handle gaps.
- Delete the listing bullet/reference from this section.
- During the rewrite, search Book 4 for `.lst`, "listing" and `--nolist`.
- Remove or repurpose those references so the manual no longer treats `.lst` as part of the recommended AZM output surface.

### Premature `offset` / `sizeof` reference in `.equ` discussion

Current concern:

The `.equ` discussion currently says:

> Prefer `offset(Type, field)` and `sizeof(Type)` when using `.type` declarations — they update automatically when the layout changes.

This appears before `.type`, `offset` and `sizeof` have been introduced. It breaks the progression by invoking layout-system concepts inside the constants section before the reader has the needed context.

Suggested direction:

- Delete this sentence from Chapter 3 unless a much lighter forward reference is genuinely needed.
- Let Chapter 5 introduce `.type`, `offset` and `sizeof`.
- If Chapter 3 must mention the future layout system, use a very short pointer only: "Chapter 5 shows how AZM can derive record offsets from layout declarations."
- Avoid recommending functions the reader has not yet been taught.

Related example issue:

The "Expressions in data directives" examples also use `sizeof(Sprite)` before layout types and assembler functions have been introduced. Before Chapter 5, examples should fall back on conventional arithmetic that an assembly programmer already understands.

Suggested example policy:

- Use `.db MAX_VAL - 1`, `.dw TABLE_BASE + STRIDE * 3` and `.ds BUFFER_COUNT * BUFFER_SIZE`.
- Avoid `sizeof`, `offset`, type expressions and layout-related functions in Chapter 3 examples unless the section is explicitly previewing Chapter 5.
- It is acceptable to mention that AZM has assembler functions later, but examples should not depend on unexplained functions.

Broader rule:

Do not use syntax or language that has no meaning to the reader yet. `sizeof` only makes sense once types exist. `offset` only makes sense once records and fields exist. In the expression chapter, focus on classic assembler expression arithmetic: constants, labels, addition, subtraction, multiplication, masks and address calculations. Layout-derived functions belong after the layout system has been introduced.

Exception policy:

Small forward references are acceptable when they are clearly marked and do not require understanding the future feature. Repeated examples or explanatory paragraphs using future concepts should be omitted rather than tolerated.

### "Assembly-time evaluation" section uses layout concepts too early

Current concern:

The "Assembly-time evaluation" section is a useful concept, but its examples use `sizeof` and `offset`, which depend on types, records and fields that have not yet been introduced.

Suggested direction:

- Keep the section only if it can be explained with ordinary arithmetic: constants, labels and numeric expressions.
- Replace layout examples with conventional examples such as `TILE_BYTES .equ TILE_W * TILE_H` or `TABLE_END - TABLE_START`.
- Move layout-specific assembly-time evaluation to Chapter 5, where `sizeof`, `offset`, records and fields are introduced.
- If the current section cannot be made useful without layout functions, delete it from Chapter 3.

Underlying point:

Assembly-time calculation is worth teaching, but Chapter 3 should teach the general idea. Layout-derived calculation belongs with the layout system.

### `.equ` redefinition section should state the rule directly

Current concern:

The paragraph about names whose values change by mode or configuration is unclear:

> If you need a name whose value changes based on a mode or configuration, structure the source so one definition is included for that build. In practice, keep one canonical definition of each constant and express derived values from it.

It appears inside a section about redefinition, but it reads like a workaround for redefining constants. The core rule is simpler and stronger: AZM symbols cannot be redefined.

Suggested direction:

- Re-express or delete the paragraph.
- State directly that `.equ` names are global within the translation unit.
- State that a constant can be defined once.
- State that redefining the same constant anywhere in the program is an error.
- Avoid presenting configuration workarounds unless there is a clear, concrete build-organisation section where that belongs.

Possible replacement:

> A `.equ` name is global within the translation unit and can be defined once. A second definition of the same name is an error, even if the value is the same.

### Naming conventions are repeated across chapters

Current concern:

Chapter 3 returns to naming conventions after Chapter 2 has already discussed label and symbol case. This creates the feeling that the manual is circling around the same theme instead of progressing.

Theme-audit implication:

- Naming conventions need one primary home.
- Other chapters should either refer to that discussion briefly or stay focused on the local rule.
- If Chapter 2 introduces label naming and case-sensitive symbol conventions, Chapter 3 should not reopen the full naming-convention discussion inside the `.equ` section.
- If Chapter 3 is chosen as the detailed home for constant naming, then Chapter 2 should only orient the reader and defer details there.

Question to decide:

Where should naming conventions live?

- Option A: Chapter 2, because it introduces labels, symbols and case sensitivity.
- Option B: Chapter 3, because constants and `.equ` need detailed naming rules.
- Option C: a style section later in the manual, with early chapters using only brief examples and forward references.

The current structure is unsatisfactory because it discusses naming in multiple places without a clear hierarchy.

### Enums are used before they are introduced

Current concern:

Enums appear in examples or surrounding discussion before the manual has introduced what an enum is. This is another symptom of the thematic ordering problem: features are being referenced before the reader has a foothold.

Possible direction:

- Treat enums as a variety of grouped constants.
- Consider introducing enums in the same broader chapter or section that teaches constants, rather than later as an isolated feature.
- If enums remain in a later chapter, remove or defer earlier references until the reader has reached the enum explanation.
- During the theme-tag audit, tag every enum mention and decide which one is the first real introduction.

Underlying point:

The manual should not use enums, type definitions or layout concepts as if they are already known before their introductory sections. If a concept is needed earlier, move the introduction earlier or keep the earlier mention to a brief forward pointer.

### Avoid casual claims about `.equ` expression bit width

Current concern:

The text says `.equ` expressions compute in 32-bit assembler arithmetic. That is oddly specific and may be technically misleading. Expressions are best understood as numbers until they are consumed by a byte, word, instruction operand or storage directive.

Suggested direction:

- Delete the 32-bit arithmetic claim unless the expression model is documented rigorously.
- State the useful rule instead: expressions evaluate to numeric values, and AZM checks whether the value fits when it is used in a byte, word, branch offset, port operand or other bounded encoding slot.
- Avoid half-discussing internal numeric representation. If the manual discusses expression width, overflow or signedness, it must do so precisely and in one dedicated place.

Possible replacement:

> `.equ` expressions produce numeric values. Range checks happen when the value is used in a context with a fixed size, such as `.db`, `.dw` or an instruction operand.

### Enum section is useful but too long

Current concern:

The enum introduction is now detailed enough, but the concept is simple and the chapter spends too many subsections on it. The section should be compressed without losing the useful explanation.

Core framing to keep:

- An enum is a grouped set of constants.
- The members are given consecutive numbers automatically.
- The member names are qualified by the enum name, giving a small namespace or group space.
- Enum values are useful for states, commands, modes and other dense sets of named values.
- Enum members are still numeric constants at assembly time.

Suggested direction:

- Collapse the enum material into one large section or at most two sections.
- Avoid separate subsections for every small point if the idea can be taught in a single progression.
- Present syntax, generated values, qualified names and basic use together.
- Keep runtime caveats brief.
- Remove wordiness and repeated selling of why enums are useful.

Possible structure:

1. "Enums as grouped constants": define the concept, show syntax, show assigned values, explain qualification.
2. "Using enum values": show `ld`, `cp`, `.db` and a compact note on when to choose `.equ` instead.

Open design question:

There is still some uncertainty about whether enums are a good feature to keep, but if they are framed as compact qualified `.equ` groups, they appear useful. The documentation should reflect that simple model rather than making the feature feel larger than it is.

### Case-sensitive labels and naming conventions

Current concern:

The current wording says labels and constants are case-sensitive, then tells the reader to choose a convention and stick with it. That is too thin for assembly programmers coming from case-insensitive assemblers. They may not have a mental model for using case as part of naming.

Structural direction:

- Separate the case topic into distinct sections.
- Put labels and user-defined symbols in their own section.
- Put opcodes, operands and registers in a separate section.
- Avoid presenting "case-sensitive" and "case-insensitive" side by side in one compact paragraph, because the terms are visually similar and easy to blur.

What the section should teach:

- AZM labels and constants are case-sensitive.
- That is a meaningful AZM feature: it allows more modern and expressive naming styles in assembly source.
- Z80 opcodes, operands and register names remain case-insensitive, so `ld a,b`, `LD A,B` and mixed-case register names still parse normally.
- Case sensitivity applies to programmer-defined symbols: labels, constants, enum names, layout type names and field names.
- Labels are especially important because they must be globally unique across the translation unit.
- Well-named labels are one of the most important readability tools in assembly language.

Naming conventions to discuss:

- Constants commonly use all-uppercase words separated by underscores:

```asm
SCREEN_WIDTH .equ 128
LCD_DATA     .equ $00
MAX_SPRITES  .equ 16
```

- Public routines and important labels can use PascalCase, with each word starting in uppercase:

```asm
@DrawSprite:
FindNextToken:
CopyRowLoop:
```

- Local branch-style labels can use camelCase or a routine-prefixed form:

```asm
scanLoop:
drawSpriteLoop:
```

Why this matters:

- Case-sensitive names let labels carry more meaning than old all-uppercase assembler styles.
- PascalCase and camelCase make multi-word routine and branch names easier to read without underscores everywhere.
- Distinct naming styles reduce accidental collisions between constants, routines and branch labels.
- The manual should explain these options rather than giving the reader an empty instruction to "pick a convention".

Opcode/register section:

- Explain separately that AZM is deliberately liberal about opcode and register case.
- This is a compatibility and style decision because existing assembly source uses many casing conventions.
- Users can write opcodes and registers in uppercase, lowercase or mixed case according to project style.
- Keep this separate from label naming, because labels carry program meaning and uniqueness constraints.

### `--case-style` flag needs separate review

Current implementation summary:

- `--case-style` is a lint flag for instruction mnemonics, op invocation heads and register tokens.
- Modes are `off`, `upper`, `lower` and `consistent`.
- It emits `AZMN_CASE_STYLE` warnings.
- It does not fail the build; tests confirm the CLI still exits 0 when warnings are emitted.
- It does not lint labels or constants.
- `upper` warns when mnemonics/registers are lowercase or mixed case.
- `lower` warns when mnemonics/registers are uppercase or mixed case.
- `consistent` uses the first uppercase or lowercase token it sees as the established style, then warns when later tokens use the other style. Mixed-case tokens are classified as `mixed` and will warn under `upper`, `lower` or an established `consistent` style.

Question to decide:

Is this feature useful enough to document prominently? It may be better treated as a minor lint option in the CLI appendix, or removed/deprecated if it encourages attention on opcode casing rather than the more important issue: clear, case-sensitive symbol naming.

## Chapter 4 — Data, Storage and Includes

### Should data layout move earlier?

Current concern:

Chapter 4 is where `.db`, `.dw` and `.ds` are finally defined clearly. That feels too late for an assembler manual, because data layout is one of the fundamental activities in assembly language programming.

Audit question:

When should memory layout be introduced?

Possible direction:

- Introduce `.db`, `.dw` and `.ds` earlier, perhaps in Chapter 2 or Chapter 3.
- Treat data layout as one of the first serious topics after basic source syntax.
- Use a lightweight early explanation: `.db` writes bytes, `.dw` writes 16-bit words and `.ds` reserves storage.
- Then later chapters can use these forms without repeatedly pausing to explain them.

Broader structural possibility:

If data layout moves earlier, the manual may be able to introduce:

- basic memory layout before detailed opcode discussion,
- enums as grouped constants near constants,
- types as structured layout declarations sooner,
- records and arrays as layout concepts before the reader starts writing larger routines.

This may produce a stronger progression for an assembler manual: source syntax, data and memory layout, constants/expressions, then code structure and analysis features.

Open question:

The current chapter order may be too code-first. Data layout is central enough that it may deserve to be the first substantial concept after source syntax.

### Pull includes out and let `.ds` lead into types

Current concern:

Chapter 4 currently moves from `.db`, `.dw`, strings and `.ds` into includes. That breaks the most important progression. `.ds` is where unstructured storage allocation naturally leads into typed storage allocation, but the manual defers that power to Chapter 5 and detours into includes.

Required restructuring direction:

- Move the include discussion out of the data/storage chapter.
- Put includes later, probably near project organisation, compatibility or build structure.
- Keep Chapter 4 focused on data and memory layout.
- Let `.ds` lead directly into the layout/type system.
- Move Chapter 4 and Chapter 5 earlier in the book.

Desired progression:

1. Labels and basic source structure.
2. Basic data layout: `.db`, `.dw`, strings, endianness and `.ds`.
3. Typed layout: records, arrays, `sizeof`, `offset`, typed `.ds` allocation and casts.
4. Then move into more code-oriented material, routines, register-care, ops and compatibility.

Why this matters:

Typed records and array notation are a major reason AZM is more powerful than a traditional assembler. The reader should encounter that power soon after learning how raw bytes and reserved storage work. `.ds Sprite[16]`, `sizeof(Sprite)` and `offset(Sprite, field)` make the most sense immediately after `.ds` has been introduced.

Possible chapter split:

Chapter 5 may need to be broken up. The core type and array material should come early, close to `.ds`. More advanced material such as casts, nested layouts or unions could remain later if the chapter becomes too large.

### Move trailing `.ds` behaviour out of the core flow

Current concern:

Trailing `.ds` behaviour is an edge case. It is not critically interesting to most readers at the point where they are learning storage reservation.

Suggested direction:

- Pull the trailing `.ds` behaviour section out of the main data/storage chapter.
- Move it to an appendix, advanced topic or output-format reference if it remains useful.
- Keep the core `.ds` explanation focused on reserving storage, optional fill bytes and typed allocation.
- Avoid interrupting the `.ds` to typed-layout progression with binary-output edge cases.

### Trim named counts, storage maps and includes from core Chapter 4

Current concern:

The current data/storage chapter includes named counts, storage maps and include-file discussion. These distract from the core progression from byte/word data to reserved storage to typed layout.

Suggested direction:

- Remove named-count discussion unless it is needed as a tiny `.ds COUNT` example.
- Remove or defer storage-map discussion from the core chapter.
- Move storage maps to a later style/project-organisation chapter if they remain useful.
- Move all `.include` material out of this chapter and into a later chapter.
- Keep the chapter focused on data layout and storage allocation.

Preferred core path:

1. `.db` writes bytes.
2. `.dw` writes little-endian words.
3. String literals and string data directives.
4. `.ds` reserves storage.
5. `.ds` with type expressions, leading into the layout/type chapter.

### Move structured layout early enough to reduce raw `$ - label` arithmetic

Current concern:

Traditional assembler examples often measure sizes with label arithmetic:

```asm
TABLE_START:
        .db ...
TABLE_END:
TABLE_LEN .equ $ - TABLE_START
```

That pattern is valid and useful, but it conflicts with the direction AZM is trying to take. AZM has higher-level layout mechanisms such as types, `sizeof` and `offset` precisely so programmers do less raw address arithmetic when describing structured memory.

Pedagogical direction:

- Do not over-teach `$ - label` as the main way to calculate sizes if the manual will soon introduce typed layout.
- Introduce `.db`, `.dw` and `.ds` early.
- Then introduce structured layout, type definitions, `sizeof` and `offset` early enough that the reader sees AZM as modern assembly, not only traditional assembly with extra syntax.
- Use raw `$` arithmetic for simple unstructured byte sequences and legacy-style examples.
- Use `sizeof` and `offset` for records, arrays and structured storage once types have been introduced.

Structural implication:

The layout chapter probably needs to move earlier, shortly after the basic data directives. That would let the manual explain records, arrays and typed layout before it has trained the reader to solve every size and offset problem with label subtraction.

Philosophical point:

AZM should be presented as modern assembly language: it keeps the programmer close to the bytes, but borrows useful structuring ideas from C, Pascal and later high-level languages. The manual's ordering should support that idea. If type definitions and structured layout are central to AZM's value, they should not appear late after several chapters of raw address arithmetic.

### Treat `.db`, `.dw`, `.ds` and types as one layout progression

Current concern:

The layout-system chapter opens with a sentence like:

> Insert a field and every constant after the insertion is wrong, along with every access expression built on it.

This feels rhetorically compressed and not fully self-contained. It is trying to motivate the AZM layout system, but the underlying topic is broader: `.db`, `.dw` and especially `.ds` are already memory-layout tools. Types are the advanced/structured continuation of that same theme.

Suggested direction:

- Reframe the current type/layout chapter as advanced or structured layout, not as a detached feature.
- Pair it directly with the data/storage chapter.
- Move both chapters earlier in the book.
- Let `.db`, `.dw`, strings and `.ds` establish raw layout.
- Then let `.type`, arrays, records, `sizeof`, `offset` and casts show structured layout.
- Review the opening prose so it states complete, concrete claims rather than rhetorical fragments.

Audit note:

Do a pass for sentences that are grammatically present but do not function well as standalone teaching sentences. These often imply an unstated premise, compress a chain of reasoning too tightly or make an overbroad claim for rhetorical force.

### Remove reading-order instructions

Current concern:

The layout chapter says:

> Work through this chapter in order the first time — the sections build on each other.

This kind of instruction tells the reader how to read rather than teaching the subject. It usually has no reason to exist. If the chapter genuinely builds in order, the structure should make that clear.

Suggested direction:

- Delete reading-order instructions unless there is a concrete operational reason.
- Do not tell the reader to work through a chapter in order merely because the chapter is sequential.
- Start with the actual content.

### Explain layout casts from first principles

Current concern:

The layout chapter introduces casts as if the reader already knows what casting means. Many assembly programmers may not have a C/Pascal mental model for casts, pointers or typed access.

What the section needs to teach:

- A label or expression can be an address without carrying information about what kind of data lives there.
- A layout cast gives that address a type for the purpose of an address calculation.
- The angle-bracket form marks the type being imposed on the address expression.
- Once the address is viewed through a type, AZM can resolve field names and array indexes into byte offsets.
- The cast does not change runtime memory; it changes how the assembler computes the address.

Suggested framing:

> A cast tells AZM, "treat this address as a Sprite while calculating the address." That lets you write `.flags` instead of manually adding `offset(Sprite, flags)`.

Example progression:

- Start with a single record:

```asm
PLAYER:
        .ds Sprite

        ld   a,(<Sprite>PLAYER.flags)
```

- Then move to arrays after the single-record case is clear.
- Avoid starting with `<Sprite[16]>SPRITES[3].flags` as the first cast example, because it combines type, array and field access all at once.

Future implementation note:

The examples may change once AZM supports naming array type signatures, such as a `SpriteArray` type alias. At that point the manual can prefer a named array type instead of repeatedly writing `Sprite[16]`.

Style note:

Avoid clever phrasing such as:

> the field path is the interesting part and the arithmetic is noise

Use plain English:

> The cast writes the same address calculation in a shorter form when you want to name a field directly.

Also avoid abstract setup phrases such as:

> The boundary is clear:

Introduce the decision directly:

> Use a layout cast when the index is known at assemble time. Use explicit address arithmetic when the index is held in a register at runtime.

### Define type-system terminology before using it

Current concern:

The layout chapter launches into terms such as "scalar types" without defining the terminology. Assembly programmers may not know that vocabulary, and even readers who know it need to understand what AZM means by it.

Terminology question:

Either define the terms carefully or avoid them.

Possible type vocabulary:

- Scalar type: a simple fixed-size value such as `byte`, `word` or `addr`.
- Pointer/address type: `addr`, a 16-bit address-sized value. If it points to structured storage, the pointed-to layout still has to be supplied by a cast or related notation.
- Record type: a `.type` layout with named fields.
- Array type: a repeated element type, such as `byte[32]` or `Sprite[16]`.
- Composite type: a record or array type made from smaller types.

Current concern about AZM:

The type system currently feels strongest for record types. Records can contain array fields, and array type expressions can be used in some contexts, but the documentation does not clearly present arrays, pointers and record types as a coherent type system.

Suggested documentation direction:

- Introduce the smallest useful type vocabulary before using terms like "scalar".
- If "scalar" is retained, define it in plain language.
- Avoid importing C/Pascal terminology without explanation.
- Explain what AZM's layout types can and cannot express today.
- Build from simple fixed-size types, to records, to arrays, to casts.

Open question:

The manual may need a more deliberate "Kinds of layout type" section before detailed record examples.

### Consider removing `addr` from documentation

Current concern:

`addr` adds a new layout term while behaving the same as `word`: both are 2-byte values. Its distinction is semantic intent rather than an enforceable type difference.

Documentation direction if removed/deprecated:

- Stop teaching `addr` as a separate scalar type.
- Use `word` for 16-bit fields.
- If a field stores an address, communicate that with the field name or a short comment.
- Avoid implying AZM has typed pointers unless the implementation gains real pointer typing.

Reason:

The manual should reduce cognitive load. A non-enforced pointer-intent keyword may add noise without giving the reader a real new capability.

### Teach `.field` before array type expressions

Current concern:

The layout chapter introduces `.field` and immediately uses an array type expression such as `byte[32]`. That combines two ideas before the reader has a clear model for either one.

Suggested direction:

- First define `.field` plainly: it declares a named field and takes a size/type expression that determines how many bytes that field occupies.
- Emphasise that layout type expressions ultimately provide byte counts for allocation.
- Relate `.field` to `.ds`: both consume size-related expressions; `.ds` reserves storage, while `.field` reserves space inside a record layout.
- Then introduce examples in increasing complexity:

```asm
name    .field byte      ; 1 byte
count   .field word      ; 2 bytes
data    .field byte[16]  ; 16 bytes
table   .field word[8]   ; 16 bytes
```

Teaching point:

`byte[16]` is not magic array storage by itself; in a layout context it is a type/size expression whose byte count is used by `.field` or `.ds`. The section should establish that before leaning on array notation.

### Clarify type expressions versus numeric expressions

Current concern:

Examples such as:

```asm
sizeof(byte[32])       ; 32
sizeof(word[8])        ; 16
sizeof(Sprite[16])     ; sizeof(Sprite) * 16
```

look redundant because `byte[32]` and `word[8]` appear to already "be" the numeric values 32 and 16.

Current implementation point:

`byte[32]` is a type expression, not a general numeric expression. It reduces to a byte count only in contexts that ask for a layout size, such as `.ds`, `.field` or `sizeof(...)`.

Suggested documentation direction:

- Explain that `byte[32]` means "an array type made of 32 bytes".
- Explain that when a size is needed, that type expression has size 32.
- Avoid presenting `sizeof(byte[32])` as if it teaches something different from `.ds byte[32]` unless the context needs an ordinary numeric expression.
- Use this distinction:
  - `.ds byte[32]` consumes a type expression directly as a storage size.
  - `SIZE .equ sizeof(byte[32])` uses `sizeof` because `.equ` needs a numeric expression.
- Make this distinction explicit before showing `sizeof(Type[n])` examples.

### Wrapper records for array layouts are temporary

Current concern:

The "Wrapper records for array layouts" section demonstrates a workaround for naming an array layout by putting the array inside a record field. This works, but it is awkward and adds an artificial field level.

Documentation direction:

- Treat this section as temporary.
- Do not make wrapper records sound like the intended long-term pattern.
- If the implementation gains real type aliases for arrays, replace this section with the alias syntax.
- Until then, consider deferring the workaround to an advanced note rather than teaching it as a core layout technique.

### Union examples should use richer layouts

Current concern:

The current union examples are mostly scalar overlays: byte versus word, low byte versus word view and similar. Those examples explain the basic size/offset mechanics, but they undersell what unions can do.

The section also repeats the same byte/word idea across several subsections. If unions are only taught through scalar overlays, the section should be much shorter.

Suggested direction:

- Keep one simple scalar example only if needed to explain offset zero and largest-member size.
- Add a richer example where a union overlays two record shapes.
- Make clear that AZM only describes the memory layout; the program must know which variant is active.
- If a tag or mode byte discriminates the union, show that explicitly.

Possible example shape:

```asm
.type KeyEvent
kind    .byte
keyCode .byte
.endtype

.type MouseEvent
kind    .byte
x       .byte
y       .byte
.endtype

.union EventPayload
key     .field KeyEvent
mouse   .field MouseEvent
.endunion
```

Teaching point:

A union is more powerful when it gives names to alternative structured interpretations of the same memory, not only when it overlays scalar byte and word views.

Revision rule:

Either make the union section more interesting with structured alternatives, or cut it significantly. Do not spend many subsections on repeated byte/word overlays.

### Whole layout chapter needs tightening

Current concern:

The layout chapter is needlessly wordy. Union material appears in too many separate sections, including "Union casts", and the examples often repeat the same byte/word idea. Some cast and addressing topics may also be over-expanded.

The prose also feels mechanical and AI-generated: too many sections read like expanded dot points rather than a guided explanation.

Suggested direction:

- Make the chapter punchier overall.
- Reduce the number of union subsections.
- Fold "Union casts" into the main cast explanation or a short union note.
- Keep only the examples that teach a distinct idea.
- Replace repeated scalar examples with one simple scalar example and one richer structured example.
- Tighten cast/addressing sections so they state the rule, show the example and move on.

Revision test:

For every subsection, ask whether it teaches a new idea. If it repeats an idea already taught, fold it into the earlier section or cut it.

Prose rewrite direction:

- Lift the prose, not just the structure.
- Replace dot-point-like explanatory paragraphs with a more natural teaching progression.
- Avoid repetitive "this does X / this is useful for Y" rhythm.
- Make the chapter read as one guided explanation of memory layout moving from raw bytes to structured layout.
- Keep technical precision, but make the prose feel written by a person who understands the feature and the reader.

### Move string literal discussion next to `.db`

Current concern:

Once the chapter is defining `.db`, it is the natural place to explain string literals as `.db` data. The earlier syntax chapter should not carry the main explanation of string storage.

Suggested direction:

- Introduce `.db`.
- Introduce `.dw`.
- Then discuss string literals near the `.db` material, because `.db "text"` is the basic form that shows how characters become bytes.
- After that, move into storage reservation, probably `.ds`.
- Keep `.cstr`, `.pstr` and `.istr` close to the `.db` string-literal discussion, since they are specialised string-data directives.

Underlying point:

String literals are data layout, not just abstract syntax. They make most sense once the reader understands that `.db` writes bytes into the output.

Consolidation note:

Chapter 4 already has a natural home for string directives and string literals. Earlier chapters should probably delete their string-directive discussion rather than duplicate it. If the data/layout chapter moves earlier, this becomes easier: the reader gets `.db`, string literals, `.cstr`, `.pstr` and `.istr` in one coherent place.

### Introduce endianness explicitly in memory-layout chapters

Current concern:

The manual uses "little-endian" in memory-layout discussion. Most readers may know the term, but some will not. The concept should be introduced explicitly before relying on the word.

Suggested direction:

- Add a short subsection near `.dw` or the first 16-bit storage discussion.
- State that the Z80 is little-endian.
- Define little-endian in practical terms: a 16-bit value is stored least significant byte first, then most significant byte.
- Example: `.dw $1234` writes `$34 $12`.
- After that, later uses of "little-endian" will have a clear reference point.

Broader rule:

Each chapter that substantially discusses memory layout should mention or refer back to endianness when 16-bit values appear.

### Clarify single quotes vs double quotes

Current implementation summary:

- In expression context, both `'A'` and `"A"` parse as a one-character numeric value.
- Multi-character quoted values are rejected as expressions.
- `.db` data values accept quoted string fragments after expression parsing.
- `.db` currently accepts both double-quoted and single-quoted multi-character string fragments.
- `.cstr`, `.pstr` and `.istr` currently require one double-quoted string.

Current concern:

The documentation does not clearly explain the difference between single quotes and double quotes. Because both quote forms can sometimes produce byte values, the reader needs a simple rule rather than scattered examples.

Suggested documentation direction:

- Define "quoted character" separately from "string literal".
- A quoted character is a one-character value used in an expression: `'A'` or `"A"` both evaluate to ASCII 65 under current AZM.
- A string literal is a sequence of characters used as data, most commonly with `.db` or the string directives.
- Prefer double quotes for strings in examples.
- Decide whether examples should prefer single quotes for character values to make intent clear.
- Document the current `.cstr` / `.pstr` / `.istr` restriction if it remains: they take double-quoted strings.

Open issue:

The language may need a clearer style rule, even if the parser accepts both quote forms in some contexts.

### String directive names and history

Current concern:

The `.cstr`, `.pstr` and `.istr` directives need a little more context so the reader understands where the names come from and what storage convention each one represents.

Suggested direction:

- Explain that `.cstr` means a C-style string: bytes followed by a zero byte. The name comes from the C language convention of null-terminated strings.
- Explain that `.pstr` means a Pascal-style string: a leading length byte followed by the characters. The length byte gives a natural maximum of 255 characters. This is the counted-string convention associated with Pascal.
- Explain `.istr` as an inverted-terminator string: the final character has bit 7 set. This appears to be a terminal or monitor-style convention, but the historical background should be verified before the manual claims a specific origin.
- Keep the history short and tied to the bytes produced. The useful point is that the directive name tells you which string boundary convention the receiving routine expects.

Research needed:

Verify the historical background of `.istr` before expanding the prose. Do not invent a confident origin if the exact lineage is uncertain.

## Chapter 6 — Register Care and Contracts

### Define caller and callee

Current concern:

The register-care chapter uses caller/callee terminology. "Callee" may be unfamiliar to many readers.

Suggested direction:

- Define both terms the first time they appear.
- Caller: the code that executes the `call`.
- Callee: the subroutine being called.
- Keep the definition close to the first register-care example.

Possible wording:

> In a subroutine call, the caller is the code that executes `call NAME`. The callee is the routine named by that call.

### Define "clobber" as a technical term

Current concern:

The register-care chapter uses "clobber" as a technical term. The word is colloquial and may sound odd unless the manual explains its register-programming meaning.

Suggested direction:

- Define "clobber" near the first register-care example.
- Explain that in assembler and compiler discussions, a routine "clobbers" a register when it overwrites the incoming value and does not restore it.
- Acknowledge the plain-English sense lightly if helpful, but do not overdo the joke.
- Then use the term consistently in contracts and diagnostics.

Possible wording:

> In register-care terminology, a routine clobbers a register when it changes the value the caller had placed there. The word is informal, but it is common in assembly and compiler discussions.

### Define `preserves` by behaviour, not mechanism

Current concern:

The chapter appears to tie `preserves` too closely to `push` / `pop`. That is too presumptive. A routine can preserve a register by never changing it, by saving it in another register or memory location, by using the stack or by another correct mechanism.

Correct definition:

`preserves` means the register or flag has the same value on routine exit that it had on routine entry.

Suggested direction:

- Define preservation by observable entry/exit behaviour.
- Avoid saying or implying that preservation specifically means `push` / `pop`.
- Mention `push` / `pop` only as one common implementation strategy, if needed.
- Avoid presenting `push` / `pop` as the only way to avoid clobbering a register.

### Worked register-collision example

Current concern:

The register-care chapter should include a worked example where the programmer has failed to account for a register being altered by a subroutine.

Stronger concern:

The chapter currently feels abstract and empty of practical understanding. It needs a concrete example as the spine of the explanation, not just scattered descriptions of analyzer behaviour.

What the example should demonstrate:

- A caller keeps a useful value in a register across a `call`.
- The callee alters that register.
- Register-care analysis works out that the register is live after the call.
- The callee's contract says that the same register may be clobbered or returned changed.
- AZM reports the resulting conflict.
- The programmer must then choose a repair before proceeding.

Teaching purpose:

Register-care is fundamentally about liveness: which register values are still needed at a given point in the program. The chapter should make that visible through a concrete failure, not only describe it abstractly.

Possible repair paths to show:

- Save and restore the register around the call.
- Reorder the code so the value is used before the call or recreated after it.
- Correct the callee contract if the analyzer lacks the intended register behaviour.

The worked example should make clear that register-care is catching a common assembly bug: a subroutine call colliding with a live register value the caller still depends on.

Preferred worked example shape:

- Caller uses `B` as a `djnz` loop counter.
- Inside the loop, the caller calls a subroutine.
- The callee occasionally or unconditionally clobbers `B`.
- The caller still needs `B` after the call so the loop can terminate correctly.
- Register-care audit infers or reports the callee contract with `clobbers B`.
- When register-care checking is enabled, AZM reports the conflict at the call site.

Repair choices to teach:

1. Fix the callee so it preserves `B`, if clobbering `B` was accidental.
2. Save and restore `B` around the call in the caller, for example with `push bc` / `pop bc`.
3. Change the caller so `B` is no longer live across the call.
4. Correct the contract only if the analyzer misunderstood the routine's true behaviour.

Chapter rewrite direction:

Build Chapter 6 around this example. Start with the bug, show why it is hard to spot by eye, run register-care, read the inferred contract, then repair the program. The conceptual material about liveness, caller/callee, contracts, clobbers and outputs should attach to the example as it becomes necessary.

### Chapter 6 prose quality is unacceptable

Current concern:

The chapter contains many sentences that read like generated notes rather than human teaching prose.

Example:

> Review generated contracts after the first run. Generated contracts are inferred. Verify them before relying on them in production source.

Problem:

- "Review" is being used as a bare imperative without context.
- The sentences are technically parseable but do not sound like natural explanation.
- The prose is fragmented and bullet-point-like.
- It states procedures without explaining why the reader is doing them.

Possible rewrite direction:

> After the first run, read the generated contract for each routine. AZM inferred those contracts from the instruction stream, so treat them as a draft until you have checked that they match the routine's intended interface.

Required audit:

- Do a full prose-quality audit of Chapter 6.
- Look for fragmentary imperative sentences, repeated note-card phrasing and bullet-point style presented as prose.
- Rewrite into complete explanatory paragraphs anchored by practical examples.
- If Chapter 6 is this weak, audit the following chapters for the same generated-prose pattern.

### Rebuild Chapter 6 from verified practical examples

Current concern:

The register-care chapter is too long, poorly written and may contain unverified claims. It should not be polished lightly; it may need to be stripped back and rebuilt.

Rewrite direction:

- Treat the current chapter as suspect until each technical claim is verified.
- Keep only what is known to be accurate.
- Rebuild the chapter from practical examples, starting with the `djnz`/`B` register collision case.
- Introduce concepts only when the example needs them: caller, callee, live register, clobber, contract, warning/error and repair.
- Avoid long abstract sections until the example has made the need for the concept clear.

AZMDoc caution:

Earlier notes said `;!` register-care blocks are normally machine-generated or machine-maintained. That may need nuance. Some contracts may be hand-authored or hand-reviewed. The rewrite should verify the intended workflow before stating a hard rule.

Possible rule:

> AZM can generate contract blocks, but generated blocks should be reviewed. Hand-written contracts are appropriate when you need to state the intended interface explicitly.

### Remove CI-pipeline framing

Current concern:

The register-care chapter talks too much about CI pipelines. That language feels out of place in an assembler manual and distracts from the register-management problem.

Suggested direction:

- Remove CI-pipeline framing from Chapter 6.
- Focus on local assembly, diagnostics and how the programmer fixes register conflicts.
- If `--rc error` or strict checking needs to be mentioned as useful for automated builds, keep it brief and move it to CLI/reference material.
- Do not make CI pipelines part of the main register-care teaching path.

## Chapter 7 — Op Declarations and Aliases

### Tighten the ops chapter

Current concern:

The ops chapter is better written than the register-care chapter, but it is still too long and rambling.

Suggested direction:

- Rewrite for sharper prose.
- Keep the thematic progression clear: what ops are, how operands work, overloads, labels inside ops, diagnostics and when to use them.
- Cut repeated explanations.
- Keep examples that introduce genuinely new behaviour.
- Move compatibility/alias material into a clearly separate second half or separate chapter if needed.
- Make the chapter feel progressive rather than exhaustive.

### Alias examples should show common forms only

Current concern:

The aliases section should not maintain a large exhaustive list of less common aliases. That creates clutter and another maintenance burden.

Suggested direction:

- Show only the common baseline forms as examples: `DB`, `EQU`, `ORG`, `DW` and `DS`.
- Use those examples to explain the compatibility purpose of aliases.
- Refer to the appendix or alias reference for the complete/current set.
- Avoid including many obscure aliases in the main chapter.

### Alias section should be much shorter

Current concern:

The alias section is far too long for the simplicity of the concept. Aliases are a compatibility mapping from legacy directive forms to canonical AZM directive forms. The current text keeps circling the concept instead of moving on.

Suggested direction:

- Reduce the alias section substantially.
- Define aliases once.
- Show a small example table with common forms only.
- Show one project-specific alias-file example if needed.
- State the limits briefly: aliases map directive heads, not full instruction syntax.
- Refer to the appendix/reference for details.
- Remove repeated explanations and extended compatibility discussion.

Progression test:

The section should be able to progress as:

1. Existing source may use old directive forms.
2. Aliases map those directive heads to canonical AZM directives.
3. Built-in aliases cover common forms.
4. Project alias files cover additional forms.
5. Aliases are only for directive heads.

Anything beyond that probably belongs in a reference appendix or should be cut.

## Chapter 8 — Diagnostics, Listings and Output

### Diagnostics chapter is too long and reference-like

Current concern:

The diagnostics chapter is generally useful, but it is too comprehensive and tedious. It reads like it is trying to be a reference rather than a guided chapter.

Stronger concern:

The chapter appears to contain a large amount of filler. Error codes and artifact details may be useful, but they do not need pages of explanatory prose in the main chapter.

Suggested direction:

- Tighten the chapter for information density.
- Keep the practical diagnostic-reading material.
- Move exhaustive lists or detailed reference material to an appendix.
- Remove `.lst` / listing material as noted elsewhere.
- Make the progression clearer: what a diagnostic is, how to read one, common error classes, what output files matter.
- Cut repeated or low-value examples.

Progression test:

The chapter should help the reader understand how to respond to assembler output. It should not try to document every possible diagnostic and artifact detail in the main flow.

Cut target:

Be willing to reduce the chapter to 20–30% of its current length if that is what remains after removing filler. Keep only:

- diagnostic format,
- how to read a diagnostic,
- one worked failing-build example,
- the practical meaning of warnings versus errors,
- a pointer to appendix/reference material for diagnostic codes and output flags.

Move to appendix/reference:

- diagnostic-code tables,
- exhaustive output artifact descriptions,
- detailed flag combinations,
- generated artifact reference material.

Immediate removal:

- Delete the entire Chapter 8 "Listings and symbol visibility" section.
- Delete all `.lst` / `--nolist` material from Chapter 8.
- Listing output is deprecated and should not be presented as a current feature.

## Editorial process note

The current task is to collect editorial feedback, not to rewrite the book.

Important correction:

- Do not edit Book 4 while the author is dictating notes.
- Accumulate the author's observations in this notes document.
- Keep implementation-facing ideas in `azm-implementation-notes.md`.
- Wait for explicit permission before changing chapter files.
- The only exception is a clearly requested change outside the book, such as updating the notes or writing-standard files.

Reason:

The author is still reading and forming a structural view of the manual. Premature fixes risk obscuring the larger pattern: topic order, repetition, missing definitions, weak prose and misplaced material need to be understood before a rewrite pass begins.

## Chapter 9 — Porting to AZM

### Delete the chapter

Current decision:

Chapter 9 does not appear to justify its place in the manual. The porting material is not needed as a standalone chapter and can be removed.

Reason:

The manual should teach AZM as the native language and toolchain, not spend a full chapter on migration framing or compatibility material. Compatibility topics that remain useful should be handled locally where they are needed, such as the aliases chapter or appendix reference material.

Suggested handling:

- Delete Chapter 9 as a main-flow chapter.
- Do not rewrite it unless a concrete retained purpose is identified.
- Preserve only genuinely useful reference material, if any, by moving it to an appendix or a short compatibility note.
- Remove cross-references to Chapter 9 during the eventual rewrite pass.
