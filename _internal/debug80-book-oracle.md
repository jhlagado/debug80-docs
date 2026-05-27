# Debug80 Book Oracle

This document defines the standard for the Debug80 user book series and the first volume, **Debug80 Book 1 — Getting Started**. It guides drafting, review and acceptance while the book is being written. Delete this file when the book is complete and the final review has passed.

Book 1 teaches a technical reader how to use Debug80 in VS Code. It starts from no Debug80 knowledge and leads the reader through installation, project creation, editing, assembly, debugging, panel use and transfer to TEC-1G hardware.

## Source Of Truth

The `debug80` repository is the source of truth for current product behaviour.

Use the current extension source for:

- command names and command availability
- panel structure and control labels
- platform choices and scaffolded files
- target discovery rules
- `debug80.json` shape and defaults
- platform behaviour
- CoolTerm integration
- AZM launch options and generated artifacts

Use `debug80-docs/manual/` as raw material only while Book 1 is being drafted. Treat that manual as deprecated. Delete the old `manual/` publication at the end of the Book 1 process, after any useful material has been rewritten, moved or discarded.

AZM is the current assembler path. Do not teach `asm80` as a supported current workflow. Mention removed or legacy assembler behaviour only when the reader must understand an old project or stale error message.

## Reader

The reader may understand Z80 assembly, monitor ROMs or TEC-1 hardware. The reader has not used Debug80.

Book 1 may assume the reader can install VS Code, open a folder and edit a text file. It should define Debug80-specific terms before relying on them.

Introduce these terms before using them heavily:

- workspace folder
- Debug80 project
- target
- profile
- source file
- build artifact
- Intel HEX
- listing
- source map
- monitor ROM
- platform panel
- CoolTerm Remote Control Socket

If a term belongs mainly to a later chapter, avoid it early. If an early mention is necessary, give a short foothold and link forward to the main explanation.

## Teaching Order

The main path should progress in this order:

1. Install VS Code and Debug80.
2. Open or create a folder.
3. Create a Debug80 project.
4. Choose the TEC-1G / MON-3 platform.
5. Open the starter source.
6. Build and start a debug session.
7. Stop at source and use VS Code debug controls.
8. Read registers and memory.
9. Use the Debug80 panel.
10. Understand generated artifacts.
11. Send the generated HEX file to real hardware through CoolTerm.
12. Troubleshoot common failures.

Reference material can support random access, but the tutorial path must not depend on later concepts before they have been introduced.

## Theme Control

Each major theme needs one main teaching home.

Before drafting a chapter, record the themes it introduces and check:

- first mention
- first real definition
- main teaching home
- later references

Later chapters may remind the reader of a fact that matters immediately, but they should not re-teach the same concept from the beginning.

Use these expected teaching homes unless the chapter plan changes deliberately:

| Theme | Main teaching home |
|---|---|
| Project folder and project selector | Project setup chapter |
| Target selection | Project setup chapter |
| AZM assembly on launch | First build chapter |
| Breakpoints and stepping | First debug session chapter |
| Registers and memory | Debugging inspection chapter |
| Debug80 accordion panel | Panel chapter |
| Source-map status | Panel chapter |
| Source-map-backed editor features | Artifacts chapter |
| ROM assets and monitor source | ROM chapter |
| `.hex`, `.lst` and source map | Artifacts chapter |
| CoolTerm | Hardware transfer chapter |
| Troubleshooting | Troubleshooting chapter |

## Prose Standard

Every paragraph must move the reader forward. It should add knowledge, prepare the next idea or ground an earlier idea in an example.

Use direct teaching prose:

- State the immediate problem before the mechanism.
- Show the screen, command or code before explaining secondary details.
- Use complete sentences.
- Use "you" when giving operational guidance.
- Keep one unfamiliar concept per paragraph where possible.
- Prefer concrete names over abstract nouns.
- Prefer current behaviour over historical contrast.

Avoid:

- negative-framed section openings
- sales language
- reassurance sentences
- clever phrasing
- fragmentary note-card prose
- repeated concept introductions
- placeholder nouns such as "thing", "area", "aspect" and "element"
- weak main verbs when a specific verb is available
- serial commas before the final `and` or `or`

Do not use these words in book prose unless quoting a source or discussing the word itself:

- delve
- dive into
- testament
- vibrant
- comprehensive
- leverage
- elegant
- powerful
- sophisticated
- streamline
- seamless
- empower
- embark
- bespoke

Avoid section titles that hide the teaching action, such as "What Debug80 Is". Prefer titles that name the reader's task, such as "Create A TEC-1G Project", "Build And Stop At Source" or "Send The HEX File To The Board".

## Definition Of Good

A good section:

- starts from the reader's current task
- defines new terms before depending on them
- uses current Debug80 behaviour from the `debug80` repo
- contains only concepts needed at that point in the book
- includes a concrete command, screen, file, code excerpt or observable result when possible
- explains both the information level and the intent level
- points forward only when the current task needs the later concept
- avoids reintroducing concepts already taught
- passes the prose standard above

A good chapter:

- has one clear job
- advances the reader's practical ability
- introduces themes in dependency order
- contains screenshots or diagrams where the screen matters
- ends after the last sentence that teaches something
- leaves reference detail to appendices when it would interrupt the path

## Definition Of Done

Book 1 is done when:

- every user-facing claim has been checked against the current `debug80` repo
- every command name has been checked against `package.json`
- every panel description matches the current accordion UI
- AZM is documented as the active assembler workflow
- CoolTerm setup and HEX transfer have been verified against the current implementation
- screenshots or generated illustrations exist for the first-run path, panel walkthrough and hardware transfer path
- every chapter passes the theme-control check
- every chapter passes the prose standard
- stale material from the old manual has either been rewritten, moved to reference material or deleted
- the deprecated `manual/` publication has been removed from the docs site
- a fresh reader can follow the main path from installation to hardware transfer without needing undocumented knowledge
- this oracle has served its purpose and can be deleted

## Review Gate

Before marking any chapter complete, review it in three passes:

1. Technical accuracy: check code, commands, UI labels, file paths and hardware claims.
2. Structure: check concept order, first definitions, main teaching home and repetition.
3. Prose: search for banned patterns, filler, weak verbs, negative framing and serial commas.

Do not accept a chapter because it is fluent. Accept it only when it teaches the right material in the right order.
