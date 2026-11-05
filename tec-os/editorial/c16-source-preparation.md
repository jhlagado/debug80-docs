# C16 source preparation

This pass starts from accepted book commit `4d830dc` on
`tec-os-source-consistency`. The separate unpublished `e102267` pass remains
intact. It does not contain accepted main and is not merged here.

The source offer is TEC-OS `fe2097f4bad3f7578aa41b8bce8aa571c451dbc7`.
This is a source-only preparation, not a final checked pin. Correctness and
debugger-support outcomes must be incorporated before the final source offer.
Existing capture fences and their `78127ec` provenance remain unchanged.

## Reproducible setup

The following is the setup from that offer's README. It has been read against
`tas-rom.mjs` and `pins.mjs`, but has not been executed for this book pass.

```sh
(
  set -eu
  tas_stage=
  trap 'if [ -n "$tas_stage" ]; then rm -rf "$tas_stage"; fi' EXIT
  npm ci
  npm run inputs   # pinned TED.COM and TAS.COM
  mkdir -p .inputs
  if [ -d .inputs/tas-host ]; then
    node --input-type=module -e 'import { tasAssembler } from "./tools/lib/tas-rom.mjs"; await tasAssembler();'
  else
    tas_stage=$(mktemp -d "$PWD/.inputs/.tas-host.XXXXXX")
    git clone https://github.com/jhlagado/thorium.git "$tas_stage"
    git -C "$tas_stage" checkout --detach 3d16b30cb8ed7deccc0a8b0b04f1b961e29f5689
    (cd "$tas_stage" && npm ci)
    TECOS_TAS_HOST="$tas_stage" node --input-type=module -e 'import { tasAssembler } from "./tools/lib/tas-rom.mjs"; await tasAssembler();'
    mv "$tas_stage" .inputs/tas-host
  fi
)
```


## Compact sample and palette

At this offer, `programs/SAMPLE.ASM:186` defines `HELLO`. Line references
must be regenerated from source, rather than shifted by the number of removed
comment lines. `tools/media.mjs:205-207` converts LF to CR LF and appends
`1Ah` for the card copy. Static transformation gives:

- Card text bytes before record padding: 5051.
- Card text SHA-256: `0544eba7fbdb498d8d9114e64ad3ddbf48825e5430ee4665940ce82098ab6776`.

Qualification records report SAMPLE.COM unchanged at 261 bytes, SHA-256
`a895dc1fa1e2c6aacb551ea09c719c795b2da8ecf58d9aa4d328663a8f4c95db`.
This pass has not assembled it. Old directory fences are retained captures,
not evidence of the compact sample's current size or free-space effects.

The palette offer changes four ROM bytes to `31h`: `TMSCOL+1` and byte 7 of
`REGS32`, `REGS40` and `REGS80`. They are at `D2D5h`, `D405h`, `D3FDh` and
`D3F5h` respectively. Qualification reports the ROM SHA-256 as
`a3dd9ee9763d94efff6b7a93a2cc8f9d7300f04a3e57f5cd0a5f24868f8ed6bb`.
The previous image's address layout remains unchanged. This identity is
recorded from qualification evidence, not a local build.

The qualification source is Origo
`893d1de0d9c5075d0c8d9b1d73aa14f7e6e71722`,
`studies/p3-tec-os/evidence/console-compact-style/qualification.md`:
lines 3-28 give the incumbent `78127ec` and SAMPLE comparison;
lines 37-43 identify the four absolute palette addresses; lines 62-72 give
the published hashes and palette offer
`a6e7ba1811c1e5e7fe3b72872a8fccefd4c3728b`.
The TAS migration comparison is recorded in that same Origo revision's
`studies/p3-tec-os/reports/tas-toolchain-migration.md`, against source offer
`fe2097f`. These are recorded qualification results, not reruns in this pass.

## Citation dispositions

The original 393 pending ranges (492 occurrences) are resolved in
`c16-citation-resolutions.json`, with claim-level reasons and corrections.
The frozen textual map is retained for reproducibility. A later source offer
still needs the source-identity recheck and substantive review of changed
files; this does not reopen the original list without identifying a change.

## Deferred guarded validation

P6 holds compute. No builds, sample/TED workflows or deployment run here.
After allocation and the final source offer:

1. Re-export that exact commit and rerun the citation map against it; resolve
   every pending citation by reading the actual source and its caller.
2. Under the machine-wide memory guard, one job at a time and below 1 GB,
   execute the verified setup, then `npm run build`, `npm run diag`,
   `npm run media` and `npm run web`. Record actual stdout and full hashes.
3. Run the explicit ATOM reference backend separately. Compare the main and
   diagnostic ROMs, GLCD.SVC, MOUNT.COM and DEMO.COM byte for byte, and check
   consumed D8 fields and the real BDOSRME probe. Keep TAS provenance.
4. Rerun every book capture from fresh cards, regenerate directory and recipe
   fences, and run SAMPLE and the TED teaching round at the final pins.
   Check palette normal/reverse text at 32, 40 and 80 columns.
5. Check moved addresses, stack/resource claims and debugger-support outcomes
   against the final offer, then obtain independent factual review.
6. Only after acceptance, build the book under the guard, check links and
   editorial exclusion, and obtain the publication allocation. Publication
   remains pending; pushing this branch does not publish it.

Run each allocated validation separately from the exported source directory;
never put one guard inside another:

```sh
node "$HOME/projects/origo/tools/mem-guard.mjs" --limit 850 \
  --name tec-os-c16-build --log "$validation_log" -- npm run build
node "$HOME/projects/origo/tools/mem-guard.mjs" --limit 850 \
  --name tec-os-c16-diag --log "$validation_log" -- npm run diag
node "$HOME/projects/origo/tools/mem-guard.mjs" --limit 850 \
  --name tec-os-c16-media --log "$validation_log" -- npm run media
node "$HOME/projects/origo/tools/mem-guard.mjs" --limit 850 \
  --name tec-os-c16-web --log "$validation_log" -- npm run web
```

Set `validation_log` to a scratch log outside the repository first. Preserve
TAS artifacts before a separate reference export runs these same four
commands with `TECOS_ROM_ASSEMBLER=atom`. Setup installation and the capture
and TED drivers also need their own allocation and guard; their exact pins
and driver paths must come from the final offer, not a guessed future path.
