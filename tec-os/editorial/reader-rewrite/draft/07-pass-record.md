# Chapter 7 pass record

## Brief and complete reading

I own only `draft/07-commands-at-startup.md` and this record. The chapter's
job is practical startup configuration after files, consoles and the COM/SVC
operator vocabulary in4. It explains one command per line, the128-byte limit,
display outcomes, quiet absence, keypad bypass and reset lifetime. Chains and
all full conditional examples remain12. The retained-record/parser/quiet-gate
implementation remains25. No new executable example or result is introduced.

Before drafting I read the complete old06 startup chapter, including every
recipe, capture comment, output, table and qualifier. I read all65 controlling
destination7 units and confirmed there are no destination7 fragment overrides.
I read its full reverse-outline notes, the closed replacement outline and the
current source-question dispositions, including the Matrix enablement rule.
I also read the Chapter4 operator context to avoid repeating its service lesson.
The house STYLE, full human-writing and teaching standards and their supporting
references govern the passes. The closed outline is0e4feea, recorded3060e71.

Source authority is TEC-OS ea3ef3de9133931e925a0220d51c0e971c1fd8dd through
git text. Historical recipes/captures remain78127ec. The original80-column
examples and the inspected source's80-column PISTART are distinguished from
any future opening profile. KD243/KS48 font/default implementation and runtime
acceptance remain held. Nothing is repinned as a final checked chapter.

The original startup policy is retained. A responding PICO plus enabled Matrix
switch can start its ROM console. There is no keyboard-presence probe. Startup
GLCD registration on active CRT is rejected quietly, whereas a successful typed
load can keep the applied PICO console. The browser prepares a copy and applies
it only on success. A bare claim that every power-on rewrites the file would
lose that failure boundary.

## Exact old-unit dispositions

All ranges below are old `tec-os/06-startup-file.md` at movement-map book base
10821b68f80c10d2037bbd1c5ab207877c897c68. Each whole unit has a disposition.

