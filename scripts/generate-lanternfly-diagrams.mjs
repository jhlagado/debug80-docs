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
   Chapter 6 - Tables with Fixed Arrays
   ============================================================ */

{
  const cw = 54;
  const x = 90;
  const selected = new Set([6, 7]);

  add(
    'array-stride.svg',
    'A five-entry word array laid out as ten bytes',
    'Ten contiguous byte cells grouped into five two-byte readings. Entry three is highlighted at byte offsets six and seven, showing that its address is the array base plus three times the two-byte element size.',
    190,
    [
      caption(40, 28, 'readings as u16[5]'),
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
        text('dimn', x + (i * 2 + 1) * cw, 119, `readings[${i}]`, 'middle')),
      text('t', 90, 160, 'readings[3] → base + 3 × 2 → byte offset 6'),
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
      caption(24, 28, 'table as u8[3, 4]'),
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
   Chapter 7 - Records and Memory Layout
   ============================================================ */

{
  const fields = ['year low', 'year high', 'month', 'day'];

  add(
    'date-layout.svg',
    'The exact four-byte Z80 layout of a Date record',
    'Four byte cells in declaration order at addresses 9000 through 9003. The two-byte year uses Z80 little-endian order and the month field is highlighted at offset two.',
    202,
    [
      caption(40, 28, 'Date, declaration order'),
      strip({
        x: 60,
        y: 62,
        cw: 140,
        ch: 34,
        base: 0x9000,
        cells: fields.map((field, offset) => ({
          v: String(offset),
          sub: field,
          hi: field === 'month',
        })),
      }),
      text('t', 60, 158, 'size(type Date) = 4'),
      text('t', 360, 158, 'offset(Date.month) = 2'),
      text('dimn', 60, 184, 'Each field begins at the offset printed inside its byte.'),
    ],
  );
}

{
  const recordX = (index) => 30 + index * 170;
  const fieldNames = ['vL', 'vH', 'u', 'q'];
  const cellWidth = 36;

  add(
    'record-array-stride.svg',
    'Four four-byte Reading records stored as one array on Z80',
    'Four groups of four byte cells begin at offsets zero, four, eight and twelve. The signed value uses Z80 little-endian byte order. The quality field in reading two is highlighted at total byte offset eleven.',
    204,
    [
      caption(30, 26, 'readings as Reading[4]'),
      ...Array.from({ length: 4 }, (_, record) => [
        text('dimn', recordX(record) + 72, 50, `readings[${record}]`, 'middle'),
        ...fieldNames.map((field, fieldOffset) => {
          const selected = record === 2 && field === 'q';
          const x = recordX(record) + fieldOffset * cellWidth;
          return [
            rect(selected ? 'bxs' : 'bx', x, 64, cellWidth, 34, 1),
            text(selected ? 'tb' : 't', x + cellWidth / 2, 85, field, 'middle'),
          ].join('\n');
        }),
        text('dim', recordX(record) + 72, 120, `base + ${record * 4}`, 'middle'),
      ].join('\n')),
      text('t', 30, 160, 'readings[2].quality → 2 × 4 + 3 → byte offset 11'),
      text('dimn', 30, 188, 'vL  vH = i16 value bytes    u = unit    q = quality'),
    ],
  );
}

mkdirSync(OUT, { recursive: true });
for (const [name, body] of Object.entries(figures)) {
  writeFileSync(path.join(OUT, name), body);
}

console.log(`${Object.keys(figures).length} figures -> ${OUT}`);
