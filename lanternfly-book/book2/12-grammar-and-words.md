---
layout: default
title: "Grammar and Word Inventory"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 12
---

# Grammar and Word Inventory

This chapter gathers Lanternfly's concrete source forms in one place. The
grammar records the 0.4 block shapes and the rule that distinguishes
assignment from equality. Expression precedence comes from
[Chapter 4](04-integer-expressions.md#precedence-and-associativity).

The grammar remains provisional while parser implementation tests its edge
cases. Successful parsing is only the first step: the semantic restrictions
in the earlier chapters still determine whether the source is valid.

## Modules and declarations

```text
module              ::= top-item*
hosted-body         ::= local-decl* statement*

top-item            ::= import-decl
                      | export-decl
                      | declaration
                      | asm-block

import-decl         ::= "import" string-literal newline
export-decl         ::= "export" exportable-declaration

declaration         ::= const-decl
                      | var-decl
                      | enum-decl
                      | range-decl
                      | record-decl
                      | extern-sub-decl
                      | sub-decl

exportable-declaration
                    ::= const-decl
                      | var-decl
                      | enum-decl
                      | range-decl
                      | record-decl
                      | extern-sub-decl
                      | sub-decl

const-decl          ::= "const" value-name "as" type-expr
                        "=" constant-initializer placement? newline

var-decl            ::= "volatile"? "var" value-name "as" type-expr
                        ("=" constant-initializer)? placement? newline

placement           ::= "at" address-const-expr

enum-decl           ::= "enum" type-name "as" integer-type newline
                        enum-member+
                        "end" newline
enum-member         ::= value-name newline

range-decl          ::= "range" type-name "as" ordinal-type
                        "=" ordinal-range newline

record-decl         ::= "record" type-name newline
                        field-decl+
                        "end" newline

field-decl          ::= value-name "as" type-expr newline

sub-decl            ::= "sub" value-name "(" params? ")"
                        ("as" type-expr)? newline
                        routine-block
                        "end" newline

extern-sub-decl     ::= "extern" "sub" value-name "(" params? ")"
                        ("as" type-expr)?
                        external-binding? newline

external-binding    ::= "at" address-const-expr
                      | "from" string-literal

params              ::= param ("," param)*
param               ::= aggregate-storage-class? value-name "as" type-expr
aggregate-storage-class
                    ::= "near" | "far"
```

## Locals and initializers

```text
routine-block       ::= local-decl* statement*
local-decl          ::= local-var-decl | alias-decl

local-var-decl      ::= "var" value-name "as" type-expr
                        ("=" expression)? newline

alias-decl          ::= "alias" value-name "as" aggregate-type
                        "=" storage-path newline

constant-initializer
                    ::= const-expr
                      | array-initializer
                      | record-initializer

array-initializer   ::= "[" (constant-initializer
                        ("," constant-initializer)*)? "]"

record-initializer  ::= type-name "("
                        field-initializer
                        ("," field-initializer)* ")"

field-initializer   ::= value-name "=" constant-initializer
```

## Statements

```text
statement           ::= assignment-statement
                      | expression-statement
                      | standard-procedure-statement
                      | if-statement
                      | select-statement
                      | for-statement
                      | for-each-statement
                      | while-statement
                      | exit-statement
                      | continue-statement
                      | return-statement
                      | asm-block

asm-block           ::= "asm" newline
                        raw-assembly-line*
                        "end" newline

assignment-statement
                    ::= writable-path "=" expression newline

expression-statement
                    ::= expression newline

standard-procedure-statement
                    ::= "clear" "(" storage-path ")" newline
                      | "fill" "(" storage-path "," expression ")" newline
                      | "append" "(" storage-path "," expression ")" newline

if-statement        ::= "if" expression "then" newline block
                        ("else" "if" expression "then" newline block)*
                        ("else" newline block)?
                        "end" newline

select-statement    ::= "select" expression newline
                        case-clause+
                        ("else" newline block)?
                        "end" newline

case-clause         ::= "case" case-item
                        ("," case-item)* newline block
case-item           ::= const-expr
                      | const-expr ("to" | "until") const-expr

for-statement       ::= "for" value-name "=" expression
                        ("to" | "until") expression
                        ("step" const-expr)? newline
                        block
                        "end" newline

for-each-statement  ::= "for" "each" value-name "in" storage-path
                        newline block "end" newline

while-statement     ::= "while" expression newline block "end" newline

exit-statement      ::= "exit" newline
continue-statement  ::= "continue" newline
return-statement    ::= "return" expression? newline

block               ::= statement*
```

## Types and paths

```text
type-expr           ::= arrayable-type dimensions?

aggregate-type      ::= type-name
                      | string-type
                      | arrayable-type dimensions

arrayable-type      ::= scalar-type
                      | string-type
                      | type-name
                      | address-type

dimensions          ::= "[" index-domain ("," index-domain)* "]"
index-domain        ::= const-expr
                      | ordinal-range
                      | type-name
ordinal-range       ::= const-expr ("to" | "until") const-expr
ordinal-type        ::= integer-type | type-name

scalar-type         ::= integer-type
                      | "boolean"

integer-type        ::= "u8" | "i8" | "u16" | "i16"
                      | "u32" | "i32"

string-type         ::= "string" "[" const-expr "]"
address-type        ::= ("near" | "far") "address"

storage-base        ::= value-name
storage-path        ::= storage-base path-segment*
writable-path       ::= storage-path

path-segment        ::= "." value-name
                      | "[" expression ("," expression)* "]"
```

## Expressions

```text
expression          ::= or-expression

or-expression       ::= xor-expression ("or" xor-expression)*
xor-expression      ::= and-expression ("xor" and-expression)*
and-expression      ::= not-expression ("and" not-expression)*

not-expression      ::= "not" not-expression
                      | comparison-expression

comparison-expression
                    ::= shift-expression
                        (comparison-op shift-expression)?

comparison-op       ::= "=" | "<>" | "<" | "<=" | ">" | ">="

shift-expression    ::= additive-expression
                        (("shl" | "shr") additive-expression)*

additive-expression ::= multiplicative-expression
                        (("+" | "-") multiplicative-expression)*

multiplicative-expression
                    ::= unary-expression
                        (("*" | "/" | "mod") unary-expression)*

unary-expression    ::= ("+" | "-") unary-expression
                      | power-expression

power-expression    ::= postfix-expression ("^" unary-expression)?
postfix-expression  ::= primary-expression path-segment*

primary-expression  ::= integer-literal
                      | character-literal
                      | string-literal
                      | "true" | "false"
                      | value-name
                      | invocation
                      | conversion
                      | standard-value-operation
                      | layout-query
                      | "(" expression ")"

invocation          ::= value-name "(" arguments? ")"
arguments           ::= expression ("," expression)*

conversion          ::= integer-type "(" expression ")"
                      | type-name "(" expression ")"

standard-value-operation
                    ::= ("abs" | "sqrt" | "length") "(" expression ")"

layout-query        ::= "size" "(" layout-operand ")"
                      | "count" "(" layout-operand
                        ("," const-expr)? ")"
                      | ("lower" | "upper") "(" layout-operand
                        ("," const-expr)? ")"
                      | "offset" "(" type-name
                        ("." value-name)+ ")"

layout-operand      ::= "type" type-expr | layout-path
layout-path         ::= value-name layout-path-segment*

layout-path-segment ::= "." value-name
                      | "[" const-expr ("," const-expr)* "]"
```

## Lexical forms

```text
const-expr          ::= expression
address-const-expr  ::= expression

value-name          ::= identifier
type-name           ::= identifier

identifier          ::= ascii-letter
                        (ascii-letter | decimal-digit | "_")*

integer-literal     ::= decimal-digit+
                      | "$" hexadecimal-digit+
                      | "%" binary-digit+

character-literal   ::= "'" character-content "'"
string-literal      ::= '"' string-character* '"'
newline             ::= logical-newline
```

`const-expr` and `address-const-expr` receive the semantic restrictions from
[Chapter 5](05-constants-variables-placement.md#constant-expressions) and
[Chapter 4](04-integer-expressions.md#target-address-constant-expressions).
In an array domain, a lone name that resolves to an ordinal type denotes that
type's complete domain; otherwise it is a count expression. Parentheses force
the count interpretation when a value and type share a name. A call-like form
likewise becomes a checked conversion when its leading name resolves to a
type.

## Assignment disambiguation

At the beginning of a statement, a writable path immediately followed by `=`
forms an assignment. Within an expression, `=` tests equality. Parentheses
make a discarded equality test explicit:

```lanternfly
(left = right)
```

## Word inventory

The core word inventory is:

```text
abs
alias
and
append
as
asm
at
case
clear
const
continue
count
each
else
end
enum
exit
export
extern
false
fill
for
from
if
import
in
length
lower
mod
not
offset
or
range
record
return
select
shl
shr
size
sqrt
step
sub
then
to
true
until
upper
var
volatile
while
xor
```

Reserved built-in type and storage-class words are:

```text
address
boolean
far
i8
i16
i32
near
string
u8
u16
u32
```

`type` is contextual inside `size`, `count`, `lower` and `upper`.

Several familiar words are deliberately absent from the first edition:

```text
break
call
dim
do
function
goto
include
loop
procedure
repeat
```
