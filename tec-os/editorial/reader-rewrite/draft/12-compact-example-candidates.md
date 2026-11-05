# Held compact EXISTS and RUN candidates

These are source-only formatting candidates for the retained examples in
`12-results-and-command-chains.md`. They are not reader insertions or new
execution evidence. The original chapter, its pass record, historical
listings, recipes and captures remain unchanged. Assembly, byte comparison,
on-machine editing and the complete public workflows below still need a
separately reviewed packet and explicit allocation.

## Governing style and exact originals

I read the complete compact style and its inherited comment contracts in
Origo's `bindings/z80-cpm/assembly-style-compact.md` and `assembly-style.md`.
The compact amendment at Origo
`5ef991ffca9d9774888d8d667cc3155ccb8fcf45` requires separated labels,
blank-separated standalone comment blocks and reflowed prose. Instructions
use two literal spaces, lowercase mnemonics/registers/conditions and one
space before operands. Existing labels/constants and literal contents retain
their case. Inline semicolons start at column 18 with at least two spaces
after code. Source lines target 40 columns. The inherited minimum is 40 percent
commented code lines, with no more than four consecutive uncommented code
lines and a 24,576-byte source-file ceiling.

The book snapshot read for this candidate is
`521c4fc684c21618a5f2777a55628f17069b7396`. Its retained Chapter 12 was last
changed by `05a85330c2f3b8a7c88c5d73b8a25ca4e5e83c9f` and has Git blob
`539d498a1ff8e492969ae4bb8369e8ea958b0e40` at
`tec-os/editorial/reader-rewrite/draft/12-results-and-command-chains.md`.
Coordinates below refer to that frozen text, not future moving HEAD lines.

| Original | Exact source coordinates | Containing passage |
| --- | --- | --- |
| EXISTS | Chapter 12 lines 145–158, fence 144–159 | Lines 139–176 introduce the default FCB, both result paths and historical ATOM/card recipe. Lines 178–229 retain the conditional and unconditional command cases. |
| RUN | Chapter 12 lines 292–305, fence 291–306 | Lines 273–357 explain function26/47, warm-flush cancellation, command-tail limits, replacement and returned rejection. |

Both listings were retained from the original
`tec-os/11-return-codes-and-chaining.md` at book base
`10821b68f80c10d2037bbd1c5ab207877c897c68`, blob
`9d2a4a3dd28e6c5360868bea6eed47ea3a1b6e8b`. There EXISTS is 49–62
(fence 48–63) and RUN is 160–173 (fence 159–174). These are inline book sources.
Neither `test/programs/exists.asm` nor `test/programs/run.asm` exists at
product 78127ec or ea3ef3d. No product-file identity is substituted for them.

Chapter 12 labels its existing output as historical model evidence at
TEC-OS 78127ec and its PC assembly as ATOM 0.3.7. That provenance stays with
those original sources and captures. I make no new claim about the original
binary hashes or an unlocated execution record. The current API reasoning
below uses only inspected source at
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`.

## EXISTS candidate

Suggested future source name: `EXISTS.ASM`, in its own file. The complete
source candidate is the following fence, excluding the Markdown delimiters.
The original header and all six original instruction comments retain their
wording in reflowed lines. Additional header lines state entry, clobber and
exit conditions. No symbol or instruction is added.

```asm
; EXISTS: a failure, return code FF00h,
; when the file named on the command
; line isn't there.
; Takes the CCP's FCB at 005Ch.
; A match keeps the entry return code.
; Missing file sets FF00h. No output.
; BDOS calls may change all registers.
; No register or flag result is defined.
; Returns through the inherited word.
; Default disk errors abort via BDOS.

BDOS equ $0005

  org $0100
  ld de,$005C    ; the FCB the CCP
                 ; filled from the tail
  ld c,15        ; BDOS function 15:
                 ; open the file
  call BDOS
  inc a          ; A = FFh: no such file
  ret nz         ; it is there:
                 ; the code stays 0
  ld de,$FF00    ; a failure
  ld c,108       ; BDOS function 108:
                 ; set the return code
  call BDOS
  ret
```

The comment beside `inc a` describes its input A, as in the original. The
branch uses the Z flag produced by that increment, not a flag returned by
the BDOS. The comment “the code stays 0” assumes ordinary CCP entry, where
the command's return code was cleared before launch. The header's “No output”
describes the program's own normal paths. A default BDOS disk error can
print its message and abort before either local return.

## RUN candidate

Suggested future source name: `RUN.ASM`, in a separate file. The original
header and all four original instruction comments retain their wording.
The added contract describes accepted nonreturn and returned rejection.
Two added inline notes explain the program origin and function 9.
NOTRUN keeps its original name and data, with its label on a separate line.

```asm
; RUN: end by running the rest of the
; command line as a command.
; Takes the CCP's tail at 0081h.
; Acceptance warm boots, no return.
; Rejection prints Not run and returns.
; BDOS calls may change all registers.
; No register or flag result is defined.
; A local ret uses the inherited word.

