# Writing the TEC-OS book

This guide is for the people writing and revising the book's chapters. The book
has one job: to take a reader from the first prompt to a working understanding
of TEC-OS, with every statement supported by its source or recorded evidence.
The independently closed replacement outline in
`reader-rewrite/replacement-outline.md` controls the new teaching sequence. Its
KD-243 amendment plans the opening at 40 columns with TEC Compact. That profile
still needs an adopted source and qualified workflow. No existing chapter or
historical capture qualifies it by analogy.

## Truth

**Each chapter names its commit.** Under its title a chapter carries an HTML
comment, `<!-- Checked against TEC-OS <commit>. -->`, with the short hash of
the commit whose code the chapter's claims were checked against and the build
of any file from outside the repository that its examples depend on, such as
the starter card's `TED.COM` or `TAS.COM`. The comment is for the people
revising the book. A reader never sees it. A revision that rechecks the chapter
against a later commit changes the comment. A source-only pass keeps the
capture's original commit. If only some citations are revised, a separate
comment names the source revision and the resolution ledger that identifies
those citations. It does not certify the remaining claims, measurements or
captures. A rewrite draft may name one inspected source for mechanisms while
retaining separately labelled historical captures and measurements. Do not give
it a whole-chapter checked-at declaration that merges those kinds of evidence.

**The code is the authority.** Every number, address, message, file name and
behaviour in a chapter is checked against the source at the named commit, not
against the documents in `docs/` or an earlier book. The documents show where
to look and they are sometimes out of date. Measured results retain their
actual run and configuration. A stale source document cannot replace that
evidence. Record an unsupported claim or discrepancy for disposition rather
than silently deleting assigned material or substituting a convenient number. A
claim of common knowledge, such as CP/M's history, is kept to what a reference
on CP/M would state, and the writer keeps its uncertainty and scope: "most",
"about" and "on the model" stay where they are true.

**Examples are real.** Each example of TEC-OS's output was produced by a run,
on the host model or on the web page, from the named commit, and is copied into
the chapter unchanged. `tools/capture.mjs` produces it from the host model:

```sh
npm run build && npm run media
node tools/capture.mjs DIR "TYPE A:SAMPLE.ASM"
node tools/capture.mjs --board pico --screen CON
node tools/capture.mjs --card none --lcd H
```

The script's header lists its options (the board, card, ROM and LCD, screen or
serial output) and its special lines (a control key, a key to stop a program, a
program that runs until a key, a pause and the reset button). Its clock starts
at 1 November 2026, 12:00. With the same source, inputs and configuration, that
fixed clock removes date-dependent differences. At the inspected `ea3ef3d`
source the script prints the card's SHA-256 on stderr
(`tools/capture.mjs:67-72`). Retain the application pins and hashes separately.
A text-screen decoder does not qualify font pixels or reverse presentation.
Full-screen TED work needs its actual editor/key path and persisted source
readback.

These are reproduction command forms, not a new run or an allocation. Check the
exact script at the adopted source. Any guarded execution still needs its
allocation. Keep the unrun offer-17 80-column packet intact. The new opening
requires the adopted 40-column font/default source and a separate qualified
SAMPLE and authored-banner workflow.

A program in an example is assembled on the model by the starter card's `TAS`,
and the transcript shows `TAS`'s own output. The exception is a program a
chapter builds on the PC, where its header names ATOM's version. The production
ROM build described at `ea3ef3d` uses pinned TAS by default with an explicit
ATOM reference backend. Chapter 26 describes the setup and selection. This
record of the product build does not select a tool or authorise a new run.

**Each example names its run.** The capture command for an example is given in
the sentence that introduces it, or in an HTML comment on the line before the
example, `<!-- node tools/capture.mjs ... -->`. A transcript may start at the
prompt where its first command is typed, leaving out the boot before it. When
it leaves out anything else, such as lines between two commands, the text says
what is missing.

**Part II cites the source.** In Part II each claim about the code carries a
reference to the file and line it rests on, as `src/boot.asm:22`, at the named
commit. Part I names files where a reader would want them, without line
numbers.

## The reader and the route

The reader is technically interested but may never have used CP/M or the
TEC-1G. State the prepared machine before the first command. Chapter 1 builds
and runs supplied SAMPLE. Chapter 2 is a guided copy-and-change banner with
local explanations, not an assembly-language course. From Chapter 8, state the
prerequisite of reading a short Z80 listing and establish each call, register,
stack and buffer contract before an example depends on it. Each term is
explained where it is first used in the sentence that uses it or the one
before: *warm boot*, *TPA*, *IOBYTE*, *FCB*, *volume*, *driver*. A later
chapter may use a term without explaining it again, and it names the chapter
that explained it when the reader may have skipped there.

