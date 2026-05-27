---
layout: default
title: "Appendix F — Review Checklist"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 106
---
# Appendix F — Review Checklist

Use this checklist before asking for review.

## Technical Check

- Command names match `debug80/package.json`.
- Panel labels match the current `webview/` HTML.
- Project kit labels and start addresses match `project-kits.ts`.
- Entry-source rules match `azm-source-extensions.ts`.
- CoolTerm setup matches current source and real CoolTerm screenshots.
- Artifact claims match the current AZM backend.
- Source-map-backed features use "source map" in user-facing prose.
- Watch expression syntax matches `watch-expression.ts`.

## Structure Check

- Each chapter has one job.
- Each major term has one main teaching home.
- Early chapters use only terms they have defined or briefly introduced.
- Later chapters refer back instead of re-teaching.
- Reference detail sits in appendices unless the task needs it immediately.
- Chapter image placeholders match Appendix C.

## Prose Check

- Every paragraph advances the reader's knowledge.
- Sections start from the reader's task.
- Examples appear before secondary explanation.
- Empty reassurance and sales language have been removed.
- Negative framing has been removed unless it teaches a concrete contrast.
- Serial commas before the final `and` or `or` have been removed.
- Banned words from the oracle do not appear in book prose.

## Review State

Before external review, record remaining gaps:

- screenshots still missing
- exact first visible tutorial program
- exact TEC-1G / MON-3 receive-mode sequence
- any command or UI label that must be rechecked after the next Debug80 code change
