# Chapter 14 pass record

## Contract and reading

I am rewriting Chapter 14 to explain what survives exit/reset and locate it
in the map. Prerequisites are caller memory and service lifetime. The outcome
is an explanation from clearing spans, placement and bank visibility rather
than a second program-memory tutorial.

Authority: replacement-outline.md closed at 0e4feea and recorded at 3060e71;
movement-units.json controls transferred units. Source reading uses the offered
TEC-OS ea3ef3de9133931e925a0220d51c0e971c1fd8dd through git show.
Historical addresses and stack measurements remain at 78127ec. No offered
artifact, new capture, runtime test or physical observation is asserted.

Read: complete replacement outline; relevant controlling units; full original
14-memory-map.md and 08-memory.md; original01 through the complete memory
section, including the containing layers passage; complete appendix C including
its tables and reproduction example. Human-writing SKILL.md, revision playbook
and pattern catalogue read alongside the course-writing teaching standard and
its banned-pattern, reader-model and review references. The closed outline's
assembly prerequisites govern this chapter rather than the ZAX beginner model.

## First durable draft

The generous draft is written. Its route is address visibility, clearing spans,
dynamic allocation, page zero, stacks and the bank/stack boundary. No fresh
executable example or output is introduced. Full editorial passes and final
citation coordinate checks are still due at this checkpoint.

## Material accounting

Original ranges below refer to book base10821b6. Every assigned unit has a home.
Headings and navigation are reconstructed, not copied as a parallel route.
The detailed address tables remain in Appendix C with links from this chapter.
No shared ledger or appendix is edited.

