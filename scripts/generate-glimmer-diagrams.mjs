/**
 * Generates the figures for the Glimmer book, Book 0.
 *
 * Glimmer is the most visual of the four books and had no figures at all: the
 * frame and its delivery rule, the scan window the game runs in, the seven
 * motion curves and two finished games were carried by prose alone. Every one
 * of those is a picture of values the chapters state, so the generator draws
 * them from the same numbers, and a change to a chapter is a change to a line
 * here rather than a redraw.
 *
 * The curve presets are computed from the compiler's own easing functions, so
 * the plotted shapes and the tables printed in chapter 8 come from one source.
 *
 * Usage: node scripts/generate-glimmer-diagrams.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  svg, rect, text, line, path as pathEl, circle, caption,
  strip, bitfield, box, node, plot, ledGrid, legend,
} from './lib/figure.mjs';

const OUT = 'assets/images/glimmer-book/book0';
const BOOK = 'glimmer';
const figures = {};

const add = (name, title, desc, height, parts) => {
  figures[name] = svg({ title, desc, height, book: BOOK, body: parts.filter(Boolean).join('\n') });
};

/* ============================================================
   Chapter 1 - The Shape of a Game
   ============================================================ */

// 1.1 The opening argument. Left: the order is yours. Right: the order is the
// frame's, and what you write is a set of declarations it calls.
{
  const steps = [
    'scan the keypad',
    'update the repeat counter',
    'move the dot',
    'clear the framebuffer',
    'plot the dot',
    'light one matrix row',
    'jp MainLoop',
  ];
  const decl = [
    ['bind key KEY_6 rising', '-> Right'],
    ['effect MoveRight', 'on Right'],
    ['render DrawDot', 'on DotX'],
  ];
  add(
    'imperative-reactive.svg',
    'Writing a frame by hand against declaring one',
    'Two panels. On the left a hand-written frame loop listing seven ordered steps. On the right three Glimmer declarations, with the generated frame calling each one.',
    360,
    [
      caption(20, 26, 'By hand'),
      rect('bxq', 20, 38, 320, 244, 4),
      text('tb', 34, 62, 'MainLoop:'),
      ...steps.map((s, i) => text('t', 46, 88 + i * 26, s)),

      caption(380, 26, 'In Glimmer'),
      rect('bxq', 380, 38, 320, 244, 4),
      box({ x: 392, y: 60, w: 80, h: 200, title: 'the frame' }),
      ...decl.flatMap((d, i) => {
        const y = 60 + i * 74;
        return [
          rect('bx', 506, y, 182, 52, 3),
          text('ts', 518, y + 22, d[0]),
          text('ts', 518, y + 38, d[1]),
          line('none', 472, y + 26, 506, y + 26, 'ar'),
        ];
      }),

      text('dimn', 20, 306, 'You write every step, and its order.'),
      text('dimn', 380, 306, 'You declare when; the frame decides the order.'),
      text('dimn', 20, 336, 'The same program either way. What moves is the responsibility for the order.'),
    ],
  );
}

// 1.2 The reactive chain: key, pulse, effect, state change, render, pixel.
// The declaration sits above each stage and the run-time step below it, so the
// figure holds both halves of the relationship at once. This replaces the
// chapter's mermaid block.
{
  const pitch = 114;
  const colX = (i) => 24 + i * pitch;
  const decl = [
    null,
    ['pulse Right'],
    ['effect MoveRight', 'on Right', 'updates DotX'],
    ['state DotX', '= 3 changed'],
    ['render DrawDot', 'on DotX'],
    null,
  ];
  const run = ['key 6 down', 'Right', 'MoveRight', 'DotX', 'DrawDot', 'a pixel'];
  const edges = ['bind', 'on', 'updates', 'on', 'FbPlot'];
  add(
    'reactive-chain.svg',
    'One key press followed through the reactive chain',
    'Six stages in a row, key, pulse, effect, state change, render and pixel. Above each stage is the declaration that creates it; below it is the step that runs, joined by the bind, on and updates connections.',
    286,
    [
      caption(11, 40, 'What you declare'),
      ...decl.flatMap((lines, i) => {
        const bx = colX(i) - 13;
        if (!lines) {
          return [
            rect('bxq', bx, 56, 106, 62, 3),
            text('dimn', bx + 53, 92, 'hardware', 'middle'),
          ];
        }
        return [
          rect('bx', bx, 56, 106, 62, 3),
          ...lines.map((l, j) => text('ts', bx + 53, 78 + j * 16, l, 'middle')),
          pathEl('dash', `M${colX(i) + 40},118 V150`, 'arD'),
        ];
      }),

      caption(11, 142, 'What runs'),
      ...run.flatMap((label, i) => [node({ x: colX(i), y: 150, w: 80, h: 48, label, hi: i === 2 || i === 4 })]),
      ...edges.flatMap((label, i) => [
        line('none', colX(i) + 80, 174, colX(i + 1), 174, 'ar'),
        text('dimn', colX(i) + 97, 168, label, 'middle'),
      ]),

      legend(24, 232, [
        { cls: 'bxs', label: 'the code you write' },
        { cls: 'bx', label: 'the machinery' },
      ]),
      text('dimn', 24, 262, 'You never call a block. You write it, and a change to a fact schedules it.'),
    ],
  );
}

/* ============================================================
   Chapter 2 - First Light
   ============================================================ */

// 2.1 The build pipeline. The map branching back to the source is the reason
// a breakpoint set in .glim stops in .glim.
add(
  'build-pipeline.svg',
  'The two stages of a build',
  'Stage one: main.glim enters the Glimmer compiler and generated assembly comes out. Stage two: the assembler turns that file into Intel HEX, a binary and a debug map, and the map points back at the .glim source.',
  382,
  [
    rect('bxq', 24, 56, 672, 84, 5),
    caption(40, 92, 'Stage 1'),
    text('dimn', 40, 110, 'Glimmer'),
    box({ x: 130, y: 72, w: 130, h: 52, title: 'main.glim', cls: 'bxs', titleCls: 'tb' }),
    line('none', 260, 98, 310, 98, 'ar'),
    box({ x: 310, y: 72, w: 120, h: 52, title: 'glimmer', titleCls: 'tb' }),
    line('none', 430, 98, 480, 98, 'ar'),
    box({ x: 480, y: 72, w: 160, h: 52, title: 'main.main.asm', titleCls: 'tb' }),

    pathEl('none', 'M560,124 V148 H210 V178', 'ar'),

    rect('bxq', 24, 160, 672, 150, 5),
    caption(40, 196, 'Stage 2'),
    text('dimn', 40, 214, 'AZM'),
    box({ x: 130, y: 178, w: 160, h: 52, title: 'main.main.asm', titleCls: 'tb' }),
    line('none', 290, 204, 340, 204, 'ar'),
    box({ x: 340, y: 178, w: 120, h: 52, title: 'azm', titleCls: 'tb' }),
    ...[
      ['main.main.hex', 168],
      ['main.main.bin', 210],
      ['main.main.d8.json', 252],
    ].flatMap(([label, y]) => [
      rect('bx', 510, y, 150, 32, 3),
      text('ts', 585, y + 20, label, 'middle'),
      pathEl('none', `M460,204 C486,204 486,${y + 16} 510,${y + 16}`, 'ar'),
    ]),

    pathEl('sline', 'M585,284 V330 H92 V98 H124', 'arS'),
    text('dimn', 110, 326, 'the debug map names the .glim line each address came from'),

    text('dimn', 24, 358, 'Two stages, one command. The map is why a breakpoint set in .glim stops in .glim.'),
  ],
);

/* ============================================================
   Chapter 3 - State
   ============================================================ */

// 3.1 One fact beside its change flag and the blocks on either side of it,
// then the first three frames, where `changed` earns its keep.
{
  const panel = (x, head, lines, hi) => [
    rect(hi ? 'bxs' : 'bxq', x, 266, 210, 96, 4),
    text(hi ? 'tb' : 't', x + 105, 288, head, 'middle'),
    ...lines.map((l, i) => text('dimn', x + 105, 310 + i * 16, l, 'middle')),
  ];
  add(
    'change-flags.svg',
    'A fact, its change flag and the blocks around it',
    'The state DotX beside bit 0 of Changed0, with the two effects that raise it on one side and the render that watches it on the other, and a three-frame timeline of the first draw.',
    416,
    [
      caption(24, 32, 'One fact and its flag'),
      box({ x: 24, y: 48, w: 240, h: 52, title: 'state DotX', lines: ['byte = 3 changed'], titleCls: 'tb' }),
      line('sline', 264, 74, 312, 74, 'arS'),
      caption(320, 32, 'Changed0'),
      bitfield({
        x: 320,
        y: 52,
        cw: 44,
        ch: 32,
        bits: '00000001',
        marks: [7],
        names: ['', '', 'Step', 'Right', 'Left', 'Score', 'Colour', 'DotX'],
      }),

      caption(24, 140, 'Raisers and triggers'),
      rect('bx', 24, 156, 170, 56, 3),
      text('ts', 109, 178, 'effect MoveLeft', 'middle'),
      text('ts', 109, 196, 'effect MoveRight', 'middle'),
      line('none', 194, 184, 250, 184, 'ar'),
      text('dimn', 222, 176, 'updates', 'middle'),
      rect('bxs', 250, 156, 170, 56, 3),
      text('tb', 335, 180, 'DotX', 'middle'),
      text('dim', 335, 200, 'bit 0 of Changed0', 'middle'),
      line('none', 420, 184, 476, 184, 'ar'),
      text('dimn', 448, 176, 'on DotX', 'middle'),
      rect('bx', 476, 156, 180, 56, 3),
      text('ts', 566, 178, 'render DrawBeacon', 'middle'),
      text('dim', 566, 198, 'on DotX, Colour', 'middle'),

      caption(24, 250, 'The first frames'),
      ...panel(24, 'before frame 1', ['DotX holds 3', 'changed set bit 0', 'nothing has drawn yet'], false),
      ...panel(254, 'frame 1', ['dispatch tests bit 0', 'DrawBeacon runs', 'the pixel appears'], true),
      ...panel(484, 'frame 2', ['rollover cleared bit 0', 'DrawBeacon rests', 'the scan keeps it lit'], false),

      text('dimn', 24, 392, 'One bit per fact, states first and pulses after them, up to 32 of them across four banks.'),
    ],
  );
}

