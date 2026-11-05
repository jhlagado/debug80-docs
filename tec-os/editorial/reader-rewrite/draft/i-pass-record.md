# Appendix I pass record

## Contract and authority

Only draft/appendix-i-web-page.md and this record are owned. The appendix is
the optional browser reference for controls, input, persistence, file import
and startup preparation. It follows PC setup rather than making the browser
a prerequisite for the opening. Chapter 28 supplies the model/evidence account,
7 the operator startup route and 25 the ROM startup implementation.

The closed replacement outline at 0e4feea, closure 3060e71 and movement map at
10821b68f80c10d2037bbd1c5ab207877c897c68 govern the assignment. Read the complete
original appendix, all 38 destination I whole units and the containing PC-file
route around old07:208–214. That paragraph is the assigned import-file material.
No separate fragment_moves entry targets I. The outline and current house
style were read in full. All 38 units have homes below.

Mechanisms were rechecked against Git source text at TEC-OS
ea3ef3de9133931e925a0220d51c0e971c1fd8dd. The original's 78127ec declaration and
C16 selective fe2097f citation note are retained as provenance here, not used
to upgrade results. The only fenced material is the original two-command shell
recipe, unchanged. There are no assigned screen captures, measured tables or
physical observations. Source-defined notices and rewrite examples remain
literal reference material, not newly captured output.

At the inspected source the fallback preference is 80 columns with the PICO9918.
The draft preserves that fact, all explicit 40/32 selections and the existing
GLCD/startup policy. The planned KS48 default/font change remains unadopted and
unqualified here. No source, font, profile or capture was repinned by analogy.

## Source reading and semantic proof

Read the browser state, local-storage fallback, recipe fetch, complete queue,
power/reset, timer, both save functions and frame loop. Read complete serial,
keyboard, phone input, card listing/download, whole-image/import handlers,
controls and initial-load paths in web/src/main.mjs. Read complete
web/index.html, web/src/store.mjs, host/card.mjs, web/build.mjs and
tools/lib/recipe.mjs. The complete shared machine and CP/M file library had
been read for 28 and were rechecked at the relied-on contracts here. Rechecked
media recipe ownership, package script, container parsing and the ROM's
reset/cache/range/GLCD paths. Test source is an assertion, not a passing run.

