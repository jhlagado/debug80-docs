---
layout: "default"
title: "4. Program and file structure"
parent: "Nucleus 0.1 Language Specification"
nav_order: 4
pageClass: "nucleus-specification"
---
[← 3. Source text and lexical rules](03-source-text-and-lexical-rules.md) · [Contents](./) · [5. Names and scopes →](05-names-and-scopes.md)

<div id="4-program-and-file-structure" class="nucleus-source-anchor"></div>

# 4. Program and file structure

<div id="41-scope" class="nucleus-source-anchor"></div>

## 4.1 Scope

This chapter defines the source presented in one compilation, the order of top-level declarations, the placement of executable statements, the completion of forward routine declarations, and the structural checks performed at end of input. Chapter 3 defines the byte and token streams. Chapters 5, 8, and 13 define scopes, declarations, and routines in detail.

Nucleus compilation is declaration ordered and streaming. The rules in this chapter require neither backtracking nor a retained whole-program syntax tree.

<div id="42-compilation-unit" class="nucleus-source-anchor"></div>

## 4.2 Compilation unit

A **compilation unit** is one logical Nucleus token stream formed from one or more ordered source parts and ending in one `EOF` token. The compiler processes that stream from beginning to end as a single ordered unit. A compilation unit supplies one outer declaration sequence; a source-part boundary does not begin a scope, clear declarations, or change declaration order. Chapter 5 defines the resulting scopes.

The structural skeleton is:

```text
compilation-unit ::= { top-level-declaration } EOF
```

The complete grammar in Chapter 17 replaces this skeleton. Its declaration productions consume the logical `NEWLINE` tokens defined in Chapter 3.

Blank and comment-only physical lines contribute no top-level item. If the final item has no physical line ending, Chapter 3 requires the tokenizer to emit its final `NEWLINE` before `EOF`.

<div id="43-multipart-compilation-stream" class="nucleus-source-anchor"></div>

## 4.3 Multipart compilation stream

The core Nucleus 0.1 compiler does not open source files, search directories, or resolve source dependencies. An external packaging layer supplies one ordered logical compilation stream through these transport-neutral events or records:

```text
begin-compilation
begin-source-part(stable-source-identity, [diagnostic-name])
source-bytes(bytes)
end-source-part
end-compilation
```

A compilation contains one or more source parts. `source-bytes` may occur repeatedly within a part; its chunk boundaries have no lexical or semantic effect. The stable source identity is unique within the compilation and remains unchanged for every diagnostic from that part. The optional diagnostic name is display metadata. Neither value is part of the Nucleus byte stream, creates a token or identifier, opens a scope, or otherwise participates in program semantics.

Each source part must end at a logical source boundary with delimiter depth zero. When its final source bytes do not include LF or CRLF, the compiler input layer supplies one zero-width line-ending event at the end of that part. It supplies no additional event when the part already ends with a physical line ending. Chapter 3 applies its ordinary comment, blank-line, and `NEWLINE` rules to that event. The next part therefore cannot continue a name, number, literal, comment, parenthesized expression, bracketed expression, or other token sequence from the preceding part. `end-source-part` does not emit `EOF`; only `end-compilation` does so after the final part.

Program scope, declaration order, forward completion, and every other source rule continue across source-part boundaries exactly as they do within one part. Declaration before use determines legal part order. An earlier exact forward routine signature permits the later routine references already admitted by Chapters 4, 5, and 13; the compiler does not infer signatures or construct a dependency graph.

The external packaging layer owns physical files, filenames, dependency discovery, dependency ordering, duplicate suppression, and source transport. It must resolve or reject missing physical inputs and must not present duplicate stable source identities. These are packaging failures, not Nucleus source diagnostics, and the core compiler need not diagnose a host filesystem failure. Nucleus 0.1 retains no source-level `import`, `include`, `module`, or namespace declaration.

The compiler may consume each event and byte chunk incrementally. It need not materialize a source part or the complete compilation stream. A later compiler-input or transport specification may assign a concrete binary, serial, tape, image, memory, or host representation, but that representation must preserve this event order, the source bytes, stable identities, optional names, and boundary rule. No MIME syntax, operating system, filesystem, or project-file format is part of the Nucleus 0.1 contract. A host build tool, serial uploader, tape or image builder, CP/M driver, or memory-resident monitor can implement the packaging layer.

The packaging layer must not add declarations, replace tokens, perform textual macro processing, or make accepted source depend on a part's physical origin. A diagnostic from multipart input must carry the stable source-part identity and the Chapter 3 position within that part, allowing the packaging layer to map it back to a physical source when such a mapping exists.

<div id="44-top-level-declarations" class="nucleus-source-anchor"></div>

## 4.4 Top-level declarations

Only top-level declarations may appear in a compilation unit. The current Nucleus 0.1 declaration families are:

- named constants;
- type declarations admitted by Chapter 6;
- top-level variable declarations admitted by Chapters 6 through 8;
- forward routine declarations; and
- routine definitions.

Executable statements must appear inside a routine body. A call, assignment, conditional, loop, or `return` at top level is invalid. Nucleus has no implicit mainline block formed from loose statements.

<div id="45-declaration-order" class="nucleus-source-anchor"></div>

