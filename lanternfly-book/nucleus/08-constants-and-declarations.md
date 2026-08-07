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

| Declaration           | Permitted location                          | Binding or storage established                                            |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| Named constant        | Top level                                   | One typed compile-time scalar value                                       |
| Program variable      | Top level                                   | One mutable program-lifetime scalar or aggregate object                   |
| Record type           | Top level                                   | One nominal fixed-layout record type and its field scope                  |
| Forward routine       | Top level                                   | One routine signature without a body                                      |
| Routine definition    | Top level                                   | One routine signature and body, or completion of an earlier forward       |
| Formal parameter      | Routine header                              | One scalar activation value or aggregate-alias binding                    |
| Scalar local          | Contiguous routine declaration prefix       | One per-invocation scalar value                                           |
| Aggregate-alias local | Contiguous routine declaration prefix       | One per-invocation immutable binding to existing aggregate storage        |
| Record field          | Between a record header and its closing end | One named scalar or aggregate subobject in each object of the record type |

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
                        | failable-invocation "or" "fail"

constant-initializer  ::= scalar-constant-expression
program-initializer   ::= scalar-constant-expression
                        | STRING
                        | scalar-array-initializer
scalar-array-initializer
                      ::= "[" scalar-constant-expression
                          { "," scalar-constant-expression } "]"
