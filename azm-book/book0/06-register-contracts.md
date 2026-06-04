---
layout: default
title: "Chapter 6 — Register Contracts"
parent: "AZM Book 0 — Assembler Manual"
nav_order: 6
---
[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Op Declarations and Aliases →](07-ops-aliases.md)

# Chapter 6 — Register Contracts

`B` holds your loop counter. The loop calls a subroutine. The subroutine finishes and returns. `djnz` decrements `B` and branches back — but `B` now holds whatever the subroutine left there, not the value it had before the call. The loop runs the wrong number of iterations. The binary assembles without error.

This is a register collision. The assembler has no way to know what value `B` should hold at any given instruction. The program may pass all your tests and break on an input you did not try.

AZM's register contracts find these collisions at assemble time by making the register use between routines explicit and machine-checkable. They are deliberately stricter than casual assembly style: they ask you to write routine boundaries, register effects and external calls in a form the assembler can prove.

---

## A concrete collision

Here is a loop that processes eight tiles. `B` is the iteration counter; `HL` points to the current tile in memory:

```asm
@ScanTiles:
        ld      b,8
ScanLoop:
        ld      a,(hl)
        call    RenderTile
        inc     hl
        djnz    ScanLoop
        ret
```

`RENDER_TILE` draws one tile. Inside, it uses `B` as the high byte of a 16-bit offset calculation:

```asm
@RenderTile:
        ld      b,0             ; B = 0, high byte of BC
        ld      c,a
        add     hl,bc           ; HL += tile index (16-bit add)
        ld      a,(hl)
        ; ... drawing work ...
        ret
```

After `call RENDER_TILE` returns, `B` holds 0. `djnz ScanLoop` decrements that 0, which wraps to 255, and branches back. The loop runs 256 times instead of 8.

The code at each call site looks correct. Neither routine has a bug when read in isolation. The bug lives in the interface: `SCAN_TILES` assumes `RENDER_TILE` leaves `B` unchanged. `RENDER_TILE` makes no such promise.

---

## Terms

**caller**: the code that executes `call NAME`. In the example above, `SCAN_TILES` is the caller of `RENDER_TILE`.

**callee**: the subroutine named by that call. `RENDER_TILE` is the callee.

**clobber**: to overwrite a register value the caller still needed. `RENDER_TILE` clobbers `B` because `SCAN_TILES` reads `B` after the call returns.

**preserves**: a register exits with the same value it had on entry. Preservation is an observable entry/exit property. Pushing on entry and popping on exit is one way to preserve a register; not writing the register at all is another. The contract says the register is unchanged on exit; how that is achieved is an implementation detail.

**live**: a register is live at a point in the code if its value will be read before the next write to it. `B` is live at the `call RENDER_TILE` because `djnz` reads `B` after the call returns.

---

## The contract that exposes the clobber

AZM uses `;!` comment blocks to record what each routine does to registers. A contract above `RENDER_TILE` makes the clobber explicit:

```asm
;!      clobbers  B
@RenderTile:
```

With this contract in place and register contracts enabled, AZM inspects every call to `RENDER_TILE`. At the call in `SCAN_TILES`, `B` holds the loop counter — a value the caller reads after the call returns. The contract says `RENDER_TILE` clobbers `B`. AZM reports the conflict:

```
scan.asm:7:9: warning AZMN_REGISTER_CARE: B is live across CALL RENDER_TILE,
  but RENDER_TILE may modify B (clobbers: B)
```

---

## Repair options

Three ways to fix this collision:

**Option 1 — save and restore in the caller:**

```asm
@ScanTiles:
        ld      b,8
ScanLoop:
        ld      a,(hl)
        push    bc          ; save B before the call
        call    RenderTile
        pop     bc          ; restore B
        inc     hl
        djnz    ScanLoop
        ret
```

**Option 2 — have the callee preserve B:**

```asm
;!      preserves B
@RenderTile:
        push    bc
        ld      b,0
        ld      c,a
        add     hl,bc
        ld      a,(hl)
        ; ... drawing work ...
        pop     bc
        ret
```

The contract now states `B` is preserved. The warning disappears because `RENDER_TILE` no longer clobbers a register the caller needs.

**Option 3 — restructure so the values do not collide:**

Move `B` to a RAM location or use a different register in one of the routines. When the live value and the clobber are in different registers, there is no conflict.

