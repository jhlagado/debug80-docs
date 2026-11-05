# Chapter 1 pass record

## Authority and bounded evidence

The closed outline at 0e4feea and KD243 control First session. The actual scoped
receipt is Origo 4b5b5a50, studies/p3-tec-os/reviews/book-opening-workflows.md,
SHA-256 1368e77c9bc71797d40d42260110ff7fdbc8c430fb3cf46782214f041638e407. It accepts the covered public workflows at attempt02
e77c7ef0. The whole batch remains FAILED after a later invalid carry observer.
No COMPLETE, advanced-service, physical-board, browser, audio or publication
acceptance follows. The receipt and all seven Machine 1 screen records were read
in full before the generous draft. This writing step ran no product code.

Source authority for this chapter is 962853f499f05faf281f6cdff1deca8959f58c2b.
The tested artifact source is 8b8664a, with canonical landing differing only in
records. ROM SHA-256 is
fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d.
The PICO record remains version 3. This bounded chapter adoption does not repin
other drafts or historical evidence.

Prepared input identities and full archive hashes remain in
chapter-01-readiness.json. The starter image is
0f3d9e33994ac30865b8675c8f8ce7fc493b13a0a840d8e84b7d708107d4266c.
The source SAMPLE.ASM input is 5,106 bytes including its final 1Ah, SHA-256
19bf328d58cf78cf7ad9d87dad21673ebf9e5bc77419b7d44fd7932f800cbe95.
The selected 768-byte font is
5d732cefca4013fe6082728a00cae5e3aceaf3e6eb99aaa31e0289c0b3efe1d8.
TAS.COM is Thorium dbee66a90816df9a5884a08754ebc2d458a38325, unpadded
SHA-256 45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
TED.COM stays Thorium 128edb7cbb27de17a9d3a7a747706a5b227b30c4 in the supplied
card but is not run in Chapter 1. No BANNER or TED capture is mixed into it.

## Literal readback

All six reader fences equal complete contiguous row slices of the named
Machine 1 screen arrays, joined with LF. The reader introduction identifies
screen text rather than the raw console byte stream. Each metadata comment
names the exact rows and omissions. The cold excerpt retains its initial blank
row. Interior blank rows and spaces remain exact. Only unused rows below the
last prompt and explicitly preceding rows are omitted. There is no fabricated
key echo or inserted B: DIR command.

| Evidence member | Rows, one-based | Member SHA-256 | Fence body SHA-256 |
| --- | --- | --- | --- |
| stage/results/001-SAMPLE-cold.json | [1, 8] | 7455c39f60f9f3ce28494ee4568779e829240c70d7995ea4663f221e965926b4 | 79638c9f637b9b1d51b8110fc835ba0036397d29ac6ffbec78ed4b8ef06a9352 |
| stage/results/002-opening-dir.json | [8, 12] | a565427a4938e17a72007269cb1adfe325c154d77921b757d28b02f5c8e9787b | 10ae433aaa0cde918fba4389288aea970547d05726d350aea1cf4a7de8d66403 |
| stage/results/004-opening-system.json | [12, 14] | dbf269a15d34a41265660c757463b106a7f43336ed32804b69fd48e29cf2421e | 8df7bfb1ebe85742b6c8e2cc059a5b89178fb49cc03a5633040ae4589716316d |
| stage/results/005-opening-direct-build.json | [14, 17] | 8479fc544862a1311f03dd8201c83054793468d4e367809fb167dfea9ab9c10a | fce941a6fb364ffd43be12e23bfc71830ff51185099e66fc525453faf856cfe2 |
| stage/results/006-opening-direct-run.json | [17, 22] | c5edecdfd8e5bbdc73dca6671c8421e9296b5bde0bc830784e7baf74d770e1cc | f0d76e9e9dd23cc649655ef90ab8c1f9b9c40a527dfe1b153f332cbd2d453cd8 |
| stage/results/007-opening-direct-flush.json | [22, 23] | c1ec9e1e7aed7e108926e3a639a32972a82676aafbd5987d8ded4de6843aa94a | 98d97713e3ff40dfe83fe1f78753a56b33698bb79cdb4337448613584276c9c4 |

