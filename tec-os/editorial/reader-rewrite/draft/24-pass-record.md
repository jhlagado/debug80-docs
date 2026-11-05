# Chapter 24 pass record

## Brief, reading and authority

I drafted only `draft/24-loading-and-removing-services.md` and this record.
The job is to trace a resident file through validation, relocation, INIT,
record publication, rollback and removal, ending on checks versus service
responsibilities. The reader has the authoring route from13, page-zero and
stack concepts, numbered calls and the CCP's load path. H is the exact format
reference. Practical chains are in12 and startup policy is in25.

I read the complete old24, all68 assigned movement units and the complete
closed replacement outline with its opening-profile amendment. There are no
assigned fragments from another chapter and no fragment overrides for24.
The original is unchanged from movement base10821b6. I also inspected the
current house STYLE changes and retained its source-versus-evidence distinction.
The human-writing and teaching standards supplied the thematic, deletion,
agency, punctuation and reader-order passes. No chapter summary template
replaces the house requirement to end on a substantive point.

Current mechanism authority is TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. The original's C16 partial-citation
header is replaced by a source-only mechanism header. Every current source
range was checked semantically against git text, not carried by line offset.
Historical addresses, counts, test examples and capture retain78127ec. The
historical starter TAS remains Thoriumdbee66a with SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.
I inspected that external source's MAIN and DRV paths separately.

No build, test, fixture import, capture, emulator or example was executed.
The shell operations were file reads, text scans, git-object inspection and
writing the two owned Markdown files. No measurement is newly qualified.
There is no runtime allocation or font/default implementation claim. The
planned40-column TECCompact opening stays outside this unit and GLCD/startup
policy is preserved.

## Source findings incorporated into the draft

- Existing-registry counting changed substantively. Current SVCNT at
  `src/loader.asm:466-482` decrements a bounded counter and enters SVCRF on
  exhaustion. The old claim that a corrupted cycle necessarily hangs the
  next installation is not carried as current behaviour. FIND/LIST's bounded
  client walks and their historical cycle example remain.
- The public FIND bound is8 bytes, but REGFIND's three saved pairs alone use6.
  Its internal caller adds a return word. The draft distinguishes that frame
  from the public dispatch frame rather than counting a return word twice.
- A callback warm boot restores PZTOP and clears SVCBSY but does not undo
  arbitrary BIOS hooks or devices. The historical dangling-hook example is
  retained and hooks-last remains an operational instruction.
- Outcome2 has two paths: a BIOS target hit clears flags while REMOVE failure
  retains flags. Both commit pages without linking proposed records. SERVICES
  lists owners independently of registry publication.
- The PC ROM-address gate is a hexadecimal text match. Decimal and binary
  spellings are not caught, so no complete interface-safety proof is asserted.
- Relocation comparison is modulo256. The gap stream's255 escape, exact-multiple
  zero terminator and header/image bound are separate from the PC helper's
  prohibition on header fixups.
- PZSWP preserves only a JP strictly above PZTOP. The default EI/RETI at0038h
  is conditional on no qualifying JP, not installed over a retained jump.
- Function47 acceptance from INIT/REMOVE is distinct from execution after a
  successful warm flush. Chapter12 is linked for the failed-flush cancellation.
- Reset empties loaded owners but may register the ROM PICO tail again. The
  historical empty-both-heads result is explicitly the serial-board case.

## Mechanism proof ledger

All TEC-OS ranges here are at ea3ef3d unless explicitly prefixed78127ec.
The paths were read through the relevant branches and supporting calls.

