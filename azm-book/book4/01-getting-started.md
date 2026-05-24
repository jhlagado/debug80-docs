---
layout: default
title: "Chapter 1 — Getting Started with AZM"
parent: "AZM Assembler Manual"
grand_parent: "AZM Books"
nav_order: 1
---
[← Preface](00-preface.md) | [Manual](index.md) | [Source Syntax and Symbols →](02-source-syntax.md)

# Chapter 1 — Getting Started with AZM

AZM is a Z80 assembler written in Node.js. You write `.asm` source files; AZM turns them into machine code, a listing, Debug80 metadata, and Intel HEX — all in a single run. This chapter covers what the tool is, what a small complete program looks like, and how to invoke AZM from the command line.

---

## What AZM is

AZM is a Z80 assembler. You write `.asm` or `.z80` source files; AZM turns them into machine code. Every instruction in your source becomes bytes in the output. Nothing is hidden.

That last sentence is the design principle that separates AZM from a compiler: when you write `LD A,42`, the assembled binary contains the two bytes for that load. When you write `CALL DRAW_SPRITE`, those three bytes appear exactly where you put them. AZM adds no preamble, no generated frame, no implicit register saves. What you write is what you get.

### The feature map

Beyond bare assembly, AZM adds a small set of compile-time tools:

**Compile-time layout constants.** You can describe memory layout with `.type` / `.endtype` record blocks and `.union` / `.endunion` overlay blocks. `sizeof(Type)` gives the exact packed byte count; `offset(Type, field)` gives a field's byte offset from the start of the record. These fold at assemble time and feed ordinary operands — they never generate hidden indexing code.

**Enums.** `enum Mode Read, Write, Append` creates three named integer constants accessible as `Mode.Read`, `Mode.Write`, and `Mode.Append`. They are valid anywhere an immediate expression is valid. Unqualified references like `Read` alone are rejected.

**Register-care analysis.** AZM can infer register and flag effects over subroutine bodies and warn when a call site puts a live value at risk. The `--rc` family of flags controls whether that analysis is silent, informational, a warning, or a build failure.

**AZMDoc contract comments.** `;!` comment lines carry machine-readable register contracts — which registers a subroutine reads, which it returns in, which it clobbers. Tools use these for analysis; older assemblers see ordinary comments. The format does not change the bytes AZM emits.

**Op declarations.** `op name(params) ... end` declares a reusable instruction idiom that expands inline at every call site. Ops are parsed and matched by the assembler, not treated as text substitution. The expansion is visible in listings.

**Directive aliases.** AZM recognises the canonical dotted directive set (`.db`, `.dw`, `.ds`, `.org`, `.equ`, and so on) but also accepts the undotted forms (`DB`, `DW`, `DS`, `ORG`, `EQU`) through a built-in alias layer. Project-specific aliases for `DEFB`, `DEFW`, `RMB`, and similar spellings can be loaded from a JSON file.

**Multiple output formats.** A single assembly run produces any combination of: Intel HEX (`.hex`), flat binary (`.bin`), listing (`.lst`), and Debug80 map (`.d8.json`). The ASM80-compatible lowered source (`.z80`) is a separate beta output covered in Chapter 8.

### The Debug80 connection

Debug80 is the companion debugging tool for this toolchain. It uses the `.d8.json` metadata file that AZM emits alongside each binary — a map of addresses, symbols, and source line positions that Debug80 reads to display source-correlated debug information. When Debug80 assembles a file, it calls AZM. When you run AZM from the command line, the `.d8.json` file is ready for Debug80 to consume.

### Source file extensions

AZM accepts both `.asm` and `.z80` source extensions and parses them identically. Within the Debug80 toolchain, `.z80` files carry a specific meaning: Debug80 treats them as entry points or assembly targets. For new source outside that toolchain context, `.asm` is the conventional choice.

`.asmi` files are register-care interface files, not source. They carry external contract records for library routines whose source is not assembled alongside your program. They are loaded with `--interface`, never with a bare entry path. The format is covered in Chapter 6.

---

## A First AZM Program

Here is a small but complete AZM source file:

```asm
; counter.asm — increment a counter eight times

        .org $0100

LIMIT   .equ 8

@main:
        ld      b,LIMIT
        ld      hl,counter
Loop:
        inc     (hl)
        djnz    Loop
        halt

counter:
        .db 0
```

Every AZM concept appears in those fifteen lines.

### `.org` — setting the assembly address

```asm
        .org $0100
```

`.org` sets the assembly address: AZM places the next byte at `$0100` in the output image, and labels get addresses from there. Without `.org`, assembly starts at address 0. Most programs need at least one `.org` to place code where the hardware expects it.

