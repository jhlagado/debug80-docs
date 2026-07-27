/**
 * Generates the figures for AZM Book 2, Z80 Fundamentals.
 *
 * Book 2 teaches the machine from nothing, so almost every core concept was
 * carried by prose alone: the register file, the flags byte, the stack growing
 * downward. Those are all pictures of data whose values the prose states, which
 * is exactly what a generator draws better than a person, and keeps correct
 * when the prose changes.
 *
 * Usage: node scripts/generate-azm-book2-diagrams.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  svg, rect, text, line, path as pathEl, circle, elbow, caption,
  strip, bitfield, box, stack, node, legend, W,
} from './lib/figure.mjs';

const OUT = 'assets/images/azm-book/book2';
const BOOK = 'azm';
const figures = {};

const add = (name, title, desc, height, parts) => {
  figures[name] = svg({ title, desc, height, book: BOOK, body: parts.filter(Boolean).join('\n') });
};

/* ============================================================
   Chapter 1 — The Computer
   ============================================================ */

// 1.1 System block diagram. The bus widths are the point: 16 address lines
// explain the 64K ceiling, 8 data lines explain the byte-at-a-time model.
add(
  'system-block.svg',
  'Z80 system block diagram',
  'A CPU box connected to a memory box and an I/O ports box by a 16-bit address bus, an 8-bit data bus and a control line group.',
  250,
  [
    box({ x: 40, y: 40, w: 150, h: 90, title: 'CPU', lines: ['Z80'] }),
    box({ x: 400, y: 26, w: 170, h: 66, title: 'Memory', lines: ['64 KB address space'] }),
    box({ x: 400, y: 148, w: 170, h: 66, title: 'I/O ports', lines: ['256 port numbers'] }),

    // Address bus: the wide one.
    line('sline', 190, 62, 400, 62, 'arS'),
    text('cap', 214, 54, 'ADDRESS BUS'),
    text('dim', 214, 78, '16 lines  →  $0000-$FFFF'),

    // Data bus: bidirectional, hence arrowheads at both ends.
    pathEl('none', 'M190,92 H400', 'ar'),
    pathEl('none', 'M400,92 H190', 'ar'),
    text('cap', 214, 108, 'DATA BUS'),
    text('dim', 300, 108, '8 lines'),

    line('none', 190, 178, 400, 178, 'ar'),
    text('cap', 214, 170, 'CONTROL'),
    text('dim', 214, 194, 'read / write / IORQ / MREQ'),

    text('dimn', 40, 234, 'Sixteen address lines set the ceiling at 65,536 bytes. Eight data lines set the unit of transfer at one byte.'),
  ],
);

// 1.2 Memory map. The board from the chapter, drawn to scale by address.
{
  const top = 34;
  const h = 190;
  const span = 0x10000;
  const at = (addr) => top + (addr / span) * h;
  const band = (from, to, cls, label, note) => [
    rect(cls, 150, at(from), 250, at(to + 1) - at(from), 2),
    text('nb', 275, (at(from) + at(to + 1)) / 2 + 4.5, label, 'middle'),
    text('dimn', 414, (at(from) + at(to + 1)) / 2 + 4, note),
    text('dim', 142, at(from) + 9, `$${from.toString(16).toUpperCase().padStart(4, '0')}`, 'end'),
  ];
  add(
    'memory-map.svg',
    'Memory map of a small Z80 board',
    'A vertical bar from $0000 at the top to $FFFF at the bottom, banded into 8 KB of ROM, 24 KB of RAM and an unmapped upper half.',
    268,
    [
      caption(150, 22, 'Address space'),
      ...band(0x0000, 0x1fff, 'bxs', 'ROM', '8 KB, startup code'),
      ...band(0x2000, 0x7fff, 'bx', 'RAM', '24 KB, program and data'),
      ...band(0x8000, 0xffff, 'bxq', 'unmapped', 'or more RAM, or memory-mapped I/O'),
      text('dim', 142, at(0xffff) + 4, '$FFFF', 'end'),
      line('sline', 92, at(0), 146, at(0), 'arS'),
      text('cap', 40, at(0) + 4, 'RESET'),
      text('dimn', 40, 258, 'PC is $0000 after a reset, so whatever is mapped there must be valid code. On this board, ROM.'),
    ],
  );
}

// 1.3 The register file. Pairing is the thing beginners find hard, so the
// 8-bit halves and the 16-bit whole are drawn as one object, not two lists.
// The pair name sits to the left of its boxes; above them it reads as a label
// for the gap between "high" and "low" on the row before.
{
  const cw = 74;
  const rh = 30;
  const xn = 40;   // pair name
  const x0 = 88;   // first byte
  const pair = (y, hi, lo, name, note) => [
    text('cap', xn, y + 20, name),
    rect('bx', x0, y, cw, rh, 2),
    rect('bx', x0 + cw, y, cw, rh, 2),
    text('tb', x0 + cw / 2, y + 20, hi, 'middle'),
    text('tb', x0 + cw + cw / 2, y + 20, lo, 'middle'),
    rect('none', x0, y, cw * 2, rh, 2),
    text('dim', x0 + cw / 2, y + 44, 'high', 'middle'),
    text('dim', x0 + cw + cw / 2, y + 44, 'low', 'middle'),
    note ? text('dimn', x0 + cw * 2 + 16, y + 20, note) : '',
  ];
  const wide = (y, x, name, note) => [
    rect('bx', x, y, cw * 2, rh, 2),
    text('tb', x + cw, y + 20, name, 'middle'),
    note ? text('dimn', x + cw * 2 + 16, y + 20, note) : '',
  ];
  const byteReg = (y, x, name) => [
    rect('bx', x, y, cw, rh, 2),
    text('tb', x + cw / 2, y + 20, name, 'middle'),
  ];
  add(
    'register-file.svg',
    'The Z80 register set',
    'A and F, then BC, DE and HL drawn as byte pairs that are also 16-bit units, then IX, IY, SP and PC as 16-bit registers, with I and R as single bytes and the shadow set alongside.',
    452,
    [
      caption(40, 26, 'Main set: eight bytes, four pairs'),
      ...pair(44, 'A', 'F', 'AF', 'accumulator, and the flags'),
      ...pair(110, 'B', 'C', 'BC', 'counts; C is the port for in r,(c)'),
      ...pair(176, 'D', 'E', 'DE', 'the copy destination'),
      ...pair(242, 'H', 'L', 'HL', 'the address register'),

      caption(40, 316, 'Index, pointer and housekeeping'),
      ...wide(330, 40, 'IX', ''),
      ...wide(330, 226, 'IY', ''),
      ...byteReg(330, 500, 'I'),
      ...byteReg(330, 584, 'R'),
      text('dimn', 40, 378, 'reached as base plus a signed displacement'),
      text('dimn', 500, 378, 'vector, and refresh'),
      ...wide(392, 40, 'SP', ''),
      ...wide(392, 226, 'PC', ''),
      text('dimn', 390, 412, 'the stack, and the next instruction'),

      rect('bxq', 470, 40, 210, 128, 3),
      text('cap', 484, 62, 'Shadow set'),
      text('ts', 484, 88, "A' F'    B' C'"),
      text('ts', 484, 108, "D' E'    H' L'"),
      text('dimn', 484, 134, 'A second copy, reached only'),
      text('dimn', 484, 150, 'by exchange. Chapter 8.'),

      text('dimn', 470, 200, '26 bytes inside the chip. Every'),
      text('dimn', 470, 216, 'one of them is faster to reach'),
      text('dimn', 470, 232, 'than any byte of RAM.'),
    ],
  );
}

