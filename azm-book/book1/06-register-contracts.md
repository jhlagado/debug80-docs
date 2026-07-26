---
layout: default
title: "Register Contracts"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 6
---
[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Ops, Aliases and Source Composition →](07-ops-aliases.md)

# Chapter 6 — Register Contracts

`B` holds your loop counter. The loop calls a subroutine. `djnz` decrements `B` and branches back. But `B` now holds whatever the subroutine left there, not the value it had before the call. The loop runs the wrong number of iterations. The binary assembles without error.

The caller and callee have collided over register `B`. AZM's register contracts find such collisions at assemble time by making register use between routines explicit and machine-checkable. They are deliberately stricter than casual assembly style: routine boundaries, register effects and external calls must be stated in a form the assembler can prove.

The `.routine` directive makes each analysis boundary explicit and records the routine's inputs, outputs, clobbers and preserved carriers.

---

## A concrete collision

`B` is the iteration counter; `HL` points to the current tile in memory:

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

`RenderTile` draws one tile. Inside, it uses `B` as a row counter:

```asm
RenderTile:
        ld      b,8
_row:
        ; ... draw one row of tile A ...
        djnz    _row
        ret
```

After `RenderTile` returns, `B` is 0. The outer `djnz` wraps it to 255 and branches, but the next call resets `B` to 8 and again returns with it at 0. The outer loop therefore never terminates.

The failure occurs at the interface: `ScanTiles` relies on `B` surviving the call, while `RenderTile` overwrites it.

---

## Terms

**caller**: the code that executes `call NAME`. In the example above, `ScanTiles` is the caller of `RenderTile`.

**callee**: the subroutine named by that call. `RenderTile` is the callee.

**clobber**: to overwrite a register value the caller still needed. `RenderTile` clobbers `B` because `ScanTiles` reads `B` after the call returns.

**preserves**: a register exits with the same value it had on entry. Pushing on entry and popping on exit is one way to preserve a register; not writing the register at all is another.

**live**: a register is live at a point in the code if its value will be read before the next write to it. `B` is live at the `call RenderTile` because `djnz` reads `B` after the call returns.

---

## The contract that exposes the clobber

A contract above `RenderTile` makes the clobber explicit:

```asm
.routine clobbers B
RenderTile:
```

With this contract in place and register contracts enabled, AZM inspects every call to `RenderTile`. At the call in `ScanTiles`, `B` holds the loop counter, a value the caller reads after the call returns. AZM reports the conflict:

```
scan.asm:7:9: warning: [AZMN_REGISTER_CONTRACTS] CALL RenderTile may modify B, but the pre-call value is used later.
```

---

## Repair options

Three ways to fix this collision:

**Option 1: save and restore in the caller**

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

**Option 2: have the callee preserve B**

```asm
.routine preserves B
RenderTile:
        push    bc
        ld      b,8
_row:
        ; ... draw one row of tile A ...
        djnz    _row
        pop     bc
        ret
```

**Option 3: restructure so the values do not collide**

Move `B` to a RAM location or use a different register in one of the routines.

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

Another routine may also declare `_bitLoop`; AZM gives each declaration a distinct owner-qualified identity in debug metadata.

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

Register contract analysis is controlled by `--rc`:

```sh
azm --rc off program.asm        # no register contract analysis
azm --rc audit program.asm      # analyze contracts without failing the build
azm --rc warn program.asm       # print warnings but still build
azm --rc error program.asm      # fail on proven conflicts
azm --rc strict program.asm     # fail on anything AZM cannot prove safe
```

The default mode is `off`.

Use the modes as a ladder:

| Mode | Use it when |
|------|-------------|
| `off` | You want ordinary assembly only |
| `audit` | You want AZM to analyze contracts without failing the build; useful while editing |
| `warn` | You want warnings printed while the build still succeeds |
| `error` | You want proven register contract conflicts to fail the build |
| `strict` | You want anything AZM cannot prove safe to fail the build, including unknown routine boundaries and stack effects |

