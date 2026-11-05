# Chapter 19: A file through the BDOS

## Brief and authority

The chapter explains the make/write/close/open/read lifecycle to someone who
has used the Chapter 9 file calls and read Chapters 14, 17 and 18. Its central
example is the inherited record-37 mapping calculation. No new program or
runtime demonstration has been introduced. Console processing remains in
Chapters 8 and 16. The full compatibility list remains assigned to Appendix A.

Read all 530 lines of the original `tec-os/19-bdos.md`, including the console
material and compatibility list that have other destinations. Read the closed
replacement outline in full and every movement record for the old chapter.
The frozen source is `10821b68f80c10d2037bbd1c5ab207877c897c68`; the current old
chapter has no difference from that base. All 59 units assigned to 19 come
from that chapter. No fragment override assigns additional material to 19.
The mapping below accounts for each assigned unit, including navigation and
provenance comments that are replaced rather than retained as current claims.

Mechanisms use source inspected at TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. No product code or retained harness
was executed or imported. No assembly, build, test, workflow or new capture
was performed. Static text/Git inspection does not qualify a runtime example.
No KS48 source, font/default or measurement acceptance is inferred.

## Teaching order and preservation

The opening starts with the difference between an FCB changing in RAM and its
directory entry being written at close. The call/drive contract and the file's
fields establish the vocabulary for make. The inherited record arithmetic now
sits within writing, after allocation is explained. Close and open/read follow
as distinct operations. Allocation/login and the flagged warm rebuild explain
which state survives the file operation. The code/state inventory is retained
after that mechanism rather than delaying the lifecycle at the opening.
Errors and the compatibility boundary finish on the consequence of CKS=0.

The full 36-byte FCB table, both complete DPB columns, all six search modes,
the three-word DPH table and the four error messages/codes remain. The record
37 / block 300 example preserves 4,805, track 75/sector 5, card block 1,201
and slot 1. It is arithmetic checked against FCBADDR/POSREC/MAPREC, not an
execution claim. No assigned literal fence exists for this destination.
The original console capture and recipe at 168–179 belong to 16; its TYPE X
output is present in `draft/16-console-paths.md`. Nothing was edited there.
The original complete compatibility list at 508–530 belongs to A. Chapter 19
retains the relevant file boundary and links the full reference, without
claiming that Appendix A's independent review is complete.

| Frozen old chapter lines | Unit kind | Draft home/disposition |
| --- | --- | --- |
| 1–6 | front matter | New title/navigation and explicit source-only/historical-map scope |
| 8–8 | heading | New title/navigation and explicit source-only/historical-map scope |
| 10–10 | provenance or capture recipe | New title/navigation and explicit source-only/historical-map scope |
| 12–14 | provenance or capture recipe | New title/navigation and explicit source-only/historical-map scope |
| 16–23 | paragraph | Opening, call contract and reference links |
| 25–25 | heading | Code and writable state |
| 27–30 | paragraph | Code and writable state |
| 32–39 | table | Code and writable state |
| 41–44 | paragraph | Code and writable state |
| 46–56 | paragraph | Code and writable state |
| 58–64 | paragraph | Code and writable state |
| 66–66 | heading | The call and its drive |
| 68–71 | paragraph | The call and its drive |
| 73–80 | paragraph | The call and its drive |
| 82–84 | paragraph | The call and its drive |
| 86–93 | paragraph | The call and its drive |
| 95–102 | paragraph | The call and its drive |
| 104–109 | paragraph | The call and its drive |
| 193–193 | heading | The file in memory and on disk |
| 195–202 | paragraph | The file in memory and on disk |
| 204–215 | table | The file in memory and on disk |
| 217–223 | paragraph | The file in memory and on disk |
| 225–227 | paragraph | The file in memory and on disk |
| 229–239 | table | The file in memory and on disk |
| 241–242 | paragraph | The file in memory and on disk |
| 244–255 | paragraph | Making and writing the file / A record’s card address |
| 257–263 | paragraph | Making and writing the file / A record’s card address |
| 265–268 | paragraph | Making and writing the file / A record’s card address |
| 270–280 | paragraph | The file in memory and on disk / Directory searches |
| 282–289 | table | The file in memory and on disk / Directory searches |
| 291–299 | paragraph | The file in memory and on disk / Directory searches |
| 301–301 | heading | Making and writing the file / The next extent |
| 303–305 | paragraph | Making and writing the file / The next extent |
| 307–315 | paragraph | Making and writing the file / The next extent |
| 317–321 | paragraph | Making and writing the file / The next extent |
| 323–330 | paragraph | Making and writing the file / The next extent |
| 332–340 | paragraph | Making and writing the file / The next extent |
| 342–349 | paragraph | Closing the file |
| 351–356 | paragraph | Opening and reading the file |
| 358–361 | paragraph | Opening and reading the file |
| 363–367 | paragraph | Deletion and the shared entry |
| 369–369 | heading | Free space and drive login / The first selection |
| 371–375 | paragraph | Free space and drive login / The first selection |
| 377–387 | paragraph | Free space and drive login / The first selection |
| 389–404 | paragraph | Free space and drive login / The first selection |
| 406–408 | paragraph | Rebuilding after warm boot / The reset tail |
| 410–414 | table | Rebuilding after warm boot / The reset tail |
| 416–422 | paragraph | Rebuilding after warm boot / The reset tail |
| 424–429 | paragraph | Rebuilding after warm boot / The reset tail |
| 431–434 | paragraph | Rebuilding after warm boot / The reset tail |
| 436–448 | list | Rebuilding after warm boot / The reset tail |
| 450–457 | paragraph | Rebuilding after warm boot / The reset tail |
| 459–467 | paragraph | Rebuilding after warm boot / The reset tail |
| 469–469 | heading | Errors returned or reported |
| 471–472 | paragraph | Errors returned or reported |
| 474–483 | list | Errors returned or reported |
| 485–492 | paragraph | Errors returned or reported |
| 494–500 | paragraph | Errors returned or reported |
| 502–506 | paragraph | Errors returned or reported |

