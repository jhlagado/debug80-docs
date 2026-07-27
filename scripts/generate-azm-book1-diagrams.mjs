/**
 * Generates the figures for AZM Book 1, the Assembler Manual.
 *
 * Book 1 is a reference, not a course, so these figures are reference figures.
 * Each one answers the question its paragraph raises and stops there: what a
 * qualified local label is called, what a carrier spelling expands to, which
 * byte a string directive adds. The values drawn are the values the chapters
 * state, down to the field offsets and the hex in the listing row.
 *
 * Nothing here redraws a figure Book 2 already has. Where Book 1 needs the
 * artifact fan-out, the contract boundary or a liveness violation, the chapter
 * embeds the Book 2 file directly with alt text written for this book.
 *
 * Usage: node scripts/generate-azm-book1-diagrams.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  svg, rect, text, line, path as pathEl, elbow, caption, box, node, legend, strip,
} from './lib/figure.mjs';

const OUT = 'assets/images/azm-book/book1';
const BOOK = 'azm';
const figures = {};

const add = (name, title, desc, height, parts) => {
  figures[name] = svg({ title, desc, height, book: BOOK, body: parts.filter(Boolean).join('\n') });
};

/**
 * SVG collapses a run of spaces to one, which erases the column alignment that
 * makes assembly source and a listing row readable. A non-breaking space
 * survives, and in a monospace face it advances exactly like a space, so the
 * character count the geometry lint estimates from is unchanged.
 */
const src = (s) => s.replace(/ /g, ' ');

/* ============================================================
   Chapter 2: Source Syntax and Symbols
   ============================================================ */

// 2.1 A source line dissected. Drawn as four abutting fields rather than one
// string with brackets beneath it, so each field has room for its own name
// and its own rule without the annotations fighting over one strip of page.
{
  const fields = [
    [46, 120, 'Start:', 'label', ['optional; names', 'this address'], true],
    [166, 100, 'ld', 'mnemonic', ['case-insensitive'], false],
    [266, 120, 'a,0', 'operands', ['commas separate', 'operand lists'], false],
    [386, 270, '; inline comment', 'comment', ['a semicolon starts it, and it', 'runs to the end of the line'], false],
  ];
  add(
    'source-line.svg',
    'The four fields of a source line',
    'One assembly line divided into its label, its mnemonic, its operands and its comment, with each field named underneath.',
    212,
    [
      caption(46, 26, 'One source line'),
      ...fields.flatMap(([x, w, token, name, notes, hi]) => [
        rect(hi ? 'bxs' : 'bx', x, 46, w, 38, 2),
        text(hi ? 'tb' : 't', x + w / 2, 70, token, 'middle'),
        text('nb', x + w / 2, 108, name, 'middle'),
        ...notes.map((l, i) => text('dimn', x + w / 2, 128 + i * 18, l, 'middle')),
      ]),
      text('dimn', 46, 176, 'Any of the four may be absent. A line can hold a label alone, an instruction alone, or a comment alone.'),
      text('dimn', 46, 194, 'A label on its own line is the usual form for a routine; on the same line, the usual form for a constant.'),
    ],
  );
}

// 2.2 Label scope. The reader's question is not "what is a local label" but
// "what happens when two routines both spell it _loop", so the answer, the
// two qualified identities, gets its own row at the bottom in the signal
// colour. Both routines are the chapter's own.
{
  const panel = (x, owner, lines) => [
    rect('bxq', x, 44, 314, 152, 4),
    rect('bxs', x + 26, 58, 200, 26, 2),
    text('tb', x + 38, 76, owner),
    text('dimn', x + 240, 76, 'owner'),
    ...lines.map((l, i) => text('t', x + 38, 110 + i * 22, l)),
    text('dimn', x + 240, 110, 'local'),
  ];
  add(
    'label-scope.svg',
    'Owner-local label scope',
    'Two routines, ShiftRow and CopyRow, each declaring a label spelled _loop, with the two qualified identities ShiftRow._loop and CopyRow._loop shown below them as separate symbols.',
    306,
    [
      caption(30, 30, 'One source unit'),
      ...panel(30, 'ShiftRow:', ['_loop:', src('        djnz    _loop'), src('        ret')]),
      ...panel(376, 'CopyRow:', ['_loop:', src('        djnz    _loop'), src('        ret')]),

      line('sline', 187, 196, 187, 220, 'arS'),
      line('sline', 533, 196, 533, 220, 'arS'),
      rect('bxs', 60, 222, 254, 30, 3),
      text('tb', 187, 242, 'ShiftRow._loop', 'middle'),
      rect('bxs', 406, 222, 254, 30, 3),
      text('tb', 533, 242, 'CopyRow._loop', 'middle'),

      text('dimn', 30, 272, 'The same _loop spelling under a different owner is a different symbol.'),
      text('dimn', 30, 290, 'The leading underscore belongs to owner-local labels alone; every other name starts with a letter.'),
    ],
  );
}