---

## Routine boundaries: `@` entry labels

Register contract analysis proves facts inside routine regions. The `@` prefix marks those regions:

```asm
@RenderTile:
        ; ... body ...
        ret
```

The callable symbol is `RENDER_TILE` — callers write `call RENDER_TILE`. The `@` is AZM's source marker for analysis, not part of the symbol name.

- `@Name:` starts a new routine named `Name`
- Plain branch labels inside the body stay within that routine region
- The next `@OtherName:` ends the current routine and starts a new one
- Consecutive `@` labels before the first instruction are aliases for the same routine entry

Plain labels inside an `@` routine are ordinary branch targets:

```asm
@ScanRow:
        ld      b,8
ScanRowBitLoop:
        rl      (hl)
        inc     hl
        djnz    ScanRowBitLoop
        ret
```

`ScanRowBitLoop` is a branch label inside `SCAN_ROW`. AZM sees the whole body as one span.

Plain labels are still global assembler symbols. They are not local labels, and they must be unique across the whole translation unit:

```asm
@ShiftRow:
ShiftLoop:
        ; ...
        ret

@CopyRow:
CopyLoop:
        ; ...
        ret
```

Use routine boundaries to match the units whose register and stack effects you want AZM to prove. Legal Z80 assembly can jump anywhere in the final address space, but cross-boundary control flow is hard for register contracts to reason about. Keep ordinary branches inside the current `@` routine. Use `call` when you want to enter another routine with its own contract.

---

## Enabling register contracts

Register contracts are checked by the assembler and reported as compiler diagnostics. In ordinary use, run AZM with `--rc audit`, `--rc warn`, `--rc error` or `--rc strict` and read the warnings or errors printed by the compiler.

Register contract analysis is controlled by `--rc`:

```sh
azm --rc off program.asm        # no register contract analysis
azm --rc audit program.asm      # analyze contracts without failing the build
azm --rc warn program.asm       # print warnings but still build
azm --rc error program.asm      # fail on proven conflicts
azm --rc strict program.asm     # fail on anything AZM cannot prove safe
```

Default is `off`.

Use the modes as a ladder:

| Mode | Use it when |
|------|-------------|
| `off` | You want ordinary assembly only |
| `audit` | You want AZM to analyze contracts without failing the build; useful while editing |
| `warn` | You want warnings printed while the build still succeeds |
| `error` | You want proven register contract conflicts to fail the build |
| `strict` | You want anything AZM cannot prove safe to fail the build, including unknown routine boundaries and stack effects |

For a Debug80 edit-and-restart loop, use `audit` or `warn` while exploring a messy port. Use `strict` for deliberate rebuilds once the routine boundaries and external interfaces are in place.

---

## What AZM infers

Given a routine body, AZM infers:

- **Inputs** (`in`): registers and flags whose incoming value is read before any write
- **Outputs** (`out`): registers and flags that carry meaningful return values on all exit paths
- **Clobbers** (`clobbers`): registers written and not restored to the incoming value

The inference follows the instruction stream through the control-flow graph of the routine body. It handles push/pop pairs, straight-line code and branch paths within the routine body. Indirect effects — a callee's effect on RAM or runtime-computed results — need explicit contracts through `;!` blocks.

## Caller-side conflict checking

At each `call` site, AZM intersects:

- The set of registers and flags that are live after the call (used by the caller before being overwritten)
- The callee's may-modify set (clobbers plus outputs that change the value)

If the intersection is non-empty, AZM reports a diagnostic.

```asm
        ld      de,BOARD_ROWS
        ld      b,ROW_COUNT
CheckLoop:
        ld      a,(de)
        call    CHECK_SOMETHING    ; if CHECK_SOMETHING clobbers DE or B: warning
        inc     de
        djnz    CheckLoop
```

---

## Stack discipline

Register preservation on the Z80 often uses the stack. AZM can check that discipline when the save and restore happen inside the same routine region:

```asm
;!      preserves BC
@DrawRows:
        push    bc
        ; ... uses B and C temporarily ...
        pop     bc
        ret
```

Keep `push`/`pop` save-restore pairs inside the same `@` routine region. If a routine has more than one exit path, each path must restore the stack before `ret`.

This shape is awkward for register contracts:

```asm
@CopyName:
        push    bc
        jr      z,SharedFail
        pop     bc
        ret

@LoadConfig:
        ; ...
SharedFail:
        pop     bc
        ret
```