/* ============================================================
   Chapter 4 - Pulses and Bindings
   ============================================================ */

// 4.1 The two binding shapes against the key that produced them. The tracks
// share one frame axis, which is the only way the difference is visible.
{
  const x0 = 120;
  const fx = (f) => x0 + f * 22;
  const x1 = fx(24);
  add(
    'key-bindings.svg',
    'rising against held, on one frame axis',
    'Three tracks over the same frames: key 6 held down from frame 3 to frame 19, a rising binding firing once at frame 3, and a held binding of period 8 firing at frames 3, 11 and 19.',
    346,
    [
      caption(40, 28, 'One press, held for sixteen frames'),

      text('ts', 120, 54, 'the key itself'),
      text('dimn', 112, 84, 'key', 'end'),
      `  <polyline class="none" points="${x0},92 ${fx(3)},92 ${fx(3)},64 ${fx(19)},64 ${fx(19)},92 ${x1},92"/>`,
      text('dim', fx(3) + 8, 108, 'down'),
      text('dim', fx(19) + 8, 108, 'up'),

      text('ts', 120, 140, 'bind key KEY_6 rising -> Right'),
      text('dimn', 112, 172, 'rising', 'end'),
      line('rule', x0, 180, x1, 180),
      line('sline', fx(3), 180, fx(3), 152, 'arS'),
      text('dimn', fx(3) + 10, 166, 'one press, one pulse, however long you hold'),

      text('ts', 120, 226, 'bind key KEY_6 held period 8 -> Right'),
      text('dimn', 112, 258, 'held', 'end'),
      line('rule', x0, 266, x1, 266),
      ...[3, 11, 19].map((f) => line('sline', fx(f), 266, fx(f), 238, 'arS')),
      pathEl('none', `M${fx(3)},252 H${fx(11)}`, 'ar'),
      pathEl('none', `M${fx(11)},252 H${fx(3)}`, 'ar'),
      text('dim', fx(3) + 60, 244, 'period 8'),

      line('rule', x0, 290, x1, 290),
      ...[0, 4, 8, 12, 16, 20, 24].flatMap((f) => [
        line('rule', fx(f), 290, fx(f), 296),
        text('dim', fx(f), 310, String(f), 'middle'),
      ]),
      text('dimn', x1 + 12, 310, 'frames'),

      text('dimn', 40, 336, 'Rising is the shape of an action. Held is the shape of movement, and the period is its feel.'),
    ],
  );
}

/* ============================================================
   Chapter 5 - Compute, Effect, Render
   ============================================================ */

// 5.1 The frame, the two staging bytes and the boundary between frames. The
// three lanes underneath are the delivery rule itself: which phase may observe
// a change, and which must wait for the next frame.
{
  const phases = [
    ['scan', 'the picture', 88, 'bxq'],
    ['poll', 'the keypad', 80, 'bxq'],
    ['compute', 'derivations', 96, 'bx2'],
    ['effect', 'the rules', 88, 'bx2'],
    ['render', 'the pictures', 88, 'bx2'],
    ['rollover', 'pulses clear', 96, 'bxq'],
  ];
  const next = [['scan', 40], ['poll', 36], ['compute', 52]];
  const bounds = {};
  const band = [];
  let x = 24;
  phases.forEach(([name, note, w, cls]) => {
    band.push(rect(cls, x, 110, w, 56, 3));
    band.push(text('t', x + w / 2, 134, name, 'middle'));
    band.push(text('dimn', x + w / 2, 152, note, 'middle'));
    bounds[name] = [x, x + w];
    x += w;
  });
  let nx = 576;
  next.forEach(([name, w]) => {
    band.push(rect('bxq', nx, 110, w, 56, 3));
    band.push(text('ts', nx + w / 2, 142, name, 'middle'));
    nx += w;
  });
  const mid = (name) => (bounds[name][0] + bounds[name][1]) / 2;
  const NEXTMID = 640;

  // One lane: the same phase columns, a marker on the raising phase, and an
  // arrow to wherever that change is first observed.
  const lane = (y, from, to, label) => {
    const cells = [];
    Object.values(bounds).forEach(([a, b]) => cells.push(rect('bxq', a, y, b - a, 24, 2)));
    cells.push(rect('bxq', 576, y, 128, 24, 2));
    const fx = mid(from);
    const tx = to === 'next' ? NEXTMID : mid(to);
    cells.push(rect('bxs', fx - 9, y + 3, 18, 18, 2));
    cells.push(line('sline', fx + 12, y + 12, tx, y + 12, 'arS'));
    cells.push(text('dimn', 24, y + 44, label));
    return cells;
  };

  add(
    'the-frame.svg',
    'One frame, and where a change is delivered',
    'A frame drawn as a band of six phases: scan, poll, compute, effect, render, rollover, with a boundary before the next frame. Three lanes below show a change raised in compute landing this frame through Raised0, and changes raised in effect or render deferring to the next frame through Next0.',
    424,
    [
      text('cap', 24, 100, 'FRAME N'),
      text('cap', 576, 100, 'NEXT FRAME'),
      ...band,
      line('dash', 568, 104, 568, 338),

      ...lane(196, 'compute', 'render',
        'a compute raises: the effect and render phases see it this frame, staged in Raised0'),
      ...lane(252, 'effect', 'next',
        'an effect raises and a compute depends: the whole change defers, staged in Next0'),
      ...lane(308, 'render', 'next',
        'a render raises: every dependent sits in an earlier phase, so that change defers too'),

      text('cap', 568, 376, 'FRAME BOUNDARY', 'middle'),
      text('dimn', 24, 400, 'A change is delivered exactly once: to later phases in the same frame, otherwise in the next frame.'),
    ],
  );
}

/* ============================================================
   Chapter 6 - The 8x8 Matrix Profile
   ============================================================ */

// 6.1 The scan-shaped loop as a timing diagram. The gap is the figure's
// subject: it is the whole budget a frame's game work is spent from.
{
  const slot = 56;
  const x0 = 70;
  const rows = [];
  for (let i = 0; i < 8; i += 1) {
    rows.push(rect('bxs', x0 + i * slot, 60, slot, 30, 2));
    rows.push(text('ts', x0 + i * slot + slot / 2, 80, `row ${i}`, 'middle'));
  }
  add(
    'scan-timing.svg',
    'One frame of the matrix scan',
    'A timing diagram: eight equal row slots in which the matrix is lit, then a blank window in which polling, the phases and the rollover run. Below, one row travelling from its three framebuffer plane bytes through the colour ports and the row select to the lit row on the matrix.',
    464,
    [
      caption(70, 40, 'One frame'),
      text('dimn', 62, 80, 'matrix', 'end'),
      text('dimn', 62, 140, 'CPU', 'end'),
      ...rows,
      rect('bxq', 518, 60, 152, 30, 2),
      text('ts', 594, 80, 'dark', 'middle'),

      pathEl('none', 'M70,106 H126', 'ar'),
      pathEl('none', 'M126,106 H70', 'ar'),
      text('dim', 134, 110, 'equal dwell on every row'),

      rect('bx2', 70, 120, 448, 30, 2),
      text('t', 294, 140, 'ScanFrame', 'middle'),
      rect('bx', 518, 120, 46, 30, 2),
      text('ts', 541, 140, 'poll', 'middle'),
      rect('bx', 564, 120, 60, 30, 2),
      text('ts', 594, 140, 'phases', 'middle'),
      rect('bx', 624, 120, 46, 30, 2),
      text('ts', 647, 140, 'end', 'middle'),

      pathEl('rule', 'M70,158 V170 H518 V158'),
      text('dimn', 294, 188, 'the scan: eight rows, fixed dwell', 'middle'),
      pathEl('rule', 'M518,158 V170 H670 V158'),
      text('dimn', 594, 188, 'your game runs here', 'middle'),

      caption(70, 250, 'One row, from memory to light'),
      ...[
        ['red', '%00000000', 'out (PortRed),a'],
        ['green', '%00111100', 'out (PortGreen),a'],
        ['blue', '%00000000', 'out (PortBlue),a'],
      ].flatMap(([plane, bits, port], i) => {
        const y = 270 + i * 34;
        return [
          text('dim', 62, y + 19, plane, 'end'),
          rect(plane === 'green' ? 'bxs' : 'bx', 70, y, 150, 28, 2),
          text(plane === 'green' ? 'tb' : 't', 145, y + 19, bits, 'middle'),
          line('none', 220, y + 14, 270, y + 14, 'ar'),
          rect('bx', 270, y, 170, 28, 2),
          text('ts', 355, y + 18, port, 'middle'),
        ];
      }),
      text('dim', 62, 391, 'row 2', 'end'),
      rect('bx', 70, 372, 150, 28, 2),
      text('t', 145, 391, '%00000100', 'middle'),
      line('none', 220, 386, 270, 386, 'ar'),
      rect('bx', 270, 372, 170, 28, 2),
      text('ts', 355, 390, 'out (PortRow),a', 'middle'),

      caption(500, 250, 'The matrix'),
      ledGrid({ x: 500, y: 268, pitch: 18, r: 6, lit: (c, r) => r === 2 && c >= 2 && c <= 5 }),
      line('sline', 440, 340, 494, 340, 'arS'),

      text('dimn', 70, 220, 'Every row shines for the same count, so brightness holds. The gap is the budget the game spends.'),
      text('dimn', 70, 440, 'Three plane bytes reach three ports, the row select enables one row, and the aux byte is stepped over.'),
    ],
  );
}

