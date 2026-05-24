---
layout: default
title: "Chapter 6 — Recursion"
parent: "AZM Book 3 — Algorithms and Data Structures"
grand_parent: "AZM Books"
nav_order: 7
---
[← Records](05-records.md) | [Book 3](index.md) | [Composition →](07-composition.md)

# Chapter 6 — Recursion

Chapter 5 kept all state in registers, workspace bytes, or a `RingState` record. The routines called other routines, but never themselves. This chapter adds **recursion**: the same subroutine label on the `call` instruction that defines it, with a base case that stops the chain.

Recursion is not a separate Z80 feature. It is nested `call` with a finite base case, and the **hardware stack** holding one return address per active call. You must budget that stack at assembly time — the CPU will not warn you before it overwrites something else.

The companion listing is [`examples/06_factorial.asm`](examples/06_factorial.asm).

---

## The problem: smaller versions of the same job

Many definitions refer to themselves:

- \(n! = n \times (n-1)!\) for \(n > 0\), and \(0! = 1\).
- The sum of a byte table is the first byte plus the sum of the rest.
- Towers of Hanoi: moving \(n\) disks means moving \(n-1\) disks twice around one move of the bottom disk.

Each case splits the input into a smaller instance of the same problem plus a small amount of local work. The **base case** is the size where you return immediately without another `call`.

Iterative loops from Chapters 1–2 already do this with registers and workspace. Recursion makes the "smaller problem" explicit as another `call`. The trade is stack space and call overhead in exchange for a definition that mirrors the math.

---

## The stack as an explicit resource

Book 1 Chapter 8 introduced the stack for `call` / `ret` and for `push` / `pop`. Book 1 Chapter 11 added the **IX frame** when a routine needs stack-backed locals that survive nested calls.

For recursion, treat the stack like any other fixed resource:

1. **Initialize SP** before the first `call` (`ld sp, STACK_TOP`).
2. **Count bytes per frame** — return address (2), plus any `push` / IX frame / `dec sp` locals you add on entry.
3. **Bound depth at compile time** — the largest argument your demo passes, or a named `.equ` limit you refuse to exceed.
4. **Compare** `max_depth × frame_bytes` to the RAM below `STACK_TOP` and above your workspace and data.

The Z80 has no stack-overflow trap. When SP walks into `values` or `ring_state`, the program keeps running; the failure shows up as wrong data, not as a clean error.

### Frame size example: `factorial_u8`

Each recursive step (for \(n > 0\)) does:

```asm
    push bc          ; 2 bytes — save n in B (C is collateral)
    dec b
    call factorial_u8
    pop bc
```

Plus the return address the CPU pushes on `call` (2 bytes). Active depth for input `FACT_N` is `FACT_N + 1` (down to the \(0! = 1\) base). Name the budget in source:

```asm
FACT_FRAME_BYTES .equ 4
FACT_MAX_DEPTH   .equ FACT_N + 1
STACK_TOP        .equ $9FFF
```

Before calling `factorial_u8` from `main`, set `ld sp, STACK_TOP`. On paper, `FACT_MAX_DEPTH × FACT_FRAME_BYTES` must fit in the stack region you reserved. Chapter 6's demo uses `FACT_N = 5` → six frames → 24 bytes of stack traffic, which is trivial on a 64K map; the habit matters when depth reaches dozens in later chapters.

---

## Recursive factorial and its iterative twin

Wirth's programs are often shown twice: a recursive definition and an equivalent loop. Comparing them in AZM makes the costs visible.

### Recursive version

**Contract:** B = \(n\) (unsigned), A = \(n!\). Define \(0! = 1\). For 8-bit A, keep \(n \le 5\) in demos (\(6! = 720\) does not fit).

```asm
; factorial_u8: unsigned B! into A (0! = 1; safe for B <= 5 in 8 bits)
; Self-call; max depth FACT_MAX_DEPTH; frame FACT_FRAME_BYTES bytes.
;!      in        B
;!      out       A
;!      clobbers  AF, BC, DE
@factorial_u8:
    ld a, b
    or a
    jr z, FactOne
    push bc
    dec b
    call factorial_u8
    pop bc
    ld c, b
    call mul8_a_by_c
    ret
FactOne:
    ld a, 1
    ret
```

**Base case:** `b = 0` → A = 1, `ret` without another `call`.

**Recursive step:** save `n` on the stack, compute \((n-1)!\) in A, restore `n` into B, multiply A by `n` via `mul8_a_by_c`, return.

Work after the inner `call` returns is the hallmark of recursion that **unwinds**: the stack still holds outer return addresses until each level finishes its multiply.

### Iterative version

Same contract, no self-call:

```asm
; factorial_iter_u8: same contract as factorial_u8, iterative
;!      in        B
;!      out       A
;!      clobbers  AF, BC, DE
@factorial_iter_u8:
    ld a, b
    or a
    jr z, FactIterOne
    ld e, 1
    ld c, b
FactIterLoop:
    ld a, c
    or a
    jr z, FactIterDone
    ld a, e
    push bc
    call mul8_a_by_c
    ld e, a
    pop bc
    dec c
    jr FactIterLoop
FactIterDone:
    ld a, e
    ret
FactIterOne:
    ld a, 1
    ret
```

`E` holds the running product; `C` counts down from `n`. Stack depth stays **O(1)** no matter how large `n` is (within your 8-bit range).

### Compare

| Aspect | `factorial_u8` | `factorial_iter_u8` |
|--------|----------------|---------------------|
| Stack depth | grows with `n` | constant |
| Registers across inner work | must save `n` (`push bc`) | `E` and `C` are locals in one frame |
| Readable structure | matches the math definition | matches a for-loop |
| Risk on small RAM | overflow if depth × frame too large | multiply still needs care for range |

`main` calls both with `B = 5` and stores to `fact_rec` and `fact_iter`. After `halt`, both bytes at `$8000` and `$8001` should read `$78` (120).

---

## Preserving results across inner calls

The inner `call factorial_u8` returns \((n-1)!\) in **A**. The outer level still needs **B** = \(n\) for the multiply. That is why `push bc` / `pop bc` wrap the recursive call: the callee may clobber B, and the multiply helper clobbers further registers listed in its `;!` block.

If you made a second recursive call before storing the first result, you would have the same problem with **HL** — the register used for 16-bit results in Book 3. Pattern:

```asm
    call first_rec
    ld (ix-1), l        ; or push HL, workspace word, etc.
    ld (ix-2), h
    call second_rec
    ; reload first result before combining
```

The IX frame from Book 1 Chapter 11 is the structured way to hold those slots when a routine needs several locals that must survive multiple `call`s — for example, Towers of Hanoi with two recursive counts before combining. This chapter's factorial only needs one saved register pair; `push bc` is enough.

---

## Recursive list walk: `sum_u8_rec`

Summing a byte table recursively matches Chapter 2's array indexing, but the accumulation happens on **unwind**:

- Base: zero bytes left → HL = 0.
- Step: add `numbers[0]` to the sum of `numbers[1..]`.

```asm
NUMS_LEN .equ 5

demo_nums:
    .db 2, 3, 5, 7, 9
```

```asm
; sum_u8_rec: sum bytes table[0 .. A-1] into HL (A = count on entry)
; Self-call; one return address per tail index; no extra pushes in body.
;!      in        HL, A
;!      out       HL
;!      clobbers  AF, BC, DE, HL
@sum_u8_rec:
    or a
    jr z, SumRecZero
    push af
    ld b, a
    ld a, (hl)
    push af
    inc hl
    dec b
    ld a, b
    call sum_u8_rec
    pop af
    ld e, a
    ld d, 0
    add hl, de
    pop af
    ret
SumRecZero:
    ld hl, 0
    ret
```

**Base case:** `A = 0` → HL = 0.

**Recursive step:** read the head byte, `push af` to hold it while the tail sum runs in HL, recurse with `A - 1`, then pop the head into A and promote into DE (`ld e, a` / `ld d, 0`) before `add hl, de`.

The outer `push af` saves the element count; the inner `push af` saves the head byte. Both must be popped in reverse order after the inner `call`. Frame cost is still dominated by return addresses: depth equals `NUMS_LEN` for a full table.

From `main`:

```asm
    ld hl, demo_nums
    ld a, NUMS_LEN
    call sum_u8_rec
    ld (sum_rec), hl
```

`sum_rec` at `$8002` should hold `$001A` (26). The companion file includes this routine so you can single-step the unwind and watch HL grow after each `ret`.

---

## AZMDoc on recursive entries

Recursive routines use the same AZMDoc shape as every other `@` entry (Book 1 Chapter 12):

- human `;` line stating the job
- `;! in` / `;! out` / `;! clobbers`
- `@label:` on the entry

Add two extra habits for self-calls:

1. **Say it is recursive** in the human comment (`; Self-call; ...`) so a reader knows stack math applies.
2. **Document stack budget** in `.equ` constants (`FACT_FRAME_BYTES`, `FACT_MAX_DEPTH`) or in the comment block, not in a magic number buried in `main`.

Register-care (`azm --rc warn`) still checks each `call` site against the callee contract. It does not yet multiply depth by frame size; overflow prevention stays your compile-time inequality and testing on hardware. When a recursive routine uses an IX frame, include IX in `clobbers` unless the epilogue restores it — same rule as Chapter 11.

