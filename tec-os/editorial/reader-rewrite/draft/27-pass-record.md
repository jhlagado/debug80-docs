# Chapter 27 pass record

Current mechanism authority is TEC-OS `962853f499f05faf281f6cdff1deca8959f58c2b`.
The selected-source adoption section at the end records the current correction
and supersedes earlier source/profile holds. Earlier sections preserve the
initial ea3 audit and its historical evidence accounting. Their old coordinates
remain scoped to that initial audit rather than silently repinned.

## Scope and authority

The draft is `27-diagnose-the-machine.md`. Its final path is
`tec-os/27-diagnose-the-machine.md`, as recorded for chapter-27 in the
revision ledger. The draft's job is to interpret a card failure and explain
safe use of the separate diagnostics ROM and its report. The reader has
prepared a working configuration and encountered storage failures, boot
and the model/board distinction.

The closed outline checkpoint is `0e4feea`. I read the complete replacement
outline and its closure dispositions before drafting. Placement follows all
47 destination-27 units in movement-units.json at book base
`10821b68f80c10d2037bbd1c5ab207877c897c68`. There are no destination-27
fragment overrides. All assigned material comes from old
`tec-os/26-diagnostics.md`, which I read from its front matter through its
last board/model interpretation. The chapter's reverse-outline notes,
reading plan, source-question dispositions and separate design question
were also read.

Source authority is TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. All product inspection used
Git text at that exact pin. No module was imported and no product command,
build, test, capture or hardware operation was performed. Source inspection
does not upgrade the retained output to the offered revision.

I applied human-writing and teaching-prose-review, including the revision
playbook, pattern catalogue and teaching/craft references. The complete book
STYLE.md governs the second-person voice, terminology and evidence labels.
Only this record and the Chapter 27 draft are owned by this change. The
original chapter, shared ledgers and other writers' files remain untouched.

## Preservation and movement

Every range below is a complete controlling movement unit unless grouped
with adjacent units. Headings identify the corresponding draft sections.