// 1.4 Fetch-execute.
add(
  'fetch-execute.svg',
  'The fetch-execute cycle',
  'A four-step loop: fetch the byte at PC, decode it, execute it, advance PC, then back to fetch.',
  190,
  [
    node({ x: 40, y: 50, w: 130, h: 50, label: ['fetch byte', 'at PC'] }),
    node({ x: 210, y: 50, w: 120, h: 50, label: 'decode' }),
    node({ x: 370, y: 50, w: 120, h: 50, label: 'execute' }),
    node({ x: 530, y: 50, w: 150, h: 50, label: ['advance PC by', 'the byte count'] }),
    line('none', 170, 75, 210, 75, 'ar'),
    line('none', 330, 75, 370, 75, 'ar'),
    line('none', 490, 75, 530, 75, 'ar'),
    pathEl('none', 'M605,100 V138 H105 V100', 'ar'),
    text('dimn', 300, 132, 'and round again'),
    text('dimn', 40, 174, 'A jump or a call writes PC itself, so the advance never happens. That is the whole of control flow.'),
  ],
);

/* ============================================================
   Chapter 2 — Machine Code
   ============================================================ */

// 2.1 The ten-byte program as bytes in memory. Opcodes and operands are
// distinguished so that $3E $05 reads as one instruction, not two bytes.
{
  const bytes = [
    { v: '3E', op: true }, { v: '05' },
    { v: '47', op: true },
    { v: '3E', op: true }, { v: '03' },
    { v: '80', op: true },
    { v: '32', op: true }, { v: '00' }, { v: '80' },
    { v: '76', op: true },
  ];
  const cw = 52;
  const x0 = 46;
  const groups = [
    { at: 0, n: 2, asm: 'ld a, 5' },
    { at: 2, n: 1, asm: 'ld b, a' },
    { at: 3, n: 2, asm: 'ld a, 3' },
    { at: 5, n: 1, asm: 'add a, b' },
    { at: 6, n: 3, asm: 'ld ($8000), a' },
    { at: 9, n: 1, asm: 'halt' },
  ];
  add(
    'hex-program.svg',
    'The ten-byte program in memory',
    'Ten memory cells from $0000 to $0009 holding the bytes 3E 05 47 3E 03 80 32 00 80 76, bracketed into six instructions with the assembly for each below.',
    228,
    [
      caption(x0, 26, 'Bytes at $0000'),
      strip({
        x: x0,
        y: 56,
        cw,
        ch: 34,
        base: 0,
        cells: bytes.map((b) => ({ v: b.v, hi: b.op })),
        addrFmt: (a) => `$${a.toString(16).toUpperCase().padStart(4, '0')}`,
      }),
      ...groups.flatMap((g) => {
        const gx = x0 + g.at * cw;
        const gw = g.n * cw;
        return [
          pathEl('rule', `M${gx + 3},98 V110 H${gx + gw - 3} V98`),
          text('ts', gx + gw / 2, 128, g.asm, 'middle'),
        ];
      }),
      legend(x0, 168, [
        { cls: 'bxs', label: 'opcode' },
        { cls: 'bx', label: 'operand byte' },
      ]),
      text('dimn', x0, 206, 'The byte stream carries no names. Nothing here says $8000 is a result rather than a display buffer.'),
    ],
  );
}

// 2.2 Little-endian. The crossing arrows are the whole point.
add(
  'little-endian.svg',
  'Little-endian byte order',
  'The 16-bit value $8000 split into a low byte $00 stored at the lower address and a high byte $80 stored at the higher address, with the two arrows crossing.',
  222,
  [
    caption(46, 26, 'The value'),
    rect('bx', 46, 40, 108, 34, 2),
    text('tb', 100, 63, '$8000', 'middle'),
    rect('none', 46, 40, 54, 34, 2),
    text('dim', 73, 90, 'high $80', 'middle'),
    text('dim', 127, 90, 'low $00', 'middle'),

    caption(46, 132, 'In memory'),
    strip({
      x: 46,
      y: 148,
      cw: 54,
      ch: 34,
      base: 0x0007,
      cells: [{ v: '00', hi: true }, { v: '80' }],
    }),
    text('dimn', 168, 162, 'low byte at the lower address'),
    text('dimn', 168, 182, 'high byte at the higher address'),

    pathEl('sline', 'M127,96 C127,120 73,124 73,144', 'arS'),
    pathEl('dash', 'M73,96 C73,120 127,124 127,144', 'arD'),

    text('dimn', 46, 212, 'So ld ($8000), a assembles to 32 00 80. The swap is in the encoding, not in the value.'),
  ],
);

/* ============================================================
   Chapter 3 — Assembly Language
   ============================================================ */

// 3.1 Bytes and source side by side, with the label resolving to an address.
{
  const rows = [
    { addr: '$0000', bytes: '3E 05', src: '        ld   a,5' },
    { addr: '$0002', bytes: '47', src: '        ld   b,a' },
    { addr: '$0003', bytes: '3E 03', src: '        ld   a,3' },
    { addr: '$0005', bytes: '80', src: '        add  a,b' },
    { addr: '$0006', bytes: '32 00 80', src: '        ld   (Result),a' },
    { addr: '$0009', bytes: '76', src: '        halt' },
  ];
  const y0 = 56;
  const rh = 26;
  add(
    'source-and-bytes.svg',
    'Assembly source against the bytes it produces',
    'Six rows pairing an address and its bytes with the AZM source line that produced them, and an arrow from the label Result to the address $8000 it resolves to.',
    288,
    [
      caption(46, 30, 'Assembled'),
      caption(300, 30, 'Source'),
      ...rows.flatMap((r, i) => {
        const y = y0 + i * rh;
        return [
          text('dim', 46, y, r.addr),
          text('t', 116, y, r.bytes),
          text('t', 300, y, r.src),
        ];
      }),
      line('rule', 288, 40, 288, y0 + rows.length * rh - 12),

      text('t', 300, y0 + rows.length * rh + 26, 'Result:'),
      text('t', 300, y0 + rows.length * rh + 46, '        .db  0'),
      text('dim', 46, y0 + rows.length * rh + 26, '$8000'),
      text('dim', 116, y0 + rows.length * rh + 26, '00'),

      // Routed wide of the source column: the operand it leaves from is the
      // longest line in that column.
      pathEl('sline', `M486,${y0 + 4 * rh - 4} C566,${y0 + 4 * rh - 4} 566,${y0 + rows.length * rh + 18} 372,${y0 + rows.length * rh + 18}`, 'arS'),
      text('dimn', 580, y0 + rows.length * rh - 30, 'the label resolves'),
      text('dimn', 580, y0 + rows.length * rh - 14, 'to its address'),

      text('dimn', 46, 276, 'Move the variable and every reference follows. That is the entire argument for an assembler.'),
    ],
  );
}

