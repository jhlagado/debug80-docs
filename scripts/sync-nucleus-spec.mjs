/** Generate or verify the Nucleus language-specification reading edition. */
import { syncSpecification } from "./lib/sync-spec-reading-edition.mjs";

syncSpecification({
  expectedSource: "packages/lanternfly/docs/nucleus/specification.md",
  outputSubdirectory: "nucleus",
  title: "Nucleus 0.1 Language Specification",
  navOrder: 3,
  sourceLabel: "Nucleus specification",
  companion:
    "[Companion: Nucleus Virtual Machine 0.1 Specification](../nucleus-vm/).",
});
