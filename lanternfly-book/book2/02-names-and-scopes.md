---
layout: default
title: "Names and Scopes"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 2
---

# Names and Scopes

Lanternfly does not make capitalization part of a name. Keywords, built-in
names and user declarations all resolve case-insensitively. Tools nevertheless
preserve the spelling at the declaration, so consistent capitalization still
makes source easier to scan.

## Canonical spelling

| Category                         | Canonical form   | Example                       |
| -------------------------------- | ---------------- | ----------------------------- |
| Keywords and built-in operations | lowercase        | `if`, `record`, `count`       |
| Built-in types                   | lowercase        | `u8`, `string[24]`            |
| Values and routines              | lower camel case | `playerScore`, `updatePlayer` |
| User-defined types               | Pascal case      | `Actor`, `GameState`          |

These forms are reading conventions rather than semantic distinctions.
Declarations that differ only in case conflict in the same namespace.

Identifiers begin with an ASCII letter. Later characters may be ASCII
letters, digits or `_`. The `_` character is permitted, although lower camel
case and Pascal case are canonical.

## Type and value namespaces

Each module has one type scope and one value scope:

- record, enum and range declarations enter the type scope;
- enum members, constants, variables, routines and external routines enter the
  value scope.

A type and a value may share a name. A type annotation looks in the type scope,
while a declaration name or expression looks in the value scope. Canonical
capitalization makes the roles visible, as with a type named `Actor` and a
value named `actor`.

A user-defined type and a callable routine may not share a case-insensitive
name. That restriction keeps a call-like form unambiguously a type operation
or a routine invocation. A storage declaration and a routine also conflict
because both occupy the value scope.

## Module collection and source order

The compiler first collects every module declaration name, then checks
declaration and routine bodies. A type annotation may therefore name a later
user-defined type, and a routine may call another routine declared later in the
module.

Constant initializers and placement expressions retain a source-order rule:

- imported exports precede local declarations;
- a local declaration expression may use only earlier constants or enum
  members;
- a layout path may begin only with earlier storage;
- routine-body constant contexts may use any successfully initialized module
  constant.

Constant values, ordinal domains, string capacities, array domains, record
layouts, target addresses and layout queries share one dependency graph. If
that graph contains a cycle, the diagnostic includes the complete dependency
path.

## Routine scope

A routine has one value scope containing its parameters and locals.

- Parameter names are distinct.
- A parameter or local cannot shadow a visible module or imported value.
- A local cannot reuse a parameter or earlier local name.
- A local becomes visible after its declaration.
- A local initializer may use parameters, module declarations and earlier
  locals, but not itself or a later local.

A `for each` binding adds a nested value name for its body. It cannot shadow a
module value, parameter, local or enclosing traversal binding.

## Reserved names

Keywords, built-in type names and built-in operation names are reserved under
case-insensitive comparison. The word `type` is contextual: it selects the
type namespace inside `size` and `count`, and remains available as an ordinary
identifier elsewhere.

[Chapter 12](12-grammar-and-words.md#word-inventory) lists the complete
inventory.
