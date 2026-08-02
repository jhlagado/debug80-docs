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
or target ABI rules may require a stored representation.

Fixed-capacity string constants use their exact storage layout:

```lanternfly
const prompt as string[6] = "READY?"
```

Constant storage cannot be modified. A string's representation remains sealed.
[Chapter 6](06-records-arrays-paths.md#aggregate-initializers) extends these
rules to arrays and records after introducing their declarations and layout.

## Module variables

Module variables own static storage:

```lanternfly
var score as u16 = 0
var lives as u8 = 3
var gameOver as boolean = false
```

Compiler-allocated storage without an initializer begins with all bits zero,
but only when every leaf accepts that representation. Integers, Booleans and
strings do; an uninitialized string begins empty. Enums and subranges accept
zero only when their domains contain it, and a target profile determines
whether zero is valid for each opaque address type.

## Local variables

A routine may own scalar local variables:

```lanternfly
sub addScore(amount as u16)
    var previousScore as u16 = playerScore
    var nextScore as u16 = previousScore + amount

    playerScore = nextScore
end
```

Local declarations precede executable statements. Initializers run
once per invocation in declaration order. A local name becomes visible after
its declaration.

An owned local without an initializer receives all-zero storage when its type
accepts zero. Automatic locals may own scalar values only;
[Chapter 9](09-routines.md#local-aggregate-aliases) defines local names for
aggregate storage allocated elsewhere.

## Initializers

A scalar initializer is an expression. A string initializer is a literal or
an earlier string constant whose known content fits. Initializer expressions
evaluate in the order they are written. Chapter 6 defines the corresponding
forms and order for arrays and records.

## Constant expressions

A scalar constant expression may contain:

- literals and earlier constants;
- visible enum members;
- parentheses;
- integer and Boolean operators;
- comparisons and explicit scalar conversions;
- `abs`, `sqrt` and `length` when its operand is a literal or immutable string
  storage whose payload is known to the compiler;
- `size`, `count`, `lower`, `upper` and `offset`.

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
var workspaceByte as u8 at $8000
const glyphByte as u8 = $7e at $4000
```

The complete object must fit one compatible target memory region. The profile
checks its address space, range, alignment, permissions and overlap with every
other placed or allocated object. Local declarations cannot use `at`.

`at` is the only source-level placement clause in the first edition. The
target profile describes the memory regions and supplies default destinations
for generated code, constant data, writable data and static scratch. A build
may use another permitted region or starting address without changing the source.
Regions reserved for explicit placement are never used by the ordinary allocator.

Before emission, the compiler reserves every explicit `at` range and builds a
deterministic placement plan for routines, storage, constants, module
assembly, startup code, helpers, adapters and scratch. Each planned range
records its address, extent, alignment, region and owner. A component that
cannot fit produces `E-PLACE-001`.

After emission, the compiler compares the program's initialized bytes,
reserved addresses and symbols with the plan. Missing, displaced, extra
or overlapping output produces `E-PLACE-002`.

A hosted body has no independent origin. It reports its code, data, helper and
scratch requirements to its host, which places the combined program and
performs the final-map validation.

A placed variable with an initializer is established before program entry.
The profile states whether the value comes from preloaded image bytes or
generated startup writes. Compilation fails when neither mechanism can
establish it.

A placed variable without an initializer describes existing external storage.
The compiler leaves its target-supplied value in place.

## Volatile storage

`volatile` marks storage whose reads and writes are observable:

```lanternfly
volatile var keyboardStatus as u8 at $9000
volatile var videoControl as u8 at $9001
```

Every source read performs a storage read and every source write performs a
storage write. The compiler cannot cache, combine, remove or reorder these
accesses across another observable operation.

The qualifier applies to the complete declared object. Chapter 6 defines how
it follows field and index paths into aggregate storage.

The first edition permits `volatile` only on module storage and imported or
native storage contracts. It rejects:

- volatile locals;
- local aggregate aliases to volatile storage;
- volatile aggregate arguments;
- a volatile or device initializer unless the profile explicitly permits the
  startup write.
