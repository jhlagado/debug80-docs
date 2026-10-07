# Data and resource analysis for Programming Basie

Private editorial analysis of data and resource responsibility. The governing distinction is between independent data values and objects whose representation carries responsibility for a resource. Its strongest contribution is explaining interface capabilities through concrete construction, reading, mutation and consumption.

## Argument progression

The lesson begins with grouped values, then named types, construction and mutation. It introduces move-only behaviour through a repeated call that looks harmless but consumes its argument. Copy and Clone distinguish an implicit representation copy from an explicit operation that may construct an independent resource. Method signatures distinguish reading, mutation and ownership transfer. Privacy then constrains construction and protects invariants. A consumable token demonstrates responsibility without requiring a heap explanation. Finally, a resource-containing field motivates returning access rather than duplicating or removing the resource.

The sequence makes ownership a property of ordinary interfaces. Allocation is one application of that property, not the only reason for it.

## Basie applications

### Independent data versus responsibility

Use a small coordinate record to establish independent data and aggregate assignment. Contrast it with a record containing an owning pool handle. Copying the coordinate fields gives independent data; copying an owner would duplicate responsibility for one allocated record. Basie marks nested records and arrays containing owners as owning types and prohibits their copying.

Do not teach Rust's move-only-by-default records as Basie's rule. Ordinary Basie aggregate parameters are aliases rather than by-value record transfers. Explain assignment separately from parameter binding so the same-looking use of a record does not imply the same operation.

### Read, change or consume

Use three routines on the same record: one inspects it through a ticket, one changes it through a var parameter and one receives an owning handle through transfer. Ordinary functions can express this distinction without methods or receiver syntax. Place the interface comparison in the early access and ownership chapters.

A read-only parameter restricts the callee's writes through that path. Basie's rules do not globally freeze the object as Rust shared borrowing does. Similarly, a writable parameter does not automatically establish Rust-style exclusive access. Illustrations must identify the actual permissions.

### Copy, move and independent duplication

Use three distinct diagrams. A data copy creates another object with equivalent contents. A move redirects responsibility for an existing allocated record without creating a second owner. Independent duplication allocates a new record and copies suitable data into it, leaving two separately owned objects.

Basie has no automatic Clone trait. A deliberate duplication routine must address pool exhaustion, nested ownership and the selected fields' meaning. Never substitute byte copying for independent resource construction. Explain this only when a real application needs duplication.

### Construction and invariants

Rust's token example combines non-copyability with restricted construction. Those are separate guarantees: one prevents duplication after creation; the other prevents clients constructing unauthorised instances. Basie ownership does not by itself provide a general unforgeable capability-token system. Its private source declarations must not be described as Rust's private fields or module namespaces.

Treat zero-sized resource types, custom move-only types and stronger encapsulation as separate language-design questions. They are not necessary additions to the teaching book and are not established Basie features.

### Access to contained data

The title example explains why a caller needing only to read data should not automatically receive an expensive duplicate or consume the containing object. Apply that reasoning to Basie's tickets, open strings and permitted aggregate results with from clauses. Teach the origin and valid lifetime of access before interface convenience.

Basie's bounded byte strings are not Rust's heap-owned UTF-8 String. Its aliases cannot be stored as general reference variables. Pool-field access has additional copy and lease rules. Choose an example whose actual interface permits the claimed access rather than translating the Rust getter mechanically.

### Release responsibilities

Rust custom destructors generalise cleanup to files, locks and other resources. Basie's automatic release manages pool ownership and owned descendants according to its specified rules. It does not imply user-defined destructors or automatic file closure. Explain the guarantees for allocated records precisely.

## Teaching decisions

Keep minimal records early enough to distinguish data from ownership. Use repeated calls and assignment as the first tests of the reader's mental model. Add prediction exercises asking whether the operation copies data, shares access, transfers responsibility or creates another allocation. Show the resulting objects and permissions, not just whether compilation succeeds.

Delay tuple grammar, traits, method sugar and module mechanics because they are not required by Basie's progression. Nominal type identity can be explained with named records when useful. Keep possible language extensions in separate design discussion rather than presenting them as product capabilities.

## Illustration briefs

1. Coordinate copy: two records with initially equal fields and independent later changes.
2. Owning aggregate: a containing record, its owning field and a distinct pool slot, showing why copying the container is forbidden.
3. Three calls: reading, writable access and consuming transfer on the same target.
4. Independent duplication: two slots and two owners, distinguished from two handles to one slot.
5. Contained-data access: caller, containing object and temporary view, with its root and valid lifetime labelled.

## Plan changes

The early chapters must explain copyability as a semantic property rather than a consequence of size. The access chapter should compare read, write and consume interfaces explicitly. The changing-collection chapter should introduce deliberate duplication only if the application needs it. The returned-view chapter should motivate lightweight access by contrasting copying, transfer and a valid view.
