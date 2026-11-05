# Chapter 20 pass record

## Scope and brief

I drafted only `draft/20-from-prompt-to-program.md` and this record on
`tec-os-reader-rewrite`. The closed replacement outline at `0e4feea` governs
the route and `movement-units.json` governs preservation. This is a source-backed
first draft with own revision passes complete. Independent review, runtime
qualification and final integration remain pending.

The chapter's job is to follow a command from boot entry and the prompt through
parsing, dispatch, lookup and capacity checks to PREPPAGE and program entry.
The reader already has practical command use, BDOS/FCB/DMA calls, page zero,
program memory and resident-service concepts. The register-level explanation
belongs here. Exact grammar is in J, practical chains in12, retained-buffer and
drop mechanisms in21 and history storage in22. Built-in implementation facts
remain here because the controlling units assign them here.

The prose uses the house second-person teaching voice with operation verbs,
Australian spelling and minimal punctuation. Every current semantic citation
uses `ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. Historical evidence retains
`78127ec`, ATOM `atom-z80` 0.3.7 and TED Thorium128edb7 with SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`.
The inherited C16 citation header is replaced by the split source/history
header. No output or measured address is silently qualified at the new source.

## Reading and route

I read old `20-ccp.md` completely, including all nine fences and capture
comments. I read the additional assigned old03:372–375 paragraph, every
whole unit assigned to20 and all fragment overrides. There are no fragment
moves from old20 or into20. I read the closed outline and source-question
dispositions and checked the destination paths against the revision ledger.
The existing completed J and12 reviews supply nearby scope boundaries, not
substitutes for reading this chapter's original material.

The theme ladder is ROM/workspace, boot selection, input priority, parsed
command, built-in mechanisms, COM lookup and capacity, page-zero preparation
and the entry/return stack. The old built-in detail is grouped by operation
rather than reduced to syntax. The capacity recipe precedes its retained
output and names the complete ARGS listing. User fallback shares that card.
The closing section ends on the prompt's observable blank line, not a recap.

## Evidence and source inspection

Only source-object reads and static text operations were performed. No build,
test, capture, emulator, application, fixture import or example command was
executed. The displayed shell and assembly fences are retained historical
material. No new workflow result, address, timing or output is asserted.
The planned40-column TECCompact opening remains a separate pending source and
qualification change. Historical console widths and the existing GLCD/startup
policy are retained. There was no runtime allocation.

The original nine fences consist of seven output fences, one complete shell
recipe and the complete ARGS assembly listing. All seven capture recipes remain
at their example homes. Static full-fence equality includes blank lines and
trailing spaces. Original material is unchanged from movement-map base10821b6.
The retained ROM extent, CCP workspace addresses, 24-call helper count, B9h SAVE
bound and B9A4h/47,104-byte capacity remain explicitly historical. A git text
count at78127ec confirms24 CALL DOSSEQ occurrences without assembling them.

