import * as path from "path";
import {
  ClassDeclaration,
  CompilerOptions,
  Project,
  SourceFile,
  ts,
  TypeGuards
} from "ts-morph";
import { ApiConfig } from "../syntax/api";
import { EndpointConfig } from "../syntax/endpoint";
import { Contract, Endpoint } from "./definitions";
import { LociTable } from "./locations";
import {
  findOneDecoratedClassOrThrow,
  getDecoratorConfigOrThrow,
  getJsDoc,
  getObjLiteralProp,
  getObjLiteralPropOrThrow,
  getPropValueAsArrayOrThrow,
  getPropValueAsStringOrThrow,
  getSelfAndLocalDependencies,
  isHttpMethod
} from "./parser-helpers";

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

  const klass = findOneDecoratedClassOrThrow(file.getClasses(), "api");
  const decorator = klass.getDecoratorOrThrow("api");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const nameProp = getObjLiteralPropOrThrow<ApiConfig>(decoratorConfig, "name");
  const nameLiteral = getPropValueAsStringOrThrow(nameProp);
  const descriptionDoc = getJsDoc(klass);

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
  const endpoints = projectFiles.reduce<Endpoint[]>(
    (acc, currentFile) =>
      acc.concat(
        currentFile
          .getClasses()
          .filter(k => k.getDecorator("endpoint") !== undefined)
          .map(k => parseEndpoint(k, lociTable))
      ),
    []
  );

  return {
    name: nameLiteral.getLiteralText(),
    description: descriptionDoc && descriptionDoc.getComment(),
    types: [],
    security: {}, // TODO parse security
    endpoints
  };
}

function parseEndpoint(
  klass: ClassDeclaration,
  lociTable: LociTable
): Endpoint {
  const decorator = klass.getDecoratorOrThrow("endpoint");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const endpointName = klass.getNameOrThrow();
  const methodProp = getObjLiteralPropOrThrow<EndpointConfig>(
    decoratorConfig,
    "method"
  );
  const methodLiteral = getPropValueAsStringOrThrow(methodProp);
  const methodValue = methodLiteral.getLiteralText();
  const pathProp = getObjLiteralPropOrThrow<EndpointConfig>(
    decoratorConfig,
    "path"
  );
  const pathLiteral = getPropValueAsStringOrThrow(pathProp);
  const tagsProp = getObjLiteralProp<EndpointConfig>(decoratorConfig, "tags");
  const tagsLiteral = tagsProp && getPropValueAsArrayOrThrow(tagsProp);
  const tagsValueLiterals = tagsLiteral
    ? tagsLiteral.getElements().map(elementExpr => {
        if (TypeGuards.isStringLiteral(elementExpr)) {
          return elementExpr;
        } else {
          throw new Error(`tag must be a string`);
        }
      })
    : [];

  if (!isHttpMethod(methodValue)) {
    throw new Error(`expected a HttpMethod, got ${methodValue}`);
  }

  const descriptionDoc = getJsDoc(klass);

  // Add location data
  lociTable.addMorphNode(LociTable.endpointClassKey(endpointName), klass);
  lociTable.addMorphNode(
    LociTable.endpointDecoratorKey(endpointName),
    decorator
  );
  lociTable.addMorphNode(LociTable.endpointMethodKey(endpointName), methodProp);
  lociTable.addMorphNode(LociTable.endpointPathKey(endpointName), pathProp);
  if (descriptionDoc) {
    lociTable.addMorphNode(
      LociTable.endpointDescriptionKey(endpointName),
      descriptionDoc
    );
  }
  if (tagsProp) {
    lociTable.addMorphNode(LociTable.endpointTagsKey(endpointName), tagsProp);
    tagsValueLiterals.forEach(tagLiteral => {
      lociTable.addMorphNode(
        LociTable.endpointTagKey(endpointName, tagLiteral.getLiteralText()),
        tagLiteral
      );
    });
  }

  return {
    name: endpointName,
    description: descriptionDoc && descriptionDoc.getComment(),
    tags: tagsValueLiterals.map(literal => literal.getLiteralText()),
    method: methodValue,
    path: pathLiteral.getLiteralText(),
    request: undefined
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
