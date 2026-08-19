---
layout: default
title: "I/O and Ports"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 9
---

# I/O and Ports

Keyboards send bytes to the CPU, displays receive them and timers report
hardware events.

The Z80 handles this through a separate **I/O space**. In the conventional
programming model, devices use an 8-bit port number, giving 256 basic port
numbers. The `IN` and `OUT` instructions transfer bytes between registers and
peripherals over I/O bus cycles. The mapping of port numbers to
devices belongs to the target hardware.

---

## The I/O address space

The low byte of an I/O address is an 8-bit port number from 0 to 255. The CPU
marks an I/O transaction separately from a memory transaction on its control
bus.

The Z80 still drives all sixteen address pins during an I/O transaction. In the
`(C)` forms, C supplies the low 8-bit port number and B appears on the upper
address pins. In the immediate `(N)` forms, `N` supplies the port number and A
appears on the upper pins. Most systems decode only the low eight bits and
therefore expose 256 ports. Some hardware also decodes the upper byte. For
example, the TEC-1G matrix keyboard uses B to select a row. This upper-byte
behaviour is an electrical addressing detail layered on the normal 8-bit port
model, so follow the target's hardware documentation when it is used.

The `IN` and `OUT` forms in this chapter perform individual byte transfers; the
Z80 also has block I/O instructions for repeated transfers.

![Port $10 and memory address $0010 are different places, reached by different instructions.](../../assets/images/atom-book/book2/io-address-space.svg)

---

## Writing to a port: `OUT`

`OUT (N), A` writes A to the 8-bit port number `N`:

```asm
LD A, $42        ; load value to send
OUT ($10), A     ; write $42 to port $10
```

The parentheses around `$10` mark a port operand, not a memory address. The
instruction encodes as two bytes: the `OUT` opcode and the port number. Only A
can supply the data in the immediate form.

`OUT (C), R` writes register R to the port number in C. Any standard 8-bit
register (B, C, D, E, H, L or A) can supply the data:

```asm
LD C, $10        ; 8-bit port number
LD D, $42        ; value to send
OUT (C), D       ; write D to port $10
OUT (C), A       ; write A to the same port
```

---

## Reading from a port: `IN`

`IN A, (N)` reads a byte from port `N` into A:

```asm
IN A, ($10)      ; read byte from port $10 into A
```

The immediate form requires A as the destination.

`IN R, (C)` reads from the port number in C into any standard 8-bit register:

```asm
LD C, $10        ; 8-bit port number
IN D, (C)        ; read from port $10 into D
IN A, (C)        ; read from the same port into A
```

The register-addressed `IN R, (C)` form **sets flags**:

- S is set if the byte read has bit 7 set.
- Z is set if the byte read is zero.
- P/V reflects the parity of the byte.
- H and N are reset.
- C (carry) is unaffected.

`IN R, (C)` sets flags; the immediate form `IN A, (N)` does not. When code must branch on a value read with the immediate form, a following `OR A` sets the flags explicitly before the conditional jump.

---

## Polling a port in a loop

Polling repeatedly reads a status port until a condition is met, then accesses
the data port.

```asm
STATPORT EQU $11
DATAPORT   EQU $10

; READRDY: spin until device is ready, then return the byte read.
; Out: A = received byte
; Clobbers: F
READRDY:
.WAIT:
  IN A, (STATPORT) ; read status into A
  AND $01           ; test bit 0 (ready flag)
  JR Z, .WAIT        ; Z set means bit 0 was 0 - not ready yet; loop
  IN A, (DATAPORT) ; bit 0 is 1 - device is ready; read data into A
  RET
```

`AND $01` keeps only bit 0 and sets Z when that bit was 0. `JR Z, .WAIT` loops back while Z is set (bit 0 still clear).

![The mask discards every bit except the ready flag. Z is set while that bit is clear.](../../assets/images/atom-book/book2/polling-loop.svg)

Both reads use immediate low-byte addresses. These examples assume the target
decodes only that low byte, as many small Z80 systems do.

---

## Sending a block of bytes

A counted loop can send a sequence of bytes to a fixed port one at a time. HL
points to the data and B holds the count:

```asm
OUT_PORT EQU $10

; SENDBLK: send B bytes from (HL) to OUT_PORT.
; In:  HL = source address, B = byte count
; Precondition: B > 0
; Clobbers: A, B, HL
SENDBLK:
.SENDLOOP:
  LD A, (HL)       ; load byte at current address
  OUT (OUT_PORT), A
  INC HL           ; advance source pointer
  DJNZ .SENDLOOP   ; decrement B; loop until B reaches 0
  RET
```

