# Retained assembly: compact-source proof plan

Status: source-only inventory and proposed packet structure. No candidate,
executable packet, command, budget, approval or allocation is sealed here.
No reader listing is replaced. LINE already has its separate accepted serial
proof and is excluded from required reruns.

I read runtime-verification-needs.md first. This plan prepares the remaining
compact-source work before any replacement of retained examples. Mechanism
authority remains TEC-OS ea3ef3de9133931e925a0220d51c0e971c1fd8dd. KS48's
development allocation is neither a qualified source offer for this work nor
an opening-workflow allocation. A later source offer requires a new comparison
of the contracts and inputs used here.

## Inventory identity

The inventory was read from the draft directory at book commit
255bdf30835ded5f219a52b4691e3c8be414a121. The fence-body identities below
include the original line endings and final newline but exclude Markdown
fences. Coordinates locate source lines rather than the fence delimiters.
The hashes identify retained text, not assembled programs or passing runs.
Drafts can change concurrently, so packet preparation must re-extract and
compare these identities before accepting a closure.

All paths in the table are relative to editorial/reader-rewrite/draft.
There are 26 assembly fences: 20 complete retained program/service listings,
HWLIB, SHOW's fragment, the ROM include-order excerpt, qualified compact LINE,
the old LINE audit candidate and held FAIL. The required retained set has
23 fences after excluding both LINE copies and separating FAIL. CHEAT adds
one derived executable source. It has a mutation recipe rather than a full
assembly fence. These are inventory counts, not execution totals.

| Listing | Draft source lines | Bytes | SHA-256 of retained fence body |
| --- | --- | ---: | --- |
| SHOW fragment | 08-call-tec-os.md:89–95 |176|19b48835392060bce88e16f52226ed74e1985ad942c42fb77082857dc736fcda|
| SHOW |09-read-and-write-a-file.md:143–179|1179|dc7b84514897bed699e9cdc1c2e79581e27f215222fc772d2be1a6c1bb508abd|
| TOP |10-memory-for-programs.md:85–112|657|5d08a7b0f61ca86b765cbb1181e8a0d55b33d83562d12dc81684a7c2e09d0849|
| AREA |10-memory-for-programs.md:198–238|1269|f3b6e61d5c194653048ec601ef0ef54cc98ebfd5c9833ae85d8ac101ef330034|
| KEY |10-memory-for-programs.md:454–497|1257|19a496559f7d130383f28787d9e09e0574dce685e16821af818a4c09258074f1|
| HWLIB |11-use-the-boards-devices.md:152–207|1755|f79687a437ce6a74c90c34272d93093f61731c63cd13cb8a3c9964f4cf215338|
| BOARD |11-use-the-boards-devices.md:236–285|1340|76abc8bcb272aa567a118fef1e22320d823109b4885e64d21c8d9c3974123288|
| LCDMSG |11-use-the-boards-devices.md:361–381|577|439cbc2600c8e30e9645cf136e9fcce78ed6fbecb505fc65172d131de6f251f3|
| DIGCLK |11-use-the-boards-devices.md:457–520|1751|f1ad379fd8a83afe6f0c0180e1c1956a016f5a0f55f51caaff977be83b411398|
| NOW |11-use-the-boards-devices.md:533–578|1124|2568599921c253588c3cffb9e9c87b30187dab010b11d0bf3579c4a4965a51ac|
| ROWS |11-use-the-boards-devices.md:613–673|1466|0b1de6333c9984bd937223ecfb57896012511fdbcc3fd76456c244d8fafc9772|
| PLACE |11-use-the-boards-devices.md:752–782|822|09087942638e6bea22c9c5d3e450f05342584da5f16922f1da06395a8d004d9b|
| EXISTS |12-results-and-command-chains.md:145–158|568|985b09d53ca365f48b65c2f730001295c094401f5777172a9057aaab5004f17d|
| RUN |12-results-and-command-chains.md:292–305|519|6dce7b5dd7d152fa63f4335fe453103bd1776068959bcea7ad741f53e58c48a3|
| COUNT |13-write-a-resident-service.md:68–129|1885|372bc013b7907fa1b4308f31054a66df925e39e8b0afeceeda739d1b00240966|
| CHARS |13-write-a-resident-service.md:510–544|1048|a2e6e3bcbde00088e63918b3516246fbb2fdb2b8964ce8c86aaf68ad5169bf07|
| RECS |13-write-a-resident-service.md:563–615|1361|81663bfd2f8393f5bc99bc24ebde5533076c2fc068cbc022ca692f8222075c58|
| NEEDS |13-write-a-resident-service.md:687–716|944|547ed52c6a29f2f282ac4f7d3cb948acecc22f3f15290a5d8b8f8d6fde28a452|
| READ |18-cache-and-persistence.md:140–154|589|3fdb415da9cceb855a30e187291cf3976ab62811f36d311c847bab248cd9fcda|
| ARGS |20-from-prompt-to-program.md:514–561|1260|5e6945f6ee9ec6be93e234f6e7f338763f9ff9ddd662f55f0dfd8ebec3fce709|
| ROM include order |26-build-the-rom-and-media.md:129–167|919|0e63a3e403c4adfd68b45575f72b6ffc564d9145e63c773b727343209c7a1cae|
| HELLO |26-build-the-rom-and-media.md:357–365|333|ebab7a75f15a68fee22283fd7f9682a4ee80f49dab46c3b64435bc18d98079a6|
| VTEST |appendix-b-rom-services.md:463–522|1796|6b0fcd65d2da1ad619a1c53ea06c9f076193cc128a3747f7f273246f839c037e|
| FAIL, separately held |13-fail-example-candidate.md:18–35|506|2a155b29b59d4bb5058ce31b2caf89745cb815b583f8e4e9f1a64200353e1e31|

