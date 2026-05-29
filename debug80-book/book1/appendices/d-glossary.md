---
layout: default
title: "Appendix D — Glossary"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 104
---

[← Appendix C — Image And Screenshot Plan](c-image-plan.md) | [Book 1](../index.md) | [Appendix E — TEC-1G Quick Reference →](e-tec1g-quick-reference.md)

# Appendix D — Glossary

## Active Target

The target Debug80 will launch when you press F5 or click the Project section's build button.

## AZM

The assembler used by the current Debug80 workflow. AZM turns `.asm` and `.z80` source into machine code and Debug80 mapping artifacts.

## Breakpoint

A stop point set in the editor. Debug80 binds a source breakpoint to a generated Z80 address when source-map data is available.

## Conditional Breakpoint

A breakpoint with an expression attached. Debug80 stops when the expression is true or non-zero.

## Build Artifact

A generated file written during launch. This book uses `.hex` and source-map output.

## CoolTerm

A serial terminal program. Debug80 uses CoolTerm's Remote Control Socket to send the active target's HEX file to hardware.

## Debug80 Project

A folder with `debug80.json` at its root.

## Debug Session

The running VS Code debugger session connected to the emulated Z80 machine.

## Intel HEX

A text format for program bytes and addresses. Debug80 loads `.hex` into the emulator and sends `.hex` to hardware through CoolTerm.

## Monitor ROM

Firmware loaded into the emulated machine. The TEC-1G / MON-3 platform uses monitor ROM while your user program runs from RAM at `0x4000`.

## Platform

The machine family Debug80 emulates for a target. This book discusses TEC-1 and TEC-1G.

## Source Map

A build output that records generated Z80 addresses, source file lines and symbols. Debug80 uses the source map from the last successful build for breakpoints, stepping, editor navigation, hover summaries, symbol search and debugger symbol views.

## Source-Map Status

The Project section line that reports whether the active target's source map is current, missing, stale, invalid or waiting for a selected target.

## Target

A named runnable program inside a Debug80 project.

## Debug Expression

An expression evaluated by Debug80 for a Watch or conditional breakpoint. Debug expressions can read Z80 registers, flags, source-map symbols and memory bytes.

## Workspace Folder

A folder opened in the current VS Code window.

[← Appendix C — Image And Screenshot Plan](c-image-plan.md) | [Book 1](../index.md) | [Appendix E — TEC-1G Quick Reference →](e-tec1g-quick-reference.md)
