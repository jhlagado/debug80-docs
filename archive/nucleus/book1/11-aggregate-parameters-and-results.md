---
layout: default
title: "Aggregate Parameters and Results"
parent: "Programming Nucleus"
nav_order: 11
---

# Aggregate Parameters and Results

Copying a large record or array merely to call a routine would waste time and
storage. Nucleus passes aggregates as fixed typed aliases to existing objects.

```nucleus
sub copyPair(source as Pair, destination as Pair)
    destination = source
end
```

Both parameters refer to caller-owned `Pair` objects. Assignment copies the
complete value into the object bound to `destination`; it does not make the
parameter refer somewhere else. A field write through a parameter is likewise
visible to the caller.

Concrete aggregate parameters require exact type identity. Open views from
Chapter 9 are the deliberate exceptions for arrays of varying lengths and
strings of varying capacities.

## Aggregate results are aliases

A routine may return an aggregate type:

```nucleus
sub selected(useFirst as boolean) as Pair
    if useFirst
        return first
    end
    return second
end
```

The result is not a new temporary `Pair`. It is a transient alias to existing
program-lifetime storage. The caller must consume it immediately: pass it to a
compatible parameter, select a field or element, return it again, discard it or
copy it through aggregate assignment.

This model avoids heap allocation and prevents an alias carrier from outliving
its containing operation. To retain the value rather than the identity, copy it
into caller-owned storage:

```nucleus
copyPair(selected(true), second)
```

Nucleus has no aggregate locals. A routine needing scratch storage receives a
caller-provided destination or uses a program object. This is explicit, fixed
storage rather than an activation-sized array hidden on the stack.

The companion returns an alias to `first`, copies its value into `second` and
leaves `observed` equal to 34.

<<< @/nucleus/book1/examples/11-aggregate-results.nu{nucleus}

## Summary

- Aggregate parameters alias complete caller-owned objects.
- Mutation through a parameter changes the caller's object.
- Concrete aggregate parameters require exact type identity.
- Aggregate results are transient aliases, not copied temporaries.
- Caller-owned storage retains a returned value through explicit assignment.

See [storage and lifetime](../language/07-storage-values-and-lifetime.md) and
[routine results](../language/13-routines-and-calls.md#136-return-and-results).
The checked companion is [`11-aggregate-results.nu`](examples/11-aggregate-results.nu).