// 6.2 The framebuffer, with one FbPlot call traced to the two plane bits it
// sets. x 5 is bit 2 because column 0 is bit 7.
{
  const gx = 380;
  const gy = 56;
  const cw = 62;
  const ch = 25;
  const cells = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const hi = row === 2 && col < 2;
      cells.push(rect(hi ? 'bxs' : 'bxq', gx + col * cw, gy + row * ch, cw, ch, 2));
      if (hi) cells.push(text('tb', gx + col * cw + cw / 2, gy + row * ch + 17, '$04', 'middle'));
    }
    cells.push(text('dim', gx - 8, gy + row * ch + 17, `y=${row}`, 'end'));
    cells.push(text(row === 2 ? 'cap' : 'dim', gx + 4 * cw + 8, gy + row * ch + 17, `+${row * 4}`));
  }
  add(
    'framebuffer.svg',
    'One FbPlot call traced into the framebuffer',
    'Thirty-two framebuffer bytes as eight rows of red, green, blue and aux. A call plotting x 5, y 2 in yellow sets bit 2 of the red and green bytes of row 2.',
    420,
    [
      caption(40, 26, 'One call'),
      text('t', 40, 52, 'ld b,5              ; x = 5'),
      text('t', 40, 70, 'ld c,2              ; y = 2'),
      text('t', 40, 88, 'ld a,COLOR_YELLOW   ; red + green'),
      text('t', 40, 106, 'call FbPlot'),
      pathEl('sline', 'M305,96 C345,96 345,118 374,118', 'arS'),

      caption(380, 26, 'Framebuffer, 32 bytes'),
      ...['red', 'green', 'blue', 'aux'].map((n, i) => text('dim', gx + i * cw + cw / 2, 48, n, 'middle')),
      ...cells,

      caption(40, 296, 'Row 2, red plane: one bit per column'),
      bitfield({
        x: 40,
        y: 316,
        cw: 62,
        ch: 30,
        bits: '00000100',
        marks: [5],
        names: ['col 0', 'col 1', 'col 2', 'col 3', 'col 4', 'col 5', 'col 6', 'col 7'],
      }),
      text('dimn', 552, 336, 'bit 7 is column 0'),
      text('dimn', 552, 352, 'so x = 5 sets bit 2'),

      text('dimn', 40, 396, 'Eight rows of four bytes, so a row address is Framebuffer + y * 4. The aux byte bought that.'),
    ],
  );
}

// 6.3 Colour as plane bits. The truth table is the profile's constants; the
// circles are the same seven combinations seen at once.
{
  const colours = [
    ['COLOR_RED', 1, 0, 0, '$01'],
    ['COLOR_GREEN', 0, 1, 0, '$02'],
    ['COLOR_BLUE', 0, 0, 1, '$04'],
    ['COLOR_YELLOW', 1, 1, 0, '$03'],
    ['COLOR_CYAN', 0, 1, 1, '$06'],
    ['COLOR_MAGENTA', 1, 0, 1, '$05'],
    ['COLOR_WHITE', 1, 1, 1, '$07'],
  ];
  const rows = colours.flatMap(([name, r, g, b, v], i) => {
    const y = 76 + i * 28;
    return [
      text('t', 40, y, name),
      ...[r, g, b].map((bit, j) => rect(bit ? 'sig' : 'bxq', 170 + j * 36, y - 13, 26, 18, 2)),
      text('t', 290, y, v),
    ];
  });
  add(
    'colour-planes.svg',
    'The seven colours as plane bits',
    'A table giving the red, green and blue plane bits and the byte value of each of the seven matrix colours, beside three overlapping circles whose intersections name the mixed colours.',
    316,
    [
      caption(40, 30, 'Plane bits'),
      text('dim', 183, 54, 'R', 'middle'),
      text('dim', 219, 54, 'G', 'middle'),
      text('dim', 255, 54, 'B', 'middle'),
      text('dim', 290, 54, 'value'),
      ...rows,

      caption(442, 30, 'Three planes, seven colours'),
      circle('none', 500, 130, 58),
      circle('none', 596, 130, 58),
      circle('none', 548, 206, 58),
      text('dimn', 462, 120, 'red', 'middle'),
      text('dimn', 634, 120, 'green', 'middle'),
      text('dimn', 548, 246, 'blue', 'middle'),
      text('dimn', 548, 110, 'yellow', 'middle'),
      text('dimn', 500, 190, 'magenta', 'middle'),
      text('dimn', 596, 190, 'cyan', 'middle'),
      text('nb', 548, 160, 'white', 'middle'),

      text('dimn', 40, 292, 'FbPlot ORs the plane bits, so red and then green at one place shows yellow.'),
    ],
  );
}

/* ============================================================
   Chapter 7 - Time
   ============================================================ */

// 7.1 Every way a Glimmer program can ask for a moment, on one frame axis, so
// that four separate mental models become one picture. Drip's periods, and the
// chapter's one-shot.
{
  const x0 = 90;
  const x1 = 640;
  const span = 384;
  const at = (f) => x0 + (f / span) * (x1 - x0);
  const ticks = [];
  for (let f = 24; f <= span; f += 24) {
    ticks.push(line('sline', at(f), 164, at(f), 138, 'arS'));
  }
  add(
    'time-schedules.svg',
    'Every-frame, timer, ramp and one-shot on one frame axis',
    'Four lanes over a shared axis of 384 frames: FrameCount marked changed on every frame, a timer of period 24 firing repeatedly, a ramp of 250 steps climbing then idling at its terminal value, and a one-shot counting down to a single firing.',
    474,
    [
      caption(40, 28, 'Four schedules on one frame axis'),

      text('ts', 90, 54, 'on FrameCount'),
      rect('bxs', x0, 64, x1 - x0, 22, 2),
      text('ts', (x0 + x1) / 2, 79, 'FrameCount is marked changed on every frame', 'middle'),
      text('dimn', 648, 80, 'every frame'),

      text('ts', 90, 122, 'timer Fall : byte = 24 -> FallTick'),
      line('rule', x0, 164, x1, 164),
      ...ticks,
      text('dimn', 648, 142, 'forever'),

      text('ts', 90, 200, 'ramp Heat : byte steps 250 -> HeatUp'),
      line('rule', x0, 266, x1, 266),
      `  <polyline class="sline" points="${x0},266 ${at(249).toFixed(2)},218 ${x1},218"/>`,
      line('sline', at(249), 212, at(249), 192, 'arS'),
      text('dimn', 455, 198, 'HeatUp fires on arrival'),
      text('dimn', 648, 222, 'idle at 249'),
      text('dimn', 98, 284, 'marked changed at every step'),

      text('ts', 90, 310, 'timer Grace : word = 384 -> GraceOver once'),
      line('rule', x0, 376, x1, 376),
      line('sline', x0, 328, x1, 376),
      line('sline', x1, 372, x1, 346, 'arS'),
      text('dimn', 648, 350, 'GraceOver'),
      text('dimn', 98, 360, 'the cell is the countdown'),

      line('rule', x0, 400, x1, 400),
      ...[0, 96, 192, 288, 384].flatMap((f) => [
        line('rule', at(f), 400, at(f), 406),
        text('dim', at(f), 420, String(f), 'middle'),
      ]),
      text('dimn', 648, 420, 'frames'),

      text('dimn', 40, 450, 'A timer repeats. A one-shot arrives once. A ramp marks its cell changed at every step, then fires.'),
    ],
  );
}

/* ============================================================
   Chapter 8 - Motion Curves
   ============================================================ */

/**
 * The compiler's easing functions, copied from the Glimmer generator so the
 * plotted shapes and the tables printed in the chapter come from one source.
 * t and the result both run 0 to 1, except for the last two, which leave the
 * range on purpose.
 */
const OVERSHOOT_C1 = 1.70158;
const OVERSHOOT_C3 = OVERSHOOT_C1 + 1;
const EASE = {
  linear: (t) => t,
  ease_in: (t) => t * t,
  ease_out: (t) => 1 - (1 - t) * (1 - t),
  ease_in_out: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  sine: (t) => (1 - Math.cos(Math.PI * t)) / 2,
  overshoot: (t) => 1 + OVERSHOOT_C3 * (t - 1) ** 3 + OVERSHOOT_C1 * (t - 1) ** 2,
  anticipation: (t) => OVERSHOOT_C3 * t * t * t - OVERSHOOT_C1 * t * t,
};

