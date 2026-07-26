---
layout: default
title: "Register Contracts"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 12
---
[← Subroutine Conventions](11-subroutine-conventions.md) | [Book 2](index.md) | [Layout Types →](13-layout-types.md)

# Chapter 12 — Register Contracts

Chapter 11's contract is the right idea: the subroutine declares what it reads, what it returns and what it destroys; the caller reads that and writes code accordingly. An ordinary comment can drift away from the code after repeated edits.

The `.routine` directive is AZM's structured contract format.

---

## A Register-Liveness Bug

Consider a caller that keeps HL live across a call:

```asm
    ld hl, table
    ld b, 8
    call find_max
    ld a, (hl)             ; BUG if find_max clobbered HL
```

If `find_max` walks HL through the table and does not restore it, HL now points past the end. The next `ld a, (hl)` reads the wrong byte. The assembler still accepts the program; the CPU runs it; the bug is silent.

A contract on `find_max` might say:

```asm
; find_max: scan a byte table and return the largest value
.routine in HL,B out A clobbers B,HL,F
find_max:
```

Running `azm --rc warn source.asm` can then report:

```text
source.asm:6: warning: HL is live across call to find_max, but find_max may clobber H, L
```

The analyzer does not need to know what `table` means. It only needs to know: the caller had a value in HL, called something that may destroy HL, then used HL again.

The fix is caller-side: reload HL, save it before the call or stop using HL after the call:

```asm
    ld hl, table
    ld b, 8
    call find_max
    ld hl, table        ; reload — find_max clobbered HL
    ld a, (hl)
```

Register contracts check subroutine boundaries and can replace an incorrect
assumption about HL with a diagnostic at the call site.

---

## A contract is the boundary between caller and callee

For every register used after `call`, compare the caller's required value with
the callee contract:

```asm
.routine clobbers HL
```

Here HL may be different after return, so the caller must not reuse its
incoming value without saving or reloading it.

The caller sees only the **external interface**: registers and flags that must be set on entry, registers and flags that carry results on exit and registers the routine destroys without restoring. Everything that happens inside the body (scratch registers, loop counters, temporary pushes) matters only if it leaks across `ret`.

---

## Caller and callee see different things

### Internal scratch is not an `out`

A loop counter in B is internal:

```asm
copy_bytes:
    ld b, 4
_loop:
    ...
    djnz _loop
    ret
```

You do **not** write `out B` unless the caller is supposed to use B as a result.

### `push` / `pop` means preserved, not `out`

```asm
copy_bytes:
    push bc
_loop:
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    djnz _loop
    pop bc
    ret
```

The caller's BC is intact. Correct contract:

```asm
.routine in HL,DE,B clobbers A,HL,DE
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
_loop:
    ...
    djnz _loop
ret
```

does **not** mean `out B` unless the caller is meant to read B after return.

The contract should describe what the **caller** may rely on, not every register touched along the way.

---

## The five contract words

Place `.routine` immediately before a routine entry. Its five keys are:

| Key | Meaning |
|-----|---------|
| `in` | Registers and flags whose incoming value is meaningful to the routine |
| `out` | Registers and flags that carry the returned result |
| `maybe-out` | Inferred output candidates awaiting review before promotion to `out` |
| `clobbers` | Registers and flags the routine modifies and does not restore |
| `preserves` | Registers and flags explicitly restored before return (uncommon when push/pop already handled it) |

A complete contract for `find_max`:

```asm
; find_max: scan a byte table and return the largest value
.routine in HL,B out A clobbers B,HL,F
find_max:
  ld a, 0
_loop:
  cp (hl)
  jr nc, _skip
  ld a, (hl)
_skip:
  inc hl
  djnz _loop
  ret
```

The human-readable `;` line stays for prose.

Carrier lists use comma-separated names:

```asm
.routine in A,DE,HL out carry clobbers BC
```

Register pairs are shorthand: `BC` means B and C. Flags are named individually: `carry`, `zero`, `sign`, `parity`, `halfCarry`. Use `carry` for the carry flag and `C` for register C.

A carrier that transforms in place can appear in both `in` and `out`:

```asm
.routine in DE out DE clobbers A
```

---

## Flags are return values

