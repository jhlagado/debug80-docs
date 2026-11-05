# Chapter 9 pass record

## Scope and reading

I own only `draft/09-read-and-write-a-file.md` and this record. The closed
replacement outline and controlling destination9 movement units govern the
chapter. I read the full old03 and old07 chapters before drafting, including
their fixtures, recipes, captures and qualifications. I read every assigned
whole unit and fragment override, the outline, house STYLE and the accepted
source-question dispositions. The full human-writing, course-writing and
teaching-prose-review standards and their supporting references govern the
craft passes.

Source authority is TEC-OS `ea3ef3de9133931e925a0220d51c0e971c1fd8dd`, inspected
through git object text. This is source-only authoring. It establishes neither
a final checked pin nor a current runtime result. No program, fixture, import,
build, test, capture or workflow was executed. The prose scripts inspect text.
No publication is made. The planned40-column TEC Compact opening does not
qualify an implemented font/default or replace historical80-column evidence.

The reader's job is to read and write a file after ordinary programming in8.
Page zero, the tail and the complete parsed FCB precede SHOW. The36-byte table
accounts for every byte; extent position, CR, DMA and ordinary sequential
results, default disk errors and the read-only close/flush distinction are
explained before the listing. Writing follows through make,
write, close and flush. Raw BIOS and private SP remain10. Cache implementation
remains18, random-access reference remains AppendixA and warm-chain internals
remain21. No held banner exercise is substituted for historical HELLO.

## Exact controlling dispositions

Original ranges use the movement map's book base
`10821b68f80c10d2037bbd1c5ab207877c897c68`. Fragment overrides take precedence.
All16 whole units assigned9 are accounted for below.

| Original range | Draft disposition |
| --- | --- |
| `03-command-line.md:421–427` | The name from your command line / Close, flush and errors: preserve tail and argument preparation, returned prompt, selection and console. Qualify warm persistence on successful flush; retain saved-selection override and unavailable-drive fallback. |
| `07-first-program.md:218–221` | The name from your command line: define page zero and the tail before any listing. |
| `07-first-program.md:223–227` | Preserve `SHOW b:hello.asm x`, length14, leading space, uppercase text and zero terminator. |
| `07-first-program.md:229–237` | Preserve005Ch/006Ch defaults,36-byte size, drive codes and padded name/type. Explain overlap and copying the second name before opening the first. |
| `07-first-program.md:239–243` | A file's position in the FCB: preserve007Ch/CR zeroing and clarify that opening does not reset CR. |
| `07-first-program.md:251–251` | Reconstruct the SHOW heading after its prerequisites. |
| `07-first-program.md:253–253` | Introduce SHOW's task using the already explained FCB and DMA. |
| `07-first-program.md:255–293` | Complete ASM fence retained unchanged. No instructions, comments or literals dropped. |
| `07-first-program.md:295–303` | A record buffer / SHOW: preserve open failure, read result,128-byte buffer and whole-record processing. Add0–3 successful-open range and returned-error qualification. |
| `07-first-program.md:305–312` | SHOW: preserve PUT, register saves, text EOF marker and text-import padding. |
| `07-first-program.md:314–316` | SHOW: preserve final JP BDOS and inherited-return explanation after Chapter8's contract. |
| `07-first-program.md:318–320` | Historical card and output: preserve72-byte figure and TAS/ATOM qualification as historical, with full HELLO starter preparation at26. |
| `07-first-program.md:322–326` | Complete three-command shell fence retained unchanged. |
| `07-first-program.md:328–328` | Capture command comment retained unchanged immediately before its output. |
| `07-first-program.md:329–346` | Complete output fence retained unchanged, including the full printed HELLO source, missing-file case, blank lines and final prompt. |
| `07-first-program.md:348–349` | Preserve SHOW with no argument and its blank-FCB missing-file result. |

The three fragment assignments are explicit:

- `07-first-program.md:44–49`, selected48–49: preserve both15/20 rows verbatim
  under a reconstructed table header. Functions2/9 belong8.
- `07-first-program.md:218–249`, selected218–243: retain the complete tail/FCB
  lesson here. The load-drive byte at245–249 belongs10 and is not imported.
- `03-command-line.md:139–145`, selected sentence “a program can set it with
  BDOS function 30.”: preserve the system-attribute operation in the final
  section, with name/type bits and result checking. Surrounding DIR discussion
  remains at its assigned home.

## Literal preservation and provenance

The full SHOW ASM, shell recipe and output fences are copied unchanged from
old07. The original capture command comment and15/20 table rows are unchanged.
The output's HELLO listing remains part of that full output, not an abbreviated
fixture. The recipe's `hello.asm` dependency is the historical HELLO fixture;
Chapter26 retains the full starter-card preparation. No new output or build
size has been inferred from source inspection.

