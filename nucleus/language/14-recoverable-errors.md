---
layout: "default"
title: "14. Recoverable errors"
parent: "Nucleus 0.1 Language Specification"
nav_order: 14
pageClass: "nucleus-specification"
---
[← 13. Routines and calls](13-routines-and-calls.md) · [Contents](./) · [15. Safety failures and traps →](15-safety-failures-and-traps.md)

<div id="14-recoverable-errors" class="nucleus-source-anchor"></div>

# 14. Recoverable errors

<div id="141-two-failure-classes" class="nucleus-source-anchor"></div>

## 14.1 Two failure classes

A **recoverable error** is an expected unsuccessful result that source code may propagate or handle. A **trap** is a non-recoverable safety failure defined by Chapter 15. Error handling does not intercept, convert, or resume after a trap.

Nucleus represents a recoverable error with a `u8` code carried beside a routine's ordinary success result. The code has no separate error-set type. Programs give codes stable names with top-level `u8` constants; Chapter 16 also defines the standard service codes. The value zero is permitted, although the standard codes are nonzero.

<div id="142-failable-signatures" class="nucleus-source-anchor"></div>

## 14.2 Failable signatures

A routine that can return a recoverable error writes `fails` at the end of its header:

```text
routine-header ::= "sub" NAME "(" [ formal-parameter
                   { "," formal-parameter } ] ")"
                   [ "as" type ] [ "fails" ]
```

`fails` is part of the routine signature. A forward declaration records it once; the later abbreviated body header cannot repeat it. An ordinary routine without a forward includes it in its complete header. The clause does not change the declared parameters or optional success-result type.

Absent a trap, a failable invocation completes in exactly one of two ways:

- **success**, with the ordinary scalar value, aggregate alias, or no result declared by the header; or
- **failure**, with one `u8` error code and no success result.

An infallible routine has only successful completion. It cannot use `fail` or propagate a callee's failure.

<div id="143-producing-failure" class="nucleus-source-anchor"></div>

## 14.3 Producing failure

The statement

```text
fail-statement ::= "fail" expression
```

ends the current failable routine with failure. The expression is evaluated once and must be compatible with `u8`; an exact literal must fit, and `u16` requires explicit checked narrowing. The activation ends after the code is obtained. No later statement in that routine executes.

`fail` in an infallible routine is invalid. A trap while evaluating the code remains a trap and does not become a recoverable error.

Named codes are ordinary constants:

```nucleus
const badDigit as u8 = 1
const tooLarge as u8 = 2

sub parseDigit(value as u8) as u8 fails
    if value < '0' or value > '9'
        fail badDigit
    end
    return value - '0'
end
```

<div id="144-required-consumption" class="nucleus-source-anchor"></div>

## 14.4 Required consumption

Every call of a failable routine must consume failure at that call site. Nucleus provides exactly two forms:

1. `or fail` propagates the code from the current failable routine.
2. A following `on error` clause handles the code locally.

A failable invocation cannot appear inside an argument, arithmetic operation, comparison, condition, index, general conversion, or other larger expression. It may be only:

- the complete initializer of a scalar local declaration, followed by `or fail`;
- the complete right side of an assignment;
- the complete routine-call statement; or
- the complete operand of `return`, followed by `or fail`. The caller and callee must either both have a result or both be result-free.

The assignment and call-statement forms use exactly one of `or fail` or a following `on error` clause. An unconsumed failable invocation, two consumers on one invocation, or a failable invocation in any other position is invalid. Program-variable and constant initializers cannot call routines under Chapter 8 and therefore cannot be failable.

<div id="145-propagation" class="nucleus-source-anchor"></div>

## 14.5 Propagation

The propagation suffix is:

```text
failure-propagation ::= "or" "fail"
```

On success, the surrounding declaration or assignment uses the callee's ordinary result, a call statement continues, and `return` returns successfully with the callee's result or with no result when both routines are result-free. On failure, `or fail` immediately returns the same `u8` code from the enclosing routine. The enclosing routine must declare `fails`.

