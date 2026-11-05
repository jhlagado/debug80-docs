# Chapter 18: Cache and persistence

## Brief and complete reading

The chapter explains how a cached record becomes a card write, why directory
writes follow data and what success or failure establishes. Its reader has
used files and volumes and read the bank/state and card/BIOS chapters. The
central evidence is the inherited READ listing and time.img recipe, the
recorded READ/SAVE costs and the earlier write-order traces. No new program,
fixture, benchmark or execution result is introduced.

Read the complete 356-line old `tec-os/18-block-cache.md`, including all listing
comments and its shell fence, and the assigned old01:167–170 paragraph. Read
all53 movement units assigned to18 and checked the fragment list, which has
no destination18 override. The book base is
`10821b68f80c10d2037bbd1c5ab207877c897c68`; those original files have no changes
from that base. The closed replacement outline and house writing standards
remain the structural authority. Also read old05's cache/persistence and
power-cut recovery passages and the pinned recovery contract, to preserve
the failure qualifications behind the links.

Mechanisms use source at TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. Historical runtime evidence has its
specific earlier pins below. No product code or evidence script was executed
or imported. No build, assembly, test, capture or runtime measurement took
place. No source-only check qualifies current font/default policy, KS48 or
physical hardware behaviour.

## Exact movement accounting

All assigned facts, examples and failure qualifications have a home below.
The original READ listing and recipe remain byte-identical to frozen old18.
The later accepted opening-preservation-01 correction adds the complete
old05 failed-close recipe/output at A failed flush, as recorded below. The old check header
and unrelated starter TED identity are replaced by exact evidence scope,
not treated as a fresh run. No editor workflow was exercised by this chapter.

