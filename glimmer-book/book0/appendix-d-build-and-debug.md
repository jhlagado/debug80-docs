---
layout: default
title: "Appendix D - Build and Debug"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 22
---

[← Appendix C](appendix-c-tms9918-profile.md) | [Book](index.md) | [Appendix E →](appendix-e-azm-touchpoints.md)

# Appendix D - Build and Debug

The toolchain in one place: the CLI's two commands and their options,
the four files a build writes, the conventions that let Debug80 treat
a `.glim` file as a runnable target, and the diagnostics the compiler
reports. Every usage line, output line and message here is copied
from real runs of Glimmer 0.6.

## Getting the command line

The book's workflow never needs it: Debug80 carries the compiler
inside the extension. For scripts, automation, or working outside VS
Code, the CLI installs with Node 20 or newer:

```sh
npm install -g @jhlagado/glimmer
```

That provides the `glimmer` command, with the assembler included as a
dependency.

## The command line

`glimmer -h` prints the whole surface:

```text
Usage: glimmer [options] <entry.glim>
       glimmer build [options] <entry.glim>

The default command compiles .glim to a generated AZM source file
and register-contract checks it with AZM. build also assembles it
with AZM (.hex, .bin, .d8.json) and rewrites the Debug80 map so
block-body lines step in the .glim source.

Options:
  -o, --output <file>   Output AZM path (default: <entry>.main.asm, the Debug80 entry-point convention)
  --org <addr>          Assembly origin, e.g. $4000 (default: $4000)
  --no-check            Generate only; skip the AZM register-contract check (not with build)
  --deps                Print the dependency report (writers/readers per cell) and exit
  -V, --version         Print package version
  -h, --help            Print this help
```

Two commands share that surface:

| Invocation | Work performed |
|---|---|
| `glimmer game.glim` | Generates `game.main.asm` and register-contract checks it with the assembler. Stops there. |
| `glimmer build game.glim` | The same generation and check, then the assembler assembles the file and the Debug80 map is rewritten so block bodies step in `.glim` source. |

Each prints what it wrote:

```sh
glimmer demo.glim
```

```text
Wrote demo.main.asm (register contracts checked by AZM)
```

```sh
glimmer build demo.glim
```

```text
Wrote demo.main.asm (register contracts checked by AZM)
Wrote demo.main.d8.json (11 block segments attributed to .glim source)
```

`build`'s messages name the two files Debug80 reads; the `.hex` and
`.bin` land beside them in the same pass.

### Options

| Flag | Effect |
|---|---|
| `-o, --output <file>` | Where the generated assembly goes. The default, `<entry>.main.asm`, is the name Debug80 discovers as an entry point; pick another name only for output you will wire up yourself. |
| `--org <addr>` | Assembly origin. The default `$4000` is where MON-3 expects user code; `--org $6000` moves the generated `.org` line and everything after it. |
| `--no-check` | Generate only; the register-contract check is skipped. Generation-only runs print `Wrote demo.main.asm` without the check note. |
| `--deps` | Print the dependency report and exit. Nothing is written. |
| `-V, --version` | Print the installed Glimmer package version. |
| `-h, --help` | The usage text above. |

`--no-check` belongs to the default command. Combining it with
`build` stops immediately:

```text
build always runs the AZM check; --no-check is not supported with build.
```

`--deps` prints one stanza per cell, writers above readers, the same
report chapter 11 works through:

```text
program Demo
  DotX : state byte
    raised by: MoveRight
    triggers:  DrawDot (render)
  Right : pulse
    raised by: key KEY_6 (held)
    triggers:  MoveRight (logic)
```

## The four artifacts

A `build` of `demo.glim` leaves four files beside the source:

| File | Holds |
|---|---|
| `demo.main.asm` | The generated assembly program: your block bodies wrapped in the runtime - loop, dispatch, change flags, profile library - as one readable file. The other three files are derived from this one. |
| `demo.main.hex` | The assembled bytes as Intel HEX records, the transfer format for loading onto hardware. |
| `demo.main.bin` | The same bytes as a raw binary image, starting at the origin. |
| `demo.main.d8.json` | The Debug80 map: address segments attributed to source files, the symbol table (`DotX`, `Glim_MoveRight`, every label with its address), and a generator record naming the assembler version and inputs. |