---

## Worked example

```asm
; Port demonstration
; Demonstrates Z80 in/out instructions and port forms.
; Port numbers are abstract: inspect the Z80 output, not hardware behavior.

OUT_PORT    EQU $10
IN_PORT     EQU $11
STATPORT EQU $12

; SENDBYTE: write A to OUT_PORT
; In:  A = byte to send
; Clobbers: nothing
SENDBYTE:
  OUT (OUT_PORT), A    ; immediate port form; A is the source
  RET

; RECVBYTE: read IN_PORT into A
; Out: A = byte received
RECVBYTE:
  IN A, (IN_PORT)      ; immediate port form; reads into A only
  RET

; echo_reg: write the byte in D using register-addressed form
; In:  D = byte to send
; Clobbers: C
ECHO_REG:
  LD C, OUT_PORT       ; C holds the 8-bit port number
  OUT (C), D           ; D is the data source
  RET

; POLLRECV: spin on STATPORT until bit 0 is set, then read IN_PORT
; Out: A = byte received
; Clobbers: F
POLLRECV:
.POLLLOOP:
  IN A, (STATPORT)  ; immediate form; flags unchanged
  AND $01              ; test bit 0
  JR Z, .POLLLOOP      ; Z set: not ready; keep polling
  IN A, (IN_PORT)      ; ready: read data into A
  RET

; SENDBLK: send B bytes from (HL) to OUT_PORT
; In:  HL = source address, B = byte count
; Precondition: B > 0
; Clobbers: A, B, HL
SENDBLK:
.BLKLOOP:
  LD A, (HL)
  OUT (OUT_PORT), A
  INC HL
  DJNZ .BLKLOOP
  RET

PAYLEN EQU 4

ORG $0000
MAIN:
  ; Demonstrate SENDBYTE
  LD A, $AA
  CALL SENDBYTE        ; sends $AA to OUT_PORT

  ; Demonstrate RECVBYTE (reads from IN_PORT; result in A)
  CALL RECVBYTE

  ; Demonstrate echo_reg
  LD D, $55
  CALL ECHO_REG         ; sends $55 to OUT_PORT via register-addressed out

  ; Demonstrate SENDBLK
  LD HL, PAYLOAD
  LD B, PAYLEN
  CALL SENDBLK
  HALT

ORG $8000
PAYLOAD: DB $10, $20, $30, $40
```

The key lines work as follows:

**`OUT (OUT_PORT), A`** is the immediate port form. `OUT_PORT` is defined as `$10` with `EQU`; the assembler substitutes `$10` at compile time.

**`IN A, (IN_PORT)`** reads from port `$11` into A and leaves the flags as they were.

**`OUT (C), D`**: D supplies the data and C holds the port number.

**`IN A, (STATPORT)` in `POLLRECV`** uses the immediate form, so the
flags still hold whatever the previous instruction left. `AND $01` isolates
bit 0 and sets Z before the branch.

**`SENDBLK`** is a DJNZ loop from Chapter 6 applied to output. B counts the
bytes and HL steps through source memory. Using the immediate output form keeps
B available as the loop counter.

---

## Interrupts

Polling keeps the CPU busy checking the status port until the device is ready.

The Z80 also supports **interrupts**. A hardware interrupt suspends the current
instruction stream, transfers control to a handler and later resumes the
interrupted code. Handlers often use `IN` and `OUT` to communicate with the
device that raised the interrupt.

Interrupts involve `DI`, `EI`, `IM` and `RETI`, along with stack and register
preservation rules. Interrupt-driven code requires the Z80 interrupt-mode
documentation for the target platform and its handler conventions.

---

## Exercise

**Flag behaviour of `IN`.** The comparison should state whether each form
updates Z and whether `JR Z, IS_ZERO` can follow directly:

```asm
IN A, (IN_PORT)   ; form A
IN A, (C)         ; form B
```

The shortest correct sequence for each form may assume C already contains
`IN_PORT` for form B. Tests beginning with Z clear and carry set should use
input bytes `$00` and `$80`, recording A, Z and carry after each read and any
explicit flag-setting instruction.

[Exercise notes](exercise-notes.md#chapter-9-i-o-and-ports)
