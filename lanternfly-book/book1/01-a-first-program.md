---
layout: default
title: "A First Program"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 1
---

# A First Program

Every game keeps count of something: lives left, coins collected, frames
until the ghost turns blue. Fifty times a second, a game loop wakes up,
looks at its counts, decides what they mean, and changes a few of them.
Each count is a byte or two somewhere in memory, and most of what we call
game logic is the business of changing those bytes at the right moments
without ever letting them lie.

That last clause is where the craft lives. A counter that lies — that says
255 lives when the player has none, or says the door is open when it closed
a frame ago — will sink a game more surely than any missing feature, and it
will do it at the worst moment, on someone else's machine, three weeks
after you were certain the code was finished. Programs fail at their
counts far more often than at their cleverness. So this book begins where
the bugs begin, with a routine that changes one byte and takes care to
change it truthfully.

The player starts a round with three lives. Losing one should subtract
one, but only while the count is above zero:

```lanternfly
var lives as u8 = 3

sub loseLife()
    if lives > 0 then
        lives = lives - 1
    end
end
```

Read it aloud and it nearly reads itself: a variable called `lives`, a
subroutine called `loseLife`, and inside it, if `lives` is greater than
zero, then `lives` becomes `lives` minus one. If you have ever sketched a
routine in pseudocode before writing the real thing, Lanternfly is meant
to feel like the sketch turning out to be the real thing. That is not an
accident of taste. A program you can read aloud is a program you can
check by reading, and on the machines this language is built for,
checking by reading is a skill you will use constantly. Keep the habit in
mind as the chapters accumulate: when a Lanternfly line resists being
read aloud, the line is usually trying to do too much.

## The case for Lanternfly

It helps to know what problem Lanternfly is solving before learning its
rules, so here is the situation on a small machine — say a Z80 with
sixty-four kilobytes of memory, the processor inside a whole generation
of home computers, arcade boards and hobby machines that are still being
built and programmed today. Sixty-four kilobytes is not much room. This
paragraph, rendered as text, would occupy a noticeable slice of it. Into
that space must fit your program, its data, the screen, and whatever the
machine's firmware reserves for itself. Every technique in this book
descends from that arithmetic.

The traditional choice on such a machine has been between two languages.
Assembly does exactly what you say, at the price of saying everything.
The one-line thought "if any lives remain, take one away" dissolves into
register traffic: load the count into the accumulator, compare it with
zero, jump past the next part if they were equal, decrement, store it
back. Five instructions, each individually trivial, and the thought is
already hard to see; after a few thousand lines the thoughts disappear
entirely, and reading your own program back becomes an act of
archaeology. Assembly programmers develop real skill at this
archaeology, and the best of them are astonishing — but the skill is
spent recovering meaning that a better notation would simply have kept.

The other choice, an interpreted BASIC, restores the readable line.
`IF LIVES > 0 THEN LIVES = LIVES - 1` says what it means, and the home
computers of the eighties booted straight into BASIC precisely because
anyone could learn to write it in an afternoon. The cost hid elsewhere.
An interpreter is a program that reads your program while it runs —
every time your line executes, the machine parses those words again,
looks up the variables again by name, and only then does the five
instructions of actual work. The useful work is a sliver of each tick.
For a game that must finish its thinking fifty times a second, the
interpreter is a tax collector standing beside every single statement,
and games written in BASIC moved at the speed the tax allowed.
Readability and speed have sat on opposite sides of the scale for as
long as these machines have existed.

The third position is an old one, and Lanternfly is a modern take on it.
In the same era as those home computers, Pascal showed that a language
could be structured, typed and compiled — read like careful prose, run
like machine code — and a generation of programmers did serious work in
it. Lanternfly puts that idea back on the small machine. Its surface
reads like the BASIC the machine booted into; its temperament is
Pascal's: every name has a declared type, every block has a shape, and
the whole program is translated once, before it runs, into code the
processor executes directly. The interpreter's tax is paid a single
time, at compile time, on your development machine — and the small
machine never pays it at all.

What does the translation look like? In the program above, `lives` is
one byte of storage at a known address. The `if` becomes a load, a
comparison and a conditional jump. The subtraction is a decrement and a
store. You could count the instructions, and later chapters will,
because the second half of the language's bargain is that the costs stay
visible. A high-level language usually asks you to trade awareness for
comfort: you write less and know less about what you wrote. Lanternfly
refuses the trade. You write the readable line, and the compiler's
output — real assembly, in a listing you can open — shows you exactly
what the line became. Nothing about a readable line entitles it to be
cheap, but you will always be able to find out what it cost, and the
finding out is designed to be easy.

