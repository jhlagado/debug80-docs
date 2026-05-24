---
layout: default
title: "Chapter 2 — Source Syntax and Symbols"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 2
---
[← Getting Started](01-getting-started.md) | [Manual](index.md) | [Addresses, Constants, and Expressions →](03-addresses-constants-expressions.md)

# Chapter 2 — Source Syntax and Symbols

Every line in an AZM source file either emits bytes, names a location, or controls what comes next. Before any of the larger features — layouts, register contracts, op declarations — there are rules about how lines are formed, what numbers look like, and what distinguishes a label from a directive. This chapter covers those rules. They are mostly what you would expect from any Z80 assembler, with a few AZM-specific choices worth knowing about.

---

## Line structure

Each line contains at most one of:

- A label, optionally followed by an instruction or directive
- An instruction or directive without a label
- A comment alone
- A blank line

A line with a label followed by an instruction:

```asm
BUFFER_SIZE   .equ 256
START:        ld   a,0
```

A label on its own line, with the instruction on the next:

```asm
START:
              ld   a,0
```

Both forms are valid. Labels on their own line are common for routines; labels on the same line are common for constants. The assembly address recorded for the label is the same either way — the choice is purely a matter of readability.

## Whitespace and separators

Whitespace before the label, between the label and the directive, between the directive and its operands, and between operands is flexible. AZM does not enforce specific column positions. One or more spaces or tabs separate tokens.

Commas separate operand lists in `.db`, `.dw`, and similar data directives:

```asm
.db $48,$65,$6C,$6C,$6F   ; five bytes
```

The two valid forms are `NAME .equ expr` and `NAME: .equ expr`. The name always comes first.

## Comments

Semicolons start a comment that runs to the end of the line:

```asm
; This whole line is a comment.
        ld a,0   ; inline comment
```

The `;!` prefix is the AZMDoc contract marker. It looks like a comment but is parsed by the register-care analyzer:

```asm
;!      in        A,HL
;!      out       carry
;!      clobbers  BC
```

Any assembler that does not know AZMDoc sees `;!` lines as ordinary comments. That compatibility is intentional: if you take an AZM source file to another Z80 assembler, the contract annotations disappear silently — they have no effect on the binary. The analyzer only activates when you run AZM with register-care enabled.

## Number formats

AZM accepts all the numeric literal forms that appear in common Z80 assembly literature. You can mix them freely in expressions — no need to convert numbers from one form to another.

AZM accepts eight numeric literal forms across decimal, hexadecimal, binary, and ASCII:

| Form | Example | Base | Notes |
|------|---------|------|-------|
| `$` prefix | `$FF`, `$0100`, `$2A` | hex | `$` alone is the current assembly address |
| `0x` prefix | `0xFF`, `0x2A`, `0x1A` | hex | case-insensitive prefix |
| Trailing `H`/`h` | `0FFH`, `02Ah`, `0100H` | hex | must start with a decimal digit |
| `%` prefix | `%10101010`, `%1111` | binary | |
| `0b` prefix | `0b10101010`, `0b1111` | binary | case-insensitive prefix |
| Trailing `B`/`b` | `10101010B`, `10b` | binary | |
| Plain decimal | `42`, `255`, `0` | decimal | |
| Quoted character | `'A'`, `"Z"` | ASCII value | single character; valid in expressions |

For trailing-`H` hex, the token must start with a decimal digit. `0FFH` is hex 255, but `FFH` starts with a letter, so the parser reads it as a symbol name. Write `0FFH` to force hex interpretation.

`$` has two roles depending on what follows it. `$FF` starts with a hex digit, so the whole token is a hex literal (255). `$` not followed by a hex digit is the current assembly address — `$ - start` gives the byte distance from a label to the current position.

These forms can appear freely in any expression:

```asm
WIDTH   .equ $20           ; hex prefix
HEIGHT  .equ 32            ; decimal
FLAGS   .equ %00001111     ; binary prefix
DOT     .equ 'A' + 1       ; ASCII + offset
SIZE    .equ WIDTH * HEIGHT ; 1024
```

All of `$2A`, `%101010`, `0b101010`, `0x2A`, `02AH`, and `101010B` assemble to 42.

The reason so many forms exist is history: different Z80 assemblers used different conventions, and source files from the 1980s through today use all of them. AZM accepts the full range so that you can assemble existing source without converting it first.

