---
layout: "default"
title: "17. Complete grammar"
parent: "Nucleus 0.1 Language Specification"
nav_order: 17
pageClass: "nucleus-specification"
---
[← 16. System boundary](16-system-boundary.md) · [Contents](./) · [18. Static semantics →](18-static-semantics.md)

<div id="17-complete-grammar" class="nucleus-source-anchor"></div>

# 17. Complete grammar

<div id="171-notation-and-lexical-boundary" class="nucleus-source-anchor"></div>

## 17.1 Notation and lexical boundary

Quoted words and punctuation are terminals. Uppercase names are token categories from Chapter 3. Lowercase hyphenated names are nonterminals. `{ X }` means zero or more repetitions, `[ X ]` means optional, parentheses group alternatives, and `|` separates alternatives.

The lexical forms are:

```text
ascii-letter       ::= "A".."Z" | "a".."z"
decimal-digit      ::= "0".."9"
hexadecimal-digit  ::= decimal-digit | "A".."F" | "a".."f"

identifier         ::= ascii-letter
                       { ascii-letter | decimal-digit | "_" }
integer-literal    ::= decimal-digit { decimal-digit }
character-literal  ::= "'" literal-byte "'"
string-literal     ::= '"' { literal-byte } '"'
escape             ::= "\\0" | "\\n" | "\\r" | "\\t"
                     | "\\'" | '\\"' | "\\\\"
                     | "\\x" hexadecimal-digit hexadecimal-digit
line-comment       ::= "//" { source-byte } (line-ending | EOF)
line-ending        ::= LF | CR LF
```

Sections 3.2 through 3.10 define `literal-byte`, accepted source bytes, maximal token formation, case-sensitive keyword and identifier recognition, numeric range, and lexical errors. Hexadecimal digits occur only in escapes; integer literals are decimal.

The tokenizer emits `NAME`, `NUMBER`, `CHARACTER`, `STRING`, keyword and punctuation terminals, `NEWLINE`, and `EOF`. It emits `NEWLINE` only at delimiter depth zero, collapses blank or comment-only lines, and synthesizes a source-part-boundary or final logical newline when Sections 3.4 and 4.3 require one. Source-part events and metadata remain outside the token grammar. Those stateful rules are part of the token contract and are not context-free productions.

<div id="172-syntactic-grammar" class="nucleus-source-anchor"></div>

## 17.2 Syntactic grammar

