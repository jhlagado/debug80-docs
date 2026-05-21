---
layout: default
title: "Assemblers and Source Mapping"
parent: "Using Debug80 in VS Code"
nav_order: 7
---
# Assemblers and Source Mapping

Debug80 needs machine code to run and source mapping to show you where the CPU is in your source file. The assembler backend produces the machine code and the files used for mapping.

## Assembler Backends

Debug80 uses the configured assembler backend to turn source into artifacts:

| Backend | Use it for |
|---|---|
| `asm80` | Traditional Z80 assembly projects using asm80-compatible source. |

If the target omits `assembler`, Debug80 uses `asm80`.

## Generated Artifacts

During launch, Debug80 writes artifacts under the target's `outputDir` using `artifactBase` as the file name prefix.

| Artifact | Purpose |
|---|---|
| `.hex` | Intel HEX program image loaded into Z80 memory. |
| `.lst` | Listing file used for source mapping and inspection. |
| `.bin` | Compact binary output when the target requests a binary range. |
| `.d8.json` | D8 debug map used for higher-confidence source mapping. |

The exact set depends on the backend and target options.

## Source Mapping

Source mapping connects a Z80 address to a source file and line. Debug80 uses the D8 map when available and falls back to the listing pipeline when needed.

Mapping can be approximate when source files are missing, a listing has weak file information, or include-heavy code gives the assembler incomplete source attribution. In those cases, breakpoints may appear hollow or stepping may land in a nearby listing/source line.

When mapping looks wrong:

- Rebuild by restarting the session.
- Check that the generated `.lst` and `.d8.json` match the source you are editing.
- Check `sourceRoots` for included files.
- Put the breakpoint on an instruction line rather than a label, comment, or directive-only line.
- Open the ROM listing/source if the PC is inside monitor code.
