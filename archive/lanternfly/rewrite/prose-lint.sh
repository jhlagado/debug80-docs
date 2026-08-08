#!/bin/sh
# Prose lint for the Lanternfly book: mechanical scan for banned AI-tell
# forms. Zero exit = clean. Run before every commit of book prose.
# The lexicon catches the greppable subset; negative definitions and
# back-pointing restatements still need the sentence-level reading pass.

set -e
BASE="$(cd "$(dirname "$0")/.." && pwd)"
TARGETS="${*:-$BASE/book1 $BASE/rewrite/briefs $BASE/rewrite/drafts $BASE/rewrite/examples}"
FAIL=0

check() {
  label="$1"; pattern="$2"
  hits=$(grep -rnEi "$pattern" $TARGETS 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "== $label =="
    echo "$hits"
    FAIL=1
  fi
}

# Headings must name their subject.
check "interrogative heading" '^#{1,3} (What|Where|Why|Who|How)\b'

# Not-just scaffolding.
check "not-just family" "not just|not merely|isn't just|isn't merely|more than just|not simply"

# Verb upgrades for is/has.
check "verb upgrade" 'serves as|stands as|functions as|acts as a|boasts'

# Inflated significance and editorializing.
check "inflated significance" 'testament|underscores?|pivotal|crucial|vital role|plays a key role|marks a turning|lasting impact|cements'

# Marker vocabulary.
check "marker vocabulary" '\bdelve|tapestry|figurative landscape|\brealm\b|interplay|meticulous|intricate|nuanced|garner|bolster|vibrant|foster|leverag|robust|seamless|embark|elevate|unlock the|harness the|treasure trove|multifaceted|myriad|plethora|moreover|furthermore'

# False agency and emotional colouring of mechanisms.
check "false agency" 'reads itself|writes itself|defends itself|sells itself|asking to exist|cheerfully|happily|gracefully|complete confidence|\bwants\b|\bdeserves\b|\bhopes\b'

# Honesty is a virtue of people, not compilers, layouts or numbers.
check "inanimate honesty" '\bhonest\b|\bhonestly\b|\bhonesty\b'

# Machines have no interior: no verbs of mind with a machine subject.
# (Notation may "mean" something by definition; a program may not.)
check "machine mind" '\b(program|compiler|routine|backend|toolchain|machine|loop|alias|module|code|it) (means|knows|believes|understands|thinks|remembers|notices|wonders|decides|cares|wishes|prefers|agrees|expects|asks|refuses)\b|that expects|machine asks|\brefuses\b'

# Reader stage-directions.
check "stage direction" '^Notice |[.!] Notice |Note that you|Look closely|Keep in mind|Bear in mind|Remember that|Read it aloud|Hold onto'

# Worth-noting throat clearing.
check "worth-noting" 'worth noting|worth pausing|worth a moment|repays attention|repays early attention|deserves attention|deserves a careful look|deserves its own'

# Participle tails that smuggle significance.
check "participle tail" ', (highlighting|underscoring|reflecting broader|showcasing|emphasizing|demonstrating the (power|importance))'

# Vague attribution.
check "vague attribution" 'experts say|studies show|widely regarded|many believe|observers note|it is often said'

# Wrap-up boilerplate and assistant residue.
check "boilerplate" 'in conclusion|in summary|^Overall,|dive in|dive into|let us explore|in this chapter,? we will explore'

# Claude/AI mentions never ship.
check "ai attribution" 'claude|anthropic|copilot'

if [ "$FAIL" = "0" ]; then
  echo "prose-lint: clean"
fi
exit $FAIL
