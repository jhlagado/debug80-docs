// Generates .vitepress/sidebar.generated.js from the just-the-docs front
// matter already present in every page (title, nav_order, parent,
// has_children, nav_exclude). Navigation therefore stays defined by the
// markdown files themselves, exactly as it was under Jekyll.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Every top-level section whose subdirectories carry their own chapters.
// `tec1g` is not a book series, but its MON-3 guide is shaped like one, so it
// gets a sidebar the same way and inherits the theme's prev/next pager.
const BOOK_DIRS = ['debug80-book', 'azm-book', 'glimmer-book', 'lanternfly-book', 'tec1g'];

function frontMatter(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}

function mdFiles(dir, recursive = false) {
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => join(dir, name));
  if (!recursive) return files;
  return files.concat(subDirs(dir).flatMap((child) => mdFiles(child, true)));
}

function subDirs(dir) {
  return readdirSync(dir)
    .map((name) => join(dir, name))
    .filter((p) => statSync(p).isDirectory());
}

function pageLink(filePath) {
  const rel = relative(root, filePath).replace(/\\/g, '/');
  return `/${rel.replace(/\.md$/, '.html')}`;
}

function navOrder(fm) {
  const value = Number.parseFloat(fm.nav_order ?? '');
  return Number.isFinite(value) ? value : 9999;
}

/**
 * Consecutive pages sharing a `nav_group` fold into a labelled subsection.
 * The AZM appendices need this: the assembler tables and the Z80 tables
 * answer different questions, and one undifferentiated run of eight buries
 * both. Pages without a `nav_group` stay at the top level of their section.
 */
function groupRuns(entries) {
  const out = [];
  for (const { fm, item } of entries) {
    const group = fm.nav_group;
    if (group === undefined) {
      out.push(item);
      continue;
    }
    const last = out[out.length - 1];
    if (last !== undefined && last.items !== undefined && last.text === group) last.items.push(item);
    else out.push({ text: group, collapsed: false, items: [item] });
  }
  return out;
}

function chapterItems(dir, parentTitle, recursive = false) {
  const entries = mdFiles(dir, recursive)
    .filter((file) => !file.endsWith('index.md'))
    .map((file) => ({ file, fm: frontMatter(file) }))
    // `nav_exclude` pages still list under their `parent` section (the
    // just-the-docs has_toc pattern used by the MON-3 guide); it only hides
    // parentless pages.
    .filter(({ fm }) => fm.parent !== undefined || fm.nav_exclude !== 'true')
    .filter(({ fm }) => parentTitle === undefined || fm.parent === parentTitle)
    .sort((a, b) => navOrder(a.fm) - navOrder(b.fm))
    .map(({ file, fm }) => ({ fm, item: { text: fm.title ?? file, link: pageLink(file) } }));
  return groupRuns(entries);
}

/** A directory holding one book's chapters, keyed by its own index title. */
function sectionFor(dir) {
  let fm;
  try {
    fm = frontMatter(join(dir, 'index.md'));
  } catch {
    return undefined;
  }
  const items = chapterItems(dir, fm.title, true);
  if (items.length === 0) return undefined;
  return { order: navOrder(fm), title: fm.title, entry: { text: fm.title, collapsed: false, items } };
}

/**
 * Each `book*` directory is a standalone book: reading it shows its own
 * chapters and nothing from its siblings. Any other subdirectory - the AZM
 * appendices, for instance - is shared reference and rides along with every
 * book in the series.
 */
function splitSections(bookDir) {
  const books = [];
  const shared = [];
  for (const dir of subDirs(bookDir)) {
    const section = sectionFor(dir);
    if (section === undefined) continue;
    (/(^|\/)book\d+$/.test(dir.replace(/\\/g, '/')) ? books : shared).push({ ...section, dir });
  }
  books.sort((a, b) => a.order - b.order);
  shared.sort((a, b) => a.order - b.order);
  return { books, shared };
}

/** Pages sitting at the series root, such as the AZM introduction. */
function rootItems(bookDir) {
  return chapterItems(bookDir, undefined);
}

const sidebars = {};
for (const book of BOOK_DIRS) {
  const bookDir = join(root, book);
  const { books, shared } = splitSections(bookDir);

  // Every sidebar carries every book in the series: the one being read open,
  // its siblings collapsed. A reader can then reach any chapter of any book
  // from wherever they are, which is what makes the series and book landing
  // pages unnecessary rather than merely redundant. Collapsing a sibling costs
  // one line and saves a trip up and back down through two tables of contents.
  const asGroup = (b, open) => ({ text: b.title, collapsed: !open, items: b.entry.items });

  sidebars[`/${book}/`] = [
    ...rootItems(bookDir),
    ...books.map((b, i) => asGroup(b, i === 0)),
    ...shared.map((s) => s.entry),
  ];

  for (const b of books) {
    const key = `/${relative(root, b.dir).replace(/\\/g, '/')}/`;
    sidebars[key] = [
      ...books.map((x) => asGroup(x, x.dir === b.dir)),
      ...shared.map((s) => s.entry),
    ];
  }

  // Landing directly on a shared section still needs a sidebar.
  for (const s of shared) {
    const key = `/${relative(root, s.dir).replace(/\\/g, '/')}/`;
    sidebars[key] = [
      ...books.map((b) => ({ text: b.title, collapsed: true, items: b.entry.items })),
      ...shared.map((x) => x.entry),
    ];
  }
}

const banner = '// Generated by generate-sidebar.mjs \u2014 do not edit by hand.\n';
writeFileSync(
  join(root, '.vitepress', 'sidebar.generated.js'),
  `${banner}export const sidebars = ${JSON.stringify(sidebars, null, 2)};\n`,
);
console.log(
  Object.entries(sidebars)
    .map(([key, value]) => `${key} ${value.length} sections`)
    .join('\n'),
);
