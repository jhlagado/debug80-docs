import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const examplesRoot = path.join(repositoryRoot, "nucleus", "book1", "examples");
const debug80Root = path.resolve(
  process.env.DEBUG80_ROOT ?? path.join(repositoryRoot, "..", "debug80"),
);

const globalModules = execFileSync("npm", ["root", "-g"], {
  encoding: "utf8",
}).trim();

const importPackage = async (name) => {
  const packageRoot = path.join(globalModules, "@jhlagado", name, "dist");
  return await import(pathToFileURL(path.join(packageRoot, "index.js")));
};

const nucleusPackageRoot = path.join(globalModules, "@jhlagado", "nucleus");
const nucleusCli = path.join(nucleusPackageRoot, "dist", "cli.js");
const debug80Tsx = path.join(debug80Root, "node_modules", ".bin", "tsx");
const debug80Validator = path.join(
  repositoryRoot,
  "scripts",
  "validate-debug80-d8.ts",
);

const nucleus = await importPackage("nucleus");
const debug80Runtime = await importPackage("debug80-runtime");
const linkedNucleusRoot = await realpath(nucleusPackageRoot);
const linkedNucleusCommit = execFileSync(
  "git",
  ["-C", linkedNucleusRoot, "rev-parse", "HEAD"],
  { encoding: "utf8" },
).trim();
const languageIndex = await readFile(
  path.join(repositoryRoot, "nucleus", "language", "index.md"),
  "utf8",
);
const documentedCommit = languageIndex.match(
  /github\.com\/jhlagado\/nucleus\/blob\/([0-9a-f]{40})\/docs\/specification\.md/,
)?.[1];
if (
  documentedCommit === undefined ||
  linkedNucleusCommit !== documentedCommit
) {
  throw new Error(
    `linked Nucleus commit ${linkedNucleusCommit} differs from reading-edition commit ${documentedCommit ?? "missing"}`,
  );
}
const compilerInfo = await nucleus.createNucleusCompiler().info();
if (
  compilerInfo.hostApiVersion !== 1 ||
  compilerInfo.languageVersion !== "0.1" ||
  !/^[0-9a-f]{64}$/.test(compilerInfo.normalImageSha256) ||
  !/^[0-9a-f]{64}$/.test(compilerInfo.debugImageSha256) ||
  compilerInfo.normalImageSha256 === compilerInfo.debugImageSha256
) {
  throw new Error("linked Nucleus compiler identity is not Host API 1 / 0.1");
}

const services = {
  readInputByte: 0x7000,
  writeOutputByte: 0x7003,
  readStorageByte: 0x7006,
  rewindStorageInput: 0x7009,
  writeStorageByte: 0x700c,
  seekStorageOutput: 0x700f,
  success: 0x7012,
  unhandledFailure: 0x7015,
  trap: 0x7018,
  farCall: 0x701b,
  farJump: 0x701e,
  packetService: 0x7021,
};

const expectations = {
  "01-postage.nu": {
    initializedTailU16: 135,
    sourceName: "nucleus/book1/examples/01-postage.nu",
    executableLines: [5, 6, 8, 9, 12, 13],
    symbols: ["addPostage", "main"],
  },
  "02-values.nu": {
    initializedTailU16: 97,
    sourceName: "nucleus/book1/examples/02-values.nu",
    executableLines: [9, 10, 11],
    symbols: ["main"],
  },
  "03-expressions.nu": {
    initializedTailU16: 90,
    sourceName: "nucleus/book1/examples/03-expressions.nu",
    executableLines: [6, 7, 8, 9],
    symbols: ["main"],
  },
  "04-decisions.nu": {
    initializedTailU16: 12,
    sourceName: "nucleus/book1/examples/04-decisions.nu",
    executableLines: [4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 19],
    symbols: ["main"],
  },
  "05-loops.nu": {
    initializedTailU16: 3,
    sourceName: "nucleus/book1/examples/05-loops.nu",
    executableLines: [3, 4, 5, 6, 8, 12, 13, 15, 16, 17, 18, 19, 21, 23],
    symbols: ["firstPositive", "main"],
  },
  "06-arrays.nu": {
    initializedTailU16: 21,
    sourceName: "nucleus/book1/examples/06-arrays.nu",
    executableLines: [4, 5, 6, 8, 9, 10],
    symbols: ["main"],
  },
  "07-strings.nu": {
    initializedTailU16: 432,
    sourceName: "nucleus/book1/examples/07-strings.nu",
    executableLines: [5, 6, 7, 8],
    symbols: ["main"],
  },
  "08-records.nu": {
    initializedTailU16: 22,
    sourceName: "nucleus/book1/examples/08-records.nu",
    executableLines: [11, 12, 13],
    symbols: ["main"],
  },
  "09-open-views.nu": {
    initializedTailU16: 22,
    sourceName: "nucleus/book1/examples/09-open-views.nu",
    executableLines: [5, 6, 7, 9, 10, 12, 15, 16, 17, 18, 21, 22, 23],
    symbols: ["sum", "writeOK", "main"],
  },
  "10-routines.nu": {
    initializedTailU16: 34,
    sourceName: "nucleus/book1/examples/10-routines.nu",
    executableLines: [4, 5, 6, 9, 10, 11, 13, 16, 17],
    symbols: ["mark", "choose", "main"],
  },
  "11-aggregate-results.nu": {
    initializedTailU16: 34,
    sourceName: "nucleus/book1/examples/11-aggregate-results.nu",
    executableLines: [10, 11, 12, 14, 17, 18, 21, 22, 23],
    symbols: ["selected", "copyPair", "main"],
  },
  "12-forwards.nu": {
    initializedTailU16: 1,
    sourceName: "nucleus/book1/examples/12-forwards.nu",
    executableLines: [1, 3, 4, 5, 7, 11, 12, 14, 19, 20, 21],
    symbols: ["even", "odd", "main"],
  },
  "13-errors.nu": {
    initializedTailU16: 107,
    sourceName: "nucleus/book1/examples/13-errors.nu",
    executableLines: [4, 5, 6, 8, 11, 12, 13, 16, 17, 19, 20],
    symbols: ["positive", "checked", "main"],
  },
  "14-system-boundary.nu": {
    initializedTailU16: 2,
    sourceName: "nucleus/book1/examples/14-system-boundary.nu",
    executableLines: [4, 5, 6, 7, 10, 11],
    symbols: ["hardwareExamples", "main"],
  },
  "15-debugging.nu": {
    initializedTailU16: 2,
    sourceName: "nucleus/book1/examples/15-debugging.nu",
    executableLines: [4, 5, 8, 9, 10, 11],
    symbols: ["addOne", "main"],
  },
};

