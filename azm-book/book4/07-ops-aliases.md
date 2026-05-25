---
layout: default
title: "Chapter 7 — Op Declarations and Aliases"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 7
---
[← Register Care and Contracts](06-register-care.md) | [Manual](index.md) | [Diagnostics, Listings and Output →](08-diagnostics-listings-output.md)

# Chapter 7 — Op Declarations and Aliases

The previous chapters covered everything you need to assemble Z80 programs with AZM. This chapter adds two convenience features: op declarations, which let you name and reuse small instruction idioms, and directive aliases, which let legacy directive forms work transparently in AZM source.

Both are optional. Op declarations are useful when you have a multi-instruction pattern that appears many times and you want it to read as a single named operation in source. Aliases are useful when existing source uses directive heads such as `DEFB` or `DEFW`.

---

## Op declarations

An op is a named instruction idiom that expands inline at each call site into ordinary Z80 instructions. At each expansion, the assembler parses and matches operands as structured assembly. The expanded instructions appear in the listing at the call site exactly as if you had typed them.

The key difference from a subroutine is expansion. When the assembler processes an op call site, it replaces it with the body instructions immediately. From the CPU's perspective, those instructions were always there.

### Simple zero-operand ops

The minimal op takes no operands:

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

The listing shows:

```
0100 AF   clear_a
0101 00   nop
0102 00   nop
```

Register-care analysis sees the expanded instructions: `clear_a` is analyzed as `xor a`, including the flag effects.

### Parameterized ops

Ops can take operands matched by class:

```asm
op load8(dst reg8, val imm8)
  ld   dst,val
end
```

Using it:

```asm
        load8  a,42
        load8  b,$FF
```

Expands to:

```asm
        ld   a,42
        ld   b,$FF
```

The operand class `reg8` matches any 8-bit register. At the call site `load8 a,42`, the assembler matches `a` to `reg8` and `42` to `imm8`, then substitutes them into the body. The matching is structural, so the assembler treats `a` as a register token.

### Operand classes

Operand classes match categories of Z80 operands. The full set supported in AZM ops:

| Class | Matches |
|-------|---------|
| `reg8` | 8-bit registers: A, B, C, D, E, H, L |
| `reg16` | 16-bit registers: BC, DE, HL, SP |
| `imm8` | 8-bit immediate value |
| `imm16` | 16-bit immediate value |
| `cc` | Condition codes: NZ, Z, NC, C, PO, PE, P, M |
| `idx16` | IX or IY indexed memory operand: `(IX+d)`, `(IY+d)` |
| `ea` | Effective address expression |
| `mem8` | Memory dereference intended for byte-form op overloads |
| `mem16` | Memory dereference intended for word-form op overloads |

The matcher class selects the overload; whether the operand is treated as byte or word is determined when the expanded instruction is parsed and encoded.

Tokens outside the operand-class list are fixed tokens — exact literals that the call site must reproduce verbatim.

### Overloaded ops

Multiple op declarations with the same name but different operand shapes define an overloaded op family. AZM selects the matching overload at each call site:

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

Overloading lets you write a family of related idioms under one name. The assembler selects the right one by matching operand classes. If your op should work for both 8-bit and 16-bit registers, two overloads with `reg8` and `reg16` handle both under one call-site name.

### Exact-token operands

Ops can require an exact register or value as a fixed operand:

```asm
op swap_a_b()
  ld   c,a
  ld   a,b
  ld   b,c
end
```

When the operand must be a specific register, write it literally in the op body. Parameterize only the operands that vary at call sites.

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

### Cycle counts

Op bodies can include `; cycles N` metadata comments for documentation purposes. They are useful for timing-critical code. The recommended style:

```asm
op nop16()
  nop   ; 4 cycles
  nop   ; 4 cycles
  nop   ; 4 cycles
  nop   ; 4 cycles
  ; total: 16 cycles
end
```

### When to use an op instead of a subroutine

