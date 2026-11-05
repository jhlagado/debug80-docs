# Chapter 02 pass record

Status: draft prepared within the closed practical-first outline. Independent
editorial and factual review of this draft remains open. The scoped workflow
receipt authorises the covered examples. It does not accept the whole batch.

## Reading and authority

The complete original `tec-os/07-first-program.md` was read at frozen
`10821b68f80c10d2037bbd1c5ab207877c897c68`. Its assigned passages were read
with their containing sections, including both fragment parents. The chapter-02
entry in revision-ledger.json and all eleven whole movement units plus two
fragment moves were read. The independently closed outline at `0e4feea` and
its KD-243 40-column amendment control the route.

The complete human-writing standard and revision playbook, teaching standard
and craft reference, book STYLE and terms were read before drafting. The
readiness dossier retains their original identities and the detailed source
and evidence inventory. The current Chapter 1 and Chapter 3 drafts were read
in full after they appeared. Chapter 1 finishes with successful preservation
and its failure exception. Chapter 3 begins with the saved BANNER files on B.
The already-read Chapter 4 opening, Chapter 8 call/stack introduction and
Chapter 26 historical HELLO passages establish the other depth boundaries.

Source authority for this chapter is
`962853f499f05faf281f6cdff1deca8959f58c2b`. The actual workflow tested
`8b8664a7d93c6dc2e8bce509b9770585e106eedc`. The retained binding identifies
962853f as the formal landing. No other chapter or historical example is
repinned by this draft.

The complete closed receipt was read from Origo commit `4b5b5a50`,
`studies/p3-tec-os/reviews/book-opening-workflows.md`. Its actual attempt is
`e77c7ef0f81c42d94f12391b099f4cf8c4acd9a6`. The receipt independently checks
matrix inputs, source and card identities, COM/DBG bytes, screens against
VRAM/registers/font masks and fresh-machine persistence. This authoring uses
that actual-result acceptance rather than journal completion alone.

The whole batch remains FAILED at the later invalid carry observer. No advanced
service, physical-board, browser, audio, debugger, navigation or publication
acceptance follows. No product execution, assembly, imports, builds, tests or
new captures occurred during this authoring.

## The teaching route

The single job is to enter and change a small program with the prepared TED and
TAS. The reader starts with Chapter 1's prompt, drive prefixes, supplied SAMPLE
build and preservation action. The draft uses second person and Australian
prose. It introduces the minimum assembly explanation after the first run.

The generous draft followed this progression: empty editor and whole-file
entry, deliberate line-14 rejection, exact repair, save/quit/flush/reopen,
initial build/run and return, local explanation of that listing, changed text
and repeated build/run, preserved source reopened in fresh RAM and standalone
execution. No FCB, private stack, host assembly or chaining implementation is
introduced. The two explicit drive prefixes locate tools and work without
requiring the later search-precedence lesson.

## Assigned material dispositions

All coordinates below refer to old07 at 10821b6. Fragment selection follows
the controlling movement file, not the whole old table or paragraph.

| Assigned range | Disposition in the draft |
| --- | --- |
| 1–6 | Destination front matter names Chapter 2 and its practical title. No root navigation is changed. |
| 8 | Replaced by the closed-outline title. |
| 10–15 | Replaced by separate current source and actual workflow metadata. Historical pins remain recorded below. |
| 17–21 | Supplied-to-authored transition retained. Later PC/SHOW survey removed as explicitly assigned. |
| 23 | BDOS subject combined with the short listing's local explanation after the observed run. |
| 53 | Printing subject combined with that explanation. |
| 55 | Printing exercise replaced by accepted BANNER, not an assumed HELLO rerun. |
| 57–67 | Whole accepted 13-line BANNER source replaces HELLO. Original HELLO source and historical round remain at Chapter 26. |
| 69–73 | ORG, print call, terminator, CR/LF and return explained for BANNER. HELLO's 33-byte quantity is not transferred. |
| 75 | Build/run subject split across rejection/repair and first successful run. |
| 77–85 | Ordinary entry, arrows, Backspace, save/quit and status retained with actual BANNER positions. Line-number option remains outside this assignment. |
| 91–94, parent 87–98 | B/R contracts retained in connected prose. Other prefix keys and chaining internals omitted under the explicit fragment selection. |
| 157–158, parent 157–161 | Space return, quit and COM/DBG beside source retained for the actual BANNER route. THOR project/session implementation is not imported. |