| Original range | Destination and disposition |
| --- | --- |
| 1–6, 8 | Replace front matter and number/title with the ledger's Chapter 27 destination. |
| 10–11 | Preserve the original checked-at comment, diagnostic version 0.2 and image D90143609F53FAAB exactly. |
| 13–15 | Replace the old partial-citation comment with the explicit ea3ef3d source-only boundary. Retain the old fe2097f citation-pass identity in that comment. |
| 17–22 | Replace the route announcement and unbounded “everything else” assertion with the practical card/board distinction and finite test scope. |
| 24 | Retain “The diagnostic prompt”. |
| 26–37 | Separate the visible error from boot ordering. Keep all error ranges, banner order, RAM/console/clock checks and RAM-failure text. |
| 39–44 | Explain CARD? and hexadecimal output first, then the known BDOS-stack state after the practical retry. |
| 46–57 | Retain original-case echo, R/r retry, other-key behaviour and PICO/matrix versus serial/LCD routing. |
| 59, 60–65 | Preserve the capture recipe and complete no-card PICO output unchanged. |
| 67–71 | Retain LCD clearing, SDINIT/MOUNT retry, insertion without reset and fresh table reads. |
| 73–80 | Retain recognised-reset volume selection, RSLCAP/RSLBUF, fixed 0100h scratch, EXPAND-1 clear/table storage and Chapter 15/Appendix D references. |
| 82 | Retain “The diagnostics ROM”. |
| 84–86, 88–90 | Retain the separate 16 KiB replacement image, independent startup and exact build command. State that the SD tests still need a card. |
| 92–94 | Preserve the complete historical build output, explicitly introduced as 78127ec evidence. |
| 96–104 | Retain generated configuration/font, shared font source, serial derivation, TAS default/ATOM selection, padding and all output artifact names. |
| 106–112 | Retain image-ID derivation, blanked range, stored address, banner/report identity and separate checksum/T05 comparison. |
| 114–119 | Retain every entry, overlay-window, CODEEND, variable and NMI-handler build check. State the exact inclusive CODEEND bound. |
| 121–127 | Retain overlay entry/removal, immediate RETN, output shutdown, SD deselection and fixed variable/stack ranges. |
| 129 | Retain “The run”. |
| 131–142 | Retain four stackless T01 passes, complete failure-message fields, indefinite repetition and delay arithmetic. Mark the count as static and the seconds as nominal-clock conversion. |
| 144–152 | Retain variable clearing, NMI counter, Matrix switch, banner, five-second selection, automatic fallback, all three key sources, timeout units and four keypad translations. |
| 154–162 | Retain headings, seven-character names, result-line construction, report-buffer copying and LCD result/totals. Name the four totals actually displayed. |
| 164–171 | Preserve the full six-result table unchanged. |
| 173–177 | Retain PICO/matrix, empty SYSTEM/WORK model card, absent RTC and kept report location. Add the explicit distinction from the real starter and cached-report reuse. |
| 179–184 | Preserve the complete modelReport reproduction recipe unchanged. |
| 186, 188–203 | Retain the exact historical report filename and whole introductory excerpt, including leading blank lines. |
| 205 | Retain “The tests”. |
| 207–212 | Retain automatic order, T35/T36 and T37 placement, delayed RAM-result reporting and both interactive entry routes. |
| 214–252 | Preserve all 37 test identities, order and titles unchanged. Keep title-definition source ranges in a comment beside the table. |
| 254–263 | Retain diagnostic/production serial, SD and PICO relationships and every RAM/overlay/status dependency. Qualify the SD-sequence comparison against the actual validation branches. |
| 265–268 | Retain sole SD writer T37, magic gate, block 7 and restoration. Qualify restoration failures and distinguish volume payload from descriptor-table space. |
| 270 | Retain “The report”. |
| 272–277 | Retain report structure and literal R/I prompt. Introduce the complete report as historical model evidence. |
| 279–313 | Preserve the complete report fence unchanged, including all values, addresses, measured results, LOOK/NONE and totals. |
| 315–326 | Retain all three model/document differences and their hardware descriptions. Keep shadow latch 0040h, bit-2 selection and overlay-write avoidance. Label circuit descriptions as expectations rather than observations. |
| 328 | Retain the board/model comparison heading. |
| 330–331, 333–347 | Preserve the complete seven-step board preparation recipe. Frame it as a prospective physical procedure, not a completed board run. |
| 349–355 | Retain keypad-generated NMI, overwritten 0066h handler, PROTECT's lost stack writes and normal TEC-OS jumper setting. Explain the counter handler's normal return before its failure conditions. |
| 357–358, 360–362 | Retain complete terminal-log preservation and the exact comparison command. |
| 364–376 | Retain image mismatch status 2, result/detail comparison, visual PASS/LOOK equivalence, all measured-line categories, dependency descriptions and statuses 0/1. Add exact limits for unpaired tests and cut-short logs. |
| 378–384 | Retain T08/T10 non-dependence, T12/EXPAND-1/T13 connection and RAM/overlay/bank/serial/card/device interpretation. End with the report tied to board configuration and image ID. |

All seven fenced blocks are byte-identical to the original chapter. The
capture command, six-result table, 37-test table and seven-step board recipe
also match exactly. No example, recipe, diagnostic identity or output line
was shortened, replaced by a cross-reference or converted into a new result.

## Source readings and concrete corrections

I read the owning instructions and relevant callers rather than updating
line numbers by textual similarity. The complete diagnostic build and
comparison scripts, diagnostics boot/main/definitions and pertinent output,
memory, display, SD, miscellaneous and interactive routines were inspected.
The normal boot, console, mount, layout and reselection paths were read where
the chapter uses their state or caller contracts.

