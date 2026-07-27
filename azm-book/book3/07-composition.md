---
layout: default
title: "Composition"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 8
---

# Composition

Every chapter so far kept the whole program in one `.asm` file. Real projects outgrow one screen: string helpers, table drivers and board-specific I/O stubs each belong in their own file.

This chapter starts with textual **`.include`**, the simplest way to share
source, and briefly contrasts it with interface files for external code. AZM
also supports module-style `.import` files with explicit `@` exports; Book 1
covers that workflow. The companion build is
[`examples/07_include_demo.asm`](examples/07_include_demo.asm) with
[`examples/lib/strings.asm`](examples/lib/strings.asm).

---

## The problem: one file stops scaling

Chapter 3's `strlen_u8` is twenty lines. Once copy, compare, ring-buffer helpers
and Chapter 1's GCD join it, the listing becomes difficult to navigate and
reusing the string walk means copying it into the next program.

The growing program needs two forms of structure:

1. **Physical split**: edit strings in one file, main flow in another.
2. **Logical contract**: callers still know which registers to set before `call`.

AZM provides **`.include`** for the physical split; register contracts document
the shared routines.

---

## `.include`: paste another file here

The directive:

```asm
.include "lib/strings.asm"
```

tells the assembler to read `lib/strings.asm` and treat its contents as source
at that exact line.

Paths resolve **relative to the file that contains the `.include`**, then
through any directories supplied with `-I`. In the companion tree,
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

### One assembly unit

After expansion, the project is a **single program**: one address space, one set
of global labels and one coordinated `.org` sequence.

![.include pastes text into one namespace; .import keeps a module's private labels behind the wall](../../assets/images/azm-book/book3/include-vs-import.svg)

Typical layout:

| File | Holds |
|------|--------|
| `main.asm` (or `07_include_demo.asm`) | `main`, `halt`, RAM labels, `.org` for data |
| `lib/strings.asm` | Subroutines only; `main` and `.org` stay in the application file |
| `constants.asm` (optional) | `.equ` shared by several includes |

The `.include` directive appears where the library code should land, often
after `main` and before data or at the bottom of the code section. Forward
references work: `call strlen_u8` in `main` is legal even when the `.include`
line appears later in the source.

### Include scope

- Non-local declarations join the including source unit, while `_name` labels remain local to their nearest non-local owner.
- Register contracts still live in `.routine` directives on callable entries.
- Recursive include/import chains are rejected with a source diagnostic. Keep
  the include graph acyclic by pointing every edge the same way: the
  application includes libraries.

---

## Shared library pattern: `lib/strings.asm`

A library file combines **included implementation** with a header comment that
states the calling convention. The companion library holds Chapter 3's length
walk:

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

Four rules keep libraries predictable:

1. **Subroutines only**, plus any private helpers (`ring_advance_index` style); `main` and `halt` live in the application file.
2. **Placement stays with the application.** A library uses `.org` only to pin code at a fixed address, which Book 3 rarely needs.
3. **Every exported routine gets register contracts**, same as [Book 1 Chapter 6](../book1/06-register-contracts.md) and Book 3 Chapters 1 to 3.
4. **Routine entries have `.routine` directives.** Prefix a label with `@` only when the library exports it for `.import`.

The application file stays short:

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

### Growing the library

The same `lib/strings.asm` can also contain Chapter 3's `strcpy_u8`,
`strcmp_u8` and `str_find_char`. Programs then include one library path instead
of duplicating each walk.

Optional **constants header**: if several files need `CHAR_L` or `RING_CAP`, a tiny `lib/strings.equ` (or `constants.asm`) that only contains `.equ` lines can be included from both the app and the library.

---

## Files and contracts

With `.include`, **the contract is documentation plus naming discipline**:

| Mechanism | What it guarantees |
|-----------|-------------------|
| `.routine in` / `.routine out` / `.routine clobbers` | Register roles at `call` and `ret` |
| `.routine` immediately before a label | Analyzer entry point for `--rc warn` |
| Prefix on globals | `str_` on string routines, `ring_` on buffer helpers — reduces label collisions |
| `.equ` in one included header | Single source for buffer size and field offsets |
| Comment block at top of `lib/*.asm` | Human-readable summary: "String convention: HL pointer, A length" |

The contract defines the caller's sequence: HL receives the input, `call`
enters the routine, A carries the result, and every register in `clobbers` is
treated as destroyed unless the caller preserved it.

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

When AZM reports a duplicate label, the conflicting declaration can be found
across the `.include` branches and given a unique non-local name.

---

## External code: `.asmi` interfaces (brief)

Chapter 3's string routines live in **your** ROM image. Monitor ROM, BIOS and emulator stubs live at fixed addresses in **someone else's** code. You still need register contracts for `--rc warn`.

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
any value kept live in A across a call whose contract says `clobbers A`. A
platform-manual change requires an update to the `.asmi`, while call sites
remain unchanged.

The interface supplies contracts; the addresses come from the platform manual
as `.equ` bindings:

```asm
MON_PRINT_CHAR .equ $0010
MON_GET_KEY    .equ $0018
```

Those sample addresses are placeholders. A real program uses the entry points
documented by its target monitor.

Contrast:

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

Same data as Chapter 3's single-file demo, now reached through two files.

---

## Examples

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

1. A `demo_data.asm` file should contain `message` and `str_len` and be included
   from `07_include_demo.asm` after the library. Assembly should still leave
   `str_len` equal to 5.
2. Chapter 3's `strcpy_u8` and `strcmp_u8` can be added to `lib/strings.asm`.
   The extended demo should copy into an eight-byte buffer and set a `copy_ok`
   byte for emulator verification.
3. A `lib/strings.equ` file contains `CHAR_L .equ 'L'` and is included once
   from `07_include_demo.asm` before `lib/strings.asm`. Main and library can
   then share one definition of the constant.
4. Two deliberately conflicting global labels named `done` in separate
   included files should produce an assembler diagnostic. A file-specific
   prefix provides the correction.
5. A one-routine `lib/math.asm` contains Chapter 1's `gcd_u16`. A new
   `08_gcd_client.asm` should include that file alone, call GCD and store the
   result.
6. A `monitor.asmi` sketch defines two `extern` routines: character output
   through A and key input returning A. Each record lists `in`, `out` and
   `clobbers` and stops there.
7. An include graph should show `main.asm` including `constants.asm`,
   `lib/strings.asm` and `lib/ring.asm` once each, and identify the cycle
   introduced if `ring.asm` includes `main.asm`.