**Point of view.** The book addresses the reader as *you*, for what the reader
types, sees and decides. It doesn't use *we*. The writer stays out of the text.

**Motivation, then mechanism.** A section starts from something the reader
wants to do or has just seen and then explains the mechanism behind it. Each
section rests on what earlier sections explained. The text reads as a guide and
a reader going through the subject together: each paragraph leads into the next
and connected explanation is preferred to a run of separate correct statements.

**Openings and endings.** A chapter begins with its subject and the reader's
route through it, in a sentence or two, and then starts on the subject. It ends
on its last substantive point, with no recap of what it said and no forecast of
the next chapter. A forward reference is kept when it gives the reader a useful
expectation, written as "Chapter 18 explains the cache", never as a topic
arriving or waiting.

## Sentences

Plain, direct sentences in the active voice, each carrying a fact, a step or a
connection the reader needs. Long sentences are fine when the thought needs
them, and so are short ones. Neither is a quota.

**The deletion test.** The writer reads each sentence in order, removes it in
thought and rereads the paragraph without it and across into the next one. A
sentence whose removal loses nothing is deleted. It isn't rewritten, since a
rewritten empty sentence is usually a longer empty sentence. A sentence stays
when its removal loses a fact, a step, a distinction, the antecedent of a later
*it* or *this*, or the bridge into the next paragraph. The same test applies to
a paragraph within its section and a section within the chapter. After the cuts
the writer reads the whole chapter again in order and repairs broken
transitions. Where the sentence-level test and that read-back disagree, the
read-back wins.

**`Is` and `has`.** A thing *is* or *has* something. It doesn't *serve as*,
*stand as*, *function as*, *feature* or *offer* it.

**Human action and program operation.** Only people have perception, memory,
judgement, desire, emotion, moral standing and social intentions, and only
people act on themselves. TEC-OS, the ROM, a program, a driver, a file, a card,
the book and its chapters have none of these, not even as a figure of speech or
a familiar shorthand. So none of them knows, believes, understands, thinks,
remembers, notices, wonders, decides, chooses, cares, wants, wishes, prefers,
hopes, expects, agrees, deserves, owes, demands, forgives, asks, promises,
tells, teaches, learns, tries, sees, faces, offers, declines, earns, observes,
forgets, refuses or gives way. Something *owns* a resource only where the code
defines the ownership, as a service's pages are recorded against it. For a
person, name the person: *you* or *the programmer*. For a mechanism, use the
verb for what it does: TEC-OS *reads*, *writes*, *stores*, *checks*, *tests*,
*compares*, *selects*, *copies*, *reports*, *rejects*, *requires*, *calls* and
*waits*. "The loader refuses the file" becomes "the load fails" or "the loader
rejects the file". "TEC-OS remembers the drive" becomes "TEC-OS stores the
drive at `0004h`".

**Operation idioms.** Verbs that name a real mechanism stay: the CCP *waits
for* a line, a byte *arrives* at the serial port, a driver *takes* the console.
A borderline phrase is tested in both directions: when the literal replacement
is stranger or less exact and the phrase gives the artifact no mind, the phrase
stays.

**The book's own verbs.** A chapter may *say*, *state*, *explain*, *describe*
or *list*. It doesn't *want*, *look at* or *discuss itself*, and topics don't
*move*, *arrive* or *wait* in the book.

