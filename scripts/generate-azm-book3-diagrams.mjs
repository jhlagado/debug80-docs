/**
 * Generates the figures for AZM Book 3, Algorithms and Data Structures.
 *
 * An algorithms book is the classic case for pictures: every chapter turns on a
 * shape the prose can only describe one step at a time. A sorted prefix growing
 * along a row, a queue index wrapping past the end of its store, six stack
 * frames unwinding, a search tree hitting a dead end. Drawing those from a
 * generator means the values are computed rather than transcribed, so the
 * insertion sort frames below are the frames the sort actually produces and the
 * GCD steps are the steps the loop actually takes.
 *
 * Every value here comes from the chapter text or from the companion listing in
 * azm-book/book3/examples/.
 *
 * Font sizes are the toolkit defaults throughout. A plate scrolls sideways
 * rather than scaling below 560px, so the smallest label never falls under
 * about 9px on a phone. Where content did not fit, the figure was split rather
 * than shrunk.
 *
 * Usage: node scripts/generate-azm-book3-diagrams.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  svg, rect, text, line, path as pathEl, caption,
  strip, bitfield, stack, node, legend,
} from './lib/figure.mjs';

const OUT = 'assets/images/azm-book/book3';
const BOOK = 'azm';
const figures = {};

const add = (name, title, desc, height, parts) => {
  figures[name] = svg({ title, desc, height, book: BOOK, body: parts.filter(Boolean).join('\n') });
};

/** Eight bits, high bit first, the order the bitfield helper wants. */
const bits8 = (v) => v.toString(2).padStart(8, '0');
const hex2 = (v) => `$${v.toString(16).toUpperCase().padStart(2, '0')}`;
const hex4 = (v) => `$${v.toString(16).toUpperCase().padStart(4, '0')}`;

/** A plot with a flat baseline instead of the toolkit's diagonal guide. */
function plotBox(x, y, w, h, f, samples = 60) {
  const pts = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    pts.push(`${(x + t * w).toFixed(2)},${(y + h - f(t) * h).toFixed(2)}`);
  }
  return [
    rect('bxq', x, y, w, h, 3),
    line('rule', x, y + h, x + w, y + h),
    `  <polyline class="sline" points="${pts.join(' ')}"/>`,
  ].join('\n');
}

/* ============================================================
   Chapter 1 - Foundations
   ============================================================ */

// 1.1 Euclid by subtraction. The loop is run here, so the step sequence under
// the flow is every state HL and DE actually pass through, bars included,
// rather than the compressed table the prose uses.
{
  const steps = [];
  let hl = 48;
  let de = 18;
  for (let guard = 0; guard < 32; guard += 1) {
    if (hl === 0) {
      steps.push({ hl, de, act: 'HL = 0, swap and return 6' });
      break;
    }
    if (hl < de) {
      steps.push({ hl, de, act: 'HL < DE, swap' });
      [hl, de] = [de, hl];
    } else {
      steps.push({ hl, de, act: 'HL ≥ DE, subtract' });
      hl -= de;
    }
  }
  const bar = (x, y, v, hi) =>
    (v === 0 ? '' : rect(hi ? 'bxs' : 'bx2', x, y - 11, (v / 48) * 120, 15, 2));

  add(
    'gcd-euclid.svg',
    'Euclid by subtraction, step by step',
    'The subtract or swap loop as a flow, then every state the loop passes through: HL and DE from 48 and 18, through 30, 12, 18, 6, 12 and 6, to 0 and 6.',
    540,
    [
      caption(30, 36, 'gcd_u16'),
      node({ x: 30, y: 54, w: 140, h: 52, label: 'HL = 0?', kind: 'test' }),
      node({ x: 210, y: 54, w: 140, h: 52, label: 'DE = 0?', kind: 'test' }),
      node({ x: 390, y: 54, w: 140, h: 52, label: 'HL < DE?', kind: 'test' }),
      node({ x: 570, y: 58, w: 140, h: 44, label: 'HL = HL − DE' }),
      line('none', 170, 80, 210, 80, 'ar'),
      line('none', 350, 80, 390, 80, 'ar'),
      line('none', 530, 80, 570, 80, 'ar'),
      text('dim', 176, 74, 'no'),
      text('dim', 356, 74, 'no'),
      text('dim', 536, 74, 'no'),

      node({ x: 30, y: 142, w: 140, h: 40, label: 'ex de, hl, ret', kind: 'term', hi: true }),
      node({ x: 210, y: 142, w: 140, h: 40, label: 'ret', kind: 'term', hi: true }),
      node({ x: 390, y: 142, w: 140, h: 40, label: 'ex de, hl' }),
      line('none', 100, 106, 100, 142, 'ar'),
      line('none', 280, 106, 280, 142, 'ar'),
      line('none', 460, 106, 460, 142, 'ar'),
      text('dim', 106, 128, 'yes'),
      text('dim', 286, 128, 'yes'),
      text('dim', 466, 128, 'yes'),

      pathEl('none', 'M640,102 V204 H16 V80 H30', 'ar'),
      pathEl('none', 'M460,182 V204'),
      text('dimn', 560, 198, 'round again'),

      caption(30, 250, 'GCD(48, 18), every state of the loop'),
      text('dim', 118, 272, 'HL', 'end'),
      text('dim', 330, 272, 'DE', 'end'),
      text('dim', 490, 272, 'what happens next'),
      line('rule', 30, 280, 690, 280),
      ...steps.flatMap((s, i) => {
        const y = 302 + i * 28;
        const last = i === steps.length - 1;
        return [
          text('dim', 30, y, String(i)),
          text(last ? 'tb' : 't', 118, y, String(s.hl), 'end'),
          bar(130, y, s.hl, last),
          text(last ? 'tb' : 't', 330, y, String(s.de), 'end'),
          bar(342, y, s.de, last),
          text(last ? 'nb' : 'dimn', 490, y, s.act),
        ];
      }),

      text('dimn', 30, 526, 'No divide instruction is needed. Repeated subtraction reaches the answer, and the swap keeps the larger value in HL.'),
    ],
  );
}

/* ============================================================
   Chapter 2 - Arrays and Loops
   ============================================================ */

/** Run the book's insertion sort, capturing the per-pass frames a caller wants. */
function runInsertionSort(data, watchPass) {
  const a = [...data];
  const passes = [{ cells: [...a], prefix: 1, key: null, landed: null, i: null }];
  let frames = null;
  for (let i = 1; i < a.length; i += 1) {
    const key = a[i];
    const selected = [...a];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j -= 1;
    }
    const shifted = [...a];
    a[j + 1] = key;
    if (i === watchPass) {
      frames = { i, key, landed: j + 1, selected, shifted, placed: [...a], from: i - 1 };
    }
    passes.push({ cells: [...a], prefix: i + 1, key, landed: j + 1, i });
  }
  return { passes, frames };
}

