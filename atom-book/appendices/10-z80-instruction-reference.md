---
layout: default
title: "Appendix 10 — Z80 Instruction Reference"
parent: "Atom and Z80 Reference"
grand_parent: "Atom Books"
nav_order: 10
nav_group: "Z80 reference"
---
# Appendix 10 — Z80 Instruction Reference

This searchable table covers the Z80 instruction forms accepted by Atom. It
includes the documented instructions, classic index-half registers, `SLL` with
its `SLS` alias, and indexed CB forms with plain-register destinations.

The table omits firmware-specific `ED` aliases, extensions from other CPUs and
cycle counts.

Status values used below:

- `documented` is part of the standard documented Z80 set
- `documented prefix family` is standard, but lives in `CB`, `ED`, `DD`, `FD`,
  `DDCB` or `FDCB`
- `undocumented but classic` sits outside the original documented set, yet is
  widely supported and commonly treated as standard practice

The form column uses `R` for an encodable 8-bit register, `RR`, `SS` or `PP`
for the register-pair set accepted by that instruction, `N` for an 8-bit
value, `NN` for a 16-bit value, `D` for an index displacement, `DISP` for a
relative target and `CC` for a condition code. In `BIT`, `RES` and `SET`, `B`
means a bit number from 0 through 7.

---

