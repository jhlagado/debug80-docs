---
layout: default
title: "Composition"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 8
---
[← Recursion](06-recursion.md) | [Book 3](index.md) | [Pointer Structures →](08-pointer-structures.md)

# Chapter 7 — Composition

Every chapter so far kept the whole program in one `.asm` file. Real projects outgrow one screen: string helpers, table drivers and board-specific I/O stubs each belong in their own file.

This chapter starts with textual **`.include`**, the simplest way to share
source, and briefly contrasts it with interface files for external code. AZM
also supports module-style `.import` files with explicit `@` exports; Book 1
covers that workflow. The companion build is
[`examples/07_include_demo.asm`](examples/07_include_demo.asm) with
[`examples/lib/strings.asm`](examples/lib/strings.asm).

---

## The problem: one file stops scaling

Chapter 3's `strlen_u8` is twenty lines. Add copy, compare, ring buffer helpers and GCD from Chapter 1. The listing scrolls, labels crowd together and you cannot reuse the string walk on the next project without copy-paste.

You need two things at once:

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

tells the assembler to read `lib/strings.asm` and treat its contents as if you had typed them at that exact line. There is no separate link step, no export table and no namespace prefix on `call strlen_u8`.

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

After expansion, the project is a **single program**: one address space, one set of global labels, one `.org` sequence you are responsible for coordinating.

Typical layout:

| File | Holds |
|------|--------|
| `main.asm` (or `07_include_demo.asm`) | `main`, `halt`, RAM labels, `.org` for data |
| `lib/strings.asm` | Subroutines only — no second `main`, no conflicting `.org` unless you intend overlay |
| `constants.asm` (optional) | `.equ` shared by several includes |

Put `.include` where the library code should land (often after `main` and before data, or at the bottom of the code section). Forward references work: `call strlen_u8` in `main` is legal even when the `.include` line appears later in the source.

### Include scope

- Not a separate private symbol table: non-local declarations join the including source unit, while `_name` labels remain local to their nearest non-local owner.
- Not a substitute for register contracts; contracts stay in `.routine` directives on callable entries.
- Recursive include/import chains are rejected with a source diagnostic. Keep a directed acyclic graph: application includes libraries; libraries do not include the application.

---

## Shared library pattern: `lib/strings.asm`

Treat a library file as **implementation you paste in**, plus a header comment that states the calling convention. The companion library holds Chapter 3's length walk:

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

Rules that keep libraries boring and reliable:

1. **No `main` and no `halt`** in the library, only subroutines and maybe private helpers (`ring_advance_index` style).
2. **No `.org` in the library** unless you are deliberately placing code at a fixed address (unusual in Book 3).
3. **Every exported routine gets register contracts**, same as Book 2 Chapter 12 and Book 3 Chapters 1–3.
4. **Routine entries have `.routine` directives.** Prefix a label with `@` only when the library exports it for `.import`.

The application file stays short:

```asm
.org $0000
main:
    ld hl, message
    call strlen_u8
    ld (str_len), a
    halt

.include "lib/strings.asm"

.org $8000
message:
    .db "HELLO", 0

.org $8008
str_len:
    .ds byte
```

### Growing the library

Add `strcpy_u8`, `strcmp_u8` and `str_find_char` from Chapter 3 into the same `lib/strings.asm`. When two programs need the same walk, they both `.include` the same library path instead of duplicating twenty lines.

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

Callers obey the contract the same way they obey Chapter 3's table: set HL, `call`, read A, assume everything in `clobbers` is garbage unless you saved it.

**Private helpers** use ordinary non-local names when several routines in the source unit call them.

### Symbol collisions

Because included text shares one source-unit namespace, two files must not both define `buffer` or `count` as non-local labels. Fixes:

- Prefix workspace labels: `demo_buffer`, `demo_str_len`.
- Prefix library routines: `str_strlen_u8` if two included libraries both define `strlen_u8`; rename once, update register contracts and all `call` sites.
- Use owner-local branch labels such as `_loop` and `_found`; another routine may reuse those spellings under its own owner.

When AZM reports a duplicate label, search all `.include` branches and rename
one of the non-local declarations.

---

## External code: `.asmi` interfaces (brief)

Chapter 3's string routines live in **your** ROM image. Monitor ROM, BIOS and emulator stubs live at fixed addresses in **someone else's** code. You still need register contracts for `--rc warn`, but there is no AZM source to paste with `.include`.

Book 2 Chapter 12 introduced **`.asmi`** files: contract records only, no instructions:

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

Assemble with the interface loaded:

```sh
azm --interface monitor.asmi --rc warn main.asm
```

Your program `call`s `MON_PRINT_CHAR` like any other label; the analyzer checks that you do not keep A live across the call if `clobbers A` says otherwise. Update the `.asmi` when the platform manual changes; the call sites stay the same.

Contrast:

| Feature | `.include "lib.asm"` | `.asmi` + `extern` |
|---------|----------------------|---------------------|
| Delivers | Source pasted into your program | Contracts only |
| Code in output | Yes — your bytes | No — you supply address binding separately |
| Typical use | Your reusable subroutines | ROM / monitor / third-party binary |

---

## Memory layout after `halt`

Companion program after a successful run:

```
  $8000  ┌──┬──┬──┬──┬──┬──┐
         │48│45│4C│4C│4F│00│  message ("HELLO" + null)
  $8008  ├──┐
         │05│                 str_len
         └──┘
```

Same result as Chapter 3's single-file demo.

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

Step into `strlen_u8` once: confirm the library file's labels appear in the listing at the include point, and that `str_len` is 5 at `$8008`.

---

## Exercises

1. Move `message` and `str_len` into `demo_data.asm`. Include it from `07_include_demo.asm` after the library include. Assemble and confirm `str_len` is still 5.
2. Add `strcpy_u8` and `strcmp_u8` from Chapter 3 to `lib/strings.asm`. Extend the demo to copy into an 8-byte buffer, set a `copy_ok` byte like Chapter 3 and verify in the emulator.
3. Create `lib/strings.equ` with `CHAR_L .equ 'L'` and include it from both the library and main. Remove duplicate `.equ` lines from main.
4. Deliberately define two global labels named `done` in different included files. Record the assembler error, then fix one label with a file-specific prefix.
5. Write a one-routine `lib/math.asm` with `gcd_u16` from Chapter 1. Include it from a new `08_gcd_client.asm` that only calls GCD and stores the result. No string code in that binary.
6. Sketch a `monitor.asmi` with two `extern` routines you might call on a machine with a character output routine in A and a key reader returning A. List `in`, `out` and `clobbers` for each without writing Z80 bodies.
7. Draw the include graph for a project where `main.asm` includes
`constants.asm`, `lib/strings.asm` and `lib/ring.asm` once each. The libraries
use the constants already present in the shared source unit. Which edge creates
a cycle if `ring.asm` includes `main.asm`?

---

[← Recursion](06-recursion.md) | [Book 3](index.md) | [Pointer Structures →](08-pointer-structures.md)