The retained application/capture provenance is TEC-OS78127ec. The historical
host assembler was atom-z80 0.3.7. TAS.COM was Thorium dbee66a, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.
TED.COM was Thorium128edb7, SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`.
The72-byte statement belongs to that historical record. These are provenance
statements, not freshly measured artifacts or a new checked header.

The NOTE.TXT call walkthrough is source-derived explanation without an
executable fixture or output fence. Its two-letter text line plus CR/LF and124
padding bytes explain a128-byte transfer; they are arithmetic, not a captured
result. I chose an absent name because make is not replace. Each call uses
the freshly loaded DE/C contract taught in8. No raw BIOS/private-stack sample
or unclosed-file demonstration has been added.

## Source checks at ea3ef3d

Each path below was read with
`git -C /Users/johnhardy/projects/tec-os show ea3ef3d:PATH`. The proof identifies instructions and their consequences;
comments alone are not runtime evidence. Detailed references stay here under
the PartI house convention.

| Claim | Source proof |
| --- | --- |
| Entry and uppercase arguments | `src/cpm/ccp.asm:19–25,249–267,519–536`: page-zero constants, uppercase conversion and transient entry at0100h. |
| Tail and defaults | `src/cpm/ccpcmd.asm:447–545`: PREPPAGE parses first005Ch and second006Ch, then copies tail to0081h, length to0080h and terminating zero. PARSEFCB writes drive0,11 spaces and24 zero state bytes. The second36-byte parse overlaps the first and tail; it is not an independent reusable FCB. |
| Drive and user | `src/cpm/bdosfile.asm:179–234`: FCBSEL resolves drive0 through DEFDRV and explicit1–16 through selection. Search uses the current user; unmounted/out-of-range implementation drives use the selection-error path. |
| Full FCB and open state | `src/cpm/bdosfn.asm:610–685,785–823`: OPENHIT copies bytes1–31, restores requested EX, adjusts RC and marks S2 unmodified. CR32 is untouched. Extent matching uses EX low bits and S2 module bits. `src/cpm/bdosrec.asm:374–420,584–602` locates random bytes33–35 and current record32. |
| DMA | `src/cpm/bdosfn.asm:33–50`: FNSETDMA saves PARAM in CURDMA and passes that address to BIODMA. PREPPAGE selects0080h. The first FCB ends007Fh, just before that128-byte buffer. |
| Open and sequential read | `src/cpm/bdosfile.asm:236–248,396–407` selects open search mode. `src/cpm/bdosrec.asm:209–298` checks CR against RC, moves extents at128, reads the DMA record and increments CR only on success. Missing record/extent yields1; disk failure goes to BADSECT. |
| SHOW text and return | The unchanged old07 ASM testsFFh by INC A, reloads DE/C, saves HL/BC around output, checks1Ah before printing and ends through RET or JP BDOS. `src/cpm/ccp.asm:527–536` supplies the inherited0000h return word. This is instruction tracing, not a new run. |
| Text import | `tools/tecvol.mjs:155` passes the text option to the volume writer. `tools/lib/cpmfs.mjs:13,181–188` sets EOF1Ah, converts line endings, appends EOF and pads to complete128-byte records. No import was performed. |
| Make and write | `src/cpm/bdosfile.asm:518–664` selects a free directory slot, clears make state and returns0–3/FFh; it does not replace an existing named entry. FNWRITE checks protection and calls WRITESEQ. `src/cpm/bdosrec.asm:8–207` allocates blocks, advances position/count after successful writes and returns1 for directory exhaustion or2 for disk exhaustion. |
| Close | `src/cpm/bdosfile.asm:250–339` skips writes for an unmodified FCB, returns success without writing on a read-only drive and otherwise copies extent state to the directory. The chapter's modified-file explanation is for its writable-file sequence, it does not imply that every close writes. |
| Directory ordering | `src/cache.asm:493–508,596–651`: write-behind data stays dirty; a directory write flushes other dirty lines before its directory line. A failed prerequisite data line stays dirty on this ordering path; the failed directory line is dropped. The draft does not equate that path with CFLALL's drop policy. |
| Error modes and explicit flush | `src/cpm/bdos.asm:261–289`:45 selects silentFFh or printedFEh returned errors, A=FFh/H=cause;48 calls VFLUSH and returns0/FFh. `src/cpm/bdoscon.asm:47–72` prints/default-aborts through CHDROP. Ordinary EOF/full-disk result codes are distinct from these disk-error modes. |
| Attributes | `src/cpm/bdosfile.asm:666–678,704–764` checks drive protection and copies11 name/type bytes, including attributes, to matching directory entries. Function30 is not a way to override volume protection. |
| Flush failures and warm return | `src/cache.asm:307–350,653–668`: CFLALL drops failed lines, CWBOOT prints Write lost and clears CHPOS on failure. `src/boot.asm:178–215,530–542` rebuilds warm state and flushes before CCP entry; it does not close departed FCBs. `src/cpm/ccp.asm:46–102,363–384` restores saved drive/user with A fallback. Console selection remains in CONMOD. |

The successful-warm-flush qualification from source-question-dispositions is
applied explicitly. Function48 failure also drops failed lines; a later flush
cannot reconstruct dropped data. Closing directory state and flushing cached
data are explained separately without claiming that a successful modified
close necessarily leaves data pending. Reset is distinguished from completion
of outstanding file work.

## Actual passes and outstanding work

I completed the full draft, then read every paragraph and sentence in order
with deletion and read-across checks. I removed the speculative parsing setup
and redundant negative buffer warning. The opening gives the reader a name
and a buffer to work with; the FCB lesson connects their use before the table.
The original examples remain complete through their final prompts. A final
prerequisite pass placed default disk-error behaviour and the read-only
close/flush distinction before SHOW; the full writing sequence follows it.

I checked agency throughout: CCP prepares/parses, BDOS transfers/updates and
programs preserve state/check results. I replaced the awkward description of
the volume written behind with its actual write-behind operation. I read every
authorial comma and punctuation join, keeping lists and qualifications while
splitting the default-error sentence. The historical code comments and literal
output were left unchanged. A sentence about writing now says an FCB rather
than implying that writing always needs a second FCB.

The technical pass rechecked the relied source paths at ea3ef3d by git text,
especially full parser clearing, open's untouched CR, sequential error paths,
close's conditional directory write and the two different flush-failure
policies. The journey pass read from the first name through ordinary prompt
return: page zero → tail →36-byte FCB → sequential position → DMA → SHOW →
make/write → close/flush/error consequences. It keeps implementation replay
out of the reader's task. The final selection paragraph preserves the assigned
old03 return facts with their source qualifications.

At37d5f02 the prose gate reported zero findings across both owned files. The
sentence-complexity report then gave160 sentences, mean13.5 words,
0.59 joints per sentence,10% flagged and approximate grade7.0. I read every
flag: the two long hash/provenance statements are in the historical header;
short statements identify specific results or preserved state. Repeated
record/byte/error terms retain exact technical distinctions. The write-result
sentence keeps all three related results together. These diagnostic flags
were reviewed rather than treated as automatic defects.

Static text comparison confirms that all three complete SHOW fences, the
capture command comment and both file-call rows match old07 exactly. All
source-proof ranges are in bounds across the11 cited source files. Diff
whitespace checks are clear. These are text checks, not product tests.
Independent review, runtime acceptance, current example execution and whole-book
navigation remain outstanding. All runtime work remains held. This chapter
claims no new font, default, build, capture or final checked source pin.


## Accepted independent review corrections

The accepted review found three defects in37d5f02. I corrected them in the
owned chapter and re-read the affected paragraphs and their neighbours:

- CR0 rewinds the current extent only. Whole-file rereading after extent
  advancement requires EX/S2/CR0 before reopening. At ea3ef3d,
  src/cpm/bdosfn.asm:621–679 preserves the requested EX on open and leaves
  CR untouched. Its785–823 compares EX and S2 for extent selection. The
  corrected prose distinguishes the current record from the whole position.
- JR Z branches when the zero flag is set. The flag itself does not take
  NOFILE. The historical instructions and comments remain unchanged.
- Removed all authorial semicolons, including the call table cells. The
  earlier punctuation pass missed them. Remaining semicolons are inside
  the unchanged historical ASM/output fences.

Static text comparison with37d5f02 confirms all three complete fences and
the capture comment are unchanged. I checked the revised agency, commas
and reader connections manually. The earlier automated reports above are
historical draft-stage diagnostics, not rerun results for this correction.
No prose script, product execution, import, build or capture was run.
The accepted findings are addressed for confirmation. Runtime and final
whole-book acceptance remain held.

## Independent correction confirmation

The original independent reviewer confirmed the corrected draft at2684a6b:
current-record CR is distinct from the full EX/S2/CR position, JR Z performs
the branch and all authorial semicolons are removed. The unchanged historical
SHOW listing remains separate from a future compact-format assembled version.
The full bounded source/craft review and these three corrections are closed.
Final source, workflow qualification and whole-book integration remain held.
No execution accompanied confirmation.

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

## Complete reader-order review correction

The closing0004h writable-selection aside is removed after the complete
close/flush/write-loss/reset consequences. Its full contract remains in10,
Page zero and the program's arguments, including bits0–3/4–7 and unavailable
drive fallback. Chapter8 already explains ordinary exit selection. I read that
actual destination paragraph before removing the duplicate. No FCB, DMA,
error-return or preservation qualification is deleted.

The complete changed paragraphs and their immediate boundaries were read before
and after editing. Separate sentence-purpose, agency and every-comma passes
retain the operational distinctions. Mandatory prose/complexity checks precede
the correction commit. Existing runtime evidence is moved or quoted with its
actual pin, not rerun. No product import, assembly, build, model, test, capture,
publication or physical observation accompanies this correction.

The mandatory gate has no hard findings. The initial review candidates were
checked in full context. The Chapter 6 URL contains a flagged verb. Four older
provenance phrases contain a noun matching the agency rule. Two older Chapter 8
record phrases were corrected. These are metadata dispositions, not exceptions
for reader prose. Complexity flags retain exact fields, source coordinates and
error-mode conditions. The long function 34 restoration sentence explicitly
names the fields, their extent and the corresponding function 33 result.
Literal fences and capture comments are unchanged in place or moved together
from Chapter 4 to Chapter 6. Combined before/after inventories match exactly.
