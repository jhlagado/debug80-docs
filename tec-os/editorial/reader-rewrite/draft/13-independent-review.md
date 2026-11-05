# Independent Chapter 13 review

Reviewed book commit2232250, draft/13-write-a-resident-service.md and
13-pass-record.md. Current mechanism authority is product
 ea3ef3de9133931e925a0220d51c0e971c1fd8dd. Read-only source and editorial review.
No build, import, assembly, test, capture or runtime was performed.

## Required findings

### 1. P2: the blanket historical78127ec attribution is not supported

Locations: chapter13:10–16,302–304,349–354,376–390,648–655 and pass record:19–24,
57–62,105–106,117–119. The broad header assigns every example, result and size
to78127ec. The preservation comparison establishes equality to the frozen book,
not the execution revision. Report-level evidence gives a more specific result:

- Book45:1–3,78 explicitly records the service workflow rerun at78127ec and
  confirms47268/46848/420. Its two-fence workflow is the retained COUNT run.
  Keep that actual78127ec result. Do not globally downgrade this capture.
- Book42:1–5,144–146 records five capture commands at621201d, including the
  changed RECS run. The retained RECS fence, CHEAT fence and NEEDS fence are
  byte-identical to their counterparts in book commitd52778f. That report is
  explicit evidence for those examples at621201d. Book45 records two service
  transcripts rather than all five and does not identify its other individual
  command. It cannot substantiate a blanket new pin for the remaining examples.
- Book31:1–4,74 explicitly records the PC recipe writing111 bytes at7458352.
  Book27:1–8,76–83 records a111-byte PC output and equality with the first111
  bytes of TAS's128-byte file at60e0768. These are actual writer results.
  Book46:88–94 records building COUNT with makeSvc for GAPZERO at78127ec but
  does not supply a new111-byte/equality observation for this chapter's recipe.
- FAIL's complete source and transcript first appear in book commit5006e2c,
  after reports42 and45. `git log --follow -S 'B>FAIL.SVC'` and the corresponding
  source search both identify that introduction. Neither fence exists in the
  report42 or report45 book snapshot. Reports through46 contain no explicit
  FAIL capture execution. The initialisation/failure source proves the proposed
  mechanism, not that the displayed transcript was captured at78127ec.

Correction: replace the universal header with separate mechanism authority and
per-example provenance. Keep every literal listing/recipe/fence unchanged.
Record COUNT's confirmed78127ec workflow, the explicitly confirmed621201d
CHEAT/RECS/NEEDS captures and the PC writer's named earlier result. For FAIL,
state that its source and output are retained from frozen10821b6, introduced
at5006e2c, with an original run not established by the reviewed records.
Do not call its output newly verified or guess a run pin. A separate existing
run record could close that evidence gap without any runtime here.

The FAIL wording “This historical ... capture” and the pass record's “actual
address pin” need the same qualification. A source-derived expectation must
not be promoted to captured evidence. The requested compact-format assembly
proof remains a later acceptance step for all preserved literal sources.

### 2. P2: GLCD registration checks the Matrix switch, not physical keyboard presence

Location: chapter13:392–398, especially “for a missing matrix keyboard”.
Pass record:52 and the GLCD limitation bullet repeat the same interpretation.

At ea3ef3d, src/console.asm:82–86 reads STSPORT, ANDs CDMTX and stores that
switch bit in CONDEV. src/video.asm:161–165 tests this stored bit and returns
carry when clear. It performs no physical keyboard probe. src/services.asm:
649–655 converts that carry to TNEBAD1. An attached keyboard with the switch
disabled fails this gate, while an enabled switch alone is not physical-presence
proof. Driver/source comments that call this “no keyboard” are shorthand and
do not override the instructions.

Suggested replacement: “Its table registration returns TNEBAD, status1, when
the Matrix switch is disabled or a GLCD table is already registered.”

The same paragraph should state the exact startup condition if describing the
contract: src/services.asm:634–647 checks STFLAG plus the requested IOBYTE
CON field for CRT. It does not read applied CONMOD. Suggested wording:
“For a startup line with CON requesting CRT, registration returns TNENODV.”
Normal startup has matching requested/applied states, but the authoring
interface condition is the requested field. Keep the correct clean-failure
qualification: ccp.asm:465–485 requires startup context, SVCRC1 and SVCRA2.
The absent-controller status2 remains correct at drivers/glcd.asm:73–80.

## Small editorial corrections

### 3. P3: name the loader as the actor in two validation/retention statements

Chapter13:425–426 says a claimed vector “rejects the load”. The vector holds
bytes. The loader performs the rejection at src/loader.asm:387–408.
Use “The loader rejects the load before INIT if a claimed vector already
starts with JP.” Preserve the ROM-target example.

Chapter13:521 says “A refusing REMOVE retains the service”. REMOVE returns
carry. The loader retains pages at src/loader.asm:529–534,582–587.
Use “If REMOVE returns carry set, the loader retains the service with no
proposed records.” This also avoids assigning volitional refusal to a routine.
No literal comments/listings need alteration.

### 4. P3, optional deletion: repeated review-status prose interrupts the practical route

