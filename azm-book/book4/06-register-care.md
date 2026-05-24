---
layout: default
title: "Chapter 6 — Register Care and Contracts"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 6
---
[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Op Declarations and Aliases →](07-ops-aliases.md)

# Chapter 6 — Register Care and Contracts

AZM can infer what each subroutine does to registers and flags, check those inferences against call sites, and report conflicts. This chapter covers the `@` entry-label system that marks routine boundaries, the AZMDoc `;!` contract syntax that records what a routine reads and returns, and the full workflow from first audit to enforced CI checking.

---

## The problem register-care addresses

Every `call` in Z80 assembly is a contract: the calling code hands certain register values to the callee and expects certain values back. The callee may destroy registers the caller still needs. In practice this produces subtle bugs — a loop counter, a pointer, or a carry flag survives across a call only because you remembered to save it, or wrote a callee that happens not to clobber it, or got lucky.

AZM's register-care system makes those contracts explicit and checkable at assemble time. It infers what each routine does to registers and flags, checks that against what callers need, and reports conflicts. Register care is AZM's form of liveness analysis — the technique compilers use to track which values in registers are still needed at each program point. In a compiler, that analysis is invisible and automatic; in AZM, it surfaces as a check: the analyzer warns you when a call site leaves a live value in a register that the called routine will clobber.

## Routine boundaries: `@` entry labels

AZM's register-care analysis, contract generation, and autofix all work from routine boundaries. The `@` prefix is how you define those boundaries:

```asm
@CHECK_COLLISION:
        push    bc
        ; ... body ...
        pop     bc
        ret
```

The callable symbol is `CHECK_COLLISION` — callers write `call CHECK_COLLISION`. The `@` is AZM's marker; it does not appear in the emitted binary.

When a file contains `@NAME:` labels, AZM uses them as the authoritative routine boundaries:
- `@Name:` starts a new routine named `Name`
- Plain branch labels inside the body are not new routines
- The next `@OtherName:` ends the current routine and starts a new one
- Consecutive `@` labels before the first instruction are aliases for the same routine entry

Only `@`-labeled routines get precise analysis. Running `--contracts` writes `;!` contract blocks above each `@`-labeled routine; running `--fix` repairs call sites relative to those same boundaries. A plain `NAME:` still assembles and runs correctly — it stays outside the contract-generation and repair workflow.

Without any `@` labels, AZM falls back to a heuristic: a plain label after at least one instruction begins a new routine boundary. This can misfire — particularly when a push/pop routine has a branch label inside the body that splits the analysis span before the matching pop.

## Plain labels inside `@` routines

When a file has `@` labels, plain branch labels inside an `@` routine body are ordinary branch targets — they do not start new routines. AZM has no local-label namespace: plain labels are global symbols, unique across the entire translation unit.

```asm
@SCAN_ROW:
        ld      b,8
ScanRowBitLoop:
        rl      (hl)
        inc     hl
        djnz    ScanRowBitLoop
        ret
```

`ScanRowBitLoop` is a plain branch label inside `SCAN_ROW`. Register-care sees the whole body as one span. If `SCAN_ROW` pushed a register, the pop anywhere after `ScanRowBitLoop` would be found and the register counted as preserved. The next `@` label starts the next analyzed routine.

## What register-care infers

Given a routine body, AZM infers:
- **Inputs** (`in`): registers and flags whose incoming value is read before any write
- **Outputs** (`out`): registers and flags that carry meaningful return values on all exit paths
- **Clobbers** (`clobbers`): registers written and not restored to the incoming value

The inference follows the instruction stream through the control-flow graph of the routine body. At each `ret`, AZM compares the current register state (what tokens are in each register) against the entry state. A register that carries the entry token on all return paths is preserved. One that carries a different token is clobbered or an output.

## Caller-side conflict checking

At each `call` site, AZM intersects:
- The set of registers and flags that are live after the call (used by the caller before being overwritten)
- The callee's may-modify set (clobbers plus outputs that change the value)

