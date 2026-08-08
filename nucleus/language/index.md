---
layout: "default"
title: "Nucleus 0.1 Language Specification"
nav_order: 1
has_children: true
has_toc: false
standalone: true
isolated: true
pageClass: "nucleus-specification"
---
<Mark class="book-plate" book="nucleus" size="52" />

# Nucleus 0.1 Language Specification

::: info Authoritative source
This reading edition is generated from the [Nucleus specification in the Debug80 repository](https://github.com/jhlagado/debug80/blob/main/packages/nucleus/docs/specification.md) at revision [`f57320085bca`](https://github.com/jhlagado/debug80/blob/f57320085bca7e1c263591a5ad46fe69788d09d3/packages/nucleus/docs/specification.md). The repository source is authoritative; this site adds page metadata and reading navigation, with headings and local links adapted to page boundaries. [Companion: Nucleus Virtual Machine 0.1 Specification](../vm/).
:::

## Contents

1. [Status and conformance](01-status-and-conformance.md#1-status-and-conformance)
2. [Design constraints](02-design-constraints.md#2-design-constraints)
3. [Source text and lexical rules](03-source-text-and-lexical-rules.md#3-source-text-and-lexical-rules)
4. [Program and file structure](04-program-and-file-structure.md#4-program-and-file-structure)
5. [Names and scopes](05-names-and-scopes.md#5-names-and-scopes)
6. [Types](06-types.md#6-types)
7. [Storage, values, and lifetime](07-storage-values-and-lifetime.md#7-storage-values-and-lifetime)
8. [Constants and declarations](08-constants-and-declarations.md#8-constants-and-declarations)
9. [Expressions](09-expressions.md#9-expressions)
10. [Statements](10-statements.md#10-statements)
11. [Conditional control](11-conditional-control.md#11-conditional-control)
12. [Loop control](12-loop-control.md#12-loop-control)
13. [Routines and calls](13-routines-and-calls.md#13-routines-and-calls)
14. [Recoverable errors](14-recoverable-errors.md#14-recoverable-errors)
15. [Safety failures and traps](15-safety-failures-and-traps.md#15-safety-failures-and-traps)
16. [System boundary](16-system-boundary.md#16-system-boundary)
17. [Complete grammar](17-complete-grammar.md#17-complete-grammar)
18. [Static semantics](18-static-semantics.md#18-static-semantics)
19. [Runtime semantics](19-runtime-semantics.md#19-runtime-semantics)
20. [Feature ledger](20-feature-ledger.md#20-feature-ledger)
21. [Conformance examples](21-conformance-examples.md#21-conformance-examples)
