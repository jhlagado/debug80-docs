# Independent terms review at 8593c93

I reviewed the full `tec-os/editorial/terms.md` and
`tec-os/editorial/reader-rewrite/terms-amendment-record.md` at book commit
8593c93. Mechanism authority is TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. Historical TED semantics use
Thorium 128edb7 where separately identified. I read the original c722ace
correction and its complete terms table as well as the current source-question
dispositions, including question9's Matrix-switch distinction.

No required correction found. All 82 meaning rows and 40 form rows are accounted
for. This clears the bounded source/meaning and available-draft credit review.
It does not close publication, whole-book first use, adopted source/media or
runtime qualification.

## Complete meaning coverage

| Group | Rows | Independent source checks |
| --- | ---: | --- |
| Memory |10| `src/layout.asm:1-174`, `src/ram.asm:1-76,147-166,212-237,309-337,483-485`, `src/boot.asm:403-434,679-800`, `src/loader.asm:421-441`. TPA is bounded by the word at0006h, not a byte count. Workspace includes the RAM BIOS table but excludes allocation vectors, the original stub and loaded service pages. Fixed RAM and the bank window remain distinct. |
| Boot/reset |5| `src/reset.asm:1-14`, `src/boot.asm:38-80,178-215,240-312`, `src/volsvc.asm:31-159`, `host/machine.mjs:578-587`, `web/src/main.mjs:82-99`. Normal reset/cold boot, warm reconstruction, retained assignments and fresh-machine power-on have their stated separate meanings. Recognition alone is not restoration. |
| Cards, volumes and files |20| `tools/media.mjs:28-30,193-234`, `tools/lib/starter.mjs:10-17`, `format/format.json:1-59`, `src/boot.asm:695-800`, `src/cpm/bdosfile.asm:19-132,142-234`, `src/bios.asm:124-217,290-366`, `src/cpm/bdoslog.asm:202-350,394-439`, `src/cpm/bdosrec.asm:617-671`, `src/cpm/ccpcmd.asm:456-545`, `src/cpm/bdoscon.asm:26-101`. Units, extent versus entry, vector/login/mark state, overlapping36-byte FCBs and error layers remain distinct. |
| Block cache |5| `src/layout.asm:50-58`, `src/cache.asm:1-26,292-350,493-508,596-668`. Thirty512-byte lines, separate key/dirty state, dirty as a pending-write flag, through/behind completion and differing CFLALL/CFLUSH failure retention are correctly distinguished. Flush is an attempt, not guaranteed durability or FCB close. |
| Console |15| `src/console.asm:60-199,429-440,559-624`, `src/keyboard.asm:1-145`, `src/layout.asm:92-115`, `src/pico.asm:31-87,286-331`, `src/term.asm:576-590,939-979`, `src/services.asm:157-192,360-428,618-658`, `drivers/glcd.asm:66-88,604-641`. Logical request versus applied selection, BAT discard, ROM PICO versus loaded GLCD, status LCD versus console, reverse glyph versus attribute mode and keypad NMI are supported. |
| Commands/programs |14| `src/cpm/ccp.asm:119-166,224-320,363-384,415-536`, `src/tables.asm:60-80`, `src/cpm/ccpcmd.asm:241-280,456-545,866-919`, `src/cpm/bdosfn.asm:191-213`, `src/cpm/bdos.asm:296-314`, `tools/tecvol.mjs:37-55`, `programs/SAMPLE.ASM`. Prompt/source/piece/tail, ten built-ins, return-code interval, user-number layers, startup location and SAMPLE source are supported. TED is checked separately below. |
| Services and ROM entries |9| `src/abi.inc:1-183`, `src/tables.asm:104-132`, `src/loader.asm:32-64,128-174,421-441,451-632,773-880`, `src/pico.asm:31-87`, `src/cpm/ccpcmd.asm:829-864`, `src/volsvc.asm:186-236,246-429`. Loaded owners, records, numbered calls, subgroup ownership and original stub versus service entry are correctly separated. Failed installation can retain pages without proposed records. |
| Model and page |4| `host/machine.mjs:10-85,578-587`, `tools/capture.mjs:23-39,63-72`, `web/src/main.mjs:17-43,82-99,106-166,593-649`. Wrapper versus runtime, capture profiles, optional memory configuration, page configuration and browser persistence do not imply identical capture/browser evidence. |

I read owning instructions and relevant callers for these meanings rather
than accepting the amendment record's citations by text equality. The source
read was combined with the same-pin memory, service and registry reads from
the connected chapter/reference reviews. No source assertion was promoted to
a newly passing test or physical observation.

