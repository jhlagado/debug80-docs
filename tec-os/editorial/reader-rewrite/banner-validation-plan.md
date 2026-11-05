# TEC-OS ordinary banner verification plan

Status: source inspection complete. All assembly, execution, UI interaction,
persistence checks and captures are pending compute allocation. This is a
verification specification, not chapter prose or a record of successful output.

I will verify the ordinary edit/save/build/run workflow before writing teaching
prose around it. The example uses TED and the pinned on-machine TAS. It prints
through BDOS function 9 and returns to the CCP. Existing startup, devices, GLCD
installation, volume configuration and memory configuration remain unchanged.

## Current scheduling amendment

The later allocation proposal supersedes the unrun budget below: 600 MB total,
450 MB JavaScript heap and a 120-second whole-job deadline. The immutable compact
candidate, harness, exact command and artifact hashes must be durably filed on
the existing private remote before final source offer/command approval. Include
edit/rebuild and an explicit ATOM byte reference alongside the actual TED/TAS
workflow. The source offer preparing at ea3ef3d is not final. No execution is
allocated and no automatic deadline extension or retry is permitted.

## Authority and inspected identities

TEC-OS source authority is
`f732fec0777a62d43b28ed691e70ddafa051e576` in
the TEC-OS checkout. Source references below are relative to that
checkout at that commit. Thorium references use the separate commits stated
below, not the current Thorium HEAD. I inspected the actual source and test
bodies. Test assertions are existing specifications, not fresh results.

The application identities in `test/inputs.json` are:

| Input | Thorium commit | Repository path | Exact bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| TAS.COM | dbee66a90816df9a5884a08754ebc2d458a38325 | dist/TAS.COM | 10295 | 45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2 |
| TED.COM | 128edb7cbb27de17a9d3a7a747706a5b227b30c4 | dist/TED.COM | 11923 | 2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f |

Read-only byte length and SHA-256 comparisons matched both selected local inputs
and the corresponding committed distribution blobs. The selected local files
were `../thorium/dist/TAS.COM` and
`.inputs/TED.COM`. This establishes binary
identity, not a fresh source-to-binary rebuild or a successful TEC-OS run.

`tools/lib/pins.mjs:9-57` selects an explicit `TAS_COM` or `TED_COM` environment
override first, then `.inputs/NAME`, then the sibling distribution default.
An empty override fails. A selected wrong file or broken symlink does not permit
silent fallback. Future validation must record the selected paths and verify
them again, including the actual card copies. CP/M file reads are record-padded,
so the manifest length defines the application byte prefix to hash. Record the
remaining padding separately rather than treating it as application bytes.

The separate production TAS host adapter in `tools/lib/tas-rom.mjs` pins runner
commit `3d16b30cb8ed7deccc0a8b0b04f1b961e29f5689` and the TAS commit above.
Its runner SHA-256 is
`e68e24d900bdc9aa391086f0425d0a56feedeb7257c5a71facdd4bd6f8f7bade`,
lockfile SHA-256 is
`fc8bcae3046fa185048627e0df26c602772cfb3b190a54089e2fe6764839bf2a`
and runtime aggregate SHA-256 is
`d49287b51d474e5825d68ed4c766cd63632c9da68cded2641e881de00960219c`.
Those are adapter requirements read from source, not a new qualification of that
host installation. The banner workflow does not invoke that adapter.

The TEC-OS package declares Node >=20, debug80-runtime 0.3.3, atom-z80 0.3.7,
esbuild 0.24.2 and Playwright 1.62.1. Installed dependency identity and executable
ROM/map/card provenance still need recording for the allocated run. Merely
finding existing `dist/tecos.rom`, `dist/tecos.d8.json` and `dist/starter.img`
does not establish that they were generated from this source revision.

## Minimal example specification

