# KS47 SITE01: ownership failure before rendering

Delegated under KD-242. The exact allocated invocation is terminal with exit 1.
The complete raw output and outer command log are retained in raw-output.tar.gz.
No retry or VitePress build occurred. All 39 reader texts remain at a3e4c29.

The whole invocation took 7.2871055 seconds. The guard reports 2.3 seconds,
14 MB sampled peak and one observed process. Short-lived processes can escape
sampling. Source export/preflight completed before the ownership failure.
No rendered-page, link, fence or checker acceptance follows from this result.

## Actual ownership outcome

The worker published PID/PGID 21671, guard/parent 21660, the matching nonce
and context hash. No acknowledgement or build-start receipt exists. Both the
actual guard and outer invocation ended with exit 1. The independent UTC audit
at 04:03:59 found no matching worker PID/PGID or guard. The worker source cannot
spawn the build before acknowledgement. These facts resolve this attempt's
bootstrap outcome and release its reservation. They do not prove universal
cleanup of a stopped or unknown bootstrap process.

## Source diagnosis and next step

The worker runs with TZ=UTC and records ps lstart in that timezone. The outer
process audit inherits the local timezone and compares the birth strings
literally. A read-only same-process comparison shows 15:09:19 in Melbourne and
04:09:19 in UTC for the same birth. The existing equality can therefore withhold
acknowledgement despite matching process identity. The receipt supplies the
UTC worker birth. No outer mismatch diagnostic was retained, so this mechanism
is a source-supported diagnosis rather than a captured failed comparison.

Development has the failed packet and a bounded correction brief. A consistent
identity reading, mismatch diagnostics, reseal and independent review precede
any newly allocated attempt. The existing validator and acceptance limits stand.

## Archive identity

Archive SHA-256: `cc66bc78b89acf934bd7c12b75ac6c78119eacd731ab77859214b444c8e15579`. Size: 60688710 bytes.
