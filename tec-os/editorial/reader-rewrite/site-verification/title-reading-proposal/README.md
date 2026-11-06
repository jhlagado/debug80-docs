# Proposed browser-title reading after SITE02

Status: proposal only. No changed expectation or checker has been activated or
executed. SITE02 remains FAILED. No next invocation is allocated here.

## Actual result

KS47-SITE02, allocated at Origo9de5c81e, exited 1 after 10.161395083 seconds.
The ownership handshake completed in UTC/C before the build. VitePress rendered
successfully in 3.22 seconds. Validation then stopped on Appendix F's title.
The retained terminal, first-failure and checker receipts are in
`../failed-attempt02`. The original output and persistent claim remain intact.
An empty process audit establishes no universal cleanup guarantee. Root owns
independent ownership disposition and the complete raw archive.

## Precise proposed change

Old rule: page `title` is the literal frontmatter title, followed by the existing
site-title template. That incorrectly retains Markdown code delimiters.

Proposed rule for this frozen source: page `title` is the frontmatter title's
inline-Markdown text as resolved by the pinned VitePress renderer, followed by
the unchanged site-title template. This is a source-specific expectation, not a
new generic backtick-stripping function in the checker.

The only proposed value change in active `expectations.json` is:

    pages[path=tec-os/appendix-f-tecvol.md].title
    old: F. `tecvol` | Debug80 Docs
    new: F. tecvol | Debug80 Docs

The representation explanation must also distinguish browser title from sidebar
label. No checker algorithm change is proposed: exact equality remains required.
Raw frontmatter, source H1, reader prose and accepted headings remain unchanged.
All other 38 title values, H1 rules, links, fragments, sidebar labels/order, pagers,
code fences, inventories, source and dependency identities and execution limits
remain unchanged. A future packet would require refreshed controls and a new
seal, then an independently allocated invocation. This proposal grants neither.

## Installed source trace

The pinned VitePress 1.6.4 bundle is
`.github/site/node_modules/vitepress/dist/node/chunk-D3CUZ4fa.js`, SHA-256
`07d45c356e7c850c2454904949f4b0b95c1d4a2d92119cbdaf4d419ae20dde98`.

- Lines 36792–36803: `inferTitle` parses string frontmatter titles with
  `md.parseInline` and calls `resolveTitleFromToken` without HTML or escaping.
- Lines 17612–17631: the resolver retains text, emoji and inline-code token
  content, excludes permalink symbols and trims the result. Code delimiters
  are syntax and are absent from the inline-code token content.
- Lines 36710–36711: that resolved title populates page data.
- Lines 17350–17369: `createTitle` applies the existing site-title template.

This establishes the mechanism without executing an altered reading. It is not
safe to generalise this into removal of every backtick from arbitrary titles.

## Complete impact census

`census.json` records all 39 source frontmatter strings, original expected titles,
actual decoded title elements and HTML hashes. Appendix F alone differs. Each
other page has exactly the title already expected. This is observation of saved
SITE02 bytes, not a validator pass or acceptance of a revised gate.

`navigation-impact.json` records every link to Appendix F in all 39 outputs.
Its sidebar label remains the literal backtick-delimited label F. \`tecvol\`. Browser-title normalisation
does not apply to that separately configured sidebar text. No navigation reading
change is proposed. Validation originally stopped before links, sidebars, pagers
or fences, so their acceptance has not been established by SITE02.

## Controls proposed, not executed

After an explicit gate-reference decision, update the synthetic scaffold to use
the new single title value, then rerun all existing 40 controls and receipt-reuse
refusal. Preserve their current negative categories and literal code payloads.
Add or identify these focused cases:

- Positive: exact decoded browser title `F. tecvol | Debug80 Docs` with unchanged
  literal-backtick sidebar label and unchanged source H1 permalink contract.
- Positive: an ordinary title from the other 38 pages remains exact.
- Negative: browser title retains the code backticks.
- Negative: browser title loses `tecvol`, changes case or changes the suffix.
- Negative: duplicate or absent browser title remains rejected.
- Negative: sidebar label is changed to match the browser title.
- Negative: a literal backtick in a code fence is removed; fence equality must
  still reject it. No title transform may reach code data.

Synthetic controls establish checker behaviour only. They cannot turn the saved
failed invocation into a pass or replace a new allocated actual run.

## Decision required

May the KS47 site gate reference be changed after the actual SITE02 failure to
use the resolved inline-Markdown browser title above, with exactly one title
value changed and all other checks and limits preserved? The decision must name
its Origo reference before this reading is activated or executed. Retain SITE02
as the failed result under its original reading regardless of that decision.
