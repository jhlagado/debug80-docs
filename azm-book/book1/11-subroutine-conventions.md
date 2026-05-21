---
layout: default
title: "Chapter 11 — Subroutine Conventions"
parent: "AZM Book 1 — Z80 Fundamentals"
grand_parent: "AZM Books"
nav_order: 11
---
[← A Complete Program](10-a-complete-program.md) | [Book 1](index.md) | [Register Contracts →](12-register-contracts-azmdoc.md)

# Chapter 11 — Subroutine Conventions

Chapter 10's two subroutines worked. `find_max` received HL and B, returned A. `count_above` received HL, B, and C, returned A. Both got the right answers. But `count_above` used D as an internal running counter and clobbered it on exit — and nothing in the code said so. A caller that had a value in D before the call would find it gone afterward, with no warning and no error.

That is the problem this chapter names: in flat Z80 assembly, subroutines communicate their interface and side effects only through discipline and comments. Nothing else exists. This chapter describes that discipline — the conventions that make subroutines safe to call, read, and modify.

---

## The register-passing convention

Z80 subroutines pass arguments in registers. There is no other mechanism at the machine level. The convention for which registers carry which kinds of values is informal, but widely followed:

- **HL** carries a 16-bit address or pointer — the start of a table, a buffer, a string.
- **BC** carries a 16-bit count or value — loop counts, word quantities.
- **B** alone carries an 8-bit count when only one is needed.
- **C** carries a single-byte argument when something other than the count is needed.
- **DE** carries a second address — most commonly a destination when HL is the source.
- **A** carries a single byte that needs a fast path — a byte value, a flag, a character.

Return values follow a matching convention:

- **A** carries a byte result.
- **HL** carries a 16-bit result — an address, a computed word.

These are not enforced by the assembler. They are agreements between the writer of a subroutine and the writers of its callers. When everyone follows the same convention, reading a call site tells you what is going in and what is coming out. When the convention is violated or misunderstood, the caller gets garbage.

---

## Callee-save and caller-save registers

Every subroutine touches at least a few registers. The question is whether the caller can rely on those registers being unchanged after the call.

The convention divides registers into two groups.

**Caller-save registers** are registers the caller accepts may be destroyed by the call. A, F, and any register the caller explicitly passes as an argument fall into this category. The caller is responsible for saving anything in those registers that it still needs — before the call, not after.

**Callee-save registers** are registers the subroutine must restore before it returns, if it uses them internally. BC, DE, HL, IX, and IY are callee-save. If a subroutine uses any of those as scratch storage, it must push them at entry and pop them before returning.

The mechanism is push and pop:

```asm
my_routine:
  push bc
  push de
  ; ... body that uses BC and DE internally ...
  pop de
  pop bc
  ret
```

The pops mirror the pushes in reverse order. The stack is LIFO — last in, first out — so the last register pushed must be the first popped. Getting this order wrong swaps the values back into the wrong registers. The assembler does not catch it.

`find_max` from Chapter 10 is clean on this front: it only uses HL and B, both of which are its inputs. Nothing else gets touched. But `count_above` uses D internally as the running counter. D is callee-save. A caller that kept something in D before calling `count_above` would lose it.

The fix: push and pop DE around the body.

```asm
count_above:
  push de            ; save caller's DE (D used internally as counter)
  ld d, 0            ; D = running count
.loop:
  ld a, (hl)
  cp c
  jr c, .skip        ; A < threshold: skip
  jr z, .skip        ; A = threshold: skip (strictly above only)
  inc d
.skip:
  inc hl
  djnz .loop
  ld a, d            ; return count in A
  pop de             ; restore caller's DE
  ret
```

The push at the top saves whatever the caller had in DE. The pop at the bottom restores it. The caller's D and E values are the same after the call as before. The fact that `count_above` used D internally is invisible to the caller.

One timing issue: the pop must appear on every return path. A subroutine that has multiple exit points needs a pop on each one. Missing a pop on one path leaves the stack misaligned, and the eventual `ret` will jump to whatever garbage value ended up at the stack pointer.

---

## The IX frame for local storage

Register passing works for a small number of arguments. When a subroutine needs more temporary storage than the remaining free registers can provide, the stack is the answer.

The technique uses IX as a base pointer into the stack. The subroutine allocates a block of bytes on the stack at entry, accesses them through IX-relative addressing, and deallocates the block before returning.

