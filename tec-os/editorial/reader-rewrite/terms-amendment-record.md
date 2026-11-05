# Glossary source corrections

Read all191 original lines and every table. Found the old chapter credits
unsuitable for the independently changed route. They are explicitly pending
complete reconciliation rather than silently treated as checked first uses.
Closed outline/movement units remain the teaching authority.

Read offered media.mjs program/file/recipe construction and starter.mjs in
full. Corrected the six-file starter list, ROM PICO versus loaded GLCD driver,
numbered-service range0–15 and volsvc.asm location. Inspected ABI163–170
for FONT15/TNCOUNT16. Service lifetime now refers to allocated resident
pages and successful removal rather than ambiguous below-the-BDOS wording.
All other term meanings and legacy variant distinctions remain to recheck
in the complete glossary pass. No current glossary acceptance is claimed.
No build, import, example or product execution was performed.

## Bounded independent confirmation

Independent changed-facts review confirmed c722ace's six-file starter, ROM
PICO/loadedGLCD distinction, numbered0–15/FONT15 range, volsvc location and
resident-page lifetime wording. This confirms only those source corrections.
Full glossary meanings, chapter credits and first-use reconciliation remain
open. No execution or qualification of the future font/default is implied.

## Complete meaning and draft-credit audit

The earlier c722ace correction and bounded confirmation above remain intact.
This continuation audits every existing row: 82 meaning rows in eight groups
and all 40 prose-form substitutions. No original term or variant row is
unaccounted for. Some full forms have been made explicit, notably transient
program area, file control block, application binary interface and BDOS entry
stub. This is an editorial/source audit, not final glossary acceptance.

Only editorial/terms.md and reader-rewrite/terms-amendment-record.md are owned.
The closed outline and movement units remain controlling. Product semantics
use Git text at TEC-OS ea3ef3de9133931e925a0220d51c0e971c1fd8dd. The credit
reading covers the committed drafts available during the audit through
0c15bbbe71ca9adf15a89fbf5a4ff9e5beb0f651. Later 11/A/B correction diffs were
read before delivery. They refine timing provenance, Matrix-switch conditions
and BDOS results without moving the credited explanations. Subsequent chapter
changes require another credit check. No chapter prose, literal example or
shared ledger was edited.

Read the entire terms file, its earlier amendment record, the house style and
the closed outline. Read the complete available chapter texts 4–28, front-door
draft and appendices A–J, including their literal material. The current F
reading includes the original full 73-unit review plus the bounded f8f0cab
correction diff. I was read in full during its 85ff289 authoring and current
text was checked for this audit. Reads returned in truncated tool output were
completed with the missing spans. This audit does not claim a new independent
factual review of every chapter or closure of their review records.

Chapters 1–3 remain held. Their first-use credits are explicitly pending in
the terms table. An existing front-door link, movement destination or earlier
chapter number does not establish what those missing drafts explain. The
new credit column records observed explanations, not an assertion that every
chapter has already expanded every acronym or introduced every short form.

### Bounded F confirmation

The two accepted F findings are closed at f8f0cab. In its info paragraph the
requested drive count is printed only for a nonzero field. The recipe
paragraph now separates volumes and components, puts files inside components
and distinguishes volume mount from file drive. The source conditions are
tools/tecvol.mjs:119, tools/lib/container.mjs:79–80 and
tools/lib/recipe.mjs:16–24 at ea3ef3d. The pass record records both
dispositions. No F file was changed here.

### Meaning proofs and dispositions

The following source proofs cover all 82 rows. Ranges identify the actual
mechanism read, not merely a surviving old citation. All unqualified source
paths use ea3ef3d. Counts below are source/table inventories only.