Chapter13:219–220 repeats the historical/source distinction already made in
the header and immediately named again at229. Chapter13:303–304 adds “This is
the complete original recipe, not a new ATOM build or byte comparison” after
already identifying the historical result. Delete the process assurances and
attach the exact historical pin to each example introduction instead. Keep
302's111/128 distinction with its corrected evidence. Keep283–286's warning
against using historical addresses as a current memory ceiling because that
changes an actual programming decision. This is a local deletion, not a request
to cut technical explanations or historical material.

## Cleared factual scope

Read the complete original12-writing-services.md at10821b6, assigned old09:
161–167 with its full containing section, all85 movement-unit qualifications,
the closed outline and current draft/pass record. All assigned factual units
have a home. No omitted listing or contract was found.

All13 complete fences compare byte-identically with the frozen original:
five assembly listings, two shell recipes and six text fences. All five capture
command comments and the continuation comment also compare exactly. This proves
preservation only. Existing assembly punctuation, compact-format acceptance and
actual executable bytes were not requalified. The PICO historical output remains
explicitly historical and is not BANNER40 or a new font/default result.

The five listings were read instruction by instruction. COUNT computes the
CONOUT target at the WBOOT word plus9+1, preservesHL/flags in the hook and tail
jumps through OLDCO. GETCNT returnsHL. CHARS's CALLHL retains its caller's
return address and HWLIB preservesHL while printing. RECS's byte index does
wrap at256 entries and the draft now bounds that example explicitly. NEEDS's
declaration and FIND call use the same name/minimum version. A successful
lookup supplies the table later stored by INIT. None of these static checks
is a new assembly or execution result.

TAS versus makeSvc is correctly distinguished in the draft. Thoriumdbee66a
src/tas/DRV.ASM:92–120 writes REMOVE/INIT offsets and image size. Its absent-DEPS
branch bypasses the count store at117–118. The writer never replaces source
format byte1. DRV.ASM:189–258 normalises marked bytes to page0 and writes the
gap-list length. MAIN.ASM:38–101 selects SVC by exact output type and rejects
DBG/dollar types. OUT.ASM:56–116 pads records and closes/renames the work file.
At productea3ef3d, tools/lib/svc.mjs:83–104 requires INIT/REMOVE and compares
two origins. packSvc:115–131 appends option deps, always writes FORMAT at1
and deps.length at2 and writes offsets/sizes. It does not interpret a TAS
trailing DEPS label as the dependency option. prl.mjs:17–46 and svc.mjs:93–100
support the exact ORG and source-relative case-matched include explanation.
assemble.mjs:10–19 names ATOM. The ROM-literal guard at svc.mjs:18–25 is limited
to the two named hexadecimal forms and excludes comments. The prose bounds it.

The loader mechanisms were read in full at src/loader.asm:1–880 with display
installation callers through980. Verified page rounding/provisional0006h versus
committedPZTOP, required routine offsets/file extents, dependency-before-INIT,
stack declarations and8/12/6 limits, relocation, restart conflicts, returned
INIT failure scan, record checks/capacity, cleanup refusal, retained-page flags,
publication, generation and newest-first removal. No additional factual defect
was found in these explanations. Claimed-vector defaults are correctly scoped
to released-page cleanup, with0038EI conditional on no preservedJP. boot.asm:
412–509 uses a strict above-ceiling comparison. Function47 validation and accepted
versus rejected return behaviour at bdos.asm:54–108 match the draft, including
its linked flush-dependent command outcome. No unconditional execution result
is inferred.

The hooks/lifetime explanation matches layout.asm:134–135, boot.asm:139–152,
bdoscon.asm:155–168/229–243 and CCP's BDOS output helpers. Registry descriptions
match loader.asm:458–606/773–880. PICO's permanent tail and cold registration
match pico.asm:31–86. GLCD declares2/0/6 at drivers/glcd.asm:30–35 and publishes
HL0 at91–93. The COUNT/GLCD CCP-stack conflict is therefore supported without
rerunning either example. Input provenance matches test/inputs.json's exact
Thorium commit and TAS SHA-256.

## Editorial and journey scope

Completed a paragraph-by-paragraph thematic read and sequential sentence deletion,
agency and every-comma reads of retained and new prose. Headings are noun phrases.
No authorial Oxford comma, semicolon, em dash, hollow recap or blanket invented
runtime result was found beyond the provenance issue above. A few optional
commas before conjunctions remain but they are not serial commas and do not
justify mechanical changes. Source comments/recipes retain immutable punctuation.
The failure distinctions and prohibitions earn their negative framing.

The route from resident lifetime through a hook, its header/lifecycle, assembly,
cleanup obligations, stacks, registry client and dependency lifetime is connected.
The early GLCD stack prerequisite prevents the obvious installation failure.
The ending lands on the dependency pointer's actual lifetime. Chapter4's anchor
and Chapter24's allocation anchor exist. Final-root sibling filenames for5/10/
11/12/16/24/H are the intended destinations. Chapter11's draft is not currently
present, so its future HWLIB home is an integration dependency, not a reason to
rewrite the retained helper contract. I read its full original HWLIB definition.
No root-integration acceptance is claimed.

Verdict: correct the provenance boundary and Matrix-switch contract before
acceptance. The two actor corrections are small owned prose repairs. Preserve
all literal sources/output while compact-format proof remains pending.