CHEAT's historical derivation is the complete comment at Chapter13:449.
It changes COUNT's declared stack bytes from 2,2,2 to 9,2,2 and the printed
service name from COUNT to CHEAT. Freeze both the resulting original source
and a separately reviewed compact derivative. The tab-specific historical
substitution cannot be applied blindly to compact text. The rejection must
still be caused by the declaration exceeding the BDOS allowance.

LINE's current fence is Chapter8:126–146, LF body SHA-256
04259853d86110e57343f88f2b78cbb4d9209b72bb62db3bbff93dc895f2987d.
The measured offer source uses CR/LF and SHA-256
5286389ada471b67a8a9427e8a503121ab014feb2a28c36393ed05d838c077ec.
Its original audit source remains SHA-256
26dfd1fb57c7c1b784f296b8c1ae7b93a378c9f57b4c4dc7cdad486a1199814c.
Origo71696f2e's line-ea3-attempt01 establishes the accepted serial result.
Neither LINE source is an outstanding compact target.

## Historical evidence stays attached to its run

SHOW, TOP/AREA/KEY, the hardware chapter's recorded workflows, chains and
ARGS retain their documented78127ec evidence. Book45 records the first
program/memory/hardware reruns. DIGCLK has no separate positive transcript
in its original chapter, so its listing must not acquire one by association.
ATOM0.3.7 and starter TAS Thoriumdbee66a remain their historical tool inputs.
The matching historical TED is Thorium128edb7 where the editor is involved.

COUNT's installation/use/removal workflow is78127ec, explicitly Book45.
CHEAT, RECS and NEEDS have621201d run evidence in Book42. The PC writer's
111-byte result is7458352 in Book31. Its comparison with TAS's first111
bytes is60e0768 in Book27. Do not replace these with a common chapter pin.
The later makeSvc/GAPZERO run at78127ec does not repin every earlier writer
result or AppendixH's GLCD dump, which remains621201d.

READ's recorded READ/SAVE timing work remains78127ec. Earlier CLOOK costs
are60cfbdc and larger-file/write-order examples are5a25178. A compact READ
proof does not remeasure those figures. HELLO's33-byte ATOM result and TED
error/repair round have explicit7458352 evidence, with later recorded
captures kept separately. VTEST's retained result is60e0768 using the
then-loaded PICO.SVC, not the later ROM PICO console. Chapter24's765-byte
walkthrough remains58d4345 and is outside this formatting proof.

