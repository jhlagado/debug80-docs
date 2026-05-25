---
layout: default
title: "Chapter 6 — Register Care and Contracts"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 6
---
[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Op Declarations and Aliases →](07-ops-aliases.md)

# Chapter 6 — Register Care and Contracts

Register bugs are among the hardest to find in Z80 assembly. A loop counter survives twenty call sites and then silently gets clobbered on the twenty-first. A carry flag is meaningful for three instructions and then destroyed by a call to a routine that clears it as a side effect. The program runs correctly on most inputs and breaks on one specific path.

AZM's register-care system addresses this by making the register contracts between routines explicit and machine-checkable. You mark routine boundaries with `@` labels, describe what each routine reads and returns in AZMDoc comment blocks and choose how strictly the assembler enforces those contracts. This chapter explains each part of that system and how to adopt it incrementally.

---

## The problem register-care addresses

Every `call` in Z80 assembly is a contract: the calling code hands certain register values to the callee and expects certain values back. The callee may destroy registers the caller still needs. In practice this produces subtle bugs — a loop counter, a pointer or a carry flag survives across a call because you saved it, because the callee preserved it or because the risky path has yet to run.

AZM's register-care system makes those contracts explicit and checkable at assemble time. It infers what each routine does to registers and flags, checks that against what callers need and reports conflicts. Register care is AZM's form of liveness analysis — the technique compilers use to track which values in registers are still needed at each program point. In a compiler, that analysis is invisible and automatic; in AZM, it surfaces as a check: the analyzer warns you when a call site leaves a live value in a register that the called routine will clobber.

Running register-care for the first time on an existing codebase is often revealing. Many warnings point to real risks: values that survive across calls because the tested paths preserve them today. Some will be bugs; others will be missing or incomplete contracts. Treat a working binary as one data point, then use register-care to check the paths systematically.

## Routine boundaries: `@` entry labels

AZM's register-care analysis, contract generation and autofix all work from routine boundaries. The `@` prefix is how you define those boundaries:

```asm
@CHECK_COLLISION:
        push    bc
        ; ... body ...
        pop     bc
        ret
```

The callable symbol is `CHECK_COLLISION` — callers write `call CHECK_COLLISION`. The `@` is AZM's source marker for analysis.

When a file contains `@NAME:` labels, AZM uses them as the authoritative routine boundaries:
- `@Name:` starts a new routine named `Name`
- Plain branch labels inside the body stay within that routine
- The next `@OtherName:` ends the current routine and starts a new one
- Consecutive `@` labels before the first instruction are aliases for the same routine entry

Running `--contracts` writes `;!` contract blocks above each `@`-labeled routine; running `--fix` repairs call sites relative to those same boundaries. A plain `NAME:` still assembles and runs correctly, while `@NAME:` participates in contract generation and repair.

With `@` labels in place, routine spans are explicit. The analyzer can follow a push at the start of a routine through branch labels in the body and match it with the corresponding pop before return.

Adding `@` labels to an existing source file is the first concrete step toward register-care checking. Add `@` before each named routine entry and let the assembler infer what each routine does. The `--rc audit` mode writes inference reports while leaving the build behavior unchanged.

## Plain labels inside `@` routines

When a file has `@` labels, plain branch labels inside an `@` routine body are ordinary branch targets within that routine. Plain labels are global symbols, unique across the entire translation unit.

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

Adding `@` labels throughout your source gives the analyzer clean boundaries everywhere. Branch labels then remain branch labels, and routine entries are marked explicitly.

## What does register-care infer?

Given a routine body, AZM infers:
- **Inputs** (`in`): registers and flags whose incoming value is read before any write
- **Outputs** (`out`): registers and flags that carry meaningful return values on all exit paths
- **Clobbers** (`clobbers`): registers written and not restored to the incoming value

The inference follows the instruction stream through the control-flow graph of the routine body. At each `ret`, AZM compares the current register state (what tokens are in each register) against the entry state. A register that carries the entry token on all return paths is preserved. One that carries a different token is clobbered or an output.

The inference is static — it follows the control-flow graph through the instruction stream. It handles push/pop pairs, straight-line code and branch paths within the routine body. Indirect effects, such as a callee's effect on RAM or runtime-computed results, need explicit contracts through `;!` blocks.

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
- Reorder the code so the value is overwritten before the call or used before it
- Add a callee contract showing the value survives

## Enabling register-care

Register-care analysis is controlled by `--rc`:

```sh
azm --rc audit program.asm      # infer, no diagnostics
azm --rc warn program.asm       # warn on conflicts
azm --rc error program.asm      # fail on conflicts
azm --rc strict program.asm     # fail on any unresolved contract
```

Default is `off`.

The four levels form a progression. Start with `audit` to see what the analyzer infers while preserving the build result. Move to `warn` when you want to see conflicts during development. Move to `error` once you have resolved the conflicts you care about. `strict` is for projects where every called routine has a contract — use it in CI pipelines after the project has been fully annotated.

## External contracts

