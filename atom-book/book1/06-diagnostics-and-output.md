---
title: "Diagnostics and Output"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 6
---

# Diagnostics and Output

Atom assigns addresses and produces instruction and data bytes as it reads
the source. A successful build has resolved every referenced symbol and
checked that each value fits its destination. A failed build reports the
source location where assembly could not continue.

## Source errors

A source diagnostic identifies the file, line and byte column when available.
Line and column numbers begin at one. A tab occupies one source byte, so its
reported column may differ from its visual position in an editor.

Included files retain their own names and source locations. Preprocessing
preserves those locations even when a conditional block is omitted.

Typical causes of failure include an unknown instruction, an invalid operand
combination, a duplicate symbol, a value outside its allowed range or an
unresolved symbol at the end of assembly. A reported location can be the point
where an error becomes detectable. For example, a forward branch cannot be
checked for range until its target address is known.

The exact message format and status codes are documented in the
[Node guide](../using-atom-on-node.md#diagnostics) and
[CP/M guide](../using-atom-on-cpm.md#messages-and-status-codes).

## Forward references

An instruction may use a label declared later in the source. Atom emits space
for the value and records a pending reference. When the label is declared,
Atom checks the value and supplies the replacement bytes.

```asm
ORG 100H
    JP START
    DB 0
START:
    RET
```

Here `START` is at `0104H`. The completed instruction is `C3 04 01`,
followed by `00 C9`. The address bytes are in little-endian order.

A pending reference must fit the original instruction. Atom does not expand
an out-of-range `JR` into `JP`. The restrictions on unresolved expressions
are described in [Addresses, Constants and Expressions](03-addresses-constants-and-expressions.md).

## Addresses and file contents

`ORG` changes the logical address. It does not produce an instruction or
relocate code that has already been assembled. An initial `ORG 4000H` places
the first emitted byte at address `4000H`; the address is distinct from its
position in an output file.

`DS COUNT` reserves addresses without initialising them in the source.
Materialised output fills reserved space and internal gaps with zero bytes.
`DS COUNT,FILL` instead specifies the bytes to emit.

Forward references must be patched before the program can run. COM and BIN
files contain the completed bytes. Intel HEX also records the destination
addresses. A COM file has no header and uses CP/M's load and entry address
of `0100H`.

Output selection and storage depend on the host. The [Node guide](../using-atom-on-node.md#output-files)
covers binary files, listings and debugger maps. The
[CP/M guide](../using-atom-on-cpm.md#output-and-failed-builds) covers disk
output and failed-build handling.
