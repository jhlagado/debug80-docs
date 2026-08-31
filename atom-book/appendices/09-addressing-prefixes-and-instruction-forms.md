---
layout: default
title: "Appendix 9 — Addressing, Prefixes and Forms"
parent: "Atom and Z80 Reference"
grand_parent: "Atom Books"
nav_order: 9
nav_group: "Z80 reference"
---
# Appendix 9 — Addressing, Prefixes and Forms

---

## Form notation

The tables use `R` for an encodable 8-bit register, `RR` or another doubled
letter for the register-pair set accepted by that instruction, `N` for an
8-bit value, `NN` for a 16-bit value, `D` for an index displacement and `CC`
for a condition code. Each instruction family determines the exact register
set.

## Addressing shapes

| Shape | Example | Meaning | Typical use |
|-------|---------|---------|-------------|
| immediate byte | `LD A, $2A` | constant encoded in the instruction | constants, masks, small values |
| immediate word | `LD HL, $8000` | 16-bit constant encoded in the instruction | addresses, counters, setup |
| register | `LD D, A` | copy between registers | cheap data movement |
| register pair | `ADD HL, DE` | operate on a 16-bit pair | addresses, word arithmetic |
| register indirect | `LD A, (HL)` | memory at address in `HL` | pointer-based table walk |
| indexed indirect | `LD A, (IX+3)` | memory at `IX + displacement` | records, stack frames |
| absolute memory | `LD A, ($8000)` | memory at a fixed 16-bit address | globals, I/O-mapped data |
| relative branch | `JR NZ, LOOP` | branch by signed offset | short local branches |
| absolute branch | `JP NZ, TARGET` | branch to full 16-bit address | long-range control flow |

---

## Prefix families

| Prefix | Family | What it usually means |
|--------|--------|-----------------------|
| none | base | ordinary documented Z80 instruction set |
| `CB` | rotate/shift/bit family | `RLC`, `BIT`, `RES`, `SET` and related forms |
| `ED` | extended family | block ops, `NEG`, `RETI/RETN`, `IM`, `RLD/RRD`, 16-bit `ADC/SBC`, port forms |
| `DD` | IX substitution | many `HL`-based forms become `IX`-based |
| `FD` | IY substitution | many `HL`-based forms become `IY`-based |
| `DD CB D` | indexed bit/shift family | operate on `(IX+D)` |
| `FD CB D` | indexed bit/shift family | operate on `(IY+D)` |

`DD` and `FD` substitute IX or IY only in the encodable forms shown below.

---

## `LD` quick table

| Family | Examples | Notes |
|--------|----------|-------|
| 8-bit register to register | `LD A, B`, `LD D, H` | common and fast |
| immediate to register | `LD A, $2A`, `LD HL, $8000` | constants encoded in instruction |
| register with `(HL)` | `LD A, (HL)`, `LD (HL), A`, `LD (HL), 0` | main indirect byte access |
| register with `(IX+d)` / `(IY+d)` | `LD A, (IX+3)`, `LD (IY-1), A` | indexed access |
| `A` with `(BC)` / `(DE)` | `LD A, (BC)`, `LD (DE), A` | only `A` is allowed |
| absolute memory | `LD A, ($8000)`, `LD ($8000), A`, `LD HL, ($8000)` | globals and fixed addresses |
| stack pointer load | `LD SP, HL`, `LD SP, IX`, `LD SP, IY` | special-case form |

Illegal pattern to remember:

```asm
LD ($8001), ($8000)   ; IMPOSSIBLE
```

Memory-to-memory moves must go through a register.

---

## Arithmetic, logic and compare quick table

| Family | Main forms | Result goes to | Notes |
|--------|------------|----------------|-------|
| `ADD` | `ADD A,X`, `ADD HL,SS`, `ADD IX,PP`, `ADD IY,RR` | first operand | 8-bit add is accumulator-based |
| `ADC` | `ADC A,X`, `ADC HL,SS` | first operand | includes carry |
| `SUB` | `SUB X` | `A` | accumulator only |
| `SBC` | `SBC A,X`, `SBC HL,SS` | first operand | subtract with carry/borrow |
| `AND` | `AND X` | `A` | accumulator only |
| `OR` | `OR X` | `A` | accumulator only |
| `XOR` | `XOR X` | `A` | accumulator only |
| `CP` | `CP X` | no stored result | flags only |
| `INC` | `INC R`, `INC RR`, `INC (HL)`, `INC (IX+D)` | operand itself | changes the operand in place |
| `DEC` | `DEC R`, `DEC RR`, `DEC (HL)`, `DEC (IX+D)` | operand itself | often used for loops |

---

## Rotate, shift and bit quick table

| Family | Examples | Notes |
|--------|----------|-------|
| accumulator rotates | `RLCA`, `RRCA`, `RLA`, `RRA` | short one-byte accumulator forms |
| general rotates | `RLC R`, `RRC R`, `RL R`, `RR R` | base `CB` family |
| shifts | `SLA R`, `SRA R`, `SRL R` | base `CB` family |
| bit test | `BIT N,R`, `BIT N,(HL)` | tests a bit and leaves the operand as it stands |
| bit clear | `RES N,R`, `RES N,(HL)` | writes back changed value |
| bit set | `SET N,R`, `SET N,(HL)` | writes back changed value |
| indexed forms | `BIT 3,(IX+2)`, `SRL (IY-1)` | `DD CB D` / `FD CB D` families |
| classic-undocumented shift | `SLL R` / `SLS R` | widely used but not part of the original documented set |

---

## Control flow, stack and exchange quick table

| Family | Examples | Notes |
|--------|----------|-------|
| absolute jump | `JP TARGET`, `JP NZ,TARGET`, `JP (HL)` | long-range branch |
| relative jump | `JR TARGET`, `JR Z,TARGET` | short branch only |
| counted branch | `DJNZ LOOP` | `B := B - 1`, branch if result not zero |
| call/return | `CALL FN`, `RET`, `RET Z` | uses hardware stack |
| restart | `RST $38` | call to fixed low-memory vector |
| stack | `PUSH BC`, `POP HL` | word-sized only |
| exchange | `EX DE,HL`, `EX AF,AF'`, `EXX`, `EX (SP),HL` | swaps rather than copies |
| interrupt state | `DI`, `EI`, `IM 0/1/2` | machine control, not everyday data movement |

---

## Block instructions at a glance

| Family | Mnemonics | What they do |
|--------|-----------|--------------|
| block transfer | `LDI`, `LDIR`, `LDD`, `LDDR` | copy bytes between `(HL)` and `(DE)` while updating pointers/counter |
| block compare | `CPI`, `CPIR`, `CPD`, `CPDR` | compare `A` against bytes in memory while updating pointers/counter |
| block input | `INI`, `INIR`, `IND`, `INDR` | port input plus memory store |
| block output | `OUTI`, `OTIR`, `OUTD`, `OTDR` | memory read plus port output |
