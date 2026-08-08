---
layout: "default"
title: "17. Interpreter contract and Z80 mapping"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 17
pageClass: "nucleus-specification"
---
[← 16. Nucleus System Services 0.1 ABI](16-nucleus-system-services-0-1-abi.md) · [Contents](./) · [18. Native-backend contract →](18-native-backend-contract.md)

<div id="17-interpreter-contract-and-z80-mapping" class="nucleus-source-anchor"></div>

# 17. Interpreter contract and Z80 mapping

<div id="171-required-interpreter-components" class="nucleus-source-anchor"></div>

## 17.1 Required interpreter components

A complete interpreter contains:

- an atomic loader and structural validator;
- code and data region bases and bounds;
- a 128-word slot file;
- sixteen staged argument words and their mask;
- result, error, and completion carriers;
- packed activation storage with byte and depth limits;
- opcode dispatch and every assigned handler;
- the six service adapter entries;
- terminal trap recording; and
- reset, start, step or run, and result-reporting entry points.

A product may combine components, but its cost ledger accounts for all of them.

<div id="172-minimum-host-capacities" class="nucleus-source-anchor"></div>

## 17.2 Minimum host capacities

The host publishes maximum image, code, data, activation-byte, activation-depth, standard-stream, and bulk-stream capacities. It rejects an image before execution when an immutable section or the image's requested activation minima cannot fit.

The actual activation limits selected for a run remain fixed until reset. Calls beyond them trap; the host must not grow or relocate the arena invisibly after observing that a call would fail.

<div id="173-z80-physical-mapping" class="nucleus-source-anchor"></div>

## 17.3 Z80 physical mapping

The recommended first Z80 mapping reserves:

- `DE` as the bytecode `pc` between handlers;
- one 256-byte-aligned page for the 128 word slots;
- one 256-byte-aligned page for the 128 two-byte dispatch addresses;
- ordinary memory for staged arguments, carriers, routine metadata, and the activation arena; and
- interpreter-private words for code and data physical bases.

The mapping is not bytecode-visible. An implementation may select different Z80 registers or inline slot addressing if its measurements justify the change.

<div id="174-dispatch" class="nucleus-source-anchor"></div>

## 17.4 Dispatch

A page dispatch may reject opcodes with bit seven set, double the remaining byte, combine it with the dispatch-page high byte, load the handler word, and jump indirectly. The measured frame-addressing spike counted a 64-T-state dispatch for the tested variants. That number is evidence for the sketch only; a complete interpreter reports its own dispatch cost.

Every handler preserves or restores the bytecode `pc` according to its documented interpreter convention. Native Z80 flags are scratch unless the handler is transferring a result into interpreter state. No VM semantic depends on a flag surviving dispatch.

<div id="175-slot-access" class="nucleus-source-anchor"></div>

## 17.5 Slot access

With a page-aligned slot file, slot `s` begins at low-byte offset `2s`. A common helper may form that address; a hot handler may inline it. Both must reject a slot outside the current routine's clobber prefix during validation, so execution need not repeat that structural check.

<div id="176-activation-records-on-z80" class="nucleus-source-anchor"></div>

## 17.6 Activation records on Z80

The activation arena may grow upward or downward, but its logical record bytes follow Section 13.4. A call computes `4 + 2 * saveCount` without eight-bit wrap, checks both capacity limits, then writes the complete record. Return reads the complete top record before releasing it.

An interrupt or monitor entry that shares the Z80 stack does not share the activation arena unless the target contract says so. The interpreter must preserve its own private state across permitted interrupts or disable them under a documented machine profile.

<div id="177-arithmetic-helpers" class="nucleus-source-anchor"></div>

## 17.7 Arithmetic helpers

Z80 has no native word multiply or divide. `MUL8`, `MUL16`, `DIV8`, and `DIV16` may call shared helpers. A helper remains part of the interpreter account, preserves `instructionStart`, and commits the destination only after a zero-divisor check.

<div id="178-loader-placement" class="nucleus-source-anchor"></div>

## 17.8 Loader placement

The NVM logical code and data offsets are independent of physical addresses. A Z80 loader selects nonoverlapping physical regions and stores their bases. Physical base addition must detect 16-bit overflow before a load, store, fetch, or initializer copy.

The compiler's own resident bank may be reclaimed before execution under the platform launcher contract. This specification neither requires nor forbids that lifecycle.

<div id="179-no-self-hosting-requirement" class="nucleus-source-anchor"></div>

## 17.9 No self-hosting requirement

The first interpreter and compiler are native Z80 assembly. NVM 0.1 does not require either component to be written in Nucleus, produced by Nucleus, or capable of compiling itself.
