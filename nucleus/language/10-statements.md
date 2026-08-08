---
layout: "default"
title: "10. Statements"
parent: "Nucleus 0.1 Language Specification"
nav_order: 10
pageClass: "nucleus-specification"
---
[← 9. Expressions](09-expressions.md) · [Contents](./) · [11. Conditional control →](11-conditional-control.md)

<div id="10-statements" class="nucleus-source-anchor"></div>

# 10. Statements

<div id="101-scope" class="nucleus-source-anchor"></div>

## 10.1 Scope

This chapter defines statement syntax, statement sequencing, name-led dispatch, assignment, routine-call statements, and execution order. Chapters 11 and 12 define the compound conditional and loop statements. Chapter 13 completes the rules for calls and `return`. Chapter 12 completes the rules for `exit` and `continue`.

Executable statements occur only in a routine body. Chapter 8 requires every local declaration to precede the first statement, so a statement sequence contains no declarations and opens no name scope.

<div id="102-statement-grammar" class="nucleus-source-anchor"></div>

## 10.2 Statement grammar

The reusable statement fragment is:

```text
statement-sequence      ::= { statement }
statement               ::= simple-statement NEWLINE [ on-error-clause ]
                          | if-statement
                          | while-statement
                          | for-statement
simple-statement        ::= assignment-statement
                          | routine-call-statement
                          | return-statement
                          | "exit"
                          | "continue"
                          | fail-statement
assignment-statement    ::= assignment-target "=" expression
assignment-target       ::= NAME { postfix-suffix }
routine-call-statement  ::= NAME argument-list
return-statement        ::= "return" [ expression ]
```

Chapters 11 through 14 define the referenced productions and semantic restrictions. Chapter 17 replaces this fragment with the complete grammar for failable invocations, propagation, and `on error` attachment.

A simple statement consumes one logical `NEWLINE`. A compound statement consumes the `NEWLINE` after its own closing `end`. Blank and comment-only physical lines produce no token under Chapter 3 and therefore do not create empty statements. A statement sequence may contain no statements; this permits an empty conditional clause or loop body without a placeholder operation.

Nucleus has no semicolon, colon separator, multiple statements on one logical line, one-line compound statement, or empty-statement token.

<div id="103-name-led-dispatch" class="nucleus-source-anchor"></div>

## 10.3 Name-led dispatch

When a statement begins with `NAME`, the compiler resolves that name before selecting the statement form:

| Resolved declaration                         | Required continuation                                                                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Source routine                               | Its argument list, forming a routine-call statement.                                           |
| Mutable scalar variable, parameter, or local | Zero or more field or index suffixes, followed by `=`.                                         |
| Aggregate object or alias                    | Zero or more field or index suffixes ending at a mutable scalar or aggregate, followed by `=`. |
| Constant, type, or another declaration class | No name-led statement form; the compiler diagnoses the class mismatch.                         |

This dispatch uses the declaration class already established by Chapters 5 and 8. It requires no token backtracking. A routine name followed by `=` is invalid, and a variable followed by an argument list is invalid; the compiler does not reinterpret either name as another declaration class.

Nucleus has no `call` keyword. An already declared routine name followed by its parenthesized argument list is the canonical invocation statement.

<div id="104-assignment" class="nucleus-source-anchor"></div>

## 10.4 Assignment

An assignment target is a mutable scalar or aggregate storage path rooted in a program variable, parameter, or local. The parser uses the Chapter 9 postfix-suffix path; the storage-path rule rejects every call suffix and any field or index suffix unsuitable for the preceding type. A bounded-string byte selected by `text[index]` is writable; `text.length` is not.

A scalar local used as the counter of an enclosing counted loop is read-only until that loop ends. An assignment rooted at that exact local is invalid in the loop body, including inside a nested statement. Chapter 12 defines the corresponding counter rule and nested-loop restriction.

The compiler evaluates an assignment in this order:

1. evaluate the target path from left to right, including every index expression and bounds check;
2. evaluate the right-hand expression;
3. apply the destination compatibility and checked-conversion rules; and
4. store the scalar result or copy the aggregate into the selected destination.