/* ============================================================
   Chapter 3: Addresses, Constants and Expressions
   ============================================================ */

// 3.1 The placement cursor on one ruler. The lower half is the case that
// costs a debugging session: a backward .org is ignored, so the label lands
// at the next free address rather than the one the source asked for. Those
// addresses are from the assembler run that established the behaviour.
{
  const seg = (x, w, cls, label, labelCls) => [
    rect(cls, x, 64, w, 34, 2),
    label ? text(labelCls, x + w / 2, 86, label, 'middle') : '',
  ];
  add(
    'address-ruler.svg',
    'The assembly address as a cursor',
    'An address ruler showing .org placing a section, emitted bytes advancing the cursor, .align inserting padding, a gap with nothing assembled, and a second .org further on. Below it, a backward .org at $0012 is ignored and the label lands at $0014.',
    396,
    [
      caption(46, 26, 'Assembly address'),
      text('t', 46, 50, '.org $0100'),
      text('t', 198, 50, '.align 16', 'middle'),
      text('t', 536, 50, '.org $8000'),

      ...seg(46, 130, 'bxs', 'code', 'tb'),
      ...seg(176, 44, 'bx2', '', 'dim'),
      ...seg(220, 126, 'bxs', 'table', 'tb'),
      ...seg(346, 190, 'bxq', 'no bytes assembled', 'dim'),
      ...seg(536, 150, 'bxs', 'Result', 'tb'),

      text('dim', 46, 114, '$0100'),
      text('dim', 536, 114, '$8000'),

      // The cursor. $ is the reader's handle on it, so the figure names it $.
      line('sline', 346, 122, 346, 100, 'arS'),
      text('tb', 346, 138, '$', 'middle'),
      text('dimn', 358, 138, 'the assembly address after the table'),

      legend(46, 172, [
        { cls: 'bxs', label: 'assembled bytes' },
        { cls: 'bx2', label: '.align padding' },
        { cls: 'bxq', label: 'no bytes assembled' },
      ]),

      caption(46, 212, 'Going backwards'),
      ...[
        '        .org $0010',
        'A:      .db $AA, $AA, $AA, $AA',
        '        .org $0012',
        'B:      .db $BB',
      ].map((l, i) => text('ts', 46, 234 + i * 18, src(l))),

      strip({
        x: 300,
        y: 246,
        cw: 56,
        ch: 32,
        base: 0x0010,
        cells: [
          { v: 'AA', sub: 'A' },
          { v: 'AA' },
          { v: 'AA' },
          { v: 'AA' },
          { v: 'BB', hi: true, sub: 'B' },
        ],
      }),

      text('dimn', 46, 326, 'The second .org asks for $0012, which is behind the cursor, so AZM ignores it and the cursor stays at $0014.'),
      text('dimn', 46, 344, 'B is defined at $0014. The earlier bytes stand, the build stays silent, and no line of source names that address.'),
      text('dimn', 46, 376, '.org, emitted bytes and .align padding all move the cursor forward. Forward is the only direction it travels.'),
    ],
  );
}

// 3.2 What the two output formats do with a gap. Same columns top to bottom,
// so the difference between the formats is a difference in one band.
add(
  'org-and-gaps.svg',
  'A gap in the flat binary and in the Intel HEX',
  'An address line with code at $0100 and Result at $8000. Below it the flat binary writes the gap as zero fill, and the Intel HEX emits no records for it at all.',
  320,
  [
    caption(46, 26, 'Assembly address'),
    text('t', 46, 50, '.org $0100'),
    text('t', 536, 50, '.org $8000'),

    rect('bxs', 46, 60, 150, 34, 2),
    text('tb', 121, 82, 'code', 'middle'),
    rect('bxq', 196, 60, 340, 34, 2),
    text('dim', 366, 82, 'no bytes assembled', 'middle'),
    rect('bxs', 536, 60, 150, 34, 2),
    text('tb', 611, 82, 'Result', 'middle'),
    text('dim', 46, 110, '$0100'),
    text('dim', 536, 110, '$8000'),

    // One contiguous file, with the fill shaded.
    caption(46, 146, 'Flat binary'),
    rect('bx', 46, 156, 640, 30, 2),
    rect('bx2', 196, 156, 340, 30, 2),
    text('dim', 121, 176, 'bytes', 'middle'),
    text('dim', 366, 176, 'zero fill', 'middle'),
    text('dim', 611, 176, 'bytes', 'middle'),

    // Two record runs, and nothing in between.
    caption(46, 216, 'Intel HEX'),
    rect('bx', 46, 226, 150, 30, 2),
    text('dim', 121, 246, 'records', 'middle'),
    rect('bx', 536, 226, 150, 30, 2),
    text('dim', 611, 246, 'records', 'middle'),
    text('dimn', 366, 246, 'no records here', 'middle'),

    text('dimn', 46, 284, 'Zero bytes in the binary, no records at all in the HEX. .binfrom and .binto trim the binary to the range you meant.'),
    text('dimn', 46, 302, '.align padding is assembled: those zero bytes are real, so they appear in both.'),
  ],
);