| Claim group | Text authority at ea3ef3d and inspection |
| --- | --- |
| Source organisation and keyword layout | `src/rom.asm:31-35`, `src/tables.asm:60-80`: include order, zero-terminated words and handler addresses. Historical byte extents remain recorded evidence from old20, not recalculated build results. |
| Workspace split and warm reset | `src/ram.asm:163-225`, `src/boot.asm:530-555`: two36-byte FCBs,128-byte text buffer, CCPCLR clearing boundary, maximum127 and stack guard. |
| DOSSEQ | `src/cpm/ccpmut.asm:393-409`: EX (SP),HL advances the return PC by one, SRL C decodes function/FCB bit and JP BDOS preserves the caller's return destination. |
| Boot selection and prompt | `src/cpm/ccp.asm:46-111`, `:119-147`, `:363-384`; `src/boot.asm:157-158`, `:212-215`, `:405-424`: packed user/drive restored, invalid or absent drive takes A, SAVEDU refreshes0004h. |
| Disk reset and startup | `src/cpm/bdosfile.asm:55-95`, `src/cpm/ccpcmd.asm:874-919`: WRFLAG selects the warm-vector path; STBOOT marks the one-shot read before attempting it. Normal startup policy remains unchanged. |
| Input origins | `src/cpm/ccp.asm:148-180`, `:224-284`: CHSKIP precedes STLINE and typed function10. Pending pieces retain STFLAG. Conditional test precedes zeroing PRGCODE. Details are linked to12/21/22. |
| Drive-only and dispatch | `src/cpm/ccp.asm:285-320`, `:396-449`, `src/cpm/ccpcmd.asm:771-795`: drive selection updates only after success, parsed word precedes keyword lookup and ISCMD compares original text boundaries. |
| Parser and reused FCB | `src/cpm/ccpcmd.asm:499-645`, `:656-743`, `src/text.asm:61-62`: clear36 bytes, store drive/name/type, preserve delimiter pointer, star fill, invalid-character and overlength paths, blank/question-mark rejection. COPY destination substitution precedes that final check. |
| Errors and service dispatch | `src/cpm/ccp.asm:445-499`, `:544-629`, `src/cpm/ccpcmd.asm:120-132`: SVC path, quiet startup INIT/TNENODV exception, COM type replacement, CMDSTRT update for CON width and ERRGO's FF00h store. |
| DIR and TYPE | `src/cpm/ccpfile.asm:25-313`, `:593-662`, `src/cpm/bdosfn.asm:66-145`: full wildcard replacement for blank name, extent-zero search, SYS exclusion, column padding, selected-drive free count and TYPE's EOF/close paths. |
| Pager | `src/cpm/ccpfile.asm:334-520`, `src/text.asm:32-33`: geometry fallback, reserved row, exact CR/backspace/tab/wrap accounting, key mask and prompt erasure. No new pagination capture was introduced. |
| ERA and REN | `src/cpm/ccpmut.asm:13-184`: eleven-question-mark confirmation, first-answer byte, drain to CR, function19 deletion, two-name drive agreement, new-name search and function23 offset17 mutation name. |
| SAVE | `src/cpm/ccpcmd.asm:290-445`: decimal carry checks, strict high-byte ceiling, erase/make, two records per page and failure-close path. Partial retention is conditional on close success because the error path discards its return. |
| USER and CON | `src/cpm/ccpcmd.asm:66-280`, `src/loader.asm:895-913`, `src/pico.asm:57-117`, `src/console.asm:429-440`: accepted digit forms, mode aliases, GLCD automatic load/rollback, selected-mode report, width lookup and quiet missing-interface startup branch, claimed-display rejection, warm/reset width lifetime and BAT discard. |
| COPY and service listing/removal | `src/cpm/ccpmut.asm:197-424`, `src/cpm/ccpcmd.asm:14-18`, `:829-864`, `src/loader.asm:128-173`: explicit drives, blank-name substitution, ambiguity/self/extra-text checks before open, DMA0080h record loop, count printing, unchecked error-close result, owner-page count and non-skipping UNLOAD. |
| COM and SVC lookup | `src/cpm/ccp.asm:498-517`, `:639-673`, `src/loader.asm:925-932`: missing versus found-but-unloadable flags; user0 restoration; conditional A retry; SVC calls LOADCOM directly with neither retry. |
| Load ceiling | `src/cpm/ccp.asm:685-785`, `src/loader.asm:603-618`, `src/cpm/bdoscon.asm:47-72`: read at128-byte DMA increments, scratch oversize discriminator, EOF-only success, LOADTOP publication, ignored close result and default fatal read-error path. Service commit lowers PZTOP and warm boot republishes it at0006h. |
| PREPPAGE and ARGS | `src/cpm/ccpcmd.asm:456-599`, `:712-727`: first two argument parses, ignored parse errors, overlapping FCBs and tail copied last with length/zero, DMA reset. Literal ARGS was traced by inspection: PUT saves BC/HL, SHOWFCB prints11 bytes and TAIL decrements the stored count. No assembly was run. |
| Entry and exit | `src/cpm/ccp.asm:503-536`, `src/layout.asm:153-155`, `src/ram.asm:212-225`, `src/cpm/bdos.asm:254-259`: load-drive byte,32-byte stack configuration,0000h return word and0100h jump. `src/boot.asm:194-215`, `src/cache.asm:661-668` qualify warm-flush failure and pending-command cancellation. |