| Claim | Semantic proof at ea3ef3d |
| --- | --- |
| Serving and prerequisites | package.json:21 selects web/build.mjs. web/build.mjs:16–45 clears output, bundles the page and copies one ROM/map, recipe and files. Original shell fence retained without executing either command |
| Actual display preference | web/src/main.mjs:17–43 defaults width to80 and display to tms only when no stored value is available. Storage failures are caught and preferences can remain session-only |
| Controls and lifecycle | web/index.html:12–30,68–82 defines all12 controls/labels. web/src/main.mjs:82–104 creates Machine versus resetting it. host/machine.mjs:49–79,578–587 gives fresh RAM configuration versus retained-memory reset. web/src/main.mjs:654–679 handles selectors/buttons and protects Pause during import |
| Starter and inventory | web/src/main.mjs:60–63 calls buildRecipe. tools/lib/recipe.mjs:14–44 checks schema, byte lengths and SHA-256 before final return. tools/media.mjs:193–234 builds starter/page recipe with DEMO. web/src/main.mjs:569–582,667–680 lists user/name/record-byte size and refreshes on button reset/power and five-second timer |
| Rate versus achieved speed | web/src/main.mjs:14,174–195 targets4MHz with elapsed-time cap and execution budget, then displays achieved MHz about once per second. No measured speed was generated |
| Input and presentation | web/src/main.mjs:358–427 strips serial escape sequences, handles backspace and routes matrix ordinary/arrow keys versus serial sequences. web/src/main.mjs:429–524 handles touch focus, hidden-field edits and latched Ctrl. web/index.html:35–49 defines the focus hint and extra keys |
| Saved record and startup failure | web/src/store.mjs:6–8,25–39 identifies IndexedDB and propagates load errors. web/src/main.mjs:684–698 parses a loaded record, makes a starter when absent and sets noSave after a load/parse failure without overwriting the unreadable record |
| Ordinary saves | web/src/main.mjs:92–94,106–147 marks dirty on model writes, defers timer during import, guards in-flight save, marks later work dirty and counts ordinary failures. web/src/store.mjs:42–59 snapshots into a write transaction and waits for completion. No claim of a ROM cache flush or unconditional reload persistence |
| Save notices | web/src/main.mjs:134–141 defines first/repeated-failure text. web/src/main.mjs:540–549 defines volume status, noSave notice and refreshed generic unsaved notice. Import-save failure does not pass through the ordinary retry/failure counter catch |
| Whole-image selection | web/src/main.mjs:593–615 validates before state.card assignment but assigns before save. A false ordinary-save result does not prevent power-on. Both starter and Open share this path. Import-busy rejection precedes parse/publication |
| Card/range limits | host/machine.mjs:49 defaults highCapacity true. tools/lib/container.mjs:130–193 checks declared length and descriptor bounds before Open publishes. src/vol.asm:330–385 separately checks end overflow, declared container end and standard-card byte-addressing. Corrected the old universal27h/Bad Sector exclusion |
| Import identity and protection | web/src/main.mjs:617–636 reads all selected files, uppercases names, stages from the current turn's image and passes descriptor readOnly. tools/lib/cpmfs.mjs:15–20 checks actual8.3 names. Its180–191 defaults user0, converts text and rejects a protected existing file with no force supplied |
| Import transaction and outcomes | web/src/main.mjs:154–166 waits for an older in-flight save under the same guard. Its631–649 publishes staged bytes only after importSave returns, resets and restores prior run state in finally. noSave returns without storage and therefore permits memory-only import. Errors leave staged edits unpublished, not a promise that all concurrent card state is unchanged |
| Queue and later preferences | web/src/main.mjs:67–84 serialises power-on preparation with import's callback. Its654–665 changes selectors before queued power-on. Preparation dirties the image and106–110 supplies later persistence. Queue ordering is not a guarantee of a completed save |
| Flush and reset | src/boot.asm:100–102,321–346 calls MEMINIT and clears the cache at cold boot. Its210–215 invokes CWBOOT before CCP return. src/cache.asm:661–668 flushes, drops chain and prints Write lost on failure. Import does not invoke it. src/cpm/bdoslog.asm:268–343 rebuilds a drive's allocation map on login. The draft states that maps are rebuilt as drives are accessed, not that every directory is scanned before any access |
| Startup staging and user | host/card.mjs:18–24 opens A with descriptor readOnly and user0 listing. Its58–73 stages the full card and publishes only a completed preparation. web/src/main.mjs:82–98 invokes it before machine creation and appends bracketed notices |
| Width and GLCD policy | host/card.mjs:104–117 inserts no line at80, CON PICO width at40/32 or GLCD.SVC for GLCD. src/services.asm:629–647 gates startup GLCD console registration under CRT. src/cpm/ccpcmd.asm:200–208 calls GLCLD for UC1 and src/loader.asm:885–913 loads the card driver when absent |
| Rewrite grammar and conditions | host/card.mjs:11–16 matches whole trimmed pieces case-insensitively, driver SVC/DRV forms and CON PICO/CRT with optional device colon and decimal width. Its75–114 splits chains, removes recognised pieces and propagates or removes conditional prefixes. All three original before/after examples remain |
| Unchanged/protected/full cases | host/card.mjs:105–116 compares text before write. tools/lib/cpmfs.mjs:180–205 enforces protection on needed writes but reuses the replaced file's entries/blocks. A full directory is not automatically a failed replacement. Formatting uses CRLF plus final1Ah |
| Preparation failures and notice scope | host/card.mjs:26–50 checks A access/user0 and GLCD format byte, not all service validity. Its67–72 converts failed writes to notices. NAME.DRV selection prefers GLCD.DRV then the first recognised old display file. Errors preserve this operation's staged startup edits, not every later ROM write |
| Source-only starter assertion | test/pico.test.mjs:834–846 asserts original GLCD startup becomes empty display text for tms80 and then exercises a model prompt. The draft reports the source assertion only, with no passing-test or browser qualification claim |

## Movement accounting

All 38 units are accounted for. Ranges below are individual whole-unit records
at 10821b6. Combined rows preserve every listed record.

