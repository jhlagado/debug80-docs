---
layout: default
title: "Build and run"
parent: "Debug80 Book 1 — Getting started"
nav_order: 4
---

[← Targets](03-targets.md) | [Book 1](index.md) | [Run the debugger →](05-build-and-step.md)

# Build and run

**Build** assembles your program. **Run** assembles it and starts the emulated machine.

## Build

Select the `main` target and click **Build**.

Debug80 hands your entry file to the assembler, writes the output into the target's `outputDir`, and stops. The panel reports what happened on its own line:

```text
Build succeeded: build/main.hex
```

If the build fails, that line turns red with a warning mark, a red `!` indicator appears beside the **Build** button, and the errors arrive in the Problems panel attached to the lines that caused them. The full assembler output goes to the Debug80 output channel.

![The panel after a failed build](../../assets/images/debug80-book/book1/panel-state-build-failed.svg)

Look in `build/`:

```text
build/
  main.hex               the program, as Intel HEX
  main.bin               the same bytes, raw
  main.d8.json           the source map
  main.lst               the assembler listing
  main.regcontracts.txt  the register contracts report
```

![The assembler reads source and writes a hex file and a source map](../../assets/images/debug80-book/book1/source-azm-artifacts.svg)

`main.hex` is what runs, on the emulator and on real hardware alike. `main.d8.json` is the **source map**, and it is what makes source-level debugging possible: it records which addresses came from which lines of which files.

A Glimmer target emits the generated assembly as `main.asm` alongside the hex, binary and source map, and no listing or contracts report.

## The source map status line

Under the build line the panel keeps a running verdict on the source map:

```text
Source map: current.
```

It has four other things it can say, and each names its own remedy:

| Line | Meaning |
|---|---|
| `Source map: select a target and build.` | No target is selected. |
| `Source map: missing, build the selected target.` | The target has never been built. |
| `Source map: stale, build recommended.` | Source has changed since the last build. |
| `Source map: unreadable, rebuild the selected target.` | The file exists but could not be read. |
| `Source map: invalid, rebuild the selected target.` | The file was read but did not parse. |

Anything other than `current` means breakpoints and stepping may land in the wrong place. When debugging behaves oddly, read this line before anything else.

## Run

Now click **Run**.

Debug80 builds the target, then launches it: it loads the monitor ROM and your program into an emulated TEC-1G and starts a debug session.

![The panel after a successful build](../../assets/images/debug80-book/book1/panel-state-ready.svg)

![The emulated TEC-1G running the starter program](../../assets/images/debug80-book/book1/machine-running.svg)

**Run** changes colour rather than label: grey when nothing is running, amber while starting, green while running, blue when paused at a breakpoint. Both buttons are disabled while a session is starting.

If a session is already running, **Run** stops it and starts again, so after an edit one press gets you the new build on a fresh machine.

**F5** does the same thing as **Run**, through VS Code's usual debug shortcut. There is no `launch.json` to write; Debug80 supplies the configuration.

## Build or run

Use **Run** while you are writing a program.

Use **Build** when you want the artifacts and not the machine: before sending a HEX file to real hardware, when you only want to know whether the code assembles, or when you are working on a target that is not the one you are currently debugging.

## Rebuild on save

While a session is running, saving any `.asm`, `.z80`, `.inc` or `.glim` file in the project triggers a rebuild automatically, a moment after you stop typing. Errors appear in the Problems panel as they would from a manual build.

## Stop on entry

The **Stop on entry** checkbox pauses the program at its entry point instead of letting it run.

It applies to this VS Code window for as long as it is open.

## The other three controls

The row below **Stop on entry** holds **Register Contracts**, **Contract Updates** and **Strict labels**.

**Register Contracts** defaults to Enforce, which means AZM checks how your routines use registers and fails the build when it proves a conflict. If a build fails complaining about registers rather than syntax, that is the control responsible, and setting it to Audit reports the problem without stopping you. It is also why a build writes `main.regcontracts.txt`.

[Appendix D](appendices/d-azm-options-row.md) covers all three: what they change, which of them can rewrite your source, and which one is saved into `debug80.json`.

## Reading the state as data

Run **Debug80: Copy Project Status (JSON)** from the Command Palette and the panel's full view of the project (its state, the target list, the selected target, and the build, source map and hardware status) goes to your clipboard as JSON.

It is the fastest way to answer "what does Debug80 actually think is going on" when something looks wrong.

---

[← Targets](03-targets.md) | [Book 1](index.md) | [Run the debugger →](05-build-and-step.md)
