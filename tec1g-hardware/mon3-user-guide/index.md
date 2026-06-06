---
layout: default
title: "MON-3 User Guide"
parent: "TEC-1G Hardware"
nav_order: 1
has_children: true
has_toc: false
author: "Brian Chiha"
---

# MON-3 User Guide

**MON3 User Guide v1.6** is Brian Chiha's guide to the MON-3 monitor ROM for the TEC-1G single-board Z80 computer.

## Attribution

This web edition is adapted from the original PDF title page credit: **User Guide By Brian Chiha v1.6**. Brian Chiha is the author of this text and should be credited as the author wherever this guide is referenced.

Mon3 (Talking Electronics Computer Monitor version 3) is custom-built for the TEC-1G Single Board Z80 Computer. Mon3 is the heart of the TEC-1G. It brings the hardware to life. Consider it an operating system that provides the ability to program the TEC. The monitor is designed for beginners who are just learning to code Z80 and rich enough for the advanced software developer.

![MON-3 illustration](../../assets/images/tec1g-hardware/mon3-user-guide/page-01-figure-1.png)

![MON-3 illustration](../../assets/images/tec1g-hardware/mon3-user-guide/page-01-figure-2.jpg)

The version of this document matches the monitor's binary file version. For example, version 1.2 of this document is for file `MON3-1G_BC23-12.bin`. The `12` at the end of the file is the version number.

MON-3 provides the operating environment for the TEC-1G: reset behaviour, the main menu, data entry mode, debugging support, terminal monitor, API calls, add-on interfaces, drive access, quick-start programs, and hardware reference material.

## Detailed Contents

