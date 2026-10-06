/** Compile book sources with the reference compiler and execute generated Z80.
 * BASIE_ROOT names a sibling checkout. ATOM builds the runtime in docs only.
 * Run using that checkout's deno.runtime.json import configuration.
 */
const root = Deno.env.get("BASIE_ROOT") ??
  new URL("../../basie/", import.meta.url).pathname;
const docs = new URL("../", import.meta.url).pathname;
const { compile } = await import(`file://${root}/ref/compile/index.ts`);
const { readLibrary } = await import(`file://${root}/ref/object/library.ts`);
const { runCom } = await import(`file://${root}/tests/harness/cpm.ts`);
const { buildLibrary } = await import(`file://${root}/tools/brl.ts`);
const built = await buildLibrary(
  await Deno.readTextFile(`${root}/runtime/cpm22/cpm22.asm`),
  `${docs}_internal/basie-book-runtime`,
  `${root}/runtime/cpm22`,
);
const library = readLibrary(built.file);
const revision = await new Deno.Command("git", {
  args: ["-C", root, "rev-parse", "HEAD"],
  stdout: "piped",
}).output();
const results: Record<string, unknown>[] = [];
const expectedOutput: Record<string, string> = {
  "01-postage.BSI": "135\r\n",
  "CHARS.BSI": "?AA\r\n",
  "ECHO.BSI": "Name? \nHello, Ada\r\n",
  "READINGS.BSI": "Mean: 15.0\r\n",
  "COMMAND.BSI": "Result: 246\r\nInvalid number\r\n",
  "CAPSTONE.BSI": "Result: 246\r\nInvalid number\r\nQueue full\r\n",
};
let failures = 0;
const folder = `${docs}basie/book1/examples`;
const entries = [...Deno.readDirSync(folder)]
  .filter((e) => e.isFile && e.name.endsWith(".BSI"))
  .sort((a, b) => a.name.localeCompare(b.name));
for (const entry of entries) {
  const result = await compile(`${folder}/${entry.name}`, { library });
  if (!result.ok) {
    console.log(`FAIL ${entry.name}: ${JSON.stringify(result)}`);
    failures++;
    results.push({ source: entry.name, status: "compile-failed", result });
    continue;
  }
  const input = entry.name === "CHARS.BSI" ? "A"
    : entry.name === "ECHO.BSI" ? "Ada\r" : "";
  const run = runCom(result.com, { input });
  const expected = expectedOutput[entry.name] ?? "";
  const ok = run.output === expected && run.returnCode === 0;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${entry.name}: ${result.imageSize} bytes`,
  );
  failures += ok ? 0 : 1;
  results.push({
    source: entry.name,
    status: ok ? "pass" : "run-failed",
    imageBytes: result.imageSize,
    input,
    output: run.output,
    expectedOutput: expected,
    returnCode: run.returnCode,
  });
  if (entry.name === "ECHO.BSI") {
    // BDOS 10 echo is deliberately absent from the minimal test harness.
    for (const test of [
      { name: "empty-line", input: "\r", answer: "" },
      { name: "full-buffer", input: "A".repeat(32) + "\r", answer: "A".repeat(32) },
      { name: "capacity-limit", input: "A".repeat(33) + "\r", answer: "A".repeat(32) },
    ]) {
      const run = runCom(result.com, { input: test.input });
      const expected = `Name? \nHello, ${test.answer}\r\n`;
      const ok = run.output === expected && run.returnCode === 0;
      console.log(`${ok ? "PASS" : "FAIL"} ECHO.BSI/${test.name}`);
      failures += ok ? 0 : 1;
      results.push({
        source: `ECHO.BSI/${test.name}`,
        status: ok ? "pass" : "run-failed",
        input: test.input,
        output: run.output,
        expectedOutput: expected,
        returnCode: run.returnCode,
      });
    }
  }
}
const boundaries = [
  { source: "BOUNDS.BSI", trap: "bounds" },
  { source: "NARROW.BSI", trap: "narrowing" },
  { source: "READONLY.BSI", diagnostic: "not-writable" },
  { source: "COPY.BSI", diagnostic: "needs-move" },
  { source: "ESCAPE.BSI", diagnostic: "alias-escapes" },
];
for (const check of boundaries) {
  const result = await compile(`${folder}/checks/${check.source}`, { library });
  let observed: string | undefined;
  let output: string | undefined;
  if (result.ok) {
    const run = runCom(result.com);
    output = run.output;
    observed = run.returnCode === 0xff02
      ? run.output.match(/TRAP ([a-z-]+)/)?.[1]
      : undefined;
  } else if ("diagnostics" in result) observed = result.diagnostics[0]?.code;
  const expected = check.trap ?? check.diagnostic;
  const ok = observed === expected;
  console.log(`${ok ? "PASS" : "FAIL"} checks/${check.source}: ${observed}`);
  failures += ok ? 0 : 1;
  results.push({
    source: `checks/${check.source}`,
    status: ok ? "pass" : "failed",
    expected,
    observed,
    output,
  });
}
await Deno.writeTextFile(
  `${docs}basie/editorial/verification.json`,
  JSON.stringify(
    {
      compilerRevision: new TextDecoder().decode(revision.stdout).trim(),
      method:
        "Reference compiler, runtime assembled with ATOM into debug80-docs/_internal, generated Z80 under minimal CP/M harness. Assertions test chapter results. Native compiler and physical CP/M not verified.",
      results,
    },
    null,
    2,
  ) + "\n",
);
if (failures) Deno.exit(1);
