# TEC-OS book: check of the editorial pass on the appendices and contents page

Compared: `61372b1` against `origin/tec-os-book` (`c4c98fe`), for
`tec-os/appendix-a-bdos-functions.md` to `tec-os/appendix-g-tec-1g.md` and
`tec-os/index.md`. Line numbers are those of `origin/tec-os-book`. Where a fact
needed settling, the code was read at the commit each file's head names: A and C
at `08da4d6`, B and D at `bd15528`, E, F and G at `98c6416`.

No matter of `.DRV` against `.SVC`, or of A against D on functions 13, 21, 23 and
32, is reported here.

## Findings

### 1. Appendix E, lines 266-268: a condition lost, clause detached from its subject

Before:

> On any other card each mounted drive gets a vector sized for its volume, `DSM
> / 8 + 1` bytes: 256 for G8M and 64 for G1M, and a drive with no volume gets
> none.

After:

> On any other card each mounted drive gets a vector sized for its volume,
> `DSM / 8 + 1` bytes: 256 for G8M and 64 for G1M. A drive with no volume gets
> none.

Why it is wrong: the clause belonged to "On any other card". As its own sentence
it carries no condition, and it contradicts the sentence before: on a 1.1 card
that gives N drives, "each of drives A to the Nth gets 256 bytes ... whether or
not a volume is on it". At `98c6416`, `ALVINIT` (`src/vol.asm:503-563`) gives 256
bytes to every drive below `MNTDRV`, mounted or not, and takes the `ALV10` path
that skips an unmounted drive only when `MNTDRV` is 0.

Fix: restore the single sentence, or keep the break and restore the condition:

> On any other card each mounted drive gets a vector sized for its volume,
> `DSM / 8 + 1` bytes: 256 for G8M and 64 for G1M. On such a card a drive with no
> volume gets none.

### 2. Appendix A, lines 46-50: a citation moved off its claim

Before:

> - `Bdos Err On d: Bad Sector`, for a record or a directory record that won't
>   write, which includes every write to a volume the card marks read-only, a
>   record of a file that won't read, and a block number past the end of the
>   volume (`src/cpm/bdos.asm:2319-2329`, `src/cpm/bdos.asm:2426-2429`).

After:

> - `Bdos Err On d: Bad Sector`, for a record or a directory record that can't
>   be written, a record of a file that can't be read or a block number past the
>   end of the volume. A failed write includes every write to a volume the card
>   marks read-only (`src/cpm/bdos.asm:2319-2329`,
>   `src/cpm/bdos.asm:2426-2429`).

Why it is wrong: `src/cpm/bdos.asm:2319-2329` at `08da4d6` is `CHKBLK`, the check
of a block number against `DSM`, and `2426-2429` is `BADSECT`, the message. They
support the list of causes. The edit leaves that list uncited and hangs both
citations on the sentence about a read-only volume, which neither supports.
`CHKBLK` has nothing to do with the card's read-only flag.

Fix: put the citations back on the list:

> - `Bdos Err On d: Bad Sector`, for a record or a directory record that can't
>   be written, a record of a file that can't be read or a block number past the
>   end of the volume (`src/cpm/bdos.asm:2319-2329`,
>   `src/cpm/bdos.asm:2426-2429`). A failed write includes every write to a
>   volume the card marks read-only.

### 3. Appendix B, lines 267-269: a citation moved off its claim

Before:

> Each entry assumes the caller holds the claim, checks nothing, and changes
> `AF`, `BC`, `DE` and `HL`; a count of 0 moves nothing
> (`drivers/pico.asm:164-199`, `src/abi.inc:48-54`).

After:

> The caller must hold the claim. Each entry checks nothing and changes `AF`,
> `BC`, `DE` and `HL`. A count of 0 moves nothing (`drivers/pico.asm:164-199`,
> `src/abi.inc:48-54`).

Why it is wrong: at `bd15528` the comment at `src/abi.inc:48-50` says that each
entry assumes the caller holds the claim and destroys `AF`, `BC`, `DE` and `HL`.
It says nothing about a count of 0, which is in the comment at
`drivers/pico.asm:164-166`. The split leaves the claim and the register list
uncited and ends with `abi.inc` on the one sentence it doesn't support.

Fix: put the citations with what they support:

> Each entry assumes that the caller holds the claim, checks nothing and changes
> `AF`, `BC`, `DE` and `HL` (`src/abi.inc:48-50`). A count of 0 moves nothing
> (`drivers/pico.asm:164-199`).

The original pair of citations in one sentence is equally correct:

> Each entry assumes the caller holds the claim, checks nothing and changes `AF`,
> `BC`, `DE` and `HL`, and a count of 0 moves nothing
> (`drivers/pico.asm:164-199`, `src/abi.inc:48-54`).

