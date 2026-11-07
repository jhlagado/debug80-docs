# Main landing and publication proposal

KD-251 accepts C18 on the prepared branch. Main delivery is still outstanding.
I recommend deferring the main push until C16's final qualified-source updates
are accepted, then making one explicitly authorised fast-forward publication
from a freshly frozen and reviewed delivery commit. No accepted reader text,
workflow or evidence is changed by this proposal.

## Frozen comparison

Remote main is `4d830dc77f8dacc7c610794e8f0b528237b66fee`. The accepted
branch snapshot is `1ed7e508996f7e27e50d853833238559fb95915f`, whose merge
base with main is exactly main. Main is therefore its ancestor. The candidate
adds 363 commits. A fast-forward would preserve them all.

This comparison freezes the accepted snapshot before these proposal records.
Any later delivery tip must receive its own exact inventory, including these
records and any C16 changes. A new main tip also requires a fresh ancestry and
delta review. No force push, squash, cherry-pick or history rewrite is proposed.

| Net tracked delta | Paths |
| --- | ---: |
| Reader files directly under tec-os | 65 |
| Reader-rewrite evidence and tooling | 560 |
| Other TEC-OS editorial records and tools | 14 |
| Generated TEC-OS sidebar | 1 |
| Total | 640 |

There are 600 additions, 26 deletions and 14 modifications without rename
inference. Every path, old/new Git blob, mode and size is recorded in
full-branch-inventory.json. The only non-TEC-OS path is
.vitepress/sidebar.generated.js. All non-TEC-OS sidebar sections are unchanged.
No other book, product source, workflow, package manifest, lockfile, global
configuration, theme, public asset or citation-guide copy has a net change.

The full branch includes required source-consistency preparation, citation
resolutions, reading/outline/crosswalk records, drafts, independent reviews,
actual workflow evidence, failed site attempts, observer controls and the
successful SITE04 archive. Four new retained archives total 137,668,881 bytes.
The largest is the complete SITE04 archive at 63,663,283 bytes. They are already
pushed. A normal fast-forward includes these blobs and their history. They are
not silently removed, replaced by summaries or treated as publication assets.
The existing tec-os/editorial exclusion keeps their Markdown out of VitePress
page rendering, while the repository still carries them.

## Reader, citation and navigation delta

The old 37 readers become 39: index, 28 chapters and ten appendices. There are
26 removed paths, 28 added paths and 11 revised paths shared by both versions.
reader-delta.patch contains the complete literal source delta.
reader-citation-delta.json binds both reader inventories, front matter,
provenance lines and literal file:line occurrences to exact source hashes.
That occurrence inventory is not a new semantic or continuation-range audit.
The accepted factual/citation reviews remain the basis for those claims.

The current mechanism authority remains TEC-OS 962853f. The practical opening
uses the qualified 8b8664a evidence. Historical captures, measurements, maps and
recipes keep their declared actual pins. The rewrite does not claim that every
example was freshly executed at one global source revision. SITE04 validates
rendering and sealed inputs, not a replacement factual audit.

The sidebar changes from groups of 12, 15 and nine entries to four groups:
Using the machine (seven), Writing programs (six), Inside TEC-OS (15) and
Reference (ten). It keeps 38 sidebar entries because the index is unlisted.
The exact labels, order and URLs are in sidebar.diff and navigation-config.json.

The 26 removed chapter URLs receive no redirects in the accepted snapshot.
The retained integration review found no tracked outside references other
than the updated sidebar. Unknown external bookmarks can still break. The
complete removed/added URL lists are in reader-citation-delta.json. If legacy
URL redirects are required for publication, that needs an explicit additional
source change and review. They are not silently added here.

The index retains nav_exclude. This does not make the book private: global
local search and sitemap settings do not exclude TEC-OS. The unchanged global
nav has no TEC-OS shelf entry. Publishing remains an outward publication even
when the index stays off that shelf.

