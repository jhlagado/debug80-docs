# Chapter 12 pass record

I rewrote only `draft/12-results-and-command-chains.md` and this record.
The independently closed outline is `0e4feea`, recorded by `3060e71`.
This draft is outside the published book. It is ready for independent review,
not final acceptance or publication.

## Brief and reading

The single job is practical success, conditional chains, functions 108 and 47
and TED's build return. I assume the ordinary programming prerequisites of
Chapters 8–11: BDOS calls, FCBs, DMA, command tails, page zero and ordinary
program exits. The route is commands, conditional pieces, return code, EXISTS,
chain cancellation, RUN, TED and startup. The internal buffer layout, CHPOS
arithmetic and CCP instruction walkthrough remain in Chapter 21.

I read the full human-writing skill, its revision playbook and pattern guide,
the course-writing standard and banned patterns, the teaching review standard
and teaching architecture, house STYLE, the complete replacement outline and
source-question dispositions before drafting. I read old Chapter 11 in full,
old03:51–54 and 429–551, old06:129–168, old07 in full for the assigned TED
fragments and their prerequisites, and old21 in full to validate the boundary.
The controlling movement units and fragment overrides take precedence over
historical reverse outlines. I also read the old front-door pass record for
the draft's evidence and integration conventions.

I preserved the two complete assembly listings, all three card-preparation
shell fences, all nine captured output fences and all nine capture recipes
from the assigned passages. These are 14 complete fences in total. A static
text comparison found every assigned fence and capture recipe unchanged.
No source listing, output line, blank line or trailing space inside those
fences was rewritten. The table includes all five TED prefix keys, including
the absent TDB qualification. The B/R rows are repeated here to make the full
prefix table usable, while their first operational explanation belongs in2.

## Evidence boundary

I checked the semantic claims against TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. I inspected source objects with
`git -C /Users/johnhardy/projects/tec-os show ea3ef3d:PATH`.
No build, test, emulator, capture, sample workflow or fixture module was run
or imported. The prose scripts and fence comparison scan text only.

Every retained output remains historical model evidence at `78127ec`.
Its PC examples used `atom-z80` 0.3.7. The application identities remain:

| Application | Thorium revision | SHA-256 |
| --- | --- | --- |
| TAS.COM | dbee66a90816df9a5884a08754ebc2d458a38325 | `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2` |
| TED.COM | 128edb7cbb27de17a9d3a7a747706a5b227b30c4 | `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f` |

Those pins also appear in offered `test/inputs.json`. The new header explicitly
states source-only checking and historical provenance. It does not claim a
whole-chapter runtime check at ea3ef3d. No new banner output is used.

The two original fixtures named `chain.img` remain complete. I identified them
as separate cards and explicitly require recreating the EXISTS/RUN card before
making `chain2.img`. This prevents the relocated examples from accidentally
copying the startup-only card, which has no RUN.COM.

## Semantic source proofs

The ranges in this table are at `ea3ef3d`, except the explicitly named external
application sources. I followed the executable branches rather than relying
on nearby comments or the old prose. Source inspection supports the mechanism,
not current output bytes, addresses inferred from a build or runtime success.