// 2.1 The anatomy of one pass, in the four moves the pseudocode makes. Pass
// i = 5 is the one worth drawing: the key is the smallest byte so far, so every
// element of the sorted prefix has to move.
{
  const { frames } = runInsertionSort([9, 4, 6, 2, 8, 1, 7, 3], 5);
  const x0 = 190;
  const cw = 42;
  const ch = 30;

  const row = (y, cells, opts) => {
    const out = [];
    cells.forEach((v, c) => {
      const cls = opts.hi === c ? 'bxs' : opts.hole === c ? 'bxq' : c < opts.prefix ? 'bx2' : 'bx';
      const tcls = opts.hi === c ? 'tb' : opts.hole === c ? 'dim' : 't';
      out.push(rect(cls, x0 + c * cw, y, cw, ch, 2));
      out.push(text(tcls, x0 + c * cw + cw / 2, y + 20, String(v), 'middle'));
    });
    // The sorted boundary, drawn where the invariant says it is.
    out.push(line('sline', x0 + opts.prefix * cw, y - 4, x0 + opts.prefix * cw, y + ch + 4));
    return out;
  };

  const ys = [78, 158, 238, 318];

  add(
    'insertion-sort-pass.svg',
    'One pass of insertion sort in four moves',
    'Pass i equals 5: the key 1 is copied to key_byte, the five larger bytes shift one place right, the key is written into the hole at index 0, and the sorted boundary advances to index 6.',
    454,
    [
      caption(x0, 42, 'pass i = 5, values before the pass: 2 4 6 8 9 1 7 3'),
      ...Array.from({ length: 8 }, (_, c) => text('dim', x0 + c * cw + cw / 2, 62, String(c), 'middle')),

      text('ts', 30, ys[0] + 20, '1  select'),
      ...row(ys[0], frames.selected, { prefix: frames.i, hi: frames.i }),
      text('dimn', x0 + 8 * cw + 16, ys[0] + 14, `key_byte = ${frames.key}`),
      text('dimn', x0 + 8 * cw + 16, ys[0] + 32, `first index inspected: ${frames.from}`),

      text('ts', 30, ys[1] + 20, '2  shift'),
      ...row(ys[1], frames.shifted, { prefix: frames.i, hole: frames.landed }),
      pathEl('sline', `M${x0 + cw / 2},${ys[1] - 10} H${x0 + frames.i * cw - cw / 2}`, 'arS'),
      text('dimn', x0 + 8 * cw + 16, ys[1] + 14, 'every byte above the key'),
      text('dimn', x0 + 8 * cw + 16, ys[1] + 32, 'moves right one place'),

      text('ts', 30, ys[2] + 20, '3  place'),
      ...row(ys[2], frames.placed, { prefix: frames.i, hi: frames.landed }),
      text('dimn', x0 + 8 * cw + 16, ys[2] + 14, 'key_byte is written'),
      text('dimn', x0 + 8 * cw + 16, ys[2] + 32, `into index ${frames.landed}`),

      text('ts', 30, ys[3] + 20, '4  advance'),
      ...row(ys[3], frames.placed, { prefix: frames.i + 1 }),
      text('dimn', x0 + 8 * cw + 16, ys[3] + 14, 'the boundary moves to'),
      text('dimn', x0 + 8 * cw + 16, ys[3] + 32, `index ${frames.i + 1}, then i increments`),

      text('dimn', 30, 400, 'The blue rule is the invariant: everything left of it is sorted.'),
      text('dimn', 30, 418, 'The hole at step 2 still holds a stale copy until step 3 fills it.'),
      text('dimn', 30, 440, 'Every other pass does less work than this one. None of them does anything different.'),
    ],
  );
}

// 2.2 The whole sort, one row per outer iteration, over the book's own data.
{
  const { passes } = runInsertionSort([9, 4, 6, 2, 8, 1, 7, 3]);
  const x0 = 150;
  const cw = 42;
  const ch = 30;
  const y0 = 62;
  const rh = 40;

  add(
    'insertion-sort.svg',
    'Insertion sort, one row per outer iteration',
    'The bytes 9 4 6 2 8 1 7 3 sorted over seven outer iterations, the sorted prefix shaded on each row and the inserted key marked, ending 1 2 3 4 6 7 8 9.',
    446,
    [
      caption(x0, 30, 'values at $8000'),
      ...Array.from({ length: 8 }, (_, c) => text('dim', x0 + c * cw + cw / 2, y0 - 8, String(c), 'middle')),

      ...passes.flatMap((r, ri) => {
        const y = y0 + ri * rh;
        const out = [text('ts', 30, y + 20, r.i === null ? 'start' : `i = ${r.i}`)];
        r.cells.forEach((v, c) => {
          const isKey = c === r.landed;
          out.push(rect(isKey ? 'bxs' : c < r.prefix ? 'bx2' : 'bx', x0 + c * cw, y, cw, ch, 2));
          out.push(text(isKey ? 'tb' : 't', x0 + c * cw + cw / 2, y + 20, String(v), 'middle'));
        });
        out.push(
          text('dimn', x0 + 8 * cw + 20, y + 20,
            r.key === null ? 'one element is trivially sorted' : `key ${r.key} lands at index ${r.landed}`),
        );
        return out;
      }),

      legend(30, 398, [
        { cls: 'bx2', label: 'sorted prefix' },
        { cls: 'bxs', label: 'the key just placed' },
        { cls: 'bx', label: 'not yet examined' },
      ]),
      text('dimn', 30, 434, 'The prefix grows by one each pass. Everything left of the shaded edge is already in order, which is the loop invariant.'),
    ],
  );
}

// 2.3 Linear search on the sorted table, with the companion's THRESHOLD of 5.
{
  const sorted = [1, 2, 3, 4, 6, 7, 8, 9];
  const threshold = 5;
  const hit = sorted.findIndex((v) => v >= threshold);
  const x0 = 150;
  const cw = 46;

  add(
    'linear-search.svg',
    'Linear search for the first value of at least five',
    'The sorted table 1 2 3 4 6 7 8 9 walked from index 0, each element compared against 5, stopping at the 6 at index 4.',
    358,
    [
      caption(x0, 30, 'values after the sort'),
      strip({
        x: x0,
        y: 48,
        cw,
        ch: 32,
        cells: sorted.map((v, i) => ({ v: String(v), hi: i === hit, sub: String(i) })),
      }),
      ...sorted.slice(0, hit).map((_, i) =>
        line('dash', x0 + i * cw + cw / 2, 118, x0 + i * cw + cw / 2, 130)),
      line('sline', x0 + hit * cw + cw / 2, 130, x0 + hit * cw + cw / 2, 118, 'arS'),
      text('cap', x0 + hit * cw + cw / 2, 146, 'HL stops', 'middle'),

      caption(30, 182, 'cp c, then jr nc'),
      ...sorted.slice(0, hit + 1).flatMap((v, i) => {
        const y = 204 + i * 24;
        const found = i === hit;
        return [
          text('t', 30, y, `values[${i}] = ${v}`),
          text('t', 190, y, `${v} ${found ? '≥' : '<'} ${threshold}`),
          text('dim', 280, y, found ? 'carry clear' : 'carry set'),
          text(found ? 'tb' : 'dimn', 400, y, found ? 'jr nc taken, A = 4' : 'inc hl, inc b, keep going'),
        ];
      }),
      text('dimn', 30, 322, 'The table holds no 5. The routine returns the first index at or above the threshold.'),
      text('dimn', 30, 340, '$FF means not found, and is not a valid offset into an eight-element table.'),
    ],
  );
}

/* ============================================================
   Chapter 3 - Strings
   ============================================================ */

// 3.1 The two representations, byte for byte. The characters are the same; what
// differs is where the length lives and what that costs.
{
  const panel = (px, title, cells, ptr, notes) => [
    rect('bxq', px, 44, 326, 232, 4),
    caption(px + 16, 68, title),
    strip({
      x: px + 16,
      y: 96,
      cw: 48,
      ch: 32,
      base: 0,
      addrEvery: 1,
      addrFmt: (a) => `+${a}`,
      cells,
    }),
    line('sline', px + 16 + ptr * 48 + 24, 178, px + 16 + ptr * 48 + 24, 160, 'arS'),
    text('cap', px + 16 + ptr * 48 + 24, 194, 'TEXT', 'middle'),
    ...notes.map((n, i) => text('dimn', px + 16, 220 + i * 18, n)),
  ];

  add(
    'string-representations.svg',
    'Null-terminated against length-prefixed',
    'The same five characters stored two ways: six bytes ending in a zero terminator, and six bytes starting with a count of 5 followed by the text.',
    322,
    [
      ...panel(24, 'null-terminated, the book\'s form',
        [
          { v: '48', sub: 'H' }, { v: '45', sub: 'E' }, { v: '4C', sub: 'L' },
          { v: '4C', sub: 'L' }, { v: '4F', sub: 'O' }, { v: '00', hi: true, sub: 'NUL' },
        ], 0,
        [
          'the zero byte marks the end',
          'length costs a walk to find it',
          'one walk shape for every routine',
        ]),
      ...panel(374, 'length in byte zero',
        [
          { v: '05', hi: true, sub: 'count' }, { v: '48', sub: 'H' }, { v: '45', sub: 'E' },
          { v: '4C', sub: 'L' }, { v: '4C', sub: 'L' }, { v: '4F', sub: 'O' },
        ], 1,
        [
          'byte 0 holds the count',
          'length is one read, no walk',
          'every pointer must skip byte 0',
        ]),
      text('dimn', 24, 306, 'Book 3 uses the null-terminated form: a scan for the length, in exchange for one uniform walk in every routine.'),
    ],
  );
}

