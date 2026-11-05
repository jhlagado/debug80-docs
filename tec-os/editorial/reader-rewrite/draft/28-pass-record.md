# Chapter 28 pass record

## Contract and authority

The chapter explains how to interpret and reproduce host-model evidence.
Its reader has the runtime mechanisms and the PC setup from5/26. The route
is shared machine, card/time inputs, write watches, observation channels,
stopping/input/snapshot limits, the complete LINES fixture, tests/inputs,
browser implementation and the boundary of physical evidence.

Only draft/28-the-host-model-as-evidence.md and this record are owned.
That draft filename follows the explicit bounded authoring request. The shared
revision ledger still proposes28-reproduce-the-evidence.md. Navigation
integration must reconcile that difference later. No shared ledger was edited.

The closed replacement outline at0e4feea, closure3060e71 and controlling
movement map at10821b68f80c10d2037bbd1c5ab207877c897c68 govern preservation.
Read all62 destination28 whole units and the explicit index:49–50 fragment.
Read the entire old27-host-model.md, all old02:334–396 fixture material and
its pagination context, the containing index conventions and the complete
current outline and source-question dispositions before drafting.

Current mechanisms use Git source text at TEC-OS
ea3ef3de9133931e925a0220d51c0e971c1fd8dd. All six retained captures and their
recipes remain TEC-OS78127ec evidence. The original host chapter names
@jhlagado/debug80-runtime0.3.3. The offered package names the same version,
but equality of a version or source range does not qualify a later artifact.
The original LINES chapter names78127ec without a separate application pin.
The examples are not physical-board evidence and were not rerun here.

The source-only pass changes no font/default or startup policy. Qualification
of the planned40-column opening remains held. Historical GLCD/other screen
examples are not substituted for that workflow.

## Complete source reading

Read the complete host/machine.mjs at the offered pin.
Read complete test/lib/fixtures.mjs, test/lib/machine.mjs, test/lib/inputs.mjs,
tools/capture.mjs, tools/lib/pins.mjs, tools/lib/cpmfs.mjs, web/build.mjs,
web/src/store.mjs and tools/diag-check.mjs. Read the containing browser
machine, timing/render/input, save, whole-image and file-import paths.
Read host/card.mjs's full staged rewrite and failure handling, test inputs,
package definitions, the media recipe owner and README setup/evidence scope.
The ROM pager and the deliberate-watch tests were read in context.