| Claim | Source at ea3ef3d and support |
| --- | --- |
| Card error and stack | `src/boot.asm:119-132`, `802-847`, `src/text.asm:13-15`, `src/lcd.asm:77-92`: COLDRT sets STKTOP and calls SDINIT/MOUNT before jumping to DIAG. DIAG displays the error and echoes before masking for R. |
| Pre-card checks and console | `src/boot.asm:71-102`, `579-632`, `src/console.asm:57-88`, `src/video.asm:22-29`, `src/pico.asm:64-86`: required RAM precedes the banner and card operations. PICO activation requires the matrix keyboard. |
| Retained selection and uncached table | `src/boot.asm:59-69`, `296-303`, `321-346`, `src/layout.asm:166-174`, `src/vol.asm:56-65`, `477-529`, `src/volsvc.asm:1-37`: the fixed scratch copy survives EXPAND-1 initialisation. MNTCB starts FFh and an older cached line is refilled from card. |
| Build selection, files and checks | `tools/diag.mjs:37-77`, `90-143`: generated timing/font inputs precede the selected assembler. Bounds are tested before image files are written. CODEEND <= ROMID permits equality, so “must end below” was tightened to the actual boundary. |
| Diagnostic identity and checksum | `tools/diag.mjs:25-28`, `83-88`, `124-130`, `diag/out.asm:108-117`, `737-743`, `diag/memory.asm:200-232`: blanked-image SHA prefix and additive checksum have different purposes and ranges. |
| Reset and first usable RAM | `diag/boot.asm:8-73`, `diag/defs.asm:43-44`: overlay removal and RETN installation precede the register-only home-page proof. |
| T01 failure interval | `diag/boot.asm:75-128`: the stackless message repeats through HCWAIT. The inner total is 26 × 65,536 − 5 per pass. Sixteen passes plus LD/DJNZ/JR overhead give 27,263,278 T-states. This is static arithmetic, not a captured duration. |
| Selection and report construction | `diag/main.asm:4-119`, `diag/out.asm:241-326`, `49-62`, `592-615`, `637-789`: key translation, display rows, bounded recording, reprint and interactive entry agree with the prose. |
| Test scope and order | `diag/main.asm:43-119`, `diag/memory.asm:99-156` and every table title's owning TBEGIN: RAM work precedes recording, then the saved results and ordered device calls are emitted. The finite suite does not cover every possible board fault. |
| Diagnostic/production SD difference | `diag/sd.asm:115-212`, `src/sd.asm:215-371`: both use the named initialisation commands, but only the production path shown checks CMD8 voltage/pattern and CMD55's accepted status before continuing. “Same sequence” does not imply identical validation. |
| Display probe and page select | `diag/display.asm:334-372`, `751-803`, `src/tms.asm:17-48`: the two-pattern probe and diagnostic page alternation establish the stated relationship. |
| T37 scope and failures | `diag/sd.asm:616-730`, `src/vol.asm:303-316`, `format/format.json:43`, `tools/lib/container.mjs:33-42`: block 7 is outside aligned volume payloads. A format-1.1 table can still occupy it. Magic alone is the diagnostic guard. Successful restoration is checked, with explicit failure exits. |
| Report reuse and model configuration | `tools/diag-check.mjs:110-134`: modelReport reuses a kept log by image ID or runs a PICO/matrix machine with 76h RAM, an empty G1M/G8M card and rtc:false. It does not run on the shipped starter contents. |
| Model/document differences | `diag/memory.asm:259-447`, `489-658`, `docs/diagnostics.md:141-163`, `184-198`, `src/layout.asm:26-39`, `81-90`, `src/boot.asm:49-70`: the recorded model answers and documented expectations remain distinct. TEC-OS uses its shadow latch and bit-2 EXPAND selection. |
| NMI hazards | `diag/main.asm:125-145`, `diag/memory.asm:99-107`, `347-372`, `diag/misc.asm:587-607`: the counter assumes intact code and writable stack storage. RAM patterns or PROTECT defeat that assumption. Product cold clearing and page-zero vector installation do not create a 0066h NMI handler. |
| Comparison boundary | `tools/diag-check.mjs:36-47`, `49-62`, `82-107`, `136-159`: the last report is compared. Numeric form matches are accepted, board-only tests are listed separately and an absent end marker is a warning. Only a nonempty differences list determines status 1 after identity validation. |

The source-coordinate check covered 140 inline/shorthand ranges across 26
files at the exact pin, including the title-definition comment. Every range
is in bounds. Bounds checking supplements the semantic readings above and
does not certify a runtime result. The new Chapter 26 and 28 links use the
final paths from the ledger. Existing Appendix D/G and Chapter 15 links are
retained. Their whole-book integration remains separate.

## Revision passes

