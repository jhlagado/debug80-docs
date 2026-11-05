# Chapter 13 pass record

## Brief and authority

The chapter's job is to assemble, install, use and remove a small resident
hook, then publish and depend on named records. Calls, memory, stacks and
hardware interfaces are prerequisites. The PC preparation route explicitly
depends on Chapter5. Loader implementation belongs to24 and the complete
file encoding toH. The chapter retains the practical header and lifecycle
facts needed to author the examples.

The independently closed outline at0e4feea and the controlling movement map
at book base10821b68f80c10d2037bbd1c5ab207877c897c68 govern preservation.
All85 whole units assigned to13 were read, including old09:161–167 and
the entire old12:1–694. No fragment override has destination13.
The full current replacement outline and house style were read. The KD243
opening-profile amendment changes no example pin or startup policy here.

Mechanisms were checked from Git source text at TEC-OS
ea3ef3de9133931e925a0220d51c0e971c1fd8dd. Actual run provenance is now split by example below rather than inheriting
the old78127ec checked-at header. Historical TAS.COM is Thoriumdbee66a,
SHA-25645c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
The PC recipe and its recorded111-byte result remain historical evidence.
No current ATOM build, matching-byte result or workflow qualification is claimed.

## Complete reading and source proofs

Read the original service-authoring chapter from beginning to end, the full
assigned BIOS-hook paragraph with its surrounding console explanation,
the new H reference and the relevant24 lifecycle/cleanup sections. Also read
the original HWLIB definition and AREA references to check the helper homes.
The offered loader and PC writer were read as source, not imported or run.
Pinned TAS's driver writer, command-line setup and output path were inspected
separately. Source ranges below are semantic proofs at the named revisions,
not carried-forward old line numbers.

