# Book One first-use matrix (12-chapter structure, 2026-08-01)

Chapter where each construct is first taught; every later chapter and
listing may use it, no earlier one may. Verified against all companion
listings by `enumerate` scan on 2026-08-01.

| Ch | First introductions |
| -- | ------------------- |
| 1  | module, `var`, `u8`/`u16` by example, assignment, `//` comments, `sub`, parameterless call, `main`, declaration-before-use, excerpt convention |
| 2  | integer family (`u8 i8 u16 i16 u32 i32`), `$`/`%` literals, `const`, `boolean`, `true`/`false`, character literals and escapes, camelCase/PascalCase |
| 3  | arithmetic operators, `mod`, `^`, `shl`/`shr`, result widths, widening, `u8(...)` conversions, round-trip rule, literal context, comparisons, `=` dual role, `and or xor not`, short-circuit, bit masks, `abs`, `sqrt` |
| 4  | `enum`, `range`, `to`/`until` (in range and case grammar), range fault, `if`/`then`/`else`/`else if`, `select`/`case`, case lists and ranges, enum-complete select |
| 5  | `for`/`to`/`until` loops, `step`, `while`, `while true`, `exit`, `continue`, scalar locals (loop control), nested loops |
| 6  | arrays, index domains, count shorthand, bounds checks, `for each`, stride, multidimensional, initializers, `count`/`size`/`lower`/`upper`, `clear`/`fill` for arrays |
| 7  | `string[N]`, counted layout, terminator, string literals, checked copy, `append`, string `clear`, `length`, string comparison, string element arrays |
| 8  | `record`, fields, `offset`, dot paths, nested aggregates, record initializers, aggregate assignment, record `clear`, string fields |
| 9  | parameters, arguments, results, `return`, full locals model, aggregate parameters, exact-capacity matching, calling order, self-recursion |
| 10 | `alias`, identity model, selectors, spatial-vs-logical validity, transitive loop-control rule |
| 11 | `.lafy` modules, `import`, `export`, import prefix, root program, build manifest |
| 12 | `extern sub`, `at`/`from` bindings, interface modules, `near`/`far` storage classes, exported storage-class spelling, `address` opaque values, `asm` blocks, barrier, generated artifacts |
