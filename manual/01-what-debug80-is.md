---
layout: default
title: "What Debug80 Is"
parent: "Using Debug80 in VS Code"
nav_order: 1
---
# What Debug80 Is

Debug80 is a VS Code debugger for Z80 programs. It starts from the files a Z80 project normally produces: a program image, a listing file, and source files. It then connects those files to VS Code's debugger so you can run, stop, step, and inspect the machine while your program executes.

The extension currently ships three built-in platforms:

| Platform | Use it when |
|---|---|
| Simple | You want a plain Z80 memory map for small programs and smoke tests. |
| TEC-1 | You are working with TEC-1 monitor-style programs, keypad/display interaction, or serial workflows. |
| TEC-1G | You are working with MON-3, LCD/GLCD display code, matrix keyboard input, serial, or banked monitor workflows. |

## What Debug80 Adds to VS Code

Debug80 contributes a debugger type named `z80`. When a project has a Debug80 configuration, F5 starts the selected target.

During a session you can:

- Set breakpoints in `.asm`, `.z80`, `.a80`, or `.s` source files.
- Step into, over, and out with the normal VS Code debug controls.
- Continue, pause, restart, or stop the emulated machine.
- Inspect Z80 registers in the Variables view.
- Inspect and edit memory through Debug80's platform panels.
- Send keypad and serial input to the platform runtime.
- Open ROM listing and source files while a monitor-backed session is running.

## How a Session Starts

Debug80 reads a project file named `debug80.json`. A project can also place that file at `.vscode/debug80.json`.

The project file names a target. The target names the source file, output directory, artifact base name, assembler backend, and platform. When you start debugging, Debug80 assembles the program unless the target says `assemble: false`, loads the generated program into Z80 memory, builds source mapping from the listing and D8 map, and then starts the selected platform.

For monitor-backed platforms, the ROM is part of the emulated machine. Your program usually starts in RAM at the platform's application address while the CPU entry point remains the monitor reset address.