// 3.2 What the assembler emits. Reused as the fan-out figure in Book 1 ch8.
add(
  'assembler-outputs.svg',
  'One source file, four artifacts',
  'A source file feeding the assembler, which emits an Intel HEX file, a flat binary, a debug map and a listing.',
  252,
  [
    box({ x: 40, y: 74, w: 130, h: 54, title: 'source.asm', cls: 'bxs', titleCls: 'tb' }),
    box({ x: 236, y: 74, w: 130, h: 54, title: 'azm', titleCls: 'tb' }),
    line('none', 170, 101, 236, 101, 'ar'),

    ...[
      ['.hex', 'Intel HEX, gaps implicit', 34],
      ['.bin', 'flat binary, gaps filled', 82],
      ['.d8.json', 'debug map for Debug80', 130],
      ['.lst', 'listing, address per line', 178],
    ].flatMap(([ext, note, y]) => [
      rect('bx', 448, y, 92, 34, 3),
      text('t', 494, y + 22, ext, 'middle'),
      text('dimn', 552, y + 21, note),
      pathEl('none', `M366,101 C408,101 408,${y + 17} 448,${y + 17}`, 'ar'),
    ]),

    text('dimn', 40, 236, 'Each artifact has a flag that suppresses it, and there are more artifacts than the four core ones shown here.'),
  ],
);

/* ============================================================
   Chapter 4 — Memory Access and Data
   ============================================================ */

// 4.1 The four addressing modes. ld a,count against ld a,(count) is the
// confusion this figure exists to kill, so those two sit adjacent.
{
  const PH = 132;
  const panel = (x, y, instr, note, draw) => [
    rect('bxq', x, y, 310, PH, 4),
    text('tb', x + 14, y + 24, instr),
    text('dimn', x + 14, y + 42, note),
    ...draw(x + 14, y + 58),
  ];
  const memCell = (x, y, addr, val, hi) => [
    rect(hi ? 'bxs' : 'bx', x, y, 54, 28, 2),
    text(hi ? 'tb' : 't', x + 27, y + 19, val, 'middle'),
    addr ? text('dim', x + 27, y - 6, addr, 'middle') : '',
  ];
  add(
    'addressing-modes.svg',
    'The four ways an instruction names its data',
    'Four panels showing immediate, direct, register indirect and indexed addressing, each with the instruction and where the value actually comes from.',
    334,
    [
      ...panel(30, 20, 'ld a, 5', 'immediate: the value is in the instruction', (x, y) => [
        ...memCell(x, y + 14, '', '05', true),
        text('dimn', x + 68, y + 33, 'the operand byte itself'),
      ]),
      ...panel(370, 20, 'ld a, (Count)', 'direct: the instruction holds an address', (x, y) => [
        ...memCell(x, y + 14, '$8000', '2A', true),
        pathEl('sline', `M${x + 62},${y + 28} H${x + 104}`, 'arS'),
        text('dimn', x + 112, y + 33, 'A = $2A'),
      ]),
      ...panel(30, 178, 'ld a, (hl)', 'register indirect: HL holds the address', (x, y) => [
        rect('bx', x, y + 14, 54, 28, 2),
        text('t', x + 27, y + 33, 'HL', 'middle'),
        text('dim', x + 62, y + 33, '$8000'),
        ...memCell(x + 150, y + 14, '$8000', '2A', true),
        pathEl('sline', `M${x + 112},${y + 28} H${x + 146}`, 'arS'),
      ]),
      ...panel(370, 178, 'ld a, (ix+2)', 'indexed: base register plus a displacement', (x, y) => [
        rect('bx', x, y + 14, 54, 28, 2),
        text('t', x + 27, y + 33, 'IX', 'middle'),
        text('dim', x + 62, y + 33, '$8000'),
        ...memCell(x + 122, y + 14, '$8000', '', false),
        ...memCell(x + 176, y + 14, '', '', false),
        ...memCell(x + 230, y + 14, '$8002', '2A', true),
        // Under the cells, so the path never crosses an address label.
        pathEl('sline', `M${x + 27},${y + 42} V${y + 56} H${x + 257} V${y + 46}`, 'arS'),
        text('dim', x + 132, y + 68, 'base, then two bytes on'),
      ]),
      text('dimn', 30, 324, 'The first two differ by a pair of brackets and by everything else. One loads five; the other loads whatever is at Count.'),
    ],
  );
}

/* ============================================================
   Chapter 5 — Flags, Comparisons and Jumps
   ============================================================ */

// 5.1 The flags byte.
add(
  'flags-register.svg',
  'The F register',
  'The eight bits of F: S, Z, an unused bit, H, an unused bit, P slash V, N and C, numbered 7 down to 0.',
  204,
  [
    caption(60, 26, 'F register'),
    bitfield({
      x: 60,
      y: 48,
      cw: 74,
      ch: 34,
      bits: ['S', 'Z', '-', 'H', '-', 'P/V', 'N', 'C'],
      marks: [1, 7],
      names: ['sign', 'zero', '', 'half', '', 'parity', 'sub', 'carry'],
    }),
    text('dimn', 60, 132, 'Z and C are the two you use from the start. Z is set when the result was zero; C is set when an addition'),
    text('dimn', 60, 150, 'carried out of bit 7, or a subtraction needed a borrow.'),
    text('dimn', 60, 180, 'The two greyed bits are undocumented copies of result bits. ld instructions touch none of this.'),
  ],
);

