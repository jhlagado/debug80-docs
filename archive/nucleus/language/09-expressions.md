---
layout: "default"
title: "9. Expressions"
parent: "Nucleus 0.1 Language Specification"
nav_order: 9
pageClass: "nucleus-specification"
---
[← 8. Constants and declarations](08-constants-and-declarations.md) · [Contents](./) · [10. Statements →](10-statements.md)

<div id="9-expressions" class="nucleus-source-anchor"></div>

# 9. Expressions

<div id="91-scope" class="nucleus-source-anchor"></div>

## 9.1 Scope

This chapter defines expression syntax, precedence, associativity, operand and result types, scalar conversions, designator formation, and evaluation order. Chapter 6 defines the type set and compatibility rules. Chapter 7 defines storage identity and aggregate aliases. Chapter 10 defines assignment and the statement contexts that contain expressions. Chapter 13 defines routine signatures, argument passing, and result transfer.

Nucleus uses one predictive expression grammar for ordinary, initializer, argument, index, condition, and return contexts. A context may restrict the resulting category or supply an expected type, but it does not select another precedence ladder. The grammar requires no backtracking or retained syntax tree.

<div id="92-expression-grammar" class="nucleus-source-anchor"></div>

## 9.2 Expression grammar

The reusable expression fragment is:

```text
expression             ::= or-expression
or-expression          ::= and-expression { ( "or" | "xor" ) and-expression }
and-expression         ::= comparison { "and" comparison }
comparison             ::= additive [ comparison-operator additive ]
comparison-operator    ::= "=" | "<>" | "<" | "<=" | ">" | ">="
additive               ::= multiplicative
                           { ( "+" | "-" ) multiplicative }
multiplicative         ::= unary { ( "*" | "/" | "mod" ) unary }
unary                  ::= ( "+" | "-" | "not" ) unary | postfix-expression
postfix-expression     ::= primary { postfix-suffix }
primary                ::= NUMBER | CHARACTER | "true" | "false"
                         | NAME | conversion | "(" expression ")"
conversion             ::= ( "u8" | "u16" | "i8" | "i16" )
                           "(" expression ")"
postfix-suffix         ::= argument-list | "[" expression "]" | "." NAME
argument-list          ::= "(" [ expression { "," expression } ] ")"
```

Chapter 17 incorporates this fragment into the complete grammar. The semantic restrictions below reject suffix combinations that the compact syntactic loop can recognize but Nucleus does not admit.

A string literal is not a general expression primary. Chapter 8 permits it as a bounded-string initializer, and Section 13.4 permits it in the argument position selected by a `string[]` formal. That contextual argument does not turn the literal into a copyable aggregate value.

<div id="93-names-calls-and-postfix-operations" class="nucleus-source-anchor"></div>

## 9.3 Names, calls, and postfix operations

The compiler resolves each `NAME` before interpreting its postfix suffixes. A visible scalar constant, scalar variable, parameter, or local supplies its declared scalar type. A visible aggregate object or alias supplies its exact aggregate type and storage category. A visible routine name must be followed immediately by an argument list; routine names are not values.

An argument-list suffix in an ordinary expression invokes only an infallible source routine named by the primary. Nucleus has no routine values, indirect calls, callable results, overload resolution, or invocation of an arbitrary parenthesized expression. A second argument-list suffix is invalid. Chapter 13 defines argument and result compatibility, and Chapter 14 gives failable calls their restricted statement, initializer, and assignment positions.

An index suffix requires a concrete or open array, or a concrete or open bounded-string storage path or typed alias. Its expression may have any integer type. A signed value is checked for negativity before the ordinary upper-bound and region checks. For an array, the result has the exact element type; a concrete array uses its fixed bound and an open array uses its retained actual count. The compiler diagnoses a statically out-of-range concrete index and emits a checked access for a dynamic index unless it proves the index is in range. For a bounded string, the result is a `u8` storage path and the implementation checks the index against the current logical length before every access unless it proves that access safe. A failed check occurs before an element, byte, or aggregate alias is produced, read, or written.

A field suffix on a record storage path or typed record alias resolves the field name only in that record's field scope and produces the field's declared type. A `.length` suffix on a concrete or open bounded-string path produces its `u8` logical length. A `.length` suffix on a concrete or open array produces its read-only `u16` element count. A `.capacity` suffix on an open `string[]` parameter produces its read-only actual capacity. Other field suffixes on bounded strings and arrays are invalid. Selection does not expose an offset, header, or address to source code.

