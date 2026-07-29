# debug80-docs

**The books are meant to be read at [debug80.com](https://debug80.com/).**

This repository is the source. It holds the markdown, the generated figures and
the site theme; the site itself is what those become. If you have arrived here
looking for the documentation, follow the link — the published pages have
working navigation, search and cross-references, and none of that survives
reading the markdown on GitHub.

## What is documented here

Four Z80 things, and the machine they run on.

**Debug80** is a VS Code extension: source-level debugging for Z80 assembly,
with an emulated TEC-1 or TEC-1G in the sidebar and a path out to real hardware
over serial.

**AZM** is the assembler underneath it — a Z80 assembler with layout types,
register-contract analysis and op declarations on top of the ordinary
directives.

**Glimmer** is a reactive language for writing games. You declare what the game
remembers and how it responds; Glimmer generates the loop, the input polling
and the change tracking, and compiles to readable Z80 assembly.

**The TEC-1G** is the single-board computer all of it targets.

## The books

| | |
|---|---|
| [Debug80 Book 1 — Getting started](https://debug80.com/debug80-book/book1/) | Installation through to stepping code and sending HEX to a board. |
| [AZM Book 1 — Assembler Manual](https://debug80.com/azm-book/book1/) | The reference: syntax, directives, expressions, layouts, contracts. |
| [AZM Book 2 — Z80 Fundamentals](https://debug80.com/azm-book/book2/) | The Z80 from the bare machine up, assuming nothing. |
| [AZM Book 3 — Algorithms and Data Structures](https://debug80.com/azm-book/book3/) | Sorting, strings, records, recursion and a backtracking capstone. |
| [Glimmer Book 1 — Reactive Programming for Z80 Games](https://debug80.com/glimmer-book/book1/) | The language and reactive model, developed through focused programs. |
| [Glimmer Book 2 — Building Complete Z80 Games](https://debug80.com/glimmer-book/book2/) | Skyfall, Tetro and Rushlight across the matrix and TMS9918 displays. |
| [TEC-1G / MON-3](https://debug80.com/tec1g/) | Reference material for the machine and its monitor. |

## Working on it

Requires Node.js 20 or later.

```sh
npm ci
npm run dev
```

`npm run build` produces the static site into `.vitepress/dist`. Pushing to
`main` builds and publishes to GitHub Pages, which serves debug80.com.

### Checks

Five scripts guard things that are easy to get wrong and hard to notice. CI runs
them on every push.

| Command | Checks |
|---|---|
| `npm run links` | Every internal link resolves. |
| `npm run symbols` | Every symbol the prose names in backticks is one the code actually defines. AZM is case-sensitive, so `RenderTile` and `RENDER_TILE` are different symbols and only one of them exists. |
| `npm run verify:debug80` | Command names, panel labels and status strings quoted in Debug80 Book 1 match the extension source. Needs the extension checked out alongside this repo; skipped otherwise. |
| `npm run sidebar` | Regenerates the sidebars from front matter. Run after adding or renaming a page. |
| `npm run llms` | Confirms that the public citation guide contains the current books and URLs. |

### Figures

The panel diagrams are generated, not drawn. `npm run diagrams` rebuilds them
from `scripts/generate-book-diagrams.mjs` into
`assets/images/debug80-book/book1/`. They stand in for screenshots on purpose: a
screenshot goes stale the moment a label moves and costs a capture session to
replace, while a schematic is text and regenerates in a second. Edit the script,
not the SVGs.

## Layout

```text
debug80-book/     Debug80 Book 1
azm-book/         AZM Books 1-3, plus appendices shared between them
glimmer-book/     Glimmer Books 1-2, plus their shared reference
tec1g/            TEC-1G and MON-3 reference
assets/images/    Figures, most of them generated
scripts/          Diagram generator and the four checks
public/           Favicon, marks, CNAME
.vitepress/       Theme, sidebar generator, config
_internal/        Working notes and unpublished drafts; excluded from the build
```

Navigation comes from the front matter of each page — `title`, `nav_order`,
`parent` — rather than from a central file, so a new chapter appears in the
sidebar once `npm run sidebar` has run. A directory named `book*` is treated as
a standalone book and gets its own sidebar; any other subdirectory of a series
is shared reference and appears alongside each book in that series.
