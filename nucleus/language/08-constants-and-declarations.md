---
layout: "default"
title: "8. Constants and declarations"
parent: "Nucleus 0.1 Language Specification"
nav_order: 8
pageClass: "nucleus-specification"
---
[← 7. Storage, values, and lifetime](07-storage-values-and-lifetime.md) · [Contents](./) · [9. Expressions →](09-expressions.md)

<div id="8-constants-and-declarations" class="nucleus-source-anchor"></div>

# 8. Constants and declarations

<div id="81-scope" class="nucleus-source-anchor"></div>

## 8.1 Scope

This chapter defines the Nucleus 0.1 declaration families, their canonical source forms, constant expressions, initializers, and declaration-time binding. Chapter 4 defines the compilation-unit sequence and top-level placement. Chapter 5 defines declaration points, scopes, name identity, and collisions. Chapters 6 and 7 define types, storage ownership, aggregate aliases, and lifetime. Chapter 13 defines routine calls, results, and complete routine semantics.

Nucleus uses explicit declarations and explicit types. It has no inferred declarations, implicit variables, grouped declarations, destructuring declarations, or general type-alias declaration.

<div id="82-declaration-families-and-placement" class="nucleus-source-anchor"></div>

## 8.2 Declaration families and placement

The declaration families are:

| Declaration             | Permitted location                          | Binding or storage established                                            |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| Named constant          | Top level                                   | One typed compile-time scalar value                                       |
| Program variable        | Top level                                   | One mutable program-lifetime scalar or aggregate object                   |
| Record type             | Top level                                   | One nominal fixed-layout record type and its field scope                  |
| Forward routine         | Top level                                   | One routine signature without a body                                      |
| Routine definition      | Top level                                   | One routine signature and body, or completion of an earlier forward       |
| Formal parameter        | Routine header                              | One scalar activation value or aggregate-alias binding                    |
| Scalar local            | Contiguous routine declaration prefix       | One per-invocation scalar value                                           |
| Private aggregate local | Contiguous routine declaration prefix       | One routine-private program-lifetime object, shared by every invocation   |
| Aggregate-alias local   | Contiguous routine declaration prefix       | One per-invocation immutable binding to existing aggregate storage        |
| Record field            | Between a record header and its closing end | One named scalar or aggregate subobject in each object of the record type |

Only top-level declarations occur in the compilation-unit sequence. Parameters occur only in a routine header. Local declarations form one contiguous prefix after the header and before the first statement. A conditional or loop body cannot contain a declaration, and a declaration after the first statement of a routine is invalid.

Nucleus 0.1 has no routine-local constant declaration.

<div id="83-canonical-syntax" class="nucleus-source-anchor"></div>

## 8.3 Canonical syntax

The following skeleton defines declaration syntax without defining statement grammar or the internal syntax of ordinary expressions:

```text
top-level-declaration ::= const-declaration
                        | program-var-declaration
                        | record-declaration
                        | forward-routine-declaration
                        | routine-definition

const-declaration     ::= "const" NAME "as" type "="
                          constant-initializer NEWLINE

program-var-declaration
                      ::= "var" NAME "as" type
                          [ "=" program-initializer ] NEWLINE

record-declaration    ::= "record" NAME NEWLINE
                          field-declaration
                          { field-declaration }
                          "end" NEWLINE
field-declaration     ::= NAME "as" type NEWLINE

forward-routine-declaration
                      ::= "forward" routine-header NEWLINE
routine-definition    ::= "sub" NAME routine-definition-tail
routine-definition-tail
                      ::= routine-signature-tail NEWLINE routine-body
                        | NEWLINE routine-body
routine-body          ::= { local-declaration }
                          routine-statement-sequence
                          "end" NEWLINE
routine-header        ::= "sub" NAME routine-signature-tail
routine-signature-tail
                      ::= "(" [ formal-parameter
                          { "," formal-parameter } ] ")"
                          [ "as" type ] [ "fails" ]
formal-parameter      ::= NAME "as" type

local-declaration     ::= "var" NAME "as" type
                          [ "=" local-initializer ] NEWLINE
local-initializer     ::= expression
                        | static-aggregate-initializer
                        | failable-invocation "or" "fail"

constant-initializer  ::= scalar-constant-expression
program-initializer   ::= static-initializer
static-initializer    ::= scalar-constant-expression
                        | STRING
                        | record-initializer
                        | array-initializer
static-aggregate-initializer
                      ::= STRING
                        | record-initializer
                        | array-initializer
record-initializer    ::= "(" static-initializer
                          { "," static-initializer } ")"
array-initializer     ::= "[" static-initializer
                          { "," static-initializer } "]"
```

