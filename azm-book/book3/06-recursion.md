---
layout: default
title: "Recursion"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 7
---
[← Records](05-records.md) | [Book 3](index.md) | [Composition →](07-composition.md)

# Chapter 6 — Recursion

Chapter 5 kept all state in registers, workspace bytes or a `RingState` record. This chapter adds **recursion**: the same subroutine label on the `call` instruction that defines it, with a base case that stops the chain.

The **hardware stack** holds one return address per active call. Its capacity
must be budgeted at assembly time because the CPU gives no warning before an
overflow overwrites other data.

The companion listing is [`examples/06_factorial.asm`](examples/06_factorial.asm).

---

## The problem: smaller versions of the same job

Many definitions refer to themselves:

- n! = n × (n-1)! for n > 0, and 0! = 1.
- The sum of a byte table is the first byte plus the sum of the rest.
- Towers of Hanoi: moving n disks means moving n-1 disks twice around one move of the bottom disk.

Each case splits the input into a smaller instance of the same problem plus a small amount of local work. The **base case** is the size where you return immediately without another `call`.

Iterative loops from Chapters 1–2 already do this with registers and workspace. Recursion makes the "smaller problem" explicit as another `call`.

---

## The stack as an explicit resource

For recursion, the stack is managed like any other fixed resource:

1. **SP initialization** occurs before the first `call` (`ld sp, STACK_TOP`).
2. **Bytes per active level** include the return address (2), plus any `push`,
   IX frame or `dec sp` locals added by that level.
3. **A compile-time depth bound** records the largest argument the program is
   designed to receive.
4. **The resulting total**, either exact or the conservative
   `max_depth × largest_frame_bytes` bound, must fit below `STACK_TOP` and above
   the program's workspace and data.

### Stack budget for `factorial_u8`

Each recursive step (for n > 0) does:

```asm
    push bc          ; 2 bytes — save n in B (C is collateral)
    dec b
    call factorial_u8
    pop bc
```

Each non-base level therefore adds four bytes: two for saved BC and two for the
next recursive return address. The base call adds only its two-byte return
address because it does not push BC. Source constants name both parts:

```asm
FACT_STEP_BYTES      .equ 4
FACT_BASE_BYTES      .equ 2
FACT_MAX_DEPTH       .equ FACT_N + 1
FACT_MAX_STACK_BYTES .equ FACT_N * FACT_STEP_BYTES + FACT_BASE_BYTES
STACK_TOP            .equ $9FFF
```

The demo uses `FACT_N = 5`: five non-base levels and one base call occupy 22
bytes at the deepest point. `FACT_MAX_DEPTH` is six, but multiplying six by a
uniform four-byte frame would overstate the exact requirement because the base
case has no saved BC.

---

## Recursive factorial and its iterative twin

### Recursive version

**Contract:** B = n (unsigned), A = n!, with 0! defined as 1. An 8-bit result
limits the demos to n ≤ 5 because 6! = 720 does not fit.

```asm
; factorial_u8: unsigned B! into A (0! = 1; safe for B <= 5 in 8 bits)
; Self-call; max depth FACT_MAX_DEPTH; max stack FACT_MAX_STACK_BYTES bytes.
.routine in B out A clobbers F,BC,DE
factorial_u8:
    ld a, b
    or a
    jr z, _one
    push bc
    dec b
    call factorial_u8
    pop bc
    ld c, b
    call mul8_a_by_c
    ret
_one:
    ld a, 1
    ret
```

**Base case:** `b = 0` → A = 1, `ret` without another `call`.

**Recursive step:** save `n` on the stack, compute (n-1)! in A, restore `n` into B, multiply A by `n` via `mul8_a_by_c`, return.

Work after the inner `call` returns is the hallmark of recursion that **unwinds**: the stack still holds outer return addresses until each level finishes its multiply.

### Iterative version

Same contract, no self-call:

```asm
; factorial_iter_u8: same contract as factorial_u8, iterative
.routine in B out A clobbers F,BC,DE
factorial_iter_u8:
    ld a, b
    or a
    jr z, _iter_one
    ld e, 1
    ld c, b
_iter_loop:
    ld a, c
    or a
    jr z, _iter_done
    ld a, e
    push bc
    call mul8_a_by_c
    ld e, a
    pop bc
    dec c
    jr _iter_loop
_iter_done:
    ld a, e
    ret
_iter_one:
    ld a, 1
    ret
```

Stack depth stays **O(1)** no matter how large `n` is (within your 8-bit range).

### Recursive and iterative forms

| Aspect | `factorial_u8` | `factorial_iter_u8` |
|--------|----------------|---------------------|
| Stack depth | grows with `n` | constant |
| Registers across inner work | must save `n` (`push bc`) | `E` and `C` are locals in one frame |
| Readable structure | matches the math definition | matches a for-loop |
| Risk on small RAM | overflow if depth × frame too large | multiply still needs care for range |

![The same result from two shapes: one grows the stack with n, the other does not](../../assets/images/azm-book/book3/recursive-vs-iterative.svg)

`main` calls both with `B = 5` and stores to `fact_rec` and `fact_iter`. After `halt`, both bytes at `$8000` and `$8001` should read `$78` (120).

---

## Preserving results across inner calls

The outer level still needs **B** = n for the multiply. That is why `push bc` / `pop bc` wrap the recursive call: the callee may clobber B, and the multiply helper clobbers further registers listed in its `.routine` block.

