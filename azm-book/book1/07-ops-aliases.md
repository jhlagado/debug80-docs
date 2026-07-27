---
layout: default
title: "Ops, Aliases and Source Composition"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 7
---

# Ops, Aliases and Source Composition

Op declarations name reusable instruction idioms. Directive aliases let AZM read directive spellings from other assemblers. `.include` and `.import` compose a program from several files.

---

## Op declarations

An op is a named instruction idiom that expands inline at each call site into ordinary Z80 instructions.

The op carries its own bytes at each site, so the cost is the instructions themselves and the register effects belong to the surrounding routine.

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

Invocation:

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

`mem8` and `mem16` currently match the same memory operand shapes. They document the intended width, so an overload family needs some other difference to tell two otherwise identical signatures apart.

Tokens outside this list are fixed tokens, exact literals the call site must reproduce verbatim.

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

### Pseudo-opcodes for instruction-set gaps

Some idioms exist to fill a gap in the instruction set. Copying DE into HL takes two 8-bit moves, since the Z80's register-to-register loads are all 8-bit:

```asm
op ld_hl_de()
  ld   h,d
  ld   l,e
end
```

A `reg16` parameter leaves this ungeneralised: the matcher supplies the pair name alone, so a generic body has no `ld h,d` to write. Each supported pairing needs its own declaration: `ld_hl_de`, `ld_de_hl`, `ld_bc_hl`.

Where the instruction does exist, a parameterized op still names the intent:

```asm
op clear16(r reg16)
  ld   r,0
end

        clear16  hl     ; expands to: ld hl,0
        clear16  bc     ; expands to: ld bc,0
```

A named op can identify the condition implemented by an instruction sequence. Here, `cp c` followed by `jr c` and `jr z` means "skip unless A is strictly above C":

```asm
op jr_if_not_above(threshold reg8, target imm16)
  cp   threshold
  jr   c,target
  jr   z,target
end
```

The listing keeps the invocation as its source line and attributes the expanded bytes to it.

### Ops vs subroutines

An op is appropriate for:

- Small idioms where call overhead is significant relative to the body
- Register and flag effects that must match the expanded instructions exactly
- Expansions that must remain visible in the output

A subroutine is appropriate for:

- Bodies that are several instructions long and called many times (code size matters)
- Routines that need their own register contract, declared with `.routine`
- Callee-side register preservation

For a body of N instructions used at K call sites, a subroutine stores the body once and adds one `ret` and one `call` per site: N + 1 + K encodings. An op emits N × K. At K = 1, the op is always smaller. At K = 2, the subroutine is smaller when N exceeds 3.

![A four-byte body inlined at three sites against the same body reached by call](../../assets/images/azm-book/book1/inline-versus-call.svg)

That count measures instruction encodings, not bytes; Z80 instructions occupy one to four bytes each. At run time, the subroutine also executes a `call` and a `ret` per invocation, while the op executes only its body.

### Nested ops and cycle detection

An op body can invoke another op. AZM expands nested ops fully at the call site.

Recursive expansion is detected and produces an error:

```asm
op loop_forever()
  loop_forever    ; error: recursive op expansion
end
```

AZM detects mutual recursion between two ops as well as direct recursion.

### Op diagnostics

**No overload matches:**

```
error: [AZMN_PARSE] No matching op overload for "load8" with provided operands.
call-site operands: (HL, 42)
available overloads:
  - load8(dst reg8, val imm8) (program.asm:1) ; dst: expects reg8, got HL
```

`HL` is a 16-bit register; `reg8` requires an 8-bit register. The mismatch can be resolved by changing the call site or adding a `reg16` overload.

**Expansion cycle:**

```
error: [AZMN_PARSE] Cyclic op expansion detected for "loop_op".
expansion chain: loop_op (program.asm:1) -> helper (program.asm:5) -> loop_op (program.asm:1)
```

**Arity mismatch:**

```
error: [AZMN_PARSE] No op overload of "load8" accepts 1 operand(s).
available overloads:
  - load8(dst reg8, val imm8)
```

### Op declarations in include files

Op names are global; they share the namespace with labels and `.equ` constants. A dedicated op file, included before any code that uses it, keeps these declarations together:

```asm
        .include "hardware.asm"
        .include "layout.asm"
        .include "ops.asm"
```

Op names must avoid Z80 mnemonics. `clear_a` is valid; `ld` produces a parse error. AZM convention uses underscore-separated lowercase names such as `shift_left_4`, `negate_a` and `memcopy`.

---

## Aliases and compatibility