1. [Basic Operation](01-basic-operation.md)
   - [Cold Reset](01-basic-operation.md#cold-reset)
   - [Warm Reset](01-basic-operation.md#warm-reset)
2. [Main Menu](02-main-menu.md)
   - [Intel HEX Load](02-main-menu.md#intel-hex-load)
   - [Drive Access](02-main-menu.md#drive-access)
   - [Smart Block Copy](02-main-menu.md#smart-block-copy)
   - [Block Backup](02-main-menu.md#block-backup)
   - [Export Z80 Assembly](02-main-menu.md#export-z80-assembly)
   - [Export Raw Data](02-main-menu.md#export-raw-data)
   - [Export Hex Dump](02-main-menu.md#export-hex-dump)
   - [Import Binary File](02-main-menu.md#import-binary-file)
   - [Music Routine](02-main-menu.md#music-routine)
   - [Settings](02-main-menu.md#settings)
   - [Credits](02-main-menu.md#credits)
3. [Memory Map](03-memory-map.md)
   - [Address Space](03-memory-map.md#address-space)
   - [Notes](03-memory-map.md#notes)
4. [Data Entry Mode](04-data-entry-mode.md)
   - [Basic Operation](04-data-entry-mode.md#basic-operation)
   - [LCD Screen](04-data-entry-mode.md#lcd-screen)
   - [Function Keys](04-data-entry-mode.md#function-keys)
5. [Matrix Keyboard](05-matrix-keyboard.md)
   - [Keyboard Connection](05-matrix-keyboard.md#keyboard-connection)
   - [Activation](05-matrix-keyboard.md#activation)
   - [Key Mapping](05-matrix-keyboard.md#key-mapping)
6. [Debugging Programs](06-debugging-programs.md)
   - [Breakpoints](06-debugging-programs.md#breakpoints)
   - [Register Display](06-debugging-programs.md#register-display)
7. [Tiny Basic](07-tiny-basic.md)
   - [Overview](07-tiny-basic.md#overview)
   - [Language Additions](07-tiny-basic.md#language-additions)
   - [Example Programs](07-tiny-basic.md#example-programs)
8. [Terminal Monitor](08-terminal-monitor.md)
   - [Starting up TMON](08-terminal-monitor.md#starting-up-tmon)
   - [Using TMON](08-terminal-monitor.md#using-tmon)
   - [The Command Prompt](08-terminal-monitor.md#the-command-prompt)
   - [DATA mode](08-terminal-monitor.md#data-mode)
   - [TMON Commands](08-terminal-monitor.md#tmon-commands)
9. [TEC Magazine Code on the TEC-1G](09-tec-magazine-code-on-the-tec-1g.md)
   - [Address Changes](09-tec-magazine-code-on-the-tec-1g.md#address-changes)
   - [Keypad Changes](09-tec-magazine-code-on-the-tec-1g.md#keypad-changes)
   - [Conversion Example](09-tec-magazine-code-on-the-tec-1g.md#conversion-example)
10. [Advanced Programming](10-advanced-programming.md)
   - [RST (Restart) commands](10-advanced-programming.md#rst-restart-commands)
   - [Interrupts](10-advanced-programming.md#interrupts)
   - [NMI (Non-Maskable Interrupts)](10-advanced-programming.md#nmi-non-maskable-interrupts)
   - [API (Application Programming Interface) commands](10-advanced-programming.md#api-application-programming-interface-commands)
   - [API Utility Calls](10-advanced-programming.md#api-utility-calls)
   - [API LCD Calls](10-advanced-programming.md#api-lcd-calls)
   - [API Input Calls](10-advanced-programming.md#api-input-calls)
   - [API Serial Data Transfer Calls](10-advanced-programming.md#api-serial-data-transfer-calls)
   - [API Menu & Parameter Calls](10-advanced-programming.md#api-menu-parameter-calls)
   - [API Sound Calls](10-advanced-programming.md#api-sound-calls)
   - [API System Latch Calls](10-advanced-programming.md#api-system-latch-calls)
   - [Miscellaneous Calls](10-advanced-programming.md#miscellaneous-calls)
   - [Real Time Clock (RTC) Add-On Interface](10-advanced-programming.md#real-time-clock-rtc-add-on-interface)
   - [Graphical LCD Add-On Interface](10-advanced-programming.md#graphical-lcd-add-on-interface)
   - [GLCD General Conventions](10-advanced-programming.md#glcd-general-conventions)
   - [GLCD API Call List](10-advanced-programming.md#glcd-api-call-list)
   - [GLCD API Configure Calls](10-advanced-programming.md#glcd-api-configure-calls)
   - [GLCD API Graphics Calls](10-advanced-programming.md#glcd-api-graphics-calls)
   - [GLCD API Text Calls](10-advanced-programming.md#glcd-api-text-calls)
   - [GLCD API Utility Calls](10-advanced-programming.md#glcd-api-utility-calls)
   - [GLCD API Drawing Calls](10-advanced-programming.md#glcd-api-drawing-calls)
   - [GLCD API Terminal Emulator Calls](10-advanced-programming.md#glcd-api-terminal-emulator-calls)
   - [GLCD Examples](10-advanced-programming.md#glcd-examples)
11. [Hard Drive Access](11-hard-drive-access.md)
   - [Access to the Drive](11-hard-drive-access.md#access-to-the-drive)
   - [Drive Access API Calls](11-hard-drive-access.md#drive-access-api-calls)
12. [Quick Start Programs](12-quick-start-programs.md)
   - [Seven Segment HELLO, Direct Data](12-quick-start-programs.md#seven-segment-hello-direct-data)
   - [Seven Segment HELLO, ASCII Conversion](12-quick-start-programs.md#seven-segment-hello-ascii-conversion)
   - [LCD HELLO](12-quick-start-programs.md#lcd-hello)
   - [Matrix Keyboard Echo to the Serial Terminal](12-quick-start-programs.md#matrix-keyboard-echo-to-the-serial-terminal)
   - [Seven Segment Scroller via the Serial Terminal](12-quick-start-programs.md#seven-segment-scroller-via-the-serial-terminal)
   - [Making Bubbles](12-quick-start-programs.md#making-bubbles)
   - [GLCD Font Display](12-quick-start-programs.md#glcd-font-display)
   - [Use the GLCD as a Serial Terminal](12-quick-start-programs.md#use-the-glcd-as-a-serial-terminal)
13. [Appendix](13-appendix.md)
   - [Ports](13-appendix.md#ports)
   - [Serial Connection](13-appendix.md#serial-connection)
   - [Function Key Shortcuts](13-appendix.md#function-key-shortcuts)
   - [LCD Cheatsheet](13-appendix.md#lcd-cheatsheet)
   - [Character Table](13-appendix.md#character-table)
   - [Example Using CGRAM and DDRAM](13-appendix.md#example-using-cgram-and-ddram)
14. [Useful Links](14-useful-links.md)
   - [I/O Connectors](14-useful-links.md#io-connectors)

[Basic Operation →](01-basic-operation.md)