## Production CI differs from SITE04

The workflow deploy.yml is unchanged. A push to main or workflow_dispatch
starts its build and deploy path. It installs the locked site dependencies
with npm ci under .github/site, links root node_modules, regenerates all
sidebars, checks repository-wide Markdown links and checks symbols in three
other book series. The Debug80 claims step downgrades failure to a warning.
It then builds the full VitePress site, checks both llms.txt copies against
the full output, uploads .vitepress/dist and deploys GitHub Pages.

CI uses ubuntu-latest and Node 20, with the exact patch version selected by
setup-node. SITE04 used pinned Node 24.18.0 on macOS and its exact 4,454-entry
dependency tree. The lockfile and VitePress 1.6.4 pin are unchanged, but Linux
optional binaries and the runtime/platform differ. Root Git-based compiler
dependencies are intentionally absent from CI. CI does not assemble examples.

SITE04 used a sealed private config that excluded all other Markdown readers,
set two build workers and disabled minification. The committed production
config still builds the whole corpus with framework defaults. It does not
contain that private concurrency/minification delta. site04-private-config.diff
retains the exact tested difference. No such config change is proposed for main.

The CI workflow has no mem-guard invocation, explicit Node heap limit,
180-second bound or invocation of the exact SITE04 HTML checker. Its link
script scans editorial Markdown too and strips fragment targets. Its symbol
script does not inspect TEC-OS. These steps are not the same predicates as
SITE04's exact 39-reader title/H1/link/fragment/sidebar/pager/fence checks.
The llms guide requires other series, not TEC-OS, and remains unchanged.

SITE04 is actual proof of its scoped production renderer/checker result. It
is not proof that this full Ubuntu/Node 20 CI workflow passes, nor browser,
visual-layout or deployment proof. No CI job or workflow dispatch is run by
this proposal. No remote environment approval settings were inspected, so
a hidden deployment pause is not assumed. ci-comparison.json records each
step, dependency boundary and source identity.

## C16 coupling and smallest complete landing

C18 acceptance stays closed on its declared source basis. C16 separately
requires the final qualified P3 input/handoff work. Its old source-only
preparation is retained as history, not a declaration of the future final pin.
Before publication, freeze that qualified offer and review its impact against
962853f and each historical evidence pin. Resolve changed citation coordinates
and substantive claims, toolchain/setup instructions, compact SAMPLE/media
figures, palette/configuration claims and any changed runtime workflows.
Only affected checked-at assertions receive new evidence. No wholesale
repinning or transcript replacement follows from a formatting-only change.

Any new product execution, capture, build or validation needed by C16 requires
its own allocation. Obtain independent factual acceptance of the actual final
changes. If reader/config/dependency/checker inputs then differ from SITE04,
freeze that new delivery packet and determine the required fresh validation
and allocation. Unchanged controls are not automatically replayed.

The smallest complete landing shape is one fast-forward of the complete
reviewed branch, with its proof history, after those final-input obligations
and the publication decision. It needs no source-only main commit, temporary
workflow disabling, duplicate reader copy or evidence pruning. A source-only
main landing today would need a separately reviewed workflow/deployment-policy
change to prevent publication. That is a larger scope and is not proposed.

For clarity, the exact currently frozen outward action would be:

```text
git push origin 1ed7e508996f7e27e50d853833238559fb95915f:refs/heads/main
```

Do not execute that command under this proposal. It would fast-forward main
and trigger the full CI/Pages publication path. I recommend waiting for C16,
then replacing that snapshot with the exact newly reviewed delivery commit
and obtaining explicit authority for that push and automatic publication.
The required action is not merely accepting C18 or pushing this proposal branch.

After an authorised push, retain the actual CI and Pages outcomes. Failure
must remain recorded; it does not authorise a retry, force push or further
publication. C18 acceptance, C16 closure, main delivery and publication keep
separate dispositions. Main delivery and publication are outstanding now.
