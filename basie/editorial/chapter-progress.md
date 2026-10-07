# Private first-draft review ledger

Excluded from publication. The approved thematic plan and chapter manifest govern this draft. Each complete original and replacement chapter has been read. All fifteen replacement bodies have received a technical and reductive prose pass.

| Chapter | Purpose | Evidence | Review |
| --- | --- | --- | --- |
| 1. The Life of a Value | Values in a running program | 01-postage prints 135 and checks copies | Read through Summary; first-draft prose complete. |
| 2. Within Bounds | Valid values and valid access | 02-values, VALID, CHARS, NARROW and BOUNDS | Read through Summary; first-draft prose complete. |
| 3. Coming and Going | Calls, scope and lifetime | CALLS and 10-routines | 2026-10-07 edit: cut to about 1,160 words, echo pivot and duplicated copy explanation removed, dangling-return example reduced to prose, line input moved to Chapter 8. |
| 4. The Original and the Copy | Access without copying | ACCESS, record example and readonly rejection | Read through Try a smaller change; first-draft prose complete. |
| 5. In Good Hands | One object, one responsibility | OWNERS and owner-copy rejection | Read through Predict the next allocation; first-draft prose complete. |
| 6. On Loan | Temporary access to a live object | LEASE: read, update, consume, release and stale identifier selection | Read through Choose the interface; first-draft prose complete. |
| 7. A Change of Plan | Decisions, repetition and recoverable failure | CONTROL, decisions, loops and recoverable errors | Read through Safety checks stop invalid operations; first-draft prose complete. |
| 8. Room to Work | Bounded collections and text | Arrays, strings, ECHO line input and bounds rejection | Read through Choosing the bound; first-draft prose complete. 2026-10-07: Reading a line section moved here from Chapter 3. |
| 9. A Wider View | Reusable routines over existing storage | Open views, PICK and escaping-local rejection | Read through The interface preserves the relationship; first-draft prose complete. |
| 10. Jobs Come and Go | A changing collection | COLLECT: full pool, removal, reuse and empty optional positions | Read through Owning aggregates and larger structures; first-draft prose complete. |
| 11. Taking the Measure | Calculations over structured data | READINGS output and numeric checks | Read through Other integer operations; first-draft prose complete. |
| 12. A Place for Everything | Organising a complete program | Includes in ECHO, READINGS, COMMAND and CAPSTONE | Read through The trusted boundary; first-draft prose complete. |
| 13. One Call Too Many | Calls within a finite memory budget | Mutual-recursion example | Read through Follow one more level; first-draft prose complete. |
| 14. Putting It to Work | A complete CP/M utility | CAPSTONE output, error codes and preserved destination owners | Read through A useful extension; first-draft prose complete. |
| 15. Following the Clues | Building and investigating programs | Safety-boundary diagnostics/traps and specification-checked build commands | Read through Evidence for a correction; first-draft prose complete. |

## Verification and limits

Reference compiler revision: 6056a21621a533bbe1d2296078727abb0de654ba. All 27 complete source programs, three additional line-input boundary cases and five deliberate safety failures passed. ATOM assembled the runtime into ignored docs-local storage, and the generated Z80 ran under the minimal CP/M harness. No Basie implementation files were changed.

Nine accessible SVGs passed geometry checks. The seven new diagrams were rendered in the browser and visually inspected in full, following a Quick Look preview that cropped wide images. The two earlier diagrams had already been rendered and inspected. The opening and input lessons render with Basie source labels and the correct fifteen-chapter pager. Internal links resolve and the human-writing gate has no findings. The site build succeeds. Its ordinary pre-existing large-chunk warning remains.

Public output and navigation exclude the editorial folder, planning page and _internal tree. Repository scans find no removed source-series name. Personal attribution, conversations and development chronology are absent from reader-facing Basie pages. Nothing has been committed, pushed or deployed in this book pass.

## Subsequent release qualification

Native compiler and physical CP/M execution remain separate release checks. Console line editing, keyboard echo and timing have been described from the service contract, rather than claimed as tested by the minimal harness. That harness returns edited-line bytes without BDOS 10 terminal echo, so its captured output differs from the human terminal transcript. Further examples of linked owning records and full device-provider protocols are outside this introductory first draft.
