# Chapter 22 pass record

## Scope and authority

The draft is `22-the-history-ring.md`. Its job is to explain bounded history
storage and traversal after practical recall has already been introduced.
The reader has used `^W` and `^N`, read BDOS line-input code and encountered
the bank window. The chapter derives complete-entry retention, insertion and
recall from the two adjacent zeros. It ends with the different warm-boot and
reset lifetimes.

The closed outline at `0e4feea` and its recording at `3060e71` precede this
prose. `replacement-outline.md` and the destination-22 records in
`movement-units.json` govern placement. The movement map's book base is
`10821b68f80c10d2037bbd1c5ab207877c897c68`. The reverse outlines supply the
original paragraph jobs. Source authority for this draft is TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`.

I have written only the new chapter and this record. The root chapter,
movement map and shared ledgers are unchanged. No product code was run and
no build, test, capture or fixture import was performed. No new output is
inferred from the current source.

## Complete reading

- The complete human-writing skill and its revision playbook and pattern
  catalogue were read before drafting.
- The course-writing skill, banned-pattern reference, reader model and review
  checklist were read alongside the book's complete `editorial/STYLE.md`.
  The book's later-chapter prerequisites govern reader knowledge. Its
  substantive ending takes precedence over the course template's summary.
- The complete replacement outline, reading plan and separate design question
  were read. No product-policy work is included.
- Every controlling movement unit whose destination is 22 was read, including
  the old Chapter 3 capacity/lifetime paragraph at lines 653–656.
- Old `22-command-history.md` was read from front matter through its final
  reset interpretation, including all five recipes and fences.
- The complete old Chapter 3 history passage was read, together with its
  Chapter 3 reverse-outline notes and the complete Chapter 22 notes. Only the
  assigned capacity/lifetime paragraph from Chapter 3 is moved here. The practical
  recall lesson and its separate capture retain their earlier destination.
- The source-question dispositions were read. None authorises new execution
  evidence or a change of console policy.

## Preservation and movement

Ranges below are the source ranges in the controlling map at its book base.
Each row accounts for complete units unless a particular sentence is named.
The destinations are headings in the new Chapter 22.

| Original source and range | Destination and disposition |
| --- | --- |
| 03:653–656 | Combine capacity with “A page of whole lines”, duplicates/startup exclusions with insertion/input and warm/reset lifetime with the last section. No technical clause deleted. |
| 22:1–6, 8 | Replace navigation/title with “The history ring” at number 22. |
| 22:10–14 | Retain all historical ROM, TED and TAS identities/hashes in the capture-provenance comment. It does not certify the new source prose. |
| 22:16–18 | Replace the earlier partial-citation ledger comment with the explicit source-only `ea3ef3d` scope. Retain the old capture pin separately. |
| 22:20–24 | Replace the route announcement with the concrete bounded-storage problem. Retain page size/address and source ownership in the first two sections. |
| 22:26, 28–35 | Move recall behaviour to “Recall in the line buffer” after storage and insertion. Combine its key/editing rules with the HPOS derivation. Remove the obsolete practical Chapter 3 link and duplicated prompt-lesson introduction. |
| 22:37, 38–47 | Retain recipe and complete first PICO recall fence unchanged under traversal. |
| 22:49–53 | Move erase-byte explanation and shell/recipe notation after that traversal capture. |
| 22:55, 57–60 | Retain HRING placement in “A page of whole lines”; explain private line-input routines in “Access through the bank window”. Qualify the original absolute page-access statement as the absence of a dedicated history entry. |
| 22:62–67 | Retain bank/latch/interrupt/stack contract in its own connected access explanation. Correct HPUT's write-plus-readback detail. |
| 22:69–73 | Retain low-byte wrap, string-plus-zero format and HHEAD in “A page of whole lines”. |
| 22:75–80 | Retain adjacent-zero/empty-entry invariant before insertion/traversal. Delete only the empty certification “Everything else in this chapter rests on that rule.” |
| 22:82, 84–90 | Rewrite as “Lines from the prompt”: CCP source priority, HFLAG and nonempty completion. |
| 22:92–96 | Retain consumption/abandonment clearing and program-input exclusion in the same section. |
| 22:98–104 | Retain whole-chain punctuation, per-piece/function-47/startup exclusions and initial empty history in the same section. |
| 22:106–108 | Retain original-case storage before MLTAKE, immediately before its capture. |
| 22:110, 111–117 | Retain lowercase `con` recipe and fence unchanged in the input section. |
| 22:119–128 | Split into NUL rejection, HSTART scan and exact duplicate comparison in “Insertion and the oldest line”. Retain equality of both bytes and length. |
| 22:130, 131–142 | Retain duplicate/oldest-stop recipe and complete fence unchanged after the comparison. |
| 22:144–152 | Retain forward writing, terminator, advanced head, partial-entry removal and already-zero case. Explain the consequence before the cleanup loop. |
| 22:154–156 | Move byte costs and maximum line length to the first section, where they establish variable capacity. |
| 22:158, 160–164 | Retain key values, HFLAG branch, ordinary program characters and continued line input under traversal. |
| 22:166–169 | Retain HPOS terminator definition and per-call HHEAD initialisation at the traversal section's start. |
| 22:171–181 | Rewrite the two directional bullets as connected paragraphs. Preserve every pointer step, empty boundary and unchanged-line return. |
| 22:183–189 | Retain LINERASE, `^X`, counted/echoed copy up to LINMAX and subsequent editing. State that an oldest-line `^W` preserves edited input too. |
| 22:191, 193–198 | Retain warm-preserved ring/head and cleared per-read state in “Warm boot and reset”. |
| 22:200, 201–208 | Retain Ctrl-C/warm-boot recipe and complete fence unchanged. |
| 22:210–217 | Retain workspace and EXPAND-1 cold clears, zero/FF boundary and recognised-reset drive-only retention. |
| 22:219, 220–232 | Retain reset recipe and complete fence unchanged. |
| 22:234–235 | Retain the first backwards zero test and empty-line result as the substantive ending. |

No example is deleted, shortened or replaced by a cross-reference. No
algorithm, limit, exclusion or lifetime rule is dropped. Headings and
syllabus-style transitions are rewritten where the new teaching order
requires them. The bank-rule link uses Chapter 14's final path from the
revision ledger, `tec-os/14-state-and-memory.md`, with its draft's
`expand-1-and-the-stack-boundary` anchor.

## Source proofs

Every range in this table is from the offered `ea3ef3d` revision and was read
with its instructions and callers. The draft's inline ranges use that same
pin. These are source proofs, not fresh execution results.

| Claim or operation | Exact source and reasoning |
| --- | --- |
| Ring page, format and stop invariant | `src/history.asm:9-24`, `223-250`: fixed BD00h, character/zero entries, advancing low byte and cleanup through an existing zero establish the adjacent-zero boundary. |
| Head versus per-read state | `src/ram.asm:249-252`, `309-314`, `367-371`: HFLAG/HPOS are below BDOSRME; HHEAD follows the RAM BIOS table. |
| Single-byte access | `src/history.asm:35-74`: HPUT saves A in B, writes at 57 then reads at 60; HGET branches past the write. BC/DE/HL are preserved and A returns the byte. |
| Bank and interrupt contract | `src/history.asm:46-74`, `src/bios.asm:428-439`, `src/layout.asm:39-40`, `81-90`: IFFGET records IFF2, pushes precede LATEXP selection, the latch is restored before pops and EI is conditional. |
| Private history operations | `src/tables.asm:89-97`, `104-132`, `src/cpm/bdos.asm:545-553`, `740-765`: recall/store are internal calls in FNLINE; no dedicated history entry is exported in those tables. This is not a claim that arbitrary memory access is impossible. |
| Eligibility and source priority | `src/cpm/ccp.asm:148-166`, `src/cpm/bdos.asm:477-481`, `504-531`, `740-765`: only keyboard acquisition sets HFLAG; LINDONE consumes it and calls HSTORE for a positive count. |
| Abandoned input | `src/cpm/bdos.asm:606-621`, `115-119`, `src/boot.asm:194-200`, `530-536`: empty-line Ctrl-C bypasses LINDONE but warm clear removes HFLAG before later input. |
| Whole chains and excluded input | `src/cpm/ccp.asm:148-166`, `src/cpm/bdos.asm:95-108`: pending pieces and startup precede keyboard input; function 47 copies CMDTXT then warm boots. None independently calls marked FNLINE. |
| Case ordering | `src/cpm/bdos.asm:764-765`, `src/cpm/ccp.asm:249-267`: HSTORE runs before BDOS returns; MLTAKE capitalises later. |
| Entry start and duplicate suppression | `src/history.asm:80-90`, `184-220`, `252-256`: HSTART uses the preceding zero; HSCMP rejects NUL before mutation and tests both difference count and terminal offset. |
| Fixed byte costs | `src/boot.asm:540-542`, `src/history.asm:226-237`: maximum 127 plus zero is 128 bytes; DIR's three characters plus zero are four. The empty-entry boundary also occupies a zero. |
| Overwrite without fragments | `src/history.asm:223-250`: character writes and new terminator precede head update; HSCLR zeros forwards through the first pre-existing zero. The oldest partial suffix cannot be selected after completion. |
| Recall initial position and key branch | `src/cpm/bdos.asm:49-50`, `454-457`, `499-502`, `545-553`: decimal 23/14 enter HREC only with HFLAG; other callers store these input codes ordinarily. |
| Backwards traversal | `src/history.asm:102-121`, `137-140`: HSTART finds the shown start; two decrements test the previous last character; empty means unchanged buffer, otherwise its terminator becomes HPOS. |
| Forwards traversal | `src/history.asm:123-140`: HPOS=HHEAD is an immediate return; otherwise the next zero selects the newer terminator, including the empty entry after newest. |
| Erase and replace | `src/history.asm:137-175`, `src/cpm/bdos.asm:699-729`, `src/cpm/bdoscon.asm:368-376`: erase empties LINPTR/LINCNT by BIOS backspace-space-backspace, then HRCOPY fills/echoes to terminator or LINMAX. |
| Editing after recall | `src/cpm/bdos.asm:472-575`: HREC returns to LINLOOP; the recalled buffer is edited with ordinary function-10 operations. |
| Warm lifetime | `src/boot.asm:178-215`, `530-559`, `src/layout.asm:50-58`, `src/history.asm:24`: CPMINIT's bounded clear excludes HHEAD and warm boot does not call MEMINIT; cache storage is below the history page. |
| Program and Ctrl-C exits | `src/cpm/bdos.asm:115-119`, `257-259`, `606-621`: FNZERO and CHDROP both use BIOWBT; neither writes history. |
| Reset and recognised reset | `src/boot.asm:73-79`, `100-102`, `296-303`, `321-346`: the retained copy is only DRVTAB; subsequent cold clears reset HHEAD and the entire EXPAND-1 page. |

## Capture evidence

The five capture recipe/fence pairs were copied byte for byte from the old
chapter. Their order is now lowercase storage, duplicate suppression,
backwards traversal, warm boot and reset. Their ROM pin remains `78127ec`.
The TED identity is Thorium `128edb7`, SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`.
The TAS identity is Thorium `dbee66a`, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.
The source-only pin is stated separately. The prompt counts, case, spacing,
reset banner and old STARTUP output are historical evidence throughout.
No new example or capture is needed for the draft's teaching job.

