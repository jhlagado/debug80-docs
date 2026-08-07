/** Generate or verify the Nucleus VM specification reading edition. */
import { syncSpecification } from "./lib/sync-spec-reading-edition.mjs";

syncSpecification({
  expectedSource:
    "packages/lanternfly/docs/nucleus/virtual-machine-specification.md",
  outputSubdirectory: "nucleus-vm",
  title: "Nucleus Virtual Machine 0.1 Specification",
  navOrder: 4,
  sourceLabel: "Nucleus VM specification",
  companion:
    "[Companion: Nucleus 0.1 Language Specification](../nucleus/). The language specification governs source-language meaning.",
  localLinks: new Map([["specification.md", "../nucleus/"]]),
});