| Original range | Draft home and disposition |
| --- | --- |
| `1–6` | Reconstruct title, PartI group and navigation for7. |
| `8–8` | Use Commands at startup as the chapter heading. |
| `10–10` | Replace whole-chapter checked header with separate source-only and historical provenance. |
| `12–15` | Opening: retain automatic commands and display/drive/user configuration purpose. Remove the obsolete assumption that GLCD ran in the new opening. |
| `17–17` | Reconstruct A short file of commands heading. |
| `19–20` | First section: retain A:STARTUP.CMD before keyboard input and supplied one-line file. |
| `22–22` | Retain TYPE STARTUP.CMD capture command unchanged. |
| `23–28` | Retain complete TYPE STARTUP.CMD output unchanged. |
| `30–32` | Identify GLCD as the resident service already taught fully in4. Remove obsolete later-section preview. |
| `34–37` | Retain one typed command per line, starter-copy preparation, replacement and --text conversion. |
| `39–43` | Retain complete six-line startup shell fence unchanged. |
| `45–45` | Retain lines.img capture command unchanged. |
| `46–64` | Retain complete lines.img boot output unchanged. |
| `66–74` | Explain echo before uppercase, B/user3 persistence, user0/A program lookup, DIR/NOSUCH and final interactive B prompt. |
| `76–76` | Reconstruct The first128bytes heading. |
| `78–84` | Explain once-only reading,128-byte limit, truncated final command and60 blank lines taking120bytes. |
| `86–91` | Retain complete cut.img preparation fence unchanged. |
| `93–93` | Retain cut.img capture command unchanged. |
| `94–98` | Retain complete DIR *.CM/NO FILE output unchanged. |
| `100–100` | Introduce the concrete delimiter/boundary rules. |
| `102–107` | Retain CR/LF, blank-line skipping, zero/^Z/end,127 characters and exclusion of a new line at byte128. |
| `170–170` | Reconstruct Program exits and resets heading. |
| `172–173` | Introduce the three routes and whether startup rereads or resumes. |
| `175–185` | Retain ordinary return/^C/0000h, recognised and unrecognised resets, retained-volume qualification and state rebuilding. |
| `187–191` | Retain removal of services, A/user0 and console reset. Qualify80-column PICO to inspected ea3 source and Matrix enablement. |
| `193–197` | Retain current A/user0 file selection and SPARE setup context. |
| `199–206` | Retain complete SPARE card/two-startup-files preparation fence unchanged. |
| `208–208` | Retain SPARE reset capture command unchanged. |
| `209–229` | Retain complete SPARE boot/reset/user2 output unchanged. |
| `231–235` | Retain missing-GLCD and missing-MOUNT recovery, power-loss default recovery and validity-qualified repeated reselection. |
| `237–237` | Reconstruct Display commands in the file heading. |
| `239–243` | Retain ROM PICO/no service, source-qualified80-column start and supplied GLCD line. |
| `245–251` | Retain GLCD takeover, active-PICO quiet noninstallation and absent-controller quiet outcome. |
| `253–256` | Retain Matrix-disabled failure/next line and introduce the historical board configurations without asserting a keyboard probe. |
| `258–262` | Retain the complete historical board/outcome/console table unchanged. |
| `264–264` | Explain that quiet startup on active PICO installed no GLCD service. |
| `266–266` | Retain PICO SERVICES/CON capture command unchanged. |
| `267–272` | Retain complete empty-services/CRT output unchanged. |
| `274–275` | Retain initial serial/character-LCD banner and volumes on non-PICO configurations. |
| `277–281` | Retain CON PICO40/32 session widths and source-qualified cold80 reset. Introduce w32 startup preference. |
| `283–287` | Retain complete w32.img preparation shell fence unchanged. |
| `289–291` | Retain historical80-column banner,32-column clear and reply before DIR. |
| `293–293` | Retain w32 PICO screen capture command unchanged. |
| `294–304` | Retain complete32-column DIR screen output unchanged. |
| `306–308` | Retain quiet missing-PICO startup width and typed32? contrast. Conditional operators are deferred to12. |
| `310–310` | Retain w32 serial capture command unchanged. |
| `311–321` | Retain complete serial boot/display-command output unchanged. |
| `323–325` | Retain browser power-on display preparation and other commands. Qualify failure and80-column no-command branch against source, with AppendixI rules. |
| `327–327` | Replace orphan Services at the prompt heading with An older card's display file. Full operator material remains4. |
| `403–410` | Retain GLCD.DRV?/SVC rename, second-byte format4 and old PICO.SVC rejection. Name full migration example inD. |
| `412–412` | Reconstruct Bypassing a bad startup file heading. |
| `414–420` | Retain hang/reset recovery, held hex key, single sample, historical1.5s and NMI-jumper-off requirement. |
| `422–430` | Retain no service after skip, PICO/Matrix condition, serial recovery, ERA/correction, PC route, retained assignments and web controls. |
| `432–433` | Introduce last-row recovery results without requiring a terminal. |
| `435–438` | Retain GLCD? with console unchanged and CARD? diagnostic context. Distinguish returned failure from fatal BDOS disk error. |
| `440–441` | Introduce historical serial CON UC1 failure on a card without startup. |
| `443–446` | Retain complete nostart.img preparation fence unchanged. |
| `448–448` | Retain nostart CON UC1/LCD capture command unchanged. |
| `449–458` | Retain complete serial/GLCD? output unchanged. |
| `460–464` | Retain successful-load clearing, G.SVC rename scenario and typed installation after missing GLCD.SVC. |
| `466–470` | Retain complete gname.img preparation fence unchanged. |
| `472–472` | Retain gname GLCD/LCD capture command unchanged. |
| `473–486` | Retain complete serial-to-GLCD and cleared-LCD output unchanged, including final blank row. |
| `488–489` | Identify which replies/typed line were serial and which later report/prompt were GLCD. |
| `491–497` | Retain five-character clearing, hardware-service row replacement, direct-port bypass and retry clearing CARD?. Link programming/implementation homes11/25. |

Old06:109–127's dollar recipe and output remain complete in25. This chapter
adds only a short operational pointer so an early-ending echo is not mistaken
for truncated command text. Old06:129–168's program/chain and conditional
examples remain12. Old06:329–401's service installation/list/removal lesson and
captures remain4. No assigned destination7 fence is replaced by those links.
The old service-memory-cost and API material are not taught again here.

## Historical evidence

Nine complete captures, all nine capture command comments and six complete
shell fences are retained unchanged from the assigned original ranges. The
complete board-outcome table is retained too. This includes literal trailing
spaces in boot volume lines and the final empty LCD row in gname output.
The examples are TYPE STARTUP.CMD, lines.img, cut.img, spare.img,
SERVICES/CON on PICO, w32.img on PICO and serial, nostart.img and gname.img.