| Claim or example | Source and semantic proof |
| --- | --- |
| Piece ordering, echo and startup priority | `src/cpm/ccp.asm:119–205`: pending pieces are checked before STLINE and keyboard input. MLECHO prints to ! or zero before case conversion. |
| Empty pieces, spaces, lowercase and tail boundary | `src/cpm/ccp.asm:224–284` and `:328–354`: CHSK1 skips spaces/!, MLTK1 converts a–z, MLTK2 writes zero over !. `src/cpm/ccpcmd.asm:456–497` copies only this zero-terminated tail to 0081h and appends zero. Thus later pieces are outside RUN's tail. |
| Conditional failure range and reset per command | `src/cpm/ccp.asm:224–289`: D+1 and E+1 distinguish FF00h–FFFEh from FFFFh. Failure clears CHPOS before STARTED. The later store clears PRGCODE only after a passing condition or unconditional entry. |
| Function108 get/set | `src/cpm/bdos.asm:291–314`: FFFFh selects FNRETG, every other word stores PRGCODE. `:228–252` supplies the zero result for a set and the HL word for a query. This is separate from messages printed by application code. |
| Cold reset clears the result | `src/boot.asm:73–79` clears resident workspace, including `PRGCODE` at `src/ram.asm:386–388`. Warm boot's practical preservation and failure exceptions are checked separately below. |
| CCP failures and successes | `src/cpm/ccp.asm:445–517` routes missing/unloadable commands and nonquiet service failures to BADCMD. `:588–628` stores RCFAIL before printing the message. `src/cpm/ccpfile.asm:660–662`, `src/cpm/ccpmut.asm:181–184` and `:379–381`, `src/cpm/ccpcmd.asm:439–445` route NO FILE, FILE EXISTS, COPY errors and NO SPACE through ERRGO. Successful commands leave the initial zero. |
| ERA answered N | `src/cpm/ccpmut.asm:38–64`: a non-Y answer branches to STARTED before deletion and without setting a failure. |
| EXISTS listing | `src/cpm/ccpcmd.asm:456–470` prepares the first FCB. `src/cpm/bdosfile.asm:236–248` enters open mode with a directory-slot result or FFh. The retained listing's INC A gives Z only for FFh, RET NZ takes success and failure calls108 with FF00h. I traced both branches by inspection. |
| SHOW's printed failure | Full original SHOW listing in old07:253–295 prints NOMSG through function9 and returns, with no function108. This is the concrete program from new9, not a claim that all application error messages imply success. The practical rule follows from the CCP's zero-at-entry store. |
| Function45 and default BDOS error | `src/cpm/bdos.asm:261–275` stores the mode. `src/cpm/bdoscon.asm:47–72` returns errors for FEh/FFh, optionally prints first, and otherwise waits for a key then jumps CHDROP. Returned errors leave chain disposition to the application. |
| Ordinary exit and cancellation | `src/cpm/ccp.asm:532–536` supplies a warm-boot return word. `src/cpm/bdos.asm:257–259` handles function0. `:115–119` clears CHPOS for aborts, `:606–620` does so for ^C on empty function10 input. `src/cpm/bdoscon.asm:318–331` does so for ^C after ^S. |
| Pagination distinction | `src/cpm/ccpfile.asm:475–519` masks the key, sends ^C to PGDROP and Esc/Q to PGSTOP. Only PGDROP clears CHPOS. The practical ^C/Esc/Q distinctions are retained. The complete mask and aliases belong to21. |
| Whole line and recall | `src/cpm/ccpcmd.asm:927–975` uses 127 for startup lines. `src/cpm/bdos.asm:435–460` reads to the buffer maximum and `:738–765` stores the whole typed buffer once through HSTORE. `src/history.asm:177–234` compares/stores the complete line. `32×3+31=127` verifies the stated example by arithmetic. |
| Function26 | `src/cpm/bdosfn.asm:33–50` stores PARAM in CURDMA. RUN passes 0081h rather than the length byte at0080h. |
| Function47 acceptance and rejection | `src/cpm/bdos.asm:67–108`: the scan accepts zero within128 bytes, rejects CR/LF or exhaustion through FNCHNO with A=FFh, and copies only after validation. The accepted path copies128 bytes, sets the first piece and jumps BIOWBT. No use of E selects another operation. Empty input is accepted. |
| Function47 overlap and result | The same copy finishes before warm boot or a new load. The CCP's conditional check therefore reads the calling program's retained code. The accepted call has no return to RUN. A rejected line leaves the old command buffer and position untouched. The retained RUN listing's failure-only print is unreachable for a valid CCP tail, subject to the ordinary source contract. |
| Warm-flush qualification | `src/boot.asm:194–215` calls CWBOOT before CCPENT. `src/cache.asm:307–350` attempts all dirty lines and drops failed lines in CFLALL. `:661–668` clears CHPOS and prints Write lost on failure. This also cancels function47's accepted line. Syntax acceptance never guarantees execution. |
| Drive and user after exit | `src/boot.asm:212–215` takes PZDU into C. `src/cpm/ccp.asm:46–102` decodes user/drive and selects A when the named drive is unavailable. The chapter retains0004h as the ordinary selection contract without replaying that implementation. |
| Startup order and quiet results | `src/cpm/ccp.asm:148–166` processes pending pieces first. `:465–485` gates quiet service absence on STFLAG and TNENODV. `src/cpm/ccpcmd.asm:161–191` gives a missing PICO width interface a quiet startup path, with typed failures routed to BADCMD. `:951–1011` reads later startup lines independently of the command chain. |
| Service INIT/REMOVE use | Function47 dispatch has no caller-kind restriction at `src/cpm/bdos.asm:137–149`. `src/boot.asm:196–200` closes the service busy window on warm boot. Installation/removal outcome details remain in13 and24, not replayed here. |
| Starter content and absent TDB | `tools/lib/starter.mjs:10–17` returns GLCD.SVC and the one-line STARTUP.CMD. Offered `tools/media.mjs:198–210` adds TED, SAMPLE and TAS, with no TDB. Output remains the old card's output. |