| Claim | Semantic proof at ea3ef3d unless explicitly historical |
| --- | --- |
| Shared machine and symbols | host/machine.mjs:10–27 imports runtime/bytes and maps D8 names. test/lib/machine.mjs:3–12 owns Node file/font setup. host/machine.mjs:186–212,240–243 uses symbols and rejects missing named symbols. No claim that an arbitrary map works with any ROM |
| Options, memory and runtime | host/machine.mjs:33–85,122–176 defines all constructor options, I/O wiring, ROM placement, absent window and optional MAIN/EXPAND mapping. Display timer suppression is updateMs=Infinity, not a claim that host scheduling has no effects |
| Card and range | host/machine.mjs:59–74,122–140,522–526 attaches/swaps the runtime card model. test/sd-range.test.mjs:36–106 asserts standard7FFFFF/exclusive800000 limits and beyond-image command failure. These assertions are not a fresh passing run |
| Clock | host/machine.mjs:86–119 advances a supplied clock and subsequent written time from emulated cycles. test/lib/fixtures.mjs:72–73 and tools/capture.mjs:72 set different fixed starting dates. The browser supplies no fixed date. No wall-clock-to-physical-clock equivalence |
| ROM/overlay CPU watch | host/machine.mjs:215–237 records attempts before the underlying hook and exposes fixture write bypass. test/system.test.mjs:14 checks empty violations. test/diag.test.mjs:78–90 expects deliberate diagnostic violations, not an empty list |
| EXPAND watch | host/machine.mjs:177–225 finds the clear and allowed ranges from symbols, leaves BD00h outside the watch and limits the shared list to16. test/lib/machine.mjs:14–34 asserts/checks/traces that list. test/expand.test.mjs:67–77 deliberately writes BF80h and removes the intentional shared entry |
| Observation and settling | host/machine.mjs:259–321 samples C at ROM BCONOUT, records cycles, waits on predicates/output and settles. host/machine.mjs:323–342 finds input loops and ready state. tools/capture.mjs:74–96 combines prompt, pending input, pager and diagnostic conditions |
| Input pacing | host/machine.mjs:354–371,453–520 implements serial reception waits, held matrix keys/modifiers and queued fallback. A physical terminal's freely arriving input is not established by that paced path |
| Text versus pixels | host/machine.mjs:380–450 masks PICO reverse bits and decodes GLCD cells using Machine.font. tools/capture.mjs:43–50 and test/lib/machine.mjs:8–10 supply the parser output. tools/capture.mjs:147–153 supplies PIWID width. Font decoding is not independent font/default/pixel qualification |
| Capture tool | tools/capture.mjs:5–39,53–132 defines configuration, command notation, starting-card hash and waits. Its final output normalises carriage returns and can append LCD/screen rows. The starting hash is not an output-card hash |
| Reset and RAM image | host/machine.mjs:528–546 copies mapped RAM plus selected EXPAND window, not every optional bank. Its578–587 resets CPU/latches while retaining memory/card. Device state, CPU registers and input queues are not all serialised into ramImage |
| Fixture recipes and caching | test/lib/fixtures.mjs:21–79 reads ROM/map, digests source/includes, uses origin in cache names and builds empty standardCard/service fixtures. Its93–121 owns withDisplay/boot. The key omits tool/runtime identities and volume explicitly passes readOnly:false |
| CP/M host file access | tools/lib/cpmfs.mjs:128–173 rejects out-of-range blocks and protects ordinary erase/write;175–233 plans and writes files. The shared library does not make privileged fixture setup a ROM protection test |
| External inputs | test/inputs.json gives two pinned files. tools/lib/pins.mjs:10–49 selects override/local/legacy without fallback from a selected stale entry. test/lib/inputs.mjs:24–41 distinguishes skip, strict failure and mismatch. No download or import was performed |
| Browser test dependency | package.json:17–18,28 fixes serial test command/strict flag and Playwright version. test/deps.test.mjs:14–27 asserts declared/lock/install documentation. It is source evidence of the checks, not proof of installation or execution |
| Browser distribution | web/build.mjs:1–45 bundles and clears/copies output, aliases fs and selects one ROM. tools/media.mjs:204–236 supplies SAMPLE/ABI/DEMO and page recipe components. An alias is not described as proof that a particular fs import is live |
| Frame/input/render | web/src/main.mjs:174–233 targets4MHz, caps elapsed100ms and checks a30ms budget every1024 instructions. Its358–427 decodes serial display text and routes keys. Displayed MHz is achieved host execution speed |
| Save/preparation/import | web/src/main.mjs:92–166,617–649 plus web/src/store.mjs:42–59 supplies timer, save guards, failure and staged import publication. host/card.mjs:58–72,104–116 stages display-line rewriting. The noSave exception permits memory-only import. Neither download nor import flushes ROM cache |
| Pager/LINES meaning | src/cpm/ccpfile.asm:335–366,451–520 gives dimensions, pause erasure, case-insensitive Q and CHPOS clearing for Ctrl-C. Original old02:334–396 supplies the complete historical recipe/screens. No new screen claim |
| Physical comparison | README.md:27–28 records model-only scope. host/machine.mjs:40–46,155–172 distinguishes legacy/documented mapping. docs/diagnostics.md:146–163,185–195 explains overlay/latch/bank probes. tools/diag-check.mjs:24–44,70–106,136–160 matches image identity, compares measured forms and reports unpaired tests. Zero differences is not universal physical qualification |

## Source inventories and original discrepancies

