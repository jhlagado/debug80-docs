# Chapter-local prose forms

This bounded pass covers the 36 existing reader texts: Chapters 4–28,
appendices A–J and index. The comparison base is
b8c5c284160dba6d377392ff9a1b07f3d7e60581. The complete file list and the
before/after dispositions appear below. All 36 texts received local prose
changes. Chapters 1–3, held candidates, existing pass records, terms.md and
shared outline/ledger files are excluded.

## Before the changes

The earlier terms audit read the complete available reader texts. For this
pass the current containing paragraphs, lists or tables were read before
editing, including the full paragraphs around the moved Chapter 10 byte
0004h explanation. Searches distinguished prose from identifiers, paths,
commands, messages, output, source listings and navigation headings.

The updated terms file supplies the forms. A short prose form follows its
full form within the chapter. A source identifier is not an instruction to
expand its spelling. Ordinary words with another meaning retain that meaning:
a terminal window is not a bank window, a registry tail is not a command
tail and the BDOS's own workspace is not the whole resident workspace.

The recorded stub follow-ups were checked individually. Chapter 10 already
introduces BDOS entry stub, so its later BDOS stub becomes stub. Chapters
14 and 24 now introduce BDOS entry stub at the original three-byte jump's
explanation. Appendix C uses the same full term for that original jump,
then stub. These changes do not rename BENTRY or a resident service's jump.

## Complete file list and dispositions

Every file below is relative to tec-os/editorial/reader-rewrite/draft/.
Each row records the local before/after work. Existing correct expansions
remain in place. Later short uses remain where their meaning is established.

| File | Before/after disposition |
| --- | --- |
| 04-drives-and-user-areas.md | Introduce command prompt, block cache and cache flush before shortening |
| 05-cards-on-the-pc.md | Introduce command prompt at the removal precaution |
| 06-choose-a-console.md | Qualify the queued-input comparison as a host model |
| 07-commands-at-startup.md | Introduce command prompt, non-maskable interrupt (NMI) and host model |
| 08-call-tec-os.md | Introduce command prompt and block cache in the existing example/exit passages |
| 09-read-and-write-a-file.md | Retain the existing FCB expansion; introduce block cache and command prompt |
| 10-memory-for-programs.md | Retain TPA and the first BDOS entry stub; shorten the later stub variant; introduce bank window, block cache, resident workspace, FCB and NMI; restore the precise exit-selection wording |
| 11-use-the-boards-devices.md | Put video memory before VRAM; retain the existing ABI definition and navigation heading |
| 12-results-and-command-chains.md | Introduce command prompt and file control block (FCB) |
| 13-write-a-resident-service.md | Retain TPA; use BDOS entry jump, resident workspace and application binary interface (ABI) at their first prose uses |
| 14-state-and-memory.md | Introduce command prompt, block cache, transient program area (TPA), bank window, FCBs, BDOS entry stub and NMI; use TPA for the later program-area reference |
| 15-reset-and-boot.md | Introduce command prompt, resident workspace, block cache, bank window, TPA and NMI; retain the already full BDOS entry stub |
| 16-console-paths.md | Introduce TPA, host model and video memory (VRAM); retain the distinct BDOS workspace wording |
| 17-card-blocks-and-volumes.md | Introduce host model, resident workspace, FCB and TPA; retain the existing block-cache and disk-parameter explanations |
| 18-cache-and-persistence.md | Introduce block cache, resident workspace and FCB; attach NMI to the existing full non-maskable interrupt phrase |
| 19-a-file-through-the-bdos.md | Retain the opening FCB expansion; introduce block cache, command prompt and resident workspace |
| 20-from-prompt-to-program.md | Introduce command prompt, TPA, FCB, resident workspace, command tail and block cache |
| 21-chains-across-warm-boot.md | Introduce file control blocks (FCBs) and command prompt; retain resident workspace and command tail |
| 22-the-history-ring.md | Use command prompt in the abandoned-line paragraph; retain command lines and resident workspace |
| 23-numbered-service-dispatch.md | Introduce ABI, resident workspace, VRAM and NMI |
| 24-loading-and-removing-services.md | Introduce BDOS entry stub, TPA, resident workspace and ABI |
| 25-startup-inside-the-ccp.md | Introduce resident workspace, command prompt and FCB |
| 26-build-the-rom-and-media.md | Use boot overlay, resident workspace, TPA and command prompt |
| 27-diagnose-the-machine.md | Introduce command prompt, host model, block cache, boot overlay, NMI and FCB; preserve the historical diagnostic-table VRAM wording |
| 28-the-host-model-as-evidence.md | Use web page, Debug80 TEC-1G runtime and boot overlay; retain the opening host model |
| appendix-a-bdos-functions.md | Introduce file control block (FCB) before the function table |
| appendix-b-rom-services.md | Introduce host model, ABI and video memory (VRAM) |
| appendix-c-memory-map.md | Introduce resident workspace, TPA, BDOS entry stub, FCB and command prompt; shorten the later stub variant |
| appendix-d-error-messages.md | Use block cache and bank window; expand FCB and ABI in their first relevant table entries |
| appendix-e-container-format.md | Identify the block cache at the first line reference |
| appendix-f-tecvol.md | Use command prompt in the existing removal precaution |
| appendix-g-tec-1g.md | Introduce NMI, video memory (VRAM), bank window, block cache, resident workspace and FCB; use SD card driver |
| appendix-h-service-file-format.md | Expand TPA in the existing header-check row |
| appendix-i-web-page.md | Introduce host model and command prompt |
| appendix-j-command-reference.md | Use command prompt and command tail |
| index.md | Expand non-maskable interrupt (NMI) in the prepared-machine paragraph; preserve the planned opening profile |

