# KD-246 corrected title packet: allocation request

Status: synthetic controls passed. Exact packet prepared, independent confirmation
pending. No actual build or real-output validator invocation is allocated.

KD-246 explicitly approves Appendix F's expected browser title changing from
``F. `tecvol` | Debug80 Docs`` to `F. tecvol | Debug80 Docs`. The precise JSON
semantic diff is in `attempt03-semantic-diff.json`: only `/pages/33/title` and
`/representation/heading`. The exact-equality checker is unchanged. All other
38 titles, 39 source identities, H1s, sidebar and pager values, links, fragments
and 247 literal fence pairs remain unchanged.

The original 40 synthetic controls retain their labels/categories and order.
Eight focused controls bring the result to 48: six positive and 42 expected
failures. Receipt reuse still exits 2 without changing the receipt. No frozen
fence contains a literal backtick, so a deletion case is unavailable. Insertion
of a backtick into a synthetic fence fails exact code-text comparison. Synthetic
results establish checker behaviour only.

SITE02 remains FAILED under the old expectation. Its sealed packet, receipts,
logs and persistent claim are preserved. No old claim is removed or reused.
A title census and navigation extraction do not establish whole saved-output
closure; no such reuse is proposed here. The fresh bounded invocation below is
prepared for the missing complete closure, not executed.

## Exact next command

A separate P3 allocation must supply the variable. Do not invoke it until that
allocation exists and the independent input review is clear.

```sh
: "${TECOS_SITE03_ALLOCATION:?A fresh P3 allocation is required}"
sh /Users/johnhardy/projects/debug80-docs-tec-os/tec-os/editorial/reader-rewrite/site-verification/invoke.sh 8ff67aa359ad79b7a5b715a71e81942bb0c935c27707519a5454c3439bb4f2b4 /private/tmp/tec-os-reader-site-8ff67aa359ad-attempt03 "$TECOS_SITE03_ALLOCATION"
```

The seal is `8ff67aa359ad79b7a5b715a71e81942bb0c935c27707519a5454c3439bb4f2b4`.
The source remains `a3e4c292fee3022e432a18be36370d2d87cd4b30`.
The exact 34,037,760-byte source archive and all 4,454 installed dependency
entries retain their previous identities. `attempt03-packet.json` lists every
changed payload hash; every non-payload seal field is unchanged.

Limits remain: absolute 180 seconds including preflight and cleanup, three seconds
cleanup reserve, guard wait 0, 850 MB, Node heap 450 MB, two workers, minification
disabled, one run and no retry. Existing ownership/deadline limitations remain.
No publication, global-site, browser, visual-layout or physical-hardware claim.
