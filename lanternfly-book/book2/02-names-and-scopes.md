---
layout: default
title: "Names and Scopes"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 2
---

# Names and Scopes

Lanternfly resolves keywords, built-in names and user declarations
case-insensitively. Tools preserve the spelling at the declaration and use it
when displaying the name.

## Canonical spelling

| Category | Canonical form | Example |
|---|---|---|
| Keywords and built-in operations | lowercase | `if`, `record`, `count` |
| Built-in types | lowercase | `u8`, `boolean`, `near cstr` |
| Values and routines | lower camel case | `playerScore`, `updatePlayer` |
| User-defined types | Pascal case | `Actor`, `GameState` |

Capitalization is a reading convention rather than a semantic distinction.
Declarations that differ only in case conflict in the same namespace.

Identifiers begin with an ASCII letter. Later characters may be ASCII
letters, digits or `_`. The `_` character is permitted, although lower camel
case and Pascal case are canonical.

## Type and value namespaces

Each module has one type scope and one value scope:

- record declarations enter the type scope;
- constants, variables, routines and external routines enter the value scope.

A type and a value may share a name:

```lanternfly
record Actor
    var active as boolean
end

var actor as Actor
```

A record type and a callable routine may not share a case-insensitive name.
That restriction keeps `Point(...)` unambiguously a record initializer or a
routine invocation. A storage declaration and a routine also conflict because
both occupy the value scope.

## Module collection and source order

The compiler collects all module declaration names before checking declaration
bodies and routine bodies. A type annotation may therefore name a later record
type, and a routine may call another routine declared later in the module.

Constant initializers and placement expressions retain a source-order rule:

- imported exports precede local declarations;
- a local declaration expression may use only earlier constants;
- a layout path may begin only with earlier storage;
- routine-body constant contexts may use any successfully initialized module
  constant.

The compiler puts constant values, array extents, record layouts, target
addresses and layout queries in one dependency graph. A cycle is rejected with
the complete dependency path.

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

## Record fields

Fields occupy a separate scope belonging to their record. Field names need
only be unique within that record and resolve after a field-selection dot:

```lanternfly
record Position
    var x as i16
    var y as i16
end

record Velocity
    var x as i16
    var y as i16
end
```

The repeated field names do not conflict.

## Imports

An import adds only the imported module's explicit exports to the importing
module's type and value scopes. Same-namespace collisions are compile errors.
Imports do not qualify names in 0.4; module-alias syntax is deferred.

## Reserved names

Keywords, built-in type names and built-in operation names are reserved under
case-insensitive comparison. The word `type` is contextual: it selects the
type namespace inside `size` and `count`, and remains available as an ordinary
identifier elsewhere.

[Chapter 12](12-grammar-and-words.md#word-inventory) lists the complete
inventory.
