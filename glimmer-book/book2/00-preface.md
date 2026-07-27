---
layout: default
title: "Preface"
parent: "Glimmer Book 2 — Building Complete Z80 Games"
nav_order: 0
---

# Preface

[Glimmer Book 1](../book1/) introduced the language through small programs
that isolated one idea at a time. By the end of Canvas, those ideas included
structured state, dependency reports, multiple source files and cards. This
book uses that foundation to build and study complete games.

Skyfall provides the first path from a game design on paper to a finished
program. Its declarations identify the stored facts, the moments that drive
play, the resources shown to the player and the cards that control the game
lifecycle. The assembly blocks then supply movement, collision, scoring and
difficulty.

Tetro is a larger matrix game organised across declarations, rules and an
imported assembly engine. Reading it shows where work belongs when a program
outgrows the scale of a tutorial example.

The final three chapters move to the TMS9918 video display processor. Its
tiles, sprites and persistent video memory require a different display
profile, while the Glimmer program retains the same facts, moments, rules,
phases and cards. Lanternfly applies that profile in a complete game, and
the closing comparison identifies the design costs of each display.