All retain application/capture provenance TEC-OS78127ec. No new host assembly
is introduced. These examples neither assemble with TAS nor run TED, so no
new assembler/editor identity is invented. The old volume listing includes
their file names without qualifying their execution. GLCD.SVC and MOUNT.COM
belong to the historical product card used by each retained recipe. No new
card hash, current capture or physical observation is claimed.

The chapter uses host commands already introduced in5. Readback through TYPE
and choosing user0/A explain how to address the file but are not presented as
a newly demonstrated editor/save workflow. The held Chapter8 LINE candidate
is not introduced here. No new BANNER, font or40-column result is asserted.

## Source proofs at ea3ef3d

I read the following paths through git object text. Detailed source coordinates
are kept here under the PartI house convention.

| Claim | Source proof and boundary |
| --- | --- |
| File, first record and user0 | src/cpm/ccpcmd.asm:874–919 marks finished before I/O, copies STFCB, opens A:STARTUP.CMD and reads once. src/tables.asm:139 supplies drive1/STARTUP CMD. src/boot.asm:157–158 and src/cpm/ccp.asm:69–102 establish A/user0 before the first startup call. |
| Priority, echo and commands | src/cpm/ccp.asm:123–184 takes chained text before STLINE and keyboard only afterwards. src/cpm/ccpcmd.asm:995–1011 appends CR/$ and calls PUTSTR before dispatch. Its798–805 and src/cpm/bdos.asm:419–433 stop the echo at a dollar sign while the complete command remains buffered. src/cpm/ccp.asm:249–284 uppercases the taken piece after that echo. |
| Record edges | src/cpm/ccpcmd.asm:933–995 checks the record end before reading, stops at zero/26, ends lines at13/10, copies at most127 characters and encodes completion at80h/81h. An active line can use the last byte but a new one cannot start there. |
| Text conversion | tools/tecvol.mjs:155 passes the text option. tools/lib/cpmfs.mjs:181–188 converts LF to CRLF, appends1Ah and pads whole records. The128-byte arithmetic is textual explanation, not an import or measurement. |
| Failure and next line | src/cpm/ccp.asm:483–484,588–629 returns ordinary failures to the command loop. src/boot.asm:178–215 and src/ram.asm:416–424 preserve startup position/record across program exits. Default disk errors use src/cpm/bdoscon.asm:47–72, printing and warm-booting rather than invariably printing NAME?. |
| Lookup and area change | src/cpm/ccp.asm:637–674,485–517 performs current/user0 lookup and unnamed-drive A fallback. USER changes current user before subsequent commands. The recipe's MOUNT location and observed prompt remain historical evidence. |
| Reset lifetime | src/boot.asm:38–79,119–158 clears resident workspace at cold boot, mounts, reselects and starts with A/user0. src/volsvc.asm:1–159 restores only a valid retained selection, otherwise leaving the mounted defaults. Ordinary warm boot retains installed service/BIOS state. src/boot.asm:321–346 discards the cache on cold boot. |
| Successful persistence only | src/cache.asm:307–350,653–668 and src/boot.asm:210–215 flush pending writes before another load only on success. Failed flush lines are dropped and Write lost is reported. No persistence guarantee is inferred from an ordinary exit. |
| Matrix versus display probe | src/console.asm:82–88 records the Matrix switch, src/video.asm:22–29 probes PICO and src/pico.asm:64–86 tests the enable bit, starts80columns and publishes CRT. This is not a second responding-device test. |
| GLCD startup/typed difference | drivers/glcd.asm:66–88 obtains FONT, probes the controller and registers UC1. src/services.asm:618–658 gates startup registration while requested CRT is active and checks CDMTX/nonduplicate table through src/video.asm:150–182. src/loader.asm:925–958 leaves an applied CRT console selected after typed success and otherwise selects UC1. |
| Quiet absence | src/cpm/ccp.asm:465–484 requires startup origin, INIT statusTNENODV and SVCRC1, nothing resident. Ordinary missing/incompatible service files are not quiet. src/loader.asm:520–526 clears INIT status after record rejection. The chapter gives the supplied driver's practical cases, not a blanket silent-failure promise. |
| Width | src/cpm/ccpcmd.asm:161–194 finds PICO before calling its width entry. Absent PICO is quiet only in startup. src/pico.asm:98–191 handles80/40/32 and retained BIOS width. Cold start still uses80 at this source. |
| Browser preparation | host/card.mjs:58–72 applies its staged copy only on success. Its104–116 sets the selected display command for GLCD/narrow PICO, uses no command for80-column PICO and preserves other commands subject to the exact filtering rules at75–101. Failures boot unchanged and are reported. |
| Older services | src/abi.inc:190 sets SVCFMT4. src/loader.asm:32,189–203 compares the magic/format before installation. src/cpm/ccp.asm:451–495 distinguishes SVC from the COM search. src/services.asm:618–627 rejects CRT registration by an old PICO service. Rename does not convert a format. |
| Held-key skip | src/cpm/ccpcmd.asm:874–887 samples port03 bit6 once after marking finished and before file I/O. src/layout.asm:19–20 names the port. The approximate1.5s retains Book39:31 at58d4345:1.49s on serial/GLCD and1.46s on PICO, not recalculated at the offer. |
| NMI requirement | src/boot.asm:412–509 publishes page-zero vectors without an NMI handler at0066h. src/cpm/ccpcmd.asm:447–545 overwrites the default FCB spanning that location. docs/board-run.md:313–317 records no NMI routine and the keypad-jumper-off operating requirement. The chapter gives the hazard without claiming every possible byte pattern has an identical crash path. |
| LCD words and clearing | src/loader.asm:895–980 restores the failed selection, writes GLCD? and clears a marked five-character word on a later successful take. src/lcd.asm:65–120 and src/text.asm:15,84–88 define row3 and strings/blanks. src/services.asm:157–192 clears ownership when a program writes row3, without first blanking it. Direct ports bypass that state change. |
| CARD? retry | src/boot.asm:119–132,817–847 writes CARD? on failure and returns R to LCDINIT/card init at COLDRT. A successful retry clears it and another mount failure writes it again. |

