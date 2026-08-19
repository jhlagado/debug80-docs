---
layout: "default"
title: "6. Types"
parent: "Nucleus 0.1 Language Specification"
nav_order: 6
pageClass: "nucleus-specification"
---
[← 5. Names and scopes](05-names-and-scopes.md) · [Contents](./) · [7. Storage, values, and lifetime →](07-storage-values-and-lifetime.md)

<div id="6-types" class="nucleus-source-anchor"></div>

# 6. Types

<div id="61-scope" class="nucleus-source-anchor"></div>

## 6.1 Scope

This chapter defines the Nucleus 0.1 type set, type identity, compatibility, scalar conversions, aggregate categories, and the static type carried by aggregate aliases. Chapter 7 defines storage duration and lifetime. Chapter 8 defines declarations and initialization. Chapter 9 defines expression syntax and operator typing, and Chapter 13 defines routine syntax and parameter passing.

The type system supports local checking during one streaming source pass. A compiler can determine the type of a name, field, array element, literal in context, or routine result from declarations already processed. It requires neither whole-program inference nor runtime type tags.

<div id="62-type-set" class="nucleus-source-anchor"></div>

## 6.2 Type set

Nucleus 0.1 has five scalar types, three owned aggregate forms, and two
parameter-only aggregate-view families:

| Category        | Types or forms                       |
| --------------- | ------------------------------------ |
| Scalar          | `u8`, `u16`, `i8`, `i16`, `boolean`  |
| Owned aggregate | nominal records, `T[N]`, `string[N]` |
| Parameter view  | `string[]`, `T[]`                    |

The following skeleton records type formation without defining declaration grammar:

```text
type             ::= type-atom { array-suffix }
type-atom        ::= scalar-type
                   | record-type-name
                   | bounded-string-type
scalar-type      ::= "u8" | "u16" | "i8" | "i16" | "boolean"
array-suffix     ::= "[" [ array-length ] "]"
bounded-string-type
                 ::= "string" "[" [ string-capacity ] "]"
```

Each array suffix contributes one dimension. Suffixes are read outermost first:
`u8[3][2]` is an array of three `u8[2]` rows, and `grid[y][x]`
selects the same outer and inner dimensions in that order. The complete layout
is row-major because every row occupies its ordinary fixed-array extent inline.
An array element may therefore be a scalar, record, bounded string, or another
fixed array. Records may contain fields of any admitted concrete type,
including nested fixed arrays.

An omitted array bound is admitted only in the first array suffix of a formal
parameter. `T[]` denotes a view of one complete concrete `T[N]` object and
retains that object's outermost element count. For example, `u8[][2]` accepts
complete arrays whose rows have exact type `u8[2]`; `u8[2][]` and `u8[][]` are
invalid. The bracket pair in `string[16]` belongs to the bounded-string atom,
so `string[16][4]` is an array of four `string[16]` objects and
`string[16][]` is an open array of that exact element type.

`string[N]` is the owned bounded-text form. An omitted capacity is admitted only
in a formal parameter: `string[]` denotes a view whose actual capacity comes
from the argument. `string` is a core reserved word. No other type word is
added by this chapter.

<div id="63-scalar-types" class="nucleus-source-anchor"></div>

## 6.3 Scalar types

`u8` is the unsigned integer type whose values range from 0 through 255. `u16` is the unsigned integer type whose values range from 0 through 65,535. `i8` is the signed integer type whose values range from -128 through 127. `i16` is the signed integer type whose values range from -32,768 through 32,767. Their widths, ranges, and two's-complement representation do not vary by target.

`boolean` has exactly the values `false` and `true`. It is distinct from all four integer types. An integer is not a condition, a Boolean value is not an integer, and Nucleus 0.1 provides no Boolean-to-integer or integer-to-Boolean conversion.

A scalar variable, parameter, field, array element, or routine result holds a scalar value. Scalar assignment and scalar argument passing copy the value. A compiler may use any private register or memory representation that preserves the type and value; that representation does not alter source compatibility.

<div id="64-literals-and-scalar-conversion" class="nucleus-source-anchor"></div>

## 6.4 Literals and scalar conversion

An integer literal or exact integer constant has no fixed integer type until an expected integer type or an expression rule supplies one. A nonnegative exact value may adopt any of `u8`, `u16`, `i8`, or `i16` when it lies in the selected type's range. A negative exact value may adopt `i8` or `i16`, but never an unsigned type. A literal outside the expected range is invalid; it is not truncated or wrapped. An otherwise uncontexted negative exact value defaults to `i16`.

