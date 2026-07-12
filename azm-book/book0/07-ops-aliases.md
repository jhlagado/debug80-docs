---
layout: default
title: "Chapter 7 — Ops, Aliases and Source Composition"
parent: "AZM Book 0 — Assembler Manual"
nav_order: 7
---
[← Register Contracts](06-register-contracts.md) | [Manual](index.md) | [Diagnostics and Output →](08-diagnostics-listings-output.md)

# Chapter 7 — Ops, Aliases and Source Composition

This chapter adds three source-organization features: op declarations, which let you name and reuse small instruction idioms; directive aliases, which map legacy directive forms to canonical AZM directives; and source composition with `.include` and `.import`.

---

## Op declarations

An op is a named instruction idiom that expands inline at each call site into ordinary Z80 instructions. The expanded instructions appear at the call site exactly as if you had typed them.

The difference from a subroutine: when the assembler processes an op call site, it replaces it with the body instructions immediately. The CPU sees those instructions directly — there is no call overhead and no register contract for the op itself.

### Simple zero-operand ops

```asm
op clear_a()
  xor  a
end

op nop_pair()
  nop
  nop
end
```

Using them:

```asm
        clear_a
        nop_pair
```

Register contract analysis sees the expanded instructions: `clear_a` is analyzed as `xor a`, including its flag effects.

Op invocations can also appear inside a chained instruction line:

```asm
        clear_a \ ret
```

Op bodies accept the same form:

```asm
op clear_and_return()
  xor a \ ret
end
```

The chain is still source shorthand. The expanded output is the same sequence of ordinary instructions.

### Parameterized ops

Ops can take operands matched by class:

```asm
op load8(dst reg8, val imm8)
  ld   dst,val
end
```

At the call site `load8 a,42`, the assembler matches `a` to `reg8` and `42` to `imm8`, then substitutes them into the body:

```asm
        load8  a,42     ; expands to: ld a,42
        load8  b,$FF    ; expands to: ld b,$FF
```

### Operand classes

| Class | Matches |
|-------|---------|
| `reg8` | 8-bit registers: A, B, C, D, E, H, L |
| `reg16` | 16-bit registers: BC, DE, HL, SP |
| `imm8` | 8-bit immediate value |
| `imm16` | 16-bit immediate value |
| `cc` | Condition codes: NZ, Z, NC, C, PO, PE, P, M |
| `idx16` | IX or IY indexed memory operand: `(IX+d)`, `(IY+d)` |
| `ea` | Effective address expression |
| `mem8` | Memory dereference for byte-form op overloads |
| `mem16` | Memory dereference for word-form op overloads |

Tokens outside this list are fixed tokens — exact literals the call site must reproduce verbatim.

### Overloaded ops

Multiple op declarations with the same name but different operand shapes define an overloaded family. AZM selects the matching overload at each call site:

```asm
op increment(dst reg8)
  inc  dst
end

op increment(dst reg16)
  inc  dst
end
```

```asm
        increment  a      ; uses reg8 overload
        increment  hl     ; uses reg16 overload
```

When overload selection fails, AZM reports an ambiguity or no-match diagnostic.

### Branch labels inside op bodies

When an op body needs internal branch labels, AZM generates unique labels to prevent collisions across multiple expansions:

```asm
op safe_div(result reg8, divisor imm8)
  ld   a,divisor
  or   a
  jr   z,DivSkip
  div_logic
DivSkip:
end
```

Each expansion gets its own unique version of `DivSkip`. Two invocations of `safe_div` in the same source file will not clash.

### Ops vs subroutines

Use an op when:

- The idiom is small enough that call overhead is significant relative to the body
- The register and flag effects must be exactly as if you had typed the instructions
- You want the expansion visible in the output

Use a subroutine when:

- The body is several instructions long and is called many times (code size matters)
- The routine needs its own register contract documented via register contracts
- You want callee-side register preservation

### Nested ops and cycle detection

An op body can invoke another op. AZM expands nested ops fully at the call site.

Recursive expansion is detected and produces an error:

```asm
op loop_forever()
  loop_forever    ; error: recursive op expansion
end
```

AZM tracks the expansion stack and stops with an error when the same op appears in its own expansion chain — both direct recursion and mutual recursion between two ops.

### Op diagnostics

**No overload matches:**

```
error AZMN_PARSE: no overload of 'load8' matches operands (HL, imm8)
  tried: load8(reg8, imm8)
```

`HL` is a 16-bit register; `reg8` requires an 8-bit register. Change either the call site or add a `reg16` overload.

**Expansion cycle:**

```
error AZMN_PARSE: op expansion cycle detected: loop_op → helper → loop_op
```

Refactor the ops to break the cycle.

**Arity mismatch:**

```
error AZMN_PARSE: 'load8' expects 2 operands, got 1
```

### Op declarations in include files

Op names are global — they share the namespace with labels and `.equ` constants. Declare ops in a dedicated file included before any code that uses them:

```asm
        .include "hardware.asm"
        .include "layout.asm"
        .include "ops.asm"
```

Choose op names that avoid Z80 mnemonics. `clear_a` is fine; `ld` produces a parse error. Use underscore-separated lowercase names that read as instructions (`shift_left_4`, `negate_a`, `memcopy`) — a name like `clear_a` sets the expectation that it expands inline.

---

## Aliases and compatibility

Aliases map legacy directive heads to canonical AZM directives. If you have Z80 source written for a different assembler — one that uses `DEFB`, `DEFW`, `RMB` or other directive heads — aliases let those heads work without modifying every line.

Five key facts about aliases:

1. Existing source may use old directive forms.
2. Aliases map those directive heads to AZM directives.
3. Built-in aliases cover the most common forms.
4. Project alias files cover additional forms if needed.
5. Aliases map directive heads only, not whole instruction syntaxes.

### The built-in alias profile

AZM's built-in aliases normalize common undotted uppercase forms before parsing:

| Alias | Canonical |
|-------|-----------|
| `ORG` | `.org` |
| `EQU` | `.equ` |
| `DB` | `.db` |
| `DW` | `.dw` |
| `DS` | `.ds` |

The full built-in list is in [Appendix A](appendix-a-directives.md). Alias matching is currently case-insensitive: `db`, `DB` and `Db` all normalize to `.db`.

### Project-specific alias files

Directive forms beyond the built-in set belong in a project JSON file:

```json
{
  "extends": "azm",
  "directiveAliases": {
    "DEFB": ".db",
    "DEFW": ".dw",
    "DEFS": ".ds",
    "RMB":  ".ds",
    "FCB":  ".db"
  }
}
```

`"extends": "azm"` loads the built-in profile as the base. Load with `--aliases`:

```sh
azm --aliases project.aliases.json program.asm
```

### What aliases rewrite

Aliases normalize the **directive head**: the first token of a statement after an optional label. Operands, expressions, register names, instruction mnemonics and op names pass through unchanged.

```asm
DEFB "Hello",0    ; normalized to: .db "Hello",0
```

Instruction mnemonic changes — for example, source using `MOV` for `LD` — need a source transformation pass before assembly.

---

## Source files and composition

Use `.include` when you want text copied into the current source unit. Use `.import` when another source file should expose selected `@` declarations and keep its other non-local declarations private.

### `.include`

`.include "path"` inserts another source file inline at that point, as if you had typed its contents there. The file path is relative to the including file; add search directories with `-I`.

All included files share one source unit. Non-local labels and constants must be unique in that unit. Owner-local labels can repeat under different non-local owners.

Op declarations and layout types typically live in dedicated include files, pulled in before the code that uses them:

```asm
        .include "hardware.asm"    ; port addresses and memory-mapped I/O
        .include "layout.asm"      ; type declarations
        .include "ops.asm"         ; op declarations
```

Use `.include` for constants, hardware port definitions, shared layout declarations, enum declarations, small text fragments, legacy compatibility source and code that is intentionally part of the including file.

### `.import`

AZM 0.3.2 and later supports `.import` with explicit exports:

```asm
.import "math.asm"
```

`.import` loads another source file as a module-like unit. Its bytes are emitted at the import point. Declarations beginning with `@` are visible to the importing unit; plain non-local declarations remain inside the imported unit.

Use `.import` for reusable routine files, library-style source files and files that should expose a small public surface.

```asm
; main.asm
        .org    $4000
        .import "math.asm"

Start:
        ld      a,10
        call    DoubleA
        ret
```

```asm
; math.asm
.routine in A out A clobbers F
@DoubleA:
        add     a,a
        ret

.routine in A out A clobbers F
ClampA:
        cp      100
        ret     c
        ld      a,100
        ret
```

`DoubleA` is exported because it is declared as `@DoubleA:`. Code in `main.asm` calls it as `DoubleA`. `ClampA` remains private to `math.asm`.

The two markers are independent. `.routine` declares the analysis boundary and contract. `@` exports the following label.

If outside code tries to reference a private imported label, AZM reports a visibility diagnostic. Keep the call inside the imported file, or make the helper public only when it is genuinely part of the file's interface:

```asm
.routine in A out A clobbers F
ClampA:
        cp      100
        ret     c
        ld      a,100
        ret
```

Use source labels rather than `$`-qualified helper names such as `math$ClampA`. `$` is the current assembly address by itself and starts hexadecimal literals such as `$4000`. AZM tracks imported declarations by source-unit identity and emits that identity in D8 metadata.

### Import order and paths

Imported source assembles at the point where `.import` appears:

```asm
        .org    $4000
        .import "module.asm"

Start:
        ret
```

The bytes from `module.asm` are emitted before `Start`. `.import` is not only a declaration; it contributes source at that point in the program.

`.import` resolves paths the same way as `.include`: first relative to the file that contains the directive, then through include search paths passed with `-I`.

```sh
azm -I include src/main.asm
```

Repeated imports of the same resolved file are idempotent. The file is loaded and emitted once:

```asm
.import "keyboard.asm"
.import "keyboard.asm"      ; same resolved file, emitted once
```

Repeated includes are still textual and repeatable:

```asm
.include "constants.asm"
.include "constants.asm"    ; expanded twice
```

Recursive include/import chains are rejected with a source diagnostic.

### Import limits

`.import` remains deliberately small:

- `.import "file.asm"` is the only supported import syntax
- There is no `as Name` namespace syntax
- There is no `Module.Symbol` reference syntax
- There is no re-export syntax
- Plain declarations in an imported source unit are private to that unit; `@` exports labels, equates, enums, layout types, type aliases and ops
- Different imported source units may reuse the same private declaration names
- `$`-qualified private names are internal debug-map display names, not source syntax
- `.include` behaviour is unchanged

Native AZM outputs support `.import`: `.bin`, `.hex` and `.d8.json`. Debug80 map output records imported physical files and source line segments, so emitted bytes still map back to the correct source file. ASM80-compatible lowered `.z80` output does not currently support `.import`; if a program uses `.import` and you request `--asm80`, AZM reports an explicit `AZMN_ASM80` diagnostic.

---

[← Register Contracts](06-register-contracts.md) | [Manual](index.md) | [Diagnostics and Output →](08-diagnostics-listings-output.md)