The authorised new listing supplies local explanations of registers, LD,
labels, CALL/RET and DB. General register saving, PUSH/POP, stack capacity,
FCB/DMA, program chaining and PC compilation keep their later homes.

## Semantic source proofs

These were text reads using Git objects. The complete named routines and their
relevant callers were inspected, not inferred from a matching symbol. Source
coordinates are at 962853f unless a separate dependency pin is named.

| Claim | Exact source and support |
| --- | --- |
| COM starts at 0100h | `src/cpm/ccp.asm:19–25,487–536,675–715,741–761`: COM type selection, loading records beginning at TPA and launch. The final return word reaches warm boot. |
| Explicit drive keeps A current while B supplies the program | `src/cpm/ccp.asm:487–536`: named-drive load does not change prompt selection. The actual A>B:BANNER output independently establishes this route. |
| Function number in C and address in DE at 0005h | `src/cpm/bdos.asm:121–175,198–213,225–252`: entry saves DE as PARAM and dispatches with C. Its return restores the calling stack position and returns to the program. No register-preservation guarantee is added. |
| Function 9 and dollar termination | `src/cpm/bdos.asm:414–433`: reads text at PARAM, compares each byte with '$' before output, omits terminator and continues through OUTCHAR. |
| Console output and line ending | `src/cpm/bdoscon.asm:170–204,229–243`: function-9 characters pass through console output. `src/cpm/bdos.asm:38–43` defines LF=10 and CR=13. Exact run text establishes the displayed line. |
| Return and warm boot | `src/cpm/ccp.asm:519–536` supplies the warm-boot return word. `src/boot.asm:163–215` restores the prompt path and calls CWBOOT. No inherited-stack sizing lesson is added. |
| Empty-prompt Ctrl-C | `src/cpm/bdos.asm:601–620,110–119`: echoed Ctrl-C takes CHDROP only at an empty line, then enters the BIOS warm boot. |
| Preservation failure exception | `src/cache.asm:647–668`: failed flush drops the affected line and reports Write lost. `src/boot.asm:208–215` continues to CCP. A prompt after that message does not prove preservation. |
| Matrix control letters and arrows | `src/keyboard.asm:94–117,144–197`: arrow sequences and Ctrl letter translation. G supplies 07h, H 08h, Q 11h, S 13h and T 14h. Actual input acceptance comes from the closed receipt. |

TED remains pinned at Thorium
`128edb7cbb27de17a9d3a7a747706a5b227b30c4`. Its source is an overlay on
Edit `ca9a00fefbc32684d595094206315ee6ef0f6e69`, as recorded in Thorium's
`build.json` and `tools/build-ted.sh`. The script was read as text only.

| TED claim | Exact pinned source and support |
| --- | --- |
| Insert, newline, Backspace, Delete, save and quit | Thorium `ted/src/editor-main.asm:56–115,176–197`: raw-key dispatch. 07h and DEL both reach COMDEL. Quit with unsaved changes has a separate confirmation path, which this saved route avoids. |
| Arrow keys | Same file `129–162`: the four escape sequences select the navigation operations. |
| Prefix and letter case | Thorium `ted/src/editor-project.asm:127–154`: prefix reads another key and folds its case. Thus the actual lower-case b/r inputs support the printed ^T B/R convention. |
| Build/save and build/run | Same file `166–185,221–305`: good save precedes build, save failure stops the action and R adds run-pending to the same build. Actual output establishes successful completion. |
| Saved status | Thorium `ted/src/editor-save.asm:7–104`: successful save clears flags and sets Saved. Failure follows a separate path. `ted/src/editor-data.asm:44–72` supplies literal status text. |
| Position/message status | Thorium `ted/src/editor-screen.asm:518–541,583–612,706–763`: position is one-based and a message replaces it. Actual snapshots supply all coordinates used by the draft. |
| Deletion of characters/newline | Edit `src/editor-buffer.asm:14–33,35–101`: newlines insert CRLF, Backspace removes before the cursor and Delete removes at the cursor, including a CRLF pair. The closed card comparison establishes exact repaired source. |

