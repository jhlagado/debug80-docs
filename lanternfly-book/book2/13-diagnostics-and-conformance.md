---
layout: default
title: "Diagnostics and Conformance"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 13
---

# Diagnostics and Conformance

Conformance makes separate Lanternfly implementations comparable. The
conformance contract defines stable diagnostic IDs, required runtime
faults, semantic fixtures and generated artifacts. Diagnostic wording may improve over time;
the ID is the stable identity of the rule.

## Conformance boundaries

The contract distinguishes three claims:

1. A **conforming front end** accepts and rejects source according to the
   language rules and produces typed program data, diagnostics and effect
   information.
2. A **target backend** preserves the typed program's behaviour for one named
   target profile and passes every applicable semantic vector.
3. A **host integration** supplies a valid manifest, preserves hosted-body
   control flow and composes diagnostics and source mappings.

A backend may omit a profile capability such as recursion or far aggregate
access, provided that it rejects every use rather than quietly assigning
different semantics.

K0, K1 and K2 are development milestones rather than conformance levels.
`D-STAGE-001` reports a construct assigned to a later milestone. It is a
development-stage error, not a language error, and disappears as
implementation progresses.

## Compile-time errors

| ID               | Rejected condition                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `E-CONFIG-001`   | Malformed host manifest or target profile, unsupported version, missing field or unknown field                       |
| `E-CONFIG-002`   | Duplicate or unresolved configuration ID, invalid span, layout, type composition or host/target combination          |
| `E-LEX-001`      | Invalid token or numeric literal, unterminated literal, or physical newline in quoted text                           |
| `E-PARSE-001`    | Token sequence does not match the grammar                                                                            |
| `E-TEXT-001`     | Invalid character or string literal, escape, encoding, embedded NUL or payload size                                  |
| `E-TEXT-002`     | Invalid string capacity, constant copy or append, operation, parameter shape or access to the sealed representation  |
| `E-NAME-001`     | Unknown name, use before declaration, duplicate declaration, forbidden shadowing or case-only collision              |
| `E-NAME-002`     | Reserved keyword, built-in type or operation used as a declaration name                                              |
| `E-NAME-003`     | Record, enum or range type and callable routine share a case-insensitive name                                        |
| `E-TYPE-001`     | Integer operands lack matching types or a permitted value-preserving widening                                        |
| `E-TYPE-002`     | Boolean/integer mixing, non-Boolean condition, invalid Boolean ordering or deferred Boolean conversion               |
| `E-TYPE-003`     | Invalid assignment, argument or return conversion, including an invalid `writeText` source or `readLine` destination |
| `E-TYPE-004`     | A `unit` invocation, `clear`, `fill` or `append` appears where a value is required                                   |
| `E-TYPE-005`     | Invalid enum representation, subrange, ordinal family or constant ordinal value                                      |
| `E-CONST-001`    | Constant zero divisor, negative shift, negative exponent or negative square root                                     |
| `E-CONST-002`    | A constant expression reads storage, calls a routine, uses a provider-bound address or has another runtime effect    |
| `E-CONST-004`    | Constant declaration omits its explicit type                                                                         |
| `E-INIT-001`     | Array initializer has the wrong rank, shape or element count                                                         |
| `E-INIT-002`     | Record initializer has an unknown, duplicate or missing field                                                        |
| `E-INIT-004`     | A target cannot preload or write a placed initializer                                                                |
| `E-INIT-005`     | A volatile or device initializer requires an unsupported startup write                                               |
| `E-INIT-006`     | Uninitialized compiler-owned storage has no valid all-zero representation                                            |
| `E-LAYOUT-001`   | Array index domain is empty, reversed, nonconstant or otherwise invalid                                              |
| `E-LAYOUT-003`   | Invalid `size`, `count`, `lower`, `upper` or `offset` operand, dimension or field path                               |
| `E-PATH-001`     | Constant index is out of range or an index has an incompatible ordinal type                                          |
| `E-PATH-002`     | Volatile aggregate copy cannot be proven non-overlapping                                                             |
| `E-PATH-003`     | Array access supplies the wrong number of indices                                                                    |
| `E-COPY-001`     | Aggregate assignment has an incompatible record type, element type, rank or dimensions                               |
| `E-COPY-002`     | Assignment attempts to modify constant storage                                                                       |
| `E-COPY-003`     | Invalid `clear` representation or invalid `fill` target or value                                                     |
| `E-ALIAS-001`    | Alias target is not an exact string, record or array storage path, or is constant or volatile                        |
| `E-ALIAS-002`    | Invalid aggregate parameter storage class or incompatible argument storage                                           |
| `E-LOCAL-001`    | Local `var` attempts to own a counted string, record or fixed array                                                  |
| `E-LOCAL-002`    | Local declaration uses `volatile` or `at`                                                                            |
| `E-LOCAL-003`    | Local alias declares a scalar or opaque-address type                                                                 |
| `E-CONTROL-001`  | Non-ordinal selection, or invalid, duplicate, overlapping or incompatible case value or range                        |
| `E-CONTROL-002`  | Invalid or volatile counted-loop control, step, start, boundary or continuing value                                  |
| `E-CONTROL-003`  | Counted-loop body may write its control variable directly or through a call or native effect                         |
| `E-CONTROL-004`  | `exit` or `continue` has no enclosing loop                                                                           |
| `E-CONTROL-005`  | Invalid `for each` collection or binding                                                                             |
| `E-RETURN-001`   | Return form conflicts with the routine result, or a result-bearing path reaches `end`                                |
| `E-RETURN-002`   | Hosted-body `return` supplies a value                                                                                |
| `E-CALL-001`     | Aggregate argument is a temporary, general expression, constant or volatile object                                   |
| `E-CALL-002`     | A source call-graph cycle, direct or through forward declarations, occurs on a profile without recursion             |
| `E-FORWARD-001`  | Module ends with a forward declaration that has no completing body                                                   |
| `E-FORWARD-002`  | Completing header differs from its forward declaration in name, export status, parameters, result form or `fails` clause |
| `E-MODULE-001`   | Root or import path lacks exact lowercase `.lafy`, or an import cycle, resolution or export collision occurs         |
| `E-MODULE-002`   | Exported declaration exposes a private type                                                                          |
| `E-MODULE-003`   | An `import` appears outside the module's contiguous import prefix                                                    |
| `E-EXTERN-001`   | External routine lacks a supported binding or compatible ABI                                                         |
| `E-EXTERN-002`   | External routine has a Lanternfly body or is selected as entry                                                       |
| `E-BOUNDARY-001` | Native or host contract cannot guarantee required values, storage, string invariants or callback restrictions        |
| `E-ENTRY-001`    | Executable manifest lacks one valid parameterless, result-free, non-failable source-defined entry routine            |
| `E-TARGET-001`   | Required native service, standard-module binding, operation, address class or capability target requirement is unavailable or unsatisfied |
| `E-CAP-001`      | A capability-gated word or facility is mentioned without the module's own enabling standard capability import        |
| `E-ASM-001`      | Assembly block is unclosed or appears in an invalid position                                                         |
| `E-ASM-002`      | Target lacks a compatible assembly-fragment pipeline                                                                 |
| `E-FAIL-001`     | Failable invocation unconsumed, or nested inside a larger expression (Provisional)                                   |
| `E-FAIL-002`     | `fail` or `or fail` in a routine without a `fails` clause, or propagation between different error sets (Provisional) |
| `E-FAIL-003`     | Invalid `fails` operand, `fail` operand outside the declared set, or invalid failure default (Provisional)           |
| `E-FAIL-004`     | Invalid `on error` binding, colliding binding name, or a declaration-bound block that can complete normally (Provisional) |
| `E-FAIL-005`     | `fails` on an external routine, or a failure form inside a hosted body (Provisional)                                 |
| `E-DEFER-001`    | `defer` outside routine top level or in a hosted body, or a deferred statement that is not infallible (Provisional)  |
| `E-PLACE-001`    | Source or build placement cannot fit a compatible target memory region                                               |
| `E-PLACE-002`    | Emitted bytes, reserved addresses or symbols disagree with the validated placement plan                              |
| `E-MAP-001`      | Generated-source mapping cannot be composed because an anchor, fragment or provenance span is invalid                |

