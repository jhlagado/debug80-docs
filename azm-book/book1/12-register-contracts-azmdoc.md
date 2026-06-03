---
layout: default
title: "Chapter 12 — Register Contracts with AZMDoc"
parent: "AZM Book 1 — Z80 Fundamentals"
nav_order: 12
---
[← Subroutine Conventions](11-subroutine-conventions.md) | [Book 1](index.md) | [Layout Types →](13-layout-types.md)

# Chapter 12 — Register Contracts with AZMDoc

Chapter 11's comment block is the right idea: the subroutine declares what it reads, what it returns and what it destroys; the caller reads that and writes code accordingly. But a semicolon comment can say anything, and nothing checks whether the comment still matches the code after the tenth edit.

AZMDoc is AZM's structured contract format — ordinary `;!` comment lines that the **register contract** analyzer reads. The syntax stays in comments, so other assemblers ignore it. AZM treats it as machine-checkable boundary information at every `call`. That is one of AZM's defining features: informal subroutine discipline becomes something the assembler can verify.

This chapter is not a syntax appendix. It teaches the mental model — caller liveness, callee boundaries, flags as return values, `@` entry spans, external `.asmi` contracts and the CLI workflow that makes register contracts part of daily work.

---

## The bug contracts catch

Consider a caller that keeps HL live across a call:

```asm
    ld hl, table
    ld b, 8
    call find_max
    ld a, (hl)             ; BUG if find_max clobbered HL
```

If `find_max` walks HL through the table and does not restore it, HL now points past the end. The next `ld a, (hl)` reads the wrong byte. The assembler still accepts the program; the CPU runs it; the bug is silent.

AZMDoc plus register contracts close that gap. A contract on `find_max` might say:

```asm
; find_max: scan a byte table and return the largest value
;!      in        HL, B
;!      out       A
;!      clobbers  B, HL
@find_max:
```

Running `azm --rc warn source.asm` can then report:

```text
source.asm:6: warning: HL is live across call to find_max, but find_max may clobber H, L
```

The analyzer does not need to know what `table` means. It only needs to know: the caller had a value in HL, called something that may destroy HL, then used HL again. That is enough to flag a real bug.

The fix is caller-side: reload HL, save it before the call or stop using HL after the call:

```asm
    ld hl, table
    ld b, 8
    call find_max
    ld hl, table        ; reload — find_max clobbered HL
    ld a, (hl)
```

Register contracts are not linting for style. They are **boundary checking** at subroutine calls — turning "I thought HL was still valid" into a diagnostic with a line number.

---

## A contract is the boundary between caller and callee

The caller asks one question about every register it still plans to use after `call`:

> Is this register still mine?

The callee contract answers:

```asm
;!      clobbers  HL
```

"No — HL may be different after return."

The caller sees only the **external interface**: registers and flags that must be set on entry, registers and flags that carry results on exit and registers the routine destroys without restoring. Everything that happens inside the body — scratch registers, loop counters, temporary pushes — matters only if it leaks across `ret`.

That caller-side **liveness** idea is the heart of register contracts. The subroutine body can be long; the contract is short because it describes the door, not the room.

---

## Caller and callee see different things

### Internal scratch is not an `out`

A loop counter in B is internal:

```asm
@copy_bytes:
    ld b, 4
CopyBytesLoop:
    ...
    djnz CopyBytesLoop
    ret
```

The caller does not read B after return. B was scratch inside the routine. You do **not** write `out B` unless the caller is supposed to use B as a result. Register contracts care whether the caller's B was preserved, not whether B changed inside the callee.

### `push` / `pop` means preserved, not `out`

```asm
@copy_bytes:
    push bc
CopyBytesLoop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz CopyBytesLoop
    pop bc
    ret
```

BC is restored before `ret`. The caller's BC is intact. Correct contract:

```asm
;!      in        HL, DE, B
;!      clobbers  A, HL, DE
```

BC does not appear in `clobbers` because the push/pop pair preserved it. Writing `out BC` would wrongly suggest the caller should read BC as a return value.

### Common mistake: confusing preserved with returned

```asm
push bc
...
pop bc
ret
```

does **not** mean `out BC`. It means BC is preserved, so it usually does not appear in the generated contract at all.

