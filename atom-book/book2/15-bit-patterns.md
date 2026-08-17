---
layout: default
title: "Bit Patterns and Packed Flags"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 15
---

# Bit Patterns and Packed Flags

One byte can hold eight independent yes-or-no states. A mask selects one of
those states for testing, setting or clearing.

[`examples/bit-flags.asm`](examples/bit-flags.asm) starts with ready and busy
set, records the initial ready state, sets error, clears busy and extracts the
error bit as the number 1.

## Positions and masks

Atom has no enum directive, so the source assigns the three positions with
ordinary constants:

```asm
READYBIT EQU 0
ERRORPOS EQU 1
BUSYBIT EQU 2
READYMSK EQU 1<<READYBIT
ERRORMSK EQU 1<<ERRORPOS
BUSYMSK EQU 1<<BUSYBIT
```

The masks are `$01`, `$02` and `$04`. Deriving them with a shift keeps each bit
position and mask tied to the same constant.

![Three named bits share one byte.](../../assets/images/azm-book/book3/byte-as-switches.svg)

## Testing a bit

`AND` clears every unselected bit. The Z flag then reports whether the selected
bit was zero:

```asm
    LD A,(FLAGS)
    AND READYMSK
    LD A,0
    JR Z,.CLEAR
    LD A,1
.CLEAR:
    LD (READYLIT),A
```

`LD A,0` does not change flags, so the branch still uses the Z result from
`AND`. The sequence stores a literal 0 or 1 rather than the mask value.

## Setting a bit

OR combines the selected 1 bits with the live byte:

```asm
    LD A,(FLAGS)
    OR ERRORMSK
    LD (FLAGS),A
```

Every existing 1 bit remains set, and the error bit becomes 1.

## Clearing a bit

Clearing requires the inverse mask. The live value is preserved in B while A
builds that mask:

```asm
    LD A,(FLAGS)
    LD B,A
    LD A,BUSYMSK
    CPL
    AND B
    LD (FLAGS),A
```

`CPL` turns `$04` into `$FB`. AND with `$FB` clears bit 2 and preserves the
other seven bits.

## Extracting a numeric bit

The error mask leaves its bit in position 1. A rotate right moves it into
position 0:

```asm
GETERROR:
    AND ERRORMSK
    RR A
    RET
```

The AND guarantees that every other bit is zero, so the returned value is
exactly 0 or 1. After the demonstration halts, `FLAGS` is `$03`, `READYLIT` is
1 and `ERRORBIT` is 1.

The Z80 `BIT`, `SET` and `RES` instructions are useful when the bit position is
fixed in the instruction. Masks remain useful when the position is represented
as a value or when several bits must change together.

## Exercise

Add an enabled flag at bit 7. Give its mask, the instruction sequence that sets
it and the hexadecimal value produced when it is combined with the final
`FLAGS` byte.
