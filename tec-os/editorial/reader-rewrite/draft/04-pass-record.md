# Chapter 4 pass record

## Brief and authority

The chapter's job is to locate a file or tool and explain which program or
service a command uses. The reader has selected A/B, made a small program
and used ordinary file commands. The register-level parser, allocation vectors
and service headers remain outside this operator chapter.

The closed outline at0e4feea, closure3060e71 and controlling movement map at
book base10821b6 govern preservation. The current outline's KD243/KS48 profile
amendment changes no historical pin. Source mechanisms use TEC-OS
ea3ef3de9133931e925a0220d51c0e971c1fd8dd. No new run is authorised.

The route is COM versus resident SVC, practical install/list/remove, drive
selection and volume labels, user areas, complete program lookup, mount slots,
protection and reset recovery. Service vocabulary precedes the search
exception and startup. Second-person operator prose follows STYLE.md,
human-writing and teaching-prose-review.

## Complete reading before drafting

Read all46 whole units assigned to4 and the three literal sentence overrides
from old03:139–145. Read their full containing passages at10821b6:
old03:131–145,312–419; old05:22–121,212–255; old06:329–401;
old07:157–165. Read each original evidence header. Also read the four-volume
card preparation in old04 and the old read-only failure explanation to keep
those fixtures and protections distinct from the supplied starter.

The two old05 sections preserve the mount and reset workflows. Their vector
implementation is expressed as observable slot capacity under the explicit
operator-level scope. The four-volume my.img examples remain complete historical
evidence, not a new prerequisite before Chapter5's card preparation.

All retained captures are TEC-OS78127ec. Where the original supplied-app
headers apply, TED is Thorium128edb7, SHA-256
2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f,
and TAS is Thoriumdbee66a, SHA-256
45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
Old06 records78127ec without an additional application identity. No fence,
capture recipe or historical result is assigned to the source offer or KS48.

## Source proofs

All product ranges below use ea3ef3d. These are text/Git reads, not passing
tests or regenerated artifacts. Part I keeps the proof ranges in this record
rather than interrupting operator prose with register-level citations.

| Claim | Source and scope |
| --- | --- |
| COM versus SVC, extension replacement | src/cpm/ccp.asm:445–536 dispatches exact SVC separately, replaces other types by COM and launches at0100h. src/loader.asm:227–243,603–618 reserves page-aligned resident space below the previous top. |
| COM lookup | src/cpm/ccp.asm:498–517,639–768 distinguishes missing from found-but-unloadable, restores user after area0 retry and limits A fallback to plain names. No SYS condition. |
| Service lookup | src/loader.asm:925–932 calls LOADCOM directly, without either retry. src/cpm/ccp.asm:465–485 gives the startup INIT/TNENODV exception. |
| Listing and removal | src/cpm/ccpcmd.asm:14–18,829–864 prints owner names/page counts and removes only the lowest/newest. src/loader.asm:128–173 tests removable, calls REMOVE and retains refusal state. |
| GLCD console lifetime | drivers/glcd.asm:29–48,66–124 defines header/vector, font lookup and removal's PICO fallback. src/loader.asm:885–913,925–965 loads A:GLCD.SVC for CON and keeps an active CRT console after direct installation. src/pico.asm:54–87 starts the ROM console. Current source does not certify historical GLCD3 output. |
| MOUNT operator syntax/messages | Read complete test/programs/mount.asm. LIST prints decimal index,11-byte label, G1M/G8M, R/O and current drive. NAME/INDEX selection, same-drive no-op, no-volume, unmount and usage paths were read with ABI callers. No new application run or binary qualification. |
| Mount publication and flush | src/volsvc.asm:184–450 validates index/drive, current assignment and slot before VFLUSH. Publication follows success. VRESET logs the changed drive out and VMNTRS reselects the current drive immediately. VFLUSH calls CFLALL and can fail without changing assignment. |
| Slot capacity | src/boot.asm:695–800 reserves mounted-geometry slots or full-size slots for the drives field. src/volsvc.asm:295–315 tests capacity. The draft retains all starter A/B/C/D limits and --drives N behaviour, not allocation-vector implementation. |
| Current drive/user and errors | src/cpm/ccp.asm:46–111,119–180,285–320,363–384 and src/cpm/ccpcmd.asm:241–280 establish selection, prompt, USER and default-drive fallback. src/cpm/bdoslog.asm:886–900 and src/cpm/bdoscon.asm:35–72 give error messages/key/exit versus returned modes. |
| User-area copy and attributes | src/cpm/ccpmut.asm:197–380 uses current area for both files. src/cpm/ccpfile.asm:25–147 hides SYS entries. src/cpm/bdosfile.asm:421–490,672–683 distinguishes file R/O checks, deletion and attribute mutation. src/cpm/bdoslog.asm:245–269,875–892 applies volume protection. src/cpm/bdosfn.asm:151–182 sets temporary drive protection. src/cpm/bdosfile.asm:19–133 clears it during reset. |
| Reset and reselection | src/boot.asm:49–158,217–346 reads recognised state before clearing, saves the table and discards working/cache/history state. src/volsvc.asm:1–184 compares all8 entry bytes, verifies slots and publishes only after a complete match. Recognition is not restricted to a previously printed prompt. |
| Persistence limitation | src/cache.asm:307–351,653–668 attempts/drops failed flush lines. A failed mount flush preserves the assignment, not every pending byte. Cold boot alone calls SDINIT at src/boot.asm:127–132. A warm boot can read card blocks but does not reinitialise the card. |
| Host setting and geometry | tools/tecvol.mjs parseArgs/put and tools/lib/container.mjs/format.mjs, format/format.json establish --user, attributes and G1M/G8M. Read old04's complete my.img preparation to identify the historical fixtures, not to create them. |

