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

**Lower camel case**, often shortened to **camel case**, begins with a
lowercase word and capitalizes each later word: `playerScore` or
`updatePlayer`. **Pascal case** follows the same pattern but capitalizes the
first word as well: `PlayerScore` or `GameState`. Lanternfly uses the first
form for values and routines, and the second for user-defined types.

Identifiers begin with an ASCII letter. Later characters may be ASCII letters,
digits or `_`; canonical names still use lower camel case or Pascal case.

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

## Declaration order

A module is read in declaration order. Its imports come first and make their
exports visible. Each local declaration becomes available only after the
compiler has checked it completely. Code may therefore use imported names and
earlier local declarations, but not declarations that appear later in the
file.

Routine signatures are the bounded exception, in two forms. After a `sub`
header is checked, its signature becomes visible before its body, so the
routine may call itself. A `forward sub` declaration makes a signature
visible before its body has appeared at all; chapter 9 gives the completion
rules. A body may call imported routines, earlier local routines, itself
and any visible forward-declared routine; it cannot call a routine whose
signature appears later.

The rule applies to types, constants, enum members, storage, external
routines and ordinary routines. In particular:

- a type annotation may name only an imported or earlier type;
- an initializer cannot name itself or a later declaration;
- a layout path may begin only with imported or earlier storage;
- a routine-body constant context may use imported or earlier module
  constants and enum members;
- a record field type must already be complete.

This declaration-before-use rule prevents source declaration cycles from
forming. A compiler may still retain a syntax tree or use several internal
passes, but it must accept the same programs as a compiler that checks the
module in order. Import cycles remain a separate module error.

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
type namespace inside `size`, `count`, `lower` and `upper`, and remains
available as an ordinary identifier elsewhere. The word
`error` is likewise contextual, recognized only immediately after `on`
([chapter 14](14-error-handling.md)).

[Chapter 12](12-grammar-and-words.md#word-inventory) lists the complete
inventory.
