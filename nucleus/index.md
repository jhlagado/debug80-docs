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
memory and machine cost remain visible. Its compiler emits Z80 machine code
directly, while a compact runtime and backend contract fixes packed storage,
calls, services, traps, and generated-code integrity.

The first compiler is handwritten in Z80 assembly. Its
executable core and required immutable data must fit in one 16 KiB bank. That
limit shapes the language, compiler, runtime, and the evidence used to admit
implementation techniques.

## Books and specifications

### [Programming Nucleus](book1/)

A practical course built from complete programs. It begins with values,
storage and routines, then develops fixed data, control flow, recoverable
errors, multipart projects and the compiler-and-debugger workflow.

### [Nucleus 0.1 Language Specification](language/)

The complete source-language contract: lexical rules, declarations, types,
storage, expressions, control flow, routines, failure handling, grammar,
static and runtime semantics, and conformance examples.

### [Nucleus Z80 Runtime and Backend Contract 0.1](runtime/)

The direct execution contract: packed representation, program storage, checked
access, calls, activation storage, failures, traps, system services,
generated-code integrity, conformance, and measurement.

## Design boundary

Nucleus owns its terminology, grammar, source semantics, direct compiler,
runtime contract, and conformance rules. It is designed as an autonomous system
rather than a profile or implementation level of another language.

The project favours fixed layouts, bounded resources, streaming compilation,
predictive parsing, explicit failure, and measured economies. It avoids
general pointers, heap allocation, garbage collection, runtime type tags, and
filesystem work inside the compiler. An external build driver supplies one
ordered multipart source stream from a flat manifest.

Programming Nucleus is maintained in this repository. The language reading
edition is generated from the authoritative specification in the
[standalone Nucleus repository](https://github.com/jhlagado/nucleus). The
runtime reading edition is generated from the authoritative contract in that
repository.