## Source semantics inspected

These are passage/routine reads, not text-match acceptance of inherited
citations. The source was displayed in bounded chunks. Only the paths needed
for these claims were read; this is not a claim of reading every BDOS console
or random-access routine in full.

| Claim group | Source read and support |
| --- | --- |
| Entry, dispatch and result | `src/cpm/bdos.asm:1-285`, `:794-800`; BENTRY saves OLDSP/PARAM, changes stack, handles 44–48/99/108 separately, indexes FNTAB and uses FCBMAP. RETWORD restores SP and puts L/H in A/B. FNVERS returns 22h. `src/tables.asm:82-97` supplies all 41 words and exact map bits. |
| Drives, close, search, make and protection | `src/cpm/bdosfile.asm:1-680` plus rename/mutation through738. SELDRV accepts logical A–P while BIOS BSELDSK limits mounted drives to A–D. FCBSEL admits '?' only for17 and never rewrites the drive byte. CLOSEFCB's clean/read-only exits write nothing. CLOSEDIR copies the map alone for an earlier extent. MAKEFCB only changes its fields after finding a slot, leaves CR/random bytes alone and raises the mark before writing the directory. FNMAKE clears S2 even if make fails. |
| Sequential records and extent transition | `src/cpm/bdosrec.asm:1-310`, `:315-355`, `:510-1033`; WRITESEQ allocates before BIOS WRITE, advances CR/RC only on success and restores extent fields on a full-directory transition. READSEQ closes before NEXTEXT, treats close failure as EOF and tests CR>=RC or block0. FCBADDR/BLOCKIDX choose map cells; ALLOCBLK sets vector/DPH/FCB state immediately. POSREC checks DSM before shifting and DIV16 supplies track/remainder. |
| Search and imported FCB | `src/cpm/bdosfn.asm:400-835`; FINDENT modes3/5 scan the full directory while others stop at DIRUSED. Modes0/5 copy a whole directory record, mode1 imports fields while retaining the requested extent and adjusting RC. MATCHFCB modes3/5 bypass ordinary user/name/extent checks. Ordinary matching masks attributes and EXM and compares S2's six module bits. |
| Default pointers and read-only flag | `src/cpm/bdosfn.asm:1-165`, `:175-205`; 27/31 return saved default-drive pointers, not the most recently bound explicit-drive FCB's pointers. Function28 sets the default drive's bit. Function37 clears all three relevant masks. No current-user/user0/A command fallback is introduced into BDOS open. |
| Login, vector and mark | `src/cpm/bdoslog.asm:1-730`, `:732-755`, `:821-900`; LOGIN binds DPH pointers, reapplies the volume read-only flag, scans a new login and preserves an existing vector on LOGFAST. PARENT marks used entries' blocks; BITPTR skips zero/out-of-range references rather than indexing outside the vector. LOGDONE saves mark/sum, clears dirty/WARMV and starts a new search. |
| Warm rebuild | WRESET in `bdosfile.asm:72-133`, CCP `src/cpm/ccp.asm:75-100`, LOGDONE/DUSAVE/ALVSUM/ALVLEN in `bdoslog.asm:394-496` and `src/volutil.asm:114-136`. Dirty drives use the recorded mark; a changed sum without the dirty flag requires a full scan. SUMDE is an additive sum, not a byte comparison. |
| BIOS/deblocking and persistence | `src/bios.asm:25-96`, `:116-221`, `:241-426`; `src/cache.asm:290-350`, `:455-678`. MAPREC derives BLKSLOT/BLKOFF and adds the volume start. BIOS directory writes raise DPH state for an entire card block. Type2 takes the no-pre-read path and CWRBH clears its line. CWB3 flushes every other dirty cache line before the directory's own line. A failed directory flush preserves failed data lines dirty, with earlier successful writes retained. |
| Mount reset | `src/volsvc.asm:310-402`; VRESET calls37 for the changed drive and VMNTRS calls14 again if that drive is default. |
| Error modes | `src/cpm/bdoscon.asm:1-175`, bdos.asm's FNERRM/CHDROP and bdosfile.asm's ROFCB/ROTEST, bdoslog.asm's CHKRO/SELFAIL. FEh prints then returns, FFh returns silently, default prints/waits/CHDROP. Returned errors use A=L=FFh and B=H=code. READ/WRITE leaves the failed record current. |
| State/provenance/layout | `src/cpm/PROVENANCE.md` full; `src/rom.asm:1-45`; `src/ram.asm:1-20`, `:45-65`, `:205-325`, `:350-400`; `src/layout.asm:120-160`; `src/boot.asm:68-82`, `:400-445`, `:490-540`, `:740-807`; `src/loader.asm:390-434`; `src/vol.asm:765-802`; `src/text.asm:62-83`; `format/format.json:38-62`. These establish include ownership, writable state, stack allocation, page-zero entry, DPH construction, messages and both geometries. |
| Console exception | `src/cpm/bdoscon.asm:155-168`, `src/console.asm:200-235`; CONSTQ calls ROM BCONST while the RAM-table CONST wrapper draws the cursor. Only the exception is retained here. `src/cpm/ccpfile.asm:138-147` independently confirms the system attribute at byte10. |