### Pinned TED and TAS source

I read the named files with `git show` in `/Users/johnhardy/projects/thorium`
at the exact application revisions above, rather than treating TEC-OS's tests
as proof of external application behaviour.

| Claim | Pinned application source |
| --- | --- |
| ^T dispatch and save before a build | TED128edb7 `ted/src/editor-project.asm:127–185` dispatches prefix keys and ends a key on save failure/cancellation. `:221–305` prepares the build, saves session state and invokes function47. |
| Build returns even after assembler failure | TED128edb7 `ted/src/editor-data.asm:108–113` contains TAS/name/!TED and TDB/name/!TED templates. The editor return is unconditional. `ted/src/editor-start-session.asm:60–168` reads build errors or records success, and `ted/src/editor-start-place.asm:66–84` selects the error file/place. |
| ^T R after a good build | TED128edb7 `ted/src/editor-start.asm:92–129` requires the saved successful-build flag, chains the output then TED and sets a wait flag. A failed build does not run the old output. |
| Tool-drive prefixes | TEC-OS `src/cpm/ccp.asm:519–525` stores PZLDRV. TED128edb7 `ted/src/editor-start.asm:407–420` reads0050h or queries the current drive for0. `ted/src/editor-project.asm:452–506` emits that drive before the tool and the project drive before the source name. This supports the A-tools/B-source example. |
| ^T D/O/F | TED128edb7 `ted/src/editor-project.asm:307–355` chains the debugger or saves/prompts/opens another file. `:406–442` saves and chains the previous file. TDB is optional and absent from the supplied card. |
| Session and first good project build | TED128edb7 `ted/src/editor-project.asm:45–62` writes cursor/top and work-file name. `:187–207` selects MAIN or the pending/current source. `ted/src/editor-start-promote.asm:1–21` only promotes MAIN after a successful build and file update. The draft now preserves that update qualification. |
| COM and DBG outputs | TASdbee66a `src/tas/OUT.ASM:1–45` checks output and debug files and `:91–110` closes/renames the output. `src/tas/DEBUG.ASM:1–23` creates the source-named debug stream. The historical HELLO names are retained as an example, not a new execution claim. |

## Exact old-unit dispositions

The following table enumerates every controlling whole unit assigned to12.
Line ranges refer to the map's original book base10821b6, whose assigned text
was read before drafting. A relocated heading is replaced by the named draft
section. Prose is rewritten with its concrete facts and exceptions preserved.
Every fence and capture-recipe unit is retained verbatim at the named home.
The original checked header is replaced by the explicitly split source/history
header, preserving its application hashes without certifying current captures.

