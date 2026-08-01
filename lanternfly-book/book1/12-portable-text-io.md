---
layout: default
title: "Portable Text Input and Output"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 12
---

# Portable Text Input and Output

Every program so far has left its results sitting in storage, and Chapter
1 promised the reason: the small computers Lanternfly targets share no
standard output device, and the boundary deserved proper treatment before
we crossed it. An interactive program cannot wait forever, though — it must
ask, listen and answer. The first edition's answer is a pair of standard
modules that make text portable while leaving the device to the target:

```lanternfly
// greet.lafy
import "standard/text-output.lafy"
import "standard/text-input.lafy"

var command as string[16]
var lineFits as boolean = false

sub promptForCommand()
    writeText("COMMAND? ")
    lineFits = readLine(command)
end
```

The imports follow Chapter 11's rules exactly: explicit, at the top, their
exports entering the ordinary value scope. What arrives is five operations
whose meaning is the same on every target that supports them.

## Writing text

`standard/text-output.lafy` exports three operations:

```lanternfly
writeCharacter('A')
writeText("READY")
writeNewline()
```

`writeCharacter` transfers one `u8` character byte to the target-selected
output device. `writeText` transfers a whole payload — a string literal or
any `string[N]` storage path — in order, reading the string without
changing it. `writeNewline` ends the line in whatever way the device ends
lines: one target may send Chapter 2's `lineFeed` byte, another a
two-byte sequence, and the program does not assume either. That is the
distinction `lineFeed` foreshadowed: `'\n'` is exactly the byte 10, while
ending a line is a service.

## Reading text

`standard/text-input.lafy` exports two value-producing operations:

```lanternfly
answer = readCharacter()
lineFits = readLine(command)
```

`readCharacter` waits until the input device supplies one character byte
and returns it as a `u8`.

`readLine` fills a string from one input line, and its contract is worth
reading closely because it spells out exactly what happens when a line
does not fit. It evaluates
its `string[N]` destination once, waits for a line, consumes the line
ending without storing it, and replaces the destination with the received
bytes. An empty line produces the empty string. When everything fits, it
returns `true`. When a zero byte arrives or the line is longer than `N`,
it stores the longest valid prefix that fits, discards the rest of that
line, and returns `false` — so the next call starts cleanly at a new line,
and no hidden full-line buffer exists anywhere. The Boolean is the
program's to act on: accept the prefix, complain, or ask again.

## What the contract leaves out

The five operations are deliberately narrow. There is no portable echo or
line editing; a target may provide them before the line reaches the
service. There is no end-of-file result and no nonblocking form. There are
no streams, handles, files or directories; future file operations belong
to other modules. A contract this small is one every target can implement.

The modules are optional in the same way targets are real: the selected
profile must bind each operation a program actually uses, and a build for
a target that cannot supply one is rejected rather than silently stubbed.

## The two narrow exceptions

Chapter 9's rule was exact: a string parameter names one capacity and
accepts only that capacity. `writeText` and `readLine` are the language's
two exceptions: each accepts *any* `string[N]`, because the compiler
forms a temporary carrier holding the storage class, payload location and
layout for the duration of the call. The carrier is not a value: source
cannot store, return, compare or rebind it, and no routine we write can
declare a parameter like it. The exceptions live entirely inside these two
compiler-defined interfaces, and the sealed representation and the
no-pointer rule pass through them untouched.

## Example

The [chapter listing](/lanternfly-book/book1/code/12-portable-text.txt)
exercises all five operations in one conversation: it prompts, reads a
line into a `string[16]`, reports whether the line fitted, echoes it back,
then asks a one-character question and answers it. Reading the line first
and the single character second keeps the input stream clean — `readLine`
always finishes its line, so `readCharacter` begins on a fresh one.

## Chapter summary

- Portable text lives in two standard modules, imported explicitly like
  any module; there is no prelude, and `standard/` belongs to the
  toolchain.
- `writeCharacter`, `writeText` and `writeNewline` transfer bytes, whole
  strings and target-appropriate line endings outward.
- `readCharacter` returns one byte; `readLine` fills any `string[N]`,
  returns whether the line fitted, and always finishes the line it
  started.
- The contract omits echo, editing, end-of-file, streams and files, and a
  target that cannot bind a used operation rejects the build.
- `writeText` and `readLine` are the language's two capacity-generic
  exceptions, carried by compiler-only temporaries that source can never
  hold.

Our programs can now hold a conversation. What they cannot yet do is reach
the parts of a machine that no portable contract covers — and that, at
last, is the final chapter.