/* ============================================================
   Chapter 4: Raw Data, Storage and Strings
   ============================================================ */

// 4.1 Every raw-data directive against one payload. Running "Hello" through
// all three string directives is what makes the comparison work: those rows
// differ by exactly the byte that carries the termination policy, and that
// byte is the one in the signal colour.
{
  const hello = ['48', '65', '6C', '6C'].map((v) => ({ v }));
  const row = (y, decl, cells, note) => [
    text('t', 46, y + 20, decl),
    strip({ x: 260, y, cw: 48, ch: 30, cells }),
    text('dimn', 560, y + 20, note),
  ];
  add(
    'data-directives.svg',
    'What each data directive emits',
    'Byte strips for .db, .dw, the three string directives and .ds. The string rows all carry Hello, so they differ only in the byte that marks the end: a NUL after the text, a length byte before it, or bit 7 set on the last character.',
    448,
    [
      caption(46, 26, 'Numbers'),
      ...row(36, '.db $48,$65,$6C,$6C,$6F', [...hello, { v: '6F' }], 'five bytes'),
      ...row(80, '.dw $1234', [{ v: '34' }, { v: '12' }], 'low byte first'),

      caption(46, 142, 'Strings'),
      ...row(152, '.cstr "Hello"', [...hello, { v: '6F' }, { v: '00', hi: true }], 'NUL after the text'),
      ...row(196, '.pstr "Hello"', [{ v: '05', hi: true }, ...hello, { v: '6F' }], 'length byte before it'),
      ...row(240, '.istr "Hello"', [...hello, { v: 'EF', hi: true }], 'bit 7 set on the last'),

      caption(46, 302, 'Reserved'),
      ...row(312, '.ds 4', [{}, {}, {}, {}], 'nothing written'),
      ...row(356, '.ds 4,0', [{ v: '00' }, { v: '00' }, { v: '00' }, { v: '00' }], 'fill byte written'),

      text('dimn', 46, 410, 'The three string directives differ only in which byte marks the end.'),
      text('dimn', 46, 428, 'An unfilled .ds advances the address alone. A fill byte makes the block real in the flat binary.'),
    ],
  );
}

/* ============================================================
   Chapter 5: The Layout System
   ============================================================ */