The rest of this chapter takes the routine apart one line at a time.
None of it is difficult, and all of it is load-bearing: every chapter
that follows stands on these few lines.

## Storing a value

```lanternfly
var lives as u8 = 3
```

Before this line means anything, it helps to picture what memory
actually is. Think of a very long street of numbered pigeonholes — on
our Z80, exactly 65,536 of them, numbered from 0 upward. Each pigeonhole
holds one byte: eight binary digits, each a 0 or a 1, which gives 256
distinct patterns per hole. A byte can therefore stand for any count
from 0 through 255, and the pigeonhole's number is its address. That is
the entire physical reality of a variable. There is no label on the
pigeonhole, no record of what the byte means, no guardian checking that
the byte holding your life count is not accidentally overwritten by
something else. Meaning lives entirely in the program's discipline about
who writes where — and the great historical difficulty of assembly
programming is that the discipline was enforced by nothing but your own
carefulness, at three in the morning, across a listing forty pages long.

`var` moves that burden onto the compiler, where it belongs. The keyword
says: reserve storage. The compiler keeps a ledger of every reservation,
chooses an address for each, and never confuses two of them — clerical
work, done perfectly, at machine speed, which is precisely the kind of
work compilers were invented to take from us. `lives` names the reserved
spot, so the rest of the program can say `lives` and never mention an
address. `as u8` fixes the type: unsigned, eight bits — one pigeonhole,
holding 0 through 255, no notion of a negative. And the initializer
`= 3` arranges for the byte to hold three before the program's entry
point runs, so no code ever sees the count in an undefined state. Four
small marks on the line, and each one settles a question that assembly
left open: where, what, how wide, starting from what.

If you arrive from a language like Python or JavaScript, the natural
question is why the type must be spelled at all — at home, you write
`lives = 3` and move on. The machine is why. A Z80 has no general notion
of "a number"; it has bytes and pairs of bytes, and every instruction is
specific about how wide its operands are. Somebody has to decide how
much room each count gets. In an untyped language that somebody is a
runtime system spending your processor to decide at every use; in
Lanternfly it is you, once, at the declaration. Writing `as u8` records
the decision: this count fits in one byte, and one byte is what it gets.
Three lives fit with room for 252 more, and Chapter 2 introduces wider
types for the scores and frame counters that genuinely need them.

There is a quieter benefit, and it compounds over the life of a
program. The declaration is a sentence addressed to future readers: the
author of this program believed lives would always fit in one unsigned
byte. When a later change threatens that belief — a power-up that grants
hundreds of lives, say — the declaration is standing there to be argued
with, and the compiler takes its side until you change it deliberately.
Beliefs written down can be checked. Beliefs held silently, in the head
of a programmer who has since moved on, cannot.

Lanternfly names values and routines in lower camel case. A short name
such as `lives` is a single word; a longer name joins words by
capitalising each word after the first:

```lanternfly
var remainingLives as u8 = 3
```

The convention earns its keep the day you read someone else's program.
When every name in the ecosystem has the same shape, your eye spends
nothing on decoding style and everything on meaning.

## Naming an action

```lanternfly
sub loseLife()
    ...
end
```

`sub` declares a subroutine: a named sequence of statements that runs
when something calls it. Underneath, a subroutine is one of the oldest
ideas in computing — a stretch of instructions that other code can jump
to, with a standing agreement about how to get back. The idea predates
high-level languages entirely; the earliest programmers kept paper
libraries of useful instruction sequences and copied them into new
programs by hand, and the subroutine call was invented so the copying
could stop. Every `sub` in this book is that invention, inherited.

Naming the action matters as much as sharing it. The game will lose
lives from a dozen places: a collision here, a timeout there, a fall off
the bottom of the screen. Without a named routine, the guard and the
subtraction would be pasted into all twelve, and the day the rule
changes — a shield item, a difficulty setting — you would need to find
every copy, and you would find eleven. With one routine, the rule lives
in one place, and the twelve call sites say only what they mean:
`loseLife()`. Read that call site again and notice how much it manages
to say. It names the event in the game's own vocabulary — a life was
lost — while saying nothing about guards, wraps or subtraction. The
caller speaks the game's language; the routine's body speaks the
machine's; and the `sub` declaration is the border between them.