### 4. Appendix D, lines 15-17: a statement that is false of one table

Before:

> The last column of each table links to the chapter that explains the message
> or its subject and gives the source.

After:

> The `See` column of each table links to the chapter that explains the message
> or its subject and gives the source.

Why it is wrong: the table of container codes at line 76 has the columns `Code`,
`Cause` and `Constant`, with no `See` column. The other eight tables have one.
"The last column" named a column every table has, though `Constant` gives the
source with no chapter link. "The `See` column of each table" names one that
table lacks.

Fix: restore "The last column of each table", or be exact:

> The last column of each table gives the source, and the `See` column also links
> to the chapter that explains the message or its subject.

## Checked and clear

- **Numbers, registers, status codes, code tokens.** The multiset of backticked
  tokens and of numbers is unchanged in A, B and G and in the prose of C. In D,
  E and F every difference was read in a word diff, and none changes a value.
  Line 64 and line 90 of D write code `20h` where the text had `20`; the value is
  the same, the text already wrote `20h` to `2Ah`, and the table and the
  transcript keep the printed `20`.
- **Appendix D's messages.** Every message in every table and in the prose is byte
  for byte. The only table row that changed is the `File R/O` row, in its cause
  text alone.
- **Tables, lists, code blocks, headings.** All rows are present in every
  appendix: A 7, B 57, C 141, D 80, E 57, G 22. All code fences are identical,
  including every transcript and the swapped-card script. Headings are identical.
  In E, the rename to "allocation block" covers the disk parameter table and its
  prose. The 512-byte "block" stays where it should, in the `Blocks` column, the
  geometry table's word, and "four records share a block". Line 119 of F is right
  at 512 of 2 KiB.
- **Edits that needed the code.**
  - C, EXPAND 1: "one that ends with it switched in" matches `WBOOTR`'s comment at
    `src/boot.asm`.
  - C, line for `WSBASE`: "the part ends at `BF00h`" fixes the pronoun correctly.
  - D: the ROM's `MOUNT` routine is the label at `src/vol.asm:22`. The "`MOUNT`
    program" is `test/programs/mount.asm`.
  - B, ABISVC: "no service can be removed while the program runs" settles a
    pronoun as Chapter 10's "Keeping a pointer" does.
  - B, ABIGLCD: six routines, one page routine and a last word make the eight, and
    "the seventh" still means the page routine.
  - G, port `00h`: the deleted "The value is thrown away at once" remains in the
    table, line 27, "Read and discarded".
  - G, bit 7: "Read by the serial routines" fits the three cited lines.
  - A, function 47: `src/cpm/bdos.asm:46-71` includes the comment that the CCP runs
    the command next, so the citation still holds after the split.
- **Pronouns and clause attachment.** Every sentence split in the eight files was
  read for what its first word refers to. Findings 1 to 3 are the only faults of
  this kind.
- **index.md links.** All 26 chapters and all 7 appendices appear, once each, with
  a link to a file that exists. No file in the book links to an anchor of
  `index.md`, so the renamed section "Examples and sources" breaks nothing.
- **index.md descriptions.** Each of the 33 entries was compared with that file's
  headings and opening, and the order claims ("then", "ends with") hold. These
  were checked in the text:
  - Chapter 4: the order of sections.
  - Chapter 6: the first program is assembled on the PC and again on the board,
    and `SHOW` prints the named file.
  - Chapter 8: `ANSI` is the code's word, at `src/term.asm:9`, though the chapter
    says "escape sequences".
  - Chapter 9: "most with a program of their own".
  - Chapter 10: the count and its cost.
  - Chapter 13: the allocation vectors at cold boot, as line 159 says.
  - Chapter 14: "first instruction at `0000h`".
  - Chapter 19: the flush at warm boot.
  - Chapter 20: all nine services in "The routines".
  - Chapter 22: the flag bit.
  - Chapter 26: its keyboards, "Typing goes to the board two ways".

Two changes in `index.md` are recorded as not being faults. The per-entry
"Sources" lists and the note on planned entries are gone, which is the commit's
stated intent and takes no fact about TEC-OS with it, since each chapter cites its
own sources. "What the code expects of one" became "what the code requires of
one", a change of emphasis with no fact behind it.

## Counts

- Files checked: 8 (7 appendices and `index.md`).
- Findings: 4.
  - Condition lost, clause detached from its subject: 1 (E).
  - Citation moved off its claim: 2 (A, B).
  - Statement false of one table: 1 (D).
- Pronoun left pointing at the wrong thing: 0.
- Facts, numbers, status codes or message text changed: 0.
- Tables or lists damaged: 0.
- `index.md` descriptions wrong: 0. Missing or broken links: 0.
- Files with no finding: 4 (C, F, G, `index.md`).