## 4.5 Declaration order

Except for a routine use covered by an earlier forward declaration, each name must be declared before use. Chapter 5 defines the declaration point, visibility, and lookup rules.

This rule applies across source-part boundaries because all parts contribute to one ordered compilation unit. Moving a declaration to a later part moves it later in declaration order. Splitting a unit into more parts does not make later names visible sooner.

The types named by a constant, variable, record field, formal parameter, routine result, or forward signature must already be declared at that position. The exact scope and collision rules appear in Chapter 5. Constant-expression restrictions and initialization order appear in Chapter 8.

After a routine header has been checked, its routine name and complete signature are available in its body and in later declarations. This permits the body to contain a direct self-call under Chapter 13. A call to another routine whose header has not appeared requires an earlier forward declaration.

For example, this order satisfies the structural rules:

```nucleus
forward sub emit(value as u8)

sub run()
    var value as u8
    emit(value)
    return
end

sub emit(value as u8)
    return
end
```

The following order does not, because `emit` has no visible signature at the call:

```nucleus
sub run()
    emit(0)
    return
end

sub emit(value as u8)
    return
end
```

These examples establish declaration order only. Later chapters determine the remaining type, initialization, call, and return validity.

<div id="46-forward-routine-declarations" class="nucleus-source-anchor"></div>

## 4.6 Forward routine declarations

A forward routine declaration supplies a routine signature without a body. It is the only source-language exception to ordinary declaration before use. It must appear at top level before the first use that depends on it.

The parameter and result types in a forward declaration must already be available. Once checked, the declaration makes the routine callable at later positions under the same rules as a routine whose body has already appeared. It creates no executable statement and does not begin a routine body.

The completing definition must appear later in the same compilation unit. Its header must match the forward declaration in:

- routine-name identity under Chapter 3's case-folding rule;
- formal-parameter count, order, and types;
- the absence or presence of a result and, when present, its type; and
- the absence or presence of the `fails` effect from Chapter 14.

A routine may have at most one forward declaration and exactly one definition. A second forward declaration, a forward declaration after the definition, a second definition, or a definition with a mismatched header is invalid. Completing a forward declaration does not declare a second routine.

Forward declarations apply only to source routines. They do not provide a general forward reference for constants, types, variables, fields, or local names.

<div id="47-program-entry" class="nucleus-source-anchor"></div>

## 4.7 Program entry

Every Nucleus 0.1 compilation unit defines exactly one routine named `main`. Its data signature is fixed: it has no parameters and no result. It may include the `fails` effect declared by Chapter 14. The definition must have a body by `EOF`; a forward declaration alone cannot satisfy the entry rule.

Execution begins by calling `main` after program-lifetime initialization. Normal completion of `main` terminates successfully. A failure returned from `main` performs the unhandled-error trap in Chapter 15. The build does not select another entry name, and Nucleus 0.1 defines no library-only compilation unit without `main`.

Program startup, initialization, termination, and system services are specified in Chapters 16 and 19.

<div id="48-end-of-input-and-duplicate-completion" class="nucleus-source-anchor"></div>

## 4.8 End of input and duplicate completion

`EOF` ends the compilation unit; it does not close an open declaration or block. Reaching `EOF` before a required `end`, closing delimiter, declaration terminator, or routine body is complete makes the source invalid. Chapter 3 handles unclosed lexical delimiters before the parser receives `EOF`.

At `EOF`, the compiler must verify that:

- every forward routine declaration has one matching definition;
- every routine has at most one body;
- no top-level declaration remains structurally incomplete; and
- exactly one defined `main` satisfies Section 4.7.

The compiler may diagnose a duplicate declaration or mismatched completion as soon as it encounters the later declaration. It must not defer a detectable error merely because end-of-input validation also covers the condition. After any structural error, the initial compiler may stop under the diagnostic policy in Chapter 1; it must not report a successful translation.

<div id="49-capacity-limits-and-source-parts" class="nucleus-source-anchor"></div>

## 4.9 Capacity limits and source parts

Documented compiler capacities apply to the complete logical compilation unit. A source-part boundary must not reset a symbol count, forward-signature count, nesting limit, or other unit-wide resource. Dividing the same ordered source among more parts neither increases a language-defined capacity nor creates extra scopes. Chapter 3 source-position counters restart for each part because diagnostics use part-relative positions.

An implementation may bound the complete logical source length, source-part count, source-identity or diagnostic-name length, number of declarations, number of unresolved forwards, or other storage required by this chapter. It must document each limit and issue a capacity diagnostic when the limit is exceeded. Under Chapter 1, that diagnostic does not make an otherwise conforming source program invalid.

The first compiler's 16 KiB core gate does not change these structural rules. Project measurements account for the code and immutable data used to enforce them, while writable tables and source maps remain in their separately reported accounts under Chapter 2.

<div id="410-provenance" class="nucleus-source-anchor"></div>

## 4.10 Provenance

Lanternfly Level 0 and the current Candlemoth source provide evidence that ordered source parts can form one streaming compilation unit and that unresolved forwards can be checked at its end. Nucleus adopts those two mechanisms through the rules above. It does not inherit Lanternfly's modules, imports, language levels, entry manifest, or Candlemoth's historical global-register source model.