ORG, labels, LD, CALL/RET and DB are explained only for the retained listing.
The exact accepted source and COM reference equality support its placement,
message bytes and control flow. No new size, timing or clobber measurement is
claimed. The general BDOS contract permits any register to change. The source
comment's AF/BC/DE/HL list is retained literally without turning omitted
registers into a preservation guarantee.

## Actual evidence and literal boundaries

The detailed archive/member inventory remains in chapter-02-readiness.json.
The complete relevant source, console and result contexts were read, including
all BANNER phase objects and the later failure boundary. Raw pixel/matrix
acceptance is attributed to the closed independent receipt. This pass did not
perform a second runtime or claim a second independent reconstruction.

| Identity | Value |
| --- | --- |
| ROM, 16,384 bytes | `fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d` |
| Starter, 10,485,760 bytes | `0f3d9e33994ac30865b8675c8f8ce7fc493b13a0a840d8e84b7d708107d4266c` |
| Selected font, 768 bytes | `5d732cefca4013fe6082728a00cae5e3aceaf3e6eb99aaa31e0289c0b3efe1d8` |
| TED.COM, 11,923 bytes | `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f` |
| TAS.COM, 10,295 bytes, Thorium dbee66a | `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2` |
| Actual result.json | `e4b5ff29b5b8ab7dc0c44a3f1d807dbd08974776665c5cc965cf8c3e15bf9350` |
| complete-attempt.tar.gz | `af08c7ff36ff5ed5cdaaed1a8e1ec20cec938487b22f3ab11e7b7387b23c2afa` |

The profile is the reviewed cold 40-column, 24-row PICOv3 TEC Compact console
with enabled matrix keyboard, fa639 ROM and unchanged startup/GLCD policy.
BANNER begins on Machine 4 with an empty BANNER buffer, not with an imported
source. The preserved card is reopened in Machine 5 with fresh RAM.

The six fenced examples were compared as inert data with the actual archive:

| Fence | Actual member and comparison |
| --- | --- |
| Complete source | `packet/BANNER.initial.asm`, 285 CRLF bytes, SHA-256 `45b9e8a8c6a21e7070fe178134d41d695214c13c968ee9ce5f35a7dbf08c13e8`. All 13 lines match with CRLF rendered as LF. Spaces, symbols, comments and literals are unchanged. |
| Rejection | Contiguous text in `stage/results/banner-rejected-console.bin` from A>A:TAS through A>A:TED. Initial screen controls, leading CRLF and subsequent editor redraw omitted explicitly. Diagnostic is the actual line 14, column 1. |
| Initial run | `stage/results/BANNER-initial-run-console.bin`, SHA-256 `7cd11bd4a8b9b90b5957bdb5627cea4c8a7b6cc3b2ee62e977fc447deb3b1da1`. Exact text after initial clear controls and leading CRLF. Final Press a key has no raw trailing newline. |
| Edited source line | Exact final line from `packet/BANNER.edited.asm`, whole-file SHA-256 `8323e30d39266ee3d0dace3a7cc2c7c973cd79403e6d91b0269839ec013baeb0`. Only the exclamation mark differs from initial source. |
| Edited run | `stage/results/BANNER-edited-run-console.bin`, SHA-256 `34339011b41a4aa7b950dad3615ae055338651f7b6125e004766af09b5f54c76`. Same explicit rendering boundary, separate artifact from initial run. |
| Final standalone/flush | Machine 5 `stage/results/096-BANNER-final-flush.json`, screen rows 2–7 exactly. Boot and editor display omitted. No intervening text is spliced out. |

