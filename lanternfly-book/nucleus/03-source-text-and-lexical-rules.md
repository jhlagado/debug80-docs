---
layout: "default"
title: "3. Source text and lexical rules"
parent: "Nucleus 0.1 Language Specification"
nav_order: 3
pageClass: "nucleus-specification"
---
[← 2. Design constraints](02-design-constraints.md) · [Contents](./) · [4. Program and file structure →](04-program-and-file-structure.md)

<div id="3-source-text-and-lexical-rules" class="nucleus-source-anchor"></div>

# 3. Source text and lexical rules

<div id="31-scope" class="nucleus-source-anchor"></div>

## 3.1 Scope

This chapter defines how a Nucleus source byte stream becomes a token stream. It defines source bytes, line endings, whitespace, comments, names, reserved words, literals, punctuation, source positions, and lexical errors. Later chapters define grammar, name resolution, types, expression precedence, and runtime meaning.

The rules are deterministic and require no backtracking. Rules stated for source text, token identity, or lexical errors apply to every conforming compiler. Project acceptance requires the first compiler to consume the source in order with bounded state and without retaining a complete source copy. This is a Chapter 2 project constraint, not a required internal organization for another compiler. Another compiler may organize tokenization differently, but it must produce the same tokens. One byte of lookahead is sufficient for every token rule in this chapter.

Nucleus inherits several spellings from Lanternfly, but Lanternfly documentation and the current Candlemoth tokenizer are evidence rather than authority. Rules in this chapter become Nucleus rules only when this chapter states them.

<div id="32-source-bytes" class="nucleus-source-anchor"></div>

## 3.2 Source bytes

A Nucleus source file is a sequence of bytes in an ASCII-compatible encoding. The accepted source-byte repertoire is:

| Bytes        | Use              |
| ------------ | ---------------- |
| `09`         | horizontal tab   |
| `0A`         | LF line ending   |
| `0D 0A`      | CRLF line ending |
| `20` to `7E` | printable ASCII  |

`0D` is valid only as the first byte of CRLF. A lone CR is a lexical error. Every other byte, including NUL, vertical tab, form feed, DEL, bytes above `7F`, and a UTF-8 byte-order mark, is a lexical error.

EOF is an input condition, not a source byte. An implementation may use an internal sentinel when its source interface cannot return a separate EOF condition, but that sentinel must not be accepted as source text.

This repertoire excludes Unicode identifiers, Unicode normalization, and locale-dependent character classification. Escape sequences may denote byte values outside printable ASCII without placing those values in the source stream.

<div id="33-lines-and-source-positions" class="nucleus-source-anchor"></div>

## 3.3 Lines and source positions

LF and CRLF each form one physical line ending. The tokenizer normalizes either spelling to the same line-break event. A final physical line need not contain a line ending.

Diagnostics must identify a reproducible source position. Each token has a half-open byte span in the original stream and a one-based line and byte column for the span's start. Each lexical error identifies:

- a zero-based byte offset in the original byte stream;
- a one-based line number; and
- a one-based byte column within that line.

When CRLF produces `NEWLINE`, its two bytes occupy one token span, advance the byte offset by two, and advance the line number once. A synthesized final `NEWLINE` has a zero-width span at EOF. A horizontal tab advances the byte column by one; the column is not a display-cell count. These counters permit streaming diagnostics without a resident source map. An implementation that bounds a counter or source length must publish the limit and diagnose overflow.

<div id="34-whitespace-comments-and-logical-newlines" class="nucleus-source-anchor"></div>

## 3.4 Whitespace, comments, and logical newlines

ASCII space and horizontal tab are the only horizontal whitespace. They separate tokens where separation is needed and are otherwise ignored. Indentation has no syntactic meaning. Whitespace never joins adjacent names, numbers, or literals into one token.

`//` begins the one ordinary comment form. It is recognized outside character and string literals and consumes bytes up to, but not including, the next physical line ending or EOF. The comment produces no token. A line comment at EOF is complete; it does not require a closing marker. Nucleus 0.1 has no block, nested, or documentation comments.

A logical newline is the only statement terminator. Nucleus has no semicolon terminator and no second interchangeable terminator.

Delimiter state tracks open parentheses and square brackets. A physical line ending produces `NEWLINE` only when no delimiter is open. Inside either delimiter, a physical line ending is whitespace and produces no token. Parentheses and brackets inside a comment or literal do not affect this state. The first compiler represents it with a bounded stack; another compiler may use a different representation.

