# Programming Basie: thematic book plan

## Purpose and audience

Teach someone with programming experience comparable to a JavaScript programmer to construct memory-safe Basie programs for CP/M. Explain variables, types, global and local storage, parameters and object lifetimes without assuming knowledge of pointers or manual allocation. Familiarity with C or Pascal is optional.

This is a private editorial document excluded from the published site. It specifies the learning structure before chapter prose is rewritten. Existing chapters supply possible examples and explanations, not the organising order.

## Governing theme

A program manipulates values held in objects. Safe access requires the right kind of value, an access within the object's bounds and storage whose lifetime has not ended. Ownership determines responsibility for the lifetime of an allocated object. Access permission determines what another routine may do with it.

The recurring questions are: what is stored, where does it live, who may access or change it and when does that access end? Begin asking these questions with the first assignment and call. Introduce ownership vocabulary through concrete distinctions rather than postponing memory safety until a final allocation chapter.

Type safety and memory safety are distinct. A reference with the right type can still designate expired storage in an unsafe language. Multiple references do not imply multiple owners. Resource exhaustion and leaks are resource-management problems; invalid access is a memory-safety problem.

## Storage, representation and access progression

The introduction must establish values held in storage before explaining the hazards of allocation. Use scalar copying as the ordinary case. Then distinguish aggregate contents, aggregate copying and a parameter's indirect access to an existing object. “Aggregate” names a composite type. “Alias” names an access relation. Avoid calling records and arrays reference types because their variables contain aggregate storage and assignment copies eligible contents.

Explain reference passing through the task of changing one existing reading rather than an abstract pointer survey. Show an independent copy beside two paths to one record. A scalar field remains a scalar value when passed separately, even though its enclosing record can be passed by alias. Stored representation and the operation performed on it must remain distinct.

Use the resulting shared access to motivate permission and lifetime questions. A callee's local storage ends on return. Copying its scalar result remains safe, while returning an alias to its local record is invalid. Introduce allocation when one record must outlive its creating call, then establish exactly one responsibility for releasing it. Allocation changes an object's lifetime, not the basic requirement that access designate live, correctly bounded storage.

Interleave this reasoning with the curriculum rather than placing all the hazards in an introductory essay. Chapter 1 traces scalar copies, Chapter 2 separates types from storage operations, Chapter 3 traces local lifetimes and scalar parameters, Chapter 4 contrasts aggregate assignment with read/write aliases, Chapter 5 introduces independent allocation and responsibility, and Chapter 6 follows temporary and retained access through release. Each introduces a useful operation alongside the specific risk it creates or avoids.

Diagrams must distinguish inline aggregate contents from an indirect parameter binding. Multiple access paths are allowed by Basie's specified rules. A read-only path does not globally freeze the object. Only ownership of an allocated slot is unique, and owning contents prevent ordinary aggregate copying. Compare unsafe pointer operations by their specific unchecked behaviour rather than declaring every older language or every Pascal implementation unsafe in the same way.

## Rust teaching analysis

The official Rust book establishes common concepts in Chapter 3 and ownership in Chapter 4. Scope prepares the explanation of allocation. Assignment exposes moves, calls expose transfer, references explain access without transfer and mutable references introduce restrictions on concurrent access. Dangling references motivate lifetime validity. Slices then combine access with an extent. Detailed lifetime relationships appear later, when larger interfaces require them.

The useful progression is familiar operation → surprising storage consequence → rule → usable programming pattern. Adapt this progression to Basie with a recurring small application. Follow one object across assignment, calls, mutation, transfer and release. Introduce a minimal record only when it makes that object visible; defer the complete record taxonomy.

Basie's ordinary writable aggregate aliases do not have Rust's blanket exclusive-borrow guarantee. Its specification permits writes visible through other paths. Pool leases constrain access to the owner so the record cannot be freed during the lease. Explain those actual guarantees and separate ownership from writer exclusivity.