## The specifically requested boundaries

The c722ace facts are retained correctly. Media construction supplies precisely
MOUNT.COM, GLCD.SVC, STARTUP.CMD, TED.COM, SAMPLE.ASM and TAS.COM on A.
B is empty in that starter recipe and the page recipe adds DEMO.COM.
PICO's console is ROM code rather than a PICO.SVC component. The ABI has
numbers0–15, FONT15 and TNCOUNT16. Volume service bodies belong to volsvc.asm,
separate from container mount validation in vol.asm. Resident lifetime refers
to allocated pages and successful removal rather than an ambiguous position
below the BDOS.

Question9 is respected. `src/console.asm:82-88` obtains the Matrix enable bit
from STSPORT and stores it in CONDEV. PISTART at `src/pico.asm:64-86` tests that
bit after the display probe. This is not an independent keyboard-response
probe. The matrix-keyboard term is consistent with the console scan gate in
`src/keyboard.asm:9-28`. Raw numbered KEYS has its own contract and does not
establish a presence test.

The user-area distinction is supported: the USER command accepts0–15, BDOS32
stores five bits and can represent0–31, the CCP's saved page-zero byte retains
four user bits and tecvol's option accepts0–15. The glossary does not turn
one operator restriction into a universal API/storage bound.

The directory mark is an upper bound rather than the last currently live
entry. The BIOS raises it over a directory card block before the underlying
write path. DUSAVE preserves a higher existing mark. Likewise a dirty flag
records pending-write state without comparing every byte against the card.
These changes repair the original definitions without discarding their terms.

For historical TED at Thorium 128edb7 I read
`ted/src/editor-project.asm:26-100`, `ted/src/editor-data.asm:104`,
`ted/src/editor-start-project.asm:1-40` and
`ted/src/editor-start-session.asm:1-50`. THOFCB copies drive0 and THOR, then the
requested type, into the transaction FCB. THOR.PRJ is therefore current-drive
project state and THOR.SES stores work-file/position state. This source check
is not a new editor workflow result.

## Available-draft credits

The credits use actual reader drafts available at8593c93, not old chapter
numbers carried forward mechanically. I checked the named destination headings
and the credited explanations against those texts. They agree with the
replacement route: FCB/DMA in9/19, TPA and raw BIOS in10, hardware/ABI in11,
chains in12/21, service authoring in13, state/slots in14, startup in7/25,
source/media in26 and model evidence in28. Reference credits identify their
actual lookup material. No reference credit was accepted solely because a
heading exists or an old destination number can be mapped.

Representative distinctions checked in complete credit passages include
Chapter13's Code that stays for service/library/driver, Chapter6's actual
console routes and unavailable-display examples, Chapter10's exclusive TPA
boundary/workspace map, Chapter11's claim/VRAM and numbered-service explanations,
Chapter19's FCB/default-versus-bound drive/mark/login state and the browser's
separate memory/save/import meanings in I/28.

The credit column promises an available explanation, not that every occurrence
in every later chapter has already expanded its short form. The amendment
record makes that distinction explicitly. I found no falsely completed
Chapter1–3 credit.

## All 40 prose-form rows

All original variant groups remain accounted for. The substitutions now retain
the intended layer: console field is only IOBYTE's low two bits, BDOS error
only its four causes, drives field only header byte22, resident service only
the loaded-service context and ROM table only the fixed ABI representation.
Internal SVTAB, BIOS tables and record entry tables are not conflated.

The literal exceptions preserve source identifiers, commands, paths, messages
and historical captures. This includes TOP/AREA's program-area comments,
writeBehind and write options, CON GLCD and GLCD.SVC, the historical.DRV/PRL
interfaces, older command output and named products. Write-behind as a policy
noun and written-behind/written-through as attributive forms remain valid.
The table does not authorise global substitutions through historical code or
captured text.

Full-form rules apply to prose short forms within a chapter. They do not
require expansion or renaming of literal ABICALL, IOBYTE or another source
symbol. Region names, byte counts and ordinary broad RAM descriptions also
remain distinguishable rather than being replaced mechanically with TPA or
workspace.

## Existing follow-ups and acceptance limits

The amendment record explicitly leaves these chapter-owner follow-ups open:
local BDOS entry stub wording in10/14/24/C, VRAM's gloss order in11 and later
chapter-local TPA/FCB/ABI expansions. They are accurately recorded form work,
not source ambiguities or falsely completed first-use checks. I do not turn
those declared holds into findings against this bounded audit.

