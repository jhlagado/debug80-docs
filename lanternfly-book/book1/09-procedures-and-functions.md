---
layout: default
title: "Procedures and Functions"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 9
---

# Procedures and Functions

> [!IMPORTANT]
> This chapter uses the pre-0.3 draft syntax. See the
> [book revision notice](index.md).

The earlier chapters used procedures with empty parentheses. Parameters let
one procedure work with values supplied by its caller:

```text
SUB AddScore(Amount AS INTEGER)
    Score = Score + Amount
END SUB

AddScore(10)
```

`Amount` is a scalar input. Each call gives it a value for that invocation.

## Procedures perform actions

```text
SUB AddScore(Amount AS INTEGER)
    Score = Score + Amount
END SUB
```

A procedure begins with `SUB` and ends with `END SUB`. Its parameter list names
the inputs and their types. The call uses the same order:

```text
AddScore(Bonus)
```

Arguments are evaluated from left to right before the call begins. The backend
chooses registers, stack slots or another calling convention. Those choices do
not change the source signature.

## Functions return one value

A function adds a result type after its parameter list:

```text
FUNCTION Limited(Value AS INTEGER, Limit AS INTEGER) AS INTEGER
    IF Value > Limit THEN
        RETURN Limit
    END IF

    RETURN Value
END FUNCTION
```

The caller can use the result in an expression:

```text
Score = Limited(Score + Bonus, 1000)
```

Every reachable function path returns a value compatible with the declared
result type. `RETURN` also provides an early exit when the answer is already
known.

## Scalar locals belong to one call

Declarations at the start of a routine create local scalar storage:

```text
FUNCTION DistanceSquared(X AS INTEGER, Y AS INTEGER) AS LONG
    DIM XSquared AS LONG
    DIM YSquared AS LONG

    XSquared = LONG(X) * LONG(X)
    YSquared = LONG(Y) * LONG(Y)
    RETURN XSquared + YSquared
END FUNCTION
```

`XSquared` and `YSquared` hold intermediate results. Their names are visible
inside the function. A recursive or reentrant target profile provides separate
local values for each active call. A simpler profile may allocate them
statically when it also rejects overlapping calls.

## Aggregate parameters are references

Passing an array or record by value would hide a potentially large copy.
Aggregate parameters state reference access:

```text
SUB ClearRow(Row AS REF TO BYTE[8])
    DIM Index AS INTEGER

    FOR Index = 0 TO COUNT(Row) - 1
        Row[Index] = 0
    NEXT Index
END SUB
```

The call passes existing storage:

```text
ClearRow(BoardRows[SelectedRow])
```

`Row` keeps its array shape, so `COUNT(Row)` and indexing remain available.
The routine allocates one scalar loop counter while the row remains in the
caller's array.

The exact spelling for read-only, output and in/out reference intent remains a
design question. The semantic interface must still record which storage a
routine may read or write.

## Leaving a procedure

A procedure can finish by reaching `END SUB` or leave early with:

```text
EXIT SUB
```

A function uses `RETURN expression` because every exit supplies its result.
These source exits all pass through the routine epilogue selected by the
backend.

## Example

The [chapter listing](/lanternfly-book/book1/code/09-routines.txt) contains a
procedure, a scalar function and an aggregate reference parameter.

## Summary

- A procedure performs an action and a function returns one value.
- Parameters declare names and types in the routine header.
- Scalar locals hold per-call intermediate values.
- Aggregate parameters provide typed reference access to existing storage.
- Calling conventions belong to the backend rather than the source language.