## Completed revision passes

The first durable draft and its source/movement record were committed and
pushed as `84a5b06`. The following passes were then applied to the entire
chapter, including the introductions and interpretations of retained captures.

| Pass | Actual disposition |
| --- | --- |
| Generous draft | Completed the whole explanation before sentence editing. All 41 assigned movement units were accounted for: 40 from old22 and the assigned paragraph from old03. |
| Mechanical gate | Zero findings on the generous draft. Repeated after the revision and before each prose commit. |
| Thematic/teaching order | Established capacity, entries and the stop marker before HFLAG/HSTORE, then derived traversal from those same boundaries. Kept the practical recall capture as evidence after HPOS and replacement rather than as a second first-prompt lesson. |
| Paragraph deletion | Removed the opening's final preview because it announced the subsequent explanation without adding a rule. Replaced the insertion section's broad capacity certification with the exact post-cleanup boundary and its use by backwards traversal. |
| Sentence deletion | Read every sentence in order, with each paragraph and the following paragraph. Retained byte costs, register preservation, empty-line exclusion, the difference counter and the reset entry as short sentences because each carries a distinct fact. The `HSCLR` sentence establishes the named operation before its loop. The `^X` sentence identifies the shared erase routine. |
| Agency/plainness | Changed “calling the shared access code” to “entering” because HPUT branches and HGET falls through. Replaced recognition wording with the actual input comparisons. Described a zero's early-termination effect directly. No memory, intention, judgment or social act is assigned to the ROM, routines or chapter. |
| Every comma | Read every punctuation-bearing paragraph in order. Removed optional commas before `so`, the retained-selection `but` and the directional `then`. Kept list separators, apposition and conditional breaks only where they clarify the grammar. No serial comma, semicolon or em dash remains in authorial prose. Historical recipes, fences and component hashes retain literal punctuation. |
| Technical/literal | Rechecked the listed source proofs at `ea3ef3d`. All 74 inline file/range citations are in bounds at that pin. Added the actual FNZERO/Ctrl-C exits and empty-input CCP route where the final prose relies on them. Numeric byte costs are source-derived arithmetic, not fresh measurements. |
| Journey read-back | Read from the opening through the final reset interpretation. HHEAD and the empty entry precede all pointer algorithms; the bank helpers precede store/copy calls; HFLAG precedes both eligibility and key handling; HSTART precedes its reuse in traversal. Ended with the empty buffer producing another prompt, not a recap or forecast. |
| Preservation | Compared the five complete recipe/fence pairs byte for byte with old22. All five match, including the spaces after SYSTEM and WORK in the reset capture. The two trailing-whitespace reports from the diff check are those required historical lines. |

