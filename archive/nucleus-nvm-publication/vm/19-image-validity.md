---
layout: "default"
title: "19. Image validity"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 19
pageClass: "nucleus-specification"
---
[← 18. Native-backend contract](18-native-backend-contract.md) · [Contents](./) · [20. Conformance vectors →](20-conformance-vectors.md)

<div id="19-image-validity" class="nucleus-source-anchor"></div>

# 19. Image validity

<div id="191-validation-order" class="nucleus-source-anchor"></div>

## 19.1 Validation order

The loader validates the immutable image in this order:

1. fixed header fields and arithmetic;
2. canonical section order and exact final size;
3. host capacity minima;
4. routine descriptors and extents;
5. initializer records;
6. instruction decoding and operand ranges;
7. branch and routine targets;
8. return, result, failure, and service shapes; and
9. argument-mask data flow.

A loader may combine passes when it produces the same rejection and runs no source instruction first.

<div id="192-header-checks" class="nucleus-source-anchor"></div>

## 19.2 Header checks

The header must match Appendix B. Every reserved field and flag is zero. Routine count is 1 through 255. Entry ordinal is present. The fixed slot and argument counts are 128 and 16. Offsets and sizes form the four canonical contiguous sections without 16-bit overflow or trailing bytes. Service and VM versions are exactly 0.1.

Required activation bytes are at least four and required depth is at least one. They must not exceed the capacities supplied for the run.

<div id="193-descriptor-checks" class="nucleus-source-anchor"></div>

## 19.3 Descriptor checks

Descriptor code ranges are nonempty, contiguous, ordered, and cover code exactly. Parameter count is at most 16 and no greater than clobber count. Clobber count is at most 128. Only result and failure flag bits are set. The entry descriptor has zero parameters and no result.

<div id="194-initializer-checks" class="nucleus-source-anchor"></div>

## 19.4 Initializer checks

The two-byte record count and every record must fit the initializer section exactly. Record length is positive. Records appear in strictly ascending, nonoverlapping order. Each `address + length` is computed mathematically and does not exceed `dataSize`. There are no leftover initializer bytes.

<div id="195-instruction-checks" class="nucleus-source-anchor"></div>

## 19.5 Instruction checks

Validation decodes from each routine entry to its exclusive end. It rejects an unassigned opcode, truncated operand, leftover byte, slot outside the current clobber prefix, argument index above 15, absent routine or service, forbidden trap number, invalid immediate data root, zero layout extent, or branch target outside the current routine or between instructions. A routine's final instruction must return, fail, trap, or branch unconditionally; no path may fall through its exclusive end.

`RET` is valid only without a result flag. `RETV` is valid only with one. `FAIL` is valid only with the failure flag.

<div id="196-completion-shape-checks" class="nucleus-source-anchor"></div>

## 19.6 Completion-shape checks

For an infallible result-bearing `CALL`, the following instruction is `GETR`. For a failable `CALL` or every `SVC`, the following instruction is `JFAIL`; when success bears a result, the fallthrough instruction after `JFAIL` is `GETR`. The failure target begins with `GETE`.

No branch may target the owning `JFAIL` or `GETR`, and no instruction other than the owning `JFAIL` may target its `GETE`. A `GETR`, `GETE`, or `JFAIL` outside one of these patterns is invalid. A compiler may duplicate a short consumer block; format 0.1 does not share it across calls. These local shapes prevent a result or error from outliving its call statement.

<div id="197-argument-mask-analysis" class="nucleus-source-anchor"></div>

## 19.7 Argument-mask analysis

The validator performs a forward data-flow analysis whose value is a 16-bit staged-argument mask. Entry begins with zero. `ARG q` sets bit `q`. An accepted `CALL` or `SVC` requires the exact signature mask and produces zero on its callee-return continuation. Other instructions preserve the mask.

All incoming edges to an instruction must carry the same mask. Every instruction in a routine must be reachable from its entry; dead instruction bytes are noncanonical and invalid. A merge with different masks, a back edge carrying a partial set, an exact-signature mismatch, or a return with a nonzero mask is invalid. The analysis is finite because there are only instruction boundaries and 65,536 masks; rejecting unequal merges avoids a mask-set powerset.

<div id="198-source-verification-remains-separate" class="nucleus-source-anchor"></div>

## 19.8 Source verification remains separate

Image validation does not reconstruct nominal records, source scopes, source alias categories, or typed expression trees. A structurally valid hand-written image may perform operations unavailable in source. A conforming compiler output additionally satisfies the language specification and the lowering obligations in the worked examples.

<div id="199-rejection-result" class="nucleus-source-anchor"></div>

## 19.9 Rejection result

Image rejection identifies at least the failed field, descriptor ordinal, initializer record, or code offset. It makes no program output, service call, data mutation, activation, or Nucleus trap record.