// 8.1 The seven presets as a small multiple. The dashed diagonal in each panel
// is the linear run, so every bend is read against it, and the two presets
// that leave the from..to range have their excursion marked.
{
  const pw = 150;
  const ph = 90;
  const row1 = ['linear', 'ease_in', 'ease_out', 'ease_in_out'];
  const row2 = ['sine', 'overshoot', 'anticipation'];
  // The stationary point of both out-of-range presets, from the derivative.
  const peakT = (2 * OVERSHOOT_C1) / (3 * OVERSHOOT_C3);
  add(
    'motion-presets.svg',
    'The seven motion-curve presets',
    'Seven small plots with the step count on the x axis and position on the y: linear, ease_in, ease_out, ease_in_out, sine, overshoot and anticipation, each against a dashed straight run.',
    388,
    [
      caption(40, 30, 'Seven presets: ramp step across, curve output up'),
      text('dim', 34, 70, 'to', 'end'),
      text('dim', 34, 158, 'from', 'end'),
      ...row1.flatMap((name, i) =>
        plot({ x: 40 + i * 170, y: 64, w: pw, h: ph, f: EASE[name], label: name, samples: 64 })),
      ...row2.flatMap((name, i) =>
        plot({ x: 40 + i * 170, y: 214, w: pw, h: ph, f: EASE[name], samples: 64 })),
      ...row2.map((name, i) => text('ts', 40 + i * 170 + pw / 2, 328, name, 'middle')),

      // overshoot peaks above `to`, anticipation dips below `from`.
      circle('sig', 210 + (1 - peakT) * pw, 214 + ph - EASE.overshoot(1 - peakT) * ph, 3.5),
      circle('sig', 380 + peakT * pw, 214 + ph - EASE.anticipation(peakT) * ph, 3.5),

      caption(548, 232, 'Headroom'),
      text('dimn', 548, 256, 'overshoot runs past to,'),
      text('dimn', 548, 272, 'anticipation dips below'),
      text('dimn', 548, 288, 'from, so leave a column'),
      text('dimn', 548, 304, 'spare at that end.'),

      text('dimn', 40, 364, 'The compiler traces the shape at build time and writes one byte per step. The Z80 reads the table.'),
    ],
  );
}

// 8.2 The idiom: the ramp keeps time, the table holds the path, and a compute
// block is where the two meet.
{
  // The real tables, built with the compiler's own arithmetic.
  const table = (preset) => Array.from({ length: 64 }, (_, i) =>
    Math.max(0, Math.min(255, Math.round(EASE[preset](i / 63) * 6))));
  const px = (i) => 40 + i * 10;
  const py = (v) => 422 - (v / 7) * 112;
  const stair = (cls, values) => {
    const pts = [];
    values.forEach((v, i) => { pts.push(`${px(i)},${py(v)}`); pts.push(`${px(i + 1)},${py(v)}`); });
    return `  <polyline class="${cls}" points="${pts.join(' ')}"/>`;
  };
  const straight = table('linear');
  const spring = table('overshoot');
  const stepPlot = [
    rect('bxq', 40, 310, 640, 112, 3),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((v) => text('dim', 32, py(v) + 4, String(v), 'end')),
    stair('dash', straight),
    stair('none', table('ease_out')),
    stair('sline', spring),
    line('dash', px(24), 310, px(24), 422),
    line('sline', px(24), py(straight[24]) - 4, px(24), py(spring[24]) + 6, 'arS'),
    text('dimn', px(24) + 8, 330, 'press PLUS at step 24 and the dot jumps to the new path'),
    ...[0, 16, 32, 48, 63].map((i) => text('dim', px(i), 440, String(i), 'middle')),
    text('dimn', 40, 462, 'ramp step'),
    legend(150, 462, [
      { cls: 'bxq', label: 'Straight, linear' },
      { cls: 'bx', label: 'Glide, ease_out' },
      { cls: 'bxs', label: 'Spring, overshoot' },
    ]),
  ];
  add(
    'ramp-and-curve.svg',
    'The ramp is the clock, the curve is the path',
    'A ramp feeding a step number into a compute block and a curve table feeding the same block, the byte read at that step becoming the position CometX, and the three real tables plotted as staircases with a switch of curve mid-flight.',
    514,
    [
    caption(40, 46, 'The clock'),
    caption(510, 46, 'The path'),
    box({ x: 40, y: 60, w: 190, h: 64, title: 'ramp Travel', lines: ['steps 64 -> Landed', 'one step per frame'], titleCls: 'tb' }),
    box({ x: 290, y: 60, w: 160, h: 64, title: 'TrackComet', lines: ['a compute block'], titleCls: 'tb' }),
    box({ x: 510, y: 60, w: 190, h: 64, title: 'curve Glide', lines: ['ease_out steps 64', 'from 0 to 6'], titleCls: 'tb' }),
    line('none', 230, 92, 290, 92, 'ar'),
    line('none', 510, 92, 450, 92, 'ar'),
    text('dimn', 260, 84, 'the step', 'middle'),
    text('dimn', 480, 84, 'one byte', 'middle'),

    caption(40, 152, 'Curve_Glide, one byte per step'),
    strip({
      x: 40,
      y: 176,
      cw: 56,
      ch: 30,
      base: 16,
      addrFmt: (a) => String(a),
      cells: [
        { v: '3' }, { v: '3' }, { v: '3' }, { v: '3' },
        { v: '3', hi: true, sub: 'Travel = 20' }, { v: '3' }, { v: '3' }, { v: '4' },
      ],
    }),
    line('sline', 496, 192, 540, 192, 'arS'),
    box({ x: 540, y: 174, w: 140, h: 36, title: 'CometX = 3', titleCls: 'tb' }),
    text('dimn', 540, 230, 'the column to plot'),

    caption(40, 290, 'The three tables, plotted'),
    ...stepPlot,

    text('dimn', 40, 490, 'The ramp knows nothing about columns and the table knows nothing about frames.'),
  ],
);
}

/* ============================================================
   Chapter 9 - Shapes, Sound and Displays on the Board
   ============================================================ */

// 9.1 Where each kind of output goes. One row per instrument: what you declare
// on the left, the call in the middle, the hardware on the right, and the
// keypad running the other way.
{
  const arrow = (y, label) => [
    line('none', 214, y, 350, y, 'ar'),
    text('ts', 282, y - 8, label, 'middle'),
  ];
  add(
    'board-instruments.svg',
    'Four kinds of output, four instruments',
    'A shape reaching the 8x8 matrix through ShapeDraw, a sound cue reaching the speaker through Snd_Bounce, a score reaching the seven-segment display through HudWriteU16, a text resource reaching the LCD through lcd_row, and the keypad reaching a pulse through the poll.',
    570,
    [
      caption(24, 40, 'In your program'),
      caption(350, 40, 'On the board'),

      box({ x: 24, y: 60, w: 190, h: 52, title: 'shape Spark', lines: ['color cyan, 2x2'], titleCls: 'tb' }),
      ...arrow(86, 'call ShapeDraw'),
      ledGrid({ x: 350, y: 56, pitch: 18, r: 6, lit: (c, r) => c >= 3 && c <= 4 && r >= 3 && r <= 4 }),
      text('nb', 510, 84, '8x8 RGB matrix'),
      text('dimn', 510, 104, '64 pixels, three planes'),

      box({ x: 24, y: 216, w: 190, h: 52, title: 'sound Bounce', lines: ['len 8 div 3'], titleCls: 'tb' }),
      ...arrow(242, 'call Snd_Bounce'),
      circle('none', 382, 242, 20),
      circle('bx2', 382, 242, 9),
      pathEl('none', 'M410,230 Q419,242 410,254'),
      pathEl('none', 'M420,224 Q433,242 420,260'),
      text('nb', 510, 238, 'speaker'),
      text('dimn', 510, 258, 'one port bit, tapped by the scan'),

      box({ x: 24, y: 284, w: 190, h: 52, title: 'Score in HL', lines: ['a word fact'], titleCls: 'tb' }),
      ...arrow(310, 'call HudWriteU16'),
      ...'000042'.split('').flatMap((d, i) => [
        rect('bx', 350 + i * 34, 288, 34, 46, 2),
        text('t', 367 + i * 34, 317, d, 'middle'),
      ]),
      text('nb', 570, 306, 'seven-segment'),
      text('dimn', 570, 326, 'six digits'),

      box({ x: 24, y: 352, w: 190, h: 52, title: 'text MsgHello', lines: ['"FANFARE"'], titleCls: 'tb' }),
      ...arrow(378, 'lcd_row'),
      rect('bx', 350, 352, 220, 68, 3),
      text('ts', 362, 380, 'FANFARE'),
      text('ts', 362, 402, 'LIVES 3'),
      text('nb', 590, 382, '20x4 LCD'),

      box({ x: 24, y: 436, w: 190, h: 52, title: 'pulse Right', lines: ['bind key KEY_6'], titleCls: 'tb' }),
      line('none', 350, 462, 214, 462, 'ar'),
      text('ts', 282, 454, 'GlimPollBindings', 'middle'),
      ...['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'].flatMap((k, i) => {
        const kx = 350 + (i % 4) * 20;
        const ky = 436 + Math.floor(i / 4) * 20;
        return [
          rect(k === '6' ? 'bxs' : 'bx', kx, ky, 17, 17, 2),
          text('dim', kx + 8.5, ky + 12, k, 'middle'),
        ];
      }),
      text('nb', 450, 470, 'hex keypad'),
      text('dimn', 450, 490, 'one key at a time'),

      text('dimn', 24, 546, 'Every instrument is reached by a call the profile generated, and the keypad reaches you the same way.'),
    ],
  );
}

