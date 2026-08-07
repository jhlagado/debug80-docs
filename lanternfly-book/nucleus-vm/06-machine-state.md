---
layout: "default"
title: "6. Machine state"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 6
pageClass: "nucleus-specification"
---
[← 5. Bytecode image and loading format](05-bytecode-image-and-loading-format.md) · [Contents](./) · [7. Runtime values and representation invariants →](07-runtime-values-and-representation-invariants.md)

<div id="6-machine-state" class="nucleus-source-anchor"></div>

# 6. Machine state

<div id="61-normative-state-fields" class="nucleus-source-anchor"></div>

## 6.1 Normative state fields

An NVM instance contains:

| Field              |     Width or bound | Meaning                                           |
| ------------------ | -----------------: | ------------------------------------------------- |
| `pc`               |            16 bits | Offset of the next instruction within code.       |
| `instructionStart` |            16 bits | Offset captured before decode for trap reporting. |
| `currentRoutine`   |             8 bits | Ordinal whose range contains `pc`.                |
| `slots`            |      128 × 16 bits | Shared memory-backed virtual slots.               |
| `arguments`        |       16 × 16 bits | Staged call or service arguments.                 |
| `argumentMask`     |            16 bits | One bit for each staged argument.                 |
| `result`           |            16 bits | Most recent successful result carrier.            |
| `error`            |             8 bits | Most recent recoverable failure code.             |
| `completion`       |   2 bits logically | `none`, `success`, `result`, or `failure`.        |
| activation arena   |      bounded bytes | Packed caller-save records.                       |
| activation depth   |      bounded count | Number of active records.                         |
| service state      |       host bounded | Stream cursors and adapter-private state.         |
| run state          |             finite | `ready`, `running`, `halted`, or `trapped`.       |
| trap record        | reason, PC, detail | Stable final diagnostic identity.                 |

The result, error, and completion carriers belong to the most recently completed call or service until the instruction sequence that owns the completion consumes it. `GETR`, `GETE`, and `JFAIL` require the stated completion kind.

<div id="62-reset" class="nucleus-source-anchor"></div>

## 6.2 Reset

Reset after a successful load repeats data zeroing and initializer application, clears slots, arguments, result, error, completion, activations, and trap state, resets all service cursors and outputs to their environment-supplied initial states, selects the entry routine, sets `pc` to its entry, and enters `ready`.

Starting from `ready` changes only the run state to `running`. It does not push an activation record.

<div id="63-instruction-cycle" class="nucleus-source-anchor"></div>

## 6.3 Instruction cycle

For each instruction the interpreter:

1. copies `pc` to `instructionStart`;
2. decodes the opcode and its fixed operands;
3. computes `nextPC = pc + instructionLength` without wrap;
4. performs all stated checks and state changes; and
5. sets `pc` to `nextPC` unless the instruction branches, calls, returns, halts, or traps.

A trap leaves `pc = instructionStart`. No part of a state transition described as atomic remains committed after its failed check. Earlier completed instructions remain visible.

<div id="64-interpreter-private-state" class="nucleus-source-anchor"></div>

## 6.4 Interpreter-private state

A Z80 interpreter may hold cached bases, dispatch pointers, scratch words, host return state, and temporary arithmetic values. Such fields are inaccessible to bytecode, absent from activations, and irrelevant to observable equivalence.