The actual direct console stream was read completely, including its CR/CRLF
bytes. Its SHA-256 is
b32ee3a58c10be48e435071ecbd86d8337669db32db01d27e006ac7f865c34b6.
It is not silently normalised into a different terminal transcript. The
261-byte logical SAMPLE COM equals the pinned ATOM reference. Its 384-byte
record file has zero padding and SHA-256
6000fa09fa9bd74309216b1b6d827c3fd962bf04f53ad49b37669de8f452d34f.
SAMPLE.DBG is 640 bytes, SHA-256
7313230d8ae0bdc24d7cd46c923fabd368227785ae02a17ddcec19fcac78a85c.

The full direct-run observation set was inspected as data. Its entry, final
RET, entry through zero and warm-return counts are each 1. The 1,200 segment
values equal the six supplied digit patterns repeated 200 times. The complete
source, LCD state, file inventory and actual result records support the limited
SAMPLE description. The short speaker tone is described only as source content.
No audible result is claimed.

## Current source proof

| Reader claim | Source at 962853f | Reading and limit |
| --- | --- | --- |
| Matrix enablement and cold 40 | src/console.asm:57-88, src/pico.asm:36-91 | Read initialisation and caller context. Switch enablement is not physical keyboard detection |
| Prompt/current drive and selection | src/cpm/ccp.asm:119-166, 285-320 | Letter prompt, startup-line priority, keyboard read and bare drive selection |
| Case, name/type and question-mark failure | src/cpm/ccp.asm:249-267, 574-620; src/cpm/ccpcmd.asm:511-599 | Read parsing and failure exits. The chapter gives no exhaustive command grammar |
| Modifier keys and no repeat | src/keyboard.asm:75-128, 144-219 | Ctrl-letter and Shift paths, held-key rejection and delivery read fully |
| Correction/cancellation/empty-line Ctrl-C | src/cpm/bdos.asm:440-507, 535-576, 601-621, 672-729 | Count, not historical first key, controls Ctrl-C. Erasure resets count. No fresh correction/cancellation capture is claimed |
| Recall and forward empty line | src/cpm/bdos.asm:535-553; src/history.asm:92-175 | Call is marked at the command prompt. Read older/newer traversal, replacement and count update. No fresh recall capture |
| Warm flush and failure | src/boot.asm:178-215; src/cache.asm:292-350, 653-668 | Caller always reaches CWBOOT. Every dirty line is tried; failed CFLALL lines are dropped. Successful prompt and Write lost are not equivalent preservation |
| Supplied program effects | archived stage/inputs/SAMPLE.ASM, complete file; Machine 1 phases 001–007 and direct observations | Greeting, returned 40 by 24, LCD text, digit sequence and normal return are actual reviewed evidence. Tone remains source-only |

The practical ending requires normal file save/exit, then an empty command
line and Ctrl-C. A recalled or partially typed line is cleared with Ctrl-X.
A second Ctrl-C cannot restore dropped writes. The chapter does not infer that
an empty-prompt flush closes an application FCB or saves unsaved editor text.

## Assigned-material accounting

All 77 ledger source entries and six selected keyboard fragments were read at
frozen 10821b6. The readiness dossier records exact source blobs, hashes and
ranges. The table below accounts for each entry, including parent table scopes.
Fragment overrides select the early keys. Other rows of the original table
retain their existing console/programming homes. No shared movement record was
edited.

