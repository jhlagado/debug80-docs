---
layout: default
title: "Portable Text Input and Output"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 13
---

# Portable Text Input and Output

Every program so far has left its results in storage, because the small
computers Lanternfly targets share no standard output device. An
interactive program needs a way to prompt, to receive input and to
respond. A pair of standard modules makes text portable while leaving
the device to the target:

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

The two modules export five operations whose meaning is the same on
every target that supports them.

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
two-byte sequence, and the program does not assume either. `'\n'` is
exactly the byte 10; ending a line is a service.

## Reading text

`standard/text-input.lafy` exports two value-producing operations:

```lanternfly
answer = readCharacter()
lineFits = readLine(command)
```

`readCharacter` blocks until the input device supplies one character byte
and returns it as a `u8`.

`readLine` fills a string from one input line. It evaluates its
`string[N]` destination once, waits for a line, consumes the line ending
without storing it, and replaces the destination with the received bytes.
An empty line produces the empty string, and when everything fits, the
operation returns `true`.

When a zero byte
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

## The text-service exceptions

Chapter 10's rule was exact: a string parameter names one capacity and accepts
only that capacity. `writeText` and `readLine` each accept _any_ `string[N]`;
Chapter 12's `readArgument` uses the same destination form. No source program
can declare a parameter with this property. The compiler-defined service
interfaces preserve the sealed representation and introduce no pointer value.

## Complete program

The complete module exercises all five operations in sequence: it prompts,
reads a line into a `string[16]`, reports whether the line fitted, writes it back, then
prompts again and reads one character. Because `readLine` consumes the
complete line, including its ending, the later `readCharacter` begins
with the next supplied character. At the keyboard, one distinction
applies: a target may echo input as it is typed, before either read
operation returns, and the program's own `writeText(command)` and
`writeCharacter(answer)` are separate output operations — so on an
echoing target, the accepted command and the answer character may each
appear once as they are typed and once as the program writes them.

<<< @/public/lanternfly-book/book1/code/13-portable-text.txt{lanternfly}

The source is also available as
[13-portable-text.txt](/lanternfly-book/book1/code/13-portable-text.txt).

## Exercises

1. A 20-byte line arrives for a `string[16]` destination. State what
   `readLine` stores, returns and consumes.

Answer: it stores the longest fitting prefix, returns `false` and
consumes the whole line including its ending, so the next read starts at
a new line.

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
- `writeText` and `readLine` are the two text-service capacity-generic
  exceptions, confined to compiler-defined interfaces.