Index and field suffixes may follow an aggregate result from a routine call. The result remains a transient typed alias to the object established by Chapter 13; the suffix does not copy that object. A scalar result cannot be indexed or selected, and a result-free call cannot take another suffix.

<div id="94-expression-categories-and-storage-paths" class="nucleus-source-anchor"></div>

## 9.4 Expression categories and storage paths

Expression checking records both a type and one of these source categories:

| Category                         | Permitted use                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exact integer constant           | Adopts an admitted integer type from context or the rules in Section 9.7.                                                                              |
| Scalar value                     | May be copied, converted, compared, passed, returned, or stored in a compatible scalar destination.                                                    |
| Scalar storage path              | Reads as its scalar value in an expression and may be a writable destination when its root is mutable.                                                 |
| Aggregate storage path           | May be indexed, selected, copied by exact-type assignment, passed as an aggregate argument, or returned under Chapter 7's consumption rules.           |
| Transient aggregate-alias result | Denotes compatible storage for one containing operation and may be selected, indexed, copied by exact-type assignment, passed, returned, or discarded. |
| Result-free invocation           | Is valid only as a complete call statement; when failable, its failure is consumed under Chapter 14.                                                   |

A **storage path** begins with a visible program variable, aggregate constant, parameter, or local and continues through zero or more field and index suffixes. Each suffix preserves the root object's identity while selecting a subobject. An aggregate-constant-rooted path is readable but not a direct assignment target. A scalar constant and a routine call are not storage-path roots. A call that returns an aggregate alias may be selected or indexed in a value context, but Chapter 10 does not admit it as an assignment root.

A bare aggregate storage path is valid where a rule requires compatible aggregate storage, an alias, or an aggregate-assignment operand. It is not otherwise a general expression value. Nucleus has no aggregate comparison, aggregate truth test, automatic argument copy, or automatic result copy.

<div id="95-explicit-integer-conversions" class="nucleus-source-anchor"></div>

## 9.5 Explicit integer conversions

`u8(expression)`, `u16(expression)`, `i8(expression)`, and `i16(expression)` convert among the four integer types. The operand is evaluated once as its mathematical signed or unsigned value. The result is valid only when that value lies in the destination range. A statically known failure is a source diagnostic; a dynamic failure performs the Chapter 15 `narrowing` trap before producing or storing a result.

The conversions are numeric. They do not reinterpret sign bits, extract a low byte, wrap, or expose a machine representation. For example, `i16(i8Value)` sign-extends, `i16(u8Value)` zero-extends, and `u8(i8Value)` fails when the value is negative. `i8($FF)` is invalid because `$FF` is the nonnegative value 255; `i8(-1)` is valid.

`boolean(expression)`, record conversions, array conversions, string-capacity conversions, and conversions between an integer and an aggregate-alias carrier are absent. The four integer type words are fixed tokens, not routine names. A user declaration cannot override them, and conversion syntax does not participate in routine lookup.

<div id="96-precedence-and-associativity" class="nucleus-source-anchor"></div>

## 9.6 Precedence and associativity

Precedence from highest to lowest is:

1. routine invocation, indexing, field selection, and parenthesized grouping;
2. unary `+`, unary `-`, and `not`;
3. multiplication, division, and modulo;
4. addition and subtraction;
5. one comparison;
6. `and`;
7. `or` and `xor`.

Binary arithmetic, `and`, `or`, and `xor` associate from left to right. Unary `+`, unary `-`, and `not` associate from right to left. A comparison contains at most one comparison operator and therefore has no associativity.

`not` is a unary operator with the same precedence as unary `+` and `-`. It therefore binds more tightly than multiplication, addition, and comparison. Thus `not mask = expected` means `(not mask) = expected`. Negating a complete comparison requires parentheses, as in `not (left = right)`.

The repeated forms in Section 9.2 preserve left association without a
left-recursive grammar. A compiler may organize expression parsing differently,
but it must accept the same token sequences and preserve this association and
the evaluation order in Section 9.11.

<div id="97-exact-integer-resolution" class="nucleus-source-anchor"></div>

## 9.7 Exact-integer resolution

An exact integer literal or exact named integer constant adopts an expected integer type when its mathematical value fits. Negative exact values may adopt only `i8` or `i16`. The expected type may come from a declaration initializer, scalar destination, parameter, result, conversion operand, or a typed operand in the same arithmetic operation. An expected type never narrows an already typed operand implicitly.