Working names are `B:BANNER.ASM` and `B:BANNER.COM`, with the tools on A:.
The earlier source sketch below must be replaced by the agreed compact layout
in the immutable executable candidate before verification. It contains only ordinary Z80 instructions, a string and a BDOS call.
No include file, hardware service, IOBYTE access, bank operation, driver change
or private stack is needed in the proposed program.

Candidate source only, unassembled and unexecuted:

```asm
        ORG     $0100
        LD      DE,MESSAGE
        LD      C,9
        CALL    5
        RET
MESSAGE:
        DB "Hello from TEC-OS",13,10,"$"
```

The intended console payload is the literal string in the DB followed by CR/LF.
That is an acceptance condition derived from the source, not captured output.
There is no asserted COM size, timing, screen transcript or successful build.
All source lines use spaces and stay within 40 columns. The 17-character banner
fits the GLCD's 21-column text width. TED's source-line scrolling and status
presentation still require actual observation on that display.

Support for feasibility:

- `src/cpm/bdos.asm:389-407` implements function 9 by reading DE until `$` and
  passing each preceding character through OUTCHAR. The terminating `$` is not
  printed. This preserves the configured console route.
- `src/cpm/ccp.asm:493-509` prepares page zero, supplies a resident stack and
  pushes WBOOT before entering the transient at TPA. The final RET therefore
  uses the CCP's return path. No fixed private stack address is introduced.
- Thorium at the TAS pin, `src/tas/MAIN.ASM:38-90`, defaults input type to ASM,
  output to the source drive/name with type COM and opens debug output.
  `src/tas/OUT.ASM:4-22` enforces the COM origin at 0100h. Its output path writes
  a work file before installation and returns to the CCP at lines 91-116.
- `test/tas.test.mjs:22-38` specifies a closely related BDOS-only HELLO assembly
  and run. It stages source through host filesystem helpers, so it does not
  establish that a person can create this banner in TED.

## Ordinary TED workflow and prerequisites

I will use a disposable byte-for-byte copy of an already qualified starter card.
A: remains SYSTEM, G1M. B: remains WORK, G8M with write-behind enabled, as in
`tools/media.mjs:173-240` and the existing revision-4 starter recipe. I will not
substitute the simplified test card. User area 0, writable free directory/data
space and the expected A:/B: mounts are prerequisites.

A: must contain the two pinned applications and the original STARTUP.CMD and
GLCD.SVC. The starter startup bytes are `GLCD.SVC` followed by CR/LF and ^Z
(`tools/lib/starter.mjs:1-17`). I will record and preserve those bytes and the
driver hash. The board profile must remain the one being qualified. I will not
remove the driver, change startup to select serial, change IOBYTE or reclaim
resident driver memory to obtain a successful run.

The fresh working copy must have no pre-existing BANNER files, conflicting
BANNER.$$$/BAK work files or unrelated THOR project/session/recovery files in
the relevant project area. I will inspect both A: and B: before opening TED.
If this condition fails I will stop and choose a fresh disposable baseline,
not delete someone else's files. TED gives THOR.PRJ MAIN precedence over the
current ASM buffer (`editor-project.asm:192-207` at the TED pin). A previously
learned project is therefore unsuitable as an unnoticed prerequisite.

The proposed opening profile is the normal 80-column PICO9918 console with
the matrix keyboard and the prepared starter card. The original startup file
and graphics driver remain on A:. GLCD and serial operation are separate
coverage, not implied by this proposed opening proof.

The proposed public sequence is:

1. At the settled A> prompt, enter `A:TED B:BANNER.ASM`. Confirm the B: filename
   and empty new-file buffer before typing. Startup calls LOADFILE after drive
   selection (`ted/src/editor-start.asm:32-53`). New-file behaviour remains an
   execution acceptance item.
2. Type all seven candidate lines through the configured keyboard transport,
   with Return between lines. Do not inject the ASM through a host file writer.
3. Use ^S then ^Q. At A>, use ^C and wait for the prompt before reading
   the B: file from the card image. Reopen with `A:TED B:BANNER.ASM` to prove
   the saved source before building.
