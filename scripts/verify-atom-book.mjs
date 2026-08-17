import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const atomExecutable = process.env.ATOM_EXECUTABLE ?? path.join(
  repository,
  "node_modules",
  ".bin",
  "atom",
);
const source = path.join(repository, "atom-book", "book1", "examples", "reference-tour");
const counterSource = path.join(repository, "atom-book", "book1", "examples", "counter.asm");

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
assert.doesNotMatch(
  assemblyCode(await fs.readFile(counterSource, "utf8")),
  /[a-z]/,
  "counter.asm contains lowercase Atom source",
);

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
  console.log("Atom Book 1 assembly examples: uppercase source verified");
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