// 5.1 The reference layout figure: a flat record, the same record nested
// inside another, and the same record as an array element. Every number
// drawn is one the chapter derives, so the figure is checkable line by line
// against the text beside it.
{
  const y1 = 64;
  const cw1 = 76;
  const flat = ['x', 'y', 'tile', 'flags'].flatMap((name, i) => {
    const cx = 46 + i * cw1;
    return [
      text('dim', cx + cw1 / 2, y1 - 8, String(i), 'middle'),
      rect(i === 3 ? 'bxs' : 'bx', cx, y1, cw1, 32, 2),
      text(i === 3 ? 'tb' : 't', cx + cw1 / 2, y1 + 21, name, 'middle'),
    ];
  });

  const y2 = 210;
  const nested = [
    // pos is a Sprite, so its four bytes are drawn as the fields they are.
    ...['x', 'y', 'tile', 'flags'].flatMap((name, i) => [
      rect('bxq', 46 + i * 60, y2, 60, 32, 2),
      text('ts', 46 + i * 60 + 30, y2 + 20, name, 'middle'),
    ]),
    rect('bxs', 286, y2, 60, 32, 2),
    text('tb', 316, y2 + 21, 'state', 'middle'),
    rect('bx', 346, y2, 120, 32, 2),
    // Two byte cells, ticked rather than divided, so the label stays legible.
    line('rule', 406, y2, 406, y2 + 7),
    line('rule', 406, y2 + 25, 406, y2 + 32),
    text('t', 406, y2 + 21, 'timer', 'middle'),
    ...[76, 136, 196, 256, 316, 376, 436].map((cx, i) =>
      text('dim', cx, y2 + 48, String(i), 'middle')),
  ];

  const y3 = 328;
  const cw3 = 42;
  const array = [0, 1, 2].flatMap((e) => {
    const ex = 46 + e * 168;
    return [
      text('ts', ex + 84, y3 - 8, `[${e}]`, 'middle'),
      ...['x', 'y', 'tile', 'flags'].flatMap((name, i) => {
        const hi = e === 2 && i === 3;
        return [
          rect(hi ? 'bxs' : 'bx', ex + i * cw3, y3, cw3, 30, 2),
          text('ts', ex + i * cw3 + cw3 / 2, y3 + 19, name, 'middle'),
        ];
      }),
    ];
  });

  add(
    'record-layout.svg',
    'Record layout, nesting and arrays',
    'A four-byte Sprite record with its field offsets, the same record nested inside an Actor with state at offset 4 and timer at 5, and an array of Sprite where element 2 has its flags field at offset 11.',
    452,
    [
      caption(46, 40, 'Record'),
      ...flat,
      pathEl('rule', 'M46,104 V112 H350 V104'),
      text('ts', 198, 128, 'sizeof(Sprite) = 4', 'middle'),
      text('ts', 300, 128, 'offset(Sprite, flags) = 3'),
      ...[
        'Sprite  .type',
        'x       .field byte',
        'y       .field byte',
        'tile    .field byte',
        'flags   .field byte',
        '        .endtype',
      ].map((l, i) => text('ts', 540, 62 + i * 16, src(l))),

      caption(46, 178, 'Nested record'),
      pathEl('rule', 'M46,204 V198 H286 V204'),
      text('ts', 166, 194, 'pos  .field Sprite', 'middle'),
      ...nested,
      text('ts', 486, 216, 'offset(Actor, pos.y) = 1'),
      text('ts', 486, 234, 'offset(Actor, state) = 4'),
      text('ts', 486, 252, 'sizeof(Actor) = 7'),

      caption(46, 296, 'Array of records'),
      ...array,
      rect('bxq', 550, y3, 90, 30, 2),
      text('dim', 595, y3 + 19, 'to [15]', 'middle'),
      pathEl('rule', 'M46,364 V372 H214 V364'),
      text('ts', 130, 390, 'stride = sizeof(Sprite) = 4', 'middle'),
      line('sline', 529, 378, 529, 360, 'arS'),
      text('t', 529, 390, 'offset(Sprite[16], [2].flags) = 11', 'middle'),

      text('dimn', 46, 430, 'Every constant here comes from the field list. Insert a field and sizeof, offset and every cast path follow it.'),
    ],
  );
}

// 5.2 Casts as alternate spellings. The top band is the whole idea: three
// ways to write one address, converging on one byte. The lower bands are the
// two things that go wrong, the parentheses and a non-constant index.
add(
  'cast-paths.svg',
  'A cast path is another name for an address',
  'Three spellings that all resolve to the flags byte of element 3 of Sprites, converging on one byte, then the difference parentheses make and the rule that an index must be a constant.',
  394,
  [
    caption(46, 30, 'Three names for one address'),
    text('t', 46, 60, 'Sprites + (3 * sizeof(Sprite)) + offset(Sprite, flags)'),
    text('t', 46, 88, '<Sprite[16]>Sprites[3].flags'),
    text('t', 46, 116, 'Sprites + 15'),

    pathEl('rule', 'M482,50 H490 V122 H482'),
    line('sline', 490, 86, 530, 86, 'arS'),
    text('dim', 594, 56, 'Sprites + 15', 'middle'),
    rect('bxs', 534, 66, 120, 36, 3),
    text('tb', 594, 90, 'flags', 'middle'),
    text('dimn', 534, 122, 'element 3, field flags'),

    caption(46, 166, 'Address, or the byte at it'),
    text('t', 46, 194, src('ld   hl,<Sprite[16]>Sprites[3].flags')),
    text('dimn', 400, 194, 'HL gets the address'),
    text('t', 46, 220, src('ld   a,(<Sprite[16]>Sprites[3].flags)')),
    text('dimn', 400, 220, 'A gets the byte stored there'),

    caption(46, 264, 'Nested and aliased paths'),
    text('t', 46, 292, '<Actor>Player.pos.x'),
    text('dimn', 250, 292, 'is Player + offset(Actor, pos.x)'),
    text('t', 46, 318, '<SpriteArray>Sprites[3].flags'),
    text('dimn', 340, 318, 'a .typealias adds no path level'),

    text('dimn', 46, 356, 'A cast names the layout AZM applies while it computes the offset, entirely at assembly time.'),
    text('dimn', 46, 374, 'Indices inside a cast path must be assembler-time constants, so <Sprite[16]>Sprites[HL].flags is an error.'),
  ],
);

