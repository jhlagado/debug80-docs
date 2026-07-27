---
layout: default
title: "Glimmer targets"
parent: "Debug80 Book 1 — Getting started"
nav_order: 8
---

# Glimmer targets

Debug80 also builds Glimmer, a reactive game language that compiles to Z80 assembly. The compiler ships inside the extension. This chapter covers the Debug80 integration.

## A Glimmer file is another target

A `.glim` file becomes a target the same way an assembly file does, with one extra condition: it must contain a top-level `program` declaration.

The **+** beside the **Target** dropdown and **Debug80: Add Target**
both add a Glimmer target. Everything from the Targets chapter applies
unchanged: the same dropdown, the same **−** to remove, and the same
authoritative `debug80.json` configuration.

## Glimmer build output

With a Glimmer target selected, **Build** produces output that differs
slightly from an assembly build:

```text
build/
  game.asm       the generated Z80 assembly
  game.hex       the program
  game.bin       the same bytes, raw
  game.d8.json   the source map
```

![Glimmer build output files](../../assets/images/debug80-book/book1/glimmer-build-output.svg)

Debug80 calls Glimmer's in-process build pipeline, which generates assembly, injects and checks AZM register contracts, assembles the program and rewrites the debug map to refer back to the Glimmer source. It leaves the generated assembly where you can inspect the instructions produced by a declaration.

The four files listed above are the pipeline's whole output; build diagnostics appear in VS Code.

## Debugging Glimmer

A breakpoint inside a block body stops in the Glimmer source, with the
registers and memory views showing the Z80 underneath.

Stepping past the end of a block continues into the generated
assembly, exposing the machinery produced by the declaration.

The editor features from the source-navigation chapter cover `.glim` too: Go to Definition, hover and workspace symbol search all work once a build is current.

## Strict labels

The **Strict labels** checkbox controls assembly targets built directly by AZM. Glimmer builds use the Glimmer pipeline's own label handling.

## Glimmer language documentation

Language syntax and program examples are documented in the
[Glimmer books](../../glimmer-book/).
