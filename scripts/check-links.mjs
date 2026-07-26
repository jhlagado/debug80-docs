/**
 * Site-wide link audit.
 *
 * The site builds with `cleanUrls: false` and `ignoreDeadLinks: true`, so a
 * broken internal link produces a 404 at runtime rather than a build failure.
 * This checks them instead.
 *
 * Covers every markdown file plus the nav and sidebar in .vitepress, and
 * resolves both `.md` links and the `.html` links the built site uses.
 *
 * Usage: node scripts/check-links.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', '.vitepress', 'public', 'dist', '_internal']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

/** Does a site-absolute or relative target resolve to a real page? */
function resolves(target, fromFile) {
  let t = target.split('#')[0].split('?')[0];
  if (t === '') return true;

  const base = t.startsWith('/') ? ROOT : path.dirname(fromFile);
  const rel = t.startsWith('/') ? t.slice(1) : t;
  const abs = path.resolve(base, rel);

  // A directory link serves its index.
  if (existsSync(abs) && statSync(abs).isDirectory()) return existsSync(path.join(abs, 'index.md'));
  if (t.endsWith('/')) return existsSync(path.join(abs, 'index.md'));
  if (abs.endsWith('.md')) return existsSync(abs);
  if (abs.endsWith('.html')) return existsSync(abs.replace(/\.html$/, '.md'));
  // Extensionless: could be a page or an asset.
  return existsSync(abs) || existsSync(`${abs}.md`) || existsSync(path.join(abs, 'index.md'));
}

const files = walk(ROOT);
const problems = [];
let checked = 0;

const MD_LINK = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const HTML_HREF = /href="([^"]+)"/g;
const IMG_SRC = /src="([^"]+)"/g;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const re of [MD_LINK, HTML_HREF, IMG_SRC]) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const target = m[1];
      if (/^(https?:|mailto:|tel:|data:|#)/.test(target)) continue;
      checked++;
      if (!resolves(target, file)) {
        problems.push({ file: path.relative(ROOT, file), target });
      }
    }
  }
}

// The theme config's nav and sidebar are links too.
for (const cfg of ['.vitepress/config.ts', '.vitepress/sidebar.generated.js']) {
  const full = path.join(ROOT, cfg);
  if (!existsSync(full)) continue;
  const text = readFileSync(full, 'utf8');
  for (const m of text.matchAll(/link:\s*'([^']+)'/g)) {
    const target = m[1];
    if (/^https?:/.test(target)) continue;
    checked++;
    if (!resolves(target, path.join(ROOT, 'x.md'))) problems.push({ file: cfg, target });
  }
}

console.log(`  ${files.length} markdown files, ${checked} internal links checked`);
if (problems.length === 0) {
  console.log('\nAll internal links resolve.');
  process.exit(0);
}
console.error(`\n${problems.length} broken link(s):\n`);
for (const p of problems) console.error(`  ${p.file}\n      -> ${p.target}`);
process.exit(1);
