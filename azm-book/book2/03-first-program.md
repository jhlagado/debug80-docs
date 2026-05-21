---
layout: default
title: "Chapter 3 — First Program at $4000"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 4
---
[← Debug80 Workflow](02-debug80-workflow.md) | [Book 2](index.md) | [Ports and Output →](04-ports-and-output.md)

# Chapter 3 — First Program at `$4000`

This chapter will assemble and run the first TEC-1G program.

Planned coverage:

- why MON-3 user programs commonly start at `$4000`
- how `.org $4000` differs from the platform-neutral examples in Book 1
- proving execution with a visible memory or display change
- using the listing to confirm addresses
- stepping the first instructions in Debug80
- returning to MON-3 or looping deliberately

The goal is a small program whose behavior is visible without needing a full hardware abstraction.

---

[← Debug80 Workflow](02-debug80-workflow.md) | [Book 2](index.md) | [Ports and Output →](04-ports-and-output.md)