/* ============================================================
   Chapter 10 - Arrays and Layout Types
   ============================================================ */

// 10.1 The picture as state. Eight row masks on one side, the pixels they
// produce on the other, with one byte traced across.
{
  const masks = [0b00011000, 0b00111100, 0b01111110, 0b11111111, 0b11111111, 0b01111110, 0b00111100, 0b00011000];
  const bin = (n) => `%${n.toString(2).padStart(8, '0')}`;
  add(
    'picture-as-state.svg',
    'Eight row masks and the pixels they light',
    'Eight bytes of the Picture array, each a row mask, beside the 8x8 matrix showing the diamond they light, with the third byte traced to its row.',
    380,
    [
      caption(40, 30, 'Picture: eight bytes'),
      ...masks.flatMap((m, i) => {
        const y = 52 + i * 34;
        return [
          text('dim', 32, y + 20, `+${i}`, 'end'),
          rect(i === 2 ? 'bxs' : 'bx', 40, y, 150, 30, 2),
          text(i === 2 ? 'tb' : 't', 115, y + 20, bin(m), 'middle'),
        ];
      }),

      caption(380, 30, 'The lit pixels'),
      ledGrid({
        x: 380,
        y: 52,
        pitch: 34,
        r: 13,
        lit: (c, r) => ((masks[r] >> (7 - c)) & 1) === 1,
      }),

      line('sline', 198, 137, 372, 137, 'arS'),
      text('dimn', 285, 130, 'one byte, one row', 'middle'),

      text('dimn', 40, 356, 'Sixty-four pixels under one name and one flag. Each mask drops into the green plane of its row.'),
    ],
  );
}

// 10.2 The two shapes state can take, and the arithmetic that lands on one
// byte of one record in a table of them.
{
  const fields = [
    ['pos', 2], ['speed', 1], ['score', 2], ['frames', 4], ['tile', 2],
  ];
  const rec = [];
  let fx = 300;
  fields.forEach(([name, n]) => {
    const w = n * 34;
    rec.push(pathEl('rule', `M${fx + 2},220 V230 H${fx + w - 2} V220`));
    rec.push(text('dimn', fx + w / 2, 246, name, 'middle'));
    fx += w;
  });
  add(
    'record-layout.svg',
    'An array, a layout record, and the byte the arithmetic lands on',
    'The eight bytes of a byte array with one index marked, the two fields of a Point, the eleven bytes of a Sprite with each field bracketed, and two Sprite records with base plus index times sizeof plus offset landing on one byte.',
    468,
    [
      caption(24, 32, 'state Picture : byte[8]'),
      strip({
        x: 24,
        y: 56,
        cw: 76,
        ch: 32,
        base: 0,
        addrFmt: (a) => `+${a}`,
        cells: [{}, {}, {}, { hi: true, sub: 'the cursor row' }, {}, {}, {}, {}],
      }),
      text('dimn', 24, 124, 'One name, one change flag, and the index is the row.'),

      caption(24, 164, 'type Point'),
      strip({
        x: 24,
        y: 188,
        cw: 110,
        ch: 32,
        cells: [{ v: 'x', sub: 'offset x = 0' }, { v: 'y', sub: 'offset y = 1' }],
      }),

      caption(300, 164, 'type Sprite'),
      strip({ x: 300, y: 188, cw: 34, ch: 32, cells: Array.from({ length: 11 }, () => ({})) }),
      ...rec,
      pathEl('rule', 'M300,258 V268 H674 V258'),
      text('dimn', 487, 284, 'sizeof(Sprite) = 11', 'middle'),

      caption(24, 320, 'A table of records'),
      text('dim', 189, 336, 'record 0', 'middle'),
      text('dim', 519, 336, 'record 1', 'middle'),
      strip({
        x: 24,
        y: 344,
        cw: 30,
        ch: 32,
        cells: Array.from({ length: 22 }, (_, i) => ({ hi: i === 13 })),
      }),
      line('none', 354, 340, 354, 380),
      line('sline', 429, 404, 429, 380, 'arS'),
      text('t', 24, 412, 'Hero + 1 * sizeof(Sprite) + offset(Sprite, speed)'),

      text('dimn', 24, 444, 'Write the offsets as offsets and they follow the layout when it grows, without your touching a line.'),
    ],
  );
}

/* ============================================================
   Chapter 11 - Dependency Reports and Debugging
   ============================================================ */

// 11.1 The dependency report as a graph, with the chapter's two deliberate
// bugs marked on it: a write whose header never declared it, and a register
// trusted across a call that clobbers it.
{
  const mark = (x, y, n) => [circle('sig', x, y, 10), text('inv', x, y + 4.5, n, 'middle')];
  add(
    'dependency-graph.svg',
    'Canvas as a dependency graph, with two faults marked',
    'Raisers on the left, facts in the centre, triggered blocks on the right. The edge from PaintPixel to Marks is broken because the header stopped declaring it, and DrawCanvas carries a register-contract error on a call to FbPlot.',
    404,
    [
      caption(24, 32, 'Raised by'),
      caption(276, 32, 'Facts'),
      caption(500, 32, 'Triggers'),

      rect('bx', 24, 48, 190, 64, 3),
      text('ts', 119, 70, 'four move effects', 'middle'),
      text('dim', 119, 90, 'MoveUp .. MoveRight', 'middle'),
      rect('bx', 24, 140, 190, 44, 3),
      text('ts', 119, 167, 'effect PaintPixel', 'middle'),

      rect('bx', 276, 48, 180, 44, 3),
      text('t', 366, 75, 'Cursor : Point', 'middle'),
      rect('bx', 276, 112, 180, 44, 3),
      text('t', 366, 139, 'Picture : byte[8]', 'middle'),
      rect('bxs', 276, 176, 180, 44, 3),
      text('tb', 366, 203, 'Marks : byte', 'middle'),
      text('dim', 276, 240, 'raised by: (nothing)'),

      rect('bx', 500, 66, 190, 44, 3),
      text('t', 595, 93, 'render DrawCanvas', 'middle'),
      text('dim', 500, 128, 'inc b after call FbPlot'),
      rect('bx', 500, 176, 190, 44, 3),
      text('t', 595, 203, 'render ShowMarks', 'middle'),

      pathEl('none', 'M214,80 C246,80 246,70 276,70', 'ar'),
      pathEl('none', 'M214,162 C246,162 246,134 276,134', 'ar'),
      pathEl('dash', 'M214,168 C246,168 246,198 268,198'),
      pathEl('none', 'M456,70 C480,70 480,88 500,88', 'ar'),
      pathEl('none', 'M456,134 C480,134 480,88 500,88', 'ar'),
      pathEl('none', 'M456,198 C480,198 480,198 500,198', 'ar'),

      ...mark(252, 198, '1'),
      ...mark(690, 66, '2'),

      caption(24, 268, 'What the tools say'),
      ...mark(34, 288, '1'),
      text('ts', 54, 292, '[GLIM] warning: PaintPixel writes Marks but does not declare "updates Marks"'),
      ...mark(34, 322, '2'),
      text('ts', 54, 326, '[AZMN_REGISTER_CONTRACTS] error: CALL FbPlot may modify B, but the'),
      text('ts', 54, 344, 'pre-call value is used later.'),

      text('dimn', 24, 380, 'Name the fact that should have changed, walk up to its raisers and down to its triggers.'),
    ],
  );
}

/* ============================================================
   Chapter 12 - Routines, Parts and Imports
   ============================================================ */

// 12.1 Three files and one program. The exported labels are the doors through
// the module wall, and a module named by two imports is placed once.
add(
  'file-composition.svg',
  'Three files, one generated program',
  'An entry file declaring a routine, a part holding the blocks and an imported assembly module with two exported labels and one private one, all gathered into a single generated file.',
  576,
  [
    caption(24, 32, 'The files you write'),

    rect('bxs', 24, 48, 210, 150, 4),
    text('tb', 36, 72, 'canvas.glim'),
    ...[
      'program Canvas',
      'import "paint-lib.asm"',
      'type Point, state',
      'bind key ...',
      'routine CursorSpot',
      'part "canvas-rules.glim"',
    ].map((l, i) => text('ts', 36, 96 + i * 18, l)),

    rect('bx', 24, 240, 210, 120, 4),
    text('tb', 36, 264, 'canvas-rules.glim'),
    ...[
      'effect StampPixel',
      'effect ErasePixel',
      'render DrawCanvas',
      'render ShowCount',
    ].map((l, i) => text('ts', 36, 288 + i * 18, l)),

    rect('bx', 24, 390, 210, 130, 4),
    text('tb', 36, 414, 'paint-lib.asm'),
    rect('bxs', 36, 424, 150, 24, 2),
    text('ts', 111, 440, '@ShowPaint', 'middle'),
    rect('bxs', 36, 452, 150, 24, 2),
    text('ts', 111, 468, '@CountLit', 'middle'),
    rect('bxq', 36, 480, 150, 24, 2),
    text('dim', 111, 496, 'CountByte', 'middle'),

    rect('bx', 290, 140, 210, 190, 4),
    text('tb', 302, 166, 'canvas.main.asm'),
    ...[
      'the runtime loop',
      'the dispatchers',
      'your blocks, wrapped',
      'CursorSpot',
      'the imported module',
      'the profile library',
    ].map((l, i) => text('ts', 302, 190 + i * 22, l)),
    pathEl('none', 'M234,123 C262,123 262,175 290,175', 'ar'),
    pathEl('none', 'M234,300 C262,300 262,235 290,235', 'ar'),
    pathEl('none', 'M234,455 C262,455 262,295 290,295', 'ar'),

    caption(520, 150, 'The @ boundary'),
    text('dimn', 520, 174, 'A label wearing @ is'),
    text('dimn', 520, 190, 'callable from any block'),
    text('dimn', 520, 206, 'in any file. A plain label'),
    text('dimn', 520, 222, 'stays private to its own.'),

    caption(520, 270, 'Imported twice'),
    text('dimn', 520, 294, 'A second import of the'),
    text('dimn', 520, 310, 'same module places no'),
    text('dimn', 520, 326, 'second copy of its bytes.'),

    text('dimn', 24, 552, 'None of the three changes what the Z80 runs. They change what you find when you come back.'),
  ],
);

