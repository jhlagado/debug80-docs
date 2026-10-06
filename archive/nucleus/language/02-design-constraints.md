---
layout: "default"
title: "2. Design constraints"
parent: "Nucleus 0.1 Language Specification"
nav_order: 2
pageClass: "nucleus-specification"
---
[← 1. Status and conformance](01-status-and-conformance.md) · [Contents](./) · [3. Source text and lexical rules →](03-source-text-and-lexical-rules.md)

<div id="2-design-constraints" class="nucleus-source-anchor"></div>

# 2. Design constraints

<div id="21-scope" class="nucleus-source-anchor"></div>

## 2.1 Scope

This chapter records the constraints that shape Nucleus source semantics. Later
chapters define the language in detail. The reviewers' charter and
implementation plan govern compiler budgets, measurements, and feature
admission; the Z80 runtime and backend contract governs target representation.

Nucleus 0.1 is one language. It has no implementation-selected syntax profiles
or optional dialects. A conforming implementation may use a different host or
internal architecture, but it must accept and execute the same language.

<div id="22-language-shaping-constraints" class="nucleus-source-anchor"></div>

## 2.2 Language-shaping constraints

Nucleus is a safe, practical, structured language for small Z80 systems. The
complete language is the language defined by Chapters 3–17; a compiler does not
conform by implementing a smaller subset.

The grammar is deterministic, uses canonical forms, and requires no
backtracking. Grammar terseness is not an independent design goal.

A conforming compiler must perform every source-safety check for which compilation provides sufficient information. Safety conditions that depend on runtime values must produce defined traps. Source code has no raw pointer arithmetic or unchecked reinterpretation. Later chapters define the checks, traps, and source types.

Every implementation capacity must have an explicit limit and a diagnostic for excess. Exhausting a symbol table, input limit, nesting limit, or other bounded resource must not alter program meaning or produce silently incorrect output.

<div id="23-ordered-compilation" class="nucleus-source-anchor"></div>

## 2.3 Ordered compilation

Bulk storage may be available but slow. The compiler consumes the ordered multipart compilation stream defined by Chapter 4 and emits one logical Z80 program and static-data output. A platform may materialize either stream in external storage. Physical source discovery, ordering, and transport do not require the compiler to retain the whole program in memory.

Declarations precede use. An explicit forward routine declaration is the sole
exception and supplies the signature needed to check later calls. Chapter 13
defines that declaration and its completion.

The source rules support bounded, streaming compilation, but do not prescribe
a compiler's private representation. An abstract syntax tree, semantic
transcript, fixup table, or direct emitter has no source-level meaning.

<div id="24-system-boundary-and-portability" class="nucleus-source-anchor"></div>

## 2.4 System boundary and portability

Chapter 16 defines the services visible to source programs. Target memory
placement, output transport, and compiler-host services are outside the
language unless a later chapter explicitly makes them observable.

Nucleus 0.1 defines no interrupt routine, interrupt or restart vector declaration, interrupt-reentrant calling convention, or interrupt-safe service guarantee. The compiler emits no interrupt vector table. A target may interrupt a Nucleus program only through a handler outside the language that preserves the program's machine state and does not enter a Nucleus routine or service.

A target may assign ordered source parts to banked target regions without
changing part order, declaration visibility, or source identity. Banking
introduces no source construct, address value, or alternate return convention.
The target-system specification and Z80 runtime contract define bank placement
and may diagnose references that their banked representation cannot preserve
safely; such a target restriction does not make the source program invalid
under this specification.
