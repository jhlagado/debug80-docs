---
layout: default
title: "Chapter 9 — A Cooperative Runtime"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 10
---
[← LCD Output](08-lcd-output.md) | [Book 2](index.md) | [Tetro Case Study →](10-tetro-case-study.md)

# Chapter 9 — A Cooperative Runtime

This chapter will bring the hardware pieces together.

Planned coverage:

- the no-background-task constraint
- a main loop shaped as scan service plus logic service
- keeping the matrix visible while doing useful work
- spreading a logical frame across display rows
- servicing sound and seven-segment scan during the same loop
- deciding what belongs in shared hardware routines and what belongs in program logic

The key pattern is:

```asm
main_loop:
    call scan_tick
    call logic_tick
    jr main_loop
```

The real work is deciding what each tick is allowed to do before the hardware needs service again.

---

[← LCD Output](08-lcd-output.md) | [Book 2](index.md) | [Tetro Case Study →](10-tetro-case-study.md)