// 3.2 Length against capacity, over the companion's message and buffer.
{
  const x0 = 62;
  const cw = 54;
  const bracket = (x1, x2, y, label) => [
    pathEl('rule', `M${x1},${y + 10} V${y} H${x2} V${y + 10}`),
    text('dimn', (x1 + x2) / 2, y - 5, label, 'middle'),
  ];

  add(
    'string-layout.svg',
    'Length against capacity',
    'The six bytes 48 45 4C 4C 4F 00 at $8000 with a length bracket over the five characters, and the eight reserved bytes of buffer at $8006 with a capacity bracket.',
    306,
    [
      caption(x0, 28, 'message'),
      ...bracket(x0, x0 + 5 * cw, 62, 'length = 5, what strlen_u8 counts'),
      strip({
        x: x0,
        y: 90,
        cw,
        ch: 34,
        base: 0x8000,
        addrEvery: 1,
        cells: [
          { v: '48', sub: 'H' }, { v: '45', sub: 'E' }, { v: '4C', sub: 'L' },
          { v: '4C', sub: 'L' }, { v: '4F', sub: 'O' }, { v: '00', hi: true, sub: 'NUL' },
        ],
      }),

      caption(x0, 182, 'buffer'),
      ...bracket(x0, x0 + 8 * cw, 216, 'capacity = 8, what .ds byte[8] reserved'),
      strip({
        x: x0,
        y: 244,
        cw,
        ch: 34,
        base: 0x8006,
        addrEvery: 2,
        cells: Array.from({ length: 8 }, () => ({ v: '' })),
      }),

      text('dimn', 400, 122, 'The terminator is not part of the'),
      text('dimn', 400, 140, 'text. It is the only thing that says'),
      text('dimn', 400, 158, 'where the text ends.'),
    ],
  );
}

// 3.3 strcpy_u8: HL reads, DE writes, and the terminator is copied last.
{
  const x0 = 130;
  const cw = 54;
  const src = ['48', '45', '4C', '4C', '4F', '00'];

  add(
    'two-pointer-copy.svg',
    'strcpy_u8 copying with two pointers',
    'The six bytes of message read through HL and written through DE into buffer, six arrows in step, the terminator copied last.',
    342,
    [
      caption(x0, 30, 'message, read through HL'),
      strip({
        x: x0,
        y: 56,
        cw,
        ch: 32,
        base: 0x8000,
        addrEvery: 5,
        cells: src.map((v, i) => ({ v, hi: i === 5 })),
      }),
      strip({
        x: x0,
        y: 218,
        cw,
        ch: 32,
        cells: src.map((v, i) => ({
          v,
          hi: i === 5,
          sub: i === 0 ? '$8006' : i === 5 ? '$800B' : '',
        })),
      }),
      caption(x0, 292, 'buffer, written through DE'),

      ...src.map((_, i) => {
        const x = x0 + i * cw + cw / 2;
        return line(i === 5 ? 'sline' : 'dash', x, 92, x, 214, i === 5 ? 'arS' : 'arD');
      }),

      text('t', 30, 112, 'ld a, (hl)'),
      text('t', 30, 132, 'ld (de), a'),
      text('t', 30, 152, 'inc hl'),
      text('t', 30, 172, 'inc de'),
      text('t', 30, 192, 'or a'),
      text('dimn', 470, 132, 'or a tests the byte just'),
      text('dimn', 470, 150, 'copied, so the loop exits'),
      text('dimn', 470, 168, 'after the null is written.'),

      text('dimn', 30, 326, 'DE ends one past the null. Reload it from the buffer label before any second pass.'),
    ],
  );
}

// 3.4 strcmp_u8: the two pointers move together rather than one behind the
// other, and the pass that settles the answer is the one on the terminators.
{
  const x0 = 150;
  const cw = 54;
  const bytes = ['48', '45', '4C', '4C', '4F', '00'];

  add(
    'strcmp-walk.svg',
    'strcmp_u8 walking two strings together',
    'buffer walked by HL above and message walked by DE below, the six columns compared in step, the final column holding two zero bytes and returning equal.',
    334,
    [
      text('cap', 30, 76, 'HL'),
      text('dimn', 30, 94, 'buffer'),
      strip({
        x: x0,
        y: 56,
        cw,
        ch: 32,
        cells: bytes.map((v, i) => ({ v, hi: i === 5 })),
      }),

      text('cap', 30, 200, 'DE'),
      text('dimn', 30, 218, 'message'),
      strip({
        x: x0,
        y: 180,
        cw,
        ch: 32,
        cells: bytes.map((v, i) => ({ v, hi: i === 5, sub: i === 5 ? 'both null' : 'equal' })),
      }),

      ...bytes.map((_, i) => {
        const x = x0 + i * cw + cw / 2;
        return line(i === 5 ? 'sline' : 'dash', x, 92, x, 176, i === 5 ? 'arS' : 'arD');
      }),

      text('t', 500, 62, 'ld a, (hl)'),
      text('t', 500, 82, 'push af'),
      text('t', 500, 102, 'ld a, (de)'),
      text('t', 500, 122, 'pop bc'),
      text('t', 500, 142, 'cp b'),
      text('dimn', 500, 172, 'A holds the DE byte,'),
      text('dimn', 500, 190, 'B holds the HL byte,'),
      text('dimn', 500, 208, 'so carry means the HL'),
      text('dimn', 500, 226, 'string is the greater.'),

      text('dimn', 30, 268, 'One column is one pass of the loop. Neither pointer runs ahead of the other.'),
      text('dimn', 30, 300, 'Both strings are HELLO, so every column matches and the walk ends on two zero bytes.'),
      text('dimn', 30, 318, 'strcmp_u8 returns 0, and copy_ok becomes 1.'),
    ],
  );
}

/* ============================================================
   Chapter 4 - Bit Patterns
   ============================================================ */

// 4.1 A byte as eight switches, holding the companion's initial $05.
{
  const start = 0x05;
  add(
    'byte-as-switches.svg',
    'The device status byte as eight named switches',
    'The byte $05 shown as eight bits with bit 0 named READY and bit 2 named BUSY both set, bit 1 named ERROR clear, and bits 3 to 7 unused.',
    268,
    [
      caption(60, 30, `device_flags at $8000, ${hex2(start)} at reset`),
      bitfield({
        x: 60,
        y: 54,
        cw: 74,
        ch: 34,
        bits: bits8(start),
        marks: [5, 7],
        names: ['', '', '', '', '', 'BUSY', 'ERROR', 'READY'],
      }),
      ...[
        ['FLAG_READY .equ $01', 'bit 0', 'set at reset'],
        ['FLAG_ERROR .equ $02', 'bit 1', 'clear at reset'],
        ['FLAG_BUSY  .equ $04', 'bit 2', 'set at reset'],
      ].flatMap(([eq, bit, state], i) => {
        const y = 158 + i * 22;
        return [text('t', 60, y, eq), text('dim', 260, y, bit), text('dimn', 320, y, state)];
      }),
      text('dimn', 60, 250, 'A mask is a value, not an address. The eight switches cost one byte of RAM instead of eight.'),
    ],
  );
}