Opening1–3 text, first-use reconciliation after it exists, final source/media
adoption, KS48 font/default qualification, integrated navigation and final
reader-order acceptance remain pending. A front-door link or outline allocation
does not satisfy them. The original numeric evidence is not repinned by a term
definition. The audit record does not assert a new independent factual review
of every reader chapter.

I read the tables and record in full for meaning, preservation, reference
clarity, source/literal scope, agency and punctuation. No required factual,
credit, preservation or form-rule correction remains from this review.

No repository file was changed. No product import, assembly, build, test,
emulation, capture, browser action or physical run occurred. Only this
independent review report and temporary text inventories were written under
/tmp.

## Row-by-row bounded dispositions

“Clear” below applies to the meaning, distinction and available-draft credit
within this review. It does not close the separately recorded first-use work,
Opening pending credits or later source and runtime adoption. Source support
is grouped in the complete meaning coverage table above.

| Meaning row | Term | Disposition |
| --- | --- | --- |
| M01 | transient program area | Clear. Opening credit remains pending. |
| M02 | resident workspace | Clear. |
| M03 | page | Clear. Opening credit remains pending. |
| M04 | BIOS jump table | Clear. |
| M05 | BDOS entry jump | Clear. |
| M06 | boot overlay | Clear. Opening credit remains pending. |
| M07 | fixed RAM | Clear. Opening credit remains pending. |
| M08 | EXPAND 0, EXPAND 1 | Clear. Opening credit remains pending. |
| M09 | bank window | Clear. |
| M10 | service resident memory | Clear. |
| M11 | cold boot | Clear. Opening credit remains pending. |
| M12 | warm boot | Clear. Opening credit remains pending. |
| M13 | reset | Clear. Opening credit remains pending. |
| M14 | drive selection | Clear. |
| M15 | power cycle | Clear. Opening credit remains pending. |
| M16 | SD card | Clear. Opening credit remains pending. |
| M17 | starter card | Clear. Opening credit remains pending. |
| M18 | card image | Clear. Opening credit remains pending. |
| M19 | container | Clear. |
| M20 | volume | Clear. Opening credit remains pending. |
| M21 | drive | Clear. Opening credit remains pending. |
| M22 | current drive | Clear. Opening credit remains pending. |
| M23 | drives field | Clear. |
| M24 | card block | Clear. |
| M25 | CP/M record | Clear. Opening credit remains pending. |
| M26 | sector | Clear. |
| M27 | logical extent | Clear. |
| M28 | directory mark | Clear. |
| M29 | logged-in drive | Clear. |
| M30 | check vector | Clear. |
| M31 | DMA address | Clear. |
| M32 | file control block | Clear. Opening credit remains pending. |
| M33 | drive table | Clear. |
| M34 | allocation-vector slot | Clear. |
| M35 | BDOS error | Clear. |
| M36 | block cache | Clear. Opening credit remains pending. |
| M37 | cache line | Clear. |
| M38 | dirty cache line | Clear. |
| M39 | cache flush | Clear. Opening credit remains pending. |
| M40 | written behind | Clear. Opening credit remains pending. |
| M41 | console | Clear. Opening credit remains pending. |
| M42 | console field | Clear. |
| M43 | serial terminal | Clear. Opening credit remains pending. |
| M44 | serial port | Clear. Opening credit remains pending. |
| M45 | display | Clear. Opening credit remains pending. |
| M46 | video console | Clear. Opening credit remains pending. |
| M47 | display driver | Clear. Opening credit remains pending. |
| M48 | PICO9918 | Clear. Opening credit remains pending. |
| M49 | video memory | Clear. |
| M50 | graphics LCD | Clear. Opening credit remains pending. |
| M51 | 20 × 4 LCD | Clear. Opening credit remains pending. |
| M52 | matrix keyboard | Clear. Opening credit remains pending. |
| M53 | keypad NMI jumper | Clear. Opening credit remains pending. |
| M54 | reverse image | Clear. Opening credit remains pending. |
| M55 | list device | Clear. |
| M56 | command prompt | Clear. Opening credit remains pending. |
| M57 | built-in command | Clear. Opening credit remains pending. |
| M58 | command line | Clear. Opening credit remains pending. |
| M59 | command tail | Clear. Opening credit remains pending. |
| M60 | chained line | Clear. |
| M61 | program return code | Clear. |
| M62 | user area | Clear. Opening credit remains pending. |
| M63 | startup file | Clear. Opening credit remains pending. |
| M64 | `MOUNT` | Clear. |
| M65 | `TED` | Clear. Opening credit remains pending. |
| M66 | `SAMPLE.ASM` | Clear. Opening credit remains pending. |
| M67 | TED project file | Clear. Opening credit remains pending. |
| M68 | application binary interface | Clear. |
| M69 | ROM signature | Clear. |
| M70 | resident service | Clear. |
| M71 | service library | Clear. |
| M72 | service driver | Clear. |
| M73 | service record | Clear. |
| M74 | numbered service | Clear. |
| M75 | hardware service | Clear. Opening credit remains pending. |
| M76 | volume services | Clear. |
| M77 | ROM table | Clear. Opening credit remains pending. |
| M78 | BDOS entry stub | Clear. |
| M79 | host model | Clear. Opening credit remains pending. |
| M80 | serial board | Clear. Opening credit remains pending. |
| M81 | web page's board | Clear. Opening credit remains pending. |
| M82 | web page | Clear. Opening credit remains pending. |

