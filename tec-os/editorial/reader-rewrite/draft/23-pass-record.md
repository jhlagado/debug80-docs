# Chapter 23 pass record

## Brief and authority

The chapter's job is to follow a numbered call into the ROM and account for
its argument registers, shared-device effects, code bytes and caller stack.
The reader has used the hardware interface and can read Z80 calls, returns,
flags and saved register pairs. This is implementation teaching after the
programming interface, not a second API catalogue.

The replacement outline closed at `0e4feea` and its recording at `3060e71`
govern the route. The controlling movement map assigns 26 complete units
from old `23-hardware-services-inside.md` at book base `10821b68`.
There are no assigned units from another chapter. All 26 units and the
complete old chapter were read, including its byte table and shared rules.
The complete replacement outline and Chapter 23 reverse-outline notes were
also read. There are no executable listings, capture recipes or output
fences in this assignment.

The complete human-writing skill, revision playbook and pattern catalogue
were read alongside the course-writing teaching standard and its banned
patterns, reader model and review checklist. The book's STYLE and closed
outline govern the established assembly prerequisites and substantive
ending. The course's beginner assumptions and summary template do not
override them.

Source authority is `ea3ef3de9133931e925a0220d51c0e971c1fd8dd`, read with
`git show`. Historical size/address examples retain `78127ec`. Static
instruction/operand comparison of services.asm and abi.asm, ignoring only
comments, case and whitespace, finds identical text at the two pins. This
does not constitute a new build or measured artifact qualification.

## Planned teaching order

The route begins with argument-preserving dispatch and its exits. The
routine/byte table establishes which implementations belong here. Stored
state and the status LCD follow, then shared digit/speaker output, matrix
input, clock transfers, display claim/release/text and the font. The last
section derives caller-stack requirements from dispatcher and nested driver
use. The historical table and addresses remain visibly historical. Stack
bounds remain declarations supported by source paths, not measured maxima.

## Work state

Reading, source investigation and the generous draft are complete. The
subsequent thematic, deletion, agency, every-comma and journey passes are
in progress.
Only this record and `23-numbered-service-dispatch.md` are owned. No build,
test, capture, fixture import or product runtime is authorised or performed.
