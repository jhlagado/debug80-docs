---
layout: default
title: "Inspect The Machine"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 4
---
# Inspect The Machine

Paused execution gives you time to inspect the emulated machine. Start with the source-map-backed symbols in VS Code, then use Debug80's Registers and Memory sections when you need CPU state or bytes at an address.

## Symbols And Constants In Variables

Open the **Run and Debug** sidebar and expand **Variables**. Debug80 uses this standard VS Code panel for source-map-backed symbols and constants.

After a successful build, Debug80 can show **Symbols** and **Constants** scopes. Constants show their assembled value. Memory-backed symbols show conservative raw memory information: address, first byte, a word value when the size suggests one, a short byte preview for larger data and printable ASCII where useful.

Debug80 does not guess rich types. If the source map lacks type or storage metadata, the Variables panel shows raw memory.

These scopes use the source map from the last successful build. If symbols are missing or look stale, build the target again.

> **Image placeholder:** VS Code Variables view showing Symbols and Constants during a paused Debug80 session.

## Watch Expressions

Open the **Watch** panel while execution is paused. Debug80 evaluates Z80-focused Watch expressions against the current CPU state, memory and source-map symbols.

Start with registers and flags:

```asm
A
HL
PC
zero
not carry
```

Register names read the current Z80 register value. Flag names use the same spelled-out style as AZM register-care contracts, so `carry` means the carry flag and `C` means the C register.

Watches can also use symbols from the active source map:

```asm
PACMO_LIVES
PC eq MainLoop
```

A symbol by itself evaluates to its address or constant value. If a symbol watch is missing or stale, build the active target again.

Square brackets read one byte from memory at the address inside the brackets:

```asm
[HL]
[PACMO_LIVES]
[IX + 4]
```

Use Watches when you want a small set of facts to stay visible while stepping. Appendix G lists the shared expression language used by Watches and conditional breakpoints.

> **Image placeholder:** VS Code Watch panel showing Debug80 expressions such as `A`, `zero`, `[HL]` and `PC eq MainLoop`.

## Call Stack Naming

Open the **Call Stack** view while the program is paused. Debug80 names the current Z80 execution frame from the nearest known symbol in the source map.

You may see names such as:

```text
UpdatePlayer
UpdatePlayer+6
RenderSprite+12
```

The `+6` form means the current PC is six bytes after the named symbol. This is a symbolic name for the current execution location, not a full high-level call stack.

Z80 programs do not naturally expose stack frames in the same way as a language runtime such as JavaScript or Python. Debug80 still gives the current address a useful name when the source map contains a nearby label.

> **Image placeholder:** VS Code Call Stack view showing a symbolic Debug80 frame name such as `UpdatePlayer+6`.

## The Registers Section

Registers live in Debug80's dedicated **Registers** section. That keeps CPU state close to the memory and hardware views.

Open the **Registers** section in the Debug80 panel. It shows CPU state in the panel, close to the hardware views.

PC is the program counter. It names the next instruction address.

SP is the stack pointer. It names the top of the Z80 stack.

The register pairs AF, BC, DE, HL, IX and IY are the main working registers you will inspect while debugging Z80 programs. This book uses them only as needed; the Z80 course material explains the instruction set in detail.

Step the starter program and watch PC change. With the starter loop, PC moves from `0x4000` to the jump instruction and then returns to `0x4000`.

> **Image placeholder:** Debug80 Registers section with PC visible.

The value is useful because it confirms what the editor is showing. If the editor highlights `NOP` and PC is `0x4000`, the source view and machine state agree. If the editor cannot find a source line for the current address, the raw PC still tells you where execution stopped.

The panel register view also keeps your attention near the emulated hardware. When you are debugging display or keypad code, this matters more than it does in a normal desktop program: the code, CPU state and machine front panel all belong to the same moment.

## The Memory Section

Open the **Memory** section while the session is paused. The memory panel can show bytes relative to several registers:

- PC
- SP
- BC
- DE
- HL
- IX
- IY
- Absolute

Choose **PC** to see the bytes at the current instruction. Choose **Absolute** when you want to type an address yourself.

> **Image placeholder:** Memory section showing bytes around PC at `0x4000`.

The memory panel refreshes when it is visible and the debug session is in a state where Debug80 can safely read memory. If the program is running, pause it before you expect a stable memory view.

Use **Absolute** when the address comes from the source or hardware manual. Use a register-relative view when the address comes from the CPU state. For example, use PC to inspect instructions, SP to inspect the stack and HL when a routine uses HL as a pointer.

## Connect Source To Memory

The starter source begins at `0x4000`. When PC is `0x4000`, the memory view around PC shows the bytes generated for the first instruction.

That connection between source lines and memory addresses is what makes source-level debugging possible. Chapter 6 explains the source map that carries this relationship.

## The Machine Section

The **Machine** section shows the front-panel parts of the TEC-1G that you touch most often: LCD, seven-segment display and keypad.

Open the **Machine** section in the Debug80 panel. You should see the LCD at the top left, the six-digit seven-segment display below it and the keypad on the right.

> **Image placeholder:** Machine section open, showing LCD, seven-segment display and keypad.

The Machine section is where the emulator starts to feel like the target board. A normal debugger can show variables and stack frames. Debug80 also shows the devices your Z80 program is driving.

## Click The Panel Before Typing

VS Code sends key presses to the editor until the webview has focus. Click inside the Machine section before using keyboard shortcuts for the keypad.

If input goes to the source editor, click the keypad area and try again. The on-screen keys work even when keyboard focus is unclear.

> **Image placeholder:** Edited screenshot showing the panel area to click before typing.

## Keypad Input

The keypad sends input to the emulated TEC-1G runtime. Programs that read the keypad see the same kind of input they would receive from the hardware keypad.

The exact key meanings depend on the monitor or program that is currently running. When you are debugging your own program, stop at the code that reads the keypad and watch the relevant register or memory location.

If you are unsure whether a key reached the emulator, use an on-screen key first. Then switch to keyboard shortcuts after the panel has focus and the program is reading input as expected.

## LCD And Seven-Segment Output

The LCD and seven-segment display update from the emulated I/O ports. If your program writes to the display ports, the panel changes while the emulator runs.

For the starter loop, the displays do not change because the program writes no display data. When you run a program that writes to the LCD or seven-segment ports, this section shows the result.

## Speaker, Speed And Mute

The TEC-1G panel includes speaker, speed and mute controls in the display area. Use **MUTED** to prevent sound while debugging. The speed control lets the panel request a different run mode from the emulator.

Use the screenshots in this chapter to confirm the current labels in your installed extension.

## Before Moving On

You are ready for the full panel tour when you can:

- find source-map-backed Symbols and Constants in the Variables panel
- add a Watch expression for a register, flag, symbol or memory byte
- read the symbolic current location in the Call Stack view
- open the Debug80 Registers section
- inspect memory around PC
- focus the webview before sending keypad input
- identify the LCD, seven-segment display and keypad in the Machine section
