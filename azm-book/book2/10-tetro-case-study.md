---
layout: default
title: "Chapter 10 — Tetro Case Study"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 11
---
[← A Cooperative Runtime](09-cooperative-runtime.md) | [Book 2](index.md) | [Pacmo Case Study →](11-pacmo-case-study.md)

# Chapter 10 — Tetro Case Study

This chapter will use Tetro as a larger TEC-1G program tour.

Planned coverage:

- target entry file and include order
- shared hardware services vs game-specific rules
- precomputed piece rotations
- collision against an 8x8 board
- row clearing and scoring
- double-buffered matrix rendering
- LCD status wrappers
- seven-segment score updates
- sound event wrappers
- pause, splash, restart, and game-over flow

The point is not to teach a genre. The point is to show how a complete 8x8 TEC-1G program keeps several pieces of hardware alive while still running meaningful game logic.

---

[← A Cooperative Runtime](09-cooperative-runtime.md) | [Book 2](index.md) | [Pacmo Case Study →](11-pacmo-case-study.md)