## Preservation by old unit

Every whole unit assigned to20 is listed below. Headings and navigation are
replaced by the new route. Prose facts remain in the corresponding section,
with source corrections recorded below. Fences and capture recipes remain
verbatim even where their section order changes. Exact grammar and repeated
practical instructions are linked to their new homes without removing any
assigned recipe or output. The parser, all built-in mechanisms and the entire
lookup/capacity/PREPPAGE/entry explanation remain locally available.

| Original unit | Kind | Draft disposition |
| --- | --- | --- |
| `tec-os/03-command-line.md:372-375` | paragraph | Integrated into boot selection and prompt. |
| `tec-os/20-ccp.md:1-6` | front matter | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:8-8` | heading | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:10-13` | provenance or capture recipe | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:15-17` | provenance or capture recipe | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:19-24` | paragraph | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:26-26` | heading | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:28-36` | paragraph | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:38-42` | paragraph | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:44-53` | paragraph | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:55-60` | paragraph | Code and working storage; split provenance header. |
| `tec-os/20-ccp.md:62-62` | heading | Entry from boot; reset capture unchanged. |
| `tec-os/20-ccp.md:64-70` | paragraph | Entry from boot; reset capture unchanged. |
| `tec-os/20-ccp.md:72-82` | paragraph | Entry from boot; reset capture unchanged. |
| `tec-os/20-ccp.md:84-91` | paragraph | Entry from boot; reset capture unchanged. |
| `tec-os/20-ccp.md:93-93` | provenance or capture recipe | Entry from boot; reset capture unchanged. |
| `tec-os/20-ccp.md:94-106` | example source or output | Entry from boot; reset capture unchanged. |
| `tec-os/20-ccp.md:108-109` | paragraph | Entry from boot; reset capture unchanged. |
| `tec-os/20-ccp.md:111-111` | heading | The prompt and its input; links to12/21/22. |
| `tec-os/20-ccp.md:113-120` | paragraph | The prompt and its input; links to12/21/22. |
| `tec-os/20-ccp.md:122-130` | paragraph | The prompt and its input; links to12/21/22. |
| `tec-os/20-ccp.md:132-135` | paragraph | The prompt and its input; links to12/21/22. |
| `tec-os/20-ccp.md:137-137` | heading | The parsed command; exact grammar linked to J. |
| `tec-os/20-ccp.md:139-144` | paragraph | The parsed command; exact grammar linked to J. |
| `tec-os/20-ccp.md:146-151` | paragraph | The parsed command; exact grammar linked to J. |
| `tec-os/20-ccp.md:153-162` | paragraph | The parsed command; exact grammar linked to J. |
| `tec-os/20-ccp.md:164-174` | paragraph | The parsed command; exact grammar linked to J. |
| `tec-os/20-ccp.md:176-181` | paragraph | The parsed command; exact grammar linked to J. |
| `tec-os/20-ccp.md:183-193` | paragraph | The parsed command; exact grammar linked to J. |
| `tec-os/20-ccp.md:195-204` | paragraph | The parsed command; exact grammar linked to J. |
| `tec-os/20-ccp.md:206-206` | heading | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:208-209` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:211-222` | table | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:224-233` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:235-240` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:242-253` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:255-258` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:260-264` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:266-275` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:277-281` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:283-283` | provenance or capture recipe | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:284-292` | example source or output | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:294-301` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:303-303` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:305-313` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:315-324` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:326-326` | provenance or capture recipe | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:327-342` | example source or output | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:344-347` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:349-361` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:363-366` | paragraph | The built-in handlers; SAVE and CON captures unchanged. |
| `tec-os/20-ccp.md:368-368` | heading | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:370-376` | paragraph | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:378-384` | paragraph | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:386-390` | paragraph | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:392-395` | paragraph | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:397-406` | example source or output | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:408-409` | paragraph | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:411-411` | provenance or capture recipe | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:412-420` | example source or output | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:422-423` | paragraph | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:425-425` | heading | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:427-430` | paragraph | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:432-444` | paragraph | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:446-446` | provenance or capture recipe | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:447-457` | example source or output | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:459-462` | paragraph | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:464-464` | provenance or capture recipe | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:465-482` | example source or output | Program lookup and capacity; complete card recipe and all lookup/capacity captures unchanged. |
| `tec-os/20-ccp.md:484-484` | heading | Page zero before entry / The jump and return; ARGS source/output unchanged. |
| `tec-os/20-ccp.md:486-492` | paragraph | Page zero before entry / The jump and return; ARGS source/output unchanged. |
| `tec-os/20-ccp.md:494-497` | paragraph | Page zero before entry / The jump and return; ARGS source/output unchanged. |
| `tec-os/20-ccp.md:499-500` | paragraph | Page zero before entry / The jump and return; ARGS source/output unchanged. |
| `tec-os/20-ccp.md:502-551` | example source or output | Page zero before entry / The jump and return; ARGS source/output unchanged. |
| `tec-os/20-ccp.md:553-553` | provenance or capture recipe | Page zero before entry / The jump and return; ARGS source/output unchanged. |
| `tec-os/20-ccp.md:554-569` | example source or output | Page zero before entry / The jump and return; ARGS source/output unchanged. |
| `tec-os/20-ccp.md:571-574` | paragraph | Page zero before entry / The jump and return; ARGS source/output unchanged. |
| `tec-os/20-ccp.md:576-589` | paragraph | Page zero before entry / The jump and return; ARGS source/output unchanged. |