4. Use ^T followed by B. Confirm source save, fresh B:BANNER.COM and DBG output,
   successful build state and return to the same source in TED.
5. Use ^T followed by R. This saves and rebuilds before execution. Confirm the
   banner payload, TED's post-program wait and restoration of the source after
   one ordinary key. Then ^Q returns to the CCP.
6. At A>, issue ^C and wait for the settled prompt before taking a persistent
   card snapshot. Cold-start a new machine from that snapshot and prove both
   source reopening and standalone `B:BANNER` execution.

TED's key dispatch is in `ted/src/editor-main.asm:56-114` and its prefix table
is in `editor-data.asm:116` onwards. Save/build/run mechanics are in
`editor-project.asm:169-305`, with the `TAS ... !TED` build template at
`editor-data.asm:107-110`. The run path and return template are in
`editor-start.asm:92-183` and `editor-start-place.asm:270-274`.
`Press a key` is TED's wait before redrawing, not input requested by the banner.
Record any THOR.PRJ/SES files created by normal TED operation. Their creation
must not be confused with altering startup or device configuration.

Current CCP source supports A: fallback for an unqualified transient command
when the current drive lookup fails (`src/cpm/ccp.asm:463-491`). A comment in
`test/ted.test.mjs` describing current-drive-only lookup is stale. The explicit
names above avoid depending on that comment or requiring duplicate tools on B:.

## Driver, test and capture limitations

GLCD startup is still part of the ordinary system. `drivers/glcd.asm:63-90`
checks required font/device support before driver installation.
`src/services.asm:591-631` rejects a nonzero UC1 driver table during startup
when CRT is already selected. A PICO run therefore must preserve the existing
startup rather than manually remove GLCD.SVC. The same source facts do not
prove available memory or successful TED/TAS operation on a particular board.

The inspected `test/ted.test.mjs` specifies edit/save/reopen on PICO widths
80/40/32 and GLCD 21x8. Its complete build/run rounds cover PICO and serial,
including a cross-drive source build. They do not specify the full GLCD
new-file/banner/build/run round. Some assertions use hardcoded TED addresses
and some diagnostic paths call the PICO screen reader for any video console.
I will not copy those assumptions into the banner proof.

Importing `test/lib/fixtures.mjs` eagerly assembles GLCD.SVC. Its `boot()` can
also alter a card through `withDisplay()`, and `standardCard()` does not have
the starter B: write-behind setting. Even a narrowly filtered existing test can
therefore compile during module import. I have not imported these modules or
run any test. They are not a safe allocation-free validation shortcut.

`tools/capture.mjs:1-125` is prompt-oriented. Ordinary command lines wait for a
CCP prompt, so starting TED that way is insufficient. `@start` consumes input
then runs a fixed 50 million T-states. `@press` waits only for consumption.
Neither establishes an editor milestone. Its fixed per-wait cap is 800 million
T-states, which is not the TAS test's four-billion-cycle build allowance.
Prompt recognition can also accept application text ending in a drive letter
and `>`. Capture execution is pending, including any proposed key script.

The default capture board is serial with GLCD disabled. It must not silently
replace the intended PICO or GLCD profile. Logical BIOS console text is not
proof of serial output or of the visible display. `--serial` reads the serial
stream, while screen capture must select actual PICO or GLCD state. The script
reads its card into memory and does not save the modified image to the input
path. `@reset` retains RAM and card, so it is not a cold persistence proof.

## Guarded validation after compute allocation

Heavy execution waits for compute allocation. The authorised work already
includes preparing and verifying this example. Allocation is the scheduling
constraint, not a new permission request for each temporary harness file.
Use the agreed board profile and finite cycle and wall-time limits under the
machine-wide memory guard. Until allocation, every execution step is pending.

1. **Identity gate.** Record allocation identity, source commit, dependency
   identities, ROM/map hashes, source-linked artifact provenance, card hash,
   application prefix hashes, startup/driver hashes and volume flags. Reject
   mixed artifacts, wrong pins or an unqualified ROM/map pair. Missing artifacts
   require preparation within the compute allocation before this proof can run.
   Existing filenames alone are not a substitute for qualified artifacts.