// 4.2 The chapter's own trace, $05 to $07 to $03, with the byte before and the
// byte after on every panel. Carry is drawn because all three operators clear
// it, which is what makes the rr a in extract_bit_u8 shift in a zero.
{
  const rows = [
    ['or FLAG_ERROR', 0x05, 0x02, 0x05 | 0x02, 'sets bit 1, leaves the rest'],
    ['and $FB', 0x07, 0xfb, 0x07 & 0xfb, 'clears bit 2 where the mask is 0'],
    ['xor FLAG_BUSY', 0x07, 0x04, 0x07 ^ 0x04, 'toggles bit 2, reaching $03 too'],
  ];
  const bx = 250;
  const cw = 30;

  add(
    'mask-operations.svg',
    'and, or and xor against a mask',
    'Three panels, each with the byte before, the mask and the byte after as eight bits, for or with $02, and with $FB, and xor with $04. The changed bit is marked and the carry flag is shown cleared by every one of them.',
    452,
    [
      ...rows.flatMap(([instr, val, mask, res, note], i) => {
        const y = 56 + i * 116;
        const changed = [];
        for (let b = 0; b < 8; b += 1) {
          if (((val >> (7 - b)) & 1) !== ((res >> (7 - b)) & 1)) changed.push(b);
        }
        return [
          text('tb', 30, y + 18, instr),
          text('dimn', 30, y + 38, `${hex2(val)} to ${hex2(res)}`),
          text('dimn', 30, y + 56, note),

          bitfield({ x: bx, y, cw, ch: 24, bits: bits8(val), numbers: i === 0 }),
          text('dim', bx - 12, y + 17, 'before', 'end'),
          bitfield({ x: bx, y: y + 30, cw, ch: 24, bits: bits8(mask), numbers: false }),
          text('dim', bx - 12, y + 47, 'mask', 'end'),
          line('rule', bx, y + 60, bx + 8 * cw, y + 60),
          bitfield({ x: bx, y: y + 66, cw, ch: 24, bits: bits8(res), marks: changed, numbers: false }),
          text('dim', bx - 12, y + 83, 'after', 'end'),

          text('dim', 521, y + 58, 'C', 'middle'),
          rect('bxs', 506, y + 66, 30, 24, 2),
          text('tb', 521, y + 83, '0', 'middle'),
          text('dimn', 552, y + 83, 'carry is cleared'),
        ];
      }),
      text('dimn', 30, 420, 'and keeps only what the mask keeps, or adds what the mask names, xor flips it.'),
      text('dimn', 30, 438, 'None of the three touches a bit the mask leaves alone, and all three land carry on zero.'),
    ],
  );
}

// 4.3 Rotate against rotate through carry. The book conflated these, so the two
// sit side by side with the same input byte, the same carry in, and every path
// the carry takes drawn.
{
  const A0 = 0xb4;
  const C0 = 0;
  const rlcaA = ((A0 << 1) | (A0 >> 7)) & 0xff;
  const rlaA = ((A0 << 1) | C0) & 0xff;
  const outC = (A0 >> 7) & 1;
  const cw = 30;

  const panel = (px, title, sub, afterA, arcs, foot) => {
    const bx = px + 58;              // eight bit cells start here
    const cx = px + 18;              // carry cell sits to the left of bit 7
    const changed = [];
    for (let b = 0; b < 8; b += 1) {
      if (((A0 >> (7 - b)) & 1) !== ((afterA >> (7 - b)) & 1)) changed.push(b);
    }
    return [
      rect('bxq', px, 42, 320, 250, 4),
      text('tb', px + 14, 66, title),
      text('dimn', px + 14, 84, sub),

      text('dim', cx + 15, 104, 'C', 'middle'),
      text('dim', bx + 4 * cw, 104, 'A', 'middle'),
      text('dim', px + 230, 104, `before ${hex2(A0)}`),

      rect('bx', cx, 112, 30, 26, 2),
      text('t', cx + 15, 130, String(C0), 'middle'),
      bitfield({ x: bx, y: 112, cw, ch: 26, bits: bits8(A0), numbers: false }),

      ...arcs(cx, bx),

      rect('bxs', cx, 224, 30, 26, 2),
      text('tb', cx + 15, 242, String(outC), 'middle'),
      bitfield({ x: bx, y: 224, cw, ch: 26, bits: bits8(afterA), marks: changed, numbers: false }),
      text('dim', px + 14, 268, `after  ${hex2(afterA)}`),
      text('dimn', px + 130, 268, foot),
    ];
  };

  const b7 = (bx) => bx + cw / 2;
  const b0 = (bx) => bx + 7 * cw + cw / 2;

  add(
    'rotate-vs-shift.svg',
    'rlca against rla',
    'Two panels using the same byte $B4 and the same clear carry. rlca rotates A circularly and copies the wrapped bit into carry, giving $69. rla rotates A and carry together as a nine-bit ring, giving $68. Bit 0 is the bit that differs.',
    352,
    [
      ...panel(20, 'rlca', 'circular: A alone', rlcaA,
        (cx, bx) => [
          pathEl('sline', `M${b7(bx)},138 C${b7(bx)},204 ${b0(bx)},204 ${b0(bx)},220`, 'arS'),
          pathEl('dash', `M${b7(bx)},138 C${b7(bx)},176 ${cx + 15},176 ${cx + 15},220`, 'arD'),
          text('dimn', cx - 4, 170, 'copy'),
        ],
        'bit 0 = old bit 7'),

      ...panel(380, 'rla', 'nine-bit ring: A and carry', rlaA,
        (cx, bx) => [
          pathEl('sline', `M${b7(bx)},138 C${b7(bx)},176 ${cx + 15},176 ${cx + 15},220`, 'arS'),
          pathEl('sline', `M${cx + 15},138 C${cx + 15},204 ${b0(bx)},204 ${b0(bx)},220`, 'arS'),
        ],
        'bit 0 = old carry'),

      text('dimn', 20, 316, 'Both leave carry holding the old bit 7. The difference is bit 0, which is why rla can carry a bit between registers'),
      text('dimn', 20, 334, 'and rlca cannot. or a clears carry first, so the rr a in extract_bit_u8 shifts a zero into bit 7.'),
    ],
  );
}

/* ============================================================
   Chapter 5 - Records
   ============================================================ */

