# Chapter 15 cost provenance review

Historical measurement acceptance is reopened and held. This is a static
review of existing text, Git history, a retained measurement script and its
saved output. No script was executed or imported, and no build, test or new
measurement was performed. I have not edited Chapter 15 or its pass record.

## Durable evidence

Private Origo directory:
`studies/p3-tec-os/evidence/book-reader-rewrite/boot-cost-audit/`.
Preserved in private Origo commit `8adbc1bf`.
The directory contains byte-for-byte copies of the retained script/output,
book reviews 22, 40 and 46, the relevant `5006e2c` diff and `manifest.json`.
The manifest records original paths, byte counts and SHA-256 for each payload.
These identities preserve the evidence inspected; they do not independently
prove the historical execution environment or reproduce its results.

Original retained directory:
`/private/tmp/claude-501/-Users-johnhardy-projects-debug80-docs/04aa97d9-d3eb-44c9-afc3-74d8aa07810f/scratchpad/b14p2-t/`.

| Original and archived filename | Bytes | SHA-256 |
| --- | ---: | --- |
| `measure.mjs` | 7027 | `9fadc5c2a60304385b39ce622c53cc2fbf0584640190774841255dc92365e351` |
| `m781.json` | 1672 | `1921c0f65d39abe6812d6ca80888bb5e3a59a7593255ab8003df923a5be34947` |

Despite its suffix, `m781.json` contains guard log lines surrounding one JSON
result. It is preserved without cleaning or reformatting. Its log records an
exit 0, peak 219 MB and 5.9 seconds for the historical job; those are retained
claims, not measurements from this review.

Book 46 identifies the historical product as `78127ec`, with the timing job
on `$S/rv14b` and this script. The full product revision is
`78127ec63a2478c544af7fa96bfa73345f9df824`. The script accepts its build directory
as an argument, reads that directory's ROM, symbols and starter image, and
uses `glcd:false` and a fixed clock. The saved output does not embed hashes
of those inputs. Revision attribution therefore depends on Book 46's record;
the archive must not be described as a self-contained, independently qualified
runtime capture bundle.

## Every cost change in 5006e2c

The relevant diff moves the former Chapter 14 material into Chapter 15.
It introduces three numerical replacements and two added precisions.

| Cost | Before → after | Evidence and finding |
| --- | --- | --- |
| First prompt CONIN | 7,067,777 → 7,200,316 | `marks` samples cycles before stepping an instruction at a named label. Cold boot marks `BCONIN`; saved first and last are both 7,067,777 with one call. Book 46 agrees. No supporting record or distinct endpoint was found for 7,200,316. Difference 132,539 remains unexplained. Restore the record-supported figure with an explicit disposition. |
| Clean warm boot | 32,482 → 32,502 | `warm` subtracts first WBOOTR entry from first STARTED entry. Both saved clean runs are 32,482 with zero reads. No supporting run or endpoint change was found for the +20. |
| Warm boot after SAVE | 115,898 → 115,918 | Same endpoints after `SAVE 8 X.COM` on A. Saved result is 115,898 with zero reads. No supporting run or endpoint change was found for the +20. |
| Complete banner step | Added 238,122 | No matching retained measurement or correctly bounded method was found. Hold this number outside reader claims. It is not simply 25 × 9,448 (236,200); additional overhead would need its own proof. |
| MEMINIT | About 347,000 → 346,677 | Book 40 explicitly records reproduction of 346,677 at 58d4345; earlier saved records also contain it. This supports that historical attribution, not a fresh 78127ec subroutine measurement. Qualify the older provenance. |

## Unchanged cost numbers and exact proof scope

| Number | Method or authority | Scope |
| --- | --- | --- |
| Cold boot 1,371,558 | First CCPENT entry cycle in saved output; Book 46 agrees | Reset-cycle origin to entry, before its first instruction. |
| Block 0 219,144 | First SDREAD call, entry through return | `calls` identifies return by return address and restored SP, and takes the cycle difference. |
| CPMINIT 7,327 | Completed CPMINIT call in clean warm boot | Same entry/return instrumentation; excludes caller CALL execution. |
| Empty CWBOOT 8,437 | Completed CWBOOT call in clean warm boot | Same entry/return instrumentation; excludes caller CALL execution. |
| CCP entry/reset 14,272 | STARTED entry minus CCPENT entry | Label-to-label interval, not just the disk-reset subroutine. |
| Program disk reset 1,036,661 | Injected BDOS function 13 through the sentinel return | Script sets PC=5 and a sentinel return stack; interval ends at PC=0F00h. Not a normal program's surrounding CALL overhead. |
| First B selection 9,167,671 | Subsequent injected function 14 selecting B | Same sentinel convention, after function 13 and A selection on the same machine. |
| Warm-boot bound 386,604 | 78127ec `test/warmboot.test.mjs:11–17` | Source assertion on the test's own fixture; not another starter-card measurement. No test was run here. |
| CONOUT character 9,448 | Earlier explicit TXBYTE/BCONOUT reproduction at 60cfbdc in Book 22 | Retained historical claim; not established at 78127ec by the broad-marker JSON. Its older product pin must be retained from that report. |

The rounded 0.34 seconds and 8 milliseconds follow from the historical
4 MHz assumption. The roughly 83,000 extra warm-boot cost remains compatible
with the supported pair: 115,898 − 32,482 = 83,416. Directory sizes 512 entries
and 32 blocks are contextual quantities, not new timing measurements.

## Why the broad markers cannot replace subroutine costs

The script calls `(COLDRT − COLDNC) / 25` `bannerPerChar`. At 78127ec,
COLDNC includes banner setup/output and then MEMINIT before COLDRT. Its saved
23,393.72 is an average over that broader interval, not CONOUT's per-character
cost. Likewise `WBOOTR − MEMINIT` includes the subsequent card initialization,
mounting, allocation setup and drive display before warm boot. Its saved
1,080,007 is not MEMINIT's entry-to-return cost. Neither value contradicts a
properly bounded subroutine measurement, and neither may replace 9,448 or
346,677 on this evidence.

## Disposition boundary

Restore the three directly supported pre-5006e2c figures with explicit
provenance. Remove 238,122 from claimed reader results while retaining it here
as unsupported. Attribute MEMINIT's exact value to the demonstrated 58d4345
record and the character cost to the 60cfbdc record in Book 22. The broader
78127ec blanket measurement acceptance remains held until those distinctions
and the lead's dispositions are integrated. This review does not close final
runtime, input, site or whole-book acceptance.