## Historical map evidence

The frozen chapter's checked-at header was not used as proof of a run.
Book46:78–80 explicitly records the 78127ec D8 labels for BDOS E703h–F608h,
3,846 bytes. The retained rev781 `dist/tecos.d8.json` was inspected as data,
not loaded through a product module. Its SHA-256 is
`3d23054c10f27ab03bdaaf9d5e4dcd73e2953378488e09fb8d2ad712fe606327`.
It contains BDOSBAS=59139 (E703h), SVCDSP=62985 (F609h),
BDOSRAM=48758 (BE76h) and BDOSRME=48896 (BF00h exclusive).
The ROM span is therefore F609h−E703h=3,846 and the RAM range ends BEFFh.
The record identifies the historical build; this data read is not a rerun.
No branded scratch location is recorded and no artifact was copied into this
chapter's two-file scope. Historical source `78127ec:src/ram.asm:142-216`
was read separately to confirm the state/stack labels. The draft explicitly
separates these inherited map values from ea3ef3d mechanism citations.

## Semantic corrections and clarifications

- Modes3 and5 are exceptions to ordinary name/extent matching, not cases that
  require an extent match. The table and prose now agree.
- An empty-volume name search reads nothing only after login. First login
  still scans the directory. The recorded mark can exceed the last used entry
  because BIOS directory writes cover a full card block.
- The read path's failed close at an extent boundary returns1, as do CR>=RC,
  a missing next extent and a zero map cell. This is not labelled successful
  positive completion of an example.
