# ROM include-order presentation candidate

Status: separate source-listing candidate, not a standalone program or ROM
build input. The original Chapter26 fence and product source are untouched.
No assembly, product import, generation, test, emulator or capture occurred.

Read the complete Source order and reserved RAM passage, its preceding
ROM-region explanation and the full ea3ef3d src/rom.asm. The original fence
is the39-line listing at bookb8c5c28, draft/26-build-the-rom-and-media.md.
Its LF body is 919 bytes, SHA-256
`0e63a3e403c4adfd68b45575f72b6ffc564d9145e63c773b727343209c7a1cae`.

The candidate replaces tab alignment with two leading spaces and one space
after the directive. It retains uppercase %INCLUDE and every exact quoted
path in order. This is a displayed source inventory with no new executable
instructions, routines or comments. The instruction-comment floor is not
a reason to invent39 filler comments in that inventory. Directive case is
preserved instead of assuming a differently cased public directive works.

```asm
  %INCLUDE "abi.inc"
  %INCLUDE "gen/config.asm"
  %INCLUDE "gen/format.asm"
  %INCLUDE "layout.asm"
  %INCLUDE "ram.asm"
  %INCLUDE "reset.asm"
  %INCLUDE "abi.asm"
  %INCLUDE "tables.asm"
  %INCLUDE "gen/geom.asm"
  %INCLUDE "gen/font.asm"
  %INCLUDE "text.asm"
  %INCLUDE "boot.asm"
  %INCLUDE "bios.asm"
  %INCLUDE "console.asm"
  %INCLUDE "keyboard.asm"
  %INCLUDE "term.asm"
  %INCLUDE "video.asm"
  %INCLUDE "tms.asm"
  %INCLUDE "pico.asm"
  %INCLUDE "lcd.asm"
  %INCLUDE "sd.asm"
  %INCLUDE "vol.asm"
  %INCLUDE "volsvc.asm"
  %INCLUDE "volutil.asm"
  %INCLUDE "cpm/ccp.asm"
  %INCLUDE "cpm/ccpfile.asm"
  %INCLUDE "cpm/ccpmut.asm"
  %INCLUDE "cpm/ccpcmd.asm"
  %INCLUDE "cpm/bdos.asm"
  %INCLUDE "cpm/bdosfile.asm"
  %INCLUDE "cpm/bdosrec.asm"
  %INCLUDE "cpm/bdosfn.asm"
  %INCLUDE "cpm/bdoslog.asm"
  %INCLUDE "cpm/bdoscon.asm"
  %INCLUDE "services.asm"
  %INCLUDE "cache.asm"
  %INCLUDE "history.asm"
  %INCLUDE "loader.asm"
  %INCLUDE "end.asm"
```

The LF candidate body is 958 bytes, SHA-256
`fe87a97a2987cb3dc8424eab9091c20354c661b2596d4c020e8d634f6d06353c`.
It has no tabs and every line is below40 columns. Inert text extraction
confirms the exact39 paths match the original fence and ea3ef3d src/rom.asm
in order. That is a source-listing comparison, not a rebuilt-ROM result.
The generated config, format, geometry and font names do not establish
any generated-file or ROM identity.

Independent static review must confirm the listing role, preserved paths,
spacing and absence of implied execution. Before final insertion, compare
the list again with the actual adopted source offer. Do not change that
source, rebuild a ROM or transfer an old build/capture pin for a presentation
change. Physical/model results and the qualified40-column font/default
remain separate. Read the candidate and record sequentially for meaning,
paragraph purpose, agency and punctuation. No new workflow is supplied.
