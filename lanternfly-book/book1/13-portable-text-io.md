---
layout: default
title: "Portable Text Input and Output"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 13
---

# Portable Text Input and Output

Every program so far has left its results sitting in storage, and Chapter
1 promised the reason: the small computers Lanternfly targets share no
standard output device, and the boundary needed proper treatment before
we crossed it. An interactive program needs more — a way to prompt, to
receive input and to respond. The first edition's answer is a pair of
standard modules that make text portable while leaving the device to the
target:

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

The imports follow Chapter 12's rules exactly: explicit, at the top, their
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

`readLine` fills a string from one input line. It evaluates its
`string[N]` destination once, waits for a line, consumes the line ending
without storing it, and replaces the destination with the received bytes.
An empty line produces the empty string, and when everything fits, the
operation returns `true`.

The contract is equally exact when a line does not fit. When a zero byte
arrives or the line is longer than `N`, `readLine` stores the longest
valid prefix that fits, discards the rest of that line, and returns
`false` — so the next call starts cleanly at a new line, and the
operation never requires an unbounded full-line buffer. The Boolean
result is there to act on: accept the prefix, report the problem, or read
another line.

## Deliberate limits

The five operations are deliberately narrow. There is no portable echo or
line editing; a target may provide them before the line reaches the
service. There is no end-of-file result and no nonblocking form. There are
no streams, handles, files or directories; future file operations belong
to other modules.

The interfaces are portable; the implementations remain target-supplied
bindings. A target may omit either module, and a build that uses an
operation the selected profile cannot bind is rejected rather than
silently stubbed.

## The two narrow exceptions

Chapter 10's rule was exact: a string parameter names one capacity and
accepts only that capacity. `writeText` and `readLine` are the language's
two exceptions — each accepts _any_ `string[N]`. The compiler arranges
the call itself, through a temporary of its own that no source program
can hold, store or declare a parameter like; the storage details are in
the language reference. The source rule is what matters here: the
exceptions live entirely inside these two compiler-defined interfaces,
and the sealed representation and the no-pointer rule pass through them
untouched.

## Complete program

The [chapter listing](/lanternfly-book/book1/code/13-portable-text.txt)
exercises all five operations in sequence: it prompts, reads a line into
a `string[16]`, reports whether the line fitted, writes it back, then
prompts again and reads one character. Because `readLine` consumes the
complete line, including its ending, the later `readCharacter` begins
with the next supplied character. At the keyboard, one distinction
applies: a target may echo input as it is typed, before either read
operation returns, and the program's own `writeText(command)` and
`writeCharacter(answer)` are separate output operations — so on an
echoing target, the accepted command and the answer character may each
appear once as they are typed and once as the program writes them.

## Exercises

1. A 20-byte line arrives for a `string[16]` destination. State what
   `readLine` stores, returns and consumes.
2. Why is `writeNewline()` a service while `'\n'` is just a byte?
3. The program prints a prompt and the person's typing appears twice on
   one target. What happened, and is the program wrong?

Answers: the longest fitting prefix, `false`, and the whole line
including its ending, so the next read starts cleanly; ending a line is
device-specific — one target sends byte 10, another a two-byte
sequence — while `'\n'` is exactly the byte 10 everywhere; the target
echoes input before the line reaches the service, and the program's own
`writeText` is a second, separate output — both behaviours are within
the contract.

## Chapter summary

- Portable text lives in two standard service modules, imported explicitly
  like any module; there is no prelude, and `standard/` belongs to the
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

Programs can now read and write text on any target that supports it — and
with input comes a new obligation. `readLine` returns `false` when a line
does not fit, and code must act on that result. The next chapter
introduces explicit failure handling.