| Old unit | Kind | Draft home and disposition |
| --- | --- | --- |
| `03-command-line.md:51–54` | paragraph | Several commands on one line / Conditional pieces: rewritten or relocated. |
| `03-command-line.md:429–429` | heading | Several commands on one line: rewritten or relocated. |
| `03-command-line.md:431–434` | paragraph | Several commands on one line: rewritten or relocated. |
| `03-command-line.md:436–436` | provenance or capture recipe | Several commands on one line: retained verbatim. |
| `03-command-line.md:437–451` | example source or output | Several commands on one line: retained verbatim. |
| `03-command-line.md:453–458` | paragraph | Several commands on one line: rewritten or relocated. |
| `03-command-line.md:460–462` | paragraph | Several commands on one line: rewritten or relocated. |
| `03-command-line.md:464–464` | provenance or capture recipe | Several commands on one line: retained verbatim. |
| `03-command-line.md:465–474` | example source or output | Several commands on one line: retained verbatim. |
| `03-command-line.md:476–480` | paragraph | Several commands on one line: rewritten or relocated. |
| `03-command-line.md:482–486` | paragraph | Several commands on one line: rewritten or relocated. |
| `03-command-line.md:488–490` | paragraph | Conditional pieces: rewritten or relocated. |
| `03-command-line.md:492–492` | provenance or capture recipe | Conditional pieces: retained verbatim. |
| `03-command-line.md:493–508` | example source or output | Conditional pieces: retained verbatim. |
| `03-command-line.md:510–514` | paragraph | Conditional pieces: rewritten or relocated. |
| `03-command-line.md:516–523` | paragraph | Conditional pieces / The return code / A program that supplies the next command / TED’s build and return: rewritten or relocated. |
| `03-command-line.md:525–525` | paragraph | Ends that drop the chain: rewritten or relocated. |
| `03-command-line.md:527–535` | list | Ends that drop the chain: rewritten or relocated. |
| `03-command-line.md:537–539` | paragraph | Ends that drop the chain: rewritten or relocated. |
| `03-command-line.md:541–541` | provenance or capture recipe | Ends that drop the chain: retained verbatim. |
| `03-command-line.md:542–547` | example source or output | Ends that drop the chain: retained verbatim. |
| `03-command-line.md:549–551` | paragraph | Ends that drop the chain: rewritten or relocated. |
| `06-startup-file.md:129–132` | paragraph | Chains in the startup file: rewritten or relocated. |
| `06-startup-file.md:134–142` | paragraph | Chains in the startup file: rewritten or relocated. |
| `06-startup-file.md:144–148` | example source or output | Chains in the startup file: retained verbatim. |
| `06-startup-file.md:150–150` | provenance or capture recipe | Chains in the startup file: retained verbatim. |
| `06-startup-file.md:151–163` | example source or output | Chains in the startup file: retained verbatim. |
| `06-startup-file.md:165–168` | paragraph | Chains in the startup file: rewritten or relocated. |
| `07-first-program.md:87–89` | paragraph | TED’s build and return, subject to fragment overrides below: fragment split, all five prefix keys included locally. |
| `07-first-program.md:91–97` | table | TED’s build and return, subject to fragment overrides below: fragment split, all five prefix keys included locally. |
| `07-first-program.md:157–161` | paragraph | TED’s build and return, subject to fragment overrides below: fragment split, all five prefix keys included locally. |
| `11-return-codes-and-chaining.md:1–6` | front matter | Opening and split provenance header: rewritten or relocated. |
| `11-return-codes-and-chaining.md:8–8` | heading | Opening and split provenance header: rewritten or relocated. |
| `11-return-codes-and-chaining.md:10–13` | provenance or capture recipe | Opening and split provenance header: historical provenance preserved in split header. |
| `11-return-codes-and-chaining.md:15–20` | paragraph | Opening and split provenance header: rewritten or relocated. |
| `11-return-codes-and-chaining.md:22–22` | heading | The return code: rewritten or relocated. |
| `11-return-codes-and-chaining.md:24–29` | paragraph | The return code: rewritten or relocated. |
| `11-return-codes-and-chaining.md:31–35` | paragraph | The return code: rewritten or relocated. |
| `11-return-codes-and-chaining.md:37–41` | paragraph | The return code: rewritten or relocated. |
| `11-return-codes-and-chaining.md:43–43` | heading | A program that reports failure: rewritten or relocated. |
| `11-return-codes-and-chaining.md:45–46` | paragraph | A program that reports failure: rewritten or relocated. |
| `11-return-codes-and-chaining.md:48–63` | example source or output | A program that reports failure: retained verbatim. |
| `11-return-codes-and-chaining.md:65–69` | paragraph | A program that reports failure: rewritten or relocated. |
| `11-return-codes-and-chaining.md:71–77` | example source or output | A program that reports failure: retained verbatim. |
| `11-return-codes-and-chaining.md:79–80` | paragraph | A program that reports failure: rewritten or relocated. |
| `11-return-codes-and-chaining.md:82–82` | provenance or capture recipe | A program that reports failure: retained verbatim. |
| `11-return-codes-and-chaining.md:83–100` | example source or output | A program that reports failure: retained verbatim. |
| `11-return-codes-and-chaining.md:102–104` | paragraph | A program that reports failure: rewritten or relocated. |
| `11-return-codes-and-chaining.md:106–107` | paragraph | A program that reports failure: rewritten or relocated. |
| `11-return-codes-and-chaining.md:109–109` | provenance or capture recipe | A program that reports failure: retained verbatim. |
| `11-return-codes-and-chaining.md:110–125` | example source or output | A program that reports failure: retained verbatim. |
| `11-return-codes-and-chaining.md:127–129` | paragraph | A program that reports failure: rewritten or relocated. |
| `11-return-codes-and-chaining.md:131–131` | heading | A program that reports failure / Ends that drop the chain: rewritten or relocated. |
| `11-return-codes-and-chaining.md:133–137` | paragraph | A program that reports failure / Ends that drop the chain: rewritten or relocated. |
| `11-return-codes-and-chaining.md:139–142` | paragraph | A program that reports failure / Ends that drop the chain: rewritten or relocated. |
| `11-return-codes-and-chaining.md:144–144` | heading | A program that supplies the next command: rewritten or relocated. |
| `11-return-codes-and-chaining.md:146–155` | paragraph | A program that supplies the next command: rewritten or relocated. |
| `11-return-codes-and-chaining.md:157–157` | paragraph | A program that supplies the next command: rewritten or relocated. |
| `11-return-codes-and-chaining.md:159–174` | example source or output | A program that supplies the next command: retained verbatim. |
| `11-return-codes-and-chaining.md:176–180` | paragraph | A program that supplies the next command: rewritten or relocated. |
| `11-return-codes-and-chaining.md:182–182` | provenance or capture recipe | A program that supplies the next command: retained verbatim. |
| `11-return-codes-and-chaining.md:183–204` | example source or output | A program that supplies the next command: retained verbatim. |
| `11-return-codes-and-chaining.md:206–209` | paragraph | A program that supplies the next command: rewritten or relocated. |
| `11-return-codes-and-chaining.md:211–217` | paragraph | A program that supplies the next command: rewritten or relocated. |
| `11-return-codes-and-chaining.md:219–223` | paragraph | A program that supplies the next command: rewritten or relocated. |
| `11-return-codes-and-chaining.md:225–227` | paragraph | A program that supplies the next command: rewritten or relocated. |
| `11-return-codes-and-chaining.md:229–229` | heading | Chains in the startup file: rewritten or relocated. |
| `11-return-codes-and-chaining.md:231–234` | paragraph | Chains in the startup file: rewritten or relocated. |
| `11-return-codes-and-chaining.md:236–238` | paragraph | Chains in the startup file: rewritten or relocated. |
| `11-return-codes-and-chaining.md:240–244` | example source or output | Chains in the startup file: retained verbatim. |
| `11-return-codes-and-chaining.md:246–246` | provenance or capture recipe | Chains in the startup file: retained verbatim. |
| `11-return-codes-and-chaining.md:247–266` | example source or output | Chains in the startup file: retained verbatim. |
| `11-return-codes-and-chaining.md:268–272` | paragraph | Chains in the startup file: rewritten or relocated. |