A source file can contain multiple `.org` directives to place different sections at different addresses. Each one resets the assembly counter. Chapter 3 covers gaps, address arithmetic, and multi-origin programs in full.

### Constants with `.equ`

```asm
LIMIT   .equ 8
```

`.equ` binds a name to a constant value. `LIMIT` becomes the number 8 everywhere it appears in expressions, instructions, and data. The name is case-sensitive: `LIMIT`, `Limit`, and `limit` are three different symbols.

`.equ` emits nothing. Chapter 3 covers constants in full, including hardware port addresses, size derivations, and re-definition rules.

### Labels

```asm
@main:
```

`@main:` is a routine entry label. The `@` prefix tells AZM's register-care analyzer that `main` is an explicit routine boundary — the callable name is `main`, without the `@`. Call sites write `call main`. The `@` is optional; a plain `main:` assembles identically. Using `@` is worthwhile when you want register-care analysis, because a file that has any `@` labels uses them as the authoritative source of routine boundaries rather than a plain-label heuristic.

```asm
Loop:
```

`Loop:` is a plain label used as a branch target. It names the address of `inc (hl)` so `djnz Loop` can refer back to it. Plain labels and entry labels are the two label forms in AZM — Chapter 2 covers both in full, including forward references and how `@` affects register-care analysis.

```asm
counter:
```

`counter` is a plain label naming a data address so instructions can reference it as `hl,counter` or `(counter)`.

### Instructions

```asm
        ld      b,LIMIT
        ld      hl,counter
Loop:
        inc     (hl)
        djnz    Loop
        halt
```

Instructions are Z80 mnemonics. AZM accepts the full Z80 instruction set. Operands can be registers, immediates, expressions, or labels. `LIMIT` expands to 8 at assemble time; `counter` expands to the address of the `counter` label.

Indentation before the instruction is conventional but not required. AZM accepts any amount of leading whitespace.

### Data directives

```asm
counter:
        .db 0
```

`.db` emits one or more bytes into the output image. `counter` labels the address where those bytes land. After `.db 0`, the byte at `counter` is zero, and `counter + 1` is the next byte. Chapter 4 covers `.db`, `.dw`, string forms, and data tables.

### Comments

```asm
; counter.asm — increment a counter eight times
```

Semicolons introduce comments that run to the end of the line. AZM ignores comment text during assembly. One exception: `;!` lines carry AZMDoc register contracts — those are read by the register-care analyzer. Chapter 6 covers AZMDoc.

### Reading the listing

After running `azm counter.asm`, AZM writes `counter.lst` alongside the source. The listing looks like this:

```
0100            1           .org $0100
                2
0100            3   LIMIT   .equ 8
                4
0100            5   @main:
0100 06 08      6           ld      b,LIMIT
0102 21 XX XX   7           ld      hl,counter
0105            8   Loop:
0105 34         9           inc     (hl)
0106 10 FD     10           djnz    Loop
0108 76        11           halt
                12
0109            13  counter:
0109 00        14          .db 0
```

The columns are: address (hex), emitted bytes (hex), source line number, source text. For `ld hl,counter`, the bytes `XX XX` show as the resolved address of `counter` at `$0109` — little-endian, low byte first: `09 01`. The listing is the best tool for verifying that code landed where you intended.

Suppress the listing with `--nolist`:

```sh
azm --nolist counter.asm
```

---

## Running AZM

### Installing AZM

AZM requires Node.js 20 or later. Install it globally:

```sh
npm install -g @jhlagado/azm
```

Verify the installation:

```sh
azm --version
```

From a source checkout, build and run the local CLI without installing globally:

```sh
npm ci
npm run build
npm run azm -- examples/hello.asm
```

### Basic invocation

The entry file is always the last argument:

```sh
azm program.asm
```

By default, AZM writes four output files next to the source:

| File | Contents |
|------|----------|
| `program.hex` | Intel HEX |
| `program.bin` | Flat binary |
| `program.lst` | Assembly listing with bytes and symbols |
| `program.d8.json` | Debug80 source map |

All four are the default artifact set; every AZM run produces at least some output.

### Output type and path

Set the primary output type and path explicitly:

```sh
azm --type bin --output build/program.bin program.asm
azm --type hex --output build/program.hex program.asm
```

The `--output` file extension must match `--type`. AZM reports an error if they disagree.

Short forms:

```sh
azm -t bin -o build/program.bin program.asm
```

### Suppressing artifacts

The `--no*` flags suppress individual output files:

```sh
azm --nolist program.asm          # skip .lst
azm --nod8m program.asm           # skip .d8.json
azm --nobin program.asm           # skip .bin
azm --nohex program.asm           # skip .hex
azm --nolist --nod8m program.asm  # skip both
```

