---
layout: default
title: "Run The Starter Program"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 3
---
# Run The Starter Program

You have already run the starter from MON-3. Now run the same program under the debugger.

The starter program is small enough to understand in one sitting, and active enough to exercise real Debug80 features. It sets the stack pointer, calls MON-3 to write to the LCD, then loops through a seven-segment display refresh routine.

Use this chapter to run that program under the debugger. You will stop at entry, step through the first MON-3 calls, set a breakpoint in the refresh loop and watch the panel change.

## Build The Target

Select the target in the Debug80 panel. Then click **Build** in the Project section.

![Debug80 paused after launch, with Stop on entry enabled and the Build button visible](../../assets/images/debug80-book/book1/chapter3-stop-on-entry-build-paused.png)

Debug80 reads the active target from `debug80.json`. For the starter project, that target points to `src/main.asm`.

Build starts the debug session for the selected target. Debug80 asks AZM to assemble the source, loads the generated program into the emulated Z80 memory and starts the TEC-1G profile.

With **Stop on entry** clear, the program runs immediately. With **Stop on entry** ticked, Debug80 pauses as soon as the Z80 starts at address `$0000`. The first pause is in the TEC-1G ROM source, MON-3. The yellow arrow in the editor marks the next ROM instruction at the reset entry point.

The first launch also creates the build artifacts. Chapter 6 explains those generated files. For now, remember the launch order: AZM assembles the source before Debug80 loads and debugs the program.

## The Program Counter

The Z80 program counter, usually written as PC, holds the address of the next instruction. When the editor highlights the first instruction at `start`, PC points at the address generated for that instruction.

For the starter program, that address is `0x4000`.

The PC gives the debugger its position in the emulated machine. The source map gives Debug80 the matching position in your source file. The editor shows the instruction in human form, and the register view shows the address the Z80 will execute.

The first instruction is:

```asm
        ld      sp,0x7fff
```

That instruction sets the Z80 stack pointer near the top of RAM. The starter does this before calling MON-3 services, because monitor calls can use the stack while they run.

## Step Through Startup

The two stepping keys you will use most are F10 and F11.

F10 is **Step Over**. It executes the current instruction and stops at the next instruction in the current flow. When the current instruction calls a subroutine, F10 runs that routine as one action and stops after the call returns.

F11 is **Step Into**. It follows execution into subroutines. In Z80 code, it also follows software interrupts, so stepping into `RST 0x10` takes you into the MON-3 service routine.

With the starter program, the first steps set the stack pointer, send commands to MON-3 with `RST 0x10`, and then enter the display refresh loop. Use F10 when you want to move over the MON-3 calls and stay with the starter source. Use F11 when you want to trace into the monitor code and see how the service runs.

Step once from `ld sp,0x7fff`. PC advances to the next source instruction. Continue stepping and watch PC move through the LCD setup code toward `scan_hello`.

The repeated pattern is:

```asm
        ld      c,api_command_to_lcd
        rst     0x10
```

or:

```asm
        ld      c,api_string_to_lcd
        rst     0x10
```

The value in `C` chooses the MON-3 service. The value in `B`, `HL` or `DE` supplies the data for that service.

This is the smallest useful debugging cycle: stop, inspect, step, inspect again.

## Set A Breakpoint

Click in the editor gutter beside an instruction line. VS Code adds a red breakpoint marker.

A filled breakpoint means Debug80 matched the source line to a generated Z80 address. A breakpoint on a blank line, comment or label-only line may stay hollow because breakpoints bind to instruction addresses.

For the starter program, a useful first breakpoint is inside `scan_hello`, on the MON-3 display-scan call:

```asm
        rst     0x10
```

The debug controls will move through the startup code and then stop in the refresh loop.

![Breakpoint in the starter program's scan_hello loop](../../assets/images/debug80-book/book1/chapter3-breakpoint-scan-hello.png)

## Use The Debug Toolbar

The VS Code debug toolbar controls the emulated Z80 while the session is paused or running.

![VS Code debug toolbar during a Debug80 session](../../assets/images/debug80-book/book1/chapter3-debug-toolbar.png)

The first button changes state. When the program is paused, **Continue** runs from the current instruction. When the program is running, **Pause** interrupts execution and returns control to the debugger.

**Step Over** is F10. It executes the current instruction and stops at the next instruction in the current flow. If the current instruction calls a routine, Step Over runs that routine and stops after it returns.

**Step Into** is F11. It follows execution into routines. In Z80 code, that includes `CALL` instructions and `RST` software interrupts.

**Step Out** is Shift-F11. It runs the current routine until it returns to its caller. Use it after F11 has taken you into a routine and you want to get back to the code that called it.

**Restart** rebuilds and relaunches the active target.

**Stop** ends the debug session.

In the starter program, Continue writes the LCD text once and then repeats the `scan_hello` loop so the seven-segment display stays refreshed.

## Run To Cursor

VS Code also provides **Run to Cursor** from the editor context menu and debug controls. During a Debug80 session, place the cursor on an instruction line and use the normal VS Code action.

Debug80 resolves that source line through the source map, runs to the matching machine address and stops there. Use the standard VS Code action for this command.

For the starter program, place the cursor on the `scan_hello:` loop and use **Run to Cursor**. Debug80 runs through the LCD setup and stops at the loop that refreshes the seven-segment display.

![Run to Cursor from the editor context menu](../../assets/images/debug80-book/book1/chapter3-run-to-cursor-menu.png)

Run to Cursor depends on the last successful build. Build the target again when source-line resolution needs fresh source-map data, then place the cursor on an instruction line.

## Conditional Breakpoints

Use a conditional breakpoint when the program should stop for a specific machine state. Right-click a breakpoint, choose **Edit Breakpoint** and enter a Debug80 expression.

![Edit Breakpoint from the editor gutter menu](../../assets/images/debug80-book/book1/chapter3-edit-breakpoint-menu.png)

![Conditional breakpoint expression in the editor](../../assets/images/debug80-book/book1/chapter3-conditional-breakpoint-expression.png)

When execution reaches the breakpoint, Debug80 evaluates the expression. A true or non-zero result stops execution. A false or zero result lets the program continue.

When expression evaluation raises an error, Debug80 stops at the breakpoint and writes the error to the Debug Console. Conditional breakpoints use the same expression language as the Watch panel. Appendix G lists the supported registers, flags, symbols, memory reads and operators.

## Edit And Rebuild

Change the LCD message string once you are comfortable stepping:

```asm
lcd_line1:
        .db     "Debug80 TEC-1G",0
```

Save the file and restart the target.

Debug80 rebuilds during launch. Normal editor-based work starts from VS Code. Assembly errors stop the launch with a diagnostic.

## What To Inspect Next

The starter program gives visible output immediately: the LCD shows the message string, and the seven-segment display is refreshed by the `scan_hello` loop.

The same small program also has useful symbols, constants, register values, memory bytes and display output. Chapter 4 uses those values to introduce Variables, Watches, Call Stack naming, Registers, Memory and the Machine panel.