The prologue establishes the frame:

```asm
my_routine:
  push ix            ; save caller's IX
  ld ix, 0
  add ix, sp         ; IX now points to the frame base (top of stack)
```

After these three instructions, IX holds the current stack pointer. The two bookkeeping entries are already on the stack:

```
  higher addresses
  ┌────────────────────────────────────┐
  │  saved IX high byte    IX+1        │
  │  saved IX low byte     IX+0  ← IX  │  frame base
  ├────────────────────────────────────┤
  │  return address high   IX+3        │  pushed by CALL
  │  return address low    IX+2        │  pushed by CALL
  │  ... (caller's stack below)        │
  └────────────────────────────────────┘
  lower addresses
```

If the caller pushed arguments onto the stack before the `call`, they sit above the return address:

```
  │  arg high byte         IX+5        │  ← pushed by caller
  │  arg low byte          IX+4        │  ← pushed by caller
  │  return address high   IX+3        │
  │  return address low    IX+2        │
  │  saved IX high         IX+1        │
  │  saved IX low          IX+0  ← IX  │  frame base
```

Arguments pushed by the caller appear at IX+4 and above. You never read IX+0 through IX+3 directly — those slots belong to the bookkeeping.

To allocate local storage, decrement SP once per byte needed:

```asm
  dec sp
  dec sp             ; allocate 2 bytes of local storage
```

The two bytes are now at IX−1 and IX−2. Access them with indexed addressing:

```asm
  ld (ix-1), a       ; write first local
  ld a, (ix-2)       ; read second local
```

The epilogue undoes both steps and restores IX for the caller:

```asm
  ld sp, ix          ; restore SP to frame base (discards locals)
  pop ix             ; restore caller's IX
  ret
```

The `ld sp, ix` line removes all local storage in one instruction, regardless of how many bytes were allocated. No matching `inc sp` sequence is needed.

This is the same IX-relative addressing you learned for table indexing. Inside a framed subroutine, IX holds the frame base instead of a table base. The instruction form is identical; only the purpose changes.

A caution: the index displacement in `(ix+d)` is a signed 8-bit value. For locals, d is negative (−1 through −128). For caller-pushed args, d is positive (4 through 127). The maximum frame size is 128 bytes of locals and 124 bytes of arguments. For most subroutines this is more than enough.

---

## Register documentation

The only way to communicate a subroutine's register interface in plain assembly is a comment block. Nothing else runs at assembly time.

The comment block lives immediately before the subroutine label and declares every input, every output, and every register the subroutine leaves changed:

```asm
; find_max: scan a byte table and return the largest value
; In:  HL = pointer to first byte of table
;      B  = number of bytes to scan
; Out: A  = maximum value found
; Clobbers: B (reaches 0 after the loop), HL (advances past last byte)
find_max:
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

`Clobbers` lists every register the caller should not rely on after the call. `find_max` destroys both B and HL in normal operation — B counts down to zero via `djnz`, and HL walks through the table. Any caller that needs the original B or HL after the call must save them first.

The comment block for `count_above` with push/pop discipline:

```asm
; count_above: count bytes in a table that are strictly above a threshold
; In:  HL = pointer to first byte of table
;      B  = number of bytes to scan
;      C  = threshold value
; Out: A  = count of bytes where (byte > threshold)
; Clobbers: B (reaches 0), HL (advances past last byte)
; Preserves: C, D, E (DE saved via push/pop)
count_above:
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

`Preserves` lists registers the subroutine explicitly restores. Declaring `Preserves: C, D, E` tells callers that DE is safe across the call even though `count_above` uses D internally.

The problem is that these comments have no enforcement. A wrong comment, a callee that was modified after the comment was written, a caller that misread the convention — all fail silently. The assembler passes the code. The CPU runs it. The bug appears at runtime, sometimes far from its origin.

Chapter 12 shows what AZM provides beyond comments: a structured declaration syntax that the register-care analyzer can read and verify.

---

## A worked example: the complete pair

Here are both subroutines from Chapter 10 with full push/pop discipline and complete comment blocks.