When you call a ROM monitor routine or a library routine assembled separately, external contracts give the analyzer the routine's register behavior, precisely as you would write a `;!` block for your own routines.

For ROM monitor calls and library binaries, write contracts in an `.asmi` file:

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

The `mon3` profile provides built-in register-care summaries for MON3 RST service calls. Use the profile for accurate analysis on TEC-1 and MON3-based projects.

## Analysis scope and limits

Register-care analysis is an assembler-level data-flow pass. It tracks:
- Register and flag values through straight-line code and simple loops
- Push/pop preservation pairs on all return paths (with stack value tracking)
- Known-symbol save/restore through named RAM cells

Handle these cases with external contracts, manual annotations or separate review:
- RAM aliasing (what another call might overwrite in your storage)
- Indirect call targets (call through register)
- Interrupt handler effects
- Self-modifying code

Knowing the limits tells you how to read the analyzer's output: a clean register-care report covers the analyzable portions of your code. Interrupt handlers, indirect calls and RAM side effects still need explicit design review.

## Generating contracts from inference

Once you have `@` labels in place, AZM can infer contracts and write them back into source.

**Writing inferred contracts into source:**

```sh
azm --contracts --rc audit program.asm
```

AZM infers register contracts for each `@` routine and inserts `;!` blocks directly above the entry labels. On subsequent runs, it replaces the generated block. Human prose comments above the `;!` block are preserved untouched — only the contiguous block of `;!` lines is tool-owned.

Review generated contracts after the first run. Generated contracts are inferred; verify them before relying on them in production source. The generated block is a starting point for review.

Inference works well for routines that push/pop symmetrically and have clear data-flow, but can misclassify intentional in/out transformations (a register read as input and returned modified) as clobbers. When AZM infers a clobber but the value is intentionally returned, use `--accept-out` to promote it:

```sh
azm --accept-out NORMALISE_COORD:DE --rc audit program.asm
```

This tells the analyzer that `DE` is an intentional output of `NORMALISE_COORD` and annotates the source.

**Writing `.asmi` interface files:**

```sh
azm --rc audit --reg-interface program.asm
```

Writes `program.asmi` with `extern` contract records for every `@` routine. Other projects that link against your code can load this file with `--interface` to get analysis-quality call-site checking.

Publishing an `.asmi` file alongside a library binary is the Z80 equivalent of distributing a header file. The callers get the full register contract at every call site.

## Conservative autofix

`--fix` applies conservative source repairs for clear register-care conflicts:

```sh
azm --fix --rc warn program.asm
```

AZM identifies call sites where a live register is clearly destroyed by the callee and may apply conservative source annotations — including expects-out hints where the analysis has sufficient certainty, or `push`/`pop` pairs where the save/restore is unambiguous. It also updates the `;!` contract blocks to reflect the repair.

The rule: `--fix` adds register saves where the before/after liveness is unambiguous. Where the conflict involves an intentional in/out transformation or the inference is uncertain, the fix is skipped — manual review is needed.

After `--fix` runs:
1. Inspect the diff. Every inserted `push`/`pop` is a behavior change in memory and register state.
2. Run the binary comparison workflow (Chapter 8) against a known-good build to verify no unintended change.
3. If a repair looks wrong, add a callee contract instead of keeping the inserted save.

`--fix` is useful for an initial sweep on legacy source. Designed register management still comes from reading the contracts and choosing the register roles intentionally.

The distinction is worth keeping clear. `--fix` solves the mechanical problem: a register value that would survive across a call if you wrap the call in a push/pop. Designed register management solves the structural problem: callers pass values in registers the callee expects, the callee returns values in registers the caller reads and both agree on what happens to the rest. `--fix` gets you to the first level quickly. Getting to the second requires reading the contracts that `--contracts` generates and deciding whether they describe the intended design.

---

## AZMDoc syntax

The register-care analysis works from two sources: what it can infer from the instruction stream, and what you tell it explicitly. AZMDoc is the explicit layer. A `;!` block above a routine entry records the contract in a form both you and the analyzer can read — and keeps human prose comments separate from machine-readable annotations.