/* ============================================================
   Chapter 13 - Cards
   ============================================================ */

// 13.1 Gate's three cards and the conditions on each transition. This replaces
// the chapter's mermaid block.
add(
  'card-machine.svg',
  'Three cards joined in a loop',
  'Splash leads to Playing on any key, Playing leads to GameOver when the clock reaches zero, and GameOver returns to Splash on any key once the restart gate is open.',
  298,
  [
    caption(60, 40, 'Gate: three cards, one loop'),
    text('cap', 16, 106, 'START'),
    line('sline', 24, 120, 56, 120, 'arS'),

    node({ x: 60, y: 90, w: 160, h: 60, label: 'Splash', hi: true }),
    node({ x: 280, y: 90, w: 160, h: 60, label: 'Playing' }),
    node({ x: 500, y: 90, w: 160, h: 60, label: 'GameOver' }),
    text('dimn', 140, 170, 'enter ShowSplash', 'middle'),
    text('dimn', 360, 170, 'enter StartRound', 'middle'),
    text('dimn', 580, 170, 'enter ShowFinal', 'middle'),

    line('none', 220, 120, 280, 120, 'ar'),
    text('ts', 250, 110, 'AnyKeyP', 'middle'),
    text('ts', 250, 142, 'goto', 'middle'),
    line('none', 440, 120, 500, 120, 'ar'),
    text('ts', 470, 110, 'TimeUp', 'middle'),
    text('ts', 470, 142, 'goto', 'middle'),

    pathEl('none', 'M580,150 V210 H140 V150', 'ar'),
    text('dimn', 360, 226, 'AnyKeyP, once the gate is open', 'middle'),
    text('dimn', 360, 242, 'writes CurrentCard directly', 'middle'),

    text('dimn', 60, 274, 'CurrentCard is the next-card register, and the first declared card is where the program starts.'),
  ],
);

// 13.2 The frame a goto is requested in, and the frame the new card wakes on.
{
  const seg = [['poll', 60], ['latch', 64], ['logic', 74], ['render', 70], ['end', 58]];
  const band = (x0, hiIndex) => {
    const out = [];
    let x = x0;
    seg.forEach(([name, w], i) => {
      out.push(rect(i === hiIndex ? 'bxs' : 'bxq', x, 86, w, 44, 3));
      out.push(text('ts', x + w / 2, 113, name, 'middle'));
      x += w;
    });
    return out;
  };
  add(
    'card-transition.svg',
    'A goto asked for mid-frame, granted at the boundary',
    'Two frames side by side. In the first, the logic phase runs a goto and stages the card change in Next1. The second frame latches the new active card at its start and runs the entering card first.',
    356,
    [
      caption(24, 40, 'A goto lands at the next frame boundary'),
      text('cap', 24, 74, 'FRAME N'),
      text('cap', 370, 74, 'FRAME N+1'),
      ...band(24, 2),
      ...band(370, 1),
      line('dash', 360, 80, 360, 240),

      text('dim', 116, 150, 'active card: Splash', 'middle'),
      text('dim', 462, 150, 'active card: Playing', 'middle'),

      line('rule', 185, 130, 185, 166),
      text('dimn', 185, 178, 'StartGame runs goto Playing', 'middle'),
      pathEl('sline', 'M185,196 C185,232 462,232 462,172', 'arS'),
      text('dimn', 323, 250, 'CurrentCard changed, staged in Next1', 'middle'),

      text('dimn', 24, 286, 'Splash stays active for the rest of its frame: its blocks finish and its pulses clear at the end.'),
      text('dimn', 24, 302, 'Playing wakes at the next frame start, enter blocks first, with a quiet keypad.'),

      text('dimn', 24, 332, 'Dispatch gates never test CurrentCard. They test GlimActiveCard, latched once at the top of the loop.'),
    ],
  );
}

// 13.3 What a card section costs a block: the same flag test with one card
// comparison in front, and every other card's blocks skipped.
{
  const column = (x, card, blocks, active) => {
    const out = [
      rect(active ? 'bxs' : 'bxq', x, 64, 190, 32, 3),
      text(active ? 'tb' : 'dim', x + 95, 85, `card ${card}`, 'middle'),
    ];
    blocks.forEach((b, i) => {
      const y = 108 + i * 36;
      out.push(rect(active ? 'bx' : 'bxq', x, y, 190, 28, 2));
      out.push(text(active ? 'ts' : 'dim', x + 95, y + 19, b, 'middle'));
    });
    return out;
  };
  add(
    'dispatch-gating.svg',
    'Only the active card dispatches',
    'Three columns of blocks under their cards. The Playing column is active and its blocks dispatch; the Splash and GameOver columns are greyed, and their blocks are skipped whatever their change flags say.',
    414,
    [
      caption(40, 36, 'GlimActiveCard = Card.Playing'),
      ...column(40, 'Splash', ['enter ShowSplash', 'effect BlinkPrompt', 'render DrawPrompt', 'effect StartGame'], false),
      ...column(250, 'Playing', ['enter StartRound', 'effect ScorePoint', 'render ShowScore', 'render DrawClock', 'effect EndRound'], true),
      ...column(460, 'GameOver', ['enter ShowFinal', 'render FinalBar', 'effect OpenGate', 'effect Restart'], false),

      text('ts', 40, 320, 'ld   a,(GlimActiveCard)'),
      text('ts', 40, 338, 'cp   Card.Playing'),
      text('ts', 40, 356, 'jr   nz,_skip_ScorePoint'),
      text('dimn', 330, 330, 'Three instructions in front of'),
      text('dimn', 330, 346, 'the familiar flag test: what a'),
      text('dimn', 330, 362, 'block pays to belong to a card.'),

      text('dimn', 40, 390, 'A pulse that fires while its listener is gated off clears at frame end, heard by nobody.'),
    ],
  );
}

/* ============================================================
   Chapter 14 - A Small Matrix Game
   ============================================================ */

// 14.1 Skyfall mid-round. The book builds this game and never shows it.
add(
  'skyfall-play.svg',
  'Skyfall in play',
  'The 8x8 matrix mid-round: a block falling in column 5, the three-pixel paddle at PadX 4 covering columns 4 to 6, the score on the seven-segment display and the lives on the LCD.',
  424,
  [
    caption(40, 44, '8x8 matrix'),
    ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [
      text('dim', 59 + i * 38, 62, String(i), 'middle'),
      text('dim', 32, 94 + i * 38, String(i), 'end'),
    ]),
    ledGrid({
      x: 40,
      y: 70,
      pitch: 38,
      r: 14,
      lit: (c, r) => (c === 5 && r === 3) || (r === 7 && c >= 4 && c <= 6),
      colour: (c, r) => (r === 7 ? 'bx2' : 'sig'),
    }),

    caption(380, 74, 'Score, seven-segment'),
    ...'000007'.split('').flatMap((d, i) => [
      rect('bx', 380 + i * 34, 86, 34, 48, 2),
      text('t', 397 + i * 34, 116, d, 'middle'),
    ]),

    caption(380, 154, 'LCD'),
    rect('bx', 380, 166, 260, 64, 3),
    text('ts', 392, 192, 'CATCH THE BLOCKS'),
    text('ts', 392, 214, 'LIVES 3'),

    text('dimn', 380, 262, 'the drop falls one row every Gravity frames'),
    text('dimn', 380, 282, 'the paddle slides on held 4 and 6'),
    text('dimn', 380, 302, 'caught when DropX minus PadX is under 3'),

    legend(380, 336, [
      { cls: 'sig', label: 'the drop, yellow' },
      { cls: 'bx2', label: 'the paddle, green' },
    ]),

    text('dimn', 40, 400, 'Every catch scores, chirps and writes Gravity one smaller. Three misses end the round.'),
  ],
);

