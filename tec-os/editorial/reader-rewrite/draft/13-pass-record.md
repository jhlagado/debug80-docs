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