AZMDoc is the comment format for machine-readable register contracts. The `;!` prefix (introduced in Chapter 2's discussion of comments) keeps contracts separate from human prose. AZMDoc metadata is parse-only; the assembled bytes are unaffected.

### Source contract syntax

A source contract is a block of contiguous `;!` lines immediately before a routine entry label:

```asm
; Tests candidate piece placement against walls, floor and board rows.
; D contains candidate x coordinate, E contains candidate y coordinate.
; Carry returned set when placement is blocked.
;!      in        DE
;!      out       carry
;!      clobbers  A
@CHECK_COLLISION_AT_DE:
```

The `;!` lines must be directly above the entry label with no intervening blank lines or other statements. Human prose comments can precede the `;!` block.

`;!` blocks have two origins. You write them by hand to pin a routine's contract explicitly. AZM also generates them when you run `--contracts` or `--fix`, writing or overwriting the `;!` block above each analyzed routine. Treat tool-generated blocks as build artifacts: the next `--contracts` or `--fix` run will overwrite changes inside the generated block. For an intentional override, write the hand-authored block yourself and skip `--fix` on that routine.

### Contract keys

Four keys are recognized. Together they cover every possible register fate:

| Key | Meaning |
|-----|---------|
| `in` | Registers/flags whose incoming value the routine reads |
| `out` | Registers/flags that carry meaningful returned values |
| `clobbers` | Registers/flags the routine destroys (no restore) |
| `preserves` | Registers/flags the routine restores to their entry value |

`preserves` is typically omitted in generated contracts. The contract promises only the carriers it lists.

A register the routine reads before writing is an input (`in`). One that carries a meaningful value on exit is an output (`out`). One written during the routine and left changed is clobbered (`clobbers`). One pushed on entry and popped on exit is preserved (`preserves`). The contract lists the registers and flags that form the routine's visible interface.

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

Use `carry` for the carry flag; `C` names register C. Individual flag names: `carry`, `zero`, `sign`, `parity`, `halfCarry`.

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

The analyzer understands this as an intentional transformation: the call produces a new value in DE.

### Caller-site hints

For one-off call sites during annotation, place a narrow hint immediately before the call:

```asm
        ; expects out DE
        call    NORMALISE_DE
        ld      a,(de)
```

`expects out DE` tells the analyzer that this call site intentionally consumes DE as a callee-produced output, suppressing the "pre-call DE may be destroyed" diagnostic for this one call. Use a callee contract when the same relationship appears at multiple call sites.

Hints support incremental migration. When you enable register-care on a large existing project, you might have fifty call sites with conflicts. A callee contract fixes all of them at once; a hint fixes one. Hints let you mark known-correct cases while you work through the ones that need attention.

### External interface files (`.asmi`)

`.asmi` files are the same format described in "External contracts" above. Every non-blank line is part of an `extern` contract record. Load with `--interface mon3.asmi`.

### Generating contracts with `--contracts`

See "Generating contracts from inference" earlier in this chapter for the full `--contracts` workflow. Generated blocks are omitted for routines where all carriers are empty — no inputs, no outputs, no clobbers.

### Generating `.asmi` with `--reg-interface`

See "Generating contracts from inference" earlier in this chapter — the `--reg-interface` flag writes the same inferred contracts in `.asmi` format for use by other projects.

### AZMDoc and register-care analysis workflow

The workflow below is a practical escalation path. Most projects start with plain routines and add register documentation gradually. The steps move from inference through warning review to enforced CI checking. Each step can be taken independently.

A productive escalation path for a new project:

**1. Start with audit mode — no build impact:**

```sh
azm --rc audit --reg-report program.asm
```

This infers contracts and writes `program.regcare.txt` while preserving the build result. Read the report to understand what AZM found before committing to anything.

**2. Generate `;!` blocks into source** (see "Generating contracts from inference" above):

```sh
azm --contracts --rc audit program.asm
```

**3. Escalate to warn:**

```sh
azm --rc warn program.asm
```

Review each warning. Decide whether the conflict is:
- A real bug: save the register, restructure the code or add a callee contract
- A false positive from missing contract: add an AZMDoc block or use `--accept-out`
- A legitimate caller hint: add `; expects out REGISTER` before the call

**4. Escalate to error in CI:**

```sh
azm --rc error program.asm
```

Commit `--rc error` to your CI pipeline and keep it there.

At this point, every new call site that violates a contract becomes a build failure. New plain-label routines still assemble correctly while you annotate incrementally, routine by routine.

### Common diagnostic messages

**Register-care conflict:**

```
warning AZMN_REGISTER_CARE: B is live across CALL DRAW_FRAME at program.asm:47:9,
  but DRAW_FRAME may modify B (inferred clobbers: A,B,DE)
```

Reading this: register `B` holds a pre-call value that is read after the call returns, but `DRAW_FRAME`'s inferred contract says it may modify `B`. Three options:

1. **Save around the call:** `push bc` / `call DRAW_FRAME` / `pop bc`
2. **Restructure:** move the call before `B` is created or after its final use
3. **Fix the contract:** if `DRAW_FRAME` actually preserves `B`, add `preserves B` to its `;!` block

**Inferred clobbers mismatch:**

```
warning AZMN_REGISTER_CARE: DE is live across CALL NORMALISE_COORD, but NORMALISE_COORD
  may modify D,E (inferred: in DE, out DE — use --accept-out to promote)
```

This fires when a routine reads and writes the same register and the analyzer needs to know whether the caller wants the pre-call value preserved or the post-call value returned. If the intent is a transform (take DE, return normalized DE), run:

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

When a called symbol has a contract, AZM uses it at the call site. Add an `.asmi` file for external routines or `@` labels for project routines so the analyzer has contract data.

---

[← The Layout System](05-layout-system.md) | [Manual](index.md) | [Op Declarations and Aliases →](07-ops-aliases.md)
