---
layout: "default"
title: "7. Recoverable failure and traps"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 7
pageClass: "nucleus-specification"
---
[← 6. Calls, activations, and results](06-calls-activations-and-results.md) · [Contents](./) · [8. System-service boundary →](08-system-service-boundary.md)

<div id="7-recoverable-failure-and-traps" class="nucleus-source-anchor"></div>

# 7. Recoverable failure and traps

<div id="71-recoverable-completion" class="nucleus-source-anchor"></div>

## 7.1 Recoverable completion

A failable routine completes with either success or one `u8` error code. No
success result exists on failure. `else fail` returns that code from the caller;
`handle NAME` stores it only after suppressing the success-result store. These
paths perform ordinary local control transfer and no stack search or unwinding.

The target calling convention may use carry and a byte register or another
documented private representation. It must preserve the distinction among
result-free success, value success, and failure until the immediate consumer
has acted.

<div id="72-stable-trap-codes" class="nucleus-source-anchor"></div>

## 7.2 Stable trap codes

|   Code | Reason                | Required condition                                             |
| -----: | --------------------- | -------------------------------------------------------------- |
| `0x01` | `bounds`              | A checked data region, array index, or string byte is invalid. |
| `0x02` | `narrowing`           | A dynamic checked `u8(...)` operand exceeds 255.               |
| `0x03` | `division-by-zero`    | A runtime integer divisor is zero.                             |
| `0x04` | `loop-range`          | A continuing counted-loop value does not fit its counter.      |
| `0x05` | `activation-capacity` | A new activation cannot fit its published limit.               |
| `0x06` | `unhandled-error`     | `main` returns recoverable failure.                            |

These numeric codes are the machine-readable Nucleus Z80 trap contract.

<div id="73-trap-record-and-terminal-behavior" class="nucleus-source-anchor"></div>

## 7.3 Trap record and terminal behavior

A trap record contains at least the stable reason and the best available
16-bit source offset for the failing operation. `unhandled-error` also contains
the returned error code. A target may additionally record a source-part,
routine, generated-code address, or monitor-specific detail.

A trap commits none of the faulting operation's result writes, data writes,
service effects, activation changes, or control transfer. It terminates source
execution. Reporting failure must not resume the program or replace the
original reason.
