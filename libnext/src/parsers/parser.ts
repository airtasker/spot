import { CompilerOptions, Project, SourceFile, ts } from "ts-simple-ast";
import { ContractNode, EndpointNode } from "../models/nodes";
import { ReferenceType } from "../models/types";
import { parseApi } from "./nodes/api-parser";
import { parseEndpoint } from "./nodes/endpoint-parser";
import { extractJsDocComment } from "./utilities/parser-utility";
import { parseInterfaceDeclaration, parseType } from "./utilities/type-parser";
import {
  retrieveTypeReferencesFromEndpoints,
  retrieveTypeReferencesFromType,
  uniqueReferences
} from "./utilities/type-reference-resolver";

export function parseFilePath(
  sourcePath: string,
  customCompilerOptions: CompilerOptions = {}
): ContractNode {
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

  const sourceEndpoints = file
    .getClasses()
    .filter(klass => klass.getDecorator("endpoint") !== undefined)
    .map(endpointClass => parseEndpoint(endpointClass));

  const importedFiles = file
    .getImportDeclarations()
    .map(myImport => myImport.getModuleSpecifierSourceFileOrThrow());

  const endpoints = importedFiles.reduce<EndpointNode[]>(
    (endpointsAcc, currentFile) =>
      currentFile
        .getClasses()
        .filter(klass => klass.getDecorator("endpoint") !== undefined)
        .map(endpointClass => parseEndpoint(endpointClass))
        .concat(endpointsAcc),
    sourceEndpoints
  );

  // Direct reference types, filtered to unique references for efficiency
  const uniqueDirectReferenceTypes = uniqueReferences(
    retrieveTypeReferencesFromEndpoints(endpoints)
  );

  // Reference types from the direct reference type hierarchy
  const secondaryReferenceTypes = uniqueDirectReferenceTypes.reduce<
    ReferenceType[]
  >(
    (referenceTypesAcc, currentReferenceType) =>
      referenceTypesAcc.concat(
        retrieveTypeReferencesFromType(currentReferenceType, projectContext)
      ),
    []
  );

  // Combine and filter to unique type references
  const allReferenceTypes = uniqueReferences(
    uniqueDirectReferenceTypes.concat(secondaryReferenceTypes)
  );

  // Construct the equivalent TypeNode for each reference type
  const types = allReferenceTypes.map(referenceType => {
    const file = projectContext.getSourceFileOrThrow(referenceType.location);

    const typeAlias = file.getTypeAlias(referenceType.name);
    if (typeAlias !== undefined) {
      const name = typeAlias.getName();
      const description = extractJsDocComment(typeAlias);
      const type = parseType(typeAlias.getTypeNodeOrThrow());
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
