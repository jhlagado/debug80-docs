---
layout: "default"
title: "16. System boundary"
parent: "Nucleus 0.1 Language Specification"
nav_order: 16
pageClass: "nucleus-specification"
---
[← 15. Safety failures and traps](15-safety-failures-and-traps.md) · [Contents](./) · [17. Complete grammar →](17-complete-grammar.md)

<div id="16-system-boundary" class="nucleus-source-anchor"></div>

# 16. System boundary

<div id="161-boundary-model" class="nucleus-source-anchor"></div>

## 16.1 Boundary model

Nucleus 0.1 defines a small portable service boundary for byte-stream input and output, slow bulk storage, successful termination, and trap reporting. Programs invoke typed predefined routines and use predefined constants. The source language exposes no service numbers, ports, firmware entry points, raw addresses, file descriptors, device registers, or machine-specific memory map.

Two explicitly target-specific boundaries sit outside the portable service
set. The typed `readPort` and `writePort` operations in Section 16.4 expose a
complete 16-bit Z80 I/O address. The packet gateway in Section 16.5 exposes a
machine-interface slot and writable byte packet. Neither boundary exposes a
memory address, source pointer, register, or general machine-code escape.

Nucleus source contains no physical placement, and a target description contains
no source-symbol reference. The packaging layer selects and orders source
parts; the target description supplies bounded execution regions. Neither input
can name or rewrite entities owned by the other.

The **Nucleus System Services 0.1** set is versioned with this language revision. A conforming execution environment supplies every service in Section 16.3 with the stated source contract and the initial stream states stated there. Later additions require a language revision or an explicit extension under Section 1.7.

<div id="162-predefined-error-codes" class="nucleus-source-anchor"></div>

## 16.2 Predefined error codes

The compiler establishes these `u8` constants before the first source token:

| Name             | Value | Meaning                                                                      |
| ---------------- | ----: | ---------------------------------------------------------------------------- |
| `endOfInput`     |     1 | The selected input stream has no further byte.                               |
| `inputFailure`   |     2 | Standard input could not supply a byte for a reason other than end of input. |
| `outputFailure`  |     3 | Standard output could not accept a byte.                                     |
| `storageFailure` |     4 | A bulk-storage read, write, rewind, or seek failed.                          |

The names occupy the ordinary program namespace and cannot be redeclared or shadowed. They are named recoverable-error codes, not enumeration members or a distinct error type.

<div id="163-predefined-routines" class="nucleus-source-anchor"></div>

## 16.3 Predefined routines

The compiler establishes these routine signatures before the first source token:

```nucleus
sub readInputByte() as u8 fails
sub writeOutputByte(value as u8) fails
sub readStorageByte() as u8 fails
sub rewindStorageInput() fails
sub writeStorageByte(value as u8) fails
sub seekStorageOutput(offset as u16) fails
```

The declarations above state interfaces; they are not source definitions and do not require completing bodies in the compilation unit.

Standard input starts with its cursor before the first supplied byte. `readInputByte` obtains the next byte from standard input. It may block until a byte, end-of-input condition, or input failure is available. It succeeds with the byte and advances the cursor, fails with `endOfInput` at the end, else fails with `inputFailure` for another input error. Failure leaves the cursor unchanged.

Standard output starts empty and is append-only. `writeOutputByte` appends one byte to standard output. It succeeds after the byte has been accepted else fails with `outputFailure`. Successful writes occur in call order; failure leaves the output unchanged.

The bulk-storage routines operate on one logical input stream and one logical output stream selected by the execution environment. Both cursors start at offset zero. The output supplied to a Chapter 18 conformance run starts empty. `readStorageByte` advances the input cursor after a successful byte and reports `endOfInput` or `storageFailure` otherwise. `rewindStorageInput` moves the input cursor to offset zero or reports `storageFailure`.

`writeStorageByte` overwrites the existing byte when the output cursor is below the current end, appends when the cursor is exactly at the end, and advances the cursor by one on success. It never inserts a byte or truncates later bytes. `seekStorageOutput` moves that cursor to an existing offset or exactly to the current end; seeking past the end fails with `storageFailure`. Every failed bulk-storage operation is atomic: it leaves its affected cursor and all output contents unchanged.

