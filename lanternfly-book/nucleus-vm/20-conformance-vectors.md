---
layout: "default"
title: "20. Conformance vectors"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 20
pageClass: "nucleus-specification"
---
[← 19. Image validity](19-image-validity.md) · [Contents](./) · [21. Feature and cost ledger →](21-feature-and-cost-ledger.md)

<div id="20-conformance-vectors" class="nucleus-source-anchor"></div>

# 20. Conformance vectors

<div id="201-vector-format" class="nucleus-source-anchor"></div>

## 20.1 Vector format

Each machine-readable vector records:

- image bytes or an image builder with exact expected bytes;
- host capacities and initial service streams;
- expected accept or reject result;
- for accepted images, expected final state, data bytes, service bytes, and trap record; and
- the first differing step for an implementation failure.

A conforming implementation supplies and passes vectors covering every requirement in this chapter. A source compiler also supplies paired source-to-image and source-behavior vectors.

<div id="202-minimal-successful-image" class="nucleus-source-anchor"></div>

## 20.2 Minimal successful image

The canonical image containing one result-free, infallible entry routine whose only instruction is `RET` has 43 bytes:

```text
4e 56 4d 31  00 01 00 01  20 00 2b 00  01 00 10 80
20 00 28 00  02 00 2a 00  01 00 00 00  04 00 01 00
00 00 01 00  00 00 00 00  00 00 52
```

The first 32 bytes are the header, the next eight the descriptor, the next two the zero initializer count, and the final byte `RET`. Loading, starting, and executing one instruction terminates successfully with empty output and zero activation depth.

<div id="203-required-scalar-vectors" class="nucleus-source-anchor"></div>

## 20.3 Required scalar vectors

The suite covers each opcode at boundary values, including:

- byte and word wraparound for addition, subtraction, multiplication, and negation;
- division quotient and division-by-zero destination preservation;
- integer `and`, `or`, and `not` at both widths;
- canonical Boolean comparisons and `LNOT`;
- successful narrowing at 255 and narrowing trap at 256; and
- aliasing a destination with each source.

<div id="204-required-layout-vectors" class="nucleus-source-anchor"></div>

## 20.4 Required layout vectors

The suite constructs nested packed records, scalar and aggregate arrays, and `string[1]`, `string[4]`, and `string[255]`. It verifies exact offsets, little-endian words, embedded zero string bytes, current-length indexing, bounds failures before stores, and an invalid stored string length.

<div id="205-required-control-vectors" class="nucleus-source-anchor"></div>

## 20.5 Required control vectors

The suite covers taken and untaken branches, short-circuit blocks whose omitted side would trap, forward and backward targets, inclusive `to`, exclusive `until`, positive and negative steps, zero-iteration direction mismatch, `exit`, and `continue` through the lowered primitive sequence.

<div id="206-required-call-vectors" class="nucleus-source-anchor"></div>

## 20.6 Required call vectors

The suite covers zero and sixteen arguments, scalar and alias carriers, caller/callee clobber prefixes in both size orders, no-overlap and full-overlap saves, nested calls, early return, direct recursion, mutual recursion, byte-capacity exhaustion, and depth-capacity exhaustion. It checks that the capacity trap leaves the slot file, mask, and arena unchanged.

<div id="207-required-failure-vectors" class="nucleus-source-anchor"></div>

## 20.7 Required failure vectors

The suite covers every combination of result presence and failure status, error code zero and 255, `or fail` propagation through several routines, local handling, a handler destination equal to the success destination, result-free success, and entry failure becoming unhandled-error. It verifies that traps bypass `JFAIL`.

<div id="208-required-service-vectors" class="nucleus-source-anchor"></div>

## 20.8 Required service vectors

The suite exercises all six ordinals, every standard error code, repeated end-of-input, input rewind, output append, bulk overwrite, append at end, valid seeks, failed seek beyond end, and atomic failed writes. It verifies exact cursor positions and byte order after each call.

<div id="209-required-rejection-vectors" class="nucleus-source-anchor"></div>

## 20.9 Required rejection vectors

At minimum, one vector rejects each Chapter 19 rule: bad magic or version, arithmetic section overflow, unknown opcode, truncated instruction, bad slot, bad target, bad descriptor, overlapping initializer, return-shape mismatch, completion-shape mismatch, and argument-mask mismatch or merge.

<div id="2010-language-corpus" class="nucleus-source-anchor"></div>

## 20.10 Language corpus

The accepted and rejected programs in Chapter 21 of the language specification remain the minimum source-level corpus. A compiler-to-NVM harness compiles every accepted program, validates the image, runs it where it terminates, and compares behavior. It rejects every invalid source before image execution.