// 5.2 cp sets the flags; the jump reads them. The carry rule is stated in the
// figure because the books got it backwards in prose more than once.
add(
  'compare-and-branch.svg',
  'How cp reaches a conditional jump',
  'cp n subtracts and discards the result, leaving flags behind, which the following conditional jump reads. A table gives the three outcomes: A less than n sets carry, A equal to n sets zero, A greater than n clears both.',
  278,
  [
    node({ x: 30, y: 40, w: 210, h: 52, label: ['cp n', 'A − n, result discarded'] }),
    node({ x: 280, y: 40, w: 150, h: 52, label: ['flags updated', 'in F'], hi: true }),
    node({ x: 470, y: 40, w: 210, h: 52, label: ['jr c, ...  /  jr z, ...', 'reads the flags'] }),
    line('none', 240, 66, 280, 66, 'ar'),
    line('none', 430, 66, 470, 66, 'ar'),

    caption(40, 138, 'Unsigned outcomes'),
    ...[
      ['A < n', 'C set', 'Z clear', 'jr c, target', true],
      ['A = n', 'C clear', 'Z set', 'jr z, target', false],
      ['A > n', 'C clear', 'Z clear', 'jr nc, target and not z', false],
    ].flatMap(([cond, c, z, jump, hi], i) => {
      const y = 156 + i * 30;
      return [
        rect(hi ? 'bxs' : 'bx', 40, y, 96, 26, 2),
        text(hi ? 'tb' : 't', 88, y + 18, cond, 'middle'),
        text('t', 156, y + 18, c),
        text('t', 250, y + 18, z),
        text('ts', 350, y + 18, jump),
      ];
    }),

    text('dimn', 40, 266, 'Carry is set when A is below the operand. A borrow was needed, so the flag that records a borrow is set.'),
  ],
);

// 5.3 Signed against unsigned on one bar.
{
  const x0 = 60;
  const w = 600;
  const y = 84;
  const tick = (v, top, bottom) => {
    const px = x0 + (v / 256) * w;
    return [
      line('rule', px, y - 6, px, y + 34),
      top ? text('dim', px, y - 14, top, 'middle') : '',
      bottom ? text('dim', px, y + 50, bottom, 'middle') : '',
    ];
  };
  add(
    'signed-unsigned.svg',
    'One byte, two readings',
    'A bar of 256 values labelled 0 to 255 as unsigned along the top and 0 to 127 then minus 128 to minus 1 as signed along the bottom, with $80 marked as the pivot.',
    216,
    [
      caption(x0, 34, 'Unsigned  0 – 255'),
      rect('bx', x0, y, w / 2, 34, 2),
      rect('bxs', x0 + w / 2, y, w / 2, 34, 2),
      text('t', x0 + w / 4, y + 22, 'bit 7 clear', 'middle'),
      text('tb', x0 + (3 * w) / 4, y + 22, 'bit 7 set', 'middle'),
      ...tick(0, '0', '0'),
      ...tick(128, '128', '−128'),
      ...tick(255.5, '255', '−1'),
      text('cap', x0, y + 76, 'SIGNED  −128 – 127'),
      text('dim', x0 + w / 4, y + 50, '0 … 127', 'middle'),
      text('dim', x0 + (3 * w) / 4, y + 50, '−128 … −1', 'middle'),

      text('dimn', x0, 178, 'The byte does not know which reading you meant. cp $80 splits the bar here; whether that is a large'),
      text('dimn', x0, 196, 'positive number or a negative one is decided by which conditional jump you write next.'),
    ],
  );
}

/* ============================================================
   Chapter 6 — Counting Loops and DJNZ
   ============================================================ */

// 6.1 djnz, including the wrap that turns ld b,0 into 256 iterations.
add(
  'djnz-flow.svg',
  'What djnz does',
  'djnz decrements B, then jumps back if B is not zero and falls through if it is, with a side note that B starting at zero wraps to 255 and runs 256 times.',
  268,
  [
    node({ x: 60, y: 34, w: 150, h: 44, label: 'ld b, count', kind: 'term' }),
    node({ x: 60, y: 104, w: 150, h: 44, label: 'loop body' }),
    node({ x: 40, y: 174, w: 190, h: 52, label: 'djnz: B ← B − 1', kind: 'test', hi: true }),
    line('none', 135, 78, 135, 104, 'ar'),
    line('none', 135, 148, 135, 174, 'ar'),
    pathEl('none', 'M40,200 H16 V126 H60', 'ar'),
    text('dimn', 20, 116, 'B ≠ 0'),
    line('none', 230, 200, 300, 200, 'ar'),
    text('dimn', 240, 192, 'B = 0, fall through'),

    rect('bxq', 380, 34, 300, 192, 4),
    text('cap', 396, 58, 'The zero case'),
    text('ts', 396, 84, 'ld b, 0'),
    text('dimn', 396, 108, 'B is decremented before the test, so'),
    text('dimn', 396, 126, 'zero wraps to $FF, which is not zero,'),
    text('dimn', 396, 144, 'and the jump is taken. 256 iterations,'),
    text('dimn', 396, 162, 'not none.'),
    text('dimn', 396, 194, 'Test for zero before the loop when the'),
    text('dimn', 396, 212, 'count can be zero.'),

    text('dimn', 40, 254, 'The displacement is signed and relative, so the body must stay within 128 bytes back of the instruction after djnz.'),
  ],
);

// 6.2 The three loop shapes side by side.
{
  const col = (x, title, steps, note) => {
    const out = [text('cap', x, 34, title)];
    steps.forEach((s, i) => {
      const y = 52 + i * 54;
      out.push(node({ x, y, w: 190, h: 40, label: s.l, kind: s.k ?? 'box', hi: s.hi }));
      if (i < steps.length - 1) out.push(line('none', x + 95, y + 40, x + 95, y + 54, 'ar'));
    });
    out.push(text('dimn', x, 52 + steps.length * 54 + 12, note));
    return out;
  };
  add(
    'loop-shapes.svg',
    'Three loop shapes',
    'Counted, sentinel and flag-exit loops drawn side by side, with djnz acting as the exit in the first and as a safety bound in the other two.',
    300,
    [
      ...col(30, 'Counted', [
        { l: 'ld b, n' },
        { l: 'body' },
        { l: 'djnz', k: 'test', hi: true },
      ], 'Runs exactly n times.'),
      ...col(262, 'Sentinel', [
        { l: 'ld a, (hl)' },
        { l: 'cp 0', k: 'test' },
        { l: 'body, inc hl' },
        { l: 'djnz', k: 'test', hi: true },
      ], 'Data decides. djnz is the bound.'),
      ...col(494, 'Flag exit', [
        { l: 'in a, (port)' },
        { l: 'and mask', k: 'test' },
        { l: 'body' },
        { l: 'djnz', k: 'test', hi: true },
      ], 'Hardware decides. djnz is the bound.'),
      text('dimn', 30, 290, 'In the second and third shapes djnz is not the exit condition. It is the guarantee that the loop ends at all.'),
    ],
  );
}

/* ============================================================
   Chapter 7 — Data Tables and Indexed Access
   ============================================================ */

