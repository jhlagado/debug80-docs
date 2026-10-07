# Values and syntax analysis for Programming Basie

Private editorial analysis of executable syntax, observed results, deliberately incorrect programs and checked exercises. This analysis concerns teaching structure and Basie capabilities.

## Contribution to the progression

Safety constraints become concrete through ordinary declarations and calculations. Type validity is part of memory safety's foundation: a type describes more than a storage width. The teaching sequence proceeds from a running program to a variable, explicit type, mutation, scalar representations, conversions, expressions, routine results, control flow and a practical exercise.

Basie's opening should connect its safety model to executable operations promptly. A conceptual explanation without a small program risks becoming detached from what the reader can do. Equally, a syntax survey without storage reasoning loses the central theme. Alternate short explanations with predictions about values, storage and permitted access.

## Teaching techniques worth adapting

- Produce an observable result in the first program. A calculation checked by an assertion is useful evidence but a console result gives a beginner a clearer first success when the required service can be explained simply.
- Introduce mutation as permission to change a binding. Keep it separate from responsibility for an allocation. Explain Basie's var and const semantics rather than transplanting Rust's immutable-by-default let bindings.
- Present scalar types as domains of valid values. Use Basie's actual numeric ranges and Boolean rules. Its byte-oriented strings do not inherit Rust's Unicode scalar model.
- Explain conversions through a task with a visible boundary. Basie permits specified widening and checks narrowing; Rust's as casts have different rules. A conversion example must show whether a value is preserved, rejected or changed.
- Read a deliberately produced diagnostic as evidence about a rule. Identify the source operation, required type and actual mismatch, then correct the program. Do not invent Rust-style compiler suggestions for Basie.
- Show the same task in several legitimate forms only when the comparison teaches a new idea. Rust's expression-valued blocks, if, match and loop do not imply analogous Basie constructs.
- Finish a small conceptual unit with an exercise whose checks are supplied. The learner changes the program and obtains evidence that the change works. Reader exercises are publication content; editorial verification machinery stays private.

## Factorial exercise and small-machine consequences

The recursive-to-iterative factorial exercise connects familiar arithmetic to a new language while keeping the intended result fixed. Its deeper benefit for Basie is separating correctness of values from storage cost: repeated calls require concurrently live activations, while an iterative accumulator can use fixed activation storage.

Adapt the problem to Basie's integer ranges. With u32, 12 factorial fits and 13 factorial does not. Define the input domain or specify the intended overflow behaviour before giving expected results. Do not copy the Rust lesson's range through 20, which requires a wider representation. Explain Basie's arithmetic semantics rather than claiming Rust's debug and release overflow behaviour.

Place the initial iterative exercise after loops. Revisit it in the activation-capacity chapter by comparing call depth and live local storage. Supply checks for zero, one and several ordinary inputs, with a separately explained boundary case. A numerically correct result does not establish bounded resource consumption for arbitrary input.

## Material to leave outside this book's progression

Rust macro machinery, Unicode character encodings, generic iterators, expression-valued loops, test attributes and multithreaded panic behaviour are features of that language. They are not prerequisites for Basie's ownership model. Mention a comparison only when it clarifies a concrete Basie rule. Promotional sections and course-production discussion have no role in the publication.

## Changes to the thematic plan

Keep the first runnable program close to the safety motivation. Add observed output or a clearly explained assertion outcome. Link each type and conversion to its validity conditions. Add diagnostic-reading exercises from the beginning and checked practice at the end of early conceptual units. Use the factorial comparison to connect the loops chapter to the later chapter on finite activation storage.
