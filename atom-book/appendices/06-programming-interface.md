---
layout: default
title: "Appendix 6 — Programming Interface"
parent: "Atom Appendices"
grand_parent: "Atom Books"
nav_order: 6
---

# Appendix 6 — Programming Interface

Tools can call Atom in the same process instead of spawning the command. The
`atom-z80` package provides ECMAScript modules and requires Node.js 20 or later.

## Assemble a project

`assembleAtomProject()` accepts a project root and entry file, runs source
preparation and assembly, and returns the ordered project with its completed
output generation:

```js
import {
  assembleAtomProject,
  renderAtomArtifacts,
} from "atom-z80";

const result = await assembleAtomProject({
  root: "/ABSOLUTE/PROJECT/ROOT",
  entry: "src/main.asm",
  definitions: { DEBUG: 1 },
  target: { start: 0x4000, capacity: 0x8000 },
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

A debugger can validate and load `bin`, `hex`, and `d8` directly without
creating an artifact directory.

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
project. This is the appropriate entry point for a tool that supplies source
from storage other than Node's filesystem. A project may contain 1 through 255
parts; each part must use bank zero.

The options are:

```js
{
  target: { start, capacity },
  maxInstructions,
  maxCycles,
  sink,
}
```

Most callers need only `target`. The budget options bound assembly time. A
custom sink receives the append-only output lifecycle; omit it to use Atom's
in-memory sink.

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

## Publish an artifact bundle

`publishAtomArtifacts(destination, baseName, artifacts)` writes a complete
content-addressed generation and returns its paths:

```js
import { publishAtomArtifacts } from "atom-z80";

const published = await publishAtomArtifacts(
  "/ABSOLUTE/PROJECT/ROOT/build/main.atom",
  "main",
  artifacts,
);

console.log(published.paths.bin);
console.log(published.paths.d8);
```

The package also exports `writeAtomNobj()`, `parseAtomNobj()`,
`writeIntelHex()`, `writeAtomListing()`, and `writeAtomD8()` for callers that
need one format at a time.

## Errors

Source preparation throws `SourcePackagerError`. Assembly, rendering, and
publication throw `AtomAssemblyError`. Both provide machine-readable category
and code values. Source errors also include a `diagnostic` object with the
project-relative filename, part ordinal, byte offset, line, and column when
that information is available.

Import public functions from `atom-z80`, not files below `src/host/`. The
package does not currently include TypeScript declarations.