// 14.2 The design tables from the head of the chapter, drawn as the skeleton
// they are: settle these and every block that remains is a small exercise.
{
  const chip = (x, y, w, main, side) => [
    rect('bx', x, y, w, 30, 3),
    text('ts', x + 12, y + 20, main),
    side ? text('dim', x + w - 12, y + 20, side, 'end') : '',
  ];
  add(
    'skyfall-design.svg',
    'Skyfall as declarations before it is code',
    'The facts, the moments with their sources, the two schedules and the three cards, laid out as the game skeleton the chapter designs on paper before any block is written.',
    384,
    [
      caption(30, 56, 'Facts'),
      ...['PadX  : byte', 'DropX : byte', 'DropY : byte', 'Score : word', 'Lives : byte', 'Armed : byte']
        .flatMap((f, i) => chip(30, 70 + i * 38, 210, f, '')),

      caption(270, 56, 'Moments'),
      ...[
        ['LeftP', 'held 4'],
        ['RightP', 'held 6'],
        ['FallTick', 'timer Gravity'],
        ['AnyKeyP', 'key any'],
        ['GateP', 'timer Wait'],
      ].flatMap(([m, src], i) => chip(270, 70 + i * 38, 190, m, src)),

      caption(490, 56, 'Schedules'),
      ...chip(490, 70, 200, 'timer Gravity : 18', ''),
      ...chip(490, 108, 200, 'timer Wait : once', ''),
      caption(490, 168, 'Cards'),
      ...chip(490, 182, 200, 'card Splash', ''),
      ...chip(490, 220, 200, 'card Playing', ''),
      ...chip(490, 258, 200, 'card GameOver', ''),

      caption(30, 290, 'Resources'),
      text('dimn', 30, 312, 'shape Paddle, sound Catch and Miss, six text strings'),

      text('dimn', 30, 340, 'Six facts, five moments and CurrentCard: twelve of the 32 change-flag cells, with room to spare.'),
      text('dimn', 30, 364, 'Settle these and the skeleton stands. Every block that remains has one job you have already named.'),
    ],
  );
}

/* ============================================================
   Chapter 15 - Reading Tetro
   ============================================================ */

// 15.1 The seven pieces as the declarations draw them, and one piece through
// its four rotations with the bytes the first one became.
{
  const pieces = [
    ['PieceI', 'cyan', ['...', 'XXX']],
    ['PieceO', 'white', ['XX', 'XX']],
    ['PieceT', 'magenta', ['XXX', '.X.']],
    ['PieceS', 'green', ['XX.', '.XX']],
    ['PieceZ', 'red', ['.XX', 'XX.']],
    ['PieceJ', 'blue', ['..X', 'XXX']],
    ['PieceL', 'yellow', ['X..', 'XXX']],
  ];
  const rots = [
    ['rot0', ['XX.', '.XX']],
    ['rot1', ['.X', 'XX', 'X.']],
    ['rot2', ['...', 'XX.', '.XX']],
    ['rot3 = rot1', ['.X', 'XX', 'X.']],
  ];
  const grid = (x, y, cell, rows, span) => {
    const out = [];
    for (let r = 0; r < span; r += 1) {
      for (let c = 0; c < span; c += 1) {
        const on = rows[r] && rows[r][c] === 'X';
        out.push(rect(on ? 'bxs' : 'bxq', x + c * cell, y + r * cell, cell, cell, 1));
      }
    }
    return out;
  };
  add(
    'tetro-pieces.svg',
    'The seven pieces, and one of them turning',
    'The seven Tetro pieces drawn on square grids as their declarations draw them, then the S piece through its four rotations, the fourth an alias of the second, beside the four bytes the first rotation became.',
    380,
    [
      caption(40, 40, 'Seven pieces, seven declarations'),
      ...pieces.flatMap(([name, colour, rows], i) => {
        const x = 40 + i * 94;
        return [
          ...grid(x, 56, 22, rows, 3),
          text('ts', x + 33, 140, name, 'middle'),
          text('dim', x + 33, 158, colour, 'middle'),
        ];
      }),

      caption(40, 200, 'PieceS, four quarter turns'),
      ...rots.flatMap(([label, rows], i) => {
        const x = 40 + i * 120;
        return [
          ...grid(x, 216, 20, rows, 4),
          text('ts', x + 40, 314, label, 'middle'),
          i < 3 ? line('none', x + 84, 256, x + 116, 256, 'ar') : '',
        ];
      }),

      caption(540, 200, 'ShapeRot_PieceS_0'),
      text('t', 540, 234, '%11000000'),
      text('t', 540, 254, '%01100000'),
      text('t', 540, 274, '%00000000'),
      text('t', 540, 294, '%00000000'),

      text('dimn', 40, 350, 'Rotating in play is CurRotation plus one, masked to two bits. The pointer table holds the aliases.'),
    ],
  );
}

// 15.2 The board as four byte arrays: one occupancy bitmap for collision and
// three colour planes that reach the framebuffer as one OR per row.
{
  const rows = [
    [0b00000000, 0b00000000, 0b00000000, 0b00000000],
    [0b00000000, 0b00000000, 0b00000000, 0b00000000],
    [0b00000000, 0b00000000, 0b00000000, 0b00000000],
    [0b00000000, 0b00000000, 0b00000000, 0b00000000],
    [0b00000000, 0b00000000, 0b00000000, 0b00000000],
    [0b00000000, 0b00000000, 0b00000000, 0b00000000],
    [0b00111100, 0b00111100, 0b00000000, 0b00000000],
    [0b11111111, 0b11000000, 0b00111100, 0b00000011],
  ];
  const bin = (n) => `%${n.toString(2).padStart(8, '0')}`;
  add(
    'tetro-board.svg',
    'The settled board as four byte arrays',
    'The 8x8 matrix beside BoardRows, BoardRed, BoardGreen and BoardBlue, one byte per row each, with the full bottom row reading all ones in the occupancy array.',
    370,
    [
      caption(40, 44, 'The board'),
      ledGrid({
        x: 40,
        y: 58,
        pitch: 26,
        r: 9,
        lit: (c, r) => ((rows[r][0] >> (7 - c)) & 1) === 1,
        colour: (c, r) => (r === 7 ? 'sig' : 'bx2'),
      }),

      ...['BoardRows', 'BoardRed', 'BoardGreen', 'BoardBlue'].map((n, i) =>
        text('ts', 280 + i * 104 + 50, 44, n, 'middle')),
      ...rows.flatMap((row, r) =>
        row.map((v, i) => {
          const x = 280 + i * 104;
          const y = 58 + r * 26;
          const hi = i === 0 && r === 7;
          return [
            rect(hi ? 'bxs' : v === 0 ? 'bxq' : 'bx', x, y, 100, 26, 1),
            text(hi ? 'tb' : v === 0 ? 'dim' : 't', x + 50, y + 18, bin(v), 'middle'),
          ].join('\n');
        })),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((r) => text('dim', 272, 76 + r * 26, String(r), 'end')),

      text('dimn', 40, 300, 'A full row reads all ones in BoardRows whatever its colours, which is how a line announces itself.'),
      text('dimn', 40, 324, 'Each colour plane byte reaches the framebuffer as one OR into the matching plane of that row.'),
    ],
  );
}

/* ============================================================
   Chapter 16 - The TMS9918 Profile
   ============================================================ */

// 16.1 The two layers, drawn as the exploded stack they are: a grid of cells
// behind, and sprites at pixel positions floating over it.
{
  const lines = [];
  for (let c = 0; c <= 32; c += 1) lines.push(line('rule', 260 + c * 12, 54, 260 + c * 12, 294));
  for (let r = 0; r <= 24; r += 1) lines.push(line('rule', 260, 54 + r * 10, 644, 54 + r * 10));
  const tiles = [[4, 18], [9, 6], [14, 20], [20, 9], [26, 16], [6, 10], [16, 4], [23, 19]];
  add(
    'vdp-layers.svg',
    'The tile grid behind, the sprites above',
    'A name table of 32 by 24 cells with eight tiles placed in it, and a transparent sprite layer of 256 by 192 pixels in front of it holding two sprites at pixel positions.',
    424,
    [
      caption(260, 42, 'Tile grid, 32 x 24 cells'),
      rect('bxq', 260, 54, 384, 240, 0),
      ...lines,
      ...tiles.map(([c, r]) => rect('bx2', 260 + c * 12, 54 + r * 10, 12, 10, 0)),
      text('ts', 500, 40, 'tile_at Fern, 20, 9'),
      line('sline', 506, 46, 506, 140, 'arS'),

      line('dash', 260, 54, 120, 120),
      line('dash', 644, 54, 504, 120),
      line('dash', 644, 294, 504, 360),

      rect('none', 120, 120, 384, 240, 0),
      rect('sig', 306, 235, 12, 10, 0),
      rect('sig', 132, 130, 12, 10, 0),
      caption(120, 378, 'Sprite layer, 256 x 192 pixels'),
      line('sline', 318, 243, 404, 330, 'arS'),
      text('ts', 410, 336, 'sprite_at Moth, MothX, MothY'),

      text('dimn', 40, 404, 'Moving a sprite changes two shadow bytes. The grid behind it is not touched.'),
    ],
  );
}

