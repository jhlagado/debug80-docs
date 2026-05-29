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

## Stop At The First Instruction

Open the Debug80 panel and tick **Stop on entry**. Then click **Build** in the Project section, or press F5.

You can also start from the Command Palette:

```text
Debug80: Start Debugging
```

![Debug80 paused after launch, with Stop on entry enabled and the Build button visible](../../assets/images/debug80-book/book1/chapter3-stop-on-entry-build-paused.png)

The Build button starts the same kind of launch as F5. Use the button when your attention is already in the Debug80 panel. Use F5 when your attention is in the editor.

## Build The Target

Debug80 reads the active target from `debug80.json`. For the starter project, that target points to `src/main.asm`.

During launch, Debug80 asks AZM to assemble the source. The generated program is loaded into the emulated Z80 memory, the TEC-1G profile starts, and VS Code opens a debug session.

When **Stop on entry** is enabled, the session pauses before the program runs freely. The yellow arrow in the editor marks the next instruction. Depending on the launch point, the first pause may show your source file or MON-3 startup source; the same arrow follows execution when control reaches `main.asm`.

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

**Step Into** executes the next source-level step. With the starter program, the first steps set the stack pointer, send commands to MON-3 with `RST 0x10`, and then enter the display refresh loop.

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

## Filled And Hollow Breakpoints

A filled breakpoint has a concrete address. Debug80 can stop there because the source map found the generated instruction.

A hollow breakpoint is waiting for a generated address. Move it to a real instruction line and rebuild. Labels, comments and directives can be important source lines, and the debugger stops on CPU instruction addresses.

## Continue And Pause

The VS Code debug toolbar controls the emulated Z80. Use it the same way you use other VS Code debuggers: continue, pause, step, restart and stop.

**Continue** runs the program from the current instruction. In the starter program, execution writes the LCD text once and then repeats the `scan_hello` loop so the seven-segment display stays refreshed.

**Pause** interrupts the running session and returns control to the debugger. The editor highlights the source line that matches the current PC when the source map can resolve it.

![VS Code debug toolbar during a Debug80 session](../../assets/images/debug80-book/book1/chapter3-debug-toolbar.png)

## Run To Cursor

VS Code also provides **Run to Cursor** from the editor context menu and debug controls. During a Debug80 session, place the cursor on an instruction line and use the normal VS Code action.

Debug80 resolves that source line through the source map, runs to the matching machine address and stops there. Use the standard VS Code action for this command.

For the starter program, place the cursor on the `scan_hello:` loop and use **Run to Cursor**. Debug80 runs through the LCD setup and stops at the loop that refreshes the seven-segment display.

![Run to Cursor from the editor context menu](../../assets/images/debug80-book/book1/chapter3-run-to-cursor-menu.png)

Run to Cursor depends on the last successful build. Build the target again when source-line resolution needs fresh source-map data, then place the cursor on an instruction line.

## Conditional Breakpoints

Use a conditional breakpoint when the program should stop for a specific machine state. Right-click a breakpoint, choose **Edit Breakpoint** and enter a Debug80 expression.

![Edit Breakpoint from the editor gutter menu](../../assets/images/debug80-book/book1/chapter3-edit-breakpoint-menu.png)

Examples for the starter program:

```asm
PC eq scan_hello
C eq api_scan_segments
DE eq seven_seg_hello
```

When execution reaches the breakpoint, Debug80 evaluates the expression. A true or non-zero result stops execution. A false or zero result lets the program continue.

When expression evaluation raises an error, Debug80 stops at the breakpoint and writes the error to the Debug Console. Conditional breakpoints use the same expression language as the Watch panel. Appendix G lists the supported registers, flags, symbols, memory reads and operators.

## Step Over And Step Out

**Step Over** and **Step Out** matter once a program calls subroutines.

Step Over runs a call as a single source-level action when Debug80 can resolve the call boundary. Step Out runs until the current routine returns or until the configured instruction cap stops it.

The starter uses `RST 0x10` monitor calls rather than ordinary `CALL` instructions. Step Over is useful when you want to advance past a monitor call while leaving ROM details for later. Use Step Out later when your own program contains `CALL` and `RET`.

## Restart And Stop

**Restart** rebuilds and relaunches the active target. Use it after changing source.

**Stop** ends the debug session. The project remains selected, so the next F5 or **Build** starts the same target again.

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
