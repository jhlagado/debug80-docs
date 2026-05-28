---
layout: default
title: "Chapter 2 — Running Under MON-3"
parent: "Debug80 Book 2 — Programming the TEC-1G"
nav_order: 3
---
[← The TEC-1G Reborn](01-tec1g-reborn.md) | [Book 2](index.md) | [Debug80 Workflow →](03-debug80-workflow.md)

# Chapter 2 — Running Under MON-3

This chapter will teach MON-3 as the first programming surface.

Planned coverage:

- why user programs commonly live at `$4000`
- `RST 10H` as the MON-3 API gateway
- the convention: API call number in C, parameters in registers, results in registers or flags
- useful first calls: beep, scan keys, write a character/string to LCD, convert values for seven-segment output, delay
- the difference between a monitor service and direct port programming
- when to use MON-3 first and when to drop below it
- Debug80's MON-3 profile as the same environment in the emulator

This chapter should give readers visible wins before they know every hardware port.

---

[← The TEC-1G Reborn](01-tec1g-reborn.md) | [Book 2](index.md) | [Debug80 Workflow →](03-debug80-workflow.md)
