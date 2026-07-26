/**
 * Generates the schematic panel diagrams for Debug80 Book 1.
 *
 * These stand in for screenshots. A screenshot of a panel goes stale the moment
 * a label moves and costs a capture session to replace; a schematic is text,
 * regenerates in a second, and shows only what the surrounding prose is talking
 * about. They are deliberately an impression of the panel rather than a
 * pixel-accurate copy of it.
 *
 * Labels here must match the extension's real strings. `npm run verify:debug80`
 * checks the prose against the source; these diagrams are checked by eye
 * against the same strings.
 *
 * Usage: node scripts/generate-book-diagrams.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = 'assets/images/debug80-book/book1';
const W = 720;

/**
 * Clearance between the lowest text in a panel and the panel's bottom edge.
 * Text bounding boxes run about 3px below the baseline, so a box that stops
 * on the last baseline clips the descenders. Everything that sizes itself
 * from its content leaves this much room.
 */
const BOTTOM_GUTTER = 14;

// Shared with the existing conceptual SVGs in this folder.
const CSS = `
  .pnl   { fill: #ffffff; stroke: #2f5d7c; stroke-width: 2; }
  .bar   { fill: #eef4f9; stroke: #2f5d7c; stroke-width: 2; }
  .ctl   { fill: #f7fbff; stroke: #7d97ab; }
  .field { fill: #f7fbff; stroke: #7d97ab; stroke-width: 1.5; }
  .btn   { fill: #eef4f9; stroke: #2f5d7c; stroke-width: 1.5; }
  .prim  { fill: #2f5d7c; stroke: #2f5d7c; stroke-width: 1.5; }
  .card  { fill: #fff8e8; stroke: #9a6a12; stroke-width: 1.5; }
  .off   { fill: #f2f4f6; stroke: #b9c4cd; stroke-width: 1.5; }
  .lbl   { font: 600 11px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #55677a; letter-spacing: .06em; }
  .val   { font: 13px system-ui, -apple-system, "Segoe UI", sans-serif; fill: #17212b; }
  .valm  { font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #17212b; }
  .btxt  { font: 600 12px system-ui, -apple-system, "Segoe UI", sans-serif; fill: #17212b; }
  .ptxt  { font: 600 12px system-ui, -apple-system, "Segoe UI", sans-serif; fill: #ffffff; }
  .dim   { font: 12px system-ui, -apple-system, "Segoe UI", sans-serif; fill: #8797a5; }
  .stat  { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #55677a; }
  .ok    { fill: #1a7f37; }
  .head  { font: 600 11px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #2f5d7c; letter-spacing: .1em; }
  .note  { font: italic 12px system-ui, -apple-system, "Segoe UI", sans-serif; fill: #9a6a12; }
`.replace('#7d97ab', '#7d97ab');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svg(title, desc, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-labelledby="t d">
  <title id="t">${esc(title)}</title>
  <desc id="d">${esc(desc)}</desc>
  <defs><style>${CSS}</style></defs>
  <rect width="${W}" height="${height}" fill="#ffffff"/>
${body}
</svg>
`;
}

const rect = (cls, x, y, w, h, r = 5) =>
  `  <rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const text = (cls, x, y, s, anchor = 'start') =>
  `  <text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>`;

/** Panel frame with a PROJECT title bar. */
function frame(height, sectionLabel = 'PROJECT') {
  return [
    rect('pnl', 10, 10, W - 20, height - 20, 6),
    rect('bar', 11, 11, W - 22, 26, 5),
    text('head', 24, 28, sectionLabel),
    text('head', W - 24, 28, '▾  ↑  ↓', 'end'),
  ].join('\n');
}

const label = (x, y, s) => text('lbl', x, y + 4, s.toUpperCase());
const field = (x, y, w, s, mono = false) =>
  [rect('field', x, y - 12, w, 24), text(mono ? 'valm' : 'val', x + 9, y + 4, s)].join('\n');
const dropdown = (x, y, w, s) =>
  [rect('field', x, y - 12, w, 24), text('val', x + 9, y + 4, s), text('dim', x + w - 10, y + 4, '▾', 'end')].join('\n');
const button = (x, y, w, s, primary = false) =>
  [rect(primary ? 'prim' : 'btn', x, y - 12, w, 24), text(primary ? 'ptxt' : 'btxt', x + w / 2, y + 4, s, 'middle')].join('\n');
/** Run is drawn as a rounded pill, set apart from the square action buttons. */
const pill = (x, y, w, s) =>
  [rect('btn', x, y - 13, w, 26, 13), text('btxt', x + w / 2, y + 4, s, 'middle')].join('\n');
const ghost = (x, y, w, s) =>
  [rect('off', x, y - 12, w, 24), text('dim', x + w / 2, y + 4, s, 'middle')].join('\n');
const square = (x, y, s, on = true) =>
  [rect(on ? 'btn' : 'off', x, y - 11, 22, 22, 4), text(on ? 'btxt' : 'dim', x + 11, y + 4, s, 'middle')].join('\n');
const check = (x, y, s, ticked) =>
  [
    rect(ticked ? 'prim' : 'field', x, y - 10, 14, 14, 3),
    ticked ? text('ptxt', x + 7, y + 1, '✓', 'middle') : '',
    text('lbl', x + 22, y + 4, s.toUpperCase()),
  ].filter(Boolean).join('\n');
const status = (x, y, s, cls = 'stat') => text(cls, x, y, s);

mkdirSync(OUT, { recursive: true });
const diagrams = {};

// 1. No folder open
diagrams['panel-state-no-folder.svg'] = svg(
  'Debug80 panel with no folder open',
  'The panel shows a single card reading "Add projects or folders to the workspace to start with Debug80." above an Open Folder button.',
  150,
  [
    frame(150),
    rect('card', 24, 54, W - 48, 72, 6),
    text('val', 40, 82, 'Add projects or folders to the workspace to start'),
    text('val', 40, 100, 'with Debug80.'),
    button(W - 150, 112, 110, 'Open Folder', true),
  ].join('\n')
);

// 2. Uninitialized
diagrams['panel-state-uninitialized.svg'] = svg(
  'Debug80 panel with a folder that is not yet a project',
  'The project row shows the folder name, add and remove buttons, a Platform dropdown set to TEC-1G and an Initialize button, above a card reading "Uninitialized Debug80 project".',
  150,
  [
    frame(150),
    label(24, 60, 'Project'),
    field(78, 60, 150, 'project1'),
    square(236, 60, '+'),
    square(264, 60, '−', false),
    label(300, 60, 'Platform'),
    dropdown(368, 60, 130, 'TEC-1G'),
    button(510, 60, 90, 'Initialize', true),
    rect('card', 24, 88, W - 48, 38, 6),
    text('val', 40, 112, 'Uninitialized Debug80 project'),
  ].join('\n')
);

// 3. Initialized, zero targets. Same row structure as the ready state so the
// two can be compared at a glance.
diagrams['panel-state-no-targets.svg'] = svg(
  'Debug80 panel for a project with no targets',
  'The target dropdown reads No targets available and is disabled, the remove button is disabled, and the source map line reads: Source map: select a target and build.',
  204,
  [
    frame(204),
    label(26, 60, 'Project'),
    field(84, 60, 120, 'project1'),
    square(208, 60, '+'),
    square(234, 60, '−', false),
    label(264, 60, 'Target'),
    [rect('off', 314, 48, 160, 24), text('dim', 323, 64, 'No targets available')].join('\n'),
    square(478, 60, '+'),
    square(504, 60, '−', false),
    check(536, 60, 'Stop on entry', false),
    button(552, 112, 60, 'Build'),
    pill(622, 112, 72, 'Run'),
    status(26, 156, 'Source map: select a target and build.'),
    text('note', 26, 178, 'Build and Run stay clickable, and say why they cannot run.'),
  ].join('\n')
);

// 4. Initialized and built. Row order and alignment follow the real panel:
// project, target and stop-on-entry share the first row; the three AZM
// controls share the second; the action buttons are right-aligned on a third.
diagrams['panel-state-ready.svg'] = svg(
  'Debug80 panel after a successful build',
  'Project, target and stop-on-entry on one row; register contracts, contract updates and strict labels on the next; Test CoolTerm, Send to TEC-1G, Build and Run right-aligned below; then the source map and hardware status lines.',
  250,
  [
    frame(250),
    // Row 1
    label(26, 60, 'Project'),
    field(84, 60, 120, 'project1'),
    square(208, 60, '+'),
    square(234, 60, '−'),
    label(264, 60, 'Target'),
    dropdown(314, 60, 120, 'main'),
    square(438, 60, '+'),
    square(464, 60, '−'),
    check(496, 60, 'Stop on entry', false),
    // Row 2
    label(26, 96, 'Register contracts'),
    dropdown(150, 96, 92, 'Enforce'),
    label(252, 96, 'Contract updates'),
    dropdown(364, 96, 76, 'Ask'),
    check(452, 96, 'Strict labels', true),
    // Row 3, right-aligned
    button(324, 134, 100, 'Test CoolTerm'),
    button(432, 134, 112, 'Send to TEC-1G'),
    button(552, 134, 60, 'Build'),
    pill(622, 134, 72, 'Run'),
    // Status lines
    status(26, 178, 'Build succeeded: build/main.hex', 'stat ok'),
    status(26, 202, 'Source map: current.'),
    status(26, 226, 'Ready to send main.hex via CoolTerm.'),
  ].join('\n')
);

// 5. Where the panel lives
// 5. The accordion. The reader has to get from "DEBUG80 is a collapsed strip
// at the bottom" to "DEBUG80 is open and showing its Project section", and the
// second state is the one they are aiming at, so both are drawn.
diagrams['panel-sidebar-location.svg'] = svg(
  'Expanding the Debug80 section in the Run and Debug sidebar',
  'Two views of the Run and Debug sidebar. On the left, DEBUG80 is the last of five collapsed sections. On the right, DEBUG80 has been expanded and shows its Project section with the message "Add projects or folders to the workspace to start with Debug80" and an Open Folder button.',
  400,
  (() => {
    const rows = ['VARIABLES', 'WATCH', 'CALL STACK', 'BREAKPOINTS'];
    const sidebar = (x, label) => [
      rect('pnl', x, 40, 300, 300, 6),
      rect('bar', x + 1, 41, 298, 26, 5),
      text('head', x + 14, 58, 'RUN AND DEBUG'),
      text('dim', x + 286, 58, '▾', 'end'),
      text('note', x + 4, 366, label),
    ];
    // A collapsed section header: the disclosure triangle and the name.
    const shut = (x, y, name, lit = false) => [
      rect(lit ? 'card' : 'off', x + 14, y, 272, 26, 4),
      text('lbl', x + 28, y + 17, `▸  ${name}`),
    ].join('\n');

    return [
      // --- left: as the extension leaves it -------------------------------
      ...sidebar(14, '1. DEBUG80 is the last section, and it is shut.'),
      ...rows.map((n, i) => shut(14, 74 + i * 30, n)),
      shut(14, 194, 'DEBUG80', true),

      // --- the action ------------------------------------------------------
      `  <path d="M330 207 H392" stroke="#2f5d7c" stroke-width="1.5"/>`,
      `  <path d="M386 202 L392 207 L386 212" fill="none" stroke="#2f5d7c" stroke-width="1.5"/>`,
      text('note', 361, 197, 'click it', 'middle'),

      // --- right: what you are aiming at -----------------------------------
      ...sidebar(406, '2. Open, it shows the Project section and nothing else.'),
      ...rows.map((n, i) => shut(406, 74 + i * 30, n)),
      rect('bar', 420, 194, 272, 26, 4),
      text('head', 434, 211, '▾  DEBUG80'),
      text('lbl', 434, 241, '▾  PROJECT'),
      rect('card', 420, 252, 272, 46, 5),
      text('val', 434, 271, 'Add projects or folders to the'),
      text('val', 434, 289, 'workspace to start with Debug80.'),
      button(578, 320, 110, 'Open Folder', true),
    ].join('\n');
  })()
);

// 6. Four memory views
diagrams['panel-memory-views.svg'] = svg(
  'The four Debug80 memory views',
  'Four independent memory views labelled A to D, anchored on PC, SP, HL and a symbol, each showing bytes around its anchor with an ASCII gutter.',
  250,
  [
    frame(250, 'MEMORY'),
    ...[
      ['A', 'PC', '$4012', '3E 01 32 40 6E C7 C2 C2', '>.2@n...'],
      ['B', 'SP', '$3FF8', '00 00 40 00 12 40 00 00', '..@..@..'],
      ['C', 'HL', '$4030', '44 65 62 75 67 38 30 20', 'Debug80 '],
      ['D', 'SevenSegHello', '$403E', '6E C7 C2 C2 EB 00 FF FF', 'n.......'],
    ].flatMap(([id, anchor, addr, bytes, ascii], i) => {
      const y = 62 + i * 46;
      return [
        text('head', 26, y + 4, id),
        rect('field', 44, y - 12, 150, 24),
        text('val', 53, y + 4, anchor),
        text('dim', 204, y + 4, addr),
        rect('off', 258, y - 12, 300, 24),
        text('valm', 268, y + 4, bytes),
        text('stat', 570, y + 4, ascii),
      ];
    }),
  ].join('\n')
);

// 7. The accordion
diagrams['panel-sections.svg'] = svg(
  'The Debug80 panel sections',
  'Nine collapsible sections: Project, Machine, Displays, TMS9918 Video, Joystick, Matrix Keyboard, Registers, Memory and Serial. Four are open by default.',
  276,
  [
    rect('pnl', 10, 10, W - 20, 256, 6),
    ...[
      ['Project', true],
      ['Machine', true],
      ['Displays', true],
      ['TMS9918 Video', false],
      ['Joystick', false],
      ['Matrix Keyboard', false],
      ['Registers', true],
      ['Memory', false],
      ['Serial', false],
    ].flatMap(([name, open], i) => {
      const y = 24 + i * 26;
      return [
        rect(open ? 'bar' : 'off', 22, y, W - 44, 22, 4),
        text('head', 36, y + 15, `${open ? '▾' : '▸'}  ${name.toUpperCase()}`),
        text('dim', W - 40, y + 15, '↑ ↓', 'end'),
      ];
    }),
    text('note', 36, 250, 'Open by default: Project, Machine, Displays, Registers.'),
  ].join('\n')
);


// ── further primitives ───────────────────────────────────────────────────────

/** A VS Code quick pick: prompt line above a list of rows. */
function quickpick(prompt, rows, y0 = 24) {
  const rowH = 26;
  const h = 34 + rows.length * rowH;
  const out = [rect('pnl', 10, y0, W - 20, h, 6), rect('bar', 11, y0 + 1, W - 22, 28, 5),
               text('dim', 26, y0 + 20, prompt)];
  rows.forEach(([main, desc, sel], i) => {
    const y = y0 + 30 + i * rowH;
    if (sel) out.push(rect('bar', 12, y, W - 24, rowH - 2, 3));
    out.push(text('val', 26, y + 17, main));
    if (desc) out.push(text('dim', 26 + main.length * 7.4 + 14, y + 17, desc));
  });
  return { svg: out.join('\n'), height: y0 + h + 14 };
}

/** A modal dialog with a message and buttons. */
function modal(lines, buttons) {
  const out = [rect('pnl', 120, 24, W - 240, 44 + lines.length * 20 + 42, 8)];
  lines.forEach((l, i) => out.push(text('val', 148, 58 + i * 20, l)));
  let x = W - 148;
  [...buttons].reverse().forEach(([lbl, prim], i) => {
    const w = lbl.length * 8 + 26;
    x -= w;
    out.push(button(x, 44 + lines.length * 20 + 34, w, lbl, prim && i === buttons.length - 1));
    x -= 10;
  });
  return { svg: out.join('\n'), height: 24 + 44 + lines.length * 20 + 42 + 24 };
}

/** A file tree. */
function tree(rows) {
  // The last row's descenders need clearance inside the panel, so the box
  // runs a gutter past the final baseline rather than stopping on it.
  const inner = 26 + rows.length * 24 + BOTTOM_GUTTER;
  const out = [rect('pnl', 10, 10, W - 20, inner, 6),
               rect('bar', 11, 11, W - 22, 24, 5), text('head', 24, 27, 'EXPLORER')];
  rows.forEach(([indent, name, kind], i) => {
    const y = 40 + i * 24;
    out.push(text(kind === 'dim' ? 'dim' : 'val', 28 + indent * 18, y + 14, name));
  });
  return { svg: out.join('\n'), height: 10 + inner + 14 };
}

/** Editor lines with an optional breakpoint dot and highlighted row. */
function editor(lines, bpLine, hlLine) {
  const out = [rect('pnl', 10, 10, W - 20, 22 + lines.length * 22, 6)];
  lines.forEach((l, i) => {
    const y = 20 + i * 22;
    if (i === hlLine) out.push(rect('bar', 11, y, W - 22, 22, 0));
    if (i === bpLine) out.push(`  <circle cx="28" cy="${y + 11}" r="6" fill="#cf222e"/>`);
    out.push(text('dim', 44, y + 15, String(i + 1).padStart(2, ' ')));
    out.push(text('valm', 72, y + 15, l));
  });
  return { svg: out.join('\n'), height: 10 + 22 + lines.length * 22 + 14 };
}

/** Key-value rows, used for registers and watch. */
function kvGrid(title, pairs, cols = 3, editableNote) {
  const rows = Math.ceil(pairs.length / cols);
  // Measure down from the last field rather than guessing a total: the last
  // row of value boxes ends at 42 + 30n, and a note sits a line below that.
  const fieldsBottom = 42 + rows * 30;
  const contentBottom = editableNote ? fieldsBottom + 20 + 3 : fieldsBottom;
  const h = contentBottom + BOTTOM_GUTTER + 10;
  const out = [frame(h, title)];
  pairs.forEach(([k, v, ro], i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const x = 26 + c * 228, y = 60 + r * 30;
    out.push(text('lbl', x, y + 4, k));
    out.push(rect(ro ? 'off' : 'field', x + 46, y - 12, 150, 24));
    out.push(text('valm', x + 55, y + 4, v));
  });
  if (editableNote) out.push(text('note', 26, fieldsBottom + 20, editableNote));
  return { svg: out.join('\n'), height: h };
}

const mk = (name, title, desc, built) => { diagrams[name] = svg(title, desc, built.height, built.svg); };

// ── chapter 2 ────────────────────────────────────────────────────────────────
mk('picker-program-file.svg', 'The program file picker shown during initialization',
   'A quick pick headed "Create a starter source file for this Debug80 project" listing Create ASM starter and No target yet.',
   quickpick('Create a starter source file for this Debug80 project', [
     ['Create ASM starter', 'Create src/main.asm with minimal starter code', true],
     ['No target yet', 'Create the project without a target; pick a program file later', false],
   ]));

mk('explorer-after-init.svg', 'The project folder after initialization',
   'An Explorer tree showing build, src with main.asm, .gitignore and debug80.json.',
   tree([[0, '▾ project1'], [1, '▸ build'], [1, '▾ src'], [2, 'main.asm'], [1, '.gitignore'], [1, 'debug80.json']]));

// ── chapter 3 ────────────────────────────────────────────────────────────────
mk('picker-target-dropdown.svg', 'The target dropdown',
   'The target list showing two configured targets and one discovered file prefixed with a plus.',
   quickpick('Select target', [
     ['main', '', true], ['blink', '', false], ['+ src/scratch.asm', 'suggested entry', false],
   ]));

mk('modal-remove-target.svg', 'Confirming target removal',
   'A modal reading "Remove target blink from this project? Its source files and build artifacts will not be deleted." with a Remove Target button.',
   modal(['Remove target blink from this project? Its source files',
          'and build artifacts will not be deleted.'],
         [['Cancel', false], ['Remove Target', true]]));

// ── chapter 4 ────────────────────────────────────────────────────────────────
mk('panel-state-build-failed.svg', 'The panel after a failed build',
   'A red exclamation indicator beside Build and a red Build failed status line.',
   { height: 176, svg: [
     frame(176),
     label(24, 60, 'Target'), dropdown(78, 60, 130, 'main'),
     rect('bar', 24, 84, W - 48, 1, 0),
     button(24, 112, 60, 'Build'),
     `  <circle cx="98" cy="112" r="9" fill="#cf222e"/>`,
     text('ptxt', 98, 116, '!', 'middle'),
     button(120, 112, 70, 'Run', true),
     `  <text class="stat" x="24" y="152" fill="#cf222e">⚠ Build failed: src/main.asm:14 unknown opcode</text>`,
   ].join('\n') });

/** The 20x4 text LCD, four lines on a green ground. */
function lcd4(x, y, lines) {
  const out = [`  <rect x="${x}" y="${y}" width="300" height="98" rx="6" fill="#eef3ea" stroke="#5c7f5c" stroke-width="1.5"/>`];
  lines.forEach((l, i) =>
    out.push(`  <text class="valm" x="${x + 14}" y="${y + 26 + i * 20}" fill="#2f5d3a">${esc(l)}</text>`));
  return out.join('\n');
}

/** The pill that reports which surface currently owns the keyboard. */
function cuePill(x, y, state, hint) {
  return [
    rect('card', x, y - 14, 320, 26, 13),
    `  <circle cx="${x + 18}" cy="${y - 1}" r="4" fill="#9a6a12"/>`,
    text('lbl', x + 32, y + 3, state),
    text('dim', x + 306, y + 3, hint, 'end'),
  ].join('\n');
}

const lcd = (x, y, l1, l2) => [
  rect('off', x, y, 300, 62, 4),
  text('valm', x + 14, y + 24, l1), text('valm', x + 14, y + 46, l2),
].join('\n');
/**
 * A bank of seven-segment digits, drawn as real segments rather than text.
 *
 * The TEC-1G has six: four address digits on the left and two data digits on
 * the right. Drawn in the same light palette as the rest of the diagrams
 * rather than as a dark LED module, keeping a muted red and green to separate
 * address from data and the slant that makes it read as a segment display.
 */
const SEGS = {
  '0':'abcdef','1':'bc','2':'abdeg','3':'abcdg','4':'bcfg','5':'acdfg','6':'acdefg',
  '7':'abc','8':'abcdefg','9':'abcdfg','A':'abcefg','B':'cdefg','C':'adef','D':'bcdeg',
  'E':'adefg','F':'aefg','G':'acdef','H':'bcefg','L':'def','O':'abcdef','P':'abefg',
  'U':'bcdef','t':'defg','-':'g',' ':'', '.':'',
};

function segDigit(x, y, ch, on, off) {
  const W = 26, H = 46, T = 5;
  const lit = SEGS[ch] ?? SEGS[ch?.toUpperCase?.()] ?? '';
  const hbar = (x0, x1, yy) =>
    `${x0 + T / 2},${yy} ${x0 + T},${yy - T / 2} ${x1 - T},${yy - T / 2} ${x1 - T / 2},${yy} ${x1 - T},${yy + T / 2} ${x0 + T},${yy + T / 2}`;
  const vbar = (xx, y0, y1) =>
    `${xx},${y0 + T / 2} ${xx + T / 2},${y0 + T} ${xx + T / 2},${y1 - T} ${xx},${y1 - T / 2} ${xx - T / 2},${y1 - T} ${xx - T / 2},${y0 + T}`;
  const g = {
    a: hbar(x, x + W, y),
    g: hbar(x, x + W, y + H / 2),
    d: hbar(x, x + W, y + H),
    f: vbar(x, y, y + H / 2),
    b: vbar(x + W, y, y + H / 2),
    e: vbar(x, y + H / 2, y + H),
    c: vbar(x + W, y + H / 2, y + H),
  };
  const out = Object.entries(g).map(([k, pts]) =>
    `    <polygon points="${pts}" fill="${lit.includes(k) ? on : off}"/>`);
  out.push(`    <circle cx="${x + W + 9}" cy="${y + H}" r="2.6" fill="${off}"/>`);
  return out.join('\n');
}

/** The six-digit bank: four address digits, a gap, two data digits. */
function sevenSeg(x, y, s) {
  const chars = (s + '      ').slice(0, 6).split('');
  const RED = ['#c0392b', '#e3e8ed'], GREEN = ['#2f855a', '#e3e8ed'];
  const PITCH = 44, GAP = 18, DW = 26, DIGIT_H = 46, PAD = 18;
  // Content runs from the first digit's left edge to the last decimal point.
  const contentW = 5 * PITCH + GAP + DW + 9;
  const width = contentW + PAD * 2;
  const top = y + 12;
  // skewX shears x in proportion to y, so skewing about the origin would drag
  // the digits sideways out of the box. Skew about their own centre line.
  const cy = top + DIGIT_H / 2;
  const out = [
    `  <rect class="field" x="${x}" y="${y}" width="${width}" height="70" rx="6"/>`,
    `  <g transform="translate(0,${cy}) skewX(-6) translate(0,${-cy})">`,
  ];
  chars.forEach((ch, i) => {
    const [on, off] = i < 4 ? RED : GREEN;
    const dx = x + PAD + i * PITCH + (i >= 4 ? GAP : 0);
    out.push(segDigit(dx, top, ch, on, off));
  });
  out.push('  </g>');
  out.push(text('lbl', x + PAD, y + 86, 'ADDRESS'));
  out.push(text('lbl', x + PAD + 4 * PITCH + GAP, y + 86, 'DATA'));
  return out.join('\n');
}

/**
 * The TEC-1G hex keypad: six columns by four rows. Column one carries RESET at
 * the top and FN at the bottom; column two the AD, GO and cursor keys; the
 * remaining four columns the sixteen hex keys in TEC1G_HEX_ORDER.
 */
function keypad(x0, y0) {
  const KW = 46, KH = 30, GX = 52, GY = 36;
  const out = [];
  const cap = (c, r, s) => {
    const x = x0 + c * GX, y = y0 + r * GY;
    out.push(rect('btn', x, y, KW, KH, 5));
    out.push(text('btxt', x + KW / 2, y + 20, s, 'middle'));
  };
  cap(0, 0, 'RESET');
  cap(0, 3, 'FN');
  ['AD', 'GO', '◀', '▶'].forEach((s, r) => cap(1, r, s));
  [['C', 'D', 'E', 'F'], ['8', '9', 'A', 'B'], ['4', '5', '6', '7'], ['0', '1', '2', '3']]
    .forEach((row, r) => row.forEach((s, c) => cap(2 + c, r, s)));
  return out.join('\n');
}

mk('machine-running.svg', 'The Machine section',
   'Two columns. The LCD sits above the six-digit seven-segment display on the left. On the right, the keyboard routing cue sits above the hex keypad in its own bordered well.',
   { height: 306, svg: [
     frame(306, 'MACHINE'),
     // Left column
     text('lbl', 26, 58, 'LCD (HD44780 A00)'),
     lcd4(26, 66, ['= TEC-1G Main Menu =', '→Intel HEX Load', '  Drive Access', '  Smart Block Copy']),
     sevenSeg(26, 176, 'tEC-1G'),
     // Right column
     cuePill(360, 58, 'KEYBOARD RELEASED', 'CLICK EMULATOR TO CAPTURE'),
     rect('field', 360, 96, 320, 186, 6),
     keypad(374, 110),
   ].join('\n') });

// ── chapter 5 ────────────────────────────────────────────────────────────────
mk('debug-toolbar.svg', 'The VS Code debug toolbar',
   'Continue, Step Over, Step Into, Step Out, Restart and Stop, with their shortcuts.',
   { height: 96, svg: [
     rect('pnl', 10, 24, W - 20, 48, 8),
     ...[['▶', 'Continue', 'F5'], ['⤼', 'Step Over', 'F10'], ['↓', 'Step Into', 'F11'],
         ['↑', 'Step Out', '⇧F11'], ['⟳', 'Restart', ''], ['■', 'Stop', '']]
       .map(([g, n, k], i) => {
         const x = 30 + i * 112;
         return [rect('btn', x, 34, 28, 28, 5), text('btxt', x + 14, 53, g, 'middle'),
                 text('dim', x + 36, 46, n), k ? text('dim', x + 36, 60, k) : ''].filter(Boolean).join('\n');
       }),
   ].join('\n') });

mk('editor-breakpoint.svg', 'A breakpoint on an instruction line',
   'A red breakpoint dot in the editor gutter beside a LD instruction, with the paused line highlighted.',
   editor(['ScanHello:', '        LD      DE,SevenSegHello', '        LD      C,API_SCAN_SEGMENTS',
           '        RST     0x10', '        JR      ScanHello'], 1, 1));

mk('menu-run-to-here.svg', 'Run to Here on a call stack frame',
   'The Call Stack view with a context menu offering Run to Here.',
   { height: 168, svg: [
     frame(168, 'CALL STACK'),
     ...['ScanHello+3', 'Start+18', 'mon3:ColdStart+42'].map((f, i) =>
       [i === 0 ? rect('bar', 24, 48 + i * 26, 240, 24, 3) : '', text('valm', 34, 65 + i * 26, f)]
         .filter(Boolean).join('\n')),
     rect('pnl', 280, 52, 200, 56, 5),
     rect('bar', 281, 53, 198, 26, 4), text('val', 296, 71, 'Run to Here'),
     text('dim', 296, 99, 'Copy Call Stack'),
   ].join('\n') });

// ── chapter 6 ────────────────────────────────────────────────────────────────
mk('variables-symbols.svg', 'Symbols and Constants in the Variables panel',
   'The Variables panel with Symbols and Constants scopes expanded, showing addresses and values.',
   { height: 204, svg: [
     frame(204, 'VARIABLES'),
     text('lbl', 26, 58, '▾ Symbols'),
     ...[['LcdLine1', '$4030  "Debug80 TEC-1G"'], ['SevenSegHello', '$403E  6E C7 C2 C2 EB 00'],
         ['ScanHello', '$4012']].map(([k, v], i) =>
       [text('valm', 44, 82 + i * 22, k), text('dim', 220, 82 + i * 22, v)].join('\n')),
     text('lbl', 26, 156, '▾ Constants'),
     text('valm', 44, 178, 'API_SCAN_SEGMENTS'), text('dim', 220, 178, '10'),
   ].join('\n') });

mk('registers-editable.svg', 'The Registers section',
   'Register pairs, the shadow set, PC and SP, with I and R shown read-only.',
   kvGrid('REGISTERS', [
     ['BC', '00 12'], ['DE', '40 3E'], ['HL', '40 30'],
     ["BC'", '00 00'], ["DE'", '00 00'], ["HL'", '00 00'],
     ['AF', '6E 44'], ['IX', '00 00'], ['IY', '00 00'],
     ['PC', '40 12'], ['SP', '3F F8'], ['I / R', '00 / 3A', true],
   ], 3, 'Every field except I and R is editable while the program is paused.'));

mk('memory-unlock.svg', 'Writing to read-only memory',
   'The Unlock read-only memory checkbox, and the message shown when a ROM byte is edited without it.',
   { height: 156, svg: [
     frame(156, 'MEMORY'),
     text('lbl', 26, 58, 'A'), rect('field', 44, 46, 150, 24), text('val', 53, 62, 'PC'),
     rect('off', 210, 46, 300, 24), text('valm', 220, 62, 'C3 40 00 6E C7 C2 C2 EB'),
     check(26, 96, 'Unlock read-only memory', false),
     `  <text class="stat" x="26" y="130" fill="#cf222e">Read-only memory locked</text>`,
   ].join('\n') });

mk('displays-section.svg', 'The Displays section',
   'Two columns. Speed, mute and speaker controls with the status and memory-bank indicators sit above the GLCD on the left; the 8x8 RGB LED matrix and its scan readout occupy the right.',
   // Proportioned from the real panel: the two columns run about 1.37:1, both
   // bottom-align, and the GLCD screen ends up close to the matrix in area
   // rather than a third of it. The 128x64 screen is drawn at a true 2:1.
   { height: 404, svg: [
     frame(404, 'DISPLAYS'),

     // ── left column: control well above the GLCD ──────────────────────────
     rect('field', 26, 50, 376, 102, 6),
     ...['FAST', 'MUTED', 'SPEAKER'].map((s, i) =>
       [rect(i === 1 ? 'btn' : 'off', 40 + i * 124, 62, 100, 24, 12),
        text(i === 1 ? 'btxt' : 'dim', 90 + i * 124, 78, s, 'middle')].join('\n')),
     ...[['SHADOW', 'PROTECT', 'EXPAND', 'CAPS'], ['MEM 3', 'MEM 2', 'MEM 1', 'MEM 0']]
       .flatMap((row, r) => [
         rect('off', 40, 96 + r * 28, 348, 22, 11),
         ...row.map((s, i) => [
           `  <circle cx="${54 + i * 87}" cy="${107 + r * 28}" r="4" fill="#c8cfd5"/>`,
           text('lbl', 64 + i * 87, 111 + r * 28, s),
         ].join('\n')),
       ]),
     // The GLCD carries its own bezel, with the label inside it as on the
     // real panel. Kept pale so it reads as a schematic, not a lit screen.
     `  <rect x="26" y="164" width="376" height="216" rx="6" fill="#eef3e9" stroke="#5c7f5c" stroke-width="1.5"/>`,
     text('lbl', 42, 186, 'GLCD (128X64)'),
     `  <rect x="42" y="194" width="344" height="172" rx="4" fill="#dbe6c4" stroke="#8ba36a" stroke-width="1.5"/>`,

     // ── right column: the matrix board and its readout ────────────────────
     rect('field', 422, 50, 272, 330, 6),
     text('lbl', 438, 74, '8X8 RGB LED MATRIX'),
     `  <rect x="436" y="84" width="244" height="244" rx="4" fill="#f4f6f8" stroke="#c3ccd4"/>`,
     ...Array.from({ length: 64 }, (_, n) => {
       const r = Math.floor(n / 8), c = n % 8;
       return `  <circle cx="${453 + c * 30}" cy="${101 + r * 30}" r="11" fill="#eceff2" stroke="#c3ccd4"/>`;
     }),
     `  <text class="stat" x="436" y="348" font-size="10.5">SCAN 911.6 Hz | CPU 3.44 MHz</text>`,
     `  <text class="stat" x="436" y="364" font-size="10.5">buffer 0 ms | dropped 0</text>`,
   ].join('\n') });

// ── chapter 7 ────────────────────────────────────────────────────────────────
mk('symbol-hover.svg', 'A symbol hover',
   'A hover card showing a routine name, its address, its AZM register contract and its source location.',
   { height: 150, svg: [
     rect('pnl', 40, 24, W - 80, 108, 8),
     text('valm', 62, 54, 'ScanHello'), text('dim', 160, 54, 'label   $4012'),
     rect('bar', 62, 68, W - 124, 1, 0),
     text('valm', 62, 92, 'in: A,HL   out: carry   clobbers: B,C   preserves: DE,IX'),
     text('dim', 62, 116, 'src/main.asm:24'),
   ].join('\n') });

// ── chapter 8 ────────────────────────────────────────────────────────────────
mk('section-tms9918.svg', 'The TMS9918 Video section',
   'A 256x192 video canvas with a PAL 50 and NTSC 60 selector.',
   { height: 210, svg: [
     frame(210, 'TMS9918 VIDEO'),
     dropdown(26, 60, 120, 'PAL 50'),
     text('note', 160, 64, 'Open this section to attach the card at ports 0xBE / 0xBF.'),
     rect('off', 26, 82, W - 52, 108, 4),
     text('dim', W / 2, 140, '256 x 192', 'middle'),
   ].join('\n') });

mk('section-joystick.svg', 'The Joystick section',
   'A D-pad with Fire 1, Fire 2, Fire 3 and Aux buttons, and a Move and Fire mode toggle.',
   { height: 204, svg: [
     frame(204, 'JOYSTICK'),
     ...[['Move', true], ['Fire', false]].map(([s, on], i) =>
       [rect(on ? 'btn' : 'off', 26 + i * 76, 48, 66, 24, 4),
        text(on ? 'btxt' : 'dim', 59 + i * 76, 64, s, 'middle')].join('\n')),
     ...[['▲', 92, 92], ['◀', 40, 130], ['▶', 144, 130], ['▼', 92, 130]].map(([g, x, y]) =>
       [rect('btn', x, y, 44, 34, 5), text('btxt', x + 22, y + 22, g, 'middle')].join('\n')),
     ...['Fire 1', 'Fire 2', 'Fire 3', 'Aux'].map((s, i) =>
       [rect('btn', 260 + i * 104, 100, 92, 34, 5), text('btxt', 306 + i * 104, 122, s, 'middle')].join('\n')),
     text('note', 26, 178, 'W A S D steer; J or Space is Fire 1. An open Joystick section outranks the keypad.'),
   ].join('\n') });

/**
 * The TEC-1G matrix keyboard: five rows, sixty keys, labels and order taken
 * from webview/tec1g/matrix-ui.ts.
 *
 * Each row is scaled to the same width so the block is a rectangle rather than
 * ending ragged, which is how the real keyboard is laid out: the wide keys
 * absorb whatever space the row needs.
 */
function matrixKeyboard(x0, y0, width) {
  const rows = [
    [['ESC',1.3],['1!',1],['2@',1],['3#',1],['4$',1],['5%',1],['6^',1],['7&',1],['8*',1],['9(',1],['0)',1],['-_',1],['=+',1],['DEL',1.3]],
    [['TAB',1.4],['Q',1],['W',1],['E',1],['R',1],['T',1],['Y',1],['U',1],['I',1],['O',1],['P',1],['"’',1],['\\|',1]],
    [['CAPS',1.6],['A',1],['S',1],['D',1],['F',1],['G',1],['H',1],['J',1],['K',1],['L',1],[';:',1],['ENTER',1.9]],
    [['SHIFT',2],['Z',1],['X',1],['C',1],['V',1],['B',1],['N',1],['M',1],[',<',1],['.>',1],['/?',1],['▲',1],['SHIFT',1.2]],
    [['CTRL',1.3],['FN',1.2],['ALT',1.2],['SPACE',5.5],['ALT',1.2],['◀',1],['▼',1],['▶',1]],
  ];
  const H = 30, GAP = 4;
  const out = [];
  rows.forEach((row, r) => {
    const units = row.reduce((n, [, u]) => n + u, 0);
    const gaps = (row.length - 1) * GAP;
    const perUnit = (width - gaps) / units;
    let x = x0;
    const y = y0 + r * (H + GAP);
    row.forEach(([k, u]) => {
      const w = u * perUnit;
      out.push(`  <rect class="btn" x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${H}" rx="4"/>`);
      const cls = k.length > 2 ? 'lbl' : 'btxt';
      out.push(text(cls, x + w / 2, y + 19, k, 'middle'));
      x += w + GAP;
    });
  });
  return out.join('\n');
}

mk('section-matrix-keyboard.svg', 'The Matrix Keyboard section',
   'The full five-row matrix keyboard with the routing cue pill above it.',
   { height: 302, svg: [
     frame(302, 'MATRIX KEYBOARD'),
     rect('card', 26, 46, 320, 24, 12),
     text('val', 40, 63, 'Keyboard captured / click outside to release'),
     matrixKeyboard(26, 82, W - 52),
     text('note', 26, 258, 'While the matrix is attached the hex keypad dims, except RESET.'),
     text('note', 26, 276, 'Ctrl-Escape releases the keyboard back to VS Code.'),
   ].join('\n') });

mk('section-serial.svg', 'The Serial section',
   'The captured UART buffer with SEND FILE and SAVE buttons.',
   { height: 180, svg: [
     frame(180, 'SERIAL (BIT 6)'),
     rect('off', 26, 46, W - 52, 84, 4),
     text('valm', 38, 68, ':1040000006010E0FD706800E0FD72118400E0DD7D0'),
     text('valm', 38, 90, ':104010001127400E0AD718F84465627567383020BA'),
     text('valm', 38, 112, ':00000001FF'),
     button(26, 152, 100, 'SEND FILE'), button(136, 152, 70, 'SAVE'),
     text('note', 230, 156, 'The emulated UART. Never touches a physical port.'),
   ].join('\n') });

// ── chapter 11 ───────────────────────────────────────────────────────────────
mk('glimmer-build-output.svg', 'What a Glimmer build produces',
   'The build folder for a Glimmer target, showing the generated assembly beside the hex, binary and source map.',
   tree([[0, '▾ build'], [1, 'game.asm', 'dim'], [1, 'game.hex'], [1, 'game.bin'], [1, 'game.d8.json']]));


for (const [name, body] of Object.entries(diagrams)) {
  writeFileSync(path.join(OUT, name), body);
  console.log('  wrote', name);
}
console.log(`\n${Object.keys(diagrams).length} diagrams generated into ${OUT}`);
