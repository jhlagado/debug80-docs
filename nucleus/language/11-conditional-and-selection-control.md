---
layout: "default"
title: "11. Conditional and selection control"
parent: "Nucleus 0.1 Language Specification"
nav_order: 11
pageClass: "nucleus-specification"
---
[← 10. Statements](10-statements.md) · [Contents](./) · [12. Loop control →](12-loop-control.md)

<div id="11-conditional-and-selection-control" class="nucleus-source-anchor"></div>

# 11. Conditional and selection control

<div id="111-scope" class="nucleus-source-anchor"></div>

## 11.1 Scope

This chapter defines the Nucleus `if` and `select` statements. Chapter 9 defines Boolean and integer expressions. Chapter 10 defines statement sequences. Chapter 17 supplies the complete grammar.

`if` selects by Boolean conditions. `select` compares one integer value with an ordered sequence of constant values. Nucleus has no conditional expression or pattern matching.

<div id="112-syntax" class="nucleus-source-anchor"></div>

## 11.2 Syntax

The conditional grammar is:

```text
if-statement    ::= "if" expression NEWLINE statement-sequence
                    { "elseif" expression NEWLINE statement-sequence }
                    [ "else" NEWLINE statement-sequence ]
                    "end" NEWLINE
```

`elseif` is one token. The complete chain has one closing `end`. Each clause body is a statement sequence and may be empty. A clause body opens no declaration scope; Chapter 5's routine scope remains in effect throughout the chain.

A logical `NEWLINE` terminates each condition header. Physical line endings inside parentheses or brackets remain suppressed under Chapter 3, so a parenthesized condition may span physical lines without changing this grammar.

<div id="113-conditions" class="nucleus-source-anchor"></div>

## 11.3 Conditions

Every `if` and `elseif` condition must have type `boolean`. Nucleus does not treat zero, a nonzero integer, an aggregate, an alias carrier, or a routine name as a condition. A call used in a condition must return `boolean`.

The compiler evaluates a condition only when control reaches its clause. It evaluates that expression once, with the order, short-circuiting, checks, and traps defined by Chapter 9. A trap in a condition prevents selection of any clause body.

<div id="114-clause-selection" class="nucleus-source-anchor"></div>

## 11.4 Clause selection

Execution tests the `if` condition first. If it is `true`, the corresponding body executes and control continues after the closing `end`. If it is `false`, execution tests each `elseif` condition in source order until one is `true`. After a true condition, its body executes and no later condition or body is evaluated.

When every written condition is `false`, the `else` body executes if present. With no `else`, the statement performs no body operation. After the selected body completes normally, execution continues with the statement following the closing `end`.

Effects from an evaluated false condition remain observable. Conditions after a selected true clause are not evaluated and perform no calls, storage accesses, checks, or traps.

<div id="115-flat-and-nested-forms" class="nucleus-source-anchor"></div>

## 11.5 Flat and nested forms

The flat form is:

```nucleus
if firstCondition
    firstAction()
elseif secondCondition
    secondAction()
else
    fallbackAction()
end
```

A genuinely nested conditional has another `if` statement and another `end` in a clause body:

```nucleus
if outerCondition
    if innerCondition
        innerAction()
    end
else
    fallbackAction()
end
```

An `if` that is the sole statement of an `else` body can express the same simple truth conditions as a flat `elseif` chain. Nucleus retains `elseif` because the token marks the clause directly, one `end` closes the chain, and the parser can process repeated clauses with one iterative path. The two spellings do not create different Boolean semantics.

`else if` is not an alternative spelling for `elseif`. It produces two tokens. After `else`, this grammar requires `NEWLINE`; a nested `if` begins as a statement on a following logical line and has its own `end`.

<div id="116-conditional-header-termination" class="nucleus-source-anchor"></div>

## 11.6 Conditional header termination

Nucleus conditional headers do not use `then`. The logical newline already separates the condition from its body, and Chapter 9 has no conditional expression whose tokens could extend across that boundary. A `then` keyword would add a reserved word and grammar token without resolving a parsing choice.

Consequently, `then` remains an identifier under Chapter 3. A Boolean variable named `then` may appear as the complete condition in `if then`; the following logical newline terminates that header.

<div id="117-integer-selection" class="nucleus-source-anchor"></div>

## 11.7 Integer selection

The selection grammar is:

```text
select-statement ::= "select" expression NEWLINE
                     case-clause { case-clause }
                     [ "else" NEWLINE statement-sequence ]
                     "end" NEWLINE
case-clause     ::= "case" constant-expression
                     { "," constant-expression } NEWLINE
                     statement-sequence
```

The selector must have type `u8`, `u16`, `i8`, or `i16`. The compiler evaluates it exactly once, including any observable call or storage access in the expression. Boolean and aggregate selectors are invalid.

Each case item is a compile-time integer constant expression. The compiler applies the ordinary constant conversion and range rules to the selector's exact type. Signed selectors admit negative cases. Boolean, dynamic, and out-of-range case items are invalid.

Case items are tested from top to bottom. The first equal item selects its body. Several comma-separated items share one body, and duplicate values are permitted; a later duplicate is unreachable when an earlier one matches. A selected body never falls through into the next case. Normal completion continues after the complete `select`.

At least one `case` is required. The optional `else` is final. When no case matches, the `else` body executes if present; otherwise the statement performs no body operation. An empty case body matches and performs no operation. It does not share the next body.

`select` is not a loop. `exit` and `continue` still target the innermost enclosing `while` or `for`. Nested selection, conditionals, loops, and immediate handlers use the ordinary structured-control nesting limit.

Without `else`, a `select` remains capable of falling through because no case may match. With `else`, it is non-fallthrough only when every case body and the `else` body are independently non-fallthrough.

This example evaluates `direction` once. Values 1 and 2 share a body:

```nucleus
select direction
case 0
    stop()
case 1, 2
    move()
else
    wait()
end
```

This version admits equality cases only. It has no case ranges, pattern cases,
Boolean selection, fallthrough, or source-visible `break`.

<div id="118-excluded-conditional-mechanisms" class="nucleus-source-anchor"></div>

## 11.8 Excluded conditional mechanisms

Nucleus 0.1 has no:

- one-line `if` form;
- postfix or statement-modifier condition;
- conditional expression;
- pattern matching;
- fall-through selection; or
- implicit integer truth test.

Duplicate case values are permitted under Section 11.7; the first matching item
wins.

<div id="119-invalid-conditionals-and-capacity-limits" class="nucleus-source-anchor"></div>

## 11.9 Invalid conditionals and capacity limits

The compiler must diagnose a non-Boolean condition, `elseif` after `else`, more than one `else`, `else if` used as a flat-clause spelling, a missing logical newline, a missing closing `end`, and any clause token outside its conditional context.

An implementation may bound nested conditional depth, clause count, and branch-fixup state. It must publish each limit and issue a capacity diagnostic before overflow changes clause association, skips a selected body, evaluates an unselected condition, or emits an unresolved branch.

<div id="1110-examples" class="nucleus-source-anchor"></div>

## 11.10 Examples

This chain evaluates `ready` first and `waiting` only when `ready` is false:

```nucleus
if ready
    run()
elseif waiting
    poll()
else
    stop()
end
```

An empty body is valid:

```nucleus
if unchanged
elseif needsUpdate
    update()
end
```

These headers are invalid:

```nucleus
if count              // u16 is not a condition
if ready then         // then is an identifier, not a header marker
else if waiting       // not the flat elseif token
```
