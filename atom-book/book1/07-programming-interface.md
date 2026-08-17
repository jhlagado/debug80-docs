---
layout: default
title: "Programming Interface"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 7
---

# Programming Interface

Tools can call Atom in process instead of spawning the command. The `atom-z80`
package exposes one ESM entry at its package root. Node.js 20 or later is
required.

## Complete project assembly

`assembleAtomProject()` is the high-level filesystem-to-generation entry:

```js
import {
  assembleAtomProject,
  renderAtomArtifacts,
} from "atom-z80";

const result = await assembleAtomProject({
  root: "/ABSOLUTE/PROJECT/ROOT",
  entry: "src/main.asm",
  definitions: { DEBUG: 1 },
  placement: { defaultBank: 0, banks: {} },
  target: { start: 0x4000, capacity: 0x8000 },
});

const artifacts = renderAtomArtifacts(result, {
  fill: 0,
  entryAddress: 0x4000,
});
```

The call resolves and snapshots the source project, lowers active `INCBIN`
lines, runs the native Z80 core through Debug80, and returns the committed
logical generation with execution evidence.

The result contains:

| Field | Contents |
| --- | --- |
| `project` | Ordered source parts, source plan, definitions, identities, and provenance |
| `generation` | IMAGE, PATCH, layout, symbol, target, cursor, and high-water data |
| `execution` | Instructions, T-states, service calls, stack, return, and paging observations |
| `native` | Driver status and nested native status fields |
| `core` | Native code-byte and resident-extent measurements |

`renderAtomArtifacts()` returns `nobj`, `bin`, `hex`, `listing`, `d8`, and
`d8Text` in memory. A debugger can validate and load those values without
creating an Atom artifact directory.

## Preparation without assembly

`resolveAtomProject()` performs filesystem preparation alone:

```js
import { resolveAtomProject } from "atom-z80";

const project = await resolveAtomProject({
  root: "/ABSOLUTE/PROJECT/ROOT",
  entry: "src/main.asm",
  definitions: {},
  placement: { defaultBank: 0, banks: {} },
});
```

Its parts retain physical, dependency, and logical identities; original and
equal-length compiler bytes; direct dependencies; masks and transformations;
binary snapshots; and include-stack provenance.

## Prepared-project execution

`assembleResolvedAtomProject(project, options)` accepts an already prepared
ordered project. An operating adapter can construct the same shape without
using Node's filesystem resolver.

The optional controls are:

```js
{
  target: { start, capacity },
  maxInstructions,
  maxCycles,
  sink,
}
```

The default budgets are 200,000,000 instructions and 2,000,000,000 T-states.
The current native profile accepts 1 through 16 source parts and bank zero.

## Logical output

`createMemoryAtomSink()` implements the default append-only sink.
`materializeAtomGeneration()` turns one committed generation into a fresh
contiguous byte array after applying IMAGE and PATCH operations:

```js
import { materializeAtomGeneration } from "atom-z80";

const { base, bytes } = materializeAtomGeneration(result.generation, {
  fill: 0,
});
```

The returned `Uint8Array` is a copy. Changing it does not alter the committed
generation.

## Artifact writers and publication

The package exports individual NOBJ, HEX, listing, and D8 writers as well as
the composed renderer. `publishAtomArtifacts(destination, baseName, artifacts)`
publishes one content-addressed generation and selects it through `current`.

Tool authors normally retain their own publication and launch policy. Debug80,
for example, can assemble in process, validate the returned D8 object through
its normal schema, and load the corresponding bytes into a machine session.

## Errors

Preparation throws `SourcePackagerError`. Native execution and later host
stages throw `AtomAssemblyError`, which carries machine-readable `category` and
`code` values plus boundary-specific detail. Native source diagnostics include
the logical source identity, part ordinal, byte offset, line, column, and
nested native statuses.

Callers should import documented functions from `atom-z80`, not private files
below `src/host/`. The package does not yet provide TypeScript declarations or
a versioned `createAtomAssembler()` facade, so the exported record shapes
remain the current integration contract.

## Current package exports

The root also exposes:

- `loadNativeAtomCore()` and the native capacity/status constants;
- `writeAtomNobj()`, `parseAtomNobj()`, and `crc16CcittFalse()`;
- `writeIntelHex()`, `writeAtomListing()`, and `writeAtomD8()`;
- Atom-to-AZM translation used by the independent differential proof; and
- self-host source and replacement-core helpers used by development tools.

The [Atom engineering manual](https://github.com/jhlagado/atom/tree/main/docs/codebase)
traces these interfaces through the repository implementation and proof system.
