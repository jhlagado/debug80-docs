# C16 citation resolution

The source-only pass is on `tec-os-source-consistency`, based on accepted
book `4d830dc`. The separate `e102267` pass is intact. The reviewed source is
TEC-OS `fe2097f4bad3f7578aa41b8bce8aa571c451dbc7`.

All 393 originally pending ranges have dispositions for all 492 occurrences:
386 accepted source references, 101 corrected source references, four
superseded passages and one literal local diagnostic. There is no missing
pending disposition. The frozen discovery map is retained; it is not an open
queue. The supplementary review also covers every originally mapped occurrence.
All 1,785 original occurrences (1,737 file/citation pairs) now have semantic
dispositions: 1,611 accepted, 167 corrected, six superseded and one local
example. No textual-only match remains. `c16-citation-coverage.json` records
the complete coverage check.

## Factual corrections

- Current file ownership is explicit: the CCP includes `ccpmut.asm`, and
  volume services belong to `volsvc.asm`. The source listing includes both.
- Cache state includes the two-byte `CIFF`. The record-copy citation now
  supports its callers rather than introductory comments.
- Startup quiet-load conditions, `STFLAG` readers and a typed GLCD load are
  distinguished. Error-table ranges cover the actual failure and cleanup.
- A failed directory write and a failed preceding data flush are distinct;
  retained data can still give `Write lost` at the following warm boot.
- Diagnostics use the selected production backend. Input precedence is the
  authoritative override, prepared local input, then legacy sibling.
- Incidental matches in a diagnostic heading and demo program are rejected
  as support for the main ROM's layout and RTC service.
- `CMD0`'s retry requires the idle reply, and `R` or `r` retries the diagnostic
  prompt. BAT output returns directly instead of calling the list-device entry.
- The diagnostic SD test follows the production command sequence without
  being an identical driver. Its 80-column mode need not use identical
  register bytes. `HCWAIT`'s total is corrected by static instruction counting,
  not presented as a new measurement.
- The console-settling interval and browser frame budget retain their bounds;
  cursor redrawing retains the no-input condition. The target tree contains
  56 top-level test files; no suite was run to establish that count.
- Card-reinsertion consequences are conditional on writes still failing;
  source inspection alone is no physical-board observation. Stack-test prose
  states the checked bound rather than inventing a fresh depth measurement.

The ledger records routine ownership, supporting ranges and exact prose
corrections. A textual hit was not accepted as a claim-level review by itself.

## Verification and limits

The original checked-at headers remain intact. All runtime/output fences are
unchanged. The only source-fence change adds `volsvc.asm` and `ccpmut.asm` to
Chapter 13's include listing. Captures, addresses, timings and measured stack
depths retain their historical provenance unless a passage explicitly states
a narrower source fact. No builds, sample/TED workflows, browser workflows or
deployment ran. No physical board was checked.

Independent read-only review covered each assigned passage and source owner.
Applied chapter diffs were checked against those dispositions. The coverage
tool checks exact tokens, original occurrence provenance, source bounds and
reconstruction of the complete reviewed edit from the frozen book base,
including required prose edits and supersession anchors. Fenced bytes and
literal spaces are compared exactly; prose may be reflowed. This is a check of
application, not a substitute for the semantic review.

The source manifest records 90 source blobs, including the preparation inputs,
compact SAMPLE source and dependency lock. It is bound to the ledger's SHA-256 and reviewed source pin.
It cannot be recorded against a different offer. A later source offer is
compared with the recorded source blobs, and every changed file needs renewed
claim review. Matching source does not certify runtime results.

The complete application check passed with `--require-all`: zero missing
pending dispositions and zero unreviewed mapped pairs. Rechecking `fe2097f`
against the recorded manifest reports no changed source file. Negative checks
reject an omitted disposition, a record attempt at an unreviewed source pin,
literal-space or command-line changes, and an unrelated removal edit.
The prose scan has no hard findings; its four review candidates are existing
table wording. Independent checks of the applied chapter diffs returned no
application findings.

## Recheck commands

From the book checkout, with `tecos_source` naming the source repository:

```sh
python3 tec-os/editorial/check-citation-resolutions.py \
  --source-repo "$tecos_source" \
  --ledger tec-os/editorial/c16-citation-resolutions.json --require-all
python3 tec-os/editorial/recheck-reviewed-citations.py \
  --source-repo "$tecos_source" --revision "$source_offer" \
  --ledger tec-os/editorial/c16-citation-resolutions.json \
  --manifest tec-os/editorial/c16-reviewed-source-manifest.json
```

Set `source_offer` to the complete later source commit. A nonzero recheck
requires reviewing changed files, updating affected dispositions and only
then recording a fresh manifest at the ledger's newly reviewed source pin.
The guarded runtime validation and publication steps remain in
`c16-source-preparation.md` and remain separately held.
