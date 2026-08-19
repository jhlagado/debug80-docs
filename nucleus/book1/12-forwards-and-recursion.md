---
layout: default
title: "Forwards and Recursion"
parent: "Programming Nucleus"
nav_order: 12
---

# Forwards and Recursion

Ordinary declarations still precede their uses. Mutual recursion is the case
where two routine bodies cannot both come first, so Nucleus provides a narrow
forward declaration.

```nucleus
forward sub odd(value as u8) as boolean
```

The forward contains the routine's complete and only signature. Its later body
uses an abbreviated header:

```nucleus
sub odd
    if value = 0
        return false
    end
    return even(value - 1)
end
```

The body does not repeat parameters, result type or `fails`. This avoids two
signatures that could disagree and keeps a streaming compiler from reparsing or
reconciling declarations.

## Recursive calls use ordinary activations

After a complete signature is known, a routine may call itself. Mutually
recursive routines use a forward only for a call whose definition appears
later. Each active call retains its own scalar parameters, aggregate bindings
and locals.

The implementation publishes an activation-capacity limit. Arguments are
evaluated first; a call that would exceed the limit then causes an
`activation-capacity` trap before the new body begins. Recursion is part of the
language despite that finite machine limit.

The companion uses `even` and `odd` to test 7. The forward makes `odd` visible
inside `even`; the later abbreviated body completes it. `observed` finishes at 1.

<<< @/nucleus/book1/examples/12-forwards.nu{nucleus}

## Summary

- A forward declaration supplies one complete routine signature.
- The later definition uses only `sub name` and its body.
- Self-recursion needs no special declaration once the signature is known.
- Mutual recursion uses forwards only across declaration-order gaps.
- Active recursive calls remain subject to the published activation capacity.

See [program structure](../language/04-program-and-compilation-structure.md),
[names](../language/05-names-and-scopes.md) and
[recursion](../language/13-routines-and-calls.md#138-forward-definitions-and-recursion).
The checked companion is [`12-forwards.nu`](examples/12-forwards.nu).