```asm
; find_max: scan a byte table and return the largest value
; In:  HL = pointer to first byte
;      B  = count (number of bytes to scan)
; Out: A  = maximum value found
; Clobbers: B (reaches 0 after djnz), HL (points past last byte)
; Preserves: C, D, E, IX, IY
find_max:
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

`find_max` uses only its input registers and A. Nothing else is touched, so nothing else needs push/pop. The clobber list accurately reflects what the caller loses.

```asm
; count_above: count bytes in a table strictly above a threshold
; In:  HL = pointer to first byte
;      B  = count (number of bytes to scan)
;      C  = threshold value (bytes must be strictly greater to count)
; Out: A  = number of bytes where byte > threshold
; Clobbers: B (reaches 0 after djnz), HL (points past last byte)
; Preserves: C, D, E (DE saved via push/pop)
count_above:
  push de            ; D used as counter; save caller's DE
  ld d, 0
.loop:
  ld a, (hl)
  cp c               ; compare byte against threshold
  jr c, .skip        ; A < C: skip (carry set = unsigned less-than)
  jr z, .skip        ; A = C: skip (zero set = equal, not above)
  inc d              ; A > C: increment counter
.skip:
  inc hl
  djnz .loop
  ld a, d            ; move count from D into A for return
  pop de             ; restore caller's DE before returning
  ret
```

The structure is: save anything the caller might need, do the work, restore before returning. The caller of `count_above` can keep a value in DE across the call and trust it will be intact — as long as the comment is correct.

The main sequence that calls both:

```asm
main:
  ld hl, values
  ld b, 8
  call find_max
  ld (max_val), a

  ld hl, values      ; reload HL — find_max walked it to the end
  ld b, 8            ; reload B — find_max consumed it
  ld c, 64
  call count_above
  ld (above_64), a
  ret
```

The two reloads before `count_above` are not optional. `find_max` clobbered HL and B — the comment says so, and the code confirms it. Every caller of `find_max` must either not need HL and B afterward, or reload them.

---

## Summary

- The informal Z80 calling convention passes addresses in HL, counts in B or BC, single bytes in A or C, and a second address in DE. Byte results return in A; word results return in HL.
- Callee-save registers (BC, DE, HL, IX, IY) must be pushed at entry and popped before return if the subroutine uses them as scratch storage. A and F are caller-save.
- Pops must mirror pushes in reverse order. Every return path needs the matching pop sequence, or the stack alignment breaks and `ret` jumps to the wrong address.
- The IX frame provides local storage on the stack. The prologue saves IX, sets IX = SP, and allocates bytes with `dec sp`. Locals sit at negative IX offsets. The epilogue restores SP with `ld sp, ix` and pops IX.
- If the caller pushes arguments onto the stack before the `call`, they sit at IX+4 and above after the prologue.
- A comment block declaring inputs, outputs, clobbers, and preserved registers is the only documentation mechanism in plain assembly. Nothing verifies it.

---

## Exercises

**1. Trace push/pop order.** A subroutine has this entry sequence:

```asm
  push bc
  push hl
  push af
```

Write the correct epilogue (three pops in the right order). Then explain what happens if the order is reversed.

**2. Identify what to save.** A subroutine receives HL as an input table pointer and B as a byte count. Internally, it uses C and D as scratch, and E as a second counter. Which registers need push/pop discipline? Which do not? Write the push sequence at entry and the matching pop sequence at exit.

**3. Build an IX frame.** Write the prologue and epilogue for a subroutine that needs four bytes of local storage. Use `(ix-1)` through `(ix-4)` for the locals. Then write the two instructions that write the value 42 into the first local and read it back into A.

**4. Spot the bug.** The following subroutine has a return path that misses a pop:

```asm
sum_bytes:
  push bc
  ld c, 0            ; C = running sum
.loop:
  ld a, (hl)
  add a, c
  ld c, a
  inc hl
  djnz .loop
  ld a, c
  pop bc
  ret
```

If `b` is loaded with 0 before the call, `djnz` will execute 256 times (the Z80's zero-count behaviour). Suppose instead that a separate error path is added that returns early when a zero byte is found:

```asm
  ld a, (hl)
  or a
  jr z, .early_exit  ; found zero, abort
  add a, c
  ld c, a
  inc hl
  djnz .loop
  ld a, c
  pop bc
  ret
.early_exit:
  ld a, 0
  ret                ; BUG: missing pop
```

Explain exactly what happens to the caller's BC and to the stack when the early exit fires. Write the corrected version.

---

[← A Complete Program](10-a-complete-program.md) | [Book 1](index.md) | [Register Contracts →](12-register-contracts-azmdoc.md)