| Frozen source | Range | Disposition and actual home |
| --- | --- | --- |
| tec-os/01-introduction.md | 1–6 | Replace chapter navigation and metadata with First session and exact current evidence identities |
| tec-os/01-introduction.md | 8 | Replace chapter navigation and metadata with First session and exact current evidence identities |
| tec-os/01-introduction.md | 10–11 | Replace chapter navigation and metadata with First session and exact current evidence identities |
| tec-os/01-introduction.md | 13–17 | Combine orientation/prepared ROM-card facts in The prepared machine; compatibility breadth remains Appendix A |
| tec-os/01-introduction.md | 21–23 | Combine orientation/prepared ROM-card facts in The prepared machine; compatibility breadth remains Appendix A |
| tec-os/01-introduction.md | 38 | Replace serial boot with reviewed cold 40 excerpt in The first prompt; alternative consoles remain Chapter6 |
| tec-os/01-introduction.md | 40–41 | Replace serial boot with reviewed cold 40 excerpt in The first prompt; alternative consoles remain Chapter6 |
| tec-os/01-introduction.md | 43 | Replace serial boot with reviewed cold 40 excerpt in The first prompt; alternative consoles remain Chapter6 |
| tec-os/01-introduction.md | 44–52 | Replace serial boot with reviewed cold 40 excerpt in The first prompt; alternative consoles remain Chapter6 |
| tec-os/01-introduction.md | 54–56 | Replace serial boot with reviewed cold 40 excerpt in The first prompt; alternative consoles remain Chapter6 |
| tec-os/01-introduction.md | 58–63 | Replace serial boot with reviewed cold 40 excerpt in The first prompt; alternative consoles remain Chapter6 |
| tec-os/01-introduction.md | 65–71 | Replace serial boot with reviewed cold 40 excerpt in The first prompt; alternative consoles remain Chapter6 |
| tec-os/01-introduction.md | 73 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 75–77 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 79 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 81 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 82–87 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 89–93 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 95 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 97 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 98–104 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 106–107 | Retain names, DIR and drive actions in Files at the prompt and Drive A and drive B; replace display evidence only with actual row slices |
| tec-os/01-introduction.md | 109 | Retain supplied SAMPLE build/run and devices in Supplied source and a running program; speaker fact source-only, no audible claim |
| tec-os/01-introduction.md | 111–112 | Retain supplied SAMPLE build/run and devices in Supplied source and a running program; speaker fact source-only, no audible claim |
| tec-os/01-introduction.md | 114 | Retain supplied SAMPLE build/run and devices in Supplied source and a running program; speaker fact source-only, no audible claim |
| tec-os/01-introduction.md | 115–125 | Retain supplied SAMPLE build/run and devices in Supplied source and a running program; speaker fact source-only, no audible claim |
| tec-os/01-introduction.md | 127–132 | Retain supplied SAMPLE build/run and devices in Supplied source and a running program; speaker fact source-only, no audible claim |
| tec-os/01-introduction.md | 134 | Retain question-mark failure as source-backed instruction; original complete NOSUCH capture held below at78127ec |
| tec-os/01-introduction.md | 136 | Retain question-mark failure as source-backed instruction; original complete NOSUCH capture held below at78127ec |
| tec-os/01-introduction.md | 137–142 | Retain question-mark failure as source-backed instruction; original complete NOSUCH capture held below at78127ec |
| tec-os/01-introduction.md | 165 | Combine in Saved work before reset or removal; correct unconditional success and require empty line, completed save and successful flush |
| tec-os/01-introduction.md | 172–175 | Combine in Saved work before reset or removal; correct unconditional success and require empty line, completed save and successful flush |
| tec-os/02-console.md | 1–6 | Combine introductory console vocabulary with prepared PICO baseline; no encoded IOBYTE or alternate-console detour |
| tec-os/02-console.md | 8 | Combine introductory console vocabulary with prepared PICO baseline; no encoded IOBYTE or alternate-console detour |
| tec-os/02-console.md | 10 | Combine introductory console vocabulary with prepared PICO baseline; no encoded IOBYTE or alternate-console detour |
| tec-os/02-console.md | 12–15 | Combine introductory console vocabulary with prepared PICO baseline; no encoded IOBYTE or alternate-console detour |
| tec-os/02-console.md | 46 | Combine introductory console vocabulary with prepared PICO baseline; no encoded IOBYTE or alternate-console detour |
| tec-os/02-console.md | 259 | Retain selected Shift/Ctrl, Backspace, Ctrl-X/U and Ctrl-W/N actions in Correcting and recalling a line; Ctrl-C safety in ending; unselected technical rows remain Chapters 6/8 |
| tec-os/02-console.md | 301–311 | Retain selected Shift/Ctrl, Backspace, Ctrl-X/U and Ctrl-W/N actions in Correcting and recalling a line; Ctrl-C safety in ending; unselected technical rows remain Chapters 6/8 |
| tec-os/03-command-line.md | 1–6 | Replace old navigation/provenance with current Chapter 1 metadata; command processor implementation remains Chapter 20 |
| tec-os/03-command-line.md | 8 | Replace old navigation/provenance with current Chapter 1 metadata; command processor implementation remains Chapter 20 |
| tec-os/03-command-line.md | 10–14 | Replace old navigation/provenance with current Chapter 1 metadata; command processor implementation remains Chapter 20 |
| tec-os/03-command-line.md | 21 | Retain Return/case/correction behaviour as source-backed actions; original complete wildcard/case capture held below, not a new 40-column run |
| tec-os/03-command-line.md | 23–28 | Retain Return/case/correction behaviour as source-backed actions; original complete wildcard/case capture held below, not a new 40-column run |
| tec-os/03-command-line.md | 30 | Retain Return/case/correction behaviour as source-backed actions; original complete wildcard/case capture held below, not a new 40-column run |
| tec-os/03-command-line.md | 31–44 | Retain Return/case/correction behaviour as source-backed actions; original complete wildcard/case capture held below, not a new 40-column run |
| tec-os/03-command-line.md | 46–49 | Retain Return/case/correction behaviour as source-backed actions; original complete wildcard/case capture held below, not a new 40-column run |
| tec-os/03-command-line.md | 129 | Combine DIR/program practical actions with actual Machine 1 evidence; exhaustive grammar remains Appendix J |
| tec-os/03-command-line.md | 377 | Combine DIR/program practical actions with actual Machine 1 evidence; exhaustive grammar remains Appendix J |
| tec-os/03-command-line.md | 621 | Retain recall/edit actions without fabricated results; complete original 80-column history capture held below with 78127ec provenance |
| tec-os/03-command-line.md | 623–631 | Retain recall/edit actions without fabricated results; complete original 80-column history capture held below with 78127ec provenance |
| tec-os/03-command-line.md | 633 | Retain recall/edit actions without fabricated results; complete original 80-column history capture held below with 78127ec provenance |
| tec-os/03-command-line.md | 634–651 | Retain recall/edit actions without fabricated results; complete original 80-column history capture held below with 78127ec provenance |
| tec-os/05-drives-and-cache.md | 1–6 | Combine saved-versus-pending work consequence in the practical ending; drive/volume mechanics remain Chapters 4/17 |
| tec-os/05-drives-and-cache.md | 8 | Combine saved-versus-pending work consequence in the practical ending; drive/volume mechanics remain Chapters 4/17 |
| tec-os/05-drives-and-cache.md | 10–14 | Combine saved-versus-pending work consequence in the practical ending; drive/volume mechanics remain Chapters 4/17 |
| tec-os/05-drives-and-cache.md | 16–20 | Combine saved-versus-pending work consequence in the practical ending; drive/volume mechanics remain Chapters 4/17 |
| tec-os/05-drives-and-cache.md | 123 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 125–133 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 135–139 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 141–145 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 147–155 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 157–163 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 165–167 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 169–178 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 180–182 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 184–187 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 189 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 190–199 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 201–205 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/05-drives-and-cache.md | 207–210 | Combine successful flush and failure/removal qualifications in the practical ending. Detailed cache mechanisms and measured timing remain Chapter 18; original failed-close recipe/output held below as historical evidence |
| tec-os/02-console.md | 264–267 | Retain selected Shift/Ctrl, Backspace, Ctrl-X/U and Ctrl-W/N actions in Correcting and recalling a line; Ctrl-C safety in ending; unselected technical rows remain Chapters 6/8 |
| tec-os/02-console.md | 268–269 | Retain selected Shift/Ctrl, Backspace, Ctrl-X/U and Ctrl-W/N actions in Correcting and recalling a line; Ctrl-C safety in ending; unselected technical rows remain Chapters 6/8 |
| tec-os/02-console.md | 303 | Retain selected Shift/Ctrl, Backspace, Ctrl-X/U and Ctrl-W/N actions in Correcting and recalling a line; Ctrl-C safety in ending; unselected technical rows remain Chapters 6/8 |
| tec-os/02-console.md | 305–306 | Retain selected Shift/Ctrl, Backspace, Ctrl-X/U and Ctrl-W/N actions in Correcting and recalling a line; Ctrl-C safety in ending; unselected technical rows remain Chapters 6/8 |
| tec-os/02-console.md | 309 | Retain selected Shift/Ctrl, Backspace, Ctrl-X/U and Ctrl-W/N actions in Correcting and recalling a line; Ctrl-C safety in ending; unselected technical rows remain Chapters 6/8 |
| tec-os/02-console.md | 311 | Retain selected Shift/Ctrl, Backspace, Ctrl-X/U and Ctrl-W/N actions in Correcting and recalling a line; Ctrl-C safety in ending; unselected technical rows remain Chapters 6/8 |