- A close can record a newly allocated block after a returned data-write
  error, but close can fail too. Removed the inherited unconditional recovery
  implication. Abandoning the FCB leaves the later rebuild to use the directory.
- The directory-write flush covers all other dirty cache lines, not only the
  current drive's lines. No atomic rollback of earlier successful writes is
  implied.
- Make/open results are slots0–3 orFFh, not a zero-only success contract.
  Close also returns0 without searching when clean or read-only.
- Equal additive vector sums do not establish vector equality. The dirty flag,
  scan limit and sum-mismatch branches remain explicit.

## Actual craft passes and limits

Drafting and reduction were separate. The generous draft retained every assigned
fact before moving the inventory and record calculation to their teaching homes.
The thematic pass kept make/write/close/open/read in order. The sentence-deletion
pass removed repeated roadmap and stack-switch statements and retained the
connections needed for the maps and warm rebuild. No original assigned table
row, boundary, error code or numerical example was deleted.

Read the entire draft in order for each sentence's job, then for agency and
punctuation, including every authorial comma. Table semicolons became full
stops. There are no authorial semicolons or em dashes. Explicit pattern searches
covered mind/volition verbs, inflated significance, hollow transitions, staged
headings and reader commands. Names such as OPENHIT and LOGFAST describe source
mechanisms, not mental agency. The final read-back checked prerequisites,
paragraph connections and the substantive card-change consequence at the end.

Static text/Git checking found 139 citation occurrences across 24
revision/file pairs, all within their source bounds. This supplements the
semantic reads rather than establishing them.
No runtime or prose-test script was invoked. Independent editorial/factual
review, final chapter placement/anchors and whole-book acceptance remain
pending. The full compatibility reference's separate authoring/review is not
closed here. Only this draft and this pass record are owned for the commit.

## Bounded prose-spacing correction

Accepted the lead's spacing finding. Removed eight inherited triple-space
artifacts in the WRESET bullets and Select-error item and reflowed prose
list items. Word sequence, inline literals and all table lines were compared
before and after and are unchanged. No factual rewrite, product execution,
import, build or test occurred. Full independent Chapter19 review remains
pending. Only the Chapter19 draft and this record were changed.

## Full independent review corrections

Accepted four findings from the complete independent59-unit review. The
SYS-visibility citation now names ccpfile rather than ccpcmd. DIRUSED is
a retained upper bound, including a whole containing card block after a BIOS
directory write, not necessarily the exact last-live-entry count. Functions
27/31 return the new default volume's allocation-vector/DPB pointers. An
ordinary retained message-output key satisfies the error wait, with console
controls separately qualified. The lead read the owning instructions in
ccpfile138–147, bdosfn58–64/178–189, bdoslog362–385/420–439 and bdoscon's
GETCHAR/CHKKEY paths before correction.

Reread the changed passages and neighbours for agency, every comma and
continuity. Removed the two optional conjunction commas that added no clarity.
The earlier complete reader/source pass and historical artifact boundary
remain distinct. All assigned tables and numerical examples remain. Bounded
independent correction confirmation is pending. No execution occurred.

## Bounded draft-navigation correction

The independent navigation audit read all297 reference-containing passages
and found two actionable mismatches. Chapter28 now consistently uses the
authored title The host model as evidence and filename
28-the-host-model-as-evidence.md across the draft index, Chapter27 link,
outline and ledger. Its job and position remain unchanged. The earlier
pass-record naming hold is superseded by this reconciliation.
Chapter19's specific BIOS-hook replacement explanation now points to
Chapter16's The BIOS boundary rather than10's raw-call interface.
The separate10 reference for the writable table remains correct and unchanged.
The lead read all changed containing passages and the destination section.
No root navigation, renderer or product ran. Independent bounded confirmation
and final integrated navigation remain separate. Opening1–3 links remain held.

## Concrete conjunction-comma correction

Removed the optional comma before and in the block/allocation-block versus
512-byte card-block definition. The full containing paragraph reads clearly
without it and retains both units. The matching HW008 flag concerns the
term-definition noun block, not perception by an artifact. The bundled gate
was run on current7/19 and its one review flag is manually retained with
that disposition. Final all-reader punctuation inventory and gate remain
required after the other corrections. No product runtime occurred.