// 5.1 The ring in four states the companion program actually reaches, then the
// same store as a line. The third state is the one a simpler drawing misses:
// the popped bytes are still in RAM, and count is what says they are no longer
// part of the queue.
{
  const cy = 136;
  const r = 54;
  const slotR = 15;
  const centres = [96, 272, 448, 624];

  const states = [
    { label: 'empty', cells: Array(8).fill(''), head: 0, tail: 0, count: 0, kind: () => 'free' },
    {
      label: 'three pushed',
      cells: ['11', '22', '33', '', '', '', '', ''],
      head: 3, tail: 0, count: 3,
      kind: (i) => (i < 3 ? 'live' : 'free'),
    },
    {
      label: 'three popped',
      cells: ['11', '22', '33', '', '', '', '', ''],
      head: 3, tail: 3, count: 0,
      kind: (i) => (i < 3 ? 'stale' : 'free'),
    },
    {
      label: 'full, wrapped',
      cells: ['99', 'AA', 'BB', '44', '55', '66', '77', '88'],
      head: 3, tail: 3, count: 8,
      kind: () => 'live',
    },
  ];

  const CLS = { live: 'bxs', stale: 'bx', free: 'bxq' };
  const TXT = { live: 'tb', stale: 'dim', free: 'dim' };

  const at = (cx, i, rad) => {
    const th = -Math.PI / 2 + (i * Math.PI) / 4;
    return [cx + rad * Math.cos(th), cy + rad * Math.sin(th)];
  };

  const ring = (cx, s) => {
    const out = [];
    for (let i = 0; i < 8; i += 1) {
      const [x, y] = at(cx, i, r);
      const k = s.kind(i);
      out.push(`  <circle class="${CLS[k]}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${slotR}"/>`);
      if (s.cells[i]) out.push(text(TXT[k], x, y + 4, s.cells[i], 'middle'));
    }
    out.push(text('dim', cx - 26, cy - r - 14, '0', 'middle'));

    const markers = s.head === s.tail ? [[s.head, 'H T']] : [[s.head, 'H'], [s.tail, 'T']];
    markers.forEach(([i, lab]) => {
      const [ax, ay] = at(cx, i, r + 40);
      const [bx, by] = at(cx, i, r + 20);
      out.push(line('sline', ax, ay, bx, by, 'arS'));
      const [tx, ty] = at(cx, i, r + 52);
      out.push(text('cap', tx, ty + 4, lab, 'middle'));
    });
    return out;
  };

  const lx = 120;
  const lcw = 54;
  const wrapped = states[3];

  add(
    'ring-buffer.svg',
    'The ring buffer as a circle and as a line',
    'Eight storage slots drawn as a circle in four states: empty; three bytes pushed with head at slot 3 and tail at slot 0; the same three popped, still present in RAM but stale with count back to 0; and full after eight pushes with head and tail both at slot 3. The same slots are drawn again as a strip with the wrap from slot 7 to slot 0 marked.',
    540,
    [
      ...states.flatMap((s, i) => [
        ...ring(centres[i], s),
        text('cap', centres[i], 250, s.label.toUpperCase(), 'middle'),
        text('dimn', centres[i], 270, `head ${s.head}   tail ${s.tail}   count ${s.count}`, 'middle'),
      ]),
      legend(30, 302, [
        { cls: 'bxs', label: 'live, counted' },
        { cls: 'bx', label: 'stale, popped but still in RAM' },
        { cls: 'bxq', label: 'never written' },
      ]),

      caption(120, 352, 'the same eight bytes as a line'),
      pathEl('sline', `M${lx + 7 * lcw + lcw / 2},382 V368 H${lx + lcw / 2} V382`, 'arS'),
      text('dimn', 420, 364, 'index 7 wraps to index 0'),
      strip({
        x: lx,
        y: 386,
        cw: lcw,
        ch: 30,
        cells: wrapped.cells.map((v, i) => ({ v, hi: true, sub: String(i) })),
      }),
      line('sline', lx + 3 * lcw + lcw / 2, 458, lx + 3 * lcw + lcw / 2, 440, 'arS'),
      text('cap', lx + 3 * lcw + lcw / 2, 474, 'H T', 'middle'),
      text('dimn', 380, 458, 'head and tail meet when the ring is full'),
      text('dimn', 380, 476, 'and when it is empty. count tells them apart.'),

      text('dimn', 30, 510, 'Pop advances tail and decrements count. It never clears the byte, which is why the third ring still shows 11, 22, 33.'),
      text('dimn', 30, 528, 'Indices run clockwise from the slot marked 0.'),
    ],
  );
}

// 5.2 RingState beside the store it controls, with the offset constants.
{
  const x0 = 62;
  const cw = 50;
  const sx = x0 + 8 * cw + 44;

  add(
    'ring-state-layout.svg',
    'RingState laid out in memory',
    'Eight bytes of ring_buf at $8000 followed by the three bytes of ring_state at $8008 holding head, tail and count at offsets 0, 1 and 2.',
    300,
    [
      caption(x0, 30, 'ring_buf, .ds RING_CAP'),
      strip({
        x: x0,
        y: 62,
        cw,
        ch: 32,
        base: 0x8000,
        addrEvery: 7,
        cells: Array.from({ length: 8 }, (_, i) => ({ v: '', sub: String(i) })),
      }),

      caption(sx, 30, 'ring_state, .ds RingState'),
      strip({
        x: sx,
        y: 62,
        cw,
        ch: 32,
        base: 0x8008,
        addrEvery: 1,
        cells: [
          { v: '0', hi: true, sub: 'head' },
          { v: '0', hi: true, sub: 'tail' },
          { v: '0', hi: true, sub: 'count' },
        ],
      }),
      pathEl('rule', `M${sx},134 V146 H${sx + 3 * cw} V134`),
      text('dimn', sx + 1.5 * cw, 162, 'sizeof(RingState) = 3', 'middle'),

      ...[
        ['RING_HEAD   .equ offset(RingState, head)', '= 0', '(ix + 0)'],
        ['RING_TAIL   .equ offset(RingState, tail)', '= 1', '(ix + 1)'],
        ['RING_COUNT  .equ offset(RingState, count)', '= 2', '(ix + 2)'],
      ].flatMap(([eq, val, ix], i) => {
        const y = 208 + i * 22;
        return [text('t', x0, y, eq), text('dim', 400, y, val), text('dim', 452, y, ix)];
      }),
      text('dimn', x0, 288, 'Add a field and every constant that names an offset moves with it. The instructions that use them do not change.'),
    ],
  );
}

/* ============================================================
   Chapter 6 - Recursion
   ============================================================ */

// 6.1 factorial_u8(5) at its deepest point. The slot list is the exact stack the
// listing builds: one return address per call, one saved BC per non-base level.
{
  const sx = 180;
  const sw = 176;
  const sh = 26;
  const y0 = 74;

  const slots = [{ v: 'return to main', wide: true }];
  for (let n = 5; n >= 1; n -= 1) {
    slots.push({ v: `saved BC, n = ${n}`, wide: true });
    slots.push({ v: `return into n = ${n}`, wide: true });
  }
  slots[slots.length - 1].hi = true;

  const unwind = [
    [10, 'base returns A = 1'],
    [9, 'A = 1 × 1 = 1'],
    [7, 'A = 1 × 2 = 2'],
    [5, 'A = 2 × 3 = 6'],
    [3, 'A = 6 × 4 = 24'],
    [1, 'A = 24 × 5 = 120'],
  ];
  const bottom = y0 + slots.length * sh;

  add(
    'factorial-frames.svg',
    'The stack during factorial_u8(5)',
    'Eleven two-byte stack slots from $9FFD downward: the return to main, then a saved BC and a return address for each of n equals 5 down to 1, with SP at the base call and the multiplies listed as each level returns.',
    438,
    [
      caption(sx, 34, 'stack at the deepest call'),
      text('dimn', sx, 54, `SP was ${hex4(0x9fff)} on entry to main`),
      stack({ x: sx, y: y0, slots, w: sw, sh, topAddr: 0x9ffd }),

      line('sline', 104, bottom - sh / 2, sx - 42, bottom - sh / 2, 'arS'),
      text('cap', 76, bottom - sh / 2 + 4, 'SP'),

      ...unwind.map(([i, s]) => text('t', 388, y0 + i * sh + sh / 2 + 4, s)),
      line('sline', 600, bottom - 8, 600, y0 + 12, 'arS'),
      text('cap', 612, (y0 + bottom) / 2, 'UNWIND'),

      text('dimn', 30, bottom + 34, 'Five non-base levels at four bytes each, plus the two-byte return address of the base call, is 22 bytes.'),
      text('dimn', 30, bottom + 52, 'The multiply for level n cannot run until the call below it returns, which is what keeps the frames alive.'),
    ],
  );
}

// 6.2 Depth against time for the two versions of the same computation.
{
  const scale = 24;
  const recursive = (t) => {
    const level = t < 0.5
      ? Math.min(5, Math.floor((t / 0.5) * 6))
      : Math.max(0, 5 - Math.floor(((t - 0.5) / 0.5) * 6));
    return (2 + 4 * level) / scale;
  };
  const iterative = () => 6 / scale;

  add(
    'recursive-vs-iterative.svg',
    'Stack use of the recursive and iterative factorial',
    'Two plots of stack bytes against time for factorial of 5. The recursive version climbs in four-byte steps to 22 bytes and unwinds. The iterative version stays flat at 6 bytes.',
    306,
    [
      caption(60, 34, 'factorial_u8, self-calling'),
      plotBox(60, 54, 270, 150, recursive),
      text('dim', 52, 62, '24', 'end'),
      text('dim', 52, 208, '0', 'end'),
      text('dimn', 60, 232, 'peak 22 bytes at n = 5'),
      text('dimn', 60, 250, 'four more bytes for every extra level'),

      caption(400, 34, 'factorial_iter_u8, one frame'),
      plotBox(400, 54, 270, 150, iterative),
      text('dim', 392, 62, '24', 'end'),
      text('dim', 392, 208, '0', 'end'),
      text('dimn', 400, 232, 'peak 6 bytes for any n'),
      text('dimn', 400, 250, 'the return address plus one push bc'),

      text('dimn', 60, 292, 'Both return $78. The recursive shape matches the definition; the iterative one matches the RAM you have.'),
    ],
  );
}