// 5.3 A union. The record figure above cannot show this one: every member
// starts at the same offset, so the interesting fact is the overlap rather
// than the running sum, and drawing it as a strip would say the opposite.
add(
  'union-overlay.svg',
  'A union is one set of bytes with two readings',
  'The PortValue union with status and full both starting at offset 0, drawn as a one-byte view and a two-byte view over the same pair of bytes.',
  248,
  [
    ...[
      'PortValue .union',
      'status    .field byte',
      'full      .field word',
      '          .endunion',
    ].map((l, i) => text('ts', 46, 44 + i * 20, src(l))),

    caption(330, 32, 'The bytes'),
    strip({ x: 330, y: 44, cw: 90, ch: 34, cells: [{ v: 'lo' }, { v: 'hi' }] }),

    rect('bxs', 330, 100, 90, 26, 2),
    text('tb', 375, 118, 'status', 'middle'),
    rect('bxs', 330, 136, 180, 26, 2),
    text('tb', 420, 154, 'full', 'middle'),

    text('dim', 528, 118, 'offset 0, 1 byte'),
    text('dim', 528, 154, 'offset 0, 2 bytes'),
    text('dim', 330, 190, 'sizeof(PortValue) = 2, the largest member'),

    text('dimn', 46, 220, 'Every member starts at offset 0, so the size is the largest member rather than the sum. Reading status'),
    text('dimn', 46, 238, 'reads the low byte of whatever word is stored there.'),
  ],
);

/* ============================================================
   Chapter 6: Register Contracts
   ============================================================ */

// 6.1 Carrier expansion. F sits under the flag half of AF on purpose: the
// figure should make it obvious that F is AF without the accumulator.
{
  const cw = 82;
  const carrier = (y, name) => [
    rect('bxs', 46, y, 76, 32, 3),
    text('tb', 84, y + 21, name, 'middle'),
  ];
  const cell = (x, y, label) => [
    rect('bx', x, y, cw, 32, 2),
    text('ts', x + cw / 2, y + 20, label, 'middle'),
  ];
  const flags = ['carry', 'zero', 'sign', 'parity', 'halfCarry'];
  add(
    'carrier-expansion.svg',
    'Carrier expansion in a register contract',
    'BC expands to B and C. AF expands to A plus the five flags carry, zero, sign, parity and halfCarry. F expands to the same five flags without A.',
    300,
    [
      caption(46, 46, 'Carrier'),
      caption(170, 46, 'Expands to'),

      ...carrier(66, 'BC'),
      line('none', 122, 82, 166, 82, 'ar'),
      ...cell(170, 66, 'B'),
      ...cell(252, 66, 'C'),

      ...carrier(134, 'AF'),
      line('none', 122, 150, 166, 150, 'ar'),
      ...cell(170, 134, 'A'),
      ...flags.flatMap((f, i) => cell(252 + i * cw, 134, f)),

      ...carrier(202, 'F'),
      line('none', 122, 218, 248, 218, 'ar'),
      ...flags.flatMap((f, i) => cell(252 + i * cw, 202, f)),

      text('dimn', 46, 258, 'DE, HL, IX, IY and SP expand the same way: D,E and H,L and IXH,IXL and IYH,IYL and SPH,SPL.'),
      text('dimn', 46, 280, 'Use carry for the carry flag. C names register C.'),
    ],
  );
}