The target path is evaluated once. A call or mutation in an index expression therefore occurs before any operation in the right-hand expression. If target evaluation traps, the right-hand expression is not evaluated. If the right-hand expression or a checked conversion traps, the destination is not changed, although effects from the earlier target evaluation remain.

A scalar destination uses the scalar compatibility rules from Chapter 6. An aggregate destination requires a writable aggregate storage path. Its source must be an aggregate storage path or transient aggregate result with the exact same aggregate type. The compiler validates the complete source and destination extents before copying the fixed object representation. Assignment through an alias changes its referent and never rebinds the alias. Self-assignment has no effect.

In this statement position, `=` is the assignment operator. Inside an expression, it is equality under Chapter 9. Assignment is not an expression and produces no value. Chained assignment, compound assignment such as `+=`, increment and decrement statements, and assignment inside a condition or argument are absent.

Assignment to a record, fixed array, bounded string, or aggregate alias copies a complete value only when the source has the exact same type. A string-byte assignment still replaces one selected byte without changing the string's length or capacity. No assignment changes an alias binding.

<div id="105-routine-call-statements" class="nucleus-source-anchor"></div>

## 10.5 Routine-call statements

A routine-call statement invokes one visible source routine with the argument list defined by Chapters 9 and 13. A result-free routine is valid in this form. A scalar value or transient aggregate-alias result may also be discarded; discarding the result does not suppress argument evaluation, routine effects, checks, or traps.

Only the invocation itself forms the statement. A scalar arithmetic expression, comparison, storage read, conversion, field selection, or index operation cannot stand as a statement. An aggregate result cannot be selected and then discarded as an expression statement. These restrictions keep name-led dispatch distinct from general expression parsing.

<div id="106-return-fail-exit-and-continue" class="nucleus-source-anchor"></div>

## 10.6 `return`, `fail`, `exit`, and `continue`

`return` leaves the current routine successfully under Chapter 13. Its permitted expression form depends on the routine's declared result. `fail` leaves a failable routine unsuccessfully under Chapter 14. Neither form is loop control.

`exit` and `continue` apply only to the innermost enclosing loop under Chapter 12. They do not leave a routine or terminate the program. Either word outside a loop is invalid.

All four are complete simple statements. No label, condition, target name, or trailing expression may follow `exit` or `continue`.

<div id="107-execution-and-bounded-failure" class="nucleus-source-anchor"></div>

## 10.7 Execution and bounded failure

Statements in a sequence begin in source order. A compound statement completes before the following statement begins. A `return`, `fail`, taken `exit`, taken `continue`, or trap prevents normal execution of the remaining statements on that path.

A compiler may emit semantic operations as it checks each statement. It need not retain a statement tree. Forward branches may use bounded fixup state under Chapter 2, provided capacity exhaustion produces a diagnostic rather than an unresolved or incorrect branch.

The compiler must diagnose an invalid statement start, a wrong-class name, a missing assignment operator or argument list, a non-writable assignment target, an assignment to an active counted-loop counter, an incompatible right-hand expression, a forbidden general expression statement, and any context-invalid `return`, `fail`, `exit`, or `continue`.

An implementation may bound statement nesting, active control contexts, branch fixups, and retained emission state. It must publish each limit and issue a capacity diagnostic before overflow changes statement association, branch targets, or execution order.

<div id="108-examples" class="nucleus-source-anchor"></div>

## 10.8 Examples

These are valid simple statements when the names have compatible declarations:

```nucleus
count = count + 1
cells[index].value = nextValue()
cells[index] = template
updateDisplay()
measure(count)
return
exit
continue
```

`measure(count)` remains a routine-call statement even when `measure` has a result; the result is discarded. `exit` and `continue` require an enclosing loop, and bare `return` requires a result-free routine.

These forms are invalid:

```nucleus
count + 1                 // general expression statement
call updateDisplay()      // no call keyword
left = right = 0          // assignment is not an expression
cells = shorterCells      // invalid when the fixed-array types differ
cells[index]              // storage read is not a statement
```