Use these when you only want one artifact. For example, to generate only a binary for loading into hardware:

```sh
azm --type bin --nohex --nolist --nod8m --output out.bin program.asm
```

### Include search paths

When your source uses `.include "file"` and the included files are in directories other than the source file's directory, add search paths with `-I`:

```sh
azm -I include -I vendor program.asm
azm -I include program.asm        # short form
```

Paths are searched in the order they are listed, after the source file's own directory.

### Debug80 source maps

The `.d8.json` file embeds the source paths that Debug80 uses to correlate addresses with source lines. When your project has a build directory separate from your source directory, normalize the paths:

```sh
azm --source-root . --output build/program.hex src/program.asm
```

`--source-root` makes Debug80 source paths relative to the given directory with `/` separators. Without it, absolute paths go into the map, which breaks portability.

### Case-style linting

AZM can enforce consistent opcode and register case across a source file:

```sh
azm --case-style upper program.asm    # require LD A,B not ld a,b
azm --case-style lower program.asm    # require ld a,b not LD A,B
azm --case-style consistent program.asm  # all must match, either case
azm --case-style off program.asm      # no enforcement (default)
```

AZM accepts mixed case in all modes. The style flag is a lint pass, not a parse restriction — mismatches produce diagnostics but do not prevent assembly.

### Register-care analysis

The `--rc` flag enables register-care checking. Five modes exist:

| Mode | Effect |
|------|--------|
| `off` | No analysis (default) |
| `audit` | Infer contracts, write `.regcare.txt`, no diagnostics |
| `warn` | Report conflicts as warnings |
| `error` | Report conflicts as build errors |
| `strict` | Error on any unresolved contract |

Common workflows:

```sh
# Audit without affecting build success:
azm --rc audit --reg-report program.asm

# Warn on register conflicts during development:
azm --rc warn program.asm

# Treat conflicts as build failures in CI:
azm --rc error program.asm
```

#### Emitting register-care reports and contracts

```sh
azm --rc audit --reg-report program.asm
```

Writes `program.regcare.txt` alongside the binary. The report lists inferred register contracts for each routine.

```sh
azm --contracts --rc audit program.asm
```

Annotates your source file in place with inferred `;!` contract blocks. AZM replaces any existing generated block while leaving your prose comments untouched.

```sh
azm --reg-interface program.asm
```

Writes `program.asmi` — an external interface file with inferred contracts for all routines. Other programs can load this with `--interface`.

```sh
azm --fix --rc warn program.asm
```

Applies conservative source fixes: adding `push`/`pop` where a conflict is clear. AZM will not silently rewrite source that it cannot prove safe.

#### Loading external contracts

For platform routines whose source is not part of your build:

```sh
azm --rc error --interface mon3.asmi program.asm
```

`.asmi` files carry extern contract records (format covered in Chapter 6). AZM loads them before analysis.

#### Register-care profiles

```sh
azm --reg-profile mon3 program.asm
```

The `mon3` profile registers known MON3 RST service effects so the analyzer can reason about them without `.asmi` entries.

#### Accept-out promotion

```sh
azm --accept-out NORMALISE_COORD:DE program.asm
```

Promotes an inferred output candidate — tells the analyzer that `DE` is an intentional output of `NORMALISE_COORD`, not a clobber — while annotating the source.

### Directive aliases

```sh
azm --aliases project.aliases.json program.asm
```

Loads project-specific directive alias mappings, for example mapping `DEFB` to `.db`. The flag is repeatable:

```sh
azm --aliases base.aliases.json --aliases local.aliases.json program.asm
```

Chapter 7 covers the alias file format.

### ASM80-compatible lowered source

```sh
azm --asm80 program.asm
```

Writes `program.z80` — a lowered version of the source with AZM features translated to plain ASM80 syntax. This output is in beta: coverage is growing but does not yet cover all ISA forms or full programs. The `AZMN_ASM80` diagnostic marks unsupported lowering. Prefer binary and `.d8.json` for production workflows.

### Exit status

AZM exits non-zero when any parse error, semantic error, range error, register-care error (in `error` or `strict` mode), or artifact-writing failure occurs. Diagnostics include the file name, line number, column, severity, and a diagnostic ID where available.

### How Debug80 invokes AZM

Debug80 calls AZM internally when assembling an open source file. It passes `--source-root` and `--output` with paths relative to the project root, producing a `.d8.json` alongside the binary. You do not need to invoke AZM separately to use Debug80. The CLI is for command-line builds, CI pipelines, and projects that run outside the Debug80 IDE.

---

[← Preface](00-preface.md) | [Manual](index.md) | [Source Syntax and Symbols →](02-source-syntax.md)
