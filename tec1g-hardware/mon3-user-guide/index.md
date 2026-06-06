---
layout: default
title: "MON-3 User Guide"
parent: "TEC-1G Hardware"
nav_order: 1
has_children: true
has_toc: false
nav_exclude: true
---

# MON-3 User Guide

This is a first-pass Markdown import of **MON3 User Guide v1.6** by Brian Chiha. MON-3 is the monitor ROM for the TEC-1G single-board Z80 computer.

The source PDF was extracted from:

```text
/Users/johnhardy/projects/TEC-1G/MON3_User_Guide_v1-6.pdf
```

The conversion preserves the document's main bookmark structure, extracted text, many code-like blocks, and embedded figures. Tables and heavily aligned reference material still need editorial cleanup against the PDF.

## Chapters

1. [Introduction](00-introduction.md)
2. [Basic Operation](01-basic-operation.md)
3. [Main Menu](02-main-menu.md)
4. [Memory Map](03-memory-map.md)
5. [Data Entry Mode](04-data-entry-mode.md)
6. [Matrix Keyboard](05-matrix-keyboard.md)
7. [Debugging Programs](06-debugging-programs.md)
8. [Tiny Basic](07-tiny-basic.md)
9. [Terminal Monitor](08-terminal-monitor.md)
10. [TEC Magazine Code on the TEC-1G](09-tec-magazine-code-on-the-tec-1g.md)
11. [Advanced Programming](10-advanced-programming.md)
12. [Hard Drive Access](11-hard-drive-access.md)
13. [Quick Start Programs](12-quick-start-programs.md)
14. [Appendix](13-appendix.md)
15. [Useful Links](14-useful-links.md)

## Conversion Notes

- Page numbers from the PDF were not retained as visible document structure.
- The generated table of contents should replace the original PDF table of contents.
- Extracted figures are stored under `assets/images/tec1g-hardware/mon3-user-guide/`.
- Some tables remain as preformatted alignment blocks and should be converted to Markdown tables by hand where readability improves.
- Emphasis is only partially preserved; the PDF text layer exposes font families and sizes, but not a clean semantic Markdown structure.