/* ============================================================
   Chapter 7 - Composition
   ============================================================ */

// 7.1 The two ways to bring AZM source into a program. Book 3 uses the left
// one; the difference that matters is which names the rest of the program sees.
add(
  'include-vs-import.svg',
  'Textual include against a module import',
  'On the left, two source files pasted into one source unit by .include, where strlen_u8 joins the shared namespace and _loop and _done stay local to their owner. On the right, a module whose @ prefixed label crosses the wall while its private helper does not.',
  346,
  [
    rect('bxq', 20, 44, 330, 250, 4),
    caption(36, 70, '.include "lib/strings.asm"'),
    rect('bx', 36, 86, 140, 56, 3),
    text('ts', 106, 108, '07_include_demo.asm', 'middle'),
    text('dimn', 106, 128, 'main, data', 'middle'),
    rect('bx', 190, 86, 140, 56, 3),
    text('ts', 260, 108, 'lib/strings.asm', 'middle'),
    text('dimn', 260, 128, 'strlen_u8', 'middle'),
    pathEl('rule', 'M106,142 V158 H260 V142'),
    line('none', 183, 158, 183, 176, 'ar'),
    rect('bx', 36, 176, 294, 74, 4),
    text('nb', 183, 200, 'one source unit', 'middle'),
    text('ts', 183, 222, 'strlen_u8 shared', 'middle'),
    text('dim', 183, 240, '_loop, _done stay local', 'middle'),
    text('dimn', 36, 276, 'the text lands at the .include line'),

    rect('bxq', 370, 44, 330, 250, 4),
    caption(386, 70, '.import "strings"'),
    rect('bx', 386, 96, 170, 150, 4),
    text('nb', 471, 120, 'module', 'middle'),
    rect('bxs', 400, 136, 142, 30, 2),
    text('tb', 471, 156, '@strlen_u8', 'middle'),
    rect('bxq', 400, 190, 142, 30, 2),
    text('dim', 471, 210, 'helper', 'middle'),
    line('sline', 542, 151, 578, 151, 'arS'),
    text('dimn', 584, 155, 'exported'),
    line('dash', 542, 205, 566, 205),
    text('dimn', 584, 209, 'private'),
    text('dimn', 386, 276, 'only @ names cross the wall'),

    text('dimn', 20, 326, 'Book 3 uses .include. Both put bytes in one address space; they differ in which names the rest of the program can see.'),
  ],
);

// 7.2 The .asmi boundary. The point is that nothing crosses it in either
// direction except a contract: no source in, no bytes out.
add(
  'asmi-boundary.svg',
  'What an .asmi interface carries across the boundary',
  'Your source with a call site and an .equ address binding, an interface file holding contract records only, and the monitor ROM that already exists in the machine, with a dashed boundary between them.',
  356,
  [
    caption(30, 32, 'your source, assembled by azm'),
    caption(470, 32, 'code already in the machine'),
    line('dash', 440, 46, 440, 300),

    rect('bx', 30, 54, 250, 84, 4),
    text('tb', 46, 78, 'main.asm'),
    text('ts', 46, 102, 'call MON_PRINT_CHAR'),
    text('ts', 46, 122, 'MON_PRINT_CHAR .equ $0010'),

    rect('bxq', 30, 166, 250, 114, 4),
    text('tb', 46, 190, 'monitor.asmi'),
    text('ts', 46, 214, 'extern MON_PRINT_CHAR'),
    text('ts', 46, 234, 'in A'),
    text('ts', 46, 254, 'clobbers A'),
    text('ts', 46, 274, 'end'),

    rect('bx', 310, 176, 110, 90, 4),
    text('nb', 365, 202, 'azm', 'middle'),
    text('ts', 365, 226, 'checks calls', 'middle'),
    text('dim', 365, 248, 'no bytes', 'middle'),
    pathEl('none', 'M280,96 C300,96 296,196 310,196', 'ar'),
    pathEl('none', 'M280,222 H310', 'ar'),

    rect('bxq', 470, 64, 220, 116, 4),
    text('nb', 580, 90, 'monitor ROM', 'middle'),
    text('ts', 486, 118, '$0010  MON_PRINT_CHAR'),
    text('ts', 486, 138, '$0018  MON_GET_KEY'),
    text('dimn', 486, 164, 'not in your output'),
    pathEl('dash', 'M290,148 H466', 'arD'),
    text('dimn', 308, 142, 'the .equ binds the address'),

    text('dimn', 30, 332, 'The interface carries contracts, not addresses. Neither file emits a byte, and the ROM is there either way.'),
  ],
);

/* ============================================================
   Chapter 8 - Pointer Structures
   ============================================================ */

const NODE_W = 112;
const NODE_H = 44;
const VAL_W = 42;

function listNode(x, y, addr, value, link, opts = {}) {
  const out = [
    rect(opts.dim ? 'bxq' : 'bx', x, y, VAL_W, NODE_H, 2),
    rect(opts.linkHi ? 'bxs' : opts.dim ? 'bxq' : 'bx', x + VAL_W, y, NODE_W - VAL_W, NODE_H, 2),
    text(opts.dim ? 'dim' : 't', x + VAL_W / 2, y + NODE_H / 2 + 4.5, value, 'middle'),
    text(opts.dim ? 'dim' : opts.linkHi ? 'tb' : 't', x + VAL_W + (NODE_W - VAL_W) / 2, y + NODE_H / 2 + 4.5, link, 'middle'),
  ];
  if (addr) out.push(text('dim', x, y - 8, addr));
  if (opts.fields) {
    out.push(text('dimn', x + VAL_W / 2, y + NODE_H + 15, 'value', 'middle'));
    out.push(text('dimn', x + VAL_W + (NODE_W - VAL_W) / 2, y + NODE_H + 15, 'next', 'middle'));
  }
  return out;
}

// 8.1 The static three-node chain at the addresses the companion assembles to.
// Every link field prints the address it holds, because the point is that next
// is a number and not an arrow.
{
  const y = 156;
  const xs = [90, 300, 510];

  add(
    'linked-list.svg',
    'A three-node list with the head as a separate word',
    'list_head at $800C holding $8000, pointing at node_a at $8000, whose next word holds $8003 for node_b, whose next word holds $8006 for node_c, whose next word holds zero.',
    294,
    [
      caption(90, 34, 'list_head is a word of storage, not a node'),
      rect('bxs', 90, 56, NODE_W, 40, 3),
      text('tb', 90 + NODE_W / 2, 81, '$8000', 'middle'),
      text('dim', 90, 48, '$800C'),
      text('dimn', 90 + NODE_W + 14, 81, 'one .dw holding the address of the first node'),
      line('sline', 90 + NODE_W / 2, 96, 90 + NODE_W / 2, y, 'arS'),

      ...listNode(xs[0], y, '$8000', '$10', '$8003', { fields: true }),
      ...listNode(xs[1], y, '$8003', '$22', '$8006', { fields: true }),
      ...listNode(xs[2], y, '$8006', '$30', '$0000', { fields: true }),

      line('none', xs[0] + NODE_W, y + NODE_H / 2, xs[1], y + NODE_H / 2, 'ar'),
      line('none', xs[1] + NODE_W, y + NODE_H / 2, xs[2], y + NODE_H / 2, 'ar'),
      text('cap', xs[2] + NODE_W + 12, y + NODE_H / 2 + 4, 'NULL'),

      text('dimn', 90, 250, 'Each next field holds a number. The arrow is drawn because that number is the address above the next box.'),
      text('dimn', 90, 274, 'sizeof(ListNode) is 3. ld a, h / or l is the null test, because no Z80 instruction compares a pair to zero.'),
    ],
  );
}