| Subject | Source and checked consequence |
| --- | --- |
| Entry, saved state and pages | `src/loader.asm:32-101`, `:225-243`, `:412-441`, `src/boot.asm:412-434`, `:794-800`: page-zero entry, exact stub recovery, owner-derived bounds and temporary ceiling distinct from committed PZTOP. |
| PC packing and relocation | `tools/lib/prl.mjs:33-47`, `tools/lib/svc.mjs:18-26`, `:37-48`, `:67-75`, `:83-133`: exact origin-line match, two assembly lengths, modulo high-byte difference, header rejection, dependency/gap packing and owned header writes. Nothing was imported. |
| Native TAS boundary | Thoriumdbee66a `src/tas/MAIN.ASM:13-14` and `EQUS.ASM:4` read0006h for SP. `DRV.ASM:1-76`, `:92-120`, `:144-165` record native marks and set REMOVE, INIT, dependency count and image length. TAS's mechanism is not described as executing makeSvc. |
| Read and source of status | `src/cpm/ccp.asm:445-467`, `:465-485`, `src/loader.asm:925-958`, `src/ram.asm:390-410`: record-rounded LOADTOP, direct SVC load, quiet-startup condition and SVCRC/SVCRA distinction. Typed successful GLCD loading leaves active PICO selected. |
| Stage1 | `src/loader.asm:189-243`, `:741-771`, `src/abi.inc:190`: busy rejection, format4, complete loaded extents, INIT/REMOVE inside image, extra-size arithmetic and8000h minimum base. |
| Stages2/3 | `src/loader.asm:244-322`:9-byte dependencies checked before REGFIND, next pointer retained through EX(SP),HL, relocation extent and three subtract-with-borrow allowance checks. Only the file/scratch are changed. |
| Stage4 | `src/loader.asm:324-373`:0118h initial cursor, gap addition, header/image bound even for255, page-byte patch and partial mutation on rejection. |
| Stage5 | `src/loader.asm:382-441`: each claimed RST first byte checked for C3h, old heads saved in3 bytes, JP BENTRY written, header/image moved and0006h lowered without PZTOP. |
| Stage6 | `src/loader.asm:445-455`, `:673-684`, `src/boot.asm:194-200`, `:217-294`, `:412-509`: callback address, busy guard, provisional-ceiling recovery, vectors swept and reset recognition without equality to PZTOP. `src/cpm/bdos.asm:95-108`, `src/cache.asm:661-668` qualify function47. |
| Stage7 | `src/loader.asm:456-518`, `:589-632`, `:693-734`: bounded existing count, record start/end/table-page checks, proposed-chain counter, link publication, owner update, PZTOP commit and carry derived from SVCRC. Limits255 per service and256 total include the ROM tail. |
| Rollback | `src/loader.asm:520-587`, `:640-662`: record failure clears SVCRA and calls REMOVE, INIT failure skips REMOVE, BIOS target scan, flags clearing only on hook-hit path, claimed slots freed on clean rollback and outcome2 committed without records. |
| Registry | `src/loader.asm:780-880`, `src/abi.inc:149-161`, `src/pico.asm:64-86`: name/version lookup, table versus record results, generation, index/loop limits, nested saves and permanent ROM tail. |
| Removal and lifetime | `src/loader.asm:128-174`, `:77-101`, `src/ram.asm:382-410`, `src/boot.asm:73-94`, `:530-542`: busy/top/flag checks, REMOVE carry,3-byte rollback of heads, generation increment, top reconstruction, warm preservation and cold rebuilding. |
| Trust and allowances | `src/boot.asm:454-509`, `src/loader.asm:382-408`, `:640-662`, `src/tables.asm:143-146`, `drivers/glcd.asm:30-37`: strict vector bound, claim versus actual jump, conditional default interrupt stub,8/12/6 limits and GLCD2/0/6 declarations. |

## Historical evidence and preservation

The original has one text-output fence and one capture recipe. Both remain
verbatim beside the historical PICO startup/GLCD case. The address map and
resident-header table are also copied exactly. The failure-outcome table is
rewritten with carry context, preserving all three failure outcomes. There
are no native figures, image assets or executable listing fences in old24.
No figure has been regenerated or silently repinned.

Historical numerical examples retained locally include TAS's010Dh entry use,
the B9A7h/B9A4h stub layout,164-byte gap and420-byte first-page cost, the
GLCD three-page map, COUNT100-byte/B8h placement and06h/0Ah/04h stack remainder,
the GLCD00F0h→B6F0h relocation atB619h and765-byte image,47,268→46,336-byte
TPA,128+127 records beside PICO and the understated2-versus6 stack example.
These are the original's recorded examples, not newly measured current figures.

The historical test references remain explicitly78127ec. Their source text
was inspected for the asserted boundary: simultaneous owners/stack-from-ceiling
and two-jump BDOS path, total registry capacity, rollback and stale pointers,
lookup precedence, no public removal and own-record invisibility, callback
warm boots/function47, reset vectors and declared-versus-used stack. They are
retained test material, not a claim that those tests were run during this pass.