Sources: [Common Programming Concepts](https://doc.rust-lang.org/book/ch03-00-common-programming-concepts.html), [Ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html), [References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html), [Slices](https://doc.rust-lang.org/book/ch04-03-slices.html) and [Lifetime Relationships](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html).

## Companion safety analysis

The [safety and lifetime analysis](safety-and-lifetime-analysis.md) maps the supplied lesson argument to Basie. Use its progression from interface ambiguity to consuming calls, temporary access and returned-view lifetimes when designing early examples.

The [basic-syntax lesson analysis](values-and-syntax-analysis.md) adds executable first results, diagnostic-reading practice and checked exercises, with a factorial example connecting loops to activation capacity.

The [structs and resources lesson analysis](data-and-resource-analysis.md) develops independent data versus resource responsibility, read/write/consume interfaces and the distinction between copying, moving and allocating an independent duplicate.

The [enums lesson analysis](alternatives-and-variants-analysis.md) distinguishes memory-safe access from valid application states. Use existing optional handles and select in the current tutorial; keep general tagged unions as separate stretch-feature design work.

## Progression

The first movement establishes values and the lifetimes of ordinary storage. The second distinguishes access from responsibility and introduces one allocated object. The third combines those rules with bounded collections and reusable routines. The final movement develops complete applications and explains resource limits and diagnostics.

Each chapter below has a prerequisite, a conceptual change and an observable result. A topic belongs only where it advances that change. Full syntax surveys belong in a reference work rather than interrupting this progression.

## Curriculum: cumulative practice

Adapt the supplied lessons' progression from familiar operations to storage consequences and safe interfaces. The curriculum teaches Basie's specified capabilities. General enums, variants and subarray slices remain language-extension proposals, recorded in the Basie repository's stretch-goals document. They are not prerequisites or exercises in this book.

Use two connected examples. A readings utility establishes independent values, fixed records and bounded input/output. A job collection establishes independently allocated records, transfer, temporary access and release. Begin each new mechanism with a task in one of these examples. Change one operation at a time so the resulting storage difference is visible.

Each chapter uses the same learning sequence: attempt a useful operation, predict its effect, trace storage, explain the relevant safety rule, perform the safe operation and apply it to a small variation. Introduce diagnostics when the first rejected example appears rather than saving all diagnostic practice for the final chapter. A hypothetical unsafe trace must be visibly distinguished from executable Basie source.

| Chapter | Practical progression | Evidence of understanding |
| --- | --- | --- |
| 1. Values | Run a calculation, copy its result and change the original variable. | Predict both cells after the change. |
| 2. Valid operations | Convert a reading and access a tiny fixed buffer. Compare a type error, a narrowing conversion that cannot represent its input and an out-of-bounds index. | Explain which property each check protects. |
| 3. Calls and lifetime | Move the calculation into a routine. Trace scalar arguments, local results and surviving caller storage. Contrast scalar return with a proposed local alias escape. | Identify what survives return and why. |
| 4. Access | Group one reading into a record. Compare copying data with reading and changing caller storage through parameters. | Classify each interface as copy, read access or writable access. |
| 5. Responsibility | Create one job in a pool. Compare forbidden owner duplication with explicit transfer and a consuming call. | Draw the single owner before and after each operation. |
| 6. Temporary access | Inspect and update that job without transferring responsibility. Retain an identifier across release and reuse to explain checked identity. | Distinguish lease validity from identifier validity. |
| 7. Control and failure | Add a second job, encounter full capacity and process jobs through branches and loops. | Account for responsibility on normal, handled-failure and early-return paths. |
| 8. Bounded collections | Store readings in an array and build a bounded report. Track capacity, occupied elements and string length separately. | Identify the valid extent and the application's active contents. |
| 9. Reusable interfaces | Process complete arrays of different lengths through open parameters. Write into caller-provided output storage and explain permitted returned views. | Trace backing storage, extent and access duration without assuming subarray slicing. |
| 10. Changing collection | Insert, process and remove jobs. Extend to owning fields only when the application requires them. | Explain each record's release and distinguish slot reuse from continued identity. |
| 11. Numeric processing | Compute totals and means from the readings. Introduce wider types and floating point at the calculations that require them. | Justify representations and conversions for boundary inputs. |
| 12. Organisation | Separate input, processing and reporting into source parts and typed service calls. | Identify data and responsibility crossing each interface. |
| 13. Finite calls | Compare repeated iteration with nested calls and then recursion. | Account separately for live activations and allocated pool records. |
| 14. Capstone | Combine bounded parsing, changing jobs and reporting into a CP/M utility. | Modify behaviour while preserving the storage and ownership invariants. |
| 15. Investigation | Diagnose a failed build and a runtime trap using familiar programs. | Connect observed evidence to the responsible source operation. |

### Visual progression

Reuse one visual vocabulary throughout: storage cells, pool slots, ownership edges and access edges. Scalar copies create distinct cells. Aggregate access adds a path to existing storage. Ownership transfer changes the responsible binding while the target slot remains fixed. Release ends an object's lifetime, and slot reuse begins another lifetime. Mark read-only and writable paths explicitly without suggesting Rust's blanket exclusive-borrow rule.

In the bounded-data chapters, draw reserved capacity, occupied prefix and parameter extent as separate labelled quantities. Existing open arrays carry the complete array extent. Show caller-provided output buffers as storage reuse, not as new allocation. Every figure accompanies a specific operation and a prediction exercise.

### Publication framing

Open with “Introducing the Basie language” and “Few notes. Make them Count.” Follow with the practical promise of memory-safe programming within CP/M's finite storage. Keep naming explanations, lesson provenance, curriculum planning and implementation history outside the public introduction. Piano-keyboard logo work is separate from this curriculum.

## Chapter titles and file names

Use the title to suggest the chapter's central experience, with the opening explaining the subject precisely. Keep titles short enough to read as a table of contents. Repeated structures and decorative puns would weaken the sequence.

| Chapter | Title | File | Connection to the subject |
| --- | --- | --- | --- |
| 1 | The Life of a Value | `01-the-life-of-a-value.md` | Follow a value from its initial storage through copying and change. |
| 2 | Within Bounds | `02-within-bounds.md` | Connect representable values with the bounds of an object. |
| 3 | Coming and Going | `03-coming-and-going.md` | Follow calls and the local storage that begins and ends with them. |
| 4 | Two Names, One Object | `04-two-names-one-object.md` | Make the difference between two copies and two access paths visible. |
| 5 | In Good Hands | `05-in-good-hands.md` | Introduce the one responsible owner and transfer between bindings. |
| 6 | On Loan | `06-on-loan.md` | Use a record temporarily without taking responsibility for release. |
| 7 | A Change of Plan | `07-a-change-of-plan.md` | Respond to changing conditions, repetition and expected failure. |
| 8 | Room to Work | `08-room-to-work.md` | Distinguish fixed capacity from the contents currently in use. |
| 9 | A Wider View | `09-a-wider-view.md` | Let the same routine work over different complete object sizes. |
| 10 | Jobs Come and Go | `10-jobs-come-and-go.md` | Apply ownership to a collection whose membership changes. |
| 11 | Taking the Measure | `11-taking-the-measure.md` | Choose numeric representations through a readings analyser. |
| 12 | A Place for Everything | `12-a-place-for-everything.md` | Organise source parts and operating-system interfaces. |
| 13 | One Call Too Many | `13-one-call-too-many.md` | Explain recursion and the boundary of available activation storage. |
| 14 | Putting It to Work | `14-putting-it-to-work.md` | Combine bounded text, failures and owned jobs in an application. |
| 15 | Following the Clues | `15-following-the-clues.md` | Use build diagnostics and runtime evidence to explain failures. |

## Chapter plan

### 1. The Life of a Value

**Umbrella question:** What does a small program store and change?

Introduce one calculation, named scalar variables, a type and assignment. Explain compilation and execution only far enough to run that program. Distinguish a copied value from shared storage using two independent cells. Establish that declared types and checks constrain operations.

**Prerequisite:** Familiarity with a simple calculation.

**Outcome:** Trace the value of each variable after assignment and explain why a scalar copy does not share later changes.

**Reason for placement:** Every later lifetime or ownership explanation needs a concrete object and an operation on it.

**Illustration:** Before/after scalar assignment with two storage cells.

### 2. Within Bounds

**Umbrella question:** What makes an operation safe?

Develop scalar types, the values each type can represent, constants and checked conversions from the calculation. Separate a wrong-type operation from access to invalid storage. Use a small bounded object to preview spatial safety, explaining only the indexing needed for the demonstration.

**Prerequisite:** Variables and assignment.

**Outcome:** Identify whether a mistake concerns a value's type, the values its destination type can represent or an object's bounds.

**Reason for placement:** Establish the safety questions before introducing multiple storage lifetimes.

**Illustration:** An integer type's representable values alongside an object's valid index bounds.

### 3. Coming and Going

**Umbrella question:** What exists before, during and after a routine call?

Introduce a routine, scalar parameters, results and local variables. Contrast program storage with activation storage. Explain lexical visibility and storage lifetime separately. Revisit copying at parameter binding and show why the callee's scalar changes do not alter the caller's cell.

**Prerequisite:** Values, types and checked operations.

**Outcome:** Trace a call and identify which storage survives its return.

**Reason for placement:** Access to caller storage and independently allocated objects both depend on this lifetime model.

**Illustration:** Caller/callee panels with persistent global storage and temporary locals.

### 4. Two Names, One Object

**Umbrella question:** How can a routine use an existing object without owning it?

Introduce a minimal record and compare aggregate assignment with a read-only aggregate parameter. Show that assignment copies eligible contents into another object while the parameter binds to existing storage. Contrast a scalar field passed as a value with the whole record passed as a ticket alias. Then introduce writable parameters and show changes visible to the caller. Distinguish reading, writing and responsibility for reclamation. Explain Basie's actual alias rules rather than assuming Rust's writer exclusivity.

**Prerequisite:** Calls and local-storage lifetime.

**Outcome:** Determine whether a call copies data or accesses the caller's object and whether that access permits mutation.

**Reason for placement:** Ownership transfer becomes intelligible only after access without transfer is familiar.

**Illustration:** One record, caller binding and read-only or writable callee path.

### 5. In Good Hands

**Umbrella question:** How can an object live independently of the call that creates it?

Introduce a pool with one record type, free and allocated slots and an owning handle. Separate the handle's storage from its target record. Contrast scalar copying with ownership transfer through move. Explain release at scope exit and why independently duplicating an owner would permit duplicate release.

**Prerequisite:** Records, aliases and scope.

**Outcome:** Follow responsibility for one allocated record through assignment and a consuming call.

**Reason for placement:** This is the first independent object lifetime, introduced before collections obscure the mechanism.

**Illustration:** Pool/slot/handle diagram and before/after ownership edge transfer.

### 6. On Loan

**Umbrella question:** How can another routine use an allocated record while its owner retains responsibility?

Contrast an owning parameter with a lease. Show reading and writing through record parameters without a freeing capability. Explain how the owner remains unavailable for freeing during the lease. Introduce identifiers as non-owning handles and show validity checks after release or reuse, distinguishing them from call-bounded aliases.

**Prerequisite:** Unique ownership and ordinary aggregate access.

**Outcome:** Choose transfer or temporary access deliberately and identify the end of each access.

**Reason for placement:** Readers can now use allocated objects without passing ownership for every operation.

**Illustration:** Owner and lease during a call; old identifier versus a reused slot.

### 7. A Change of Plan

**Umbrella question:** How does a program respond when its state or available capacity changes?

Develop conditions, selection and loops around the same job example. Explain optional allocation, expected failure and handling. Contrast a recoverable application condition with a safety trap. Trace release along different exits so control flow and ownership remain one model.

**Prerequisite:** Calls, owners and temporary access.

**Outcome:** Handle full capacity and follow responsibility through branches and repeated operations.

**Reason for placement:** The first multi-object program requires control flow and an explicit response to exhaustion. Earlier examples may use one guided condition, explained in place.

**Illustration:** Branches with owner state and release at each exit.

### 8. Room to Work

**Umbrella question:** How can many values share predictable storage without invalid access?

Develop fixed arrays, nested shape and bounded strings. Distinguish capacity from live contents and string length. Connect spatial bounds with the already established lifetime checks. Apply loops to a concrete buffer.

**Prerequisite:** Repetition, types and storage lifetimes.

**Outcome:** Trace valid indices, length and capacity and explain the result of a boundary violation.

**Reason for placement:** Full collection mechanics follow the single-object model and provide material for reusable library routines.

**Illustration:** Array extent and bounded string length within reserved capacity.

### 9. A Wider View

**Umbrella question:** How can a library routine work with differently sized objects safely?

Introduce open arrays and strings, retained bounds and writable text construction. Combine parameter access permissions with runtime extents. Explain returned aggregate views and from clauses through caller-owned storage. Contrast a valid returned view with a rejected alias into expired locals.

**Prerequisite:** Bounded data, aliases and call lifetimes.

**Outcome:** Write a routine whose interface preserves both bounds and lifetime validity.

**Reason for placement:** Readers now possess both halves of a safe view: extent and valid backing storage.

**Illustration:** View carrying extent and source lifetime across a call.

### 10. Jobs Come and Go

**Umbrella question:** How do ownership rules compose when records are added, processed and removed?

Extend the recurring job or inventory example. Combine pools, ownership, optional handles, access, loops and failure. Trace removal and reuse. Introduce owning fields and cycle prevention only if the selected collection requires them, after a simpler independent-record version.

**Prerequisite:** Ownership, access, control flow and bounded capacity.

**Outcome:** Account for each record's lifetime throughout a complete collection operation.

**Reason for placement:** This consolidates the safety model before adding unrelated numeric or organisational complexity.

**Illustration:** Collection snapshot and add/remove/reuse lifetime sequence.

### 11. Taking the Measure

**Umbrella question:** How can a program transform stored observations into useful results?

Build the readings analyser from records, open arrays and numeric conversions. Introduce wider integer operations and floating point when required by totals and means. Explain rounding and numeric failure through the calculation rather than an exhaustive operator list.

**Prerequisite:** Records, bounded collections and reusable routines.

**Outcome:** Choose representations and conversions while preserving valid access to the readings.

**Reason for placement:** Numeric depth serves a concrete application after the storage model is established.

**Illustration:** Input records, accumulation and result representations.

### 12. A Place for Everything

**Umbrella question:** How can several routines and source files form one understandable application?

Introduce includes, private names and services through the growing utility. Separate application logic from typed operating-system access. Explain the trusted boundary and ownership responsibilities at each interface.

**Prerequisite:** Reusable routines and complete data-processing examples.

**Outcome:** Divide a program into source parts with explicit access and storage responsibilities.

**Reason for placement:** Source organisation solves a complexity readers have now experienced.

**Illustration:** Source dependencies and service boundary, with data flow labelled.

### 13. One Call Too Many

**Umbrella question:** How can deeper calls remain safe on a small machine?

Develop forward declarations, recursion and activation capacity. Revisit local storage from Chapter 3 at several call depths. Distinguish activation exhaustion from pool exhaustion and explain the checks at each boundary.

**Prerequisite:** Calls, resource failure and application organisation.

**Outcome:** Trace concurrent live activations and explain capacity failure without confusing it with an expired-object access.

**Reason for placement:** Recursive resource reasoning extends the familiar single-call model after readers can manage allocated records.

**Illustration:** Nested frames beside independently live pool records.

### 14. Putting It to Work

**Umbrella question:** How do safe storage and ownership support an application from input to result?

Combine command parsing, bounded reports, recoverable errors and changing state. Explain each storage choice and interface using the established model. Include meaningful exercises that modify behaviour while preserving ownership and access rules.

**Prerequisite:** All application mechanisms above.

**Outcome:** Design, run and modify a complete utility while accounting for each object and access.

**Reason for placement:** The capstone requires composition, not another isolated feature demonstration.

**Illustration:** End-to-end data path and object lifetime timeline.

### 15. Following the Clues

**Umbrella question:** What evidence explains a program's result or failure?

Expand the minimal build instructions from Chapter 1 into the compiler/linker workflow. Explain diagnostics, line information and runtime traps through familiar examples. Teach supported product operations without editorial tooling or implementation history.

**Prerequisite:** Complete programs and the distinction between expected failure and safety violations.

**Outcome:** Locate and explain an unsuccessful build or execution using source and observed evidence.

**Reason for placement:** Detailed investigation is useful once readers have applications worth investigating. Running a first program is still taught in Chapter 1.

**Illustration:** Source-to-executable path and diagnostic-to-source lookup.

## Making ownership necessary to the reader

Introduce ownership early because ordinary-looking assignment and calls can create lifetime mistakes when they involve allocated objects. Establish the consequence before stating the restriction. A reader who has used garbage-collected objects needs a concrete explanation of what the collector normally handles and what changes when a program manages release through ownership.

Use a recurring sequence: intended task, plausible mistake, storage trace, consequence, safe Basie operation and result. Problem diagrams describe a hypothetical unsafe model explicitly. They must not imply that Basie executes a forbidden operation. Actual Basie examples distinguish rejected source from a permitted program that encounters a runtime safety check.

### Chapter 3: a result outliving its storage

A routine constructs local data and attempts to return a view of it. Draw the local object during the call and the end of its lifetime on return. The caller's proposed view would refer to expired storage. Explain why returning a scalar copy works while returning that local alias does not. The reader should identify the object that disappeared, not memorise a prohibition on return syntax.

### Chapter 4: access is not responsibility

Two routines need to inspect the same record. Show two read-only access paths to one object without duplicating responsibility for release. Contrast a routine that modifies caller storage with one that copies a scalar. Explain that writable access and ownership answer different questions. Use Basie's specified alias permissions rather than claiming Rust's exclusive mutable-borrow rule.

### Chapter 5: two apparent owners, one allocation

Begin with the tempting assumption that copying an owning handle works like copying a number. In a hypothetical unsafe model, both bindings now appear responsible for releasing the same record. Trace the first release, then the second attempted release. The problem is duplicated responsibility for one lifetime. Show Basie's rejected owner copy and its safe move: responsibility changes location while the record stays in its pool slot.

Follow with an owning call. A caller passes responsibility to a callee that releases the record on exit. Explain why the caller cannot continue to use the transferred owner. Compare a non-owning call that reads the same record and returns with ownership unchanged. Keep the task and target record identical so the parameter distinction is the only new idea.

### Chapter 6: access after release and slot reuse

Keep an identifier, release the owning handle and reuse the slot for a different record. A raw location alone could mistake the new record for the old one. Draw two lifetimes in the same slot and explain why location is not identity. Show the specified stale-identifier check and a lease whose record remains live during the call. Distinguish checked identifier access from call-bounded access.

### Chapter 7: responsibility on every exit

A routine finishes normally, handles an expected failure or returns early. Trace the same owner's release or transfer on each path. Contrast premature release with lost responsibility and resulting capacity exhaustion. Explain that leaks waste finite storage while stale access violates lifetime validity. The safe program must preserve both valid access and an accountable release path.

### Reinforcement and reader evidence

Use before/during/after panels with a stable visual vocabulary for object, owner and access path. Mark the exact operation that ends a lifetime or transfers responsibility. Avoid a large gallery of hazards before readers have the concepts needed to interpret them.

Repeat the distinction in later examples with short prediction exercises: which record remains live, which binding still owns it, which routine may write and what happens on return? Require the reader to predict a state before showing the answer. Successful explanations identify both the hazard prevented and the useful operation that remains possible.

## Structure acceptance criteria

- Each chapter answers its umbrella question with a concrete example and observable state.
- Every unfamiliar mechanism is explained before the example requires it.
- Early assignment and call explanations distinguish copy, alias and ownership transfer as each becomes applicable.
- Ownership is responsibility for lifetime, not a synonym for every reference or writable path.
- Every diagram depicts the actual language rule and uses consistent labelled edges for copying, access and responsibility.
- Global, local and allocated storage remain distinct throughout the book.
- Safety claims distinguish static rejection, runtime checks and the trusted system boundary.
- No chapter survives solely because it existed in the source book. Material with no prerequisite-supported role is moved, split or omitted.
- The published book contains reader-facing explanations only. Plans, conversations and verification records are excluded.

## Next editorial step

Validate minimal early examples against the specification and execution evidence, then rewrite in this order. Map existing prose to these chapter purposes only after the progression is accepted as internally coherent. The current converted manuscript is source material, not a finished instance of this structure.

## Console I/O in the opening progression

Chapter 1 prints the calculated scalar through a bounded local report string. Explain include, failable calls and the storage needed for decimal digits in place. Chapter 2 reads and writes one scalar byte, distinguishing the echo policy from explicit output. Chapter 3 reads an edited line into caller-provided local storage and writes that string while it remains live. Chapter 4 then names the read-only and writable alias permissions already encountered.

The authoritative source boundary is spec/16-system-boundary.md and docs/services.md, with source-library helpers in lib/TEXTIO.BSI and lib/FORMAT.BSI. Basic I/O is already defined. Most text behaviour remains userland. Console transport implements the shared byteGateway/0 roles, while line editing is a Basie/CP/M policy above that gateway. Rich command framing and external events are separate provider capabilities and are not implied by ordinary console output. No compiler changes are required to teach the existing console interface.

The interactive transcript shows terminal echo. The minimal CP/M test harness does not echo BDOS 10 line input, so verification records program-generated output separately from the human console transcript.