## After the changes

Read the changed passages back for their sentence jobs, natural word order,
agency, punctuation and continuity with the surrounding explanation. The
paragraphs remain developed and in place. No chapter restructuring or new
mechanism was needed. The Chapter 10 paragraph now says that changing byte
0004h changes the selection used on exit. It no longer implies that both
the drive and user area must change together. The unavailable-drive fallback
and both existing citations remain intact.

The prose-occurrence pass checks TPA, FCB/FCBs, ABI, VRAM and NMI separately
in each file, excluding code and source/capture literals. The remaining
VRAM occurrence before a local expansion in Chapter 27 is the retained T17
hardware-test description, not a new explanatory use. It stays literal.
ABI.INC and source symbols retain their spelling. Chapter 11's ABI heading
retains its anchor; its first explanatory paragraph already defines the full
form before the short form. Named registers, IOBYTE, ABICALL, file types and
command aliases remain literal names. DMA address remains the CP/M term,
without implying a hardware DMA controller.

The wider contextual pass distinguishes the region, buffer, command, console,
service and model meanings in the terms table. Qualifiers were added only
where the existing passage identifies that particular object. Generic uses
such as a JavaScript module, cached registry pointer, source line, video page,
terminal window or registry tail were not converted into unrelated book terms.

## Literal preservation and boundary

Static comparisons against the named base cover all 36 files, including the
small index change. They preserve all 212 fenced blocks, 152 HTML comments,
7,825 inline-code spans and 232 Markdown links byte for byte and in order.
All front matter and headings remain unchanged. Consequently retained code,
recipes, captured output, source coordinates, capture comments, evidence pins
and link targets have not been normalised. Historical address/size figures
in prose tables are unchanged; only their descriptive term labels expand.

The current source remains ea3ef3d for the mechanisms already attributed to
it. Historical inputs and captures retain their own pins. The planned
40-column opening remains a plan; this pass supplies no font/default adoption
or qualification. Chapters 1–3 and final reader-order/glossary integration
remain pending. The bounded local form pass has no unresolved prose-form
finding. It does not close independent factual or integration reviews.

Only reader draft text and this new record are owned. No existing chapter
pass record or terms file was edited. No product execution, import, build,
test, assembly, browser interaction, capture or runtime allocation occurred.
