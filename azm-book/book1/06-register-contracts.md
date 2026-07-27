---
layout: default
title: "Register Contracts"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 6
---

# Register Contracts

`B` holds your loop counter. The loop calls a subroutine. `djnz` decrements `B` and branches back. But `B` now holds whatever the subroutine left there. The loop runs the wrong number of iterations, and the binary assembles cleanly.

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

After `RenderTile` returns, `B` is 0. The outer `djnz` wraps it to 255 and branches, but the next call resets `B` to 8 and again returns with it at 0. The outer loop therefore runs forever.

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

**Option 3: restructure so each value has a register of its own**

The collision disappears if `B` moves to RAM or one of the routines uses a different register.

---

## Routine boundaries: `.routine`

Register contract analysis proves facts inside routine regions. A `.routine` directive before the entry label establishes the region:

```asm
.routine clobbers A,B
RenderTile:
        ; ... body ...
        ret
```

Callers write `call RenderTile`. The directive is pure declaration; the emitted bytes and the label's visibility come from the code alone.

- `.routine` applies to the next non-local label and starts its body
- The next `.routine` closes the current body and starts another
- Consecutive non-local labels before the first instruction are aliases for one routine
- A later non-local label closes the routine and begins ordinary code or data

Leading-underscore labels identify branches owned by the routine:

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

Owner-local branches must remain inside their routine. Direct `JP`, `JP cc`, `JR` and `JR cc` transfers to another declared routine are analyzed as tail calls. A `call` is appropriate when control returns to the caller; a tail jump applies when the callee returns directly to the original caller.

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

The default mode is `off`. `strict` goes beyond `error` by requiring AZM to prove every call safe, so unknown routine boundaries and stack effects become failures.

For a Debug80 edit-and-restart loop, `audit` or `warn` lets you explore a messy port while the build keeps running. `strict` is appropriate for deliberate rebuilds once the routine boundaries and external interfaces are in place.

Debug80's own **Register Contracts** dropdown offers three of these five: Off,
Audit and Enforce, which is `error`. Reaching `warn` or `strict` from Debug80
means setting `registerContracts` in `debug80.json`. The dropdown overrides
that value for any build started from the panel.

### Source policy directives

`.contracts` changes policy for the source file that contains it:

```asm
.contracts audit
```

Accepted modes are `strict`, `audit` and `off`. In a translation unit built from `.include` files, AZM applies the directive to routines and diagnostics owned by that included file, not only to the root entry file. Project configuration can also assign policies with file globs; the most specific matching rule wins. A glob beats the `.contracts` directive, which in turn beats `--rc`. `.contracts` may appear only once in each physical file, and a file carrying a mode other than `off` runs the analysis even when no `--rc` flag is given.

An `.rcignore` directive immediately before a finding suppresses it and records the reason:

```asm
.routine in HL
Dispatch:
        .rcignore unknown_control_flow "legacy dispatcher jumps through HL"
        jp      (hl)
```

The finding name must match the reported register-contract finding kind. Every suppression must carry reason text.

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

The mismatch can be resolved by declaring `B` as a clobber or by removing the write from the body. Here the contract records the clobber:

```asm
.routine out A clobbers B
Worker:
        ld      a,1
        ld      b,2
        ret
```

Bare `.routine` leaves every carrier to inference. AZM infers the body summary and can update the directive when you run `--contracts`.

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

![Contract analysis runs from the .routine boundary to the call site, and --rc decides what a finding costs](../../assets/images/azm-book/book1/contract-analysis.svg)

---

## Stack discipline

A routine that saves registers must restore them on every path that returns. AZM can check that when the save and the restore sit inside the same routine region:

```asm
.routine preserves BC
DrawRows:
        push    bc
        ; ... uses B and C temporarily ...
        pop     bc
        ret
```

A `push`/`pop` save-restore pair must remain inside the same `.routine` region. Each returning path must restore the stack before `ret`.

![A contract binds every returning path, not only the last one in the body](../../assets/images/azm-book/book1/return-paths.svg)

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

Moving the shared exit inside the same routine region gives the analyzer a complete stack path:

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
.routine in DE out carry clobbers A

