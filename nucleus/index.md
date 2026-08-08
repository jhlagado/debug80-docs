---
layout: home
title: Nucleus
nav_order: 8
has_children: true
nav_exclude: true
---

<Mark class="book-plate" book="nucleus" size="52" />

# Nucleus

Nucleus is a small, safe, statically typed language for Z80 systems where
memory and machine cost remain visible. Its companion virtual machine gives
the compiler a precise bytecode target and gives an interpreter author a
complete state-machine contract.

The first compiler is intended to be handwritten in Z80 assembly. Its
executable core and required immutable data must fit in one 16 KiB bank. That
limit shapes the language, compiler, virtual machine, and the evidence used to
admit implementation techniques.

## Specifications

### [Nucleus 0.1 Language Specification](language/)

The complete source-language contract: lexical rules, declarations, types,
storage, expressions, control flow, routines, failure handling, grammar,
static and runtime semantics, and conformance examples.

### [Nucleus Virtual Machine 0.1 Specification](vm/)

The complete execution contract: image format, machine state, slots,
instruction encoding, opcodes, calls, activation storage, failures, traps,
system services, validation, Z80 mapping, and conformance vectors.

## Design boundary

Nucleus owns its terminology, grammar, source semantics, virtual machine, and
conformance rules. It is designed as an autonomous system rather than a
profile or implementation level of another language.

The project favours fixed layouts, bounded resources, streaming compilation,
predictive parsing, explicit failure, and measured economies. It avoids
general pointers, heap allocation, garbage collection, runtime type tags, and
filesystem work inside the compiler. An external build driver supplies one
ordered multipart source stream from a flat manifest.

The two books published here are generated from single authoritative Markdown
files in the [Debug80 repository](https://github.com/jhlagado/debug80/tree/main/packages/nucleus/docs).