## Sequential writing passes

The generous draft was written only after the receipt and artifact read. Its
SHA-256 is c137569ad059513d449cbe83437d2598678eb6a54aaf67c282dca64dfd52dfe7.
That draft supplied the full route before reduction. It introduced no host,
browser, memory-map or driver-implementation prerequisite.

The thematic pass kept preparation before power-on, prompt before DIR, names
before assembly and editing actions before the later commands. SAMPLE remains
the first built/run program. BANNER and pagination stay in Chapters 2/3. The
ending teaches the successful action and its failure exception.

The separate deletion pass removed the reader-facing statement that the session
was reviewed and the repeated prepared-input sentence. It removed the generic
claim that device actions belong to the supplied program and the reassurance
that understanding instructions is unnecessary. It retained the source/program
distinction because it explains rebuilding after an edit.

The craft/agency pass replaced changing-drive/changes and changing-source/change
echoes with the current-drive relation and assembly consequence. The first gate
flagged the paragraph containing you do not need to understand. The complete
paragraph was reread and its two deletable closing sentences removed. The
resulting gate has no findings. No inanimate subject receives thought or social
intention.

The punctuation pass read every complete paragraph and each key-table row.
Removed optional conjunction commas in the key-repeat and dropped-write joins.
Retained the console definition, current-drive definition, the In SAMPLE.ASM
prefix boundary, decimal grouping, the conditional empty-prompt boundary and
the list separators needed for the command/device facts. Literal excerpt
punctuation is unchanged. There is no authorial semicolon, em dash or serial
comma. The final full read checked the safety instructions across paragraph
boundaries, including the need to save/exit before flushing.