const compiler = nucleus.createNucleusCompiler();
const files = (await readdir(examplesRoot))
  .filter((name) => name.endsWith(".nu"))
  .sort();

if (files.length === 0)
  throw new Error("Nucleus book has no complete examples");

for (const name of files) {
  const source = await readFile(path.join(examplesRoot, name));
  const result = await compiler.build({
    sources: [{ name: `nucleus/book1/examples/${name}`, source }],
    target: { services },
    artifacts: { d8: true },
  });
  if (!result.success) {
    throw new Error(
      `${name}: ${result.kind} failure: ${JSON.stringify(result, null, 2)}`,
    );
  }
  if (result.artifacts.d8?.length !== 1) {
    throw new Error(`${name}: compiler omitted the requested flat D8 map`);
  }
  const expected = expectations[name];
  if (expected === undefined) {
    throw new Error(`${name}: missing verifier expectations`);
  }
  const artifact = result.artifacts.d8[0];
  const map = JSON.parse(artifact.json);
  const file = map.files?.[expected.sourceName];
  if (file === undefined) {
    throw new Error(`${name}: D8 omitted ${expected.sourceName}`);
  }
  const executableLines = new Set(
    (file.segments ?? []).map((segment) => segment.line),
  );
  if (
    JSON.stringify([...executableLines].sort((left, right) => left - right)) !==
    JSON.stringify(expected.executableLines)
  ) {
    throw new Error(
      `${name}: D8 executable lines ${JSON.stringify([...executableLines])} differ from ${JSON.stringify(expected.executableLines)}`,
    );
  }
  const symbols = (file.symbols ?? []).map((symbol) => symbol.name);
  if (JSON.stringify(symbols) !== JSON.stringify(expected.symbols)) {
    throw new Error(
      `${name}: D8 symbols ${JSON.stringify(symbols)} differ from ${JSON.stringify(expected.symbols)}`,
    );
  }
  if (
    (file.segments ?? []).some(
      (segment) =>
        segment.start >= segment.end ||
        segment.kind !== "code" ||
        segment.confidence !== "high",
    )
  ) {
    throw new Error(`${name}: D8 contains an invalid executable range`);
  }

  const validationRoot = await mkdtemp(
    path.join(os.tmpdir(), "nucleus-book-d8-"),
  );
  const validationPath = path.join(validationRoot, "example.d8.json");
  await writeFile(validationPath, artifact.json);
  execFileSync(debug80Tsx, [debug80Validator, debug80Root, validationPath], {
    stdio: "pipe",
  });

  const image = result.materialized.flatImage;
  if (image === undefined) throw new Error(`${name}: expected a flat image`);
  const memory = new Uint8Array(0x10000);
  memory.set(image, result.materialized.parsed.begin.imageBase);
  for (const address of Object.values(services)) memory[address] = 0x76;

  const entry = result.materialized.parsed.map.entryAddress;
  const runtime = debug80Runtime.createZ80Runtime(
    { memory, startAddress: entry },
    entry,
  );
  let instructions = 0;
  while (!runtime.isHalted() && instructions < 100_000) {
    runtime.step();
    instructions += 1;
  }
  if (!runtime.isHalted()) {
    throw new Error(`${name}: execution exceeded 100,000 instructions`);
  }
  if (runtime.getPC() !== services.success + 1) {
    throw new Error(
      `${name}: terminated at $${runtime.getPC().toString(16)}, not success`,
    );
  }

  if (expected?.initializedTailU16 !== undefined) {
    const address = result.materialized.parsed.map.bssBase - 2;
    const actual =
      (runtime.hardware.memory[address] ?? 0) |
      ((runtime.hardware.memory[address + 1] ?? 0) << 8);
    if (actual !== expected.initializedTailU16) {
      throw new Error(
        `${name}: final initialized word is ${actual}, expected ${expected.initializedTailU16}`,
      );
    }
  }

  console.log(
    `${name}: compiled and executed (${instructions} instructions, ${result.cycles} compiler T-states)`,
  );
}