```nucleus
sub loadByte() as u8 fails
    var value as u8 = readStorageByte() or fail
    return value
end
```

Propagation is explicit at every intermediate call. Nucleus has no implicit propagation, error-set inclusion, code remapping, handler stack, or unwinding.

<div id="146-local-handling" class="nucleus-source-anchor"></div>

## 14.6 Local handling

An `on error` clause follows the assignment or routine-call statement whose direct failable invocation it handles:

```text
on-error-clause ::= "on" "error" NAME NEWLINE
                    statement-sequence
                    "end" NEWLINE
```

The name must resolve to an existing writable `u8` scalar variable, parameter, or local. A scalar local serving as an active counted-loop counter is read-only and cannot be the error destination. The clause declares no binding and opens no scope. This rule preserves the declaration-prefix and scope rules from Chapters 5 and 8.

On success, the call supplies its ordinary result, the assignment occurs when present, and the handler body is skipped. On failure, no success-result store occurs, then the compiler stores the error code in the named `u8` destination and executes the handler body. This ordering also applies when the assignment destination and error destination are the same variable: the variable receives the error code. Normal completion of the body continues after its closing `end`. A `return`, `fail`, `exit`, or `continue` inside the body has its ordinary enclosing context.

```nucleus
sub copyOne()
    var code as u8
    var value as u8

    value = readStorageByte()
    on error code
        return
    end

    writeOutputByte(value)
    on error code
        return
    end
end
```

The handled call must be the complete right side of the assignment or the complete call statement. A clause cannot attach to a local declaration, `return`, compound statement, infallible call, propagated call, or earlier statement separated by another statement.

<div id="147-results-flow-and-entry-failure" class="nucleus-source-anchor"></div>

## 14.7 Results, flow, and entry failure

Ordinary `return` denotes successful completion. A result-free failable routine may use bare `return`, reach its closing `end`, or use `return resultFreeFailableInvocation() or fail`. In the last form, callee success returns successfully from the caller and callee failure propagates its code. A result-bearing failable routine must return a compatible success result or fail on every path under the fallthrough rules in Section 13.7, extended so `fail` does not fall through.

`or fail` can exit on failure and continue on success, so it does not by itself make following source unreachable. An `on error` clause can complete normally unless its body has a non-fallthrough statement on every path.

The fixed `main` routine may declare `fails`. A failure returned from `main` has no source caller and performs the unhandled-error trap in Chapter 15 with the returned code. A successful return from `main` terminates normally.

<div id="148-lowering-boundary" class="nucleus-source-anchor"></div>

## 14.8 Lowering boundary

The source semantics require a success/failure discriminant and a `u8` code for each failable result. The separate VM specification or native backend defines their carriers and calling sequence. A carry flag and byte register are possible backend choices, not source semantics.

Failure propagation is an ordinary conditional return. Local handling is an ordinary conditional branch. Nucleus has no exception object, stack walk, cleanup action, hidden handler registration, or resumable failure state. The all-caller-save-compatible call semantics in Chapter 13 apply to both outcomes.

<div id="149-invalid-forms-and-capacities" class="nucleus-source-anchor"></div>

## 14.9 Invalid forms and capacities

The compiler must diagnose:

- `fail` or `or fail` in an infallible routine;
- a failure code incompatible with `u8`;
- a failable invocation in a nested expression or unsupported context;
- a failable invocation with no consumer or more than one consumer;
- an `on error` clause attached to an ineligible statement;
- an error destination that is unavailable, non-writable, not `u8`, or an active counted-loop counter;
- a `fails` clause or other signature text repeated on an abbreviated forward body; and
- a result-bearing failable routine that can reach its end without success or failure.

An implementation may bound retained failable signatures, nested handlers, failure fixups, and active error destinations. It must publish each limit and issue a capacity diagnostic before exhaustion can discard a check, route a code to the wrong caller, or execute the wrong handler.