Chapter 9 defines the treatment of an integer literal with no expected type and the result types of operators. This chapter does not assign an expression-wide default type.

A character literal has type `u8` and its value is the decoded byte from Chapter 3. Nucleus has no separate character type. The ordinary `u8`-to-`u16` widening rule permits a character literal where a `u16` value is expected.

The implicit integer conversions are `u8` to `u16`, `u8` to `i16`, and `i8` to `i16`. Each preserves every source value. The same rules apply to assignment, initialization, scalar arguments, scalar results, and operands when Chapter 9 admits a mixed-type operation.

Every other integer conversion requires an explicit checked conversion from Chapter 9. When the source value is known and does not fit the destination range, the compiler issues a diagnostic. When the value is not known until execution, the generated program performs the `narrowing` trap before producing or storing a result that does not fit. A checked conversion never means low-byte extraction, modulo reduction, sign reinterpretation, or arbitrary bit casting.

No implicit or explicit scalar conversion changes `boolean` into an integer or an integer into `boolean`. Nucleus 0.1 also has no arbitrary cast or same-width reinterpretation operation.

<div id="65-values-aggregate-storage-and-aliases" class="nucleus-source-anchor"></div>

## 6.5 Values, aggregate storage, and aliases

The source type and the way a source occurrence denotes data are separate properties:

| Category                | Meaning                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Scalar value            | A `u8`, `u16`, `i8`, `i16`, or `boolean` value that can be copied by assignment, argument passing, or return. |
| Owned aggregate storage | Storage containing one record, fixed array, or bounded string for a lifetime defined in Chapter 7.            |
| Aggregate alias         | A typed, non-owning binding to existing aggregate storage.                                                    |

A scalar named constant has either an exact integer type inferred from its initializer or type `boolean`. A record, fixed array, or bounded-string constant has an explicit aggregate type and complete static initializer under Chapter 8.

Top-level variables and aggregate constants provide owned aggregate storage. Aggregate storage may also occur inline as a record field or fixed-array element. A routine cannot declare aggregate storage or an aggregate-alias local. The permitted declaration sites, initialization rules, mutability, and storage duration appear in Chapters 7 and 8.

An aggregate parameter is a fixed typed alias to caller-provided storage. Its binding cannot be changed, but mutation through it changes the caller's object. A parameter declared as `string[]` additionally retains the concrete argument's capacity for checked access. A parameter declared as `T[]` retains the concrete array's element count. A routine may also return a transient aggregate alias to existing storage, but an open view cannot be a result.

Assignment between aggregate designators of the exact same concrete type copies the complete value into the destination. This includes two bounded strings with the same capacity. Assignment changes the destination object's contents and never rebinds an alias. Routine arguments and aggregate results transfer aliases rather than copying automatically. Concrete aggregate parameters and all aggregate results require exact type identity; `string[]` parameters use the specific compatibility rule in Section 6.10.

An aggregate routine result is a transient typed alias to existing program-lifetime storage. Chapter 7 defines its permitted consumption, and Chapter 13 defines result syntax. Nucleus has no aggregate storage whose lifetime ends with a call, so aggregate results require no separate escape analysis.

<div id="66-record-types" class="nucleus-source-anchor"></div>

## 6.6 Record types

A record declaration creates one nominal type. Two record declarations create different types even when their fields have identical names and types. Record storage and aliases are compatible only with the type created by the same declaration.

Every record has one fixed field sequence and one fixed layout. Each field has a name and one previously declared type. A field may have scalar, record, fixed-array, or bounded-string type. The complete field sequence is known when the record declaration ends.

A record must have finite size. A field therefore must not contain its own record type directly or through a cycle of record and array containment. Variant records, unions, and overlaid layouts are absent.

Selecting a scalar field produces a scalar occurrence of the field's declared type. Selecting an aggregate field produces a storage path or aggregate alias with the field's exact aggregate type. Selection does not expose a byte offset or address to source code.

Chapter 8 defines record declaration and field syntax. Runtime byte offsets and packed layout belong to the Z80 runtime and backend contract.

<div id="67-fixed-array-types" class="nucleus-source-anchor"></div>

## 6.7 Fixed-array types

`T[N]` is a fixed array with element type `T` and length `N`. Each written
suffix adds one dimension, and a nested fixed array is an ordinary element
type. `N` must be a positive compile-time integer from 1 through 65,535. A
compiler may publish a smaller capacity for a particular storage region or
implementation, but exceeding that capacity is a capacity failure rather than
another array type.

The index domain is always zero through `N - 1`. Nucleus has no arbitrary lower bound, subrange index, enumeration index, or range type. The length and element type are part of the array type.