Likewise:

```asm
ld b, 4
CalcLoop:
    ...
    djnz CalcLoop
ret
```

does **not** mean `out B` unless the caller is meant to read B after return. B was an internal loop counter.

This distinction is the bug pattern behind many real projects: a tool or human sees `ld b, …` inside a routine and assumes B is an output. The contract should describe what the **caller** may rely on, not every register touched along the way.

---

## The four contract words

AZMDoc lines start with `;!` immediately before a routine entry. The four keys are:

| Key | Meaning |
|-----|---------|
| `in` | Registers and flags whose incoming value is meaningful to the routine |
| `out` | Registers and flags that carry the returned result |
| `clobbers` | Registers and flags the routine modifies and does not restore |
| `preserves` | Registers and flags explicitly restored before return (uncommon when push/pop already handled it) |

A complete contract for `find_max`:

```asm
; find_max: scan a byte table and return the largest value
;!      in        HL, B
;!      out       A
;!      clobbers  B, HL
@find_max:
  ld a, 0
FindMaxLoop:
  cp (hl)
  jr nc, FindMaxSkip
  ld a, (hl)
FindMaxSkip:
  inc hl
  djnz FindMaxLoop
  ret
```

The human-readable `;` line stays for prose. The `;!` lines are what the analyzer parses.

Carrier lists use comma-separated names:

```asm
;!      in        A, DE, HL
;!      out       carry
;!      clobbers  BC
```

Register pairs are shorthand: `BC` means B and C. Flags are named individually: `carry`, `zero`, `sign`, `parity`, `halfCarry`. Use `carry` for the carry flag and `C` for register C — both are short names; the distinction matters.

A carrier that transforms in place can appear in both `in` and `out`:

```asm
;!      in        DE
;!      out       DE
;!      clobbers  A
```

That declares an intentional transformation, not an accidental clobber.

---

## Flags are return values

AZM Book 2 uses carry for success and failure (`ring_push`, `ring_pop` and others). Flags are first-class contract carriers, not an afterthought.

### Success on carry set

```asm
; try_read: read one byte into A; carry set on success
;!      in        HL
;!      out       A, carry
;!      clobbers  BC, HL
@try_read:
    ...
    scf
    ret
TryReadEmpty:
    or a        ; clears carry
    ret
```

The human comment explains *meaning* (success vs empty). The contract names the **carrier**:

```asm
;!      out       carry
```

### Empty test on zero

```asm
; is_empty: return whether count byte is zero
;!      out       zero
@is_empty:
    ld a, (count)
    or a
    ret
```

`or a` sets Z when A is zero. Callers test with `jr z`, `jr nz`, `ret z` or `call nz` — those instructions are evidence the flag mattered.

### Teaching point

A flag can be the entire return value. You do not need a separate error code byte when carry or zero already communicates success, failure or "found". Document the flag in `out`; put semantic wording in the plain `;` line above the contract:

```asm
; ring_push: append byte in A; carry set on success, carry clear when full
;!      in        A, IX
;!      out       carry
;!      clobbers  BC, DE, HL
@ring_push:
```

Avoid embedding flag syntax in the machine line (`out F.C`) when `out carry` is the formal carrier and the comment carries the success/failure story.

### `out` and `clobbers` must not contradict

Register pairs in `clobbers` expand to their parts: `AF` means A and F together. If A or a flag is an **`out`**, do not also list that carrier inside a broad `clobbers AF` line — beginners read that as “return A, but destroy A.”

Rule: **`out` describes what the caller may rely on after `ret`; `clobbers` lists everything else destroyed without restore.** When A and carry are outputs, name them in `out` and list only the other scratch registers in `clobbers`:

```asm
; ring_pop: oldest byte in A; carry set on success, carry clear when empty
;!      in        IX
;!      out       A, carry
;!      clobbers  BC, DE, HL
@ring_pop:
```

Register contracts treat `out` as authoritative at the return boundary. Internal use of A or flags mid-routine does not require listing A in `clobbers` when the contract promises a defined A and carry on exit.

---

## Mark real entries with `@`

The `@` prefix marks an explicit routine entry for register contract analysis:

```asm
;!      in        HL, B
;!      out       A
;!      clobbers  B, HL
@find_max:
```

