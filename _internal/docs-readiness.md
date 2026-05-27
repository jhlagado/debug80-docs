---
layout: default
title: "Docs Readiness"
nav_order: 6
---
# Debug80 Docs Readiness And VS Code User Manual Plan

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

## Manual Plan

The user manual is being built as `manual/` in this repo, separate from the codebase manual. It is aimed at Z80 hobbyists.

### Chapter structure

| Chapter | Focus |
|---|---|
| 1. What Debug80 Is | Platforms, what F5 does, what the panel is |
| 2. Install and Open a Project | Extension install, project discovery, workspace repos vs fresh projects |
| 3. Create or Configure a Project | `Debug80: Create Project`, kits, `debug80.json` fields at user level |
| 4. Debug in VS Code | F5, breakpoints, step controls, registers, Variables view, error messages |
| 5. Use the Debug80 Panel | Project selector, target selector, platform panels per platform |
| 6. ROMs, Bundled Assets, and Serial | Bundled ROM assets, `Copy Bundled Assets`, serial send/save |
| 7. Assemblers and Source Mapping | asm80, generated files, approximate mapping and what to do |
| 8. Troubleshooting | Top failure cases with recovery steps |
| Appendix | Command palette cheat sheet, glossary, keyboard shortcut reference per platform |

### Config examples to include

One complete minimal config (Simple platform) and one TEC-1G config with MON-3 profile, both copy-pasteable.

### Keyboard shortcuts

Document `Tab → AD/ADDRESS`, `Space → 0`, `Enter → GO`, `Escape → Reset`, arrow keys for ◀/▶, and the Shift/FN latch. Each platform gets its own reference table. Mention K_PLUS/K_MINUS only as a note for users reading ROM source.

---

## Test Plan

Validate the manual against real workflows, not just code review:

- Fresh workspace, run `Debug80: Create Project`, choose Simple, press F5.
- Fresh TEC-1 project kit: verify launch, ROM source opening, keypad/display, memory panel.
- Fresh TEC-1G MON-3 kit: verify launch, panel sections, serial, memory, and bundled assets.
- Existing project with `.vscode/debug80.json`.
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
