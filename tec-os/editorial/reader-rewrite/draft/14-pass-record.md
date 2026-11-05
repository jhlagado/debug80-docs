# Chapter 14 pass record

## Contract and reading

I am rewriting Chapter 14 to explain what survives exit/reset and locate it
in the map. Prerequisites are caller memory and service lifetime. The outcome
is an explanation from clearing spans, placement and bank visibility rather
than a second program-memory tutorial.

Authority: replacement-outline.md closed at 0e4feea and recorded at 3060e71;
movement-units.json controls transferred units. Source reading uses the offered
TEC-OS ea3ef3de9133931e925a0220d51c0e971c1fd8dd through git show.
Historical addresses and stack measurements remain at 78127ec. No offered
artifact, new capture, runtime test or physical observation is asserted.

Read: complete replacement outline; relevant controlling units; full original
14-memory-map.md and 08-memory.md; original01 through the complete memory
section, including the containing layers passage; complete appendix C including
its tables and reproduction example. Human-writing SKILL.md, revision playbook
and pattern catalogue read alongside the course-writing teaching standard and
its banned-pattern, reader-model and review references. The closed outline's
assembly prerequisites govern this chapter rather than the ZAX beginner model.

## First durable draft

The generous draft is written. Its route is address visibility, clearing spans,
dynamic allocation, page zero, stacks and the bank/stack boundary. No fresh
executable example or output is introduced. Full editorial passes and final
citation coordinate checks are still due at this checkpoint.

## Material accounting

Original ranges below refer to book base10821b6. Every assigned unit has a home.
Headings and navigation are reconstructed, not copied as a parallel route.
The detailed address tables remain in Appendix C with links from this chapter.
No shared ledger or appendix is edited.

| Original unit | Disposition in the draft |
| --- | --- |
| `tec-os/01-introduction.md:19-19` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/01-introduction.md:31-36` (paragraph) | Combined into opening system layers and bank allocation explanation. |
| `tec-os/01-introduction.md:160-163` (paragraph) | Combined into opening system layers and bank allocation explanation. |
| `tec-os/08-memory.md:150-160` (paragraph) | Combined into The card sets the space below the workspace. |
| `tec-os/14-memory-map.md:1-6` (front matter) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:8-8` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:10-10` (provenance or capture recipe) | Replaced by explicit source-offer scope and separate historical provenance. |
| `tec-os/14-memory-map.md:12-14` (provenance or capture recipe) | Replaced by explicit source-offer scope and separate historical provenance. |
| `tec-os/14-memory-map.md:16-21` (paragraph) | Rewritten as the opening lifetime problem; old roadmap deleted. |
| `tec-os/14-memory-map.md:23-23` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:25-28` (paragraph) | Rewritten in Two banks at the same addresses; no-stack consequence developed at the end. |
| `tec-os/14-memory-map.md:30-36` (paragraph) | Rewritten in Two banks at the same addresses; no-stack consequence developed at the end. |
| `tec-os/14-memory-map.md:38-47` (paragraph) | Rewritten in Two banks at the same addresses; no-stack consequence developed at the end. |
| `tec-os/14-memory-map.md:49-54` (paragraph) | Rewritten in Two banks at the same addresses; no-stack consequence developed at the end. |
| `tec-os/14-memory-map.md:56-56` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:58-61` (paragraph) | Rewritten in Page zero is rebuilt selectively; exhaustive lookup table linked to Appendix C. |
| `tec-os/14-memory-map.md:63-75` (table) | Rewritten in Page zero is rebuilt selectively; exhaustive lookup table linked to Appendix C. |
| `tec-os/14-memory-map.md:77-82` (paragraph) | Rewritten in Page zero is rebuilt selectively; exhaustive lookup table linked to Appendix C. |
| `tec-os/14-memory-map.md:84-90` (paragraph) | Rewritten in Page zero is rebuilt selectively; exhaustive lookup table linked to Appendix C. |
| `tec-os/14-memory-map.md:92-92` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:94-97` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:99-109` (table) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:111-121` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:123-132` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:134-140` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:142-153` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:155-157` (paragraph) | Rewritten in The workspace across a program exit; historical address table remains in Appendix C. |
| `tec-os/14-memory-map.md:159-159` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:161-166` (paragraph) | Rewritten in The card sets the space below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:168-182` (paragraph) | Rewritten in The card sets the space below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:184-189` (paragraph) | Rewritten in The card sets the space below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:191-195` (paragraph) | Rewritten in The card sets the space below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:197-202` (paragraph) | Rewritten in The card sets the space below the workspace; historical values explicitly labelled. |
| `tec-os/14-memory-map.md:204-204` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:206-206` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:208-213` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:215-217` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:219-229` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:231-240` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:242-247` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:249-260` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:262-265` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:267-271` (table) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:273-278` (paragraph) | Rewritten in Four stacks for different stages; measured bases separated from declarations and test assertions. |
| `tec-os/14-memory-map.md:280-280` (heading) | Combined into the new title/navigation and subject headings. |
| `tec-os/14-memory-map.md:282-285` (paragraph) | Rewritten in EXPAND 1 and the stack boundary; full partition retained in prose and lookup linked to C. |
| `tec-os/14-memory-map.md:287-293` (table) | Rewritten in EXPAND 1 and the stack boundary; full partition retained in prose and lookup linked to C. |
| `tec-os/14-memory-map.md:295-300` (paragraph) | Rewritten in EXPAND 1 and the stack boundary; full partition retained in prose and lookup linked to C. |
| `tec-os/14-memory-map.md:302-310` (paragraph) | Rewritten in EXPAND 1 and the stack boundary; full partition retained in prose and lookup linked to C. |

No technical unit is deleted. Repeated descriptions of the program limit and
allocation policy are combined. The old exact workspace/address lookup tables
are not duplicated: Appendix C retains all entries, sizes and reproduction.
The historical stack census values are retained in prose here. TOP/AREA code,
recipes and captures from old08 stay with their assigned chapter10/28 homes;
none is transferred into14 or silently discarded by this draft.