A routine making a second recursive call before storing the first result has
the same problem with **HL**, the register used for 16-bit results in Book 3.
One storage pattern is:

```asm
    call first_rec
    ld (ix-1), l        ; or push HL, workspace word, etc.
    ld (ix-2), h
    call second_rec
    ; reload first result before combining
```

The IX frame from Book 2 Chapter 11 is the structured way to hold those slots when a routine needs several locals that must survive multiple `call`s (for example, Towers of Hanoi with two recursive counts before combining). This chapter's factorial only needs one saved register pair; `push bc` is enough.

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
; Self-call; four bytes per non-base level plus a two-byte base return address.
.routine in HL,A out HL clobbers AF,BC,DE
sum_u8_rec:
    or a
    jr z, _zero
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
    ret
_zero:
    ld hl, 0
    ret
```

**Base case:** `A = 0` → HL = 0.

**Recursive step:** read the head byte, `push af` to hold it while the tail sum
runs in HL, recurse with `A - 1`, then pop the head into A and promote it into DE
(`ld e, a` / `ld d, 0`) before `add hl, de`.

Each non-base level keeps one two-byte AF value and has one two-byte recursive
return address. The base call adds its return address but no saved AF. For
`NUMS_LEN = 5`, maximum occupancy is therefore `5 × 4 + 2 = 22` bytes.

From `main`:

```asm
    ld hl, demo_nums
    ld a, NUMS_LEN
    call sum_u8_rec
    ld (sum_rec), hl
```

`sum_rec` at `$8002` should hold `$001A` (26). A single-step trace of the
companion routine shows HL growing after each `ret` during the unwind.

---

## Register contracts on recursive entries

Recursive routines use the same register contract shape as every other routine (Book 2 Chapter 12):

- human `;` line stating the job
- one `.routine` directive with `in`, `out`, `maybe-out`, `clobbers` or `preserves` as needed
- a non-local entry label, exported with `@` only when another source unit imports it

Self-calls add two documentation requirements:

1. **The human comment identifies recursion** (`; Self-call; ...`), making the
   need for stack arithmetic explicit.
2. **The stack budget appears in `.equ` constants** (`FACT_STEP_BYTES`,
   `FACT_BASE_BYTES`, `FACT_MAX_DEPTH`) or in the comment block rather than as
   a magic number buried in `main`.

Register contracts (`azm --rc warn`) still check each `call` site against the callee contract. They do not yet multiply depth by frame size; overflow prevention stays your compile-time inequality and testing on hardware. When a recursive routine uses an IX frame, include IX in `clobbers` unless the epilogue restores it, same rule as Chapter 11.

Internal labels use owner-local names such as `_one` and `_zero`.

---

## Stack overflow: what actually goes wrong

Stack overflow on the Z80 is **silent**. SP decrements through your globals; stores from later `push` or `ld (ix+d), a` corrupt unrelated bytes; `ret` pops garbage into PC.

Symptoms you might see in the emulator:

- correct results for small inputs, nonsense for large ones
- `halt` never reached because PC jumped into data
- workspace or table bytes changing while stepping through unrelated code

Book 3 uses four defenses:

- input caps expressed with `.equ` and explained in comments
- a stack top kept away from `.org $8000` data, such as `$9FFF` or the board's
  RAM limit
- an iterative version when input-driven data makes depth unbounded
- a frame count established before deep recursion is used in the capstone

---

## Memory diagram: stack growth on a call chain

`factorial_u8(5)` before the deepest call returns:

![Eleven two-byte slots at the deepest call, and the multiply each level performs on the way back up](../../assets/images/azm-book/book3/factorial-frames.svg)

Data at `$8000` does not move; only SP walks.

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

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/06_factorial.asm`](examples/06_factorial.asm) | `fact_rec` = `fact_iter` = `$78` (120); `sum_rec` = `$001A` (26) |

```sh
azm examples/06_factorial.asm
azm --rc warn examples/06_factorial.asm
```

A trace of `factorial_u8` with `FACT_N = 3` exposes the pushes on the way down
and the multiplies on the way up. The complete file can then run to `halt`.

---

## Exercises

1. With `FACT_N` set to 6, the comparison should determine whether `fact_rec`
   still matches `fact_iter` in an eight-bit result and what representation is
   required for an exact 6!.
2. A hand count of stack bytes at the deepest point of `factorial_u8(5)` should
   be checked against `FACT_N * FACT_STEP_BYTES + FACT_BASE_BYTES`.
3. A `sum_u8_rec` variant should recurse on a head index in workspace instead
   of advancing HL before the call. Its sum and stack use can then be compared
   with the original.
4. A `hanoi_moves_u16` routine uses B as input and HL as output, with H(0)=0
   and H(n)=2H(n-1)+1. It should make one recursive call for H(n-1), double HL,
   add one and include an estimate of stack bytes per level.
5. A deliberate contract error calls `factorial_u8` and then uses B without
   reloading it. `azm --rc warn` should expose the error, and the contract
   comment provides the basis for correcting it.
6. A constrained-stack case lowers `STACK_TOP` to `$8010`, retains data at
   `$8000` and sets `FACT_N = 5`; its purpose is to identify the first failure.

---

[← Records](05-records.md) | [Book 3](index.md) | [Composition →](07-composition.md)
