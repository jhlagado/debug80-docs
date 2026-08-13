---
layout: "default"
title: "10. Conformance and measurement"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 10
pageClass: "nucleus-specification"
---
[← 9. Generated-code integrity](09-generated-code-integrity.md) · [Contents](./)

<div id="10-conformance-and-measurement" class="nucleus-source-anchor"></div>

# 10. Conformance and measurement

<div id="101-required-evidence" class="nucleus-source-anchor"></div>

## 10.1 Required evidence

The active proof suite assembles the compiler and generated program with AZM,
runs the result through Debug80, and checks source-level observations. It must
cover the accepted and rejected Chapter 21 programs as implementation stages
make them available, including normal output, static data, alias-visible
mutation, recursion, recoverable failure, every reachable trap, exact
diagnostic positions, and capacity boundaries.

A module or boundary proof may test a smaller path. It must identify the
language or contract rule it establishes and may not substitute a fixed
program template for a claimed general compiler feature.

Object-stream producer, materializer, and storage proofs cover the required
cases in the NOBJ format separately from source-language execution.
They include runtime-provider identity, link-context, helper-layout, and length
mismatch, execution at two distinct linked layouts including runtime base
`$8003` with changed writable-state addresses, deferred `MAP.usedLength`
validation, direct flat wire loading, and stored banked
materialization without private backing for every bank.

<div id="102-measurement-reports" class="nucleus-source-anchor"></div>

## 10.2 Measurement reports

Every target size or timing claim comes from fresh assembled output and names
the proof that produced it. Reports separate compiler code, compiler immutable
data, peak workspace, generated program, target runtime, fixed runtime state,
activation storage, instruction count, and T-states. A projection states its
measured basis; an untested expectation is labelled a hypothesis.
