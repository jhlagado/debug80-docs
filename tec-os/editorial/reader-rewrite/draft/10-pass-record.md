# Chapter 10 pass record

## Scope, reader and authority

I own only `draft/10-memory-for-programs.md` and this record. The revision
ledger's final path is `tec-os/10-memory-for-programs.md`. I have not changed
shared navigation, the outline, movement map or another writer's files.

The reader has Chapter 8's call, register and stack contracts and Chapter 9's
FCB, DMA and file-result contracts. The job is to place code, data and a stack
safely, then use a raw BIOS console call with its different stack/input rules.
The closed outline requires memory, page zero, SAVE and bank/restart safety
before the BIOS table and complete KEY example.

I read the original memory and program-console chapters in full. The related
original introduction, command-line and first-program passages were also read
in full in the preceding connected reviews and reread where assigned here.
I read all 78 destination-10 units, the one explicit fragment, the closed
outline/profile amendment, source-question dispositions and final-path ledger.
The amended STYLE guide, human-writing and teaching-prose-review standards
supply the voice and craft requirements. I used the house chapter structure
where it differs from general course-writing conventions.

Mechanism authority is TEC-OS `ea3ef3de9133931e925a0220d51c0e971c1fd8dd`,
read through git object text. This is source-only work. I did not execute or
import the product, build, assemble, run tests, import files to a card or
drive a UI. Text comparison and prose scripts read files only.

## Historical examples and proof scope

TOP, AREA and KEY are complete retained book examples, not newly introduced
test fixtures. I added no new program. Their complete ASM fences, all three
host preparation fences and five capture/output pairs remain unchanged.
That includes AREA's tabs, KEY's trailing output space and SAVE's padded
file-name row. The original memory chapter's pin/ATOM comment is retained
literally, followed by a separate source-only qualification.

All 17 assigned source/output/provenance units match literally: eleven fences,
five capture commands and the original pin comment. Tables retain all assigned
addresses and values. Authorial table descriptions can be clarified, including
the conditional default interrupt vector and page-zero wording without false
program agency.

The retained runtime record is TEC-OS `78127ec` with atom-z80 0.3.7 on the host.
I checked more than the old header: `editorial/reviews/book-45.md:1-3,70-76`
records guarded runs at `78127ec` with cards built from chapter shell steps and
sources compared to fences. It reports the three original memory transcripts
and four original console-program transcripts as matching. Its command-line
batch covers the retained SAVE capture. The record names its original output
locations. I have not rerun them or authenticated a new artifact from that
record. They remain historical host-model evidence, not current or physical
results.

The numerical starter map, four-row drive/service table, GLCD's historical
three pages and 932-byte total cost, TOP/AREA outputs, 47,104-byte COM ceiling
and 184-page SAVE limit stay explicitly historical. Current source describes
the calculation and ownership rules without a fresh workspace/TPA figure.
The planned 40-column TEC Compact opening remains unqualified here. No font,
startup, console-default or device-policy change is inferred.