2. **Harness gate.** Use a temporary harness outside the repository that reads
   the existing ROM, matching map, font and disposable actual starter image.
   Import the host Machine and inspected pure container/filesystem helpers,
   not test fixtures, build modules or media generation. No implementation or
   execution of that harness has occurred. Use the same baseline configuration
   as the selected teaching profile and route keys through matrix when the
   actual console is video, otherwise serial.
3. **Budget gate.** Set a hard outer wall timeout before launching the harness.
   Use finite per-milestone cycle limits and an allocation-wide accumulated
   limit. Existing tests provide starting bounds of 100 million cycles for key
   steps and four billion for a TAS command, not measured requirements for this
   banner. Clamp these to the approved budget. If the allocation cannot cover
   them, leave validation pending. Do not extend limits or retry automatically.
4. **Milestone proof.** Execute the six public steps above. Each input wait must
   require an empty input queue and an appropriate observable state rather than
   a fixed cycle delay alone. Distinguish TED input, build return, post-run polling and
   the CCP prompt. Use actual screen/status and disk observations alongside
   logical output. A quiescent editor alone does not establish that write-behind
   data reached the SD image. Inspect files through the target filesystem or
   after a completed CCP flush. Never modify the live card through host
   filesystem helpers.
5. **Freshness and save proof.** Save/read back the exact candidate with CR/LF
   handling and only the CP/M ^Z tail treated as padding. Reopen it visibly.
   Require COM/DBG absent at baseline and present after the successful build.
   Record their hashes and inspect the generated instructions/string before
   claiming that the candidate was assembled. A failed build may retain earlier
   output, so output existence alone is insufficient.
6. **Run proof.** Capture the banner payload through the selected console and
   its actual display. Verify TED's separate wait, the return after a key and
   the restored source. After quitting and flushing with ^C at the CCP, persist
   the post-flush SD image and construct a new machine with fresh RAM from it.
   Reopen the source and run `B:BANNER` independently. A warm reset or inspection
   of the same machine's cache does not establish this result.
7. **Invariant and evidence gate.** Compare startup, GLCD driver, application
   bytes, mounts, geometry and write-behind flags against baseline. Preserve
   raw input bytes, ordered milestones, cycle counts, logical console, actual
   display captures, source readback and before/after hashes outside the repo.
   Record any model violations and stop on an unexpected state or exceeded
   budget. No automatic serial fallback, driver removal, source repair or
   production change is permitted.

One complete round on the actual intended teaching profile is the minimum
acceptance condition. If the sequence is taught for both PICO and GLCD,
each needs its own complete round with unchanged startup. Serial evidence can
be labelled as additional model coverage but cannot replace either display
claim. Physical hardware and browser interaction remain outside a host-model
proof unless separately allocated and performed.

## Disposition before prose

The source supports this small candidate and the TED/TAS chaining mechanism.
The selected application binaries match their declared pins. The unresolved
items are executable ROM/map/card provenance, actual new-file typing and
control-key transport, full GLCD build/run behaviour, visible output and
write-behind persistence. No successful output or timing has been inferred.

I can retain the banner as the proposed first ordinary program in the structural
rewrite. I will defer its teaching prose, screenshots and claimed results until
the allocated workflow produces the evidence above. A failure is a feasibility
or source question to report with its exact boundary, not permission to simplify
the configured machine.

The working limits and paths will be fixed in the executable driver before
its allocated run. Its outer invocation uses the existing guard:

```sh
node "$HOME/projects/origo/tools/mem-guard.mjs" --limit 850 \
  --name tec-os-banner --log "$banner_log" -- node "$banner_harness"
```

`banner_log` and `banner_harness` name scratch files outside the repository.
The final source offer may require revised coordinates or application pins.
This specification makes no final checked-at claim.