`COPY_NAME` pushes `BC`, then branches to a label that lives after the `@LoadConfig:` boundary. The source is legal assembly, but the routine boundary no longer matches the stack behaviour AZM is trying to prove.

Keep the shared exit inside the same routine region:

```asm
@CopyName:
        push    bc
        jr      z,CopyNameFail
        pop     bc
        ret
CopyNameFail:
        pop     bc
        ret

@LoadConfig:
        ; separate routine region
        ret
```

If two routines genuinely share a larger cleanup sequence, make that sequence a real callable routine with its own `@` boundary and contract. The goal is not to ban shared code. The goal is to make routine boundaries match the units whose register and stack effects AZM can check.

---

## AZMDoc syntax

AZMDoc is the comment format for machine-readable register contracts. The `;!` prefix keeps contracts separate from human prose. AZMDoc metadata is parse-only; the assembled bytes are unaffected.

### Source contract syntax

A source contract is a block of contiguous `;!` lines immediately before a routine entry label:

```asm
; Tests candidate piece placement against walls, floor and board rows.
; D contains candidate x coordinate, E contains candidate y coordinate.
; Carry returned set when placement is blocked.
;!      in        DE
;!      out       carry
;!      clobbers  A
@CheckCollisionAtDe:
```

The `;!` lines must be directly above the entry label with no intervening blank lines or other statements. Human prose comments can precede the `;!` block.

### Contract keys

Five keys are recognized:

| Key | Meaning |
|-----|---------|
| `in` | Registers/flags whose incoming value the routine reads |
| `out` | Registers/flags that carry meaningful returned values |
| `maybe-out` | Inferred output candidates that need review before promotion |
| `clobbers` | Registers/flags the routine destroys (no restore) |
| `preserves` | Registers/flags the routine restores to their entry value |

Read those keys from the caller's point of view:

- `in` means the caller must provide this carrier before the call
- `out` means the caller may intentionally consume this carrier after the call
- `maybe-out` means AZM saw a written value that might be an output, but you still need to review it
- `clobbers` means the caller must not expect the incoming value to survive
- `preserves` means the incoming value survives the call

### Carrier lists

Carriers appear in a comma-separated list after the key:

```asm
;!      in        A,DE,HL
;!      out       carry
;!      clobbers  BC
```

Register pair names expand to their constituent 8-bit registers for analysis — `BC` to `B,C`, `DE` to `D,E` and so on. See [Appendix A](appendix-a-directives.md) for the full carrier-notation table. Flags are named individually:

```asm
;!      out       carry,zero
;!      clobbers  A,carry
```

Use `carry` for the carry flag; `C` names register C. Individual flag names: `carry`, `zero`, `sign`, `parity`, `halfCarry`.

Prefer individual flag names when a routine returns status in flags:

```asm
;!      in        A,HL
;!      out       carry
;!      clobbers  BC
@CheckTile:
```

Prefer register pairs when the routine treats the pair as one value:

```asm
;!      in        DE
;!      out       HL
;!      clobbers  A
@FindRecord:
```

### Inputs and outputs on the same carrier

A routine that transforms a register in place — reads it as input, returns it modified — lists it in both `in` and `out`:

```asm
; Normalises the coordinate pair in DE.
;!      in        DE
;!      out       DE
;!      clobbers  A
@NormaliseDe:
```

### Caller-site hints

For one-off call sites during annotation, place a narrow hint immediately before the call:

```asm
        ; expects out DE
        call    NormaliseDe
        ld      a,(de)
```

`expects out DE` tells the analyzer that this call site intentionally consumes DE as a callee-produced output, suppressing the conflict diagnostic for this one call.

---

## Generating contracts from inference

Once you have `@` labels in place, AZM can infer contracts and write them back into source:

```sh
azm --contracts --rc audit program.asm
```

AZM infers register contracts for each `@` routine and inserts `;!` blocks directly above the entry labels. On subsequent runs, it replaces the generated block. Human prose comments above the `;!` block are preserved untouched.

After the first run, read the generated contract for each routine. AZM inferred those contracts from the instruction stream, so treat them as a starting point and check that they match the routine's intended interface.

When AZM infers a written value that could be either a clobber or an output, it may write `maybe-out`:

```asm
;!      in        A
;!      maybe-out A
;!      clobbers  B
@MaskA:
```

Review every `maybe-out`. If the value is intentionally returned, promote it with `--accept-out`:

```sh
azm --accept-out MASKA:A --rc audit program.asm
```

If the value is not part of the routine interface, leave it as a clobber or rewrite the routine so the effect is clear.

You can also hand-write or hand-edit `;!` blocks directly. The tool-generated block is overwritten on the next `--contracts` run; a hand-authored block is yours to maintain separately.

### Generating `.asmi` interface files

```sh
azm --rc audit --reg-interface program.asm
```

Writes `program.asmi` with `extern` contract records for every `@` routine. Other projects that call into your code can load this file with `--interface` to get analysis-quality call-site checking.

---

## External contracts

When you call a ROM monitor routine or a library routine assembled separately, external contracts give the analyzer the routine's register behaviour:

```asm
extern MON_PUTC
in A
clobbers A
end

extern MON_GETC
out A
out zero
end
```

Load with `--interface mon3.asmi`. The analyzer uses these contracts at call sites to `MON_PUTC` and `MON_GETC`.

```sh
azm --interface mon3.asmi --rc strict program.asm
```

Strict mode treats missing routine bodies and missing external contracts as build failures. If the assembler cannot see a direct-call target, load an `.asmi` file for it or add the missing source to the translation unit.

```sh
azm --reg-profile mon3 program.asm
```

The `mon3` profile provides built-in register contract summaries for MON3 RST service calls on TEC-1 and MON3-based projects.

---

## A practical workflow

Use register contracts as part of editing:

1. Write or edit the routine.
2. Run `azm --rc audit program.asm` while the code is still moving.
3. Add or regenerate `;!` contracts with `azm --contracts --rc audit program.asm`.
4. Run `azm --rc error program.asm` to fail on proven conflicts.
5. Run `azm --rc strict program.asm` once routine boundaries and external interfaces are in place.
6. Fix routine structure, contracts or interfaces until strict mode passes.

If strict mode makes a piece of assembly uncomfortable, look first at the routine boundary. Shared exits, cross-boundary jumps and hidden monitor calls are often the code shapes that need to become explicit.

---

## Text reports

AZM can also write a text report with `--reg-report`, producing `program.regcontracts.txt`. This is mainly for debugging, CI evidence or large audit sessions. It is not required for normal development and should not be checked into source control.

```sh
azm --rc audit --reg-report program.asm
```

---

## Conservative autofix

`--fix` applies conservative source repairs for clear register contract conflicts:

```sh
azm --fix --rc warn program.asm
```

AZM identifies call sites where a live register is clearly destroyed by the callee and inserts `push`/`pop` pairs where the save/restore is unambiguous. It also updates the `;!` contract blocks to reflect the repair.

After `--fix` runs, inspect the diff. Every inserted `push`/`pop` is a behaviour change in memory and register state. If a repair looks wrong, add a callee contract instead of keeping the inserted save.

---

## Analysis scope and limits

Register contract analysis tracks:

- Register and flag values through straight-line code and simple loops
- Push/pop preservation pairs on all return paths

Handle these cases with external contracts, manual annotations or separate review:

- RAM aliasing (what another call might overwrite in your storage)
- Indirect call targets (call through register)
- Interrupt handler effects
- Self-modifying code

---

## Common diagnostic messages

**Register contract conflict:**

```
warning AZMN_REGISTER_CARE: B is live across CALL DRAW_FRAME at program.asm:47:9,
  but DRAW_FRAME may modify B (inferred clobbers: A,B,DE)
```

Register `B` holds a pre-call value that is read after the call returns, but `DRAW_FRAME`'s inferred contract says it may modify `B`. Options: save around the call, restructure so `B` is not live across the call, or fix the contract if `DRAW_FRAME` actually preserves `B`.

**Inferred clobbers mismatch:**

```
warning AZMN_REGISTER_CARE: DE is live across CALL NORMALISE_COORD, but NORMALISE_COORD
  may modify D,E (inferred: in DE, out DE — use --accept-out to promote)
```

This fires when a routine reads and writes the same register and the analyzer needs to know whether the caller wants the pre-call value preserved or the post-call value returned. If the intent is a transform, run `--accept-out` or add the contract manually.

---

[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Op Declarations and Aliases →](07-ops-aliases.md)
