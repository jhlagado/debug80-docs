---
layout: default
title: "Inspect A Running Program"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 4
---

[← Run The Debugger](03-build-and-step.md) | [Book 1](index.md) | [Use The Debug80 Panel →](05-use-the-debug80-panel.md)

# Inspect A Running Program

Paused execution gives you time to inspect a program from several angles. Start with the source-map-backed symbols in VS Code, then use Debug80's Registers, Memory and Machine sections to connect source lines with CPU state and visible TEC-1G output.

## Symbols And Constants In Variables

Open the **Run and Debug** sidebar and expand **Variables**. Debug80 uses this standard VS Code panel for source-map-backed symbols and constants.

After a successful build, Debug80 can show **Symbols** and **Constants** scopes. Constants show their assembled value. Memory-backed symbols show conservative raw memory information: address, first byte, a word value when the size suggests one, a short byte preview for larger data and printable ASCII where useful.

In the example below, `LcdLine1` expands into the address, byte and word values, a short byte preview, printable ASCII and source location. Debug80 shows source-map-backed memory conservatively. When type or storage metadata is absent, the Variables panel shows raw memory.

These scopes use the source map from the last successful build. Build the target again when symbols need to be generated or refreshed.

![Variables panel showing source-map-backed symbols](../../assets/images/debug80-book/book1/chapter4-variables-symbols.png)

## Watch Expressions

Open the **Watch** panel while execution is paused. Debug80 evaluates Z80-focused Watch expressions against the current CPU state, memory and source-map symbols.

Start with the registers that usually matter while stepping:

```asm
PC
SP
C
HL
DE
```

Register names read the current Z80 register value. Flag names use the same spelled-out style as AZM register-care contracts, so `carry` means the carry flag and `C` means the C register.

Watches can also use symbols from the active source map:

```asm
ScanHello
LcdLine1
SevenSegHello
PC = ScanHello
DE = SevenSegHello
```

A symbol by itself evaluates to its address or constant value. Build the active target again when a symbol Watch needs to be generated or refreshed.

Square brackets read one byte from memory at the address inside the brackets:

```asm
[HL]
[DE]
[LcdLine1]
[SevenSegHello]
```

Use Watches when you want a small set of facts to stay visible while stepping. In the example below, the watched values show the current PC, the service register, a pointer register, symbols from the source map and a byte read through `DE`. Appendix G lists the shared expression language used by Watches and conditional breakpoints.

![Watch panel showing Debug80 expressions](../../assets/images/debug80-book/book1/chapter4-watch-expressions.png)

## Call Stack Naming

Open the **Call Stack** view while the program is paused. Debug80 names the current Z80 execution frame from the nearest known symbol in the source map.

For a target with labels in the source map, you may see names such as:

```text
Start
ScanHello
ScanHello+3
```

The `+3` form means the current PC is three bytes after the named symbol. This symbolic name identifies the current execution location.

Z80 programs expose execution through registers, memory and branch targets. Debug80 gives the current address a useful name when the source map contains a nearby label.

![Call Stack with symbolic Debug80 frame names](../../assets/images/debug80-book/book1/chapter4-call-stack-symbols.png)

## The Registers Section

Registers live in Debug80's dedicated **Registers** section. That keeps CPU state close to the memory and hardware views.

Open the **Registers** section in the Debug80 panel. It shows CPU state in the panel, close to the hardware views.

PC is the program counter. It names the next instruction address.

SP is the stack pointer. It names the top of the Z80 stack.

The register pairs AF, BC, DE, HL, IX and IY are the main working registers you will inspect while debugging Z80 programs. The Z80 course material explains the instruction set in detail.

Step a target and watch PC change. It starts at the target's load address, then moves through each instruction as the Z80 executes it.

![Debug80 Registers section](../../assets/images/debug80-book/book1/chapter4-registers.png)

The PC value is useful because it confirms what the editor is showing. When the highlighted source line and PC describe the same instruction, the source view and machine state agree. When source-map data resolves to raw address view, the PC still tells you where execution stopped.

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

![Memory section showing bytes around PC and pointer registers](../../assets/images/debug80-book/book1/chapter4-memory.png)

The memory panel refreshes when it is visible and the debug session is paused. In the example, the PC view shows instruction bytes, while HL and DE point at the seven-segment data. The ASCII column makes strings and readable bytes easy to spot.

Use **Absolute** when the address comes from the source or hardware manual. Use a register-relative view when the address comes from the CPU state. For example, use PC to inspect instructions, SP to inspect the stack and HL when a routine uses HL as a pointer.

## Connect Source To Memory

When PC is at a target address, the memory view around PC shows the bytes generated for the highlighted instruction.

That connection between source lines and memory addresses is what makes source-level debugging possible. The source map carries this relationship.

## The Machine Section

The **Machine** section shows the front-panel parts of the TEC-1G that you touch most often: LCD, seven-segment display and keypad.

Open the **Machine** section in the Debug80 panel. You should see the LCD at the top left, the six-digit seven-segment display below it and the keypad on the right.

![Machine section with LCD, seven-segment display and keypad](../../assets/images/debug80-book/book1/chapter4-machine-section.png)

The Machine section is where the emulator starts to feel like the target board. A normal debugger can show variables and stack frames. Debug80 also shows the devices your Z80 program is driving.

## Panel Focus And Keypad Input

VS Code sends key presses to the editor until the webview has focus. Click inside the Machine section before using keyboard shortcuts for the keypad.

If input goes to the source editor, click the keypad area and try again. The on-screen keys work even when keyboard focus is unclear.

The keypad sends input to the emulated TEC-1G runtime. Programs that read the keypad see the same kind of input they would receive from the hardware keypad.

The exact key meanings depend on the monitor or program that is currently running. When you are debugging your own program, stop at the code that reads the keypad and watch the relevant register or memory location.

Use an on-screen key first. Then switch to keyboard shortcuts after the panel has focus and the program is reading input as expected.

## LCD And Seven-Segment Output

The LCD and seven-segment display update from the emulated I/O ports. TEC-1G programs often reach those devices through MON-3 services.

When a program writes to the LCD, the panel shows the result. When a program refreshes the seven-segment display in a loop, the panel shows the current display state while the CPU continues to run.

## Displays Section

The **Displays** section contains TEC-1G display hardware beyond the front-panel LCD and seven-segment digits. It includes the GLCD, the 8x8 RGB LED matrix, speed controls and display-state toggles.

![Displays section with GLCD and RGB matrix](../../assets/images/debug80-book/book1/chapter4-displays-tetro.png)

The RGB matrix is useful for programs that scan LEDs over time. Debug80 renders the duty-cycle brightness, so a dim pixel and a bright pixel can indicate different timing in the program.

![8x8 RGB LED matrix output](../../assets/images/debug80-book/book1/chapter4-rgb-matrix.png)

## Speaker, Speed And Mute

The TEC-1G panel includes speaker, speed and mute controls in the display area. Use **MUTED** to prevent sound while debugging. The speed control lets the panel request a different run mode from the emulator.

[← Run The Debugger](03-build-and-step.md) | [Book 1](index.md) | [Use The Debug80 Panel →](05-use-the-debug80-panel.md)