## Actual passes and remaining work

The complete generous draft and65-unit record were committed and pushed as
43e4c53 before reduction. I then applied each pass to the complete chapter:

| Pass | Actual disposition |
| --- | --- |
| Thematic and teaching order | Kept file location/readback before the supplied line and multi-line example. Record limits follow the visible commands. Reset lifetime precedes the SPARE consequence and repeatable display preference. Recovery follows normal display outcomes. Operator services remain4, all full chains12 and implementation25. |
| Every paragraph and sentence deletion | Read each in order with deletion/read-across checks. Removed the duplicated no-reread statement after the six-line example, the repeated SYSTEM-not-A sentence, the display-example forecast and the repeated operator-services reminder. Removed the redundant historical-timing certification after the already labelled model account. Preserved every limit, failure condition and required transition. |
| Agency and plainness | TEC-OS reads/echoes/selects, commands run and people edit/read back. Changed the opening from a file selecting devices to the reader using its commands. Named the line as selecting GLCD rather than treating a controller as the console. A `$` has an exact echo-termination effect, not a human action. No artifact has intentions or perception. |
| Every comma and punctuation | Read every authorial comma with its optional removal. Removed optional commas in save failure, once-only reading, exit/skip and retry sentences. Kept actual lists, apposition and useful condition boundaries. Shortened the long GLCD-condition prefix. No authorial semicolon, em dash or Oxford comma remains. Literal recipe and output punctuation is unchanged. |
| Technical and source qualifications | Re-read relied git text at ea3ef3d in caller context. Corrected the initial blanket browser-first-command wording for80-column PICO, which uses none. Distinguished returned CON UC1 failure/GLCD? from a fatal disk-read abort. Added normal editor exit, successful-flush and dropped-write consequences before reset. Clarified that final-line execution does not require a delimiter to fit. Matrix enablement is never a keyboard response probe. |
| Literal preservation | Static text comparison verifies all15 complete assigned fences, all nine capture comments and the full board-outcome table against frozen10821b6. No partial fixture/output is substituted. Historical provenance remains78127ec. Source coordinates are checked for bounds separately from semantic reading. |
| Reader journey | Read from the file's purpose through the final retry result after the cuts. One command per line and saved-file location precede host preparation. The cut-record output gives a reason for the limit rules. SPARE demonstrates which A volume supplies startup. Display silence is separated from installation and typed success. The ending gives the observed retry consequence without a recap. |
| Mechanical and final gates | Explicit vocabulary/agency/heading/punctuation searches were reviewed manually. All hits of just are literal spatial/comparison uses. No unresolved hard prose pattern remains. No bundled prose-gate or sentence-complexity script was run and no numerical readability score is claimed. |

Diff whitespace checks on the initial addition reported nine trailing-space
lines. Each is an unchanged historical volume line inside a text fence. They
are retained deliberately. No authorial whitespace warning is being waived.
The final reduction diff is checked separately. Final sibling paths follow
the revision ledger, but whole-book navigation/anchor integration remains open.