Every diagnostic identifies the input that caused it. Source errors include
file, line and column; configuration errors identify the manifest or profile
field. Cycles and dependency failures include the relevant path, and hosted
diagnostics identify their containing body.

## Default warnings

| ID              | Condition                                                                                      | Policy                   |
| --------------- | ---------------------------------------------------------------------------------------------- | ------------------------ |
| `W-CONVERT-001` | Destination conversion narrows or changes signedness without proof or the round-trip exemption | May be promoted to error |
| `W-EXPR-001`    | Pure expression statement discards its result                                                  | May be promoted to error |
| `W-UNUSED-001`  | Private declaration is unused                                                                  | Project policy           |
| `W-CONTROL-001` | Statement or branch is unreachable                                                             | Project policy           |
| `W-COST-001`    | Costly helper appears in a known hot loop                                                      | Target or budget policy  |
| `W-COST-002`    | Static object, aggregate copy, frame or startup initializer is unusually large                 | Target or budget policy  |
| `W-ADDRESS-001` | Near/far conversion incurs mapping or bank-switch cost                                         | Target policy            |
| `W-NATIVE-001`  | Native boundary uses conservative effects because its contract is incomplete                   | May be promoted to error |
| `W-ASM-001`     | Statement assembly receives the conservative effect and clobber contract                       | May be promoted to error |