## Preservation by movement unit

Each row is a complete assigned unit. Original headings are replaced by the
new route. All ten output fences and ten capture comments remain verbatim.
The recipe comments remain reproduction evidence, not executable instructions
authorised by this task.

| Frozen unit | New home and disposition |
| --- | --- |
| old03:312–312 | Drive letters and volumes heading |
| old03:314–320 | Drive letters, empty-drive rule and complete Select example |
| old03:322–322 | Select capture comment unchanged |
| old03:323–331 | Select fence unchanged |
| old03:333–336 | Default key wait, E–P names and Q:? boundary |
| old03:338–345 | User areas, global current area, initial0 and prompt |
| old03:347–347 | USER3 capture comment unchanged |
| old03:348–362 | USER3 fence unchanged |
| old03:364–370 | Area visibility, MOUNT fallback, COPY limit, host --user and invalid USER |
| old03:379–389 | Program lookup, all four positions, explicit drive and user restoration |
| old03:391–391 | Program lookup capture comment unchanged |
| old03:392–406 | Lookup/STARTUP.CMD fence unchanged |
| old03:408–412 | Extension replacement and exact SVC exception |
| old03:414–419 | Missing, oversized and fatal-read outcomes |
| old05:22–22 | Changing a drive's volume heading |
| old05:24–26 | Historical my.img defaults and lack of startup file |
| old05:28–28 | my.img boot capture comment unchanged |
| old05:29–35 | my.img boot fence unchanged |
| old05:37–41 | List fields, label/index assignment |
| old05:43–43 | Complete mount capture comment unchanged |
| old05:44–73 | Complete mount fence unchanged |
| old05:75–81 | One-drive limit, absent volume, B unmount, A protection and usage |
| old05:83–88 | In-memory assignments, header defaults, flush and reselect |
| old05:90–92 | Empty-drive failure explained with retained Select fence |
| old05:94–101 | Starter A/B/C/D slot capacities and retained empty slot. Implementation named only in Chapter14 link under operator scope |
| old05:103–103 | Starter slot capture comment unchanged |
| old05:104–115 | Starter slot fence unchanged |
| old05:117–121 | --drives N full-size slots including initially empty drives and memory cost link |
| old05:212–212 | The drives after a reset heading |
| old05:214–220 | Reset clearing/loss and recognised selection matching, with exact source qualifications |
| old05:222–222 | Reset capture comment unchanged |
| old05:223–242 | Reset fence unchanged |
| old05:244–249 | B stays empty, all-or-nothing match/defaults and normal power-cycle loss |
| old05:251–255 | PC-change/reset rule, cached/free-space state and cold-only card initialisation |
| old06:329–335 | Resident lifetime,256-byte pages and program-memory cost, GLCD versus ROM PICO and deeper authoring/memory links. BDOS placement is deferred to10 |
| old06:337–343 | Installation command/type, explicit drive, SERVICES/UNLOAD and both-display capture context |
| old06:345–345 | First service capture comment unchanged |
| old06:346–358 | First service fence unchanged |
| old06:360–367 | Historical3 pages, empty list, newest-first/removal refusal and warm/reset lifetime |
| old06:369–372 | Failed installation and duplicate GLCD, qualified for fatal BDOS errors |
| old06:374–374 | Duplicate driver capture comment unchanged |
| old06:375–382 | Duplicate driver fence unchanged |
| old06:384–388 | GLCD removal fallback and CON UC1 automatic A load |
| old06:390–390 | CON/removal capture comment unchanged |
| old06:391–401 | CON/removal fence unchanged |
| old07:163–165 | Small-program B/current/A distinction, using the new Chapter2 program without transplanting the historical HELLO round |

