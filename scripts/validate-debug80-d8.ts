import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [debug80Root, mapPath] = process.argv.slice(2);
if (debug80Root === undefined || mapPath === undefined) {
  throw new Error("usage: validate-debug80-d8 DEBUG80_ROOT MAP_PATH");
}

const modulePath = path.join(
  debug80Root,
  "apps/debug80-vscode/src/mapping/d8-map.ts",
);
const { parseD8DebugMap } = await import(pathToFileURL(modulePath).href);
const parsed = parseD8DebugMap(await readFile(mapPath, "utf8"));
if (parsed.map === undefined) {
  throw new Error(parsed.error ?? "Debug80 rejected the D8 map");
}