The TED load-drive explanation retains the original first-program workflow.
Its historical application pins were TED Thorium `128edb7` and TAS Thorium `dbee66a`.
At `128edb7`, I read `ted/src/editor-start.asm:407-420` and
`ted/src/editor-project.asm:451-483`: STLDRV reads 0050h, resolves 0 through
BDOS 25 and stores LDRVL. BLDTXT/BLDDRV construct a drive prefix. The old
SHA-256s are TED `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`
and TAS `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.
This preserves the actual historical tool provenance, not a new tool run.

## Complete material account

Original coordinates use movement-map base
`10821b68f80c10d2037bbd1c5ab207877c897c68`. Every whole destination-10 unit
is listed below. Heading units are reconstructed as noun-phrase sections.

| Original source | Assigned ranges retained or reconstructed |
| --- | --- |
| `tec-os/01-introduction.md` | `144-144`, `149-154`, `156-158` |
| `tec-os/03-command-line.md` | `279-279`, `281-286`, `288-290`, `292-292`, `293-303`, `305-310` |
| `tec-os/07-first-program.md` | `99-102`, `216-216`, `245-249`, `375-379`, `381-383` |
| `tec-os/08-memory.md` | `1-6`, `8-8`, `10-11`, `13-16`, `18-18`, `20-21`, `23-27`, `29-33`, `35-40`, `42-42`, `44-50`, `52-52`, `54-83`, `85-90`, `92-96`, `98-98`, `100-100`, `101-106`, `108-113`, `115-115`, `116-126`, `128-128`, `130-133`, `135-140`, `142-148`, `162-170`, `172-173`, `175-217`, `219-222`, `224-227`, `229-229`, `230-235`, `237-237`, `239-246`, `248-253`, `255-258`, `260-260`, `262-262`, `264-277`, `279-282`, `284-289`, `291-298`, `300-303`, `305-305`, `307-312`, `314-317`, `319-319`, `321-322`, `324-329`, `331-337`, `339-345` |
| `tec-os/09-programs-and-console.md` | `52-57`, `59-63`, `65-66`, `68-75`, `77-79`, `81-126`, `128-132`, `134-138`, `140-140`, `142-142`, `143-148`, `150-151`, `155-159` |

The explicit old07:245-249 load-drive fragment is taught after page-zero
basics. The two old07 load-drive passages are combined, retaining 0/current,
1/A-search, explicit B=2 and TED's A:TAS/A:TED behaviour. The old07 stack and
reset paragraphs precede KEY. Old03's whole SAVE job, capacity capture,
replacement, empty-file and partial-close consequences are retained together.
Old01's numerical map is presented as historical alongside old08's readings.

Old08's detailed cold-boot vector-allocation paragraph at 149-160 belongs to 17,
not 10. Chapter 10 retains the assigned vector sizes, placement and free-block
purpose and points to 17 for the drive-count policy. Chapter 5 supplies the
host-card construction context for the four-drive comparison. I have not
silently imported the unassigned allocation implementation.

The original program-console BIOS table and entire KEY listing, recipe,
input sequence and output remain together after all memory/stack/safety
prerequisites. The final pending-input explanation preserves the assigned
old09:155-159 warning. Hook replacement from 161 onward remains at its
Chapter 16 destination rather than being added to this unit.

## Source and instruction proofs

The following coordinates are at ea3ef3d unless a different pin is named.
I read the owning instructions and relevant callers.

| Claim | Support |
| --- | --- |
| Address space, bank selection and workspace | `src/layout.asm:1-9,25-52,124-160`; `src/ram.asm:1-11,71-107`: the window and latch constants, fixed RAM/ROM boundaries, resident stacks and workspace/table definitions. Base RAM exists for the ROM console even without a service file. |
| Dynamic boundary and vectors | `src/boot.asm:675-800,412-434`; `src/loader.asm:225-244,410-444`: ALVINIT packs vectors below WSBASE then reserves the three-byte stub. PZINIT installs the current top. The loader rounds service placement to pages and lowers the BDOS jump. |
| Allocation-vector sizes | `format/format.json:45-62`; `src/boot.asm:695-800`: DSM511/2047 require64/256 bytes at one bit per allocation block. Detailed reservation policy is not a new measured TPA. |
| Inherited stack and program entry | `src/cpm/ccp.asm:519-536`; `src/layout.asm:137-155`; `src/cpm/bdos.asm:137-141,245-259`: CCP selects its stack, pushes WBOOT and jumps to0100h. BDOS changes stacks internally and restores the caller's SP. Function0 jumps to warm boot. CALL/PUSH/POP/RET arithmetic is instruction semantics. |
| Loader's file ceiling | `src/cpm/ccp.asm:685-754`: LOADLOOP compares the destination page with the BDOS entry's high byte. LOADLIM uses LOADBUF for a further read, permitting EOF at the ceiling without writing beyond it. The historical byte figures are not recalculated as current measurements. |
| Page zero, arguments and load drive | `src/layout.asm:57-96`; `src/cpm/ccpcmd.asm:447-545`; `src/cpm/ccp.asm:480-536`: page-zero constants, parsed names/tail/DMA, default/current versus explicit/search drive and CMDRUN's0050h store. |
| SAVE | `src/cpm/ccpcmd.asm:289-445`: decimal parsing rejects overflow past255 and counts reaching the BDOS page. It deletes/makes, writes two records per page, closes, and reports NO SPACE for make/write/close failure. The historical CP/M contrast is also retained in SAVEWER's comment. |
| Restart vectors | `src/boot.asm:412-509`: PZSWP keeps only JP targets strictly greater than PZTOP, clears the rest of each vector and installs EI/RETI only if0038h has no retained JP. Equality with the boundary does not satisfy that comparison. |
| Interrupt and NMI rules | `src/boot.asm:37-96,178-215`; `src/bios.asm:428-478`; `src/console.asm:382-420,445-495`; `src/pico.asm:445-472`; `src/history.asm:24-75`: cold IM1 and warm DI, saved interrupt states around the protected operations. Page-zero FCB placement puts0066h inside the first FCB. The keypad jumper-off requirement is retained from Appendix G. |
| EXPAND1 layout and cold clear | `src/layout.asm:34-52`; `src/history.asm:24`; `src/boot.asm:314-347`: cache/tag/dirty and history locations, with MEMINIT clearing the complete8000h-BFFFh window before restoring EXPAND0. BE00h-BFFFh is unused storage, not an allocation API. |
| Latch copy and banking hazards | `src/layout.asm:79-96`; `src/cache.asm:17-49,64-119`; `src/history.asm:24-75`: banked loops preserve the fixed-RAM shadow and restore the usual mapping before stack operations. The original “one byte” wording is scoped to the accessible latch state rather than asserted of every memory read on every exit path. |
| Banked exit and reset | `src/reset.asm:1-13`; `src/boot.asm:18-60,178-215,235-309`; `src/cache.asm:653-668`; `src/volsvc.asm:1-150`: JP0 can run through the untouched free bank into RSTENT, which tests0002h before taking WBOOTR. Warm boot restores the bank before its stack and flush. A recognised reset can retain validated selections but cold initialisation drops pending writes. |
| Raw BIOS table and contracts | `src/tables.asm:18-35`; `src/boot.asm:140-155,412-420`; `src/console.asm:200-225,296-332,424-495`: cold copy to BF00h and the page-zero pointer, three-byte entries, CONST FFh/0, CONIN's seven-bit key and CONOUT's C input. They execute on the caller's stack with shared terminal state. |
| Raw input versus BDOS pending input | `src/cpm/bdoscon.asm:126-204,318-353`; `src/cpm/bdos.asm:371-397,767-792`: GETCHAR consumes BDOS pending storage, raw BIOS CONIN does not. Output/status can fill it. Function6 stays within the BDOS input path. |
| Retained program flow | The complete old08 TOP/AREA and old09 KEY fences: TOP prints high then low bytes with nested tail returns. AREA subtracts0100h, counts decimal digits by adding negative powers and saves HL across output. KEY sets SP after DS64, patches JP operands from0001h, saves AF across both outputs and uses JP0 rather than RET on its private stack. This is static instruction tracing, not a fresh build. |

## Actual craft passes

I wrote the complete generous draft before line editing. I then applied each
pass to retained explanations as well as new transitions:

- Thematic and prerequisites: separated current mechanisms from historical
  readings. Defined TPA and the exclusive boundary before any buffer/stack
  placement. Put inherited/private SP before TOP's nested calls. Moved the
  historical readings earlier to ground that boundary before the longer
  page-zero and bank-safety sections. SAVE follows file-size versus working-space
  distinctions. The raw BIOS table and KEY follow every assigned safety
  and stack topic.
- Deletion: read every paragraph and sentence in order, mentally removed it
  and read across the neighbours. Removed a redundant saved-pages sentence and
  a generic interrupt-console warning. Combined the two load-drive accounts.
  Kept the precise reset/flush qualification, inherited-return rule, full
  output fences and distinct file-load/data-allocation limits.
- Agency and instruction subjects: programs read/write/select, vectors contain
  bytes and the loader checks pages. Changed the page-zero table to identify its jumps and
  buffers directly. Explained TOP's high-digit and fall-through returns separately so
  a return is attributed to the actual stack path. No file or machine gets an
  intention and no chapter supplies an executable operation.
- Every comma and punctuation: read each authorial comma and other join.
  Removed optional conjunction commas in the opening and BIOS-pointer rule.
  Kept field lists, apposition and necessary condition boundaries. No authorial
  semicolon or em dash was added. Literal comments, tabs, recipe syntax and
  captured punctuation were left alone.
- Technical/literal: traced the source paths above, including strict vector
  comparison, the conditional IM1 default, scratch EOF probing, SAVE's close
  and the fixed-RAM latch copy. Qualified the old unconditional reset/flush
  wording. Compared every assigned source/output/provenance unit literally.
  The code examples are inherited book examples with recorded historical
  reproduction, unlike a newly copied test fixture requiring new allocation.
- Journey: read the complete chapter from its dynamic boundary through the
  final pending-input mechanism. The reader can locate program space, explain
  a private stack's exit, interpret historical readings, preserve arguments,
  save memory and recognise bank/vector hazards before calculating BIOS
  entry addresses. KEY uses only contracts already introduced. The final
  paragraph ends on the specific BDOS alternative rather than a recap.

## Text-only checks

The final prose gate reports zero findings across both owned files. The
chapter's complexity report gives 217 sentences, a mean of 11.9 words,
0.57 joints per sentence, 10% flagged and an approximate grade of 6.4.
I read the flags: they identify short contracts, arithmetic/byte units and
the retained multiline historical comment. The literal comment is not
rewritten to alter that report. The repeated write operation names the
required port/shadow update rather than decorative emphasis. These figures
are prose diagnostics, not execution or acceptance proof.

The coordinate check confirms 51 ranges in bounds across 17 offered source
files. The material comparison confirms all 17 literal units. Neither
check substitutes for the complete source, passage and reader-order reads.

The whitespace check reports only the retained SAVE file-name padding and
KEY's final output space. I preserved both as literal historical evidence.

## Remaining acceptance

This is a source-only draft for independent editorial and factual review.
Final source/profile adoption, integrated links/anchors and whole-book
reader-order review remain open. Historical outputs keep their actual pin.
No new result, program, font/default, board qualification or publication is
claimed. I have not changed another writer's files or the shared ledger.
