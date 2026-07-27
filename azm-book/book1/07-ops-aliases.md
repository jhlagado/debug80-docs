---
layout: default
title: "Ops, Aliases and Source Composition"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 7
---

# Ops, Aliases and Source Composition

Op declarations name an instruction idiom so it can be reused, directive aliases let AZM read directive spellings from other assemblers, and `.include` and `.import` build one program out of several files.

---

## Op declarations

An op is a named instruction idiom that expands inline at each call site into ordinary Z80 instructions.

There is no call overhead and no register contract for the op itself.

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

`mem8` and `mem16` currently match the same memory operand shapes. They document the intended width, but an overload family cannot use those two classes alone to distinguish otherwise identical signatures.

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

Some idioms exist only because the Z80 lacks the instruction. There is no 16-bit register-to-register load, so copying DE into HL is two 8-bit moves:

```asm
op ld_hl_de()
  ld   h,d
  ld   l,e
end
```

A `reg16` parameter cannot generalize this. The matcher supplies the pair name, not its high and low halves, so a generic body has no way to write `ld h,d`. Each supported pairing needs its own declaration: `ld_hl_de`, `ld_de_hl`, `ld_bc_hl`.

Where the instruction does exist, a parameterized op still names the intent:

```asm
op clear16(r reg16)
  ld   r,0
end

        clear16  hl     ; expands to: ld hl,0
        clear16  bc     ; expands to: ld bc,0
```

A named op also gives a condition its own word. `cp c` followed by `jr c` and `jr z` is "skip unless A is strictly above C", a reading no one recovers from the three instructions at a glance:

```asm
op jr_if_not_above(threshold reg8, target imm16)
  cp   threshold
  jr   c,target
  jr   z,target
end
```

The listing keeps the invocation as its source line and attributes the expanded bytes to it, rather than printing a copy of the body.

### Ops vs subroutines

An op is appropriate when:

- The idiom is small enough that call overhead is significant relative to the body
- The register and flag effects must be exactly as if you had typed the instructions
- You want the expansion visible in the output

A subroutine is appropriate when:

- The body is several instructions long and is called many times (code size matters)
- The routine needs its own register contract, declared with `.routine`
- You want callee-side register preservation

The size trade is countable. For a body of N instructions used at K call sites, a subroutine stores the body once, adds one `ret` and one `call` per site: N + 1 + K encodings. An op emits N × K. At K = 1 the op is always smaller; at K = 2 the subroutine wins as soon as N exceeds 3.

![A four-byte body inlined at three sites against the same body reached by call](../../assets/images/azm-book/book1/inline-versus-call.svg)

That count is in instruction encodings, not bytes, and Z80 instructions run from one to four bytes each. At run time the subroutine also executes a `call` and a `ret` per invocation, where the op executes only its body.

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

Op names must avoid Z80 mnemonics. `clear_a` is valid; `ld` produces a parse error. Underscore-separated lowercase names read naturally as instructions (`shift_left_4`, `negate_a`, `memcopy`).

---

## Aliases and compatibility

Aliases map legacy directive heads to canonical AZM directives. If you have Z80 source written for a different assembler (one that uses `DEFB`, `DEFW`, `RMB` or other directive heads), aliases let those heads work without modifying every line.

### The built-in alias profile

AZM's built-in aliases normalize exact undotted uppercase forms before parsing:

| Alias | Canonical |
|-------|-----------|
| `ORG` | `.org` |
| `EQU` | `.equ` |
| `DB` | `.db` |
| `DW` | `.dw` |
| `DS` | `.ds` |

The full built-in list is in [Appendix A](../appendices/appendix-a-directives.md). Alias names are case-sensitive: `DB` normalizes to `.db`, while `db` and `Db` do not. Canonical directives use lowercase dotted forms.

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

An exported declaration is a plain identifier with `@` in front of it. The `@` is declaration syntax and not part of the name, so `@DoubleA:` declares the symbol `DoubleA` and call sites write `call DoubleA`. Exported names take PascalCase after the `@`. An owner-local label belongs to its routine rather than to the file's interface, so `@_clamp:` is an error.

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

If outside code tries to reference a private imported label, AZM reports a visibility diagnostic. The call can remain inside the imported file, or the helper can become public when it genuinely forms part of the file's interface:

```asm
; math.asm — ClampA is now part of the module's interface
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