// 8.2 Insert at head. Only two stores change the shape of the list, so only
// those two are marked.
{
  const slot = [150, 272, 394, 516, 638];
  const NW = 98;
  const VW = 36;
  const cell = (x, y, value, link, opts = {}) => [
    rect(opts.dim ? 'bxq' : 'bx', x, y, VW, 40, 2),
    rect(opts.linkHi ? 'bxs' : opts.dim ? 'bxq' : 'bx', x + VW, y, NW - VW, 40, 2),
    text(opts.dim ? 'dim' : opts.valueHi ? 'tb' : 't', x + VW / 2, y + 26, value, 'middle'),
    text(opts.dim ? 'dim' : opts.linkHi ? 'tb' : 't', x + VW + (NW - VW) / 2, y + 26, link, 'middle'),
  ];
  const arrow = (a, b, y) => line('none', a + NW, y + 20, b, y + 20, 'ar');

  const block = (y, state) => {
    const after = state === 'after';
    const out = [
      text('cap', 30, y - 20, after ? 'AFTER' : 'BEFORE'),
      rect(after ? 'bxs' : 'bx', 30, y, 100, 40, 3),
      text(after ? 'tb' : 't', 80, y + 26, after ? '$8009' : '$8000', 'middle'),
      text('dim', 30, y - 8, 'list_head'),
      text('dim', slot[0], y - 8, '$8009 node_spare'),
      text('dim', slot[1], y - 8, '$8000'),
      text('dim', slot[2], y - 8, '$8003'),
      text('dim', slot[3], y - 8, '$8006'),
      ...cell(slot[1], y, '$10', '$8003'),
      ...cell(slot[2], y, '$22', '$8006'),
      ...cell(slot[3], y, '$30', '$0000'),
      text('cap', slot[4], y + 26, 'NULL'),
      arrow(slot[1], slot[2], y),
      arrow(slot[2], slot[3], y),
      line('none', slot[3] + NW, y + 20, slot[4] - 12, y + 20, 'ar'),
    ];
    if (after) {
      out.push(...cell(slot[0], y, '$40', '$8000', { linkHi: true, valueHi: true }));
      out.push(line('sline', 130, y + 20, slot[0], y + 20, 'arS'));
      out.push(arrow(slot[0], slot[1], y));
    } else {
      out.push(...cell(slot[0], y, '..', '....', { dim: true }));
      out.push(pathEl('none', `M130,${y + 20} H142 V${y - 34} H${slot[1] + NW / 2} V${y}`, 'ar'));
      out.push(text('dimn', slot[0], y + 58, 'reserved, not yet linked'));
    }
    return out;
  };

  add(
    'insert-at-head.svg',
    'Insert at head, before and after',
    'The list before the insert, with node_spare reserved and unlinked, and after list_push_head, where the spare node holds $40, its next word holds $8000 and list_head holds $8009.',
    380,
    [
      ...block(88, 'before'),
      ...block(252, 'after'),
      text('dimn', 30, 330, "Two stores change the shape: the new node's next word takes the old head, then list_head takes the new node."),
      text('dimn', 30, 348, 'The payload store is a third, and no existing node is touched. The sum goes from $0062 to $00A2.'),
    ],
  );
}

// 8.3 BST insert. HL never holds a node; it holds the address of a link word,
// which is what lets one pair of stores attach a node anywhere in the tree.
{
  const ny = 100;
  const nh = 40;
  const vw = 44;
  const lw = 76;

  const treeNode = (x, base, value, left, right, leftHi) => [
    text('dim', x, ny - 10, hex4(base)),
    text('dim', x + vw, ny - 10, hex4(base + 1)),
    text('dim', x + vw + lw, ny - 10, hex4(base + 3)),
    rect('bx', x, ny, vw, nh, 2),
    rect(leftHi ? 'bxs' : 'bx', x + vw, ny, lw, nh, 2),
    rect('bx', x + vw + lw, ny, lw, nh, 2),
    text('t', x + vw / 2, ny + 26, value, 'middle'),
    text(leftHi ? 'tb' : 't', x + vw + lw / 2, ny + 26, left, 'middle'),
    text('t', x + vw + lw + lw / 2, ny + 26, right, 'middle'),
    text('dimn', x + vw / 2, ny + nh + 16, 'value', 'middle'),
    text('dimn', x + vw + lw / 2, ny + nh + 16, 'left', 'middle'),
    text('dimn', x + vw + lw + lw / 2, ny + nh + 16, 'right', 'middle'),
  ];

  add(
    'bst-insert.svg',
    'bst_insert_u8 writes through the address of a link',
    'A root word at $8000 holding $8003, the node for key 5 at $8003 with its left and right words, and a new node for key 3 at $8008. HL moves from the address of the root word to the address of the left word, and the new node address is stored there.',
    336,
    [
      caption(60, 34, 'inserting key 3 into a tree whose root holds key 5'),

      text('dim', 60, ny - 10, hex4(0x8000)),
      rect('bx', 60, ny, 96, nh, 3),
      text('t', 108, ny + 26, '$8003', 'middle'),
      text('dimn', 60, ny + nh + 16, 'root word'),

      ...treeNode(220, 0x8003, '05', '$8008', '$0000', true),
      ...treeNode(480, 0x8008, '03', '$0000', '$0000', false),

      line('sline', 108, 200, 108, 176, 'arS'),
      text('cap', 108, 216, 'HL STEP 1', 'middle'),
      line('sline', 302, 200, 302, 176, 'arS'),
      text('cap', 302, 216, 'HL STEP 2', 'middle'),

      pathEl('sline', 'M578,92 V60 H320 V96', 'arS'),
      text('t', 340, 54, 'ld (hl), e / inc hl / ld (hl), d'),

      text('dimn', 60, 250, 'Step 1: the word at $8000 is not zero, so HL follows it to the node holding key 5.'),
      text('dimn', 60, 268, 'Step 2: key 3 is below 5, so HL becomes the address of that node\'s left word, and that word is zero.'),
      text('dimn', 60, 298, 'HL holds the address of a link, never the address of a node. That is what lets the same two stores attach a node at'),
      text('dimn', 60, 316, 'the root or eight levels down.'),
    ],
  );
}

/* ============================================================
   Chapter 9 - Capstone
   ============================================================ */

// 9.1 One queen and the three indices it marks.
{
  const qr = 2;
  const qc = 4;
  const cell = 34;
  const bx = 70;
  const by = 66;

  const boardCells = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const queen = r === qr && c === qc;
      const attacked = !queen && (r === qr || c === qc || r + c === qr + qc || r - c === qr - qc);
      boardCells.push(rect(queen ? 'bxs' : attacked ? 'bx2' : 'bx', bx + c * cell, by + r * cell, cell, cell, 0));
      if (queen) boardCells.push(text('tb', bx + c * cell + cell / 2, by + r * cell + cell / 2 + 5, 'Q', 'middle'));
    }
  }

  const arrayRow = (y, label, len, mark, note) => [
    caption(70, y - 10, label),
    text('dimn', 300, y - 8, note),
    strip({
      x: 70,
      y,
      cw: 40,
      ch: 26,
      cells: Array.from({ length: len }, (_, i) => ({
        v: i === mark ? '1' : '0',
        hi: i === mark,
        sub: String(i),
      })),
    }),
  ];

  add(
    'queens-board.svg',
    'One queen and the three flags it sets',
    'An 8 by 8 board with a queen on row 2, column 4, its row, column and both diagonals shaded, and the three constraint arrays below with col_used index 4, diag_sum_used index 6 and diag_diff_used index 5 set.',
    646,
    [
      caption(70, 34, 'row 2, column 4'),
      ...Array.from({ length: 8 }, (_, c) => text('dim', bx + c * cell + cell / 2, by - 8, String(c), 'middle')),
      ...Array.from({ length: 8 }, (_, r) => text('dim', bx - 10, by + r * cell + cell / 2 + 4, String(r), 'end')),
      ...boardCells,

      caption(392, 90, 'what one placement costs'),
      ...[
        ['col_used[4]', 'column 4 is taken'],
        ['diag_sum_used[6]', 'row + col = 6'],
        ['diag_diff_used[5]', 'row − col + 7 = 5'],
      ].flatMap(([expr, why], i) => {
        const y = 122 + i * 40;
        return [text('t', 392, y, expr), text('dimn', 392, y + 18, why)];
      }),
      legend(392, 268, [
        { cls: 'bxs', label: 'queen' },
        { cls: 'bx2', label: 'attacked' },
      ]),
      text('dimn', 392, 306, 'DIAG_BIAS is 7 so the backward'),
      text('dimn', 392, 324, 'index is never negative.'),

      ...arrayRow(408, 'col_used, 8 bytes', 8, 4, 'one byte per column'),
      ...arrayRow(486, 'diag_sum_used, 15 bytes', 15, 6, 'indexed by row + col'),
      ...arrayRow(564, 'diag_diff_used, 15 bytes', 15, 5, 'indexed by row − col + DIAG_BIAS'),

      text('dimn', 70, 632, 'A test is one ld a, (hl) and one or a. unmark_constraints writes those three bytes back to zero on the way out.'),
    ],
  );
}