## Own revision passes

1. Full original read and generous draft completed before line editing. The
   route starts from the established command workflow and follows the code's
   successive states. Each subsection has an operative subject and citations.
2. Thematic pass retained all assigned handler mechanisms while linking syntax
   to J. Chains, startup details and history receive concise boundary links
   rather than another complete explanation. No assigned fence was removed.
3. Sentence deletion pass read every paragraph and sentence in order. Removed
   a redundant historical-size disclaimer, a generic sentence announcing later
   uses of state flags and a sentence announcing where the chapter resumes.
   Required source qualifiers, error outcomes and bridges remain.
4. Agency pass retained only literal software operations. Chapter references
   say explains, gives or lists. No mental state or publication-sequence
   movement is assigned to code, files or chapters.
5. Every-comma pass removed optional commas before conjunctions and regrouped
   the FITS/BIG/ARGS description to avoid a serial comma. Literal historical
   assembly, shell and output punctuation remains unchanged. Short definitions,
   bounds and error conditions survive the deletion test without a length quota.
6. Semantic pass corrected the overbroad statement that all other built-ins
   leave the TPA unchanged: CON may load GLCD.SVC. Clarified that tail storage
   shares the second FCB's last16-byte region rather than asserting every byte
   is always overwritten. Retained conditional write-error closes, direct SVC
   lookup and CON's width error pointer. Added PICOWID's claimed-display check.
7. Literal pass compared complete fences and capture comments against old20.
   Historical sizes, offsets, PC fixture and outputs stay labelled by their
   old pin. Current citations identify mechanisms rather than certifying those
   historic numbers or results. Relative destination paths follow the ledger.
8. Journey read-back covered the entire draft from front matter to the last
   prompt sentence. Paragraphs establish state, explain the next operation or
   connect the retained example to its rule. The FCB overlap explanation comes
   before ARGS and the entry stack follows PREPPAGE.
9. Mechanical pass used explicit text searches for prohibited vocabulary,
   inanimate agency, hollow transitions, serial commas and punctuation. No
   Python gate or complexity script was executed under the no-execution
   constraint. This is a manual craft pass with text scans, not a claimed
   automated gate result or a measured readability score.

The final text comparison matched9 of9 fences and7 of7 capture recipes.
All96 distinct current source citation ranges were checked against the git
objects' physical line counts. None was out of bounds. The semantic reading
above establishes what those ranges support; bounds alone do not prove a claim.

## Outstanding acceptance

Independent factual and editorial result reviews remain pending. Current
runtime qualification of the retained captures, exact free-space figures,
capacity boundary and supplied applications is not claimed. The original
recipes remain available for a separately allocated run. Final relative links,
source/media pin, whole-book reader-order review and integration remain open.
No published chapter, outline, ledger, harness or source file was edited.

