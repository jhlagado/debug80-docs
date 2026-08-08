/** Generate or verify the Nucleus Z80 runtime-contract reading edition. */
import { syncSpecification } from "./lib/sync-spec-reading-edition.mjs";

syncSpecification({
  expectedSource: "packages/nucleus/docs/z80-runtime-contract.md",
  outputDirectory: "nucleus/runtime",
  title: "Nucleus Z80 Runtime and Backend Contract 0.1",
  navOrder: 2,
  sourceLabel: "Nucleus Z80 runtime and backend contract",
  companion:
    "[Companion: Nucleus 0.1 Language Specification](../language/). The language specification governs source-language meaning.",
  localLinks: new Map([["specification.md", "../language/"]]),
});