## String and character literals

Multi-character string literals appear in `.db`, `.cstr`, `.pstr`, and `.istr` operands. `.db` accepts string fragments directly:

```asm
.db "Hello"          ; 5 bytes: H e l l o
.db "Hello",0        ; 6 bytes: H e l l o NUL
```

The three string directives encode common string formats without making you
write the terminator or length byte by hand:

```asm
Greeting:
        .cstr "READY"        ; R E A D Y $00

MenuTitle:
        .pstr "MONITOR"      ; $07 M O N I T O R

Prompt:
        .istr "?"            ; '?' with bit 7 set
```

Use `.cstr` when a routine scans forward until it reads a zero byte. Use
`.pstr` when the routine wants the byte count first. Use `.istr` for monitor or
display code that marks the last character by setting bit 7 on that final byte.
The source says which format the data uses; the emitted bytes are still ordinary
bytes in the output image.

If none of these match your target routine's expected format, use `.db` directly and write the bytes you need. The three directives cover the most common conventions in the Z80 ecosystem.

`.dw` accepts word expressions, including single-character quoted values (`'A'` or `"A"` evaluate to the ASCII code as a 16-bit value). It does not accept multi-character string fragments.

Single-character strings in expression context evaluate to the character's ASCII code:

```asm
NEWLINE .equ $0A
.db 'A'              ; byte $41
```

## Dotted directive names

AZM's canonical directive names start with a dot:

```asm
.org    .equ    .db    .dw    .ds
.cstr   .pstr   .istr  .include   .end
.align  .binfrom  .binto
.type   .endtype  .union  .endunion
```

`.type` / `.endtype` and `.union` / `.endunion` are layout block delimiters; covered in Chapter 5.

Undotted forms (`ORG`, `EQU`, `DB`, `DW`, `DS`, …) are accepted through the built-in alias layer. Either form works in source. Canonical AZM style uses the dotted lowercase forms for new source. Chapter 7 covers the alias mechanism in full.

## Case rules

AZM is case-sensitive for labels and symbol names. `START`, `start`, and `Start` are three distinct symbols. Pick one convention and stay with it.

AZM is case-insensitive for Z80 instruction mnemonics and register names. `LD`, `ld`, and `Ld` all parse as the same instruction; `A`, `a`, `HL`, and `hl` all parse as the same register. Pick one case for mnemonics and stick with it — mixed case within a project makes listings harder to scan. The `--case-style` flag enforces consistency if you want machine help.

The case-sensitivity rule for labels is strict and catches real bugs. A loop label named `LoopStart` in one routine and `loopStart` in another are two different symbols — if you accidentally use one where you meant the other, AZM reports an unknown-symbol error rather than silently branching to the wrong place.

Directives are lowercase and case-sensitive. `.db` is the canonical form; `.DB` and `.Db` are parse errors. The alias layer that normalises `DB`, `ORG`, and similar undotted tokens to canonical dotted lowercase runs before the parser — but it applies only to undotted tokens. Once dotted, the case is fixed: `.db` only.

## Strict parsing

AZM does not silently ignore unknown directives or malformed operands. When the parser cannot make sense of a line, it reports an error and stops that pass. Silent failures in older assemblers let wrong source produce wrong binary without any indication. Chapter 8 covers diagnostic messages and how to read them.

For source ported from older tools, strict parsing means the first assembly run shows everything AZM does not recognize. That is usually a short list once you have loaded the right alias file, which Chapter 7 explains.

---

## Labels

Symbols are what let you write `djnz READ_LOOP` instead of `djnz $0105`. Every time you write a label in source, AZM records the current assembly address under that name. Every time you reference that name in an operand or expression, AZM substitutes the address. By the time the binary is written, all the names are gone — only bytes remain.

A label names the assembly address at the point where it appears. When AZM encounters:

```asm
BUFFER:
        .ds 64
```

it records that `BUFFER` equals the current assembly address, then reserves 64 bytes. Any instruction or data that references `BUFFER` gets that address substituted in.

Labels for code work the same way:

```asm
READ_LOOP:
        ld      a,(hl)
        inc     hl
        djnz    READ_LOOP
```

`READ_LOOP` is the address of the `ld` instruction. The `djnz READ_LOOP` at the bottom becomes a relative branch to that address.

## Global labels