| Claim | Source and bounded proof |
| --- | --- |
| Resident page ceiling and lifetime | ea3ef3d src/loader.asm:77–101,128–173,227–243,421–455,608–632 establishes page allocation, provisional versus committed top and removal. src/boot.asm:49–90,137–158,175–216 clears resident workspace on cold boot, initialises the ceiling and restores committed page-zero state on warm boot |
| BIOS table and old09 hook obligations | ea3ef3d src/layout.asm:134–135 fixes BF00h and17 entries. src/boot.asm:145–154 copies the table only at cold boot. src/cpm/bdoscon.asm:155–168,229–243 distinguishes ROM status checking from RAM-table output. old09:161–167's restoration obligation is explicit in the new opening |
| Header and SVCFMT | ea3ef3d src/loader.asm:32–66,191–243,251–286 defines the25-byte header and validates magic, format, routine offsets and extents. src/abi.inc:185–190 defines SVCFMT4. Header/image/dependencies/relocation remain separate from card-record padding |
| TAS header writing | Thoriumdbee66a src/tas/DRV.ASM:65–120,252–258 requires INIT/REMOVE and writes offsets, image size, relocation size and dependency count when DEPS exists. It preserves the source format byte and leaves a no-DEPS count unchanged |
| TAS command/output contract | Thoriumdbee66a src/tas/MAIN.ASM:37–103 selects SVC only for that exact output type and rejects DBG or dollar-prefixed types. src/tas/OUT.ASM:1–112 writes/pads the output through a work file before replacing the old name |
| PC writer and include resolution | ea3ef3d tools/lib/svc.mjs:81–105 processes includes relative to the original source directory and assembles both origins. tools/lib/prl.mjs:10–33 resolves path components case-insensitively with exact spelling first. tools/lib/prl.mjs:33–49 requires the indented ORG $0100 line. tools/lib/assemble.mjs:10–20 uses ATOM |
| PC writer fields and dependency option | ea3ef3d tools/lib/svc.mjs:108–132 packs dependencies from options, overwrites format/count and writes both routine offsets and sizes. tools/lib/svc-format.mjs:3 supplies format4. The trailing TAS DEPS convention is not described as a makeSvc input convention |
| PC ROM-literal check | ea3ef3d tools/lib/svc.mjs:18–25 checks two hexadecimal spelling forms after stripping comments. Decimal, binary and other expressions are outside that check. No claim of complete interface enforcement |
| INIT, rollback and hooks | ea3ef3d src/loader.asm:421–455 lowers0006h before INIT without committing PZTOP. src/loader.asm:520–587 scans17 BIOS targets after returned failure/cleanup and distinguishes released pages, retained flags and REMOVE refusal. src/boot.asm:192–199,412–434 bypasses callbacks and restores committed top during warm boot |
| Accepted versus rejected function47 | ea3ef3d src/cpm/bdos.asm:54–110 validates the DMA line and either returns FFh or copies it and warm-boots. The chapter links12 for the flush-dependent queue outcome. No unconditional command-execution claim remains |
| Removal order, refusal and generation | ea3ef3d src/loader.asm:128–173 calls only the newest owner's REMOVE, retains refusal state and increments generation only on successful removal. src/cpm/ccpcmd.asm:14–18 routes UNLOAD through that operation |
| Restart claims and sweep | ea3ef3d src/loader.asm:387–410 rejects a claimed JP before installation. src/loader.asm:634–663 clears claimed slots on cleanup. src/boot.asm:436–509 preserves only jumps strictly above PZTOP, clears trailing bytes and supplies the default RET or EI/RETI sequence |
| Stack declarations | ea3ef3d src/loader.asm:287–322 checks remaining capacity. src/tables.asm:141–146 supplies8/12/6. drivers/glcd.asm:29–35 declares2/0/6. COUNT's retained MYCO listing adds a PUSH HL word before its tail jump. No dynamic stack measurement is claimed |
| GLCD failure and startup exception | ea3ef3d drivers/glcd.asm:66–98 obtains FONT, probes the LCD and registers the table. src/services.asm:618–658 distinguishes absent/startup-PICO status2 from disabled-Matrix-switch/occupied-table status1. src/cpm/ccp.asm:465–485 requires startup context, SVCRC1 and SVCRA2 for the quiet-success result |
| Registry publication and limits | ea3ef3d src/loader.asm:458–606 checks record endpoints and table page, enforces255 per service/256 total and links proposed records only after checks. Rejected records call REMOVE. Refusal retains pages with no proposed records. A remaining BIOS target can clear flags and retain pages |
| FIND/LIST and pointer lifetime | ea3ef3d src/loader.asm:773–876 returns the first matching sufficient version and generation. LIST accepts a byte index. src/loader.asm:128–173 increments generation on removal. The RECS INDEX wrap observation follows directly from the retained listing, not a run |
| Permanent PICO and minor-version use | ea3ef3d src/pico.asm:64–86 registers the ROM tail record. src/abi.inc:149–190 names FIND/LIST, FONT and format4. drivers/glcd.asm:66–72 checks FONT's result. A major-compatible service does not imply that every minor-added call exists |

The old measurements require their individual run pins, corrected below:100 image
bytes plus11 relocation bytes,111 meaningful bytes versus128 card bytes,
one page,420-byte first-install TPA reduction,164-byte alignment gap and
the003A/0052 counter readings. The RECS table addresses B85F/BBE3 are retained
results, not current addresses. The13 complete literal fences were compared
against the frozen book, preserving tabs, trailing spaces and punctuation.

## Preservation by controlling unit

All85 assigned units have a home below. Ranges separated by commas are
separate complete movement records, not newly combined source selections.
Front matter and headings follow the new destination structure.