Caret input notation in the prose is instruction, not fabricated console
output. The six fence bodies retain their actual bytes under the stated
newline rendering. No keyboard prompts, return prompts or key bytes have
been supplied from a different capture. The long rejection is logical console
text that wraps at 40 columns, not a falsely claimed single screen row.

The rejected program-observation record has zero entries and zero returns.
The initial, edited and standalone records each have one entry, one final RET,
one entry through zero, one warm entry and one function-9 call. Saved source,
COM and DBG are checked against actual cards by the closed receipt. The draft
does not equate a successful save with a successful assembly or a successful
flush with saving an unwritten editor buffer.

The full initial source is entered before BROKEN. After rejection the actual
sequence is Left to L13 C38, Down to L14 C7, six Backspaces to L14 C1 and 07h
Delete to remove the extra newline. This is not HELLO's old Right/Backspace
repair. The revised source's insertion point is L13 C27 before its closing
quote, reached from L1 C1 by twelve Down and twenty-six Right presses.
Status-clear arrows and their ordinary movement are retained for both builds
and returns. The draft does not assume status clearing leaves a cursor still.

Historical old07 names TEC-OS 78127ec, TED 128edb7, TAS dbee66a and ATOM 0.3.7.
Its actual HELLO editor round is at 7458352. Those prompts, line-7 diagnostic,
repair and 33-byte quantity remain historical. No such output fence is retained
in this BANNER draft and no historical result is relabelled as a 40-column run.

## Editorial passes and dispositions

The generous draft was completed before line editing. The initial actual
prose gate reported one review candidate: HW008 at the ending's human clause
"when you want to change the program again". Its subject is you, not the file.
The deletion pass nevertheless removed that ending's duplicated edit/run
recap. The revised ending states that running the COM leaves source available
for the next edit. The next actual gate reported zero candidates.

The separate thematic pass checked each paragraph against the recorded route.
The local listing explanation stays after the first successful run and before
the greeting change. The register paragraph remains short because no saved
value is used after printing. Cursor/status detail stays beside the action
whose next edit depends on it. General assembler, debugger and chain teaching
was excluded rather than compressed into this exercise.

The sentence-by-sentence deletion pass removed the duplicated start-of-file
cursor assurance and the ending recap. It retained the blank-line counting
sentence because the deliberate diagnostic depends on line 14. It retained
the save/reopen distinction because editor memory alone cannot establish a
stored file. The source/COM distinction is retained at the changed greeting,
where saving without rebuilding would leave the previous program.

The agency pass changed the opening's "without leaving TED" to "with TED's
build keys", avoiding an implication that the same editor execution continues
through the build. The register explanation was changed from certain loss to
possible register changes. No object is given a motive, perception or judgement.
The every-comma pass read complete sentences and adjoining paragraphs. Commas
in prose separate lists, relative/appositional clauses or introductory phrases.
There is no optional conjunction comma, Oxford comma, authorial semicolon or
em dash. Punctuation within source, numeric syntax and literal output is fixed.

The full journey readback follows entry through the final standalone run.
It checks that the arrows used to restore position also perform their normal
movement. Both save/quit/flush/reopen and fresh-RAM persistence are explicit.
The failure exception remains adjacent to preservation. The ending retains
the source for another edit without a syllabus or recap.

Sentence complexity was run on the actual draft. Its prompts were read in
complete paragraphs. The metadata LONG prompt at line 11 includes a multiline
comment and fixed hash, so it is retained as metadata. Metadata SHORT prompts
at lines 11, 83 and 248 concern receipt/excerpt boundaries. Body SHORT prompts
at lines 29, 70, 76, 98, 105, 111, 117, 122, 142, 148, 165, 185, 190, 200,
225 and 231 are retained for discrete key effects, observed status, exact call
facts or transitions into a fence. Repeated prompts at one location refer to
separate sentences in that paragraph. None introduces a compressed fact list.
The five ECHO prompts at lines 40, 64, 148, 159 and 171 use line, file,
instruction or command as stable technical terms. These are readback prompts,
not automatic instructions to shorten or vary terminology. The final FRONT
prompt at draft line 34 is retained: the short opening condition limits
those keys to TED and prevents command-line use.

