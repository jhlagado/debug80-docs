---
layout: "default"
title: "12. Primitive control flow"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 12
pageClass: "nucleus-specification"
---
[← 11. Arithmetic, logic, comparison, and conversions](11-arithmetic-logic-comparison-and-conversions.md) · [Contents](./) · [13. Routines and activation storage →](13-routines-and-activation-storage.md)

<div id="12-primitive-control-flow" class="nucleus-source-anchor"></div>

# 12. Primitive control flow

<div id="121-branch-targets" class="nucleus-source-anchor"></div>

## 12.1 Branch targets

Every branch target is a code-section offset inside the current routine and at an instruction boundary. The target replaces the already advanced `pc` when the branch is taken.

<div id="122-unconditional-and-boolean-branches" class="nucleus-source-anchor"></div>

## 12.2 Unconditional and Boolean branches

`JMP target` always branches. `JZ source, target` requires a canonical Boolean and branches when it is zero. `JNZ source, target` branches when it is one. NVM does not interpret arbitrary nonzero integers as source Booleans.

<div id="123-structured-control" class="nucleus-source-anchor"></div>

## 12.3 Structured control

`if`, `elseif`, and `while` become Boolean branches and joins. `exit` becomes a branch to the innermost loop exit. `continue` becomes a branch to the innermost loop update or condition. None requires a VM block stack.

<div id="124-counted-loops" class="nucleus-source-anchor"></div>

## 12.4 Counted loops

Start and bound are evaluated once. The constant step sign selects the comparison direction, and unsigned comparisons and branches implement `to` or `until`. The mathematical next value must be compared with the bound before it is stored. For current `u8` and `u16` source forms, this can be done without a wider VM integer by comparing the remaining distance with the constant step magnitude. A crossed bound exits without a counter store.

If an admitted lowering detects the language's specified condition in which a next value would continue but cannot fit the counter width, it executes `TRAP loop-range` before the store. NVM has no counted-loop opcode or hidden loop state.

<div id="125-failure-branch" class="nucleus-source-anchor"></div>

## 12.5 Failure branch

`JFAIL target` is legal only at the completion-consumption position fixed by Chapter 14. On failed completion it branches and preserves the error for `GETE`. On result completion it falls through and preserves the result for `GETR`. On successful result-free completion it falls through and clears completion.