| Frozen source units | New home and disposition |
| --- | --- |
| old09:161–167 | Code that stays. RAM-table interception, direct ROM status exception, warm lifetime and transient restoration including WBOOT |
| old12:1–6,8–8,10–12,14–19 | Navigation, provenance and opening. Source-only mechanisms separated from historical programs/results |
| old12:21–21,23–30 | Code that stays. COM versus resident lifetime, driver/library roles, GLCD and4 operator crosslink |
| old12:32–38 | TPA/0006h, numbered-ROM distinction and registry calls13/14 |
| old12:40–49 | BIOS table, WBOOT-relative entry lookup, hook and bypass paths with16 crosslink |
| old12:51–51,53–53,55–118 | COUNT introduction and complete unchanged source |
| old12:120–120,122–132 | Header. INIT/REMOVE labels, flags, format, extra memory and printed name |
| old12:134–146 | All header fields retained. Dependency writer column qualified for TAS's no-DEPS case and flags punctuation simplified |
| old12:148–151 | File part order, relocation, record padding and H reference |
| old12:153–153,155–162,164–166 | INIT, CONOUT offset9+1, saved target, last-hook ordering and returned record |
| old12:168–168,170–175 | Hook register preservation, data-encoded JP and direct old-routine return |
| old12:177–177,179–181 | REMOVE, target restoration and refusal-state responsibility |
| old12:183–183,185–189 | Assembly route and exact output-type rules |
| old12:191–194,196–203 | Separate historical svc.img prerequisites and complete unchanged host preparation recipe |
| old12:205–205,207–207,208–218 | Historical TAS assembly introduction, unchanged capture recipe and output |
| old12:220–221,223–223,224–251 | Same-run introduction, unchanged continuation comment and complete measurement/use/removal output |
| old12:253–260 | Historical byte/page/alignment accounting and count delta, with24 allocation link |
| old12:262–265,267–276 | PC writer, actual ORG/include constraints and unchanged complete makeSvc recipe. Historical byte result remains separately pinned |
| old12:278–278,280–283 | Beyond the loader's checks. External-state responsibility |
| old12:285–285,287–294,296–301 | Last-hook order, ordinary failure scan versus warm-boot abandonment and bounded pointer coverage. Function47 acceptance/flush qualification repairs the old unconditional statement |
| old12:303–303,305–307,309–328 | Failed INIT introduction and unchanged FAIL source |
| old12:330–330,331–340 | Unchanged FAIL capture recipe and full retained output |
| old12:342–344,346–353 | Released-page example, interrupt-source cleanup and precise GLCD/startup status distinction |
| old12:355–355,357–368 | Stacked hooks, newest-first removal, CCP timing, record-rejection callback and accepted/rejected function47 during UNLOAD |
| old12:370–370,372–379,381–390 | Restart claims/conflicts, sweep/default bytes, claimed versus unclaimed cleanup and explicit interrupt enabling |
| old12:392–392,394–402 | ROM interface, major/minor distinction, bounded PC literal check and nested-load/removal guard |
| old12:404–404,406–410,412–419 | Declared stack order, COUNT's2/2/2, aggregate limits, GLCD conflict and CHEAT counterexample |
| old12:421–421,422–428 | Unchanged CHEAT mutation/capture recipe and output |
| old12:430–433 | Declarations versus actual use, private-stack documentation and BDOS reentrancy prohibition |
| old12:435–435,437–440,442–447 | Publishing a record and unchanged13-byte record table |
| old12:449–456,458–462 | Links/publication, pointer checks, capacity and cleanup outcomes, compatible table evolution |
| old12:464–469,471–507 | FIND client contract and unchanged CHARS source |
| old12:509–513 | Indirect CALL mechanism, ABI check and historical no-record result |
| old12:515–517,519–573 | LIST contract and unchanged RECS source, with explicit256-entry wrap limitation |
| old12:575–578,580–580,581–593 | Historical PICO preparation/context, unchanged RECS recipe/output and actual address pin |
| old12:595–601 | Permanent PICO, no GLCD record, optional/multiple records and sufficient-version shadowing |
| old12:603–603,605–606,608–617 | Depending on another service. Transient, declared dependency and later-provider lifetimes |
| old12:619–623 | Generation increments, cache invalidation and256-removal wrap. Added distinction between pointer validity and newest-provider lookup |
| old12:625–628,630–661 | Nine-byte TAS dependencies, separate PC deps option and unchanged NEEDS source |
| old12:663–665,667–667,668–689 | Dependency-before-INIT interpretation, unchanged complete NEEDS capture recipe/output |
| old12:691–694 | Final concrete pointer-lifetime consequence, without a recap |

There are no omitted assigned units. The five assembly listings, two shell
recipes and six text captures are unchanged:13 fences total. The five capture
command comments and the same-run continuation comment also compare exactly
with10821b6. The initial draft kept all material in its two owned files; the later
lead disposition retains FAIL in a separately tracked held candidate. Duplicate internals
teaching is linked to24 while every assigned authoring fact retains a home.

