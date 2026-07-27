---
layout: default
title: "I/O and Ports"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 9
---

# I/O and Ports

Keyboards send bytes to the CPU, displays receive them and timers report
hardware events.

The Z80 handles this through a separate **I/O space**. In the conventional
programming model, devices use an 8-bit port number, giving 256 basic port
numbers. The `in` and `out` instructions transfer bytes between registers and
peripherals without using a memory transaction. The mapping of port numbers to
devices belongs to the target hardware.

---

## The I/O address space

The low byte of an I/O address is an 8-bit port number from 0 to 255. The CPU
marks an I/O transaction separately from a memory transaction on its control
bus.

The Z80 still drives all sixteen address pins during an I/O transaction. In the
`(C)` forms, C supplies the low 8-bit port number and B appears on the upper
address pins. In the immediate `(n)` forms, `n` supplies the port number and A
appears on the upper pins. Most systems decode only the low eight bits and
therefore expose 256 ports. Some hardware also decodes the upper byte. For
example, the TEC-1G matrix keyboard uses B to select a row. This upper-byte
behaviour is an electrical addressing detail layered on the normal 8-bit port
model, so follow the target's hardware documentation when it is used.

The `in` and `out` forms in this chapter perform individual byte transfers; the
Z80 also has block I/O instructions for repeated transfers.

![Port $10 and memory address $0010 are different places, reached by different instructions.](../../assets/images/azm-book/book2/io-address-space.svg)

---

## Writing to a port: `out`

`out (n), a` writes A to the 8-bit port number `n`:

```asm
ld a, $42        ; load value to send
out ($10), a     ; write $42 to port $10
```

The parentheses around `$10` mark a port operand, not a memory address. The
instruction encodes as two bytes: the `out` opcode and the port number. Only A
can supply the data in the immediate form.

`out (C), r` writes register r to the port number in C. Any standard 8-bit
register (B, C, D, E, H, L or A) can supply the data:

```asm
ld c, $10        ; 8-bit port number
ld d, $42        ; value to send
out (C), d       ; write D to port $10
out (C), a       ; write A to the same port
```

---

## Reading from a port: `in`

`in a, (n)` reads a byte from port `n` into A:

```asm
in a, ($10)      ; read byte from port $10 into A
```

The immediate form requires A as the destination.

`in r, (C)` reads from the port number in C into any standard 8-bit register:

```asm
ld c, $10        ; 8-bit port number
in d, (C)        ; read from port $10 into D
in a, (C)        ; read from the same port into A
```

Unlike `out`, the `in` instruction **sets flags**. After `in r, (C)`:

- S is set if the byte read has bit 7 set.
- Z is set if the byte read is zero.
- P/V reflects the parity of the byte.
- H and N are reset.
- C (carry) is unaffected.

`in r, (C)` sets flags; the immediate form `in a, (n)` does not. When code must branch on a value read with the immediate form, a following `or a` sets the flags explicitly before the conditional jump.

---

## Polling a port in a loop

A common pattern is to poll a status port until a condition is met, then read or write a data port.

```asm
STATUS_PORT .equ $11
DATA_PORT   .equ $10

; read_when_ready: spin until device is ready, then return the byte read.
; Out: A = received byte
; Clobbers: F
read_when_ready:
wait:
  in a, (STATUS_PORT) ; read status into A
  and $01           ; test bit 0 (ready flag)
  jr z, wait        ; Z set means bit 0 was 0 — not ready yet; loop
  in a, (DATA_PORT) ; bit 0 is 1 — device is ready; read data into A
  ret
```

`and $01` masks all bits except bit 0 and sets Z if the result is zero. `jr z, wait` loops back while Z is set (bit 0 still clear).

![The mask discards every bit but the ready flag, so Z answers one question.](../../assets/images/azm-book/book2/polling-loop.svg)

Both reads use immediate low-byte addresses. These examples assume the target
decodes only that low byte, as many small Z80 systems do.

---

## Sending a block of bytes

A counted loop can send a sequence of bytes to a fixed port one at a time. HL
points to the data and B holds the count:

```asm
OUT_PORT .equ $10

; send_block: send B bytes from (HL) to OUT_PORT.
; In:  HL = source address, B = byte count
; Precondition: B > 0
; Clobbers: A, B, HL
send_block:
send_loop:
  ld a, (hl)       ; load byte at current address
  out (OUT_PORT), a
  inc hl           ; advance source pointer
  djnz send_loop   ; decrement B; loop until B reaches 0
  ret
```

---

## The example: `learning/book2/examples/07_io_and_ports.asm`

```asm
; learning/book2/examples/07_io_and_ports.asm
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
recv_byte:
  in a, (IN_PORT)      ; immediate port form; reads into A only
  ret

; echo_reg: write the byte in D using register-addressed form
; In:  D = byte to send
; Clobbers: C
echo_reg:
  ld c, OUT_PORT       ; C holds the 8-bit port number
  out (C), d           ; D is the data source
  ret

; poll_and_recv: spin on STATUS_PORT until bit 0 is set, then read IN_PORT
; Out: A = byte received
; Clobbers: F
poll_and_recv:
poll_loop:
  in a, (STATUS_PORT)  ; immediate form; flags unchanged
  and $01              ; test bit 0
  jr z, poll_loop      ; Z set: not ready; keep polling
  in a, (IN_PORT)      ; ready: read data into A
  ret

; send_block: send B bytes from (HL) to OUT_PORT
; In:  HL = source address, B = byte count
; Precondition: B > 0
; Clobbers: A, B, HL
send_block:
block_loop:
  ld a, (hl)
  out (OUT_PORT), a
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
  ld d, $55
  call echo_reg         ; sends $55 to OUT_PORT via register-addressed out

  ; Demonstrate send_block
  ld hl, payload
  ld b, PayloadLen
  call send_block
  halt

.org $8000
payload: .db $10, $20, $30, $40
```

The key lines work as follows:

**`out (OUT_PORT), a`** is the immediate port form. `OUT_PORT` is defined as `$10` with `.equ`; the assembler substitutes `$10` at compile time.

**`in a, (IN_PORT)`** reads from port `$11` into A. Flags are **not** set by this form.

**`out (C), d`**: D supplies the data and C holds the port number.

**`in a, (STATUS_PORT)` in `poll_and_recv`** uses the immediate form, so the
read does not set flags. `and $01` isolates bit 0 and sets Z before the branch.

**`send_block`** is a DJNZ loop from Chapter 6 applied to output. B counts the
bytes and HL steps through source memory. Using the immediate output form keeps
B available as the loop counter.

---

## A note on interrupts

Everything in this chapter uses `in` and `out` to poll a peripheral: the CPU loops checking the status port until the device is ready. This works but keeps the CPU busy the entire time it is waiting.

The Z80 also supports **interrupts**. A hardware interrupt suspends the current
instruction stream, transfers control to a handler and later resumes the
interrupted code. Handlers often use `in` and `out` to communicate with the
device that raised the interrupt.

Interrupts involve `di`, `ei`, `im` and `reti`, along with stack and register
preservation rules. Interrupt-driven code requires the Z80 interrupt-mode
documentation for the target platform and its handler conventions.

---

## Integration in Chapter 10

Chapter 10 puts the whole of Chapters 3 to 9 into one program.

---

## Exercises

**1. Flag behaviour of `in`.** The explanation must distinguish the flag behaviour of these two forms:

```asm
in a, (IN_PORT)   ; form A
in a, (C)         ; form B
```

The answer should identify which form can feed `jr z, handle_zero` directly, which requires `or a`, and the minimum correct sequence that branches to `is_zero` when the byte read was zero.

**2. A bit-3 ready check.** This version of `poll_and_recv` must wait for bit 3 rather than bit 0. Only the mask in the `and` instruction changes; the task includes deriving that mask in hexadecimal.

**3. A receive loop.** The counterpart to `send_block` is a `recv_block`
routine that reads B bytes from the fixed `IN_PORT` into memory starting at HL.
Its interface needs documented inputs and clobbered registers, and its body uses
the same DJNZ structure with `in a, (IN_PORT)` instead of `out`.

**4. Register-addressed output.** The answer identifies the data register, the
8-bit port-number register and the register that appears on the upper address
pins in `out (C), d`. It then gives the three instructions that send `$7F` from
D to port `$20`.
