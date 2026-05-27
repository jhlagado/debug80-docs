---
layout: default
title: "Chapter 4 — First Program at $4000"
parent: "AZM Book 2 — Programming the TEC-1G"
nav_order: 5
---
[← Debug80 Workflow](03-debug80-workflow.md) | [Book 2](index.md) | [Keypad Input →](05-keypad-input.md)

# Chapter 4 — First Program at `$4000`

This chapter will assemble and run the first TEC-1G program.

Planned coverage:

- why MON-3 user programs commonly start at `$4000`
- how `.org $4000` differs from the platform-neutral examples in Book 1
- a minimal loop that proves execution without touching much hardware
- calling a simple MON-3 service, such as beep or delay
- using the listing to confirm addresses
- stepping the first instructions in Debug80
- returning to MON-3 or looping deliberately

The goal is a small program whose behavior is visible without needing a full hardware abstraction.

---

[← Debug80 Workflow](03-debug80-workflow.md) | [Book 2](index.md) | [Keypad Input →](05-keypad-input.md)