For a Debug80 edit-and-restart loop, use `audit` or `warn` while exploring a messy port. Use `strict` for deliberate rebuilds once the routine boundaries and external interfaces are in place.

Debug80's own **Register Contracts** dropdown offers three of these five: Off, Audit, and Enforce, which is `error`. Reaching `warn` or `strict` from Debug80 means setting `registerContracts` in `debug80.json`. Note that the dropdown overrides that value for any build started from the panel.

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

## Inferred register effects

Given a routine body, AZM infers:

- **Inputs** (`in`): registers and flags whose incoming value is read before any write
- **May-writes**: registers and flags that the body may change
- **Output candidates** (`maybe-out`): written values that a caller later consumes and that require review

An output candidate becomes a semantic output only when a `.routine out` clause, `.expectout` or `--accept-out` confirms it. The inference follows the routine's control-flow graph. It handles push/pop pairs, branch paths, cross-routine tail calls and nonreturning cycles. ROM services and separately assembled code need explicit `.asmi` or profile contracts.

When a `.routine` directive declares contract clauses, AZM also checks that declaration against the routine body. A register omitted from the contract is treated as preserved for callers. If the body may write that register, AZM reports `declaration_contract_mismatch`:

```asm
.routine out A
Worker:
        ld      a,1
        ld      b,2          ; B was not declared as out or clobbered
        ret
```

Fix the contract or the body:

```asm
.routine out A clobbers B
Worker:
        ld      a,1
        ld      b,2
        ret
```

Bare `.routine` has no explicit assertions. AZM infers the body summary and can update the directive when you run `--contracts`.

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

AZM can check that discipline when the save and restore happen inside the same routine region:

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

If two routines share a larger cleanup sequence, declare that sequence as a callable `.routine` with its own contract.

---

## Source contract syntax

`.routine` is the source directive for a machine-readable register contract.

A source contract contains zero or more clauses on the same directive line. Register lists inside a clause are comma-separated:

```asm
; Tests candidate piece placement against walls, floor and board rows.
; D contains candidate x coordinate, E contains candidate y coordinate.
; Carry returned set when placement is blocked.
.routine in DE out carry clobbers A
CheckCollisionAtDe:
```

Blank lines and ordinary comments may appear between the directive and label:

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

Six contract keys are recognized:

| Key | Meaning |
|-----|---------|
| `noreturn` | Declares that control does not return to the caller |
| `in` | Registers/flags whose incoming value the routine reads |
| `out` | Registers/flags that carry meaningful returned values |
| `maybe-out` | Inferred output candidates that need review before promotion |
| `clobbers` | Registers/flags the routine destroys (no restore) |
| `preserves` | Registers/flags the routine restores to their entry value |

Read those keys from the caller's point of view:

- `noreturn` means there is no continuation after the call or tail transfer
- `in` means the caller must provide this carrier before the call
- `out` means the caller may intentionally consume this carrier after the call
- `maybe-out` means AZM saw a written value that might be an output, but you still need to review it
- `clobbers` means the caller must not expect the incoming value to survive
- `preserves` means the incoming value survives the call

### Carrier lists

```asm
.routine in A,DE,HL out carry clobbers BC
```

Register pair names expand to their constituent 8-bit registers for analysis: `BC` to `B,C`, `DE` to `D,E` and so on. See [Appendix A](appendix-a-directives.md) for the full carrier-notation table. Flags are named individually:

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

A routine that transforms a register in place (reads it as input, returns it modified) lists it in both `in` and `out`:

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

`.expectout DE` tells the analyzer that the next emitted instruction intentionally consumes DE as a callee-produced output. The instruction must be in the same physical source file.

---

## Generating contracts from inference

Once routine labels are in place, AZM can infer contracts and write them back into source:

```sh
azm --contracts --rc audit program.asm
```