This is a tokenizer-parser interface rule rather than statement grammar: the tokenizer emits `NEWLINE` under this rule, while later chapters specify which grammar positions accept it. Delimiter state must distinguish `(` from `[`. A closing delimiter with no matching opener, a mismatched closing delimiter, an open delimiter at EOF, or implementation-capacity exhaustion is diagnosed.

Blank and comment-only physical lines produce no `NEWLINE`. Consecutive physical line endings therefore cannot create empty statements. After any token on a delimiter-depth-zero line, its physical line ending produces one `NEWLINE`. If EOF follows such a line without a physical line ending, the tokenizer emits one final `NEWLINE` before `EOF`. EOF following an empty or comment-only final line produces only `EOF`.

Examples:

```nucleus
total = (first +
    second)

value = table[
    index
]
```

Neither physical line ending inside the delimiters produces `NEWLINE`. By contrast, this source contains a logical newline after `+` and is rejected later by the statement or expression grammar:

```nucleus
total = first +
second
```

<div id="35-identifiers-and-reserved-words" class="nucleus-source-anchor"></div>

## 3.5 Identifiers and reserved words

An identifier begins with an ASCII letter. Each following byte is an ASCII letter, decimal digit, or underscore:

```text
identifier ::= ascii-letter (ascii-letter | decimal-digit | "_")*
```

Leading underscores are not identifiers. Nucleus does not assign implementation names through a source spelling convention; compiler-generated names remain outside the source namespace.

Identifier and reserved-word comparison is ASCII case-insensitive. The tokenizer folds `A` through `Z` to `a` through `z` and leaves every other accepted byte unchanged. No locale participates, and spelling case does not create a distinct name.

The complete folded identifier is its identity. An implementation must not truncate a spelling, compare only a prefix, or treat an unchecked hash match as equality. It may use hashes to locate candidates only if it resolves collisions by exact comparison. An implementation may impose a maximum identifier length and a maximum number of retained names. It must publish each limit, and exceeding one is a capacity diagnostic.

After scanning the longest identifier, the tokenizer compares its folded spelling with a fixed reserved-word table. A longer name is never split at a keyword boundary: `elseifReady` is one `NAME`, not `ELSEIF NAME`.

The Nucleus 0.1 reserved words are:

```text
and      as       boolean  const     continue  else     elseif
end      error    exit     fail      fails     false    for
forward  if       not      on        or        record   return
step     string   sub      to        true      u16      u8
until    var      while
```

`elseif` is one keyword. `else if` produces the two tokens `ELSE` and `IF` and does not form an `ELSEIF` clause. Case folding means that `ELSEIF` and `elseif` produce the same token.

Chapter 14 defines the recoverable-error forms that use `error`, `fail`, `fails`, and `on`.

Nucleus uses name-led routine invocation and has no `call` keyword. `call` remains an identifier.

The current Candlemoth tokenizer supplies evidence for ASCII case folding and bounded name scanning, but two implementation shortcuts are not Nucleus rules. It accepts `_` as a first byte because one class represents both name-start and name-continuation characters, and it can silently conflate two names whose hash pairs collide. A compiler claiming Nucleus conformance must enforce the spelling above and exact folded identity.

<div id="36-numeric-literals" class="nucleus-source-anchor"></div>

## 3.6 Numeric literals

Nucleus admits unsigned decimal integer literals:

```text
decimal-literal ::= decimal-digit+
integer-literal ::= decimal-literal
```

Hexadecimal integer literals are not part of Nucleus 0.1. The checked Candlemoth scanner implements bounded decimal accumulation but no hexadecimal path, and no target measurement justifies adding one under Chapter 2's admission rule. Hexadecimal digits remain part of the `\xHH` escape syntax in Section 3.7; that lexical use does not create an integer-literal form.

The tokenizer computes an exact unsigned value from zero through 65,535. A literal whose value exceeds 65,535 is a lexical error. Later type checking decides whether the value fits its context, including `u8`, `u16`, an array bound, or a counted-loop parameter.

A leading `+` or `-` is a separate punctuation token and is never part of the literal. Thus `-32768` begins with `-` followed by the literal `32768`; expression and constant rules determine whether that combination is valid.

A letter or underscore immediately following a decimal literal makes the numeric token malformed instead of beginning an adjacent identifier. This rejects forms such as `0x2a` and `12u8` with one diagnostic. `$` begins no Nucleus token and is a lexical error.

