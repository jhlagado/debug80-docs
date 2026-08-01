---
layout: default
title: "Failable Routines and Error Handling"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 14
---

# Failable Routines and Error Handling

> [!NOTE]
> This chapter documents the provisional 0.6 revision — specification
> sections 11.8 and 11.9 and their conformance and lowering additions.
> The rest of this manual documents the 0.5 edition. The sections are
> marked Provisional in the specification until their evidence programs
> and fixtures exist, and the
> [specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
> is normative where this chapter and the specification differ.
> [Book One, Chapter 13](../book1/13-expecting-failure.md) teaches the
> same material as a course.

Lanternfly separates two kinds of failure. A violated contract — an
out-of-range index, a zero divisor, a checked destination rejecting its
value — is a runtime fault: non-returning, uninterceptable by program
code, with target-defined consequences. An expected failure — input that
does not parse, a device operation that does not complete — is a value: a
member of an ordinary enum, produced and consumed by the forms of this
chapter. No form in this chapter intercepts a fault.

The vocabulary splits by part of speech. `fail` is the verb, and names
the routine's own act in every position it appears: `fails` in a
signature, `fail` to raise, `or fail` to propagate. `error` is the noun,
and appears exactly where a failure arrives as a value: `on error`.

## Error sets

An error set is an enum whose representation type is `u8`:

```lanternfly
enum TapeError as u8
    notFound
    badChecksum
    writeProtected
end
```

Any other `fails` operand is `E-FAIL-003`. The enum is otherwise
ordinary: its members obey the ordinary scope and export rules, and an
error value may be stored, passed, compared and selected over like any
enum value.

## Failable declarations

A routine declares that it can fail by naming an error set after its
result type, or in place of one:

```lanternfly
sub readBlock(buffer as u8[128]) as u16 fails TapeError

sub verifyBlock(index as u8) fails TapeError
```

Each invocation of a failable routine completes in exactly one of two
ways: success, carrying the declared result if there is one, or failure,
carrying one member of the error set.

Placement rules:

- A forward declaration repeats the `fails` clause exactly; a completing
  header that differs is `E-FORWARD-002`.
- The program entry routine may not carry a `fails` clause, because no
  caller exists to receive the failure (`E-ENTRY-001`).
- A `fails` clause on an external routine, and any form of this chapter
  inside a hosted body, are deferred; both are `E-FAIL-005`.
- An exported failable routine's compiled export interface records its
  error-set type with the rest of the signature.

## Raising failure

`fail` returns failure:

```lanternfly
if checksum <> stored then
    fail badChecksum
end
```

Its operand must be a member of the enclosing routine's declared error
set, and `fail` outside a failable routine is `E-FAIL-002`. Ordinary
`return` returns success. In a result-bearing failable routine, every
reachable path must return a compatible value or `fail`.

## Consuming failure

A failable invocation may appear only as:

- the complete expression of an expression statement;
- the complete right side of an assignment;
- the complete initializer of a local `var`;
- the complete operand of `return`.

It may not nest inside a larger expression or argument list, and its
failure must be consumed by exactly one of the three forms below. An
unconsumed or nested failable invocation is `E-FAIL-001`. In `return`
position the only admitted form is `or fail`; the meaning of a default
or handler there is available by assigning to a local first.

### Propagation: `or fail`

```lanternfly
sub loadProgram() as u16 fails TapeError
    var header as u16 = readBlock(headerBuffer) or fail
    readBlock(bodyBuffer) or fail
    return header
end
```

`or fail` returns the callee's failure, unchanged, from the enclosing
routine. The enclosing routine must itself be failable, and the first
edition requires its declared error set to be the same enum type as the
callee's; either violation is `E-FAIL-002`. Propagation runs deferred
statements like any other exit.

### Defaults: `or` with an expression

```lanternfly
var speed as u8 = parseDigit(key) or 1
```

The default expression must be assignment-compatible with the call's
result type, is evaluated only on failure, and may not itself contain a
failable invocation. A default on a result-free call is `E-FAIL-003`.
When the left operand of `or` is a complete failable invocation, the
`or` is this failure default; otherwise it is the Boolean operator,
resolved by operand type exactly as assignment and equality are resolved
by the grammar.

### Handling: `on error`

An `on error` block follows the failable statement it handles:

```lanternfly
position = loadProgram()
on error code
    select code
    case notFound, badChecksum
        reportTapeError(code)
        return
    case writeProtected
        reportProtected()
        return
    end
end
```

The binding rules:

- `on error` binds to the immediately preceding statement, which must be
  an assignment, expression statement or local `var` declaration
  containing a failable invocation that carries no `or` form; any other
  binding is `E-FAIL-004`.
- The name introduces a read-only value of the callee's error-set type,
  scoped to the block under the ordinary collision rules.
- On success the block is skipped. On failure the assignment or
  initialization does not occur — the destination is not written — and
  the block runs.
- The block contains ordinary statements. A `fail` inside it follows the
  ordinary rules; `continue` and `exit` require an enclosing loop as
  usual, which the assignment and expression-statement forms may have.
- When the bound statement is a local `var` declaration, the block must
  not complete normally: every path through it must end at `return` or
  `fail`, so the local is never readable uninitialized. A block that can
  complete normally in that position is `E-FAIL-004`. Local declarations
  precede every statement, so a declaration-bound block has no enclosing
  loop; `exit` or `continue` there is the ordinary loop error
  `E-CONTROL-004`.

Because the caught code is an enum value, a `select` over it is checked
for exhaustiveness under the ordinary enum-selection rules.

`error` is a contextual word, like `type`: it is recognized only
immediately after `on`, and remains an ordinary identifier everywhere
else. `var error as u8` is a legal declaration in the same routine as an
`on error` clause.

## `defer`

`defer` registers one cleanup statement to run when the routine exits:

```lanternfly
sub copyFromTape(bank as u8) fails TapeError
    mapBank(bank)
    defer unmapBank()

    readBlock(buffer) or fail
    storeBlock(bank)
end
```

The rules:

- The deferred statement is an assignment or a result-free invocation.
  It must be infallible: a failable invocation, `fail`, `return`, `exit`
  or `continue` inside it — or an `or` form or `on error` clause on it —
  is `E-DEFER-001`.
- A `defer` may appear only at the top level of a source routine body:
  not inside a control structure, and not in a hosted body
  (`E-DEFER-001`).
- Every exit from the routine — a `return`, a `fail`, a propagation
  inserted by `or fail`, or reaching `end` — first executes each
  deferred statement that lexically precedes the exit point, most recent
  first.
- A propagating exit preserves the failure code across the deferred
  statements; that preservation is a backend obligation under the
  lowering contract.

## Lowering and cost

The language requires an abstract failure channel: a one-bit completion
discriminant plus the `u8` error code, absent entirely from routines
without a `fails` clause. No runtime helper, table or unwinder exists,
and a program that declares no failable routine contains no
failure-channel code. Register assignment is target ABI. The provisional
Z80 candidate uses the carry flag as the discriminant with the code in
A — `SCF` sets it in one instruction, the conditional return and jump
forms test it directly, and the flag-borne tag leaves A free — giving
these costs on the static-frame profile:

| Construct | Candidate Z80 lowering | Cost |
| --------- | ---------------------- | ---- |
| `fail member` | `LD A, n` / `SCF` / `RET` | 4 bytes |
| success return | carry cleared in epilogue | 0–1 bytes |
| `or fail` | `RET C` | 1 byte |
| `or fail` in tail position | folds into the final `RET` | 0 bytes |
| `or` default | branch over a load | ~4 bytes |
| `on error` | conditional branch to the block | 2 bytes |

A framed, recursion-capable profile propagates through a conditional
jump to the epilogue instead, and routines that defer cleanup route
exits through a shared cleanup tail. The full obligations are in the
[lowering contract](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/lowering-and-runtime.md).

## Words and grammar

The 0.6 revision reserves `defer`, `fail`, `fails` and `on`, and adds
`error` as a contextual word. The grammar additions:

```text
sub-decl            ::= "sub" value-name "(" params? ")"
                        ("as" type-expr)? fails-clause? newline
                        routine-block
                        "end" newline
fails-clause        ::= "fails" type-name

fail-statement      ::= "fail" value-name newline

defer-statement     ::= "defer" deferred-statement
deferred-statement  ::= assignment-statement
                      | expression-statement

on-error-clause     ::= "on" "error" value-name newline
                        block
                        "end" newline
```

The assignment, expression-statement and local-declaration productions
accept an optional `("or" "fail")` tail and an optional trailing
`on-error-clause`; the return production accepts the `or fail` tail
only. The failure-default `or` is not a distinct production: it is the
ordinary `or` of the expression grammar, reinterpreted semantically when
its left operand is a complete failable invocation.

## Diagnostics

| ID | Required rejection |
| -- | ------------------ |
| `E-FAIL-001` | Failable invocation unconsumed, or nested inside a larger expression |
| `E-FAIL-002` | `fail` or `or fail` in a routine without a `fails` clause, or propagation between different error-set types |
| `E-FAIL-003` | `fails` operand not a `u8` enum; `fail` operand outside the declared set; invalid failure default |
| `E-FAIL-004` | Invalid `on error` binding, colliding binding name, or a declaration-bound block that can complete normally |
| `E-FAIL-005` | `fails` on an external routine; failure forms in a hosted body (a failable entry is `E-ENTRY-001`) |
| `E-DEFER-001` | `defer` outside routine top level or in a hosted body; deferred statement not infallible |

The faults of Chapter 13 are unchanged: a fault raised inside a failable
routine remains non-returning and is never observed as a failure value.

## Deferred forms

The first edition excludes, pending evidence recorded in the
specification's design queue: error-set inclusion, so `or fail` could
propagate into a caller's larger set; `fails` contracts on external
routines; `on error` forms beyond the single-statement binding; and
`defer` inside nested control structure.
