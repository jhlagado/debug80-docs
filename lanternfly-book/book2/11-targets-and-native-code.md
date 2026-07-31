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

## Target profiles

A profile declares:

- CPU or substrate and endianness;
- supported scalar operations;
- near and far representations;
- address spaces;
- routine ABI;
- standard-service implementations;
- native dialect and assembly-fragment support;
- optional capabilities such as recursion.

Operations such as display, input, sound, random-number generation, firmware
calls and device access enter the language as typed external routines.

## External routines

`extern sub` describes native code with a Lanternfly signature:

```lanternfly
export extern sub printChar(ch as u8) at $0008
export extern sub waitForKey() from "ROM_WAIT_KEY"
export extern sub screenClear()
```

`at` binds an executable target address. `from` names a substrate symbol after
compile-time string escapes are decoded. A declaration with neither clause
asks the profile to bind the Lanternfly name.

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

The effect summary tells the compiler what a native routine can observe or
change: reads, writes, calls, faults, device I/O, control flow and ABI
clobbers.

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
bounds checks and far access. Only helpers that are used are linked, and each
appears in generated listings and cost reports.

Bounds, range, arithmetic and invalid-value faults do not return to the failing
expression. A hosted profile may trap them; a standalone profile may terminate
or enter a monitor. Debug artifacts retain the fault class and source location.

## Inline assembly

`asm` opens a raw assembly block. A later physical line containing only `end`
closes it:

```lanternfly
sub waitForKey()
    asm
        call ROM_WAIT_KEY
    end
end
```

Lanternfly does not tokenize, interpolate or rewrite the payload. An assembly
backend emits the lines verbatim and maps assembler diagnostics back to their
original source locations. Inside the payload, comments and names follow the
selected assembler's rules.

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

Calling a generated Lanternfly routine from raw assembly is deferred because
the hidden edge would escape call-cycle and reentrancy analysis.

## Module-level assembly

An `asm` block among module items can provide directives, labels, routines or
data. It has no execution point. Its runtime effects belong to the
`extern sub` contract that exposes any routine it defines.

Module assembly carries emission and provenance metadata but receives no
statement-level native-effect warning.

## Backend compatibility

An `asm` block is necessarily target-specific. A C, BASIC or other
non-assembly backend rejects it unless the profile supplies a compatible
fragment pipeline. Raw assembly names are not Lanternfly names; a generated
symbol artifact records any Lanternfly storage or routines exposed to the
assembly source.

## Floating point

Floating point is deferred. A future edition may use library-defined records
and routines or an optional built-in `float32`. A built-in form requires a
separate contract for representation, rounding, exceptional values,
conversions, comparison, constant folding, library ABI and code-size
reporting.
