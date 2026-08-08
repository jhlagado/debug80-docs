---
layout: "default"
title: "14. Recoverable failure"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 14
pageClass: "nucleus-specification"
---
[← 13. Routines and activation storage](13-routines-and-activation-storage.md) · [Contents](./) · [15. Safety traps and diagnostics →](15-safety-traps-and-diagnostics.md)

<div id="14-recoverable-failure" class="nucleus-source-anchor"></div>

# 14. Recoverable failure

<div id="141-failed-return" class="nucleus-source-anchor"></div>

## 14.1 Failed return

`FAIL source` requires a failable routine and a canonical byte code. It captures the code, then performs the same pop and caller restoration as a successful return. It leaves completion `failure`, stores the code in `error`, and produces no result.

The result carrier and any caller destination remain unchanged. Error code zero is valid.

<div id="142-required-call-sequence" class="nucleus-source-anchor"></div>

## 14.2 Required call sequence

Every call or service that may fail is immediately followed in byte order by `JFAIL`. A result-bearing success path then executes `GETR`. A result-free success path needs no result instruction. The failure target begins with `GETE` unless it is a validator-proved shared target whose first operation has the same effect.

`GETE destination` requires failure completion, writes the zero-extended error code, and clears completion. `GETR` and `GETE` are mutually exclusive paths for one failable result.

<div id="143-result-and-error-destination-order" class="nucleus-source-anchor"></div>

## 14.3 Result and error destination order

On success, `GETR` alone writes the result destination. On failure, that path is skipped and `GETE` writes the error destination. They may name the same slot. The result wins on success and the code wins on failure, which implements the source same-destination `on error` rule.

<div id="144-propagation" class="nucleus-source-anchor"></div>

## 14.4 Propagation

The compiler lowers `or fail` to `JFAIL` targeting `GETE temporary` followed by `FAIL temporary`. The current activation returns through its ordinary caller-save record. NVM performs no search or unwind.

<div id="145-local-handling" class="nucleus-source-anchor"></div>

## 14.5 Local handling

For `on error`, the failed path begins after `GETE` has established the source handler binding. The block then uses ordinary branches, returns, calls, or another `FAIL`. A trap never enters this path.

<div id="146-result-free-failures" class="nucleus-source-anchor"></div>

## 14.6 Result-free failures

A successful failable result-free call leaves completion `success`; its immediate `JFAIL` clears that state and falls through. A failed call branches while preserving failure until `GETE`. No dummy result carrier or destination is required.

<div id="147-entry-failure" class="nucleus-source-anchor"></div>

## 14.7 Entry failure

`FAIL` in the entry routine has no caller. It performs the unhandled-error trap with the captured byte code. It does not leave recoverable completion for the environment.

<div id="148-no-exceptions" class="nucleus-source-anchor"></div>

## 14.8 No exceptions

There is no handler stack, caught region, throw, saved stack pointer, destructor, `finally`, `defer`, or nonlocal recovery. Failure is one explicit return outcome and one explicit caller branch.
