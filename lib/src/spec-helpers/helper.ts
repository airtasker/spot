import * as path from "path";
import { Project, SourceFile, ts } from "ts-morph";

/**
 * Create an AST source file. Any files imported from the main file must also be provided.
 * All files will be loaded into a virtual filesystem under a `test/` directory.
 *
 * @param mainFile details for main file
 * @param referencedContent details for referenced files
 * @returns the main source file
 */
export function createSourceFile(
  mainFile: FileDetail,
  ...referencedFiles: FileDetail[]
): SourceFile {
  const project = createProject();
  referencedFiles.forEach(fileDetail => {
    project.createSourceFile(`test/${fileDetail.path}.ts`, fileDetail.content);
  });
  const mainSource = project.createSourceFile(
    `test/${mainFile.path}.ts`,
    mainFile.content
  );

  validateProject(project);

  return mainSource;
}

interface FileDetail {
  /** File path */
  path: string;
  /** File content */
  content: string;
}

/**
 * Create an AST project with the `@airtasker/spot` dependency loaded.
 */
export function createProject(): Project {
  return new Project({
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      experimentalDecorators: true,
      baseUrl: "./",
      paths: {
        "@airtasker/spot": [path.join(__dirname, "../lib")]
      }
    }
  });
}

export function createProjectFromExistingSourceFile(
  filePath: string
): { project: Project; file: SourceFile } {
  const project = createProject();
  const file = project.addSourceFileAtPath(filePath);
  project.resolveSourceFileDependencies();
  validateProject(project);
  return { project, file };
}

/**
 * Validate an AST project's correctness.
 *
 * @param project an AST project
 */
export function validateProject(project: Project): void {
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
