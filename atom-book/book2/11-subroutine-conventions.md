---
layout: default
title: "Subroutine Conventions"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 11
---

# Subroutine Conventions

A call works only when caller and routine agree on where arguments arrive,
where results return and which registers may change. The Z80 does not impose
that agreement. The program does.

---

## A register convention

The examples in this book use a small, practical convention:

- **HL** carries a pointer or a 16-bit result.
- **DE** carries a second pointer.
- **BC** carries a count or secondary value.
- **B** carries an 8-bit loop count when C is free for another purpose.
- **A** carries a byte argument or result.

These roles are defaults, not hardware rules. A routine may choose another
arrangement, but its caller must use the same one.

The two routines in Chapter 10 follow the convention. `FIND_MAX` receives its
table pointer in HL and its count in B, then returns the maximum in A.
`CNTABOVE` adds a threshold in C and also returns its result in A.

---

## Who preserves a live value?

A register named as an output or clobber may be different after the call. The
caller saves it first if the incoming value is still needed. A register named
as preserved must leave the routine unchanged; the routine saves and restores
it if necessary.

The stack provides the usual mechanism:

```asm
ROUTINE:
  PUSH BC
  PUSH DE
  ; ... use BC and DE ...
  POP DE
  POP BC
  RET
```

The last value pushed is the first one popped. Reversing the pop order can
leave SP balanced while restoring both values to the wrong registers.

![Caller-save and callee-save responsibilities for registers at a call boundary.](../../assets/images/atom-book/book2/caller-callee-save.svg)

---

## Preserving DE in `CNTABOVE`

Chapter 10 uses D as a running counter. If the caller needs DE unchanged, the
routine can preserve the pair around its existing body:

```asm
  PUSH DE
  LD D, 0
  ; ... scan the table and increment D ...
  LD A, D
  POP DE
  RET
```

The result moves to A before `POP DE` restores the caller's D and E. Every
return path must pass through the pop. Returning early while the saved word is
still on the stack would make `RET` use that word as an address.

`FIND_MAX` needs no such save if it compares directly against `(HL)`: its work
then uses only the declared inputs B and HL, the result A and the flags. First
choose temporaries that the interface already allows the routine to change;
that can remove the need for preservation code.

---

## Recording the interface

Put the contract immediately above the global routine label:

```asm
; CNTABOVE: count bytes strictly above a threshold
; In:  HL = first byte, B = count, C = threshold
; Out: A = matching count
; Clobbers: B, F, HL
; Preserves: C, DE
CNTABOVE:
```

List what a caller needs to know:

- the meaning and valid range of every input;
- the result location;
- registers and flags that may change;
- registers explicitly preserved;
- preconditions such as `B > 0`;
- ownership of any memory read or written.

The comment is useful only when the implementation and every return path obey
it.

---

## An IX frame for local storage

Registers are usually enough for a small routine. When they are not, IX can
provide a stable base for temporary bytes on the stack.

The prologue saves the caller's IX and points IX at the current stack:

```asm
ROUTINE:
  PUSH IX
  LD IX, 0
  ADD IX, SP
```

The saved IX occupies IX+0 and IX+1. The return address occupies IX+2 and
IX+3. Arguments pushed by the caller before `CALL` begin at IX+4.

![The frame IX points into. Arguments and bookkeeping sit at positive displacements, locals at negative ones.](../../assets/images/atom-book/book2/ix-frame.svg)

Allocate two local bytes by moving SP down twice:

```asm
  DEC SP
  DEC SP
  LD (IX-1), A
  LD A, (IX-2)
```

IX stays fixed while SP moves. The epilogue discards all local bytes, restores
the caller's IX and returns:

```asm
  LD SP, IX
  POP IX
  RET
```

An IX displacement is a signed byte. Local offsets reach from -1 through -128;
caller data above the frame reaches from +4 through +127.

---

## Auditing a return path

For each `RET` or conditional `RET`, count stack words from the routine entry:

1. Begin after the return address pushed by `CALL`.
2. Add one word for every `PUSH` or nested `CALL` still active on that path.
3. Remove one for every matching `POP` or return from a nested call.
4. Require the temporary balance to be zero when the routine executes `RET`.

Balance proves that `RET` reaches the caller. The interface still has to prove
that each saved value returned to the intended register.

---

## Exercise

**Push/pop order.** With BC = `$1111`, HL = `$2222`, AF = `$3344` and SP =
`$C000`, these pushes establish the stack contents:

```asm
PUSH BC
PUSH HL
PUSH AF
```

The answer should supply the correct three-pop epilogue, restored registers and
SP. A second trace using `POP BC / POP HL / POP AF` should give the resulting
registers and explain why a balanced SP alone does not prove correct
restoration.

[Exercise notes](exercise-notes.md#chapter-11-subroutine-conventions)