### Fragment boundaries

- Old07:87–89 is the prefix-to-CCP explanation here. Old07:91–94 establishes
  B/R in2. I repeat the rows in the full local prefix table, without moving
  their first teaching out of2.
- Old07:95–98 supplies D/O/F here, including the absent-debugger qualification.
- Old07:157–158 up to the COM-location clause belongs in2. Old07:158 from
  the debug-file clause through161 supplies DBG/PRJ/SES here.
- Old07:99–102 and245–249 belong in10 for the exact0050h contract. I use a
  short practical reminder here to explain A:TAS/A:TED after that prerequisite.
- Old07:104–155 is assigned26, including its entire historical HELLO fixture
  and output. I retain a pointer to that home rather than duplicating or
  replacing it with an unverified BANNER transcript.
- Old03:516–523 overlaps the old11 explanation. Its printed-error distinction,
  return code and replacement-line/TED facts are integrated into the named
  sections, rather than retaining a duplicate introductory paragraph.
- Old11:146–155's unconditional persistence statement is corrected according
  to the accepted warm-flush disposition. Its function47/TED facts survive in
  the new function47 and TED sections.
- Old11:268–272's result-after-startup example and quiet-absence exception
  survive in the closing paragraph. The detailed absent-device comparison
  precedes it with the complete old06 fixture and output.

