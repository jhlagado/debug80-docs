# Source questions from the complete reading

Source-only independent checking at offered TEC-OS
`ea3ef3de9133931e925a0220d51c0e971c1fd8dd`. The initial eight findings are accepted
as rewrite constraints. No execution, new capture or physical observation is
claimed. Source ranges below belong to that offer, not the historical captures.

| Question | Checked source | Required boundary in revised prose |
| --- | --- | --- |
| BAT output | `src/console.asm:429-440` returns directly for BAT, despite the nearby LIST comment | BAT reads serial input and discards console output. Conventional CP/M LIST routing is separate from this implementation. |
| Default interrupt vector | `src/boot.asm:454-485`, `src/boot.asm:499-509` preserve a qualifying jump and skip default installation | EI/RETI at0038h is conditional on no qualifying jump being kept. |
| Warm-boot persistence and function47 | `src/boot.asm:194-215`, `src/cache.asm:307-345`, `src/cache.asm:661-668`, `src/cpm/bdos.asm:95-108` | A successful flush puts pending writes on the card before the next load. Failed lines are dropped, Write lost is printed and CHPOS is cleared, cancelling a remaining or function47 chain. Accepted syntax does not guarantee execution. |
| Card reinsertion | `src/boot.asm:119-132` versus warm path `src/boot.asm:175-215` | Reinsertion does not initialise the card. Subsequent failure is conditional, not inevitable from source alone. |
| Host image replacement | `tools/tecvol.mjs:65-70` orders parseContainer(image), writeFileSync(tmp,image), renameSync(tmp,path) | Validate bytes in memory, write the temporary file and rename it. Do not claim a temporary-file reread or explicit durability synchronisation. |
| SD token timing | `src/sd.asm:463-477`, `diag/sd.asm:241-249`, `docs/diagnostics.md:284-290` | The additional INC A and untaken JR cost11 T-states on continuing FFh polls. 678 is a whole diagnostic poll, not an alternative cost for the same work. |
| Typed GLCD on active PICO | `src/loader.asm:925-958`, `src/services.asm:629-647` | A successful typed load leaves the already-active PICO console selected. It is not replaced by a new selection of itself. Startup rejection is a separate path. |
| Browser code27 exclusion | `src/vol.asm:332-385`, `tools/lib/container.mjs:149-152`, `tools/lib/container.mjs:176` | The high-capacity page avoids the standard-card limit and validation rejects truncated images. Do not exclude all code27 causes: the ROM also checks32-bit end overflow and declared-container bounds. |

These constraints apply at every destination of the affected statement, including
extracted early safety instructions and reference entries. They do not close
whole-chapter factual review or qualify the new banner. The final source/map
references and moved navigation still need checking after the rewrite.

## Matrix enablement is not a keyboard response

At ea3ef3d src/console.asm82–88 reads STSPORT/CDMTX and stores the switch
bit in CONDEV. src/pico.asm64–86 tests that enabled bit after the VDP probe.
Describe a responding PICO and enabled Matrix switch, not two devices
answering or an independent keyboard-presence test. Corrected drafts15,23
and27 and flagged the same distinction for25 and remaining authors. No run.

## Mount validation and publication order

A complete text read of ea3ef3d src/vol.asm found the opening comment's
claim that every descriptor is checked before any drive is mounted to be
too strong. MNDESC checks one descriptor, MNSTOK calls MNONE for its assigned
drive and MNNEXT advances to the next descriptor. MNTERR calls UNMOUNT
after any later failure. Reader prose must describe the all-or-empty result
at return without claiming a separate all-descriptors validation pass before
installation. Chapter17 already gives that order. Chapter5's inherited
before-any-drive sentence is under correction. No execution or product edit.