| Frozen source range | Kind | Draft home/disposition |
| --- | --- | --- |
| `tec-os/01-introduction.md:167–170` | paragraph | Opening: batching versus a successful flush |
| `tec-os/18-block-cache.md:1–6` | front matter | New navigation and scoped source/historical evidence comment |
| `tec-os/18-block-cache.md:8–8` | heading | New navigation and scoped source/historical evidence comment |
| `tec-os/18-block-cache.md:10–14` | provenance or capture recipe | New navigation and scoped source/historical evidence comment |
| `tec-os/18-block-cache.md:16–18` | provenance or capture recipe | New navigation and scoped source/historical evidence comment |
| `tec-os/18-block-cache.md:20–27` | paragraph | Opening and policy motivation |
| `tec-os/18-block-cache.md:29–29` | heading | Thirty lines and their table |
| `tec-os/18-block-cache.md:31–34` | paragraph | Thirty lines and their table |
| `tec-os/18-block-cache.md:36–46` | paragraph | Thirty lines and their table |
| `tec-os/18-block-cache.md:48–50` | paragraph | Thirty lines and their table |
| `tec-os/18-block-cache.md:52–53` | paragraph | Thirty lines and their table |
| `tec-os/18-block-cache.md:55–58` | list | Thirty lines and their table |
| `tec-os/18-block-cache.md:60–65` | paragraph | Thirty lines and their table |
| `tec-os/18-block-cache.md:67–67` | heading | A record read through the cache |
| `tec-os/18-block-cache.md:69–75` | paragraph | A record read through the cache |
| `tec-os/18-block-cache.md:77–80` | paragraph | A record read through the cache |
| `tec-os/18-block-cache.md:82–90` | paragraph | A record read through the cache |
| `tec-os/18-block-cache.md:92–95` | paragraph | A record read through the cache |
| `tec-os/18-block-cache.md:97–112` | paragraph | A record read through the cache |
| `tec-os/18-block-cache.md:114–116` | paragraph | A record read through the cache |
| `tec-os/18-block-cache.md:118–120` | paragraph | Historical READ example, endpoints and capacity limit |
| `tec-os/18-block-cache.md:122–138` | example source or output | Historical READ example, endpoints and capacity limit |
| `tec-os/18-block-cache.md:140–141` | paragraph | Historical READ example, endpoints and capacity limit |
| `tec-os/18-block-cache.md:143–149` | example source or output | Historical READ example, endpoints and capacity limit |
| `tec-os/18-block-cache.md:151–157` | paragraph | Historical READ example, endpoints and capacity limit |
| `tec-os/18-block-cache.md:159–161` | paragraph | Historical READ example, endpoints and capacity limit |
| `tec-os/18-block-cache.md:163–163` | heading | A write that reaches the card |
| `tec-os/18-block-cache.md:165–172` | paragraph | A write that reaches the card |
| `tec-os/18-block-cache.md:174–180` | paragraph | A write that reaches the card |
| `tec-os/18-block-cache.md:182–182` | heading | Collecting records before the directory write |
| `tec-os/18-block-cache.md:184–192` | paragraph | Collecting records before the directory write |
| `tec-os/18-block-cache.md:194–199` | paragraph | Collecting records before the directory write |
| `tec-os/18-block-cache.md:201–215` | paragraph | Collecting records before the directory write |
| `tec-os/18-block-cache.md:217–219` | paragraph | Collecting records before the directory write |
| `tec-os/18-block-cache.md:221–227` | paragraph | Collecting records before the directory write |
| `tec-os/18-block-cache.md:229–231` | paragraph | Collecting records before the directory write |
| `tec-os/18-block-cache.md:233–237` | paragraph | Collecting records before the directory write |
| `tec-os/18-block-cache.md:239–239` | heading | Flush order and interrupted updates / Five flush occasions |
| `tec-os/18-block-cache.md:241–245` | paragraph | Flush order and interrupted updates / Five flush occasions |
| `tec-os/18-block-cache.md:247–255` | paragraph | Flush order and interrupted updates / Five flush occasions |
| `tec-os/18-block-cache.md:257–268` | paragraph | Flush order and interrupted updates / Five flush occasions |
| `tec-os/18-block-cache.md:270–270` | paragraph | Flush order and interrupted updates / Five flush occasions |
| `tec-os/18-block-cache.md:272–280` | list | Flush order and interrupted updates / Five flush occasions |
| `tec-os/18-block-cache.md:282–288` | paragraph | Flush order and interrupted updates / Five flush occasions |
| `tec-os/18-block-cache.md:290–290` | heading | A failed flush |
| `tec-os/18-block-cache.md:292–300` | paragraph | A failed flush |
| `tec-os/18-block-cache.md:302–307` | paragraph | A failed flush |
| `tec-os/18-block-cache.md:309–315` | paragraph | A failed flush |
| `tec-os/18-block-cache.md:317–317` | heading | Time with maskable interrupts off |
| `tec-os/18-block-cache.md:319–323` | paragraph | Time with maskable interrupts off |
| `tec-os/18-block-cache.md:325–336` | paragraph | Time with maskable interrupts off |
| `tec-os/18-block-cache.md:338–346` | paragraph | Time with maskable interrupts off |
| `tec-os/18-block-cache.md:348–356` | paragraph | Time with maskable interrupts off |

## Historical measurements, pins and endpoints

A checked-at chapter header was not used as evidence of execution. The main
78127ec results are recorded in Book46:84–87 and its retained measurement
script/output. These same payloads were already archived privately in Origo
`studies/p3-tec-os/evidence/book-reader-rewrite/boot-cost-audit/`.
Their current metadata uses neutral relative paths. No scratch path is copied
here. Script `measure.mjs` has SHA-256
`9fadc5c2a60304385b39ce622c53cc2fbf0584640190774841255dc92365e351`.
Saved output `m781.json` has SHA-256
`1921c0f65d39abe6812d6ca80888bb5e3a59a7593255ab8003df923a5be34947`.
Both were inspected as text/data only. The output's attribution to78127ec
comes from Book46; it does not embed hashes for every runtime input and is
not a newly self-contained qualification bundle.