If the intersection is non-empty, the call site is suspicious: a pre-call value the caller still needs may be destroyed by the call. AZM reports a diagnostic.

```asm
        ld      de,BOARD_ROWS
        ld      b,ROW_COUNT
CheckLoop:
        ld      a,(de)
        call    CHECK_SOMETHING    ; if CHECK_SOMETHING clobbers DE or B: warning
        inc     de
        djnz    CheckLoop
```

The fix is one of:
- `push de / pop de` around the call
- Reorder the code so the value is not live across the call
- Add a callee contract showing the value survives

## Enabling register-care

Register-care analysis is controlled by `--rc`:

```sh
azm --rc audit program.asm      # infer, no diagnostics
azm --rc warn program.asm       # warn on conflicts
azm --rc error program.asm      # fail on conflicts
azm --rc strict program.asm     # fail on any unresolved contract
```

Default is `off` — no analysis.

## External contracts

For routines whose source is not assembled with yours (ROM monitor calls, library binaries), write contracts in an `.asmi` file:

```asm
extern MON_PUTC
in A
clobbers A
end

extern MON_GETC
out A
out zero
clobbers A
end
```

Load with `--interface mon3.asmi`. The analyzer uses these contracts at call sites to `MON_PUTC` and `MON_GETC`.

## The MON3 register-care profile

```sh
azm --reg-profile mon3 program.asm
```

The `mon3` profile provides built-in register-care summaries for MON3 RST service calls. Without it, calls to ROM RST addresses appear as unknown targets and the analyzer assumes they modify all registers.

## What contracts can and cannot prove

Register-care analysis is an assembler-level data-flow pass. It proves:
- Register and flag values through straight-line code and simple loops
- Push/pop preservation pairs on all return paths (with stack value tracking)
- Known-symbol save/restore through named RAM cells

It does not prove:
- RAM aliasing (what another call might overwrite in your storage)
- Indirect call targets (call through register)
- Interrupt handler effects
- Self-modifying code

For these, external contracts or manual annotations are the mechanism.

## Generating contracts from inference

Once you have `@` labels in place, AZM can infer contracts and write them back into source.

**Writing inferred contracts into source:**

```sh
azm --contracts --rc audit program.asm
```

AZM infers register contracts for each `@` routine and inserts `;!` blocks directly above the entry labels. On subsequent runs, it replaces the generated block. Human prose comments above the `;!` block are preserved untouched — only the contiguous block of `;!` lines is tool-owned.

Review generated contracts after the first run. Generated contracts are inferred — verify them before relying on them in production source. Inference works well for routines that push/pop symmetrically and have clear data-flow, but can misclassify intentional in/out transformations (a register read as input and returned modified) as clobbers. When AZM infers a clobber but the value is intentionally returned, use `--accept-out` to promote it:

```sh
azm --accept-out NORMALISE_COORD:DE --rc audit program.asm
```

This tells the analyzer that `DE` is an intentional output of `NORMALISE_COORD`, not a clobber, and annotates the source.

**Writing `.asmi` interface files:**

```sh
azm --rc audit --reg-interface program.asm
```

Writes `program.asmi` with `extern` contract records for every `@` routine. Other projects that link against your code can load this file with `--interface` to get analysis-quality call-site checking without your source.

## Conservative autofix

`--fix` applies conservative source repairs for clear register-care conflicts:

```sh
azm --fix --rc warn program.asm
```

AZM identifies call sites where a live register is clearly destroyed by the callee and may apply conservative source annotations — including expects-out hints where the analysis has sufficient certainty, or `push`/`pop` pairs where the save/restore is unambiguous. It also updates the `;!` contract blocks to reflect the repair.

AZM will not silently rewrite code it cannot prove safe. The rule: `--fix` adds register saves where the before/after liveness is unambiguous. Where the conflict involves an intentional in/out transformation or the inference is uncertain, no autofix is applied — those require manual review.

