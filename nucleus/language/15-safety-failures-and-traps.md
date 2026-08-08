---
layout: "default"
title: "15. Safety failures and traps"
parent: "Nucleus 0.1 Language Specification"
nav_order: 15
pageClass: "nucleus-specification"
---
[← 14. Recoverable errors](14-recoverable-errors.md) · [Contents](./) · [16. System boundary →](16-system-boundary.md)

<div id="15-safety-failures-and-traps" class="nucleus-source-anchor"></div>

# 15. Safety failures and traps

<div id="151-trap-semantics" class="nucleus-source-anchor"></div>

## 15.1 Trap semantics

A **trap** terminates Nucleus source execution immediately. Source code cannot catch, handle, resume, mask, or convert it to a recoverable error. A trap performs no stack unwinding and runs no source cleanup action.

The implementation reports a stable symbolic trap reason and the best available location for the operation that failed. When source mapping is available, the report must identify the source span. Otherwise, it must identify the bytecode or native instruction location. Numeric trap encodings, transport records, monitor integration, and physical output belong to the VM specification or backend contract.

Effects completed before the failing operation remain observable. The failing operation performs no result store unless its rule below says otherwise. No later source operation executes.

<div id="152-required-trap-reasons" class="nucleus-source-anchor"></div>

## 15.2 Required trap reasons

Nucleus 0.1 defines these trap reasons:

| Reason                | Condition and point                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bounds`              | A dynamic fixed-array index or bounded-string byte index is outside zero through current length minus one. The trap precedes the read, write, or alias formation. |
| `narrowing`           | A dynamic checked `u8(...)` operand exceeds 255. The trap precedes production or storage of the narrowed result.                                                  |
| `division-by-zero`    | A runtime divisor is zero. The trap precedes production of a quotient.                                                                                            |
| `loop-range`          | A counted-loop next value would continue but does not fit the counter type. The trap precedes the counter store.                                                  |
| `activation-capacity` | A call would exceed a published activation-depth or activation-storage limit. The trap occurs after argument evaluation and before the new activation begins.     |
| `unhandled-error`     | `main` returns failure. The report includes the returned `u8` code.                                                                                               |

A conforming implementation may use more detailed internal causes, but it must preserve these public reason identities. It must not report a required reason as another reason merely because two checks share a helper.

<div id="153-compile-time-proof" class="nucleus-source-anchor"></div>

## 15.3 Compile-time proof

When the compiler proves a bounds, narrowing, or division failure from source constants, the source is invalid and compilation produces a diagnostic. It must not emit an executable whose first relevant action is a guaranteed trap. Counted-loop `loop-range` failure is different: it remains a runtime trap because earlier control flow in the loop body may prevent execution from reaching the increment. When the compiler proves an operation safe, it may omit the runtime check.

If validity depends on runtime data, the program remains conforming and the check is part of its specified execution. Optimization must preserve the trap reason, ordering, and prior observable effects.

<div id="154-ordering-details" class="nucleus-source-anchor"></div>

## 15.4 Ordering details

Chapter 9's left-to-right rules determine which of several possible failures occurs first. Assignment checks its target path before its right side; aggregate assignment validates both complete extents before changing the destination. Calls evaluate every argument before the activation-capacity check. A counted loop checks the mathematical next value before storing it. Boolean short-circuiting suppresses every check in an operand that is not evaluated.

A recoverable service error follows Chapter 14 and is not a trap while a source caller can consume it. Only failure reaching the end of `main` becomes `unhandled-error`. A trap raised within a failable routine bypasses its failure channel and every `on error` clause.

<div id="155-host-failures" class="nucleus-source-anchor"></div>

## 15.5 Host failures

The execution environment must preserve a trap even if its reporting device or output stream is unavailable. It may fall back to a monitor code, halt state, or other documented target mechanism. Reporting failure must not resume the Nucleus program or replace the original symbolic reason with an unrelated success outcome.
