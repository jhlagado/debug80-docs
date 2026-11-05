# C16 factual review

Reviewed source preparation at book commit `34e2707`, including the later
explicit guard commands, against TEC-OS `fe2097f`. No workflows ran.

Two findings were returned and corrected:

- The stale-input preparation belongs to `tools/inputs.mjs:37-65`, while
  `tools/lib/pins.mjs:10-48` supports selection and validation. Both are now
  cited in Chapter 13.
- Recorded binary identities and palette addresses needed the exact
  qualification artifact, revision and comparison baseline. These are now
  recorded in `c16-source-preparation.md`.

The independent check reproduced the static SAMPLE transformation: 5,051
bytes before record padding, with the stated SHA-256. No further factual
finding was returned for the edited passages or guard commands. The citation
map remains preparation: 393 unique ranges need substantive resolution.
Captures retain their earlier source provenance. Final-pin runtime validation
and publication remain pending.

This initial review predates the completed citation slices. Its 393-range
follow-up is resolved in `c16-citation-resolutions.json`; see
`c16-citation-resolution-report.md` for the later source review and limits.