| Retained figure | Actual recorded pin and support | Method and limit |
| --- | --- | --- |
| About55ms for a card block | 78127ec output block0=219144 | SDREAD entry-to-return cycles, divided by4MHz. This is the block0 call, not a physical-card timing guarantee. |
| DIR hit13,718 and DIR B miss235,357 | 78127ec saved high-DMA histograms; independently reproduced at5a25178 in Book38:90–91 | BREAD entry through return, paired with CFILL calls to classify misses. The saved run contains two A-directory hits. B misses vary;235357 is an observed example, not every miss. |
| CLOOK259 / about2,000 | 60cfbdc, Book22:98–99 explicitly reruns259/1979 | Routine cost, separate from later complete BIOS calls. Do not relabel it78127ec: the later saved CLOOK pair is342/342. Both the original259 and approximate2,000 remain as earlier reference costs. |
| Low-DMA MOUNT hit6,026 / miss226,445 | 78127ec saved mount histograms; also Book44:118–119 at621201d | BREAD entry-to-return during MOUNT. Saved first and second MOUNT calls include low misses226445 and low hits6026 respectively; not every hit has that cost. |
| READ24-byte program, 12,288-byte data | Book41:14–19 identifies the24-byte READ binary and chapter recipe; Book46 reruns the time.img workload at78127ec | The listing/recipe remains literal evidence. The file data and command are unchanged in the inherited example. No assembler was invoked here. Historical ATOM0.3.7 is retained as the recipe context, not a claim about a current production build. |
| READ6,642,581 /1,343,674 | 78127ec, Book46:84–87 and saved read1/read2 | One cold boot, first and second READ DATA.BIN. The script types the command without CR, waits until pending input is empty, input is waiting and the echo length is reached, then records cycles and sends CR. It ends at the next ready prompt. Program loading is included. No735-cycle constant is added. |
| 15,360-byte file about2.0s /2.1s | 5a25178, Book38:94–95 records8.19 /8.41million | Repeated complete-file reading with the historical READ workload. The report records those rounded figures. No exact new781 count or current-source measurement is inferred. Book8 contains an earlier62d47ed reproduction of the same capacity limit; its distinct exact counts are not silently substituted. |
| SAVE8:4096,4130,4131,4128,4129,4096; six versus18 writes | 5a25178, Book38:85–87 | Historical SDLBA-at-SDWRITE trace after B:. Directory at make, four data blocks at close and directory again. The comparison A run makes18 writes. No new781 trace inferred from source equality. |
| SAVE160:80 blocks, three early among first32 | 5a25178, Book38:88–89 | Trace records4128,4129,4130 early. The third occurs in a read's CTAKE. The prose retains that caller distinction. |
| SAVE64:30,615,308 /9,951,810 | 78127ec, Book46 and saved save64B/save64C | Separate cold boots on time.img, select B or C, then the same echoed-command-to-prompt method as READ. Selection cost is excluded.16KiB,7.65s/2.49s and about one third are rounded conversions. |
| Four-block close1,111,542 | 78127ec, Book46 and saved close array | BWRITE type1 entry-to-return after B: and SAVE8 X.COM, the data-flushing close. The earlier create-directory write is separately241760 in the saved array. Not a host physical write time. |
| CWRITE217,421 | 78127ec saved cwrite array; earlier explicit1f9542d run in Book30:156 | CWRITE entry-to-return during the historical write workload. The all30 estimate is30×217421=6522630 cycles, about1.6s at4MHz, excluding flush loop/context overhead. It is not an executed all-dirty flush or a proven latency bound. |

The source reader counter at `host/machine.mjs:265` increments cycles after
CPU steps. The saved instrumentation hooks step before execution at entry
labels and ends calls when PC reaches the saved return address with SP
restored. READ/SAVE timing uses the script's ret helper rather than an
inferred prompt subtraction or arbitrary correction. The archived script
and report preserve the method; nothing was rerun for this draft.

The older header names ATOM atom-z80 0.3.7 and TED.COM from Thorium128edb7,
SHA-256 `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`.
These inherited preparation identities are preserved here rather than used
to certify an editor workflow absent from this chapter. The old C16 note
applied fe2097f only to listed citation resolutions and did not repin captures.
The new mechanism citations are individually inspected at ea3ef3d. No historical
output or code bytes were replaced with future40-column/font results.

## Full source and caller reading