## Semantic corrections and limitations

- Successful INIT does not by itself commit the installation. Record checks
  can call REMOVE and retain pages if cleanup fails or a BIOS target remains.
- Warm boot during INIT bypasses the returned-failure scan. It restores the
  old committed ceiling without undoing arbitrary hooks or device state.
- Function47 only warm-boots on accepted input. A queued command also needs
  the normal flush outcome before execution. An accepted call during UNLOAD
  does not complete removal.
- The source's GLCD missing-keyboard status is TNEBAD1, not TNENODV2.
  Startup-PICO and an absent LCD can return2. Quiet startup requires a clean
  failed INIT with no pages retained, not any failure with an earlier A=2.
- Claimed-vector cleanup/sweeping is described on page-release paths, not
  falsely applied to every retained-page failure. The strict ceiling test
  and five cleared bytes after a retained JP are explicit.
- TAS preserves SVCFMT and writes dependency count only with DEPS.
  makeSvc writes format4 and its option-supplied dependency count. Include
  resolution ignores case but remains relative to the original source.
- FIND skips too-old records even when their names match. Removal advances
  the generation, addition does not. Generation equality is bounded by wrap
  and cannot establish that a cached provider is still the newest.
- RECS repeats at a full256-record registry because INDEX wraps. Its literal
  source is retained unchanged and its historical two-record result remains
  valid within that stated scope. No repaired listing or new output is added.

## Completed writing and teaching passes

1. Complete-source and authority read preceded the generous draft. The draft
   preserves the hook-to-client-to-dependency route rather than replacing the
   chapter with a format reference. All assigned literals remain in context.
2. Mechanical vocabulary/agency/heading searches were performed. No praise,
   staged-question or invented-intent prose was retained. Source comments and
   capture syntax remain literal. No complexity program or runtime gate ran.
3. The thematic read checked prerequisites paragraph by paragraph. Memory and
   calling contracts precede hook mechanics. Host setup is explicit before
   card recipes. The GLCD stack conflict and replacement-console prerequisite
   precede COUNT installation. FIND/LIST precede dependency lifetime. Historical addresses
   are qualified beside the result rather than used as current constants.
4. The sentence-deletion pass read every sentence in order. Removed the old
   repeated roadmap and automatic-failure claims. Kept the explicit complete
   examples, cleanup distinctions, table-version contract and wrap limits.
5. The agency pass used operation verbs for code and reader responsibility for
   declarations/cleanup. The separate punctuation pass read every comma and
   removed authorial semicolons. Immutable listing/capture punctuation stays.
6. The technical pass rechecked the changed meanings against the source paths
   above. Text comparisons of the entire ordered fence stream and reproduction
   comments showed no differences from the frozen original. No build, assembly,
   import, capture, test or measurement was performed.
7. The complete journey read covered opening through the final NEEDS removal.
   It checked terms before use, the helper-source homes, transitions and the
   last substantive pointer-lifetime paragraph. New paths for5/10/11/13 follow
   revision-ledger.json. Existing4/12/16/24/H destinations were inspected.

## Delivery boundary

Own writing and source-only passes are complete. Independent editorial/factual
review remains required. Final navigation, final source/media acceptance and
whole-book reader-order review remain pending. This unit owns only the Chapter13
draft and this pass record. No source pin, display policy, runtime allocation
or publication state changes.

## Full independent review and lead disposition

Accepted all four findings in13-independent-review.md. COUNT's workflow is
actually rerun at78127ec in Book45:1–3,78. CHEAT/RECS/NEEDS retain621201d
from Book42:1–5,144–146. The PC111-byte result is recorded at7458352 in
Book31:74 and its earlier TAS byte equality at60e0768 in Book27:76–83.
The retained100/11 breakdown is a file description, not a new781measurement.
The lead read these report passages before changing the qualifications.

