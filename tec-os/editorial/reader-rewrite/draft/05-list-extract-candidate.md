# Chapter 5 held list/extract candidate

Status: source-only preparation for the forthcoming shared batch. No command
below has been run for this candidate. No output, byte count, hash or reader
workflow is newly qualified. This file is separate from reader prose.

I own this candidate, `05-cards-on-the-pc.md` and `05-pass-record.md` only.
The lead maps these cases into the shared allocation. This packet does not
allocate a run, create a fixture or authorise reader insertion.

## Input and evidence boundary

The input is `card.img`, the persisted card from the actual Chapter 2 banner
round after saving, quitting TED and successfully flushing at the CCP prompt.
It must contain the reader's final `B:BANNER.ASM` in user area 0. A fresh
starter image has no such reader file and cannot substitute for this input.
The backup's recorded size must cover its declared container, not merely use
the historical starter's count for an unrelated larger container.

Before the batch, fix the adopted source, matching ROM/map/card provenance,
TED/TAS identities and exact final banner source in the shared packet. Supply
that independently qualified source as `banner-final.asm` with LF endings
and no CP/M EOF/padding. Retain its identity and the actual saved card's hash.
The source contract inspected here is TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. It does not prove the planned
40-column/font default or the banner round. A later adopted source needs a
bounded recheck of the owners below.

Run from the TEC-OS repository root with its declared Node.js prerequisite.
`card.img` must already be present there and `recovered/` must not exist.
Every extraction below has an explicit PC destination in that new directory.
Do not overwrite an existing recovery directory or copy. No `put`, `era`,
`install`, build, media generation or live-card mutation belongs in this case.

## Exact proposed command packet

These are commands to schedule, not a captured transcript. The subshell stops
on a command failure. The batch's outer guard/deadline and input identities
must be supplied by the lead before execution. No retry or altered input is
part of this packet.

```sh
(
  set -eu
  shasum -a 256 card.img banner-final.asm
  node tools/tecvol.mjs verify card.img
  node tools/tecvol.mjs dir card.img
  node tools/tecvol.mjs dir card.img B
  node tools/tecvol.mjs dir card.img B --user 0
  mkdir recovered
  node tools/tecvol.mjs get card.img B BANNER.ASM recovered/BANNER.REC --user 0
  node tools/tecvol.mjs get card.img B BANNER.ASM recovered/BANNER.ASM --user 0 --text
  wc -c recovered/BANNER.REC recovered/BANNER.ASM
  od -An -tx1 -v recovered/BANNER.REC
  cat recovered/BANNER.ASM
  cmp banner-final.asm recovered/BANNER.ASM
  shasum -a 256 recovered/BANNER.REC recovered/BANNER.ASM
  shasum -a 256 card.img
)
```

`shasum`, `wc`, `od`, `cat`, `cmp` and `mkdir` are PC utilities for this proposed
POSIX-shell batch. Their output is evidence to collect, not invented terminal
text. The reader insertion can omit these evidence checks after qualification.
The actual reader recipe still needs its own exact disposition from the batch.

## Case inventory for the lead and Ramanujan

| Case | Public operation | Required observation and stop condition |
| --- | --- | --- |
| 05-L0 | Identity and `verify card.img` | Match the supplied saved-card identity. Require successful container/directory checks. Record actual status/stdout/stderr. Stop on a mismatch, truncation or directory issue. Verification alone does not prove BANNER's text. |
| 05-L1 | `dir card.img` then `dir card.img B` | The first lists A by default. The second lists all user areas on B, including the saved BANNER.ASM under area 0. Record the complete actual lines, sizes and attributes. Do not predict the other files from the starter or discard build/editor by-products. |
| 05-L2 | `dir card.img B --user 0` | Show BANNER.ASM in the intended area. Its recorded size must be a whole multiple of 128 bytes. Do not transfer a historical BANNER or HELLO size. Stop if the file is missing or belongs to another area. |
| 05-L3 | Binary `get` to `recovered/BANNER.REC` | Produce a separate PC file with all recorded bytes, including the final record's padding. Its byte count must equal the listing's BANNER size. Inspect the actual tail with `od`. Do not assume TED used zero padding or that every tail byte is 1Ah. |
| 05-L4 | Text `get` to `recovered/BANNER.ASM` | Compare the complete extracted source with the exact final saved Chapter 2 source. Extraction stops before the first 1Ah and converts CR LF pairs to LF. Neither the marker nor later padding belongs in the text output. Preserve every instruction, symbol, literal and comment. Unexpected bytes or lost source stop acceptance. |
| 05-L5 | Final card hash and output identity | Require the final card hash to equal the initial hash. Keep both extracted files, their byte counts/hashes and all command evidence in the shared batch artifacts. No successful host-model or physical-card result follows from preparing this file. |