A discarded routine result alone does not make the call pure. `W-ASM-001`
suppresses `W-NATIVE-001` for the same statement block. Module-level assembly
has no execution point and receives neither runtime-effect warning.

## Runtime faults

Runtime faults do not return to the expression that failed. Debug artifacts
preserve the fault class and source location.

| ID                  | Runtime condition                                               |
| ------------------- | --------------------------------------------------------------- |
| `F-BOUNDS`          | Dynamic array index lies outside its extent                     |
| `F-RANGE`           | Checked ordinal or counted-string destination rejects its value |
| `F-DIV-ZERO`        | Runtime divisor or `mod` divisor is zero                        |
| `F-NEGATIVE-SHIFT`  | Runtime shift count is negative                                 |
| `F-NEGATIVE-POWER`  | Runtime power exponent is negative                              |
| `F-NEGATIVE-SQRT`   | Runtime square-root operand is negative                         |
| `F-LOOP-RANGE`      | A continuing counted-loop value cannot fit the control type     |
| `F-INVALID-BOOLEAN` | Imported or native Boolean representation is not zero or one    |
| `F-INVALID-STRING`  | Native write leaves an invalid string representation            |

Overshifts have defined zero or sign-filled results. Ordinary fixed-width
arithmetic overflow wraps.

## Minimum positive programs

Every claimed backend must eventually run the applicable programs and compare
their final storage, ordered service traces and fault traces:

1. Counter;
2. Trail;
3. Ordinal domains;
4. Skyfall numeric case;
5. Rushlight numeric case;
6. Snake;
7. Tetro collision;
8. Tetro collapse;
9. Pacmo;
10. TMS9918 boundary;
11. text, including an external print-style call on the terminated payload;
12. standard character, text and bounded line I/O through explicitly imported
    modules, when claimed by the target profile;
13. Hosted return;
14. error handling — a failable parser, propagation, a default, `on error`
    handling and `defer` cleanup order (Provisional).

The conformance contract also requires focused vectors for integer and ordinal
boundaries, conversion, constant folding, short and long string forms, exact
layouts, bounds and range checks, aliases, loops, evaluation order, imports,
initialization, native boundaries and hosted execution.

## Required artifacts

A source-generating backend emits:

- canonical generated substrate source;
- original-to-generated provenance;
- generated-to-machine mapping when available;
- typed symbols and exact layouts;
- string literal payloads, string layouts, placement classes and source-byte
  mappings;
- selected helper and import list;
- external bindings and generated ABI adapters;
- the validated placement plan and final occupancy and symbol comparison;
- read, write, call, fault and device-I/O summary;
- startup-initialization effects;
- routine-frame and static-scratch allocation;
- module-assembly emission and provenance ranges;
- statement-assembly ranges and conservative runtime effects;
- anchored generated fragments and composed Lanternfly-to-machine mappings;
- target assumptions and an optional cost report.

A host integration also reports hosted early-return paths, local-frame or
static-scratch strategy, and any non-overlap assumption used to justify static
scratch.

One source node may map to several generated or machine ranges. Backend and
assembler diagnostics retain generated context while mapping back to the
responsible Lanternfly source location.

## Deferred features

The following facilities remain outside the first implementation. A
conforming implementation rejects them rather than accepting them with
unstated semantics:

- floating point;
- dynamic allocation, heap storage and garbage collection;
- owning aggregate automatic locals;
- aggregate return by value;
- source-level pointers, reference values, address-of and dereference;
- stored, returned, nullable or scalar aliases;
- general read-only, output and in/out aggregate parameters, apart from the
  compiler-defined text carriers used by standard `writeText` and `readLine`;
- bit fields and bank-spanning arrays;
- indirect calls, procedure values and closures;
- native callbacks into generated Lanternfly code;
- unrestricted labels and `goto`;
- exceptions;
- generics and operator overloading;
- resizable or heap-backed strings;
- general streams, file operations and an operating-system interface;
- implicit byte-buffer-to-string conversion;
- unchecked indexing as conforming execution.

Recursion is accepted only by a profile that declares and tests that
capability. The Provisional failable routines of
[chapter 14](14-error-handling.md) cover expected failures; they do not
make runtime faults interceptable.

## Open and provisional design

The open design queue includes:

- bare versus named block endings;
- parser evidence for case-insensitive names;
- placement sections beyond `at`;
- syntax for narrowing native effects;
- callback declarations;
- read-only aggregate parameters and general bounded views;
- post-test loops or named outer-loop exits;
- module aliases and re-exports;
- `float32` and `float48` capability semantics, including representation,
  rounding, conversions, comparisons and literal syntax.

Until a later edition changes them, the rules in this manual are the
implementation baseline, with [chapter 14](14-error-handling.md)'s
error handling marked provisional.