The parentheses hold parameters, the inputs a caller supplies. This
pair is empty because losing a life needs nothing from the caller —
everything the routine touches is already sitting in `lives`. Parameters
arrive properly in Chapter 9, and by then you will have wanted them.

The final `end` closes the subroutine, and the `end` above it closes
the `if`. Lanternfly uses the same closing word for every block it
opens: subroutine, decision, loop, record. A student coming from C will
miss the braces; one coming from Python will wonder why the dedent alone
is not enough. The answer is a division of labour. The word is for the
compiler, which pairs each `end` with the nearest open block and will
complain about a missing one; the indentation is for you, so a human can
check the pairing at a glance. Each audience gets a signal it is good at
reading, and when the two disagree — an `end` that the indentation says
belongs to the wrong block — the visible mismatch is itself the warning
that something is wrong. Programs whose shape can lie to the eye hide
their bugs longer.

## Running a statement conditionally

```lanternfly
if lives > 0 then
    lives = lives - 1
end
```

Here is the first decision in the book, and the shape of every decision
after it. The comparison `lives > 0` produces a Boolean value, true or
false — the yes-or-no quantity named for George Boole, who worked out
in the 1850s that logic could be calculated like arithmetic, a century
before there were machines to take him up on it. When the answer is
true, the indented assignment runs. When it is false, execution
continues after the closing `end` and the count stays exactly where it
is. A processor is, at bottom, a device that does arithmetic and makes
yes-or-no jumps; the `if` statement is the second of those powers,
dressed in words.

It is worth pausing on what would happen without the guard, because the
answer is the reason this chapter's program is shaped the way it is.
Suppose the player has zero lives and something hits them anyway — a
stray collision during the game-over screen, say, which is precisely the
sort of thing that happens in real programs, where events keep firing
after the moment you assumed they would stop. The subtraction would
run. And in unsigned eight-bit arithmetic, zero minus one has nowhere to
go but around: like a car's odometer rolled backward past zero, the
count wraps to its highest value, 255. The next time the game asked
whether any lives remained, it would find 255 of them, and the round
would never end. Wraparound bugs of exactly this shape have shipped in
real software for as long as counters have been stored in fixed-size
cells. The byte does not know it is holding lives. It rolls around as
cheerfully as it does anything else, and no error is reported, because
nothing erroneous happened at the level the machine can see — every
part behaved exactly as built, and the lie emerged from the whole.

That is worth a moment of respect, because it is the shape of most real
bugs on small machines: not a crash, but a truthful mechanism assembled
into a falsehood. The compiler cannot catch it, because each piece is
legal. Only the programmer knows that this byte means lives, and that
lives must never wrap — and the guard is where that knowledge becomes
enforceable. One comparison, costing a couple of instructions, converts
"must never" from a hope into a mechanism.

The wrap itself has precise mechanics, and Lanternfly lets you follow
them rather than asking you to memorise a superstition. Subtraction on
byte values uses a signed intermediate — a wider, signed working value —
so the result of `lives - 1` can genuinely be negative while the
calculation is in flight. It is the store back into the `u8` destination
that narrows the value, and narrowing keeps the low eight bits. Minus
one, kept to its low eight bits, is 255. Chapter 2 walks through this
narrowing rule properly; for now the lesson is simpler and worth keeping
for the rest of your career: the guard is not politeness. It exists so
that the value being stored is never negative in the first place, and
the comparison is cheaper than the bug.

## Assignment uses the destination type

```lanternfly
lives = lives - 1
```

New programmers sometimes stall on this line, and they are right to
stall: as algebra it is nonsense. No number equals itself minus one.
The line makes sense only once you know the order of events. The
expression on the right is evaluated first, using the value `lives`
holds now; then the result is stored, and only then does `lives` change.
For one moment during the statement, the machine holds both the old
count and the new one, and the name `lives` on the two sides of the `=`
refers to the same pigeonhole at two different moments. Read it as "the
new `lives` is the old `lives` minus one" and the circularity
evaporates. This right-then-left rhythm governs every assignment in the
language, and trusting it is one of the small foundations the rest of
the book lays bricks on.

