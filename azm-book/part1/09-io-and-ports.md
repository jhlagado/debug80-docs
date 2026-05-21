---
layout: default
title: "Chapter 9 — I/O and Ports"
parent: "Part 1 — Z80 Fundamentals"
grand_parent: "Learn AZM Assembly"
nav_order: 9
---
[← Stack and Subroutines](08-stack-and-subroutines.md) | [Part 1](index.md) | [A Complete Program →](10-a-complete-program.md)

# Chapter 9 — I/O and Ports

So far, every program in this course has been self-contained: it loads constants, processes data in memory, and produces a result that sits in RAM. Nothing comes in from outside. Nothing goes out. Real hardware doesn't work that way — a keyboard needs to send bytes to the CPU, a display needs to receive them, a timer needs to signal that something has happened.

The Z80 handles this through a separate **I/O space** of 256 numbered ports. The `in` and `out` instructions transfer bytes between CPU registers and these ports without touching memory at all. On real hardware, each port number selects a different peripheral. This chapter treats port numbers as abstract placeholders — the Z80 mechanism is what matters here; the mapping of numbers to devices varies by platform and is for your hardware documentation to define.

---

## The I/O address space

The Z80 I/O space has 256 locations, addressed by an 8-bit port number (0–255). A write to port N delivers a byte to the peripheral at port N. A read from port N receives a byte back from it. The CPU makes the distinction between memory and I/O transactions visible on its address and control buses; peripherals are wired to respond to one or the other, not both.

From your perspective, `in` and `out` are the only instructions that access I/O space. All other Z80 instructions — `ld`, `add`, `cp`, `jp`, `call`, everything else — operate on memory or registers. I/O and memory do not overlap.

---

## Writing to a port: `out`

`out (n), a` writes the byte in A to port n, where n is an 8-bit immediate port number:

```asm
ld a, $42        ; load value to send
out ($10), a     ; write $42 to port $10
```

The parentheses around `$10` mark it as a port operand, not a memory address. The instruction encodes as two bytes: the `out` opcode and the port number. Only A can be the source with the immediate form.

`out (C), r` writes the byte in register r to the port whose number is in C. Any of the standard 8-bit registers (B, C, D, E, H, L, A) can be the source:

```asm
ld c, $10        ; port number
ld b, $42        ; value to send
out (C), b       ; write B to the port in C
out (C), a       ; write A to the same port
```

The register-addressed form uses C as the port selector regardless of what other register supplies the data.

---

## Reading from a port: `in`

`in a, (n)` reads the byte at port n into A:

```asm
in a, ($10)      ; read byte from port $10 into A
```

The immediate form requires A as the destination. It is the counterpart of `out (n), a`.

`in r, (C)` reads from the port in C into any standard 8-bit register:

```asm
ld c, $10        ; port number
in b, (C)        ; read from port $10 into B
in a, (C)        ; read from port $10 into A
```

Unlike `out`, the `in` instruction **sets flags**. After `in r, (C)`:

- S is set if the byte read has bit 7 set.
- Z is set if the byte read is zero.
- P/V reflects the parity of the byte.
- H and N are reset.
- C (carry) is unaffected.

`in r, (C)` sets flags; the immediate form `in a, (n)` does not — an asymmetry the Z80 manual documents without explanation, and one that trips people up. If you read a port with the immediate form and then need to branch on the value, follow it with `or a` to set flags explicitly before the conditional jump.

---

## Polling a port in a loop

A common pattern is to poll a status port until a condition is met, then read or write a data port. The example below spins waiting for bit 0 of a status port to become 1, then reads from the data port:

```asm
STATUS_PORT .equ $11
DATA_PORT   .equ $10

; read_when_ready: spin until device is ready, then return the byte read.
; Out: A = received byte
; Clobbers: A, C
read_when_ready:
  ld c, STATUS_PORT
wait:
  in a, (C)         ; read status into A, flags set
  and $01           ; test bit 0 (ready flag)
  jr z, wait        ; Z set means bit 0 was 0 — not ready yet; loop
  in a, (DATA_PORT) ; bit 0 is 1 — device is ready; read data into A
  ret
```

