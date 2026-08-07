---
layout: "default"
title: "13. Routines and activation storage"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 13
pageClass: "nucleus-specification"
---
[← 12. Primitive control flow](12-primitive-control-flow.md) · [Contents](./) · [14. Recoverable failure →](14-recoverable-failure.md)

<div id="13-routines-and-activation-storage" class="nucleus-source-anchor"></div>

# 13. Routines and activation storage

<div id="131-argument-staging" class="nucleus-source-anchor"></div>

## 13.1 Argument staging

`ARG source, index` requires completion `none`, copies one complete slot to argument cell `index`, and sets the corresponding mask bit. The index is 0 through 15. Repeating an index replaces the staged value. `ARG` has no source-visible effect beyond the next call or service.

The compiler evaluates all source arguments from left to right into ordinary slots before it emits any `ARG` for that invocation. This prevents a nested call in a later argument from consuming a partially staged outer call. It then stages the final carriers in parameter order.

<div id="132-accepted-argument-set" class="nucleus-source-anchor"></div>

## 13.2 Accepted argument set

Before `CALL`, the mask must contain exactly indices zero through `parameterCount - 1` for the callee and no others. Before `SVC`, it must match the service signature in Chapter 16. An exact zero-argument set has a zero mask.

An accepted call or service clears the whole mask. A malformed mask is invalid execution and produces no callee or service effect. Valid compiler output cannot produce it.

<div id="133-caller-save-overlap" class="nucleus-source-anchor"></div>

## 13.3 Caller-save overlap

For a call from routine `C` to routine `D`, the save count is:

```text
min(C.clobberCount, D.clobberCount)
```

Only that shared prefix can be both live for the caller and overwritten by the callee. Slots above the callee prefix remain untouched. Slots above the caller prefix are not caller values.

<div id="134-activation-record" class="nucleus-source-anchor"></div>

## 13.4 Activation record

Each non-entry call pushes one packed record:

| Field                                 |                  Size |
| ------------------------------------- | --------------------: |
| saved slots 0 through `saveCount - 1` | `2 * saveCount` bytes |
| return code offset                    |               2 bytes |
| caller routine ordinal                |                1 byte |
| save count                            |                1 byte |

The record size is `4 + 2 * saveCount`. Records form a last-in, first-out arena. The final count byte makes the top record self-delimiting: a return reads it, computes the complete size, and then finds the return offset and caller ordinal. The VM records a depth independently from byte use so either configured limit can stop a call.

<div id="135-call-transition" class="nucleus-source-anchor"></div>

## 13.5 Call transition

`CALL routine` requires completion `none` and performs these steps atomically until the callee begins:

1. verify the exact staged-argument mask;
2. compute the save count and record size;
3. check activation depth and byte capacity;
4. push the saved slot prefix, return offset, caller ordinal, and save count;
5. clear the callee's declared clobber prefix;
6. copy the staged argument cells to leading parameter slots;
7. clear the argument mask and set completion to `none`;
8. select the callee routine and its entry offset.

If capacity is insufficient, the activation-capacity trap occurs after source arguments have been evaluated and staged but before the record, slots, mask, current routine, or `pc` changes.

<div id="136-successful-return" class="nucleus-source-anchor"></div>

## 13.6 Successful return

`RET` completes a result-free routine successfully. `RETV source` captures one complete result carrier, then completes a result-bearing routine successfully.

For a non-entry activation the VM pops the record, restores the saved prefix, selects the caller, and resumes at the saved offset. An infallible result-free return leaves completion `none`. A failable result-free success leaves completion `success`. A result-bearing success leaves completion `result` and the captured carrier in `result`.

`GETR destination` requires result completion, copies the result carrier, and clears completion. It works for scalar and aggregate-alias results; the compiler retains their static type and alias provenance.

<div id="137-early-return-and-recursion" class="nucleus-source-anchor"></div>

## 13.7 Early return and recursion

Every return performs the same pop and restore. The callee owns no preservation set, destructor, cleanup list, or epilogue obligation. The VM call operation preserves the caller's overlap once, and every early callee return uses the same record.

Direct and mutual recursion use ordinary `CALL`. Each nested call receives a distinct saved record, so active scalar locals and alias carriers are restored correctly. No routine-specific recursion opcode or static recursion ban exists.

<div id="138-entry-return" class="nucleus-source-anchor"></div>

## 13.8 Entry return

The entry routine has no activation record. Its `RET` terminates successfully. `RETV` is invalid because the entry descriptor has no result. Entry failure is defined in Chapter 14.
