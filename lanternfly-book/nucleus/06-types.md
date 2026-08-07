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

Nucleus 0.1 has three scalar types and three aggregate forms:

| Category  | Types or forms                       |
| --------- | ------------------------------------ |
| Scalar    | `u8`, `u16`, `boolean`               |
| Aggregate | nominal records, `T[N]`, `string[N]` |

The following skeleton records type formation without defining declaration grammar:

```text
type             ::= scalar-type
                   | record-type-name
                   | fixed-array-type
                   | bounded-string-type
scalar-type      ::= "u8" | "u16" | "boolean"
fixed-array-type ::= element-type "[" array-length "]"
element-type     ::= scalar-type | record-type-name | bounded-string-type
bounded-string-type
                 ::= "string" "[" string-capacity "]"
```

An array has one dimension. An array element may be a scalar, record, or bounded string, but not another array. Records may contain fields of any admitted type, including fixed arrays.

`string[N]` is the bounded-text form. `string` is a core reserved word. No other type word is added by this chapter.

<div id="63-scalar-types" class="nucleus-source-anchor"></div>

## 6.3 Scalar types

`u8` is the unsigned integer type whose values range from 0 through 255. `u16` is the unsigned integer type whose values range from 0 through 65,535. Their widths and ranges do not vary by target.

`boolean` has exactly the values `false` and `true`. It is distinct from both integer types. An integer is not a condition, a Boolean value is not an integer, and Nucleus 0.1 provides no Boolean-to-integer or integer-to-Boolean conversion.

A scalar variable, parameter, field, array element, or routine result holds a scalar value. Scalar assignment and scalar argument passing copy the value. A backend may use any VM slot or machine representation that preserves the type and value; that representation does not alter source compatibility.

<div id="64-literals-and-scalar-conversion" class="nucleus-source-anchor"></div>

## 6.4 Literals and scalar conversion

An integer literal is exact and has no fixed integer type until an expected integer type or an expression rule supplies one. In a declaration initializer, scalar argument, assignment, return, array index, or other expected-type position, a literal may take type `u8` or `u16` when its value lies in that type's range. A literal outside the expected range is invalid; it is not truncated or wrapped.

Chapter 9 defines the treatment of an integer literal with no expected type and the result types of operators. This chapter does not assign an expression-wide default type.

A character literal has type `u8` and its value is the decoded byte from Chapter 3. Nucleus has no separate character type. The ordinary `u8`-to-`u16` widening rule permits a character literal where a `u16` value is expected.

The only implicit conversion between declared scalar types is `u8` to `u16`. It preserves every source value and zero-extends in representations where extension is required. The same conversion applies to assignment, initialization, scalar arguments, scalar results, and operands when Chapter 9 admits a mixed-width operation.

Conversion from `u16` to `u8` requires an explicit checked narrowing operation. Chapter 9 defines its expression spelling. When the source value is known and exceeds 255, the compiler must issue a diagnostic. When the value is not known until execution, the generated program must trap before producing or storing a `u8` result if the value exceeds 255. Checked narrowing never means low-byte extraction, modulo reduction, or reinterpretation.

No implicit or explicit scalar conversion changes `boolean` into an integer or an integer into `boolean`. Nucleus 0.1 also has no arbitrary cast or same-width reinterpretation operation.

<div id="65-values-aggregate-storage-and-aliases" class="nucleus-source-anchor"></div>

## 6.5 Values, aggregate storage, and aliases

The source type and the way a source occurrence denotes data are separate properties:

| Category                | Meaning                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Scalar value            | A `u8`, `u16`, or `boolean` value that can be copied by assignment, argument passing, or return.   |
| Owned aggregate storage | Storage containing one record, fixed array, or bounded string for a lifetime defined in Chapter 7. |
| Aggregate alias         | A typed, non-owning binding to existing aggregate storage.                                         |

A named constant has type `u8`, `u16`, or `boolean`; records, fixed arrays, bounded strings, and aggregate aliases cannot be declared as constants.

Top-level variables may provide owned aggregate storage. Aggregate storage may also occur inline as a record field or fixed-array element. The permitted declaration sites, initialization rules, mutability, and storage duration appear in Chapters 7 and 8.

A local declaration of record, fixed-array, or bounded-string type creates an aggregate alias rather than owned local aggregate storage. An aggregate parameter is also an alias to caller-provided storage. These aliases have fixed referent types and cannot be rebound through assignment.

Nucleus has no ordinary aggregate value copy. Assignment does not copy a complete record, fixed array, or bounded string, and a routine does not return one by value. Programs update scalar fields, scalar fixed-array elements, or existing bounded-string bytes through the postfix operations defined below. A later bulk operation must be explicit and does not change the type rules in this chapter.

