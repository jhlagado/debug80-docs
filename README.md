# debug80-docs

**The books are meant to be read at [debug80.com](https://debug80.com/).**

This repository is the source. It holds the markdown, the generated figures and
the site theme; the site itself is what those become. If you have arrived here
looking for the documentation, follow the link — the published pages have
working navigation, search and cross-references, and none of that survives
reading the markdown on GitHub.

## Projects documented here

Documentation for the development tools, languages and machines in these projects.

**Debug80** is a VS Code extension: source-level debugging for Z80 assembly,
with an emulated TEC-1 or TEC-1G in the sidebar and a path out to real hardware
over serial.

**AZM** is the assembler underneath it — a Z80 assembler with layout types,
register-contract analysis and op declarations on top of the ordinary
directives.

**Glimmer** is a reactive language for writing games. You declare what the game
remembers and how it responds; Glimmer generates the loop, the input polling
and the change tracking, and compiles to readable Z80 assembly.

**Atom** is a single-pass Z80 assembler whose native core is written in Z80.
Its desktop command runs that core in a Z80 emulator, while native
`ATOM.COM` runs it under CP/M 2.2.

**Basie** is a memory-safe, statically typed systems language for Z80 machines,
compiled to native code in a single pass by a compiler that runs under CP/M.
It replaces the earlier Nucleus project, whose pages are now in `archive/`.

**The TEC-1G** is the single-board computer at the centre of the current
Debug80, AZM and Glimmer material.

## The books

|                                                                                                |                                                                                     |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [Atom](https://debug80.com/atom/) | Node and CP/M guides, downloads and books. |
| [Atom Book 1 — Assembler Reference](https://debug80.com/atom-book/book1/) | Source language and reference tables. |
| [Atom Book 2 — Z80 Programming](https://debug80.com/atom-book/book2/) | The Z80 from first principles through algorithms, with instruction tables. |
| [Debug80 Book 1 — Getting started](https://debug80.com/debug80-book/book1/)                    | Installation through to stepping code and sending HEX to a board.                   |
| [AZM Book 1 — Assembler Manual](https://debug80.com/azm-book/book1/)                           | The reference: syntax, directives, expressions, layouts, contracts.                 |
| [AZM Book 2 — Z80 Fundamentals](https://debug80.com/azm-book/book2/)                           | The Z80 from the bare machine up, assuming nothing.                                 |
| [AZM Book 3 — Algorithms and Data Structures](https://debug80.com/azm-book/book3/)             | Sorting, strings, records, recursion and a backtracking capstone.                   |
| [Glimmer Book 1 — Reactive Programming for Z80 Games](https://debug80.com/glimmer-book/book1/) | The language and reactive model, developed through focused programs.                |
| [Glimmer Book 2 — Building Complete Z80 Games](https://debug80.com/glimmer-book/book2/)        | Skyfall, Tetro and Rushlight across the matrix and TMS9918 displays.                |
| [Basie](https://debug80.com/basie/) | The memory-safe Z80 language and its CP/M compiler. |
| [Programming Basie](https://debug80.com/basie/book1/) | Memory-safe Z80 programming on CP/M through complete, self-checking programs. |
| [TEC-1G / MON-3](https://debug80.com/tec1g/)                                                   | Reference material for the machine and its monitor.                                 |

## Skate course draft

[Programming Skate](skate/book1/index.md) is a learner's course in Scheme on
Z80 CP/M. The opening drafts and shared [CP/M primer](triptych/cpm/index.md)
are maintained here. The local editorial plan is in
`_internal/skate/book-plan.md`, excluded from the site and Git.

## Working on it

Requires Node.js 20 or later.

```sh
npm ci
npm run dev
```

`npm run build` produces the static site into `.vitepress/dist`. Pushing to
`main` builds and publishes to GitHub Pages, which serves debug80.com.

### Checks

These checks guard things that are easy to get wrong and hard to notice. CI
runs the repository-only checks on every push. Checks that need adjacent source
or locally linked packages run during the relevant editing workflow.

| Command                       | Checks                                                                                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run links`               | Every internal link resolves.                                                                                                                                                           |
| `npm run symbols`             | Every symbol the prose names in backticks is one the code actually defines. AZM is case-sensitive, so `RenderTile` and `RENDER_TILE` are different symbols and only one of them exists. |
| `npm run verify:debug80`      | Command names, panel labels and status strings quoted in Debug80 Book 1 match the extension source. Needs the extension checked out alongside this repo; skipped otherwise.             |
| `npm run verify:basie-book` | Compiles every Programming Basie example with the Basie reference compiler in `../basie` and runs it under a CP/M harness, checking assertions and console output. Needs Deno. |
| `npm run verify:atom-book` | Assembles the checked Atom examples through published `atom-z80`, executes the Book 2 programs and enforces uppercase assembly source. |
| `npm run sidebar`             | Regenerates the sidebars from front matter. Run after adding or renaming a page.                                                                                                        |
| `npm run llms`                | Confirms that the public citation guide contains the current books and URLs.                                                                                                            |

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
atom/             Atom landing page
atom-book/        Node and CP/M guides, language reference and Z80 programming
glimmer-book/     Glimmer Books 1-2, plus their shared reference
basie/            Programming Basie and its checked example sources
skate/            Programming Skate and companion source examples
triptych/         Triptych overview and shared CP/M introduction
archive/          Retired research material; excluded from the public build
tec1g/            TEC-1G and MON-3 reference
assets/images/    Figures, most of them generated
scripts/          Diagram generators, documentation checks and spec synchronisers
public/           Favicon, marks, CNAME
.vitepress/       Theme, sidebar generator, config
_internal/        Working notes and unpublished drafts; excluded from the build
```

Navigation comes from the front matter of each page — `title`, `nav_order`,
`parent` — rather than from a central file, so a new chapter appears in the
sidebar once `npm run sidebar` has run. A directory named `book*` is treated as
a standalone book and gets its own sidebar; any other subdirectory of a series
is shared reference and appears alongside each book in that series.

Atom reference pages retain their published URLs under `appendices/` but are
grouped with the guide or book named in their `parent` field. The Node guide
contains command and API references, Book 1 has the language tables and Book 2
has the Z80 tables.