The complexity report on the revised reader draft returns 114 sentences
with no broad shortening. Metadata LONG/ECHO/SHORT prompts are immutable
provenance rather than running reader prose. Power-on introduces the cold
excerpt; the automatic GLCD line is distinguished from reader input; the ASM
definition establishes source text; SAMPLE already on A locates the build;
typing SAMPLE introduces actual execution. Those SHORT prompts carry facts or
steps and remain. Type/types refers to the action and file types, not an
inflection echo of one meaning. Earlier commands omitted is metadata for an
exact excerpt. No numerical result is a quality acceptance.

## Actual final editorial checks

The final reader SHA-256 is
dc76d143773c963725b235256b3268b23f9be6068d40e07382a1eb6765e7d015.
The actual command arguments, script SHA-256 values, exact input identity,
exit codes and complete output from prose_gate and sentence_complexity are
recorded as data in chapter-01-readiness.json. The reader gate has no findings. A record-only flag on attributing the count
to the report was inspected and reworded as numerical figures.
The final complexity figures are 114 sentences, mean 11.5 words and 0.50 joints
per sentence. Its 9 percent flagged figure includes metadata. The dispositions above
follow a full paragraph read, not a numerical acceptance rule.

All six current reader fences were rechecked against their recorded row
slices. All nine assigned historical fences were independently compared with
frozen 10821b6 and are byte-identical in this record. The new Chapters 2/3 opening
passages were read after their drafts appeared. Chapter 2 can start from the A
prompt supplied here. No neighbouring draft was edited.