`type`, `scalar-type`, and `aggregate-type` are defined by Chapter 6. The parser selects the initializer form from the declared type. A parenthesized scalar expression and a record initializer share `(` as their first token; the already checked declared or component type selects the form without backtracking. `routine-statement-sequence` and `expression` are placeholders for later chapters, not additional declaration syntax.

Each constant, variable, record header, field, and local declaration introduces one name. A routine header introduces one routine name and its individually written parameters. Each field and parameter repeats the canonical `name as Type` form. No comma-separated field or variable group is permitted.

Parentheses and square brackets suppress logical newlines under Chapter 3. A structured initializer may therefore span physical lines without adding newline productions to this grammar.

<div id="84-named-constants" class="nucleus-source-anchor"></div>

## 8.4 Named constants

A named constant declaration has this form:

```nucleus
const bufferLength as u16 = 64
const readyMask as u8 = 128
const enabled as boolean = true
```

The declared type must be `u8`, `u16`, or `boolean`. The `as` clause is required; Nucleus does not infer a constant's declared type. The declared type supplies the expected type for contextual literals and for the final compatibility check.

A named constant denotes its compile-time scalar value. It does not declare storage and need not occupy runtime storage. The compiler may materialize the value in generated code or immutable implementation data, but no source operation exposes object identity for it.

The initializer is required and must be a scalar constant expression compatible with the declared type. A named constant becomes visible only after the compiler has checked the complete declaration, so its initializer cannot name itself. Chapter 5's declaration-order rule also excludes later names and constant cycles.

Named integer constants replace enumeration members where a program needs symbolic numeric values. A constant declaration does not create an enumeration, subrange, distinct integer type, or overload.

<div id="85-aggregate-constants-are-absent" class="nucleus-source-anchor"></div>

## 8.5 Aggregate constants are absent

Nucleus 0.1 named constants are scalar only. `const` cannot declare a record, fixed array, or bounded string. The language has no separate read-only aggregate-storage declaration.

A program that needs an initialized string or scalar table declares a program variable under Section 8.8. That object is mutable storage even when the program never writes it.

<div id="86-scalar-constant-expressions" class="nucleus-source-anchor"></div>

## 8.6 Scalar constant expressions

A scalar constant expression contains only:

- an integer, character, or Boolean literal;
- an earlier named constant;
- parentheses; and
- a pure scalar operator or explicit scalar conversion that Chapter 9 admits in constant expressions.

It cannot read a variable, field, array element, or bounded string; call a routine; or perform an observable operation. Nucleus 0.1 constant expressions have no layout, address, offset, or runtime-length query. Fixed array lengths and string capacities use literals or earlier scalar constants instead.

The compiler evaluates a constant expression at compile time with the operand types, result type, overflow rule, and fault rule that Chapter 9 assigns to each admitted operator. It must not substitute host-language overflow, silently widen a typed operation, or fold an expression differently from the corresponding runtime operation. If Chapter 9 assigns no constant-expression rule to an operator, that operator is unavailable in this context.