Independent editorial/factual review, runtime/profile acceptance and the final
whole-book read remain outstanding. No import, build, test, capture, program
execution or new example workflow was run. No new font/default or final checked
source pin is claimed. Only the two owned Chapter7 paths were changed.

## Independent full review and provenance correction

The full independent review accounts for all65 units and confirms all15
fences and9 capture commands unchanged. No reader-facing factual or craft
blocker remains. The approximate keypad time now names its actual58d4345
run, recorded in Book39:31, separately from the78127ec captures. Book45:3,73
records the actual reruns supporting the retained startup captures. This is
retained execution evidence, not merely the old chapter's checked header.
The reviewer also compared the saved results with rc0 and same=true.
Bounded correction confirmation remains pending. No new execution occurred.

## Review closure

Independent confirmation clears70c52f0: the keypad approximation retains its actual58d4345run, distinct from78127eccaptures. No bounded source/craft finding remains.
Final source/profile/runtime and whole-book integration remain pending.
No execution accompanied confirmation.

## Mandatory bundled gate correction

The earlier mechanical-pass entry records a real omission: the available
bundled prose gate was not run. The source-only restriction was applied too
broadly to an editorial text utility. It does not excuse that missing step.
P3's actual36-file e1b26699 run includes this chapter and has zero hard
findings. The lead now also ran the bundled script on current7/19, with
exact script/input identities and findings in prose-gate-07-19.json.
Chapter7 produced no finding. This closes the current chapter's missing
mechanical check without rewriting the earlier record as if it had occurred.

Every future prose commit requires the available bundled gate and manual
context dispositions. Full passage/deletion/agency/punctuation/source passes
remain required. A clean script exit is not a quality verdict. The final
36-reader-file gate will be rerun after4/5 and the conjunction-comma pass.
No product import, assembler, build, test, emulator or capture was run.

## Bounded P3 Chapter 7 corrections

The review at c83dc06 is applied after the accepted punctuation application
f24d701. The chapter now states that TEC-OS takes the next startup line after
the program finishes. Source at ea3ef3d calls STLINE only after command
processing returns to MAINLOOP (`src/cpm/ccp.asm:119-166`). Program entry pushes
the warm-boot return word before jumping to the program
(`src/cpm/ccp.asm:527-536`). The ordinary return and terminating Ctrl-C outcomes
stay here. The program's jump to 0000h is deferred to the existing Chapter 8
program-exit explanation, with an explicit link.

The second-byte format detail is removed from the startup instructions.
Appendix H, The header, already records format 4 at offset 1 and the combined
magic/format check (`src/loader.asm:197-203`, `src/abi.inc:185-190`). That is the
actual destination of this reference fact. The renaming incompatibility warning
and Appendix D migration link remain in Chapter 7, with a new header-reference
link. No new source fact needed insertion into H.

The LCD-port and row-state aside is combined with existing destination text.
Chapter 11, The LCD and the speaker, already explains the LCD service's row-3
mark change and preservation of replacement text. Chapter 25, Recovery words
and row ownership, already states the direct-port bypass, retained CDWRD flag
and five-character overwrite, with exact source proof at
`src/services.asm:157-192` and `src/loader.asm:945-980`. Chapter 7 retains the
observable five-character clearing and points to those actual sections.
Destination paragraphs were read fully before this disposition. All source
facts are already present there, so 11, 25 and H were not edited and no active
destination writer's changes were touched.

Removed the optional introductory commas after With the Matrix switch enabled
and After DIR. Retained the condition boundary after For GLCD or a narrow PICO
width. Read every changed paragraph and list item with its neighbours, including
the unchanged display outcomes and historical captures. No changed condition,
new font/default, timing or example result is asserted.

Static comparison against f24d701 confirms all 15 fenced blocks and all HTML
comments byte-identical. The removed inline 0000h belongs to the expressly
deferred program-jump explanation. Remaining inline literals retain their bytes.
The actual bundled prose gate on the reader chapter returned zero findings.
The sentence-complexity utility also ran. Its program-exit SHORT prompts include
a wrapped-list parsing fragment and the useful destination link. The After DIR
prompt introduces the retained screen capture. Those complete passages were
read and retained. Other prompts are unchanged material outside this bounded
correction, not authority for automatic shortening or whole-book acceptance.
No product import, assembly, build, test, emulator or capture was run.