| Original unit | Disposition in the draft |
| --- | --- |
| `tec-os/01-introduction.md:19-19` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/01-introduction.md:31-36` (paragraph) | Combined into opening system layers and bank allocation explanation. |
| `tec-os/01-introduction.md:160-163` (paragraph) | Combined into opening system layers and bank allocation explanation. |
| `tec-os/08-memory.md:150-160` (paragraph) | Combined into Allocation vectors below the workspace. |
| `tec-os/14-memory-map.md:1-6` (front matter) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:8-8` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:10-10` (provenance or capture recipe) | Replaced by explicit source-offer scope and separate historical provenance. |
| `tec-os/14-memory-map.md:12-14` (provenance or capture recipe) | Replaced by explicit source-offer scope and separate historical provenance. |
| `tec-os/14-memory-map.md:16-21` (paragraph) | Rewritten as the opening lifetime problem; old roadmap deleted. |
| `tec-os/14-memory-map.md:23-23` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:25-28` (paragraph) | Rewritten in Two banks at the same addresses; no-stack consequence developed at the end. |
| `tec-os/14-memory-map.md:30-36` (paragraph) | Rewritten in Two banks at the same addresses; no-stack consequence developed at the end. |
| `tec-os/14-memory-map.md:38-47` (paragraph) | Rewritten in Two banks at the same addresses; no-stack consequence developed at the end. |
| `tec-os/14-memory-map.md:49-54` (paragraph) | Rewritten in Two banks at the same addresses; no-stack consequence developed at the end. |
| `tec-os/14-memory-map.md:56-56` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:58-61` (paragraph) | Rewritten in Page zero is rebuilt selectively; exhaustive lookup table linked to Appendix C. |
| `tec-os/14-memory-map.md:63-75` (table) | Rewritten in Page zero is rebuilt selectively; exhaustive lookup table linked to Appendix C. |
| `tec-os/14-memory-map.md:77-82` (paragraph) | Rewritten in Page zero is rebuilt selectively; exhaustive lookup table linked to Appendix C. |
| `tec-os/14-memory-map.md:84-90` (paragraph) | Rewritten in Page zero is rebuilt selectively; exhaustive lookup table linked to Appendix C. |
| `tec-os/14-memory-map.md:92-92` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:94-97` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:99-109` (table) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:111-121` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:123-132` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:134-140` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:142-153` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:155-157` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:159-159` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:161-166` (paragraph) | Rewritten in Allocation vectors below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:168-182` (paragraph) | Rewritten in Allocation vectors below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:184-189` (paragraph) | Rewritten in Allocation vectors below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:191-195` (paragraph) | Rewritten in Allocation vectors below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:197-202` (paragraph) | Rewritten in Allocation vectors below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:204-204` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:206-206` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:208-213` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:215-217` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:219-229` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:231-240` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:242-247` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:249-260` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:262-265` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:267-271` (table) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:273-278` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:280-280` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:282-285` (paragraph) | Rewritten in EXPAND 1 and the stack boundary; full partition retained in prose and lookup linked to C. |
| `tec-os/14-memory-map.md:287-293` (table) | Rewritten in EXPAND 1 and the stack boundary; full partition retained in prose and lookup linked to C. |
| `tec-os/14-memory-map.md:295-300` (paragraph) | Rewritten in EXPAND 1 and the stack boundary; full partition retained in prose and lookup linked to C. |
| `tec-os/14-memory-map.md:302-310` (paragraph) | Rewritten in EXPAND 1 and the stack boundary; full partition retained in prose and lookup linked to C. |

No technical unit is deleted. Repeated descriptions of the program limit and
allocation policy are combined. The old exact workspace/address lookup tables
are not duplicated: Appendix C retains all entries, sizes and reproduction.
The historical stack census values are retained in prose here. TOP/AREA code,
recipes and captures from old08 stay with their assigned chapter10/28 homes;
none is transferred into14 or silently discarded by this draft.


## Completed authorial passes

### Thematic and prerequisite read

Read the entire generous draft in order. The progression follows a real
visibility constraint before giving latch operations, then distinguishes
clearing from later writes before using retained command state. Allocation
policy follows the fixed workspace so the downward subtraction has a known
origin. Page-zero reconstruction follows the definition of STUBAD/PZTOP.
Stack allocation precedes the final bank-switch consequence. DPH and DSM are
defined where used. The reader's call/stack and resident-lifetime prerequisites
come from the closed outline, not an assumed new assembly tutorial.

The full partition remains: fixed RAM/window/ROM, latch bits and shadow,
page-zero entry points and load-drive byte, both workspace spans, vectors,
service pages, all four stacks and EXPAND 1. Repeated exact tables have a
lookup home in Appendix C. The historical 1,049-byte lower workspace,
329-byte warm sweep and 205-byte upper span remain as labelled examples.

### Sentence deletion and paragraph repair

Read every sentence in context and across paragraph boundaries. Deleted the
opening of the page-zero section that merely repeated the previous section's
explanation. Deleted the generic announcements about familiar behaviours and
memory population. Deleted the generalisation that a reservation is larger
than its measured depth and retained the actual historical values instead.
Combined the short write-only-latch definition with its storage consequence.
Kept the short reset sentence because it introduces the second lifetime
against which the rest of the chapter is explained. Kept the empty-cache-key
and history-address sentences because each contributes an exact lookup fact.
Combined the historical WSBASE sentence with the worked placement example.

The final bank section retains the consequence for the inherited return word.
It is not a duplicate of the earlier visibility explanation: the stacks have
now been located and the CALL/RET failure is mechanically explained.

### Agency and plainness

Read every paragraph for agency and performed explanation. Source routines
read, write, clear and compare. Replaced the generic phrase about warm boot
using retained values with the actual availability during reconstruction.
No memory, routine, chapter or table is assigned intention or perception.
The first prose gate reported HW008 on the noun phrase 'source offer'.
Reworded that sentence to state the historical build provenance directly.
Later gates report no findings.

### Every-comma and punctuation pass

Read every comma in the chapter, including captions/table cells, with the
optional punctuation removed temporarily. Removed compound-clause commas
before so/but in the cache-storage, BIOS-hook, workspace and caller-stack
sentences. Removed the parenthetic 'for example' at BF00h. Removed the
unneeded comma before the preserved-jump condition. Retained commas that
separate genuine lists, numeric thousands, an appositional address/name or a
condition whose extent would otherwise be unclear. No Oxford commas,
semicolons or em dashes occur in reader-facing prose.

### Technical and literal recheck

Read the offered routines and their callers with git show, not the working
product checkout. Corrected citation coordinates for LOGIN/ALLOCBLK,
PREPPAGE, VSLOT and both SD block loops. Expanded the cache-copy range to
include latch restoration and conditional EI. Corrected the generous draft's
end coordinate beyond the file's last line. All final citations include their
revision. The long revision is stated in the provenance comment.

The old chapter claimed warm boot made the first write read its block.
The draft preserves the actual rule: BUFOK cannot reuse the old key, but a
new allocation still skips the read. The old byte-table explanation is replaced
by the code's two clearing spans and explicit later writes. Reset is qualified
by retained-selection reconstruction. Restart preservation is strictly above
PZTOP and the default EI/RETI is conditional on no qualifying JP remaining.
Failed warm flushing drops failed lines and clears CHPOS. Maskable interrupts
are named explicitly in the bank-access rule because DI does not block NMI.
The guard detects a changed byte but does not identify its writer.

The initial draft incorrectly replaced the historical measured BDOS30 and
base-plus-limit38 with32 and40 from stale78127ec:docs/services.md:215-229.
The confirmed correction restores30 and38. The historical review at
editorial/reviews/book-46.md records the78127ec census as30/18/18 for
BDOS/BIOS/CCP and the sums38/30/24 against reservations54/40/32.
Commit58bd349 explains the reduction from32 to30: ECHORAW ends with a
jump to console output. Commit33af845 corrects the stale service table
and sum. The offered ea3ef3d:docs/services.md:215-229 contains30 and38.
This correction uses recorded historical measurements and source history.
No measurement was repeated. The offered report's measured071d6d7 result
remains separate evidence and is not relabelled as an ea3ef3d measurement.
No old capture is transplanted or assigned the offered revision.

### Journey read-back

Read the revised chapter from the opening exit/reset contrast through the final
bank-hidden return word. Removed an ambiguous 'its bottom' at the start of
page zero. Restored the several-volume container fact from old01 and the
20-by-4 LCD dimension. The end stops at the consequence for a program call,
without a chapter forecast or recap. The prose has no invented terminal output
or executable example. Historical arithmetic is checked against the original
address bounds and original product stack account.

## Source proof at the offered revision

Each row is a semantic check of the claim and its callers, not acceptance from
matching text. Exact citations in the draft identify the smaller supporting
ranges. All source below is ea3ef3de9133931e925a0220d51c0e971c1fd8dd unless
explicitly marked historical.

| Claim group | Proof and boundary |
| --- | --- |
| System layers and storage | src/rom.asm:17-44 includes BIOS, console, SD, CCP, BDOS, services, cache/history and loader as ROM code. src/ram.asm reserves their changing state. src/layout.asm:104-115 gives console modes. src/abi.inc:64-88 gives digits, LCD rows/width and tone. format/format.json:20-25 bounds the descriptor table. |
| Visibility and latch | src/layout.asm:3-9,26-45,81-90 defines regions, latch bits and shadow. src/reset.asm:1-14 describes the overlay. COLD at src/boot.asm:49-70 removes it. CLOOK at src/cache.asm:47-116 restores LATCHV on hit and miss; KBCAPS at src/keyboard.asm:135-142 updates bit7 in shadow and port. |
| Cleared versus retained | COLD:src/boot.asm:73-80 clears WSSPAN. CPMINIT:530-559 clears CCPCLR..BDOSRME, restores DMA/maximum/guard and clears BUFOK. src/ram.asm:153-231 locates retained buffers before CCPCLR and the working spans after it. WBOOTR:178-215 supplies the later state mutations. |
| Pending writes and chain | src/cache.asm:307-351 visits dirty lines and CDROP on CFLALL failure; CWBOOT:661-668 keeps success separate from CHPOS clear and Write lost. src/bios.asm:368-426 still sends type2 directly to the no-pre-read rule. |
| Workspace and interfaces | src/layout.asm:134-135 fixes RAMBIOS and17 jumps. src/boot.asm:144-152 copies them only at cold boot. tools/build.mjs:236-266 derives WSBASE from BDOSRME and checks both boundaries. src/ram.asm:314-319 fixes upper-state origin. HWSINFO:src/services.asm:95-105 reads VWID/VHGT as a word. |
| Allocation | src/boot.asm:695-800 implements drive-count versus per-mounted geometry slots, DRVSLOT and the three-byte stub. src/volsvc.asm:295-315 enforces slot capacity. format/format.json:47-59 supplies DSM. LOGIN at src/cpm/bdoslog.asm:202-350 binds/builds/scans; ALLOCBLK at src/cpm/bdosrec.asm:683-774 scans RAM bits. |
| Stub and service top | src/boot.asm:142-143 and412-434 publishes PZTOP/stub. src/loader.asm:421-441 writes JP BENTRY and0006h during relocation;608-614 commits the installed page as PZTOP. tools/build.mjs:222-231 and269-270 derives/checks minimum program space without claiming a new build result. |
| Page zero | PZINIT:src/boot.asm:412-434 changes jumps and stub, preserving0003/0004. PZSWP:454-509 keeps only a qualifying JP and conditionally writes0038. PREPPAGE:src/cpm/ccpcmd.asm:447-497 publishes both FCBs then tail and DMA. CMDRUN:src/cpm/ccp.asm:519-536 publishes0050 and inherited return word. |
| Stacks and guard | src/layout.asm:122,137-155 declares boot top and resident sizes. src/ram.asm:143-151,219-231,309-312 locates stacks/guard. src/boot.asm:49-88,104-121,178-199,547-555 gives stack transitions and guard fill. BENTRY/RETWORD:src/cpm/bdos.asm:137-142,245-252 saves/restores caller SP. |
| Declarations versus measurements | src/tables.asm:143-146 declares limits. src/loader.asm:281-317 subtracts each declaration from remaining limits. test/stacks.test.mjs:43-78 watches writes/guard;212-264 enumerates workloads and asserts quarter headroom. No assertion was executed. Historical30/18/18 is recorded in editorial/reviews/book-46.md. The stale78127ec document has32; commits58bd349 and33af845 explain the code change and later documentation correction. Offered docs/services.md:215-229 gives30/18/18 and38/30/24. |
| NMI scope | test/stacks.test.mjs:1-11,59-69 only injects when0066 holds RETN. This cannot qualify an arbitrary keypad NMI into a populated FCB. The disabled-jumper requirement is retained from the assigned caller-memory passage. |
| EXPAND1 | src/layout.asm:50-58 defines30 lines and both tables; src/history.asm:1-24 fixes the ring. MEMINIT:src/boot.asm:321-346 clears the whole bank and empty keys. CLOOK, DETECT:348-401 and SDRBLK/SDWBLK:src/sd.asm:525-644,653-724 use no stack while the other bank is visible. |
| Copy and interrupt restoration | HACC:src/history.asm:35-74 saves flags before bank selection and pops after restoration. CDI/CEI:src/bios.asm:445-478 saves/restores interrupt state. MVCOPY:src/cache.asm:695-858 splits fixed-RAM LDIR from bank-window byte copies and restores latch before saved registers. |

## Limits and handoff

Authorial passes complete. Independent editorial/factual result review remains
for the coordinating review. No root chapter, appendix or shared ledger was
edited. No build, import of product code, emulator, test suite, workflow or
publication ran. Only prose gate/complexity scripts and static source/link/range
checks were used. Qualified artifact addresses, new measurements and browser
or board verification remain outside this draft's evidence.


## Final static checks

The final prose gate reports zero findings. The complexity report gives190
sentences, mean12.9 words,0.59 joints per sentence,4% flagged and approximate
grade6.4. The seven retained short-sentence flags are: provenance comment,
reset clearing contrast, several-volume container fact, DS reservation,
historical source-account attribution, empty-line key and history-ring address.
Each supplies a fact or its provenance. None is an empty landing. The flagged
historical byte/bytes echo was removed by describing the four-slot result
without repeating the unit name.

All final citation occurrences were checked against their named Git object
for file existence and exact valid line coordinates. Every Appendix C link
resolves to an existing file and heading from this draft directory. The final
reader-order read now retains the measured30-byte historical BDOS result and38-byte base-plus-limit sum.
No invented fences or outputs are present. No root-file edit is needed to
review these two drafts.

## Confirmed result-review corrections

Restored the historical measured BDOS base/census30 and base-plus-limit38.
Read both commit messages and diffs for58bd349 and33af845, the stale
78127ec service table, the corrected offered table and the recorded historical
census in book-46. The earlier32/40 disposition above has been replaced.
The offered report measured071d6d7 remains separately attributed.
Changed the allocation heading and its movement-account references to the
noun phrase “Allocation vectors below the workspace”. Read the affected
paragraphs for continuity, agency and every comma. Only these two owned
paths were changed. No product execution, build, test or import was performed.

## Reader-facing provenance repair

Removed the correction chronology for stale78127ec:docs/services.md and
commits58bd349/33af845 from the chapter's teaching prose. Removed its link
to the excluded editorial/reviews/book-46.md. The source-proof and correction
sections above retain that complete evidence. The chapter keeps the historical
78127ec host-model base/census30/18/18, bounds38/30/24 against54/40/32,
quarter-free margin and Appendix C stack link. Its short scope statement
explicitly separates those measurements from the offered build. Read the
revised stack paragraphs in order and checked their punctuation. No execution.

## Bounded review closure

The full independent review found the stale historical table substitution
and a heading issue. Both were corrected. A separate confirmation at6174022
accepted restoration of the measured30/38 figures and separation of the
correction history into this record. Reader prose no longer links an excluded
editorial review as navigation. No bounded factual or editorial finding
remains. Historical maps/measurements still retain their actual pins and
final navigation and qualification remain pending.