Read all858 lines of `src/cache.asm` at ea3ef3d, including CTAKE's failure path,
CWRBH's hit/miss/no-pre-read branches and the complete MVCOPY implementation.
Read the following supporting passages in context:

| Passage | Claim established |
| --- | --- |
| src/layout.asm:35–58 and src/ram.asm:325–337 |30 lines, fixed EXPAND1 addresses, CTAB/CDIRTY and four workspace state bytes. CIFF is a word. |
| src/bios.asm:223–478 | GETKEY and the no-pre-read rule, READ/WRITE entry wrappers, physical directory dirty/mark state, per-volume policy, IFFGET's repeated NMOS test, CDI and CEI result/state restoration. |
| src/vol.asm:480–524,735–758 | Mount uses ordinary cache lines via CLOOK/CTAKE/CFILL. MNFILL copies descriptor cache bit0 into drive bit1. |
| tools/lib/container.mjs:71–118,166–188 | Host one-written-behind restriction is creation/validation policy, not a count imposed by the ROM flag use. |
| src/volsvc.asm:238–275,326–337,405–429 | Valid mount/unmount changes flush before changing drive state and stop on failure. Invalid requests can fail before reaching VFLUSH. VFLUSH protects cache work with CDI/CEI and retains arguments. |
| src/cpm/bdos.asm:277–289, src/cpm/bdosfile.asm:270–339,637–643, src/cpm/bdosrec.asm:119–126 and src/cpm/bdoslog.asm:100–136 | Function48, changed/clean close distinctions, make and extent transition directory writes, and BIOS type1. |
| src/boot.asm:49–58,95–102,178–215,321–346,499–509 | Cold clear, warm flush, cache/history discard at reset, interrupt state and generated EI/RETI vector. |
| src/sd.asm:517–541,650–670,710–806 | Direct EXPAND1 transfer and accepted-response/busy boundary. No intervening stack use while the transfer window selects EXPAND1. |
| src/console.asm:380–421,450–492; src/history.asm:40–80; src/pico.asm:435–472 | Saved-interrupt restoration in serial, history and VDP-pair access. |
| src/text.asm:90–93, host/machine.mjs:260–272 | Exact Write lost bytes and host cycle-counter ownership. |
| docs/recovery.md:1–120 plus old05:123–185,257–289 | Ordered data/directory writes, failed-write policies, in-place overwrites, new allocations, torn blocks and lack of verified card-level power-loss durability. Source prose does not override the actual CFLUSH/CFLALL distinction. |

No runtime tests were read as if executed. Source semantics and the earlier
recorded model runs remain separate evidence types.

## Corrections made during the source pass

- A write-behind data call may evict an older dirty line. It therefore does
  not necessarily leave the entire card unchanged, even though the current
  record is only cached.
- A through-write that reaches CWRITE ends with a clean line or drops it on
  failure. An earlier failure while obtaining a line can leave another dirty
  line retained. The guarantee is not every cache line being clean.
- A directory flush covers every other dirty line, not only the current
  drive's lines. Close writes only a changed FCB, not every read-only close.
- A successful warm-boot flush establishes completion. Removed the inherited
  unconditional guarantee after Ctrl-C. Failed CFLALL lines are dropped and
  Write lost is reported once for that flush. Default warm boot continues.
- Directory ordering is not a journal or a proof that a partially programmed
  directory block is intact. Preserved the concrete recovery distinction and
  the card's separate unverified physical durability.
- The five occasions name valid drive changes, not every rejected mount call.
  Function48 and warm boot can flush the cache even when the program's files
  use a written-through volume. The old no-call-flushes-whole-cache claim is
  corrected rather than retained as a latency guarantee.
- DI protects against maskable interrupts. NMI constraints remain those of
  the earlier memory/boot chapters. The30-line duration is a derived estimate,
  not a measured worst case or a new real-board result.

## Actual craft passes and remaining acceptance

The generous draft retained every assigned unit before the structural and
sentence passes. The route is record/read hit versus miss, fixed line state,
whole-file comparison, through/behind writes, directory ordering, flush failure
and interrupt response. Both literal fences survive unchanged. The thematic
pass kept each failure consequence beside the operation that can cause it.
The paragraph/sentence deletion pass removed repeated promises and implied
universal timing claims while preserving counts, boundaries, operations and
exceptions. The original introductory batching paragraph's fact is explicit
in the opening and write comparison.

