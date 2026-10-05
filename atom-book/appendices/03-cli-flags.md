---
title: "Node Command Reference"
parent: "Book 0 — Using Atom"
nav_order: 3
nav_group: "Node"
---

# Node Command Reference

## Node command

The Node command accepts a source file or a project file:

```text
atom [options] input.asm [output...]
atom --project project.json [output...]
```

| Option | Effect |
| --- | --- |
| `-p FILE`, `--project FILE` | Read a Node JSON project file |
| `-o FILE`, `--output FILE` | Add one output path; may be repeated |
| `-t NAME`, `--target NAME` | Select `generic` or `cpm22` |
| `-DNAME[=VALUE]` | Define one immutable preprocessor value; omitted value means 1 |
| `-h`, `--help` | Print command usage |
| `-V`, `--version` | Print the Atom package version |

The first positional path is the input. Later paths are outputs. Output
suffixes are `.bin`, `.hex`, `.com`, `.lst` and `.d8.json`. The same
paths may be supplied with `-o` when option form is more convenient. With no
output, Atom writes `build/<input-name>.bin`.

The generic target leaves placement to source `ORG` directives. The `cpm22`
target requires a flat image loaded and entered at `$0100`. Requesting a COM
file selects `cpm22` when no target was named.

Command definitions accept decimal, `$` hexadecimal, `%` binary, Intel `H`
hexadecimal and Intel `B` binary. A shell may expand `$`, so quote that form or
use an Intel suffix.

## Node project file

```json
{
  "assembler": "atom",
  "entry": "src/main.asm",
  "target": "cpm22",
  "outputs": ["build/main.com", "build/main.d8.json"],
  "definitions": {
    "DEBUG": 0
  }
}
```

Paths are relative to the project file. Command output paths replace the
project output list, and command definitions override project definitions.
The optional `assembler` field should be `atom` in a project shared with tools
that support more than one assembler.

## CP/M command

The [CP/M guide](../using-atom-on-cpm.md#the-command-line) contains the CP/M
command forms, output formats and diagnostics.

## Node status values

| Status | Meaning |
| ---: | --- |
| 0 | Successful assembly and publication, help, or version |
| 1 | Source preparation, assembly, rendering, or publication failure |
| 2 | Invalid command use |
