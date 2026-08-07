---
layout: "default"
title: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 4
has_children: true
has_toc: false
standalone: true
isolated: true
pageClass: "nucleus-specification"
---
<Mark class="book-plate" book="lanternfly" size="52" />

# Nucleus Virtual Machine 0.1 Specification

::: info Authoritative source
This reading edition is generated from the [Nucleus VM specification in the Debug80 repository](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/nucleus/virtual-machine-specification.md) at revision [`b63690f550d1`](https://github.com/jhlagado/debug80/blob/b63690f550d1d29fa49de098023aad753a1557ca/packages/lanternfly/docs/nucleus/virtual-machine-specification.md). The repository source is authoritative; this site adds page metadata and reading navigation, with headings and local links adapted to page boundaries. [Companion: Nucleus 0.1 Language Specification](../nucleus/). The language specification governs source-language meaning.
:::

## Contents

1. [Status and conformance](01-status-and-conformance.md#1-status-and-conformance)
2. [Purpose, constraints, and non-goals](02-purpose-constraints-and-non-goals.md#2-purpose-constraints-and-non-goals)
3. [Machine overview](03-machine-overview.md#3-machine-overview)
4. [Address space and memory model](04-address-space-and-memory-model.md#4-address-space-and-memory-model)
5. [Bytecode image and loading format](05-bytecode-image-and-loading-format.md#5-bytecode-image-and-loading-format)
6. [Machine state](06-machine-state.md#6-machine-state)
7. [Runtime values and representation invariants](07-runtime-values-and-representation-invariants.md#7-runtime-values-and-representation-invariants)
8. [Virtual-slot organization](08-virtual-slot-organization.md#8-virtual-slot-organization)
9. [Instruction encoding](09-instruction-encoding.md#9-instruction-encoding)
10. [Data movement and memory access](10-data-movement-and-memory-access.md#10-data-movement-and-memory-access)
11. [Arithmetic, logic, comparison, and conversions](11-arithmetic-logic-comparison-and-conversions.md#11-arithmetic-logic-comparison-and-conversions)
12. [Primitive control flow](12-primitive-control-flow.md#12-primitive-control-flow)
13. [Routines and activation storage](13-routines-and-activation-storage.md#13-routines-and-activation-storage)
14. [Recoverable failure](14-recoverable-failure.md#14-recoverable-failure)
15. [Safety traps and diagnostics](15-safety-traps-and-diagnostics.md#15-safety-traps-and-diagnostics)
16. [Nucleus System Services 0.1 ABI](16-nucleus-system-services-0-1-abi.md#16-nucleus-system-services-01-abi)
17. [Interpreter contract and Z80 mapping](17-interpreter-contract-and-z80-mapping.md#17-interpreter-contract-and-z80-mapping)
18. [Native-backend contract](18-native-backend-contract.md#18-native-backend-contract)
19. [Image validity](19-image-validity.md#19-image-validity)
20. [Conformance vectors](20-conformance-vectors.md#20-conformance-vectors)
21. [Feature and cost ledger](21-feature-and-cost-ledger.md#21-feature-and-cost-ledger)

Appendices:

- [A. Complete opcode table](21-feature-and-cost-ledger.md#appendix-a-complete-opcode-table)
- [B. Binary layouts](21-feature-and-cost-ledger.md#appendix-b-binary-layouts)
- [C. Worked lowering examples](21-feature-and-cost-ledger.md#appendix-c-worked-lowering-examples)
- [D. Reference interpreter](21-feature-and-cost-ledger.md#appendix-d-reference-interpreter)
- [E. Z80 dispatch sketch](21-feature-and-cost-ledger.md#appendix-e-z80-dispatch-sketch)
- [F. Implementation sequence](21-feature-and-cost-ledger.md#appendix-f-implementation-sequence)
