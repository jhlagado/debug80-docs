---
layout: "default"
title: "2. Target and resource model"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 2
pageClass: "nucleus-specification"
---
[← 1. Status and authority](01-status-and-authority.md) · [Contents](./) · [3. Runtime representation →](03-runtime-representation.md)

<div id="2-target-and-resource-model" class="nucleus-source-anchor"></div>

# 2. Target and resource model

<div id="21-z80-target" class="nucleus-source-anchor"></div>

## 2.1 Z80 target

The first implementation emits ordinary Z80 machine code into one or more flat
16-bit bank images. It is not tied to one computer, monitor, operating system,
port map, or physical memory layout. A target adapter supplies memory regions,
source-part bank assignments, service vectors, stack policy, and reporting
metadata.

All runtime addresses remain 16-bit target addresses. No source operation
exposes, constructs, compares, converts, or calculates with one. A bank ordinal
is also private target metadata. The compiler retains the type, extent, root
category, and bank information required for every aggregate address carrier.

The handwritten Z80 compiler is likewise independent of its assembly origin.
The deployment platform chooses its origin and surrounding memory map; `$0000`
in the repository proof layout is not part of the compiler ABI. CP/M may place
the compiler at `$0100`, a TEC-1 configuration may place it at `$8000`, and
another system may choose any address at which the complete image fits without
overlap. Every compiler code and immutable-data pointer is an opaque 16-bit
address. Compiler metadata must not be encoded in address bits, and compiler
pointers must not be masked, truncated, or compressed on the assumption that
the image occupies a particular half, page, alignment, or region of the Z80
address space. Any alignment restriction must be an explicit deployment
contract rather than an inference from a current build.

<div id="22-separate-accounts" class="nucleus-source-anchor"></div>

## 2.2 Separate accounts

The implementation reports these bounded accounts separately:

| Account            | Contents                                                                         |
| ------------------ | -------------------------------------------------------------------------------- |
| Compiler core      | Z80 code and immutable data required while compiling.                            |
| Compiler workspace | Peak simultaneously live writable compiler state.                                |
| Generated program  | Emitted Z80 code, static program data, and required startup material.            |
| Target runtime     | Shared helpers, service adapter, trap support, and fixed writable runtime state. |
| Activation storage | Bounded storage used by simultaneously active routine calls.                     |
| External storage   | Source, append-only object streams, maps, manifests, and service buffers.        |

The compiler-core acceptance gate is 16 KiB. Moving required compiler code or
immutable tables into another account does not satisfy it. The target runtime
and generated program remain measured even though they do not enter that gate.

<div id="23-target-description" class="nucleus-source-anchor"></div>

## 2.3 Target description

Nucleus source contains no physical placement, and a target description
contains no source-symbol reference. A source manifest supplies declarations
in order. A target profile supplies machine regions, the runtime revision, and
an optional mapping from source-part ordinal to bank. The compiler assigns
offsets within those regions and computes final addresses.

The external profile may contain device names, access attributes, bank
selectors, device offsets, output-file choices, and other host information.
The adapter validates those attributes and reduces the flat placement data to
this compact compiler descriptor:

| Field              | Meaning                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `runtimeIdentity`  | Runtime source/ABI revision, link rules, linked length, vector layout, and helper-offset identity. |
| `imageBase`        | First target address of startup, runtime, code, and image bytes.                                   |
| `imageCapacity`    | Maximum byte extent of each selected image region.                                                 |
| `writableBase`     | First target address of runtime vectors, fixed state, and program writable storage.                |
| `writableCapacity` | Combined vector, fixed state, data, BSS, free, and optional stack extent.                          |
| `establishStack`   | Boolean; false inherits `SP`, true establishes it inside writable.                                 |

The identity, base, and capacity fields are unsigned 16-bit words;
`establishStack` is one byte and must be zero or one. A base and capacity
describe one half-open region. Validation computes the mathematical end with a
seventeenth bit, so a nonempty region may end at `$10000` without a sentinel.

A banked profile also supplies one bounded bank ordinal for each source-part
ordinal and these fields:

| Field            | Meaning                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `bankWindowBase` | Target address at which every selected bank appears.             |
| `bankCapacity`   | Capacity of each bank separately, not the combined device image. |
| `bankCount`      | Number of admitted bank ordinals.                                |
| `entryBank`      | Bank containing startup and `main`.                              |
| `partBank[]`     | One bank ordinal for each source-part ordinal.                   |

The mapping is distinct from the source manifest and does not key on filenames.
A direct definition belongs to its part's bank. A forward declaration and its
abbreviated completion must have the same assignment.

`bankWindowBase`, `bankCapacity`, `writableBase`, and `writableCapacity` are
unsigned 16-bit words. `bankCount`, `entryBank`, and each `partBank` entry are
bounded byte ordinals. `establishStack` remains Boolean.

Before reduction, the adapter verifies that image mappings can be loaded and
executed and that writable permits writes. Hardware attributes and device
offsets remain external and add no source-visible property.

