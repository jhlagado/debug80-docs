---
layout: default
title: "Chapter 8 — Diagnostics and Output"
parent: "AZM Book 0 — Assembler Manual"
nav_order: 8
---
[← Ops, Aliases and Source Composition](07-ops-aliases.md) | [Manual](index.md) | [Appendix A — Directive Reference →](appendix-a-directives.md)

# Chapter 8 — Diagnostics and Output

---

## Diagnostic format

AZM prints diagnostics with file name, line number, column, severity and a diagnostic ID:

```
program.asm:14:5: error AZMN_PARSE: immediate value 300 out of range 0..255
program.asm:23:1: error AZMN_SYMBOL: duplicate symbol COUNT
program.asm:31:8: warning AZMN_REGISTER_CARE: DE is live across CALL CHECK_FOO, but CHECK_FOO may modify D,E
```

The diagnostic ID — `AZMN_PARSE`, `AZMN_SYMBOL` and so on — is the stable part. Message wording may change between AZM versions; the code stays the same. If you script against AZM output, match on the code rather than the message text.

A non-zero exit code means assembly failed. Output artifacts are written only for successful assemblies.

---

## Reading a failing build

When a build fails, the diagnostic gives you the file, the line, the column and the problem. A single concrete example shows the pattern.

A loop branches forward around a handler block. The handler starts small, but grows. At 140 bytes between the `jr` and its target:

```asm
        .org $0100

ScanLoop:
        ld   a,(hl)
        cp   SENTINEL
        jr   nz,SkipHandler

        ; ... handler code, 140 bytes ...

SkipHandler:
        inc  hl
        djnz ScanLoop
```

Running `azm scan.asm` stops immediately:

```
scan.asm:6:9: error AZMN_PARSE: branch offset 140 out of range -128..127
```

Read it left-to-right: `scan.asm` is the source file; `6` is the line; `9` is the column, pointing at the `jr nz`. The severity `error` means no binary was written. `AZMN_PARSE` is the code. The message names the actual value (140) and the allowed range (−128 to 127).

A `jr` encodes a signed 8-bit offset: maximum forward reach is 127 bytes. The fix is one line:

```asm
        jp   nz,SkipHandler    ; jp carries a 16-bit target address
```

Reassemble. Exit code is 0.

---

## Warnings vs errors

AZM exits 0 when assembly succeeds — no parse errors, no semantic errors, no range errors and no register contract errors in `error` or `strict` mode.

AZM exits non-zero (1) when any error occurs:

- A parse error: source line cannot be recognized
- A semantic error: unknown symbol, duplicate symbol, type error
- A range error: value does not fit the encoding slot
- A register contract error in `--rc error` or `--rc strict` mode
- An artifact-writing failure: output path not writable

Warnings (including register contract warnings in `--rc warn` mode) do not affect the exit code.

---

## Output formats

A single assembly run can produce several output files. All are written to the same base path as the source by default; the primary output can be redirected with `--output`.

### Flat binary (`.bin`)

The flat binary contains the assembled bytes in address order. The file starts at the lowest assembled address and runs to the last assembled byte.

```sh
azm --type bin program.asm
azm --type bin --output build/program.bin program.asm
```

When two `.org` directives have a gap between them, the binary fills the gap with zero bytes. Use `.binfrom` / `.binto` to trim the binary to a relevant range:

```asm
        .binfrom $0100
        ; ... code ...
        .binto $0200
```

A `.ds` block at the very end of a source file does not extend the binary. The binary is cropped at the last byte of real content.

### Intel HEX (`.hex`)

Intel HEX records contain the same bytes as the binary, organized as text records with address fields and checksums. HEX is the standard format for serial bootloaders, EPROM programmers and most Z80 development boards.

```sh
azm --type hex program.asm
```

HEX handles gaps naturally: records are emitted only for address ranges that contain assembled bytes. The default primary output type is `hex`.

### Debug80 map (`.d8.json`)

The `.d8.json` file is a JSON metadata file that Debug80 reads to correlate binary addresses with source lines. It records source paths, address ranges, listing rows, and symbols. The producer/consumer format is documented in the [Debug80 source map format reference](../../debug80-book/book1/appendices/c-project-configuration.md#source-map-format).

```sh
azm --source-root . --output build/program.hex src/program.asm
```

With `--source-root`, file paths in the map are written relative to the given root, making the map portable across machines. Suppress with `--nod8m` when not using Debug80.

### Suppression flags

Any artifact can be suppressed independently:

```sh
azm --nod8m               # no .d8.json
azm --nobin               # no .bin
azm --nohex               # no .hex
```

Example — binary only:

```sh
azm --type bin --nohex --nod8m --output out.bin program.asm
```

### Register contract artifacts

Register contracts are normally read through compiler diagnostics from `--rc warn`, `--rc error` and `--rc strict`. Two optional artifacts require at minimum `--rc audit`:

**`.regcontracts.txt` (register contract report):**

```sh
azm --rc audit --reg-report program.asm
```

Writes `program.regcontracts.txt`, listing declared routines with inferred inputs, outputs and clobbers. Use it for debugging, CI evidence or an audit session.

**`.asmi` (inferred register contract interface):**

```sh
azm --rc audit --reg-interface program.asm
```

Writes `program.asmi` with inferred `extern` contract records. Other projects that call into your code can load this file with `--interface`.

### Lowered ASM80 source (`.z80`)

```sh
azm --asm80 program.asm
```

Writes a `.z80` file with AZM-specific features translated to plain ASM80 syntax. Useful for verifying AZM produces byte-identical output to ASM80 or for sharing source with a collaborator who only has ASM80. Treat it as a generated verification aid rather than a primary output.

ASM80-compatible lowered output does not currently support `.import`. If a program uses `.import` and you request `--asm80`, AZM reports an `AZMN_ASM80` diagnostic instead of flattening the import boundary.

---

[← Ops, Aliases and Source Composition](07-ops-aliases.md) | [Manual](index.md) | [Appendix A — Directive Reference →](appendix-a-directives.md)