| Rows audited | Source proof and resulting distinction |
| --- | --- |
| Memory, 10 | src/layout.asm:3–9,26–58,63–90,124–135 fixes the memory regions, page-zero addresses, overlay and RAM BIOS origin/size. src/ram.asm:1–11,147–151,219–231,309–319,483–485 defines workspace spans and stacks. src/boot.asm:403–434,794–800 separates the original three-byte stub from the page-zero jump. src/loader.asm:421–441 writes the same entry at a service base. Workspace excludes vectors/stub/service pages and WSEND is exclusive |
| Boot/reset, 5 | src/reset.asm:1–14 and src/boot.asm:38–80,178–215 distinguish reset entry, cold clearing and warm reconstruction/flush. Its240–312 captures only recognised state and src/volsvc.asm:31–159 requires complete reselection. The recovered assignment is separate from current drive/user. Model reset is host/machine.mjs:578–587 while page power-on constructs a new machine in web/src/main.mjs:82–99 |
| Cards/files, first 10 rows through record | tools/media.mjs:28–30,193–234 and tools/lib/starter.mjs:10–17 retain the six-file c722ace facts and page-only DEMO. format/format.json:2–59 defines blocks, descriptor/header fields, drive limit and both allocation sizes. src/boot.asm:695–800 makes nonzero requested drives reserve full slots while zero sizes mounted drives. src/cpm/bdosfile.asm:142–234 separates DEFDRV/CURDRV and FCB drive binding. src/cpm/ccp.asm:285–320 uses CP/M drive syntax without creating extra TEC-OS drives |
| Cards/files, remaining 10 rows | src/bios.asm:124–217 maps logical sectors/records to card blocks. src/cpm/bdosrec.asm:617–671 and format/format.json:47–59 distinguish logical extents from G8M's two-extent directory entry. src/bios.asm:338–366 plus src/cpm/bdoslog.asm:394–439 proves the directory mark is a retained upper bound. Its202–350 builds vectors at login. src/ram.asm:36–72,253–279 defines drive/vector/DMA state. src/cpm/ccpcmd.asm:456–545 prepares overlapping default FCBs, with a36-byte FCB also reserved at src/ram.asm:163–166. src/cpm/bdoscon.asm:26–101 distinguishes four BDOS errors from ordinary function results. CKS is zero in both format geometries |
| Cache, 5 | src/layout.asm:50–58 and src/cache.asm:1–26 define30 lines and separate metadata. Its596–613 marks dirty after copying even without comparing old card bytes. Its307–350 attempts all applicable lines, with different failure retention for CFLALL/CFLUSH. Its615–651 distinguishes through completion, ordinary behind completion and directory preflush. Dirty is pending-write state. Flush is an attempt whose failure can follow successful writes, not a synonym for FCB close or browser save |
| Console, 15 | src/console.asm:98–111,127–199,606–620 distinguishes the IOBYTE request from CONMOD in effect. Its559–599 implements list discard/ready and raw serial reader/punch, while429–440 discards BAT directly. src/keyboard.asm:1–28,36–142 uses FEh and the Matrix enable. src/layout.asm:14–24,92–115 defines port/device bits. src/services.asm:157–192 writes the20×4 LCD,360–428 routes PUTAT and618–658 handles UC1 registration. src/pico.asm:64–87 supplies the ROM PICO console and286–331 generates reverse glyphs. drivers/glcd.asm:66–88,604–641 supplies loaded GLCD and cell drawing. src/term.asm:576–590,939–979 distinguishes attribute mode/cursor inversion from arbitrary bitmap inversion. The keypad warning uses the normal FCB at005Ch and entry0066h, not a newly observed board result |
| Commands/programs, 14 | src/cpm/ccp.asm:119–166,224–320,363–384,415–536 defines prompt sources, pieces, result order, drive selection, saved user bits and dispatch. src/tables.asm:60–80 supplies ten built-ins, not MOUNT.COM. src/cpm/ccpcmd.asm:241–280 accepts USER0–15 while src/cpm/bdosfn.asm:191–213 stores function32's low five bits0–31. The CCP saves only four user bits. src/cpm/bdos.asm:296–314 reads/sets the shared return code with FFFFh as query. src/cpm/ccpcmd.asm:866–919 reads one startup record. src/abi.inc:1–33 fixes the signature/ABI table. programs/SAMPLE.ASM is the supplied TAS source. TED/project meaning follows the separately pinned application below |
| Services/entries, 9 | src/abi.inc:35–58,60–170 and src/tables.asm:104–132 retain numbers0–15 and subgroup meanings. src/loader.asm:32–64 defines headers and13-byte records. Its128–174 restricts removal to the newest permitted owner. Its451–632 permits failed installation with retained pages and no proposed records. Its780–880 implements FIND/LIST independently of SERVICES, whose owner walk is src/cpm/ccpcmd.asm:829–864. src/pico.asm:64–86 registers the permanent ROM tail. src/boot.asm:412–434,794–800 and src/loader.asm:421–441 distinguish STUBAD's original jump from a loaded service's entry jump |
| Model/page, 4 | host/machine.mjs:10–16,33–85 imports/configures the runtime. tools/capture.mjs:23–39,63–72 supplies the serial/pico/glcd profiles and fixed capture clock. web/src/main.mjs:17–43 defaults to80 only without stored width and82–99 supplies page configuration. Its106–166,593–649 gives independent save/import contracts. Profile correspondence is not identity of browser/capture evidence. Optional MAIN mappings and legacy extra banks remain explicitly model configuration, not physical U9 facts |