## Historical examples retained outside the new reader route

The following complete original literal units retain TEC-OS78127ec and their
actual commands as recorded in the frozen book. This is preservation of supplied
historical evidence, not a claim that a checked header establishes a new run.
Serial/80-column text is not substituted for the accepted cold40 session.
The wildcard and failure fixtures are not hidden prerequisites.

### tec-os/01-introduction.md:44–52

<!-- node tools/capture.mjs -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>GLCD.SVC

A>
```

### tec-os/01-introduction.md:82–87

<!-- node tools/capture.mjs DIR -->
```text
A>DIR
MOUNT.COM    GLCD.SVC     STARTUP.CMD  TED.COM      SAMPLE.ASM   TAS.COM
6 files, 980K free
A>
```

### tec-os/01-introduction.md:98–104

<!-- node tools/capture.mjs B: DIR A: -->
```text
A>B:
B>DIR
NO FILE
B>A:
A>
```

### tec-os/01-introduction.md:115–125

<!-- node tools/capture.mjs "TAS SAMPLE" SAMPLE -->
```text
A>TAS SAMPLE
SAMPLE.COM written

A>SAMPLE
Hello from TEC-OS.
Screen: 0 by 0
Back to the prompt.

A>
```

### tec-os/01-introduction.md:137–142

<!-- node tools/capture.mjs NOSUCH -->
```text
A>NOSUCH
NOSUCH?

A>
```

### tec-os/03-command-line.md:31–44

<!-- node tools/capture.mjs "dir *.com" "DIR ????.COM" "DIR A:G*.*" "DIR B:" -->
```text
A>dir *.com
MOUNT.COM    TED.COM      TAS.COM     
3 files, 980K free
A>DIR ????.COM
TED.COM      TAS.COM     
2 files, 980K free
A>DIR A:G*.*
GLCD.SVC    
1 file, 980K free
A>DIR B:
NO FILE
A>
```

### tec-os/03-command-line.md:634–651

<!-- node tools/capture.mjs --board pico --screen "DIR *.SVC" CON "@start "$'\x17\x17' -->
```text

TEC-OS 0.1 for TEC-1G
A: SYSTEM
B: WORK

A>GLCD.SVC

A>DIR *.SVC
GLCD.SVC
1 file, 980K free
A>CON
CON: CRT:
A>DIR *.SVC
GLCD.SVC
1 file, 980K free
A>
```

### tec-os/05-drives-and-cache.md:184–187


```sh
cp dist/starter.img nodata.img
truncate -s 2113536 nodata.img
```

### tec-os/05-drives-and-cache.md:190–199

<!-- node tools/capture.mjs --card nodata.img "@start SAVE 1 B:X.COM" "@key x" "DIR B:" -->
```text
A>SAVE 1 B:X.COM

Bdos Err On B: Bad Sector
Write lost
A>DIR B:
X.COM       
1 file, 8176K free
A>
```

## Limits

Only the new Chapter1 draft, its readiness dossier and this record change.
Independent chapter factual/editorial review, final navigation, whole-book
reading and publication remain open. The scoped workflow receipt is not
whole-batch or physical acceptance. No product code, import, test, build,
assembler, emulator or capture ran during this writing step.