Two fixed-array types are identical when their element types are identical and
their lengths are equal. This rule applies recursively: two `u8[3][2]` types
are identical because both are length-three arrays whose element type is the
same `u8[2]` type. `u8[3][2]`, `u8[2][3]`, and `u16[3][2]` are distinct.

An array index may have any integer type. A constant negative index or one outside the array domain is invalid. A dynamic signed index is checked for negativity before the ordinary unsigned upper-bound and region checks. A failed dynamic check performs the bounds trap specified by Chapter 15 before any element load, store, or alias formation.

Indexing an array of scalars produces a scalar occurrence with the element
type. Indexing an array of records, bounded strings, or fixed arrays produces a
storage path or aggregate alias with the element type. Each suffix performs its
own bounds check. Nested indexing never substitutes one flattened check against
the product of the dimensions, and the index operation never produces an
untyped address.

Both a concrete `T[N]` path and an open `T[]` parameter admit `.length`. The result is a read-only `u16`: it is the fixed `N` for the concrete type and the retained actual element count for the open view. Evaluation of a concrete base still performs every required call, path selection, check, and trap before producing the statically known result. Array `.length` is not a constant-expression operation and cannot be assigned.

`T[]` is a parameter-only, length-polymorphic view of one complete concrete
fixed array. It may bind to any complete `T[N]` storage path or transient alias,
for any admitted `N`, or forward another `T[]` parameter. The omitted bound is
the outermost dimension. The element type is exactly invariant: `u8[]` accepts
only arrays of `u8`, a nominal record view accepts only that record type,
`string[16][]` accepts only arrays whose elements are exactly `string[16]`, and
`u8[][2]` accepts arrays whose rows are exactly `u8[2]`. Scalar widening,
record layout equivalence, bounded-string capacity polymorphism, and a different
inner dimension do not apply to the element type.

The view retains the actual `u16` outermost element count and uses it for
`.length` and checked indexing. It owns no storage, cannot be rebound, and is
invalid as a variable, constant, record field, array element, local, or routine
result. It is not a slice: source cannot select a prefix, suffix, offset, range,
or caller-chosen count, and whole-array assignment through the view is invalid.

<div id="68-bounded-strings" class="nucleus-source-anchor"></div>

## 6.8 Bounded strings

`string[N]` is a fixed-capacity counted sequence of bytes with a current length from 0 through `N`. `N` is a compile-time integer from 1 through 253 and is part of the type. The empty string is a valid value. Payload bytes may have any value from 0 through 255, including zero.

A string literal is a contextual bounded-string initializer. It is compatible with `string[N]` when its decoded byte length does not exceed `N`. A literal that is too long is invalid. When a literal is passed directly to a `string[]` parameter, its inferred concrete capacity is its decoded length, except that an empty literal has capacity one. The literal does not create an open-ended string type or infer a capacity in any other context.

Two concrete bounded-string types are identical only when their capacities are equal. An alias to `string[16]` cannot bind to a `string[32]` parameter or result, even when the current contents would fit both. Concrete aggregate aliases and results therefore retain an exact extent.

A bounded string is an aggregate, not a `u8` array. It has no source-level header field, payload field, or terminator field. Nucleus 0.1 provides intrinsic postfix operations without exposing that representation:

- `text.length` is a `u8` value equal to the current logical byte length.
- `text[index]` selects one existing byte as a `u8` storage path. The index may have any integer type and must be nonnegative and less than the current length. A failed check performs the `bounds` trap before a read or write.

A concrete `string[N]` path may read `.length`, but it cannot assign to that
property or read `.capacity` directly. An open `string[]` parameter may also
read `.capacity`, which yields the actual capacity retained when the call bound
the parameter. The property is read-only. Ordinary source routines can accept
a concrete string through `string[]` when they need a capacity-polymorphic
capacity query.

An open parameter also admits checked assignment to `.length`:

```nucleus
text.length = newLength
```

The right side must be assignable to `u8`. The destination and right side are
each evaluated once. Before changing the object, execution validates its
complete `capacity + 2` byte region, its existing length, and the new length.
Both lengths must be at most the retained capacity. A failure performs the
`bounds` trap and changes no byte of the object.

Successful assignment preserves the content prefix through the lesser of the
old and new lengths. Shrinking clears bytes `newLength + 1` through
`oldLength` before storing the new length. Growing exposes the zero-valued tail
maintained by the bounded-string invariant. Assigning the current length has no
effect on the payload. The permanent zero at offset `capacity + 1` is not
changed.