Without `@`, AZM infers boundaries from label structure. That works for tiny routines but can misclassify internal labels as separate routines — splitting a push/pop body in the middle and producing nonsense contracts.

### Failure story: ambiguous routine boundaries

```asm
check_collision:
    push bc
    ...
loop:                   ; plain label — looks like a new routine boundary
    ...
done:                   ; another apparent boundary
    pop bc
    ret
```

Without `@` labels, AZM's heuristic treats `loop` and `done` as new routine boundaries. The `push bc` appears in one inferred routine and `pop bc` in another, so inferred preservation makes no sense.

Correct shape:

```asm
@check_collision:
    push bc
    ...
CollisionLoop:
    ...
CollisionDone:
    pop bc
    ret
```

`@check_collision:` starts the analysis span and makes routine boundaries explicit. Plain labels inside the body — `CollisionLoop`, `CollisionDone` — are branch targets, not new routines. The callable symbol remains `check_collision` — callers write `call check_collision`, not `call @check_collision`.

Multiple `@` labels before the first instruction declare aliases for the same body:

```asm
@find_maximum:
@find_max:
  ...
```

---

## AZMDoc syntax reference

Lines starting with `;!` immediately before `@entry` carry the contract. Register contract modes:

| Command | Effect |
|---------|--------|
| `azm --rc audit source.asm` | Infer contracts and write requested artifacts; no register contract diagnostics |
| `azm --rc warn source.asm` | Warnings on conflicts; build succeeds |
| `azm --rc error source.asm` | Errors on conflicts; build fails |

Practical workflow beyond audit/warn/error:

```sh
azm --rc audit --reg-report source.asm
azm --contracts --rc audit source.asm
azm --reg-interface source.asm
azm --rc error --interface monitor.asmi source.asm
```

| Flag | Role |
|------|------|
| `--reg-report` | Inspect what AZM inferred per routine |
| `--contracts` | Generate or upgrade `;!` blocks from inference |
| `--reg-interface` | Export `.asmi` contracts from annotated source |
| `--interface file.asmi` | Import contracts for code you cannot inspect |

Typical progression: run `--rc audit --reg-report` on legacy code, add `@` entries and `;!` lines (or `--contracts` as a draft), fix call sites, then enforce with `--rc warn` or `--rc error`.

---

## External code uses `.asmi`

ROM routines, monitor calls, BIOS entry points and Debug80 stubs have no AZM source to analyze. Register contract analysis cannot inspect their bodies. **`.asmi`** files declare their boundaries — one record per external symbol, no comment syntax:

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

Load when assembling:

```sh
azm --interface monitor.asmi --rc warn source.asm
```

Caller in source:

```asm
    ld a, 'A'
    call MON_PRINT_CHAR
```

AZM cannot see inside ROM. `.asmi` is how you teach the analyzer what the external routine does — the same `in` / `out` / `clobbers` vocabulary as `;!` blocks, stored in a separate file you can share across projects (MON3, platform ROM tables, emulator integration).

If a project calls many system routines, one `.asmi` file holds all declarations. Update it when platform documentation changes; source files stay unchanged.

Book 2 Chapter 7 revisits `.include` and library layout; the external boundary story lives here in Book 1.

---

## A worked example: annotating find_max and count_above

From Chapter 10's subroutines:

**Step 1 — add `@` entries, no contracts yet.**

```asm
@find_max:
  ld a, 0
FindMaxLoop:
  cp (hl)
  jr nc, FindMaxSkip
  ld a, (hl)
FindMaxSkip:
  inc hl
  djnz FindMaxLoop
  ret

@count_above:
  push de
  ld d, 0
CountAboveLoop:
  ld a, (hl)
  cp c
  jr c, CountAboveSkip
  jr z, CountAboveSkip
  inc d
CountAboveSkip:
  inc hl
  djnz CountAboveLoop
  ld a, d
  pop de
  ret
```

`azm --rc audit --reg-report source.asm` shows inferred summaries and any call-site conflicts visible without contracts.

**Step 2 — add contracts from intended behavior.**