After `--fix` runs:
1. Inspect the diff. Every inserted `push`/`pop` is a behavior change in memory and register state.
2. Run the binary comparison workflow (Chapter 8) against a known-good build to verify no unintended change.
3. If a repair looks wrong, add a callee contract instead of keeping the inserted save.

`--fix` is useful for an initial sweep on legacy source. It is not a substitute for designed register management.

---

## AZMDoc syntax

AZMDoc is the comment format for machine-readable register contracts. Human prose stays in ordinary `;` comments. Contracts use a separate `;!` prefix so the register-care analyzer never has to mine prose for meaning.

AZMDoc metadata does not change the bytes AZM emits. Assemblers that do not understand AZMDoc see `;!` lines as ordinary comments.

### Source contract syntax

A source contract is a block of contiguous `;!` lines immediately before a routine entry label:

```asm
; Tests candidate piece placement against walls, floor, and board rows.
; D contains candidate x coordinate, E contains candidate y coordinate.
; Carry returned set when placement is blocked.
;!      in        DE
;!      out       carry
;!      clobbers  A
@CHECK_COLLISION_AT_DE:
```

The `;!` lines must be directly above the entry label with no intervening blank lines or other statements. Human prose comments can precede the `;!` block.

`;!` blocks have two origins. You write them by hand to pin a routine's contract explicitly — documenting what you know, not what the analyzer infers. AZM also generates them when you run `--contracts` or `--fix`, writing or overwriting the `;!` block above each analyzed routine. Treat tool-generated blocks as build artifacts: do not hand-edit them, because the next `--contracts` or `--fix` run will overwrite your changes. If you want to override an inferred contract, write the hand-authored block yourself and skip `--fix` on that routine.

### Contract keys

Four keys are recognized:

| Key | Meaning |
|-----|---------|
| `in` | Registers/flags whose incoming value the routine reads |
| `out` | Registers/flags that carry meaningful returned values |
| `clobbers` | Registers/flags the routine destroys (no restore) |
| `preserves` | Registers/flags the routine restores to their entry value |

`preserves` is typically omitted in generated contracts — unlisted carriers are assumed not part of the visible damage. Omitting `preserves` does not mean "clobbers everything"; it means the contract does not make an explicit promise about those registers.

### Carrier lists

Carriers appear in a comma-separated list after the key:

```asm
;!      in        A,DE,HL
;!      out       carry
;!      clobbers  BC
```

Register pairs expand to their constituent 8-bit registers for analysis:

| Pair notation | Expands to |
|--------------|------------|
| `BC` | `B,C` |
| `DE` | `D,E` |
| `HL` | `H,L` |
| `IX` | `IXH,IXL` |
| `IY` | `IYH,IYL` |
| `SP` | `SPH,SPL` |

Flags are named individually:

```asm
;!      out       carry,zero
;!      clobbers  A,carry
```

Use `carry` for the carry flag (not `C`, which is register C). Individual flag names: `carry`, `zero`, `sign`, `parity`, `halfCarry`.

Avoid `F` and `AF` in generated contracts. When a flag is meaningful, name it.

### Inputs and outputs on the same carrier

A routine that transforms a register in place — reads it as input, returns it modified — lists it in both `in` and `out`:

```asm
; Normalises the coordinate pair in DE.
;!      in        DE
;!      out       DE
;!      clobbers  A
@NORMALISE_DE:
```

The analyzer understands this as an intentional transformation: the call produces a new value in DE, not a clobber of the caller's DE.

### Caller-site hints

For one-off call sites where the callee's contract is ambiguous or not yet written, place a narrow hint immediately before the call:

```asm
        ; expects out DE
        call    NORMALISE_DE
        ld      a,(de)
```

`expects out DE` tells the analyzer that this call site intentionally consumes DE as a callee-produced output, suppressing the "pre-call DE may be destroyed" diagnostic for this one call. Hints are not the preferred mechanism — a callee contract is better — but they are useful when annotating legacy source incrementally.

### External interface files (`.asmi`)