BDOS equ $0005

  org $0100      ; CP/M program entry
  ld de,$0081    ; the command tail,
                 ; ended by a 0
  ld c,26        ; BDOS function 26:
                 ; set the DMA address
  call BDOS
  ld c,47        ; BDOS function 47:
                 ; chain to the command
  call BDOS
  ld de,NOTRUN   ; back here only if
                 ; it was rejected
  ld c,9         ; print rejection text
  call BDOS
  ret

NOTRUN:
  db "Not run",13,10,"$"
```

There is no added entry label in either candidate because the originals
enter at ORG 0100h without one. Adding such a label would change their symbol
sets. BDOS remains a named constant. NOTRUN is the only address label and
has both its own line and a preceding blank. Standalone header blocks are
separated from declarations by a blank line. Inline continuations remain
attached to their instructions.

## Include closure and public route

Each candidate is self-contained: no include, macro, conditional assembly,
external symbol file or linked library is needed. The constant BDOS supplies
0005h locally. RUN's complete dollar-terminated message is in its own source.
The environment supplies the page-zero BDOS jump, 0100h program entry,
CCP-prepared FCB/tail and inherited warm-boot return word. Those are runtime
contracts, not missing source includes.

The retained chapter's historical public recipe assembles `exists.asm` and
`run.asm` with `npx atom`, copies a starter to chain.img and puts both COM
files on B. It is at frozen Chapter 12:170–176. It remains an original recipe,
not evidence that these candidate texts were assembled. A future comparison
must assemble each original listing and its complete candidate separately
with the named ATOM version, then retain actual bytes, hashes, extents and
symbol maps. Code size and byte identity are not established by this file.

The ordinary reader route to qualify is a separate copy of the supplied card,
with tools on A and working drive B. Use TED to enter the exact candidate as
B:EXISTS.ASM or B:RUN.ASM, save, quit and reopen the persisted source. Assemble
through the normal `A:TAS EXISTS` and `A:TAS RUN` commands. Compare those
actual on-card outputs with the separately assembled ATOM references before
running them from the CCP. A host injection or jump directly to 0100h alone
would not prove this editor/save/assembler/launch route.

The product ea3 test-input manifest records the existing application identities:

| Application | Thorium revision | SHA-256 |
| --- | --- | --- |
| TAS.COM | dbee66a90816df9a5884a08754ebc2d458a38325 | 45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2 |
| TED.COM | 128edb7cbb27de17a9d3a7a747706a5b227b30c4 | 2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f |

These are manifest identities, not newly read executable hashes or completed
workflow proof. The future packet must name the actual adopted ROM/card,
ATOM reference, TED/TAS inputs, display width, font and input route. A
40-column source layout does not qualify KS48's new font/default. The prior
LINE proof qualifies only its own exact source and serial workflow.

## Static equivalence reasoning

Each candidate keeps the original ordered instruction/directive operands.
Opcode, directive, register and condition spelling changes only case. BDOS
and NOTRUN keep their names. Numeric tokens remain `$0005`, `$0100`,
`$005C`, `$FF00`, `$0081`,15,108,26,47,9,13 and10 where used. The contents and
case of `"Not run"` and `"$"` remain exact. Comments and blank lines emit no
instructions. Moving NOTRUN onto its own line leaves its intended position
immediately before the same DB declaration. Assembler acceptance, symbol
identity and emitted equality still require actual assembly.

| Path | Static support at product ea3ef3d |
| --- | --- |
| Entry and ordinary return | src/cpm/ccp.asm:519–536 calls PREPPAGE, puts WBOOT on the resident stack and jumps to TPA. Neither candidate changes SP or adds a push/pop. Local calls return before either final ret consumes that inherited word. |
| EXISTS match | src/cpm/bdosfile.asm:246–248,396–407 and bdosfn.asm:673–704 return0–3 or FFh. Incrementing0–3 produces1–4, so ret nz takes the original success exit without setting the program code. |
| EXISTS absence | Incrementing FFh wraps to0 and sets Z. The same ret nz falls through, reloads DE with FF00h and C with108, then stores PRGCODE through bdos.asm:296–307. The final ret uses the same inherited word. |
| EXISTS drive/error effects | ccpcmd.asm:456–470 prepares the first FCB. Explicit/default selection and disk errors are still the BDOS's paths. The candidate does not add close, error-mode handling or output. A failed BDOS operation in default mode can abort instead of returning FFh as an ordinary absence. |
| Return-code entry | ccp.asm:224–284 tests a conditional piece before clearing PRGCODE for a command. Thus a normally launched EXISTS starts with0, preserves it for a match and supplies FF00h for an ordinary miss. |
| RUN's DMA contract | bdosfn.asm:43–50 stores the pointer from function26. RUN reloads C=47 after that call and does not depend on DE surviving it. Function47 reads CURDMA, not a new DE argument. |
| RUN acceptance | bdos.asm:67–108 scans for zero within128 bytes, rejects earlier CR/LF, copies128 bytes only after validation, sets CHPOS=1 and jumps through BIOWBT. The program's next ld de,NOTRUN is not on that accepted path. A failed warm flush can still cancel the accepted chain at cache.asm:661–668. |
| RUN rejection | bdos.asm:90–93 returns FFh without replacing the old chain. The candidate reloads DE=NOTRUN and C=9, prints the unchanged message through bdos.asm:419–433 and returns. It does not add a failure return code. |
| Normal tail and replaced pieces | ccpcmd.asm:456–497 appends zero to the current piece's tail. ccp.asm:249–284 terminates that piece at ! before launch. A valid ordinary CCP tail therefore passes function47's syntax check. Original later pieces are not copied into the replacement. An empty tail is accepted too. |
| BDOS clobbers | bdos.asm:137–141 switches to its private stack and228–252 restores caller SP with result replication. Each needed argument is reloaded exactly where the original reloads it. No candidate adds a register/flag preservation promise. |

The Z80 increment wrap and conditional return reasoning is a static trace of
the unchanged instruction sequence. It is not a new measured execution. No
instruction shortening, tail call, added cleanup or new failure handling is
proposed. In particular, EXISTS still leaves an opened FCB unclosed because
that is its retained read-only existence check, not a newly introduced write.

## Required future proof

The following are proof obligations, not runnable commands or an allocation.
No expected transcript or byte count is invented here.

1. Freeze the exact original and candidate source payloads independently,
   including source line endings, terminal 1Ah and CP/M record padding. Keep
   text-file identity separate from emitted COM length and padded card length.
   Confirm the source files fit the 24,576-byte editor limit.
2. Assemble both versions with the pinned ATOM reference and compare actual
   emitted bytes and symbols. Include NOTRUN's resolved address and message
   bytes. Assemble the saved candidates through actual on-card TAS and compare
   their logical COM bytes with the reference, accounting for record padding.
3. Read each complete source on the selected 40-column console. Check the
   lowercase tokens, label separation, inline column 18 and all comments in
   actual TED presentation. Text-column arithmetic alone cannot prove font
   pixels, cursor or reverse presentation. Confirm saved/reopened source bytes.
4. Exercise EXISTS through its normal CCP route with a known present file
   and a missing file. Record both return paths, the inherited exit and the
   following prompt. Include the retained conditional TYPE chain before/after
   creation and the unconditional DIR case so printed output alone cannot
   masquerade as correct return-code handling. Preserve the distinction between
   an ordinary missing file and a default BDOS disk abort.
5. Exercise RUN through normal CCP launch with DIR, `A:MOUNT!DIR`, a missing
   command followed by a piece and an empty tail. Record the replacement
   command's execution or failure and actual return to the prompt. Distinguish
   the supplied command from the dropped original tail and from a stale prompt.
   The normal tail cannot prove RUN's returned-rejection branch. A separately
   reviewed controlled malformed-input case is needed if that branch is to be
   reported as executed. Include failed-flush cancellation if making a runtime
   claim about acceptance versus execution.
6. Retain actual tool output, source/COM/card identities and complete inputs
   with their evidence boundaries. Reusing historical output after a successful
   byte comparison would still not be a current workflow capture. Independent
   result review and reader-insertion approval remain separate.

## Source-only craft and disposition

I read the whole retained Chapter 12 and both complete containing example
passages before drafting, then read each candidate and its static path account
in order. The original comments retain their wording and meaning after reflow.
The added headers describe actual input, result/clobber and exit conditions.
The inherited RET and RUN's nonreturning accepted call remain distinct.

The candidate fences use spaces only and retain uppercase symbols/literal
contents. Each has nine executable instructions. EXISTS retains six commented
instructions and RUN five, above the 40-percent floor. Counting EQU/ORG/DB
declarations too gives six commented lines out of eleven for EXISTS and
six out of twelve for RUN. Their longest runs of uncommented executable
instructions are two in each candidate. The source has no
include closure to omit. Static width/comment-column checks and sequential
comment/craft review are separate from the still-required assembler/style
qualification and actual public workflow. No original file or shared record
was edited. This candidate file alone is committed with --only and pushed.