// 6.2 The analysis, then the ladder. The pipeline is the same work in every
// mode; the staircase is what a finding costs. Keeping them in one figure is
// the point, because the mode is the part readers reach for first.
{
  const bw = 146;
  const px = [30, 202, 374, 546];
  const steps = [
    ['off', 'no analysis'],
    ['audit', 'no build failure'],
    ['warn', 'warns, still builds'],
    ['error', 'fails on proven'],
    ['strict', 'fails on unproven'],
  ];
  const yb = 300;
  add(
    'contract-analysis.svg',
    'The register contract pipeline and the mode ladder',
    'A four-stage pipeline from the .routine boundary through inference and call-site checking to findings, above a staircase of the five --rc modes off, audit, warn, error and strict.',
    400,
    [
      caption(30, 34, 'Analysis'),
      box({ x: px[0], y: 48, w: bw, h: 80, title: '.routine', titleCls: 'tb', lines: ['names the boundary', 'and the contract'] }),
      box({ x: px[1], y: 48, w: bw, h: 80, title: 'inference', lines: ['in, may-write and', 'maybe-out'] }),
      box({ x: px[2], y: 48, w: bw, h: 80, title: 'call sites', lines: ['live after the call', 'meets may-modify'] }),
      box({ x: px[3], y: 48, w: bw, h: 80, title: 'findings', lines: ['reported, or fatal,', 'by mode'] }),
      ...px.slice(0, 3).map((x) => line('none', x + bw, 88, x + bw + 26, 88, 'ar')),

      caption(30, 170, 'Mode ladder'),
      ...steps.flatMap(([name, note], i) => {
        const h = 32 + i * 16;
        const x = 30 + i * 128;
        return [
          rect(i === 0 ? 'bxq' : 'bx', x, yb - h, 128, h, 3),
          text('t', x + 64, yb - h / 2 + 4, name, 'middle'),
          text('dimn', x + 64, 320, note, 'middle'),
        ];
      }),

      text('dim', 30, 348, 'azm --rc audit program.asm'),
      text('dimn', 540, 348, 'off is the default'),

      text('dimn', 30, 380, 'The mode decides whether a finding warns, fails the build, or stays unreported.'),
    ],
  );
}

// 6.3 Two returning paths, one contract. A contract is not a property of the
// last ret in the body, and the cheapest way to say so is to draw the same
// routine twice with one pop moved.
{
  const branch = (px, broken) => {
    const shared = [
      rect('bxq', px, 64, 324, 268, 4),
      node({ x: px + 102, y: 80, w: 120, h: 38, label: 'push bc' }),
      line('none', px + 162, 118, px + 162, 138, 'ar'),
      node({ x: px + 77, y: 138, w: 170, h: 56, label: 'jr z,_fail', kind: 'test' }),
      text('dim', px + 16, 196, 'not z'),
      text('dim', px + 270, 186, 'z'),
      text('dim', px + 272, 208, '_fail:'),

      // The fallthrough path, correct in both panels.
      elbow('none', px + 77, 166, px + 62, 216),
      node({ x: px + 12, y: 216, w: 100, h: 38, label: 'pop bc' }),
      line('none', px + 62, 254, px + 62, 274, 'ar'),
      node({ x: px + 22, y: 274, w: 80, h: 36, label: 'ret' }),
      text('dimn', px + 62, 328, 'BC restored', 'middle'),
    ];
    if (broken) {
      return [
        ...shared,
        elbow('none', px + 247, 166, px + 262, 274),
        node({ x: px + 222, y: 274, w: 80, h: 36, label: 'ret', hi: true }),
        text('dimn', px + 262, 328, 'BC not restored', 'middle'),
      ];
    }
    return [
      ...shared,
      elbow('none', px + 247, 166, px + 262, 216),
      node({ x: px + 212, y: 216, w: 100, h: 38, label: 'pop bc' }),
      line('none', px + 262, 254, px + 262, 274, 'ar'),
      node({ x: px + 222, y: 274, w: 80, h: 36, label: 'ret' }),
      text('dimn', px + 262, 328, 'BC restored', 'middle'),
    ];
  };
  add(
    'return-paths.svg',
    'Every returning path meets the same contract',
    'The same routine drawn twice under a preserves BC contract. On the left both the fallthrough and the _fail path pop BC before ret. On the right the _fail path returns without popping, so that path breaks the contract.',
    400,
    [
      text('t', 24, 28, '.routine preserves BC'),
      caption(24, 52, 'Both paths restore BC'),
      caption(372, 52, 'One path does not'),
      ...branch(24, false),
      ...branch(372, true),
      text('dimn', 24, 362, 'Every returning path is checked against the same contract, so each one needs its own pop.'),
      text('dimn', 24, 380, 'Keep the push and its pop inside one .routine region. A shared exit owned by another routine is rejected first.'),
    ],
  );
}

/* ============================================================
   Chapter 7: Ops, Aliases and Source Composition
   ============================================================ */