// 16.2 The six stages a render's write passes through before it is light, and
// the window the commit spends.
{
  const stage = (x, y, title, sub, hi) => [
    rect(hi ? 'bxs' : 'bx', x, y, 180, 64, 4),
    text('tb', x + 90, y + 26, title, 'middle'),
    text('dim', x + 90, y + 46, sub, 'middle'),
  ];
  const seg = [
    ['wait vblank', 110], ['GlimCommit', 110], ['poll', 70],
    ['logic', 90], ['render', 140], ['end frame', 140],
  ];
  const band = [];
  let bx = 30;
  seg.forEach(([name, w]) => {
    band.push(rect(name === 'GlimCommit' ? 'bxs' : 'bxq', bx, 300, w, 32, 3));
    band.push(text('ts', bx + w / 2, 321, name, 'middle'));
    bx += w;
  });
  add(
    'shadow-commit.svg',
    'From a fact to the picture, in six stages',
    'Glimmer state, the RAM shadow tables, the dirty markers, the commit in the vertical blank, VRAM, and the picture the VDP paints, with the frame band underneath showing where the commit spends its time.',
    450,
    [
      caption(40, 44, 'Six stages'),
      ...stage(40, 56, 'Glimmer state', 'MothX, MothY', false),
      ...stage(270, 56, 'shadow tables', '768 + 128 bytes', false),
      ...stage(500, 56, 'dirty markers', 'row bits, one flag', false),
      line('none', 220, 88, 270, 88, 'ar'),
      line('none', 450, 88, 500, 88, 'ar'),
      pathEl('none', 'M590,120 V152 H130 V184', 'ar'),
      ...stage(40, 184, 'GlimCommit', 'in the vertical blank', true),
      ...stage(270, 184, 'VRAM', '16 KiB of its own', false),
      ...stage(500, 184, 'the picture', 'painted for you', false),
      line('none', 220, 216, 270, 216, 'ar'),
      line('none', 450, 216, 500, 216, 'ar'),

      caption(30, 290, 'One frame'),
      ...band,
      pathEl('rule', 'M30,338 V348 H250 V338'),
      text('dimn', 140, 366, 'the vertical blank', 'middle'),
      text('dimn', 420, 366, 'renders write the shadows', 'middle'),

      text('dimn', 30, 400, 'A render writes RAM. The next frame opens in the blank, and the commit moves only what is marked.'),
      text('dimn', 30, 424, 'On a frame where only the moth moved: one flag, 128 bytes, three group bytes, and done.'),
    ],
  );
}

/* ============================================================
   Chapter 17 - A VDP Game
   ============================================================ */

// 17.1 Lanternfly mid-round, with the pixel-to-cell conversion inset beside
// it, because that conversion is what a gather is made of.
{
  const k = 1.75;
  const cell = 8 * k;
  const sx = (px) => 40 + px * k;
  const sy = (py) => 60 + py * k;
  const reeds = [[3, 2], [11, 21], [17, 2], [24, 22], [29, 21]];
  add(
    'lanternfly-play.svg',
    'Lanternfly in play',
    'The 256 by 192 screen with five reeds standing in the tile grid, a lantern glowing in cell 24, 6, the white fly at pixel 124, 92 and the wasp closing from the corner, with the score on the LCD.',
    470,
    [
      caption(40, 48, '256 x 192, Graphics I'),
      rect('bxq', 40, 60, 448, 336, 0),
      ...reeds.map(([c, r]) => rect('bx2', 40 + c * cell, 60 + r * cell, cell, cell, 0)),
      rect('bxs', 40 + 24 * cell, 60 + 6 * cell, cell, cell, 0),
      rect('bx', sx(124), sy(92), cell, cell, 0),
      rect('bx2', sx(96), sy(60), cell, cell, 0),

      caption(520, 48, 'LCD'),
      rect('bx', 520, 60, 180, 60, 3),
      text('ts', 530, 86, 'GATHER THE'),
      text('ts', 530, 108, 'LAMPS 07'),

      caption(520, 150, 'The cast'),
      ...[
        ['bx', 'the fly, a sprite'],
        ['bx2', 'the wasp, a sprite'],
        ['bxs', 'the lantern, a tile'],
        ['bx2', 'reeds, tiles'],
      ].flatMap(([cls, label], i) => [
        rect(cls, 520, 164 + i * 24, 14, 14, 2),
        text('dimn', 542, 176 + i * 24, label),
      ]),

      caption(520, 290, 'Pixel to cell'),
      ...[0, 1, 2].flatMap((c) => [0, 1].map((r) =>
        rect(c === 1 && r === 1 ? 'bxs' : 'bxq', 520 + c * 40, 306 + r * 40, 40, 40, 0))),
      rect('none', 550, 331, 40, 40, 0),
      circle('sig', 570, 351, 4),
      text('dim', 520, 400, 'FlyX + 4, then'),
      text('dim', 520, 418, 'three shifts'),

      text('dimn', 40, 446, 'The fly lives in pixels and the lantern in cells, so a gather converts one into the other first.'),
    ],
  );
}

// 17.2 The conversion at full size, with the arithmetic beside it.
{
  const ox = 60;
  const oy = 70;
  const cellPx = 60;
  const scale = cellPx / 8;
  const gx = (px) => ox + (px - 120) * scale;
  const gy = (py) => oy + (py - 80) * scale;
  const cells = [];
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 3; r += 1) {
      const on = c === 1 && r === 2;
      cells.push(rect(on ? 'bxs' : 'bxq', ox + c * cellPx, oy + r * cellPx, cellPx, cellPx, 0));
    }
  }
  add(
    'two-coordinate-systems.svg',
    'A sprite in pixels over a grid in cells',
    'A zoom on four grid columns and three rows with the fly box straddling them, its centre pixel marked, and the cell that centre falls in highlighted, beside the four instructions that convert one system into the other.',
    376,
    [
      caption(60, 44, 'Cells and pixels'),
      ...cells,
      ...[15, 16, 17, 18].map((c, i) => text('dim', ox + i * cellPx + cellPx / 2, 62, String(c), 'middle')),
      ...[10, 11, 12].map((r, i) => text('dim', ox - 8, oy + i * cellPx + cellPx / 2 + 4, String(r), 'end')),
      rect('none', gx(126), gy(94), 60, 60, 0),
      circle('sig', gx(130), gy(98), 5),
      text('dimn', 60, 272, 'the cell under the fly: column 16, row 12'),

      caption(360, 44, 'Pixel to cell'),
      text('t', 360, 76, 'ld a,(FlyX)   ; 126'),
      text('t', 360, 98, 'add a,4       ; 130'),
      text('t', 360, 120, 'srl a'),
      text('t', 360, 142, 'srl a'),
      text('t', 360, 164, 'srl a         ; 16'),
      text('t', 360, 186, 'ld b,a'),
      text('t', 360, 208, 'ld a,(LampCol)'),
      text('t', 360, 230, 'cp b'),
      text('dimn', 360, 262, 'The +4 picks the centre, not the corner.'),
      text('dimn', 360, 278, 'Three shifts divide by eight.'),
      text('ts', 360, 302, '%10000010 >> 3 = %00010000 = 16'),

      legend(60, 320, [
        { cls: 'bxs', label: 'the cell the centre falls in' },
      ]),
      text('dimn', 60, 352, 'Sprites are placed in pixels and tiles in cells, and Gather is where the two systems meet.'),
    ],
  );
}

/* ============================================================
   Chapter 18 - Two Displays, One Language
   ============================================================ */

// 18.1 The closing argument. Two display paths, different heads, joined
// beneath one reactive frame that neither of them changed.
{
  const col = (x, stages) => stages.flatMap((label, i) => {
    const y = 56 + i * 64;
    return [
      rect('bx', x, y, 280, 48, 3),
      text('ts', x + 140, y + 29, label, 'middle'),
      i < stages.length - 1 ? line('none', x + 140, y + 48, x + 140, y + 64, 'ar') : '',
    ];
  });
  add(
    'two-loops.svg',
    'Two displays under one reactive frame',
    'On the left the matrix path: a render repaints the framebuffer and the scan drives eight rows. On the right the VDP path: a render writes shadows, the commit runs in the vertical blank, and VRAM persists. Both stand on the same reactive frame.',
    478,
    [
      caption(40, 36, 'Skyfall, display matrix8x8'),
      caption(400, 36, 'Lanternfly, display tms9918'),
      ...col(40, [
        'a render repaints the framebuffer',
        'ScanFrame drives eight rows',
        '64 LEDs, lit by the CPU itself',
      ]),
      ...col(400, [
        'a render writes the shadows',
        'GlimCommit, in the vertical blank',
        'VRAM, painted by the VDP',
      ]),
      text('dimn', 40, 258, 'the picture is produced, every frame'),
      text('dimn', 400, 258, 'the picture persists, and is corrected'),

      line('rule', 40, 274, 680, 274),
      pathEl('none', 'M180,282 V308', 'ar'),
      pathEl('none', 'M540,282 V308', 'ar'),

      rect('bxs', 40, 308, 640, 128, 4),
      text('tb', 360, 332, 'the same reactive frame under either display', 'middle'),
      ...[
        'call GlimPollBindings',
        'latch GlimActiveCard',
        'call GlimTickTimers',
        'call GlimRunLogicEffects',
      ].map((l, i) => text('ts', 70, 358 + i * 20, l)),
      ...[
        'call GlimMergeRaised',
        'call GlimRunRenderEffects',
        'call GlimEndFrame',
        'jp MainLoop',
      ].map((l, i) => text('ts', 380, 358 + i * 20, l)),

      text('dimn', 40, 464, 'Everything above the rule came from the display line. Everything below it is the language.'),
    ],
  );
}

/* ---------- write ---------- */

mkdirSync(OUT, { recursive: true });
for (const [name, body] of Object.entries(figures)) {
  writeFileSync(path.join(OUT, name), body);
}
console.log(`${Object.keys(figures).length} figures -> ${OUT}`);
