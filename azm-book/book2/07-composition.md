---
layout: default
title: "Chapter 7 — Composition"
parent: "AZM Book 2 — Algorithms and Data Structures"
nav_order: 8
---
[← Recursion](06-recursion.md) | [Book 2](index.md) | [Pointer Structures →](08-pointer-structures.md)

# Chapter 7 — Composition

Every chapter so far kept the whole program in one `.asm` file. That is fine while you are learning a single algorithm. Real projects outgrow one screen: string helpers, table drivers and board-specific I/O stubs each deserve their own file — but AZM still produces **one flat listing** with no `import`, no modules and no hidden linker.

This chapter splits a tiny program across files with **`.include`**, pulls `strlen_u8` from a shared library and states the **contracts** (AZMDoc, naming, register roles) that replace a module system. The companion build is [`examples/07_include_demo.asm`](examples/07_include_demo.asm) with [`examples/lib/strings.asm`](examples/lib/strings.asm).

---

## The problem: one file stops scaling

Chapter 3's `strlen_u8` is twenty lines. Add copy, compare, ring buffer helpers and GCD from Chapter 1 — the listing scrolls, labels crowd together and you cannot reuse the string walk on the next project without copy-paste.

You need two things at once:

1. **Physical split** — edit strings in one file, main flow in another.
2. **Logical contract** — callers still know which registers to set before `call`.

AZM answers the physical split with **`.include`** plus documented globals. The CPU never sees files; the assembler merges text before it emits bytes.

---

## `.include`: paste another file here

The directive:

```asm
.include "lib/strings.asm"
```

tells the assembler to read `lib/strings.asm` and treat its contents as if you had typed them at that exact line. There is no separate link step, no export table and no namespace prefix on `call strlen_u8`.

Paths resolve **relative to the file that contains the `.include`**. In the companion tree, `07_include_demo.asm` lives in `examples/` and includes `lib/strings.asm` beside it:

```
book2/examples/
  07_include_demo.asm
  lib/
    strings.asm
```

Assemble from `examples/` so the relative path matches:

```sh
cd azm-book/book2/examples
azm 07_include_demo.asm
```

If you assemble from another working directory, either `cd` to `examples/` first or pass a path the assembler can resolve — the rule is always "path relative to the including source file," not relative to your shell cwd unless they coincide.

### One assembly unit

After expansion, the project is a **single program**: one address space, one set of global labels, one `.org` sequence you are responsible for coordinating.

Typical layout:

| File | Holds |
|------|--------|
| `main.asm` (or `07_include_demo.asm`) | `main`, `halt`, RAM labels, `.org` for data |
| `lib/strings.asm` | Subroutines only — no second `main`, no conflicting `.org` unless you intend overlay |
| `constants.asm` (optional) | `.equ` shared by several includes |

Put `.include` where the library code should land — often after `main` and before data, or at the bottom of the code section. Forward references work: `call strlen_u8` in `main` is legal even when the `.include` line appears later in the source.

### Include scope

- Not a library with a private symbol table — every label in the included file is global unless you discipline names yourself.
- Not a substitute for AZMDoc — contracts stay in `;!` comments on `@` routines.
- Not circular-safe — if `a.asm` includes `b.asm` and `b.asm` includes `a.asm`, the assembler loops until you stop it. Keep a directed acyclic graph: application includes libraries; libraries do not include the application.

---

## Shared library pattern: `lib/strings.asm`

Treat a library file as **implementation you paste in**, plus a header comment that states the calling convention. The companion library holds Chapter 3's length walk:

```asm
; strlen_u8: count bytes before null (terminator not counted)
;!      in        HL
;!      out       A
;!      clobbers  AF, B, HL
@strlen_u8:
    ld b, 0
StrLenLoop:
    ld a, (hl)
    or a
    jr z, StrLenDone
    inc hl
    inc b
    jr StrLenLoop
StrLenDone:
    ld a, b
    ret
```

Rules that keep libraries boring and reliable:

1. **No `main` and no `halt`** in the library — only subroutines and maybe private helpers (`ring_advance_index` style).
2. **No `.org` in the library** unless you are deliberately placing code at a fixed address (unusual in Book 2).
3. **Every exported routine gets AZMDoc** — same as Book 1 Chapter 12 and Book 2 Chapters 1–3.
4. **Entry labels use `@name:`** on routines the register contract analyzer should treat as callable bodies.

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

Reload HL before each call if a routine clobbers HL — the library documents that in `clobbers`.

### Growing the library

Add `strcpy_u8`, `strcmp_u8` and `str_find_char` from Chapter 3 into the same `lib/strings.asm`. The main file only grows by more `call` sites and result stores. When two programs need the same walk, they both `.include` the same library path instead of duplicating twenty lines.

Optional **constants header** — if several files need `CHAR_L` or `RING_CAP`, a tiny `lib/strings.equ` (or `constants.asm`) that only contains `.equ` lines can be included from both the app and the library. Constants do not need `@` labels; routines do.

---

## Files + contracts (no modules)

Without `import`, **the contract is documentation plus naming discipline**:

| Mechanism | What it guarantees |
|-----------|-------------------|
| `;! in` / `;! out` / `;! clobbers` | Register roles at `call` and `ret` |
| `@routine:` | Analyzer entry point for `--rc warn` |
| Prefix on globals | `str_` on string routines, `ring_` on buffer helpers — reduces label collisions |
| `.equ` in one included header | Single source for buffer size and field offsets |
| Comment block at top of `lib/*.asm` | Human-readable summary: "String convention: HL pointer, A length" |

Callers obey the contract the same way they obey Chapter 3's table: set HL, `call`, read A, assume everything in `clobbers` is garbage unless you saved it.

**Private helpers** stay local by convention: avoid `@` on helpers that are not meant to be called from outside the library file. For branch labels inside a routine body, use prefixed names (`str_loop`, `str_done`) so they stay unique across the translation unit — all labels are global to the assembler. If a helper must be shared between two routines in the same library, give it a prefixed name (`str_advance`) and document it as internal in the file header.

### Symbol collisions

Because all included text shares one namespace, two files must not both define `buffer`, `count` or `done` at global scope. Fixes:

- Prefix workspace labels: `demo_buffer`, `demo_str_len`.
- Prefix library routines: `str_strlen_u8` if you ever link two libraries that both exported `strlen_u8` — rename once, update AZMDoc and all `call` sites.
- Keep branch labels **unique** by prefixing them with the routine name (`StrLenLoop`, `FindScan`).

When the assembler reports "duplicate label," search all `.include` branches — the second definition wins silently in some tools; in AZM treat it as an error to fix immediately.

---

## External code: `.asmi` interfaces (brief)

Chapter 3's string routines live in **your** ROM image. Monitor ROM, BIOS and emulator stubs live at fixed addresses in **someone else's** code. You still need register contracts for `--rc warn`, but there is no AZM source to paste with `.include`.

Book 1 Chapter 12 introduced **`.asmi`** files: contract records only, no instructions:

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

Your program `call`s `MON_PRINT_CHAR` like any other label; the analyzer checks that you do not keep A live across the call if `clobbers A` says otherwise. Update the `.asmi` when the platform manual changes — the call sites stay the same.

Contrast:

| Feature | `.include "lib.asm"` | `.asmi` + `extern` |
|---------|----------------------|---------------------|
| Delivers | Source pasted into your program | Contracts only |
| Code in output | Yes — your bytes | No — you supply address binding separately |
| Typical use | Your reusable subroutines | ROM / monitor / third-party binary |

Book 2 examples stay self-contained in RAM; `.asmi` matters when you wire the same libraries into hardware later.

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

Same result as Chapter 3's single-file demo — proof that the include did not change the algorithm, only where the listing lives on disk.

---

## Examples

| File | Role |
|------|------|
| [`examples/07_include_demo.asm`](examples/07_include_demo.asm) | `main` + `.include` + data/results |
| [`examples/lib/strings.asm`](examples/lib/strings.asm) | Shared `strlen_u8` with AZMDoc |

```sh
cd azm-book/book2/examples
azm 07_include_demo.asm
azm --rc warn 07_include_demo.asm
```

Step into `strlen_u8` once: confirm the library file's labels appear in the listing at the include point, and that `str_len` is 5 at `$8008`.

---

## Summary

- **`.include "path"`** pastes another `.asm` file into the current unit; paths are relative to the including file.
- There is **no module system** — one address space, global labels, **files + AZMDoc contracts** instead of `import`.
- **Library files** hold subroutines (and optional `.equ` headers), not `main`, not stray `.org`.
- **`@routine:`** and `;!` tags stay mandatory so `--rc warn` can check callers across file boundaries.
- **Prefix names** and dotted loop labels avoid duplicate global symbols when includes multiply.
- **`.asmi`** documents external ROM/monitor routines for the analyzer; it does not paste implementation.

---

## Exercises

1. Move `message` and `str_len` into `demo_data.asm`. Include it from `07_include_demo.asm` after the library include. Assemble and confirm `str_len` is still 5.
2. Add `strcpy_u8` and `strcmp_u8` from Chapter 3 to `lib/strings.asm`. Extend the demo to copy into an 8-byte buffer, set a `copy_ok` byte like Chapter 3 and verify in the emulator.
3. Create `lib/strings.equ` with `CHAR_L .equ 'L'` and include it from both the library and main. Remove duplicate `.equ` lines from main.
4. Deliberately define two global labels named `done` in different included files. Record the assembler error, then fix one label with a file-specific prefix.
5. Write a one-routine `lib/math.asm` with `gcd_u16` from Chapter 1. Include it from a new `08_gcd_client.asm` that only calls GCD and stores the result — no string code in that binary.
6. Sketch a `monitor.asmi` with two `extern` routines you might call on a machine with a character output routine in A and a key reader returning A. List `in`, `out` and `clobbers` for each without writing Z80 bodies.
7. Draw the include graph for a project with `main.asm` → `lib/strings.asm`, `lib/ring.asm` and `constants.asm` included by both libraries. Which edges would create a cycle if `ring.asm` included `main.asm`?

---

[← Recursion](06-recursion.md) | [Book 2](index.md) | [Pointer Structures →](08-pointer-structures.md)