FAIL first entered the book at5006e2c. No original execution record was
established by the full audit. Its entire listing, recipe, output and
interpretation are retained unchanged in13-fail-example-candidate.md outside
reader prose, pending an original record or a separate allocated proof.
The remaining failure/cleanup contract stays in the chapter. No assigned
source or result is discarded and no run pin is guessed. This supersedes
the original all781provenance and same-chapter-only preservation statements.

The GLCD registration contract now names the disabled Matrix switch and
requested CRT field, not detected physical keyboard absence or applied mode.
The loader is the actor rejecting claimed vectors and retaining pages after
REMOVE returns carry. Removed repeated process certification in example
introductions while retaining actual programming-boundary warnings.

The lead reread changed passages and neighbouring paragraphs for continuity,
agency and every comma. Complete fence/capture preservation is checked across
the chapter and held candidate together. The full independent technical/craft
review is otherwise clear, with bounded correction confirmation pending.
No product import, assembly, build, test, capture or runtime occurred.

## Latest independent confirmation

Independent confirmation at15e5b50 closes all four findings. Every13literal fence and capture comment remains unchanged across reader/held candidate. Specific run pins and Matrix/requestedCRT/loaderactors are confirmed. FAIL remains held for original execution evidence.
Final source/profile, remaining workflow and whole-book integration remain
open. No new execution accompanied the confirmation.

## Bounded original-record search

A further read-only search found no matching original invocation and result.
Book5006e2c introduces the source, command and printed result without an
execution record. The retained chapter10 rerun JSON records COUNT and RECS,
its setup omits FAIL and its combined output contains no FAIL.SVC. An older
FAIL script and binary use a different vector-installing fixture, not this
no-setup SCF/RET example. Targeted retained text-log searches found no match.
Binary images and compressed archives were not exhaustively examined.
No qualifying payload was archived and nothing executed. The hold remains.

## Source adoption reconciliation

I applied the current-source citation reconciliation selected at `9ba1f59`.
The mechanism authority is now `962853f`. The original source audit and
`source-adoption-unaffected-application.json` record the exact citation
changes, range evidence and input/output hashes. Earlier entries above retain
the source identities and review limits in force when I wrote them.

I read the changed paragraphs and citation contexts in full. Historical
results, source fixtures and dependency pins retain their original scope.
The reader’s fences and capture comments are unchanged. Editorial gate
results and context dispositions are recorded in the application JSON.
Independent application review remains open. No product code ran.


## Released FAIL workflow insertion

This bounded insertion follows source adoption at book `b2e5496`. I read the
complete current chapter, pass record and held candidate before drafting.
The job is to demonstrate an ordinary returned INIT failure after the hook
cleanup obligation. COUNT and its historical continuation remain separate.
The full-chapter journey and every changed paragraph were reread after the
insertion. Earlier FAIL hold entries above describe the earlier evidence state.

### Actual authority and immutable inputs

I read the complete frozen receipt at Origo
`c40c79df6e5399082028f2ac0ce6669efbb59b04`,
`studies/p3-tec-os/reviews/book-complete-workflows.md`. Its SHA-256 is
`4ad1aeba6185f5ea5377281780e4faeb352a11ee49f2398c9afb2a0751de2c37`.
It closes the covered attempt04 result retained at `06b3e05a`. COMPLETE binds
result SHA `fe7ed96287741753150b1c7475facc53e6dea85abaaaf108b414d7266e32c23d`.
The retained archive SHA is
`f07ad35f5aee950bd0438143760e835f28e184dc59d7e6649f6264d2f70d8e9a`.
I inspected the archive and result data inertly. No new product job ran.

The tested source is `8b8664a`, landed as mechanism authority `962853f` with
qualification-record differences only. The qualified ROM SHA is
`fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d`.
PICO remains version 3 with the selected 40-column profile and Matrix enabled.
This is not acceptance of a new host UI default or physical hardware.
The font remains 96 glyphs of eight rows with five pixels in bits 7–3.

