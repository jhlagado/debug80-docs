---
layout: "default"
title: "3. Machine overview"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 3
pageClass: "nucleus-specification"
---
[← 2. Purpose, constraints, and non-goals](02-purpose-constraints-and-non-goals.md) · [Contents](./) · [4. Address space and memory model →](04-address-space-and-memory-model.md)

<div id="3-machine-overview" class="nucleus-source-anchor"></div>

# 3. Machine overview

<div id="31-processing-route" class="nucleus-source-anchor"></div>

## 3.1 Processing route

The source compiler checks Nucleus types and source categories, then emits target-neutral semantic operations. The first backend serializes those operations as an NVM image. A loader validates the image, allocates zeroed runtime regions, applies static initializers, and starts the entry routine. The interpreter repeatedly decodes one instruction and applies its complete state transition.

A future native backend may consume the semantic operations immediately. The operation vocabulary, not the serialized file, is the frontend/backend boundary.

<div id="32-selected-organization" class="nucleus-source-anchor"></div>

## 3.2 Selected organization

NVM combines a memory-backed word-slot file with explicit argument, result, error, and activation carriers. This organization gives the streaming compiler uniform addressed destinations without requiring expression-tree recovery or Z80 register allocation.

The slot file contains 128 words. A routine owns a prefix of it, declared by its descriptor. Calls save only the prefix that the caller and callee can both clobber. The model remains pure caller-save: the callee owns no preserved state and performs no cleanup.

<div id="33-execution-states" class="nucleus-source-anchor"></div>

## 3.3 Execution states

An instance is in exactly one state:

- **unloaded**: no accepted image exists;
- **ready**: an image is loaded and initialized, but no instruction has run;
- **running**: instructions may execute;
- **halted**: entry returned successfully; or
- **trapped**: a non-recoverable failure stopped execution.

Loading an image creates `ready`. Starting it creates `running`. Only reset or a new successful load leaves `halted` or `trapped`. Stepping any state other than `running` is an implementation-interface error and must not resume the program.

<div id="34-observable-behavior" class="nucleus-source-anchor"></div>

## 3.4 Observable behavior

Observable behavior comprises ordered system-service effects, writes visible through the supplied data image or service boundary, successful termination, recoverable failure results consumed by bytecode, and the final trap record. Interpreter-private dispatch choices are not observable.
