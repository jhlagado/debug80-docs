/**
 * Checks that every page llms.txt points at actually exists.
 *
 * llms.txt is a citation map: it tells a language model which pages on this
 * site are the ones worth quoting. That makes a dead URL in it worse than a
 * dead link in a chapter, because nothing on the site links to llms.txt and
 * nobody reads it, so it rots in silence. It had drifted two book renumberings
 * behind before anyone noticed, at which point thirty of its thirty-eight URLs
 * were dead and it was advertising a book that does not exist.
 *
 * There are two copies. `public/llms.txt` is the one served, because VitePress
 * copies `public/` to the site root. The copy at the repo root is a convenience
 * for editing. They drifted apart too, so this checks they are identical.
 *
 * Run after `npm run build`, since it resolves URLs against the built site.
 *
 * Usage: node scripts/check-llms-txt.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const DIST = ".vitepress/dist";
const ORIGIN = "https://debug80.com";
const COPIES = ["llms.txt", "public/llms.txt"];

if (!existsSync(DIST)) {
  console.error(`${DIST} not found. Run "npm run build" first.`);
  process.exit(2);
}

/** A URL resolves if the built site has a file for it, directory or page. */
function resolves(urlPath) {
  const rel = urlPath.replace(/^\//, "");
  const candidates =
    rel === "" || rel.endsWith("/")
      ? [path.join(DIST, rel, "index.html")]
      : [
          path.join(DIST, rel),
          path.join(DIST, `${rel}.html`),
          path.join(DIST, rel, "index.html"),
        ];
  return candidates.some((c) => existsSync(c));
}

let failed = false;

const [first, ...rest] = COPIES.map((f) => readFileSync(f, "utf8"));
for (let i = 0; i < rest.length; i += 1) {
  if (rest[i] !== first) {
    console.log(
      `${COPIES[0]} and ${COPIES[i + 1]} differ. They must be identical; only the public copy is served.`,
    );
    failed = true;
  }
}

for (const file of COPIES) {
  const src = readFileSync(file, "utf8");
  const urls = [...src.matchAll(new RegExp(`${ORIGIN}([^)\\s]*)`, "g"))].map(
    (m) => m[1] || "/",
  );
  const dead = urls.filter((u) => !resolves(u));
  console.log(
    `${file}: ${urls.length - dead.length}/${urls.length} URLs resolve`,
  );
  for (const d of dead) console.log(`  dead  ${ORIGIN}${d}`);
  if (dead.length) failed = true;
}

/**
 * The reverse direction matters too. A book that no page of llms.txt mentions
 * is a book no model will cite, which is the failure that hid the Glimmer book
 * from it entirely.
 */
const SERIES = ["debug80-book", "azm-book", "glimmer-book", "nucleus"];
const missing = SERIES.filter((s) => !first.includes(`${ORIGIN}/${s}/`));
if (missing.length) {
  console.log(`\nno llms.txt entry for: ${missing.join(", ")}`);
  failed = true;
}

process.exitCode = failed ? 1 : 0;
