---
layout: default
title: "Chapter 8 — Diagnostics, Listings, and Output"
parent: "AZM Assembler Manual"
grand_parent: "AZM Books"
nav_order: 8
---
[← Op Declarations and Aliases](07-ops-aliases.md) | [Manual](index.md) | [Porting, Style, and Reference →](09-porting-style-reference.md)

# Chapter 8 — Diagnostics, Listings, and Output

This chapter covers what AZM produces and what it reports when something goes wrong. Diagnostics name errors and warnings with file, line, and a stable code. Listings show each source line paired with its assembled bytes and address. Output formats range from flat binary and Intel HEX to Debug80 source maps and register-care reports.

---

## Diagnostics and error handling

AZM prints diagnostics with file name, line number, column, severity, and a diagnostic ID. A non-zero exit code means something went wrong. The listing and binary are not written when errors occur.

Diagnostic format:

```
program.asm:14:5: error AZMN_PARSE: immediate value 300 out of range 0..255
program.asm:23:1: error AZMN_SYMBOL: duplicate symbol COUNT
program.asm:31:8: warning AZMN_REGISTER_CARE: DE is live across CALL CHECK_FOO, but CHECK_FOO may modify D,E
```

### Parse errors

Parse errors occur when a source line cannot be recognized as a valid label, instruction, directive, or comment.

**Unknown directive:**

```asm
.macro FOO    ; error: .macro is not an AZM directive
```

AZM does not support text macros. A directive alias file handles simple spelling differences such as `DEFB` to `.db`, but it cannot implement `.macro` / `.endm` — aliases only rename directive heads, not syntax or expansion behavior. Rewrite macros as AZM `op` declarations where they are instruction idioms, or pre-process the source before assembling.

**Malformed operand:**

```asm
ld   a,        ; error: missing operand after comma
db   ,0        ; error: missing expression before comma
```

**Unrecognized instruction:**

```asm
mov  a,b      ; error: MOV is not a Z80 mnemonic — use LD
```

### Unknown labels and symbols

```asm
ld   hl,MY_TABLE     ; error if MY_TABLE is never defined
call UNDEFINED_SUB   ; error: unknown symbol
```

Forward references are resolved on the second pass. If a symbol is still undefined after both passes, it is a genuine error.

### Duplicate symbols

A label or `.equ` name defined more than once in the same translation unit:

```asm
COUNT: .db 0
COUNT: .db 0    ; error AZMN_SYMBOL
```

Includes the file name and line number of both definitions. Fix by renaming one of them.

### Range errors

An expression value that does not fit the encoding slot:

```asm
ld   a,300          ; error: 300 > 255, out of range for ld a,n
bit  9,a            ; error: bit index 9 out of range 0..7
jr   Target         ; error: branch offset > 127 (use jp instead)
```

The diagnostic names the value, the context, and the allowed range. For branch range errors, check whether `jr` should be `jp`.

### Layout type errors

**Unknown type:**

```asm
.ds UnknownType     ; error: UnknownType is not defined
sizeof(BadName)     ; error: BadName is not a defined layout type
```

**Unknown field:**

```asm
offset(Sprite, missing_field)  ; error: Sprite has no field 'missing_field'
```

**Runtime index in layout cast:**

```asm
ld   hl,<Sprite[16]>TABLE[HL].flags  ; error: HL is not a constant
```

### Op overload failures

```
error AZMN_PARSE: no overload of 'load8' matches operands (HL, imm8)
```

AZM reports a parse-level diagnostic at the relevant source location for op errors — no-match, ambiguous overload, arity mismatch, or expansion cycle. Check that the operand classes in your op declaration match the operands at the call site.

### Register-care diagnostics

When `--rc warn` or `--rc error` is active:

```
warning AZMN_REGISTER_CARE: B is live across CALL DRAW_FRAME at program.asm:47:9,
  but DRAW_FRAME may modify B (inferred clobbers: A,B,DE)
```

The diagnostic names the live register, the call site, and the callee's inferred clobber set. Three options to resolve:
1. Save B around the call: `push bc / ... / pop bc`
2. Restructure code so B is not live across the call
3. Add a callee contract if DRAW_FRAME does actually preserve B

### Reducing a failing source file

When a diagnostic is unclear, isolate the problem by removing code until the error disappears. The minimum failing case is usually smaller than the full program. Common steps:
1. Comment out includes one at a time to find which file introduced the symbol
2. Replace complex expressions with literal numbers to see whether the expression or the context is wrong
3. Use `--nolist --nod8m --nobin` to reduce the output surface and focus on the one error