// 9.2 Mark, recurse, unmark: the shape the whole capstone turns on. The
// recursive call sits between the two writes, and the three constraint bytes
// are drawn at all three moments so the undo is visible rather than asserted.
{
  const fx = 60;
  const fw = 240;
  const cx = fx + fw / 2;
  const snapX = [430, 520, 610];
  const snapW = 80;

  const snapshot = (y, values, hi) =>
    snapX.flatMap((x, i) => [
      rect(hi ? 'bxs' : 'bx', x, y, snapW, 28, 2),
      text(hi ? 'tb' : 't', x + snapW / 2, y + 19, values[i], 'middle'),
    ]);

  add(
    'mark-recurse-unmark.svg',
    'Mark, recurse, unmark',
    'The column loop of place_row: three constraint tests, then mark_constraints setting col_used, diag_sum_used and diag_diff_used, then inc b and the recursive call, then unmark_constraints clearing the same three bytes, then the next column.',
    534,
    [
      caption(fx, 34, 'one turn of the column loop, row 2, column 4'),

      node({ x: fx, y: 50, w: fw, h: 40, label: 'try column c', kind: 'term' }),
      node({ x: 30, y: 112, w: 300, h: 88, label: ['col_free, diag_sum_free,', 'diag_diff_free all zero?'], kind: 'test' }),
      node({ x: fx, y: 214, w: fw, h: 44, label: 'call mark_constraints' }),
      node({ x: fx, y: 282, w: fw, h: 44, label: 'inc b, call place_row', hi: true }),
      node({ x: fx, y: 350, w: fw, h: 44, label: 'call unmark_constraints' }),
      node({ x: fx, y: 418, w: fw, h: 40, label: 'inc c', kind: 'term' }),

      line('none', cx, 90, cx, 112, 'ar'),
      line('none', cx, 200, cx, 214, 'ar'),
      line('none', cx, 258, cx, 282, 'ar'),
      line('none', cx, 326, cx, 350, 'ar'),
      line('none', cx, 394, cx, 418, 'ar'),
      text('dim', cx + 8, 210, 'yes'),
      pathEl('none', 'M330,156 H356 V438 H300', 'ar'),
      text('dim', 336, 148, 'no'),
      pathEl('none', `M${fx},438 H24 V70 H${fx}`, 'ar'),
      text('dimn', 100, 486, 'the next column, with the flags exactly as they were'),

      caption(430, 190, 'the three constraint bytes'),
      text('dim', 470, 210, 'col[4]', 'middle'),
      text('dim', 560, 210, 'sum[6]', 'middle'),
      text('dim', 650, 210, 'diff[5]', 'middle'),
      ...snapshot(222, ['0', '0', '0'], false),
      text('dimn', 430, 270, 'before the mark'),
      ...snapshot(290, ['1', '1', '1'], true),
      text('dimn', 430, 338, 'while row 3 searches'),
      ...snapshot(358, ['0', '0', '0'], false),
      text('dimn', 430, 406, 'after the unmark'),

      text('dimn', 30, 512, 'Every byte written on the way down is cleared on the way back,'),
      text('dimn', 30, 530, 'so an abandoned branch leaves nothing for the next column to trip over.'),
    ],
  );
}

// 9.3 Backtracking. The trace is the real one: columns 0, 2, 4, 1, 3 leaves
// row 5 with nothing legal, so the search unmarks and resumes row 4 at c = 4.
{
  const nx = 170;
  const nw = 32;
  const pitch = 38;
  const nh = 26;
  const bands = [
    { row: 0, tried: [0], ok: 0, why: 'first column of the first row' },
    { row: 1, tried: [0, 1, 2], ok: 2, why: 'c 0 column, c 1 diagonal' },
    { row: 2, tried: [0, 1, 2, 3, 4], ok: 4, why: 'c 0, c 2 column; c 1, c 3 diagonal' },
    { row: 3, tried: [0, 1], ok: 1, why: 'c 0 column' },
    { row: 4, tried: [0, 1, 2, 3], ok: 3, why: 'c 0 to c 2 column' },
    { row: 5, tried: [0, 1, 2, 3, 4, 5, 6, 7], ok: -1, why: 'every column blocked' },
  ];
  const y0 = 60;
  const bandGap = 62;
  const yOf = (i) => y0 + i * bandGap;

  const parts = [caption(30, 32, 'columns tried, row by row')];
  bands.forEach((b, i) => {
    const y = yOf(i);
    parts.push(text('ts', 30, y + 18, `row ${b.row}`));
    b.tried.forEach((c) => {
      const x = nx + c * pitch;
      const acc = c === b.ok;
      parts.push(rect(acc ? 'bxs' : 'bxq', x, y, nw, nh, 2));
      parts.push(text(acc ? 'tb' : 'dim', x + nw / 2, y + 18, String(c), 'middle'));
    });
    parts.push(text(b.ok < 0 ? 'tb' : 'dimn', 520, y + 18, b.why));

    if (b.ok >= 0 && i + 1 < bands.length) {
      const px = nx + b.ok * pitch + nw / 2;
      const next = bands[i + 1];
      const braceY = yOf(i + 1) - 14;
      const first = nx + next.tried[0] * pitch + nw / 2;
      const last = nx + next.tried[next.tried.length - 1] * pitch + nw / 2;
      parts.push(pathEl('rule', `M${px},${y + nh} V${braceY} M${Math.min(first, px)},${braceY} H${Math.max(last, px)}`));
      next.tried.forEach((c) => {
        const cxn = nx + c * pitch + nw / 2;
        parts.push(line('rule', cxn, braceY, cxn, yOf(i + 1)));
      });
    }
  });

  const deadY = yOf(5);
  parts.push(
    pathEl('sline', `M${nx + 7 * pitch + nw},${deadY + nh / 2} H496 V${yOf(4) + nh / 2} H${nx + 4 * pitch}`, 'arS'),
    text('cap', 520, deadY + 44, 'UNMARK AND BACK UP'),
    text('dimn', 520, deadY + 62, 'row 4 releases c 3, resumes at c 4'),
    text('dimn', 30, 452, 'Without the unmark, flags from an abandoned branch stay set, and every later row sees free squares as taken.'),
    text('dimn', 30, 470, 'The count would come out below 92.'),
  );

  add(
    'backtracking-tree.svg',
    'Backtracking out of a dead end',
    'Six rows of the search. Rows 0 to 4 accept columns 0, 2, 4, 1 and 3, then row 5 finds every column blocked, so the search unmarks the row 4 placement and resumes its column loop at 4.',
    484,
    parts,
  );
}

/* ---------- write ---------- */

mkdirSync(OUT, { recursive: true });
for (const [name, body] of Object.entries(figures)) {
  writeFileSync(path.join(OUT, name), body);
}
console.log(`${Object.keys(figures).length} figures → ${OUT}`);
