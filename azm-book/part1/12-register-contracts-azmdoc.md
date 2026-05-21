---
layout: default
title: "Chapter 12 — Register Contracts with AZMDoc"
parent: "Part 1 — Z80 Fundamentals"
grand_parent: "Learn AZM Assembly"
nav_order: 12
---
[← Subroutine Conventions](11-subroutine-conventions.md) | [Part 1](index.md) | [Layout Types →](13-layout-types.md)

# Chapter 12 — Register Contracts with AZMDoc

Chapter 11's comment block is the right idea. The subroutine declares its inputs, outputs, and clobbers; the caller reads the declaration and writes code accordingly. But a semicolon comment can say anything. AZM has no way to check whether the comment matches the code. Over time, as subroutines are modified and callers multiply, the comment drifts.

This chapter introduces AZMDoc — a structured comment format that AZM's register-care analyzer can read. The syntax lives in ordinary comments, so other assemblers ignore it. AZM treats it as a machine-checkable contract.

---

## The problem with comment documentation

Consider a `process_table` subroutine whose comment block was written accurately at first, then the body was changed to walk HL through the table. The `Preserves: HL` line was never updated:

```asm
; process_table: scan table for matching entry
; In:  HL = pointer to first byte
;      B  = count
; Out: A  = 1 if match found, 0 otherwise
; Preserves: HL              <— wrong: the new body clobbers HL
process_table:
  ld a, 0
.loop:
  ld a, (hl)
  cp $FF
  jr z, .found
  inc hl               ; HL walks through the table — clobbers it
  djnz .loop
  ld a, 0
  ret
.found:
  ld a, 1
  ret
```

A caller reads the comment and writes this:

```asm
  ld hl, my_table
  ld b, 16
  call process_table   ; expects HL preserved afterward
  ld (found_flag), a
  ld a, (hl)           ; BUG: HL now points past the table end
```

The assembler accepts this. The CPU runs it. The `ld a, (hl)` reads whatever sits past the table — a different variable, ROM, or hardware register. The bug is silent at the call site.

You followed the comment. The comment was wrong, and the assembler had no way to notice.

---

## AZMDoc `;!` contracts

AZMDoc adds machine-readable metadata to the comment syntax. Lines starting with `;!` immediately before a routine entry label carry the contract. They are ordinary comments to any assembler that does not understand AZMDoc; AZM parses them as structured declarations.

The four keys are:

- `in` — registers and flags whose incoming value is meaningful to the routine
- `out` — registers and flags that carry the returned result
- `clobbers` — registers and flags the routine modifies and does not restore
- `preserves` — registers and flags explicitly restored before return

A complete contract for `find_max`:

```asm
; find_max: scan a byte table and return the largest value
;!      in        HL, B
;!      out       A
;!      clobbers  B, HL
@find_max:
  ld a, 0
.loop:
  cp (hl)
  jr nc, .skip
  ld a, (hl)
.skip:
  inc hl
  djnz .loop
  ret
```

The human-readable comment stays as a regular `;` line. The `;!` lines carry the structured data that the analyzer reads.

Carrier lists use comma-separated register names:

```asm
;!      in        A, DE, HL
;!      out       carry
;!      clobbers  BC
```

Register pairs are shorthand: `BC` means both B and C. The analyzer decomposes pairs into their 8-bit constituents. Flags are named individually: `carry`, `zero`, `sign`, `parity`, `halfCarry`. Use `carry` for the carry flag and `C` for register C — both appear as short names in the same context, so the distinction matters.

A carrier that transforms from input to output can appear in both `in` and `out`:

```asm
;!      in        DE
;!      out       DE
;!      clobbers  A
```

This declares that DE carries a meaningful value on entry and a different meaningful value on exit — the routine transforms DE in place. The analyzer uses this to distinguish an intentional transformation from an accidental clobber.

---

## `@ROUTINE:` — marking subroutine entries

The `@` prefix before a label marks it as an explicit routine entry for the register-care analyzer.

```asm
;!      in        HL, B
;!      out       A
;!      clobbers  B, HL
@find_max:
```

Without `@`, AZM infers routine boundaries from the label structure — which works for simple cases but can misclassify an internal loop label as a new routine, splitting a push/pop-protected body in the middle. The `@` spelling removes the ambiguity: `@find_max:` starts the analysis span for `find_max`. Plain labels and leading-dot local labels inside the routine body are internal branch targets only.