## Movement-unit dispositions

All68 units below are assigned from old24 at book base10821b6. There are no
cross-chapter assigned units. Heading/front-matter units become the new route.
Each prose unit retains its independent facts except for explicitly corrected
current semantics above. Every original fence, map and recipe has a local home.

| Old range | Kind | Draft home |
| --- | --- | --- |
| 1-6 | front matter | Opening and split source/history header. |
| 8-8 | heading | Opening and split source/history header. |
| 10-12 | provenance or capture recipe | Opening and split source/history header. |
| 14-16 | provenance or capture recipe | Opening and split source/history header. |
| 18-25 | paragraph | Opening and split source/history header. |
| 27-27 | heading | The resident entry and its pages. |
| 29-36 | paragraph | The resident entry and its pages. |
| 38-46 | paragraph | The resident entry and its pages. |
| 48-54 | paragraph | The resident entry and its pages. |
| 56-62 | paragraph | The resident entry and its pages. |
| 64-71 | table | The resident entry and its pages. |
| 73-75 | paragraph | The resident entry and its pages. |
| 77-87 | table | The resident entry and its pages. |
| 89-92 | paragraph | The resident entry and its pages. |
| 94-94 | heading | Page relocation. |
| 96-101 | paragraph | Page relocation. |
| 103-112 | paragraph | Page relocation. |
| 114-124 | paragraph | Page relocation. |
| 126-133 | paragraph | Page relocation. |
| 135-135 | heading | Installation before commit and the seven numbered stages. |
| 137-147 | paragraph | Installation before commit and the seven numbered stages. |
| 149-152 | paragraph | Installation before commit and the seven numbered stages. |
| 154-154 | heading | Installation before commit and the seven numbered stages. |
| 156-164 | paragraph | Installation before commit and the seven numbered stages. |
| 166-172 | paragraph | Installation before commit and the seven numbered stages. |
| 174-174 | heading | Installation before commit and the seven numbered stages. |
| 176-181 | paragraph | Installation before commit and the seven numbered stages. |
| 183-183 | heading | Installation before commit and the seven numbered stages. |
| 185-194 | paragraph | Installation before commit and the seven numbered stages. |
| 196-196 | heading | Installation before commit and the seven numbered stages. |
| 198-201 | paragraph | Installation before commit and the seven numbered stages. |
| 203-208 | list | Installation before commit and the seven numbered stages. |
| 210-212 | paragraph | Installation before commit and the seven numbered stages. |
| 214-222 | paragraph | Installation before commit and the seven numbered stages. |
| 224-228 | paragraph | Installation before commit and the seven numbered stages. |
| 230-230 | provenance or capture recipe | Installation before commit and the seven numbered stages. |
| 231-234 | example source or output | Installation before commit and the seven numbered stages. |
| 236-236 | heading | Installation before commit and the seven numbered stages. |
| 238-241 | paragraph | Installation before commit and the seven numbered stages. |
| 243-250 | paragraph | Installation before commit and the seven numbered stages. |
| 252-252 | heading | Installation before commit and the seven numbered stages. |
| 254-257 | paragraph | Installation before commit and the seven numbered stages. |
| 259-269 | paragraph | Installation before commit and the seven numbered stages. |
| 271-271 | heading | Installation before commit and the seven numbered stages. |
| 273-279 | paragraph | Installation before commit and the seven numbered stages. |
| 281-289 | paragraph | Installation before commit and the seven numbered stages. |
| 291-298 | paragraph | Installation before commit and the seven numbered stages. |
| 300-300 | heading | Rollback and retained pages. |
| 302-304 | paragraph | Rollback and retained pages. |
| 306-310 | table | Rollback and retained pages. |
| 312-318 | paragraph | Rollback and retained pages. |
| 320-332 | paragraph | Rollback and retained pages. |
| 334-336 | paragraph | Rollback and retained pages. |
| 338-338 | heading | Registry lookup and lifetime / Removing the newest owner. |
| 340-344 | paragraph | Registry lookup and lifetime / Removing the newest owner. |
| 346-355 | paragraph | Registry lookup and lifetime / Removing the newest owner. |
| 357-369 | paragraph | Registry lookup and lifetime / Removing the newest owner. |
| 371-374 | paragraph | Registry lookup and lifetime / Removing the newest owner. |
| 376-380 | paragraph | Registry lookup and lifetime / Removing the newest owner. |
| 382-394 | paragraph | Registry lookup and lifetime / Removing the newest owner. |
| 396-403 | paragraph | Registry lookup and lifetime / Removing the newest owner. |
| 405-408 | paragraph | Registry lookup and lifetime / Removing the newest owner. |
| 410-410 | heading | Checks and service responsibilities. |
| 412-413 | paragraph | Checks and service responsibilities. |
| 415-422 | paragraph | Checks and service responsibilities. |
| 424-437 | paragraph | Checks and service responsibilities. |
| 439-451 | paragraph | Checks and service responsibilities. |
| 453-456 | paragraph | Checks and service responsibilities. |

