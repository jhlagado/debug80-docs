---
layout: "default"
title: "21. Feature and cost ledger"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 21
pageClass: "nucleus-specification"
---
[← 20. Conformance vectors](20-conformance-vectors.md) · [Contents](./)

<div id="21-feature-and-cost-ledger" class="nucleus-source-anchor"></div>

# 21. Feature and cost ledger

<div id="211-status-labels" class="nucleus-source-anchor"></div>

## 21.1 Status labels

Every size or timing entry is labeled **Measured**, **Projected**, or **Hypothesis**. Measured entries identify the assembly and harness. Projected entries state their measured basis and arithmetic. A hypothesis is not quoted as a target result.

<div id="212-component-ledger" class="nucleus-source-anchor"></div>

## 21.2 Component ledger

| Component                    | Compiler bytes |                  Interpreter bytes |    Writable runtime |       Emitted bytes | Timing evidence           | Status                               |
| ---------------------------- | -------------: | ---------------------------------: | ------------------: | ------------------: | ------------------------- | ------------------------------------ |
| image header and descriptors |           open |                               open | loader scratch open |      32 + 8/routine | not measured              | Projected                            |
| page dispatch                |           none | 11-byte dispatcher; 256-byte table |                none |            1/opcode | 64 T dispatch in spike    | Measured dispatcher; Projected table |
| common page slot addressing  |           none |                      7-byte helper |       slot page 256 |      1/slot operand | 350 T measured `ADD` path | Measured, isolated                   |
| inlined page slot addressing |           none |                   no shared helper |       slot page 256 |           unchanged | 299 T measured `ADD` path | Measured handler paths               |
| argument staging             |           open |                               open |            34 bytes |          3/argument | not measured              | Projected                            |
| packed activation records    |           open |                               open |   `4 + 2n` per call |              2/call | not measured              | Projected                            |
| arithmetic helpers           |           open |                               open |        scratch open | fixed opcode widths | not measured              | Hypothesis                           |
| address and safety checks    |           open |                               open |        scratch open |     3–8/instruction | not measured              | Hypothesis                           |
| recoverable failure          |           open |                               open |       carriers open | call-local sequence | not measured              | Hypothesis                           |
| services and traps           |           open |                               open |   adapter dependent |   2/service or trap | not measured              | Hypothesis                           |

The existing spike measured only seven provisional handlers and three slot-addressing arrangements. Its complete core sizes were 165, 162, and 210 bytes for those sketches. Those figures exclude the separately placed dispatch table, and they are not complete-interpreter estimates.

<div id="213-required-reports" class="nucleus-source-anchor"></div>

## 21.3 Required reports

The first complete Z80 implementation reports:

- loader and validator bytes;
- immutable opcode and service tables;
- dispatch, slot, carrier, activation, service, and trap state bytes;
- each handler and shared helper size;
- complete interpreter and adapter size;
- peak activation bytes for every conformance program;
- image bytes per compiled source program;
- opcode counts and executed T-states for representative programs; and
- the exact compiler-core delta for selecting and emitting NVM operations.

<div id="214-decision-gates" class="nucleus-source-anchor"></div>

## 21.4 Decision gates

The design is accepted only after one vertical slice compiles, validates, and runs source that exercises scalar locals, arguments, recursion, records, arrays, strings, branches, a handled error, a propagated error, a service, and each reachable safety trap. A direct-Z80 backend for the same slice provides a comparison, not a prerequisite.

If the interpreter or compiler exceeds its account, the project identifies the responsible component and tests a narrower representation. It does not remove a settled source requirement silently or charge the bytes to another account.

<div id="appendix-a-complete-opcode-table" class="nucleus-source-anchor"></div>

# Appendix A. Complete opcode table

Chapter 9 is the normative opcode table. The machine-readable companion in the Nucleus measurement package must contain the same mnemonic, number, operand sequence, and width for all assigned instructions. Generated assembler, disassembler, validator, and documentation tables derive from that companion after it is checked against this chapter.

<div id="appendix-b-binary-layouts" class="nucleus-source-anchor"></div>

# Appendix B. Binary layouts

<div id="b1-header-bytes" class="nucleus-source-anchor"></div>

## B.1 Header bytes

| Byte offset | Width | Field                     | NVM 0.1 rule              |
| ----------: | ----: | ------------------------- | ------------------------- |
|           0 |     4 | magic                     | `4e 56 4d 31` (`NVM1`)    |
|           4 |     1 | VM major                  | 0                         |
|           5 |     1 | VM minor                  | 1                         |
|           6 |     1 | service major             | 0                         |
|           7 |     1 | service minor             | 1                         |
|           8 |     1 | header size               | 32                        |
|           9 |     1 | flags                     | 0                         |
|          10 |     2 | image size                | exact complete bytes      |
|          12 |     1 | routine count             | 1..255                    |
|          13 |     1 | entry routine             | existing ordinal          |
|          14 |     1 | maximum arguments         | 16                        |
|          15 |     1 | slot count                | 128                       |
|          16 |     2 | routine-table offset      | 32                        |
|          18 |     2 | initializer offset        | after routine table       |
|          20 |     2 | initializer size          | complete record section   |
|          22 |     2 | code offset               | after initializer section |
|          24 |     2 | code size                 | complete routine extents  |
|          26 |     2 | data size                 | zeroed mutable data bytes |
|          28 |     2 | required activation bytes | at least 4                |
|          30 |     1 | required activation depth | at least 1                |
|          31 |     1 | reserved                  | 0                         |