A bounded string's length is established by static initialization, copied as
part of exact-type aggregate assignment, or changed through an open
parameter's checked `.length` target. A byte assignment replaces exactly one
existing byte and does not change the string's length or capacity. Nucleus has
no intrinsic append, insertion, slice, or splice operation. Ordinary source
library routines perform text construction by querying an open view's
capacity, changing its length, and writing checked bytes. Embedded zero bytes
are ordinary content.

Bounded strings have no comparison operators. A library routine can compare two `string[]` parameters by checking their lengths and indexed bytes.

The `.length` intrinsic applies when the postfix base has concrete or open
bounded-string type. `.capacity` applies only to an open `string[]` parameter.
On a record base, either spelling remains ordinary lookup in that record's
field scope. Any other field suffix on a bounded string is invalid.

`string[]` is a parameter-only, capacity-polymorphic view. A call may bind it to a concrete `string[N]` storage path or transient alias, for any admitted `N`, or forward another `string[]` parameter. The view retains the actual capacity for `.capacity`, checked `.length` assignment, `.length` reads, and checked indexing. It does not own storage and is invalid as a variable, constant, record field, array element, local, or routine result. Whole-object assignment and comparison through an open view are invalid.

A string literal remains contextual rather than becoming a general aggregate expression. In the argument position selected by a `string[]` formal, each literal occurrence creates a distinct anonymous, program-lifetime bounded-string object and binds the ordinary open view to it. The object uses the decoded length as its capacity, with capacity one for an empty literal. It is not interned, copied on each call, or admitted for a concrete aggregate parameter, assignment, result, stored view, or local.

The `string[]` parameter remains writable. Mutation of an anonymous literal object may persist when the call site executes again. A RAM target can therefore expose the changed bytes, while a ROM target may ignore the physical write. Portable programs and libraries treat literal arguments as immutable and do not depend on either result. `string[]` is not a slice: it always views one complete bounded-string object, has no offset or independently chosen length, and cannot be rebound.

This chapter fixes the semantic domain and capacity, not the stored layout. Chapter 7 defines storage identity and lifetime, Chapter 8 defines declaration initialization, and the Z80 runtime and backend contract defines the physical representation and byte encoding. That representation preserves embedded zero bytes, logical lengths through 253, and alias-visible byte mutation.

<div id="69-aggregate-aliases-and-address-separation" class="nucleus-source-anchor"></div>

## 6.9 Aggregate aliases and address separation

An aggregate alias has the same source type as its referent and a separate alias category. For example, an alias to a `Person` record permits `Person` field selection, and an alias to `u8[64]` permits indexing with the fixed bound 64. The alias does not create a reference type that can be named independently.

The compiler must retain the referent type through aggregate parameters, field and element selection, scalar and aggregate assignments, calls, and aggregate results. Passing or returning a concrete alias requires exact referent-type identity. Binding `string[]` retains the argument's concrete capacity separately from its address. Binding `T[]` retains the concrete array's element count. Forwarding either view preserves the address and retained bound.

The carrier used for an alias has no source spelling or runtime type tag. Source
code cannot read, write, compare, convert, store, return as a scalar, or perform
arithmetic on that carrier itself.

An alias carrier and `u16` remain different typed entities even though both occupy one word. No conversion exists in either direction. Address derivation for field and element access is a checked compiler or backend operation, not `u16` arithmetic visible to the program.

<div id="610-type-identity-and-compatibility" class="nucleus-source-anchor"></div>

## 6.10 Type identity and compatibility

Type identity is determined as follows:

| Type form       | Identity rule                                                      |
| --------------- | ------------------------------------------------------------------ |
| `u8`            | The predefined `u8` type.                                          |
| `u16`           | The predefined `u16` type.                                         |
| `i8`            | The predefined `i8` type.                                          |
| `i16`           | The predefined `i16` type.                                         |
| `boolean`       | The predefined Boolean type.                                       |
| Record          | The single declaration that introduced the record.                 |
| Fixed array     | Identical element type and identical fixed length.                 |
| `T[]`           | Parameter-only view over one complete concrete `T[N]` array.       |
| `string[N]`     | Identical capacity `N`.                                            |
| `string[]`      | Parameter-only view over one complete concrete bounded string.     |
| Aggregate alias | The exact referent type; aliasing adds a category, not a new type. |

The compiler applies these compatibility rules:

| Context                                                | Required compatibility                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Scalar assignment, initialization, argument, or result | Exact scalar type, a fitting exact integer value, or one of the value-preserving implicit integer conversions.  |
| Explicit integer conversion                            | `u8(...)`, `u16(...)`, `i8(...)`, or `i16(...)` and a successful range check.                                   |
| Boolean condition or destination                       | `boolean` only.                                                                                                 |
| Record field selection                                 | The field's declared type.                                                                                      |
| Fixed-array index                                      | Any nonnegative integer index in range; result has the exact element type.                                      |
| Array `.length`                                        | Read-only `u16`; fixed `N` or the open view's retained actual count.                                            |
| Bounded-string `.length`                               | Read-only `u8` value equal to the current logical length.                                                       |
| Bounded-string index                                   | Any nonnegative integer index below the current length; result is a writable `u8` path.                         |
| Concrete aggregate parameter                           | Exact referent-type identity.                                                                                   |
| `T[]` parameter                                        | Complete concrete `T[N]` path or transient alias, or another `T[]`; exact element type and retained count.      |
| `string[]` parameter                                   | Any concrete bounded-string storage path or transient alias, or another `string[]`; retain the actual capacity. |
| Aggregate assignment                                   | Exact concrete type identity; copy the complete aggregate into the destination.                                 |
| Aggregate result                                       | Exact referent-type identity and immediate consumption under Chapter 7.                                         |
| Aggregate by-value argument or result                  | Invalid; calls transfer aggregate aliases.                                                                      |

Compatibility is checked at the source operation. The backend does not infer compatibility from equal byte widths, equal layouts, compiler storage ordinals, registers, or runtime addresses.

<div id="611-excluded-type-mechanisms" class="nucleus-source-anchor"></div>

## 6.11 Excluded type mechanisms

Nucleus 0.1 has none of the following:

- raw pointer or address types visible to source;
- pointer or address arithmetic;
- implicit word/address interchange;
- enumeration or subrange types;
- set types;
- variant records, unions, or overlaid aggregate layouts;
- structural equivalence between distinct record declarations;
- arbitrary casts, type punning, or unchecked narrowing;
- generic types or generic parameters other than the built-in `string[]` and `T[]` forms;
- open-array storage or results, slices, caller-selected ranges, or user-defined variable-capacity views;
- heap-allocated or resizable types;
- variable-sized local allocation; or
- unrestricted dynamic data.

An implementation must diagnose a source form that requires one of these mechanisms. Equal storage width or a convenient machine representation does not admit the source operation.

<div id="612-type-metadata-and-capacity" class="nucleus-source-anchor"></div>

## 6.12 Type metadata and capacity

Exact type identity is checked from retained metadata without reconstructing
source text. Record declarations require nominal identities; arrays and bounded
strings require their complete structural identity, including nested element
types and every bound.

An implementation may represent this information directly or intern it behind
private identifiers. Every resulting capacity is implementation-defined and
must be diagnosed before exhaustion, truncation, wrapping, or aliasing can
change a compatibility result.

The numeric type ID has no source meaning and need not match across compilations. Z80 registers and compiler-managed storage locations are untagged; the compiler's symbol and expression metadata supply their current source types. Runtime type tags, reflection, and dynamic type tests are absent.

<div id="613-examples" class="nucleus-source-anchor"></div>

## 6.13 Examples

These declarations illustrate scalar compatibility:

```nucleus
var byteValue as u8 = 42
var wordValue as u16 = byteValue
var code as u8 = 'A'
var flag as boolean = true
```

Each of the following is invalid under this chapter:

```nucleus
var tooSmall as u8 = 256       // literal does not fit
var narrowed as u8 = wordValue // explicit checked narrowing required
var truth as boolean = 1       // integer is not Boolean
var count as u16 = false       // Boolean is not integer
```

Record identity is nominal:

```nucleus
record LeftPoint
    x as u16
    y as u16
end

record RightPoint
    x as u16
    y as u16
end
```

`LeftPoint` and `RightPoint` are different types despite their equal field lists. An alias or parameter of one type cannot bind storage of the other.

Array and bounded-string bounds are part of their types:

```nucleus
var bytes as u8[16]
var grid as u8[3][2]
var name as string[12]
```

`bytes[0]` through `bytes[15]` are within the declared domain. `bytes[16]` is a compile-time error. A runtime value used as the index is checked before access. `string[12]` and `string[16]` are different types, and a thirteen-byte literal cannot initialize `name`.

`grid[0]` has exact aggregate type `u8[2]`, `grid.length` is three, and
`grid[0].length` is two. `grid[2][1]` is the last scalar element. The spelling
`u8[2][3]` denotes a different layout and type.

For a bounded string `name`, `name.length` reads its logical length and `name[index]` reads or replaces one existing byte. An index equal to the current length traps; assignment through the index does not append or change `name.length`.
