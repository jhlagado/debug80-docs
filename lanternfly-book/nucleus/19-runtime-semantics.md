---
layout: "default"
title: "19. Runtime semantics"
parent: "Nucleus 0.1 Language Specification"
nav_order: 19
pageClass: "nucleus-specification"
---
[← 18. Static semantics](18-static-semantics.md) · [Contents](./) · [20. Feature ledger →](20-feature-ledger.md)

<div id="19-runtime-semantics" class="nucleus-source-anchor"></div>

# 19. Runtime semantics

<div id="191-startup-and-observable-behaviour" class="nucleus-source-anchor"></div>

## 19.1 Startup and observable behaviour

Execution begins after the implementation has established every program variable's required initial value in declaration order. The environment then calls `main`. Observable behaviour consists of ordered system-service effects, mutations visible through source aliases, normal termination, recoverable-error outcomes consumed by source, and required traps.

Normal return from `main` terminates successfully. Failure from `main` and a safety trap terminate unsuccessfully. The source language defines no other program-termination operation.

<div id="192-evaluation-and-assignment" class="nucleus-source-anchor"></div>

## 19.2 Evaluation and assignment

Expressions evaluate in the order specified by Section 9.11. Binary operands are left-to-right except for Boolean short-circuit suppression. Postfix suffixes apply left-to-right, and each index is checked when reached. Arguments evaluate left-to-right before a call begins.

Integer arithmetic uses the fixed widths and wraparound rules in Chapter 9. Comparisons use unsigned integer order or Boolean equality as applicable. Checked narrowing, division, indexing, and counted-loop increment perform their required checks before producing or storing a result.

Assignment evaluates and checks the complete scalar target path, then evaluates the right side, then converts and stores. A failure or trap before the success-result store leaves the destination unchanged, while effects already completed remain visible. A handled failable assignment then stores its error code in the handler destination; if both destinations name the same scalar, that scalar receives the error code.

<div id="193-objects-and-aliases" class="nucleus-source-anchor"></div>

## 19.3 Objects and aliases

Program objects exist throughout execution. Each routine call creates a distinct logical activation containing copied scalar parameters, scalar locals, and aggregate-alias bindings. Aggregate aliases denote existing objects or aggregate subobjects and preserve identity. Mutation of a scalar leaf is visible through every path to that leaf.

Aggregate arguments and results transfer aliases, not object contents. A returned aggregate alias denotes the original program-lifetime object after the callee's binding ends and may initialize a fixed local alias after one evaluation. Bounded-string byte mutation through any alias is visible through every alias to the same object; it replaces an existing byte without changing length or capacity. No runtime type tag accompanies an alias, and the source language provides no operation that inspects its carrier.

<div id="194-calls-returns-and-recursion" class="nucleus-source-anchor"></div>

## 19.4 Calls, returns, and recursion

A call starts after all arguments have been evaluated and the activation-capacity check succeeds. Parameter binding precedes local initialization; local declarations initialize in source order. The first statement begins after the local prefix.

`return` transfers an optional success result and ends the activation. A result-free routine also returns successfully at its closing `end`. In a result-free failable routine, `return invocation() or fail` returns successfully when the result-free callee succeeds and propagates its code when it fails. Direct and mutual recursion use the same rules and create distinct active state at each depth. Backend save regions, register files, stacks, and return encodings must preserve these semantics but are not source-visible.

<div id="195-conditional-and-loop-execution" class="nucleus-source-anchor"></div>

## 19.5 Conditional and loop execution

An `if` chain tests conditions in source order until one is true, executes at most one body, and skips every later condition. A `while` tests before each iteration. A counted `for` evaluates its start and bound once, initializes the counter, tests before the first iteration, and uses the direction and inclusive or exclusive rule from Chapter 12.

Normal completion and `continue` in a counted loop use the increment-and-next-test path. `exit`, `return`, and `fail` can leave the body without running that path. A counted-loop next value is tested mathematically before storage, preventing unsigned wrap from creating another iteration; a continuing value outside the counter type performs `loop-range` at runtime even when statically predictable.

<div id="196-recoverable-errors" class="nucleus-source-anchor"></div>

## 19.6 Recoverable errors

A failable call returns success or one `u8` error code. On success, the ordinary result, if any, is transferred before surrounding evaluation continues. On failure, `or fail` returns the same code from the caller, while `on error` performs no success-result store, stores the code, and executes its handler. No success result exists on the failure path.

Error propagation ends activations through ordinary return control. It performs no stack unwinding, source cleanup, or handler search. A trap bypasses this channel. Failure reaching the external caller of `main` becomes the `unhandled-error` trap.

<div id="197-system-services-and-traps" class="nucleus-source-anchor"></div>

## 19.7 System services and traps

The predefined services execute in call order and follow Chapter 16's initial-state, cursor, byte, success, and atomic-failure rules. Standard output appends. Bulk output overwrites below its end and appends at its end without insertion or truncation. Host buffering or target-specific calls may not reorder visible bytes or change a recoverable result into silent success.

A trap stops source execution at the failing operation. The environment reports the required reason and best available location. Earlier completed effects remain; no later source operation or source-level cleanup executes.