The original prose says56 test files at78127ec. A top-level Git-tree scan
of test/*.test.mjs counts55 at that historical pin and57 at ea3ef3d.
The draft uses the offered count57 with explicit source-only wording.
The stale56 is corrected here, not recast as a historical successful run.
No executed-test, passing-test or test-case total was generated.

At both inspected pins,27 top-level test files mention violations. One is
diag.test.mjs, which intentionally checks ROM/overlay writes. The other26
contain ordinary violation checks. The draft's26 is explicitly a source
inventory outside diagnostics, not proof that every test or machine enforces
that assertion. The Node wrapper's after-file assertion is specifically for
the shared EXPAND watch and must not be confused with a universal empty-ROM-
violation hook. Intentional watch tests remove their expected shared entries.

The old “all RAM” snapshot wording is bounded to what the helper actually
serialises. The old assertion that output contains every console byte is
bounded to the ROM BCONOUT sampling point. The old absolute conclusion that
a passing program makes neither forbidden write is replaced by checked paths,
watch coverage and explicit setup/bypass limits.

## Movement accounting

All62 whole units have the following homes. Comma-separated ranges are the
individual movement records from10821b6, not new source selections.

| Frozen units | Destination and disposition |
| --- | --- |
| old02:334–338,340–344 | A complete pagination fixture. Separate historical card, exact ten-line text preparation, copy and put recipe |
| old02:346–347,349–349,350–359 | First GLCD pause, exact capture recipe and complete unchanged screen |
| old02:361–364,366–366,367–376 | Wrapping/scroll/count interpretation, exact x-continuation recipe and screen |
| old02:378–384,386–386,387–396 | Ctrl-C versus Esc/Q chain scope and exact first-pause q recipe/screen |
| old27:1–6,8–8,10–11,13–15 | New navigation and separate mechanism/evidence metadata. Historical runtime/capture pin retained, no citation-only repin of results |
| old27:17–22,24–24,26–33 | Opening and A shared machine. Shared Node/browser module, D8 symbols and matched-input requirement |
| old27:35–35,37–48 | Complete constructor options table with meanings and RAM mapping scope |
| old27:50–55,57–61 | Runtime responsibilities, memory/ROM placement and display timer suppression |
| old27:63–63,65–72 | Card bytes and time. Separate SdSpi attachment, mutable image, swap and ROM reset distinction |
| old27:74–81,83–90,92–95 | Standard/high-capacity and image bounds, DS1302 attachment, host versus cycle clock and both fixed dates |
| old27:97–97,99–104,106–109 | Write watches. ROM/overlay attempted-write records, diagnostics distinction and bounded26-file source inventory |
| old27:111–117,119–125 | Full EXPAND watch bounds, clear/writer recognition, history exclusion, shared16 cap, test wrapper and deliberate BF80h example |
| old27:127–127,129–134,136–138 | Console bytes, serial bytes and screens. Sampling point and routes, qualified for bypasses |
| old27:140–140,141–151,153–153,155–155,156–163,165–165,167–167,168–173 | All three original GLCD observations in order, all capture/continuation comments and fences unchanged |
| old27:175–184 | Commands and stopping conditions. Predicate/output/settling/input/ready/capture waits |
| old27:186–194 | Serial/matrix and queued pacing, modifiers and physical-arrival distinction |
| old27:196–206 | PICO layouts/width/cells, font-dependent GLCD decoding, RAM image/load and reset. All-RAM claim narrowed to actual serialised layout |
| old27:208–208,210–220 | Fixtures, assertions and pinned inputs. Test command, corrected source inventory, ROM/boot/display fixture and existing startup preservation |
| old27:222–235 | ATOM programs/cache/digest, makeSvc, standardCard and shared CpmVolume/error/attribute contracts |
| old27:237–252 | External application pins, input preparation/selection, strict versus skip, browser dependency/setup and dependency checks |
| old27:254–254,256–270 | The browser as another caller. Build order/bundle/stub/clean copy, one ROM and width/startup/media/DEMO relationship |
| old27:272–281,283–287 | Frame rate/budgets, display state, MHz/host clock, focus input and serial presentation |
| old27:289–298,300–306 | Dirty card/IndexedDB identity, save timer/failure, staged display rewrite, import/save/publication/reset and explicit cache-flush prerequisite |
| old27:308–308,310–313 | From a model result to a board observation. Historical model scope and offered README boundary |
| old27:315–318,320–326 | Observability stricter than a board, legacy/runtime differences and bounded meaning of a passed path |
| old27:328–333 | Diagnostic T08/T10/T12 route and image-specific board/model comparison, measured/noncompared limits |
| index:47–50 | T-state/cycle/4MHz/microsecond convention in Card bytes and time under the explicit fragment override. Hex/size conventions retain the front-matter home |

The index:49–50 fragment is fully retained. All assigned LINES preparation,
three capture recipes, screens and interpretations remain together here.
It is not a prerequisite for the new Chapter3 SAMPLE route. No capture has
been reduced to a link. Seven fences compare exactly with the frozen source:
six text captures and one shell preparation. The five complete capture
command comments plus the original screen-continuation comment are unchanged.
The owned-path whitespace check flags only four padded A:/B: lines in the
two retained boot captures. Those historical spaces are preserved literally.

## Completed craft and verification passes

1. The complete assigned reading and source check preceded a generous draft.
   The opening establishes the evidence question and observation channels.
   The text keeps mechanism, assertion, recorded run and board observation
   separate throughout rather than relying on a final disclaimer.
2. Mechanical vocabulary/agency/heading searches were performed. Artifact
   operations use read, sample, execute, compare, record, write and return.
   A match does not prove unexercised paths. No praise, staged question or
   imagined intent was retained. Immutable captures keep their literal spacing.
3. The thematic pass read each paragraph for its job and prerequisites.
   Inputs precede watches, channels precede screen examples and stopping
   conditions precede the pagination fixture. Host setup is crosslinked before
   shell preparation. The browser implementation follows the shared machine.
4. The sentence-deletion pass read every sentence in order. Removed the old
   syllabus opening and unqualified “everything/all RAM/every passing program”
   conclusions. Removed reader-facing preservation-process wording and the
   reference to the machine on which source was read. Kept exact watch,
   queue, storage and snapshot limits because
   each changes the interpretation of an apparent success.
5. The agency pass and separate every-comma/punctuation reading covered all
   retained and new prose. No authorial semicolon, em dash or Oxford comma
   remains. The final reader-order pass ends on the precise scope of a matching
   board line rather than a recap or a promise of hardware equivalence.
6. The technical/literal pass compared all seven fences with their frozen
   sources, checked all reproduction comments and read the changed claims
   against their owners/callers. All81 chapter source-range occurrences were
   checked for bounds through Git
   text. The original diagnostic comparator citation was corrected to its
   actual160-line source. No product was imported or executed.
7. Navigation uses the requested Chapter28 draft filename and current sibling
   destinations for5/13/17/26/27 and I. Shared references still naming the
   ledger's28-reproduce-the-evidence path require later integration. The
   independent chapter review and whole-book reader-order review remain open.

## Delivery boundary

Own source, preservation and craft passes are complete. Independent
editorial/factual review remains required. Final source/media navigation and
new opening-profile qualification remain pending. No tests, assemblies, model
runs, browser actions, captures, builds, imports, physical measurements or
publication were performed. A source-only inventory or equality comparison
has not been reported as a new passing result.

## Independent and lead read closure

The complete independent factual/editorial review atbbd6b10 found no blocker.
The lead subsequently read the complete450-line chapter including all retained
fences, the full pagination fixture, source assertion versus passing-run
boundaries, browser persistence and physical-board limits. No further local
finding was found. This closes the bounded draft review, not final adopted
source, font/default proof, navigation or whole-book acceptance. Nothing ran.
