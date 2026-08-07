---
layout: "default"
title: "18. Native-backend contract"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 18
pageClass: "nucleus-specification"
---
[← 17. Interpreter contract and Z80 mapping](17-interpreter-contract-and-z80-mapping.md) · [Contents](./) · [19. Image validity →](19-image-validity.md)

<div id="18-native-backend-contract" class="nucleus-source-anchor"></div>

# 18. Native-backend contract

<div id="181-semantic-input" class="nucleus-source-anchor"></div>

## 18.1 Semantic input

A native backend consumes the same lowered operations represented by the opcode families: fixed-width scalar operations, checked conversions, packed-layout addresses, loads and stores, primitive branches, calls, failure edges, traps, and system services. It need not decode a serialized NVM image when the compiler feeds those operations directly.

<div id="182-required-equivalence" class="nucleus-source-anchor"></div>

## 18.2 Required equivalence

For the same source and external streams, native output must preserve:

- left-to-right source effects and Boolean short-circuiting;
- byte and word wraparound;
- unsigned comparison and division;
- packed object layout and string length semantics;
- bounds, narrowing, and division checks before writes;
- call argument evaluation and activation-capacity timing;
- result-free and value results;
- recoverable failure codes and immediate handling;
- trap class and best available source or lowered location; and
- service order, bytes, failure atomicity, and termination.

<div id="183-calling-convention-freedom" class="nucleus-source-anchor"></div>

## 18.3 Calling convention freedom

A native backend may place values in Z80 registers, static slots, a stack, or another target ABI. It may use carry plus a code register for recoverable failure. These choices are backend-private. They do not change the abstract result/error distinction or allow a source alias to become an integer address.

<div id="184-caller-save-relation" class="nucleus-source-anchor"></div>

## 18.4 Caller-save relation

The NVM serialized ABI saves the overlap of two clobber prefixes. A native backend may perform equivalent liveness-based save-around calls, save a conservative caller set, or use distinct dynamic frames. The observable requirement is that recursion and nested calls preserve every caller value live after the call and that early return performs no source cleanup phase.

<div id="185-activation-capacity" class="nucleus-source-anchor"></div>

## 18.5 Activation capacity

A native backend publishes its own activation limit. It must pass the Chapter 20 minimum corpus. When it claims equivalence to a particular NVM run, it selects a limit that produces activation-capacity at the same logical call boundary.

<div id="186-image-layout-consumers" class="nucleus-source-anchor"></div>

## 18.6 Image layout consumers

A native backend that reads or writes NVM object images uses the exact Chapter 7 data layout and Chapter 5 initializer meaning. A backend with an unrelated private data layout does not claim binary object-memory interoperability, though it may still claim source behavioral equivalence.
