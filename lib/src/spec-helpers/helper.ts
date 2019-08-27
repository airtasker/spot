import { Project, ts } from "ts-morph";

// TODO: change this to relative from this directory
export const EXAMPLES_DIR = "./lib/src/neu/__spec-examples__/";

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
) {
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
 * Create an AST project with the `@airtasker/spot` depedency loaded.
 */
export function createProject() {
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
        "@airtasker/spot": ["./lib/src/lib"]
      }
    }
  });
}

export function createExistingSourceFile(filePath: string) {
  const project = createProject();
  const sourceFile = project.addExistingSourceFile(filePath);
  project.resolveSourceFileDependencies();
  validateProject(project);
  return sourceFile;
}

/**
 * Validate an AST project's correctness.
 *
 * @param project an AST project
 */
export function validateProject(project: Project) {
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