| Pass | Disposition |
| --- | --- |
| Generous draft | Completed the whole chapter before sentence editing, with all 47 movement units accounted for. |
| Thematic/teaching order | Put visible card error, available input and retry before internal stack/buffer proof. Introduced the separate image before identity checks, then first usable RAM, result vocabulary, complete scope, report and physical comparison. |
| Paragraph deletion | Removed the original syllabus ending and unbounded hardware-coverage promise. Moved dense title-coordinate evidence into a comment so it does not interrupt the test list. No independent technical material was removed. |
| Sentence deletion | Read every sentence in order within and across paragraphs. Kept the short console, retry, variable-bound and timing statements because each supplies a distinct operation or limit. Retained historical and model/board qualifications because their removal changes the evidence claim. |
| Agency/plainness | Replaced the old broad claims with named operations. Routines read, echo, compare, store and wait. People correct cards and collect reports. Documented circuit expectations remain attributed to the documents. No artifact receives interior or social agency. |
| Every comma/punctuation | Read each paragraph and punctuation-bearing passage in order. Removed optional commas before then, after introductory success/T01 clauses and before the restoration conjunction. Preserved list separators, apposition and exact interface punctuation. Recipe, table and capture punctuation remains literal. |
| Technical/literal | Rechecked source ownership, ranges, entry/layout bounds, magic versus full validation, restoration failure paths and exact comparison exit conditions. Compared every retained fence and both tables with the original. |
| Journey read-back | Read from the opening through the final configuration/image-ID condition. The practical retry is usable before implementation detail. The report vocabulary precedes the long report. Physical procedures and NMI hazards are explicitly prospective and the last paragraph ends on the evidence boundary. |
| Mechanical gates | Ran the text-only prose gate and sentence-complexity report, then explicit vocabulary/agency/punctuation searches. Initial coordinate-comment wording was rephrased. Remaining short sentences carry the concrete results or cross-references listed above. Table/list and historical literal flags are retained deliberately. |

The chapter's final prose gate has zero findings. The complexity report is
approximately 12 words per sentence with fewer than one clause joint per
sentence. Its remaining flags include literal procedure/table material and
the long source-coordinate comment, not an instruction to alter captured
text. No execution evidence was produced by these text checks.

## Review status

This is a review-ready draft with its own complete craft and source-only
passes. Independent editorial and factual reviews remain open. Final
reader-order navigation and complete-book acceptance remain with the lead.
No new diagnostic build, current-pin model result, board observation or
publication is claimed. The preserved historical header and output remain
at 78127ec even though the implementation citations now refer to ea3ef3d.

## Independent Chapter 15 navigation correction

The Chapter 15 review supplied the final anchors. The RAM-check link now uses
`15-reset-and-boot.md#ram-before-the-workspace` and the recognised-reset link
uses `15-reset-and-boot.md#retained-drive-selection`. Both were read in their
containing Chapter 27 paragraphs. Only those two link fragments changed in the
chapter. No source citation, prose claim, recipe or historical output changed.
Full independent Chapter 27 review remains pending. No execution was performed.

## Independent review and punctuation disposition

The full independent review at6c78f45 cleared factual, preservation, agency
and reader-journey checks across all47 assigned units. Image/checksum/report
bounds, prompt/retry, preparation, NMI hazards and comparison limits were
checked against offered source. Seven fences, two tables and the seven-step
setup retain their exact historical text.

Accepted the five optional commas before so in editable prose. Removed only
those commas and reread each causal sentence. Literal procedures, tables and
output are unchanged. No runtime work was performed. The bounded review has
no remaining finding. Final source/runtime qualification and navigation
remain separate.

## Matrix-switch condition correction

Source cross-check at ea3ef3d console82–88 and pico64–86 distinguishes
PICO response from keyboard enablement. Cold boot reads the Matrix switch
bit into CONDEV. It does not probe a keyboard response. The prose now uses
responding PICO plus Matrix switch enabled, replacing presence/answer wording.
This is a source-backed condition correction, not physical detection evidence.
No execution or literal-output change occurred.

## Selected-source adoption at 962853f

Book selection 9ba1f59 authorises current mechanisms at TEC-OS
`962853f499f05faf281f6cdff1deca8959f58c2b`. The tested source is
`8b8664a7d93c6dc2e8bce509b9770585e106eedc`. The latter differs from the
adopted descendant only in the two KS48 qualification records. Proposal 18's
qualified offer and independent result receipt remain Origo 43d5f328.
Opening workflow receipt 4b5b5a50 and complete opening reviews d9d57d2/b911e84
close their bounded scopes. They do not certify a browser or physical board.
The opening batch remains FAILED globally at its later observer.

I read both source-adoption impact records, all 35 contexts, 29 proof spans
and nine historical exceptions. I read this entire reader file and its full
existing pass record before editing. The actual ea3-to-962 executable diff
was read with the complete owning build, media, font, startup and fixture
functions. Unchanged cited spans were compared byte for byte with the prior
semantic audit and read against their containing claims. Diagnostic, ROM,
host and browser source contexts were inspected as Git text. No source
identity comparison is a runtime result.

The adopted diagnostic build validates the font package before generated
writes or assembly. Its separate FONT-NOTICES companion is now named beside
its ROM, D8 and JSON outputs. The complete build function confirms entry,
overlay, variable and NMI bounds before output writes. Image-ID blanking and
the additive checksum keep their distinct ranges. T17 still selects supported
80-column mode rather than the main ROM's raw cold 40. The title definitions,
all test meanings, report comparison and prospective board procedure retain
their source contracts. Historical D90143609F53FAAB and checksum 47C0 remain
attached to the original 78127ec image and report.

