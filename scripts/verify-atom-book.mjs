import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assembleAtomProject,
  materializeAtomGeneration,
} from "atom-z80";
import { MNEMONICS } from "../node_modules/atom-z80/src/abi.mjs";
import { createZ80Runtime } from "../node_modules/atom-z80/node_modules/@jhlagado/debug80-runtime/dist/index.js";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const atomExecutable = process.env.ATOM_EXECUTABLE ?? path.join(
  repository,
  "node_modules",
  ".bin",
  "atom",
);
const source = path.join(repository, "atom-book", "book1", "examples", "reference-tour");
const counterSource = path.join(repository, "atom-book", "book1", "examples", "counter.asm");
const programmingExamples = path.join(repository, "atom-book", "book2", "examples");

function run(command, arguments_, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      ...options,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function assemblyCode(text) {
  return text.replace(/"(?:\\.|[^"\\])*"/g, "\"\"").replace(/;.*/g, "");
}

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(filename));
    else if (entry.name.endsWith(".md")) files.push(filename);
  }
  return files;
}

async function filesWithExtension(directory, extension) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesWithExtension(filename, extension));
    else if (entry.name.endsWith(extension)) files.push(filename);
  }
  return files;
}

for (const filename of await markdownFiles(path.join(repository, "atom-book"))) {
  const text = await fs.readFile(filename, "utf8");
  for (const match of text.matchAll(/```asm\s*\n([\s\S]*?)```/g)) {
    assert.doesNotMatch(
      assemblyCode(match[1]),
      /[a-z]/,
      `${path.relative(repository, filename)} contains a lowercase assembly example`,
    );
  }
}

for (const filename of ["main.asm", path.join("lib", "device.asm")]) {
  assert.doesNotMatch(
    assemblyCode(await fs.readFile(path.join(source, filename), "utf8")),
    /[a-z]/,
    `${filename} contains lowercase Atom source`,
  );
}
for (const filename of await filesWithExtension(path.join(repository, "atom-book"), ".asm")) {
  assert.doesNotMatch(
    assemblyCode(await fs.readFile(filename, "utf8")),
    /[a-z]/,
    `${path.relative(repository, filename)} contains lowercase Atom source`,
  );
}

async function executeProgrammingExample(entry, expected, root = programmingExamples) {
  const assembled = await assembleAtomProject({
    root,
    entry,
    target: { start: 0, capacity: 0xffff },
  });
  const image = materializeAtomGeneration(assembled.generation);
  const memory = new Uint8Array(0x10000);
  memory.set(image.bytes, image.base);
  const runtime = createZ80Runtime({ memory, startAddress: 0 }, 0);
  for (let instructions = 0; !runtime.isHalted(); instructions += 1) {
    assert.ok(instructions < 1_000_000, `${entry} did not halt within its execution budget`);
    runtime.step();
  }
  const symbols = new Map(assembled.generation.symbols.map(({ name, value }) => [name, value]));
  for (const [name, bytes] of Object.entries(expected)) {
    const address = symbols.get(name);
    assert.notEqual(address, undefined, `${entry} has no ${name} symbol`);
    assert.deepEqual(
      Array.from(runtime.hardware.memory.slice(address, address + bytes.length)),
      bytes,
      `${entry} produced the wrong ${name} bytes`,
    );
  }
  return assembled.execution;
}

async function executeMarkdownProgram(relativeName, blockIndex, expected) {
  const markdown = await fs.readFile(path.join(repository, relativeName), "utf8");
  const blocks = [...markdown.matchAll(/```asm\s*\n([\s\S]*?)```/g)];
  assert.ok(blocks[blockIndex], `${relativeName} has no assembly block ${blockIndex}`);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "atom-book-program-"));
  try {
    await fs.writeFile(path.join(root, "program.asm"), blocks[blockIndex][1]);
    return await executeProgrammingExample("program.asm", expected, root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "atom-book-"));
