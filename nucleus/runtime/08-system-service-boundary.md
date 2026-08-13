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
and adapters. Generated programs call their entries in the RAM-resident runtime
vector table. Each entry is one `JP`, and the runtime identity fixes the table's
base, order, and offsets.

The target environment establishes the table before source execution. ROM
startup copies it; a loaded image places it directly at its run address. Its
initialized bytes come from the selected adapter runtime rather than from
source declarations. The table also contains the terminal success,
unhandled-failure, and trap entries required by Chapter 7 and the far-call and
far-jump entries in Section 8.6.

Every vector destination must remain callable under every bank selector. A
banked target therefore binds these entries to fixed memory, always-visible
RAM, or another adapter path whose behavior is independent of the currently
selected bank.

Arithmetic and aggregate helpers remain ordinary local calls. They are not
placed in the vector table.

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
bytes, cursors, else failures from an earlier run. The external execution
interface identifies the reset execution as a distinct run.

Resuming or restarting generated code while retaining mutated service state is
a debugger or target-specific continuation, not a new conforming run.

<div id="86-banked-calls" class="nucleus-source-anchor"></div>

## 8.6 Banked calls

The source-part bank mapping lets the compiler classify each routine call as
local or cross-bank. A local call uses ordinary `CALL`. A cross-bank call uses
the far-call vector and supplies a compiler-generated destination bank ordinal
and checked 16-bit target address through its private ABI. Source code exposes
neither value.

The far-call adapter selects the destination bank, enters the ordinary Nucleus
routine ABI, and installs a fixed-memory return path. Identity `$0004` uses the
selected-bank byte at writable-state offset eight and a sixteen-byte far-return
arena after the saved root-frame words. Each live far call uses the zero-based
slot `ActivationDepth - 1`: depth one selects slot zero, and the published
depth-eight boundary selects the final slot. The slot retains both the return
address and caller bank in always-visible state; neither value is inserted
among hardware-stack arguments. The callee returns with an ordinary `RET`; the
return path restores the caller's bank. The far-jump vector provides the
corresponding non-returning transfer.

On TECM8 the adapter may implement these entries through the monitor's
`Tecm8FarCall` and `RST 10h` facilities. Generated code never writes `SYS_CTRL`
directly. Parameters, results, activation state, runtime vectors, and service
state occupy always-visible RAM. Cross-bank aggregate traffic remains subject
to Section 6.5.
