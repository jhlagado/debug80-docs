---
layout: default
title: "Source Parts and the System Boundary"
parent: "Programming Nucleus"
nav_order: 14
---

# Source Parts and the System Boundary

A useful program soon spans more than one source file and needs to communicate
with its environment. Nucleus keeps both jobs narrow so the Z80 compiler can
remain a streaming compiler without a filesystem.

## Ordered source parts

The host gives the compiler an ordered sequence of source parts. The compiler
sees one declaration stream and one program scope. A declaration in an earlier
part is available to a later part; a later declaration is not available
backwards merely because it is in another file.

The command line takes an explicit ordered file list, and a version 1 project
records that same order. Put libraries before the source parts that use them.
The chapter's multipart companion is built in this order:

```sh
nucleus build -o build/parts.nobj examples/14-parts/library.nu \
  examples/14-parts/main.nu
```

[`library.nu`](examples/14-parts/library.nu) defines `observed` and `doubled`;
[`main.nu`](examples/14-parts/main.nu) uses both. Reversing the arguments is
invalid because the declaration stream would encounter those uses first.

The source format leaves room for a host resolver to discover dependencies
from preserved header comments:

```nucleus
//% import "drivers/display.nu"
```

The compiler already sees this line as an ordinary `//` comment. A resolver can
read it, order each dependency before its importer and still pass the original
source bytes as separate parts. File lookup, duplicate elimination and cycle
diagnostics belong to that host. The current standalone command line does not
perform this discovery; it uses its explicit arguments or project source list.

## Portable byte services

Six predefined failable routines provide sequential input, output and bulk
storage. They transfer one byte at a time and use the error rules from Chapter 13. The launcher chooses the actual streams; source has no filename or file
descriptor.

## Machine-specific boundaries

`readPort(port)` and `writePort(port, value)` expose the Z80's separate 16-bit
I/O address space through typed operations. They are infallible language
operations; the target decides what a port means.

The packet gateway is a complete statement:

```nucleus
service(1, packet)
```

Its slot is a constant byte. Its packet is a complete writable `u8[N]` array or
`u8[]` view, so the provider receives a known address and retained byte count.
Typed library wrappers should hide machine-specific slot numbers and packet
formats from application code.

The companion contains port and packet examples in an uncalled routine, then
executes a portable `main`. This verifies their source contracts without
claiming that the book's generic test target implements a device.

<<< @/nucleus/book1/examples/14-system-boundary.nu{nucleus}

## Summary

- The compiler receives ordered source parts, not filenames to discover.
- `//% import` is a preserved comment interpreted only by the host resolver.
- All parts share declaration order and one program scope.
- Portable services transfer bytes through host-selected streams.
- Ports and packet services are explicit machine-specific boundaries.

See [program structure](../language/04-program-and-compilation-structure.md),
[the system boundary](../language/16-system-boundary.md) and the standalone
[Host API](https://github.com/jhlagado/nucleus/blob/886cd95b1d0df42cb4bfb96b5fa870a6090debe6/docs/host-api.md).
The checked companion is
[`14-system-boundary.nu`](examples/14-system-boundary.nu).