FAIL entered the book at5006e2c and remains in frozen10821b6. Its original
execution is unestablished. Keep its complete audit candidate unchanged.
If separately offered, it needs a new positive observation of the intended
failed-INIT path, not an invented historical capture or a successful install.

## Source closure and public assembly routes

Prepare original and compact files separately. Preserve literal strings,
character case, expressions, identifier identity, entry order, reservations
and comment meaning. Use two-space instructions, lowercase mnemonics/registers,
separate code labels, inline data declarations and the chosen40-column comment
layout. Record any long literal that needs an exception rather than silently
changing its bytes. Keep each source at or below24,576 bytes. Candidate
creation and final source hashes are future work, not artifacts of this plan.

| Closure | Exact inputs to retain | Public route to qualify later |
| --- | --- | --- |
| Plain COM | SHOW, TOP, AREA, KEY, EXISTS, RUN, READ, ARGS and HELLO. No assembly include in these fences | Explicit ATOM stand-alone assembly at0100h, as the retained `npx atom name.asm name.com` recipes. Build the actual compact source on card through `TAS NAME` when claiming that route |
| HWLIB clients | BOARD, LCDMSG, DIGCLK, NOW, ROWS, PLACE, CHARS, RECS and VTEST each include `ABI.INC` before ORG and `HWLIB.ASM` after their body | On-card `TAS NAME` with both includes on that drive. ATOM reference needs its actual supported include handling established before the packet can close |
| COUNT/CHEAT | `ABI.INC`, complete service header/body and the exact derived CHEAT changes | On-card `TAS COUNT COUNT.SVC` or `TAS CHEAT CHEAT.SVC`. PC route is public makeSvc with explicit source and work paths, after its compact-source blocker is resolved |
| NEEDS | `ABI.INC`, full header/body and trailing `DEPS: db 1,"COUNT   "` | On-card `TAS NEEDS NEEDS.SVC`. For makeSvc, preserve a separately identified writer input without trailing DEPS and pass `deps: [{name:"COUNT",version:1}]`. Review this representation change before comparing files |
| Held FAIL | `ABI.INC`, exact original and future compact service | Separate `TAS FAIL FAIL.SVC` or qualified makeSvc route and a separately allocated failure observation |
| Include-order excerpt | Complete39-line Chapter26 body, corresponding ea3 `src/rom.asm` order and named generated inputs | Source-listing comparison only. It is not a standalone executable. Formatting this excerpt does not require or qualify a ROM rebuild |

There are nine HWLIB clients, including the two registry clients and VTEST.
HWLIB is executable code/data included after entry code, not an independent
COM program. Qualify its complete compact body through those clients. SHOW's
saved-register fragment must match the corresponding instructions in qualified
compact SHOW. It needs no invented standalone wrapper or separate run.

ABI.INC means the exact distribution include from the selected offered ROM,
with its source `src/abi.inc` identity recorded. Freeze both if they differ.
Record every resolved include path and hash, including CP/M filename spelling
and host case-sensitive spelling. The original-versus-compact comparison uses
the same include version on both sides. Historical recreation instead uses
that run's historical include. Equal consumed constants must be demonstrated
before transferring any comparison between these two contexts.

The ROM excerpt includes abi.inc, generated config/format/geom/font, layout,
ram, reset, abi, tables, text, boot, bios, console, keyboard, term, video,
tms, pico, lcd, sd, vol, volsvc, volutil, the four CCP and six BDOS files,
services, cache, history, loader and end in their retained order. A future
listing-only change compares this order with `ea3:src/rom.asm:7–45`.
Generated files have build identities. Listing their names creates none.

### Route limitations to close before an executable offer

At ea3, `tools/lib/prl.mjs:32–43` uses a case-sensitive ORG_LINE expression
for uppercase ORG. `makeSvc` in `tools/lib/svc.mjs:93–99` uses it to split
and rewrite the source. The intended lowercase `org` therefore cannot be
assumed to work through that writer. A separately owned, reviewed writer
change and its qualification are needed before promising that public route.
Do not uppercase the reader candidate only for the comparison.

