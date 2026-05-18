---
layout: default
title: "Docs Readiness"
nav_order: 6
---
# Debug80 Docs Readiness

This note records the publishing view behind the user manual. It is an editorial audit, not a replacement for the codebase reference.

## Audience Readiness

| Audience | Readiness | Editorial judgment |
|---|---:|---|
| Z80 hobbyists using VS Code | Low | The existing site explains internals before it explains the day-to-day path: create a project, launch, step, inspect memory, and interact with TEC panels. |
| Debug80 contributors | Medium | The engineering manual gives a useful map of the codebase, but some chapters need freshness checks against the current TypeScript. |
| Platform extension authors | Medium | The platform API material is useful after a contributor already understands Debug80. It needs clearer entry points for first-time extension authors. |
| ZAX and Z80 learners | Medium | The ZAX book is the right teaching track. It does not teach how to operate Debug80 inside VS Code. |

## High-Risk Staleness

Part VI of the codebase manual needs a targeted audit before it is treated as current reference material.

The public chapter describes `SourceMapSegment` with fields such as `startAddress`, `endAddress`, `file`, `line`, `endLine`, `kind`, and `lstText`. Current Debug80 code uses the shape from `src/mapping/parser.ts`: `start`, `end`, `loc`, `lst`, and `confidence`.

The same chapter describes D8 map fields that no longer match the current v1 schema. The current schema requires `format`, `version`, `arch`, `addressWidth`, `endianness`, and `files`; segments use `start` and exclusive `end`.

The chapter also explains file/line anchor comments, while the current listing parser reads symbol-table anchors shaped like `DEFINED AT LINE ... IN ...`.

## Publishing Direction

The docs need two lanes:

- A user manual for Z80 hobbyists working in VS Code.
- An engineering manual for people modifying Debug80.

The user manual should avoid implementation-first explanations. It should start with the screen and task in front of the user: open a folder, create or select a target, press F5, set a breakpoint, inspect registers and memory, use the platform panel, and recover from common setup errors.

The engineering manual should remain separate and should be refreshed chapter by chapter. Its source of truth should be the current TypeScript and the repo-local engineering notes in `debug80/docs/`.