| Frozen unit | Destination and disposition |
| --- | --- |
| old07:208–214 | Importing a file safely. Complete PC import, uppercase names/text option, reset/flush consequence and individual download route |
| oldI:1–6,8–8 | New navigation/title, same appendix reference role |
| oldI:10–10,12–14 | Separate mechanism pin and historical recipe provenance. No blanket current qualification from old781 or selective C16 line updates |
| oldI:16–21 | Opening and Serving the page. Model/ROM, displays and serial context retained. Build/model reference moved to28 and startup split between7/25 |
| oldI:23–26,28–28 | Exact original shell fence and localhost8765 address |
| oldI:30–30,32–33,35–48 | Controls and displayed state. All12 controls with lifecycle, validation, save-attempt and import distinctions |
| oldI:50–56 | Starter/DEMO, file list/user/name/size, refresh intervals, preferences and achieved MHz. DEMO reference now11 |
| oldI:58–58,60–61,63–66,68–75 | Typing. Both focus routes, native/serial arrows, console commands, escape/backspace presentation and complete phone-key route |
| oldI:77–77,79–87 | Saving the card. Exact storage identity, absent versus failed load, dirty/timer/in-flight behaviour and conditional reload persistence |
| oldI:89–91,93–97 | All three save/failure notices, retry conditions and noSave for the whole session. Added source-defined generic refresh wording |
| oldI:99–100 | Reload risk and Download image recovery, bounded to image bytes outside ROM cache |
| oldI:102–107 | High-capacity and truncated-image checks retained. Universal error exclusion corrected against actual ROM checks |
| oldI:109–109,111–118 | Importing a file safely. Complete staging/save/publication, failure, second-import and Open guards, with memory-only exception explicit |
| oldI:120–124 | Pre-import successful Ctrl-C flush, reset's cache loss and allocation rebuild. No unconditional success inferred from typing Ctrl-C |
| oldI:126–129 | Queue order retained. Removed the unsupported promise that a selected width necessarily already reaches saved storage |
| oldI:131–131,133–140 | Startup preparation. Full-card staging, only startup rewritten, no driver creation, A/user0 and descriptor protection |
| oldI:142–142,144–149 | Complete four-row width/display-to-first-line table |
| oldI:151–154 | Other display line absent, both displays fitted, startup GLCD gating and explicit CON UC1 load |
| oldI:156–163 | Exact display-piece recognition and old-width override reason, including optional prefix and current optional device colon |
| oldI:165–169 | All three original conditional-chain transformations, unchanged literal before/after text |
| oldI:171–174 | Blank removal, equality skip and original starter transformations. Added precise read-only/full-directory conditions |
| oldI:176–176,178–182 | Preparation notices and protected cards. Checks versus complete validation, operation-local failure scope and bracketed serial position |
| oldI:184–191 | All six exact notice strings/templates, with causes made conditional on needed writes/capacity and literal wording distinguished from complete diagnosis |
| oldI:193–197 | Exact old-driver selection, no force of protected startup and PC original-copy action |

## Craft and preservation passes

1. Full assigned reading and connected generous draft completed. The reference
   route is serving/controls, typing, saving, importing, startup rewriting and
   failure notices. Each operation's normal path precedes its exceptions.
2. Mechanical vocabulary, headings and agency scan completed. Procedure verbs
   identify people or actual operations. Literal notices retain their original
   wording even where that wording differs from current prose style.
3. Teaching-order pass completed. User 0 import, protection and the storage-read
   exception appear before the publication guarantee. The cache-loss warning
   precedes the copy operation. Model detail is linked to 28 without losing a
   control, rewrite example or recovery action.
4. Every sentence received the deletion test. Unconditional persistence,
   universal error exclusion and universal card-unchanged language were replaced
   by the actual conditions. No assigned example/recipe was removed.
5. Agency pass completed across retained and new prose, then every comma and
   authorial punctuation reviewed. Literal strings preserve punctuation exactly.
6. Technical and literal pass completed against the source ranges above. The
   sole shell fence matches the frozen original. All six startup notice
   templates, three save notice forms and three rewrite examples were read
   against their owners. All 70 source citation occurrences were checked within
   file bounds. Eight local file links resolve. The 38 units comprise 30 retained
   content/provenance units and 8 navigation replacements, with 0 unaccounted units.
7. Whole-reference journey read-back completed. Controls provide concise
   effects and the later sections define persistence and transaction conditions.
   All local chapter/appendix links use the actual draft filenames.

## Delivery boundary

Own source, preservation and craft passes are complete. Independent review,
final source/media pinning and whole-book navigation/reader-order acceptance
remain open. No runtime, import, test, build, browser/UI action, capture or
physical measurement was performed. Static text comparison supplies preservation
evidence only. No publication or product/default policy change was made.
