---
layout: "default"
title: "21. Conformance examples"
parent: "Nucleus 0.1 Language Specification"
nav_order: 21
pageClass: "nucleus-specification"
---
[← 20. Feature ledger](20-feature-ledger.md) · [Contents](./)

<div id="21-conformance-examples" class="nucleus-source-anchor"></div>

# 21. Conformance examples

<div id="211-complete-accepted-program" class="nucleus-source-anchor"></div>

## 21.1 Complete accepted program

This program exercises records, a checked fixed array, an aggregate alias parameter and result, a local alias, a counted loop, a conditional chain, a call, and observable output:

```nucleus
record Cell
    value as u8
end

var cells as Cell[4]

sub cellAt(index as u8) as Cell
    return cells[index]
end

sub setCell(cell as Cell, value as u8)
    cell.value = value
end

sub main()
    var index as u8
    var current as Cell = cells[0]
    var code as u8

    for index = 0 until 4
        setCell(cells[index], index + 1)
    end

    current.value = cellAt(0).value
    if current.value = 1
        writeOutputByte('Y')
        on error code
            return
        end
    elseif current.value = 0
        writeOutputByte('N')
        on error code
            return
        end
    end
end
```

The expected standard output is the byte for `Y`, provided the output service succeeds.

<div id="212-recoverable-error-and-propagation" class="nucleus-source-anchor"></div>

## 21.2 Recoverable error and propagation

```nucleus
const badByte as u8 = 10

sub checkedByte() as u8 fails
    var value as u8 = readInputByte() or fail
    if value = 0
        fail badByte
    end
    return value
end

sub emitByte() fails
    var value as u8 = checkedByte() or fail
    writeOutputByte(value) or fail
end

sub main() fails
    emitByte() or fail
end
```

For the minimum conformance-corpus run, standard input supplies byte `A` and the output service succeeds; the expected standard output is `A`. More generally, success copies one input byte to output. End of input or a service error propagates its standard code, a zero byte produces `badByte`, and any failure reaching `main` performs the `unhandled-error` trap with that code.

<div id="213-recursion-and-control-flow" class="nucleus-source-anchor"></div>

## 21.3 Recursion and control flow

```nucleus
forward sub odd(value as u16) as boolean

sub even(value as u16) as boolean
    if value = 0
        return true
    end
    return odd(value - 1)
end

sub odd(value as u16) as boolean
    if value = 0
        return false
    end
    return even(value - 1)
end

sub main()
    var index as u16
    var code as u8

    for index = 0 to 5
        if odd(index)
            continue
        elseif index = 4
            exit
        end
    end

    writeOutputByte(u8(index))
    on error code
        return
    end
end
```

The program is valid and writes byte value 4 when the output service succeeds. The Chapter 21 conformance floor requires enough activation capacity for this execution; an implementation may perform `activation-capacity` only beyond its published, conformant limit.

<div id="214-bounded-string-aliasing-and-byte-mutation" class="nucleus-source-anchor"></div>

## 21.4 Bounded-string aliasing and byte mutation

```nucleus
var text as string[4] = "A\0B"

sub textAlias() as string[4]
    return text
end

sub mutate(value as string[4])
    value[1] = 'Z'
end

sub main() fails
    var alias as string[4] = textAlias()

    if alias.length = 3 and alias[1] = 0
        mutate(alias)
    end

    if text[1] = 'Z' and alias.length = 3
        writeOutputByte('Y') or fail
    end
end
```

The literal's embedded zero is an ordinary byte, so its logical length is three. The local is initialized once with an alias returned by an infallible routine. Mutation through the parameter alias is visible through both program and local aliases, and the expected standard output is `Y`.

<div id="215-result-free-return-propagation" class="nucleus-source-anchor"></div>

## 21.5 Result-free return propagation

```nucleus
sub emitMarker() fails
    writeOutputByte('R') or fail
end

sub relayMarker() fails
    return emitMarker() or fail
end

sub main() fails
    relayMarker() or fail
end
```

When output succeeds, `emitMarker` has no result, `relayMarker` returns successfully, and the expected standard output is `R`. An output failure propagates unchanged through both callers.

<div id="216-same-destination-error-handling" class="nucleus-source-anchor"></div>

## 21.6 Same-destination error handling

```nucleus
const sampleFailure as u8 = 7

sub alwaysFails() as u8 fails
    fail sampleFailure
end

sub main() fails
    var code as u8

    code = alwaysFails()
    on error code
        writeOutputByte(code) or fail
        return
    end

    writeOutputByte(0) or fail
end
```

The failed assignment performs no success-result store and then stores `sampleFailure` in `code`, even though `code` is both destinations. The expected standard output is byte value 7.

<div id="217-bulk-output-cursor-state" class="nucleus-source-anchor"></div>

## 21.7 Bulk-output cursor state

```nucleus
sub main() fails
    writeStorageByte('A') or fail
    writeStorageByte('B') or fail
    seekStorageOutput(0) or fail
    writeStorageByte('Z') or fail
end
```

The conformance output begins empty with its cursor at zero. The first two calls append `AB`; the seek returns to zero; the final call overwrites the first byte without inserting or truncating. The expected bulk output is `ZB`, with its cursor at offset one.

<div id="218-runtime-loop-range-reachability" class="nucleus-source-anchor"></div>

## 21.8 Runtime loop-range reachability

```nucleus
sub main()
    var index as u8

    for index = 250 to 300 step 10
        exit
    end
end
```

This program is valid and terminates normally with `index` equal to 250. Without the `exit`, the first increment would store 260 if it fit and the loop would continue, so execution would perform `loop-range`; the compiler must not reject the source merely because it can prove that possible runtime path.

<div id="219-specified-trap-cases" class="nucleus-source-anchor"></div>

## 21.9 Specified trap cases

Each listing below is valid source. The external conformance harness supplies the stated standard-input byte and observes the trap report.

```nucleus
var bytes as u8[2]

sub main() fails
    var index as u8 = readInputByte() or fail
    bytes[index] = 1
end
```

With input byte 2, the required result is `bounds` before the store.

```nucleus
sub divide(value as u16, divisor as u16) as u16
    return value / divisor
end

sub main() fails
    var divisor as u16 = readInputByte() or fail
    var result as u16 = divide(8, divisor)
end
```

With input byte zero, the required result is `division-by-zero`.

<div id="2110-complete-rejected-programs" class="nucleus-source-anchor"></div>

## 21.10 Complete rejected programs

Each program is rejected for the stated independent reason.

Failable call without consumption:

```nucleus
sub readOne() as u8 fails
    return readInputByte() or fail
end

sub main()
    var value as u8
    value = readOne()
end
```

Aggregate copy or alias rebinding:

```nucleus
record Cell
    value as u8
end

var left as Cell
var right as Cell

sub main()
    var alias as Cell = left
    alias = right
end
```

Value routine with a reachable end:

```nucleus
sub choose(flag as boolean) as u8
    if flag
        return 1
    end
end

sub main()
end
```

Later declaration used before a forward signature:

```nucleus
sub main()
    later()
end

sub later()
end
```

Wrong entry signature:

```nucleus
sub main(argument as u8)
end
```

Hexadecimal integer syntax:

```nucleus
const value as u8 = $2a

sub main()
end
```

The last program fails lexically at `$`; Nucleus 0.1 integer literals are decimal.