The callable symbol is `find_max`, without the `@`. Callers write:

```asm
  call find_max
```

The `@` only appears in the label definition. It tells AZM tools "this is a subroutine entry"; it does not change the symbol name the linker and caller use.

Multiple `@` labels placed consecutively before the first instruction declare aliases for the same entry body:

```asm
@find_maximum:
@find_max:
  ; both names refer to the same code
```

Plain labels inside the routine body — loop tops, skip targets, early exits — should use the leading-dot form (`.loop:`, `.skip:`) to make clear they are intra-routine waypoints, not separate entry points.

---

## Running register-care analysis

`azm --rc warn file.asm` runs the register-care analyzer in warning mode. It reads AZMDoc contracts, infers effects from the instruction stream, and reports any conflict between what a caller has live across a call and what the callee may modify.

Given a caller that stores something in HL before calling `find_max` and then uses HL after:

```asm
  ld hl, table
  ld b, 8
  call find_max          ; find_max clobbers HL
  ld (max_val), a
  ld a, (hl)             ; HL now points past the table: bug
```

Running `azm --rc warn` on this source produces something like:

```
source.asm:6: warning: HL is live across call to find_max, but find_max may clobber H, L
```

The diagnostic names the register, the call site, and the callee. The caller can then decide: save HL before the call, reload it after, or restructure the code so HL is not needed past the call.

Three modes are available:

- `azm --rc audit source.asm` — reports conflicts without failing the build. Use this while annotating a codebase that does not yet have complete contracts.
- `azm --rc warn source.asm` — warns on every conflict. The build succeeds; all conflicts appear as warnings.
- `azm --rc error source.asm` — treats conflicts as errors. The build fails until every conflict is resolved.

Start with `--rc audit` on existing code to see the current state. Once all reported conflicts are addressed, move to `--rc warn` to catch new ones as code changes.

---

## External contracts for system calls and ROM routines

System calls and ROM routines do not have AZMDoc in their source — they are pre-assembled code, binary data, or hardware. The register-care analyzer cannot inspect their bodies.

External contracts live in `.asmi` files. A `.asmi` file is not assembly source — it contains only contract records, one per external routine, with no comment syntax:

```
extern MON_PRINT_CHAR
in A
clobbers A
end

extern MON_GET_KEY
out A
out zero
clobbers carry
end
```

Load the interface file when assembling:

```
azm --interface monitor.asmi --rc warn source.asm
```

The analyzer then knows that `MON_PRINT_CHAR` takes A as input and clobbers A, and that `MON_GET_KEY` returns A and the zero flag. Call sites that have registers live across those calls are checked against these declared effects.

If a project calls many ROM or system routines, a single `.asmi` file can hold all their contracts. The file is separate from the source so the declarations can be updated independently when the platform's documentation changes.

---

## A worked example: annotating find_max and count_above

Starting from the Chapter 10 subroutines, here is the process of adding AZMDoc contracts.

**Step 1: add `@` entry labels, no contracts yet.**

```asm
@find_max:
  ld a, 0
.loop:
  cp (hl)
  jr nc, .skip
  ld a, (hl)
.skip:
  inc hl
  djnz .loop
  ret

@count_above:
  push de
  ld d, 0
.loop:
  ld a, (hl)
  cp c
  jr c, .skip
  jr z, .skip
  inc d
.skip:
  inc hl
  djnz .loop
  ld a, d
  pop de
  ret
```

Running `azm --rc audit source.asm` at this stage reports inferred summaries for both routines and flags any call-site conflicts it can detect from the instruction stream alone. It might report:

```
source.asm: info: find_max inferred clobbers H, L, B, A
source.asm: info: count_above inferred clobbers H, L, B, A; preserves D, E, C
```

The inferred summaries are a starting point. If main has HL or B live across either call, the audit mode notes it here.

**Step 2: add contracts.**

Add `;!` lines for each routine, based on the intended behavior from Chapter 11's comment blocks:

```asm
; find_max: scan a byte table and return the largest value
;!      in        HL, B
;!      out       A
;!      clobbers  B, HL
@find_max:
  ld a, 0
.loop:
  cp (hl)
  jr nc, .skip
  ld a, (hl)
.skip:
  inc hl
  djnz .loop
  ret

; count_above: count bytes in table strictly above a threshold
;!      in        HL, B, C
;!      out       A
;!      clobbers  B, HL
@count_above:
  push de
  ld d, 0
.loop:
  ld a, (hl)
  cp c
  jr c, .skip
  jr z, .skip
  inc d
.skip:
  inc hl
  djnz .loop
  ld a, d
  pop de
  ret
```