<div id="b2-routine-descriptor-bytes" class="nucleus-source-anchor"></div>

## B.2 Routine descriptor bytes

| Relative offset | Width | Field                        |
| --------------: | ----: | ---------------------------- |
|               0 |     2 | entry code offset, inclusive |
|               2 |     2 | end code offset, exclusive   |
|               4 |     1 | parameter count              |
|               5 |     1 | clobber-prefix count         |
|               6 |     1 | bit 0 result, bit 1 failable |
|               7 |     1 | reserved zero                |

<div id="b3-initializer-record-bytes" class="nucleus-source-anchor"></div>

## B.3 Initializer record bytes

The initializer section begins with a two-byte record count. Each record then contains a two-byte data address, a positive two-byte payload length, and exactly that many payload bytes. There is no terminator record.

<div id="b4-activation-record-bytes" class="nucleus-source-anchor"></div>

## B.4 Activation record bytes

The logical order is each saved slot low byte and high byte in increasing slot order, then return offset low, return offset high, caller ordinal, and save count. The arena top points immediately after the final count. A return reads that count, computes `4 + 2 * saveCount`, validates it against the current arena and depth, and only then removes the record.

<div id="appendix-c-worked-lowering-examples" class="nucleus-source-anchor"></div>

# Appendix C. Worked lowering examples

<div id="c1-infallible-value-call" class="nucleus-source-anchor"></div>

## C.1 Infallible value call

For two already evaluated arguments in slots 4 and 7 and a result destined for slot 3:

```nvm
ARG   4, 0
ARG   7, 1
CALL  routine
GETR  3
```

The descriptor supplies two parameters and a result. The argument mask is zero again before `GETR`.

<div id="c2-failable-assignment-with-handler" class="nucleus-source-anchor"></div>

## C.2 Failable assignment with handler

```nvm
ARG    4, 0
CALL   routine
JFAIL  handler
GETR   3
JMP    after
handler:
GETE   3
// lowered handler statements
after:
```

Slot 3 receives exactly one carrier on either path. No result write occurs on failure.

<div id="c3-propagation" class="nucleus-source-anchor"></div>

## C.3 Propagation

```nvm
CALL   routine
JFAIL  propagate
// successful result-free continuation
JMP    after
propagate:
GETE   6
FAIL   6
after:
```

The failed callee has already restored the caller's slot prefix. `FAIL` then returns through the caller's own activation record.

<div id="c4-fixed-array-element" class="nucleus-source-anchor"></div>

## C.4 Fixed-array element

For an array root in slot 0, dynamic index in slot 1, length 20, and record stride 3:

```nvm
INDEX   0, 1, 20, 3, 2
ADDO    2, fieldOffset, fieldExtent, 3
LOAD16  3, 4
```

The compiler emits literal length, stride, offset, and extent from static layout. The address carrier never becomes a source integer.

<div id="c5-boolean-short-circuit" class="nucleus-source-anchor"></div>

## C.5 Boolean short circuit

For `left and right`, with result slot 2:

```nvm
// evaluate left into slot 0
JZ    0, falseBlock
// evaluate right into slot 1
MOV   1, 2
JMP   done
falseBlock:
LDI8  0, 2
done:
```

The right-hand block is unreachable when left is false, so its calls and traps do not occur.

<div id="appendix-d-reference-interpreter" class="nucleus-source-anchor"></div>

# Appendix D. Reference interpreter

The repository reference model is executable evidence. Its core step has this shape:

```text
validate complete image
zero data and apply initializer records
clear machine state
select entry routine and set pc

while running
    instructionStart = pc
    opcode = code[pc]
    decode fixed operands
    nextPC = pc + width(opcode)
    execute complete checked transition
    if transition did not replace pc
        pc = nextPC
    end
end
```

The model must be generated from or mechanically checked against the opcode companion. A prose example or model behavior does not override a discrepancy in the normative chapter; the discrepancy is a release blocker.

<div id="appendix-e-z80-dispatch-sketch" class="nucleus-source-anchor"></div>

# Appendix E. Z80 dispatch sketch

The first measured arrangement uses a one-page dispatch table and one-page slot file:

```text
fetch opcode through DE
reject bit 7
double opcode
combine with dispatch-page high byte
load handler address
jump indirect
```

Handlers read additional bytes through `DE`, leaving it at the following bytecode instruction unless they branch or call. A combined helper records `instructionStart` before fetching the opcode so traps report the bytecode position rather than a native helper address.

The sketch intentionally omits fixed Z80 register assignments beyond the measured `DE` instruction pointer. The complete assembly implementation freezes assignments only after the full handler set exposes its pressure.

<div id="appendix-f-implementation-sequence" class="nucleus-source-anchor"></div>

# Appendix F. Implementation sequence

1. Freeze the machine-readable header, descriptor, service, trap, and opcode definitions.
2. Generate canonical encoders, decoders, and the minimal image vector.
3. Implement the structural validator and argument-mask analysis on the host.
4. Implement the host reference interpreter and all state-transition vectors.
5. Compile the language Chapter 21 corpus to NVM and compare source behavior.
6. Build the Z80 loader, dispatch, slot access, and minimal scalar handlers.
7. Add calls, packed activation records, recursion, and capacity traps.
8. Add data layout, checked addressing, strings, failures, services, and terminal traps.
9. Measure every component and representative program.
10. Run a full reader-order specification audit and an independent adversarial conformance review before freezing 0.1.