## Own craft passes

1. Full reading and a generous draft preceded sentence editing. The route
   starts with the double use of0006h, then relocation and the seven loader
   stages. Failure outcomes follow their triggers before registry lifetime
   and removal. Checks versus trust ends on the understated-stack example.
2. The thematic pass kept the resident map and header locally, linked H for
   exhaustive bytes and13 for authoring and dependencies. It retained every
   stage's branch conditions and side effects rather than only its label.
3. The sentence deletion pass read every sentence in order and across each
   paragraph boundary. Deleted an editorial sentence certifying preservation
   of startup policy, a development-history comparison of old/current count
   loops and a final policy-certification sentence. Their operational facts
   remain in source-backed explanations. Bounds and failure qualifications stay.
4. The agency pass uses reads, checks, writes, copies, reports and returns for
   the loader. Ownership means its explicit page/header relation. Callback
   responsibilities name required cleanup rather than intentions or trust in
   a program's judgement. No human or production-tool attribution was added.
5. The punctuation pass inspected every editable comma, including tables.
   Conditional clauses and real lists remain. Literal semicolons in the copied
   historical address map are preserved. No Oxford comma or prose em dash
   was introduced. Short result statements carry bounds or an actual exit.
6. Technical rereading checked both callback warm-boot paths, pre/post-move
   outcomes, bounded count walks, publication timing, saved-head restoration,
   generation wrap and strict page-zero sweep. Historical figures were not
   re-derived from the new pin. Source checks do not qualify runtime results.
7. The journey read-back covered the full draft and every table row. The
   provisional ceiling precedes the warm-boot exception, publication precedes
   client lifetime and reverse owner order precedes dependency protection.
8. Manual pattern scans supplement those readings. No prose-gate, complexity
   script or executable verification was run under the no-execution instruction.
   No numerical readability score or independent review is claimed.

## Remaining acceptance

Final static comparison matched the original output fence and capture recipe
exactly, plus both copied tables. All87 distinct TEC-OS citation ranges are
within their named pin's physical file bounds. The two external TAS ranges
were checked separately at Thoriumdbee66a. Bounds supplement the semantic
reads above and do not qualify execution.

Independent factual/editorial review and final reader-order integration remain
pending. Runtime qualification, final source/media pin and new capture allocation
are separate. Relative chapter paths use the revision ledger, with final anchors
subject to integration. No outline, ledger, format reference, published chapter,
source, font or default policy was changed. The commit must use --only with the
two exact owned paths and be pushed to origin tec-os-reader-rewrite.

## Independent review: historical GLCD provenance

Accepted the provenance finding. The765-byte image and00F0h/014Bh/0150h
table are explicitly recorded at58d4345 in book41:154–161. Book42:159–163
records the later767-byte image/dump at621201d. The draft now gives the
765-byte walkthrough its supported58d4345 attribution rather than a blanket
78127ec label. No numbers were silently replaced and no older pin was guessed.
Both image sizes still occupy three pages, so the46336-byte TPA result is
not in conflict on that basis. Current offered bytes are separate evidence
and do not establish a historical run.

Changed TAS writes the same fields to produces the same file format, with
Appendix H's distinct writer responsibilities. The full review otherwise
cleared installation, registry bounds/cycles, rollback/partial retention,
generation, claims, stack bounds and checks-versus-trust. No additional
craft finding. Historical capture provenance still needs the specific audit
requested after this discrepancy. No execution was performed.

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