; Carry is returned set when the placement is blocked.
CheckCollisionAtDe:
```

One routine has one `.routine` directive. Long source lines rely on the editor's
normal wrapping because a second `.routine` starts a second routine.

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
| `noreturn` | Declares that the routine transfers control away for good |
| `in` | Registers/flags whose incoming value the routine reads |
| `out` | Registers/flags that carry meaningful returned values |
| `maybe-out` | Inferred output candidates that need review before promotion |
| `clobbers` | Registers/flags the routine destroys (no restore) |
| `preserves` | Registers/flags the routine restores to their entry value |

The keys describe the boundary from the caller's point of view:

- `in` means the caller must provide this carrier before the call
- `out` means the caller may intentionally consume this carrier after the call

![The four directional keys, and what each says crosses the boundary. noreturn describes control flow and maybe-out a review state, so neither appears here](../../assets/images/azm-book/book2/contract-boundary.svg)

### Carrier lists

```asm
.routine in A,DE,HL out carry clobbers BC
```

Register pair names expand to their constituent 8-bit registers for analysis: `BC` to `B,C`, `DE` to `D,E` and so on. See [Appendix 1](../appendices/01-directives.md) for the full carrier-notation table. Flags are named individually:

```asm
.routine out carry,zero clobbers A
```

`carry` names the carry flag, whereas `C` names register C. The individual flag names are `carry`, `zero`, `sign`, `parity` and `halfCarry`. `F` may be used as shorthand for the flag set.

![Pair and flag-set carriers expand to the individual registers and flags the analyzer tracks](../../assets/images/azm-book/book1/carrier-expansion.svg)

Individual flag names state precisely which status a routine returns:

```asm
.routine in A,HL out carry clobbers BC
CheckTile:
```

Two flag conventions recur. Carry set reports success, cleared reports failure:

```asm
; TryRead: reads one byte into A. Carry set on success, clear when empty.
.routine in HL out A,carry clobbers BC,HL
TryRead:
        ; ...
        scf                     ; success
        ret
_empty:
        or      a               ; clears carry
        ret
```

Zero reports an emptiness or equality test. `or a` sets it from a byte already in `A` and leaves that byte as it stands:

```asm
; IsEmpty: zero set when the count byte is zero.
.routine out zero clobbers A
IsEmpty:
        ld      a,(Count)
        or      a
        ret
```

A contract records the carrier; the comment above the directive records what the flag means. Carriers are named as `carry`, so `out F.C` is rejected with `invalid .routine out carrier list`.

A register pair expresses a value that the routine treats as a unit:

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

Because AZM infers these contracts from the instruction stream, they are a starting point that must be checked against the routine's intended interface.

When AZM infers a written value that could be either a clobber or an output, it may write `maybe-out`:

```asm
.routine in A maybe-out A clobbers B
MaskA:
```

Every `maybe-out` requires a decision. When the value is intentionally returned, `--accept-out` promotes it:

```sh
azm --accept-out MaskA:A --rc audit program.asm
```

When the value is internal to the routine, it remains a clobber; alternatively, the routine can be rewritten to make the effect clear.

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

Strict mode treats missing routine bodies and missing external contracts as build failures. A direct-call target outside the translation unit needs either an `.asmi` file or its source brought in.

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

The `>=` form describes a project-owned service range:

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

Register contracts fit into an editing cycle:

1. A routine is written or edited.
2. While the code is still moving, `azm --rc audit program.asm` reports findings while the build continues.
3. `azm --contracts --rc audit program.asm` adds or regenerates `.routine` contracts.
4. `azm --rc error program.asm` makes proven conflicts fail the build.
5. Once routine boundaries and external interfaces are in place, `azm --rc strict program.asm` also requires AZM to prove the remainder safe.
6. Routine structure, contracts and interfaces are then corrected until strict mode passes.

When strict mode produces many findings in one area, the routine boundaries are the first place to investigate. Shared exits, cross-boundary jumps and unrecorded monitor calls often need explicit boundaries or external contracts.

---

## Text reports

AZM can also write a report with `--reg-report`, producing `program.regcontracts.txt` by default. This is a generated artifact, so projects normally add it to their ignore rules unless they intentionally retain a baseline.

```sh
azm --rc audit --reg-report program.asm
```

JSON supplies structured findings to tools and CI jobs:

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

`--fix` edits the contract directives alone, so the assembled output is identical.

After `--fix` runs, the diff still requires inspection. An inferred contract records what the code does today, which may differ from the intended interface. Where they differ, the intended contract should replace the inference; the next build will report any mismatch between that declaration and the routine body.

---

## Analysis scope and limits

Register contract analysis tracks:

- Register and flag values through straight-line code and simple loops
- Push/pop preservation pairs on all return paths

The following cases require external contracts, manual annotations or separate review:

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

Options: save around the call, restructure so the call falls outside `B`'s live range, or fix the contract if `DRAW_FRAME` actually preserves `B`.

![The shape behind the finding: a register held across a call that may destroy it, and read afterwards](../../assets/images/azm-book/book2/liveness-violation.svg)

**Unconfirmed output:**

With `--require-expectout`, an inferred output dependency that has not been confirmed becomes an error:

```
program.asm:58:9: error: [AZMN_REGISTER_CONTRACTS] CALL NORMALISE_COORD writes D,E and caller reads it later, but NORMALISE_COORD does not declare D,E as output; add `.expectout {D,E}` above the call to confirm the dependency and promote the callee output.
```

This fires when a routine reads and writes the same registers, leaving the analysis two readings: the pre-call values must survive, or the post-call values are intentional results. An `.expectout {D,E}` directive confirms this call site. If the routine is deliberately a transform at every call site, `--accept-out NORMALISE_COORD:D,E` or `.routine in DE out DE` records that interface.