An aggregate routine result is a typed alias to existing storage. The returned referent must remain alive after the call. Chapter 7 defines the lifetime and escape check; Chapter 13 defines result syntax. A result that would refer to storage ending with the call is invalid.

<div id="66-record-types" class="nucleus-source-anchor"></div>

## 6.6 Record types

A record declaration creates one nominal type. Two record declarations create different types even when their fields have identical names and types. Record storage and aliases are compatible only with the type created by the same declaration.

Every record has one fixed field sequence and one fixed layout. Each field has a name and one previously declared type. A field may have scalar, record, fixed-array, or bounded-string type. The complete field sequence is known when the record declaration ends.

A record must have finite size. A field therefore must not contain its own record type directly or through a cycle of record and array containment. Variant records, unions, and overlaid layouts are absent.

Selecting a scalar field produces a scalar occurrence of the field's declared type. Selecting an aggregate field produces a storage path or aggregate alias with the field's exact aggregate type. Selection does not expose a byte offset or address to source code.

Chapter 8 defines record declaration and field syntax. Runtime byte offsets, alignment, and layout descriptors belong to the VM specification or backend.

<div id="67-fixed-array-types" class="nucleus-source-anchor"></div>

## 6.7 Fixed-array types

`T[N]` is a one-dimensional fixed array with element type `T` and length `N`. `N` must be a positive compile-time integer from 1 through 65,535. A compiler may publish a smaller capacity for a particular storage region or implementation, but exceeding that capacity is a capacity failure rather than another array type.

The index domain is always zero through `N - 1`. Nucleus has no arbitrary lower bound, subrange index, enumeration index, or range type. The length and element type are part of the array type.

Two fixed-array types are identical when their element types are identical and their lengths are equal. Thus `u8[16]` and `u8[16]` are the same type, while `u8[16]`, `u8[32]`, and `u16[16]` are three different types.

An array index must have type `u8` or `u16`; `u8` widens to `u16` when the checking operation requires it. A constant index outside the array domain is invalid. A dynamic index must be checked before the access unless the compiler proves from information already available at that point that it lies in the domain. A failed dynamic check performs the bounds trap specified by Chapter 15 before any element load or store.

Indexing an array of scalars produces a scalar occurrence with the element type. Indexing an array of records or bounded strings produces a storage path or aggregate alias with the element type. The index operation never produces an untyped address.

<div id="68-bounded-strings" class="nucleus-source-anchor"></div>

## 6.8 Bounded strings

`string[N]` is a fixed-capacity counted sequence of bytes with a current length from 0 through `N`. `N` is a compile-time integer from 1 through 255 and is part of the type. The empty string is a valid value. Payload bytes may have any value from 0 through 255, including zero.

A string literal is a contextual bounded-string initializer. It is compatible with `string[N]` when its decoded byte length does not exceed `N`. A literal that is too long is invalid. The literal does not create an open-ended string type, infer a new capacity, or permit a later capacity mismatch.

Two bounded-string types are identical only when their capacities are equal. An alias to `string[16]` is not compatible with `string[32]`, even when the current contents would fit both. This exact rule keeps the referent extent available from the static type and permits a one-address alias representation.

A bounded string is an aggregate, not a `u8` array. It has no source-level header field, payload field, or terminator field. Nucleus 0.1 provides two intrinsic postfix operations without exposing that representation:

- `text.length` is a read-only `u8` value equal to the current logical byte length.
- `text[index]` selects one existing byte as a `u8` storage path. The index must have type `u8` or `u16` and must be less than the current length. A failed check performs the `bounds` trap before a read or write.

A byte assignment replaces exactly one existing byte and does not change the string's length or capacity. These operations provide no append, insertion, resize, truncation, bulk copy, whole-string assignment, or whole-string comparison. Embedded zero bytes are ordinary content and do not terminate either operation.

The `.length` intrinsic applies only when the postfix base has bounded-string type. On a record base, `.length` remains ordinary lookup in that record's field scope. Any other field suffix on a bounded string is invalid.

Nucleus 0.1 has no `string[]`, open string, slice, general view, or address-and-length source value. A routine that accepts a bounded string names an exact capacity in its parameter type. A broader read-only view may be considered in a later language version after its compiler, carrier, lifetime, and result-ABI costs have been measured.

This chapter fixes the semantic domain and capacity, not the stored layout. Chapter 7 defines storage identity and lifetime, Chapter 8 defines declaration initialization, and the VM specification or backend defines the physical representation and byte encoding. Any representation must preserve embedded zero bytes, lengths through 255, and alias-visible byte mutation.

