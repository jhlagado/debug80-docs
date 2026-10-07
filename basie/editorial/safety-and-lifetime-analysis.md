# Safety and lifetime analysis for Programming Basie

Private editorial analysis of interface permissions and storage lifetimes. Language comparisons use Basie specification Sections 7.7–7.16 and 13.3–13.6.

## Central argument

The lesson derives safety mechanisms from interface questions that raw pointer types leave unanswered. May the callee read, change, retain or release the object? What keeps a returned reference valid? A safe interface expresses the relevant permissions and lifetime relationships so their use can be checked. This is a stronger teaching foundation than introducing ownership as allocation syntax.

The argument proceeds by temporarily restricting a language, discovering the useful operations that restriction blocks and restoring those operations with explicit constraints. Each mechanism solves the preceding example's problem. The thought experiment is a teaching device, not literal Rust syntax or an accurate model of every Rust type.

## Argument and Basie correspondence

| Concept | Reasoning | Basie correspondence and teaching consequence |
| --- | --- | --- |
| Trusted boundaries | Safe interfaces concentrate responsibility for unsafe internals at an audited boundary. | Explain the trusted runtime and service boundary. Source safety relies on those implementations preserving their contracts. A successful compilation alone cannot prove arbitrary external machine code safe. |
| Permission and lifetime | Unconstrained pointers obscure permission and lifetime contracts. Removing them prevents some hazards but also removes useful structures. | Start with ordinary variables and calls, then make access, mutation and responsibility explicit. Retain Basie's globals rather than inheriting the thought experiment's ban. |
| Transfer of responsibility | Copying a resource wrapper can preserve a usable-looking binding after the resource has been invalidated. Moving prevents duplicate responsibility. | Contrast scalar copies with non-copyable owning handles. Basie requires explicit move for an existing owner and clears its source. Do not suggest every scalar representing an external resource automatically receives this protection. |
| Temporary access | A useful operation should temporarily access a resource without consuming it. | Contrast an owning parameter with a record ticket, writable alias or pool lease. The callee may use the record without receiving responsibility for releasing the leased slot. Basie's ordinary aliases are not Rust's exclusive references. |
| Copyability | Copyability follows the capability represented by a type, not its physical size. | A small owner handle is non-copyable while a scalar value is copyable. A record containing owners is itself an owning type. Small representation does not imply independent copy semantics. |
| Allocated storage | Heap allocation is another resource whose lifetime can be governed by ownership. | Use a fixed-capacity pool slot as Basie's allocated resource. Automatic release occurs at scope exit or owner overwrite. Do not invent a resizable heap-backed array or custom destructor feature. |
| Returned access | A returned reference requires restrictions lasting beyond the producing call. | Explain from clauses and valid result roots. Basie aliases are restricted to calls and immediate result use rather than freely stored reference variables with inferred Rust regions. A local-rooted result is invalid. |
| Shared and writable access | Shared access prevents mutation that could invalidate outstanding references; exclusive mutation prevents competing access. | Explain this as Rust's mechanism, then contrast Basie's stable pool storage, constrained aliases, leases and checked identifiers. Multiple readers are not multiple owners. Basie tickets restrict the parameter's writes but do not globally freeze an object against other paths. |
| Concurrent interfaces | Ownership capabilities support safe concurrent interfaces. | Keep concurrency out of the Basie teaching progression unless its specification introduces it. Rust's thread-safety machinery includes Send/Sync and library contracts, beyond a simple slogan about readers and writers. |
| Learning from rejection | Learning requires interpreting rejected programs and finding valid designs. | Include short prediction exercises and deliberately rejected examples, followed by useful corrected programs. Explain the exact hazard and the check involved. |

## Strongest application to the book

Introduce the question of responsibility during the first calls. A routine can calculate from a scalar copy, inspect an existing object, mutate existing storage or consume an owning resource. These are different interfaces even when their machine representations are small. Build the first ownership example around two calls on the same object: one uses it and returns, the other takes responsibility and ends its lifetime.

The move rule should immediately create a useful question: how can a routine work on the object without consuming it? Temporary access answers that question. Then returned views create the next question: how long may access survive the call? This sequence gives every rule a reason before the full pool machinery is explained.

Use diagrams showing responsibility edges separately from access edges. A move changes the responsibility edge while the target record stays in its slot. A lease adds a temporary access path while the owner remains responsible. Slot reuse begins a new lifetime at the same location, so an old identifier must fail its generation check. Distinguish rejected owner copies from checked stale-identifier access.

## Qualifications required for Basie

Basie's ownership and lifetime guarantees should stand on their own mechanisms. It does not currently enforce Rust's universal exclusion between writable and shared references. It uses runtime checks for bounds, stale identifiers, ownership cycles and capacity. The lesson's claim of no overhead refers chiefly to static ownership and reference constraints, not all safety mechanisms or all library operations. Do not transfer that claim to Basie.

The most useful lesson is that safety can preserve useful programming operations by making their contracts explicit. The book should explain which contract each Basie interface carries and how its checks prevent a particular misuse.

## Plan changes

Use the chapter plan's early calls as the foundation for permission and responsibility. Teach move through a consuming call, then temporary access as the solution to non-consuming operations. Keep the full collection example later. Add the interface questions and copyability distinction to the chapter outcomes. Every ownership diagram must identify both the object lifetime and the separate lifetime of each access path.