Contracts for routines whose source is not assembled with yours belong in `.asmi` files. `.asmi` is metadata only — not assembly source, not valid as an entry file:

```asm
extern MON_PRINT_CHAR
in A
clobbers A
end

extern MON_GET_KEY
out A
out zero
clobbers carry
end
```

`.asmi` syntax has no comment leaders. Every non-blank line must be part of an `extern` contract record. Load with `--interface`:

```sh
azm --interface mon3.asmi --rc error program.asm
```

### Generating contracts with `--contracts`

```sh
azm --contracts --rc audit program.asm
```

AZM infers contracts for all `@` routines and writes `;!` blocks into the source file in place. Tool-owned blocks (the contiguous `;!` lines) are replaced on each run. Human prose above the `;!` block is preserved.

Generated blocks are omitted for routines where all carriers are empty — no inputs, no outputs, no clobbers.

### Generating `.asmi` with `--reg-interface`

```sh
azm --reg-interface program.asm
```

Writes `program.asmi` with inferred extern records for every `@` routine. Other projects that call into your program can load this file without having your source.

### AZMDoc and register-care analysis workflow

A productive escalation path for a new project:

**1. Start with audit mode — no build impact:**

```sh
azm --rc audit --reg-report program.asm
```

This infers contracts and writes `program.regcare.txt` without producing diagnostics or failing the build. Read the report to understand what AZM found before committing to anything.

**2. Generate `;!` blocks into source:**

```sh
azm --contracts --rc audit program.asm
```

AZM writes inferred contracts above every `@` entry. Review them. Correct cases where inference misclassified an intentional in/out transformation as a clobber. Delete generated blocks where the routine is private and the contract is obvious.

**3. Escalate to warn:**

```sh
azm --rc warn program.asm
```

Now AZM reports conflicts but does not fail the build. Review each warning. Decide whether the conflict is:
- A real bug: save the register, restructure the code, or add a callee contract
- A false positive from missing contract: add an AZMDoc block or use `--accept-out`
- A legitimate caller hint: add `; expects out REGISTER` before the call

**4. Escalate to error in CI:**

```sh
azm --rc error program.asm
```

At this level, any unresolved conflict fails the build. Use this mode once the codebase is clean. Commit `--rc error` to your CI pipeline and keep it there.

### Common diagnostic messages

**Register-care conflict:**

```
warning AZMN_REGISTER_CARE: B is live across CALL DRAW_FRAME at program.asm:47:9,
  but DRAW_FRAME may modify B (inferred clobbers: A,B,DE)
```

Reading this: register `B` holds a pre-call value that is read after the call returns, but `DRAW_FRAME`'s inferred contract says it may modify `B`. Three options:

1. **Save around the call:** `push bc` / `call DRAW_FRAME` / `pop bc`
2. **Restructure:** move the call so `B` is no longer live across it
3. **Fix the contract:** if `DRAW_FRAME` actually preserves `B`, add `preserves B` to its `;!` block

**Inferred clobbers mismatch:**

```
warning AZMN_REGISTER_CARE: DE is live across CALL NORMALISE_COORD, but NORMALISE_COORD
  may modify D,E (inferred: in DE, out DE — use --accept-out to promote)
```

This fires when a routine reads and writes the same register and the analyzer cannot tell whether the caller wanted the pre-call value preserved or the post-call value returned. If the intent is a transform (take DE, return normalized DE), run:

```sh
azm --accept-out NORMALISE_COORD:DE --rc audit program.asm
```

Or add the contract manually:

```asm
;!      in        DE
;!      out       DE
;!      clobbers  A
@NORMALISE_COORD:
```

**Unknown call target:**

When AZM cannot find a contract for a called symbol (no `@` label, no `.asmi` entry), it assumes the callee may modify all registers and flags. This produces many conflicts. Fix by adding an `.asmi` file for external routines or `@` labels for project routines.

---

[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Op Declarations and Aliases →](07-ops-aliases.md)