// 7.1 HL walking. The values are Chapter 10's table, so the two chapters
// show the reader the same eight bytes.
{
  const vals = [23, 47, 91, 5, 67, 12, 88, 34];
  add(
    'hl-walking.svg',
    'HL walking a byte table',
    'The eight-byte table 23, 47, 91, 5, 67, 12, 88, 34 with HL shown under the first byte and again three increments later.',
    216,
    [
      caption(56, 28, 'values'),
      strip({
        x: 56,
        y: 46,
        cw: 68,
        ch: 32,
        base: 0x8000,
        addrEvery: 2,
        cells: vals.map((v, i) => ({ v: String(v), hi: i === 3 })),
      }),
      line('sline', 90, 118, 90, 88, 'arS'),
      text('cap', 74, 134, 'HL'),
      text('dimn', 112, 132, 'on entry'),

      line('sline', 294, 118, 294, 88, 'arS'),
      text('cap', 278, 134, 'HL'),
      text('dimn', 316, 132, 'after three inc hl'),

      text('ts', 56, 172, 'ld a, (hl)      ; read the byte HL points at'),
      text('ts', 56, 192, 'inc hl          ; move to the next one'),
      text('dimn', 56, 208, 'HL holds an address. (hl) is the byte at that address. Getting those two confused is the most common mistake here.'),
    ],
  );
}

// 7.2 IX plus a displacement reaching named fields of one record.
add(
  'ix-displacement.svg',
  'IX reaching fields by displacement',
  'IX loaded once with a record base, with (ix+0), (ix+1) and (ix+2) landing on the x, y and colour bytes of one Sprite.',
  212,
  [
    rect('bx', 56, 44, 72, 30, 2),
    text('tb', 92, 64, 'IX', 'middle'),
    text('dim', 138, 64, '$8000'),
    text('dimn', 138, 84, 'loaded once'),

    caption(300, 26, 'One Sprite record'),
    strip({
      x: 300,
      y: 44,
      cw: 78,
      ch: 32,
      base: 0x8000,
      cells: [
        { v: '$0A', sub: 'x' },
        { v: '$14', sub: 'y' },
        { v: '$03', sub: 'color', hi: true },
      ],
    }),
    pathEl('sline', 'M200,59 H300', 'arS'),

    ...['(ix+0)', '(ix+1)', '(ix+2)'].map((d, i) =>
      text('ts', 300 + i * 78 + 39, 118, d, 'middle'),
    ),

    text('ts', 56, 158, 'ld a, (ix + SpriteColor)   ; SpriteColor is the constant 2'),
    text('dimn', 56, 186, 'One load of the base, then every field by name. The displacement is a signed byte, so this reaches 127 bytes in.'),
    text('dimn', 56, 204, 'Past that, the add hl, de form is the only option.'),
  ],
);

// 7.3 ldir. The registers after the copy are the part people forget.
{
  const src = ['1A', '2B', '3C', '4D'];
  add(
    'ldir-copy.svg',
    'ldir before and after',
    'Four source bytes and four destination bytes before the copy and after it, with HL, DE and BC shown in both states.',
    296,
    [
      caption(56, 28, 'Before'),
      text('dim', 56, 62, 'source'),
      strip({ x: 130, y: 44, cw: 54, ch: 30, cells: src.map((v) => ({ v })) }),
      text('dim', 56, 116, 'dest'),
      strip({ x: 130, y: 98, cw: 54, ch: 30, cells: src.map(() => ({ v: '--' })) }),
      text('ts', 400, 62, 'HL = source'),
      text('ts', 400, 84, 'DE = dest'),
      text('ts', 400, 106, 'BC = 4'),

      line('sline', 360, 160, 400, 160, 'arS'),
      text('tb', 300, 165, 'ldir', 'middle'),

      caption(56, 208, 'After'),
      text('dim', 56, 242, 'source'),
      strip({ x: 130, y: 224, cw: 54, ch: 30, cells: src.map((v) => ({ v })) }),
      text('dim', 56, 278, 'dest'),
      strip({ x: 130, y: 260, cw: 54, ch: 30, cells: src.map((v) => ({ v, hi: true })) }),
      text('ts', 400, 242, 'HL = source + 4'),
      text('ts', 400, 264, 'DE = dest + 4'),
      text('ts', 400, 286, 'BC = 0'),
    ],
  );
}

/* ============================================================
   Chapter 8 — Stack and Subroutines
   ============================================================ */

// 8.1 Which way the stack grows. Beginners assume up. Addresses run down the
// left; SP markers sit on the right so the two never share a column.
{
  const x = 210;
  const w = 190;
  const sh = 30;
  const y0 = 58;
  const slotY = (i) => y0 + i * sh;
  const slot = (i, label, hi) => [
    rect(hi ? 'bxs' : 'bxq', x, slotY(i), w, sh, 2),
    label ? text(hi ? 'tb' : 't', x + w / 2, slotY(i) + 20, label, 'middle') : '',
    text('dim', x - 12, slotY(i) + 19, `$${(0xbffe - i * 2).toString(16).toUpperCase()}`, 'end'),
  ];
  const sp = (yAt, label) => [
    pathEl('sline', `M${x + w + 76},${yAt} H${x + w + 10}`, 'arS'),
    text('cap', x + w + 84, yAt + 4, label),
  ];
  add(
    'stack-grows-down.svg',
    'The stack grows downward',
    'A memory column with high addresses at the top. SP starts at $C000 above the column and moves down to $BFFC as two words are pushed.',
    296,
    [
      text('dimn', 210, 26, 'higher addresses'),
      text('dim', x - 12, 48, '$C000', 'end'),
      line('rule', x, 52, x + w, 52),
      ...slot(0, 'first push', true),
      ...slot(1, 'second push', true),
      ...slot(2, null, false),
      ...slot(3, null, false),
      text('dimn', 210, 210, 'lower addresses'),

      ...sp(48, 'SP at start'),
      ...sp(slotY(1) + 15, 'SP now'),

      text('dimn', 40, 244, 'ld sp, $C000 runs before the first call, push or pop. Each push takes SP down two and writes a word at the new'),
      text('dimn', 40, 262, 'SP; each pop reads a word and puts SP back up two.'),
      text('dimn', 40, 280, 'Point SP at the top of RAM and the stack runs down into free space rather than down into your program.'),
    ],
  );
}

