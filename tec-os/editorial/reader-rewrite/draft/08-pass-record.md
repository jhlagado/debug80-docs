# Chapter 8 pass record

## Scope and reading

I own only `draft/08-call-tec-os.md` and this record. The closed outline at
0e4feea, recorded3060e71, establishes a BDOS-only interactive route after the
small authored program. All source claims use offered TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd` through git object text. This is
source-only authoring, not a checked runtime chapter or a new final pin.

I read old01,02,07 and09 fully before drafting, including their source,
tables, recipes, captures and qualifications. I read every destination8 unit
and its fragment overrides, the closed outline, accepted source-question
dispositions and the Chapter9 reverse-outline notes. House STYLE and the
full human-writing, teaching and course-writing standards and their loaded
references govern this chapter. I did not execute or import any program,
fixture, test, build or capture. Text-only prose checks are separate.

The job is to extend ordinary console programming through BDOS calls.
CALL/RET, inherited return word, register changes and small-stack PUSH/POP
are explained before either example. FCB/DMA and complete SHOW remain9.
Raw BIOS/KEY and private-SP placement remain10. The banked implementation,
terminal parser and numbered hardware services are later subjects.

KD243/KS48 changes the planned opening to40columns with TEC Compact. It does
not repin this source-only chapter or qualify a new font/default. No width
or font-dependent output is introduced. Historical material retains its
actual provenance. The lead owns the outline/index profile amendment.

## Literal examples and evidence

No assigned destination8 unit contains a complete program or output fence.
The console table and the explicit ^P row are preserved. I added two bounded
source examples to ground the call contracts without inventing output:

- The PUSH HL/PUSH BC/call/POP BC/POP HL fragment is copied unchanged from
  old07's historical SHOW listing. The full fixture and output stay together
  at their Chapter9 destination. The fragment assumes the character is in A,
  with HL and B holding live caller state. Its stack operations are traced,
  not newly executed.
- LINE is copied byte for byte from `78127ec:test/programs/line.asm`. I also
  read `ea3ef3d:test/programs/line.asm` and the relevant BDOS functions. The
  listing is unchanged at that offer. It reads a bounded line and calls9
  with fixed GOT data. There is no fabricated output fence, claimed build
  size, fresh runtime result or claim that it echoes BUF through function9.

The original PC example environment was atom-z80 0.3.7. The header distinguishes
historical source from current source inspection. No TED/TAS workflow or new
banner has been run or used as proof. LINE's role here is source-backed teaching,
not a newly qualified example run. Its runtime confirmation remains held.

## Controlling old-unit dispositions

Ranges refer to the map's original book base10821b6. The table lists every
whole unit assigned8. Explicit fragment overrides below take precedence.

| Original range | Draft home and disposition |
| --- | --- |
| `01-introduction.md:25–29` | A COM program and its calls: retain CCP/BDOS/BIOS roles, scope hardware independence to ordinary BDOS calls. |
| `02-console.md:318–324` | Input while output is running: preserve pause/resume, abort, invisible list copy and one pending key. |
| `07-first-program.md:25–28` | A COM program and its calls: preserve0100h/raw COM contract, clarify that literal data are program bytes too. |
| `07-first-program.md:30–38` | Call contract, console table and memory-top pointer in the first section: preserve C/E/DE/A/HL, no general register preservation and0006h. File table rows go9. |
| `07-first-program.md:40–42` | Call contract, console table and memory-top pointer in the first section: preserve C/E/DE/A/HL, no general register preservation and0006h. File table rows go9. |
| `07-first-program.md:44–49` | Call contract, console table and memory-top pointer in the first section: preserve C/E/DE/A/HL, no general register preservation and0006h. File table rows go9. |
| `07-first-program.md:51–51` | Call contract, console table and memory-top pointer in the first section: preserve C/E/DE/A/HL, no general register preservation and0006h. File table rows go9. |
| `07-first-program.md:351–351` | Calls, returns and saved values / Returning to the prompt: preserve inherited0000h and all ordinary/abort exit forms, selection and flush with failure qualification. |
| `07-first-program.md:353–355` | Calls, returns and saved values / Returning to the prompt: preserve inherited0000h and all ordinary/abort exit forms, selection and flush with failure qualification. |
| `07-first-program.md:357–364` | Calls, returns and saved values / Returning to the prompt: preserve inherited0000h and all ordinary/abort exit forms, selection and flush with failure qualification. |
| `07-first-program.md:366–373` | Calls, returns and saved values / Returning to the prompt: preserve inherited0000h and all ordinary/abort exit forms, selection and flush with failure qualification. |
| `09-programs-and-console.md:1–6` | Reconstruct title/front matter and separate historical/source-only header. |
| `09-programs-and-console.md:8–8` | Reconstruct title/front matter and separate historical/source-only header. |
| `09-programs-and-console.md:10–11` | Reconstruct title/front matter and separate historical/source-only header. |
| `09-programs-and-console.md:13–17` | A COM program and its calls: introduce BDOS console route, defer raw BIOS and terminal implementation. |
| `09-programs-and-console.md:19–19` | Printing, edited input and direct-I/O sections: retain all six function rows and their takes/results. |
| `09-programs-and-console.md:21–22` | Printing, edited input and direct-I/O sections: retain all six function rows and their takes/results. |
| `09-programs-and-console.md:24–31` | Printing, edited input and direct-I/O sections: retain all six function rows and their takes/results. |
| `09-programs-and-console.md:33–42` | Reading a key or edited line / Input while output is running: retain tabs/list copy/pending-key/pause/abort/editing facts. |
| `09-programs-and-console.md:44–48` | Direct input and the console functions: retain function6 processing distinction, keep both input/output at BDOS level. |
| `09-programs-and-console.md:50–50` | Replace orphan BIOS/level-selection heading with a bounded Chapter10 pointer. Its raw-call/body units are assigned10, not reproduced here. |
| `09-programs-and-console.md:153–153` | Replace orphan BIOS/level-selection heading with a bounded Chapter10 pointer. Its raw-call/body units are assigned10, not reproduced here. |

The old07:44–47 header and function2/9 rows belong8 and are present in the
complete six-row console table. The15/20 file rows at48–49 remain9. The old
sentence introducing “two programs/four functions” is replaced by the actual
console lesson, with its concrete2/9 facts preserved. AppendixA lookup remains.
The old02:310 ^P table row is preserved verbatim with a reconstructed header.
The old09 headings at50 and153 have no raw BIOS body here. Their body units
remain at10. This chapter does not prematurely teach KEY or its private SP.

## Source proofs

I read the following instruction paths at the offer. PartI convention keeps
these detailed source lines in this record rather than between each teaching
paragraph. Z80 CALL/RET/PUSH/POP descriptions are instruction semantics, not
measured resource results. Stack-space arithmetic is stated separately.

| Claim | Source proof |
| --- | --- |
| Raw COM/entry | `src/cpm/ccp.asm:19–25,519–536,685–715`: the image loads from0100h and CMDRUN jumps there after placing WBOOT=0000h on the stack. The loader does not strip an executable header. Literal code/data are the image. |
| BDOS and BIOS boundary | `src/cpm/bdos.asm:14–35,121–149`: named BIOS entries implement device operations below the BDOS entry, which saves the caller's parameter/stack. This supports ordinary hardware-independent calls, not blanket compatibility with every machine. |
| C/E/DE and results | `src/cpm/bdos.asm:121–149,235–252,332–341,414–433`: C dispatches the function, PARAM receives DE, output2 uses its low byte E, print9 uses the address, RETA/RETWORD supply A or HL. No general register-preservation contract exists. |
| Inherited return and stack | `src/cpm/ccp.asm:527–536`:32-byte CCP stack minus the two-byte inherited word gives30 free bytes. `src/boot.asm:412–420` writes0000h's JP through RAMBIOS+3. `src/cpm/bdos.asm:137–141,245–252` switches to the BDOS stack and restores OLDSP before RET. A CALL or PUSH uses two caller bytes; two saved pairs plus a pending call use6, not a measured high-water claim. |
| Preserved-value fragment | Full old07 SHOW listing: the seven copied lines push HL then BC, load E/C, call BDOS and pop BC then HL. The pointer/count are restored and SP is balanced. The complete example belongs9. |
| Print1/2/9 | `src/cpm/bdos.asm:316–341,414–433`:1 obtains/echoes a key and returns it in A. 2 emits E. 9 reads until dollar without sending it. Zero is not the print9 terminator. |
| Buffer and LINE | `test/programs/line.asm` at78127ec andea3ef3d are identical. `src/cpm/bdos.asm:454–470,504–531,740–748` uses maximum/count/character bytes. LINE reserves20 after its two metadata bytes, reloads DE/C for GOT and returns on the inherited stack. No automatic dollar terminator is appended to input. |
| Edited-line keys and end | `src/cpm/bdos.asm:477–498,559–575,606–621,638–670,699–729`: CR/LF or full input ends the line. BS/^X erase, ^R retypes, ^C aborts only when empty. `:540–553` makes ^W/^N ordinary input for unmarked program calls. |
| Tabs and list | `src/cpm/bdoscon.asm:170–191,229–285` expands tabs for ordinary output/echo, tracks columns and optionally calls BIOLST. `:251–264` resets on CR. `src/console.asm:559–571` implements no-op LIST. `src/cpm/bdoscon.asm:356–360` and `src/cpm/bdos.asm:533–538` implement ^P in output/line input. |
| Pause and pending key | `src/cpm/bdoscon.asm:199–204,318–360`: ^S consumes the next key, ^C there aborts, other resume keys are discarded. An unrelated output-time key becomes PENDCHR/PENDING. `:160–168` suppresses another hardware read while one is held and `:126–137` consumes it on the next read. |
| Direct6 and status11 | `src/cpm/bdos.asm:371–397` tests E=FFh for nonblocking, un-echoed input and otherwise directly calls BIOCOT, bypassing tab/list/pause processing. `:767–792` reports1/0 and can buffer the input byte. Control handling by the selected console remains separate. |
| Exit and default errors | `src/cpm/bdos.asm:257–259,606–621`; `src/cpm/bdoscon.asm:47–72,318–331`: FNZERO and aborts use warm boot. Default disk error prints/waits/jumps CHDROP. Returned-error modes are deferred with file calls to9 and chain consequences to12. |
| Warm persistence and selection | `src/boot.asm:178–215` restores page-zero vectors and video state, flushes and passes0004h to the CCP. `src/cache.asm:307–350,661–668` drops failed flush lines and reports Write lost. `src/cpm/ccp.asm:363–384,46–102` stores/restores selection with A fallback for an unavailable drive. |
| Memory top | `src/boot.asm:421–434`:0005h's jump points at PZTOP, with its address word at0006h. The detailed dynamic top/private stack lesson is10. |

The draft's first source-backed version had the following inline ranges. They
are retained here as an exact citation inventory after moving references out
of the PartI reading path:

- `src/cpm/ccp.asm:19–25`
- `src/cpm/ccp.asm:685–715`
- `src/cpm/ccp.asm:519–536`
- `src/cpm/bdos.asm:14–35`
- `src/cpm/bdos.asm:121–149`
- `src/cpm/bdos.asm:235–252`
- `src/cpm/bdos.asm:332–341`
- `src/cpm/bdos.asm:414–433`
- `src/cpm/ccp.asm:19–25`
- `src/cpm/ccp.asm:532–536`
- `src/boot.asm:412–420`
- `src/cpm/bdos.asm:121–149`
- `src/cpm/bdos.asm:235–252`
- `src/cpm/ccp.asm:527–536`
- `src/cpm/bdos.asm:414–433`
- `src/cpm/bdos.asm:316–330`
- `src/cpm/bdos.asm:435–470`
- `src/cpm/bdos.asm:740–748`
- `src/cpm/bdos.asm:477–481`
- `src/cpm/bdos.asm:504–531`
- `src/cpm/bdos.asm:484–498`
- `src/cpm/bdos.asm:559–575`
- `src/cpm/bdos.asm:606–621`
- `src/cpm/bdos.asm:540–553`
- `src/cpm/bdoscon.asm:170–191`
- `src/cpm/bdoscon.asm:229–285`
- `src/cpm/bdoscon.asm:251–264`
- `src/console.asm:560–571`
- `src/cpm/bdoscon.asm:199–204`
- `src/cpm/bdoscon.asm:318–331`
- `src/cpm/bdoscon.asm:338–360`
- `src/cpm/bdos.asm:533–538`
- `src/cpm/bdoscon.asm:160–168`
- `src/cpm/bdoscon.asm:338–351`
- `src/cpm/bdoscon.asm:126–137`
- `src/cpm/bdos.asm:371–397`
- `src/cpm/bdos.asm:767–792`
- `src/cpm/ccp.asm:532–536`
- `src/cpm/bdos.asm:257–259`
- `src/cpm/bdos.asm:606–621`
- `src/cpm/bdoscon.asm:318–331`
- `src/cpm/bdoscon.asm:47–72`
- `src/boot.asm:178–215`
- `src/cache.asm:307–350`
- `src/cache.asm:661–668`
- `src/cpm/ccp.asm:363–384`
- `src/boot.asm:212–215`
- `src/cpm/ccp.asm:46–102`
- `src/boot.asm:421–434`

## Actual passes and pending work

The complete generous draft is written. Before prose, I checked both historical
code excerpts and the relied-on function/entry/exit paths by text inspection.
Initial prose_gate.py returned zero findings. Initial sentence_complexity.py
reported129 sentences, mean13.0 words,0.61 joints per sentence and8% flagged,
approximate grade6.7. This is a draft-stage report, not final acceptance.

The first source-backed draft and record were committed and pushed as b05cd66.
After that durable draft I applied the following passes to the entire chapter:

- Thematic/teaching: kept the reason for a console call before the register
  contract. Defined byte registers and16-bit pairs locally. CALL/RET and the
  inherited0000h word precede PUSH/POP, which precede the first code fragment.
  Printing precedes key/line input, then pending input and direct I/O. The
  complete table follows the uses it summarises. FCB/DMA and raw BIOS remain9/10.
- Every paragraph/sentence deletion: read each in order, mentally removed it
  and read across its neighbour. Removed the opening's generic convention
  preview and the redundant explanation after the SHOW pointer. Kept short
  stack arithmetic and code-contract sentences because each establishes a
  value or dependency. Split CR/LF values from the string-end explanation.
- Agency/plainness: replaced the register-preservation “promise” with the
  precise absence of a universal kept-register contract. All machine subjects
  perform operations such as reading, writing, echoing or restoring. The
  counterexample about function9's terminator names an actual interface trap.
- Every-comma/punctuation: read every authorial comma and semicolon in order.
  Removed optional conjunction commas in the2/9 comparison, returned-value
  rule, stack-depth consequence and buffer description. Remaining commas
  delimit introductory clauses, apposition or actual lists. Literal source
  semicolons and the complete table are unchanged. No prose em dash or Oxford
  comma remains.
- Technical/literal: re-read the relied entry, console, pending-byte and exit
  paths. Static text comparison confirms the complete LINE listing matches
  both78127ec andea3ef3d exactly, the SHOW fragment is unchanged, the entire
  six-row console table matches old09 and the ^P row matches old02. All49
  ranges in the citation inventory are in bounds across six source files.
  Z80 call/push arithmetic is instruction semantics, not a new measurement.
- Journey: read from title through the final unavailable-drive fallback.
  The reader has the call and small-stack contracts before either example,
  then sees the same DE/C setup for input and subsequent printing. The fixed
  GOT text is distinguished from the counted input. Moved the0006h pointer
  beside the initial call contract so the chapter ends on the returned prompt's
  actual selection rule, without a forecast or summary.
- Gates: prose_gate.py reports zero findings for chapter and pass record.
  Final sentence_complexity.py reports131 sentences, mean12.5 words,
  0.62 joints per sentence and5% flagged, approximate grade6.6. I read all
  flags: short clobber/stack/provenance statements and the20/22-byte explanation
  carry distinct facts. The isolated error-literal flag is a list item, not
  a fragment of explanatory prose. An explicit agency/vocabulary/punctuation
  search supplements the full reading. Diff whitespace checks are clear.

Independent editorial/factual review, source
and runtime acceptance, any allocated example execution and whole-book navigation
remain open. No new banner/font/default is qualified and no publication is made.

## Independent review and local register clarification

The full independent review found no blocker in contracts, prerequisites,
historical excerpts or provenance. Accepted the optional improvement of
defining BC before the save example and included B among the byte registers.
Recast AF saves as the actual PUSH AF instruction. The changed paragraphs
were read for continuity and literal code remains unchanged. Full craft
review found no further issue. No execution was performed. Confirmation
and final qualification remain pending.

## Correction confirmation

Independent confirmation at8aaec1b accepted the local B/BC definition and
PUSH AF clarification. No bounded editorial or factual finding remains.
Current runtime qualification, linked lesson integration and the final
reader-order pass remain pending.

## Reopened new-example gate: LINE

The source-backed addition was not an existing book example. Its test-file
identity does not qualify its full positive workflow. Offered chain.test.mjs
248–258 and441–451 use LINE for abort/reset while input waits. They do not
prove normal line completion, GOT output and ordinary return. No positive
qualified run has been located.

Moved the entire unchanged LINE listing and proposed interpretation out of
reader prose into08-line-example-candidate.md. No code or teaching content
is discarded. Main8 retains the already verified SHOW save/restore excerpt
and source-supported console API contracts. Its full interactive exercise
remains held. This supersedes any earlier implication that static review
closed the example-before-explanation requirement.

Actual positive assembly/input/output/return proof needs its own allocated
run at the adopted source. No new run was performed and no existing guard
allocation was expanded. Source/craft checks remain useful but do not close
this workflow gate.

## Allocated serial LINE result and insertion

The preceding hold is historical. The separately allocated attempt retained
at private Origo71696f2e16a712cb4b84bdbcddaa4389e9e1130a,
studies/p3-tec-os/evidence/book-reader-rewrite/line-ea3-attempt01, supplies
the missing positive result. The sealed offer37d214f4 remains unchanged
with its original UNRUN preparation status. The attempt is a separate record.
The runtime queue records specific serial acceptance. Independent review of
this insertion remains open. No whole-chapter or final-book acceptance follows.

Before writing, read the complete attempt README, attempt/exit records,
guard/log, artifact hashes, result and both case records. Read all retained
console bytes and source-on-card bytes, the compact source and the complete
sealed harness. Rechecked function10's count/characters/end/abort paths at
ea3ef3d src/cpm/bdos.asm435–575,606–621,730–752 and the earlier call/return
source proofs. The harness observes the function10 return address, DE/C at
function9, the final RET's inherited0000h word, entry to zero and WBOOTR,
then the ready user-zero B prompt. It uses the actual TAS-built card on fresh
machines rather than injecting a generated COM. No new execution occurred.

The inserted listing is the measured LINE.compact.asm from offer01, not the
unchanged historical candidate. Its ASCII source has CR/LF lines,455 bytes,
SHA-2565286389ada471b67a8a9427e8a503121ab014feb2a28c36393ed05d838c077ec.
The Markdown listing preserves every line and space with LF line endings.
The card's text conversion adds CP/M EOF/padding to512 bytes, SHA-256
178b4d85b0c8fca82e5cbb5243959aeda49dad9eec0b528670ff4c8d0abab131.
The original candidate source remains unchanged with its prior identity.
Appended a superseded-hold status to08-line-example-candidate.md under the
explicit follow-up instruction. No candidate literal or interpretation changed.

Both retained ATOM assemblies have47 logical bytes, SHA-256
ac814ae008976e85253adde41ecc540a6277d5a550f6a5f91b2903ca22e00318.
Direct byte comparison confirms their equality and the same47-byte prefix
of the actual TAS file. The TAS record is128 bytes, SHA-256
1007379ac47a518df7490b77ad0cf04a7853e6fedd7eec88fd87aefb7445de4b.
The retained harness requires its remaining bytes to be zero. The result's
common symbols are BDOS0005h, GOT0111h and BUF0119h, with START0100h.
These are measured artifact identities, not sizes inferred from source alone.

| Retained observation | Meaning and insertion boundary |
| --- | --- |
| tas-console.bin |33 bytes, SHA-256 c09cf739bdf8930085300495d09171e84e792ae98b09f584d9b231979130df58. Starts TAS LINE, not B>TAS LINE. Exact bytes TAS LINE\r\r\nLINE.COM written\r\n\r\nB>. |
| positive-console.bin |17 bytes, SHA-256 b14e930b25c4be26ddccecd47f3b28d68d47d3088033d9f9fb2b4c64ef70d68d. Starts at function10. Exact bytes HELLO\r\r\nGOT\r\n\r\nB>. Neither the preceding prompt nor typed LINE is supplied. |
| positive.json | HELLO plus CR input, returnedInput true, count5 and bufferHex48454c4c4f. One GOT call, final RET, entry to0000h and WBOOTR. Final prompt is ready on user-zero B. GOT is fixed data, not buffer echo. |
| abort-control.json | Fresh machine, first input03. No function10 return, GOT call or final program RET. One WBOOTR and exact output ^C\r\nB>. This is a separate control, not the positive completion proof. |

Both displayed captures render the retained carriage-return sequences as
lines. Their comments retain the byte boundaries. No prefix was invented.
The positive transcript has no extra blank line between HELLO and GOT:
the two carriage returns do not supply two line feeds.

The input ROM is16384 bytes, SHA-256
2b719d6cbcfc50d48498a5d2a8a7449b23df82306d989c1d7018e4830edf7f09,
with matching D8 SHA-256
ce08bbf59d8b27b5a3cfdb5c71593b6bd5e7d31d0814bde53f091a88d1a49bb2.
The starter input SHA-256 is
0f3d9e33994ac30865b8675c8f8ce7fc493b13a0a840d8e84b7d708107d4266c.
Normal build provenance remains offer17/Origo92cc92c7f360d3a9c963d49f53627f5edd8c1e20.
TAS is dbee66a90816df9a5884a08754ebc2d458a38325, application prefix10295
bytes with SHA-25645c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
ATOM is0.3.7 and the model runtime0.3.3. The serial configuration has
tms/matrix/glcd false, rtc/highCapacity true, ramFill0 and clock
2026-11-01T12:00:00Z. This does not qualify KS48, browser use, a display/font
or physical hardware. SHOW remains explicitly historical78127ec.

Read the whole chapter before insertion and the complete changed input
passage afterwards. Paragraph/sentence deletion retained the buffer-to-call,
build-to-run and input-to-return steps because each establishes a dependency
or observed result. Agency assigns echo to function10, GOT printing to9
and final return to the program. Read every comma and punctuation mark in
the added prose. The listing's semicolons remain literal. The journey pass
keeps the buffer contract before the full program, followed by actual build
and input observations before the wider editing and abort rules. Rechecked
the unchanged SHOW fragment and the candidate's original literal. Manual
craft and static byte checks only: no prose scripts, imports, assembly,
tests, model execution or capture generation were performed for this insertion.

## Latest independent confirmation

Full independent review at8763ba8 found no blockers after the measuredLINE insertion. The compactsource/artifact bytes,47logical versus128padded record, exact console suffixes and source contracts were checked alongside the whole teaching route. Only serialea3proof is accepted.
Final source/profile, remaining workflow and whole-book integration remain
open. No new execution accompanied the confirmation.

## Additional Chapter8 sequence review

Accepted the independent full review at521c4fc6. Removed the duplicate0006h
boundary from8 because10 already teaches the complete limit. Moved the0004h
mutation/exit-selection contract into10 after its page-zero table. Chapter8
now leads its ending with the normal return to the starting drive/user area
and fallbackA. Deleted the retrospective printing-call line and unused file
function-number preview, retaining AppendixA's lookup pointer and the actual
contracts in9/A. Removed three optional conjunction commas. Also aligned
8's final CtrlC bullet with the current-empty-line condition already taught
in its input section and independently checked for AppendixA.

Read complete8 and10's containing page-zero passage before changes and the
changed paragraphs with neighbours afterwards. All literals/captures retain
their exact bytes and actual pins. Crosswalk/disposition records name these
bounded refinements. No runtime, source import or new proof was used.
Independent bounded correction confirmation remains pending.
