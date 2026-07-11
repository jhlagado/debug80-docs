---
layout: default
title: "Chapter 6 — Register Contracts"
parent: "AZM Book 0 — Assembler Manual"
nav_order: 6
---
[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Ops, Aliases and Source Composition →](07-ops-aliases.md)

# Chapter 6 — Register Contracts

`B` holds your loop counter. The loop calls a subroutine. The subroutine finishes and returns. `djnz` decrements `B` and branches back — but `B` now holds whatever the subroutine left there, not the value it had before the call. The loop runs the wrong number of iterations. The binary assembles without error.

This is a register collision. The assembler has no way to know what value `B` should hold at any given instruction. The program may pass all your tests and break on an input you did not try.

AZM's register contracts find these collisions at assemble time by making the register use between routines explicit and machine-checkable. They are deliberately stricter than casual assembly style: they ask you to write routine boundaries, register effects and external calls in a form the assembler can prove.

The benefit is strongest in sizeable Z80 programs made of many small routines. Those programs carry a lot of implicit register state: loop counters, pointers, status flags, scratch pairs and monitor-call arguments. A call can look harmless while still destroying a value the caller will use a few instructions later. Register contracts move that assumption into source and let AZM stop the build at the call site.

The `.routine` directive makes each analysis boundary explicit and records the routine's inputs, outputs, clobbers and preserved carriers. The label on the following line remains an ordinary callable symbol. Add `@` only when an imported source unit must export that symbol.

The friction is real. Strict mode is unforgiving when a helper's true output contract has not been written yet, and code that jumps across routine-shaped regions is harder for AZM to prove. That pressure is part of the value: routines tend to become smaller, more local and easier to reason about before the program reaches Debug80 or hardware.

---

## A concrete collision

Here is a loop that processes eight tiles. `B` is the iteration counter; `HL` points to the current tile in memory:

```asm
ScanTiles:
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
RenderTile:
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

AZM uses `.routine` directives to record what each routine does to registers. A contract above `RenderTile` makes the clobber explicit:

```asm
.routine clobbers B
RenderTile:
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
ScanTiles:
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
.routine preserves B
RenderTile:
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

## Routine boundaries: `.routine`

Register contract analysis proves facts inside routine regions. Place `.routine` before the entry label:

```asm
.routine clobbers A,B
RenderTile:
        ; ... body ...
        ret
```

Callers write `call RenderTile`. The directive emits no bytes and does not change the label's visibility.

- `.routine` applies to the next non-local label and starts its body
- The next `.routine` closes the current body and starts another
- Consecutive non-local labels before the first instruction are aliases for one routine
- A later non-local label closes the routine and begins ordinary code or data

Use leading-underscore labels for branches owned by the routine:

```asm
.routine in HL clobbers B
ScanRow:
        ld      b,8
_bitLoop:
        rl      (hl)
        inc     hl
        djnz    _bitLoop
        ret
```

`_bitLoop` belongs to `ScanRow`. Another routine may also declare `_bitLoop`; AZM gives each declaration a distinct owner-qualified identity in debug metadata.

Export is independent from routine analysis:

```asm
.routine in A out A clobbers F
@NormaliseByte:
        and     $7f
        ret
```

`@NormaliseByte:` exports `NormaliseByte` from an imported source unit. The same routine could use a plain `NormaliseByte:` label when it is only needed inside its source unit.

Keep owner-local branches inside their routine. Direct `JP`, `JP cc`, `JR` and `JR cc` transfers to another declared routine are analyzed as tail calls. Use `call` when control returns to the caller and a tail jump when the callee returns directly to the original caller.

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

### Source policy directives

`.contracts` changes policy for the source file that contains it:

```asm
.contracts audit
```

Accepted modes are `strict`, `audit` and `off`. In a translation unit built from `.include` files, AZM applies the directive to routines and diagnostics owned by that included file, not only to the root entry file. Project configuration can also assign policies with file globs; the most specific matching rule wins.

Use `.rcignore` immediately before the finding it suppresses and include a reason:

```asm
.routine in HL
Dispatch:
        .rcignore unknown_control_flow "legacy dispatcher jumps through HL"
        jp      (hl)
```

The finding name must match the reported register-contract finding kind. A suppression without reason text is rejected.

---

## What AZM infers

Given a routine body, AZM infers:

- **Inputs** (`in`): registers and flags whose incoming value is read before any write
- **Outputs** (`out`): registers and flags that carry meaningful return values on all exit paths
- **Clobbers** (`clobbers`): registers written and not restored to the incoming value

The inference follows the routine's control-flow graph. It handles push/pop pairs, branch paths, cross-routine tail calls and nonreturning cycles. ROM services and separately assembled code need explicit `.asmi` or profile contracts.

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
.routine preserves BC
DrawRows:
        push    bc
        ; ... uses B and C temporarily ...
        pop     bc
        ret