Internal labels stay dotted (`.one`, `.zero`). Only the entry that external code (or the same routine via `call`) uses gets `@`.

---

## Stack overflow: what actually goes wrong

Stack overflow on the Z80 is **silent**. SP decrements through your globals; stores from later `push` or `ld (ix+d), a` corrupt unrelated bytes; `ret` pops garbage into PC.

Symptoms you might see in the emulator:

- correct results for small inputs, nonsense for large ones
- `halt` never reached because PC jumped into data
- workspace or table bytes changing while stepping through unrelated code

Defenses that fit Book 3:

- cap inputs with `.equ` and document the cap in comments
- keep stack top away from `.org $8000` data (init SP to `$9FFF` or your board's RAM top)
- prefer an iterative version when depth is unbounded (input-driven length, user data)
- count frames on paper before embedding deep recursion in the capstone

If \(n\) is only known at runtime, the iterative factorial is the safe default; recursion is for when depth is provably small.

---

## Memory diagram: stack growth on a call chain

`factorial_u8(3)` before the deepest call returns:

```
  higher addresses
  ┌──────────────────────────────────────────────┐
  │  return to main                              │
  │  saved BC (n=3)          ← frame for n=3     │
  │  return to n=3 level                         │
  │  saved BC (n=2)          ← frame for n=2     │
  │  return to n=2 level                         │
  │  saved BC (n=1)          ← frame for n=1     │
  │  return to n=1 level                         │
  │  (n=0 base case — no push before ret)        │
  └──────────────────────────────────────────────┘
  lower addresses  ← SP near the bottom after pushes
```

Each `call` pushes a return address (not shown separately from the frames above). Each active `push bc` adds two bytes. Unwind pops one frame per `ret` from the inner calls until `main` regains control.

Data at `$8000` does not move; only SP walks. That separation is why `ld sp, STACK_TOP` in `main` matters before the first recursive entry.

---

## `main` orchestration

```asm
.org $0000
main:
    ld sp, STACK_TOP

    ld b, FACT_N
    call factorial_u8
    ld (fact_rec), a

    ld b, FACT_N
    call factorial_iter_u8
    ld (fact_iter), a

    ld hl, demo_nums
    ld a, NUMS_LEN
    call sum_u8_rec
    ld (sum_rec), hl

    halt
```

Three algorithms, one stack pointer initialization, three result labels in RAM.

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/06_factorial.asm`](examples/06_factorial.asm) | `fact_rec` = `fact_iter` = `$78` (120); `sum_rec` = `$001A` (26) |

```sh
azm examples/06_factorial.asm
azm --rc warn examples/06_factorial.asm
```

Step into `factorial_u8` with `FACT_N = 3` first: count pushes on the way down, multiplies on the way up. Then run the full file to `halt`.

---

## Summary

- **Recursion** is a subroutine that `call`s itself; the base case must return without another `call`.
- The **stack** holds return addresses and any `push` / IX locals; budget `max_depth × frame_bytes` at compile time and init SP before the first call.
- **`factorial_u8`** and **`factorial_iter_u8`** share a contract; comparing them shows depth vs constant stack use.
- **`sum_u8_rec`** walks a byte table with accumulation on unwind; promote bytes into DE before `add hl, de`.
- **AZMDoc** on `@` entries documents register roles; add human notes for self-call and stack limits.
- **Stack overflow** corrupts RAM silently — cap depth or use iteration when input size is not bounded.

---

## Exercises

1. Change `FACT_N` to 6 in the example. Does `fact_rec` still match `fact_iter` in an 8-bit result byte? What should you change if you need \(6!\) exactly?
2. Hand-count stack bytes for `factorial_u8(5)` at the deepest point. Compare to `FACT_MAX_DEPTH × FACT_FRAME_BYTES`.
3. Rewrite `sum_u8_rec` to recurse on the head index in workspace instead of advancing HL before the call. Does the sum change? Does stack use change?
4. Add `hanoi_moves_u8` for \(n \le 4\) using the recurrence \(H(0)=0\), \(H(n)=2H(n-1)+1\). Use two workspace words to store the first recursive result in HL before the second call. Estimate frame bytes per level.
5. Run `azm --rc warn` on a deliberate bug: call `factorial_u8` and then use B without reloading. Fix using the contract comment.
6. Lower `STACK_TOP` to `$8010` while keeping data at `$8000`. Run `FACT_N = 5` and describe what fails first.

---

[← Records](05-records.md) | [Book 3](index.md) | [Composition →](07-composition.md)
