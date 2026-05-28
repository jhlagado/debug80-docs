---
layout: default
title: "Build And Step"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 3
---
# Build And Step

The first build should stop where you can see it: in the source editor, at the first instruction of your program.

Open the Debug80 panel and tick **Stop on entry**. Then click **Build** in the Project section, or press F5.

You can also start from the Command Palette:

```text
Debug80: Start Debugging
```

> **Image placeholder:** Project section with **Stop on entry** ticked and **Build** visible.

The Build button starts the same kind of launch as F5. Use the button when your attention is already in the Debug80 panel. Use F5 when your attention is in the editor.

## What Happens On Launch

Debug80 reads the active target from `debug80.json`. For the starter project, that target points to `src/main.asm`.

During launch, Debug80 asks AZM to assemble the source. The generated program is loaded into the emulated Z80 memory, the TEC-1G profile starts, and VS Code opens a debug session.

When **Stop on entry** is enabled, the session pauses before the first instruction runs. The current source line is highlighted in the editor.

> **Image placeholder:** Source editor paused at the first instruction in `src/main.asm`.

The first launch also creates the build artifacts. You will inspect them later. For now, remember the launch order: AZM assembles the source before Debug80 loads and debugs the program.

## The Program Counter

The Z80 program counter, usually written as PC, holds the address of the next instruction. When the editor highlights the `NOP` at `start`, PC points at the address generated for that instruction.

For the starter program, that address is `0x4000`.

The PC gives the debugger its position in the emulated machine. The source map gives Debug80 the matching position in your source file. The two views stay useful together: the editor shows the instruction in human form, and the register view shows the address the Z80 will execute.

## Set A Breakpoint

Click in the editor gutter beside an instruction line. VS Code adds a red breakpoint marker.

A filled breakpoint means Debug80 matched the source line to a generated Z80 address. A breakpoint on a blank line, comment or label-only line may stay hollow because breakpoints bind to instruction addresses.

Leave the breakpoint on `NOP` or `JR start` for now. The debug controls will move through the loop.

> **Image placeholder:** Breakpoint set beside an instruction line, with the current execution line highlighted.

## Filled And Hollow Breakpoints

A filled breakpoint has a concrete address. Debug80 can stop there because the source map found the generated instruction.

A hollow breakpoint is waiting for a generated address. Move it to a real instruction line and rebuild. Labels, comments and directives can be important source lines, and the debugger stops on CPU instruction addresses.

## Conditional Breakpoints

Use a conditional breakpoint when the program should stop for a specific machine state. Right-click a breakpoint, choose **Edit Breakpoint** and enter a Debug80 expression.

For example:

```asm
[PACMO_LIVES] eq 0
zero and A eq $20
[IX + 4] ne 0
not carry
PC eq MainLoop
```

When execution reaches the breakpoint, Debug80 evaluates the expression. A true or non-zero result stops execution. A false or zero result lets the program continue.

When expression evaluation raises an error, Debug80 stops at the breakpoint and writes the error to the Debug Console. Conditional breakpoints use the same expression language as the Watch panel. Appendix G lists the supported registers, flags, symbols, memory reads and operators.

## Continue And Pause

The VS Code debug toolbar controls the emulated Z80. Use it the same way you use other VS Code debuggers: continue, pause, step, restart and stop.

**Continue** runs the program from the current instruction. In the starter loop, execution repeats the same two instructions until you pause or stop it.

**Pause** interrupts the running session and returns control to the debugger. The editor highlights the source line that matches the current PC when the source map can resolve it.

> **Image placeholder:** VS Code debug toolbar annotated with Continue, Pause, Step Into, Step Over, Step Out, Restart and Stop.

## Step Into

**Step Into** executes the next source-level step. With the starter program, stepping alternates between `NOP` and `JR start`.

Step once from `NOP`. PC advances to the jump instruction. Step again from `JR start`. PC returns to the `start` label.

This is the smallest useful debugging cycle: stop, inspect, step, inspect again.

The editor view and PC should move together. If the editor line changes but the machine state seems surprising, look at PC and the registers before stepping again. Small programs are the right place to build that habit.

## Step Over And Step Out

**Step Over** and **Step Out** matter once a program calls subroutines.

Step Over runs a call as a single source-level action when Debug80 can resolve the call boundary. Step Out runs until the current routine returns or until the configured instruction cap stops it.

The starter loop contains straight-line code and a jump, so these controls behave like ordinary stepping for now. Use them later when your program contains `CALL` and `RET`.

## Run To Cursor

VS Code also provides **Run to Cursor** from the editor context menu and debug controls. During a Debug80 session, place the cursor on an instruction line and use the normal VS Code action.

Debug80 resolves that source line through the source map, runs to the matching machine address and stops there. Use the standard VS Code action for this command.

Run to Cursor depends on the last successful build. Build the target again when source-line resolution needs fresh source-map data, then place the cursor on an instruction line.

## Restart And Stop

**Restart** rebuilds and relaunches the active target. Use it after changing source.

**Stop** ends the debug session. The project remains selected, so the next F5 or **Build** starts the same target again.

## Edit And Rebuild

Change the `NOP` to another harmless instruction once you are comfortable stepping. Save the file and restart the target.

Debug80 rebuilds during launch. Normal editor-based work starts from VS Code. Assembly errors stop the launch with a diagnostic.

## When The First Program Becomes Visible

The starter loop proves that launch, source-map lookup and stepping work. Display output begins when a program writes to the TEC-1G display ports.

After you replace the starter loop with a small TEC-1G display program, use the same sequence:

1. Save the source.
2. Restart the target.
3. Stop at entry.
4. Step to the display write.
5. Continue and watch the panel.

That pattern works for more interesting programs because Debug80 rebuilds the target at launch and keeps the source view tied to the generated Z80 addresses.

## Before Moving On

You are ready for machine inspection when you can:

- start the target with Stop on entry enabled
- set a breakpoint on an instruction line
- add a conditional expression to a breakpoint
- step from `NOP` to `JR start`
- restart after saving a source change
