# Chapter 27 pass record

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
