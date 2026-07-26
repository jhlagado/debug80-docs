/**
 * Geometry lint for the generated figures.
 *
 * A generated figure has one characteristic failure: the arithmetic is right in
 * the source and wrong on the page. A label lands on the row above it, or a
 * block computed from a row index falls off the bottom edge. Both are invisible
 * in the code and obvious in a browser, which is a slow way to find them when
 * there are eighty figures.
 *
 * So this reads the emitted SVG back and checks what a person would check by
 * eye: is everything inside the canvas, and does any text sit on top of any
 * other text. Bounding boxes for text are estimated from the font size and the
 * character count, the same estimate the drawing helpers use, so a warning here
 * means the two disagree by more than the slack allowed below.
 *
 * Usage: node scripts/lib/check-figures.mjs <dir> [<dir>...]
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** Class name to (font size, per-character advance, is-monospace). */
const FONTS = {
  t: [13, 0.6], ts: [11, 0.6], tb: [13, 0.6], dim: [11, 0.6], cap: [10, 0.72],
  n: [13, 0.52], ns: [11, 0.52], nb: [13, 0.52], dimn: [11, 0.52],
};

/** Text boxes may overlap by this much before it counts. Kerning is approximate. */
const SLACK = 3;

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

function textBox(a, content) {
  const cls = (a.class ?? 't').split(/\s+/)[0];
  const [size, adv] = FONTS[cls] ?? [13, 0.6];
  const w = content.length * size * adv;
  const x = Number(a.x) || 0;
  const y = Number(a.y) || 0;
  const anchor = a['text-anchor'] ?? 'start';
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  // Baseline-relative: cap height above, descender below.
  return { x: left, y: y - size * 0.78, w, h: size * 1.02, s: content };
}

function overlaps(a, b) {
  return (
    a.x + a.w - SLACK > b.x &&
    b.x + b.w - SLACK > a.x &&
    a.y + a.h - SLACK > b.y &&
    b.y + b.h - SLACK > a.y
  );
}

export function checkFigure(file) {
  const src = readFileSync(file, 'utf8');
  const problems = [];

  const svgTag = src.match(/<svg[^>]*>/)[0];
  const { width, height } = attrs(svgTag);
  const W = Number(width);
  const H = Number(height);

  // Measure what is drawn, not what is stored. `&lt;` is four characters in
  // the file and one on the page, and counting the stored form invents
  // collisions in any figure whose labels contain angle brackets.
  const unesc = (s) =>
    s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  const texts = [];
  for (const m of src.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)) {
    const a = attrs(`<text${m[1]}>`);
    texts.push(textBox(a, unesc(m[2])));
  }

  const boxes = [];
  for (const m of src.matchAll(/<rect([^>]*)\/>/g)) {
    const a = attrs(m[0]);
    boxes.push({
      x: Number(a.x) || 0,
      y: Number(a.y) || 0,
      w: Number(a.width) || 0,
      h: Number(a.height) || 0,
      s: `rect ${a.class ?? ''}`,
    });
  }

  // 1. Everything inside the canvas.
  for (const el of [...texts, ...boxes]) {
    if (el.y < -0.5 || el.y + el.h > H + 0.5) {
      problems.push(
        `outside canvas (height ${H}): "${el.s.slice(0, 44)}" spans y ${el.y.toFixed(0)}..${(el.y + el.h).toFixed(0)}`,
      );
    } else if (el.x < -0.5 || el.x + el.w > W + 0.5) {
      problems.push(
        `outside canvas (width ${W}): "${el.s.slice(0, 44)}" spans x ${el.x.toFixed(0)}..${(el.x + el.w).toFixed(0)}`,
      );
    }
  }

  // 2. No text on top of other text.
  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      if (overlaps(texts[i], texts[j])) {
        problems.push(
          `text collision: "${texts[i].s.slice(0, 30)}" over "${texts[j].s.slice(0, 30)}" near y ${texts[i].y.toFixed(0)}`,
        );
      }
    }
  }

  // 3. A figure with no title or desc is unreadable to a screen reader.
  if (!/<title[^>]*>[^<]+<\/title>/.test(src)) problems.push('missing <title>');
  if (!/<desc[^>]*>[^<]+<\/desc>/.test(src)) problems.push('missing <desc>');

  return problems;
}

const dirs = process.argv.slice(2);
if (dirs.length) {
  let total = 0;
  let clean = 0;
  for (const dir of dirs) {
    for (const name of readdirSync(dir).filter((n) => n.endsWith('.svg')).sort()) {
      const file = path.join(dir, name);
      const problems = checkFigure(file);
      total += 1;
      if (problems.length === 0) {
        clean += 1;
      } else {
        console.log(`\n${file}`);
        for (const p of problems) console.log(`  ${p}`);
      }
    }
  }
  console.log(`\n${clean}/${total} figures clean`);
  if (clean !== total) process.exitCode = 1;
}
