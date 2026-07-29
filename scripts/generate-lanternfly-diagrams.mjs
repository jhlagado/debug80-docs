/**
 * Generates the figures for Lanternfly Book 1.
 *
 * These figures follow the same transparent-plate system as the AZM and
 * Glimmer books. Each one draws values stated in the chapter: array extents,
 * byte strides, record offsets and reference targets.
 *
 * Usage: node scripts/generate-lanternfly-diagrams.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  svg, rect, text, line, caption, strip, box,
} from './lib/figure.mjs';

const OUT = 'assets/images/lanternfly-book/book1';
const BOOK = 'lanternfly';
const figures = {};

const add = (name, title, desc, height, parts) => {
  figures[name] = svg({
    title,
    desc,
    height,
    book: BOOK,
    body: parts.filter(Boolean).join('\n'),
  });
};

/* ============================================================
   Chapter 6 - Fixed Arrays
   ============================================================ */

{
  const cw = 54;
  const x = 90;
  const selected = new Set([6, 7]);

  add(
    'array-stride.svg',
    'A five-entry word array laid out as ten bytes',
    'Ten contiguous byte cells grouped into five two-byte scores. Entry three is highlighted at byte offsets six and seven, showing that its address is the array base plus three times the two-byte element size.',
    190,
    [
      caption(40, 28, 'scores as u16[5]'),
      strip({
        x,
        y: 62,
        cw,
        ch: 34,
        base: 0x8000,
        addrEvery: 2,
        cells: Array.from({ length: 10 }, (_, i) => ({ hi: selected.has(i) })),
      }),
      ...Array.from({ length: 5 }, (_, i) =>
        text('dimn', x + (i * 2 + 1) * cw, 119, `scores[${i}]`, 'middle')),
      text('t', 90, 160, 'scores[3] → base + 3 × 2 → byte offset 6'),
    ],
  );
}

{
  const rows = 3;
  const columns = 4;
  const cw = 90;
  const ch = 42;
  const x = 180;
  const y = 72;

  add(
    'row-major-array.svg',
    'A three-by-four array stored in row-major order',
    'A grid with three rows and four columns. The cells are numbered from zero to eleven across each row. Row one, column two is highlighted as element six.',
    276,
    [
      caption(24, 28, 'tiles as u8[3, 4]'),
      ...Array.from({ length: columns }, (_, column) =>
        text('dim', x + column * cw + cw / 2, 58, `column ${column}`, 'middle')),
      ...Array.from({ length: rows }, (_, row) =>
        text('dim', x - 16, y + row * ch + ch / 2 + 4, `row ${row}`, 'end')),
      ...Array.from({ length: rows * columns }, (_, element) => {
        const row = Math.floor(element / columns);
        const column = element % columns;
        const selected = row === 1 && column === 2;
        const cx = x + column * cw;
        const cy = y + row * ch;
        return [
          rect(selected ? 'bxs' : 'bx', cx, cy, cw, ch, 2),
          text(selected ? 'tb' : 't', cx + cw / 2, cy + 18, `${row},${column}`, 'middle'),
          text('dim', cx + cw / 2, cy + 34, `element ${element}`, 'middle'),
        ].join('\n');
      }),
      text('t', 180, 226, 'row 1, column 2 → 1 × 4 + 2 → element 6'),
      text('dimn', 180, 254, 'The rightmost index changes between adjacent bytes.'),
    ],
  );
}

/* ============================================================
   Chapter 7 - Records and Exact Layout
   ============================================================ */

{
  const fields = ['x', 'y', 'direction', 'state', 'timer', 'frame'];

  add(
    'monster-layout.svg',
    'The exact six-byte layout of a Monster record',
    'Six byte cells in declaration order at addresses 9000 through 9005. The timer field is highlighted at offset four.',
    202,
    [
      caption(40, 28, 'Monster, declaration order'),
      strip({
        x: 60,
        y: 62,
        cw: 100,
        ch: 34,
        base: 0x9000,
        cells: fields.map((field, offset) => ({
          v: String(offset),
          sub: field,
          hi: field === 'timer',
        })),
      }),
      text('t', 60, 158, 'size(type Monster) = 6'),
      text('t', 360, 158, 'offset(Monster.timer) = 4'),
      text('dimn', 60, 184, 'Each field begins at the offset printed inside its byte.'),
    ],
  );
}

