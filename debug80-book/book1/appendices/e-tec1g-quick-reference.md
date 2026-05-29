---
layout: default
title: "Appendix E — TEC-1G Quick Reference"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 105
---

[← Appendix D — Glossary](d-glossary.md) | [Book 1](../index.md) | [Appendix F — Review Checklist →](f-review-checklist.md)

# Appendix E — TEC-1G Quick Reference

This appendix collects the TEC-1G facts used in Book 1. It is a quick reference for the Debug80 panel and MON-3 profile.

## MON-3 Memory Shape

The TEC-1G / MON-3 profile places user code at:

```text
0x4000
```

The emulator also models monitor ROM, RAM, expansion memory and system-control state. The panel exposes important state through labels such as **SHADOW**, **PROTECT**, **EXPAND** and **CAPS**.

![TEC-1G MON-3 memory shape](../../../assets/images/debug80-book/book1/tec1g-mon3-memory-map.svg)

## Panel Sections

| Section | Shows |
|---|---|
| Project | Folder, target, launch options, build state and board transfer. |
| Displays | GLCD, RGB matrix, system LEDs and memory expansion indicators. |
| Machine | LCD, seven-segment display and keypad. |
| Matrix Keyboard | Matrix keyboard mode, modifiers and key grid. |
| Serial | Emulated serial input, output, file send, save and clear. |
| Registers | Z80 register state. |
| Memory | Memory views around registers or an absolute address. |

## Serial Settings For Hardware Transfer

Use these CoolTerm settings for the TEC-1G / MON-3 hardware-transfer workflow:

```text
4800 baud
8 data bits
No parity
2 stop bits
```

Enable CoolTerm's Remote Control Socket in **Preferences > Scripting** and keep the port set to `51413`. Debug80 uses that local socket to tell CoolTerm when to send the active target's HEX file.

For TEC-1G / MON-3 hardware transfer, put the board into Intel HEX Load mode before pressing **Send to Board**. After the transfer, read the seven-segment display:

```text
PASS   load accepted
ERROR  checksum or write verification failed
```

Add the exact TEC-1G / MON-3 Intel HEX Load key sequence after hardware testing or author confirmation.

## Common Debugging Clues

If the panel display changes while stepping, the program is writing the corresponding I/O ports.

If the editor highlights ROM source, execution has entered monitor code.

If a memory write appears to vanish, check whether the program is writing a ROM-protected region or whether the visible panel state depends on a banked memory setting.

[← Appendix D — Glossary](d-glossary.md) | [Book 1](../index.md) | [Appendix F — Review Checklist →](f-review-checklist.md)
