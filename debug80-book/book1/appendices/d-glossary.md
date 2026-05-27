---
layout: default
title: "Appendix D — Glossary"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 104
---
# Appendix D — Glossary

## Active Target

The target Debug80 will launch when you press F5 or click the Project section's build button.

## AZM

The assembler used by the current Debug80 workflow. AZM turns `.asm` and `.z80` source into machine code and Debug80 mapping artifacts.

## Breakpoint

A stop point set in the editor. Debug80 binds a source breakpoint to a generated Z80 address when source-map data is available.

## Build Artifact

A generated file written during launch. Book 1 uses `.hex`, `.lst` and source-map output.

## CoolTerm

A serial terminal program. Debug80 uses CoolTerm's Remote Control Socket to send the active target's HEX file to hardware.

## Debug80 Project

A folder with Debug80 configuration. The usual project file is `debug80.json`.

## Debug Session

The running VS Code debugger session connected to the emulated Z80 machine.

## Entry Source

The source file used as the starting point for a target. Debug80 discovers likely AZM entry sources from `.z80` and `.main.asm` filenames.

## Intel HEX

A text format for program bytes and addresses. Debug80 loads `.hex` into the emulator and sends `.hex` to hardware through CoolTerm.

## Listing

An assembler output file used for inspection and fallback source-map lookup.

## Monitor ROM

Firmware loaded into the emulated machine. The TEC-1G / MON-3 profile uses monitor ROM while your user program runs from RAM at `0x4000`.

## Platform

The machine family Debug80 emulates for a target: Simple, TEC-1 or TEC-1G.

## Profile

A named setup for a platform. **TEC-1G / MON-3** is a profile that supplies ROM assets, memory layout and user-code start address.

## Project Kit

A starter configuration that creates a project for a platform profile.

## Source Map

A build output that records generated Z80 addresses, source file lines and symbols. Debug80 uses the source map from the last successful build for breakpoints, stepping, editor navigation, hover summaries, symbol search and debugger symbol views.

## Source-Map Status

The Project section line that reports whether the active target's source map is current, missing, stale, invalid or waiting for a selected target.

## Target

A named runnable program inside a Debug80 project.

## Watch Expression

A VS Code Watch expression evaluated by Debug80 while execution is paused. Debug80 Watch expressions can read Z80 registers, flags, source-map symbols and memory bytes.

## Workspace Folder

A folder opened in the current VS Code window.