AZM infers a contract for each declared routine and inserts or updates its `.routine` directive. Human prose comments above the directive remain in place.

AZM inferred those contracts from the instruction stream, so treat them as a starting point and check that they match the routine's intended interface.

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

```sh
azm --interface mon3.asmi --rc strict program.asm
```

Strict mode treats missing routine bodies and missing external contracts as build failures. If the assembler cannot see a direct-call target, load an `.asmi` file for it or add the missing source to the translation unit.

```sh
azm --reg-profile mon3 program.asm
```

The `mon3` profile provides built-in summaries for MON-3 RST services, including selector-based API calls through `RST $10`.

`.asmi` files can also describe `RST` services selected through register C:

```text
service rst $10 C $53 MON_BANK_CALL
in C
clobbers B,C,D,E,H,L
end
```

For a project-owned service range, use `>=`:

```text
service rst $10 C >= $60 TECMATE_EXPANSION_SERVICE
in C
out A,carry
clobbers B,C,D,E,H,L,zero,sign,parity,halfCarry
end
```

The exact-service form applies when AZM can prove the selector value in `C`. The range form applies when the proven selector is at or above the configured lower bound.

---

## A practical workflow

Use register contracts as part of editing:

1. Write or edit the routine.
2. Run `azm --rc audit program.asm` while the code is still moving.
3. Add or regenerate `.routine` contracts with `azm --contracts --rc audit program.asm`.
4. Run `azm --rc error program.asm` to fail on proven conflicts.
5. Run `azm --rc strict program.asm` once routine boundaries and external interfaces are in place.
6. Fix routine structure, contracts or interfaces until strict mode passes.

If strict mode produces many findings in one area, inspect the routine boundaries first. Shared exits, cross-boundary jumps and unrecorded monitor calls often need explicit boundaries or external contracts.

---

## Text reports

AZM can also write a report with `--reg-report`, producing `program.regcontracts.txt` by default. This is a generated artifact, so projects normally add it to their ignore rules unless they intentionally retain a baseline.

```sh
azm --rc audit --reg-report program.asm
```

Use JSON when a tool or CI job needs structured findings:

```sh
azm --rc audit --reg-report --reg-report-format json program.asm
```

JSON reports can become baselines. A ratchet build compares the current findings with a previous JSON report and fails if new or changed findings appear:

```sh
azm --rc audit --reg-report --reg-report-format json program.asm
azm --rc audit --reg-baseline baseline.regcontracts.json --reg-ratchet program.asm
```

---

## Conservative autofix

`--fix` applies conservative source repairs for clear register contract conflicts:

```sh
azm --fix --rc warn program.asm
```

AZM identifies call sites where the callee clearly returns a register the caller goes on to use, and inserts an `.expectout` directive above the call to record it. It also rewrites the `.routine` directives from what it inferred, promoting a `maybe-out` to an `out` where the evidence is unambiguous.

`--fix` does not insert `push`/`pop` pairs or change a single instruction, so the assembled output is unchanged.

After `--fix` runs, inspect the diff anyway. An inferred contract records what the code does today, which may differ from the intended interface. Where they differ, write the intended contract; the next build will report any mismatch between that declaration and the routine body.

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
program.asm:47:9: warning: [AZMN_REGISTER_CONTRACTS] CALL DRAW_FRAME may modify B, but the pre-call value is used later.
```

Options: save around the call, restructure so `B` is not live across the call, or fix the contract if `DRAW_FRAME` actually preserves `B`.

**Unconfirmed output:**

```
program.asm:58:9: warning: [AZMN_REGISTER_CONTRACTS] CALL NORMALISE_COORD writes D,E and caller reads it later, but the callee does not declare D,E as output.
```

This fires when a routine reads and writes the same register but AZM cannot prove whether the pre-call value must survive or the post-call value is an intentional result. For a transform, run `--accept-out` or add the contract manually.

---

[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Ops, Aliases and Source Composition →](07-ops-aliases.md)