<div id="69-aggregate-aliases-and-address-separation" class="nucleus-source-anchor"></div>

## 6.9 Aggregate aliases and address separation

An aggregate alias has the same source type as its referent and a separate alias category. For example, an alias to a `Person` record permits `Person` field selection, and an alias to `u8[64]` permits indexing with the fixed bound 64. The alias does not create a reference type that can be named independently.

The compiler must retain the referent type through local aliases, aggregate parameters, field and element selection, assignments admitted for scalar leaves, calls, and aggregate results. An alias passed or returned where another aggregate type is required is invalid unless the two referent types are identical.

A backend may represent an alias at runtime with one untagged address-sized value because compiler metadata records the record layout, array length, or string capacity. The runtime carrier has no source spelling and no runtime type tag. Source code cannot read, write, compare, convert, store, return as a scalar, or perform arithmetic on the carrier itself.

An alias carrier and `u16` remain different typed entities even if both occupy one word in a VM slot. No conversion exists in either direction. Address derivation for field and element access is a checked compiler or backend operation, not `u16` arithmetic visible to the program.

<div id="610-type-identity-and-compatibility" class="nucleus-source-anchor"></div>

## 6.10 Type identity and compatibility

Type identity is determined as follows:

| Type form       | Identity rule                                                      |
| --------------- | ------------------------------------------------------------------ |
| `u8`            | The predefined `u8` type.                                          |
| `u16`           | The predefined `u16` type.                                         |
| `boolean`       | The predefined Boolean type.                                       |
| Record          | The single declaration that introduced the record.                 |
| Fixed array     | Identical element type and identical fixed length.                 |
| `string[N]`     | Identical capacity `N`.                                            |
| Aggregate alias | The exact referent type; aliasing adds a category, not a new type. |

The compiler applies these compatibility rules:

| Context                                                | Required compatibility                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Scalar assignment, initialization, argument, or result | Exact scalar type, contextual fitting literal, or implicit `u8`-to-`u16` widening.  |
| Checked narrowing to `u8`                              | Explicit operation and successful range check.                                      |
| Boolean condition or destination                       | `boolean` only.                                                                     |
| Record field selection                                 | The field's declared type.                                                          |
| Fixed-array index                                      | `u8` or `u16` index; result has the exact element type.                             |
| Bounded-string `.length`                               | Read-only `u8` value equal to the current logical length.                           |
| Bounded-string index                                   | `u8` or `u16` index below the current length; result is a writable `u8` path.       |
| Aggregate parameter or local alias                     | Exact referent-type identity.                                                       |
| Aggregate result                                       | Exact referent-type identity and a referent that passes Chapter 7's lifetime check. |
| Ordinary aggregate assignment or by-value result       | Invalid; Nucleus 0.1 provides neither operation.                                    |

Compatibility is checked at the source operation. The backend does not infer compatibility from equal byte widths, equal layouts, VM slot numbers, or runtime addresses.

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
- generic types or generic aggregate parameters;
- open arrays, slices, or variable-capacity views;
- heap-allocated or resizable types;
- variable-sized local allocation; or
- unrestricted dynamic data.

An implementation must diagnose a source form that requires one of these mechanisms. Equal storage width or a convenient VM representation does not admit the source operation.

<div id="612-type-metadata-and-capacity" class="nucleus-source-anchor"></div>

## 6.12 Type metadata and capacity

The first compiler's current implementation target represents source types with compact ordinals. Reserved ordinals identify the predefined scalar types; record declarations receive nominal IDs; and fixed-array and bounded-string descriptors are interned by their identity rules. Symbols and routine signatures record these IDs, while the streaming expression checker carries a value or alias category with its type ID.

A byte-sized type ID is the initial implementation target. The implementation must document its maximum number of simultaneously retained type descriptors and diagnose exhaustion before an ID wraps, aliases another type, or changes a compatibility result. The same rule applies to bounded record-field, array-descriptor, and signature tables.

The numeric type ID has no source meaning and need not match across compilations. VM registers and slots are untagged storage locations; the compiler's symbol and expression metadata supply their current source types. Runtime type tags, reflection, and dynamic type tests are absent.

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
var name as string[12]
```

`bytes[0]` through `bytes[15]` are within the declared domain. `bytes[16]` is a compile-time error. A runtime value used as the index is checked before access. `string[12]` and `string[16]` are different types, and a thirteen-byte literal cannot initialize `name`.

For a bounded string `name`, `name.length` reads its logical length and `name[index]` reads or replaces one existing byte. An index equal to the current length traps; assignment through the index does not append or change `name.length`.
