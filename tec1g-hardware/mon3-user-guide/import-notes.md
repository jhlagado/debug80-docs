---
layout: default
title: "Import Notes"
parent: "MON-3 User Guide"
grand_parent: "TEC-1G Hardware"
nav_order: 16
has_toc: false
nav_exclude: true
---

# Import Notes

This page records the first-pass conversion state for the MON-3 User Guide import.

## Source

```text
/Users/johnhardy/projects/TEC-1G/MON3_User_Guide_v1-6.pdf
```

PDF metadata:

- Title: MON3_User_Guide_v1.6
- Author shown in document: Brian Chiha
- Pages: 92
- PDF producer: Skia/PDF m140 Google Docs Renderer

## What Worked

- The PDF has a readable text layer.
- The PDF has bookmarks, which were used to split the guide into main chapters.
- Layout-mode extraction preserved many code blocks and aligned reference sections better than plain extraction.
- The PDF exposes embedded images; 46 figures were extracted.

## Known Cleanup Needed

- Tables and reference grids should be reviewed against the PDF and converted to Markdown tables where appropriate.
- Some short headings inside API sections may still appear as plain text rather than Markdown headings.
- Bold and italic emphasis is not fully semantic in the PDF text layer and needs manual review.
- Extracted figures should be checked for duplicates, logos, and screenshots that may be better replaced by manual crops.
- The original PDF table of contents was not preserved as a chapter; the site navigation now acts as the generated table of contents.
