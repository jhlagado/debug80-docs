# Existing Chapter 19: reverse outline

Read completely at `10821b6`, including the FCB and DPB tables, arithmetic
example, console capture, error modes and differences list. These are reading
notes, not a replacement chapter or a new source qualification.

## Opening

The first paragraph connects the program's call at 0005h to directory state,
BIOS and cache. The second promises a file's life and compatibility differences.
The file-life theme is useful but the console implementation interrupts it.
The replacement structure should give console processing its own question and
keep the file path continuous after the caller understands FCBs and records.

## The BDOS in the ROM and in RAM

- Paragraph 1 establishes Portable CP/M provenance and the six-file source order.
  The table assigns dispatch, whole-file operations, records, searches, login
  and console/error routines to their source files.
- Paragraph 2 gives ROM bounds, size, constants and the impossibility of patching
  ROM. Preserve these as qualified build facts rather than timeless addresses.
- Paragraph 3 separates cleared BDOS workspace from LOGINV and PRGCODE, whose
  different lifetimes matter at warm boot. It connects per-drive state to DPHs.
- Paragraph 4 explains RAM BIOS indirection and its direct BCONST exception.
  The cursor side effect supplies the reason for that exception.

## The entry

- Paragraph 1 traces 0005h through the resident stub or lowest service page.
- Paragraph 2 follows saved SP, private stack and PARAM, then the seven extended
  function numbers and immediate zero return for other unsupported numbers.
- Paragraph 3 describes the ordinary 41-word dispatch table and undefined slots.
- Paragraph 4 explains FCBMAP, selected functions and drive-byte interpretation,
  including the special question-mark search case.
- Paragraph 5 distinguishes bound CURDRV from default DEFDRV, login and unchanged
  FCB drive byte. Keep these meanings separate from prompt drive selection.
- Paragraph 6 gives the three return paths, replicated register result and restored
  caller stack. This is implementation evidence for the earlier calling contract.

## The console functions

- Paragraph 1 explains why output polling needs a reserved input byte and how
  GETCHAR and status calls consume or report it.
- Paragraph 2 traces tab expansion, output-time key polling, pause/resume,
  Ctrl-C termination, list copying and preservation of an ordinary typed key.
- Paragraph 3 explains column tracking before BIOS calls and the hook contract.
- Paragraph 4 compares echoed input, direct I/O and status, including side effects
  deliberately absent from function 6 output.
- Paragraph 5 gives buffered-line layout, termination and full-buffer behaviour.
  Six key bullets distinguish erase, rubout, redraw, newline, list and Ctrl-C.
- Paragraph 6 and capture demonstrate Ctrl-U and Ctrl-R at the actual prompt.
- Paragraph 7 separates CCP-only history keys from program line input and records
  the history write at line completion.
- Paragraph 8 places string output, auxiliary devices and IOBYTE calls.
- Preserve the typed-key lifetime and hook register rules. Ordinary editing keys
  belong earlier as actions; these mechanisms belong after the interface lesson.

## Files, extents and records

- Paragraph 1 defines records, directory entries, allocation blocks and FCBs.
  The complete offset table distinguishes sequential and random state.
- Paragraph 2 compares directory and FCB layouts, attribute bits and map widths.
- Paragraph 3 and DPB table introduce extent grouping and geometry parameters.
- Paragraph 4 derives one versus two extents per directory entry.
- Paragraph 5 traces FCBADDR, POSREC, division and BIOS deblocking arithmetic.
- Paragraph 6 works record 37 through map cell 2, allocation block 300, record
  4805, track 75, sector 5 and card-block quarter 1. Retain this concrete bridge.
- Paragraph 7 gives damaged-map rejection before a record transfer.
- Paragraph 8 traces FINDENT and MATCHFCB, user/name matching, attributes,
  wildcard and extent masks. The six-mode table separates copying from matching.
- Paragraph 9 explains DIRUSED, exceptions for free-entry/all-entry searches and
  the mark's relation to warm-boot work. Empty B requires no directory read.

## One file's life

- Opening paragraph gives make, write, close, reopen and read as a connected route.
- Paragraph 1 traces make's empty-entry search, initial fields and immediate
  directory write. It connects write type 1 to data-before-directory ordering.
- Paragraph 2 explains the S2 unchanged bit and exactly when writes/allocation
  clear it.
- Paragraph 3 traces sequential write, new-block allocation, BIOS write types,
  zero-fill instead of a read and record advancement only after success.
- Paragraph 4 explains extent rollover, full-directory/full-volume returns and
  retryable FCB position, including deletion beneath an open FCB.
- Paragraph 5 distinguishes unchanged close, read-only success without writing,
  full versus map-only directory update and write-behind persistence.
- Paragraph 6 explains open's copied fields, wildcard replacement, retained extent
  and adjusted record count when two extents share an entry.
- Paragraph 7 traces sequential read, extent rollover and the three EOF cases.
- Paragraph 8 explains delete's directory-before-free order and refers the other
  operations to Appendix A. This sequence is the strongest chapter spine.

## The allocation vectors and the scan at warm boot

- Paragraph 1 establishes the free-block lookup need and per-drive vector pointer.
- Paragraph 2 traces allocation/deletion bits, reserved directory blocks and
  changed-FCB marking before close. Preserve failure-path ownership reasoning.
- Paragraph 3 traces first login, pointer binding, read-only marking, full scan,
  invalid block handling and the already-logged-in fast path.
- Paragraph 4 and table define the DPH checksum, changed flag and directory mark,
  naming each writer.
- Paragraph 5 explains why direct BIOS directory writes also invalidate the mark
  and why the larger mark wins.
- Paragraph 6 compares ordinary CP/M reset with WRFLAG-directed WRESET.
- Paragraph 7 and two bullets distinguish changed-drive partial rebuild from
  unchanged checksum reuse or a full scan after unexplained vector corruption.
- Paragraph 8 traces reset tail, A selection, scan completion and resulting I/O.
- Paragraph 9 contrasts explicit function 13, selective function 37 and live volume
  changes. Keep these guarantees beside the state-lifetime explanation.

## BDOS errors and the error mode

- Opening paragraph and four bullets map Select, R/O, File R/O and Bad Sector to
  distinct causes and codes. Preserve file protection versus volume protection.
- Paragraph 2 traces default print/wait/terminate behaviour, pending keys and
  dropping the remaining chained line.
- Paragraph 3 contrasts silent and printed return modes, H/A results, warm-boot
  reset and unchanged FCB position after failure.
- Paragraph 4 explains persistent card-marked protection despite clearing ROVEC.
- Error-mode programming needs the earlier return-code and chain contracts;
  ordinary recovery instructions need only the action and consequence.

## Differences from Digital Research's BDOS

Opening paragraph states the reported compatibility version. Seven bullets cover
ROM hooks, extended calls, warm-login optimisation, output-time Ctrl-P, function
1 echo, CCP-only history keys and absent media-change detection with CKS zero.
Retain each qualified difference in the compatibility reference without making
this catalogue the ending of the file-life narrative.

## Questions for the new source qualification

- Recheck all bounds and dispatch lists at the final offered pin, rather than
  carrying historical addresses into a new checked claim.
- Keep the read-only close success distinct from write functions' R/O failures.
- Retain exact timing and capture provenance wherever those examples move.
- Review the compatibility wording against its stated documented interface;
  neither ROM residency nor a function-12 version byte proves all compatibility.

Last heading read: Differences from Digital Research's BDOS. The read reached
the final check-vector bullet.
