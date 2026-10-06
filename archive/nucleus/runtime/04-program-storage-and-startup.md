---
layout: "default"
title: "4. Program storage and startup"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 4
pageClass: "nucleus-specification"
---
[← 3. Runtime representation](03-runtime-representation.md) · [Contents](./) · [5. Checked access and aggregate copying →](05-checked-access-and-aggregate-copying.md)

<div id="4-program-storage-and-startup" class="nucleus-source-anchor"></div>

# 4. Program storage and startup

<div id="41-program-objects" class="nucleus-source-anchor"></div>

## 4.1 Program objects

Every owned aggregate object and every top-level scalar variable has a fixed
address and program lifetime. Aggregate fields and array elements occupy their
containing object's storage. Aggregate constants are complete objects in the
generated read-only-data region. Routine activations contain no owned aggregate
object.

The compiler determines every program object's address, type, extent, and
initial bytes before it commits the generated object. It retains initialized
data length, aggregate-constant length, total read-only-data length, and BSS
length as separate words. A constant symbol retains an offset relative to the
aggregate-constant image, so later initialized declarations cannot change its
identity. The compiler must reject a layout whose mathematical end exceeds the
selected region.

<div id="42-transcript-barrier-and-image-layout" class="nucleus-source-anchor"></div>

## 4.2 Transcript barrier and image layout

The compiler reads the source stream once. Parsing and checking finish before
the backend consumes the private semantic transcript, and that transcript is
consumed once. The parser finalizes the initialized-data, BSS, and
per-bank aggregate-constant used lengths before the backend emits any image
record. Startup and selected-runtime lengths are also known. Startup copy and
clear lengths, aggregate-constant addresses, each code base, and the ROM-mode
copy source therefore require no fixup. Forward code addresses, including
`main`, may use placeholder bytes followed by patch records under Section 9.2.

In a flat image, startup begins at `imageBase`, the selected runtime follows the
startup stub, generated read-only bytes follow the runtime, and generated code
follows the read-only extent. In ROM mode the read-only bytes contain the
complete initialized-RAM load image followed by aggregate-constant bytes. In
loaded mode initialized bytes occupy their runtime addresses within the image,
and the generated read-only extent contains only aggregate constants.

Every bank reserves three bytes at `bankWindowBase`. The entry bank emits
`JP startup` there; the other banks leave the slot to host image fill. The
complete selected runtime begins at `bankWindowBase + 3` in every bank. In the
entry bank, startup follows that runtime, generated read-only data follows
startup, and generated code follows the read-only extent. In every other bank,
read-only data follows the runtime and precedes code. Only the entry bank
contains startup and the initialized-RAM load image. The runtime identity fixes
the canonical source, link rules, linked length, helper offsets, and RAM vector
layout; this version performs no helper subsetting. Banks with the same
complete link context use byte-identical linked helper images.

The initialized block begins with the adapter-selected runtime vector table,
continues with the identity-fixed writable runtime state, and then contains
source-declared initialized variables. The adapter contributes the vector and
runtime-state bytes at contract-defined offsets; they are not Nucleus
initializers. BSS follows the complete used initialized length.

The operating-layer runtime provider emits each complete, fully linked helper
image at the derived runtime base. The compiler advances the corresponding
target cursor by the identity's fixed length only after the provider accepts
the operation. The helper bytes never occupy compiler workspace. The provider
operation serializes as ordinary image records and adds no NOBJ record class or
relocation phase.

For a flat artifact, the runtime base is `imageBase` plus the exact startup-stub
length. For every banked image, the runtime base is `bankWindowBase + 3`. The
entry bank's first instruction transfers over that runtime to startup. The
ROM-mode copy-source operand is emitted as a placeholder. After the final code
and read-only offsets are known, the compiler emits its resolved patch record.
The startup transfer to `main` uses the same checked patch discipline.

<div id="43-initial-state" class="nucleus-source-anchor"></div>

## 4.3 Initial state

Before `main` begins, the runtime vectors have their adapter-selected targets,
every program variable has its language-defined zero or explicit static value,
and every aggregate constant has its complete declared value. In ROM mode
startup unconditionally copies the complete initialized block, including the
nonempty vector table and any initialized-variable bytes, then clears BSS. The
copy therefore cannot be elided merely because source declares no initialized
variable. In loaded mode startup omits the copy and clears BSS. Startup never
copies aggregate-constant bytes or exposes a partly initialized object to
source execution.

Static words use little-endian order. Record and array initializers follow the
packed layout in Chapter 3. A bounded-string initializer writes its length and
decoded bytes, zeros payload bytes `L + 1` through `N`, and writes `$00` at
`N + 1`. Those bytes beyond `L` remain outside source-readable string content.
The compiler may reuse its existing one-object initializer buffer while
building either a variable or an aggregate constant; it does not require a
second read-only-image-sized workspace buffer.

<div id="44-program-entry-and-exit" class="nucleus-source-anchor"></div>

## 4.4 Program entry and exit

The flat entry address is `imageBase`; a banked artifact publishes
`(entryBank, bankWindowBase)`. Startup optionally establishes the stack,
unconditionally copies the complete initialized block in ROM mode, clears BSS,
and then enters `main`. Copy and clear therefore precede the entry transfer. In
inherited-stack mode the transfer is a patched `JP main`; `main` returns through
the caller's existing return address. In established-stack mode startup uses a
patched `CALL main`, restores the incoming `SP` after successful completion,
and then returns to the original caller. Failure and trap paths restore it
through their terminal handling under Section 6.4.

In a banked artifact, the entry-bank instruction at `bankWindowBase` is an
ordinary three-byte `JP startup`. It preserves the monitor-supplied stack while
keeping every bank's runtime base and helper addresses identical.

Startup invokes `main` with no source parameters. Successful return terminates
normally. Failure returned by `main` performs `unhandled-error`. No source
routine runs before all variables and aggregate constants have their complete
initial values.

The compiler emits no reset, restart, or interrupt vector table. A loader,
monitor, or machine reset binding enters flat `imageBase` or the published
banked entry pair outside the source language.