The same writer documents ATOM's header-only INCLUDE handling and expands
post-origin includes for its own copied source. The ordinary stand-alone
wrapper at `tools/lib/assemble.mjs` does not perform that expansion. For
HWLIB clients, establish the supported public ATOM route with the actual
trailing include. Any necessary source-expansion adapter needs its own
reviewed specification, input/output identities and inclusion-order proof.
An undocumented concatenation cannot count as assembly of the reader source.

The existing assembleProgram and makeSvc wrappers do not expose the proposed
per-assembly limits below. A future harness must bound their actual work and
whole invocation, including synchronous assembly. Do not import
test/lib/fixtures.mjs for convenience: its top-level GLCD_SVC builds a driver.
No missing input should trigger a download, installation or assembler fallback.

For NEEDS, makeSvc takes dependency records from its option while TAS takes
them from trailing DEPS. Compare the intended image, dependencies, relocation
stream and loaded result. Passing identical unadapted source to both writers
would not establish equivalent service files. `packSvc` and the TAS writer
must be checked semantically before choosing byte-level acceptance criteria.

## Proposed fixture groups and observations

Share immutable fixture definitions and verified dependency artifacts between
packets. Start each behavioural case on a fresh card copy and fresh machine.
Shared fixtures do not authorise a combined run or shared mutable machine.
All following observations are proposed acceptance requirements, not results.

| Group | Shared preparation | Required observations and controls |
| --- | --- | --- |
| Text programs | Exact starter copy, HELLO source/text and COM on B. SHOW uses its original work.img recipe | HELLO prints its literal greeting and returns. SHOW prints the exact selected file, stops at1Ah or sequential EOF and prints No such file for an absent name. Check a record boundary with an identified text fixture. Derive the Chapter8 fragment from qualified SHOW |
| Memory and BIOS | mem.img for TOP/AREA, separate con.img for KEY. GLCD and four-G8M cases keep their own preparation | TOP equals the actual0006h word. AREA equals that word minus0100h. Service/card variants use their own maps and hashes, not copied B9A4 figures. KEY installs private SP before raw BIOS calls, takes exact input hex61 5A 03 1B 0D and prints `61 5A 03 1B 0D ` before CR/LF, then exits by JP0000. Check returned prompt state and retain the trailing space |
| Hardware helpers | hw.img, ABI.INC and both HWLIB versions, fixed clock and explicit serial/PICO configurations | BOARD reports the configured bits/version/geometry and rejects a bad number. LCDMSG changes the actual20-byte row and records tone-port activity. DIGCLK reads time, scans digits and ends on a supplied key with digits off. NOW has fixed-clock and absent-clock cases. ROWS needs timed key down/up and row/JOY bytes for x and5 plus disabled-Matrix control. PLACE checks positions, raw reverse bits and unchanged cursor, with absent-console result separately observed |
| Chains | chain.img with EXISTS/RUN and separately prepared startup variants | EXISTS absent/present results and following-colon behaviour. RUN executes a nonempty tail and reports Not run for rejection. Inspect function108/47 and CHPOS, not only prompt suffixes. A failed flush must cancel a queued piece. Keep default BDOS abort separate from returned errors |
| Resident services | svc.img with AREA, ABI.INC, HWLIB and previously qualified COUNT/CHARS artifacts. Use serial or PICO with GLCD absent | COUNT hooks/unhooks the exact CONOUT target and publishes its count. Check loaded pages, top, record and count increments with observed entry/exit boundaries. CHARS has record-present and absent cases. RECS checks newest-first records/version/table addresses against actual memory. NEEDS fails without COUNT then installs with it and removes newest first. CHEAT is rejected before INIT for its9-byte declaration. No directory or prompt count substitutes for these observations |
| Cache reader | Separate time.img: SYSTEM/A, THROUGH/B and BEHIND/C:wb, READ and exact12,288-byte DATA.BIN | READ reaches sequential EOF and warm return, with absent-file control. Compare final file/card state where writes are involved. Do not rerun or repin cache timing tables as part of source formatting. A new timing offer must name exact endpoints and counters separately |
| Argument inspection | Separate ccp.img with ARGS and identified FITS/BIG fixture definitions | Exact two FCB name/drive fields and command tail for `args one.txt a:*.c` and `ARGS X Y ! ARGS`. Verify no stale second argument in the next piece. Original47104/47105 fixtures are historical. Recompute any later loader-bound control from its matching artifact and label it separately |
| PICO record | VTEST with ABI.INC/HWLIB and actual ROM PICO record on ea3 | Observe record lookup, claim, four-byte VRAM write/read at3000h, release and ready prompt. Compare BACK to VRAM, not only printed VRAM. Missing PICO is the control. A new ROM-console result cannot repin the60e0768 PICO.SVC result |
| HELLO editor round | Same compact HELLO text, exact TED/TAS and project/session files, separately specified display | Retain the old7458352 error/repair screens. New compact line numbers must come from its actual source. If replacing that reader workflow, observe TED save/reopen, deliberate syntax error, reported line/column, repair, build/run and return to TED through ordinary keys. This is a separate workflow offer, not implied by COM-byte equality |

