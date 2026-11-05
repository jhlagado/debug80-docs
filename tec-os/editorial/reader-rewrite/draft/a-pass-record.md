# Appendix A pass record

## Brief and authority

I own only `draft/appendix-a-bdos-functions.md` and this record. The final
location is `tec-os/appendix-a-bdos-functions.md`. This is a numbered-call
reference after the reader has met the FCB and DMA, not another introduction
to file processing. I retained the complete summary table and every detailed
function contract, including unsupported calls and ordinary failure results.

I read the complete original appendix, old Chapter 19's assigned compatibility
section, all 67 destination-A whole units and the complete relevant reverse
outline. No fragment move adds material to A. The book base is
`10821b68f80c10d2037bbd1c5ab207877c897c68`. The closed replacement outline
requires complete registers, side effects and errors in numerical lookup
order. The complete human-writing skill, teaching standards and house style
were read and applied. Reference form takes precedence over course templates.

Current implementation proofs are git object text at
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`, including the actual split BDOS
owners, their entry dispatch, callers and BIOS/cache paths. No product,
fixture or dependency was imported or executed. No assembly, build, test,
new capture, timing result or stack measurement was made. The 54-byte value
is the actual declared BDOS stack allocation, not measured depth. This
appendix has no historical output fence to relabel. Existing CP/M/MP/M
comparison facts are retained from the assigned original reference and
compatibility list, not presented as new external-oracle results.

## Complete material dispositions

Original ranges use that book base. Each grouped row retains its constituent
whole units. All 64 original-A units plus 3 old19 units are accounted for.

| Source and original ranges | Actual disposition |
| --- | --- |
| A1–6,8 | Keep title, front matter and final ledger location. |
| A10,12–14 | Replace mixed old citation headers with explicit current source-only contract scope. No new capture certification. |
| A16–20 | Replace syllabus preview with number-to-register-to-effects lookup. Preserve CP/M2.2 profile and selected extra numbers while bounding CP/M3 compatibility. |
| A22–71 | Retain all 48 rows0–40,44–48,99,108. Add existing detailed-entry A results to35/36/46. Explain ordinary results versus BDOS error returns. |
| A73,75–81 | Retain call0005/C/E/DE, HL/A/B replication, other clobbers, two-byte caller return address and private54-byte allocation. Explicitly avoid a carry-result contract. |
| A83–88,90–92 | Retain36-byte FCB, complete dispatch-selection list, 0/default and1–16/A–P, special?17 and directory-code slot. Add explicit-drive/default separation and unchanged drive byte. |
| A94,96–101,103–108,110 | Retain all4 code/message/cause rows and D recovery link. Distinguish ordinary failures, default abort, FE/FF return, pending ordinary input, control-key effects and chain lifetime. Close is not a drive-protection error. |
| A112,114–115 | Keep function heading and0 nonreturning warm BIOS route. |
| A117–121,123–130 | Keep1 pending/all-character echo/CPM difference and2 tabs/pause/resume/discard/list toggle/pending input/no-result/CPM pause-abort. Make tab expansion explicit for1. |
| A132–133,135–136,138–139 | Keep3 reader input,4 serial punch and5 discarded list output. Check actual BIOS owners rather than generic console-routing text. |
| A141–145,147–148,150–151,153–155 | Keep6 direct input/output omissions and FD/FE distinction,7 byte read,8 write/console-only routing and9 dollar termination. |
| A157–164,166–168,170–171 | Keep10 buffer layout/termination/all editing keys/CCP-only recall and program characters,11 pending-status lifetime and12 exact0022 return. State the current empty-line ^C condition, restored after deletion/clearing, and scope exclusion of editing controls to the returned line. The abort path stores03h before its nonreturning warm boot. Link22 without repeating its implementation lesson. |
| A173–178,180–182 | Keep13 complete reset, unchanged user and CCP exception; name actual dirty/sum conditions. Keep14 default publication/login/Select error. |
| A184–188,190–197 | Keep15 FCB import/CR ownership and16 map-only/ordinary code/missing entry/unmodified/read-only no-write success, including never-opened FCB. State requested logical EX, corresponding RC and S2 marker. |
| A199–204,206–208 | Keep17 wildcard name/extent/raw default drive/DMA result and18 continuation/noDE. Qualify ordinary extent matching by EXM and S2 clearing without restricting wildcard EX, which bypasses S2 comparison. |
| A210–216 | Keep19 directory-before-free, returned-write allocation ownership, ordinary result, protection and partial deletion. Remove an implied guarantee about physical card state on failed writes. |
| A218–220,222–232 | Keep20 CR/extent/EOF and21 block/extent allocation,0/1/2, CR128 retry, block ownership and protection. Add all actual result1 paths for20. Make later close publication conditional on successful close. |
| A234–240,242–246 | Keep22 no collision check, current user, directory result and EX kept. Distinguish the preliminary S2 reset, module0 copied to the directory buffer and final FCB S2=80h. Retain S1/RC/map clearing and the full-directory reset consequence. Keep23 every-entry rename, offsets17–27, ignored second drive and file protection. |
| A248–249,251–252,254–255,257–260 | Keep24 login bits,25 logical default,26 DMA and27 live default allocation pointer after remount. |
| A262–265,267–269,271–275,277–279 | Keep28 protection lifetime,29 selected volume flag,30 name/type attributes and DIR system hiding,31 live default DPB. Explicitly preserve close exception under28. |
| A281–285 | Keep32 five-bit set/get and0-after-set versus four-bit CCP USER/page-zero behaviour. |
| A287–295,297–304 | Keep every33/34 result code, R2 overflow, record positioning, following sequential read, restored EX/S2 after missing/full extent and retry creation. |
| A306–308,310–312,314–317,319–320 | Keep35 maximum extent end/missing0/FF result,36 sequential-to-random position,37 logout/protection/full rescan and38/39 no-ops/MPM distinction. |
| A322–327 | Keep40 every newly allocated block zeroed,34 results and BIOS DMA restoration even on returned failure. Cite actual DMABACK owner too. |
| A329–331,333–341,343–347 | Keep44 E1-only,45 every mode/error-register/message/chain/default-reset/record-position contract and46 three low-first DMA bytes/selection without default change/Select error. Bound transfer-position wording to sequential calls. |
| A349–356,358–361 | Keep47 zero-within128/noCRLF/Eignored/!:/replacement/warm/nonreturn/refusal unchanged-line and48 EFF-equivalence/flush/results/drop. Correct unconditional chain loading to failed-warm-flush cancellation and explain no rollback/retry cache for dropped lines. |
| A363–364,366–372,374,376–380 | Keep99 refusal,108 shared code/get-set/lifetime/CCP reset/failure/range and all other-number zero returns, including50 and BIOS access. Clarify cold reset versus function0 warm reset and attach actual lifetime sources. |
| old19 508,510–512,514–530 | Move compatibility heading/intro/full list here. Combine original^P/echo items in one bullet. Preserve ROM/RAM hooks, all extra numbers/no-ops, warm-reset versus program13, history/program distinction and CKS0/no swap detection. Name dirty versus unmarked sum mismatch accurately. |

No assigned function, code, register, lifetime, failure condition or example
was deleted. Neither source contains a capture fence for A. The only removed
material is duplicate navigation/certification and unconditional wording
corrected against actual code. The old19 compatibility list is combined here,
not left for the lifecycle chapter to repeat.

## Exact source proofs

All ranges below use ea3ef3d. I read the full BDOS entry/console-line code,
full file mutators, complete random preparation/rollback and zero-fill code,
vector/free-space/size/search owners and applicable BIOS/cache callers. The
immediately preceding19 review and D work supplied the full login/error/cache
paths, rechecked here where A relies on them. A textual range substitution
alone was not accepted as semantic proof.

| Contract | Actual source support |
| --- | --- |
| Dispatch/results/stack | src/cpm/bdos.asm:137–213 binds FCB calls through the actual FCBMAP;228–252 replicates HL into A/B and restores caller SP. src/tables.asm:89–97 supplies every function and FCB bit. src/layout.asm:152 declares54. |
| Extra dispatch/no-ops | bdos.asm:143–165 handles108/47/44/45/46/48/99 before unsupported>=41 returns0. Its221–237 accepts only E1;90–93 refuses44/99. tables.asm:96 maps38/39 directly to RETZERO. |
| Console0–12 | bdos.asm:257–259,321–433,454–765,772–800 supplies complete call owners. bdoscon.asm:126–153,178–204,229–286,318–350 supplies pending keys, tabs, list copy, raw echo and pause. console.asm:566–599 supplies actual list/punch/reader, not the status routine at200. console.asm:127–199 handles CON field. |
| Function10 details | bdos.asm:472–531 terminates on CR/LF/full;545–553 gates recall with HFLAG. Its606–620 tests current LINCNT, stores03h and echoes ^C before CHDROP only when empty. Its559–599,675–729 decrements or clears that count, restoring the abort condition. Its627–701 supplies remaining edits;740–765 publishes the returned count and conditionally stores history. Returned-line exclusion does not deny the nonreturning03h store. |
| Drive/default/FCB | bdosfile.asm:142–234 publishes DEFDRV/DEFDPB/DEFALV only after selection and does not rewrite an FCB's drive. bios.asm:63–96 rejects absent/pastD. bdosfn.asm:28–31 returns default, not last explicit drive. |
| Reset/protection lifetime | bdosfile.asm:19–53 clears login/warm/read-only state and DMA before A;72–132 keeps clean sum matches, marks dirty bounded rebuilds and logs mismatches out for full scans. bdosfn.asm:431–447 clears LOGINV/ROVEC/WARMV bits. bdoslog.asm:254–264 reapplies volume protection. |
| Open/close | bdosfile.asm:246–248,270–339 and bdosfn.asm:621–685 preserve requested EX, set corresponding RC/unmodifiedS2, leave CR and choose map-only close. Read-only close returns0 before directory lookup regardless of FCB open history. |
| Search | bdosfile.asm:373–419 clears ordinary S2, preserves raw-drive mode and continues search. bdosfn.asm:507–605 publishes four-entry record/slot;747–829 strips attribute bits, admits?EX before S2 comparison and otherwise checks EXM/module. |
| Delete/make/mutate | bdosfile.asm:430–445,458–514 gives drive/file guards and successful-directory-write-before-free. Its529–538 clears S2 after the drive check, before MAKEFCB can return directory-full at569–572. Its574–609 clears fields and copies module0 to the directory buffer;611–617 sets FCB S2 bit7 before WRITEDIR at638. A successful make returns FCB S2=80h. No duplicate-name test is made. Its672–764 copies attribute or rename names to all matching entries, checking file R/O only for rename. ccpfile.asm:138–147 hides system entries. |
| Sequential I/O/retry | bdosrec.asm:22–207,227–298 supplies all result paths and CR advancement.119–175 restores failed next-extent EX/S2 with CR128;733–767 publishes an allocated block in the FCB and marks it changed before transfer, allowing a successful later close to publish ownership. |
| Random I/O | bdosrec.asm:307–378 sets read/write/zero modes and restores CR on completion;393–531 refuses R2 before FCB changes, closes previous extent, opens/makes target and swaps EX/S2 back on missing/full. Its540–559 is the actual swap. |
| Zero-fill/DMA | bdosrec.asm:794–860 writes every record of a new block and calls DMABACK after each write. bdoslog.asm:122–136 restores CURDMA through BIOS before checking failed status, then goes directly to BADSECT. |
| Vectors/free/size/user | bdosfn.asm:16–64,77–145,153–213,230–325,336–420,431–447 supplies all queries/changes. volsvc.asm:377–391 reselects a remounted logical default. ccpcmd.asm:241–280 and ccp.asm:363–384 establish USER's narrower operator/page-zero limits. |
| Error codes/modes | bdoscon.asm:31–72,82–101,108–137 supplies code1, all returned/default paths and bad references. bdosfile.asm:430–445 supplies code3;bdoslog.asm:880–900 supplies2/4. bdos.asm:271–275 stores mode. boot.asm:530–539 and ram.asm:233–237 establish warm clearing. |
| Error record lifetime | bdosrec.asm:79–103 and280–288 branch to error before CR advance. bdoslog.asm:100–136 restores BIOS DMA before a returned directory error. A physical failed write does not establish rollback from these control paths. |
| Chain/flush | bdos.asm:67–108 validates zero termination within128 bytes before copying/replacing CHPOS and warm booting. Its285–289 returns explicit VFLUSH failure. volsvc.asm:413–428 calls CFLALL with saved interrupt state. cache.asm:292–345 drops failed CFLALL lines;653–668 prints once and clears CHPOS only on the warm path. |
| Return code lifetime | bdos.asm:296–314 queries/stores PRGCODE. ram.asm:310–314 ends warm-clear region before PRGCODE:386–388. boot.asm:73–79 clears full workspace at cold boot and530–539 only the narrower warm region. ccp.asm:224–244,280–284,619–629 checks conditional range and sets per-command success/failure. |
| ROM/BIOS/geometry | rom.asm:35–40 includes owners in ROM;bdos.asm:14–35 supplies actual RAMBIOS routes;boot.asm:419–433 sets0001 to its warm entry. src/cpm/PROVENANCE.md:1–7 establishes Portable CP/M origin. format/format.json:52,59 sets CKS0 in both geometries. |

## Actual craft passes

| Pass | Disposition |
| --- | --- |
| Generous reference | Kept complete lookup table and contract entries rather than compressing them into claims of compatibility. Added precise side effects only where actual code made the old shorthand misleading. |
| Thematic | Kept number order, shared call rules, error modes and individual contracts. Moved compatibility holdings from19 into a final reference section. Shared error modes precede the detailed contracts. |
| Sentence deletion | Read all retained and new prose against each assigned unit. Removed syllabus preview, duplicate C16 certification, repeated close citation ranges and an implied physical rollback guarantee. Preserved every API difference and retry-state condition. |
| Agency | Read function/table/FCB/record subjects. Recast tangled FCB-layout sentence to a direct drive-selection contract. Independent review found two remaining social acts: a transfer “promising” rollback and function99 “refusing” truncation. Replaced them with the physical no-rollback consequence and the FFh/no-truncation result. |
| Every comma | Read every paragraph and table cell, testing optional commas. Removed automatic comma-or results, conjunction commas in output/line input/user/make/chaining and unnecessary console/attribute apposition. Retained enumerations, short input conditions and needed apposition. No authorial semicolon or em dash remains. |
| Semantic | Checked split routine ownership and actual callers at the offered pin. Corrected control-key pending scope, dirty/sum reset, EXM/S2 search, no-write close, returned transfer position, partial delete ownership and conditional warm-chain execution. Distinguish54 allocation from historical measurement. |
| Readback/lookup | Read full draft and original-to-draft diff from opening to final compatibility item. Table outputs and entries agree, normal versus fatal errors is explicit, and random/full-directory retry conditions remain local to their calls. Links use final revision-ledger paths. |
| Manual gate | Read headings, negative clauses and subject/verb pairs. No hollow summary landing, praise, invented example, output, universal CP/M3 certification or KS48 default claim. Tables remain tables for lookup, not compressed teaching prose. |

No prose-gate or complexity script was run. Static text comparison and source
inspection do not claim runtime verification. There are no new literal
recipes or output fences and no historical quantity has been newly measured.

## Handoff

All 67 assigned whole units are accounted for, including all 48 table rows and
the complete assigned compatibility list. Independent factual/editorial
review, integrated anchors and whole-book reference acceptance remain open.
I edited no root book, shared ledger or other writer's file. Commit scope is
these two exact owned paths with --only, followed by push to
origin/tec-os-reader-rewrite. No publication occurred.

## Independent review corrections

Applied all four findings from the complete independent review of 4af304f.
The correction scope is the affected shared-error, function10, function22
and compatibility passages plus this record. All 48 summary rows and 67
movement units remain represented. No literal example, output, header pin
or historical measurement changed.

1. Function 10 now tests whether the current line is empty, not whether ^C
   was the first key. I reread LINABRT at ea3ef3d:src/cpm/bdos.asm:606–620,
   deletion at559–599, clearing at675–729 and returned-line publication
   at740–765. LINCNT can return to0 after earlier input. The empty-line path
   stores03h, echoes ^C and goes directly to CHDROP. “The returned line
   excludes the editing controls” describes the returning path without
   denying that store. The draft preserves warm exit and chain drop.
2. Function 22 now separates preliminary S2=0, the module0 directory-buffer
   copy and the final FCB S2=80h. I reread the complete make owner and caller,
   src/cpm/bdosfile.asm:517–643. FNMAKE clears S2 after CHKRO even if MAKEFCB
   later returns directory-full. Successful preparation copies bytes1–31
   before setting bit7 in the caller FCB, then calls WRITEDIR. The flag is
   explicitly set before that write, not proof of completed persistence.
   No-collision-check, current user, EX kept, S1/RC/map clearing and every
   ordinary result remain in the entry.
3. The card-change instruction now links to Chapter 5's actual “Writing the
   physical card” section. I read the complete section opening and its
   exclusive-use/reinsertion-reset paragraph. Power-cut recovery remains
   available at its own section but is not the target of this instruction.
4. Replaced the transfer's “promise” and function99's “refusal” with exact
   effects. I reread src/cpm/bdos.asm:159–161 and90–93 for FFh/no change,
   and src/cache.asm:307–351 for the failure/drop path. Earlier or partial
   physical writes are not rolled back by a failed transfer.

Reread every changed containing passage and its neighbours for contracts,
agency, deletion and every comma, then the actual two-file diff. The result
keeps numbered lookup order and the source-only authority at ea3ef3d.
Bounded independent correction confirmation remains open. No product,
fixture, dependency, assembly, build, test or runtime was executed or imported.
Only these two owned paths are committed with --only and pushed.

## Bounded confirmation received

Independent review confirmed3a7aa77 against exact ea3ef3d source with no
further required finding. All four corrections are closed within this
reference: current-empty-line abort, final FCB S2 state, card-change link and
concrete failure wording. The lead read the complete revised reference.
Final adopted source, integrated navigation and whole-book acceptance remain
open. No execution accompanied this confirmation.

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