The three explicit old03:139–145 sentence fragments retain DIR's current-area
restriction, SYS omission and continued TYPE/program access. Host --sys setting
and BDOS30 programming are assigned to5/9 and are not duplicated as procedures.
The chapter's protection explanation is authorised by the explicit brief.
The old03 read-only fixture/capture stays at its assigned home, not copied here.

## Source corrections and evidence boundaries

- The old blanket unreadable-service question-mark rule is qualified by the
  fatal BDOS read-error path. Returned errors can still reach command failure.
- Mount assignment is published after a successful flush. A failed flush can
  lose cached data while leaving assignments unchanged. No claim that every
  failed mount preserves all pending data is made.
- Reset recognition can work before the first prompt during service INIT.
  The old reached-a-prompt condition is replaced by recognised RAM plus exact
  entry/slot matching. Power-cycle loss is stated for normal power cycling,
  not as an electrical guarantee about every RAM byte.
- Warm boot does not reinitialise a PC-changed card. The old blanket statement
  that it reads no card is narrowed because reconstruction or flush may access
  the card. All ordinary warm-exit user/drive and reset A/user0 facts remain.
- my.img is an explicitly separate historical prepared card. No early shell
  setup, new read-only card or unverified starter output is introduced.

## Completed manual writing and teaching passes

The generous draft was written in full before these reduction passes.

1. Mechanical search: explicit vocabulary/agency/heading scans. Replaced the
   clause heading about the file a command runs with Program lookup. No prose
   gate or complexity script ran and no numerical readability result is claimed.
2. Thematic/prerequisite read: COM/SVC and install/list/remove precede program
   search and startup links. Drive letters and MOUNT list fields precede user
   areas. User areas precede complete lookup. Slots precede the extra-card
   example. Cache and flush receive local definitions before failure consequences.
3. Sentence deletion: read every sentence in order and across paragraphs.
   Reduced the four-sentence opening to its file-location and lookup subject.
   Removed the unneeded password contrast. Kept the transient/resident lifetime
   contrast, short message definitions and exact empty-slot counterexample.
4. Agency/plainness: software reads, installs, lists, selects and rejects.
   Removed the overbroad loaded-tool/current-drive assertion because the tool
   itself can change a volume. No memory, card or publication topic has intent.
5. Every-comma/punctuation pass: read every comma. Removed optional conjunction
   commas in attribute setting and descriptor/slot matching. Kept list and
   short appositional punctuation. No authorial semicolon or em dash remains.
   Literal capture spaces and punctuation are preserved.
6. Technical/literal pass: re-read source/callers above. Complete fence-only
   comparison against the frozen ranges, reordered into the new chapter's
   order, produced no differences. Ten complete fences are unchanged, including
   trailing spaces. All ten capture commands were read and retained verbatim.
7. Journey read-back: complete chapter read after reductions from file location
   through PC-return/reset. Warm/cold and geometry vocabulary is explained where
   needed. Ended on the card-sharing prohibition rather than a recap. Final
   destination links follow the new ladder. Chapter14's allocation heading and
   Chapter15's retained-selection heading were read as actual draft anchors.

## Independent review corrections

The independent review at27ddf2a identified two sequencing corrections and a
placement detail outside this operator chapter. All three were accepted:

- The drive section now explicitly directs the reader to enter `MOUNT` before
  changing a drive selection. It adds no output or new qualification claim.
- The separate historical `my.img` card and its usable C/D slots are qualified
  before the first GAMES command. Its complete preparation remains in5 under
  the closed outline. The assigned historical captures remain complete in4.
- Resident services still occupy256-byte pages and reduce program memory.
  The below-BDOS placement and inserted BDOS definition are deferred to10.

The changed passages were read in sequence for prerequisites, sentence purpose,
agency and punctuation. Text-only comparison confirmed all ten fences and ten
capture comments unchanged. No runtime work was performed.

## Delivery status

Own passes and accepted independent review corrections are complete.
Final navigation, current source/media acceptance, opening40-column/font proof
and whole-book reader-order review remain pending. There is no new example run,
application qualification, build, import, test, workflow or publication result.
Only the chapter draft and this pass record are owned by this unit.
