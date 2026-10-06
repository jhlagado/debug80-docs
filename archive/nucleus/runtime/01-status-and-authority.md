---
layout: "default"
title: "1. Status and authority"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 1
pageClass: "nucleus-specification"
---
[Contents](./) · [2. Target and resource model →](02-target-and-resource-model.md)

<div id="1-status-and-authority" class="nucleus-source-anchor"></div>

# 1. Status and authority

<div id="11-status" class="nucleus-source-anchor"></div>

## 1.1 Status

This document defines the required direct-Z80 execution contract for Nucleus
0.1. It governs the first compiler's generated program representation, runtime
helpers, service adapter, activation machinery, and trap records. Nucleus 0.1
does not have an active bytecode format or virtual-machine implementation path.

The [Nucleus 0.1 Language Specification](../language/) governs source
syntax, validity, and meaning. This contract supplies target representation and
execution rules without changing that meaning. If the two documents disagree
about source behavior, the language specification prevails. If they disagree
about the direct-Z80 runtime interface or packed representation, this contract
prevails.

The [Nucleus Target System Specification](https://github.com/jhlagado/nucleus/blob/main/docs/target-system-specification.md)
governs target profiles, image composition, startup, entry, and banked-program
placement. This contract defines their direct-Z80 representation.

The [Nucleus Object Stream Format](https://github.com/jhlagado/nucleus/blob/main/docs/nucleus-object-format.md) governs the binary
record tags, framing, payloads, patch order, integrity check, and terminal
commit used to publish that representation.

The implementation plan and reviewer's charter are non-normative. Tests,
proofs, and measurements provide evidence; they do not amend either authority.

<div id="12-conforming-direct-implementation" class="nucleus-source-anchor"></div>

## 1.2 Conforming direct implementation

A conforming direct implementation:

- emits Z80 machine code rather than a portable intermediate program;
- preserves every source-visible order, result, mutation, failure, and trap;
- establishes the representations and startup state in this contract;
- checks every dynamic safety condition before the operation can commit a
  forbidden result or partial write;
- rejects an unresolved, out-of-range, or over-capacity generated program
  before publishing it as runnable; and
- documents every implementation capacity and target-adapter choice.

The compiler may use an internal semantic-operation transcript. That transcript
is compiler workspace, not a public object format, compatibility boundary, or
second execution target.
