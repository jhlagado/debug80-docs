---
layout: default
title: "Docs Readiness"
nav_order: 6
---
# Debug80 Docs Readiness And Book 1 Plan

This note records the publishing view behind the user manual. It is an editorial audit, not a replacement for the codebase reference.

---

## Summary

Prioritise the first Debug80 user manual for **Z80 hobbyists** using Debug80 in VS Code, especially TEC-1 and TEC-1G users. The manual should be a practical, task-driven guide, separate from the existing codebase engineering manual.

Current docs are useful but uneven:

- **End users / Z80 hobbyists:** not publication-ready. The docs explain architecture better than day-to-day use.
- **Debug80 contributors:** partially ready. The codebase manual is valuable, but some chapters need freshness checks.
- **Extension/platform developers:** decent foundation, but should be treated as engineering reference, not onboarding.
- **Beginners learning AZM/Z80:** the AZM book is the right publication track, but it does not replace a Debug80 VS Code manual.

Part VI of the codebase manual is out of date in important ways. It describes older `SourceMapSegment`, `SourceMapAnchor`, and D8 map shapes that conflict with the current code and schema.

---

## Audience Readiness

| Audience | Readiness | Editorial judgment |
|---|---:|---|
| Z80 hobbyists using VS Code | **Low** | The existing site explains internals before it explains the day-to-day path: create a project, launch, step, inspect memory, and interact with TEC panels. |
| Debug80 contributors | **Medium** | The engineering manual gives a useful map of the codebase, but some chapters need freshness checks against the current TypeScript. |
| Platform extension authors | **Medium** | The platform API material is useful after a contributor already understands Debug80. It needs clearer entry points for first-time extension authors. |
| AZM and Z80 learners | **Medium** | The AZM book is the right teaching track. It does not teach how to operate Debug80 inside VS Code. |

---

## Key Findings

The public docs site has three distinct publications: the Debug80 user manual, the Debug80 codebase manual, and Learn AZM Assembly.

The Debug80 codebase manual currently claims freshness through **2026-05-10**, but freshness is mixed by chapter.

### Codebase Part VI — High-Risk Staleness

Part VI should be audited before it is treated as current reference material:

- It describes `SourceMapSegment` with fields `startAddress`, `endAddress`, `file`, `line`, `endLine`, `kind`, and `lstText`. Current code in `src/mapping/parser.ts` uses `start`, `end`, `loc`, `lst`, and `confidence`.
- It describes D8 fields like `generator` as required and uses older segment names `address` / `endAddress`. Current D8 v1 requires `format`, `version`, `arch`, `addressWidth`, `endianness`, and uses `start` / `end`.
- It describes file/line anchor comments, while the current listing parser reads symbol-table anchors shaped like `DEFINED AT LINE ... IN ...`.

Repo-local docs such as `docs/technical.md` and `docs/d8-debug-map.md` are better aligned with the current implementation and should be used as the source of truth for any rewrite of those public chapters.

### Publishing Direction

The docs need two lanes:

- A **user manual** for Z80 hobbyists working in VS Code.
- An **engineering manual** for people modifying Debug80.

The user manual should avoid implementation-first explanations. It should start with the screen and task in front of the user: open a folder, create or select a target, press F5, set a breakpoint, inspect registers and memory, use the platform panel, and recover from common setup errors.

The engineering manual should remain separate and should be refreshed chapter by chapter. Its source of truth should be the current TypeScript and the repo-local engineering notes in `debug80/docs/`.

---

## Book 1 Status

The user manual has moved from the deprecated `manual/` publication to **Debug80 Book 1 — Getting Started** under `debug80-book/book1/`. The old manual was source material only and has been removed from the published site.

### Current structure

| Chapter | Focus |
|---|---|
| 1. Install And Open A Folder | VS Code install, Marketplace install, Debug80 panel and project folder basics |
| 2. Create A TEC-1G Project | `Debug80: Create Project`, TEC-1G / MON-3 kit, starter source and target model |
| 3. Build And Step | F5, Build, breakpoints, debug controls and Run to Cursor |
| 4. Inspect The Machine | Variables symbols, symbolic Call Stack names, Registers, Memory and Machine panel |
| 5. Use The Debug80 Panel | Project controls, source-map status, Register Care, displays, keyboard and serial |
| 6. Read Artifacts And ROM Source | `.hex`, `.lst`, source map, source navigation, ROM source and bundled assets |
| 7. Send To Hardware And Keep Working | CoolTerm transfer, targets, platform choice and troubleshooting |
| Appendices | Command reference, project configuration, image plan, glossary, TEC-1G reference and review checklist |

### Config examples to include

One Simple platform target and one TEC-1G / MON-3 configuration reference are included in Appendix B.

### Keyboard shortcuts

Keyboard shortcuts remain a future screenshot-and-verification task. Document `Tab -> AD/ADDRESS`, `Space -> 0`, `Enter -> GO`, `Escape -> Reset`, arrow keys for left/right and the Shift/FN latch after checking the current panel code and hardware screenshots. Mention K_PLUS/K_MINUS only as a note for users reading ROM source.

---

## Test Plan

Validate the manual against real workflows, not just code review:

- Fresh workspace, run `Debug80: Create Project`, choose Simple, press F5.
- Fresh TEC-1 project kit: verify launch, ROM source opening, keypad/display, memory panel.
- Fresh TEC-1G MON-3 kit: verify launch, panel sections, serial, memory, and bundled assets.
- Existing project with root `debug80.json`.
- AZM source project using `.asm`.
- Breakpoint flow in source and listing fallback.
- Failure cases: missing `sourceFile`, missing generated listing, missing ROM override, invalid config.

---

## Assumptions

- The first user manual should optimise for **Z80 hobbyists**, not beginner programmers or Debug80 contributors.
- The existing `debug80-docs` site remains the publication target.
- Repo-local `docs/` remain engineering notes and implementation references.
- No current docs are edited as part of this planning step.
- The codebase manual should be corrected later, but the immediate priority is a practical VS Code usage manual.

---

## Governance

- **Release checklist:** bump "user guide last reviewed" date; verify command list against `package.json` `contributes.commands`.
- **Link policy:** user guide links to engineering manual only as "internals", not the default reader path.
- **Changelog:** extension `CHANGELOG.md` bullets should have a "User-visible" subsection whenever behaviour changes shortcuts, config fields, or panel features.
- **Freshness test:** pick 5 random `src/…` file references from Part V–VI; run `rg` for `registerCommand(` vs documented command titles; diff `package.json contributes.commands` against any command appendix.