```text
compilation-unit
    ::= { top-level-declaration } EOF

top-level-declaration
    ::= const-declaration
      | program-var-declaration
      | record-declaration
      | forward-routine
      | routine-definition

const-declaration
    ::= "const" NAME "as" type "=" expression NEWLINE

program-var-declaration
    ::= "var" NAME "as" type [ "=" program-initializer ] NEWLINE
program-initializer
    ::= static-initializer
static-initializer
    ::= expression
      | STRING
      | record-initializer
      | array-initializer
static-aggregate-initializer
    ::= STRING
      | record-initializer
      | array-initializer
record-initializer
    ::= "(" static-initializer
        { "," static-initializer } ")"
array-initializer
    ::= "[" static-initializer
        { "," static-initializer } "]"

record-declaration
    ::= "record" NAME NEWLINE
        field-declaration { field-declaration }
        "end" NEWLINE
field-declaration
    ::= NAME "as" type NEWLINE

forward-routine
    ::= "forward" routine-header NEWLINE
routine-definition
    ::= "sub" NAME routine-definition-tail
routine-definition-tail
    ::= routine-signature-tail NEWLINE routine-body
      | NEWLINE routine-body
routine-body
    ::= { local-declaration } statement-sequence "end" NEWLINE
routine-header
    ::= "sub" NAME routine-signature-tail
routine-signature-tail
    ::= "(" [ formal-parameter
        { "," formal-parameter } ] ")"
        [ "as" type ] [ "fails" ]
formal-parameter
    ::= NAME "as" type

local-declaration
    ::= "var" NAME "as" type
        [ "=" local-initializer ] NEWLINE
local-initializer
    ::= failable-invocation failure-propagation
      | static-aggregate-initializer
      | expression

type
    ::= type-atom [ "[" expression "]" ]
type-atom
    ::= scalar-type | NAME | bounded-string-type
scalar-type
    ::= "u8" | "u16" | "boolean"
bounded-string-type
    ::= "string" "[" expression "]"

statement-sequence
    ::= { statement }
statement
    ::= simple-statement NEWLINE [ on-error-clause ]
      | if-statement
      | while-statement
      | for-statement

simple-statement
    ::= assignment-statement
      | routine-call-statement
      | return-statement
      | "exit"
      | "continue"
      | fail-statement

assignment-statement
    ::= assignment-target "=" assignment-source
assignment-target
    ::= NAME { field-suffix | index-suffix }
assignment-source
    ::= failable-invocation [ failure-propagation ]
      | expression

routine-call-statement
    ::= NAME argument-list [ failure-propagation ]
return-statement
    ::= "return" [ return-source ]
return-source
    ::= failable-invocation failure-propagation
      | expression
fail-statement
    ::= "fail" expression

failure-propagation
    ::= "or" "fail"
failable-invocation
    ::= NAME argument-list
on-error-clause
    ::= "on" "error" NAME NEWLINE
        statement-sequence
        "end" NEWLINE

if-statement
    ::= "if" expression NEWLINE statement-sequence
        { "elseif" expression NEWLINE statement-sequence }
        [ "else" NEWLINE statement-sequence ]
        "end" NEWLINE

while-statement
    ::= "while" expression NEWLINE
        statement-sequence
        "end" NEWLINE

for-statement
    ::= "for" NAME "=" expression
        for-bound expression
        [ "step" step-constant ] NEWLINE
        statement-sequence
        "end" NEWLINE
for-bound
    ::= "to" | "until"
step-constant
    ::= [ "+" | "-" ] (NUMBER | NAME)

expression
    ::= or-expression
or-expression
    ::= and-expression { "or" and-expression }
and-expression
    ::= not-expression { "and" not-expression }
not-expression
    ::= "not" not-expression | comparison
comparison
    ::= additive [ comparison-operator additive ]
comparison-operator
    ::= "=" | "<>" | "<" | "<=" | ">" | ">="
additive
    ::= multiplicative { ("+" | "-") multiplicative }
multiplicative
    ::= unary { ("*" | "/") unary }
unary
    ::= ("+" | "-") unary | postfix-expression
postfix-expression
    ::= primary { postfix-suffix }
primary
    ::= NUMBER | CHARACTER | "true" | "false"
      | NAME | conversion | "(" expression ")"
conversion
    ::= ("u8" | "u16") "(" expression ")"
postfix-suffix
    ::= argument-list | index-suffix | field-suffix
argument-list
    ::= "(" [ expression { "," expression } ] ")"
index-suffix
    ::= "[" expression "]"
field-suffix
    ::= "." NAME
```

The grammar uses the general `expression` nonterminal for scalar constant leaves and type bounds. Chapter 8's constant-context predicate rejects variables, calls, nonconstant operations, and values outside the required range. The declared type and current aggregate component select a scalar expression, string literal, parenthesized record initializer, or bracketed array initializer. This type-directed choice resolves the shared opening `(` of a parenthesized scalar expression and a record initializer without backtracking. `type` permits at most one array suffix outside a bounded-string atom, which admits arrays of scalars, records, and bounded strings but not arrays of arrays.

<div id="173-semantic-predicates" class="nucleus-source-anchor"></div>

## 17.3 Semantic predicates

The grammar uses these declared semantic predicates:

| Predicate                           | Decision                                                                                                                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isCallableName` / `isWritableName` | At statement head, select a routine-call statement or an assignment from the resolved declaration class.                                                                                                                |
| `isFailableCallableName`            | In a local initializer, assignment source, or return source beginning with `NAME`, select the restricted failable-invocation path when the visible signature has `fails`; otherwise parse the ordinary expression path. |
| `isRecordTypeName`                  | Accept a `NAME` as a type atom only when it resolves to a visible record type.                                                                                                                                          |
| `isInitializerForDeclaredType`      | Select and check the scalar, string, positional record, recursive array, zero-default, private-static, or aggregate-alias rule from the declared or current component type.                                             |
| `isFailablePrecedingStatement`      | Admit `on error` only after the direct failable assignment or call statement required by Section 14.6.                                                                                                                  |
| `isConstantContext`                 | In constants, type bounds, array lengths, string capacities, and program initializers, admit only the compile-time operands and operations from Chapter 8.                                                              |
| `isInfallibleCallableName`          | Admit a call in an ordinary expression only when the visible signature omits `fails`.                                                                                                                                   |
| `isIntegerConstantName`             | Admit a `NAME` as a counted-loop step magnitude only when it denotes an earlier `u8` or `u16` constant.                                                                                                                 |
| `isIncompleteForwardName`           | Admit `sub NAME NEWLINE` as a body header only when the exact name resolves to one incomplete forward; install that forward's stored parameter bindings for the body.                                                   |

Field lookup after `.` uses the selected record type, except that a bounded-string base admits only the intrinsic read-only suffix `.length`. Index selection uses a fixed-array domain or a bounded string's current logical length according to the base type; this distinction needs no grammar change. Static initializer checking descends the finite declared type tree and records the expected component before parsing each nested initializer. The `NAME` in `step-constant` must denote an earlier integer constant. Calls within ordinary expressions require an infallible visible routine; failable calls use the separate path above. For `return-source`, a result-free failable caller and callee form the admitted no-result propagation case; otherwise the caller and callee result shapes must match. These are static semantic checks over an otherwise deterministic token stream, not token backtracking.

<div id="174-predictive-analysis" class="nucleus-source-anchor"></div>

## 17.4 Predictive analysis

The repository grammar analyzer mechanically expanded the grammar above to 172 BNF rules over 93 nonterminals. It found no nullable-prefix left-recursion cycle, unreachable nonterminal, or unproductive nonterminal. The LL(1) table contained six conflict sites. Four use lookahead `NAME`; two use lookahead `(` where a declared type distinguishes a record initializer from a scalar expression. The focused test reads this Chapter 17 block directly, so the analyzer evidence does not create a second grammar authority.

| Nonterminal          | Lookahead | Conflict                                               | Resolution                          |
| -------------------- | --------- | ------------------------------------------------------ | ----------------------------------- |
| `simple-statement`   | `NAME`    | assignment versus routine call                         | `isWritableName` / `isCallableName` |
| `local-initializer`  | `NAME`    | failable invocation versus expression                  | `isFailableCallableName`            |
| `assignment-source`  | `NAME`    | failable invocation versus expression                  | `isFailableCallableName`            |
| `return-source`      | `NAME`    | failable invocation versus expression                  | `isFailableCallableName`            |
| `static-initializer` | `(`       | record initializer versus parenthesized expression     | `isInitializerForDeclaredType`      |
| `local-initializer`  | `(`       | structured initializer versus parenthesized expression | `isInitializerForDeclaredType`      |

No unexplained FIRST/FIRST or FIRST/FOLLOW conflict remained. The expression repetitions expand to right-recursive implementation rules while their semantic actions preserve the left association specified in Section 9.6. Unary and `not` recursion remains right-recursive by design. A compiler may parse a direct call before applying the same failable-call category check, and it may recognize terminal `or fail` while parsing the `or` level, instead of branching on `isFailableCallableName` before parsing. Any such implementation must accept the same token sequences and produce the same static decisions. Other reported conflicts require their named predicate or an audited equivalent; a compiler must report a specification defect rather than change the language silently.

The analyzer result checks the collected grammar's formal shape. It does not prove the static compatibility, lifetime, capacity, or flow rules consolidated in Chapter 18.