An exact integer literal remains exact until the declared destination, an operator rule, or a conversion supplies its type. The implicit `u8`-to-`u16` conversion from Chapter 6 is permitted. A checked `u16`-to-`u8` conversion is valid at compile time only when its value lies from 0 through 255; otherwise the declaration is invalid. A constant operation that Chapter 9 defines to trap at runtime makes the constant expression invalid when the compiler proves that condition during evaluation.

An array length is a scalar constant expression whose value must lie from 1 through 65,535. A `string[N]` capacity is a scalar constant expression whose value must lie from 1 through 255. The compiler evaluates the bound before constructing the type identity. A later constant, a variable, or a cyclic dependency cannot supply a bound.

<div id="87-record-declarations" class="nucleus-source-anchor"></div>

## 8.7 Record declarations

A record declaration introduces one nominal type:

```nucleus
record Point
    x as u16
    y as u16
end
```

The declaration contains at least one field. Each field declares one name and one previously declared type. A field declaration has no `var` or `const` keyword, initializer, default value, placement clause, or mutability qualifier. Every object of the record type contains the same fields in declaration order.

The record type becomes visible only after the complete declaration has been checked. It is therefore unavailable in its own field list. This rule, the declaration-before-use rule, and Chapter 6's finite-size requirement reject direct and indirect recursive containment without a second declaration pass.

Record field names use the record's field scope under Chapter 5. An exact duplicate within that field scope is invalid; differently cased field names are distinct. Record layout offsets and backend encoding are outside this chapter.

<div id="88-program-variables" class="nucleus-source-anchor"></div>

## 8.8 Program variables

A top-level `var` declaration owns one mutable program-lifetime object. The declared type may be scalar, record, fixed array, or bounded string.

Every program variable has an initial value. With no initializer, the compiler establishes the type's zero value from Section 7.4 before the entry routine begins. The default is therefore integer zero, `false`, an empty bounded string with length zero, or the recursive zero value of a record or fixed array.

An explicit program initializer is permitted only in these forms:

| Declared type             | Permitted initializer                                                              |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `u8`, `u16`, or `boolean` | One compatible scalar constant expression                                          |
| `string[N]`               | One fitting string literal                                                         |
| Record                    | One positional record initializer with exactly one initializer per field           |
| Fixed array               | One array initializer with exactly one compatible initializer per declared element |

Program initialization does not evaluate an ordinary runtime expression or read another variable. A string literal establishes both the decoded bytes and their logical length; embedded zero bytes count toward that length. A literal shorter than its capacity is valid, while one that exceeds the capacity is invalid and is never truncated.

A record initializer uses parentheses and supplies fields in declaration order. An array initializer uses square brackets and supplies elements in increasing index order. A nested record, fixed array, or bounded string uses its own initializer at the corresponding position, so the initializer delimiters mirror the finite aggregate type tree. Every scalar leaf is a compatible scalar constant expression. Every record and array level is complete: too few or too many components are invalid, and the compiler neither pads an explicit initializer nor discards components.

Nucleus has no named-field, partial, spread, or runtime aggregate initializer. A static initializer cannot name another aggregate object or call a routine. It is a declaration-only description of one static object image, not a general aggregate expression.

The program variable becomes visible only after the compiler has checked its type and initializer. Its initializer may therefore use earlier scalar constants but cannot use the variable itself or a later declaration.

<div id="89-routine-declarations-and-parameters" class="nucleus-source-anchor"></div>

## 8.9 Routine declarations and parameters

One routine header declares a routine name, an ordered list of zero or more formal parameters, and either no result type or one result type. Every parameter has an explicit `name as Type` declaration. Parameters have no initializer or default argument, and a header has no grouped names or multiple result list.

A scalar parameter denotes a per-invocation copied value. An aggregate parameter establishes a fixed typed alias to caller-provided program-lifetime storage. Scalar-leaf mutation and exact-type aggregate assignment through that alias are permitted; neither changes the binding. Chapter 13 defines calls, result rules, and the value supplied for each parameter; this chapter defines only the bindings written in the header.