AZM Book 3 uses carry for success and failure (`ring_push`, `ring_pop` and others).

### Success on carry set

```asm
; try_read: read one byte into A; carry set on success
.routine in HL out A,carry clobbers BC,HL
try_read:
    ...
    scf
    ret
_empty:
    or a        ; clears carry
    ret
```

The human comment explains *meaning* (success vs empty). The contract names the **carrier**:

```asm
.routine out carry
```

### Empty test on zero

```asm
; is_empty: return whether count byte is zero
.routine out zero
is_empty:
    ld a, (count)
    or a
    ret
```

`or a` sets Z when A is zero. Callers test with `jr z`, `jr nz`, `ret z` or `call nz`; those instructions are evidence the flag mattered.

### Documenting a flag result

A flag can be the entire return value. Document the flag in `out`; put semantic wording in the plain `;` line above the contract:

```asm
; ring_push: append byte in A; carry set on success, carry clear when full
.routine in A,IX out carry clobbers BC,DE,HL
ring_push:
```

Avoid embedding flag syntax in the machine line (`out F.C`) when `out carry` is the formal carrier and the comment carries the success/failure story.

### `out` and `clobbers` must not contradict

Register pairs in `clobbers` expand to their parts: `AF` means A and F together. If A or a flag is an **`out`**, do not also list that carrier inside a broad `clobbers AF` line, since beginners read that as “return A, but destroy A.”

Rule: **`out` describes what the caller may rely on after `ret`; `clobbers` lists everything else destroyed without restore.** When A and carry are outputs, name them in `out` and list only the other scratch registers in `clobbers`:

```asm
; ring_pop: oldest byte in A; carry set on success, carry clear when empty
.routine in IX out A,carry clobbers BC,DE,HL
ring_pop:
```

Internal use of A or flags mid-routine does not require listing A in `clobbers` when the contract promises a defined A and carry on exit.

---

## Declare routine boundaries with `.routine`

The `.routine` directive marks an explicit routine entry for register contract analysis:

```asm
.routine in HL,B out A clobbers B,HL,F
find_max:
```

AZM associates the directive with the next non-local label. Owner-local labels begin with `_` and remain inside that routine's namespace.

### Routine boundaries and local labels

```asm
check_collision:
    push bc
    ...
_loop:
    ...
_done:
    pop bc
    ret
```

`_loop` and `_done` resolve under `check_collision`, so another routine may reuse those names without a collision.

Correct shape:

```asm
.routine clobbers AF
check_collision:
    push bc
    ...
_loop:
    ...
_done:
    pop bc
    ret
```

AZM has no `.endroutine`; data and ordinary labels after a routine remain ordinary declarations unless another `.routine` marks a new callable entry.

The `@` prefix has one separate job: it exports a symbol from a source unit. It does not mark a routine and has no register-contract effect:

```asm
.routine in HL,B out A clobbers B,HL,F
@find_max:
    ...
```

Callers still write `call find_max`; `@` is declaration syntax and is not part of the symbol name. `@_done:` is an error because an owner-local symbol cannot be exported.

---

## Register contract syntax reference

Register contract modes:

| Command | Effect |
|---------|--------|
| `azm --rc audit source.asm` | Analyze contracts without failing the build; useful while editing |
| `azm --rc warn source.asm` | Print warnings but still build |
| `azm --rc error source.asm` | Fail on proven register contract conflicts |
| `azm --rc strict source.asm` | Fail on anything AZM cannot prove safe |

Practical workflow:

```sh
azm --rc audit source.asm
azm --contracts --rc audit source.asm
azm --rc error source.asm
azm --rc strict source.asm
```

| Flag | Role |
|------|------|
| `--contracts` | Generate or upgrade `.routine` directives from inference |
| `--reg-interface` | Export `.asmi` contracts from annotated source |
| `--interface file.asmi` | Import contracts for code you cannot inspect |
| `--reg-report` | Advanced text report for debugging, CI evidence or large audit sessions |

Typical progression: run `--rc audit` on legacy code, add `.routine` directives (or use `--contracts` as a draft), fix call sites, then enforce with `--rc error` and `--rc strict`. Add `@` only to symbols that another source unit imports.

---

## External code uses `.asmi`

