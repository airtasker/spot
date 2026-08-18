import { Project } from "ts-morph";
import { Contract } from "./definitions";
import { parseContract } from "./parsers/contract-parser";
import { createContractProject } from "./ts-project";

export function parse(sourcePath: string): Contract {
  const project = createContractProject();

  // Add all dependent files that the project requires
  const sourceFile = project.addSourceFileAtPath(sourcePath);
  project.resolveSourceFileDependencies();

  // Validate that the project has no TypeScript syntax errors
  validateProject(project);

  const result = parseContract(sourceFile);

  // TODO: print human readable errors
  if (result.isErr()) throw result.unwrapErr();

  return result.unwrap().contract;
}

/**
 * Validate an AST project's correctness.
 *
 * @param project an AST project
 */
function validateProject(project: Project): void {
  const diagnostics = project.getPreEmitDiagnostics();
  if (diagnostics.length > 0) {
    throw new Error(
      diagnostics
        .map(diagnostic => {
          const message = diagnostic.getMessageText();
          return typeof message === "string"
            ? message
            : message.getMessageText();
        })
        .join("\n")
    );
  }
}
