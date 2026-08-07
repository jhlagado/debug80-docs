---
layout: "default"
title: "1. Status and conformance"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 1
pageClass: "nucleus-specification"
---
[Contents](./) · [2. Purpose, constraints, and non-goals →](02-purpose-constraints-and-non-goals.md)

<div id="1-status-and-conformance" class="nucleus-source-anchor"></div>

# 1. Status and conformance

<div id="11-status" class="nucleus-source-anchor"></div>

## 1.1 Status

This document defines the Nucleus Virtual Machine 0.1, abbreviated NVM 0.1. It is the normative contract for NVM 0.1 bytecode images, loaders, interpreters, service adapters, and native backends. It is a working specification until the Nucleus 0.1 release is frozen.

The [Nucleus 0.1 Language Specification](../nucleus/) governs source-language meaning. This document governs the execution target. If the books conflict about source meaning, the language specification prevails. If they conflict about an NVM encoding or state transition, this document prevails. Architecture and history papers are non-normative.

In this document, **must** and **must not** state conformance requirements. **May** permits a choice. **Should** states a recommendation whose exception requires a documented reason.

<div id="12-conforming-artifacts" class="nucleus-source-anchor"></div>

## 1.2 Conforming artifacts

A conforming NVM 0.1 image satisfies every structural and instruction rule in Chapter 19. A conforming loader rejects an invalid image before its first instruction executes. Rejection is a loader result, not a Nucleus safety trap.

A conforming interpreter implements every assigned opcode and service transition, preserves all observable ordering, and stops in the specified halt or trap state. It may use any internal representation that has the same behavior. It must document its image-size, data-size, activation, and host-resource limits.

A conforming compiler emits only valid images and preserves the language specification. Compilation failure is preferable to emitting an image whose behavior is unspecified. A compiler may emit a strict subset of valid instruction sequences, but it may not redefine an opcode.

A conforming native backend consumes the same semantic operations and meets Chapter 18. It need not serialize an NVM image. A serialized bytecode program and native output compiled from the same valid source must be observably equivalent within their documented capacities.

<div id="13-version-and-extension-policy" class="nucleus-source-anchor"></div>

## 1.3 Version and extension policy

The image identifies NVM version 0.1 and Nucleus System Services version 0.1 separately. Version fields are exact, not minimum-version claims. An NVM 0.1 loader rejects other values.

Opcodes and flag bits marked reserved are invalid in a 0.1 image. Extensions require another VM version or an explicitly selected non-conforming mode. An extension must not change the meaning of an image accepted as NVM 0.1.

Tests and the executable model are evidence for this contract. They do not override it.
