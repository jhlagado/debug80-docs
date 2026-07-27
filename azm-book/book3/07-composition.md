---
layout: default
title: "Source Composition"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 8
---

# Source Composition

Every algorithm so far has fitted in one `.asm` file. [Book 1 Chapter
7](../book1/07-ops-aliases.md) explains AZM's source-composition mechanisms:
textual **`.include`** and module-style `.import` with explicit `@` exports.
This chapter applies that material by moving the Chapter 3 string walk into a
library while the application retains control of code and data placement. The
two-file build is
[`examples/07_include_demo.asm`](examples/07_include_demo.asm) with
[`examples/lib/strings.asm`](examples/lib/strings.asm).

---

## Splitting an algorithm library

Chapter 3's `strlen_u8` is twenty lines. Once copy, compare, ring-buffer helpers
and Chapter 1's GCD join it, the listing becomes difficult to navigate and
reusing the string walk means copying it into the next program.

The growing program needs two forms of structure:

1. **Physical split**: edit strings in one file, main flow in another.
2. **Logical contract**: callers still know which registers to set before `call`.

The example uses **`.include`** for the physical split and register contracts
for the shared routine interface.

---

## The example's include boundary

The directive:

```asm
.include "lib/strings.asm"
```

treats `lib/strings.asm` as source at that exact line.

Paths resolve **relative to the file that contains the `.include`**, then
through any directories supplied with `-I`. In the example tree,
`07_include_demo.asm` lives in `examples/` and includes `lib/strings.asm`:

```
book3/examples/
  07_include_demo.asm
  lib/
    strings.asm
```

From the `book3/` directory:

```sh
azm examples/07_include_demo.asm
```

The include still resolves relative to `07_include_demo.asm`, not to the shell's
working directory.

### Placement in one assembly unit

The two physical files still form a **single program**: one address space, one
set of global labels and one coordinated `.org` sequence.