Every form rule is clear with its stated context and literal exception. This
disposition approves the rule rather than claiming every later prose occurrence
has already been revised.

| Form row | Form reviewed | Disposition |
| --- | --- | --- |
| F01 | program area or “the memory programs have” as a region name | Clear within the stated prose/literal scope. |
| F02 | working memory | Clear within the stated prose/literal scope. |
| F03 | TEC-1G model, Debug80 model | Clear within the stated prose/literal scope. |
| F04 | serial-only board | Clear within the stated prose/literal scope. |
| F05 | PC's terminal | Clear within the stated prose/literal scope. |
| F06 | BIOS's jump table, BIOS's table, BIOS table, RAM table | Clear within the stated prose/literal scope. |
| F07 | drive count | Clear within the stated prose/literal scope. |
| F08 | SD driver, SPI driver | Clear within the stated prose/literal scope. |
| F09 | SD adaptor | Clear within the stated prose/literal scope. |
| F10 | video driver | Clear within the stated prose/literal scope. |
| F11 | video display | Clear within the stated prose/literal scope. |
| F12 | video RAM | Clear within the stated prose/literal scope. |
| F13 | character LCD | Clear within the stated prose/literal scope. |
| F14 | GLCD in prose | Clear within the stated prose/literal scope. |
| F15 | write-behind | Clear within the stated prose/literal scope. |
| F16 | keypad's NMI jumper | Clear within the stated prose/literal scope. |
| F17 | IOBYTE's bits, IOBYTE's field, CON: field | Clear within the stated prose/literal scope. |
| F18 | disk error | Clear within the stated prose/literal scope. |
| F19 | reset of the disk system | Clear within the stated prose/literal scope. |
| F20 | chained command line | Clear within the stated prose/literal scope. |
| F21 | default DMA record | Clear within the stated prose/literal scope. |
| F22 | the choice of drives | Clear within the stated prose/literal scope. |
| F23 | drawn inverted | Clear within the stated prose/literal scope. |
| F24 | changed line in cache implementation prose | Clear within the stated prose/literal scope. |
| F25 | checksum vector | Clear within the stated prose/literal scope. |
| F26 | hex in prose | Clear within the stated prose/literal scope. |
| F27 | .DRV for a current service file | Clear within the stated prose/literal scope. |
| F28 | DRIVERS as the current listing command | Clear within the stated prose/literal scope. |
| F29 | module, resident module, resident driver for an arbitrary loaded file | Clear within the stated prose/literal scope. |
| F30 | driver loader | Clear within the stated prose/literal scope. |
| F31 | driver registry | Clear within the stated prose/literal scope. |
| F32 | table at C003h, table of services, ROM's table of services | Clear within the stated prose/literal scope. |
| F33 | ROM services for ABICALL calls | Clear within the stated prose/literal scope. |
| F34 | mount service, mount entry, ABIVOL | Clear within the stated prose/literal scope. |
| F35 | ABIHW, ABIGLCD, ABISVC | Clear within the stated prose/literal scope. |
| F36 | PRL program or .PRL file as a current loadable file | Clear within the stated prose/literal scope. |
| F37 | book/capture.mjs | Clear within the stated prose/literal scope. |
| F38 | ATOM on the card | Clear within the stated prose/literal scope. |
| F39 | VOLS as the current volume-list command | Clear within the stated prose/literal scope. |
| F40 | EDIT or Edit for the starter editor | Clear within the stated prose/literal scope. |