AZM has no local-label namespace. Every plain label is a global symbol, unique across the entire translation unit — the source file plus all included files. If two labels share a name, AZM reports a duplicate-symbol error.

The global namespace means branch labels inside routines must be unique too. Two routines that both need a loop label called `Loop` will clash at assembly time. The convention throughout this manual is to prefix branch labels with the routine name: `ShiftRowLoop`, `CopyRowLoop`, `ScanRowLoop`. The examples later in this chapter show that pattern in practice.

```asm
; error: two definitions of COUNT
COUNT:  .db 0
COUNT:  .db 0
```

## Label syntax

AZM has two label forms.

A **plain label** is an identifier followed by a colon, on a line by itself or before an instruction or directive:

```asm
MY_LABEL:
MY_LABEL: ld a,0
```

Both forms are valid. The colon is required. Plain-label identifiers can contain letters, digits, and underscores, and must start with a letter. The parser accepts some compatibility forms, but new source should use the canonical style.

An **entry label** begins with `@` followed by a plain identifier:

```asm
@SHIFT_ROW:
```

The `@` is stripped from the symbol name. `SHIFT_ROW` is the callable name; `@SHIFT_ROW` is the source annotation. Both forms place a label at the current assembly address. The difference is what they tell register-care analysis — covered in the next section and in Chapter 6.

The `@` is not part of the callable name. You write `@SHIFT_ROW:` in source, but call sites write `call SHIFT_ROW`. The distinction matters for register-care analysis, which tracks what happens inside each `@`-marked routine boundary.

## The `@` entry prefix

`@NAME:` marks `NAME` as a routine entry point for register-care analysis. The callable symbol is `NAME`, without the `@`. Call sites write `call NAME`.

```asm
;!      in        A,HL
;!      out       carry
;!      clobbers  BC
@CHECK_BOUNDS:
        ld      c,a
        ; ... body ...
        ret
```

Branch labels inside routines are still global symbols, so two routines that both need a loop label must use distinct names:

```asm
@SHIFT_ROW:
        ld      b,8
ShiftRowLoop:
        rl      (hl)
        inc     hl
        djnz    ShiftRowLoop
        ret

@COPY_ROW:
        ld      b,8
CopyRowLoop:
        ld      a,(de)
        ld      (hl),a
        inc     de
        inc     hl
        djnz    CopyRowLoop
        ret
```

Chapter 6 explains how `@` labels define routine boundaries for register-care analysis.

## Forward references

Labels may be used before they are defined, as long as the final value is known before the second assembly pass resolves fixups:

```asm
        ld      hl,DATA_TABLE    ; DATA_TABLE defined later
        ld      b,TABLE_LEN

DATA_TABLE:
        .db 1,2,3,4
TABLE_LEN .equ $ - DATA_TABLE
```

Branch targets, data addresses, and `.equ` names all support forward references. Cyclic or unresolvable references produce an error.

Forward references let you put data at the bottom of a source file, where it stays out of the way, and reference it from code near the top. AZM uses a two-pass strategy: the first pass assigns addresses to all labels; the second pass substitutes those addresses into instruction encodings. Any reference still unresolved after both passes is a genuine error — typically a typo in a label name.

## Multiple labels at one address

Two or more labels can name the same address:

```asm
@ENTRY_A:
@ENTRY_B:
        ld      a,(hl)
        ret
```

Both `ENTRY_A` and `ENTRY_B` call into the same instruction. Use this when a routine has two public entry points that execute the same body. In `@` mode, consecutive entry labels before the first instruction are treated as aliases for the same routine body. This is useful for a routine that can be entered from two call sites — both callers see a distinct contract symbol, but the actual instructions are shared.

## Data labels vs code labels

Data labels and code labels are both addresses — the difference is in how you use them. Data labels name storage:

```asm
COUNTER:  .db 0
BUFFER:   .ds 64
```

Code labels name instructions:

```asm
DRAW:     ld  a,(hl)
```

Register-care analysis treats data labels as non-routine addresses and does not attach AZMDoc contracts to them. An AZMDoc `;!` block before a data label is an error.

The distinction matters in practice: if you want to document how a piece of code affects registers, it needs a `@` label and a `;!` block. If you want to name a storage address, a plain label is the right tool and no contract is involved.

---

[← Getting Started](01-getting-started.md) | [Manual](index.md) | [Addresses, Constants, and Expressions →](03-addresses-constants-expressions.md)
