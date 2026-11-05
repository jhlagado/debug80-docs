# Independent Appendix A review

Reviewed book4af304f, draft/appendix-a-bdos-functions.md and a-pass-record.md.
Original book10821b68f80c10d2037bbd1c5ab207877c897c68, complete AppendixA
plus old19-bdos.md's assigned compatibility section508–530 and its containing
error/compatibility passage. All67 destinationA units were read, including
all48 numbered summary rows and the three compatibility units.
Current implementation authority is productea3ef3de9133931e925a0220d51c0e971c1fd8dd.
Read-only factual/editorial review. No product execution, import, assembly,
build, test, oracle comparison or capture was performed.

## Required findings

### 1. P2: function10 tests whether the current line is empty, not the first key

Draft173–174 says “`^C` as the line's first key”. Lines179–180 say “A `^C`
after the line's first character is ignored”. These make the condition depend
on input history. The actual condition is the current LINCNT value. Deleting
the last character or clearing the line restores the abort condition.

At ea3ef3d:src/cpm/bdos.asm:606–620, LINABRT loads LINCNT and continues
input only when nonzero. At zero it writes03h to the first data position,
echoes ^C and jumps CHDROP. LINBACK:559–575 decrements the count, LINCTU:
675–694 resets it and LINCLEAR/LINERASE:699–729 removes the current line.
These are static path conclusions, not newly observed input results.

Suggested corrections:
- Replace “`^C` as the line's first key” with “`^C` while the line is empty”.
- Replace “A `^C` after the line's first character is ignored” with
  “`^C` is ignored while the line contains characters. On an empty line it
  ends the program by warm boot and drops the remaining command chain.”
- Qualify “The editing controls themselves are not stored” as “The returned
  line excludes the editing controls.” The nonreturning empty-line ^C path
  explicitly stores03h before aborting, so an unconditional no-store claim
  is too broad.

Update the pass record's function10/semantic dispositions to name the empty-line
condition and the nonreturning store. Its present first-key/midline language
does not close this condition accurately.

### 2. P2: function22's final FCB S2 is80h after a successful make

Draft263–265 says “the FCB's `S2` is set to 0 and its `EX` kept”. That describes
an intermediate reset without the final FCB state. It also conflicts with
function16's correct unmodified-since-open-or-make explanation.

At ea3ef3d:src/cpm/bdosfile.asm:529–538, FNMAKE checks drive protection,
clears S2 and then calls MAKEFCB. A full-directory return occurs at569–572,
so this preliminary reset still occurred. On the successful path574–609,
S1/RC/map are cleared and bytes1–31 are copied to the directory entry with
module0. Lines611–617 then OR80h into the caller FCB's S2 before the directory
write. The entry's module byte and the returned FCB's unmodified marker are
different states.

Suggested replacement for the affected explanation:
“After the drive-write check, function22 clears `S2` before searching for a
free entry and keeps `EX`, selecting an extent among the file's first32.
On success it clears `S1`, `RC` and the allocation map, writes the entry
and sets the FCB's `S2` bit7 to mark it unmodified. The returned FCB's `S2`
is therefore `80h`.” Keep the directory-full result and no-collision-check rule.
The bit is set before the directory-write call, so do not describe it as a
flag that is written only after successful physical persistence.

Record intermediate/module/final-FCB states explicitly in a-pass-record.
The existing source ranges already include both stages but the prose must
represent them together.

### 3. P3: the card-change link goes to power-cut recovery

Draft442–445 links “Follow the card-change procedure” to
05-cards-on-the-pc.md#recovery-after-a-power-cut. That section explains
partial data/directory writes and recovery copies. It is not the card-change
procedure. The existing draft's “Writing the physical card” section331–344
states exclusive PC/TEC-OS use and reset after reinsertion.

Change the target to05-cards-on-the-pc.md#writing-the-physical-card, or link
the actual safe-session-end procedure if that is the intended instruction.
The former is the direct existing Chapter5 home for the stated reset rule.
This is a final-destination semantic check, not a request for root integration.