**Positive statements.** Say what is the case: "the history holds 256 bytes",
not "the history is not unlimited". A negative stays when it is the fact a
reader needs: a prohibition ("never change a card on a PC while the TEC-1G is
using it"), a correction of a likely mistake, a contrast between two real
alternatives, or an exact state (`NO FILE`). Softened negatives, such as
*rather than*, *instead of*, *without* and *no longer*, get the same test.

**No praise, no scene-setting.** No *powerful*, *elegant*, *seamless*,
*robust*, *simply*, *just*, *crucial*, *key*, *significant*, *honest* or
*honestly*, and no "it is worth noting" or "not just X but Y". No clause added
after a comma to say that something matters. State the property: "the copy puts
the latch and the interrupt state back as they were" says more than "the copy
is safe".

**Hollow landings.** A sentence that begins *This*, *That* or *It* at the end
of a paragraph, and only restates or admires what came before ("This shows how
compact TEC-OS is"), is deleted.

**No staged questions.** A question the text asks only to answer it in the next
sentence is replaced by the answer.

**Named sources.** No "it is often said", "many users find" or "it is generally
agreed". A claim names its source or it is a claim the writer checked.

**Explanation instead of commands.** Teaching prose says what an action does,
why it is done and what the reader sees after it: "`DIR` lists the visible
files in the current user area on the selected drive." Literal commands in code
blocks, the steps of a procedure and short safety warnings stay as commands.
Attention directions such as *Notice*, *Look closely* and *Keep in mind* are
left out; the detail goes in the sentence itself.

**Figures of speech** earn their place only when the reader reuses their
structure. If the literal half of a sentence carries the whole meaning, the
figure goes.

**Punctuation.** Use Australian English. Do not add an Oxford comma or an
automatic comma before a conjunction. Read every remaining comma for its
meaning. Authorial prose uses no semicolon or em dash. Preserve punctuation in
literal syntax, quotations and output. No bold inside running prose except for
a term at its definition in a reference list.

## Structure

Headings are noun phrases: "The first prompt", "Drives and memory". A heading
is never a clause of the form "What X does" or "How X works". A question
heading is allowed only when it is a real question with a question mark and the
section answers it.

Prose carries arguments and explanations. Lists and tables are for material
that has the shape of a list: a set of commands, a table of addresses, the
controls of the web page, the steps of a procedure. A paragraph has one job.

## Conventions

- Hexadecimal numbers have a trailing `h`, as `0100h`. Sizes in bytes are
decimal, with a comma in thousands, as `1,024`. KiB and MiB are powers of two.
- Times are in T-states, the Z80's clock cycles. At the TEC-1G's 4 MHz,
4,000,000 T-states is one second.
- Control keys are written with a caret: `^C` is Ctrl and C together.
- A transcript shows the prompt and what the reader types on one line, and
TEC-OS's output after it, exactly as captured, in a `text` block. Commands for
a PC's shell go in an `sh` block, and Z80 source in an `asm` block.
- File names in the text are as TEC-OS shows them, in capitals: `SAMPLE.ASM`,
`GLCD.SVC`.

## What the book leaves out

The book describes the product as it is at each chapter's commit. It gives no
account of how TEC-OS was developed: no internal plans, no work records and no
numbering from them. History belongs in the book only where it explains the
product as it is, such as the reason an old card's `.DRV` files no longer load.
The book never mentions the tools used to write it.

## Writing a chapter

Drafting and editing are separate passes. The writer first checks the chapter's
new or changed examples through their actual allocated workflow before drafting
explanations around their results. Unchanged historical evidence may be
retained with its actual pin and a recorded disposition. A source-only check
never becomes a rerun. The writer then drafts generously, with motivation,
worked examples and transitions, and doesn't line-edit while drafting. Then, in
order:

1. A search of the draft for the patterns above: mind verbs with a
   non-human subject, *serves as* and its kin, the praise words, *honest*,
   staged questions, attention directions, fused-relative headings and
   topics that move through the book. Each hit is resolved by rewording or
   kept on purpose.
2. A reading, paragraph by paragraph, that keeps each paragraph only if it
   moves the reader on or lets them use what they have.
3. The deletion test, sentence by sentence, in order.
4. An agency pass and a separate reading of every comma and other authorial
   punctuation. Then read the complete chapter in reader order and repair
   transitions or prerequisites that the cuts broke.
5. A check of every claim, number, message and example against the named
   commit, and the search of step 1 again.

Before the chapter is handed in, the writer answers these questions from the
text:

- Does the opening state the subject and the route without a generic preview?
- Does each section use only terms and ideas already explained?
- Is every claim checked against the named commit, and every example captured
from a run whose command is given?
- Does every Part II claim about the code carry a file and line?
- Does any sentence give a program, a file or the book a mind or a wish?
- Did any edit weaken a condition, an exception, a prohibition or an
uncertainty?
- Does each paragraph have one job, and is each heading a noun phrase?
- Does the ending land on a substantive point?

The pass record identifies the actual complete reading, each craft pass, source
checks, literal preservation, independent findings and dispositions. Counts of
ranges, valid coordinates or gate hits do not establish teaching quality.
Independent editorial and factual review must close before final acceptance.
Validate final paths and anchors after integration, then read the whole book in
its new order. Keep publication outside KS47.
