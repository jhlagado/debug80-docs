---
layout: default
title: "Running the debugger"
parent: "Debug80 Book 1 — Getting started"
nav_order: 5
---

# Running the debugger

## Starting a session

With a target selected, **Run** starts its debug session.

Cleared, **Stop on entry** lets the machine run straight away. Ticked, it pauses at the machine's launch address before the CPU executes an instruction. A TEC-1G session under MON-3 starts at the reset vector, `$0000`, in the monitor ROM; the starter program assembled from the target's source entry file begins later, at `$4000`.

For this walkthrough, **Stop on entry** is ticked before **Run**, so
the first instruction can be inspected.

## The debug toolbar

The VS Code debug toolbar controls the emulated Z80 while a session is running.

![The VS Code debug toolbar](../../assets/images/debug80-book/book1/debug-toolbar.svg)

Left to right:

- **Continue / Pause**: continue from the current instruction. While the program is running the same button becomes **Pause**.
- **Step Over**: execute the current instruction and stop at the next one in the current flow. When the current instruction calls a subroutine, Step Over runs that routine as one action and stops after it returns.
- **Step Into**: follow execution into a subroutine. In Z80 code this also follows software interrupts, so stepping into `RST 0x10` takes you into the MON-3 service routine.
- **Step Out**: run until the current routine returns to its caller.
- **Restart**: restart the session.
- **Stop**: end the session.

## The program counter

The Z80 program counter, usually written as PC, holds the address of the next instruction.

The source map from the last successful build records which source line produced the instruction at each address, so the editor can show you the line while the register view shows the machine address.

The editor highlights the instruction the Z80 is about to run while
the source-map status line from the last chapter reads `current`.
After any other status, a fresh build restores the mapping.

## Stepping and inspection

**Step Over** keeps you in your program, moving past calls as single
operations. **Step Into** exposes the instructions inside a call, and
**Step Out** returns to the caller after the relevant part of the routine has
been inspected.

## Breakpoints

Clicking the editor gutter beside an instruction line adds a red
marker, which Debug80 binds to the Z80 address generated for that
line.

Breakpoints belong on executable lines. When execution reaches the
address, Debug80 pauses before running the instruction.

![A breakpoint on an instruction line](../../assets/images/debug80-book/book1/editor-breakpoint.svg)

A breakpoint on `LD DE,SevenSegHello` inside `ScanHello`, followed by
**Continue**, stops before the display data is loaded.

## Run to Cursor and Run to Here

**Run to Cursor** reaches one spot without leaving a breakpoint behind. During a session, the command is available from an instruction line's editor context menu.

![Run to Here on a call stack frame](../../assets/images/debug80-book/book1/menu-run-to-here.svg)

From a caller frame's context menu in **Call Stack**, **Run to Here**
continues until execution returns to that frame. **Step Out** returns
through one caller at a time; **Run to Here** can skip several nested
calls when a frame farther down the stack is selected.

Run to Cursor and Run to Here both find their line through the source map, which a fresh build of the target refreshes.

## Conditional breakpoints

A plain breakpoint stops every time. A conditional one stops only in
the machine state under investigation. **Edit Breakpoint** in the
breakpoint's context menu opens its condition.

The inline editor accepts a Debug80 expression. Conditions can use
registers, flags, symbols from the source map and byte reads from
memory, so execution can stop when a counter reaches zero, a pointer
lands on an address, or a particular key value appears.

A true or non-zero result stops the program; a false or zero result lets it run on. If the expression itself errors, Debug80 writes the error to the Debug Console and treats the condition as false.

Conditional breakpoints share their expression language with the Watch panel. Appendix A lists the registers, flags, symbols, memory reads and operators you can use.

## Editing while debugging

Saving any source file while the session runs triggers a rebuild a
moment later, refreshing the source map so breakpoints keep landing on
the intended lines.

The running machine carries on with the code it already has until you **Run** again.
