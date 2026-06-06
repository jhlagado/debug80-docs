# MON-3 Markdown Adaptation Score

Date: 2026-06-07
Second-wave review: 2026-06-07

This score measures whether a casual reader would regard the web version as a reasonable Markdown/HTML adaptation of the original MON-3 PDF. It does not require the web page to reproduce the PDF layout exactly. The goal is to preserve the document's intent, hierarchy and readability in a web-native form.

## Rubric

Total: 10 points.

| Area | Points | Standard |
| --- | ---: | --- |
| Structure and navigation | 2.0 | Chapter pages have clear `#` titles, major sections use `##`, child sections use `###` or lower only when genuinely subordinate, and important sections are linkable from the page TOC. |
| Tables and structured data | 2.0 | Tabular PDF content is represented as Markdown tables or lists rather than spacing-dependent preformatted blocks. |
| Listings and terminal output | 1.5 | Code, BASIC programs, assembly listings, byte dumps and prompts remain in fenced blocks, with no excessive left padding or PDF-style side-by-side columns. |
| Image placement | 1.5 | Images appear near the text they support and preserve the PDF's reading intent without interrupting the flow. |
| Web readability | 1.5 | A reader can scan the page naturally on the web, with sensible paragraph breaks, headings and tables. |
| Fidelity to source intent | 1.0 | The adaptation keeps the original technical meaning, examples and sequence while allowing Markdown-native layout changes. |
| Polish | 0.5 | Labels, casing and whitespace are consistent enough that formatting does not distract from the content. |

## Current Score

Estimated score: **8.6 / 10**.

Rationale:

- Structure and navigation: **2.0 / 2.0**. The guide is back in navigation, each chapter has `has_toc: true`, and the major sections now use linkable headings. A second heading audit confirmed that short chapters now have usable `##` landmarks and long reference chapters expose their major sections in the page TOC. A comparison against the PDF table of contents from `/Users/johnhardy/projects/TEC-1G/ROMs/MON3/MON3_User_Guide_v1.6.pdf` found and corrected the missing `GLCD API Configure Calls` heading.
- Tables and structured data: **1.8 / 2.0**. The obvious PDF-column tables have been converted to Markdown tables. A few compact multi-column lookup tables remain, but they are now semantic tables rather than preformatted columns.
- Listings and terminal output: **1.4 / 1.5**. Fenced blocks are now used for real listings, byte streams, prompts or program output. The Appendix CGRAM/DDRAM listing and Quick Start GLCD listing have been tightened.
- Image placement: **1.1 / 1.5**. Images are present and generally near the related text. The source PDF is now located in the MON3 repo, but this still needs a rendered HTML pass against page screenshots for final visual placement checks.
- Web readability: **1.3 / 1.5**. The main conversion problems have been addressed. Source-level checks show no obvious remaining PDF-column tables in preformatted blocks, and every chapter has a usable page outline. Some long reference pages may still benefit from small explanatory headings or shorter tables.
- Fidelity to source intent: **0.8 / 1.0**. The PDF's intent is preserved, with web-native restructuring where PDF columns were counterproductive.
- Polish: **0.2 / 0.5**. More rendered-page review is needed for image captions, long tables and page-level visual balance.

## Next Checks

- Render the Jekyll site locally or through CI and inspect the page TOCs in the browser.
- Compare rendered HTML pages against PDF screenshots for image order and section breaks. Use `/Users/johnhardy/projects/TEC-1G/ROMs/MON3/MON3_User_Guide_v1.6.pdf` as the source PDF.
- Review the Advanced Programming page for whether any API groups should be split into separate pages if the page TOC becomes too long.