The runtime identity must equal the constant carried by the compiler before
publication. It identifies the canonical runtime source revision, private ABI,
RAM-vector and helper layout, deterministic link rules, and expected linked
length. It does not identify one address-bound byte sequence. A mismatch is a
target-configuration diagnostic, not a runnable artifact.

The operating layer supplies fully linked helper bytes through a runtime
provider keyed by that identity. Before it invokes the provider, the adapter
derives the complete validated link context from the target profile and the
compiler's checked full-width layout state: runtime base, writable/vector state
addresses, service destinations, and every data or read-only-data bound
consumed by the runtime.
The provider deterministically assembles or links the canonical source for
that context and verifies the resulting length and helper offsets against the
identity. The compiler retains the identity, expected length, vector layout,
and helper offsets; it does not retain the linked image. At each derived runtime
base it submits the bank, target address, identity, and expected length. The
adapter associates that bounded request with the validated link context; the
private Z80 handoff need not serialize the context into every request. The
provider appends fully resolved bytes to the image spool as ordinary NOBJ
`IMAGE` records. NOBJ contains no runtime relocation records. An unavailable
source revision, unsupported context, identity, length, or helper-layout
mismatch, or output failure aborts the generation before commit.

<div id="24-loaded-and-rom-mappings" class="nucleus-source-anchor"></div>

## 2.4 Loaded and ROM mappings

The relationship between the image and writable regions determines startup
mode; the descriptor contains no mode flag.

- When the complete writable region lies inside the image region, the target is
  loaded. Initialized bytes are emitted at their runtime addresses and startup
  emits no copy.
- When the complete writable region lies outside the image region, the target
  is ROM-resident. Initial values occupy an image record and startup copies them
  to `writableBase`.
- Partial overlap between the regions is invalid.

A banked target requires writable to lie outside the half-open bank window
beginning at `bankWindowBase` with extent `bankCapacity`. It therefore always
uses ROM mode, and its startup copy is unconditional under Section 4.3.

The runtime vector table begins at offset zero in writable storage. The
identity-fixed runtime state follows the table, program initialized objects
follow that state, and BSS begins at the complete used initialized length
rather than at a reserved capacity. Their sum must fit `writableCapacity`
without mathematical overflow.

In loaded mode, `writableBase` must begin after startup, runtime, generated
code, and other non-writable used image bytes. The map reports the first free
image address. In banked mode, writable must lie wholly outside the banked
window so a RAM address denotes the same bytes in every bank.

<div id="25-address-assignment-and-validation" class="nucleus-source-anchor"></div>

## 2.5 Address assignment and validation

Every produced branch, call, object address, entry, image record, and patch
uses a target address. The compiler sends generated bytes to the append-only
object sink in Chapter 9 and need not map the target image into its own address
space. Private compiler pointers identify only bounded compiler state; they are
never substituted for a target address.

Before the terminal commit, the compiler and adapter together establish all of
these facts:

- every mathematical region end is at most `$10000`;
- the runtime identity and `establishStack` value are valid;
- writable is wholly inside or wholly outside image for a flat target;
- writable lies outside the bank window for a banked target;
- image bytes, runtime vectors, initialized data, BSS, and optional stack fit
  their capacities;
- loaded-mode writable storage begins after other used image bytes;
- every part ordinal and bank ordinal is in range;
- the entry bank contains the part defining `main`, after every part whose
  declarations `main` uses;
- every forward declaration and completion has a compatible bank assignment;
- every bank contains the complete selected runtime helper image and fits that
  image, its code, and its read-only bytes after the reserved three-byte entry
  slot within `bankCapacity`;
- the entry bank also fits startup and the complete initialized-data load image
  without spilling into another bank;
- every branch, call, far call, data reference, entry pair, and patch is in
  range;
- every cross-bank aggregate use satisfies Section 6.5;
- every pending output fixup fits its bounded table and resolves once; and
- every image and patch record lies within its selected image region.

<div id="26-banked-program-model" class="nucleus-source-anchor"></div>

## 2.6 Banked program model

A banked ROM contains one logical compilation and one program, not one program
per bank. Manifest order remains declaration order. A separate adapter mapping
assigns each source part to a bank by ordinal.

For a TECM8 four-bank target, `bankWindowBase == $8000` and
`bankCapacity == $4000`. The host places bank records at device offsets `$0000`,
`$4000`, `$8000`, and `$C000`. Device offsets and hardware selector values are
host metadata rather than Z80 target addresses.

The complete program has one `main`, one startup, one writable region, and one
published `(entryBank, entryAddress)` pair. The entry bank contains the part
defining `main`, after every source part whose declarations `main` uses. Startup
and the initialized-data load image occupy that bank. Runtime vectors and
program variables occupy always-visible writable RAM outside the bank window.

Calls within one bank use ordinary `CALL`. Calls across banks use the far-call
vector in Section 8.6. Every bank contains the complete selected runtime helper
image. The runtime identity therefore fixes one byte length and one set of
helper offsets for every bank. Every bank reserves the first three bytes of the
window, and its runtime begins at `bankWindowBase + 3`; this version performs no
per-bank subsetting.
