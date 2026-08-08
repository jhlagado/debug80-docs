---
layout: "default"
title: "8. System-service boundary"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 8
pageClass: "nucleus-specification"
---
[← 7. Recoverable failure and traps](07-recoverable-failure-and-traps.md) · [Contents](./) · [9. Generated-code integrity →](09-generated-code-integrity.md)

<div id="8-system-service-boundary" class="nucleus-source-anchor"></div>

# 8. System-service boundary

<div id="81-stable-services" class="nucleus-source-anchor"></div>

## 8.1 Stable services

|   Code | Source routine              | Parameter | Success result |
| -----: | --------------------------- | --------- | -------------- |
| `0x00` | `readInputByte()`           | none      | one `u8`       |
| `0x01` | `writeOutputByte(value)`    | `u8`      | none           |
| `0x02` | `readStorageByte()`         | none      | one `u8`       |
| `0x03` | `rewindStorageInput()`      | none      | none           |
| `0x04` | `writeStorageByte(value)`   | `u8`      | none           |
| `0x05` | `seekStorageOutput(offset)` | `u16`     | none           |

The codes identify the standard semantic service set in machine-readable tests
and adapters. A direct backend may call fixed adapter labels instead of
dispatching on the code at runtime.

<div id="82-stable-service-errors" class="nucleus-source-anchor"></div>

## 8.2 Stable service errors

|   Code | Source constant  | Meaning                                   |
| -----: | ---------------- | ----------------------------------------- |
| `0x01` | `endOfInput`     | No input byte remains.                    |
| `0x02` | `inputFailure`   | Standard input failed for another reason. |
| `0x03` | `outputFailure`  | Standard output could not accept a byte.  |
| `0x04` | `storageFailure` | A bulk-storage operation failed.          |

Every adapter returns a canonical byte code. It does not turn end of input into
a trap or sentinel byte.

<div id="83-stream-behavior" class="nucleus-source-anchor"></div>

## 8.3 Stream behavior

Standard input begins at offset zero. A successful read returns the current
byte and advances once; failure leaves the cursor unchanged. Standard output
begins empty and appends successful bytes in call order; failure leaves it
unchanged.

Bulk input begins at offset zero and can be rewound to zero. Bulk output begins
with adapter-supplied bytes and a cursor at their end; the conformance harness
supplies an empty output. A write overwrites below the end, appends at the end,
and never inserts or truncates. A seek accepts an existing offset or the exact
end. A seek beyond the end fails with `storageFailure`. Every failed service
leaves its affected cursor and bytes unchanged.

<div id="84-adapter-freedom" class="nucleus-source-anchor"></div>

## 8.4 Adapter freedom

A target may implement the services through CP/M, a monitor, ports, firmware,
host callbacks, or tests. The binding must preserve bytes, call order, failure
points, cursor state, and atomicity. No target address, port, file handle, or
operating-system name enters Nucleus source semantics.

<div id="85-runs-and-reset" class="nucleus-source-anchor"></div>

## 8.5 Runs and reset

Before each new run, the adapter restores every service input, output, and
cursor to the initial state in Section 8.3. A new run therefore does not inherit
bytes, cursors, or failures from an earlier run. The external execution
interface identifies the reset execution as a distinct run.

Resuming or restarting generated code while retaining mutated service state is
a debugger or target-specific continuation, not a new conforming run.
