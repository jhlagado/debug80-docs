# Replacement outline for independent review

Status: proposed. Complete reading of all 37 original files is recorded in
`reading-ledger.json`. No reader-facing rewrite begins until the independent
outline review is disposed of and this checkpoint is recorded as closed.

## Reader route and evidence

The opening uses a prepared TEC-1G configuration: 4 MHz FAST setting, required
U9 RAM, 80-column PICO9918 console and enabled matrix keyboard, qualified ROM
and a byte-for-byte qualified starter card with SYSTEM on A and WORK on B.
The keypad NMI jumper is off. These are preparation requirements, not claims
that a physical board was run. The demonstrated route will be model-verified;
physical preparation and hardware qualification have their own later reference.

The ROM and card are supplied/prepared before the first instruction. Repository
installation, image creation and ROM construction are not hidden prerequisites.
The opening does not require a browser, host shell or new driver configuration.
The original GLCD.SVC and STARTUP.CMD remain unchanged. One short sentence can
identify an automatic startup line; no loader explanation is needed there.

The first chapter retains the existing supplied SAMPLE build/run experience.
The second extracts the small authored banner from the former Chapter 7 and
teaches TED/save/TAS/run/reopen, without FCBs, host compilation or chaining.
Normal editing and recall appear with the first commands rather than after
conditional chains. Successful preservation is an action with an observable
prompt and a failure exception, not an introduction to cache architecture.

The new banner sequence must be proven before its explanatory prose. The
bounded allocation request and validation plan are separate from outline
acceptance. Source qualification is preparing at ea3ef3d; that is not a final
pin or a checked claim. Retained historical evidence remains labelled by its
actual build. No deployment or product-policy change is part of this outline.

## Prepared reading material and assembly contract

Pagination uses the qualified starter card's existing `A:SAMPLE.ASM`, read with
`TYPE A:SAMPLE.ASM` at the normal 80-by-24 console. Its source is already present
before Chapter1 and is long enough for the intended screenful demonstration;
the exact pause/cancel/continue sequence must be verified on the offered card.
No generated LONG.TXT, extra directory-full fixture, shell or card-tool chapter
is a prerequisite. The original host-created pagination fixture and all its
recipe/output stay together in28 as reproduction material. The prepared volume
material is SYSTEM on A and empty WORK on B from the actual starter recipe.
Chapter4 lists those with MOUNT before changing any selection. Later host-made
read-only/extra-volume cards are explicitly prepared in5, not assumed in3/4.

Chapter2 is a guided copy/change exercise, not an assembly-language prerequisite
for ordinary use. It explains ORG as placement for this program, registers as
small CPU storage, LD as loading a value/address, C=9 plus DE as this print call,
CALL/RET as entering the routine and returning, DB as literal bytes and the
CR/LF/dollar terminator. It does not promise general Z80 instruction teaching.
From8 onwards, programming assumes the ability to read labels, numeric literals,
register pairs, branches and a short assembly listing. Chapter8 explicitly
establishes call/result clobbering, PUSH/POP and the inherited return word before
examples use them. Chapter9 teaches the precise FCB/DMA/page-zero facts before
SHOW. Chapter10 establishes memory/private stacks before raw BIOS KEY. Readers
seeking instruction-set teaching are told that prerequisite at the route choice,
not after encountering an unexplained listing.

## Chapter ladder

Each row states a single job, established prerequisites, an observable result
and the subjects that job justifies. Titles and numbers are provisional until
review closes; old paths remain in place meanwhile.

