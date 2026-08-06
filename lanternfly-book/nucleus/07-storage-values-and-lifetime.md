---
layout: "default"
title: "7. Storage, values, and lifetime"
parent: "Nucleus 0.1 Language Specification"
nav_order: 7
pageClass: "nucleus-specification"
---
[← 6. Types](06-types.md) · [Contents](./) · [8. Constants and declarations →](08-constants-and-declarations.md)

<div id="7-storage-values-and-lifetime" class="nucleus-source-anchor"></div>

# 7. Storage, values, and lifetime

<div id="71-scope" class="nucleus-source-anchor"></div>

## 7.1 Scope

This chapter defines source-level storage, object identity, value copying, aggregate aliases, storage duration, and lifetime. Chapter 6 defines the types that occupy storage. Chapter 8 defines declaration syntax, constants, initializers, and when a declaration installs a zero or explicit initial value. Chapter 13 defines routine syntax, result syntax, and calls.

The rules in this chapter do not expose physical addresses, banks, virtual-register numbers, stack positions, frame layouts, or compiler workspace. Those are implementation matters. A conforming implementation preserves the source-level identity and lifetime rules regardless of its storage arrangement.

<div id="72-values-objects-subobjects-and-aliases" class="nucleus-source-anchor"></div>

## 7.2 Values, objects, subobjects, and aliases

Nucleus distinguishes four related concepts:

| Concept               | Source meaning                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Scalar value          | One `u8`, `u16`, or `boolean` value. Scalar values can be copied.                                                                      |
| Object                | Storage associated with a declared variable.                                                                                           |
| Subobject             | A record field, fixed-array element, or existing bounded-string byte. A bounded string may itself be an object or aggregate subobject. |
| Typed aggregate alias | A non-owning, fixed binding to an existing record, fixed-array, or bounded-string object or subobject of one of those types.           |

An object has one identity throughout its lifetime. Writing a new scalar value into an object or subobject changes its contents, not its identity. An alias has the exact aggregate type of its target and does not create another object.

Every alias is bound to an object or aggregate subobject when the alias is established. Nucleus has no null, unbound, or reseatable aggregate alias. Source code cannot inspect, compare, convert, or perform arithmetic on the implementation carrier used for an alias.

<div id="73-owned-storage" class="nucleus-source-anchor"></div>

## 7.3 Owned storage

A top-level variable owns one object with program lifetime. A scalar variable owns one scalar cell. A record, fixed-array, or bounded-string variable owns the complete aggregate object, including every contained subobject.

Named constants are scalar-only. A named constant denotes a value and need not occupy source-observable storage. Materializing that value in memory does not give it object identity visible to a Nucleus program.

Aggregate storage occurs only in program-lifetime objects and inline within other aggregate storage. A record field has storage within its containing record. An array element has storage within its containing array. A bounded string has its counted content within its containing string object. Nucleus does not allocate owned aggregate storage for a routine-local declaration.

<div id="74-program-lifetime" class="nucleus-source-anchor"></div>

## 7.4 Program lifetime

Program-lifetime objects exist before the designated entry routine begins. Their lifetime ends when program execution terminates, whether normally or through a specified trap. Chapter 8 defines their initialization and the point at which each initial value is established before the first source read.

The zero value of each admitted type is:

| Type        | Zero value                                                  |
| ----------- | ----------------------------------------------------------- |
| `u8`, `u16` | integer zero                                                |
| `boolean`   | `false`                                                     |
| record      | the record whose fields recursively have their zero values  |
| `T[N]`      | the array whose elements recursively have their zero values |
| `string[N]` | the empty byte sequence                                     |

This table defines values, not a byte layout or a universal initialization rule. Chapter 8 specifies which declarations receive a zero value and which require an explicit initializer. An implementation must establish the required semantic value without exposing padding, headers, addresses, or backend-specific representations.

<div id="75-routine-activations" class="nucleus-source-anchor"></div>

## 7.5 Routine activations

Each routine invocation creates a distinct logical activation. An activation contains that invocation's scalar parameters, scalar locals, and aggregate-alias bindings. It begins when the call establishes the parameters and ends when the routine returns or program execution terminates.

A scalar parameter receives a copied value. Each scalar local belongs to one activation. Its source lifetime begins when execution reaches its declaration and Chapter 8 has established its initial value; its lifetime ends with the activation. A scalar result is copied from the returned expression to the caller. It is not shared storage in the callee.

