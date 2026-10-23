---
title: Chapter outline
parent: Origo
nav_order: 1
---

# Chapter outline

The proposed progression starts with a desired outcome, makes the requirements
precise and then examines how those requirements can be reused. Machine details
follow the logical rule they represent. This is an outline, not a list of
completed chapters or implemented language features.

## Part I: defining the software

### 1. A result worth specifying

**Purpose.** Establish the work a specification author does before introducing
notation. A small COPY utility supplies the running example: copying a file
to a new name is easy to describe until the destination exists or storage fills.

**Development.** Begin with the ordinary successful copy. Add source
preservation, identity of contents, overwrite policy and failure behaviour.
Distinguish decisions the author must make from algorithm choices left open.

**Example and figure.** A before-and-after directory with source and destination
bytes. A failure table records what survives each outcome. It includes an
explicit undecided overwrite policy rather than inventing a product decision.

**Connection.** Once the required result is clear, several implementations may
qualify. Chapter 2 describes that freedom.

### 2. The space of acceptable implementations

**Purpose.** Explain contracts, holes, candidates and incumbents through a
replacement attempt. Introduce a generator only after explaining its task.

**Development.** Compare two copy strategies against the same outcome and
memory limit. Explain which changes preserve the software and which alter it.
Introduce resource constraints as part of the required result.

**Example and figure.** A requirement table with two hypothetical candidates.
A diagram places generation inside the specification and acceptance boundaries.
Candidate figures are illustrative until measurements exist.

### 3. Evidence for acceptance

**Purpose.** Separate a requirement from evidence that it has been met.

**Development.** Follow a copy that passes ordinary examples but fails on an
empty file or a full destination disk. Introduce withheld cases, independent
expectations and counterexamples. Explain repeatability, coverage and proof as
different properties. Tests can expose a specification mistake too.

**Example and figure.** A missing-case investigation followed by the verified
Origo negative-zero case study. A coverage table separates stated rules,
executed checks and remaining assumptions.

## Part II: precise statements

### 4. Values, names and conditions

**Purpose.** Introduce the first implemented experimental fragment through a
bounded value, before describing a register or address.

**Development.** Explain length, capacity and an unsigned byte. Introduce names,
comparisons and conjunction. Then connect those names to physical storage.
Distinguish a caller's precondition from a runtime error the operation must
handle. Use the frozen LR-01A grammar and its actual diagnostics.

**Example and figure.** Walk through `old_length <= capacity` with admitted and
excluded calls. A two-layer figure connects logical names to registers and
bytes. Run the snippets through the experimental parser before publication.

### 5. Outcomes and permitted change

**Purpose.** Describe a complete operation rather than just its admitted inputs.

**Development.** Return to COPY: success, refusal and I/O failure need distinct
observable results. Introduce entry and exit state, preserved data and permitted
effects. Compare these needs with the current language's entry-only scope.

**Example and figure.** An outcome table and state snapshots. Postcondition
snippets remain explicitly proposed until their semantics are implemented.

## Part III: building with contracts

### 6. Defining a valid object once

**Purpose.** Make abstraction solve a demonstrated repetition problem.

**Development.** Repeat a bounded-string condition across several contracts,
then factor it into a named predicate. Investigate parameters and constrained
types. Separate an object's logical capacity from its memory layout. Explain
which operation boundaries require validity.

**Example and figure.** The repeated and factored forms side by side, expanded
back to the same obligations. A record figure distinguishes the length byte
from payload capacity. These abstractions are research proposals.

### 7. A guarantee passed to a caller

**Purpose.** Explain composition through an object transferred between routines.

**Development.** Follow a string through a length-setting operation into a
comparison. List the producer's guarantees and both consumer operands'
requirements. Include identity, intervening changes and the other operand.
Distinguish an abstract implication from testing machine executions.

**Example and figure.** A handover timeline with valid and broken transfers.
The chapter awaits an accepted composition experiment and its results.

### 8. Obligations over time

**Purpose.** Extend conditions at a boundary to a protocol across events.

**Development.** Start with a small output buffer: append, write, release and
reuse. Explain why authoritative output must be persisted while cached copies
can be discarded. Introduce state transitions and reference lifetimes only as
needed to describe safe reuse.

**Example and figure.** Legal and illegal event traces, including a failed disk
write. A timeline marks live references and permitted reuse. The language
construct and checker are proposed research, not existing features.

## Part IV: the compiler as an experiment

### 9. A machine with finite room

**Purpose.** Give the compiler constraints a physical explanation.

**Development.** Introduce the application memory budget, resident code,
overlays and the source window. Follow source bytes and generated records
through compilation. Explain offsets before discussing moving references.

**Example and figure.** A layered memory map and a sequence of window positions.
Use a frozen landed build for exact addresses. Show active development as a
separate design state.

### 10. Data across a change of program

**Purpose.** Combine identity, lifetimes, effects and resource constraints in an
architectural example.

**Development.** Compare intermediate disk files with the proposed memory-file
handover. Trace what survives replacing compiler code with linker code. Explain
the required equivalence and disk fallback. Separate measured stages from the
complete architecture's modelled benefit.

**Example and figure.** Before, during and after handover memory maps, with
retained data identified consistently. A record-level comparison illustrates
the equivalence to be checked. The chapter depends on the implementation's
eventual evidence.

### 11. Revising a specification from evidence

**Purpose.** Present the method as an inspectable sequence of decisions.

**Development.** Follow a failed candidate from observation through diagnosis
to a revised requirement and new check. Compare a missing interface with an
implementation mistake and a faulty budget. Explain protected acceptance tools
and why the incumbent can also be wrong.

**Example and figure.** The documented table-bound and stack-accounting cases.
A decision record connects each revision to its evidence without treating a
higher pass rate as proof of completeness.

### 12. An authoring language people can use

**Purpose.** Assess whether the accumulated constructs justify their cost.

**Development.** Revisit the opening COPY specification. Investigate how much
repetition named definitions, parameters and composition remove. Identify the
bindings a tool can derive and decisions an author must review. Compare
authoring effort, clarity and checkable obligations alongside generation results.

**Example and figure.** A before-and-after specification and an explicit list of
obligations still in English. The conclusion must follow the experiments,
including a negative result if abstraction provides little practical benefit.

## First writing increment

Draft chapters 1 and 2 after reviewing this outline. Establish COPY's example
policies and check its state tables first. Keep the rest as chapter plans until
their examples and evidence support full treatment. A short glossary can grow
from terms already introduced in the text. A later reference appendix should
contain only versioned notation with defined semantics.