Read each authorial sentence for its job and agency. Replaced the latch's
added-bit shorthand with OR, kept source routines as mechanical subjects and
removed generic praise/summary endings. Read every comma and other authorial
punctuation. Literal source comments retain their semicolons; authorial prose
uses no semicolon or em dash. Explicit pattern searches and a final full
reader-order pass supplement that judgement. No prose gate or readability utility was invoked in that initial
pass. The later bounded preservation correction below records its actual
text-gate and complexity checks. No runtime harness was invoked.

Final text/Git checks found 80 citation occurrences across 19 source files,
all within their source bounds. Both complete fences are byte-identical
to the frozen original. Coordinate validity supplements the semantic reads. Independent
editorial/factual review, final source/input qualification, navigation integration
and the whole-book read remain pending. Only the Chapter18 draft and this record
are owned. No current font/default/runtime acceptance is claimed.

## Independent lead review disposition

The complete independent review is in18-independent-review.md. Corrected the
overwide resetwritesnothing claim to no flush of the old cache. Deleted a
redundant copy-path announcement and merged repeated through-write failure
wording. Complete historical fences are unchanged. The reviewer read the full
old/new chapter and current cache source, supporting callers and actual retained
measurement payloads/reports. Bounded source/craft review is closed after
these corrections; final profile/runtime/navigation acceptance remains open.
No execution or new observation accompanied the review.

## Accepted opening-preservation-01 correction

The accepted independent finding is in `opening-factual-review.json` at book
`9cdbc1f`, ID `opening-preservation-01`. Read the full current 402-line reader
chapter and 221-line pass record before editing, then frozen
`tec-os/05-drives-and-cache.md:180–205` with the surrounding failure-policy
paragraphs and inherited input header. The complete old recipe/capture also
remains in 01-pass-record. The new reader home is
`draft/18-cache-and-persistence.md`, **A failed flush**, after the directory-failure
and removed-card explanations, before Time with maskable interrupts off.

The original shell fence, exact capture comment and complete output fence
from frozen old05:184–199 are inserted unchanged. The named file X.COM remains
in DIR after Bad Sector and Write lost. The block is labelled historical
TEC-OS `78127ec`, with matching historical ROM/starter media and the existing
host setup/matching-media prerequisites. It is not a current `962853f` result.
No physical-card behaviour or new run is inferred.

The old05 header separately names starter TED.COM at Thorium `128edb7`,
SHA-256 `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`,
and TAS.COM at Thorium `dbee66a`, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.
SAVE itself is built in. Those inherited application identities do not turn
this fixture into an editor or assembler workflow.

### Semantic evidence read

Read historical `78127ec:src/cpm/ccpcmd.asm:169–283` in full for make, two
records, close and the default failure exit. Read
`78127ec:src/cpm/bdosfile.asm:138–220,304–382`: make clears RC and the map
and writes the empty entry before later close publishes changed fields. Read
`78127ec:src/cache.asm:178–225,369–399`: the directory path drops its failed
update, preserves failed dirty data for a retry and warm boot drops failed
lines while reporting Write lost. The existing ea3 mechanism paragraphs were
checked against their complete `src/cache.asm:292–350,632–668` contexts. They
remain separate and are not repinned.

The zero-record description is explicit in frozen old05:201–205 and supported
by the historical make/close path. DIR alone is not evidence of that record
count. The new interpretation makes both the fixture-specific record state and
the weaker observation of a listed name explicit. No zero-filled data contents
or new image inspection is claimed. Cost-audit timing records cover separate workloads. The frozen capture/prose
and historical source support this preservation repair.

### Preservation identities

Hashes cover UTF-8 text bytes with the original LF endings. Fence-body hashes
exclude Markdown delimiters and include the body's final LF.