| Mnemonic | Supported classic forms | Prefix families | Status | Notes |
|----------|-------------------------|-----------------|--------|-------|
| `ADC` | `ADC A,R`, `ADC A,N`, `ADC A,(HL)`, `ADC A,(IX+D)`, `ADC A,(IY+D)`, `ADC HL,SS` | base, `DD`, `FD`, `ED` | documented | two separate families: 8-bit accumulator and 16-bit `HL` |
| `ADD` | `ADD A,R`, `ADD A,N`, `ADD A,(HL)`, `ADD A,(IX+D)`, `ADD A,(IY+D)`, `ADD HL,SS`, `ADD IX,PP`, `ADD IY,RR` | base, `DD`, `FD` | documented | 16-bit add always writes back to first pair |
| `AND` | `AND R`, `AND N`, `AND (HL)`, `AND (IX+D)`, `AND (IY+D)`; optional explicit `A` first operand | base, `DD`, `FD` | documented | accumulator-only logical op |
| `BIT` | `BIT B,R`, `BIT B,(HL)`, `BIT B,(IX+D)`, `BIT B,(IY+D)` | `CB`, `DDCB`, `FDCB` | documented prefix family | bit test, no stored result |
| `CALL` | `CALL NN`, `CALL CC,NN` | base | documented | absolute subroutine call |
| `CCF` | `CCF` | base | documented | complement carry |
| `CP` | `CP R`, `CP N`, `CP (HL)`, `CP (IX+D)`, `CP (IY+D)`; optional explicit `A` first operand | base, `DD`, `FD` | documented | compare against `A`, flags only |
| `CPD` | `CPD` | `ED` | documented prefix family | block compare, decrement |
| `CPDR` | `CPDR` | `ED` | documented prefix family | repeated `CPD` |
| `CPI` | `CPI` | `ED` | documented prefix family | block compare, increment |
| `CPIR` | `CPIR` | `ED` | documented prefix family | repeated `CPI` |
| `CPL` | `CPL` | base | documented | complement accumulator |
| `DAA` | `DAA` | base | documented | BCD adjust after add/subtract |
| `DEC` | `DEC R`, `DEC RR`, `DEC (HL)`, `DEC (IX+D)`, `DEC (IY+D)`, `DEC IXH`, `DEC IXL`, `DEC IYH`, `DEC IYL` | base, `DD`, `FD` | documented plus undocumented-but-classic half-register forms | half-index-register forms are the undocumented part |
| `DI` | `DI` | base | documented | disable interrupts |
| `DJNZ` | `DJNZ DISP` | base | documented | relative counted branch using `B` |
| `EI` | `EI` | base | documented | enable interrupts |
| `EX` | `EX DE,HL`, `EX AF,AF'`, `EX (SP),HL`, `EX (SP),IX`, `EX (SP),IY` | base, `DD`, `FD` | documented | swap, not copy |
| `EXX` | `EXX` | base | documented | swaps `BC/DE/HL` with shadow set |
| `HALT` | `HALT` | base | documented | stop until interrupt |
| `IM` | `IM 0`, `IM 1`, `IM 2` | `ED` | documented prefix family | interrupt mode control |
| `IN` | `IN A,(N)`, `IN R,(C)`, `IN (C)` | base, `ED` | documented plus classic flags-only form | the operandless-destination form discards the byte and keeps its flag result |
| `INC` | `INC R`, `INC RR`, `INC (HL)`, `INC (IX+D)`, `INC (IY+D)`, `INC IXH`, `INC IXL`, `INC IYH`, `INC IYL` | base, `DD`, `FD` | documented plus undocumented-but-classic half-register forms | half-index-register forms are the undocumented part |
| `IND` | `IND` | `ED` | documented prefix family | block input, decrement |
| `INDR` | `INDR` | `ED` | documented prefix family | repeated `IND` |
| `INI` | `INI` | `ED` | documented prefix family | block input, increment |
| `INIR` | `INIR` | `ED` | documented prefix family | repeated `INI` |
| `JP` | `JP NN`, `JP CC,NN`, `JP (HL)`, `JP (IX)`, `JP (IY)` | base, `DD`, `FD` | documented | absolute branch or indirect jump |
| `JR` | `JR DISP`, `JR NZ,DISP`, `JR Z,DISP`, `JR NC,DISP`, `JR C,DISP` | base | documented | short relative branch only |
| `LD` | register/register, register/immediate, `(HL)` forms, `(IX+D)` / `(IY+D)` forms, `A` with `(BC)` / `(DE)`, absolute memory forms, `SP <- HL/IX/IY`, `I/R` transfers, classic half-register forms, and the Atom convenience forms `LD HL,DE` / `LD BC,DE` | base, `DD`, `FD`, `ED` | documented, classic-undocumented and two Atom convenience forms | `LD HL,DE` emits `LD H,D` / `LD L,E`; `LD BC,DE` emits `LD B,D` / `LD C,E` |
| `LDD` | `LDD` | `ED` | documented prefix family | block transfer, decrement |
| `LDDR` | `LDDR` | `ED` | documented prefix family | repeated `LDD` |
| `LDI` | `LDI` | `ED` | documented prefix family | block transfer, increment |
| `LDIR` | `LDIR` | `ED` | documented prefix family | repeated `LDI` |
| `NEG` | `NEG` | `ED` | documented prefix family | two-byte negation of `A` |
| `NOP` | `NOP` | base | documented | no operation |
| `OR` | `OR R`, `OR N`, `OR (HL)`, `OR (IX+D)`, `OR (IY+D)`; optional explicit `A` first operand | base, `DD`, `FD` | documented | accumulator-only logical op |
| `OTDR` | `OTDR` | `ED` | documented prefix family | repeated block output, decrement |
| `OTIR` | `OTIR` | `ED` | documented prefix family | repeated block output, increment |
| `OUT` | `OUT (N),A`, `OUT (C),R`, `OUT (C),0` | base, `ED` | documented plus classic zero-output form | immediate-port output takes its byte from A |
| `OUTD` | `OUTD` | `ED` | documented prefix family | block output, decrement |
| `OUTI` | `OUTI` | `ED` | documented prefix family | block output, increment |
| `POP` | `POP BC`, `POP DE`, `POP HL`, `POP AF`, `POP IX`, `POP IY` | base, `DD`, `FD` | documented | word-sized only |
| `PUSH` | `PUSH BC`, `PUSH DE`, `PUSH HL`, `PUSH AF`, `PUSH IX`, `PUSH IY` | base, `DD`, `FD` | documented | word-sized only |
| `RES` | `RES B,R`, `RES B,(HL)`, `RES B,(IX+D)`, `RES B,(IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | documented prefix family plus undocumented-but-classic indexed result-copy forms | classic CPUs commonly copy indexed result into target register |
| `RET` | `RET`, `RET CC` | base | documented | return from subroutine |
| `RETI` | `RETI` | `ED` | documented prefix family | interrupt return |
| `RETN` | `RETN` | `ED` | documented prefix family | interrupt/non-maskable return |
| `RL` | `RL R`, `RL (HL)`, `RL (IX+D)`, `RL (IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | documented prefix family plus undocumented-but-classic indexed result-copy forms | 9-bit left rotation through carry: bit 7 → new C, old C → bit 0; updates S, Z, P/V, C |
| `RLA` | `RLA` | base | documented | same 9-bit left rotation as RL, accumulator only; C changes, H and N clear, S/Z/P/V unchanged |
| `RLC` | `RLC R`, `RLC (HL)`, `RLC (IX+D)`, `RLC (IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | documented prefix family plus undocumented-but-classic indexed result-copy forms | circular left: bit 7 wraps to bit 0 and copies to C; updates S, Z, P/V, C |
| `RLCA` | `RLCA` | base | documented | same circular left rotation as RLC, accumulator only; C changes, H and N clear, S/Z/P/V unchanged |
| `RLD` | `RLD` | `ED` | documented prefix family | nibble rotate between `A` and `(HL)` |
| `RR` | `RR R`, `RR (HL)`, `RR (IX+D)`, `RR (IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | documented prefix family plus undocumented-but-classic indexed result-copy forms | 9-bit right rotation through carry: bit 0 → new C, old C → bit 7; updates S, Z, P/V, C |
| `RRA` | `RRA` | base | documented | same 9-bit right rotation as RR, accumulator only; C changes, H and N clear, S/Z/P/V unchanged |
| `RRC` | `RRC R`, `RRC (HL)`, `RRC (IX+D)`, `RRC (IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | documented prefix family plus undocumented-but-classic indexed result-copy forms | circular right: bit 0 wraps to bit 7 and copies to C; updates S, Z, P/V, C |
| `RRCA` | `RRCA` | base | documented | same circular right rotation as RRC, accumulator only; C changes, H and N clear, S/Z/P/V unchanged |
| `RRD` | `RRD` | `ED` | documented prefix family | nibble rotate between `A` and `(HL)` |
| `RST` | `RST $00/$08/$10/$18/$20/$28/$30/$38` | base | documented | fixed low-memory call vectors |
| `SBC` | `SBC A,R`, `SBC A,N`, `SBC A,(HL)`, `SBC A,(IX+D)`, `SBC A,(IY+D)`, `SBC HL,SS` | base, `DD`, `FD`, `ED` | documented | two separate families: 8-bit accumulator and 16-bit `HL` |
| `SCF` | `SCF` | base | documented | set carry |
| `SET` | `SET B,R`, `SET B,(HL)`, `SET B,(IX+D)`, `SET B,(IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | documented prefix family plus undocumented-but-classic indexed result-copy forms | sets bit and writes back |
| `SLA` | `SLA R`, `SLA (HL)`, `SLA (IX+D)`, `SLA (IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | documented prefix family plus undocumented-but-classic indexed result-copy forms | shift left: bit 7 → C, 0 fills bit 0; effectively multiply by 2; updates S, Z, P/V, C |
| `SLL` / `SLS` | `SLL R`, `SLL (HL)`, `SLL (IX+D)`, `SLL (IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | undocumented but classic | shift left with 1 filling bit 0 (result always odd); bit 7 → C; two common names for the same opcode |
| `SRA` | `SRA R`, `SRA (HL)`, `SRA (IX+D)`, `SRA (IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | documented prefix family plus undocumented-but-classic indexed result-copy forms | arithmetic right shift: bit 0 → C, bit 7 preserved (sign extension); correct for signed divide by 2; updates S, Z, P/V, C |
| `SRL` | `SRL R`, `SRL (HL)`, `SRL (IX+D)`, `SRL (IY+D)`, indexed result-copy forms | `CB`, `DDCB`, `FDCB` | documented prefix family plus undocumented-but-classic indexed result-copy forms | logical right shift: bit 0 → C, 0 fills bit 7; correct for unsigned divide by 2; updates S, Z, P/V, C |
| `SUB` | `SUB R`, `SUB N`, `SUB (HL)`, `SUB (IX+D)`, `SUB (IY+D)`; optional explicit `A` first operand | base, `DD`, `FD` | documented | accumulator-only subtract |
| `XOR` | `XOR R`, `XOR N`, `XOR (HL)`, `XOR (IX+D)`, `XOR (IY+D)`; optional explicit `A` first operand | base, `DD`, `FD` | documented | accumulator-only logical op |

---

## Undocumented forms included here

- `IXH`, `IXL`, `IYH`, `IYL` in many 8-bit `LD`, `INC`, `DEC`, and ALU forms
- `SLL` / `SLS`
- `DDCB` / `FDCB` indexed rotate/shift/bit-result-copy forms such as
  `RLC (IX+3),B`

---

## Rotate and shift instructions in detail

---

### Circular rotates: RLC / RLCA and RRC / RRCA

The byte rotates as a closed ring. The bit that falls off one end wraps to the
other end, and a copy of it lands in the carry flag.

```text
RLC / RLCA  (CIRCULAR ROTATE LEFT)
  BEFORE:  [B7 B6 B5 B4 B3 B2 B1 B0]   C = ?
  AFTER:   [B6 B5 B4 B3 B2 B1 B0 B7]   C = B7
  (BIT 7 WRAPS TO BIT 0; C RECEIVES A COPY OF B7)

RRC / RRCA  (CIRCULAR ROTATE RIGHT)
  BEFORE:  [B7 B6 B5 B4 B3 B2 B1 B0]   C = ?
  AFTER:   [B0 B7 B6 B5 B4 B3 B2 B1]   C = B0
  (BIT 0 WRAPS TO BIT 7; C RECEIVES A COPY OF B0)
```

---

### Through-carry rotates: RL / RLA and RR / RRA

The carry flag is a ninth bit. The displaced bit exits through carry; the
old carry enters on the other side.

```text
RL / RLA  (ROTATE LEFT THROUGH CARRY)
  BEFORE:  [B7 B6 B5 B4 B3 B2 B1 B0]   C = C
  AFTER:   [B6 B5 B4 B3 B2 B1 B0  C]   C = B7
  (OLD C ENTERS BIT 0; BIT 7 EXITS TO NEW C)

RR / RRA  (ROTATE RIGHT THROUGH CARRY)
  BEFORE:  [B7 B6 B5 B4 B3 B2 B1 B0]   C = C
  AFTER:   [ C B7 B6 B5 B4 B3 B2 B1]   C = B0
  (OLD C ENTERS BIT 7; BIT 0 EXITS TO NEW C)
```

A left rotation through carry followed by a right rotation through carry
recovers the original byte and carry. This makes RL/RR suitable for shifting
multi-byte values because carry transfers the overflow bit between adjacent
bytes.

---

### Shifts: SLA, SRA, SRL, SLL/SLS

A shift discards the bit that falls off one end, after copying it to carry, and
fills the vacated position with a fixed value. Rotates are the ones that wrap.

```text
SLA  (SHIFT LEFT ARITHMETIC)
  BEFORE:  [B7 B6 B5 B4 B3 B2 B1 B0]   C = ?
  AFTER:   [B6 B5 B4 B3 B2 B1 B0  0]   C = B7
  (0 FILLS BIT 0; BIT 7 EXITS TO C; EQUIVALENT TO MULTIPLY BY 2)

SLL / SLS  (SHIFT LEFT LOGICAL, UNDOCUMENTED)
  BEFORE:  [B7 B6 B5 B4 B3 B2 B1 B0]   C = ?
  AFTER:   [B6 B5 B4 B3 B2 B1 B0  1]   C = B7
  (1 FILLS BIT 0; BIT 7 EXITS TO C; RESULT ALWAYS HAS BIT 0 SET)

SRA  (SHIFT RIGHT ARITHMETIC)
  BEFORE:  [B7 B6 B5 B4 B3 B2 B1 B0]   C = ?
  AFTER:   [B7 B7 B6 B5 B4 B3 B2 B1]   C = B0
  (BIT 7 PRESERVED, COPIED INTO ITSELF; BIT 0 EXITS TO C; SIGNED DIVIDE BY 2)

SRL  (SHIFT RIGHT LOGICAL)
  BEFORE:  [B7 B6 B5 B4 B3 B2 B1 B0]   C = ?
  AFTER:   [ 0 B7 B6 B5 B4 B3 B2 B1]   C = B0
  (0 FILLS BIT 7; BIT 0 EXITS TO C; UNSIGNED DIVIDE BY 2)
```

SRA copies bit 7 into itself while SRL clears it. SRA therefore preserves the
sign and rounds negative odd values toward minus infinity: −4 (`$FC`) becomes
−2 (`$FE`), while −3 (`$FD`) becomes −2 (`$FE`). SRL treats the same bits as
an unsigned value.

---

### Accumulator forms vs CB-prefix forms

| Form | Example | Flags updated |
|------|---------|---------------|
| Accumulator-only | `RLCA`, `RRCA`, `RLA`, `RRA` | C changes; H and N clear; S, Z and P/V stay unchanged |
| CB-prefix (any register) | `RLC R`, `RRC R`, `RL R`, `RR R` | S, Z, P/V, C |

`RLCA`, `RRCA`, `RLA` and `RRA` are single-byte base instructions, fast and
compact.

`RLC R`, `RRC R`, `RL R` and `RR R` are CB-prefix forms. A zero test after a
rotation, such as detecting when all bits have shifted out, requires the
CB-prefix form rather than the accumulator shorthand.

---

### Quick reference: what enters and exits each operation

| Instruction | Bit entering | From | Bit exiting | To |
|-------------|-------------|------|-------------|-----|
| RLC / RLCA | b7 | wraps from bit 7 | b7 copy | C |
| RL / RLA | old C | enters bit 0 | b7 | new C |
| RRC / RRCA | b0 | wraps from bit 0 | b0 copy | C |
| RR / RRA | old C | enters bit 7 | b0 | new C |
| SLA | 0 | fills bit 0 | b7 | C |
| SLL / SLS | 1 | fills bit 0 | b7 | C |
| SRA | b7 | preserved in place | b0 | C |
| SRL | 0 | fills bit 7 | b0 | C |