// 7.1 Three mechanisms, one question each: what lands in the output. The
// bottom strip of each panel answers it, and the third answers "nothing".
{
  const pw = 220;
  const px = [20, 254, 488];
  const panel = (x, head, code, prose, out, outCls) => [
    rect('bxq', x, 26, pw, 200, 4),
    text('tb', x + 14, 52, head),
    text('ts', x + 14, 76, code),
    ...prose.map((l, i) => text('dimn', x + 14, 100 + i * 18, l)),
    caption(x + 14, 168, 'In the output'),
    rect(outCls, x + 14, 178, 192, 34, 3),
    text('ts', x + 110, 199, out, 'middle'),
  ];
  add(
    'bringing-in-code.svg',
    'Three ways to bring in code',
    'Three panels. .include pastes a file text into the current source unit, .import places a module whose @ declarations are visible and whose plain labels are private, and an .asmi interface file supplies register contracts and emits no bytes.',
    272,
    [
      ...panel(px[0], '.include', '.include "hardware.asm"', [
        'Its text is inserted at that',
        'point. One source unit, so',
        'non-local names stay unique.',
      ], 'bytes from that file', 'bxs'),

      ...panel(px[1], '.import', '.import "math.asm"', [
        'Loaded as a module, emitted',
        'at that point. @DoubleA is',
        'visible; ClampA is private.',
      ], 'bytes at the import point', 'bxs'),

      ...panel(px[2], '.asmi', '--interface mon3.asmi', [
        'extern contract records for',
        'code assembled elsewhere, so',
        'calls to it can be checked.',
      ], 'nothing', 'bxq'),

      text('dimn', 20, 254, 'Two of the three add bytes. An .asmi file adds contracts alone, enough for the analyzer to check a call whose body lives elsewhere.'),
    ],
  );
}

// 7.2 The size trade between an op and a subroutine. The two totals are
// computed rather than asserted, because the honest answer for a body this
// short is that inlining wins, and a figure that implied otherwise would be
// arguing with the arithmetic beside it.
{
  const body = 4;      // add a,a four times
  const sites = 3;
  const inline = body * sites;
  const asCall = body + 1 + 3 * sites;   // body, ret, and three 3-byte calls
  const bar = (x, y, bytes, label, hi) => [
    rect(hi ? 'bxs' : 'bx', x, y, bytes * 16, 30, 2),
    text(hi ? 'tb' : 't', x + bytes * 8, y + 20, `${bytes} bytes`, 'middle'),
    text('dimn', x, y - 8, label),
  ];
  add(
    'inline-versus-call.svg',
    'What an op costs against what a call costs',
    'A four-byte body at three call sites comes to twelve bytes inlined; the same body as a subroutine comes to fourteen, being the body, a ret and three three-byte calls.',
    280,
    [
      text('ts', 46, 40, src('op shift_left_4()   ; add a,a  add a,a  add a,a  add a,a')),
      text('dim', 46, 60, `body = ${body} bytes, used at ${sites} call sites`),

      ...bar(46, 104, inline, 'Inlined at every site', true),
      ...bar(46, 176, asCall, 'As a subroutine, called three times', false),
      text('dim', 46 + asCall * 16 + 16, 196, `${body} body + 1 ret + ${sites} × 3 call`),

      text('dimn', 46, 240, 'A call costs three bytes at every site plus a ret, so a body this short is cheaper repeated than shared.'),
      text('dimn', 46, 258, 'At three sites the crossover is a body of five bytes; above that the subroutine is smaller.'),
    ],
  );
}

// 7.3 The import boundary, drawn as a wall with one door: the arrow that
// crosses is the only declaration marked with @. This lives with .import
// rather than with the label syntax in Chapter 2, because @ means nothing
// until there is a boundary for it to cross. The names are the ones in that
// section's math.asm, so the figure and the code beside it agree.
add(
  'export-boundary.svg',
  'The @ export boundary',
  'An imported source unit holding three declarations. Only the one marked @DoubleA reaches the importing unit; a plain non-local label and an owner-local label stop at the boundary.',
  272,
  [
    caption(40, 30, 'Imported source unit'),
    rect('bxq', 40, 44, 300, 152, 4),

    rect('bxs', 56, 58, 268, 32, 2),
    text('tb', 70, 80, '@DoubleA:'),
    text('dimn', 190, 80, 'crosses the wall'),

    rect('bx', 56, 100, 268, 32, 2),
    text('t', 70, 122, 'ClampA:'),
    text('dimn', 190, 122, 'private here'),

    rect('bxq', 56, 142, 268, 32, 2),
    text('t', 70, 164, '_clamp:'),
    text('dimn', 190, 164, 'owned by ClampA'),

    line('sline', 340, 74, 452, 74, 'arS'),
    line('dash', 340, 116, 392, 116),
    line('dash', 340, 158, 392, 158),
    text('dimn', 348, 141, 'stops here'),

    caption(452, 30, 'Importing unit'),
    rect('bx', 452, 58, 248, 90, 4),
    text('t', 468, 84, src('call    DoubleA')),
    text('dimn', 468, 110, 'the symbol name is DoubleA,'),
    text('dimn', 468, 128, 'not @DoubleA'),

    text('dimn', 40, 230, 'The @ marks the declaration. The symbol is DoubleA, and that is what call sites write.'),
    text('dimn', 40, 248, '@ exports labels, equates, enums, layout types, type aliases and ops.'),
  ],
);

