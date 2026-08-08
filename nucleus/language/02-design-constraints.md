---
layout: "default"
title: "2. Design constraints"
parent: "Nucleus 0.1 Language Specification"
nav_order: 2
pageClass: "nucleus-specification"
---
[← 1. Status and conformance](01-status-and-conformance.md) · [Contents](./) · [3. Source text and lexical rules →](03-source-text-and-lexical-rules.md)

<div id="2-design-constraints" class="nucleus-source-anchor"></div>

# 2. Design constraints

<div id="21-scope" class="nucleus-source-anchor"></div>

## 2.1 Scope

This chapter records three kinds of constraint: properties preserved by the Nucleus 0.1 language design, acceptance gates for the first handwritten Z80 compiler, and evidence required before a provisional feature enters the language. Later chapters define the source language and its semantics. The separate Nucleus VM Specification defines the bytecode machine.

The implementation gates in this chapter apply to the first compiler project. They are not language-conformance requirements for every Nucleus compiler. A compiler may conform to Nucleus 0.1 on another host without using Z80 code, banked memory, or the same internal architecture.

Nucleus 0.1 is one language. Measurements may change the draft before it is frozen, but they do not create language levels, implementation-selected syntax profiles, or optional dialects. Each candidate is either admitted to the single language or omitted.

<div id="22-language-shaping-constraints" class="nucleus-source-anchor"></div>

## 2.2 Language-shaping constraints

Nucleus remains a safe, practical language for routine TEC-1 programs. Its minimum programming model includes `u8`, `u16`, and Boolean values; formal arguments; named scalar local variables; routines with no result or one typed result; fixed-layout records; checked fixed arrays; bounded strings; complete positional static initializers; exact-type aggregate assignment; assignment and calls; `if`/`elseif`/`else`; `while`; counted `for`; `return`; and the unlabeled, innermost-loop forms of `exit` and `continue`. Silently removing one of these requirements does not make an oversized compiler acceptable. If a faithful implementation cannot fit, that result requires compiler-architecture redesign or rejection of the architecture hypothesis.

The language design uses deterministic parsing with canonical forms, minimal lookahead, and no backtracking. A smaller production count is useful only when it preserves the required programming model. Grammar terseness is not an independent design goal.

A conforming compiler must perform every source-safety check for which compilation provides sufficient information. Safety conditions that depend on runtime values must produce defined traps. Source code has no raw pointer arithmetic or unchecked reinterpretation. Later chapters define the checks, traps, and source types.

Every implementation capacity must have an explicit limit and a diagnostic for excess. Exhausting a symbol table, input limit, nesting limit, or other bounded resource must not alter program meaning or produce silently incorrect output.

<div id="23-compiler-core-gate" class="nucleus-source-anchor"></div>

## 2.3 Compiler-core gate

Project acceptance requires the first compiler's executable core and every immutable table or constant required while compiling to fit together in one 16 KiB bank. Placing required code or immutable data in another bank does not satisfy this gate.

For each tested configuration, the compiler-core total includes the front end, the active emitter, and all immutable data that either component requires. A mutually exclusive native or later backend may have a separate total. The report identifies the resident configuration and includes every shared or required component.

The first implementation may use a CP/M-like 64 KiB address-space model as its initial abstraction. This model does not bind Nucleus source semantics to a particular TEC-1 memory map. TEC-1 banking motivates the one-bank compiler-core gate; additional banks may hold separately budgeted components, but they are not a fallback for an oversized core.

<div id="24-separate-resource-accounts" class="nucleus-source-anchor"></div>

## 2.4 Separate resource accounts

Resources outside the compiler-core gate may use other RAM or banks where the platform permits, but they remain bounded, measured, and reported. Separate accounting does not make a resource free or unlimited.

| Account                     | Required report                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Compiler core               | Executable code and required immutable data for the tested front end and active emitter, measured against the 16 KiB gate. |
| Writable compiler workspace | Peak live bytes, including lexical, parsing, name, type, lowering, diagnostic, and emission state.                         |
| Generated output            | Emitted bytecode or native program bytes, separate from compiler storage.                                                  |
| VM/interpreter              | Executable code, immutable data, writable state, and relevant execution cost.                                              |
| Native or later backend     | A separate total for each mutually exclusive configuration, including its required constants and workspace.                |
| Execution                   | A stated measure, such as instruction count or cycles, for representative emitted programs.                                |

Project accounting counts each shared component once and assigns it to an identified account. Reports distinguish resident components, overlays, and mutually exclusive configurations. Peak workspace is the maximum simultaneously live storage, not the sum of buffers whose lifetimes do not overlap.

<div id="25-streaming-compilation-model" class="nucleus-source-anchor"></div>

## 2.5 Streaming compilation model

Bulk storage may be available but slow. The primary bytecode path consumes the ordered multipart compilation stream defined by Chapter 4 and emits one logical bytecode stream. A platform may materialize either stream in external storage. Physical source discovery, ordering, and transport do not require the compiler to retain the whole program in memory.