ROM routines, monitor calls, BIOS entry points and Debug80 stubs have no AZM source to analyze. **`.asmi`** files declare their boundaries, one record per external symbol, no comment syntax:

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

An `.asmi` file supplies the analyzer with the external routine's `in`, `out`
and `clobbers` information. The file can be shared by projects that use the
same MON3, platform ROM or emulator interface.

Update it when platform documentation changes; source files stay unchanged.

---

## A worked example: annotating find_max and count_above

From Chapter 10's subroutines:

**Step 1: identify the callable entries.**

```asm
find_max:
  ld a, 0
_loop:
  cp (hl)
  jr nc, _skip
  ld a, (hl)
_skip:
  inc hl
  djnz _loop
  ret

count_above:
  push de
  ld d, 0
_loop:
  ld a, (hl)
  cp c
  jr c, _skip
  jr z, _skip
  inc d
_skip:
  inc hl
  djnz _loop
  ld a, d
  pop de
  ret
```

`azm --rc audit source.asm` reports what still needs an explicit contract while you are shaping the code.

**Step 2: add contracts from intended behavior.**

```asm
; find_max: scan a byte table and return the largest value
.routine in HL,B out A clobbers B,HL,F
find_max:
  ...

; count_above: count bytes strictly above threshold in C
.routine in HL,B,C out A clobbers B,HL,F
count_above:
  push de
  ld d, 0
  ...
  pop de
  ret
```

D does not appear in `clobbers` because push/pop preserves DE for the caller.

**Step 3: verify.**

```sh
azm --rc warn source.asm
```

If `main` reloads HL before each call (Chapter 10), checks pass. If `main` uses HL after `find_max` without reloading, register contracts report the conflict against `clobbers HL`.

**Step 4: catch a stale contract.**

If `find_max` later uses DE internally but the contract still omits DE:

```asm
; stale contract: body now uses DE
.routine clobbers B,HL,F
find_max:
  ...
```

With `--rc error`, inferred effects that exceed the declared contract are flagged.

---

## Register contract scope

Register contracts verify **register and flag boundary consistency** at calls. Keep these separate checks in your review:

- Algorithm correctness (GCD, sort order, chess rules)
- Memory aliasing (two pointers to the same buffer)
- Stack depth or overflow
- Interrupt safety or re-entrancy
- Semantic meaning of values in registers (HL as string vs table vs node)

---

## Exercises

**1. Write a contract.** Given this subroutine, write the correct register contract (`in`, `out`, `clobbers`; use `preserves` only if needed):

```asm
; copy_bytes: copy B bytes from HL to DE
copy_bytes:
  push bc
_loop:
  ld a, (hl)
  ld (de), a
  inc hl
  inc de
  djnz _loop
  pop bc
  ret
```

Does push/pop on BC belong in `clobbers` or not? Why?

**2. Read a diagnostic.**

```text
source.asm:18: warning: HL is live across call to find_max, but find_max may clobber H, L
```

`find_max` declares `clobbers B, HL, F`. What does the warning mean? What
should the caller change?

**3. Write an external contract.** `BIOS_READ_SECTOR` takes HL = buffer, B = sector number; returns **carry clear** on success, **carry set** on error; clobbers A, BC, DE. Write the `.asmi` record (use `carry`, not `F.C`).

**4. Flags as return.** Assume an existing routine named `ring_try_pop` returns
the oldest byte in A with **carry set** on success and **carry clear** when
empty. Write its human `;` contract and `.routine` declaration, then show one
caller fragment that branches on carry after `call`. The ring-buffer
implementation is outside this exercise.

**5. Spot the wrong contract.**

```asm
; normalize: clamp A to range 0-127
.routine in A out A clobbers B
normalize:
  cp $80
  jr c, _done
  ld a, $7F
_done:
  ret
```

Does the body use B? What is the cost of a false clobber vs a missing one? Rewrite the contract.

**6. Routine and branch labels.** Rewrite `check_collision` using `.routine` before `check_collision:` and owner-local labels `_loop` and `_done`. Explain why another routine can reuse `_loop` without a duplicate-symbol error.

---

[← Subroutine Conventions](11-subroutine-conventions.md) | [Book 2](index.md) | [Layout Types →](13-layout-types.md)