### 4. P3: remove two artifact-agency phrases

Draft120: “A failed transfer does not promise rollback” assigns a social act
to a transfer. State the mechanism: “Earlier or partial physical writes are
not rolled back when a transfer fails.” Keep the lack-of-atomicity boundary.

Draft426: “Function99 refuses truncation” assigns refusal to the function.
Replace it with “Function99 returns `FFh` without truncating.” The actual
branch is ea3ef3d:src/cpm/bdos.asm:159–161 into FNCHNO:90–93. This also agrees
with the detailed99 entry's correct no-change contract.

Update the agency-pass disposition. No literal source or output needs changing.

## Cleared implementation scope

Read all of bdos.asm:1–800, bdosfile.asm:1–764, bdosfn.asm:1–837,
bdoscon.asm:1–376 and bdoslog.asm:1–900. Read bdosrec.asm's full sequential,
random, FCB/map, allocation and zero-fill bodies through860, then POSREC
through its BIOS-sector dispatch at938. Supporting BIOS, console, cache,
volume-service, layout/RAM, boot, CCP, table and geometry passages were read
with the relevant owning operations and callers. No routine was accepted
from a symbol match alone.

- Dispatch/result/stack: bdos.asm:137–252 plus tables.asm:89–97 supports the
  complete FCB selection list, extra-number dispatch, byte/word replication
  and no promised carry contract. layout.asm:152 declares54 bytes. This is
  reservation size, not measured use. Directory codes are actual four-entry
  record slots, not generic booleans.
- Functions0–9 and11–12 match their entry branches. Console output expands tabs,
  polls before output, pauses on ^S, drops the resuming key and aborts through
  CHDROP on ^S/^C. ^P toggles LISTEN. Other pending keys are retained. Reader
  and punch use the eight-bit serial owners at console.asm:581–599. The base
  LIST routine at566–567 discards output. Function6 bypasses tab/list/pause
  processing and returns0 on output. Functions7/8 read/write the IOBYTE,
  whose CON field is applied lazily by the BIOS. The function10 findings above
  concern its exact abort/store condition, not its correct normal buffer,
  maximum, editing, Delete/backspace or CCP-only history descriptions.
- FCBSEL binds explicit drives while SETDEF alone publishes logical defaults.
  FCB drive bytes remain intact. bdosfile.asm:142–234, bdosfn.asm:28–64 and
  bios.asm:63–96 support the selected/default and Select-error distinctions.
- Reset13 and protection: full reset logs drives out, clears read-only/WARMV,
  sets DMA and selects/logs A without changing USERNO. The CCP's WRFLAG path
  keeps clean sum matches, marks dirty drives for bounded rebuild and logs
  unmarked mismatches out for full scans. The draft correctly separates those
  states. Function37 clears LOGINV/ROVEC/WARMV bits, ensuring the next login
  scans fully. Selected read-only volume flags are reapplied by LOGIN.
- Open/close/search: OPENHIT:bdosfn.asm:621–685 imports only directory-owned
  fields, restores requested logical EX, derives RC and sets S2 bit7 without
  changing CR. CLOSEFCB handles unmodified and read-only no-write success,
  including never-opened FCBs, before directory matching. Search's raw-drive
  mode includes unused entries. Ordinary search clears S2, respects EXM and
  treats ?EX as an early wildcard before S2 comparison. Search-next has noDE
  argument. No further defect was found in those explanations.
- Delete/mutate: bdosfile.asm:458–514 writes the directory before FREEENT.
  Returned failure prevents that entry's free operation, without proving
  the physical write had no partial effect. Rename/attributes use the correct
  byte offsets and all-entry scan. The ignored second drive, file-protection
  distinction and DIR system-attribute hiding match their actual owners.