Ops expand inline at the call site. Use them when:
- The idiom is small enough that the call overhead is significant relative to the body
- The register and flag effects must be exactly as if you had written the instructions yourself
- You want the expansion visible in the listing

Use a subroutine when:
- The body is several instructions long and is called many times (code size matters)
- The routine needs its own register contract documented via AZMDoc
- You want callee-side register preservation

An op is the right tool for a `clear_a`, a multi-byte shift or a small arithmetic sequence. A subroutine is right for anything with its own meaningful register contract.

### Nested ops and cycle detection

An op body can invoke another op:

```asm
op clear_pair(hi reg8, lo reg8)
  xor  a
  ld   hi,a
  ld   lo,a
end

op clear_de()
  clear_pair  d,e
end
```

AZM expands `clear_de` to `clear_pair d,e`, which in turn expands to the three instructions. The listing shows the fully expanded instructions at the call site.

Recursive expansion is detected and produces an error:

```asm
op loop_forever()
  loop_forever    ; error: recursive op expansion
end
```

AZM tracks the expansion stack and stops with an error when the same op appears in its own expansion chain. This protects against both direct recursion and mutual recursion between two ops.

Deeply nested ops can be easier to write than to read. Because the listing shows fully expanded instructions at the call site, not the nested op calls, tracing what a call to a three-level nested op produces means reading back through the definitions. For ops that chain more than one level deep, keeping the nesting shallow makes the listing more useful.

### Diagnostics for ops

Message wording is illustrative. AZM reports a shaped `AZMN_PARSE` diagnostic; exact text may vary.

**No overload matches:**

```
error AZMN_PARSE: no overload of 'load8' matches operands (HL, imm8)
  tried: load8(reg8, imm8)
```

The diagnostic lists what was tried. `HL` is a 16-bit register; `reg8` requires an 8-bit register. Change either the call site or add a `reg16` overload.

**Ambiguous match:**

```
error AZMN_PARSE: call to 'increment' matches multiple overloads
```

Two overload declarations both match the operands at the call site. Review the overloads and add a more specific fixed-token overload to disambiguate, or collapse the two overloads into one with a broader operand class.

**Expansion cycle:**

```
error AZMN_PARSE: op expansion cycle detected: loop_op → helper → loop_op
```

AZM shows the expansion path that produced the cycle. Refactor the ops to break the cycle.

**Arity mismatch:**

```
error AZMN_PARSE: 'load8' expects 2 operands, got 1
```

The call site passed the wrong number of operands. Count the parameters in the op declaration and match the call.

### Op declarations in include files

Op names are global — they share the same namespace as labels and `.equ` constants. Declare ops in a dedicated file included before any code that uses them:

```asm
; ops.asm
op clear_a()
  xor  a
end

op negate_a()
  ld   c,a
  xor  a
  sub  c
end

op load8(dst reg8, val imm8)
  ld   dst,val
end
```

Include it early in the main file:

```asm
        .include "hardware.asm"
        .include "layout.asm"
        .include "ops.asm"       ; before any code that uses the ops
```

Choose op names that avoid Z80 mnemonics. `clear_a` is fine; `ld` produces a parse error. Use underscore-separated lowercase names that read as instructions (`shift_left_4`, `negate_a`, `memcopy`) rather than function names.

`clear_a` reads as an instruction idiom: you know at a glance what it does and that it expands inline. A name like `InitSprites` looks like a subroutine call. Instruction-style names set the right expectation.

---

## Aliases and compatibility syntax

Op declarations are about what you want to write. Aliases are about what existing source already has. If you have Z80 source written for a different assembler — one that uses `DEFB`, `DEFW`, `RMB` or other directive heads — aliases map those heads to AZM directives.

### The canonical directive set

AZM's canonical directives are lowercase and dotted: `.org`, `.equ`, `.db`, `.dw`, `.ds`, `.include`, `.end`, `.align`, `.cstr`, `.pstr`, `.istr`, `.binfrom`, `.binto`. See [Appendix A](appendix-a-directives.md) for the full directive reference. New AZM source should use these canonical forms throughout.