## Independent result review

Full old/new text, movement accounting and offered-source review atf9e2e36
found no factual or editorial blocker. Parser fields, fallback/capacity,
PREPPAGE overlap/tail order and entry stack match the inspected source.
All nine historical fences and seven capture recipes remain. Complete
craft, agency, punctuation and journey review found no additional issue.
No current runtime result was inferred. Final qualification/navigation and
the whole-book read remain pending.

## Receiver source adoption at book 9ba1f59

This section supersedes the earlier current-source and pending-default
statements in this record. Earlier readings and measurements retain their
original provenance. The reader now uses TEC-OS
`962853f499f05faf281f6cdff1deca8959f58c2b` for current mechanisms. All six owned
chapters and their existing records were read completely before editing. The
impact inventory and confirmation cover 35 contexts, 29 proof spans and nine
historical exceptions. Their source and reader scopes were read alongside the
actual ea3ef3d-to-962853f code changes.

CCPENT, MLREAD and MLTAKE preserve source priority, chain extraction and
result-code clearing. Handler grammar, public FCB/DMA calls, fallback only after
absence, LOADLIM scratch read and PREPPAGE ordering remain unchanged. The
program return word stays outside DMA. Width calls use PICO version 3 and reject
active claims. Bare selectors bypass the width call.

Current source proof: `src/console.asm:57-88` samples the Matrix switch.
`src/tms.asm:17-48` and `src/video.asm:22-29` gate PISTART on the VRAM probe.
`src/pico.asm:36-92` sets PIDEFLT to 40 and installs the console only with CDMTX
set. `src/pico.asm:94-196` accepts explicit 80/40/32 widths and rejects a claim.
`src/cpm/ccpcmd.asm:120-208` bypasses that entry for bare selectors.
`src/console.asm:165-199` preserves a claimed PICO display during selection.
`src/boot.asm:178-215` and `src/ram.asm:359-365` preserve the width over warm
boot.

PICO remains record version 3 (`src/abi.inc:219-243`). The selected font retains
96 glyphs of eight rows with five pixel bits at 7–3 (`tools/lib/font.mjs:9-43`).
Six-pixel display cells do not change that encoding. Native 16020 used/364 free
already appears at ea3ef3d in `docs/memory-map.md:22-30`. No font-growth or
historical-map equality claim follows. The accepted offer retains these exact
artifact identities:

- ROM SHA-256: `fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d`.
- D8 SHA-256: `9a87dec39a63efc8fdf38ae13d6ec6299763c833fc891de121e2b30f4a1a36ac`.

Selection authority is P3 proposal 18 / Origo 43d5f328, mechanism source 962853f
and tested source 8b8664a. Opening workflow receipt 4b5b5a50 and the closed
d9d57d2/b911e84 reviews remain scoped acceptance. No local execution supplies a
new artifact or example result.

Citation coverage: 106 incoming unprefixed file/range occurrences; 110 final
occurrences. Every incoming occurrence was checked in its complete reader
passage against the owning source and relevant callers. The table lists all
final range identities. Identical bytes establish source identity only.
Historical examples remain historical even when their program source is
unchanged.

