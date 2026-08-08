---
layout: "default"
title: "16. Nucleus System Services 0.1 ABI"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 16
pageClass: "nucleus-specification"
---
[← 15. Safety traps and diagnostics](15-safety-traps-and-diagnostics.md) · [Contents](./) · [17. Interpreter contract and Z80 mapping →](17-interpreter-contract-and-z80-mapping.md)

<div id="16-nucleus-system-services-01-abi" class="nucleus-source-anchor"></div>

# 16. Nucleus System Services 0.1 ABI

<div id="161-service-ordinals" class="nucleus-source-anchor"></div>

## 16.1 Service ordinals

| Ordinal | Source routine              | Parameters        | Success result     |
| ------: | --------------------------- | ----------------- | ------------------ |
|  `0x00` | `readInputByte()`           | none              | one canonical `u8` |
|  `0x01` | `writeOutputByte(value)`    | argument 0: `u8`  | none               |
|  `0x02` | `readStorageByte()`         | none              | one canonical `u8` |
|  `0x03` | `rewindStorageInput()`      | none              | none               |
|  `0x04` | `writeStorageByte(value)`   | argument 0: `u8`  | none               |
|  `0x05` | `seekStorageOutput(offset)` | argument 0: `u16` | none               |

Every service may fail. Other ordinals are invalid in NVM 0.1.

<div id="162-error-codes" class="nucleus-source-anchor"></div>

## 16.2 Error codes

|   Code | Source constant  | Meaning                                            |
| -----: | ---------------- | -------------------------------------------------- |
| `0x01` | `endOfInput`     | no byte remains at the current input cursor        |
| `0x02` | `inputFailure`   | standard-input operation failed for another reason |
| `0x03` | `outputFailure`  | standard-output operation failed                   |
| `0x04` | `storageFailure` | bulk-storage operation failed                      |

The service adapter returns these exact byte values. It does not translate end of input into a trap or successful sentinel byte.

<div id="163-svc-transition" class="nucleus-source-anchor"></div>

## 16.3 `SVC` transition

`SVC service` first checks the exact staged-argument mask from the table above and requires completion `none`. It invokes the selected adapter once. On acceptance it clears the argument mask.

Services with a `u8` parameter require a canonical byte. On successful result-bearing completion, the VM requires and writes the returned canonical byte to `result` and sets completion `result`. On successful result-free completion it sets completion `success`. On failure it requires and writes a canonical code to `error` and sets completion `failure`. A nonconforming adapter value is an implementation defect, not a value that the VM masks. The immediately following `JFAIL`, and when applicable `GETR` or `GETE`, use the same sequences as bytecode calls.

The adapter call creates no NVM activation record and does not change the current routine or slots except through later `GETR` or `GETE`.

<div id="164-standard-input-and-output" class="nucleus-source-anchor"></div>

## 16.4 Standard input and output

Standard input is a byte sequence with a cursor initially at zero. `readInputByte` succeeds with the current byte and then advances the cursor. At the end it fails with `endOfInput`; another input failure uses `inputFailure`. Failure leaves the cursor unchanged.

Standard output starts empty and is append-only. `writeOutputByte` appends its byte and then succeeds. If the environment cannot accept it, the service fails with `outputFailure` and leaves output unchanged. Successful writes appear in call order.

<div id="165-bulk-storage-input" class="nucleus-source-anchor"></div>

## 16.5 Bulk-storage input

Bulk-storage input is a separately selected byte sequence with a cursor initially at zero. `readStorageByte` has the same success and end behavior as standard input, using `storageFailure` for other failures. `rewindStorageInput` moves the cursor to zero on success. Any failure leaves the cursor unchanged.

<div id="166-bulk-storage-output" class="nucleus-source-anchor"></div>

## 16.6 Bulk-storage output

Bulk-storage output begins with the environment-supplied bytes and a cursor at its current end. The Chapter 20 conformance environment supplies an empty sequence.

`writeStorageByte` overwrites when the cursor is below the end, appends when it equals the end, and advances by one on success. It never inserts or truncates. `seekStorageOutput` accepts an existing offset or exactly the current end. Seeking beyond the end fails with `storageFailure`.

Every failed output operation is atomic: its cursor and bytes remain unchanged.

<div id="167-binding-freedom" class="nucleus-source-anchor"></div>

## 16.7 Binding freedom

An interpreter may realize services through CP/M calls, monitor traps, ports, host callbacks, or tests. The binding may buffer internally only when failure points, order, bytes, and cursor behavior remain identical. No native address, port number, file name, or operating-system handle appears in bytecode.

<div id="168-service-reset" class="nucleus-source-anchor"></div>

## 16.8 Service reset

Machine reset restores service inputs, outputs, and cursors to the execution environment's initial state. Restarting from an already mutated service state without reset is another run and must be identified as such by the host interface.
