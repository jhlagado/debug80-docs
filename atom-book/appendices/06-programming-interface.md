---
layout: default
title: "Appendix 6 — Programming Interface"
parent: "Atom and Z80 Reference"
grand_parent: "Atom Books"
nav_order: 6
nav_group: "Assembler reference"
---

# Appendix 6 — Programming Interface

Tools can call Atom in the same process instead of spawning the command. The
`atom-z80` package provides ECMAScript modules and requires Node.js 20 or later.

## Assemble and render

`assembleAtomProject()` prepares the source tree and runs the native Z80 core.
`renderAtomArtifacts()` converts the completed output lifecycle into ordinary
in-memory artifacts:

```js
import {
  assembleAtomProject,
  renderAtomArtifacts,
} from "atom-z80";

const result = await assembleAtomProject({
  root: "/ABSOLUTE/PROJECT/ROOT",
  entry: "src/main.asm",
  definitions: { DEBUG: 1 },
  target: { start: 0x4000, capacity: 0x4000 },
});

const artifacts = renderAtomArtifacts(result, {
  fill: 0,
  entryAddress: 0x4000,
});
```

`result.project.parts` contains the source files in assembly order.
`result.generation` contains the target range, final cursor, emitted IMAGE and
PATCH records, layout events, and declared symbols.

`renderAtomArtifacts()` returns these values without writing files:

| Field | Type | Contents |
| --- | --- | --- |
| `nobj` | `Uint8Array` | Atom NOBJ object stream |
| `bin` | `Uint8Array` | Contiguous materialised image |
| `hex` | `string` | Intel HEX |
| `listing` | `string` | Source listing |
| `d8` | `object` | D8 source and symbol map |
| `d8Text` | `string` | Formatted D8 JSON |

A debugger can load `bin`, `hex` and `d8` directly without creating temporary
files. The caller remains responsible for choosing a target profile and a
materialisation base that match its machine.

## Publish selected files

`publishAtomOutputFiles()` transactionally replaces exactly the paths named by
the caller:

```js
import { publishAtomOutputFiles } from "atom-z80";

await publishAtomOutputFiles([
  { path: "build/main.hex", bytes: artifacts.hex },
  { path: "build/main.d8.json", bytes: artifacts.d8Text },
]);
```

The files are staged before either existing destination is replaced. A
publication failure leaves the previous files in place. BIN, listing and NOBJ
remain available in memory when a tool does not want them on disk.

## Prepare source separately

`resolveAtomProject()` performs filesystem and preprocessing work without
assembling:

```js
import { resolveAtomProject } from "atom-z80";

const project = await resolveAtomProject({
  root: "/ABSOLUTE/PROJECT/ROOT",
  entry: "src/main.asm",
  definitions: {},
  placement: { defaultBank: 0, banks: {} },
});
```

Each part retains its project-relative identity, original bytes, equal-length
prepared bytes, dependencies, preprocessing information, and saved `INCBIN`
data.

`assembleResolvedAtomProject(project, options)` assembles an already prepared
project. This is the entry point for a tool that supplies source from storage
other than Node's filesystem. A project may contain 1 through 255 parts; each
part must use bank zero.

The options are:

```js
{
  target: { start, capacity },
  maxInstructions,
  maxCycles,
  sink,
}
```

Most callers need only `target`. The budget options bound execution in the Z80
emulator. A custom sink receives the append-only output lifecycle; omitting it
selects Atom's in-memory sink.

## Materialise an output generation

`materializeAtomGeneration()` applies IMAGE and PATCH records and fills gaps or
reserved storage:

```js
import { materializeAtomGeneration } from "atom-z80";

const { base, end, bytes } = materializeAtomGeneration(result.generation, {
  fill: 0,
});
```

The returned `Uint8Array` is a copy. Changing it does not alter the generation.

## NOBJ and individual formats

The package exports `writeAtomNobj()`, `parseAtomNobj()` and
`materializeAtomNobj()` for tools that store or consume Atom's append-only
object stream. It also exports `writeIntelHex()`, `writeAtomCom()`,
`writeAtomListing()` and `writeAtomD8()` when a caller needs one format rather
than the complete rendered set.

`materializeAtomGeneration()` performs the same IMAGE-and-PATCH operation on a
live assembly generation. `materializeAtomNobj()` starts from serialized NOBJ.
Both return a flat image without introducing a general linker or symbol
resolution stage.

## Native host boundary

`createNamedObjectAtomAdapter()` and `createAtomToolServiceGateway()` expose
the Z80 host boundary used by native systems. A provider supplies source
objects, output transactions and diagnostics while the assembler core remains
unchanged. The Node command and native CP/M program are two providers for that
same division of responsibilities.

These interfaces are for host and operating-system integration. Ordinary Node
tools should begin with `assembleAtomProject()`.

## Errors

Source preparation throws `SourcePreparationError`. Assembly, rendering and
publication throw `AtomAssemblyError`. Both provide machine-readable category
and code values. Source errors also include a `diagnostic` object with the
project-relative filename, part ordinal, byte offset, line and column when
that information is available.

Import public functions from `atom-z80`, not files below `src/host/`. The
package does not currently include TypeScript declarations.