```

`type`, `scalar-type`, and `aggregate-type` are defined by Chapter 6. The parser selects the initializer form from the declared type. `routine-statement-sequence` and `expression` are placeholders for later chapters, not additional declaration syntax.

Each constant, variable, record header, field, and local declaration introduces one name. A routine header introduces one routine name and its individually written parameters. Each field and parameter repeats the canonical `name as Type` form. No comma-separated field or variable group is permitted.

Square brackets suppress logical newlines under Chapter 3. A scalar-array initializer may therefore span physical lines without adding newline productions to this grammar.

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

| Declared type                          | Permitted initializer                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `u8`, `u16`, or `boolean`              | One compatible scalar constant expression                                    |
| `string[N]`                            | One fitting string literal                                                   |
| Fixed array with scalar element type   | One flat list of exactly the declared number of compatible constant elements |
| Record or array with aggregate element | None; omit the initializer to select recursive zero initialization           |

Program initialization does not evaluate an ordinary runtime expression or read another variable. A string literal establishes both the decoded bytes and their logical length; embedded zero bytes count toward that length. A string or array initializer cannot name another aggregate object. Nucleus has no record-constructor initializer, designated-field initializer, implicit aggregate copy, or partial array initializer. A fixed-array list that is too short or too long is invalid; the compiler neither pads nor discards elements.

The program variable becomes visible only after the compiler has checked its type and initializer. Its initializer may therefore use earlier scalar constants but cannot use the variable itself or a later declaration.

<div id="89-routine-declarations-and-parameters" class="nucleus-source-anchor"></div>

## 8.9 Routine declarations and parameters

One routine header declares a routine name, an ordered list of zero or more formal parameters, and either no result type or one result type. Every parameter has an explicit `name as Type` declaration. Parameters have no initializer or default argument, and a header has no grouped names or multiple result list.

A scalar parameter denotes a per-invocation copied value. An aggregate parameter establishes a fixed typed alias to caller-provided program-variable storage. Scalar-leaf mutation through that alias is permitted. Chapter 13 defines calls, result rules, and the value supplied for each parameter; this chapter defines only the bindings written in the header.

A forward routine declaration contains the complete and sole header and no body. The compiler retains its exact routine and parameter names, ordered parameter types, optional result type, and `fails` effect. The later abbreviated `sub NAME` header opens the body under Chapters 4 and 5; the forward's parameter names create that body's parameter bindings. The definition completes the existing routine binding and does not declare another routine or repeat its signature.

A routine definition without an earlier forward makes its checked signature visible before the local-declaration prefix and body. No nested routine declaration is permitted.

<div id="810-local-declarations" class="nucleus-source-anchor"></div>

## 8.10 Local declarations

Local declarations execute in source order at the start of each invocation, after parameter binding and before the first statement. They remain in one contiguous prefix.

A scalar local owns one per-invocation scalar value. Its initializer is an ordinary expression or the failable-invocation propagation form from Chapter 14, evaluated once when execution reaches the declaration. The successful result must be compatible with the declared scalar type. If the initializer is omitted, the compiler establishes zero for `u8` or `u16` and `false` for `boolean` at that point.

An aggregate local owns no aggregate storage. Its initializer is mandatory and must be a compatible aggregate storage path rooted as Section 7.6 permits, a compatible aggregate-alias result from an infallible invocation, or a failable aggregate-alias invocation followed by `or fail` under Chapter 14. The compiler evaluates the path or invocation once when execution reaches the declaration, checks the result's type and program-lifetime provenance, then establishes an immutable typed alias binding to that object or subobject. Later changes to an index used in the initializer do not retarget the alias.

An aggregate local's binding cannot be reassigned. Its target is mutable program-variable storage reached directly, through another aggregate alias, or through a checked aggregate-alias result. Mutation through a scalar field, scalar fixed-array element, or bounded-string byte is permitted.

A local becomes visible only after its complete declaration and initializer have been checked. Its initializer may name parameters, visible program declarations, and earlier locals. It cannot name itself or a later local. A local declaration inside a statement block or after the first statement is invalid.

<div id="811-initialization-order" class="nucleus-source-anchor"></div>

## 8.11 Initialization order

Constant expressions are evaluated during compilation and perform no source-level runtime operation.

The compiler establishes each program variable's zero or explicit initial value exactly once before the entry routine begins. The semantic order is top-level declaration order. Every program variable has reached its initial value before source execution can read it. Chapter 7 defines lifetime, and Chapter 19 defines startup semantics and implementation requirements.

On each routine invocation, parameter binding precedes local initialization. Local declarations then execute once each in source order. A scalar local receives its zero or evaluated value at its declaration. An aggregate local evaluates its storage path and fixes its alias binding at its declaration. After the last local declaration, execution continues with the first statement.

<div id="812-invalid-declarations-and-capacity-failures" class="nucleus-source-anchor"></div>

## 8.12 Invalid declarations and capacity failures

The compiler must diagnose:

- a declaration in a location not permitted by Section 8.2;
- a missing type, required initializer, or alias target;
- a type, bound, initializer, or name that is not visible at its declaration point;
- an exact duplicate name or forbidden shadowing under Chapter 5;
- a nonconstant operand or invalid folded operation in a constant expression;
- a scalar initializer incompatible with its declared type;
- an invalid array length, string capacity, string length, or array element count;
- a record field with an unavailable type or a record with no fields;
- an aggregate `const` or a program aggregate initializer not admitted by Section 8.8;
- an aggregate alias whose target type is not identical to its declared type;
- an attempt to rebind an aggregate alias or copy a complete aggregate; and
- an abbreviated body without one matching incomplete forward, a second completion, or an uncompleted forward.

An implementation may bound top-level declarations, record fields, parameters, locals, aggregate aliases, constant-expression nesting, initializer elements, decoded string bytes, type descriptors, retained signatures, and initialization records. It must publish each limit and issue a capacity diagnostic before truncation, wraparound, omitted initialization, dropped fields, or an incorrect binding can occur. A capacity failure does not change an otherwise conforming declaration into invalid source.

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
var flags as u8[4] = [1, 2, 4, 8]
var prompt as string[8] = "READY"
var title as string[12] = "NUCLEUS"
var attempts as u8
```

`cells` and `attempts` begin with their zero values, including every field of every `Cell`. `flags`, `prompt`, and `title` are mutable program-lifetime objects with the written initial contents. `title` begins with seven decoded bytes.

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

A forward declaration supplies the sole signature, and its abbreviated definition supplies the body:

```nucleus
forward sub inspectState(item as State)

sub inspectState
    return
end
```

The following marked forms are invalid. They illustrate separate errors and are not one compilation unit:

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
var copiedCell as Cell = cells[0]   // top-level record copy initialization is absent

sub invalidLocal()
    var aggregateLocal as Cell      // aggregate local requires a target
    return
end
```

Inside a routine, `var current as Cell = cells[0]` is alias binding and is valid. At top level, the same initializer would request an aggregate object initialization from another object and is invalid. Assignment such as `current = cells[1]` is also invalid: it performs neither alias rebinding nor whole-record copying.