### Exit codes

AZM exits 0 when assembly succeeds — no parse errors, no semantic errors, no range errors, and no register-care errors in `error` or `strict` mode. All requested artifacts are written.

AZM exits non-zero (1) when any of the following occur:
- A parse error: source line cannot be recognized
- A semantic error: unknown symbol, duplicate symbol, type error
- A range error: value does not fit the encoding slot
- A register-care error in `--rc error` or `--rc strict` mode
- An artifact-writing failure: output path not writable

Warnings (including register-care warnings in `--rc warn` mode) do not affect the exit code.

For CI pipelines, use `--rc error` to catch register-care conflicts as build failures:

```sh
azm --rc error program.asm || exit 1
```

### AZMN diagnostic codes

Diagnostics carry a code of the form `AZMN_*` for programmatic identification. Diagnostic codes are stable enough for tooling integration; message wording may change between AZM versions. Do not script against full message text. Known codes:

| Code | Trigger |
|------|---------|
| `AZMN_PARSE` | Parse error: unrecognized line, malformed operand, range overflow, op overload failure, or any other syntax-level problem |
| `AZMN_SYMBOL` | Symbol error: label or `.equ` name defined more than once, or referenced but never defined after all passes |
| `AZMN_REGISTER_CARE` | Register-care conflict: a live pre-call value may be destroyed by the callee |
| `AZMN_CASE_STYLE` | Case-style lint violation (requires `--case-style`) |
| `AZMN_ASM80` | Feature cannot be lowered to ASM80 syntax in `--asm80` mode |
| `AZMN_SOURCE` | Source file error: file not found, unreadable, or include cycle |

The diagnostic code appears after the severity in the output:

```
program.asm:14:5: error AZMN_PARSE: immediate value 300 out of range 0..255
```

When writing scripts that parse AZM output, match on the code rather than the message text — the code is stable across releases; the message wording may change.

---

## Listings and symbol visibility

### The listing file

AZM writes a `.lst` file by default alongside every assembly run. The listing shows each source line correlated with its assembly address and the bytes it emitted. It is the primary tool for verifying that code landed where you intended.

A typical listing excerpt:

```
0100              1         .org $0100
0100              2
0100 3E 2A        3 START:  ld    a,42
0102 32 08 01     4         ld    (RESULT),a
0105 76           5         halt
0106              6
0106 00           7 RESULT: .db   0
```

Columns:
1. **Address** — the assembly address at the start of this line (hex)
2. **Bytes** — the bytes emitted, low to high (hex); empty for directives that emit nothing
3. **Line number** — source file line number
4. **Source text** — the original source line, including labels and comments

For `ld (RESULT),a` at address `$0102`, the bytes `32 08 01` represent the opcode ($32) and the address of `RESULT` ($0108) in little-endian order.

### Suppressing the listing

```sh
azm --nolist program.asm
```

When you only want a binary or HEX file and the listing is not needed, `--nolist` skips writing `.lst`. The listing is always generated in memory during assembly; `--nolist` only suppresses writing it to disk.

### Reading the listing for common tasks

**Verify an `.org` placement:**

The address column shows where assembly is occurring. If code that should start at `$0100` appears at `$0000`, an `.org` is missing or mis-placed.

**Check table size:**

```
0100 01           TABLE:  .db 1
0101 02                   .db 2
0102 03                   .db 3
0103              TABLE_END:
```

`TABLE_END - TABLE = 3` bytes. The listing confirms both addresses.

**Verify branch targets:**

```
010A 10 FA        djnz    Loop
```

The offset byte is `$FA = -6`. `Loop` is 6 bytes before the next instruction at `$010C`, so `Loop` is at `$0106`. Confirm that matches the address in the listing.

**Inspect expression results:**

Constants defined with `.equ` appear in the listing without a byte column but with the evaluated value visible at the address position:

```
                  LIMIT   .equ 8
```

Some versions of the listing may show the constant value in place of an address. Check your AZM version for the exact format.

### Symbol table in the listing

AZM includes a symbol table at the end of the listing file:

```
Symbols:
  LIMIT        = 8
  RESULT       = $0106
  START        = $0100
  TABLE        = $0200
  TABLE_END    = $0203
  TABLE_LEN    = $0003
```

Constants and addresses appear together, sorted alphabetically. This is useful for verifying that the linker placed things where you expected and for locating labels when the listing is long.

### There is no `--list` option

AZM generates the listing by default. There is no `--list` flag to enable it because listings are on unless you suppress them. The design assumption is that most assembly development benefits from a listing.