TED is the historical input at Thorium128edb7, not code folded into the
TEC-OS pin. Read its ted/src/editor-project.asm:26–40,43–100,
ted/src/editor-data.asm:104, ted/src/editor-start-project.asm:1–40 and
ted/src/editor-start-session.asm:1–50. THOFCB copies drive0 and THOR into
the transaction FCB, then supplies the requested type. The project file is
therefore current-drive THOR.PRJ. THOR.SES stores work-file/position state.
The current drafts12/26 attribute the historical workflow separately.

The 40 form rows were each checked for prose versus literal scope. The old
blanket substitutions were too broad for IOBYTE fields, generic disk errors,
drive counts, JavaScript modules, historical .DRV/PRL interfaces and quoted
paths/commands. They now name the intended layer and preserve literal evidence.
Write-behind remains valid as a policy noun, written behind describes a volume
and the established adjective forms remain available before a noun. These are
meaning-preserving editorial distinctions, not global replacements in chapters.

### Actual explanation credits

The table now uses the explanations in the following draft texts. Section
names in the terms table are actual headings, or Opening for opening prose.
They do not certify all incidental occurrences elsewhere.

| Draft text read in full | Credit basis |
| --- | --- |
| 04-drives-and-user-areas.md | Programs/resident services, page cost, volume/container/drive relationship, current drive and user areas, mapping/slots, protection, flush and reset consequences |
| 05-cards-on-the-pc.md | Image and container, record/allocation sizes, host setup, drives field, write policies, recipe/protection and copy-first recovery |
| 06-choose-a-console.md | Device/input/output relationship, serial/video routes, display sizes, ROM versus loaded console, keyboard and reverse cursor |
| 07-commands-at-startup.md | Startup location/record bound, cold versus warm, recognised reset and keypad bypass |
| 08-call-tec-os.md | BDOS/BIOS/CCP roles, call/stack/return, list copy and warm-boot flush |
| 09-read-and-write-a-file.md | Page zero, expanded FCB with all36 bytes, command tail, logical extent, DMA buffer and close/flush distinction |
| 10-memory-for-programs.md | Expanded TPA, memory/window/workspace, BIOS table and original entry stub, stack and page-zero contracts |
| 11-use-the-boards-devices.md | Expanded ABI, signature, numbered versus resident services, complete groups, VRAM, claims, font and positioned reverse cells |
| 12-results-and-command-chains.md | Line/piece/condition, shared return code, function47 acceptance versus flush and historical TED/project/session meanings |
| 13-write-a-resident-service.md | Resident lifetime, library/driver classification, hook/stack responsibilities, records/clients/dependencies and generation |
| 14-state-and-memory.md | Banks, workspace spans, allocation vectors/slots, stub versus service entry, boot lifetimes and all four stacks |
| 15-reset-and-boot.md | Overlay/reset entry, cold/warm order, recognition/reselection, page-zero/stub construction and failed-flush scope |
| 16-console-paths.md | Full BIOS table, logical/physical console distinction, IOBYTE request/mode, serial and matrix operations, list path, cell/attribute/display pages |
| 17-card-blocks-and-volumes.md | SD transfer units, container checks, drive table/DPH/DPB, sector mapping, vector slots and numbered volume interface |
| 18-cache-and-persistence.md | Cache/line/dirty state, write policies, flush variants, eviction and partial failure |
| 19-a-file-through-the-bdos.md | Default versus bound drive, file/directory/extent, login and retained directory mark, check vector and errors |
| 20-from-prompt-to-program.md | Actual prompt/input sources, built-in dispatch, lookup and page-zero tail publication |
| 21-chains-across-warm-boot.md | Retained line/position, conditional result ordering and function47's replacement with flush qualification |
| 22-the-history-ring.md | The separate256-byte history page and its lifetime, not a memory/display/web page conflation |
| 23-numbered-service-dispatch.md | ROM table versus internal SVTAB, subgroup implementation and caller contracts |
| 24-loading-and-removing-services.md | Resident entries, original stub, reservation versus publication, failed retained pages and registry/owner distinction |
| 25-startup-inside-the-ccp.md | One-record startup, origin, console-field/device outcome and LCD ownership |
| 26-build-the-rom-and-media.md | Actual six starter files, SAMPLE source, ROM image/map and pinned historical HELLO/editor round |
| 27-diagnose-the-machine.md | Diagnostic prompt versus command prompt and distinct physical/model evidence |
| 28-the-host-model-as-evidence.md | Machine versus runtime, profiles/options, evidence channels, fixtures and browser implementation |
| appendices A–J | Complete function/ABI, memory, errors, container, host tool, hardware, service-format, page and grammar references. The terms table assigns only the specific explanation/lookup credit each actually provides |