Final mechanical-gate and complexity results, exact output identities and
literal-comparison readback are recorded below after the final file read.

## Final readback and checks

The final whole-chapter read retained the practical sequence and the complete
listing. The explicit comma review also removed the optional then comma from
the run explanation and the optional before clause comma from the rejection
introduction. The Backspace apposition remains paired. Relative clauses that
explain an address, a function or a data byte retain their boundaries.
All authorial draft lines fit within 80 columns. Two metadata lines exceed
that width, including the fixed ROM hash. No literal was rewrapped.

The actual mandatory prose gate was run on both owned Markdown files after
revision and before commit. It reported zero findings. The draft complexity
summary is 149 sentences, average 11.0 words, 0.46 joints per sentence and 22%
flagged, including metadata and short operational sentences. The prompts are
disposed above rather than treated as a target score.

The pass record's own complexity prompts were also read. The standards list
at line 16 retains its named reading sources. The route at line 50 retains
its chronological audit sequence. Short pin sentences at lines 25, 31 and
101 distinguish identities. The profile at line 141 retains the exact case
conditions. The repeated one counts at line 163 are literal observation
quantities. Long coordinate sentences at line 170 preserve exact actions.
The negative scope at line 178 prevents historical/current conflation.
Line 206 records a specific agency clarification and uses changes literally.
Line 221's long sentence lists the exact prompt locations, while its short
sentence and repeated line terminology document their dispositions. These
record prompts do not require a reader-prose rewrite. Additional short prompts
at lines 240, 248, 254, 271, 278 and 280 concern punctuation preservation,
gate dispositions, excerpt boundaries and file identities. The statistic
at line 248 repeats sentence as its measurement unit. These are retained as
audit facts. An intermediate gate marked the statistical label HW008, which
was reworded to average to remove that false agency candidate.

Inert final comparisons reconfirmed all six fence bodies against their named
archive members. The source comparison permits only CRLF-to-LF rendering.
The two run comparisons restore the documented screen controls and initial
CRLF, then match the raw console bytes exactly. Rejection is a contiguous
raw substring. The standalone fence equals screen rows 2–7. No imported or
newly executed result is involved.

Draft SHA-256: `596b3d541e9f991f7596d2f3933cd5755ce9c1c8cdb041f26207aeff40cdcc48`.

Readiness SHA-256: `c244cd4a89d0640c92152ac1f1f5b27d78b01f4ec2cca2e464dc428adde68ad7`.

Ordered fence-body SHA-256 values, excluding fence delimiters and their
structural newline after each closing content line:

1. `13241893880339e3caa52fa112753fcb29eb186353b5603b5a4debdd1bcfca53`
2. `2e13dc1c5c2da1185cee26be5ee0942e19aa5d3f979f66c10e6895caa42a03e0`
3. `be9c861a48eb71edf60cfbfdf4d3aa046530d00991265bef3a689ca9b4286606`
4. `92dfb0b1968a6dd694223ff624bf215146106cbc7d65dc9afd1ef197b70cc597`
5. `52fb507c295283fe57efd08574ac75bd6a82fd3fb251eb8f321701f3297e7fa1`
6. `fe5ef59ae235cb1de12a0e615f74ae6b28be05f4bf70529fc1e50c21cafa1586`

## Remaining verification

Independent editorial and factual review of this draft remains required.
No request to integrate root chapters or navigation is made. Final-location
paths and the whole-book journey need their separate integration review.
The whole-batch failure and uncovered advanced-service, physical, browser and
audio cases remain outside this chapter's acceptance.

## Independent opening correction

Reconciled only the draft nav_group with Chapters3–7 as Part I: Using TEC-OS,
accepting opening-integration-01. The independent craft review has no body-prose
finding for this chapter. Its instructions, six fences and result provenance
are unchanged. No root navigation or runtime change is included.
