---
layout: default
title: "Chapter 15 — Tetro Case Study"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 16
---
[← Shared Game Architecture](14-shared-game-architecture.md) | [Book 2](index.md) | [Pacmo Case Study →](16-pacmo-case-study.md)

# Chapter 15 — Tetro Case Study

This chapter will begin the Tetro code tour. It may split into several chapters once the full treatment is written.

Planned coverage:

- target entry file and include order
- shared hardware services vs Tetro-specific rules
- precomputed piece rotations
- active-piece state
- collision against an 8x8 board
- movement, rotation, gravity, and lock
- row clearing and scoring
- double-buffered matrix rendering
- LCD status wrappers
- seven-segment score updates
- sound event wrappers
- pause, splash, restart, and game-over flow

The point is not to teach a genre. The point is to show how a complete 8x8 TEC-1G program keeps several pieces of hardware alive while still running meaningful game logic.

---

[← Shared Game Architecture](14-shared-game-architecture.md) | [Book 2](index.md) | [Pacmo Case Study →](16-pacmo-case-study.md)
