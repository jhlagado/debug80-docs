/**
 * Checks that every symbol the prose names is a symbol the code defines.
 *
 * AZM is case-sensitive in labels by default, so `RenderTile` and
 * `RENDER_TILE` are two different symbols and only one of them exists. Prose
 * that names the wrong one reads as authoritative and is simply wrong. This
 * found seventeen such references in one chapter of AZM Book 0 — including
 * inside a quoted assembler diagnostic, which the assembler would have
 * printed with the declared spelling.
 *
 * The check: collect every symbol defined in an assembly code fence, then
 * look for a backticked reference in the prose that matches one of them only
 * after case and underscores are normalised away.
 *
 * Usage: node scripts/check-symbols.mjs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const BOOK_DIRS = ["azm-book", "debug80-book", "glimmer-book", "nucleus"];

/**
 * Z80 mnemonics, registers, condition codes and AZM keywords. These collide
 * with ordinary prose constantly and are never the symbols we are checking.
 */
const RESERVED = new Set(
  `a b c d e f h l i r af bc de hl ix iy sp pc afx ixh ixl iyh iyl
   ld ldi ldir ldd lddr push pop ex exx add adc sub sbc and or xor cp inc dec
   daa cpl neg ccf scf nop halt di ei im jp jr djnz call ret reti retn rst
   in out ini inir outi otir rlca rrca rla rra rlc rrc rl rr sla sra srl rld
   rrd bit set res nz z nc po pe m p carry zero sign parity halfcarry
   byte word addr routine type union enum equ org db dw ds field endtype
   endunion typealias include import cstr pstr istr align org end op
   in out clobbers preserves maybe n nn e d`.split(/\s+/),
);

/**
 * Glimmer declaration keywords. `card Playing` declares a card, so prose
 * naming `card` means the keyword, not a symbol called Card.
 */
const GLIMMER_KEYWORDS = new Set(
  `program state pulse effect picture bind card part layout profile routine
   import use derive const array on updates every when reads writes key held
   period`.split(/\s+/),
);

/** Deliberate exceptions, each with the reason it is not a defect. */
const ALLOW = [
  {
    // The sentence that teaches case-sensitivity has to show the wrong cases.
    file: "azm-book/book1/02-source-syntax.md",
    refs: ["START", "start"],
    why: "the sentence demonstrating that START, start and Start differ",
  },
];

const normalise = (s) => s.toLowerCase().replace(/_/g, "");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

/**
 * Symbols a fence defines: labels, declarations and record fields.
 *
 * Every fence is matched, whatever its language tag, and the non-assembly
 * ones are discarded afterwards. Matching only the assembly openings would
 * pair a closing fence with the next opening one and read the prose between
 * them as code.
 */
function definedIn(text) {
  const defined = new Set();
  for (const [, lang, body] of text.matchAll(
    /```(\w*)[^\n]*\n([\s\S]*?)```/g,
  )) {
    if (lang !== "" && lang !== "asm" && lang !== "z80") continue;
    for (const [, name] of body.matchAll(
      /^\s*@?([A-Za-z_][A-Za-z0-9_]*)\s*:/gm,
    )) {
      defined.add(name);
    }
    for (const [, name] of body.matchAll(
      /^\s*([A-Za-z_][A-Za-z0-9_]*)\s+\.(?:equ|enum|type|typealias|field)\b/gm,
    )) {
      defined.add(name);
    }
  }
  return defined;
}

/**
 * Identifiers named in the prose. Spans that look like a path or a filename
 * are skipped: `examples/02_insertion_sort.asm` names a file, not a symbol.
 */
function referencedIn(text) {
  const prose = text.replace(/```[\s\S]*?```/g, "");
  const refs = new Set();
  for (const [, span] of prose.matchAll(/`([^`\n]+)`/g)) {
    if (/[/\\]/.test(span) || /\.\w{2,4}\b/.test(span)) continue;
    for (const [ident] of span.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g))
      refs.add(ident);
  }
  return refs;
}

const problems = [];

for (const book of BOOK_DIRS) {
  for (const file of walk(path.join(ROOT, book))) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const text = readFileSync(file, "utf8");
    const defined = definedIn(text);
    if (defined.size === 0) continue;

    const byNormal = new Map();
    for (const name of defined) {
      const key = normalise(name);
      if (!byNormal.has(key)) byNormal.set(key, new Set());
      byNormal.get(key).add(name);
    }

    const allowed = new Set(
      ALLOW.filter((a) => a.file === rel).flatMap((a) => a.refs),
    );

    for (const ref of referencedIn(text)) {
      if (defined.has(ref)) continue; // names a symbol that exists
      if (RESERVED.has(ref.toLowerCase())) continue;
      if (GLIMMER_KEYWORDS.has(ref.toLowerCase())) continue;
      if (allowed.has(ref)) continue;

      const candidates = byNormal.get(normalise(ref));
      if (candidates === undefined) continue;

      // A leading underscore is meaningful in AZM: `_skip` is owner-local and
      // `skip` is a different name, so do not treat them as a near-miss.
      const real = [...candidates].filter(
        (name) => name.startsWith("_") === ref.startsWith("_"),
      );
      if (real.length === 0) continue;

      problems.push({ file: rel, ref, real });
    }
  }
}

console.log(`\n  checked ${BOOK_DIRS.join(", ")}`);

if (problems.length === 0) {
  console.log("\nEvery symbol named in prose is defined in code.\n");
  process.exit(0);
}

console.error(
  `\n${problems.length} symbol${problems.length === 1 ? "" : "s"} named in prose but never defined:\n`,
);
for (const p of problems.sort(
  (a, b) => a.file.localeCompare(b.file) || a.ref.localeCompare(b.ref),
)) {
  console.error(`  ${p.file}`);
  console.error(
    `      prose says \`${p.ref}\`, code defines ${p.real.map((r) => `\`${r}\``).join(", ")}`,
  );
}
console.error("");
process.exit(1);