// 8.2 A call in three frames.
{
  const frame = (x, title, slots, spIdx, note) => [
    text('cap', x, 30, title),
    stack({ x, y: 44, w: 148, sh: 28, slots, spIndex: null }),
    spIdx === null ? '' : line('sline', x - 12, 44 + spIdx * 28 + 14, x - 12, 44 + spIdx * 28 + 14),
    spIdx === null ? '' : pathEl('sline', `M${x - 44},${44 + spIdx * 28 + 14} H${x - 6}`, 'arS'),
    spIdx === null ? '' : text('cap', x - 68, 44 + spIdx * 28 + 18, 'SP'),
    text('dimn', x, 44 + slots.length * 28 + 22, note),
  ];
  add(
    'call-and-ret.svg',
    'A call in three states',
    'Before the call SP is at the top of an empty stack; during the subroutine the return address sits below it; after ret the stack is empty again and PC is back at the caller.',
    242,
    [
      ...frame(108, 'Before call', [{ v: null }, { v: null }, { v: null }], 0, 'PC at the call'),
      ...frame(328, 'Inside the routine', [{ v: null }, { v: 'return addr', hi: true }, { v: null }], 1, 'PC at the routine'),
      ...frame(548, 'After ret', [{ v: null }, { v: null }, { v: null }], 0, 'PC after the call'),
      text('dimn', 40, 226, 'call is a push of the address after it, then a jump. ret is the pop that puts that address back into PC.'),
    ],
  );
}

// 8.3 Nested calls: pushed in order, unwound in reverse.
add(
  'nested-calls.svg',
  'Three levels of call',
  'main calls draw, draw calls plot, and the stack holds three return addresses which are removed in reverse order as each ret runs.',
  268,
  [
    ...['main', 'draw', 'plot'].flatMap((n, i) => [
      box({ x: 46 + i * 150, y: 40, w: 120, h: 42, title: n, titleCls: 'tb' }),
      i < 2 ? line('none', 166 + i * 150, 61, 196 + i * 150, 61, 'ar') : '',
      i < 2 ? text('dimn', 172 + i * 150, 52, 'call') : '',
    ]),

    caption(470, 30, 'The stack at the deepest point'),
    stack({
      x: 490,
      y: 44,
      w: 176,
      sh: 28,
      slots: [
        { v: 'return into main', hi: true },
        { v: 'return into draw', hi: true },
        { v: null },
      ],
      spIndex: null,
    }),
    pathEl('sline', 'M446,102 H484', 'arS'),
    text('cap', 416, 106, 'SP'),

    text('dimn', 46, 148, 'Pushed on the way in, top to bottom.'),
    text('dimn', 46, 166, 'Popped on the way out, bottom to top.'),
    text('dimn', 46, 196, "There is no register recording how deep you are. The only limit is how much RAM sits below SP, and nothing"),
    text('dimn', 46, 214, 'checks that you have not run out of it.'),

    text('dimn', 46, 252, 'A missing ret does not return anywhere. Execution runs on into whatever bytes follow the last instruction.'),
  ],
);

// 8.4 Push and pop need not use the same pair. This is Chapter 8's exercise 1,
// so the reader can check their own answer against the figure.
add(
  'cross-register-move.svg',
  'Moving through the stack',
  'push af, push bc, pop de, pop hl traced through four states, ending with DE holding what BC held and HL holding what AF held.',
  292,
  [
    text('ts', 46, 40, 'AF = $3C41    BC = $0820    SP = $9000'),

    ...[
      ['push af', ['$3C41'], '$8FFE'],
      ['push bc', ['$0820', '$3C41'], '$8FFC'],
      ['pop de', ['$3C41'], '$8FFE'],
      ['pop hl', [], '$9000'],
    ].flatMap(([instr, contents, sp], i) => {
      const x = 46 + i * 168;
      const out = [text('tb', x, 78, instr)];
      for (let s = 0; s < 2; s += 1) {
        const y = 96 + s * 30;
        const v = contents[s];
        out.push(rect(v ? 'bxs' : 'bxq', x, y, 122, 30, 2));
        if (v) out.push(text('tb', x + 61, y + 20, v, 'middle'));
      }
      out.push(text('dim', x, 176, `SP = ${sp}`));
      return out;
    }),

    text('ts', 46, 220, 'DE = $0820       HL = $3C41       SP = $9000'),
    text('dimn', 46, 248, 'The stack has no memory of which pair supplied the bytes, so a push and its pop can name different registers.'),
    text('dimn', 46, 266, 'That is the only way to reach F, because no ld instruction can name it.'),
    text('dimn', 46, 284, 'SP is back where it started. Every path to ret must leave it that way, or ret reads a temporary as its destination.'),
  ],
);

/* ============================================================
   Chapter 9 — I/O and Ports
   ============================================================ */

add(
  'io-address-space.svg',
  'Two address spaces',
  'Memory addressed from $0000 to $FFFF by ld, and ports numbered $00 to $FF by in and out, drawn as two separate bars.',
  244,
  [
    caption(56, 30, 'Memory'),
    rect('bx', 56, 44, 280, 54, 3),
    text('t', 196, 68, '$0000 … $FFFF', 'middle'),
    text('dim', 196, 88, '65,536 bytes', 'middle'),
    text('ts', 56, 124, 'ld a, ($8000)'),

    caption(420, 30, 'Ports'),
    rect('bxs', 420, 44, 240, 54, 3),
    text('tb', 540, 68, '$00 … $FF', 'middle'),
    text('dim', 540, 88, '256 port numbers', 'middle'),
    text('ts', 420, 124, 'in a, ($11)     out ($10), a'),

    text('dimn', 56, 168, 'The two spaces are separate. Port $10 and memory address $0010 are different places, reached by different'),
    text('dimn', 56, 186, 'instructions, and the CPU marks which kind of transaction it is on its control bus.'),
    text('dimn', 56, 216, 'All sixteen address pins are driven during I/O. In the (C) forms B appears on the upper pins, which is how the'),
    text('dimn', 56, 234, 'TEC-1G matrix keyboard selects a row. Most systems decode only the low eight bits.'),
  ],
);

add(
  'polling-loop.svg',
  'Polling a status port',
  'A loop that reads the status port, masks bit 0, jumps back while the bit is clear, and reads the data port once it is set.',
  244,
  [
    node({ x: 200, y: 34, w: 200, h: 40, label: 'in a, (STATUS_PORT)' }),
    node({ x: 200, y: 96, w: 200, h: 40, label: 'and $01' }),
    node({ x: 180, y: 158, w: 240, h: 48, label: 'Z set?', kind: 'test', hi: true }),
    line('none', 300, 74, 300, 96, 'ar'),
    line('none', 300, 136, 300, 158, 'ar'),
    pathEl('none', 'M180,182 H120 V54 H200', 'ar'),
    text('dimn', 124, 118, 'yes, bit 0'),
    text('dimn', 124, 136, 'still clear'),
    line('none', 420, 182, 480, 182, 'ar'),
    text('dimn', 430, 172, 'no, ready'),
    node({ x: 490, y: 158, w: 190, h: 48, label: 'in a, (DATA_PORT)' }),

    text('dimn', 40, 234, 'and $01 discards every bit but the ready flag, so Z answers one question: is the device ready yet.'),
  ],
);

/* ============================================================
   Chapter 10 — A Complete Program
   ============================================================ */

