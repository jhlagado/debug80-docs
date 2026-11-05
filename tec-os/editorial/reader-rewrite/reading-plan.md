# TEC-OS reader rewrite: reading and revision plan

## Authority and preservation

The rewrite branch is `tec-os-reader-rewrite`, based on accepted book main
`4d830dc` plus the factual source-consistency pass through `10821b6`.
`tec-os-source-consistency` and the unpublished `e102267` pass remain intact.
The canonical checkout remains on its unrelated diagnostics branch. This
work uses the separate TEC-OS documentation checkout.

The job is a complete structural and prose rewrite. The book should explain
TEC-OS to an intelligent person who wants to use a TEC-1G as a disk computer.
The voice is a knowledgeable guide: direct and connected, with the reason for
each action and its visible result. Australian English and light punctuation
apply throughout. Every comma is inspected during the final reading. Literal
commands, output, code and quotations keep their required punctuation.

The ordinary route begins with a TEC-1G whose ROM and card are ready: power
on, recognise the prompt, find files and drives, run an existing program and
then edit, build and run a small banner. A working console is the starting
condition. Optional changes of display follow ordinary use. Device names
follow the devices they identify. IOBYTE bits, BIOS paths, serial timing,
cache machinery, banks and the loader require a later thematic reason.

No startup script, software behaviour or device configuration is changed.
The possible removal of `GLCD.SVC` from startup is not an instruction. Any
product-design question is recorded separately from the book rewrite.
P4's methodology compendium remains deferred. Nothing is published or deployed.

## Complete reading order

The input is 37 files and 113,328 words at the frozen book base. Reading is in
this order: front door `index.md`, Chapters 01 through 27 in numeric order,
then Appendices A through I. `reading-ledger.json` lists every file, its hash
and its last completed heading. Only reaching the end of the entire file
permits a complete mark. A bounded read resumes at the recorded heading and
line. No search, heading inventory or synopsis substitutes for that read.

Each file's reverse outline records the job of each section and prose
paragraph, the purpose of examples and tables, introduced terms, assumed
knowledge, continuity failures and factual questions. Repeated material is
recorded before anything is removed. The current chapter order stays intact
during this reading stage.

## Outline checkpoint

After the complete read, the new theme ladder gives each proposed chapter:

- a single teaching job
- prerequisites established earlier
- an observable result for the reader
- the subjects justified by that job
- the existing material retained, deferred, moved or removed, with a reason
- the examples and source evidence needed before drafting

Front matter and the reference appendices are included. A crosswalk accounts
for every original section and its technical substance. Independent review
checks the outline for premature terminology, missing prerequisites,
misplaced detail, lost conditions and a disconnected reader route. Findings
are resolved and the reviewed checkpoint is committed before new chapter prose.

## Example and source preparation

The already verified TAS, palette and source facts are retained. Source
preparation at `fe2097f` is not a final checked pin. P3 reports correctness
qualification at `f732fec`; formatting may move the source and SAMPLE lines
again. The final offered source, application pins and actual generated
artifacts govern final citations and examples.

The banner example is prepared against the actual ROM, TED and TAS. Its
edit/save/build/run sequence must be executed and checked before prose is
drafted around it. Compute allocation is required for that execution. While
compute is held, source inspection and the example's validation specification
can proceed, but no output is invented and no unrun example is described as
verified. Existing historical captures retain their provenance until rerun.

## Bounded chapter workflow

Each chapter passes through a generous draft, mechanical gate, paragraph and
sentence deletion reading, agency and punctuation reading, journey read-back,
factual verification and a final gate. The paragraph's job must justify its
place. The journey read-back repairs connections damaged by deletion.
Necessary warmth and explanation are preserved rather than compressed into
fragments. The subject's ordinary name is repeated where identity matters.

Each bounded chapter has an editorial and factual result review before its
status is complete. Navigation, anchors, source references and the movement
crosswalk are checked with it. Progress is committed and pushed after each
durable slice. The complete revised book receives a final reader-order read,
including every comma, before acceptance. Runtime and build work use the
machine-wide guard only when allocated. Publication remains held.
