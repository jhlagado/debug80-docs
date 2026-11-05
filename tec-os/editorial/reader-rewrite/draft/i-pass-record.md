# Appendix I pass record

Current mechanism authority is TEC-OS `962853f499f05faf281f6cdff1deca8959f58c2b`.
The selected-source adoption section at the end records the current correction
and supersedes earlier source/profile holds. Earlier sections preserve the
initial ea3 audit and its historical evidence accounting. Their old coordinates
remain scoped to that initial audit rather than silently repinned.

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
| Import identity and protection | web/src/main.mjs:630 uppercases names while reading PC files. Its631–636 enters the queue, stages the current image and calls fs.write there with descriptor readOnly. tools/lib/cpmfs.mjs:180–183 calls cpmName inside that staged write, after the volume/user checks. Its15–20 validates8.3 names and180–191 defaults user0, converts text and rejects a protected existing file with no force supplied |
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

Own source, preservation and craft passes are complete. Bounded confirmation
of the independent-review corrections, final source/media pinning and
whole-book navigation/reader-order acceptance remain open. No runtime,
import, test, build, browser/UI action, capture or
physical measurement was performed. Static text comparison supplies preservation
evidence only. No publication or product/default policy change was made.

## Independent-review corrections

The full independent review identified a validation-order error and an
awkward dirty-card sentence. Both are corrected. Filename uppercasing happens
while the PC files are read at web/src/main.mjs:630. Validation occurs later,
inside the queued staging callback's fs.write at 631–636, through cpmName at
tools/lib/cpmfs.mjs:180–183 and 15–20. The paragraph now states that order
without changing the all-files publication boundary or the noSave exception.

The saving paragraph now begins “Writes by TEC-OS mark the model card dirty.”
That wording names the actual operation without the former ambiguous noun
phrase. The optional commas at the reviewed draft's lines 39, 92 and 260 were
removed after reading each sentence without them. No literal notice, rewrite
example or historical shell fence was changed.

Read the corrected paragraphs with their surrounding sections and rechecked
the source's read/queue/write/save/publication sequence. The 38 assigned units,
70 citation occurrences and historical fence remain accounted for. The
ea3ef3d 80-column fallback, stored preferences and GLCD/startup policy remain
unchanged. KS48 qualification remains pending. No source or result was repinned.
Bounded independent confirmation of these corrections remains open. No
execution, import, build, test, UI/browser action or capture was performed.

## Selected-source adoption at 962853f

Book selection 9ba1f59 authorises current mechanisms at TEC-OS
`962853f499f05faf281f6cdff1deca8959f58c2b`. The tested source is
`8b8664a7d93c6dc2e8bce509b9770585e106eedc`. The latter differs from the
adopted descendant only in the two KS48 qualification records. Proposal 18's
qualified offer and independent result receipt remain Origo 43d5f328.
Opening workflow receipt 4b5b5a50 and complete opening reviews d9d57d2/b911e84
close their bounded scopes. They do not certify a browser or physical board.
The opening batch remains FAILED globally at its later observer.

I read both source-adoption impact records, all 35 contexts, 29 proof spans
and nine historical exceptions. I read this entire reader file and its full
existing pass record before editing. The actual ea3-to-962 executable diff
was read with the complete owning build, media, font, startup and fixture
functions. Unchanged cited spans were compared byte for byte with the prior
semantic audit and read against their containing claims. Diagnostic, ROM,
host and browser source contexts were inspected as Git text. No source
identity comparison is a runtime result.

The page still falls back to PICO at 80 when preferences are absent.
Successful preparation explicitly writes CON PICO 80, 40 or 32, with CRLF and
the final EOF byte. The old no-line/EOF-only 80 description is replaced.
The complete prepareCard, setDisplayLine and withoutDisplay functions retain
staging, other command pieces and their conditional relationships. Existing
read-only and capacity checks also apply to a required 80-column rewrite.
The updated pico source assertion was read in its complete test context.
The test assertion remains source evidence, separate from a browser result.
All notice strings and three conditional rewrite examples remain byte-identical.

The owned impact dispositions are IM011, IM012, IM013 and IM014.

### Citation coverage

All 73 current reader range occurrences across 20 source files
were reconciled before changing the mechanism header. The table includes
shorthand ranges in their owning file. The earlier sections of this record
keep the original ea3 audit coordinates under that explicit scope. This new
table uses only 962853f. Bounds and byte correspondence supplement the
mechanism readback, not an execution claim.