These contracts support streaming programs without exposing a filesystem. Nucleus 0.1 source cannot open, close, name, enumerate, create, or delete files. A launcher or build tool selects the streams outside the source language.

<div id="164-direct-z80-port-access" class="nucleus-source-anchor"></div>

## 16.4 Direct Z80 port access

The compiler also establishes these infallible predefined routines:

```nucleus
sub readPort(port as u16) as u8
sub writePort(port as u16, value as u8)
```

`readPort` reads one byte from the complete 16-bit Z80 I/O address supplied by
`port` and returns a canonical `u8`. `writePort` writes `value` to that address
and has no result. Arguments use the ordinary left-to-right call order. The
normal integer rules permit a `u8` port or value where the signature accepts
it; Boolean and incompatible integer values are rejected at the applicable
argument check.

Both operations use the complete `u16` address, not only its lower byte. They
cannot fail recoverably and add no service status or handler. `readPort` may
appear in an ordinary expression or as a discarded call statement. `writePort`
is a result-free call statement. The Z80 runtime and backend contract defines
their instruction-level implementation.

<div id="165-target-specific-packet-services" class="nucleus-source-anchor"></div>

## 16.5 Target-specific packet services

The compiler establishes one infallible, result-free predefined operation:

```nucleus
service(slot, packet)
```

`slot` must be an exact compile-time integer constant from zero through 255.
It may be a literal or an earlier exact named constant. A variable, call,
Boolean, negative value, or value above 255 is invalid at the slot expression.
The slot has no portable meaning: the selected machine interface defines its
available ordinals and their packet contracts.

`packet` must be a writable complete `u8[N]` storage path or a writable `u8[]`
parameter. The operation evaluates the packet path once, after resolving the
slot, and supplies its address and retained element count to the target
gateway. Records, bounded strings, non-byte arrays, scalars, transient
aggregate results, and direct aggregate-constant roots are invalid. Source
cannot inspect the address carrier, and the provider must not access any byte
outside the retained packet count.

`service` is a complete call statement. It has no source result, cannot fail
recoverably, and cannot be followed by `else fail` or `handle`. An unknown slot
or invalid packet extent raises `packet-service` before native dispatch or
packet mutation. Once a valid provider begins, its external effects and packet
writes are not transactional and are not rolled back by a later trap.

A program that uses `service` is intentionally machine-interface-specific.
Another target may assign different meanings to the same slot or may provide
none of the program's required slots. Portable libraries should place typed,
target-specific wrappers around the packet format rather than exposing slot
numbers throughout application code.

<div id="166-program-startup-and-termination" class="nucleus-source-anchor"></div>

## 16.6 Program startup and termination

The implementation enters its implicit startup path before `main`. Startup establishes explicit program-variable initializers, establishes zero values for the remaining program variables, and then transfers to `main`. These operations are complete before source execution begins and are not source-callable. The environment supplies no command-line arguments or implicit source values. Source code obtains input only through the predefined services.

Normal return from `main` terminates successfully. Nucleus 0.1 has no source statement for process exit status or immediate successful termination. Failure returned from `main` and every safety trap terminate unsuccessfully under Chapter 15.

The external representation of success, recoverable-error codes, and trap reasons is implementation-defined only where the Z80 runtime and backend contract explicitly says so. That representation must preserve the source-level distinction among normal termination, unhandled recoverable error, and each required trap reason.

<div id="167-portability-and-implementation" class="nucleus-source-anchor"></div>

## 16.7 Portability and implementation

An environment may implement services with CP/M calls, a monitor, port I/O, host callbacks, or another mechanism. It may buffer transfers if buffering preserves call order, failure points, and visible bytes. Those choices do not add source names or expose their addresses.

Arbitrary BIOS calls, machine-code-call declarations, inline assembly, memory peeks and pokes, and callbacks are excluded from the safe source boundary. Port access is limited to the two typed operations in Section 16.4. Machine-specific native calls are limited to the bounded packet gateway in Section 16.5; it does not admit raw call addresses, pointers, registers, or inline code. A later portable service requires a typed, target-independent contract and a language revision before it enters the standard set.

The target adapter may place the program in ROM, loaded RAM, or bank-switched ROM while preserving the same startup and source semantics. The target-system specification and Z80 runtime contract govern bank assignment and calls. Source code supplies neither a bank number nor a target address, and a target restriction on cross-bank references does not alter source validity.