### The built-in `azm` alias profile

AZM accepts common undotted uppercase spellings through a built-in alias layer. Before parsing, directive heads are normalized:

| Alias | Canonical |
|-------|-----------|
| `ORG` | `.org` |
| `EQU` | `.equ` |
| `DB` | `.db` |
| `DW` | `.dw` |
| `DS` | `.ds` |
| `INCLUDE` | `.include` |
| `END` | `.end` |
| `ALIGN` | `.align` |
| `CSTR` | `.cstr` |
| `PSTR` | `.pstr` |
| `ISTR` | `.istr` |
| `BINFROM` | `.binfrom` |
| `BINTO` | `.binto` |

Alias matching is case-insensitive: `db`, `DB` and `Db` all normalize to `.db`. This is the layer that makes existing ASM80-family source assemble without modification.

### Project-specific alias files

Spellings beyond the built-in set belong in a project JSON file:

```json
{
  "extends": "azm",
  "directiveAliases": {
    "DEFB": ".db",
    "DEFW": ".dw",
    "DEFS": ".ds",
    "RMB":  ".ds",
    "FCB":  ".db",
    "CSTRING": ".cstr",
    "PSTRING": ".pstr"
  }
}
```

`"extends": "azm"` is required — it loads the built-in profile as the base.

Rules for project aliases:
- Keys must be distinct from the built-in profile (`DB` already belongs to it)
- Keys must avoid Z80 instruction mnemonics (`LD`, `ADD`, etc.)
- Values must be canonical dotted directives from the table above

Load with `--aliases`:

```sh
azm --aliases project.aliases.json program.asm
```

Repeatable for multiple alias files:

```sh
azm --aliases base.aliases.json --aliases local.aliases.json program.asm
```

### What do aliases rewrite?

Aliases normalize the **directive head**: the first token of a statement after an optional label. Operands, expressions, register names, instruction mnemonics and op names pass through unchanged.

```asm
DEFB "Hello",0    ; normalized to: .db "Hello",0
DB   42           ; normalized to: .db 42
```

The operands `"Hello",0` and `42` pass through unchanged.

Instruction mnemonic changes belong in a source transformation pass. For example, source using `MOV` for `LD` needs those lines converted before AZM assembles it.

Directive head normalization and op expansion together cover the vast majority of source compatibility needs. Source that uses non-standard opcode mnemonics needs manual conversion before assembly.

### The difference between aliases and ops

| Feature | Directive aliases | Ops |
|---------|------------------|-----|
| Input | Directive head (one token) | Full parsed AST |
| Scope | Before parse | At call site |
| Output | Same directive, canonical form | Extra instructions |
| Purpose | Compatibility | CPU idioms |

Aliases normalize directive forms; ops expand instruction sequences.

### Legacy source and compatibility

AZM's ASM80 compatibility baseline lets you assemble existing Z80 source with minimal changes. The built-in alias profile handles the most common directive-form differences. For source that uses `DEFB`, `RMB` or similar, add a project alias file.

Directives in AZM are lowercase and case-sensitive. Existing uppercase forms — `DB`, `ORG`, `EQU` — pass through the built-in alias layer while you work through converting directive heads to canonical lowercase at your own pace.

The assembly address behavior, label handling, expression forms and Z80 instruction encoding all match ASM80 behavior for the covered corpus. AZM is stricter than ASM80 about unknown directives and malformed operands — see Chapter 2.

### Normalizing source to canonical style

If you want to normalize an existing project to canonical AZM style:

1. Assemble with aliases loaded — verify output is byte-identical
2. Search and replace directive heads in source (e.g., `DB` → `.db`, `ORG` → `.org`)
3. Remove the alias file from the build command
4. Reassemble and verify output is still byte-identical

The migration is reversible. Chapter 9 covers porting more broadly.

---

[← Register Care and Contracts](06-register-care.md) | [Manual](index.md) | [Diagnostics, Listings and Output →](08-diagnostics-listings-output.md)