A forward routine declaration contains the complete and sole header and no body. The compiler retains its exact routine and parameter names, ordered parameter types, optional result type, and `fails` effect. The later abbreviated `sub NAME` header opens the body under Chapters 4 and 5; the forward's parameter names create that body's parameter bindings. The definition completes the existing routine binding and does not declare another routine or repeat its signature.

A routine definition without an earlier forward makes its checked signature visible before the local-declaration prefix and body. No nested routine declaration is permitted.

<div id="810-local-declarations" class="nucleus-source-anchor"></div>

## 8.10 Local declarations

After parameter binding, activation-local declarations take effect in source order before the first statement. Routine-private aggregate objects already exist and are merely brought into lexical use at their declaration positions. All local declarations remain in one contiguous prefix.

A scalar local owns one per-invocation scalar value. Its initializer is an ordinary expression or the failable-invocation propagation form from Chapter 14, evaluated once when execution reaches the declaration. The successful result must be compatible with the declared scalar type. If the initializer is omitted, the compiler establishes zero for `u8` or `u16` and `false` for `boolean` at that point.

An aggregate local with no initializer or with a structured initializer creates one routine-private object of the declared type. That object has program lifetime, receives its zero or explicit constant initial image once before `main`, and is shared by every invocation of the routine. The local name denotes that object; routine entry does not clear, copy, or reinitialize it.

The declaration's routine scope hides the name from other routines but does not give the object activation lifetime. In particular, recursion does not create another object or preserve and restore the object's contents. The conformance program in Section 21.14 depends on this sharing. A programmer who needs fresh per-invocation state uses scalar locals or asks the caller to supply aggregate storage through a parameter.

An aggregate local initialized from a compatible aggregate storage path creates a fixed alias instead. The compiler evaluates the path once on each routine activation, checks its exact type, then establishes the binding. Later changes to an index used in the initializer do not retarget the alias. An aggregate routine result is transient and cannot supply this binding; retaining its value requires a later aggregate assignment into owning storage.

Neither form can be rebound. Aggregate assignment to a routine-private object changes that object's contents; aggregate assignment through an alias changes its referent. Scalar-field, scalar-element, and bounded-string byte mutation remain permitted.

A local becomes visible only after its complete declaration and initializer have been checked. Its initializer may name parameters, visible program declarations, and earlier locals. It cannot name itself or a later local. A local declaration inside a statement block or after the first statement is invalid.

<div id="811-initialization-order" class="nucleus-source-anchor"></div>

## 8.11 Initialization order

Constant expressions are evaluated during compilation and perform no source-level runtime operation.

The compiler establishes every program variable and routine-private aggregate object's zero or explicit initial value exactly once before the entry routine begins. Their semantic order follows source declaration order, with routine-private objects ordered by their local declarations within each routine definition. Static initializers have no source-level effects and cannot read storage, so this order is not otherwise observable. Every program-lifetime object has reached its initial value before source execution can read it. Chapter 7 defines lifetime, and Chapter 19 defines startup semantics and implementation requirements.

On each routine invocation, parameter binding precedes activation-local initialization. Local declarations then take effect in source order. A scalar local receives its zero or evaluated value at its declaration. An aggregate alias local evaluates its storage path and fixes its binding at its declaration. A routine-private aggregate object already exists and receives no per-invocation initialization. After the last local declaration, execution continues with the first statement.

<div id="812-invalid-declarations-and-capacity-failures" class="nucleus-source-anchor"></div>

## 8.12 Invalid declarations and capacity failures

The compiler must diagnose:

- a declaration in a location not permitted by Section 8.2;
- a missing type;
- a type, bound, initializer, or name that is not visible at its declaration point;
- an exact duplicate name or forbidden shadowing under Chapter 5;
- a nonconstant operand or invalid folded operation in a constant expression;
- a scalar initializer incompatible with its declared type;
- an invalid array length, string capacity, string length, record field count, array element count, or nested initializer shape;
- a record field with an unavailable type or a record with no fields;
- an aggregate `const`, a nonconstant aggregate initializer, or an initializer form incompatible with its declared component type;
- an aggregate alias whose target type is not identical to its declared type;
- an attempt to retain a transient aggregate result as a local alias;
- an attempt to rebind an aggregate alias or copy between nonidentical aggregate types; and
- an abbreviated body without one matching incomplete forward, a second completion, or an uncompleted forward.

