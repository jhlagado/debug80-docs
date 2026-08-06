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

A **compilation unit** is one logical Nucleus token stream ending in one `EOF` token. The compiler processes that stream from beginning to end as a single ordered unit. A compilation unit supplies one outer declaration sequence; a physical file boundary does not begin a scope, clear declarations, or change declaration order. Chapter 5 defines the resulting scopes.

The structural skeleton is:

```text
compilation-unit ::= { top-level-declaration } EOF
```

The complete grammar in Chapter 17 replaces this skeleton. Its declaration productions consume the logical `NEWLINE` tokens defined in Chapter 3.

Blank and comment-only physical lines contribute no top-level item. If the final item has no physical line ending, Chapter 3 requires the tokenizer to emit its final `NEWLINE` before `EOF`.

<div id="43-physical-files-and-stream-assembly" class="nucleus-source-anchor"></div>

## 4.3 Physical files and stream assembly

The core Nucleus 0.1 compiler accepts one logical source stream. It does not open source files, search directories, or resolve source dependencies while parsing that stream.

A build tool may assemble the stream from one or more physical files. It must preserve their declared order and must not join tokens across a file boundary. When the preceding file does not end at a physical line boundary, the tool must insert a line ending before the next file's first byte. Tokenization then proceeds as if the assembled bytes had been supplied in one file.

Nucleus 0.1 has no source-level `import`, `include`, `module`, or namespace declaration. File lists, search paths, dependency resolution, and any mapping from logical source positions back to physical filenames are toolchain inputs outside the language. If a project tool calls a dependency an import, it must resolve and order that dependency before invoking the core compiler. A tool may retain a source-position mapping for diagnostics, but the compiler's conformance does not depend on a particular project-file or package format.

This arrangement does not permit textual macro processing. A stream assembler may combine source files and preserve source-position metadata; it must not add declarations, replace tokens, or make the accepted language depend on the file from which a token came.

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

This rule applies across physical file boundaries because all files contribute to one ordered compilation unit. Moving a declaration to a later file moves it later in declaration order. Splitting a unit into more files does not make later names visible sooner.

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

<div id="49-capacity-limits-and-file-organization" class="nucleus-source-anchor"></div>

## 4.9 Capacity limits and file organization

Documented compiler capacities apply to the complete logical compilation unit. A physical file boundary must not reset a symbol count, forward-signature count, nesting limit, source-position counter, or other unit-wide resource. Dividing the same ordered source among more files neither increases the language-defined capacity nor creates extra scopes.

An implementation may bound the logical source length, number of physical-file mappings retained by its build tool, number of declarations, number of unresolved forwards, or other storage required by this chapter. It must document each limit and issue a capacity diagnostic when the limit is exceeded. Under Chapter 1, that diagnostic does not make an otherwise conforming source program invalid.

The first compiler's 16 KiB core gate does not change these structural rules. Project measurements account for the code and immutable data used to enforce them, while writable tables and source maps remain in their separately reported accounts under Chapter 2.

<div id="410-provenance" class="nucleus-source-anchor"></div>

## 4.10 Provenance

Lanternfly Level 0 and the current Candlemoth source provide evidence that ordered physical files can form one streaming compilation unit and that unresolved forwards can be checked at its end. Nucleus adopts those two mechanisms through the rules above. It does not inherit Lanternfly's modules, imports, language levels, entry manifest, or Candlemoth's historical global-register source model.
