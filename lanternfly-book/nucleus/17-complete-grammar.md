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

Sections 3.2 through 3.10 define `literal-byte`, accepted source bytes, maximal token formation, case folding, numeric range, and lexical errors. Hexadecimal digits occur only in escapes; integer literals are decimal.

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
    ::= expression | STRING | array-initializer
array-initializer
    ::= "[" expression { "," expression } "]"

record-declaration
    ::= "record" NAME NEWLINE
        field-declaration { field-declaration }
        "end" NEWLINE
field-declaration
    ::= NAME "as" type NEWLINE

forward-routine
    ::= "forward" routine-header NEWLINE
routine-definition
    ::= routine-header NEWLINE
        { local-declaration }
        statement-sequence
        "end" NEWLINE
routine-header
    ::= "sub" NAME "(" [ formal-parameter
        { "," formal-parameter } ] ")"
        [ "as" type ] [ "fails" ]
formal-parameter
    ::= NAME "as" type

local-declaration
    ::= "var" NAME "as" type
        [ "=" local-initializer ] NEWLINE
local-initializer
    ::= failable-invocation failure-propagation
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

The grammar uses the general `expression` nonterminal for constant initializers and type bounds. Chapter 8's constant-context predicate rejects variables, calls, nonconstant operations, and values outside the required range. `type` permits at most one array suffix outside a bounded-string atom, which admits arrays of scalars, records, and bounded strings but not arrays of arrays.

<div id="173-semantic-predicates" class="nucleus-source-anchor"></div>

## 17.3 Semantic predicates

The grammar uses these declared semantic predicates:

| Predicate                           | Decision                                                                                                                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isCallableName` / `isWritableName` | At statement head, select a routine-call statement or an assignment from the resolved declaration class.                                                                                                                |
| `isFailableCallableName`            | In a local initializer, assignment source, or return source beginning with `NAME`, select the restricted failable-invocation path when the visible signature has `fails`; otherwise parse the ordinary expression path. |
| `isRecordTypeName`                  | Accept a `NAME` as a type atom only when it resolves to a visible record type.                                                                                                                                          |
| `isInitializerForDeclaredType`      | Apply the scalar, string, flat scalar-array, zero-default, or aggregate-alias rules after the declared type is known.                                                                                                   |
| `isFailablePrecedingStatement`      | Admit `on error` only after the direct failable assignment or call statement required by Section 14.6.                                                                                                                  |
| `isConstantContext`                 | In constants, type bounds, array lengths, string capacities, and program initializers, admit only the compile-time operands and operations from Chapter 8.                                                              |
| `isInfallibleCallableName`          | Admit a call in an ordinary expression only when the visible signature omits `fails`.                                                                                                                                   |
| `isIntegerConstantName`             | Admit a `NAME` as a counted-loop step magnitude only when it denotes an earlier `u8` or `u16` constant.                                                                                                                 |

Field lookup after `.` uses the selected record type, except that a bounded-string base admits only the intrinsic read-only suffix `.length`. Index selection uses a fixed-array domain or a bounded string's current logical length according to the base type; this distinction needs no grammar change. The `NAME` in `step-constant` must denote an earlier integer constant. Calls within ordinary expressions require an infallible visible routine; failable calls use the separate path above. For `return-source`, a result-free failable caller and callee form the admitted no-result propagation case; otherwise the caller and callee result shapes must match. These are static semantic checks over an otherwise deterministic token stream, not token backtracking.

<div id="174-predictive-analysis" class="nucleus-source-anchor"></div>

## 17.4 Predictive analysis

The repository grammar analyzer mechanically expanded the grammar above to 159 BNF rules over 86 nonterminals. It found no nullable-prefix left-recursion cycle, unreachable nonterminal, or unproductive nonterminal. The LL(1) table contained four conflict sites, all on lookahead `NAME`:

| Nonterminal         | Conflict                              | Resolution                          |
| ------------------- | ------------------------------------- | ----------------------------------- |
| `simple-statement`  | assignment versus routine call        | `isWritableName` / `isCallableName` |
| `local-initializer` | failable invocation versus expression | `isFailableCallableName`            |
| `assignment-source` | failable invocation versus expression | `isFailableCallableName`            |
| `return-source`     | failable invocation versus expression | `isFailableCallableName`            |

No unexplained FIRST/FIRST or FIRST/FOLLOW conflict remained. The expression repetitions expand to right-recursive implementation rules while their semantic actions preserve the left association specified in Section 9.6. Unary and `not` recursion remains right-recursive by design. A compiler must not change the grammar silently to remove a reported conflict; it must implement and audit the named predicate or report a specification defect.

The analyzer result checks the collected grammar's formal shape. It does not prove the static compatibility, lifetime, capacity, or flow rules consolidated in Chapter 18.
