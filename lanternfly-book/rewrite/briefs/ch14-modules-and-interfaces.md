# Brief — Chapter 14: Modules and Interfaces

## Single job
Divide a program by responsibility: modules with private declarations and
explicit exports, composed by a whole-program build with one entry. The
chapter's payoff is enforcement — ch 11's occupancy invariant
becomes *enforceable* the moment the table is private and only the module's
routines can touch it.

## Prior knowledge
Ch 1–13 in one file each. Ch 4 taught routines as vocabulary; this chapter
scales the idea to published vocabulary.

## Data representation introduced
None new. The module boundary itself: private-by-default declarations,
`export` as the published surface, the import graph as a program's shape.

## Algorithm introduced
None new — the reading log's API, redrawn as an interface: `addReading`,
`entryCount`, `meanTemperature` exported; the table, count and helpers
private.

## Ordered themes
1. One file was getting crowded; responsibilities need borders. `import`
   loads a unit once; exports enter the importer unqualified; privates
   stay home (§12.1–12.3).
2. Private by default is the right default: the exported surface is the
   promise, everything else is changeable. The log table goes private and
   the occupancy invariant stops being discipline and becomes fact — no
   code outside the module *can* write `logCount` or a noise entry.
3. Interface design under the export check: an exported routine cannot
   expose a private type (`E-MODULE-002`, recursively). Two workable
   choices traced: export the `Reading` record too, or keep it private
   behind a scalar API — the chapter's example chooses the scalar API and
   says why (the record layout stays changeable).
4. Collisions and cycles: same-name visible exports collide
   (`E-MODULE-001`); import cycles are rejected with the path; diamond
   imports emit once.
5. The whole-program build (§12.5): one program, addresses allocated
   across all modules, helpers deduplicated — modules are borders for
   people, not for the linker.
6. Entry and builds (§12.6): the manifest names root and `main`;
   library builds have no entry; storage installed before entry;
   returning from `main` reaches the termination service (ch 1's frame,
   now with its machinery visible). Manifest format: Q1, stated as open.
7. Hosted bodies in one paragraph: the other compilation-unit form —
   local declarations plus statements, names from a host manifest, bare
   `return` to the host epilogue. Named, not taught; Glimmer's book owns
   it.

## Opening example
The import line and one call: `import "readinglog.lafy"` /
`addReading(11, 1, 2)` — using a module before seeing inside one.

## Companion program
`rewrite/examples/ch14-log-module.lf.txt` (two files marked inline:
`readinglog.lafy` and `main.lafy`).

## Hand trace
`main` appends (11,1,2°), (12,1,-3°), (13,1,5°) through the exported API;
`entryCount()` → 3; `meanTemperature()` → 1. A commented-out
`log[0].day = 9` in `main.lafy` marks the compile error privacy now
guarantees (`E-NAME-001`: unknown name — `log` is not visible).

## Memory / machine consequence
Module borders cost nothing at runtime: same statics, same calls, one
program. The visible change is in the artifacts — the symbol table groups
by module, and the startup-effect order follows the depth-first import
rule (§4.3).

## Explicitly deferred
Module aliases and re-exports (Deferred, §12.3/§16); source extension open
(`.lafy`, the settled extension); platform interface modules (ch 15 builds one).

## Open spec questions touched
Q1 (manifest format — prose says "the build names", shows no file).
