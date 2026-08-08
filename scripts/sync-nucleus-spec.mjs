/** Generate or verify the Nucleus language-specification reading edition. */
import { syncSpecification } from "./lib/sync-spec-reading-edition.mjs";

syncSpecification({
  expectedSource: "packages/nucleus/docs/specification.md",
  outputDirectory: "nucleus/language",
  title: "Nucleus 0.1 Language Specification",
  navOrder: 1,
  sourceLabel: "Nucleus specification",
  companion: "[Companion: Nucleus Virtual Machine 0.1 Specification](../vm/).",
});
