import { Project, SourceFile, ts, CompilerOptions } from "ts-simple-ast";
import { parseApi } from "./nodes/api-parser";
import { parseEndpoint } from "./nodes/endpoint-parser";
import { Contract, EndpointDefinition } from "../models/definitions";

export function parseFilePath(
  sourcePath: string,
  customCompilerOptions: CompilerOptions = {}
): Contract {
  const defaultCompilerOptions: CompilerOptions = {
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
    experimentalDecorators: true
  };

  const compilerOptions = {
    ...defaultCompilerOptions,
    ...customCompilerOptions
  };

  const project = new Project({ compilerOptions });
  const sourceFile = project.addExistingSourceFile(sourcePath);

  project.resolveSourceFileDependencies();

  validateProject(project);

  return parseRootSourceFile(sourceFile);
}

/**
 * Parse a root source file to return a contract.
 *
 * @param file source file
 */
function parseRootSourceFile(file: SourceFile): Contract {
  const apiClasses = file
    .getClasses()
    .filter(klass => klass.getDecorator("api") !== undefined);

  if (apiClasses.length !== 1) {
    throw new Error(
      `expected class decorated with @api to be defined exactly once in root source file, found ${
        apiClasses.length
      } usages`
    );
  }
  const api = parseApi(apiClasses[0]);

  const sourceEndpoints = file
    .getClasses()
    .filter(klass => klass.getDecorator("endpoint") !== undefined)
    .map(endpointClass => parseEndpoint(endpointClass));

  const importedFiles = file
    .getImportDeclarations()
    .map(myImport => myImport.getModuleSpecifierSourceFileOrThrow());

  const endpoints = importedFiles.reduce<EndpointDefinition[]>(
    (endpointsAcc, fileCurr) =>
      fileCurr
        .getClasses()
        .filter(klass => klass.getDecorator("endpoint") !== undefined)
        .map(endpointClass => parseEndpoint(endpointClass))
        .concat(endpointsAcc),
    sourceEndpoints
  );

  return { api, endpoints };
}

/**
 * Validate an AST project's correctness.
 *
 * @param project an AST project
 */
function validateProject(project: Project) {
  const diagnostics = project.getPreEmitDiagnostics();
  if (diagnostics.length > 0) {
    throw new Error(
      diagnostics.map(diagnostic => diagnostic.getMessageText()).join("\n")
    );
  }
}