try {
  await fs.cp(source, temporary, { recursive: true });
  const assembled = await run(
    atomExecutable,
    ["--origin", "4000H", "main.asm"],
    { cwd: temporary },
  );
  assert.equal(assembled.status, 0, assembled.stderr);
  assert.match(assembled.stdout, /Atom assembled 2 part\(s\), 18 byte\(s\)/);
  const binary = await fs.readFile(
    path.join(temporary, "build", "main.atom", "current", "main.bin"),
  );
  assert.deepEqual(
    binary,
    Buffer.from([
      0x3e, 0x2a, 0x18, 0x01, 0x58, 0x00, 0x40, 0x00,
      0x4f, 0x4b, 0x00, 0x01, 0x41, 0xda, 0x00, 0x00,
      0xff, 0xff,
    ]),
  );
  const counterDirectory = path.join(temporary, "counter");
  await fs.mkdir(counterDirectory);
  await fs.copyFile(counterSource, path.join(counterDirectory, "counter.asm"));
  const counter = await run(
    atomExecutable,
    ["--origin", "4000H", "counter.asm"],
    { cwd: counterDirectory },
  );
  assert.equal(counter.status, 0, counter.stderr);
  assert.deepEqual(
    await fs.readFile(
      path.join(counterDirectory, "build", "counter.atom", "current", "counter.bin"),
    ),
    Buffer.from([0x06, 0x08, 0x21, 0x09, 0x40, 0x34, 0x10, 0xfd, 0x76, 0x00]),
  );
  console.log("Atom Book 1 example: 18/18 bytes verified through published Atom");
  console.log("Atom Book 1 counter: 10/10 bytes verified through published Atom");
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}

await executeProgrammingExample("arithmetic.asm", {
  GCDRES: [6, 0],
  POWRES: [81],
});
await executeProgrammingExample("sorting.asm", {
  VALUES: [1, 2, 3, 4, 6, 7, 8, 9],
  FOUNDIDX: [4],
});
await executeProgrammingExample("strings.asm", {
  BUFFER: [72, 69, 76, 76, 79, 0],
  STRLENB: [5],
  COPYOK: [1],
  FINDIDX: [2],
});
await executeProgrammingExample("bit-flags.asm", {
  FLAGS: [3],
  READYLIT: [1],
  ERRORBIT: [1],
});
await executeProgrammingExample("recursion.asm", {
  FACTR: [120],
  FACTI: [120],
  SUMR: [26, 0],
});
await executeMarkdownProgram("atom-book/book2/03-assembly-language.md", 0, {
  RESULT: [8],
});
await executeMarkdownProgram("atom-book/book2/10-a-complete-program.md", 0, {
  MAX_VAL: [91],
  ABOVE_64: [3],
});

const instructionReference = await fs.readFile(
  path.join(repository, "atom-book", "appendices", "10-z80-instruction-reference.md"),
  "utf8",
);
const referenceMnemonics = [...instructionReference.matchAll(
  /^\| `([A-Z]+)`(?: \/ `([A-Z]+)`)? \|/gm,
)].flatMap((match) => match[2] === undefined ? [match[1]] : [match[1], match[2]]);
assert.deepEqual(
  [...referenceMnemonics].sort(),
  MNEMONICS.slice(1).sort(),
  "the Atom instruction appendix must contain every published mnemonic exactly once",
);

const referenceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "atom-book-reference-"));
try {
  await fs.writeFile(path.join(referenceRoot, "reference.asm"), [
    "ORG 0",
    "IN (C)",
    "OUT (C),0",
    "LD HL,DE",
    "LD BC,DE",
    "AND A,B",
    "RLC (IX+3),B",
    "RES 2,(IY-1),A",
    "",
  ].join("\n"));
  const reference = await assembleAtomProject({
    root: referenceRoot,
    entry: "reference.asm",
    target: { start: 0, capacity: 0xffff },
  });
  assert.deepEqual(
    Array.from(materializeAtomGeneration(reference.generation).bytes),
    [
      0xed, 0x70, 0xed, 0x71,
      0x62, 0x6b, 0x42, 0x4b, 0xa0,
      0xdd, 0xcb, 0x03, 0x00,
      0xfd, 0xcb, 0xff, 0x97,
    ],
    "Atom reference-only instruction forms changed",
  );
} finally {
  await fs.rm(referenceRoot, { recursive: true, force: true });
}

console.log("Atom Book 2 examples: 7/7 assembled and executed through published Atom");
console.log("Atom instruction appendix: 69/69 mnemonics and reference-only forms verified");
console.log("Atom books: uppercase assembly source verified");
