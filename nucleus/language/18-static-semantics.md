---
layout: "default"
title: "18. Static semantics"
parent: "Nucleus 0.1 Language Specification"
nav_order: 18
pageClass: "nucleus-specification"
---
[← 17. Complete grammar](17-complete-grammar.md) · [Contents](./) · [19. Runtime semantics →](19-runtime-semantics.md)

<div id="18-static-semantics" class="nucleus-source-anchor"></div>

# 18. Static semantics

<div id="181-compilation-order" class="nucleus-source-anchor"></div>

## 18.1 Compilation order

The compiler processes one logical compilation unit in token order across the ordered source parts from Section 4.3. Source-part metadata has no static meaning. Every use requires an earlier visible declaration, except that an exact forward routine signature makes that routine callable before its body. An ordinary header or earlier forward makes the routine's signature visible before its local prefix and body. At `EOF`, every forward must be completed and exactly one `main` definition satisfying Section 4.7 must exist.

Top-level declarations occur only in the compilation-unit sequence. Parameters occur only in routine headers. Local declarations form one contiguous prefix before the first statement. Record fields occur only inside their record declaration. Conditional and loop bodies contain statements and open no declaration scope.

<div id="182-names-and-declaration-classes" class="nucleus-source-anchor"></div>

## 18.2 Names and declaration classes

Identifiers use their complete case-sensitive source spelling as identity. Program and routine scopes have one ordinary namespace; record fields have one field scope per record type. No ordinary declaration overloads, redefines, or shadows another visible ordinary declaration with the same exact identity. Definition order never changes which declaration governs a later use. A suffix name uses the statically selected record type's field scope or the bounded-string `length` intrinsic.

Name-led parsing first resolves the visible binding, then checks its declaration class. A routine name starts a call. A mutable scalar or aggregate storage path starts an assignment. A record type is valid only in a type position. A failable call is parsed as an ordinary call and then checked for exactly one failure consumer under Chapter 14. Failure to find a binding, finding the wrong class, or finding a later declaration is invalid source.

The standard service names and error constants from Chapter 16 are visible before source declarations. `main` is source-defined and must have no parameters and no result.

<div id="183-types-and-compatibility" class="nucleus-source-anchor"></div>

## 18.3 Types and compatibility

Every expression, storage path, symbol, parameter, local, field, and routine result has one static type. Scalar values have type `u8`, `u16`, or `boolean`. Records are nominal. Fixed-array identity consists of exact element type and length. Bounded-string identity consists of exact capacity.

Scalar compatibility permits exact type, a fitting contextual literal, and implicit `u8`-to-`u16` widening. Checked `u8(...)` is the only `u16`-to-`u8` conversion. Boolean and integer types do not convert. Aggregate arguments, results, parameter bindings, and assignments require exact type identity. Aggregate assignment copies the complete value. Aggregate parameters are fixed aliases, while aggregate results are transient aliases that must be consumed immediately.

The compiler checks every operator, condition, assignment, argument, result, field, index, initializer, and failure code locally. A failable invocation supplies no ordinary expression value until its failure has been consumed under Chapter 14.

<div id="184-storage-and-aliases" class="nucleus-source-anchor"></div>

## 18.4 Storage and aliases

A program variable owns program-lifetime storage. A scalar parameter or local owns one activation value. An aggregate parameter is a fixed typed alias established for the activation. A returned aggregate alias is transient and cannot establish a source binding. Alias binding is not assignment. A writable aggregate storage path may be an assignment destination, and an aggregate storage path or transient aggregate-alias result of the exact same type may be its source. A routine-local declaration with aggregate type is invalid.

Field and checked-index selection preserve the root identity and exact selected type. A bounded-string index selects an existing writable `u8` byte when the index is below the string's current length; `.length` yields a read-only `u8` value. Every aggregate object and subobject has program lifetime, so a returned aggregate alias needs no separate lifetime metadata.

<div id="185-constants-bounds-and-initialization" class="nucleus-source-anchor"></div>

## 18.5 Constants, bounds, and initialization

Named constants are top-level scalar values with explicit types and restricted constant initializers. Constant evaluation may use literals, earlier scalar constants, admitted pure scalar operators, parentheses, and checked scalar conversions. It may not read storage or call a routine.

Array lengths and string capacities are positive constant values in the ranges set by Chapter 6. Constant fixed-array indices outside their domains are invalid. A bounded-string byte index is checked at runtime against the current logical length, even when the index expression is constant, unless the compiler proves the current length makes it safe at that program point.

Program variables use the zero or complete static initializer forms in Chapter 8. Scalar locals use zero, an ordinary compatible expression, or a direct compatible failable result followed by `or fail`. Structured aggregate initialization occurs only for program variables. An aggregate assignment materializes a transient result when retention is required.

<div id="186-routine-and-failure-checking" class="nucleus-source-anchor"></div>

## 18.6 Routine and failure checking

A call must match the visible signature in arity and parameter order. Scalar arguments copy compatible values. Aggregate arguments bind aliases of the exact referent type. A forward declaration is the sole complete signature. Its abbreviated `sub NAME` body header must resolve to that exact incomplete forward, and the stored forward parameter names bind the body.

Every failable invocation has exactly one failure consumer. `or fail` requires a failable enclosing routine. A result-free `return invocation() or fail` requires a result-free failable callee and caller. `on error` requires an immediately preceding eligible assignment or call statement and an existing writable `u8` destination that is not an active counted-loop counter. Failable invocations are invalid inside larger expressions or argument lists.

A result-bearing routine is invalid if its closing `end` is reachable without `return expression` or, when it declares `fails`, `fail`. Structured fallthrough follows Section 13.7. Loops remain conservatively able to finish. `return` and `fail` do not fall through; a call with `or fail` may succeed and fall through.

<div id="187-control-contexts" class="nucleus-source-anchor"></div>

## 18.7 Control contexts

An `if` or `elseif` condition and a `while` condition must be Boolean. A counted-loop counter must be a scalar local of type `u8` or `u16`. It is read-only to source statements while that loop is active and cannot be reused as a nested counted-loop counter. Its step is a nonzero signed compile-time constant. A provable counted-loop increment overflow remains valid source and traps only if execution reaches that increment. `exit` and `continue` require an enclosing loop and target the innermost one.

No label, goto, exception region, or hidden cleanup edge changes these contexts. The compiler may summarize active loops and fallthrough with bounded stacks, but capacity exhaustion must produce a diagnostic before it changes a target or validity result.

<div id="188-invalid-source-and-capacities" class="nucleus-source-anchor"></div>

## 18.8 Invalid source and capacities

A grammar, visibility, declaration-class, type, lifetime, constant, flow, failure-consumption, or context violation makes the source invalid. The compiler issues a diagnostic and must not present an executable as a successful translation.

An implementation may bound complete source length, source-part count and metadata length, identifier length, symbols, types, fields, forwards, retained forward parameter-name bytes, parameters, scalar locals, expression depth, statement nesting, fixups, constants, structured-initializer depth and elements, emitted code size, total emitted image size, and other retained compile-time state. It must document every limit that can reject otherwise conforming source and issue a capacity diagnostic before truncation, wraparound, dropped state, or changed semantics. Those limits must still compile every complete accepted Chapter 21 program. Runtime activation capacity is separately implementation-defined, must accommodate the accepted corpus, and traps under Chapter 15 beyond any published activation-depth or activation-storage limit.
