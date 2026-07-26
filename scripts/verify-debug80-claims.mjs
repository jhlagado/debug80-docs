/**
 * Verifies the Debug80 book's factual claims against the extension source.
 *
 * The book went stale because nothing connected its prose to the product. This
 * checks the claims that are machine-checkable — command titles, literal status
 * strings, panel button labels and the VS Code version requirement — and fails
 * when the book and the extension disagree.
 *
 * Usage:
 *   node scripts/verify-debug80-claims.mjs [--ext <path to debug80-vscode>]
 *
 * Claims it cannot check (workflow order, screenshots, prose accuracy) are
 * deliberately out of scope; this is a drift alarm, not a proofreader.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const extFlag = args.indexOf('--ext');
const EXT = path.resolve(
  extFlag >= 0 ? args[extFlag + 1] : `${process.env.HOME}/projects/debug80/apps/debug80-vscode`
);
const BOOK = path.resolve('debug80-book');

const failures = [];
const notes = [];

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function readIfPresent(p) {
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

if (!existsSync(EXT)) {
  console.error(`Extension source not found at ${EXT}. Pass --ext <path>.`);
  process.exit(2);
}
if (!existsSync(BOOK)) {
  console.error(`Book not found at ${BOOK}. Run from the repository root.`);
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(path.join(EXT, 'package.json'), 'utf8'));
const commandTitles = new Set(manifest.contributes.commands.map((c) => c.title));
const engine = String(manifest.engines?.vscode ?? '').replace(/^\^/, '');

// Every source file that can hold a user-visible string.
function collectSource(dir, exts) {
  const out = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      if (statSync(full).isDirectory()) {
        if (entry !== 'node_modules') stack.push(full);
      } else if (exts.some((e) => entry.endsWith(e))) {
        out.push(full);
      }
    }
  }
  return out;
}
const sourceText = [
  ...collectSource(path.join(EXT, 'src'), ['.ts']),
  ...collectSource(path.join(EXT, 'webview'), ['.ts', '.html']),
]
  .map((f) => readIfPresent(f))
  .join('\n');

const bookFiles = walk(BOOK);

// --- 1. Command titles -------------------------------------------------------
// The book writes palette commands as **Debug80: Something**.
const COMMAND_RE = /\*\*(Debug80: [^*]+)\*\*/g;
for (const file of bookFiles) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(COMMAND_RE)) {
    const title = match[1].trim();
    if (!commandTitles.has(title)) {
      fail(path.relative('.', file), `command title not contributed by the extension: "${title}"`);
    }
  }
}

// --- 2. Literal panel strings ------------------------------------------------
// Backticked strings that look like panel status lines must exist verbatim.
const STATUS_RE = /`(Source map: [^`]+|Build (?:succeeded|failed)[^`]*|Ready to send [^`]+)`/g;
for (const file of bookFiles) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(STATUS_RE)) {
    const literal = match[1].trim();
    // Compare on the stable prefix; runtime values (paths) vary.
    const probe = literal.split(/[.:]/)[0];
    if (!sourceText.includes(probe)) {
      fail(path.relative('.', file), `status string not found in extension source: "${literal}"`);
    }
  }
}

// --- 3. Panel button labels --------------------------------------------------
// Labels the book instructs the reader to click must exist in the webview.
const KNOWN_BUTTONS = [
  'Open Folder',
  'Initialize',
  'Build',
  'Run',
  'Test CoolTerm',
  'Send to TEC-1G',
  'Strict labels',
  'Stop on entry',
  'Register Contracts',
];
for (const file of bookFiles) {
  const text = readFileSync(file, 'utf8');
  for (const label of KNOWN_BUTTONS) {
    const bolded = new RegExp(`\\*\\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*`);
    if (!bolded.test(text)) continue;
    // Case-insensitive because the panel uppercases some labels via CSS.
    if (!sourceText.toLowerCase().includes(label.toLowerCase())) {
      fail(path.relative('.', file), `button label not found in webview source: "${label}"`);
    }
  }
}

// --- 4. VS Code version ------------------------------------------------------
const VERSION_RE = /VS Code[^.\n]{0,40}?(\d+\.\d+\.\d+)/g;
for (const file of bookFiles) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(VERSION_RE)) {
    if (match[1] !== engine) {
      fail(
        path.relative('.', file),
        `claims VS Code ${match[1]} but the extension requires ${engine}`
      );
    }
  }
}

// --- report ------------------------------------------------------------------
notes.push(`checked ${bookFiles.length} markdown files against ${path.relative(process.env.HOME ?? '', EXT)}`);
notes.push(`${commandTitles.size} contributed commands, engine ${engine}`);

for (const note of notes) console.log(`  ${note}`);
if (failures.length === 0) {
  console.log('\nDebug80 book claims verified.');
  process.exit(0);
}
console.error(`\n${failures.length} claim(s) out of date:\n`);
for (const failure of failures) console.error(`  - ${failure}`);
process.exit(1);