This correction applies the owned IM028 disposition.

### Citation coverage

All 142 current reader range occurrences across 27 source files
were reconciled before changing the mechanism header. The table includes
shorthand ranges in their owning file. The earlier sections of this record
keep the original ea3 audit coordinates under that explicit scope. This new
table uses only 962853f. Bounds and byte correspondence supplement the
mechanism readback, not an execution claim.

| Source | Adopted ranges | Exact Git blob | Comparison with ea3 |
| --- | --- | --- | --- |
| `src/boot.asm` | 49–70, 59–69, 62–69, 71–102, 80–86, 100–102, 119–132, 296–303, 321–346, 454–509, 579–632, 802–829, 817–829, 831–847, 844–845 | `72ecb78d7c78eb1ceda36f3a2834dd7fcdd056cf` | same blob |
| `src/text.asm` | 10, 13–15, 14 | `e710401c8301070bcd349d81ed19ccb288497271` | same blob |
| `src/lcd.asm` | 77–92 | `661881a1f37d2334b9b7c82b37f7dbdfca860246` | same blob |
| `src/sd.asm` | 15–30, 215–371 | `c638fee15406c0a593bc4bfde4306dfbf1967c08` | same blob |
| `src/vol.asm` | 22–42, 44–65, 56–65, 303–316, 477–529 | `7b3dfc3cfcfd956cf1fa6622d82074eccee89d94` | same blob |
| `src/console.asm` | 28–39, 57–88 | `1ee8fe3916d2913ac86778aba5d796725ddc8ef4` | same blob |
| `src/video.asm` | 22–29 | `a1ccc60ccc32ca0b0f35be8de70d6ae4b1ce43ee` | same blob |
| `src/pico.asm` | 69–92 | `0c49c294fc3199b619a994394d1b2b4192d17d0b` | changed source read |
| `src/layout.asm` | 26–39, 81–90, 166–174 | `498fc7e74fc909b06dd8a0f1dfafc76c354c955a` | same blob |
| `diag/diag.asm` | 1–14 | `ecff05688883850cd4d9f9441119430eb3bfe2f2` | same blob |
| `diag/boot.asm` | 8–27, 8–40, 29–40, 43–73, 75–128, 118–125 | `8b386b7efd7dd488e787ef2c96049e1c482ef01e` | same blob |
| `diag/sd.asm` | 115–212, 310–311, 310–322, 451–452, 616–683, 622–623, 663–730 | `950e0222f14fe0a1a3ebd6f7a49394f32f3e233e` | same blob |
| `tools/diag.mjs` | 26–29, 38–50, 52–78, 84–89, 91–146, 103–110, 117–125, 126–128, 129–132 | `3f2306ef776bc7f085f04af2e4a1ae975dd3d724` | changed source read |
| `tools/lib/font-package.mjs` | 8–21 | `b7d6950480d5ef1f2bf7216c1b0bc637c4fd34a9` | changed source read |
| `diag/out.asm` | 10–28, 49–62, 108–117, 241–326, 592–615, 635–658, 637–658, 663–716, 694–703, 706–711, 737–743, 737–789 | `014f2811c09b1b8ba860097effe69882f978bc42` | same blob |
| `diag/memory.asm` | 99–107, 99–114, 99–156, 145–155, 200–232, 200–260, 259–343, 316–343, 316–351, 347–372, 404–447, 404–454, 449–484, 489–563, 489–658, 501–502, 600–601, 600–658 | `84d6039ed79de6a2beb53608e7c7cd76a576f89f` | same blob |
| `diag/defs.asm` | 41–42, 43–44, 50–56 | `ba8dd77c684adcfd789d12a9b77b9afe9658dd0d` | same blob |
| `diag/main.asm` | 4–28, 29–45, 43–64, 56–62, 56–87, 88–119, 91–106, 125–145 | `08b81df751c27d1dbb1ccc2f08e00476bcad3de5` | same blob |
| `tools/diag-check.mjs` | 36–47, 49–62, 65–73, 82–107, 87–106, 96–104, 104, 110–134, 136–152, 153–159 | `80199ab2d7dd81b12a62d34a8ba002108d96c514` | same blob |
| `diag/display.asm` | 5–6, 54–55, 241–242, 334–372, 349–350, 662–663, 751–803, 756–757, 816–817 | `575a9b291d33b3fbeeb6988019d487762155be12` | same blob |
| `diag/misc.asm` | 45–46, 440–441, 494–495, 561–562, 587–607, 590–591, 618–619 | `45eedf9fe14b37075949949a7b3432943e4f61d5` | same blob |
| `diag/interact.asm` | 45–46, 104–105, 213–214, 329–330, 367–368, 509–510, 626–627, 671–672 | `37533628135bf5c3b1c655d63926fdacc3e4b2f6` | same blob |
| `src/tms.asm` | 17–48 | `01f872eb66902656bac87ba894b02f6ea2001c9a` | same blob |
| `format/format.json` | 43 | `abf1f9c5448c2bc6b752f1e6ccc721c88d20897c` | same blob |
| `tools/lib/container.mjs` | 33–42 | `5c573781df4dc4c24846aef010b5f226354d71b3` | same blob |
| `docs/diagnostics.md` | 141–163, 184–198 | `02f04d493514a82d74451b15f3cc4692b2e0ef41` | same blob |
| `src/cpm/ccp.asm` | 22–23 | `c58d5f68af74e135df58d7709c5b5794524ed33a` | same blob |

