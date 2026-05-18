---
layout: default
title: "Debug in VS Code"
parent: "Using Debug80 in VS Code"
nav_order: 4
---
# Debug in VS Code

Once the project exists, use the normal VS Code debug controls. Debug80 supplies the Z80 runtime behind those controls.

## Start the Session

Press F5 or run:

```text
Debug80: Start Debugging
```

Debug80 reads the selected target, assembles the source unless `assemble` is `false`, loads the program and ROMs, builds source mapping, opens the platform panel, and starts the debug session.

If `stopOnEntry` is enabled, execution stops at the first instruction. If it is disabled, the machine runs until it reaches a breakpoint, HALT, pause request, or another stop condition.

## Breakpoints

Set breakpoints in source files before or during a session. Source breakpoints are preferred. Listing breakpoints in `.lst` files still work as a fallback.

A filled breakpoint has been resolved to a Z80 address. A hollow breakpoint means Debug80 could not map that source line to generated code. Try placing the breakpoint on an instruction line, rebuild the project, or inspect the generated `.lst` file.

## Stepping

Use VS Code's debug toolbar:

| Control | What it does |
|---|---|
| Continue | Runs until a breakpoint, HALT, pause, or stop condition. |
| Pause | Interrupts a running session. |
| Step Into | Executes the next source-level step. |
| Step Over | Runs over subroutine calls where Debug80 can resolve the call boundary. |
| Step Out | Runs until the current call returns or the instruction cap is reached. |
| Restart | Starts the current target again. |
| Stop | Ends the debug session. |

Step Over and Step Out can have instruction caps if the target config sets `stepOverMaxInstructions` or `stepOutMaxInstructions` to a positive number. The default value is `0`, which means no cap.

## Registers and Variables

Open the Run and Debug view and expand Variables. Debug80 exposes the Z80 register set there, including the main 8-bit and 16-bit registers. Register editing is also available from platform memory panels where the active platform supports it.

The Call Stack shows the current source location when mapping is available. If Debug80 cannot map an address, it shows the raw address.

## Common Launch Messages

Assembler errors appear in the Debug Console. Missing files usually name the path Debug80 tried to read. Source mapping warnings do not always stop launch; they mean stepping or breakpoints may be less precise.

If a launch fails, check these first:

- The workspace folder is the project folder.
- `debug80.json` or `.vscode/debug80.json` exists.
- The selected target has a valid `sourceFile`.
- The output directory can be written.
- ROM override paths point to existing files or bundled assets.
