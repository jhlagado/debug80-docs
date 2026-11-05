# Chapter18 independent lead review

Reviewed complete8a86430 draft/pass record, complete frozen old18 and assigned
old01 persistence paragraph. Recovered the aggregate-output truncation by
reading old18's closing interrupt section and cache.asm1–40 separately.
Read the complete current858-line cache source. Supporting reads include
BIOS write/no-pre-read and IFFGET/CDI/CEI, MEMINIT, function48/VFLUSH, changed
FCB close and the full recovery contract through its boundary table. No product
code, retained script or test was imported or executed.

## Findings and disposition

1. Reset writesnothing is wider than the persistence contract. A startup file
can itself contain writing commands. The demonstrated fact is that reset does
not flush the old cache: COLD calls MEMINIT, which clears EXPAND1 before card
mount/startup. Corrected the sentence to that exact boundary. It preserves the
loss of unwritten lines without claiming no later write in the startup session.
2. The high/low-DMA copy-path announcement repeats what the following complete
MVCOPY explanation establishes. Deleted the announcement without removing any
path, address, instruction contract or cost.
3. The through-write paragraph states failedline-drop twice in consecutive
sentences. Kept one precise failure/nextread consequence and the distinct
earlier dirty-victim failure. No persistence result changes.

The lead applied these bounded edits and reread the containing paragraphs.
No remaining factual/editorial finding was identified for this source-only
draft. Final profile/runtime/navigation/whole-book acceptance remains open.

## Evidence checked

All53 assigned units have a home and both complete listing/recipe fences are
unchanged. The24-byte READ instructions and recipe are retained historical
material, not a newly assembled compact-style example. The caller-supplied
DMA/FCB, buffer/latch state and return paths were read as source contracts.

Read the complete neutral archived measure.mjs and m781.json as text. The
script marks entry before a CPU step and return by PC/SP. Its ret helper
waits for the typed/echoed command before sending CR and measures to ready
prompt. The saved781 output supports DIRhit13718, an observed DIRBmiss235357,
MOUNThit6026/miss226445, READ6642581/1343674, SAVE30615308/9951810, close1111542
and CWRITE217421. Book46's timing paragraph supplies the historical781
execution attribution. This archive lacks every input hash, so the result is
retained historical evidence rather than a fresh self-contained qualification.

Read Book22's explicit60cfbdc CLOOK259/1979 rerun and Book38's5a25178 trace/
capacity figures. The latter gives SAVE8 block order4096,4130,4131,4128,4129,
4096; early SAVE160 writes4128,4129,4130; and8.19/8.41million for the larger
file. Those observations remain separately pinned. Current source equality
is not substituted for historical execution. The all30 estimate is explicitly
derived, not an observed all-dirty flush or physical deadline.

CFLALL drops failed lines; CFLUSH retains failed data but excludes its directory
line; CWRBH drops that directory line on failure. CTAKE keeps a failed dirty
victim and advances CNEXT. Through-write success marks clean, failure drops
the current line, while earlier victim failure is distinct. Data misses can
eventually write older dirty lines. These are the actual code paths rather
than the recovery document's broader shorthand. Function48/mount/warmboot
flushes are distinguished from invalid requests and successful close does not
mean every FCB issued a directory write. Claimed durability and NMI boundaries
are bounded. No unconditional physical power-loss guarantee survives.

## Craft and reader route

Read every retained/new paragraph for thematic role, sentence deletion, agency
and every comma. All operation/result qualifiers have concrete uses. Literal
assembly punctuation remains unchanged. No authorial Oxford comma, semicolon
or em dash was found. The ending gives an actual interrupt-response decision
with cache-wide flush exceptions, rather than the old unsupported claim that a
written-through file avoids every whole-cache flush. The complete reader route
is state/read/write/order/failure/latency, with the recovery consequence local
to the relevant boundary. No final integration acceptance is inferred.