// The two calls are drawn as two rows rather than as arrows crossing a single
// caller box, because what the reader needs is the register traffic per call,
// not the shape of the control flow.
{
  const row = (y, name, ins, outs, clob) => [
    box({ x: 40, y, w: 130, h: 50, title: 'main', titleCls: 'tb' }),
    box({ x: 420, y, w: 200, h: 50, title: name, titleCls: 'tb' }),
    pathEl('none', `M170,${y + 16} H420`, 'ar'),
    text('ts', 200, y + 10, `in  ${ins}`),
    pathEl('sline', `M420,${y + 38} H174`, 'arS'),
    text('ts', 200, y + 56, `out ${outs}`),
    text('dim', 200, y + 74, `clobbers ${clob}`),
  ];
  add(
    'main-data-flow.svg',
    'What main hands to each routine',
    'main calls find_max with HL and B and gets back A, then calls count_above with HL, B and C and gets back A. Both clobber HL, which is why it is reloaded between the calls.',
    312,
    [
      ...row(40, 'find_max', 'HL, B', 'A = the maximum', 'B, C, F, HL'),
      ...row(158, 'count_above', 'HL, B, C', 'A = the count', 'B, D, F, HL'),

      rect('bxs', 40, 248, 250, 26, 2),
      text('ts', 54, 266, 'ld hl, values'),
      text('dimn', 306, 266, 'reloaded before the second call'),

      text('dimn', 40, 304, 'find_max walks HL to the end of the table and does not put it back. Its contract says so, and the caller reloads it.'),
    ],
  );
}

/* ============================================================
   Chapter 11 — Subroutine Conventions
   ============================================================ */

add(
  'caller-callee-save.svg',
  'Who is responsible for which register',
  'A boundary line with caller-save registers on one side, which the routine may change, and callee-save on the other, which it must restore.',
  268,
  [
    line('rule', 360, 34, 360, 214),
    caption(56, 30, 'Caller-save'),
    caption(390, 30, 'Callee-save'),

    ...['A', 'F', 'declared out', 'named in clobbers'].map((s, i) =>
      [rect('bxs', 56, 46 + i * 40, 250, 30, 2), text('tb', 181, 66 + i * 40, s, 'middle')].join('\n'),
    ),
    ...['everything else'].map((s, i) =>
      [rect('bx', 390, 46 + i * 40, 250, 30, 2), text('tb', 515, 66 + i * 40, s, 'middle')].join('\n'),
    ),

    text('dimn', 56, 232, 'The routine may change these.'),
    text('dimn', 56, 250, 'Save anything you still need.'),
    text('dimn', 390, 106, 'If the routine uses one internally it must put'),
    text('dimn', 390, 124, 'the incoming value back before every ret.'),
    text('dimn', 390, 154, 'push de at the top, pop de before each'),
    text('dimn', 390, 172, 'return. Miss one path and ret takes the'),
    text('dimn', 390, 190, 'saved word as its destination.'),

    text('dimn', 56, 262, 'The contract decides this, not the register. BC is callee-save whenever the contract does not name it.'),
  ],
);

add(
  'ix-frame.svg',
  'The IX stack frame',
  'A frame with caller arguments at IX+4 and above, the return address at IX+2 and IX+3, the saved IX at IX+0 and IX+1, and locals at negative displacements below.',
  330,
  [
    text('dimn', 470, 30, 'higher addresses'),
    text('dimn', 470, 300, 'lower addresses'),

    ...[
      ['arg high byte', 'IX+5', 'pushed by the caller', 'bxq'],
      ['arg low byte', 'IX+4', '', 'bxq'],
      ['return address high', 'IX+3', 'pushed by call', 'bx'],
      ['return address low', 'IX+2', '', 'bx'],
      ['saved IX high', 'IX+1', 'pushed by the prologue', 'bx'],
      ['saved IX low', 'IX+0', '', 'bxs'],
      ['first local', 'IX−1', 'dec sp, once per byte', 'bxq'],
      ['second local', 'IX−2', '', 'bxq'],
    ].flatMap(([label, disp, note, cls], i) => {
      const y = 44 + i * 30;
      return [
        rect(cls, 190, y, 210, 30, 2),
        text('t', 295, y + 20, label, 'middle'),
        text('dim', 412, y + 19, disp),
        note ? text('dimn', 470, y + 19, note) : '',
      ];
    }),

    line('rule', 190, 224, 400, 224),
    pathEl('sline', 'M140,209 H184', 'arS'),
    text('cap', 100, 213, 'IX'),

    text('ts', 40, 300, 'add ix, sp'),
    text('dimn', 40, 320, 'The prologue points IX at the frame base. ld sp, ix in the epilogue drops every local in one instruction.'),
  ],
);

/* ============================================================
   Chapter 12 — Register Contracts
   ============================================================ */

add(
  'contract-boundary.svg',
  'What a contract describes',
  'A routine drawn as a boundary, with in entering, out leaving, clobbers destroyed inside and preserves passing through untouched.',
  288,
  [
    rect('bx', 250, 44, 220, 180, 4),
    text('tb', 360, 70, 'find_max', 'middle'),
    text('dim', 360, 92, 'the body', 'middle'),

    ...[
      ['in', 'HL, B', 118, true],
      ['clobbers', 'B, HL, F', 202, false],
    ].flatMap(([key, val, y, entering]) => [
      text('cap', 40, y - 14, key),
      text('ts', 40, y + 6, val),
      entering
        ? pathEl('sline', `M170,${y} H244`, 'arS')
        : pathEl('dash', `M244,${y} H170`, 'arD'),
    ]),

    text('cap', 520, 104, 'out'),
    text('ts', 520, 124, 'A = max'),
    pathEl('sline', 'M476,118 H512', 'arS'),

    text('cap', 520, 188, 'preserves'),
    text('ts', 520, 208, 'DE, IX, IY'),
    pathEl('none', 'M40,246 H680', 'ar'),
    text('dimn', 250, 266, 'straight through, untouched'),

    text('dimn', 40, 40, 'A contract names what crosses the boundary, in both directions.'),
  ],
);