An aggregate parameter is a typed alias to caller-provided storage. A routine-local declaration of record, fixed-array, or bounded-string type also establishes a typed alias rather than allocating an aggregate object in the activation. The alias binding belongs to the activation, but the target retains its own lifetime.

Two simultaneously active invocations have distinct logical parameters, scalar locals, and local alias bindings. This rule applies even when the implementation assigns the same virtual-register numbers or physical storage to invocations that cannot overlap.

Recursive calls use the same activation rule. An implementation preserves distinct logical activation state at every active depth. Caller-save regions, hardware-stack entries, static-slot save areas, or another re-entry mechanism may implement that rule; none is source storage.

<div id="76-aggregate-alias-binding" class="nucleus-source-anchor"></div>

## 7.6 Aggregate alias binding

An aggregate alias binds once, when its parameter or local declaration is established. The target is a compatible aggregate storage path rooted in:

- a program-lifetime variable;
- an incoming aggregate parameter;
- another in-scope aggregate alias; or
- an aggregate field or fixed-array element reached from one of those roots.

A compatible aggregate-alias result from an infallible routine invocation may also establish a local alias. Chapter 13 guarantees that such a result denotes program-lifetime storage. The compiler evaluates the invocation once before fixing the local binding.

The compiler evaluates every field selection and checked index used to form a local alias once at binding. Later changes to an index variable do not retarget the alias. The target type must exactly match the alias type under Chapter 6.

An alias does not extend the target's lifetime. Current aggregate storage belongs to variables, so scalar-leaf writes through an aggregate alias are allowed under the ordinary assignment rules.

<div id="77-subobject-lifetime-and-identity" class="nucleus-source-anchor"></div>

## 7.7 Subobject lifetime and identity

A subobject begins and ends its lifetime with its containing object. Nested containment does not create a separately managed lifetime. An alias to an aggregate record field or fixed-array element remains valid only while the containing object remains alive.

Distinct fields of one record, distinct elements of one fixed array, and distinct byte positions in one bounded string are distinct subobjects. An object overlaps each of its own subobjects, and a nested subobject overlaps every containing object on its path. Sibling fields, sibling array elements, and distinct string bytes do not overlap in source semantics.

Two aliases may denote the same object or overlapping objects. Nucleus provides no alias-identity comparison, but identity is observable through mutation: a scalar write through one path is visible through every other path to that scalar subobject. An implementation must preserve this effect even if it caches a scalar value or uses different carriers for the two paths.

<div id="78-assignment-and-aggregate-mutation" class="nucleus-source-anchor"></div>

## 7.8 Assignment and aggregate mutation

Scalar assignment copies a value into a scalar destination. The destination may be a scalar variable, parameter, record field, fixed-array element, or existing bounded-string byte. After the assignment, later changes to the source do not change the destination.

Aggregate alias binding is not assignment. Once established, an aggregate parameter or local alias cannot be rebound. An assignment whose destination is a bare record, fixed array, bounded string, or aggregate alias is invalid: it neither changes an alias binding nor copies an aggregate object.

Nucleus 0.1 has no implicit whole-record, whole-array, or whole-string copy. Programs mutate aggregates through scalar fields, scalar fixed-array elements, and checked bounded-string byte selection. An explicitly admitted library routine can perform an element-wise or content operation, but it remains an ordinary checked operation and does not add aggregate value assignment to the language.

<div id="79-aggregate-results-and-escape-checking" class="nucleus-source-anchor"></div>

## 7.9 Aggregate results and escape checking

An aggregate routine result is a typed alias to existing storage. The returned target must outlive the callee activation. The result preserves the target's exact aggregate type and denotes the same object.

A returned aggregate alias is valid when its target is:

- program-lifetime storage; or
- storage reached through an incoming aggregate parameter, including one of its aggregate fields or fixed-array elements.

Every valid incoming aggregate parameter is ultimately rooted in program-lifetime storage because Nucleus has no routine-local owned aggregate, heap aggregate, or variable-sized local. Returning a local alias is permitted only when its binding is statically derived from program-lifetime storage or an incoming aggregate parameter. Returning the local binding ends that binding; the result denotes the target object, not the callee's alias carrier.

