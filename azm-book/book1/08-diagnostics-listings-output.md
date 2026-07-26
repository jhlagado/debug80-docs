---
layout: default
title: "Diagnostics and Output"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 8
---
[← Ops, Aliases and Source Composition](07-ops-aliases.md) | [Manual](index.md) | [Appendix A — Directive Reference →](appendix-a-directives.md)

# Chapter 8 — Diagnostics and Output

AZM prints diagnostics before it returns. A successful assembly writes the enabled output artifacts and exits 0. An assembly error prevents successful program outputs such as `.bin` and `.hex`, although a requested register-contract report or source annotation may still be written to help resolve the failure.

---

## Diagnostic format

AZM prints diagnostics with file name, line number, column, severity and a diagnostic ID:

```
program.asm:14:5: error: [AZMN_SYMBOL] 8-bit value out of range: 300.
program.asm:23:1: error: [AZMN_SYMBOL] duplicate symbol: COUNT
program.asm:31:8: warning: [AZMN_REGISTER_CONTRACTS] CALL CHECK_FOO may modify D,E, but the pre-call value is used later.
```

The diagnostic ID (`AZMN_PARSE`, `AZMN_SYMBOL` and so on) is the stable part. Scripts that consume AZM output should match the code rather than the message text.

![The six fields of a diagnostic, and the one worth matching on](../../assets/images/azm-book/book1/diagnostic-line.svg)

---

## Reading a failing build

A loop branches forward around a handler block. At 140 bytes between the `jr` and its target:

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
scan.asm:6:9: error: [AZMN_SYMBOL] jr nz target out of range for rel8 branch (140, expected -128..127).
```

The column, `9`, points at the `jr nz` rather than its operand.

A `jr` encodes a signed 8-bit offset: maximum forward reach is 127 bytes. The fix is one line:

```asm
        jp   nz,SkipHandler    ; jp carries a 16-bit target address
```

---

## Warnings vs errors

AZM exits 0 when assembly succeeds: no parse errors, no semantic errors, no range errors and no register contract errors in `error` or `strict` mode.

AZM exits 1 when assembly produces an error diagnostic:

- A parse error: source line cannot be recognized
- A semantic error: unknown symbol, duplicate symbol, type error
- A range error: value does not fit the encoding slot
- A register contract error in `--rc error` or `--rc strict` mode
Warnings (including register contract warnings in `--rc warn` mode) do not affect the exit code.

Invalid command-line arguments and uncaught artifact-writing failures exit 2 and print the command usage. Source-reading failures are reported as source diagnostics and exit 1.

---

## Output formats

A single assembly run can produce several output files. By default, all use the source file's base path. `--output` selects a new base path for every enabled artifact, and its extension must match the primary `--type`.

![The artifacts of one run, each suppressible on its own](../../assets/images/azm-book/book2/assembler-outputs.svg)

### Flat binary (`.bin`)

The flat binary contains the assembled bytes in address order. The file starts at the lowest assembled address and runs to the last assembled byte.

```sh
azm --type bin program.asm
azm --type bin --output build/program.bin program.asm
```

When two `.org` directives have a gap between them, the binary fills the gap with zero bytes. `.binfrom` and `.binto` trim the binary to a relevant range:

```asm
        .binfrom $0100
        ; ... code ...
        .binto $0200
```

An unfilled `.ds` block at the very end of a source file does not extend the binary. A `.ds count,fill` block writes the fill byte and therefore does extend it.

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

With `--source-root`, file paths in the map are written relative to the given root, making the map portable across machines. The `--nod8m` option suppresses the map when Debug80 is not in use.

### Assembler listing (`.lst`)

The listing shows every source line next to the address and bytes it assembled to, in the classic asm80 layout.

```
                            .org $8000

                    COUNT   .equ 3

                    main:
8000   06 03                ld   b,COUNT        ; loop counter
                    loop:
8002   78                   ld   a,b
8003   D3 01                out  ($01),a
8005   10 FB                djnz loop
8007   76                   halt

                    message:
8008   48 45 4C 4C 4F 00          .db  "HELLO",0
                    buffer:
800E                        .ds  4

COUNT       0003
buffer      800E
loop        8002
main        8000
message     8008
```

Reading a row: the four hex digits on the left are the address, the byte tokens after them are the emitted machine code and the source line follows. Lines that emit nothing (blank lines, comments, `.equ` definitions, labels on their own line) appear with an empty gutter. An unfilled `.ds` reservation prints its address but no bytes. A line that emits more than eight bytes wraps: the first eight appear beside the source text and the rest continue on further address-and-bytes rows below it, with the source column left blank.

![A listing row is an address, the bytes it emitted and the source line that produced them](../../assets/images/azm-book/book1/listing-line.svg)

Included and imported files are listed inline at their inclusion point, so the listing reads in the same order the assembler consumed the program. After the last source line comes a symbol table: every label and constant with its value, sorted by name.

The listing is written by default. The `--nolst` option suppresses it.

### Suppression flags

Any artifact can be suppressed independently:

```sh
azm --nod8m               # no .d8.json
azm --nobin               # no .bin
azm --nohex               # no .hex
azm --nolst               # no .lst
```

Example (binary only):

```sh
azm --type bin --nohex --nod8m --output out.bin program.asm
```

### Register contract artifacts

Register contracts are normally read through compiler diagnostics from `--rc warn`, `--rc error` and `--rc strict`. The artifact flags below run the analysis on their own, so they work at the default `--rc off`, except `--reg-report`, which needs at least `--rc audit` before the report has any routines to list:

**`.regcontracts.txt` (register contract report):**

```sh
azm --rc audit --reg-report program.asm
```

Writes `program.regcontracts.txt`, listing declared routines with inferred inputs, outputs, clobbers and findings. The `--reg-report-format json` option supplies structured findings to other tools:

```sh
azm --rc audit --reg-report --reg-report-format json program.asm
```

JSON reports can be used as baselines:

```sh
azm --rc audit --reg-baseline baseline.regcontracts.json --reg-ratchet program.asm
```

Ratchet mode fails when current register-contract findings are new or changed relative to the baseline.

**`.asmi` (inferred register contract interface):**

```sh
azm --rc audit --reg-interface program.asm
```

Writes `program.asmi` with inferred `extern` contract records. Other projects that call into the code can load this file with `--interface`.

### Lowered ASM80 source (`.z80`)

```sh
azm --asm80 program.asm
```

Writes a `.z80` file with AZM-specific features translated to plain ASM80 syntax. Useful for verifying AZM produces byte-identical output to ASM80 or for sharing source with a collaborator who only has ASM80.

ASM80-compatible lowered output does not currently support `.import`. If a program uses `.import` and you request `--asm80`, AZM reports an `AZMN_ASM80` diagnostic instead of flattening the import boundary.

---

[← Ops, Aliases and Source Composition](07-ops-aliases.md) | [Manual](index.md) | [Appendix A — Directive Reference →](appendix-a-directives.md)