![.include pastes text into one namespace; .import keeps a module's private labels behind the wall](../../assets/images/azm-book/book3/include-vs-import.svg)

Typical layout:

| File | Holds |
|------|--------|
| `main.asm` (or `07_include_demo.asm`) | `main`, `halt`, RAM labels, `.org` for data |
| `lib/strings.asm` | Subroutines only; `main` and `.org` stay in the application file |
| `constants.asm` (optional) | `.equ` shared by several includes |

The `.include` directive determines where the library code lands. It often
appears after `main` and before data or at the bottom of the code section.
Forward references allow `call strlen_u8` in `main` even when the `.include`
line appears later.

### Consequences for the library

- Non-local declarations join the including source unit, while `_name` labels remain local to their nearest non-local owner.
- Register contracts still live in `.routine` directives on callable entries.
- Recursive include/import chains are rejected with a source diagnostic. Keep
  the include graph acyclic by pointing every edge the same way: the
  application includes libraries.

---

## The string library

The included implementation begins with a header comment that states the
calling convention. The library contains Chapter 3's length walk:

```asm
; strlen_u8: count bytes before null (terminator not counted)
.routine in HL out A clobbers F,B,HL
strlen_u8:
    ld b, 0
_loop:
    ld a, (hl)
    or a
    jr z, _done
    inc hl
    inc b
    jr _loop
_done:
    ld a, b
    ret
```

Four rules define this library's boundary:

1. **Subroutines only**, plus any private helpers (`ring_advance_index` style); `main` and `halt` live in the application file.
2. **Placement stays with the application.** A library uses `.org` only to pin code at a fixed address, which Book 3 rarely needs.
3. **Every shared routine gets a register contract**, following [Book 1 Chapter
   6](../book1/06-register-contracts.md) and Book 3 Chapters 1 to 3.
4. **Routine entries have `.routine` directives.** Prefix a label with `@` only when the library exports it for `.import`.

The application keeps `main`, placement and storage:

```asm
DemoData .type
message  .field byte[8]
str_len  .byte
.endtype

DEMO_BASE .equ $8000

.org $0000
main:
    ld hl, message
    call strlen_u8
    ld (str_len), a
    halt

.include "lib/strings.asm"

.org DEMO_BASE
message:
    .db "HELLO", 0

.org DEMO_BASE + offset(DemoData, str_len)
str_len:
    .ds byte
```

The message text is six bytes but the field reserves eight, so `str_len` keeps
its address when the message changes. `offset(DemoData, str_len)` is where that
decision lives; a second `.org $8008` would be the same number written down a
second time, free to drift when the field widens.

### Adding more string walks

The same `lib/strings.asm` can also contain Chapter 3's `strcpy_u8`,
`strcmp_u8` and `str_find_char`. Programs then include one library path instead
of duplicating each walk.

Optional **constants header**: if several files need `CHAR_L` or `RING_CAP`, a tiny `lib/strings.equ` (or `constants.asm`) that only contains `.equ` lines can be included from both the app and the library.

---

## Register contracts across files

With `.include`, each shared routine still has the same callable interface it
had in one file:

| Mechanism | What it guarantees |
|-----------|-------------------|
| `.routine in` / `.routine out` / `.routine clobbers` | Register roles at `call` and `ret` |
| `.routine` immediately before a label | Analyzer entry point for `--rc warn` |
| Prefix on globals | `str_` on string routines, `ring_` on buffer helpers — reduces label collisions |
| `.equ` in one included header | Single source for buffer size and field offsets |
| Comment block at top of `lib/*.asm` | Human-readable summary: "String convention: HL pointer, A length" |

For `strlen_u8`, HL receives the input, `call` enters the routine, A carries the
result and every register in `clobbers` is treated as destroyed unless the
caller preserved it.

**Private helpers** use ordinary non-local names when several routines in the source unit call them.

### Symbol collisions

Because included text shares one source-unit namespace, a non-local label such
as `buffer` or `count` may be defined once across all the included files. The
usual remedies are:

- Workspace labels can carry a prefix: `demo_buffer`, `demo_str_len`.
- Library routines can carry a prefix such as `str_strlen_u8` if two included
  libraries both define `strlen_u8`. A rename also requires updates to register
  contracts and every `call` site.
- Owner-local branch labels such as `_loop` and `_found` let another routine
  reuse those spellings under its own owner.

When AZM reports a duplicate label, the conflicting declarations across the
`.include` branches need distinct non-local names.

---

## A separate boundary for external code

The string routines contribute bytes to the current ROM image. Monitor ROM,
BIOS and emulator stubs already exist at fixed addresses, so an `.asmi`
interface supplies their register contracts to `--rc warn`.

[Book 1 Chapter 6](../book1/06-register-contracts.md) covers **`.asmi`** files, which contain contract records
alone:

```
extern MON_PRINT_CHAR
in A
clobbers A
end

extern MON_GET_KEY
out A
out zero
clobbers carry
end
```

The interface is loaded during assembly:

```sh
azm --interface monitor.asmi --rc warn main.asm
```

The program `call`s `MON_PRINT_CHAR` like any other label. The analyzer reports
a value kept live in A across a call whose contract says `clobbers A`. A
platform-manual change updates the `.asmi`; call sites continue to use the same
symbol.

The interface supplies contracts; the addresses come from the platform manual
as `.equ` bindings:

```asm
MON_PRINT_CHAR .equ $0010
MON_GET_KEY    .equ $0018
```

Those sample addresses are placeholders. A real program uses the entry points
documented by its target monitor.

The two mechanisms carry different material into the build:

| Feature | `.include "lib.asm"` | `.asmi` + `extern` |
|---------|----------------------|---------------------|
| Delivers | Source pasted into your program | Contracts only |
| Code in output | Yes, your bytes | No, you supply the address binding separately |
| Typical use | Your reusable subroutines | ROM / monitor / third-party binary |

![An interface file carries contracts across the boundary, while the code and its addresses stay on their own sides](../../assets/images/azm-book/book3/asmi-boundary.svg)

---

## Address space after `halt`

The include expands before anything is placed, so the library's bytes sit at
the point its `.include` line appeared and the call to it is an ordinary
address:

![The library lands where its include line was, and the call to it is a plain address](../../assets/images/azm-book/book3/include-address-space.svg)

The RAM state matches Chapter 3's single-file demo, now produced from two source
files.

---

## Building the two-file example

| File | Role |
|------|------|
| [`examples/07_include_demo.asm`](examples/07_include_demo.asm) | `main` + `.include` + data/results |
| [`examples/lib/strings.asm`](examples/lib/strings.asm) | Shared `strlen_u8` with register contracts |

```sh
azm examples/07_include_demo.asm
azm --rc warn examples/07_include_demo.asm
```

A trace through `strlen_u8` shows the library labels at the include point in the
listing and leaves `str_len` equal to 5 at `$8008`.

---

## Exercises

[Exercise notes](exercise-notes.md#chapter-7-source-composition) give results,
checks and implementation guidance.

1. **Include graph and placement.** An include graph should show `main.asm`
   including `constants.asm`, `lib/strings.asm` and `lib/ring.asm` once each.
   It should mark the source position at which each library emits bytes and
   identify the edge that would create a cycle if `ring.asm` included
   `main.asm`.
2. **Composed string library.** An included string library gains the Chapter 3
   copy and compare routines. Its client should copy `"HELLO"` into an
   eight-byte buffer, compare it with the source and store `copy_ok = 1`.
   Register contracts must remain beside their routine entries, and
   `azm --rc warn` must accept the client calls.
3. **Shared symbols and diagnostics.** One constants include containing
   `CHAR_L .equ 'L'` should serve both client and library. A duplicate
   non-local `done` label in two included files should produce a diagnostic;
   descriptive prefixes or owner-local labels should repair the collision.
4. **Contract-only boundary.** A `monitor.asmi` should describe one external
   character-output routine that takes A and one key routine that returns A.
   A deliberately invalid client can keep a live A value across the first call
   to demonstrate the register-contract warning; the corrected client should
   preserve or reload that value.

### Extensions

5. **Extension — Single-purpose math build.** A `lib/math.asm` containing
   `gcd_u16` can be included by a client that computes GCD(270, 192) and stores
   `$0006`. The map or listing should show the math routine and no
   string-routine labels or bytes.
6. **Extension — Include and import boundaries.** A short design should show
   how the same string library's public entry labels change for module-style
   `.import`, including the exported `@` entries and the helpers that remain
   private. The comparison should identify the namespace difference from
   textual `.include`.