| Actual input or artifact | SHA-256 and scope |
| --- | --- |
| packet/FAIL.original.asm | `2a155b29b59d4bb5058ce31b2caf89745cb815b583f8e4e9f1a64200353e1e31`, 506 bytes. Complete original source copied into the reader with tabs and comments unchanged |
| packet/AREA.original.asm | `f3b6e61d5c194653048ec601ef0ef54cc98ebfd5c9833ae85d8ac101ef330034`, 1269 bytes. Original Chapter 10 program, its own decimal printer and no HWLIB include |
| packet/PASS.asm | `16d00ea6dec42fbffbb7578e6cf7c2c5cce56670a78b9b3d4335bad86285a482`, 863 bytes. Verification-only control, not a reader listing |
| Source-adjacent ABI.INC | `092ccf072bb559ba8efc5e55f576d303f2f98a3ea13ed2e821bbd102856a9357`, 6242 bytes. On B with the TAS source inputs |
| TAS.COM | `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`, 10295 bytes, Thorium dbee66a |
| Original starter card | `0f3d9e33994ac30865b8675c8f8ce7fc493b13a0a840d8e84b7d708107d4266c` |
| ATOM FAIL reference file | `c2e76beb4c24bf65bb94ff3bd1de29435fe43e37b19e9e083425ece5cd24d503`, 29-byte image, no fixups, INIT 25 and REMOVE 27 |
| TAS FAIL.SVC | `7bcb66d7e41af1991a85ef36ac8c140b82e4f7daa5636a6a8d0188436ff201c2`, 128-byte padded file matching the reference plus zero padding |
| TAS AREA.COM | `7c786de1352aab57fc874f5f25d53b1b5a3b5ec49cd524c3f80592700950692a`, 128-byte padded program matching its reference |
| fail-build-console.bin | `f79b35bfdd6d6cf8795b84aeac5eed9660739f976360ed705d2ab528d8746b93`, machine 9 |
| fail-baseline-console.bin | `b6e0fa52e9e3d01ba285f9988ca1d87c4e7760ba948a8853dafb5c042e05a890`, machine 10 |

### Placement, sequence and controls

The new material replaces only the held-example comment under A failed INIT.
It explains SCF/RET, supplies the original listing and names Chapter 5 card
preparation, TAS on A and the original source inputs on B. The build excerpt
is a contiguous part of machine 9's console. The verification also built PASS
and flushed with Ctrl+C. Machine 10 then started in fresh RAM from a copy of
that built card. Its contiguous excerpt begins at A>B: and preserves the
actual AREA, SERVICES, FAIL.SVC, AREA ordering. Both AREA results are exactly
47268 bytes. The text does not join this run to COUNT or imply that SERVICES
was run after FAIL in the baseline session. Prompt/output line endings are
rendered as Markdown lines from the retained CR/CR/LF console stream.

Both fail-baseline.json and fail-with-control.json record INIT 1, carry-return
1, REMOVE 0 and BIOS scan 1. The observer reads actual flags.C at the RET after
SCF. Complete before/after service-state equality covers top, PZTOP, entry stub,
full registry records, owner, generation, claim, restart bytes and BIOS table.
This is complete tracked service rollback, not equality of all machine memory.
The two result SHA values are
`f82cf13f90478ac93269b2f84dfc4efbd29dbc1317e06e50c81239041cabfb83`
and `c520ee86293a0910777df928d28470be7032c111c6b3937b4e48fab6984aa1e1`.

Machine 11 separately installed verification-only PASS at B800h. Reference
HANDLER offset 43 gives B82Bh and the RST 1 jump is C3 2B B8. AREA's warm boot
normalises only 000Fh from C9h to zero in that vector's padding. The JP and all
other service fields remain exact. The repeated PASS load executes no INIT
and leaves that canonical state unchanged. FAIL then preserves it exactly.
UNLOAD restores the baseline apart from generation advancing from 0 to 1.
AREA returns to 47268, SERVICES omits PASS, empty UNLOAD reports UNLOAD? and
final Ctrl+C returns to the prompt. PASS's handler is never invoked here.
These controls support the failure explanation without adding another reader
exercise or interrupt claim. Full phase, screen, card and reference review is
in the frozen receipt, not inferred from a completion journal alone.