For memory variants, inventory the exact Chapter10 TOP scenarios with no
service, GLCD installed and four G8M volumes, plus AREA's normal starter case.
The historical numeric outputs remain historical even if a later case happens
to match. For NOW, retain the clock origin and observe elapsed emulated cycles
through assembly and execution. Its old12:00:08 is not a universal expected
value after changing the source text or assembler workload.

The full COUNT sequence is AREA, COUNT.SVC, SERVICES, AREA, CHARS twice,
UNLOAD, SERVICES, AREA and CHARS. Its new count values must follow the actual
hook sampling boundaries and printed bytes, not copied003A/0052. The chain
group retains both EXISTS cases, `RUN DIR`, `RUN A:MOUNT!DIR`,
`RUN NOSUCH!DIR`, empty RUN and the two Chapter12 startup-card recipes.
The future packet must select its finite cases explicitly and split the
group if they exceed the proposed envelope. No grouped row permits dropping
a retained scenario when claiming its replacement proof complete.

DEMO has no complete assembly fence in the inventory. Chapter11's recipe
uses `test/programs/demo.asm` from its identified product tree. Keep that
input and its historical captures unchanged. If a future group uses DEMO as
a control, hash it and charge its preparation explicitly. This plan does
not authorise reformatting or rebuilding product sources, GLCD or the ROM.

## Comparisons and evidence to retain

For every complete candidate, retain original text, compact text and resolved
include closure with byte counts and full SHA-256. Compare original and compact
ATOM bytes at the same origin and all existing symbols. Line/source-map
coordinates may change but label values, equate values and identifier identity
must not drift. An additional label requires explicit review rather than a
blanket symbol-equality exception. Literal comments need a semantic read too.

Build the actual compact source through the named public route. COM comparisons
distinguish logical image length from128-byte file records and inspect padding.
For services, retain both origins, header, image size, extra reservation,
INIT/REMOVE offsets, declared stacks, dependencies and exact relocation bytes.
Compare original/compact within each writer first. Compare TAS and ATOM writer
representations only after accounting for their explicit dependency interface.
Retain raw files and debug output as well as decoded summaries.

With shared HWLIB, compare each complete original closure with its complete
compact closure. Add mixed original-client/compact-helper and compact-client/
original-helper assemblies where isolating a helper change requires them.
Charge these extra assemblies before requesting a run. Do not silently add
them after a limit is reached.

Record the ROM/map/census, starter, prepared card, runtime, assembler, TAS,
TED and include identities for each actual case. The ea3 serial authority
used by LINE is a possible input source, not an automatic allocation for
these jobs. Reusing it requires verifying its full input manifest. TAS's
historical application pin is dbee66a90816df9a5884a08754ebc2d458a38325,
10,295 bytes, SHA-256
45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
ATOM0.3.7 and runtime0.3.3 are named starting requirements at ea3, not complete
dependency-tree identities. Preserve actual locked files and executable hashes.