## Actual revision passes

1. Full reading and brief completed before writing either owned file. I made
   a generous connected draft in the practical order above. I compared it
   with every complete assigned passage.
2. Thematic and teaching pass: each paragraph either establishes a rule,
   grounds it in the retained example or explains a boundary needed next.
   I moved the first conditional example before numeric result conventions
   and placed TED after RUN's complete function47 explanation. No CHPOS
   layout or register-level CCP replay was added to the chapter.
3. Sentence deletion pass: I read every paragraph and sentence in order,
   mentally removed each sentence and read across the paragraph boundary.
   I combined the separate whole-command/selection statements, removed a
   repeated lowercase explanation and shortened the introductory mechanism
   summary. Short sentences about result ranges, reset, silence, echo and
   empty input remain because each supplies a distinct observable rule.
4. Agency pass: all machine subjects name operations such as echoing,
   copying, setting or running. I replaced the initial header's “See” phrasing
   after the gate's notation false positive. No mind, motive or judgment is
   assigned to code, files or chapters.
5. Every-comma and punctuation pass: I inspected every editable prose comma
   in order. Remaining commas separate an introductory locator, necessary
   clause or real list. I removed the optional comma before “then” by joining
   the echo/conversion mechanism. There are no prose em dashes, semicolons or
   Oxford commas. Literal assembly punctuation, shell commands and captured
   output stay unchanged.
6. Technical/literal pass: I traced both EXISTS branches and RUN's normal,
   rejection, replacement and empty paths against the offer. I checked
   function108, aborts, startup ordering and quiet service/CON outcomes in
   source and the TED/TAS application sources separately. I corrected the
   warm-flush guarantee and qualified the first good project-file update.
   Static comparison confirms all14 assigned fences and nine capture recipes
   remain complete and unchanged.
7. Journey read-back: I read the draft from its title through its final
   startup-result paragraph. Commands precede conditions, conditions precede
   numeric results, result reporting precedes cancellation, RUN precedes TED
   and startup uses the already-established rules. I clarified the two cards
   sharing the name chain.img and the required recreation before chain2.img.
8. Mechanical gates: I ran human-writing prose_gate.py and
   sentence_complexity.py on the draft. Initial gate had one header-only
   candidate, now reworded. Final chapter gate reports zero findings. After
   revision the complexity summary is180 sentences, mean11.6 words,
   0.55 joints per sentence and12% flagged, approximate grade6.0. I read the
   flagged statements individually. Required short definitions and bounds
   stay, as do command/code identifiers and the provenance comment. A final
   explicit vocabulary/agency/punctuation scan supplements the gate.

## Outstanding acceptance and runtime

- The new BANNER round remains held and is not used as evidence here.
- All retained captures need final-offer allocation and validation, including
  their exact prepared cards, directory free-space figures and application
  results. There is no new transcript or present-pin output claim.
- Independent factual and editorial result reviews remain pending. These
  self-checks do not close either independent review.
- Final relative links and heading anchors need integration checks after all
  destination files exist. Chapter references here use the closed outline's
  new numbers. Published rootbook navigation was not changed.
- The whole-book reader-order pass, final source/media acceptance and release
  allocation remain outside these two owned paths. No deployment is claimed.

## Independent result review

The full independent review found no actionable correction. All14 assigned
fences and nine capture recipes compare exactly to the originals, including
whitespace. Offered-source checks support conditional ranges, result clearing,
unconditional continuation, drop paths, startup ordering and function47's
validation/replacement/empty-line behaviour. The review separately checked
the pinned TED/TAS contracts and provenance. Full craft, agency, punctuation
and journey review found no additional issue. Bounded review is closed,
with runtime qualification and final integration still pending.