const multipartNames = [
  "nucleus/book1/examples/14-parts/library.nu",
  "nucleus/book1/examples/14-parts/main.nu",
];
const multipartResult = await compiler.build({
  sources: await Promise.all(
    multipartNames.map(async (name) => ({
      name,
      source: await readFile(path.join(repositoryRoot, name)),
    })),
  ),
  target: { services },
  artifacts: { d8: true },
});
if (!multipartResult.success) {
  throw new Error(
    `Chapter 14 multipart companion failed: ${JSON.stringify(multipartResult, null, 2)}`,
  );
}
const multipartMap = JSON.parse(multipartResult.artifacts.d8[0].json);
if (multipartNames.some((name) => multipartMap.files?.[name] === undefined)) {
  throw new Error("Chapter 14 multipart D8 lost a source-part identity");
}
console.log("Chapter 14 multipart order and D8 identities verified");

const cliRoot = await mkdtemp(path.join(os.tmpdir(), "nucleus-book-cli-"));
await mkdir(path.join(cliRoot, "examples"));
await writeFile(
  path.join(cliRoot, "examples", "01-postage.nu"),
  await readFile(path.join(examplesRoot, "01-postage.nu")),
);
execFileSync(
  process.execPath,
  [
    nucleusCli,
    "build",
    "--quiet",
    "-o",
    "build/postage.nobj",
    "examples/01-postage.nu",
  ],
  { cwd: cliRoot, stdio: "pipe" },
);
const cliNobj = await readFile(path.join(cliRoot, "build", "postage.nobj"));
const apiNobj = await compiler.build({
  sources: [
    {
      name: "examples/01-postage.nu",
      source: await readFile(path.join(examplesRoot, "01-postage.nu")),
    },
  ],
});
if (!apiNobj.success || !cliNobj.equals(Buffer.from(apiNobj.artifacts.nobj))) {
  throw new Error("the documented CLI command did not produce the API NOBJ");
}
console.log("documented Chapter 1 CLI command: NOBJ identity verified");

const targetText = await readFile(
  path.join(linkedNucleusRoot, "test", "fixtures", "host-target.json"),
);
const toolsRoot = await mkdtemp(path.join(os.tmpdir(), "nucleus-book-tools-"));
await mkdir(path.join(toolsRoot, "examples"));
await writeFile(path.join(toolsRoot, "target.json"), targetText);
const toolsSource = await readFile(path.join(examplesRoot, "15-debugging.nu"));
await writeFile(
  path.join(toolsRoot, "examples", "15-debugging.nu"),
  toolsSource,
);
execFileSync(
  process.execPath,
  [
    nucleusCli,
    "build",
    "--quiet",
    "--root",
    ".",
    "--target-profile",
    "target.json",
    "--hex-output",
    "build/debugging.hex",
    "--d8-output",
    "build/debugging.d8.json",
    "-o",
    "build/debugging.nobj",
    "examples/15-debugging.nu",
  ],
  { cwd: toolsRoot, stdio: "pipe" },
);
const [toolsNobj, toolsHex, toolsD8] = await Promise.all([
  readFile(path.join(toolsRoot, "build", "debugging.nobj")),
  readFile(path.join(toolsRoot, "build", "debugging.hex"), "utf8"),
  readFile(path.join(toolsRoot, "build", "debugging.d8.json"), "utf8"),
]);
const toolsApi = await compiler.build({
  sources: [{ name: "examples/15-debugging.nu", source: toolsSource }],
  target: JSON.parse(targetText.toString("utf8")),
  artifacts: { hex: true, d8: true },
});
if (
  !toolsApi.success ||
  !toolsNobj.equals(Buffer.from(toolsApi.artifacts.nobj)) ||
  toolsHex !== toolsApi.artifacts.hex ||
  toolsD8 !== toolsApi.artifacts.d8[0].json
) {
  throw new Error("Chapter 15 CLI NOBJ, HEX or D8 differs from the Host API");
}
execFileSync(
  debug80Tsx,
  [
    debug80Validator,
    debug80Root,
    path.join(toolsRoot, "build", "debugging.d8.json"),
  ],
  { stdio: "pipe" },
);
console.log("documented Chapter 15 CLI command: NOBJ, HEX and D8 verified");
