---
layout: default
title: "Glimmer targets"
parent: "Debug80 Book 1 — Getting started"
nav_order: 8
---

[← Source navigation and ROM source](07-source-navigation.md) | [Book 1](index.md) | [Video, input and serial →](08-video-input-and-serial.md)

# Glimmer targets

Debug80 builds one other kind of program: Glimmer, a reactive game language that compiles to readable Z80 assembly. The compiler ships inside the extension, so there is nothing extra to install. This chapter covers the Debug80 integration; the Glimmer book teaches the language.

## A Glimmer file is another target

A `.glim` file becomes a target the same way an assembly file does, with one extra condition: it must contain a top-level `program` declaration.

Add one with **+** beside the **Target** dropdown, or run **Debug80: Add Target**. Everything from the Targets chapter applies unchanged: the same dropdown, the same **−** to remove, and the same authoritative `debug80.json` configuration.

## Glimmer build output

Select a Glimmer target and click **Build**. The output differs slightly from an assembly build:

```text
build/
  game.asm       the generated Z80 assembly
  game.hex       the program
  game.bin       the same bytes, raw
  game.d8.json   the source map
```

![What a Glimmer build produces](../../assets/images/debug80-book/book1/glimmer-build-output.svg)

Debug80 calls Glimmer's in-process build pipeline, which generates assembly, injects and checks AZM register contracts, assembles the program and rewrites the debug map to refer back to the Glimmer source. It leaves the generated assembly where you can inspect the instructions produced by a declaration.

The pipeline does not emit a separate `.lst` listing or register-contracts report. Build diagnostics appear in VS Code.

## Debugging Glimmer

Set a breakpoint inside a block body and the debugger stops there, in your Glimmer source, with the registers and memory views showing the Z80 underneath.

Step past the end of a block and you continue into the generated assembly, which is how you see the machinery a declaration produced.

The editor features from the source-navigation chapter cover `.glim` too: Go to Definition, hover and workspace symbol search all work once a build is current.

## Strict labels

The **Strict labels** checkbox controls assembly targets built directly by AZM. Glimmer builds currently use the Glimmer pipeline's own label handling, so this checkbox does not change them.

## Learn Glimmer

When you want the language itself, go to [Glimmer Book: Reactive Games for the Z80](../../glimmer-book/book0/). It starts with an empty file, teaches each language construct through programs you can build and run in Debug80, and finishes with two complete games.

---

[← Source navigation and ROM source](07-source-navigation.md) | [Book 1](index.md) | [Video, input and serial →](08-video-input-and-serial.md)