The shared batch must also check the comparison conditions in this table.
Printing a source file or a digest does not itself establish equality. The
exact saved source and image identity come from the banner round's artifacts,
not from a newly generated host fixture. These six cases are the complete
new list/extract request. Existing historical Chapter 5 cases keep their old
pins and are not silently added to this allocation.

## Exact conversion and destination contract

The CP/M directory records length in 128-byte records. A binary extraction
returns that full recorded length, not an original PC byte count and not the
file's larger allocation-block reservation. `BANNER.REC` names that raw PC
copy only. It does not rename the file on B.

The text extraction scans those recorded bytes for the first 1Ah (`^Z`). It
uses only the bytes before that marker, or all recorded bytes if there is no
marker, then replaces each CR LF pair with LF. It does not remove a lone CR,
strip arbitrary zero padding or reconstruct a missing text-end marker.
Require the real saved banner to meet the expected text contract before
publishing this recipe. `recovered/BANNER.ASM` is the explicit PC destination.
Without an output-file argument `get` writes its bytes to standard output.
An existing destination would be overwritten, hence the new directory.

The host tool's text `put` is a separate conversion: it normalises LF or CR LF
to CR LF, appends 1Ah and pads to a record boundary with 1Ah. Binary `put`
pads with zeros. Neither rule establishes TED's actual save bytes. Do not
substitute a host `put` for the reader's save to make this packet pass.

## Source proof and closure

All coordinates below use ea3ef3d. I read the complete containing tool and
filesystem implementation, container lookup and their callers as text.

| Contract | Actual owner |
| --- | --- |
| Node prerequisite and direct command | `package.json:8–13` declares Node >=20 and the tecvol entry. Direct `node tools/tecvol.mjs` needs no PATH installation. |
| Valid options/default user | `tools/tecvol.mjs:41–63,103–107` parses options and supplies user 0 for get. |
| Directory scope and formatting | `tools/tecvol.mjs:142–147` defaults dir to A and passes an optional user filter. `tools/lib/cpmfs.mjs:91–115` groups/sorts files and derives bytes from record counts. |
| Volume choice | `tools/tecvol.mjs:80–83` calls `tools/lib/container.mjs:201–209`, trying drive, label then id. B is explicit here. |
| Destination and read-only extraction | `tools/tecvol.mjs:159–167` reads the image/volume, extracts bytes and writes only the named output or stdout. It does not call image replacement. `openImage:73–76` reads and validates the source. |
| Whole records and text | `tools/lib/cpmfs.mjs:128–149` allocates records ×128 bytes, copies recorded data, stops at first EOF and replaces CR LF pairs. Its `118–120` resolves the file in the selected area. |
| Text put is not TED save | `tools/lib/cpmfs.mjs:175–188` implements the separate host conversion and padding. This code cannot qualify TED's emitted bytes. |
| Structural verification | `tools/tecvol.mjs:115–140` reports directory issues and sets verify status 1. `tools/lib/cpmfs.mjs:240–267` implements the checks. |

Pending: allocation, adopted-source/input freeze, the actual saved banner
card, all six case observations and exact-source comparison, durable batch
artifacts and independent result review. No expected stdout block, measured
length, hash or workflow success has been fabricated. Reader insertion is
held until these requirements are satisfied.
