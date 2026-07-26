---
layout: default
title: "Appendix D — The AZM options row"
parent: "Debug80 Book 1 — Getting started"
nav_order: 104
---

[← Appendix C — Debug80 file formats](c-project-configuration.md) | [Book 1](../index.md)

# Appendix D — The AZM options row

The Project section has a row of three controls that the rest of this book walks past: **Register Contracts**, **Contract Updates** and **Strict labels**. They are settings rather than actions. Nothing in the ordinary edit-build-step loop requires you to touch them.

One of them changes what a failed build means. Another can rewrite your source.

![The AZM options row: Register Contracts set to Enforce, Contract Updates set to Ask, and Strict labels ticked](../../../assets/images/debug80-book/book1/panel-state-ready.svg)

All three are AZM settings. Debug80 is not doing the work here; it is choosing what to ask the assembler for. The underlying feature is documented in full in [AZM Book 1, Chapter 6](../../../azm-book/book1/06-register-contracts.md), which explains register contracts as a language feature.

## What a register contract is, briefly

A routine uses registers. Some it reads, some it writes, some it destroys along the way. A *register contract* writes that down:

```text
.routine out A maybe-out D clobbers D
Helper:
        ld d, 2
        ld a, 1
        ret
```

`Helper` returns something useful in `A`, may leave something in `D`, and destroys `D` in the process. A caller that had a value in `D` it needed after the call has a bug — the kind that survives a hundred correct runs and then fails once the surrounding code changes.

AZM can infer these contracts by reading the code, compare them against the calls it finds, and report the collisions. That analysis is what the first two controls turn on and act upon.

## Register Contracts

Three values: **Enforce**, **Audit**, **Off**.

| Setting | What AZM does | Effect on your build |
|---|---|---|
| Enforce | Analyses, and treats a proven conflict as an error | The build fails |
| Audit | Analyses and reports | The build succeeds |
| Off | Does not analyse | Nothing |

**Enforce is the default**. If a build fails with a message about a register conflict, and the code assembles fine everywhere else, this control is why. The failure is usually telling you something true — but if you are mid-experiment and want the program to run first and be correct later, drop to Audit.

Enforce and Audit both write a report next to the other build artifacts:

```text
build/main.regcontracts.txt
```

That is the file [chapter 4](../04-build-and-run.md) lists among the build outputs. It exists because this control is on.

The panel offers three settings; AZM itself has five (`off`, `audit`, `warn`, `error`, `strict`). Enforce is AZM's `error`. The other two are reachable only by setting `registerContracts` in `debug80.json` by hand — and see the warning at the end of this appendix before you do.

## Contract Updates

Three values: **Ask**, **Auto**, **Never**. The default is Ask.

AZM does not only find contract problems; it can write the answers back. Given a routine whose contract is missing or out of date, it works out what the contract should be and produces a corrected version of your source. It can also insert `.expectout` at call sites where the fix is unambiguous.

This control decides what Debug80 does with that corrected source:

- **Never** — does not ask for it.
- **Ask** — offers it after a build, showing you which files would change. You can look at a diff before deciding.
- **Auto** — applies it.

The changes are applied as **editor edits, not file writes**. The revised text arrives in your open editor as unsaved changes: the diff gutter marks them, and undo reverts them. Nothing is written to disk until you save. If you dislike what it did, press undo.

They land **on Build only**. Run does not rewrite source. Run restarts the emulated machine the moment assembly finishes, and having your code move underneath you at that moment is disorienting, so Debug80 does not do it.

Contract Updates works even with Register Contracts set to Off. Asking for updates turns the analysis on by itself. The two controls sit next to each other and read as though the first gates the second, but they are independent.

## Strict labels

A checkbox, ticked by default.

Ticked, a label must be referenced with the capitalization it was defined with — `ScanHello` will not answer to `scanhello`. Unticked, capitalization is ignored.

Leave it on for new code; the strictness catches typos that would otherwise resolve to the wrong symbol or fail late. Turn it off when you are assembling older source that is inconsistent about case and that you would rather not rewrite. It applies to Glimmer-generated assembly too, which [chapter 11](../11-glimmer-targets.md) covers.

## Where each setting is kept

The three controls are not stored alike, which is easy to miss because they sit in one row:

| Control | Where it lives | Survives a window restart? |
|---|---|---|
| Register Contracts | This VS Code window | No — returns to Enforce |
| Contract Updates | This VS Code window | No — returns to Ask |
| Strict labels | `debug80.json` | Yes |

**Strict labels is the only one that writes to the project.** Tick or untick it and `azm.symbolCase` in `debug80.json` changes as you click, which means it is shared with anyone else who opens the project. The other two are yours and this window's, and reset when you close it.

## A warning about `debug80.json`

If you set `azm.registerContracts` by hand in `debug80.json`, the panel dropdown overrides it on every Build and Run started from the panel. The hand-written value survives only for builds that do not go through the panel.

This trips people up because the config file looks authoritative and is not. If you want a project-wide contracts policy that sticks, the file-scoped `registerContractsPolicy` described in [AZM Book 1](../../../azm-book/book1/06-register-contracts.md) is the mechanism that survives.

## Summary

- **Register Contracts** defaults to Enforce, which means a register conflict fails the build. Drop to Audit to be told without being stopped.
- `main.regcontracts.txt` exists because that control is on.
- **Contract Updates** can rewrite your source with inferred contracts, on Build only, as undoable editor edits. It works even when Register Contracts is Off.
- **Strict labels** is the only one of the three saved into `debug80.json`. The other two reset with the window.
- A hand-set `registerContracts` in `debug80.json` loses to the panel dropdown on every panel-driven build.

[← Appendix C — Debug80 file formats](c-project-configuration.md) | [Book 1](../index.md)
