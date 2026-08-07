---
layout: "default"
title: "8. Virtual-slot organization"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 8
pageClass: "nucleus-specification"
---
[← 7. Runtime values and representation invariants](07-runtime-values-and-representation-invariants.md) · [Contents](./) · [9. Instruction encoding →](09-instruction-encoding.md)

<div id="8-virtual-slot-organization" class="nucleus-source-anchor"></div>

# 8. Virtual-slot organization

<div id="81-shared-slot-file" class="nucleus-source-anchor"></div>

## 8.1 Shared slot file

Slots are numbered 0 through 127. Slot operands are one byte, but a routine may address only `0 .. clobberCount - 1`. A routine's parameter values arrive in slots `0 .. parameterCount - 1`.

Each routine descriptor declares one clobber prefix. It covers parameters, named scalar locals, aggregate-alias bindings, and expression temporaries. Slots have no permanent source name or type.

<div id="82-page-aligned-z80-mapping" class="nucleus-source-anchor"></div>

## 8.2 Page-aligned Z80 mapping

The primary implementation should place the 256-byte slot file on a 256-byte boundary. Slot `s` then occupies byte offsets `2s` and `2s+1` in that page. A handler can double the one-byte operand and combine it with a fixed high byte. This mapping is an implementation recommendation, not bytecode-visible state.

Repository measurements of three isolated Z80 dispatch/slot sketches found the page-aligned common-helper variant used 162 core bytes, a 64-T-state dispatch, and 350 T-states for the measured `ADD` path. The alternatives measured 165/458 and 210/299 respectively. These figures select the access shape among those sketches; they do not estimate the complete interpreter.

<div id="83-argument-staging" class="nucleus-source-anchor"></div>

## 8.3 Argument staging

`ARG` copies a slot word into an indexed argument cell and sets its mask bit. Writing the same argument index again replaces the value. A `CALL` or `SVC` requires the mask to equal its signature exactly. On successful acceptance of the call or service, the machine clears the entire mask.

No other instruction clears staged arguments. Compilers must complete one argument set before starting another. A malformed set is invalid execution and produces no callee or service effect.

<div id="84-slot-liveness" class="nucleus-source-anchor"></div>

## 8.4 Slot liveness

Slot contents outside the current routine's declared prefix are not available to that routine. A compiler may reuse a slot after its source value is dead. It must retain every scalar argument value and alias address until all argument expressions have been evaluated and staged.
