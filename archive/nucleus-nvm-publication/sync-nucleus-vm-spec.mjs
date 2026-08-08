/** Generate or verify the Nucleus VM specification reading edition. */
import { syncSpecification } from "./lib/sync-spec-reading-edition.mjs";

syncSpecification({
  expectedSource: "packages/nucleus/docs/virtual-machine-specification.md",
  outputDirectory: "nucleus/vm",
  title: "Nucleus Virtual Machine 0.1 Specification",
  navOrder: 2,
  sourceLabel: "Nucleus VM specification",
  companion:
    "[Companion: Nucleus 0.1 Language Specification](../language/). The language specification governs source-language meaning.",
  localLinks: new Map([["specification.md", "../language/"]]),
});
