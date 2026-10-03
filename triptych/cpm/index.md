---
title: CP/M essentials
nav_order: 1
standalone: true
sidebar_link: CP/M overview
---

# CP/M essentials

CP/M is the operating system running inside the emulated computer. It loads
programs and provides access to disk files and the terminal. Triptych is the
machine environment around it. The browser's file-management controls operate
on the emulated disks while the CP/M prompt accepts commands inside the guest
computer.

## The prompt and current drive

At an `A>` prompt, A is the current drive. Entering `B:` selects drive B.
`DIR` lists files on the current drive and `TYPE POSTAGE.SK8` displays a source
file. Enter each command followed by Return. The prompt itself is not part of
the command.

A setup may contain protected release disks and writable personal disks. Use
a writable disk for editor output and generated programs. The course's Skate
starter uses B for this purpose. A different Triptych setup can have a different
arrangement, so check the selected configuration before working on a file.

## Source and executable files

CP/M filenames have a name of up to eight characters and an optional extension
of up to three. `POSTAGE.SK8` is source text and `POSTAGE.COM` is an executable.
`EDIT POSTAGE.SK8` starts the editor with that source. `SKATE POSTAGE.SK8`
compiles it. Entering `POSTAGE` loads and runs the executable.

After a compilation failure, check the diagnostic before running a program. An older `.COM` file may still be present. Check the
compilation result before treating a later run as evidence of your edit.

## Saving work

Ctrl-S in EDIT saves text into the guest disk and Ctrl-Q exits the editor.
Persisting that disk in browser storage is a separate step handled by the
browser host. A downloaded backup keeps a copy outside that browser profile.
Resetting the machine does not save text still held only in the editor.

The detailed browser controls depend on the Triptych release. Consult its
[browser guide](https://github.com/jhlagado/triptych/blob/main/docs/browser-quick-start.md)
for file transfers and backup operations matching your setup.

[Return to Programming Skate](../../skate/book1/)