At `962853f`, src/loader.asm:421–455 lowers 0006h provisionally and branches
from the returned carry to SVCSCAN. Lines 520–574 distinguish record-rejection
REMOVE from failed INIT, scan the BIOS targets and restore the ceiling on
clean failure. Lines 634–663 free claimed slots. src/boot.asm:436–509 supplies
the strict-above-ceiling sweep and five cleared padding bytes after a kept JP.
src/cpm/ccp.asm:444–485 routes typed SVC failures to BADCMD unless the bounded
startup exception applies. These complete contexts were read from Git text.

### Writing passes and preservation

The generous insertion first connected cleanup responsibility to the smallest
failing INIT, then card prerequisites to build and fresh-baseline observation.
The separate thematic pass kept control internals here rather than interrupting
the reader's failure-to-GLCD progression. The deletion pass retained the fresh
RAM boundary, profile, include home and direct-state evidence because they
prevent false continuity and overclaiming from AREA alone. Agency and every
comma were checked in complete paragraphs. The comma before the profile phrase
bounds the configuration of the qualified run. Literal source commas stay exact.

The actual prose_gate found one existing HW008 at the Chapter 6 crosslink.
I retained it: “Chapter 6 explains switching consoles” identifies the linked
explanation and assigns no perception or intent. No new reader/candidate gate
finding occurred. Sentence complexity was run on both files. New NEG/SHORT
flags state the no-setup condition and concrete prerequisites. The 28-word
profile sentence keeps its configuration together. The 28-word observation
sentence connects the three measured outcomes without separating their scope.
Header hash/SHORT/ECHO flags are provenance metadata. Other flags concern
unchanged contractual prose, literal-history text or list-parser fragments.
They were read in context and retained without unrelated revision.

All pre-existing reader fences and capture comments remain byte-identical in
order. The held candidate's original source, recipe and transcript are also
unchanged. Its added status paragraph distinguishes newly covered original
source from the still-unqualified older purported capture. Historical COUNT,
CHEAT, RECS and NEEDS pins, outputs, measurements and PC writer recipes remain
unchanged. Unrun compact candidates and the Chapter 9 ATOM include hold are
not reopened. The accepted basic proof at `4b5b5a50` remains separate.

Bounded independent recheck is still required for this insertion's exact
listing/excerpts, profile and session boundaries, source claims and preserved
historical literals. No runtime, source-pin change, navigation integration or
publication accompanies this edit.

### Final literal readback

Static comparison against `b2e5496` retained all 11 pre-existing reader fences
in order and both candidate fences byte for byte. All pre-existing capture
comments remain exact. Only the obsolete held-example pointer was replaced.
The new reader ASM body equals all 506 bytes of packet/FAIL.original.asm,
including its final LF. Each new transcript is a contiguous excerpt after
normalising retained CR/CR/LF and CR/LF to Markdown LF. No prompts, commands,
results or blank logical lines were invented. Reader output SHA-256 is
`1a49cc9be52c6a2bc88e71ae7ece9c5a01610aa707fe27bbcf3d9e1920dcd934`.
Candidate output SHA-256 is
`dea741d571c4b1deccac4d75fdaa4f7fc3ccd30b04cd99629869ad679be207a5`.
All newly inserted reader prose lines fit within 80 columns. The final
containing-section read covered the prior hook/abandonment rules, FAIL and the
following GLCD/REMOVE transition in full.

The final gate included all three owned files and retained only the existing
Chapter 6 crosslink finding dispositioned above. Complexity also covered this
record. New record SHORT flags identify hashes or precise control outcomes.
The ECHO line/lines flag describes line-ending rendering. The source-coordinate
LONG flag combines three separately punctuated path references under the
parser. The deletion-pass CLAUSES flag retains the reasons for session and
include prerequisites. Earlier record flags are unchanged historical evidence
and list-parser fragments. No flag requires unrelated shortening.

## Final interface-name clarification

The qualified FAIL paragraph now names the PICO9918 console at 40 columns.
Version 3 identifies the PICO registry interface, not the hardware console.
That interface identity remains in the evidence and provenance comment. Only
this wording changed, in the draft and its exact integrated root copy. The
whole surrounding setup paragraph was read again. No listing, capture, input
or proof boundary changed and no runtime accompanied the clarification.