add(
  'liveness-violation.svg',
  'A value used after the call that destroyed it',
  'A caller loads HL, calls find_max which clobbers HL, then reads through HL, with the diagnostic azm reports at the call site.',
  302,
  [
    // The highlight goes behind the call line, not on top of a second copy
    // of it.
    rect('bxs', 40, 84, 250, 26, 2),
    ...[
      'ld hl, table',
      'ld b, 8',
      'call find_max',
      'ld a, (hl)',
    ].map((l, i) => text(i === 2 ? 'tb' : 'ts', 56, 50 + i * 26, l)),

    pathEl('dash', 'M320,50 H300', 'arD'),
    text('dim', 330, 54, 'HL holds table'),
    pathEl('dash', 'M320,102 H300', 'arD'),
    text('dim', 330, 98, 'find_max walks HL to the end of'),
    text('dim', 330, 116, 'the table and does not put it back'),
    pathEl('dash', 'M320,128 H300', 'arD'),
    text('dim', 330, 132, 'so this reads the wrong byte'),

    text('cap', 40, 190, 'What azm --rc warn reports'),
    rect('bxq', 40, 202, 640, 44, 3),
    text('ts', 54, 220, 'source.asm:6:5: warning: [AZMN_REGISTER_CONTRACTS] CALL find_max'),
    text('ts', 54, 238, 'may modify H,L, but the pre-call value is used later.'),

    text('dimn', 40, 272, 'The analyzer does not know what table means. It knows HL held a value, that the call may destroy HL, and that'),
    text('dimn', 40, 290, 'HL was read afterwards. Reload it, save it across the call, or stop using it.'),
  ],
);

/* ============================================================
   Chapter 13 — Layout Types
   ============================================================ */

add(
  'record-layout.svg',
  'A record and the constants it yields',
  'The Sprite record as three consecutive bytes with x at offset 0, y at offset 1 and colour at offset 2, and sizeof reporting 3.',
  292,
  [
    ...['Sprite .type', 'x       .byte', 'y       .byte', 'color   .byte', '.endtype'].map((l, i) =>
      text('ts', 46, 44 + i * 20, l),
    ),

    caption(300, 32, 'In memory'),
    strip({
      x: 300,
      y: 44,
      cw: 86,
      ch: 34,
      cells: [
        { v: 'x', sub: 'offset 0' },
        { v: 'y', sub: 'offset 1' },
        { v: 'color', sub: 'offset 2', hi: true },
      ],
    }),
    pathEl('rule', 'M300,102 V116 H558 V102'),
    text('dim', 429, 134, 'sizeof(Sprite) = 3', 'middle'),

    text('cap', 46, 176, 'Assembly-time constants'),
    ...[
      'SpriteX     .equ offset(Sprite, x)       ; = 0',
      'SpriteY     .equ offset(Sprite, y)       ; = 1',
      'SpriteColor .equ offset(Sprite, color)   ; = 2',
      'SpriteSize  .equ sizeof(Sprite)          ; = 3',
    ].map((l, i) => text('ts', 46, 196 + i * 20, l)),

    text('dimn', 46, 286, 'Add a field and every one of these updates. The description is in one place, so the offsets cannot drift from it.'),
  ],
);

add(
  'array-of-records.svg',
  'An array of records, and reaching one field',
  'Four Sprite records laid end to end with the three-byte stride marked between origins, and the arithmetic that lands on the colour byte of the third.',
  268,
  [
    caption(46, 30, '.ds Sprite[4]'),
    ...[0, 1, 2, 3].flatMap((n) => {
      const x = 46 + n * 156;
      return [
        rect(n === 2 ? 'bxs' : 'bx', x, 44, 150, 34, 2),
        text('t', x + 25, 66, 'x', 'middle'),
        text('t', x + 75, 66, 'y', 'middle'),
        text(n === 2 ? 'tb' : 't', x + 125, 66, 'color', 'middle'),
        line('rule', x + 50, 44, x + 50, 78),
        line('rule', x + 100, 44, x + 78 + 22, 78),
        text('dim', x + 75, 96, `[${n}]`, 'middle'),
      ];
    }),

    pathEl('rule', 'M46,112 V124 H196 V112'),
    text('dim', 121, 142, 'stride = sizeof(Sprite) = 3', 'middle'),

    text('cap', 46, 184, 'The colour byte of element 2'),
    text('ts', 46, 208, 'base + 2 * sizeof(Sprite) + offset(Sprite, color)'),
    text('ts', 46, 230, 'offset(Sprite[16], [2].color)     ; the same constant, folded'),

    text('dimn', 46, 258, 'The stride is always the element size. AZM packs records exactly and never rounds a layout up for you.'),
  ],
);

add(
  'union-overlay.svg',
  'A union is one set of bytes with two readings',
  'The Payload union with asByte and asWord both starting at offset 0, drawn as two labelled views over the same two bytes.',
  254,
  [
    ...['Payload .union', 'asByte  .byte', 'asWord  .word', '.endunion'].map((l, i) =>
      text('ts', 46, 44 + i * 20, l),
    ),

    caption(320, 32, 'The bytes'),
    strip({ x: 320, y: 44, cw: 90, ch: 34, cells: [{ v: 'lo' }, { v: 'hi' }] }),

    rect('bxs', 320, 100, 90, 26, 2),
    text('tb', 365, 118, 'asByte', 'middle'),
    rect('bxs', 320, 136, 180, 26, 2),
    text('tb', 410, 154, 'asWord', 'middle'),

    text('dim', 520, 118, 'offset 0, 1 byte'),
    text('dim', 520, 154, 'offset 0, 2 bytes'),
    text('dim', 320, 190, 'sizeof(Payload) = 2, the largest member'),

    text('dimn', 46, 226, 'Both fields start at offset 0. Reading asByte reads the low byte of whatever 16-bit value was stored there.'),
    text('dimn', 46, 244, 'Reach for a union when the same bytes have more than one legitimate reading, not to save space.'),
  ],
);

/* ============================================================
   Chapter 14 — Op Declarations
   ============================================================ */

// The size comparison is computed, not asserted, because the honest answer is
// that a short body inlines smaller than it calls and the chapter should not
// pretend otherwise.
{
  const body = 4;      // push hl / push de / pop hl / pop de
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
    'Three call sites with a four-byte body inlined comes to twelve bytes; the same body as a subroutine comes to fourteen, being the body, a ret and three three-byte calls.',
    296,
    [
      text('ts', 46, 40, 'op swap_hl_de()   ; push hl / push de / pop hl / pop de'),
      text('dim', 46, 60, `body = ${body} bytes, used at ${sites} call sites`),

      ...bar(46, 104, inline, 'Inlined at every site', true),
      ...bar(46, 176, asCall, 'As a subroutine, called three times', false),
      text('dim', 46 + asCall * 16 + 16, 196, `${body} body + 1 ret + ${sites} × 3 call`),

      text('dimn', 46, 240, `Inlining wins here. A call costs three bytes at every site plus a ret, so a body this short is cheaper repeated`),
      text('dimn', 46, 258, 'than shared. The crossover for three sites is a body of five bytes; above that, the subroutine is smaller.'),
      text('dimn', 46, 276, 'Every invocation is a separate copy in the binary, and a disassembly shows exactly that.'),
    ],
  );
}

/* ---------- write ---------- */

mkdirSync(OUT, { recursive: true });
for (const [name, body] of Object.entries(figures)) {
  writeFileSync(path.join(OUT, name), body);
}
console.log(`${Object.keys(figures).length} figures → ${OUT}`);
