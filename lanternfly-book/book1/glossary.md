---
layout: default
title: "Glossary"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 17
---

# Glossary

Short definitions for the book's recurring terms, with the chapter that
introduces each.

**Aggregate** — a stored value built from smaller values: a fixed array, a
counted string or a record. Aggregates have fixed layouts and are
reached through paths, parameters and aliases. (Chapter 7)

**Alias** — a temporary, non-rebindable local name for existing aggregate
storage, evaluated once and valid until the routine returns. Not a value:
it cannot be stored, returned or compared. (Chapter 11)

**Capability module** — a standard import, such as
`standard/wide32.lafy`, that legalizes an optional language facility for
the importing module and exports no names. (Chapter 12)

**Counted string** — `string[N]`: a length header, `N` payload cells and
a maintained zero terminator, with the capacity part of the type.
(Chapter 8)

**Entry** — the parameter-free, result-free and source-defined subroutine that
runs first. An executable uses the root module's `main` unless its build
manifest names another entry; the entry may declare `fails`. (Chapters 1 and
14)

**Error** — an expected failure, carried as a member of an error set from
a `fail` statement to a handler or default. (Chapter 14)

**Error set** — an enum with `u8` representation naming the complete,
closed list of ways a routine can fail. (Chapter 14)

**Fault** — a broken contract detected at runtime — an out-of-range
index, a zero divisor. A fault does not return to the failing operation
and no program code intercepts it. (Chapter 3 onward)

**Language operation** — a built-in such as `abs`, `length`, `clear` or
`append`: one meaning everywhere, no import needed. (Chapter 16
distinguishes the three tiers.)

**Module** — one `.lafy` source file of imports and declarations, private
by default, exporting a chosen interface. (Chapter 12)

**Near and far** — target storage classes describing how an aggregate is
reached: `near` storage is directly usable in the current address
context; `far` storage carries extra context such as a bank number.
(Chapter 16)

**Opaque address** — a `near address` or `far address` value: storable,
passable and comparable within its class, with no dereference, arithmetic
or conversion to ordinary storage. (Chapter 16)

**Ordinal** — a type with a finite ordered domain: the integers, an
enumeration or a range. Ordinals govern array indices, `select` cases and
counted loops. (Chapter 5)

**Service module** — a standard import, such as
`standard/text-output.lafy` or `standard/program-arguments.lafy`, that exports
portable operations a target must bind. (Chapters 12 and 13)

**Storage path** — a name plus field selections and index operations
identifying one piece of declared storage: `readings[i].quality`.
(Chapter 9)

**Target profile** — the description of one machine: its CPU, memory
regions, calling conventions, native services and optional capabilities
such as recursion. (Chapter 16)
