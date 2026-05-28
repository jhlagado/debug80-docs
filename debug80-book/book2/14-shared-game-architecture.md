---
layout: default
title: "Chapter 14 — Shared Game Architecture"
parent: "Debug80 Book 2 — Programming the TEC-1G"
nav_order: 15
---
[← A Cooperative Runtime](13-cooperative-runtime.md) | [Book 2](index.md) | [Tetro Case Study →](15-tetro-case-study.md)

# Chapter 14 — Shared Game Architecture

This chapter will explain the common layer shared by the Tetro and Pacmo programs.

Planned coverage:

- target entry files and include order
- shared hardware facts: ports, colours, key codes, dimensions
- scan tick as the hardware heartbeat
- framebuffer helpers
- LCD primitives and screen scripts
- seven-segment score/HUD helpers
- sound service and game-local sound wrappers
- what belongs in shared code and what stays game-specific

This chapter exists because the two case studies are large enough that their common foundation deserves its own explanation.

---

[← A Cooperative Runtime](13-cooperative-runtime.md) | [Book 2](index.md) | [Tetro Case Study →](15-tetro-case-study.md)