| Source | Adopted ranges | Exact Git blob | Comparison with ea3 |
| --- | --- | --- | --- |
| `web/build.mjs` | 16–45 | `b33b5a836a20743daac110f89fa0a6a236929247` | same blob |
| `package.json` | 21 | `9c4c13a74c6137d6b108b66e7491b62ddc8398ac` | same blob |
| `web/src/main.mjs` | 14, 17–43, 60–63, 67–84, 82–84, 82–104, 92–94, 97–98, 106–110, 118–147, 134–141, 149–166, 174–195, 358–427, 388–427, 429–524, 540–549, 563–578, 569–582, 593–596, 593–615, 593–679, 598, 605–606, 617–636, 617–649, 631–649, 635–636, 654–665, 667–680, 684–698 | `80f5af6c81ddeb6195ad89ad15cb9415f3ffea9e` | same blob |
| `host/card.mjs` | 11–16, 18–24, 26–72, 41–48, 58–73, 75–102, 81–117, 104–117, 105–117 | `9cfb87a88462a12082058e611187f83d603ccaa8` | changed source read |
| `src/pico.asm` | 36–92 | `0c49c294fc3199b619a994394d1b2b4192d17d0b` | changed source read |
| `web/index.html` | 12–30, 35–49, 36–44, 68–82 | `a32c5fde15afa58ca1da869391348a34f64472f3` | same blob |
| `host/machine.mjs` | 49, 578–587 | `eb1a1e5f30e1cb10750ec4a7a31486279631ac02` | same blob |
| `tools/media.mjs` | 195–236 | `ff0436be705f846bbb712a5837f8757bb7d6bd30` | changed source read |
| `tools/lib/recipe.mjs` | 14–44 | `660715717cf86943180cb4966ab6bf899d4fa19c` | same blob |
| `web/src/store.mjs` | 6–8, 42–59 | `c1698a67efd60d5394b5d45e33b70f1041f28317` | same blob |
| `tools/lib/container.mjs` | 149–152 | `5c573781df4dc4c24846aef010b5f226354d71b3` | same blob |
| `src/vol.asm` | 330–385 | `7b3dfc3cfcfd956cf1fa6622d82074eccee89d94` | same blob |
| `src/boot.asm` | 100–102, 210–215, 321–346 | `72ecb78d7c78eb1ceda36f3a2834dd7fcdd056cf` | same blob |
| `src/cache.asm` | 661–668 | `93dbae343e94f2a29e675e92c5e8bae9484efa78` | same blob |
| `src/cpm/bdoslog.asm` | 268–343 | `f4431224c452dd004225f1af6760dc9d1cc98d43` | same blob |
| `tools/lib/cpmfs.mjs` | 15–20, 128–149, 180–191, 189–205 | `869bcd39ce8f3735df5b0c9c7f4d6e31413f21ff` | same blob |
| `src/services.asm` | 629–647 | `4de96f7b311c538fe338f77e04d9743d4652d10f` | same blob |
| `src/cpm/ccpcmd.asm` | 200–208 | `85069edd6be4448907e592a88586a8e484fde895` | same blob |
| `src/loader.asm` | 885–913 | `bd2f2f6085e5a41821878dacd071c896ecc3bea0` | same blob |
| `test/pico.test.mjs` | 688–700, 834–846 | `fb5efb828152f229434bcffa5e2f215a22d49e3e` | changed source read |

The current native offer remains ROM
`fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d`
and D8
`9a87dec39a63efc8fdf38ae13d6ec6299763c833fc891de121e2b30f4a1a36ac`.
These existing qualified identities remain the offer authority. Native 16020
used and 364 free already occur in the ea3 memory-map account. No change
from historical 16018/366 is attributed to font growth.
Equal map addresses do not transfer historical provenance.

### Preservation and craft

The reader fence and absence of capture comments match the
input byte for byte. This includes their whitespace. Source listings,
recipes, measurements, maps, hashes and build or screen output were not
rewritten. Existing historical pins remain explicit. The protected digest
below joins complete blocks with a single LF separator.

| Identity | SHA-256 |
| --- | --- |
| Reader input | `882a80a396e6840f22fd17ab72856b9e45e24dd0cf6aac5e34c6eb4b3b32aef3` |
| Reader output | `9c48a6c45cebb880400116a17fe4561fe96f12944c5f05a0977681baeffc0381` |
| Protected fence aggregate | `d64619ea0e766ae1ed33a1290a91f83a0e693937ec7dad35f1517f386d734ef7` |

The intervention is a mechanism/citation correction within the existing
route. Separate thematic and deletion passes kept preflight before generation,
normal operation before failure and each historical example under its own
provenance. Each changed sentence was read within its full paragraph or table
row and across the next boundary. Agency and every-comma passes retained
necessary lists and exact interface punctuation. The reader-order pass kept
the practical prerequisites and the existing ending. No example was replaced
with a source assertion or an invented result.

This adoption closes the owned current-source hold only. Independent adoption
review, whole-book reconciliation and publication remain separate. No product
import, syntax check, assembly, build, test, model, capture, browser action,
physical operation or new runtime allocation occurred.

### Editorial gate dispositions

The actual mandatory prose gate and sentence-complexity report ran on all eight
owned files. These are inert editorial checks. No hard gate finding remains.
The five review flags were read in their complete contexts and retained:

| Gate location | Disposition |
| --- | --- |
| 26 record line 183, columns 134 and 352 | Two matches in the initial agency-pass explanation. It denies interior agency and records a removed attribution. It does not assign that agency to a program. |
| I reader line 123, column 23 | The word refers to interface messages as a plural noun, not an act of perception. |
| I record line 29, column 24 | The same plural noun identifies source-defined interface messages in the initial audit. |
| I record line 66, column 217 | The main script appends bracketed interface messages. This is an output operation. |

The reader's short prompts identify the URL, clock target, focus, storage load,
whole-image versus import path, absent flush and force, driver creation and
recognition. Repeated file/save forms name distinct objects or operations.
The idempotence prompt retains the precise no-write condition: protection is
checked only for a needed rewrite. Notice interpretation stays separate from
later ROM writes. The former protection sentence now states the required 80-column rewrite
and its possible read-only failure. Initial-record
prompts retain audit history. New source and whitespace statements preserve
pin and literal boundaries. The receipt sentence retains its review IDs.

Every complexity prompt was used for a sequential reading decision. The report
also splits code spans, metadata and list continuations into apparent short
sentences. Those fragments were judged in their complete paragraphs or rows.
The initial audit was preserved rather than rewritten for a score. The final
changed-passage readback confirmed prerequisites, exceptions and provenance.