### Listing for includes

Lines from included files appear in the listing with the included file's path noted. When `main.asm` includes `sprites.asm`, the listing shows the source text from `sprites.asm` with its file annotated — the line numbers reset per file:

```
--- sprites.asm ---
0200              1 @DRAW_SPRITE:
0200 7E           2         ld   a,(hl)
```

When a label appears in the listing and you cannot identify which file it came from, search the listing for the file-change header above that address range.

Include-file line numbers count from 1 within each file. The address column is continuous — it reflects the assembly address regardless of which file contributed the line.

### Listing for ops

Op call sites expand inline in the listing. Each expanded instruction appears at its own address with its own bytes:

```
0110              1         clear_a          ; op invocation
0110 AF           2   xor  a                ; expanded instruction
```

The op invocation line may show the label and call text; the following lines show the expanded instructions. This makes it easy to count the bytes an op expansion contributes and verify the register effects match what you expected.

An op with multiple expanded instructions shows all of them:

```
012A              1         negate_a
012A 4F           2   ld   c,a
012B AF           3   xor  a
012C 91           4   sub  c
```

### Listing format notes

Wide byte sequences (instructions with multiple operand bytes) appear on a single listing line with all bytes in the byte column:

```
0102 32 08 01     4         ld   (RESULT),a
```

`ld (RESULT),a` emits three bytes — opcode `$32` plus the address `$0108` little-endian. All three appear on the same line.

The bytes column typically shows up to four bytes. For `.db` lines that emit many bytes, the listing may show the first several and continue on the next address line. When you need the exact byte count for a data block, trust the address arithmetic (`TABLE_END - TABLE_START`) rather than counting bytes in the listing.

---

## Output formats

AZM produces up to seven output artifacts from a single assembly run. All are written to the same base path as the source by default; the primary output can be redirected with `--output`.

### Flat binary (`.bin`)

The flat binary contains the assembled bytes in address order. The file starts at the lowest assembled address and runs to the last assembled byte.

```sh
azm --type bin program.asm
azm --type bin --output build/program.bin program.asm
```

**Gaps in the binary:** When two `.org` directives have a gap between them, the binary fills the gap with zero bytes. A source file that has code at `$0100` and storage at `$8000` produces a binary at least `$8001` bytes long, most of it zeros. Use `.binfrom` / `.binto` to trim the binary to the relevant range:

```asm
        .binfrom $0100
        ; ... code ...
        .binto $0200
```

The binary then contains only bytes between the two addresses.

**Trailing `.ds` trimming:** A `.ds` block at the very end of a source file, with no subsequent emitted bytes, does not extend the binary. The binary is cropped at the last byte of real content.

### Intel HEX (`.hex`)

Intel HEX records contain the same bytes as the binary, but organized as text records with address fields and checksums. HEX is the standard format for loading programs into hardware via serial bootloaders, EPROM programmers, and most Z80 development boards.

```sh
azm --type hex program.asm
azm --type hex --output build/program.hex program.asm
```

HEX handles gaps naturally: records are emitted only for address ranges that contain assembled bytes. A gap between two `.org` sections produces two separate groups of records, each starting at the correct address. No padding required.

The default primary output type is `hex`.

### Listing (`.lst`)

Described in full in the Listings section above. Enabled by default; suppressed with `--nolist`.

### Debug80 map (`.d8.json`)

The `.d8.json` file is a JSON metadata file that Debug80 reads to correlate binary addresses with source lines. It records:

- AZM as the generator with the package version
- The input source path
- The output binary path
- A map of addresses to source locations
- Symbol values (constants without fake addresses; labels with their address)

```sh
azm --source-root . --output build/program.hex src/program.asm
```

With `--source-root`, file paths in the map are written relative to the given root with `/` separators, making the map portable across machine boundaries.

Without `--source-root`, absolute paths go into the map. This works when the Debug80 session runs on the same machine as the build, but breaks when moving files.

Suppress with `--nod8m` when not using Debug80.

### Lowered ASM80 source (`.z80`)

```sh
azm --asm80 program.asm
```

Writes a `.z80` file alongside the other artifacts. The `.z80` file is a lowered version of the source with AZM-specific features translated to plain ASM80 syntax. The goal is a file that ASM80 can assemble and produce byte-identical output to the AZM run.

**What gets lowered:**