```asm
; find_max: scan a byte table and return the largest value
;!      in        HL, B
;!      out       A
;!      clobbers  B, HL
@find_max:
  ...

; count_above: count bytes strictly above threshold in C
;!      in        HL, B, C
;!      out       A
;!      clobbers  B, HL
@count_above:
  push de
  ld d, 0
  ...
  pop de
  ret
```

D does not appear in `clobbers` because push/pop preserves DE for the caller. The contract describes the door: caller's DE is intact; internal use of D is invisible.

**Step 3 — verify.**

```sh
azm --rc warn source.asm
```

If `main` reloads HL before each call (Chapter 10), checks pass. If `main` uses HL after `find_max` without reloading, register contracts report the conflict against `clobbers HL`.

**Step 4 — catch a lying contract.**

If `find_max` later uses DE internally but the contract still omits DE:

```asm
;!      clobbers  B, HL   ; stale — body now uses DE
@find_max:
  ...
```

With `--rc error`, inferred effects that exceed the declared contract are flagged. Callers that relied on DE across the call had a latent bug; the stale contract hid it.

---

## Register contract scope

Register contracts verify **register and flag boundary consistency** at calls. Keep these separate checks in your review:

- Algorithm correctness (GCD, sort order, chess rules)
- Memory aliasing (two pointers to the same buffer)
- Stack depth or overflow
- Interrupt safety or re-entrancy
- Semantic meaning of values in registers (HL as string vs table vs node)

Use it where informal discipline breaks down: live registers across `call`, documented clobbers vs actual code and external routines described in `.asmi`. It turns comments into checkable promises at the boundary — AZM's killer feature for maintainable assembly, not a replacement for thinking about the algorithm.

---

## Summary

- A contract is checked at the **call site**: caller liveness vs callee `in` / `out` / `clobbers`.
- **Internal scratch** and **push/pop preservation** are not `out` values; preserved registers usually omit `clobbers`.
- **Flags** (`carry`, `zero`, …) are first-class returns; put meaning in human `;` lines, carriers in `;! out`.
- **`@name:`** marks routine entries; plain labels inside an `@` body are branch targets, not new routines.
- **`.asmi`** describes ROM/monitor/external code; **`--interface`** imports it.
- Workflow: **`--reg-report`**, **`--contracts`**, **`--reg-interface`**, then **`--rc warn`** or **`--rc error`**.

---

## Exercises

**1. Write a contract.** Given this subroutine, write the correct AZMDoc block (`in`, `out`, `clobbers`; use `preserves` only if needed):

```asm
; copy_bytes: copy B bytes from HL to DE
copy_bytes:
  push bc
CopyBytesLoop:
  ld a, (hl)
  ld (de), a
  inc hl
  inc de
  djnz CopyBytesLoop
  pop bc
  ret
```

Does push/pop on BC belong in `clobbers` or not? Why?

**2. Read a diagnostic.**

```text
source.asm:18: warning: HL is live across call to find_max, but find_max may clobber H, L
```

`find_max` declares `clobbers B, HL` only. What does the warning mean? What should the caller change?

**3. Write an external contract.** `BIOS_READ_SECTOR` takes HL = buffer, B = sector number; returns **carry clear** on success, **carry set** on error; clobbers A, BC, DE. Write the `.asmi` record (use `carry`, not `F.C`).

**4. Flags as return.** Write `ring_try_pop` that returns the oldest byte in A with **carry set** on success and **carry clear** when empty. Include human `;` line and `;!` block. Show one caller fragment that branches on carry after `call`.

**5. Spot the wrong contract.**

```asm
; normalize: clamp A to range 0-127
;!      in        A
;!      out       A
;!      clobbers  B
@normalize:
  cp $80
  jr c, NormalizeDone
  ld a, $7F
NormalizeDone:
  ret
```

Does the body use B? What is the cost of a false clobber vs a missing one? Rewrite the contract.

**6. `@` and branch labels.** Rewrite `check_collision` from this chapter using `@check_collision:` and plain prefixed labels such as `CollisionLoop` and `CollisionDone`. Explain in one sentence why adding `@check_collision:` prevents those labels from being treated as separate routine boundaries.

---

[← Subroutine Conventions](11-subroutine-conventions.md) | [Book 1](index.md) | [Layout Types →](13-layout-types.md)
