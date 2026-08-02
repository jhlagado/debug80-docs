---
layout: default
title: "Targets, External Routines and Assembly"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 11
---

# Targets, External Routines and Assembly

Lanternfly source describes behaviour without exposing a particular CPU's
registers or calling convention. A target profile supplies that missing
connection to the CPU, runtime, firmware and device environment.

The reference compiler emits machine code directly with backpatched
fixups.

## Target profiles

A profile declares:

- CPU or substrate and endianness;
- supported scalar operations;
- near and far representations;
- address spaces;
- memory regions and default placement targets;
- routine ABI;
- program-termination implementation;
- standard-service implementations;
- native dialect and assembly-fragment support;
- optional capabilities such as recursion.

Operations such as display, input, sound, random-number generation, firmware
calls and device access enter the language as typed external routines.

## Standard service bindings

[Chapter 10](10-modules-and-programs.md#standard-service-modules) defines the
programmer-facing text and launcher-argument operations. The selected target
profile binds each operation that a program uses to a stable service ID:

| Export           | Service ID                           |
| ---------------- | ------------------------------------ |
| `writeCharacter` | `standard.textOutput.writeCharacter` |
| `writeText`      | `standard.textOutput.writeText`      |
| `writeNewline`   | `standard.textOutput.writeNewline`   |
| `readCharacter`  | `standard.textInput.readCharacter`   |
| `readLine`       | `standard.textInput.readLine`        |
| `argumentCount`  | `standard.programArguments.argumentCount` |
| `readArgument`   | `standard.programArguments.readArgument`  |

The toolchain supplies the versioned module interfaces; the selected target
profile supplies the bindings. A target may implement an ID with firmware, a
serial device, generated code or a test adapter.
It must preserve the Chapter 10 contract for character order, bounded line
input, stable launcher arguments and normal return. A target that cannot bind a
service used by the program rejects the build. The profile resolves each
implementation through the ordinary external-binding, ABI, adapter and
runtime-component contracts.

The profile's `programTermination` record names an implementation and carries
the Boolean field `numericExitStatus`. Normal entry completion supplies
success; `fail` from a failable entry supplies an error-set member. A true flag
maps success to zero and failed ordinal `n` to `n + 1`. A false flag requires a
target contract that reports both outcomes and preserves the failed member.
Neither form changes the enum value visible to Lanternfly source.

## External routines

`extern sub` describes native code with a Lanternfly signature. The examples
use the fictional LF-1 teaching machine introduced in
[Book One](../book1/16-machine-services-and-assembly.md):

```lanternfly
export extern sub playTone(divider as u16) at $0f06
export extern sub waitForVBlank() from "ROM_VBLANK_WAIT"
export extern sub writeUnsigned(value as u16)
```

`at` binds an executable target address. `from` names a substrate symbol after
compile-time string escapes are decoded. With neither clause, the profile binds
the Lanternfly name.

The double-quoted symbol after `from` is compile-time text. It accepts only
`\"` and `\\` and allocates no runtime string storage.

The declaration supplies parameter and result types. The profile supplies or
verifies:

- symbol or address;
- parameter and result carriers;
- calling convention and return behaviour;
- preserved and clobbered registers, flags, stack and mapping state;
- visible reads, writes, calls, faults and device I/O;
- reentrancy, interrupt and cost properties.

A missing binding, unsupported binding form or incompatible ABI is a compile
error. When the typed signature and native ABI can be reconciled without
changing source meaning, the backend may generate an adapter.

An external routine has no Lanternfly body and cannot be the program entry.

## Native value contracts

Every external or host routine must preserve Lanternfly value invariants:

- integers retain their declared width;
- enums and subranges contain values from their declared domains;
- Booleans are zero or one;
- opaque addresses satisfy the selected class validity rule;
- aggregate parameters name valid aligned storage of the declared class and
  exact type for the call;
- strings have the declared short or long layout and preserve their
  length, nonzero-payload and terminator invariants;
- constant storage remains immutable.

A contract that cannot guarantee those facts is incompatible. Disabling
optimization cannot repair an invalid representation or lifetime.

After a native call declared to write string storage, an adapter validates the
representation before Lanternfly resumes. An invalid length, embedded zero,
misplaced terminator or reserved all-ones length causes `F-INVALID-STRING`.

## Native effect contracts

The effect summary records a native routine's possible reads, writes, calls,
faults, device I/O, control flow and ABI clobbers.

An incomplete summary receives `W-NATIVE-001` and a conservative fallback:
the call may read and write every mutable object reachable at the boundary,
call native routines, fault, perform device I/O and clobber
caller-unpreserved resources.

The fallback remains subject to the value invariants above. It also counts as
a possible write to every visible counted-loop control variable and can make a
call invalid inside that loop.

Native-to-native calls may appear in the contract. Native callbacks into
source-defined Lanternfly routines or hosted bodies are deferred.

## Runtime helpers

A backend may select runtime helpers for multiplication, division, power,
square root, wide arithmetic, aggregate copying, counted-string operations,
bounds checks and far access. Only helpers that are used are included, and
each appears in the compiler's reports.

Bounds, range, arithmetic and invalid-value faults do not return to the failing
expression. A hosted profile may trap them; a standalone profile may terminate
or enter a monitor. Debug artifacts retain the fault class and source location.

## Inline assembly

`asm` opens a raw assembly block. A later physical line containing only `end`
closes it:

```lanternfly
sub waitForVBlankDirectly()
    asm
        call ROM_VBLANK_WAIT
    end
end
```

Lanternfly does not tokenize, interpolate or rewrite the payload. The
compiler passes the lines verbatim to its assembler and maps assembler
diagnostics back to their original source locations. Inside the payload,
comments and names follow the selected assembler's rules.

## Statement-level assembly

A statement block executes at its source position. Conforming control reaches
the generated statement after the block. A raw return or jump that bypasses
Lanternfly control flow violates the block contract.

Unless a future contract narrows its effects, the block:

- may read and write every visible mutable object;
- may call native routines, fault and perform device I/O;
- clobbers registers, flags and volatile machine state;
- preserves the stack, mapping and calling state required to continue.

The block must not modify immutable storage or leave an invalid enum,
subrange, Boolean, opaque-address or string representation visible to
Lanternfly. Source that violates one of those obligations is nonconforming for
the selected target.

The compiler emits `W-ASM-001` and treats the block as an observable barrier.
Values needed afterward are spilled or preserved. The specialized assembly
warning suppresses `W-NATIVE-001` for the same block.

Calling a compiled Lanternfly routine from raw assembly is deferred because
call-cycle and reentrancy analysis cannot include the hidden edge.

## Module-level assembly

An `asm` block among module items can provide directives, labels, routines or
data. It has no execution point. Its runtime effects belong to the
`extern sub` contract that exposes any routine it defines.

Module assembly carries emission and provenance metadata but receives no
statement-level native-effect warning.

## Target specificity

An `asm` block is necessarily target-specific: its payload belongs to the
selected target's assembler, and raw assembly names are not Lanternfly
names.

## Floating point

Floating-point semantics are deferred, but the delivery form is settled: a
floating-point tier arrives as a standard capability module, with its type
word reserved and gated, its operators joining the typed operator families
and its helpers bound as profile runtime components. The open work is the
semantic contract: representation, rounding, exceptional values,
conversions, comparison, constant folding, literals, library ABI and
code-size reporting.