The map's file list names both sources: `demo.main.asm` for the
generated glue and `demo.glim` for the block bodies. The eleven
"block segments" in the build message are the address ranges that
point back into the `.glim` file.

## Debug80 targets

Debug80 finds Glimmer programs two ways.

**By convention.** A file named `main.glim`, or ending in
`.main.glim`, whose first declaration is `program`, is discovered as
a target - click Run and Debug80 builds it through Glimmer and runs
the result. Part files open with their own declarations (`effect`,
`state`), so the `program` check keeps them out of the target list.

**By explicit entry.** A `debug80.json` target names any `.glim`
file directly by pointing `sourceFile` at it. The Glimmer
repository's own project file carries this entry for Tetro, trimmed
here to the shape that matters:

```json
{
  "targets": {
    "tetro-glim": {
      "outputDir": "build",
      "platform": "tec1g",
      "profile": "mon3",
      "sourceFile": "examples/tetro.glim",
      "artifactBase": "tetro",
      "sourceRoots": ["examples"]
    }
  }
}
```

`sourceFile` ending in `.glim` is what routes the build through
Glimmer; the artifacts land in `outputDir` under `artifactBase`
names. The full entry in the repository adds a `tec1g` section
mapping the memory regions (ROM to `$07FF`, RAM to `$7FFF`, ROM from
`$C000`) and the `$4000` application start.

## Where the debugger stops

The rewritten map splits the program along the `begin`/`end`
boundary:

| Code | Steps in |
|---|---|
| Block bodies (`begin` to `end`) | The `.glim` file. Breakpoints on body lines resolve; stepping walks your source line by line. |
| Generated glue (dispatch, wrappers, timers, profile library) | The `.main.asm` file. Stepping into a `call FbPlot` or past an `end` drops into readable generated assembly. |

Build errors follow the same split. A bad instruction inside a body
is reported against the `.glim` line it sits on, at column
precision:

```text
badbody.glim:17:5: [AZMN_PARSE] error: inc expects one operand
```

Line 17 is the `inc a,b` inside the block body, in the file you
edit, so the fix is one keystroke away from the report.

## Diagnostics

Compiler messages carry a file, a line, a `[GLIM]` tag and a
severity. An error stops the build and nothing is written; a warning
prints and the build finishes. Each message below is the real output
of a real broken program.

**Duplicate name.** Two declarations named `Score` - states, pulses
and blocks all draw from one pool of names:

```text
dup.glim:7: [GLIM] error: Duplicate name "Score": all declared names share one namespace.
```

**Reserved name.** A state named `GlimScore` collides with the
generated runtime's namespace:

```text
reserved.glim:6: [GLIM] error: Reserved name "GlimScore": it belongs to the generated runtime (states cannot use Glim*/Snd_*/Curve_*/Shape_*/CHG_* or runtime symbols).
```

**Undeclared cell.** A block triggers `on Points` with no `Points`
anywhere in the program - a typo for `Score`, caught at the header:

```text
undeclared.glim:8: [GLIM] error: Effect DrawScore triggers on undeclared cell "Points".
```

**Render with updates.** A render block declares `updates Score`,
claiming a write that the phase forbids:

```text
renderupd.glim:8: [GLIM] error: render DrawScore cannot update state cells: render blocks depict state. Use effect or compute.
```

**Missing program declaration.** A file of declarations with no
`program` line at the top; the message carries the file alone, since
the gap has no line to point at:

```text
noprog.glim: [GLIM] error: Missing program declaration.
```

**Missing updates (warning).** An effect stores to `Score` while its
header declares no `updates Score`. The build finishes - both
`Wrote` lines follow the warning - and the program runs with the
consequence the message spells out:

```text
warn.glim:12: [GLIM] warning: AddPoint writes Score but does not declare "updates Score": the change flag will not be raised and dependent blocks will not run.
Wrote warn.main.asm (register contracts checked by AZM)
Wrote warn.main.d8.json (4 block segments attributed to .glim source)
```

Chapter 11 walks this warning through a running program: the store
executes, the cell climbs in memory, and every block waiting `on`
that cell sleeps through it.

---

[← Appendix C](appendix-c-tms9918-profile.md) | [Book](index.md) | [Appendix E →](appendix-e-azm-touchpoints.md)