Compared the completed 11/19 text changes through 0c15bbb as well. Their new
directory-mark and video-byte qualifications agree with the revised meanings.
No old credit such as FCB in 6/16 or hardware examples in 9 was retained by
renumbering guess. The original nine meanings/variant groups remain available,
with their distinctions retained in 82 rows and 40 substitution rows.

### Full-form and first-use follow-ups

The following chapter-form issues remain for their owners. They are not
product-contract ambiguities and no chapter was edited to resolve them.

| Location in inspected draft | Required follow-up |
| --- | --- |
| 10-memory-for-programs.md:43,183 | The first occurrence already says BDOS entry stub. Later BDOS stub is a shortened variant. Prefer stub after that first full form |
| 14-state-and-memory.md:173–176 | The mechanism is explained as a three-byte JP before the first bare stub, but the full prose term BDOS entry stub has not appeared. Use it at that first explanation. TPA at176 and FCB at214 also lack a local expansion |
| 24-loading-and-removing-services.md:47–50 | Three-byte entry stub is clear in its BDOS context but should use the agreed full BDOS entry stub before shortening to stub |
| appendix-c-memory-map.md:122 | BDOS stub is the first stub wording. Use the full form, retaining the later abbreviated uses |
| 11-use-the-boards-devices.md:707 | VRAM precedes its gloss video memory. Put the full form before the short form when the chapter owner applies the local form pass |
| Later chapters/references using TPA, FCB or ABI without re-expansion | Complete the chapter-local short-form pass during integration. A correct explanation credit is not a certificate that every later chapter satisfies that rule |
| Chapters1–3 | Held text has not established first use, definitions, workflows or final display-profile wording. All associated opening credits remain pending |

These exact locations are follow-ups for the inspected text, not authorisation
to alter retained source/capture literals. Named model and tool identifiers
remain technical domain names.

### Craft, checks and completion boundary

Read every revised definition, distinction, credit and substitution in order.
Checked each sentence's job, code/prose scope, agency and punctuation, then
read the whole glossary back across the eight groups. Minimal table fragments
are intentional reference entries. Full forms introduce shortened prose without
requiring expansion of code symbols. Literal historical wording is exempt from
prose normalisation. No optional comma was retained solely for a speech pause.

Static text checks account for 82 of 82 meanings and 40 of 40 form rows, with 0
unaccounted rows. Source ranges in this continuation were checked within their
named Git objects. Source correctness and observed draft locations do not close
the pending opening credits or the chapter-local form follow-ups.

The bounded source/meaning pass and available-draft credit reconciliation are
complete. Independent review, final source/media adoption, all-chapter first-use
reconciliation, navigation integration and final reader-order acceptance remain
open. No imports, builds, tests, assemblies, application/model runs, browser/UI
actions, captures or publication were performed.