```

Keep `push`/`pop` save-restore pairs inside the same `.routine` region. Each returning path must restore the stack before `ret`.

This shape is awkward for register contracts:

```asm
.routine preserves BC
CopyName:
        push    bc
        jr      z,_sharedFail
        pop     bc
        ret

.routine
LoadConfig:
        ; ...
_sharedFail:
        pop     bc
        ret
```

`CopyName` pushes `BC`, then branches to `_sharedFail`, which is owned by `LoadConfig`. AZM reports the cross-owner local reference before register-contract analysis.

Keep the shared exit inside the same routine region:

```asm
.routine preserves BC
CopyName:
        push    bc
        jr      z,_fail
        pop     bc
        ret
_fail:
        pop     bc
        ret

.routine
LoadConfig:
        ; separate routine region
        ret
```

If two routines share a larger cleanup sequence, declare that sequence as a callable `.routine` with its own contract. Routine boundaries then match the units whose register and stack effects AZM checks.

---

## Source contract syntax

`.routine` is the source directive for a machine-readable register contract. It occupies one source line and emits no bytes. Blank lines and ordinary comments may appear before its associated entry label.

A source contract contains zero or more clauses on the same directive line. Register lists inside a clause are comma-separated:

```asm
; Tests candidate piece placement against walls, floor and board rows.
; D contains candidate x coordinate, E contains candidate y coordinate.
; Carry returned set when placement is blocked.
.routine in DE out carry clobbers A
CheckCollisionAtDe:
```

The directive applies to the next non-local entry label. Blank lines and ordinary comments may appear between the directive and label:

```asm
; Tests candidate placement and returns carry set when blocked.
.routine in DE out carry clobbers A
CheckCollisionAtDe:
```

One routine has one `.routine` directive. Continue a long source line only with the editor's normal wrapping; a second `.routine` starts a second routine.

Malformed carrier lists are rejected:

```asm
; wrong
.routine in A HL
.routine in A,NOT_A_REGISTER

; right
.routine in A,HL out A clobbers F
```

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
.routine in A,DE,HL out carry clobbers BC
```

Register pair names expand to their constituent 8-bit registers for analysis — `BC` to `B,C`, `DE` to `D,E` and so on. See [Appendix A](appendix-a-directives.md) for the full carrier-notation table. Flags are named individually:

```asm
.routine out carry,zero clobbers A
```

Use `carry` for the carry flag; `C` names register C. Individual flag names: `carry`, `zero`, `sign`, `parity`, `halfCarry`. `F` may be used as shorthand for the flag set.

Prefer individual flag names when a routine returns status in flags:

```asm
.routine in A,HL out carry clobbers BC
CheckTile:
```

Prefer register pairs when the routine treats the pair as one value:

```asm
.routine in DE out HL clobbers A
FindRecord:
```

### Inputs and outputs on the same carrier

A routine that transforms a register in place — reads it as input, returns it modified — lists it in both `in` and `out`:

```asm
; Normalises the coordinate pair in DE.
.routine in DE out DE clobbers A
NormaliseDe:
```

### Caller-site hints

For one call site that intentionally consumes inferred outputs, place `.expectout` immediately before the call:

```asm
        .expectout DE
        call    NormaliseDe
        ld      a,(de)
```

`.expectout DE` tells the analyzer that the next emitted instruction intentionally consumes DE as a callee-produced output. The instruction must be in the same physical source file; place the directive immediately before the intended `call`.

---

## Generating contracts from inference

Once routine labels are in place, AZM can infer contracts and write them back into source:

```sh
azm --contracts --rc audit program.asm
```

AZM infers a contract for each declared routine and inserts or updates its `.routine` directive. Human prose comments above the directive remain in place.

After the first run, read the generated contract for each routine. AZM inferred those contracts from the instruction stream, so treat them as a starting point and check that they match the routine's intended interface.

When AZM infers a written value that could be either a clobber or an output, it may write `maybe-out`:

```asm
.routine in A maybe-out A clobbers B
MaskA:
```

Review every `maybe-out`. If the value is intentionally returned, promote it with `--accept-out`:

```sh
azm --accept-out MASKA:A --rc audit program.asm
```

If the value is not part of the routine interface, leave it as a clobber or rewrite the routine so the effect is clear.

You can hand-write or edit `.routine` directives directly. A later `--contracts` run updates the directive from current inference.

### Generating `.asmi` interface files

```sh
azm --rc audit --reg-interface program.asm
```

Writes `program.asmi` with `extern` contract records for declared routines. Other projects that call into your code can load this file with `--interface`.

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
3. Add or regenerate `.routine` contracts with `azm --contracts --rc audit program.asm`.
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

AZM identifies call sites where a live register is clearly destroyed by the callee and inserts `push`/`pop` pairs where the save/restore is unambiguous. It also updates the `.routine` directives to reflect the repair.

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

[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Ops, Aliases and Source Composition →](07-ops-aliases.md)