| Source at 962853f | Inspected ranges | Complete file SHA-256 |
| --- | --- | --- |
| `src/boot.asm` | 157–158, 194–215, 212–215, 405–424, 530–542, 540–542 | `babbd9b2137a60c0fa0fec1cb461d7cd311d7e785413fcd88500c9cb6b9e5428` |
| `src/cache.asm` | 661–668 | `e97a1b16ebae2a6710d7e78972590a141708e6e5c6ebb195d25c45d409c1e09b` |
| `src/console.asm` | 57–88, 165–199, 429–440 | `988297527d3be3859f389b0cbdb48ada68d85487d18e65bd12f1df4524ac4ab2` |
| `src/cpm/bdos.asm` | 254–259 | `0b491acfc4924be7bb78e2a76600ec666875f4aa293a2543aedcb397e7070af6` |
| `src/cpm/bdoscon.asm` | 47–72 | `80846394bf1e858a48f0e2d9bf56539243cbcaf3b7efc0a19bd0837e0b9526a1` |
| `src/cpm/bdosfile.asm` | 55–95 | `151943df2afad491bd47b18e4f4c4df41672d60e9910cb962cdcbe95c9bcf2e6` |
| `src/cpm/bdosfn.asm` | 66–151 | `1739ff8b2e88c60c3e1655d9ce02a1579ed3fff89c27d118f385080148ca34cb` |
| `src/cpm/ccp.asm` | 46–85, 46–166, 82–111, 119–147, 148–166, 153–180, 224–284, 285–320, 363–384, 396–411, 415–449, 445–499, 465–467, 465–485, 498–517, 503–525, 527–536, 532–536, 544–554, 544–587, 588–629, 639–673, 685–715, 685–728, 700–702, 724–768, 777–785 | `7d5a640a6957ade5167493aba0ca0077f79b05dddedbb0844092112aeabe3cb1` |
| `src/cpm/ccpcmd.asm` | 14–18, 66–232, 120–132, 120–198, 120–208, 200–232, 241–280, 290–354, 290–445, 356–445, 364–414, 456–497, 499–599, 511–599, 548–645, 656–704, 682–743, 712–727, 771–795, 829–864 | `6c16f68385d13cb371f397fa48b0b868e1cfe627d70a412ffed85ac53e0ca86d` |
| `src/cpm/ccpfile.asm` | 25–147, 25–313, 78–108, 111–113, 150–233, 238–241, 248–313, 334–470, 475–520, 593–655, 593–662, 614–617 | `770facd38522ea0e48537e761bf475c5536c726bd27983c968a7522f59db0358` |
| `src/cpm/ccpmut.asm` | 13–84, 71–76, 99–184, 197–224, 249–380, 253–277, 253–294, 296–333, 296–380, 393–409, 416–424 | `211eb2dea851389acf086d898b5f1bb9334d37c9882fe9d26149977acb65125f` |
| `src/layout.asm` | 153–155 | `10aa9ee6cc80be14363ca61aa71eac4ac90839ea3c62147199eb201188a542fa` |
| `src/loader.asm` | 128–173, 603–618, 895–913, 895–932, 925–932 | `933985f18c5d3eb2c776c182769708dfffc245a387bb26e7aa684db5f1635f36` |
| `src/pico.asm` | 59–92, 94–122 | `c72090deca38228a1fa94b9dce912b97cf50b7b90c179e3ac8a2a2741f9131a4` |
| `src/ram.asm` | 163–203, 167–172, 212–225 | `4e2be7c58cde2b4b6a5b3a26f6501150ac0b5d1905e2d99355590016c3ac1153` |
| `src/rom.asm` | 31–35 | `98b35746cb4a4b1ecc180ea86e82b5a90111a992cca4297f106288c9eaecfc48` |
| `src/tables.asm` | 53–80 | `a2a326ed74a01f28bd0b6a25a15c48847de786d02dc2b434c23aa28e8cc1e3da` |
| `src/text.asm` | 32–33, 61–62 | `ecc63a54ea958ca8d07a51f29ccc693ad38c940063a90b61be13b3751b974815` |
| `src/video.asm` | 22–29 | `984df3e6d1fdb7f865586c9e4a9c4690cf9300fe7df226c0450c71fbab8ef560` |

Protected readback: 9 complete fences and 7 command comments match the
pre-adoption reader byte for byte. All explicit historical pins, 64-digit hashes
and link destinations are unchanged. Historical measurements, map addresses and
output were not repinned or regenerated.

The thematic pass keeps the existing operator/reference route. The deletion pass
removes the obsolete current-80 premise while retaining historical-80
explanations. The agency pass uses the actual switch, probe and handler
conditions. Each changed paragraph and its neighbours were read again after
editing. Every comma in those paragraphs was checked for its grammatical job.
The width enumeration commas separate values. The host-default comma, where
present, separates its explanatory qualification. No optional conjunction comma
was introduced. No listing, recipe or screen was rewritten.

