---
layout: default
title: "Build Options And Source Maps"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 5
---

[← Inspect A Running Program](04-inspect-the-machine.md) | [Book 1](index.md) | [Source Navigation And ROM Source →](06-artifacts-roms-and-mapping.md)

# Build Options And Source Maps

The **Project** section is the build control point. It selects the project folder, target and platform, then shows whether the active target has usable build output and source-map data.

## Project And Target

The **Project** row selects a workspace folder. The **Target** row selects the runnable program inside that folder.

**Stop on entry** pauses the next launch at the first instruction the Z80 executes. Use it for a controlled start from reset. Leave it clear when you want the target to run immediately.

![Project section with target, build and source-map status](../../assets/images/debug80-book/book1/initialized-project-panel.png)

## Build Output

**Build** assembles the active target with AZM and writes generated files under `build/`.

![Build folder after a successful target build](../../assets/images/debug80-book/book1/chapter5-build-folder.png)

The image shows the usual files after a successful build. The two files to understand first are:

- `main.hex`, the Intel HEX file Debug80 loads into the emulator and can send to a TEC-1G through CoolTerm.
- `main.d8.json`, the source map Debug80 uses to connect source lines, symbols and generated addresses.

The source map uses Debug80's D8 JSON mapping format. Appendix C gives the file-format details for readers who want to inspect the map or write tooling around it.

![Source through AZM to HEX and source-map output](../../assets/images/debug80-book/book1/source-azm-artifacts.svg)

Treat the build folder as generated output. Edit the source files, then build the target again.

## Source Map Status

Debug80 uses the active target's source map for source breakpoints, stepping, Run to Cursor, Variables symbols, Watches, symbolic Call Stack names, Go to Definition, symbol hover and workspace symbol search.

The status line tells you whether that map is ready:

- `Source map: current.` means the selected target has a readable source map and it appears up to date.
- `Source map: missing, build the selected target.` means the target needs a successful build before source-map features are available.
- `Source map: stale, build recommended.` means one or more mapped source files appear newer than the source map.
- `Source map: invalid, rebuild the selected target.` means Debug80 needs a fresh source map for the selected target.
- `Source map: select a target and build.` means source-map features start after target selection and a successful build.

![Source-map status leading to build and source-map-backed features](../../assets/images/debug80-book/book1/source-map-status-features.svg)

Build the active target when source-level features need fresh address data.

## Register Contracts

**Register Care** checks routine calls against AZMDoc register contracts: inputs, outputs, clobbered registers and preserved registers.

The selector has three modes:

- **Enforce** treats register contract problems as launch-blocking diagnostics.
- **Audit** analyzes register contracts without blocking the workflow.
- **Off** skips the register contract check for launch.

Use **Enforce** when contracts should protect the build. Use **Audit** while contracts are still being added or reviewed.

## Contract Updates

**Contract Updates** controls whether Debug80 may update AZMDoc register contract comments while launching.

- **Ask** lets Debug80 prompt before applying updates.
- **Auto** allows automatic updates.
- **Never** keeps launch read-only for contract updates.

Leave this on **Ask** while learning the workflow.

## Build Controls And Machine State

Use the Project section for build-facing decisions. Use Variables, Watch, Call Stack, Registers, Memory, Machine and Displays for the running machine.

[← Inspect A Running Program](04-inspect-the-machine.md) | [Book 1](index.md) | [Source Navigation And ROM Source →](06-artifacts-roms-and-mapping.md)