Because `lives` was declared `u8`, the assignment converts the result
to `u8` on the way in. Notice that nothing extra had to be written to
permit this. When an expression starts from values of the destination's
own type and returns to that type, Lanternfly treats the round trip as
the ordinary arithmetic of the byte and converts without a warning.
There is a philosophy in that silence, and it is worth making explicit
because you will meet its consequences everywhere. A compiler that
complained about every `lives = lives - 1` in every program ever
written would bury its users in noise, and users buried in noise stop
reading warnings — at which point the warning that mattered goes unread
too. Lanternfly hoards its objections. It saves them for the crossings
that genuinely lose information, so that when this compiler does speak
up, the sentence deserves attention. Chapter 2 shows what those
crossings look like.

One habit is worth establishing in the first chapter. At the start of a
statement, `=` means "store in". Inside an expression, the same token
compares two values for equality. This program only stores; Chapter 2
puts both uses side by side, and the distinction will feel natural
sooner than you expect.

## Comments explain intent

`//` begins a comment and consumes the rest of its line. The compiler
ignores it entirely, which means a comment is addressed to the only
audience left: the next person who reads the routine. Usually that
person is you, some months later, having forgotten everything you were
certain you would remember.

```lanternfly
// Keep the life count at zero after the round ends.
if lives > 0 then
    lives = lives - 1  // The guard prevents a wrap from zero to 255.
end
```

The useful comment records what the statements cannot say. Nothing in
`if lives > 0` mentions wrapping — the code shows what is checked but
is silent about why. The comment carries the reason, and it earns its
single line the day a future maintainer, tidying up, notices that the
guard "can't ever matter" and prepares to simplify it away. Faced with
the comment, they stay their hand; without it, they ship the 255-lives
bug after all, in perfectly clean code. This is the fate of most
carefully written guards: they look unnecessary precisely because they
work, and only the recorded reason protects them from improvement.

A comment that merely repeats its statement — "subtract one from
lives" — protects nobody, records nothing, and goes stale the first
time the line changes. Write the why. The what is already on the page,
in a language this book is teaching you to read.

## Words and symbols

By now a pattern should be visible in the notation. Structure is
spelled with words: `var`, `sub`, `if`, `then`, `end`. Formulas are
written with the symbols everyone learned in school: `+`, `-`, `=`,
parentheses. The split is deliberate. Formulas have had a compact
symbolic notation for centuries, and abandoning it would make
arithmetic harder to read for no gain, whereas program structure has no
notation from school, so it reads best as words a beginner can
pronounce. When you scan a page of Lanternfly, the words give you the
skeleton and the symbols give you the mathematics, and neither costume
is worn by the other.

| Job | Form |
| --- | --- |
| declare storage | `var lives as u8` |
| declare a subroutine | `sub loseLife()` |
| begin a decision | `if lives > 0 then` |
| close the current block | `end` |
| subtract | `lives - 1` |
| assign | `lives = ...` |
| comment | `// explanation` |

The table is the whole vocabulary this chapter needed — seven forms,
and a working, guarded, truthful program. The language will grow richer
from here, but it grows the same way: a few words for each new kind of
structure, familiar symbols for each new kind of formula.

Three symbols do structural work inside expressions: parentheses group
and hold arguments, square brackets select array entries, and a dot
selects a field of a record. Arrays arrive in Chapter 6 and records in
Chapter 7; until then, parentheses carry the load alone.

## Example

The [chapter listing](/lanternfly-book/book1/code/01-first-program.txt)
contains the complete routine, and it is short enough for the oldest
debugging method there is: a pencil trace. Write `lives = 3` in a
margin and play the machine yourself. The first call to `loseLife`
finds 3 above zero and stores 2. The second finds 2 and stores 1. The
third finds 1 and stores 0. The fourth finds 0, and the comparison —
for the first time — answers false: the subtraction is skipped, the
count rests at 0, and the guard has just refused to let the byte lie.

Tracing a five-line routine may feel like using a microscope on a
postage stamp. Do it anyway, and do it for the listings in the chapters
ahead, because the skill scales and the stakes rise. The programmers
who are calm when a real program misbehaves are the ones who can sit
down with a listing and a pencil and become the machine for a while —
holding its counts in their margins, taking its branches with their
eyes — until the moment the paper says something the screen has been
trying to say all along.