The first compiler is handwritten Z80 and uses streaming, single-pass compilation wherever the language semantics permit it. Declarations precede use. An explicit forward routine signature supplies the necessary exception without requiring a later whole-program pass. Because that declaration is the sole signature, the compiler retains its parameter names until the abbreviated body begins and performs no body-signature comparison. Its compiler-core and workspace effects remain unmeasured.

The architecture excludes an abstract syntax tree, global type inference, whole-program optimization, and unbounded buffering from the first compiler. The compiler may retain bounded state required for declarations, scopes, forward signatures, control-flow fixups, and emission, provided each capacity is explicit and measured.

<div id="26-semantic-operations-and-the-vm-boundary" class="nucleus-source-anchor"></div>

## 2.6 Semantic operations and the VM boundary

Compiler simplicity has priority over VM execution speed. The primary target is a regular vocabulary of checked semantic operations serialized as compact bytecode. Target-specific irregularity belongs in the separately budgeted VM or a later backend only when measurement shows that placement reduces total front-end machinery.

Structured control lowers to ordinary semantic operations; no dedicated high-level control opcode is required. The bytecode front end initially performs no Z80 register allocation, native instruction selection, branch shortening, relocation planning, native calling-convention analysis, or peephole optimization. A later direct-Z80 backend may consume the same semantic operations as they are produced. Its independent measurement covers code, constants, workspace, output, and execution cost.

The companion Nucleus VM Specification fixes the NVM 0.1 organization, including its memory-backed virtual-slot file, caller-save activations, and bytecode encoding. Those choices implement but do not alter the source semantics. This chapter fixes no virtual-slot count, page layout, slot width, or opcode encoding for another conforming backend.

<div id="27-system-boundary-and-portability" class="nucleus-source-anchor"></div>

## 2.7 System boundary and portability

The initial system boundary contains only services that the compiler and VM demonstrably require: input, output, termination, trap reporting, and bulk-storage access. Each additional service requires measured need.

The semantic-operation boundary may support later native or non-Z80 backends where target neutrality has no material cost against the TEC-1 constraints. Portability does not justify growth that causes the first compiler to fail its core gate.

<div id="28-evidence-and-feature-admission" class="nucleus-source-anchor"></div>

## 2.8 Evidence and feature admission

Project reports assign every size, storage, or performance claim one of these evidence classes:

- **Measured:** obtained from an identified build or run with the method recorded.
- **Projected:** calculated from measured components under stated assumptions.
- **Hypothesis:** an expectation not yet tested by an implementation.

A candidate's admission record reports its incremental compiler-core code, required immutable data, peak writable workspace, VM or backend cost, effect on emitted programs, and total-system trade. Source-line count, host executable size, and an opcode sketch are not substitutes for target measurements. Before Nucleus 0.1 is frozen, the project either admits the candidate to the one normative language or omits it.

Nucleus 0.1 admits the explicit recoverable-error mechanism in Chapter 14. The implementation ledger still records its compiler-core, immutable-data, workspace, emitted-code, and runtime costs. General exceptions, stack unwinding, destructors, `finally`, and `defer` remain excluded.

Nucleus 0.1 admits recursive routine calls. The first implementation may stage their construction while it measures activation storage, re-entry state, depth limits, and failure behaviour, but staging does not create a non-recursive language profile. Chapter 13 defines the source semantics, and Chapter 15 defines activation-capacity failure.

Several source-preserving economies belong in the first implementation rather than in language variants. The first compiler uses one precedence-driven loop for binary expressions and classifies a completed call expression before admitting `or fail`; it does not duplicate the precedence ladder or branch on a routine signature before parsing the call. Interned type ordinals versus compact structural metadata stored directly in symbols remains a measured representation choice. The VM implementation likewise measures shared handlers or compiler selection of an equivalent word-width operation where canonical `u8` carriers make the complete state transition identical. None of these choices may change accepted source, arithmetic width, diagnostics required by this specification, array aliases, or the assigned NVM opcode meanings.

<div id="29-decision-boundary-and-failure-conditions" class="nucleus-source-anchor"></div>

## 2.9 Decision boundary and failure conditions

An architecture decision requires measurements from an identified compiler configuration and representative accepted and rejected source. The report includes the complete compiler-core total, immutable-data contribution, peak writable workspace, VM or backend totals, emitted-program size, execution cost under a stated method, capacity limits, and diagnostics produced when those limits are exceeded. Candidate comparisons use equivalent source semantics and accounting boundaries.

The decision record labels every value as Measured, Projected, or Hypothesis and states the assumptions behind projections. Unmeasured values remain open rather than being replaced with invented byte estimates.

The first implementation is not required to compile itself. The project may evaluate self-hosting only after measurements show that the handwritten compiler satisfies its budget and conformance goals. Failure to preserve the minimum programming model, diagnose bounded-resource exhaustion, or keep required compiler code and constants within the one-bank gate rejects the tested architecture; it does not justify a weaker, unnamed language profile.