An implementation may bound top-level declarations, record fields, parameters, locals, aggregate aliases, constant-expression nesting, structured-initializer depth and elements, decoded string bytes, routine-private aggregate storage, type descriptors, retained signatures, and initialization records. It must publish each limit and issue a capacity diagnostic before truncation, wraparound, omitted initialization, dropped fields, or an incorrect binding can occur. A capacity failure does not change an otherwise conforming declaration into invalid source.

<div id="813-examples" class="nucleus-source-anchor"></div>

## 8.13 Examples

These top-level declarations are valid under this chapter:

```nucleus
const cellCount as u16 = 8
record Cell
    value as u16
    active as boolean
end

var cells as Cell[cellCount]
var origin as Cell = (0, false)
var templates as Cell[2] = [(1, true), (2, false)]
var flags as u8[4] = [1, 2, 4, 8]
var prompt as string[8] = "READY"
var title as string[12] = "NUCLEUS"
var attempts as u8
```

`cells` and `attempts` begin with their zero values, including every field of every `Cell`. `origin`, `templates`, `flags`, `prompt`, and `title` are mutable program-lifetime objects with the written initial contents. `title` begins with seven decoded bytes.

A local aggregate declaration binds existing storage rather than copying it:

```nucleus
sub update(index as u8)
    var count as u16 = 0
    var current as Cell = cells[index]

    current.value = count
    return
end
```

The index is evaluated and checked once when `current` is declared. Assignment to `current.value` updates the selected element of `cells`; it does not rebind `current` or copy a `Cell`.

A program object or an array element may supply the alias target:

```nucleus
record State
    code as u8
end

var primary as State
var states as State[4]

sub inspect()
    var whole as State = primary
    var selected as State = states[2]
    return
end
```

A structured local initializer creates routine-private static storage:

```nucleus
sub privateCell() as Cell
    var cell as Cell = (3, true)
    return cell
end
```

The initializer is applied once before `main`; calls return aliases to the same `cell` object. An aggregate assignment such as `cell = templates[0]` copies a complete `Cell` into that object without changing its identity.

A forward declaration supplies the sole signature, and its abbreviated definition supplies the body:

```nucleus
forward sub inspectState(item as State)

sub inspectState
    return
end
```

The following declarations illustrate valid and invalid boundary cases. They are not one compilation unit:

```nucleus
const Limit as u16 = 8
var limit as u16                    // valid: names are case-sensitive
var Limit as u16                    // invalid: exact duplicate

const flags as u8[4] = [1, 2, 4, 8] // named constants are scalar only
const prompt as string[8] = "READY"  // bounded-string constants are absent

const first as u16 = second         // later name is unavailable
const second as u16 = first         // the first error prevents a cycle

const noElements as u16 = 0
var empty as u8[noElements]         // fixed arrays must be nonempty
var lateBound as u8[laterLength]    // later constant is unavailable
const laterLength as u16 = 4

var shortText as string[4] = "READY" // decoded literal is too long
var copiedCell as Cell = cells[0]   // static initializers cannot read aggregate storage

sub privateLocal()
    var aggregateLocal as Cell      // valid zero-initialized private object
    return
end
```

Inside a routine, `var current as Cell = cells[0]` is alias binding and is valid. `var aggregateLocal as Cell` instead creates a zero-initialized routine-private object. At top level, `var copiedCell as Cell = cells[0]` would read aggregate storage during static initialization and is invalid. Assignment such as `current = cells[1]` is valid and copies the selected `Cell` into `current`'s referent without rebinding `current`.
