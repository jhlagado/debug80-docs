#!/usr/bin/env python3
"""Enumerate suspect sentences for the reading pass. Not a lint: every hit
must be judged by reading its paragraph. A back-pointing opener that
continues with new content stays; a short sentence carrying a fact stays.
The tell is the restater and the manufactured-emphasis fragment.

Usage: python3 rewrite/enumerate-suspects.py [dir ...]   (default: book1)
"""
import pathlib, re, sys

OPENERS = ("This", "That", "These", "Those", "It")

def paragraphs(text):
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    lines = [l for l in text.splitlines()
             if not l.startswith(("|", "#", "!["))]
    cur = []
    for l in lines:
        if l.strip():
            cur.append(l.strip())
        elif cur:
            yield " ".join(cur); cur = []
    if cur:
        yield " ".join(cur)

for target in (sys.argv[1:] or ["book1"]):
    for f in sorted(pathlib.Path(target).glob("**/*.md")):
        for p in paragraphs(f.read_text()):
            sents = re.split(r"(?<=[.!?])\s+(?=[A-Z`])", p)
            for i, s in enumerate(sents):
                s = s.lstrip("-* ").strip()
                words = s.split()
                if not words:
                    continue
                first = words[0].rstrip(",")
                if first in OPENERS and i > 0:
                    print(f"{f}: BACKPOINT: {s[:100]}")
                if len(words) <= 4 and s.endswith("."):
                    print(f"{f}: SHORT: {s}")