| Retained material | Bytes | SHA-256 |
| --- | ---: | --- |
| Complete original old05:180–205 | 801 | `3164f2863fd38267977d5f99a555a46e6b0c993815f01c7b54baf8fe087d73f8` |
| Shell body old05:185–186 | 62 | `98b341a96d91d1369fa048b824a49353b1578d24c39630f364dbd5bde5adb955` |
| Capture body old05:191–198 | 99 | `0809690255886a0229c7153bcdc61e0d6660e91719dba5f1fa52f0964dd46c37` |
| Both fences and capture comment old05:184–199 | 276 | `32739bd834e1f9cab6591d02c5d2ff5250fa6a408f69b815c894a8afaa56f38d` |

### Separate craft and read-back passes

The initial insertion retained every recipe/output byte and developed the
make, buffered-write, failing-close, key, retry, loss and surviving-name order.
The thematic pass placed the example beside the existing directory-failure
mechanism. The sentence-deletion pass removed repeated reassurance while
keeping the record-count qualification and the prerequisite distinction.
Agency, every comma and sentence purpose were read separately. All inserted
paragraphs and both literal blocks were read back with the surrounding A failed
flush section. The source-only comparison preserves the original two READ
fences and all other reader prose outside this bounded insertion/header note.
The final deletion pass removed a restatement after the DIR qualification.
The fixture follows the complete existing removed-card paragraph so its
original antecedent remains unchanged.

Only this reader chapter and pass record change. No shared ledger, root
navigation, source pin, runtime, import, test, build, assembly, capture or
publication changes. Independent bounded confirmation of the preservation
correction remains open.

### Actual text gates and complexity dispositions

The bundled prose gate ran on both actual owned files after the insertion and
craft passes, with an empty findings array and exit 0. No flag required a
retention exception. The actual complexity utility ran on both files as a
reading aid. Its prompts were read with their complete paragraphs or list
items. Unchanged original mechanisms are outside this bounded prose correction.
A clean gate does not establish reader quality or runtime qualification.