| New | Job and outcome | Prerequisites | Included because needed for that job |
| --- | --- | --- | --- |
| Front door | Choose first-session, programming, internals or lookup route and identify the evidence offered | None | Prepared setup, contents and concise model/board boundary; no interface syllabus |
| 1. First session | Power on, recognise A>, list files, select B and return, assemble/run supplied SAMPLE, preserve work | Prepared configuration stated before power-on | Banner/drive/prompt, names, DIR, basic correction/cancel/recall, supplied assembly command, visible output, safe Ctrl-C before reset/removal and what failure looks like |
| 2. Make a small program | Enter BANNER in TED, save, assemble/run, change text, repeat and reopen saved work | Chapter 1 commands, prepared TED/TAS on A | Small print listing, keys used, source versus COM, tool-drive lookup only as needed, failed-build correction and successful preservation; verification precedes prose |
| 3. Work with files | Read, copy, rename and selectively erase files; stop/continue long output | First two sessions | TYPE/COPY/REN/ERA, basic wildcards, useful messages, pagination with prepared material, recovery from a mistyped name; full grammar in J |
| 4. Drives and user areas | Locate a file/tool, select a volume and explain which file a command will run | Files and drive letters | COM programs finish and return; SVC services stay installed; practical SERVICES/install/UNLOAD vocabulary first, then MOUNT, labels/indexes/slots at user level, user areas, complete search precedence and service exception, volume/file protection; no allocation-vector implementation |
| 5. Cards on the PC | Copy a card safely, extract work and prepare a new card | Files, drives and safe session end; explicit host setup | tecvol, images/containers, read-only flags, create/recipe, physical-device identity consequence, verification/recovery and browser import distinctions |
| 6. Choose a console | Use serial, PICO widths or GLCD and recover the intended console | Working baseline, file use and operator COM/SVC distinction from4 | Devices and their names in the correct relationship, CON, settings/FAST/input limits, keyboard differences, terminal subset and concrete silent-output recovery; IOBYTE encoding belongs to programming/reference |
| 7. Commands at startup | Make a short startup file, bypass it and diagnose its visible result | Files, consoles, user areas and operator install/list/remove vocabulary from4 | One-record limits, display line behaviour, quiet absence, keypad bypass and reset lifetime; implementation later |
| 8. Call TEC-OS | Write a small interactive program through BDOS | Authored banner and assembly basics | Locally establish registers, CALL/RET, return word and small stack/PUSH/POP use; BDOS register/result contract, character/string/line I/O, ordinary input preservation and error conventions. Raw BIOS/KEY/private-SP waits for10 |
| 9. Read and write a file | Open/read then make/write/close a file without losing the caller's state | BDOS calls, files and locally taught PUSH/POP from8 | Before SHOW locally teach page zero, command tail/default parsed FCB, all36 bytes, drive/name fields and CR; then DMA at0080h, records, sequential state, returned errors and close/flush consequences; extents as needed to explain limits, exhaustive fields in A |
| 10. Memory for programs | Choose code/data/stack space and respect resident state | Calls, buffers and stack basics | 0100h, dynamic top at0006h, inherited/private stack, page zero/tails/load drive, SAVE debugging use, restart-vector/bank safety; after these contracts teach raw BIOS table lookup and the complete KEY/private-SP example; detailed allocation later |
| 11. Use the board's devices | Read status, draw/text/beep and release a claimed display safely | Calls, memory and console distinction | ABI check, shared-port reason, chosen examples then hardware-service breadth, claim/restore, font and PICO record; API lookup in B |
| 12. Results and command chains | Use conditional pieces and hand the next command to CCP | Commands, program exits and DMA | Return-code convention, !/:, function108/47, normal/drop paths, startup interplay only after basic chains |
| 13. Write a resident service | Assemble/install/use/remove a small hook, then publish/depend on records | Calls, memory, stacks and hardware interfaces | SVCFMT, lifecycle, hook restoration, flags/claims, publication, dependency and stack declaration; PC route after host setup |
| 14. State and memory inside TEC-OS | Explain what survives exit/reset and locate it in the map | Caller memory and service lifetime | Fixed/banked address space, workspace, vectors, four stacks, measured base versus bounds and no-stack bank rule; exhaustive addresses in C |
| 15. Reset and boot | Trace reset to first prompt and compare a warm boot | State lifetimes, console/storage concepts | Overlay/recognition, RAM check, probes, vectors, selection recovery, flush/order and qualified timings |
| 16. Console paths | Trace a byte/key through the BIOS and selected terminal | Program console calls and state | RAM BIOS hooks, IOBYTE requested/applied modes, buffering, serial/keyboard mechanisms, parser, row/page routines, palette and claims |
| 17. Card blocks and volumes | Trace a card command and CP/M record to its physical block | User volumes, records and state | SPI/init/errors, container validation, DPH/DPB, deblocking, write types and volume service boundaries |
| 18. Cache and persistence | Explain hit/miss, ordered writes and exact failure persistence | Card blocks, bank/state rules and read/write calls | Cache invariants, copies, replacement, through/behind, directory ordering, explicit/warm flush and loss, interrupt latency; reproducible measurements |
| 19. A file through the BDOS | Trace make/write/close/open/read and free-space state | File API, record mapping and cache | FCB/extents/maps, search modes, allocation/login, warm rebuild, error modes and compatibility; console processing linked to16/8 rather than interrupting file lifecycle |
| 20. From prompt to program | Follow typed command through parsing, lookup and launch | Practical commands, page zero and BDOS | Entry/source priority, parser/built-ins, LOADA/search, capacity boundary, PREPPAGE/ARGS and stack entry; exhaustive grammar in J |
| 21. Chains across a warm boot | Prove why the remaining command survives and what drops it | Practical chains, CCP and state | CHPOS/retained buffer, piece extraction, return-code ordering, CHDROP, function47 validation/copy and failed-flush qualification |
| 22. The history ring | Explain bounded recall storage and overwrite without fragments | Practical recall, line input and banking | HFLAG, HHEAD/HPOS invariant, store/dedup, traversal/editing and warm/reset lifetime |
| 23. Numbered-service dispatch | Follow an ABI call and account for its registers, bytes and stack | Hardware interfaces and assembly/caller stacks | Dispatcher, each hardware routine/font, shared port, RTC, ownership and conservative bounds |
| 24. Loading and removing services | Trace validation, relocation, INIT, publication, rollback and UNLOAD | Authored services, page allocation and registry | Resident entry/header, seven steps, outcome states, registry limits/generation, claims, checks versus trust; complete format in H |
| 25. Startup inside the CCP | Trace one record through prompts and quiet device outcomes | Practical startup, CCP, loader and console | STPOS/STREC, first read/bypass, exact boundary/echo behaviour, display switching, LCD ownership and quiet-result gating |
| 26. Build the ROM and media | Reproduce the qualified artifact and understand its organisation | Host setup and implementation map | Source order, selected assembler/default facts, generated geometry/font/config, census/hash checks and prepared media; actual build output only |
| 27. Diagnose the machine | Interpret card failure or run a separate hardware diagnostic safely | Prepared setup, model/board distinction and storage failures | Prompt/retry, diagnostic ROM identity/checksum, bounded test scope, report, NMI hazards and model-versus-board comparison |
| 28. Reproduce the evidence | Drive the host model and understand exactly what a passing run establishes | Runtime mechanisms and host setup | Shared machine/options, byte versus screen/serial evidence, deterministic clock, write watches, fixtures, pins, tests and web implementation; no board inference |