{
  const recordX = (index) => 30 + index * 170;
  const fieldNames = ['x', 'y', 'd', 's', 't', 'f'];
  const cellWidth = 25;

  add(
    'record-array-stride.svg',
    'Four six-byte Monster records stored as one array',
    'Four groups of six byte cells begin at offsets zero, six, twelve and eighteen. The timer field in monsters two is highlighted at total byte offset sixteen.',
    204,
    [
      caption(30, 26, 'monsters as Monster[4]'),
      ...Array.from({ length: 4 }, (_, record) => [
        text('dimn', recordX(record) + 75, 50, `monsters[${record}]`, 'middle'),
        ...fieldNames.map((field, fieldOffset) => {
          const selected = record === 2 && field === 't';
          const x = recordX(record) + fieldOffset * cellWidth;
          return [
            rect(selected ? 'bxs' : 'bx', x, 64, cellWidth, 34, 1),
            text(selected ? 'tb' : 't', x + cellWidth / 2, 85, field, 'middle'),
          ].join('\n');
        }),
        text('dim', recordX(record) + 75, 120, `base + ${record * 6}`, 'middle'),
      ].join('\n')),
      text('t', 30, 160, 'monsters[2].timer → 2 × 6 + 4 → byte offset 16'),
      text('dimn', 30, 188, 'x  y  d(irection)  s(tate)  t(imer)  f(rame)'),
    ],
  );
}

/* ============================================================
   Chapter 8 - References and Addresses
   ============================================================ */

{
  const rows = [
    ['boardPlanes[0]', 'boardRed : u8[8]'],
    ['boardPlanes[1]', 'boardGreen : u8[8]'],
    ['boardPlanes[2]', 'boardBlue : u8[8]'],
  ];

  add(
    'array-of-references.svg',
    'An array of references pointing to three separate arrays',
    'Three reference slots on the left point to three independently allocated eight-byte board arrays on the right. Selecting a reference does not move or combine the arrays.',
    300,
    [
      caption(40, 30, 'reference array'),
      caption(450, 30, 'separate storage'),
      ...rows.flatMap(([reference, target], index) => {
        const y = 56 + index * 70;
        return [
          box({ x: 40, y, w: 190, h: 42, title: reference, cls: index === 1 ? 'bxs' : 'bx' }),
          line(index === 1 ? 'sline' : 'none', 230, y + 21, 450, y + 21, index === 1 ? 'arS' : 'ar'),
          box({ x: 450, y, w: 230, h: 42, title: target, cls: index === 1 ? 'bxs' : 'bx' }),
        ];
      }),
      text('t', 40, 276, 'value(boardPlanes[1]) selects all eight bytes of boardGreen'),
    ],
  );
}

{
  add(
    'banked-references.svg',
    'Near and far references on one possible banked Z80 target',
    'The near reference carries a sixteen-bit offset and uses the current bank context. The far reference carries a bank identifier with the offset and reaches a Monster in bank seven.',
    306,
    [
      caption(40, 30, 'near ref Monster'),
      rect('bxq', 40, 48, 300, 210, 4),
      box({ x: 82, y: 78, w: 216, h: 48, title: 'offset $8120', cls: 'bxs', titleCls: 'tb' }),
      line('sline', 190, 126, 190, 164, 'arS'),
      box({ x: 82, y: 164, w: 216, h: 54, title: 'Monster', lines: ['in the current bank'] }),

      caption(380, 30, 'far ref Monster'),
      rect('bxq', 380, 48, 300, 210, 4),
      box({ x: 410, y: 78, w: 84, h: 48, title: 'bank 7', cls: 'bxs', titleCls: 'tb' }),
      box({ x: 504, y: 78, w: 146, h: 48, title: 'offset $8120', cls: 'bxs', titleCls: 'tb' }),
      line('sline', 530, 126, 530, 164, 'arS'),
      box({ x: 422, y: 164, w: 216, h: 54, title: 'Monster', lines: ['in bank 7'] }),

      text('dimn', 40, 290, 'A target profile chooses the physical representation of both reference classes.'),
    ],
  );
}

mkdirSync(OUT, { recursive: true });
for (const [name, body] of Object.entries(figures)) {
  writeFileSync(path.join(OUT, name), body);
}

console.log(`${Object.keys(figures).length} figures -> ${OUT}`);