Editorial input SHA-256:
`6ebc76785bb0610eb43a225ac949d23cea84e96cf312119d6d0d6118101599a2`. Final
reader SHA-256:
`d46b613434e539e65d69f99ee863713d1d874a221b5cdbaa5f6fe3b15741dc85`. Pre-append
record SHA-256:
`00739563ce154a9aa7256026c0eec3ad4bc33aa9094ce0b73b41d13b3a002525`. Actual
prose gate: zero findings in all six readers. The existing record findings are
Chapter 15 lines 104 and 176, HW008: both quoted uses of `source offer` name the
proposed source revision rather than an intentional actor. Retain the historical
wording with this disposition. No hard finding occurred.

Sentence-complexity prompts below were read in their containing paragraphs.
Short mechanism statements and navigation sentences remain connected to their
explanations. Numbered-list fragments are parser segmentation, not new prose
fragments. Repeated defined terms preserve exact relations. Longer sentences
retain their required conditions or ordered operations. Each prompt is retained
for the case recorded here rather than automatically shortened.

| Reader input line | Prompt | Sentence readback | Disposition |
| ---: | --- | --- | --- |
| 11 | LONG(42) | The historical starter's TED.COM was Thorium 128edb7, SHA-256 2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f. | Retain necessary condition or ordered operations. |
| 11 | SHORT(5) | No current runtime check claimed. --> | Retain direct fact in its explanatory paragraph. |
| 28 | LONG(28) | The CCP uses CP/M calls for its ordinary work: function 10 reads a line, function 15 opens a file and function 9 prints a string through CODE. | Retain necessary condition or ordered operations. |
| 46 | SHORT(6) | The working state is in RAM. | Retain direct fact in its explanatory paragraph. |
| 46 | SHORT(6) | Chapter 21 explains the retained line. | Retain direct fact in its explanatory paragraph. |
| 46 | SHORT(6) | Appendix C lists the memory locations. | Retain direct fact in its explanatory paragraph. |
| 55 | CLAUSES(2+1) | Bit 0 selects CODE when clear and CODE when set. | Retain necessary condition or ordered operations. |
| 94 | SHORT(6) | The next prompt is on A. | Retain direct fact in its explanatory paragraph. |
| 113 | SHORT(6) | Chapter 15 explains that retained selection. | Retain direct fact in its explanatory paragraph. |
| 127 | SHORT(5) | CODE finds a pending piece. | Retain direct fact in its explanatory paragraph. |
| 127 | SHORT(6) | Chapter 22 explains storage and recall. | Retain direct fact in its explanatory paragraph. |
| 133 | SHORT(5) | Pending pieces retain that origin. | Retain direct fact in its explanatory paragraph. |
| 133 | ECHO(byte/bytes) | Typed input uses CODE, the maximum-length byte, followed by CODE and 128 bytes at CODE. | Retain exact defined-term relation. |
| 153 | SHORT(4) | Other pieces enter CODE. | Retain direct fact in its explanatory paragraph. |
| 153 | ECHO(starts/start) | It starts a new output line and calls CODE to store the word's start in CODE. | Retain exact defined-term relation. |
| 159 | ECHO(zero/zeros) | CODE clears all 36 bytes of the destination FCB: zero drive, eleven spaces for name and type and zeros for the remainder. | Retain exact defined-term relation. |
| 189 | SHORT(6) | Other installation failures reach CODE (CODE). | Retain direct fact in its explanatory paragraph. |
| 189 | SHORT(4) | Chapter 24 describes installation. | Retain direct fact in its explanatory paragraph. |
| 232 | SHORT(5) | The default drive stays unchanged. | Retain direct fact in its explanatory paragraph. |
| 242 | CLAUSES(0+3) | CODE takes its dimensions from CODE and CODE or uses 24 rows and 80 columns for serial. | Retain necessary condition or ordered operations. |
| 242 | SHORT(6) | It reserves a row for CODE. | Retain direct fact in its explanatory paragraph. |
| 242 | SHORT(6) | CODE and CODE drop the chain. | Retain direct fact in its explanatory paragraph. |
| 242 | SHORT(4) | Other keys continue (CODE). | Retain direct fact in its explanatory paragraph. |
| 242 | SHORT(6) | Chapter 21 explains the chain distinction. | Retain direct fact in its explanatory paragraph. |
| 254 | SHORT(5) | It then closes the file. | Retain direct fact in its explanatory paragraph. |
| 261 | SHORT(4) | Return alone cancels deletion. | Retain direct fact in its explanatory paragraph. |
| 261 | SHORT(6) | Other patterns delete without that question. | Retain direct fact in its explanatory paragraph. |
| 268 | ECHO(drive/drives) | The names share a drive from either reference and different explicit drives are rejected. | Retain exact defined-term relation. |
| 268 | SHORT(6) | A match gives CODE before mutation. | Retain direct fact in its explanatory paragraph. |
| 299 | SHORT(4) | SAVE reads the TPA. | Retain direct fact in its explanatory paragraph. |
| 299 | ECHO(loading/loaded) | Loading a COM program or a service overwrites that memory, including a GLCD service loaded by CON (CODE, CODE, CODE, CODE). | Retain exact defined-term relation. |
| 320 | SHORT(6) | The historical PICO capture shows both: | Retain direct fact in its explanatory paragraph. |
| 346 | SHORT(4) | Otherwise serial remains selected. | Retain direct fact in its explanatory paragraph. |
| 364 | CLAUSES(0+3) | It opens the source, erases and makes the destination and transfers records through functions 20 and 21. | Retain necessary condition or ordered operations. |
| 364 | ECHO(counts/count) | CODE counts records and CODE prints the count in hexadecimal through the console's CODE. | Retain exact defined-term relation. |
| 382 | SHORT(6) | No system attribute is required (CODE). | Retain direct fact in its explanatory paragraph. |
| 388 | SHORT(5) | Carry and zero mean missing. | Retain direct fact in its explanatory paragraph. |
| 388 | SHORT(6) | CODE returns the latter failure immediately. | Retain direct fact in its explanatory paragraph. |
| 388 | NEG(2) | The CCP retries drive A only after absence on the first drive, when no drive was explicit and the current drive is not A. | Retain all three restrictions on fallback to A. |
| 423 | SHORT(5) | EOF means an exact fit. | Retain direct fact in its explanatory paragraph. |
| 440 | SHORT(6) | ARGS has the complete listing below. | Retain direct fact in its explanatory paragraph. |
| 495 | SHORT(5) | A successful load reaches CODE. | Retain direct fact in its explanatory paragraph. |
| 495 | ECHO(parses/parse, argument/arguments) | It parses the first two argument references into the FCBs at CODE and CODE, ignoring parse errors for those program arguments. | Retain exact defined-term relation. |
| 495 | SHORT(6) | Function 26 restores DMA to CODE. | Retain direct fact in its explanatory paragraph. |
| 495 | ECHO(space/spaces) | The tail includes the initial space and any spaces before the piece's separator. | Retain exact defined-term relation. |
| 564 | ECHO(bytes/byte) | CODE prints eleven name/type bytes and CODE uses the length byte at CODE. | Retain exact defined-term relation. |
| 587 | SHORT(6) | CODE retains its space before CODE. | Retain direct fact in its explanatory paragraph. |
| 600 | ECHO(byte/bytes) | The source reserves a 32-byte CCP stack, leaving thirty bytes below that return word. | Retain exact defined-term relation. |

These are editorial checks only. The full attempt02 batch remains failed at a
later CPU-flag observer. The closed opening workflow receipt and chapter reviews
do not qualify advanced services, a physical board, browser operation, audio or
publication. No product import, syntax check, assembly, build, test, model
session or capture was performed for this adoption.

Editorial utility identities and stable reader run:

- prose gate script SHA-256: `0fb52353cf22dc3a1a079c819f9d7df174a1961084689b946857747b5862ee66`.
- complexity script SHA-256: `59ef44ca92c947b97c8f73a6e425cb3c3b321190f0f892590c25190300d286a8`.
- six-reader gate output SHA-256: `37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570`.
- six-reader complexity output SHA-256: `8644f5011f76f6362b414753452a28f7a6ad2f8b0d826850666fda7d5833a08e`.

Record-only complexity prompts retain historical identifiers, unit accounting
and audit scope. They do not require shortening the reader text. The earlier
record sections remain evidence of their dated editorial work.