| File | Reported line | Prompt | Context disposition |
| --- | ---: | --- | --- |
| 18-cache-and-persistence.md | 11 | SHORT(5) | Metadata fixes the unprefixed citation authority. |
| 18-cache-and-persistence.md | 21 | ECHO(block/blocks) | Block cache and card blocks name the mechanism and transfer unit. |
| 18-cache-and-persistence.md | 26 | SHORT(5) | The transfer link and retained-cache state have distinct technical purposes. |
| 18-cache-and-persistence.md | 26 | ECHO(cache/cached) | The transfer link and retained-cache state have distinct technical purposes. |
| 18-cache-and-persistence.md | 44 | SHORT(6) | Empty-line definition and mount cross-reference each supply a fact. |
| 18-cache-and-persistence.md | 44 | SHORT(5) | Empty-line definition and mount cross-reference each supply a fact. |
| 18-cache-and-persistence.md | 110 | CLAUSES(0+3) | Both bank values and copy directions are needed. |
| 18-cache-and-persistence.md | 184 | LONG(30) | Accepted block and end-of-busy define completion. |
| 18-cache-and-persistence.md | 195 | ECHO(line/lines) | One reused data line contrasts with other retained lines. |
| 18-cache-and-persistence.md | 204 | ECHO(writing/write) | Four record writes per block explain the cost. |
| 18-cache-and-persistence.md | 216 | NEG(2) | The zero-fill/no-pre-read branch needs both conditions. |
| 18-cache-and-persistence.md | 223 | ECHO(writes/write) | Data and directory writes must both succeed. |
| 18-cache-and-persistence.md | 240 | LONG(28) CLAUSES(2+1) | Make, changed-FCB close and extent transition all cause writes. |
| 18-cache-and-persistence.md | 257 | ECHO(block/blocks) | Historical file size and three early-block counts remain exact. |
| 18-cache-and-persistence.md | 270 | ECHO(lines/line) | Numerical line order defines the flush sequence. |
| 18-cache-and-persistence.md | 276 | SHORT(4) | The no-rollback limit and recovery link must remain. |
| 18-cache-and-persistence.md | 276 | SHORT(6) | The no-rollback limit and recovery link must remain. |
| 18-cache-and-persistence.md | 309 | SHORT(1) | A scanner fragment of the complete warm-boot list item. |
| 18-cache-and-persistence.md | 311 | ECHO(fails/failed) | Valid mount changes fail before state changes if a line failed. |
| 18-cache-and-persistence.md | 313 | CLAUSES(2+2) | The full function-48 bullet specifies both return values. |
| 18-cache-and-persistence.md | 314 | SHORT(5) | Scanner continuation of that complete function-48 bullet. |
| 18-cache-and-persistence.md | 326 | NEG(2) | No new dirty data is the condition for no next write. |
| 18-cache-and-persistence.md | 400 | CLAUSES(0+3) | Both BIOS calls and mapping/cache work define the protected interval. |
| 18-cache-and-persistence.md | 432 | LONG(26) | The enabled-interrupt condition and all protected phases are needed. |
| 18-cache-and-persistence.md | 432 | ECHO(writing/write) | One-line miss and whole-cache flush are different latency cases. |
| 18-pass-record.md | 5 | ECHO(write/writes) | Original brief names write consequences and prerequisites. |
| 18-pass-record.md | 5 | CLAUSES(0+3) | Original brief names write consequences and prerequisites. |
| 18-pass-record.md | 22 | SHORT(6) | Original source pin does not certify a rerun. |
| 18-pass-record.md | 96 | SHORT(6) | Archived payload identities and limits remain explicit. |
| 18-pass-record.md | 96 | SHORT(6) | Archived payload identities and limits remain explicit. |
| 18-pass-record.md | 96 | LONG(27) NEG(2) | Archived payload identities and limits remain explicit. |
| 18-pass-record.md | 141 | LONG(26) | Original complete cache-source reading scope is retained. |
| 18-pass-record.md | 168 | SHORT(1) | Scanner continuation of an original correction bullet. |
| 18-pass-record.md | 171 | SHORT(2) | Scanner continuation of the directory-flush correction. |
| 18-pass-record.md | 173 | SHORT(4) | Original successful-flush/default-continuation distinction remains. |
| 18-pass-record.md | 173 | SHORT(4) | Original successful-flush/default-continuation distinction remains. |
| 18-pass-record.md | 176 | SHORT(4) | Scanner continuation of the no-journal correction. |
| 18-pass-record.md | 183 | SHORT(5) | Scanner continuation of the interrupt/NMI qualification. |
| 18-pass-record.md | 188 | SHORT(5) | Original fence-preservation and craft scope remain recorded. |
| 18-pass-record.md | 188 | CLAUSES(1+2) | Original fence-preservation and craft scope remain recorded. |
| 18-pass-record.md | 198 | ECHO(semicolons/semicolon) | Original literal-punctuation and no-runtime scope remain separate. |
| 18-pass-record.md | 198 | SHORT(5) | Original literal-punctuation and no-runtime scope remain separate. |
| 18-pass-record.md | 207 | SHORT(6) | Coordinates supplement the semantic reads. |
| 18-pass-record.md | 216 | SHORT(5) | Earlier independent correction kept its historical fences. |
| 18-pass-record.md | 227 | LONG(27) | Exact input sizes and frozen reading scope are recorded. |
| 18-pass-record.md | 243 | SHORT(5) | Builtin SAVE does not invoke historical TED/TAS. |
| 18-pass-record.md | 252 | LONG(26) | Drop, retry and warm-loss paths all support this fixture. |
| 18-pass-record.md | 262 | SHORT(6) | Timing-record workloads are separate from the restored capture. |

Reader input SHA-256: `f7ffc97823da0b464f2701cc54621cfe5d536c1c059d88b639d8e38fe8a4a904`.

Reader output SHA-256: `e4540d9bf5c529190a555a80c278c28542a9394924884b3345643dd34e71e845`.

Removing only the inserted fixture section and restoring its one provenance
header line reconstructs the entire input reader file exactly. The two original
READ fences are unchanged. Both added fence bodies and the capture comment
match frozen old05 bytes, including the padded X.COM row. A whitespace check
therefore retains that historical trailing-space row deliberately.

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
