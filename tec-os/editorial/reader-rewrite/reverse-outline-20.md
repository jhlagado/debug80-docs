# Existing Chapter 20: reverse outline

Read completely at `10821b6`, including every command capture, the host-created
boundary fixtures and the complete ARGS source. The additional complete driver
reading of Chapter 3 in Origo `377abb9a` was also read. Its dispositions below
are input to the replacement outline, not acceptance of that outline.

## The CCP as a program in the ROM

The opening connects familiar BDOS calls to the CCP's special ROM placement and
program-launch role. That is a useful implementation question once launching
and the ordinary program interface have been taught.

- Paragraph 1 assigns the four source files, gives code bounds and identifies
  command/message tables. Preserve build-specific provenance for these figures.
- Paragraph 2 distinguishes persistent command/FCB storage from cleared scratch.
- Paragraph 3 traces DIR, TYPE and ERA into the compact DOSSEQ helper, including
  its inline encoded argument and adjusted return address.
- Paragraph 4 identifies direct workspace access and calls outside ordinary BDOS.
- The code-size mechanism belongs with implementation, not everyday commands.

## The entry from boot

- Paragraph 1 defines the packed drive/user byte and its boot lifetime.
- Paragraph 2 follows stack setup, optimised disk reset, restored user, one-time
  startup and final drive selection through CCPENT.
- Paragraph 3 explains the missing-drive error loop that the preliminary test
  prevents. The unmount/reset capture demonstrates fallback to A.
- Paragraph 4 distinguishes reset's preserved RAM selection from card defaults.
- Preserve the before/after ordering: an error before SAVEDU leaves the old byte.

## The prompt and the line's sources

- Paragraph 1 explains SAVEDU at every prompt and nonzero-user prompt formatting.
- Paragraph 2 orders remaining chain, startup and keyboard input, then defines
  source flags and the command buffer's count/maximum.
- Paragraph 3 defines piece extraction, capitalisation and return-code reset.
- The visible prompt/user behaviour belongs earlier; these state transitions
  belong here after the reader understands ordinary commands and chains.

## The command word and file names

- Paragraph 1 recognises a bare drive change and explains failed-selection recovery.
- Paragraph 2 parses the first word, retaining command/argument positions.
- Paragraph 3 explains built-in matching against original text, not a parsed FCB,
  and why A:DIR and DIR.COM select external programs.
- Paragraph 4 distinguishes SVC loading, quiet absent-device startup success and
  replacement of every other extension by COM.
- Paragraph 5 traces BADCMD, FF00h and the two prompt-return labels.
- Paragraph 6 explains complete FCB clearing, parser result position and drive/name
  fields. Its TYPE example demonstrates why stale sequential state is removed.
- Paragraph 7 gives delimiters, wildcard expansion, thirteen forbidden characters,
  overlong-field rejection and UNAMBIG callers.
- Preserve this exhaustive parser explanation here or in command reference; early
  command use needs a workable name, not the complete exclusion and padding rules.

## The built-in commands

- Opening paragraph and table locate all ten routines and loader calls.
- DIR paragraph 1 traces wildcard default, directory search, system-attribute
  filtering, first-extent uniqueness and width-dependent column formatting.
- DIR paragraph 2 derives free KiB through function 46 without changing drives.
- Pager paragraph traces defaults, row/column accounting, pause erasure and key
  handling, including the bit-cleared aliases and chain-drop distinction.
- TYPE paragraph traces record reads, Ctrl-Z/end-of-file and absent-file output.
- ERA paragraph explains confirmation accumulation and function 19.
- REN paragraph traces shared drive selection, collision protection and the new
  name's placement in the rename FCB.
- SAVE paragraph 1 explains decimal conversion and upper memory boundary; its
  capture tests both overflow and capacity rejection.
- SAVE paragraph 2 traces erase/make/write/close and preserves the failed-write
  close difference from Digital Research's implementation.
- USER paragraph gives the bounded argument and function 32.
- CON paragraph 1 traces name aliases, IOBYTE field, GLCD installation and reply.
- CON paragraph 2 defines width parsing, registry lookup, four rejection cases
  and quiet absent-device startup handling. The capture exercises those cases.
- CON paragraph 3 gives screen clearing and width's warm/cold lifetime.
- COPY paragraph traces normalised names, self-copy/trailing-text rejection,
  default DMA, hexadecimal count and closing partial output after failure.
- SERVICES/UNLOAD paragraph connects list formatting and removal to the loader.
- This is implementation reference with substantial overlap with Chapter 3.
  Crosswalk the operations separately; do not move either catalogue intact.

## Loading a program

- Paragraph 1 follows open, per-record DMA and the high-byte resident limit.
- Paragraph 2 explains the extra scratch-buffer read at the limit and the distinct
  missing/oversize outcomes, LOADTOP and close.
- Paragraph 3 derives file capacity versus byte-addressable TPA and loaded services.
- Paragraph 4 and shell commands construct RET/zero boundary programs and ARGS.
- Paragraph 5 and capture demonstrate exact-fit success versus one-byte overflow.
- Paragraph 6 distinguishes a BDOS read failure from loader-returned failure.
- Keep the generated fixture as reproducible capacity evidence, after host tools
  and memory boundaries are introduced. It is not a first-session exercise.

## The search order

- Paragraph 1 summarises the two-drive/two-user bound.
- Paragraph 2 traces LOADA, temporary user changes, restoration, oversize stopping
  the search and conditional fallback to A. The capture contrasts MOUNT/B:MOUNT.
- Paragraph 3 separates service lookup and demonstrates user-0 program search
  while DIR still lists current user 3.
- Separate the useful early fact that prepared tools run from A from exhaustive
  precedence, explicit-drive suppression and user-area rules introduced later.

## Page zero and the jump

- Paragraph 1 defines PREPPAGE's two argument FCBs, tail, case and default DMA.
- Paragraph 2 explains overlapping FCB/tail fields and write order.
- Paragraph 3 introduces ARGS. Its entire listing prints drive/name fields and a
  counted tail through a register-preserving output helper.
- The capture tests wildcard expansion, retained spaces, chain-piece boundaries
  and blank arguments. The following paragraph interprets all three cases.
- Final paragraph follows load-drive publication at 0050h, the inherited stack,
  pushed zero return, jump to 0100h and warm-boot prompt spacing.
- Keep the caller-visible argument contract with programming examples and the
  preparation mechanism here. Verify all sizes and limits at the final source pin.

## Required Chapter 3 dispositions in the forthcoming crosswalk

The driver reading adds no request to remove features. Assign distinct homes:

- Early prompt practice: typing, correction, cancellation and recall, before
  implementation of BDOS line input or advanced command syntax.
- Everyday files: DIR, useful names/wildcards, ordinary launch and visible return.
- Command reference: all thirteen excluded characters, star/question-mark padding
  and exact grammar, without requiring that reference before ordinary use.
- Attribute management/programming: system files, host switches and BDOS 30.
- Memory/programming/debugging: SAVE, 0100h, page counts and capacity fixtures.
- Organising work: user areas and full drive/user search precedence, after basic
  drive selection. Preserve service-search exceptions.
- Automation: chaining, return codes and conditional continuation.
- Recovery/protection: visible read-only failures with concrete actions; host-made
  demonstration fixtures in the reproducibility material taught after host tools.

These destinations remain provisional until the whole-book read is complete.
No replacement chapter text has been drafted and no runtime test was run.

Last heading read: Page zero and the jump. The read reached the final paragraph
on inherited stack, program termination and prompt spacing.
