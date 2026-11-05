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