`and $01` masks all bits except bit 0 and sets Z if the result is zero. `jr z, wait` loops back while Z is set (bit 0 still clear). When bit 0 becomes 1, the loop exits and the data read follows.

`in a, (DATA_PORT)` uses the immediate form because the port number is a compile-time constant defined with `.equ`. Both `in a, (C)` and `in a, (n)` read the port; the difference is where the port number comes from.

---

## Sending a block of bytes

A counted loop can send a sequence of bytes to a port one at a time. HL points to the data; B holds the count; C holds the port number.

```asm
; send_block: send B bytes from (HL) to port C.
; In:  HL = source address, B = byte count, C = port number
; Precondition: B > 0
; Clobbers: A, B, HL
send_block:
send_loop:
  ld a, (hl)       ; load byte at current address
  out (C), a       ; send it to the port in C
  inc hl           ; advance source pointer
  djnz send_loop   ; decrement B; loop until B reaches 0
  ret
```

HL advances one byte per iteration. B counts down from the caller-supplied count. The pattern is the DJNZ-counted walk from Chapter 6, applied to output rather than calculation.

---

## The example: `learning/part1/examples/07_io_and_ports.asm`

The example file demonstrates the three I/O patterns above: immediate-port output, register-port input, and a block send loop.

```asm
; learning/part1/examples/07_io_and_ports.asm
; Demonstrates Z80 in/out instructions and port forms.
; Port numbers are abstract: inspect the Z80 output, not hardware behavior.

OUT_PORT    .equ $10
IN_PORT     .equ $11
STATUS_PORT .equ $12

; send_byte: write A to OUT_PORT
; In:  A = byte to send
; Clobbers: nothing
send_byte:
  out (OUT_PORT), a    ; immediate port form; A is the source
  ret

; recv_byte: read IN_PORT into A
; Out: A = byte received
; Clobbers: AF
recv_byte:
  in a, (IN_PORT)      ; immediate port form; reads into A only
  ret

; echo_reg: write the byte in B to OUT_PORT using register-addressed form
; In:  B = byte to send
; Clobbers: C
echo_reg:
  ld c, OUT_PORT       ; C holds the port number
  out (C), b           ; register-addressed form; B is the data source
  ret

; poll_and_recv: spin on STATUS_PORT until bit 0 is set, then read IN_PORT
; Out: A = byte received
; Clobbers: A, C
poll_and_recv:
  ld c, STATUS_PORT
poll_loop:
  in a, (C)            ; read status; flags set by in r,(C)
  and $01              ; test bit 0
  jr z, poll_loop      ; Z set: not ready; keep polling
  in a, (IN_PORT)      ; ready: read data into A
  ret

; send_block: send B bytes from (HL) to the port in C
; In:  HL = source address, B = byte count, C = port number
; Precondition: B > 0
; Clobbers: A, B, HL
send_block:
block_loop:
  ld a, (hl)
  out (C), a
  inc hl
  djnz block_loop
  ret

PayloadLen .equ 4

.org $0000
main:
  ; Demonstrate send_byte
  ld a, $AA
  call send_byte        ; sends $AA to OUT_PORT

  ; Demonstrate recv_byte (reads from IN_PORT; result in A)
  call recv_byte

  ; Demonstrate echo_reg
  ld b, $55
  call echo_reg         ; sends $55 to OUT_PORT via register-addressed out

  ; Demonstrate send_block
  ld hl, payload
  ld b, PayloadLen
  ld c, OUT_PORT
  call send_block
  halt

.org $8000
payload: .db $10, $20, $30, $40
```

Walk through the key lines:

**`out (OUT_PORT), a`** — the immediate port form. `OUT_PORT` is defined as `$10` with `.equ`; the assembler substitutes `$10` at compile time. Only A can be the source.