For an integer operation:

- when one operand has integer type and the other is an exact integer constant, the constant adopts that type when it fits;
- when both operands are typed, the common type is selected by the table below;
- when both operands are exact integer constants, an expected integer result type applies when both operands fit; otherwise the operation uses `i16` when either operand is negative and `u16` when both operands are nonnegative; and
- when a standalone exact integer value has no expected type, a negative value uses `i16` and a nonnegative value uses `u16`.

| Operand types | Common type |
| ------------- | ----------- |
| `u8`, `u16`   | `u16`       |
| `i8`, `i16`   | `i16`       |
| `u8`, `i16`   | `i16`       |
| `u8`, `i8`    | `i16`       |

The combinations `u16` with `i8`, `u16` with `i16`, and `i16` with `u16` have no implicit common type. Source must perform an explicit checked conversion before applying the operator. Nucleus does not use C-style unsigned dominance.

An exact value that does not fit the selected type makes the source invalid. The compiler does not truncate the literal or select a wider intermediate type after the context has fixed a narrower operation.

A character literal has type `u8`. It follows the ordinary implicit widening rule when combined with or supplied to `u16`. `true` and `false` have type `boolean` and never adopt an integer type.

<div id="98-integer-arithmetic" class="nucleus-source-anchor"></div>

## 9.8 Integer arithmetic

`+`, `-`, `*`, `/`, and `mod` accept integer operands. After literal resolution and implicit conversion, both operands have the same type and the result has that type.

Addition, subtraction, multiplication, and unary minus use arithmetic modulo 256 for byte types and modulo 65,536 for word types. Unary minus is subtraction from zero in the selected width, including for typed unsigned operands. Unary plus preserves the operand and its type. These rules define wraparound; overflow is neither undefined nor a narrowing conversion. An exact negative initializer is different: `var x as u8 = -1` is invalid, while `x = -x` remains modular unsigned arithmetic.

Unsigned division produces the unsigned quotient and remainder. Signed division truncates toward zero; signed modulo has the dividend's sign and satisfies `a = (a / b) * b + (a mod b)`. A zero divisor for either operation performs the `division-by-zero` trap specified by Chapter 15 at the divisor. When the divisor is a compile-time constant zero, the source is invalid and the compiler issues the same diagnostic at that divisor instead of emitting a guaranteed trap. The minimum signed value divided by -1 wraps to that same minimum value, with remainder zero; there is no division-overflow trap.

The result width is determined before evaluation. Arithmetic does not widen merely because a mathematical result would exceed that width. A program that requires a wider result widens an operand explicitly or supplies a compatible `u16` or `i16` operand before the operation.

<div id="99-comparison" class="nucleus-source-anchor"></div>

## 9.9 Comparison

The six comparison operators accept compatible integer operands and produce `boolean`. Literal resolution and common-type selection follow Section 9.7. Equality and inequality compare the selected-width bit patterns. Ordering is signed when the common type is signed and unsigned otherwise.

Boolean operands support only `=` and `<>`. Both operands must have type `boolean`. Boolean ordering is invalid.

Records, fixed arrays, and bounded strings, including aliases to them, have no comparison operation in Nucleus 0.1. Equal layout or identity of the referred object does not add an equality operator.

Comparison chaining is invalid. `minimum <= value <= maximum` is not two comparisons; after the first comparison, the left side would be Boolean and the grammar permits no second comparison operator. The equivalent valid form is `minimum <= value and value <= maximum`.

<div id="910-not-and-or-and-xor" class="nucleus-source-anchor"></div>

## 9.10 `not`, `and`, `or`, and `xor`

`not` accepts one `boolean` or integer operand. For `boolean`, it exchanges `true` and `false`. For an integer, it complements every bit in the operand's declared width and produces the same integer type.

`and` and `or` accept either two Boolean operands or two compatible integer operands. Mixed Boolean and integer operands are invalid. Integer operands use literal resolution and widening from Section 9.7, combine corresponding bits, evaluate both operands, and produce the resolved integer type.

`xor` accepts only two compatible integer operands. It uses the same literal resolution and widening rules, evaluates both operands from left to right, combines corresponding bits by exclusive OR, and produces the resolved integer type. A Boolean operand is invalid. This deliberate restriction avoids placing an eager Boolean operator at the same precedence as short-circuiting Boolean `or`.

Boolean `and` and `or` short-circuit. The left operand is evaluated first:

| Operator | Left value | Right operand | Result                            |
| -------- | ---------- | ------------- | --------------------------------- |
| `and`    | `false`    | not evaluated | `false`                           |
| `and`    | `true`     | evaluated     | the right operand's Boolean value |
| `or`     | `true`     | not evaluated | `true`                            |
| `or`     | `false`    | evaluated     | the right operand's Boolean value |

An operand that is not evaluated performs no call, storage access, bounds check, conversion check, arithmetic trap, or other source operation. The Boolean and integer meanings are selected by static types and create no parsing ambiguity.

Shifts, rotations, power, and symbolic Boolean operators are absent. Adding one
of these operators requires a language revision and, for a word operator, a
Chapter 3 token amendment.

<div id="911-evaluation-order" class="nucleus-source-anchor"></div>

## 9.11 Evaluation order

Nucleus fixes evaluation order:

- a unary operand is evaluated before its operator;
- binary operands are evaluated from left to right, subject to Boolean short-circuiting;
- a postfix base is evaluated before its suffixes, and suffixes are applied from left to right;
- each index expression is evaluated and checked when its suffix is reached;
- routine arguments are evaluated from left to right under Chapter 13; and
- an explicit conversion evaluates its operand before checking or producing the result.

If an earlier operation traps, later operands and suffixes are not evaluated. Field selection performs no source-level read by itself, but evaluation of its base and any preceding index or call remains observable.

A backend may reorder operations only when it proves that no result, call, mutation, storage access, check, trap, or other observable behaviour can distinguish the order. The permitted implementation arrangement does not change source semantics.

<div id="912-constant-expressions" class="nucleus-source-anchor"></div>

## 9.12 Constant expressions

The scalar operators and conversions in this chapter are available to the scalar constant expressions defined by Chapter 8. The compiler applies the same literal resolution, width, wraparound, comparison, and short-circuit rules used at runtime.

A constant division by zero is invalid. An explicit integer conversion of a known value outside its destination range is invalid. A short-circuited constant operand is not evaluated and therefore cannot contribute a fault.

Routine calls and storage paths remain unavailable in constant expressions. The presence of a pure-looking routine or a program variable with a constant initializer does not extend the constant-expression grammar.

<div id="913-invalid-expressions-and-capacity-limits" class="nucleus-source-anchor"></div>

## 9.13 Invalid expressions and capacity limits

The compiler must diagnose:

- a name of the wrong declaration class for its expression position;
- a routine name without its argument list or an argument-list suffix on a non-routine;
- an invalid field, index, suffix sequence, or aggregate use;
- an operand-type mismatch or a literal that does not fit its resolved type;
- a chained comparison;
- an implicit narrowing or unavailable conversion;
- a result-free call used as a value;
- an aggregate used where a scalar value is required; and
- a statically provable bounds, narrowing, or division failure.

An implementation may bound expression nesting, prefix depth, postfix depth, arguments, and retained expression-checking state. It must publish each limit and issue a capacity diagnostic before a stack, counter, temporary pool, or type record overflows. Capacity exhaustion must not change precedence, omit a check, truncate an argument list, or alter an expression's type.

<div id="914-examples" class="nucleus-source-anchor"></div>

## 9.14 Examples

For `u16` values `a`, `b`, and `c`, these expressions associate as shown:

```nucleus
a - b - c       // (a - b) - c
a / b * c       // (a / b) * c
- -a            // -( -a ) in u16 arithmetic
not not flag    // not (not flag)
```

Postfix operations share one left-to-right path:

```nucleus
cells[index].value
entryAt(index).value
measure(cells[index].value)
```

`entryAt` must return an aggregate alias with the selected record type, and `measure` must have a compatible visible signature. The index is checked before field selection or argument transfer.

These forms illustrate comparison and conversion rules:

```nucleus
minimum <= value and value <= maximum
u16(byteValue) + wordValue
u8(wordValue)
(not (mask and readyMask)) = 0
```

The first expression contains two non-chained comparisons. The third performs checked narrowing. In the last expression, parentheses make `not` complement the complete `mask and readyMask` result; without them, only `mask` would be complemented before `and`.

Each of these forms is invalid:

```nucleus
first < second < third  // comparisons do not chain
flag + 1               // Boolean is not integer
recordValue = other    // record equality is absent
shortText < longText   // strings have no comparison operators
routineName            // a routine name is not a value
boolean(value)          // Boolean conversion is absent
```
