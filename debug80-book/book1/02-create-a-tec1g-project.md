---
layout: default
title: "Create A TEC-1G Project"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 2
---
# Create A TEC-1G Project

The project creator writes the Debug80 project file and gives you a starter program with the right memory address for the selected machine. Book 1 uses the TEC-1G platform because it exercises the main Debug80 workflow: AZM source, monitor ROM, emulator panel, serial workflow and CoolTerm hardware transfer.

Open the Command Palette and run:

```text
Debug80: Create Project
```

Choose:

```text
TEC-1G / MON-3
```

That choice creates a TEC-1G project using the MON-3 monitor profile. The starter program is placed at `0x4000`, the normal user-code area for this profile.

> **Image placeholder:** Command Palette showing **Debug80: Create Project**.

> **Image placeholder:** Platform/profile picker with **TEC-1G / MON-3** selected.

## Choose The Platform

Debug80's user-facing platforms are **TEC-1** and **TEC-1G**.

| Platform | Use it when | User code starts at |
|---|---|---:|
| TEC-1 | You are working with the classic 1980s TEC-1 board and its monitor environment. | `0x0800` or `0x0900`, depending on the monitor profile |
| TEC-1G | You are working with the modern TEC-1G board, which keeps TEC-1 compatibility and adds MON-3-oriented hardware features. | `0x4000` |

Book 1 uses **TEC-1G / MON-3**. That profile supplies the start address, ROM assets and platform settings for the MON-3 environment.

Choose **TEC-1** when you are working with classic TEC-1 monitor behaviour. Choose **TEC-1G / MON-3** when you are targeting TEC-1G hardware or the MON-3 monitor environment.

The platform choice decides the first shape of the project. It does not lock the folder forever. A project can later hold more targets, and a target can carry platform settings. Book 1 starts with one TEC-1G target so the early path stays focused.

## Files Created

After project creation, open the VS Code Explorer. A fresh TEC-1G project has these working pieces:

```text
debug80.json
src/main.asm
build/
```

`debug80.json` stores the Debug80 project. `src/main.asm` is the starter source file. `build/` receives generated files after the first build.

> **Image placeholder:** Explorer tree after project creation, showing `debug80.json`, `src/main.asm` and `build/`.

The project file contains a target. A target is a named runnable program. It tells Debug80 which source file to assemble, where to write build files and which platform to emulate.

Open the Debug80 panel. The **Project** row should show your folder, and the **Target** selector should show the starter target. When a project has one target, Debug80 can select it automatically. Later, when a project has several targets, the selector becomes part of the daily workflow.

> **Image placeholder:** Project section after project creation, with folder and target selected.

## Read The Target As A Sentence

The target can be read as a sentence:

```text
Assemble src/main.asm, write artifacts under build, run the result as TEC-1G / MON-3.
```

![Folder to Debug80 project to target to source file](../../assets/images/debug80-book/book1/folder-project-target-source.svg)

That sentence is more useful than memorizing every `debug80.json` field on the first day. You will inspect the configuration in Appendix B after the workflow is clear.

The important first-day values are:

- `sourceFile`: the source file Debug80 gives to AZM.
- `outputDir`: the directory that receives generated files.
- `artifactBase`: the base name used for generated files.
- `platform` and `profile`: the emulated machine setup.

## Open The Starter Source

Open `src/main.asm`. The TEC-1G / MON-3 project creator writes this starter source:

```asm
; Debug80 starter (TEC-1G / MON-3)
        ORG 0x4000

start:  NOP
        JR  start
```

Debug80 assembles this file with AZM when you launch the target. AZM turns the source text into Z80 machine code and writes the files Debug80 needs for source-level debugging.

> **Image placeholder:** `src/main.asm` open in VS Code with syntax highlighting.

## The Origin Address

`ORG 0x4000` tells AZM where to place the following bytes in Z80 memory. In the TEC-1G / MON-3 profile, `0x4000` is the start address for user programs.

The monitor ROM still exists in the emulated machine. Your program lives in RAM at `0x4000`, while MON-3 provides the monitor environment around it.

`start:` is a label. A label gives a name to an address.

`NOP` is a Z80 instruction that advances the CPU without changing registers or memory.

`JR start` jumps back to the label. Together, the two instructions create a loop:

```asm
start:  NOP
        JR  start
```

This program gives the debugger a stable loop. It changes no display state, so the first visible result will come later, when you run a program that writes to the TEC-1G display ports.

Save `src/main.asm`. The next chapter builds the target and starts the first debug session.

## Why The Starter Program Is So Small

The starter program exists to verify the toolchain before it verifies hardware behavior. It proves that the source file can be assembled, loaded into the emulator and mapped back to the editor.

That order saves confusion. If the first program also tried to drive the LCD or keypad, a setup mistake and a programming mistake would look similar. The loop gives you a known baseline.

Once the baseline works, replace the loop with a program that writes to a visible TEC-1G device. The same build and debug sequence will apply.

## Before Moving On

You are ready to build when:

- `debug80.json` exists in the project folder.
- `src/main.asm` is open and saved.
- The Debug80 panel shows the project folder and the starter target.