The current native offer remains ROM
`fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d`
and D8
`9a87dec39a63efc8fdf38ae13d6ec6299763c833fc891de121e2b30f4a1a36ac`.
These existing qualified identities remain the offer authority. Native 16020
used and 364 free already occur in the ea3 memory-map account. No change
from historical 16018/366 is attributed to font growth.
Equal map addresses do not transfer historical provenance.

### Preservation and craft

All 7 reader fences and the capture comment match the
input byte for byte. This includes their whitespace. Source listings,
recipes, measurements, maps, hashes and build or screen output were not
rewritten. Existing historical pins remain explicit. The protected digest
below joins complete blocks with a single LF separator.

| Identity | SHA-256 |
| --- | --- |
| Reader input | `5cccb106ea47bcff10d91ad9b0ef23b8873718381bbb77e2e916c2113a30e1d1` |
| Reader output | `6e1f9a27a0edcbedf0d36dd1c6aaed0fc9fa664051db2b8cb9e7a3986a5f96ef` |
| Protected fence aggregate | `eecd590dbecd13adf2c9dcbe5171143bb9e9907e4e7dda0443175f0f4f1d6bfe` |

The intervention is a mechanism/citation correction within the existing
route. Separate thematic and deletion passes kept preflight before generation,
normal operation before failure and each historical example under its own
provenance. Each changed sentence was read within its full paragraph or table
row and across the next boundary. Agency and every-comma passes retained
necessary lists and exact interface punctuation. The reader-order pass kept
the practical prerequisites and the existing ending. No example was replaced
with a source assertion or an invented result.

This adoption closes the owned current-source hold only. Independent adoption
review, whole-book reconciliation and publication remain separate. No product
import, syntax check, assembly, build, test, model, capture, browser action,
physical operation or new runtime allocation occurred.

### Editorial gate dispositions

The actual mandatory prose gate and sentence-complexity report ran on all eight
owned files. These are inert editorial checks. No hard gate finding remains.
The five review flags were read in their complete contexts and retained:

| Gate location | Disposition |
| --- | --- |
| 26 record line 183, columns 134 and 352 | Two matches in the initial agency-pass explanation. It denies interior agency and records a removed attribution. It does not assign that agency to a program. |
| I reader line 123, column 23 | The word refers to interface messages as a plural noun, not an act of perception. |
| I record line 29, column 24 | The same plural noun identifies source-defined interface messages in the initial audit. |
| I record line 66, column 217 | The main script appends bracketed interface messages. This is an output operation. |

The reader's short prompts state console fallback, actual key/serial results,
retry, bounds and source-versus-timing scope. The buffer sentence retains the
reason fixed RAM survives the cache clear. The long title comment is citation
metadata. The repeated block term distinguishes card units from payload alignment.
The procedure fragments come from the unchanged physical recipe. Initial-record
prompts retain the original audit history. New short source and preservation
statements identify the tested pin and the protected whitespace. The receipt
sentence retains the specific review IDs.

Every complexity prompt was used for a sequential reading decision. The report
also splits code spans, metadata and list continuations into apparent short
sentences. Those fragments were judged in their complete paragraphs or rows.
The initial audit was preserved rather than rewritten for a score. The final
changed-passage readback confirmed prerequisites, exceptions and provenance.