/* ============================================================
   Chapter 8: Diagnostics, Listings and Output
   ============================================================ */

// 8.1 A diagnostic line dissected. The ID carries the signal colour because
// the surrounding paragraph exists to say that the ID is the part to script
// against and the message text is not.
{
  const fields = [
    [46, 120, 'program.asm', 'file', 'as AZM saw it', false],
    [166, 50, '23', 'line', '', false],
    [216, 46, '1', 'col', '', false],
    [262, 80, 'error', 'severity', 'error or warning', false],
    [342, 116, '[AZMN_SYMBOL]', 'id', 'the stable part', true],
    [458, 228, 'duplicate symbol: COUNT', 'message', 'may change between releases', false],
  ];
  add(
    'diagnostic-line.svg',
    'The fields of a diagnostic line',
    'One AZM diagnostic split into file, line, column, severity, diagnostic ID and message, with the ID marked as the part that stays stable across releases.',
    202,
    [
      caption(46, 26, 'One diagnostic line'),
      ...fields.flatMap(([x, w, token, name, note, hi]) => [
        rect(hi ? 'bxs' : 'bx', x, 48, w, 38, 2),
        text(hi ? 'tb' : 't', x + w / 2, 72, token, 'middle'),
        text('nb', x + w / 2, 108, name, 'middle'),
        note ? text('dimn', x + w / 2, 128, note, 'middle') : '',
      ]),
      text('dimn', 46, 164, 'The diagnostic ID is the stable part of the line.'),
      text('dimn', 46, 182, 'If you script against AZM output, match on the code: it is the stable part.'),
    ],
  );
}

// 8.2 A listing row, dissected. The three column bands are the anatomy; the
// second block is the one case where a row does not fit the anatomy.
{
  const bands = (y, h, byteCls) => [
    rect('bxq', 46, y, 70, h, 3),
    rect(byteCls, 124, y, 252, h, 3),
    rect('bxq', 384, y, 290, h, 3),
  ];
  add(
    'listing-line.svg',
    'Anatomy of a listing row',
    'A .lst row split into three columns: a four-digit address, the emitted bytes and the source line. Rows that emit nothing leave the gutter empty, and a line emitting more than eight bytes continues on a second address-and-bytes row.',
    356,
    [
      caption(46, 26, 'Anatomy of a listing row'),
      caption(46, 48, 'Address'),
      caption(124, 48, 'Emitted bytes'),
      caption(384, 48, 'Source line'),
      ...bands(58, 100, 'bxq'),
      text('t', 58, 84, '8000'),
      text('t', 136, 84, '06 03'),
      text('t', 396, 84, src('ld   b,COUNT        ; loop counter')),
      text('t', 396, 114, 'loop:'),
      text('t', 58, 144, '800E'),
      text('t', 396, 144, src('.ds  4')),

      text('dimn', 46, 178, 'Blank lines, comments, .equ definitions and labels on their own line print an empty gutter.'),
      text('dimn', 46, 196, 'An unfilled .ds reservation prints its address and no bytes.'),

      caption(46, 232, 'More than eight bytes'),
      ...bands(242, 70, 'bxs'),
      text('t', 58, 268, '8008'),
      text('tb', 136, 268, '48 45 4C 4C 4F 20 57 4F'),
      text('t', 396, 268, src('.db  "HELLO WORLD",0')),
      text('t', 58, 298, '8010'),
      text('tb', 136, 298, '52 4C 44 00'),
      text('dimn', 396, 298, 'source column left blank'),

      text('dimn', 46, 336, 'After the last source line comes a symbol table: every label and constant with its value, sorted by name.'),
    ],
  );
}

/* ---------- write ---------- */

mkdirSync(OUT, { recursive: true });
for (const [name, body] of Object.entries(figures)) {
  writeFileSync(path.join(OUT, name), body);
}
console.log(`${Object.keys(figures).length} figures → ${OUT}`);