Aliases map legacy directive heads to canonical AZM directives. Source written for assemblers that use `DEFB`, `DEFW`, `RMB` or other directive heads can use aliases without changing every line.

### The built-in alias profile

AZM's built-in aliases normalize exact undotted uppercase forms before parsing:

| Alias | Canonical |
|-------|-----------|
| `ORG` | `.org` |
| `EQU` | `.equ` |
| `DB` | `.db` |
| `DW` | `.dw` |
| `DS` | `.ds` |

The full built-in list is in [Appendix 1](../appendices/01-directives.md). Alias names are case-sensitive: `DB` alone normalizes to `.db`, while `db` and `Db` stay as written. Canonical directives use lowercase dotted forms.

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

`"extends": "azm"` loads the built-in profile as the base. The `--aliases` option then loads the project file:

```sh
azm --aliases project.aliases.json program.asm
```

### Alias rewrite scope

Aliases normalize the **directive head**: the first token of a statement after an optional label. Operands, expressions, register names, instruction mnemonics and op names pass through unchanged.

```asm
DEFB "Hello",0    ; normalized to: .db "Hello",0
```

Instruction mnemonic changes, such as source using `MOV` for `LD`, need a source transformation pass before assembly.

---

## Source files and composition

`.include` copies text into the current source unit. `.import` instead exposes selected `@` declarations from another source file while keeping its other non-local declarations private.

![What each of the three composition mechanisms puts in the output](../../assets/images/azm-book/book1/bringing-in-code.svg)

### `.include`

`.include "path"` inserts another source file inline at that point, as if its contents had been written there. The file path is relative to the including file; `-I` adds further search directories.

All included files share one source unit. Non-local labels and constants must be unique in that unit. Owner-local labels can repeat under different non-local owners.

Op declarations and layout types typically live in dedicated include files, pulled in before the code that uses them:

```asm
        .include "hardware.asm"    ; port addresses and memory-mapped I/O
        .include "layout.asm"      ; type declarations
        .include "ops.asm"         ; op declarations
```

### `.import`

`.import` supports explicit exports:

```asm
.import "math.asm"
```

`.import` loads another source file as a module-like unit. Its bytes are emitted at the import point. Declarations beginning with `@` are visible to the importing unit; plain non-local declarations remain inside the imported unit.

An exported declaration is a plain identifier with `@` in front of it. The `@` is declaration syntax rather than part of the name, so `@DoubleA:` declares the symbol `DoubleA` and call sites write `call DoubleA`. Exported names take PascalCase after the `@`. An owner-local label belongs to its routine rather than to the file's interface, so `@_clamp:` is an error.

![Only an @ declaration leaves an imported source unit; a plain label and an owner-local label stop at the boundary](../../assets/images/azm-book/book1/export-boundary.svg)

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

`.routine` declares the analysis boundary and contract. `@` exports the following label.

A reference to a private imported label from outside its source unit produces a visibility diagnostic. The call can remain inside the imported file, or the helper can become public when it forms part of the file's interface:

```asm
; math.asm - ClampA is now part of the module's interface
.routine in A out A clobbers F
@ClampA:
        cp      100
        ret     c
        ld      a,100
        ret
```

Source labels replace `$`-qualified helper names such as `math$ClampA`. `$` is the current assembly address by itself and starts hexadecimal literals such as `$4000`. AZM tracks imported declarations by source-unit identity and emits that identity in D8 metadata.

### Import order and paths

Imported source assembles at the point where `.import` appears:

```asm
        .org    $4000
        .import "module.asm"

Start:
        ret
```

`.import` resolves paths the same way as `.include`: first relative to the file that contains the directive, then through include search paths passed with `-I`.

```sh
azm -I include src/main.asm
```

Repeated imports of the same resolved file are loaded and emitted once:

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

`.import` has the following limits:

- `.import "file.asm"` is the whole of the import syntax: no aliasing, no qualified references, no re-export
- Plain declarations in an imported source unit are private to that unit; `@` exports labels, equates, enums, layout types, type aliases and ops
- Different imported source units may reuse the same private declaration names
- `$`-qualified private names are internal debug-map display names, not source syntax
- `.include` behaviour is unchanged

Native AZM outputs support `.import`: `.bin`, `.hex` and `.d8.json`. Debug80 map output records imported physical files and source line segments, so emitted bytes still map back to the correct source file. ASM80-compatible lowered `.z80` output does not support `.import`; requesting `--asm80` for a program that uses it produces an explicit `AZMN_ASM80` diagnostic.