Binary, octal, and floating-point literals are absent. Numeric separators, exponent notation, decimal points, and type suffixes are absent. In particular, `%1010`, `1_000`, `1.0`, and `42u8` are not alternative integer spellings.

<div id="37-character-and-string-literals" class="nucleus-source-anchor"></div>

## 3.7 Character and string literals

A character literal uses single quotes and denotes exactly one decoded byte. A string literal uses double quotes and denotes a possibly empty sequence of decoded bytes:

```text
character-literal ::= "'" literal-byte "'"
string-literal    ::= '"' literal-byte* '"'
```

A direct literal byte is printable ASCII from space through `~`, excluding the literal's closing quote and backslash. A single quote may appear directly in a string, and a double quote may appear directly in a character literal.

Both literal forms accept only these escapes:

```text
\0  \n  \r  \t  \'  \"  \\  \xHH
```

`HH` is exactly two hexadecimal digits. The escape letters are lowercase; hexadecimal digits may use either case. The decoded values of `\0`, `\n`, `\r`, and `\t` are 0, 10, 13, and 9. `\xHH` contributes the byte whose value is `HH`.

A character literal must decode to exactly one byte. `''` and `'ab'` are errors. A string literal may decode to zero bytes, so `""` is valid. A physical line ending or EOF before the closing quote is an unterminated-literal error. A backslash followed by a physical line ending does not continue a literal.

The token records decoded bytes. Later chapters determine which character or bounded-string contexts accept those bytes. The tokenizer does not infer a string capacity or type from a literal.

Nucleus 0.1 has no interpolated, raw, or multiline literal family. It has no Unicode escape or encoding conversion. Adjacent string literals remain separate tokens; the tokenizer does not concatenate them.

An implementation may impose a maximum decoded literal length. It must publish the limit and diagnose an excess before discarding, wrapping, or truncating any byte.

<div id="38-operators-punctuation-and-delimiters" class="nucleus-source-anchor"></div>

## 3.8 Operators, punctuation, and delimiters

The tokenizer recognizes these punctuation tokens:

| Spelling | Token or use                                         |
| -------- | ---------------------------------------------------- |
| `(` `)`  | grouping, calls, and declarations                    |
| `[` `]`  | array types and indexing                             |
| `,`      | item and argument separator                          |
| `.`      | record-field selection                               |
| `+` `-`  | arithmetic punctuation; also unary punctuation       |
| `*` `/`  | arithmetic punctuation                               |
| `=`      | assignment or equality, according to grammar context |
| `<>`     | not equal                                            |
| `<` `<=` | less-than comparisons                                |
| `>` `>=` | greater-than comparisons                             |

Chapter 9 defines which expression operators are admitted, their operand types, precedence, and associativity. Listing a punctuation token here defines its formation, not every grammar position in which it is valid.

At each punctuation start, the tokenizer uses deterministic longest match. It recognizes `//` before `/`, and `<>`, `<=`, and `>=` before their one-character prefixes. No other two-character punctuation token is formed. `!=` and `==` are not comparison spellings.

Braces, colon, semicolon, question mark, hash, at sign, and backtick have no token in this draft. A source byte that begins no name, number, literal, comment, whitespace, line ending, or listed punctuation token is a lexical error. Nucleus 0.1 has no lexical preprocessor directive or macro form.

<div id="39-token-contract" class="nucleus-source-anchor"></div>

## 3.9 Token contract

The tokenizer emits the following token categories. The parser must not depend on the token's original case.

| Category    | Payload                                                       |
| ----------- | ------------------------------------------------------------- |
| `NAME`      | exact folded identifier identity and source span              |
| keyword     | fixed reserved-word ordinal and source span                   |
| `NUMBER`    | exact value from 0 through 65,535 and source span             |
| `CHARACTER` | one decoded byte and source span                              |
| `STRING`    | decoded byte sequence and source span                         |
| punctuation | fixed punctuation ordinal and source span                     |
| `NEWLINE`   | source position of the terminating physical line or final EOF |
| `EOF`       | final source position                                         |

Comments and horizontal whitespace produce no tokens. `EOF` is emitted after any synthesized final `NEWLINE` and marks the end of the token stream.

For reuse in Chapter 17, the lexical grammar is:

```text
ascii-letter       ::= "A".."Z" | "a".."z"
decimal-digit      ::= "0".."9"
hexadecimal-digit  ::= decimal-digit | "A".."F" | "a".."f"

identifier         ::= ascii-letter
                       (ascii-letter | decimal-digit | "_")*
integer-literal    ::= decimal-digit+
character-literal  ::= "'" literal-byte "'"
string-literal     ::= '"' literal-byte* '"'
literal-byte       ::= direct-literal-byte | escape
escape             ::= "\\0" | "\\n" | "\\r" | "\\t"
                     | "\\'" | '\\"' | "\\\\"
                     | "\\x" hexadecimal-digit hexadecimal-digit
line-comment       ::= "//" source-byte* (line-ending | EOF)
line-ending        ::= LF | CR LF
```

`direct-literal-byte` and the different closing delimiters obey Section 3.7. `source-byte*` in `line-comment` stops before a line ending. `NEWLINE` synthesis and delimiter suppression are stateful interface rules from Section 3.4 rather than context-free productions.

<div id="310-lexical-errors-and-bounded-failure" class="nucleus-source-anchor"></div>

## 3.10 Lexical errors and bounded failure

The first compiler stops after its first lexical diagnostic. Another compiler may continue only to report additional diagnostics; it must not accept the source by guessing, replacing, truncating, or silently resynchronizing tokens, and it must not report successful compilation.

Lexical errors include:

- a byte outside the accepted source repertoire;
- a lone CR;
- a malformed or out-of-range numeric literal;
- an unknown or incomplete escape;
- an empty or multi-byte character literal;
- a character or string literal terminated by a physical line ending or EOF;
- an unrecognized punctuation byte;
- an identifier or literal longer than a documented capacity;
- delimiter-nesting capacity exhaustion, unmatched or mismatched delimiters, or an open delimiter at EOF; and
- source-position or other published tokenizer-capacity exhaustion.

The `//` form cannot be unterminated because a physical line ending or EOF completes it. Text beginning `/*` is not a block comment; it begins `/` and `*` tokens and is rejected if the later grammar has no valid use for them.

Capacity failure must not change token identity. In particular, an overlong name or literal must not be truncated, split, wrapped, or accepted through a hash collision. The diagnostic must identify the capacity that was exceeded.

<div id="311-token-examples" class="nucleus-source-anchor"></div>

## 3.11 Token examples

| Source                     | Result or required diagnostic                  |
| -------------------------- | ---------------------------------------------- |
| `player_2`                 | one `NAME`                                     |
| `_player`                  | lexical error at `_`                           |
| `elseif`                   | one `ELSEIF` keyword                           |
| `ELSEIF`                   | one `ELSEIF` keyword                           |
| `elseifReady`              | one `NAME`                                     |
| `else if`                  | `ELSE IF`; not an `ELSEIF` clause              |
| `42`                       | `NUMBER(42)`                                   |
| `-42`                      | `- NUMBER(42)`                                 |
| `$2a`                      | lexical error; hexadecimal integers are absent |
| `0x2a`                     | malformed-number diagnostic                    |
| `%00101010`                | lexical error; binary literals are absent      |
| `'A'`                      | `CHARACTER(65)`                                |
| `'\x41'`                   | `CHARACTER(65)`                                |
| `''`                       | empty-character diagnostic                     |
| `""`                       | empty `STRING`                                 |
| `"A\nB"`                   | `STRING` containing bytes 65, 10, 66           |
| `"A\q"`                    | invalid-escape diagnostic                      |
| `a <= b`                   | `NAME <= NAME`                                 |
| `a != b`                   | lexical error at `!`                           |
| `a; b`                     | lexical error at `;`                           |
| `a / / b`                  | `NAME / / NAME`; not a comment                 |
| `a // note` followed by LF | `NAME NEWLINE`; the comment produces no token  |

For this source:

```nucleus
check(
    table[index]
)
```

the token sequence is:

```text
NAME ( NAME [ NAME ] ) NEWLINE EOF
```

The two physical line endings inside delimiters do not appear in the token sequence.

<div id="312-reserved-word-and-literal-decisions" class="nucleus-source-anchor"></div>

## 3.12 Reserved-word and literal decisions

Chapter 9 admits `not`, `and`, and `or`. Chapter 14 admits `fail`, `fails`, `on`, and `error`. These seven words are reserved. Chapter 11 omits a conditional header marker, so `then` remains an identifier. Nucleus 0.1 integer literals are decimal only. A later revision that needs another token requires an amendment here and cost accounting for the added scanner, table, test, and diagnostic work.