- Sequential paths: bdosrec.asm:22–298 supports0/1/2, map ownership before a
  failing write, success-only CR advancement, missing map/extent and failed
  close EOF paths. ADVEXT restores EX/S2 after a full directory and leaves
  valid sequential CR128 for retry. Later publication is correctly conditional
  on successful close.
- Random paths:393–559 rejects nonzeroR2 before FCB changes, distinguishes
  close3/read-missing4/write-full5, restores EX/S2 on missing/full and retries
  the required extent. RANDDONE restores CR to the random record. Disk full2
  and unwritten record1 are supplied by the shared sequential/map paths.
  No new example or observed retry result is asserted.
- Zero-fill:794–860 writes every record of each newly allocated block before
  the target write. bdoslog.asm:122–136 restores BIOS DMA before inspecting
  status and takes the nonlocal returned-error path on failure. The draft's
  restored-DMA qualification is supported.
- Vector, user, free-space and record-size functions match bdosfn.asm's owners.
  Free records are24-bit little-endian at DMA and explicit selection preserves
  the logical default. The five-bit BDOS user differs from CCP USER0–15 and
  page-zero's four bits. Functions35/36 preserve exact return codes. VMNTRS:
  volsvc.asm:377–391 reselects a remounted default so27/31 pointers update.
- Four errors/modes: bdoscon.asm:31–137 and file/log guards support the exact
  codes and ordinary-versus-error distinctions. FE/FF returned modes preserve
  the chain on normal return, with L/AFF and H/Bcode. Default error output
  can consume a pending ordinary key and ends through CHDROP. Output's ^S/^P
  processing remains separate. Error mode clears at warm boot.
- Chain/flush: bdos.asm:67–108 validates before copying all128 bytes, sets
  CHPOS1 and exits via RAM BIOS warm boot. CR/LF or absent0 returnsFF without
  replacing the line. volsvc.asm:413–429 preserves interrupt state around
  CFLALL. cache.asm:307–351 drops failed CFLALL lines and653–668 clears CHPOS
  and prints Write lost on warm failure. Explicit48 instead reportsFF and
  leaves no retry copy of dropped lines. The draft retains both failure
  qualifications and makes no rollback claim.
- Return108 and unsupported calls: PRGCODE lies outside the warm clear and
  within the cold clear. CCP's conditional check precedes per-command clearing,
  and its failure path writesFF00. The accepted range is exactly outside
  FF00–FFFE. Other high function numbers, including50, return0. Functions38/39
  directly dispatch RETZERO. Geometry CKS0 is explicit at format.json:52,59.

## Provenance, preservation and editorial scope

All67 units and48 summary rows have homes. The compatibility list is present
in full, with the two console items combined without losing either fact.
No literal executable source, recipe, output fence or measured example is
assigned to this reference. The full original and assigned compatibility list
were compared with the draft. No omitted technical unit was found.

The source-only header correctly names ea3ef3d and makes no new runtime or
measurement claim. The54-byte stack allocation is supported by the declaration.
There is no blanket781 capture attribution to audit here. Comparisons with
Digital Research CP/M/MP/M are retained original reference facts. This review
checks the TEC-OS side and product provenance text, not a newly executed
external implementation or independent external-manual qualification.

Read the complete reference in lookup order, every sentence for deletion,
subject/verb agency and every comma/table cell, then read back across the
shared rules, numbered entries and compatibility section. Explicit rhetoric,
agency and punctuation searches were reviewed in context. The number/register/
contract ordering is appropriate for the closed reference job. Shared errors
precede detailed contracts, with ordinary result rows clearly scoped. No
additional required structural, deletion or authorial-comma finding was found.
The final CKS/card-change sentence has a concrete operational purpose, subject
to the wrong target noted above. Existing A/D/19/22 and final-root navigation
were checked at the draft destinations, without asserting completed integration.

Verdict: correct the function10 condition/store scope and function22 S2 state,
then repair the recovery link and two agency phrases. Preserve all numbered
contracts and source-only evidence limits. Independent correction confirmation
can be bounded to those passages and the updated record.