`count_above` does not list D in `clobbers` because the push/pop makes DE externally preserved — the caller's D and E are intact after the call. The declared interface only describes what the caller sees. What happens inside the subroutine body is invisible to callers, as long as the contract is correct.

**Step 3: verify with --rc warn.**

```
azm --rc warn source.asm
```

If main reloads HL and B before each call (as Chapter 10's main did), the check passes with no diagnostics. If main tries to use HL after `find_max` without reloading it, the analyzer reports the conflict. The contract on `find_max` — `clobbers B, HL` — gives the analyzer the information it needs to flag that specific call site.

**Step 4: catch a wrong contract.**

Suppose a future version of `find_max` is changed to record the address of the maximum element in a global, and the clobbers line is not updated:

```asm
;!      clobbers  B, HL   <— now also clobbers DE (the new code uses DE internally)
@find_max:
  ; new body that uses DE
  ...
  ret
```

With `--rc error`, the assembler infers that `find_max` clobbers DE, compares that against the declared contract (which says nothing about DE), and flags the mismatch. The contract and the code are out of sync — the declared interface is a lie, and any caller that relies on DE being preserved across a call to `find_max` has a latent bug.

---

## Summary

- AZMDoc uses `;!` lines immediately before a routine entry to declare structured register contracts. Keys: `in`, `out`, `clobbers`, `preserves`.
- Carrier lists are comma-separated register and flag names. Register pairs (`BC`, `HL`) expand to their constituent 8-bit registers. Flags are named individually: `carry`, `zero`, `sign`, `parity`, `halfCarry`.
- `@Name:` marks a label as an explicit routine entry for register-care analysis. The callable symbol is `Name` without the `@`.
- Internal branch targets (loops, skip labels, error exits) should use leading-dot labels (`.loop:`, `.skip:`) and do not receive AZMDoc contracts.
- `azm --rc audit` reports without failing. `--rc warn` warns. `--rc error` fails the build on conflicts.
- External contracts for system calls and ROM routines live in `.asmi` files and are loaded with `azm --interface`.
- The contract describes the externally visible interface, not internal scratch. A register preserved via push/pop does not appear in `clobbers`.

---

## Exercises

**1. Write a contract.** Given this subroutine, write the correct AZMDoc contract block. Identify what goes in each of `in`, `out`, `clobbers`, and whether `preserves` is needed:

```asm
; copy_bytes: copy B bytes from HL to DE
copy_bytes:
  push bc
.loop:
  ld a, (hl)
  ld (de), a
  inc hl
  inc de
  djnz .loop
  pop bc
  ret
```

Which registers does the caller lose? Which are preserved? Does the push/pop on BC affect what goes into `clobbers`?

**2. Read a register-care diagnostic.** The following output appears when running `azm --rc warn source.asm`:

```
source.asm:18: warning: C is live across call to find_max, but find_max may clobber C
```

Looking at `find_max`'s contract (`in HL, B`, `out A`, `clobbers B, HL`), explain what the warning actually means. Is C in `find_max`'s clobbers list? Where did the analyzer get the information to generate this warning? What should the caller do to fix it?

**3. Write an external contract.** A program calls `BIOS_READ_SECTOR`, a ROM routine that reads a disk sector. It takes HL as the address of a 512-byte buffer (where the sector will be written), B as the sector number, and returns carry clear on success, carry set on error. It clobbers A, BC, and DE. Write the `.asmi` contract for `BIOS_READ_SECTOR`.

**4. Spot the wrong contract.** This subroutine has a contract that does not match its body:

```asm
; normalize: clamp A to range 0-127
;!      in        A
;!      out       A
;!      clobbers  B
@normalize:
  cp $80
  jr c, .done
  ld a, $7F
.done:
  ret
```

Read the code. Does it actually use or clobber B? What is the cost of declaring a false clobber? What is the cost of missing a true clobber? Rewrite the contract accurately.

---

[← Subroutine Conventions](11-subroutine-conventions.md) | [Part 1](index.md) | [Layout Types →](13-layout-types.md)
