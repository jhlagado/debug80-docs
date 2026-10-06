/** Generate or verify the Nucleus language-specification reading edition. */
import { syncSpecification } from "./lib/sync-spec-reading-edition.mjs";

syncSpecification({
  expectedSource: "docs/specification.md",
  outputDirectory: "nucleus/language",
  title: "Nucleus 0.1 Language Specification",
  navOrder: 1,
  sourceLabel: "Nucleus specification",
  sourceRepositoryLabel: "standalone Nucleus repository",
  sourceRepositoryUrl: "https://github.com/jhlagado/nucleus",
  companion:
    "[Teaching companion: Programming Nucleus](../book1/). [Technical companion: Nucleus Z80 Runtime and Backend Contract 0.1](../runtime/).",
  localLinks: new Map([["z80-runtime-contract.md", "../runtime/"]]),
});