**`in a, (IN_PORT)`** — reads from port `$11` into A. Flags are **not** set by this form.

**`out (C), b`** — B supplies the data; C holds the port number. The C register here is a port selector, not a data register.

**`in a, (C)` in `poll_and_recv`** — flags **are** set by this form. Z reflects whether the byte read was zero. `and $01` then narrows the test to bit 0 before the conditional branch.

**`send_block`** — a DJNZ loop from Chapter 6 applied to output. B counts the bytes; HL steps through source memory; C holds the port. The call site sets all three before the call.

---

## A note on interrupts

Everything in this chapter uses `in` and `out` to poll a peripheral: the CPU loops checking the status port until the device is ready. This works but keeps the CPU busy the entire time it is waiting.

The Z80 also supports **interrupts**: a hardware signal that tells the CPU to stop what it is doing, run a short handler routine, and then resume where it left off. Interrupt handlers typically use `in` and `out` to communicate with the device that raised the interrupt — the same instructions, the same port numbers. The difference is that the CPU does not sit in a loop; it only runs the I/O code when the hardware demands it.

Interrupts involve the `di`, `ei`, `im`, and `reti` instructions, and they interact with the shadow registers and the stack in ways that need careful setup — the full treatment covers interrupt modes, ISR calling conventions, and re-entrancy, which is more than a section can carry. Part 1 uses polling throughout. When you are ready to take on interrupt-driven I/O, start with the Z80 interrupt mode documentation for your target platform and read the ISR conventions before writing a single line of a handler.

---

## Summary

- The Z80 has a separate I/O address space of 256 ports. `in` and `out` are the only instructions that access it; all other instructions use memory.
- `out (n), a` writes A to an immediate port number. Only A is valid as the source.
- `out (C), r` writes any 8-bit register to the port number in C.
- `in a, (n)` reads from an immediate port into A. Flags are not set.
- `in r, (C)` reads from the port in C into any 8-bit register. Flags (S, Z, P/V) are set based on the value read.
- A polling loop tests a status port in a loop until a ready condition is met, then reads the data port. Polling occupies the CPU while it waits; interrupt-driven I/O hands control back to the main program between events.
- Port numbers are platform-defined. The examples here use abstract constants and demonstrate the instructions themselves, not any specific hardware.

---

## What Comes Next

Chapter 10 brings everything together. It builds a complete program — data table, DJNZ loop, subroutines, conditional branches, register preservation — using the full set of techniques from Chapters 3–9. The program is deliberately designed to be slightly uncomfortable to read back: the friction it exposes is real, it accumulates as programs grow, and Chapters 11–14 are the answer to it.

---

## Exercises

**1. Flag behaviour of `in`.** Explain the difference in flag behaviour between these two forms:

```asm
in a, (IN_PORT)   ; form A
in a, (C)         ; form B
```

After which form can you safely write `jr z, handle_zero` without any additional instruction? After which form must you add `or a` first? Write the minimum correct version for each case that branches to a label `is_zero` if the byte read was zero.

**2. Modify the ready-check loop.** The `poll_and_recv` subroutine in the chapter waits for bit 0 of the status port. Change it to wait for bit 3 instead. Write the modified subroutine. _(Hint: you need to change exactly one value — the mask in the `and` instruction. What is the bit-3 mask in hex?)_

**3. Write a receive loop.** The chapter shows `send_block` but not its counterpart. Write a subroutine called `recv_block` that reads B bytes from the port in C into memory starting at the address in HL. Write a comment header documenting the inputs and which registers are clobbered. The subroutine should use the same structure as `send_block` — a DJNZ loop with `in` instead of `out`.

**4. Port number in C.** In the `out (C), b` form, what does the value in C represent — is it the data being sent or the destination port number? Write the three instructions needed to send the byte `$7F` to port `$20` using the register-addressed form.

---

[← Stack and Subroutines](08-stack-and-subroutines.md) | [Part 1](index.md) | [A Complete Program →](10-a-complete-program.md)