Keep raw console/serial bytes with exact capture start/end boundaries and
separate memory, device and card observations. Preserve failed/stopped evidence.
A genuine ready prompt needs command-input state, startup completion and no
pending supplied input. Literal prompt-like output alone is insufficient.
Observe inherited return/private-stack exit and the relevant warm-boot path.

For40-column source presentation, add a separately reviewed display case after
the adopted font/default source is qualified. Reading complete source in TED,
include filenames, wrapping and scroll/edit behaviour need observation. Glyph
pixels and reverse presentation require display evidence beyond font-dependent
text decoding. Neither serial proof nor assembly equality qualifies KS48,
a browser or a physical board. No new captures replace old fences by inference.

## Proposed bounds for later review

Use small separately reviewable execution units, normally one target assembly
plus its bounded behavioural cases. Fixture grouping is not a request for one
unbounded batch. The proposed envelope per ordinary unit is120 seconds for
the complete invocation,600 MB whole-tree memory,450 MB heap and zero shared
lock wait. Start the absolute deadline before payload restoration or imports.
These numbers are proposals only and have not been measured for these programs.

| Work inside one proposed unit | Proposed maximum |
| --- | ---: |
| ATOM reference work | At most4 calls, each98 million cycles and10 million instructions, charged100 million cycles each |
| Actual on-card TAS build |1 build,1.2 billion model T-states |
| Fresh boot and drive selection |300 million T-states total across the unit |
| Behavioural cases and settling |600 million T-states total, each wait at most100 million unless a smaller case limit applies |
| Whole accounting ceiling |3 billion charged cycles, including references and all model steps |
| Single-step overshoot reserve |2 million cycles checked before each step |

At most4 reference calls cover a simple pair plus two mixed-include comparisons
or the service pair at two origins. They do not cover both sets together.
Previously qualified dependencies must enter by retained artifact identity.
Building a helper dependency again consumes its own separately proposed unit.
The four-call ceiling plus1.2 billion build,300 million boot and600 million
case limits totals2.5 billion, leaving500 million below the global ceiling.
That margin is not permission for extra cases, retries or another build.

The proposed ordinary envelope may be insufficient for the HELLO editor round
or a later40-column visual review. Cut those into separately specified offers
with explicit input sequences and their own reviewed limits. Do not extend
the ordinary envelope during execution. If a call lacks an enforceable bound,
the packet is not ready. A watchdog must cover synchronous work and the whole
process tree, not just asynchronous waits. An unavailable lock, failed identity,
timeout or stopped job permits no automatic retry or fallback.

## Packet preparation and replacement gate

The next preparation step is to choose a bounded group, create its exact compact
candidates in a separately authorised private location and resolve the public
route limitations above. Freeze the sources, dependencies, fixture construction,
expected observations, one failure control and finite case list. Name the
actual source/ROM authority before writing the final harness or command.
Independent static review must close on that exact packet. Approval and
allocation remain separate subsequent decisions. No executable command or
approval/allocation receipt is supplied by this plan.

After an allocated run, independent result review must compare retained bytes,
observations and limits with the sealed requirements. Only then replace the
specific listing through a whole-passage craft pass. Preserve historical
recipe/output provenance and amend any new command, line number or display
interpretation only from its own actual evidence. A byte-identical compact
program does not establish that an old transcript was rerun.

This plan used source reads, manual craft passes and inert text hashing only.
Paragraph/sentence deletion, agency, every-comma and complete read-back passes
covered the plan. No product module or fixture was imported and no assembler,
test, emulator, capture tool or runtime was executed. Only this plan is changed.

## Independent planning review

The complete source-only planning review found one citation-range correction.
At ea3ef3d the ORG split is atsvc.mjs95 and rewrite at97, within93–99.
The range above is corrected from100–107. The uppercaseORG blocker itself
remains supported byprl.mjs34 and the public-route limitations are unchanged.
The lead read both numbered source bodies without importing them. Immutable
shared inputs/fresh cases, separate qualification/sealing/allocation, proposed
whole-job accounting, closedLINE and historical evidence boundaries were
otherwise clear at this planning level. The private executable preparation
was not part of that review. No runtime is authorised or performed.
