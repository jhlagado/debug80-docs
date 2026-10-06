---
layout: default
title: "Recoverable Errors and Traps"
parent: "Programming Nucleus"
nav_order: 13
---

# Recoverable Errors and Traps

Not every unsuccessful operation is a broken program. Reading past the end of
an input stream is expected and can be handled. Indexing outside an array is a
safety failure and must stop. Nucleus keeps those two channels separate.

## Producing a recoverable error

A failable routine adds `fails` to its signature and may end with a `u8` error
code:

```nucleus
sub positive(value as i8) as u8 fails
    if value < 0
        fail invalidValue
    end
    return u8(value)
end
```

On success it supplies the declared result. On failure it supplies only the
error code. Every failable call must say what happens to that code.

## Propagating with `else fail`

```nucleus
var result as u8 = positive(value) else fail
```

On success, initialization continues with the returned byte. On failure, the
enclosing failable routine immediately returns the same code. The words belong
to the call site, not to a later return statement. Propagation is visible at
every level; there is no hidden handler stack.

## Handling immediately

`handle` stays on the same logical line as its call or assignment and names an
existing writable `u8` destination:

```nucleus
observed = checked(-1) handle code
    observed = 100 + u16(code)
end
```

On success, the assignment happens and the handler body is skipped. On
failure, the success assignment does not happen, `code` receives the error and
the handler body runs. Completion then continues after its `end`.

## Traps are not caught

A bounds failure, checked-conversion failure, division by zero or activation
overflow is a trap. It terminates source execution. Neither `handle` nor
`else fail` intercepts it. This separation keeps expected operational failure
from disguising a broken safety condition.

The companion propagates one error through `checked`, then handles it in
`main`. It leaves `observed` equal to 107.

<<< @/nucleus/book1/examples/13-errors.nu{nucleus}

## Summary

- `fails` adds a recoverable `u8` error channel to a routine.
- `fail code` ends that routine with failure.
- `else fail` explicitly propagates the same code.
- Same-line `handle destination` handles one direct call locally.
- Safety traps terminate and are never converted into recoverable errors.

See [recoverable errors](../language/14-recoverable-errors.md) and
[safety failures](../language/15-safety-failures-and-traps.md). The checked
companion is [`13-errors.nu`](examples/13-errors.nu).
