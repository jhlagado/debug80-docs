---
layout: "default"
title: "20. Feature ledger"
parent: "Nucleus 0.1 Language Specification"
nav_order: 20
pageClass: "nucleus-specification"
---
[← 19. Runtime semantics](19-runtime-semantics.md) · [Contents](./) · [21. Conformance examples →](21-conformance-examples.md)

<div id="20-feature-ledger" class="nucleus-source-anchor"></div>

# 20. Feature ledger

<div id="201-required-nucleus-01-language" class="nucleus-source-anchor"></div>

## 20.1 Required Nucleus 0.1 language

The following mechanisms are required in the single Nucleus 0.1 language:

| Area         | Required forms and rules                                                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | ASCII-compatible bytes, `//` comments, logical newlines, case-insensitive exact names, decimal integers, byte characters, bounded string literals, fixed punctuation.                    |
| Structure    | One ordered compilation unit, declaration before use, exact forwards, fixed `main()` entry, no executable top level.                                                                     |
| Types        | `u8`, `u16`, `boolean`, nominal fixed records, checked fixed arrays, mutable bounded `string[N]` with current length and byte indexing, exact aggregate aliases.                         |
| Declarations | Scalar constants, program variables, record fields, formal parameters, contiguous scalar and aggregate-alias locals, routine definitions and forwards.                                   |
| Expressions  | Calls, checked array and bounded-string indexing, field selection and string `.length`, explicit integer conversions, unary `+`/`-`, arithmetic, one comparison, `not`, `and`, and `or`. |
| Statements   | Scalar assignment, name-led calls, `return`, `fail`, `exit`, and `continue`.                                                                                                             |
| Control      | Flat `if`/`elseif`/`else`, pre-test `while`, counted `for` with `to` or `until` and optional constant `step`.                                                                            |
| Routines     | Formal arguments, named locals, no result or one typed result, early return, direct and mutual recursion, forward signatures with exact type shape.                                      |
| Failure      | Explicit `fails`, `fail`, `or fail`, result-free propagating return, and statement-bound `on error`; required safety traps remain separate.                                              |
| System       | Nucleus System Services 0.1 with deterministic initial cursors and output writes, normal entry return, unhandled-error termination, and stable trap reasons.                             |

No conforming compiler may expose a standard profile that omits one of these mechanisms.

<div id="202-implementation-defined-limits" class="nucleus-source-anchor"></div>

## 20.2 Implementation-defined limits

An implementation selects and documents capacities, not syntax or semantics. Permitted limits include source and identifier length, symbol and type counts, record fields, array and string storage capacity below a target's available resources, parameters, locals, nesting, fixups, initializer elements, simultaneous activation depth, and activation-storage consumption. Every limit must be high enough to compile and execute the complete accepted Chapter 21 programs under their stated inputs. A compile-time excess above that floor produces a capacity diagnostic; runtime activation-capacity excess above that floor traps at runtime.

Diagnostic wording, internal representations, bytecode or native encoding, physical layout, service transport, and the external presentation of status are implementation-defined where earlier chapters leave them to an implementation contract. These choices must preserve the source rules.

<div id="203-post-01-candidates" class="nucleus-source-anchor"></div>

## 20.3 Post-0.1 candidates

These forms are omitted from 0.1 and may be reconsidered only by a future language revision after measured admission:

The maintainer of this language specification owns source-language admission. The maintainers of the VM specification and System Services contract co-own decisions that change their respective interfaces.

| Candidate                                                                                             | Required decision evidence and owner                                                                                                                           |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$` hexadecimal integer literals                                                                      | Scanner, keyword/table, diagnostic, and compiler-core cost; language-specification maintainer in a future revision.                                            |
| Dense nonnegative selection                                                                           | Compiler cost versus emitted jump-table savings on representative programs; language-specification maintainer in a future revision.                            |
| Open arrays, slices, or capacity-erased string views                                                  | Source typing, multiword carrier, lifetime, call/result ABI, compiler and VM cost; language- and VM-specification maintainers in coordinated future revisions. |
| Explicit bulk aggregate operations or bounded-string growth, resize, append, and bulk-copy operations | Typed contract, alias effects, emitted cost, and reusable-program evidence; language-specification maintainer in a future revision.                            |
| Additional system services                                                                            | Portable typed contract and complete compiler, runtime, and target cost; System Services maintainer in a future service revision.                              |

These candidates are not provisional 0.1 syntax. Extensions may prototype them only under Section 1.7.

<div id="204-excluded-mechanisms" class="nucleus-source-anchor"></div>

## 20.4 Excluded mechanisms

Nucleus 0.1 excludes language levels and compiler-selected profiles; modules, imports, namespaces, macros, and textual includes; raw pointers, address arithmetic, memory or port access, inline assembly, arbitrary native calls, and unrestricted casts; enumeration, subrange, set, union, variant, overlaid, generic, heap, resizable, open-array, slice, and dynamic types; aggregate constants, aggregate copy, local owned aggregates, destructuring, inferred declarations, nested routines, overloads, routine values, callbacks, indirect calls, parameter modes, and multiple results.

It also excludes assignment expressions, chained comparisons, conditional expressions, general expression statements, `call` and `then` keywords, `select`/`case`, pattern matching, repeat/do loops, `for in`, omitted counted-loop operands, labels, goto, labelled exit, exceptions, throw/catch, unwinding, destructors, `finally`, `defer`, resumable traps, and runtime type tags.

Implementation alternatives such as stack, virtual-register, or hybrid bytecode; direct native emission; register allocation; and physical calling convention are not source features. The VM specification records the selected VM mechanisms, and project decisions use measurements without creating Nucleus dialects.
