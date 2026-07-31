---
layout: default
title: "Constants, Variables and Placement"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 5
---

# Constants, Variables and Placement

Lanternfly separates values known during compilation from storage that exists
while the program runs. `const` declares a compile-time value or immutable
aggregate; `var` declares storage.

## Constants

The first implementation requires every constant to state its type:

```lanternfly
const screenWidth as u8 = 32
const visibleMask as u8 = %00000001
const debuggingEnabled as boolean = false
```

Scalar constants normally occupy no storage of their own, although placement
or target export rules may require a stored representation.

Aggregate constants use exact array or record layout:

```lanternfly
const movementCost as u8[4] = [1, 1, 2, 255]

const origin as Point = Point(
    x = 0,
    y = 0
)
```

Constant aggregate storage can be indexed and exported but cannot be modified
or passed to a writable aggregate parameter.

## Module variables

Module variables own static storage:

```lanternfly
var score as u16 = 0
var lives as u8 = 3
var gameOver as boolean = false
```

Compiler-allocated storage without an initializer begins with all bits zero,
but only when every scalar leaf accepts that representation. Integers and
Booleans do. A `cstr` does not, and a target profile determines whether zero
is valid for each opaque address type.

A type containing `cstr` requires an initializer that supplies every C-string
field, or a host/native contract that guarantees valid values.

## Local variables

A routine may own scalar local variables:

```lanternfly
sub addScore(amount as u16)
    var previousScore as u16 = playerScore
    var nextScore as u16 = previousScore + amount

    playerScore = nextScore
end
```

Local declarations precede executable statements in 0.4. Initializers run
once per invocation in declaration order. A local name becomes visible after
its declaration.

An owned local without an initializer receives all-zero storage when its type
accepts zero. Record and array locals cannot own automatic aggregate storage;
[Chapter 9](09-routines.md#local-aggregate-aliases) defines local aliases.

## Initializers

A scalar initializer is an expression. An array initializer must match the
declared rank, shape and element count exactly. A record initializer names
every field exactly once:

```lanternfly
var row as u8[4] = [1, 2, 3, 4]
var point as Point = Point(y = 4, x = 2)
```

Record initializer fields may appear in any written order. Record storage
still follows declaration order.

Initializer expressions evaluate in the order they are written. In an
aggregate constant initializer, every nested value must itself be a constant
initializer.

## Constant expressions

A scalar constant expression may contain:

- literals and earlier constants;
- parentheses;
- integer and Boolean operators;
- comparisons and explicit scalar conversions;
- `abs`, `sqrt` and literal `length`;
- `size`, `count` and `offset`.

It cannot read variable storage, call a routine, use a volatile object or
perform another observable operation.

Outside a target-address expression, operators receive their fixed types
before the compiler folds them. Compile-time evaluation therefore follows the
same wrapping and fault rules as runtime evaluation:

```lanternfly
const maximum as u16 = 65535
const folded as u16 = (maximum + 1) / 2  // 0
```

## Placement

`at` places module-level storage or constant data at a target address:

```lanternfly
var workspace as u8[256] at $8000
const glyph as u8[2] = [$00, $7e] at $4000
```

The target profile validates the address range, address space, alignment and
overlap. Local declarations cannot use `at`.

A placed variable with an initializer is established before program entry.
The profile states whether the value comes from preloaded image bytes or
generated startup writes. Compilation fails when neither mechanism can
establish it.

A placed variable without an initializer describes existing external storage.
The compiler leaves its target-supplied value in place.

## Startup order

When initialization has observable effects, their order is deterministic:

1. Start at the root module.
2. Visit imports depth first in source order.
3. Process each resolved module once.
4. Install a module after its imports.
5. Within the module, process runtime writes and copies in declaration order.

Inside one aggregate, record fields follow declaration order and arrays follow
row-major order. Preloaded image bytes appear in the startup-effect artifact
under the same logical ordering.

## Volatile storage

`volatile` marks storage whose reads and writes are observable:

```lanternfly
volatile var keyboardStatus as u8 at $9000
export volatile var videoControl as u8 at $9001
```

Every source read performs a storage read and every source write performs a
storage write. The compiler cannot cache, combine, remove or reorder these
accesses across another observable operation.

Volatility follows field and index paths into a volatile aggregate. A whole
aggregate copy performs ordered scalar accesses.

The first edition permits `volatile` only on module storage and imported or
native storage contracts. It rejects:

- volatile locals;
- local aggregate aliases to volatile storage;
- volatile aggregate arguments;
- a volatile or device initializer unless the profile explicitly permits the
  startup write.