The early route needs only Chapters1–3 for its first useful workflow. Later
operator chapters are independent tasks with explicit prerequisites, not steps
required to print the banner. Programming chapters build from that working
experience. Internal chapters explain operations already encountered.

## Reference ladder

| Reference | Job / prerequisite / outcome | Disposition |
| --- | --- | --- |
| A. BDOS functions | After call/FCB concepts, locate complete registers, side effects and errors by number | Retain all contracts/no-ops; remove only duplicated teaching transitions |
| B. ROM interfaces | After ABI/claim concepts, use a numbered service or PICO record correctly | Retain versions, modes, bounds, costs, examples and all exceptions; label measured versus bounded |
| C. Memory map | After program/state chapters, locate a qualified address and its lifetime | Retain tables and reproduction; rebuild only from offered artifacts, never silent repinning |
| D. Messages and recovery | From a visible message, choose next action and understand partial results | Retain all causes/remedies and old-card migration; crosslink action chapters before internals |
| E. Container format | After card/record concepts, decode and validate bytes | Retain fields, versions, checks, geometry and corruption demonstrations |
| F. tecvol | After host setup, execute exact host syntax and options | Retain all nine commands, status/protection/text/atomicity rules and worked card |
| G. Hardware preparation | Before physical use, check requirements; later locate ports and constraints | Split concise prerequisite checklist near opening from full port/latch/NMI reference, preserving evidence scope |
| H. Service format | After service authoring, decode on-disk and compare resident header | Retain all fields/checks, dependency/gap examples and actual driver dump |
| I. Web page | Choose controls/input and preserve/import a browser card | Retain all controls, save/transaction notices and exact rewrite rules; optional route, not baseline prerequisite |
| J. Command reference (new) | After ordinary command use, resolve exact grammar without reading implementation | Collect complete syntax, forbidden characters, wildcard padding, attributes, SAVE limits, search and confirmation rules; link mechanisms rather than duplicating them |

## Material accounting rules

`movement-units.json` controls the movement of every paragraph, table, list,
code/output fence and capture/provenance comment by source range and destination
subsection. Its explicit sentence-split qualifications govern mixed paragraphs.
`material-crosswalk.json` is the section index, including front
matter and appendix subsections, with destinations derived from the controlling movement units. The detailed reverse
outlines retain the paragraph/example jobs under each heading. The reverse outlines are historical reading notes, not competing movement authority.
Any contradiction must be repaired before prose. A heading with several destinations
is split at the controlling range records and named sentence fragments. No technical
feature is removed by omission from the short ladder table.

Remove only duplicated roadmap/syllabus sentences, repeated full explanations
already assigned an authoritative home and rhetoric with no independent fact.
Retain concrete examples, counterexamples, limits and failure qualifications.
A duplicated example may become a cross-reference only if its complete verified
recipe/output remains at a named destination. Record any such decision during
chapter revision; do not silently delete it at outline stage.

No physical claim follows merely from source or model execution. A safety detail
in the opening must change an immediate action or explain a failure consequence.
The opener identifies the supported configuration, source/media offer and actual
model evidence before the first command. Display policy is described as shipped.

## Review and rewrite execution

Independent outline review must check the connected opening, prerequisite graph,
complete section crosswalk, preservation of supplied SAMPLE and separation of
small banner from FCB/host/chaining material. Findings receive explicit dispositions.
Only after closure does reader-facing prose start.

Each bounded chapter/reference is then drafted or revised through: complete
passage read; generous connected draft; mechanical gate; thematic and teaching
order; sentence deletion; agency; every-comma/punctuation read; technical/literal
check; journey read-back; independent editorial and factual review. Retained
passages receive every pass. Track actual completion, not a blanket assertion.
New/changed examples require allocated verification before result-based prose.
While runtime work waits, other chapters and source-only checking continue.
Final acceptance needs the offered source pin, resolved citations/navigation,
complete final reader-order read and closed independent result reviews. No publish.
