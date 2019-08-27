import * as path from "path";
import { CompilerOptions, Project, SourceFile, ts } from "ts-morph";
import { ApiConfig } from "../../syntax/api";
import { Contract, Endpoint, Security } from "../definitions";
import { LociTable } from "../locations";
import {
  getClassWithDecoratorOrThrow,
  getDecoratorConfigOrThrow,
  getJsDoc,
  getObjLiteralPropOrThrow,
  getPropertyWithDecorator,
  getPropValueAsStringOrThrow,
  getSelfAndLocalDependencies
} from "../parser-helpers";
import { TypeTable } from "../types";
import { parseEndpoint } from "./endpoint-parser";
import { parseSecurityHeader } from "./security-header-parser";

export function parse(sourcePath: string): Contract {
  const project = createProject();

  // Add all dependent files that the project requires
  const sourceFile = project.addExistingSourceFile(sourcePath);
  project.resolveSourceFileDependencies();

  // Validate that the project has no TypeScript syntax errors
  validateProject(project);

  return parseRootSourceFile(sourceFile);
}

/**
 * Parse a root source file to return a contract.
 */
function parseRootSourceFile(file: SourceFile): Contract {
  const lociTable = new LociTable();
  const typeTable = new TypeTable();

  const klass = getClassWithDecoratorOrThrow(file, "api");
  const decorator = klass.getDecoratorOrThrow("api");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const nameProp = getObjLiteralPropOrThrow<ApiConfig>(decoratorConfig, "name");
  const nameLiteral = getPropValueAsStringOrThrow(nameProp);
  const descriptionDoc = getJsDoc(klass);

  const securityHeaderProp = getPropertyWithDecorator(klass, "securityHeader");

  const security: Security = {
    header:
      securityHeaderProp &&
      parseSecurityHeader(securityHeaderProp, typeTable, lociTable)
  };

  // Add location data
  lociTable.addMorphNode(LociTable.apiClassKey(), klass);
  lociTable.addMorphNode(LociTable.apiDecoratorKey(), decorator);
  lociTable.addMorphNode(LociTable.apiNameKey(), nameProp);
  if (descriptionDoc) {
    lociTable.addMorphNode(LociTable.apiDescriptionKey(), descriptionDoc);
  }

  // Resolve all related files
  const projectFiles = getSelfAndLocalDependencies(file);

  // Parse all endpoints
  const endpoints = projectFiles
    .reduce<Endpoint[]>(
      (acc, currentFile) =>
        acc.concat(
          currentFile
            .getClasses()
            .filter(k => k.getDecorator("endpoint") !== undefined)
            .map(k => parseEndpoint(k, typeTable, lociTable))
        ),
      []
    )
    .sort((a, b) => {
      if (a.name === b.name) {
        throw new Error(`Duplicate endpoint detected: ${a.name}`);
      }
      return b.name > a.name ? -1 : 1;
    });

  return {
    name: nameLiteral.getLiteralText(),
    description: descriptionDoc && descriptionDoc.getComment(),
    types: typeTable.toArray(),
    security,
    endpoints
  };
}

/**
 * Create a new project configured for Spot
 */
function createProject(): Project {
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
  return new Project({ compilerOptions });
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