| AZM feature | ASM80 lowering |
|-------------|----------------|
| Enum members (`Mode.Read`) | Numeric literal |
| Layout casts (`<Sprite>TABLE.flags`) | Arithmetic expression |
| `sizeof(Type)` | Numeric literal |
| `offset(Type, field)` | Numeric literal |
| `.cstr "text"` | `.db "text",0` |
| `.pstr "text"` | `.db len,"text"` |
| `.istr "text"` | `.db bytes with last byte \| $80` |
| `op` call sites | Expanded instruction sequence |
| AZMDoc `;!` comments | Omitted (treated as comments) |
| `.type` / `.union` declarations | Omitted (no ASM80 equivalent) |

**Coverage:**

`--asm80` is a compatibility output. It is covered by the current asm80 fixture and parity gates, but treat it as a generated verification aid rather than the primary production artifact. Prefer AZM's `.bin`, `.hex`, `.lst`, and `.d8.json` outputs for normal workflows. If AZM reports `AZMN_ASM80`, the AZM binary output may still be valid while the lowered ASM80 artifact needs attention.

**The `AZMN_ASM80` diagnostic:**

The `AZMN_ASM80` diagnostic appears when a feature cannot be lowered to ASM80. It identifies the file, line, and the feature that blocked lowering:

```
program.asm:47:9: warning AZMN_ASM80: source construct cannot be lowered to ASM80-compatible form
```

Exact message wording varies by construct. The build continues with the lowered file incomplete for that feature. Treat it as a notice that the ASM80 artifact needs attention, not a build failure. The AZM binary output is still correct.

**Using the lowered source for verification:**

Open the `.z80` file alongside the original `.asm` to verify that AZM computed what you expected:

- Enum members should appear as the expected numeric literals (`Mode.Read` → `0`)
- Layout expressions should expand to the expected address constants
- Op call sites should expand to the expected instruction sequences

This is particularly useful when a layout calculation produces an unexpected result: the lowered source shows the folded constant directly.

**`--asm80` and register-care:**

AZMDoc `;!` lines are stripped in the lowered output — contracts do not survive into the `.z80` file. If the ASM80 workflow needs contract documentation, write it as ordinary prose `;` comments.

**When to use `--asm80`:**

- Migrating to AZM: verify AZM matches ASM80 before removing ASM80 from the build
- Debugging an AZM mismatch: the lowered source shows what AZM computed for layout expressions
- Sharing source with a collaborator who only has ASM80

### Register-care artifacts

Two additional artifacts require at minimum `--rc audit`:

**`.regcare.txt` (register-care report):**

```sh
azm --rc audit --reg-report program.asm
```

Writes `program.regcare.txt` alongside the binary. The report lists every `@`-labeled routine with its inferred register contract: inputs, outputs, and clobbers. Use this to audit what AZM inferred before committing to a contract or escalating to `--rc warn`.

**`.asmi` (inferred register-care interface):**

```sh
azm --rc audit --reg-interface program.asm
```

Writes `program.asmi` — an external interface file with `extern` contract records for every `@` routine. Other projects that call into your program can load this file with `--interface` without needing your source. The format is the same as hand-written `.asmi` files (see Chapter 6).

### Binary comparison workflow

To verify AZM produces byte-identical output to ASM80 for a given source file:

```sh
# Assemble with AZM
azm --type bin --output azm.bin program.asm

# Assemble with ASM80 (separate tool)
asm80 program.asm --format binary --out asm80.bin

# Compare
cmp azm.bin asm80.bin && echo "PASS" || echo "FAIL"
```

On macOS or Linux, `xxd azm.bin | diff - <(xxd asm80.bin)` shows byte-level differences when the binaries are not identical.

When they differ, compare the listing files from both assemblers to find the first address where they diverge. That address points to the source line responsible for the discrepancy.

### Choosing primary output type

The default primary output is HEX. Binary is the right choice when:
- Loading directly into a RAM-based system with a byte-for-byte loader
- Comparing output against a reference binary
- The target tool expects raw bytes, not HEX records

HEX is the right choice when:
- Using a serial bootloader or EPROM programmer
- Working with hardware that expects Intel HEX
- You want gap handling to be automatic

### Suppression flags

Any artifact can be suppressed independently:

```sh
azm --nolist              # no .lst
azm --nod8m               # no .d8.json
azm --nobin               # no .bin
azm --nohex               # no .hex
```

Example — binary only, no listing, no map:

```sh
azm --type bin --nohex --nolist --nod8m --output out.bin program.asm
```

---

[← Op Declarations and Aliases](07-ops-aliases.md) | [Manual](index.md) | [Porting, Style, and Reference →](09-porting-style-reference.md)