The complexity report's provenance-comment flags are outside the running
prose. Its short-sentence flags are the concrete definitions and results
listed above. The initial stop/stops echo was removed with the preview.
The Return/returns echo was replaced by the input-loop continuation and the
reader's editing action. No unresolved hard gate finding remains.

The source-access correction is limited to a dedicated history interface.
The draft does not assert that arbitrary code cannot access the page.
HPUT's write and readback are stated separately. The five captures retain
`78127ec` and their original TED/TAS provenance, while the new source prose
is checked only by inspection at `ea3ef3d`. No output was invented.

## Independent review corrections

The capture-recipe explanation now cites `tools/capture.mjs:102-106` at
`ea3ef3d`. The `@start` branch appends `\r` to the supplied keys, queues
them and pumps the input before its subsequent run interval. This source
reading supports the keys-and-Return claim without rerunning the capture.
The chapter now has 75 inline source-range citations.

The Chapter 14 link now uses `14-state-and-memory.md`, matching the revision
ledger's `tec-os/14-state-and-memory.md` final path. Its anchor matches
“EXPAND 1 and the stack boundary” in the Chapter 14 draft. The relative
link works between the drafts and between their planned final locations.
Both corrections were read in their containing paragraphs. No capture,
build, test or runtime execution was performed for these changes.

## Remaining acceptance

Independent editorial and factual result review remains open. Final
navigation and reader-order integration remain with the whole-book pass.
Current-pin execution or physical-board evidence is not supplied by this
source-only draft. Historical captures must keep their labels unless a
separately authorised run replaces them.
