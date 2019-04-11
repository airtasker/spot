import path from "path";
import { CompilerOptions, Project, SourceFile, ts } from "ts-morph";
import { Locatable } from "../models/locatable";
import { ContractNode, EndpointNode } from "../models/nodes";
import { parseApi } from "./nodes/api-parser";
import { parseEndpoint } from "./nodes/endpoint-parser";
import { extractJsDocComment } from "./utilities/parser-utility";
import {
  parseInterfaceDeclaration,
  parseTypeNode
} from "./utilities/type-parser";
import {
  retrieveTypeReferencesFromEndpoints,
  uniqueReferences
} from "./utilities/type-reference-resolver";

export function parse(sourcePath: string): ContractNode {
  const compilerOptions: CompilerOptions = {
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
  };

  // Creates a new typescript program in memory
  const project = new Project({ compilerOptions });
  const sourceFile = project.addExistingSourceFile(sourcePath);

  // Add all dependent files that the project requires
  project.resolveSourceFileDependencies();

  // Validate that the project has no TypeScript syntax errors
  validateProject(project);

  return parseRootSourceFile(sourceFile, project);
}

/**
 * Parse a root source file to return a contract.
 */
function parseRootSourceFile(
  file: SourceFile,
  projectContext: Project
): ContractNode {
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

  const endpoints = parseRecursively(file);

  const referenceTypes = uniqueReferences(
    retrieveTypeReferencesFromEndpoints(endpoints, projectContext)
  );

  // Construct the equivalent TypeNode for each reference type
  const types = referenceTypes.map(referenceType => {
    const file = projectContext.getSourceFileOrThrow(referenceType.location);

    const typeAlias = file.getTypeAlias(referenceType.name);
    if (typeAlias !== undefined) {
      const name = typeAlias.getName();
      const description = extractJsDocComment(typeAlias);
      const type = parseTypeNode(typeAlias.getTypeNodeOrThrow());
      return { description, name, type };
    }

    const interfaceDeclaration = file.getInterface(referenceType.name);
    if (interfaceDeclaration) {
      const name = interfaceDeclaration.getName();
      const description = extractJsDocComment(interfaceDeclaration);
      const type = parseInterfaceDeclaration(interfaceDeclaration);
      return { description, name, type };
    }

    throw new Error("unexpected type reference");
  });

  return { api, endpoints, types };
}

/**
 * Parses a file and its local imports/exports recursively, looking for endpoint definitions.
 *
 * @param file The current source file (starting with the root file where the API is defined).
 * @param visitedPaths The list of paths that were already visited, to avoid an infinite loop
 * with circular dependencies.
 */
function parseRecursively(
  file: SourceFile,
  visitedPaths: string[] = []
): Array<Locatable<EndpointNode>> {
  const filePath = file.getFilePath();
  if (visitedPaths.indexOf(filePath) !== -1) {
    // Don't visit the same file multiple times.
    return [];
  } else {
    visitedPaths.push(filePath);
  }

  const endpoints = file
    .getClasses()
    .filter(klass => klass.getDecorator("endpoint") !== undefined)
    .map(endpointClass => parseEndpoint(endpointClass));

  const importedFiles = file
    .getImportDeclarations()
    // We only care about local imports.
    .filter(i => i.getModuleSpecifierValue().startsWith("."))
    .map(myImport => myImport.getModuleSpecifierSourceFileOrThrow());

  const exportedFiles = file
    .getExportDeclarations()
    // We only care about local imports.
    .filter(e => {
      const moduleSpecifierValue = e.getModuleSpecifierValue();
      return moduleSpecifierValue && moduleSpecifierValue.startsWith(".");
    })
    .map(myImport => myImport.getModuleSpecifierSourceFileOrThrow());

  return [...importedFiles, ...exportedFiles].reduce<
    Array<Locatable<EndpointNode>>
  >(
    (endpointsAcc, currentFile) =>
      parseRecursively(currentFile, visitedPaths).concat(endpointsAcc),
    endpoints
  );
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