A compiler needs only one local lifetime fact for an aggregate alias expression: whether it is statically derived from program-lifetime storage. An incoming aggregate parameter has that property. Field selection, checked indexing, and local alias binding preserve it. An aggregate return is invalid when the compiler cannot prove the property. Once the compiler has checked a routine body, callers may rely on its aggregate result being a valid typed alias to program-lifetime storage; no result-provenance syntax or parameter identity is required in the routine signature.

Nucleus has no routine-local owned aggregate object, aggregate temporary, heap object, or variable-sized local object. A local declaration such as an unbound record, array, or bounded string is therefore invalid rather than an allocation whose address could escape. The absence of local aggregate allocation removes the principal dangling-result case; the lifetime check still applies to every aggregate return.

<div id="710-end-of-lifetime-and-dangling-aliases" class="nucleus-source-anchor"></div>

## 7.10 End of lifetime and dangling aliases

When an activation ends:

- its scalar parameters and scalar locals cease to exist;
- its local and parameter alias bindings cease to exist;
- storage reached through those aliases is unaffected if that storage has a longer lifetime; and
- a valid returned scalar value or aggregate alias has already been transferred to the caller.

No source operation may use an object or subobject after its lifetime ends. Creating, returning, storing, or retaining an aggregate alias whose target does not outlive that use is invalid. A compiler must diagnose a statically detectable lifetime violation rather than emit a dangling carrier.

Nucleus 0.1 has no manual deallocation, destructors, `finally`, `defer`, variable-sized locals, or other scope-exit action. Returning from a routine performs no hidden source-level cleanup. A backend may restore saved implementation state, but that restoration does not run source operations or change the lifetime rules above.

<div id="711-examples" class="nucleus-source-anchor"></div>

## 7.11 Examples

The following declarations use program-lifetime record-array storage:

```nucleus
record Entry
    value as u16
end

var entries as Entry[8]

sub entryAt(index as u8) as Entry
    return entries[index]
end
```

`entryAt` returns an alias to one `Entry` subobject of `entries`. The bounds check occurs before the result is formed. The target has program lifetime and remains alive after the call.

An incoming aggregate alias also supplies a valid aggregate result:

```nucleus
sub choose(items as Entry[8], index as u8) as Entry
    return items[index]
end
```

The caller-provided array outlives the `choose` activation.

This statement mutates a scalar leaf through the aggregate alias `item` without copying or rebinding the record:

```nucleus
item.value = 7
```

The assignment changes the caller's selected `Entry`. It does not create another `Entry`.

If `first` and `second` are aggregate aliases and `otherEntries` is another `Entry[8]` object, the following forms are invalid:

```nucleus
first = second          // no alias rebinding or whole-record copy
entries = otherEntries  // no whole-array copy
```

A routine cannot create shorter-lived aggregate storage and return it:

```nucleus
sub invalidResult() as Entry
    var scratch as Entry    // invalid: an aggregate local cannot be unbound
    return scratch
end
```

The invalid declaration does not allocate an `Entry` in the activation. Chapter 8 defines the binding syntax for a valid aggregate local. A routine that needs scratch aggregate storage receives it through an aggregate parameter or uses declared program-lifetime storage.

<div id="712-implementation-independence-and-capacities" class="nucleus-source-anchor"></div>

## 7.12 Implementation independence and capacities

Language lifetime is independent of a value's physical location. Reusing a physical address or VM slot at different times, overlaying non-overlapping locals, bank placement, and hardware-stack reuse do not merge source objects or activations. Conversely, two source paths to the same object retain shared identity even if a backend represents them differently.

An implementation may bound scalar locals, aggregate-alias bindings, or the metadata used for lifetime checks. It must publish each limit. A compile-time excess requires a capacity diagnostic under Chapter 1. An implementation must not share live activation state or produce a dangling alias when a limit is reached.

The maximum simultaneous activation depth is implementation-defined under Chapter 13. Reaching that limit at runtime performs the activation-capacity trap defined by Chapter 15. The limit and trap do not change the source lifetime of an activation that begins successfully.

Nucleus 0.1 exposes no raw pointer value, address arithmetic, heap allocation, manual deallocation, open slice or view, variable-sized local, arbitrary aggregate copy, or storage-layout query through this chapter. Field byte offsets, array byte offsets, bounded-string encoding, VM carriers, calling opcodes, and save-region layouts belong to the VM specification or a backend contract.
