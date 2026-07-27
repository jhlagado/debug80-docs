---
layout: default
title: "Targets"
parent: "Debug80 Book 1 — Getting started"
nav_order: 3
---

# Targets

A folder can hold many source files. Only some of them are programs; the rest are includes, experiments and half-finished ideas. A **target** is Debug80's record of one program: the source file where the build starts, where the output goes, and which machine the program runs on.

**`debug80.json` is authoritative. File names provide discovery hints only.**

## Inside a target

Your project has one target, named `main`:

```json
"targets": {
  "main": {
    "sourceFile": "src/main.asm",
    "outputDir": "build",
    "artifactBase": "main",
    "platform": "tec1g",
    "profile": "mon3"
  }
}
```

![A folder holds a project, the project selects a target, the target names a source file](../../assets/images/debug80-book/book1/folder-project-target-source.svg)

`sourceFile` is the build's source entry file. Debug80 hands assembly targets to AZM and Glimmer targets to the Glimmer compiler. `outputDir` and `artifactBase` determine where the output lands and what it is called, so this target produces `build/main.hex`. `platform` and `profile` identify the machine it runs on.

The target's name is the key, `main`. Debug80 derives it from the source file name, dropping the extension and a trailing `.main` if there is one, so `game.main.asm` yields a target called `game`. If that name is taken it appends `-2`.

## Eligible program files

Eligible program files use the `.asm`, `.z80` or `.glim` extension. A Glimmer file qualifies when it contains a top-level `program` declaration; the other `.glim` files are parts that a program includes.

Among those, two names are treated as suggestions: `main.asm` and `main.z80`. A file with either name is marked **suggested** when Debug80 offers you a list.

## Adding a target

The **+** beside the **Target** dropdown adds one. Debug80 lists the eligible program files still available to add, annotating the ones that match the naming convention, and you choose.

The second target begins with `src/blink.asm`:

```asm
; A second program, so the project has something to choose between.

API_SCAN_SEGMENTS       .equ 10

        .org    0x4000

Start:
        LD      DE,Pattern
        LD      C,API_SCAN_SEGMENTS
        RST     0x10
        JR      Start

Pattern:
        .db     0x7d,0x00,0x7d,0x00,0x7d,0x00
```

The **+** beside **Target** opens the eligible-file list. Selecting
`src/blink.asm` adds a target named `blink` to the dropdown. It
inherits the existing target's platform, profile and output folder,
with only the source file and artifact name changed.

The Explorer context menu provides another route:
**Debug80: Set Program File** points the current target at the selected
`.asm`, `.z80` or `.glim` file.

## Selecting the active target

The **Target** dropdown selects which one Build and Run act on. The choice is stored per project.

![The target dropdown listing configured and discovered targets](../../assets/images/debug80-book/book1/picker-target-dropdown.svg)

A `+` prefix in the dropdown marks a file Debug80 found and offers to adopt. Choosing one adds it as a target and selects it.

If you change the target while a debug session is running, Debug80 reports the change and leaves the session on the build it already has:

```text
Debug80: Selected target blink. Press Build to apply it to the current session.
```

## Removing a target

The **−** beside the dropdown removes the selected target. Debug80 confirms first, and is explicit about what removal means:

```text
Remove target blink from this project? Its source files and build artifacts will not be deleted.
```

![Confirming target removal](../../assets/images/debug80-book/book1/modal-remove-target.svg)

The button is disabled when the selected entry is a discovered file rather than a configured target: removal acts on the entries in `debug80.json`.

## A project with no targets

A project remains valid after its last target is removed; this is the
same state produced by **No target yet** during initialization.

![The panel for a project with no targets](../../assets/images/debug80-book/book1/panel-state-no-targets.svg)

The dropdown then reads `No targets available` if nothing eligible is on disk, or lists discovered files with their `+` prefix if there are any. **Build** and **Run** stay visible and clickable, but report a clear message:

```text
Debug80: This project has no targets yet. Pick a program file from the target dropdown first.
```

## Targets whose files have gone

If a target names a source file that no longer exists, Debug80 hides it from the list. The entry stays in `debug80.json`, so restoring the file brings the target back.

## Other ways to run these actions

Most actions in this chapter have a Command Palette equivalent. **Set Program File** appears in the Explorer and editor context menus instead.

| Action | Command |
|---|---|
| Add a target | **Debug80: Add Target** |
| Remove a target | **Debug80: Remove Target** |
| Choose the active target | **Debug80: Select Active Target** |
| Point a target at a file | **Debug80: Set Program File** |
| Add a workspace folder | **Debug80: Add Workspace Folder** |
| Remove a workspace folder | **Debug80: Remove Workspace Folder** |
