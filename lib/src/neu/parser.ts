import * as path from "path";
import {
  ClassDeclaration,
  CompilerOptions,
  MethodDeclaration,
  ParameterDeclaration,
  Project,
  PropertyDeclaration,
  SourceFile,
  ts,
  TypeGuards
} from "ts-morph";
import { ApiConfig } from "../syntax/api";
import { EndpointConfig } from "../syntax/endpoint";
import {
  Body,
  Contract,
  Endpoint,
  Header,
  PathParam,
  QueryParam,
  Request,
  Security,
  SecurityHeader
} from "./definitions";
import { LociTable } from "./locations";
import {
  findOneDecoratedClassOrThrow,
  getDecoratorConfigOrThrow,
  getJsDoc,
  getMethodWithDecorator,
  getObjLiteralProp,
  getObjLiteralPropOrThrow,
  getParameterTypeAsTypeLiteralOrThrow,
  getParamWithDecorator,
  getPropertyName,
  getPropertyWithDecorator,
  getPropValueAsArrayOrThrow,
  getPropValueAsStringOrThrow,
  getSelfAndLocalDependencies,
  isHttpMethod
} from "./parser-helpers";
import { parseType, TypeTable } from "./type-parser";

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

  const klass = findOneDecoratedClassOrThrow(file.getClasses(), "api");
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
  const endpoints = projectFiles.reduce<Endpoint[]>(
    (acc, currentFile) =>
      acc.concat(
        currentFile
          .getClasses()
          .filter(k => k.getDecorator("endpoint") !== undefined)
          .map(k => parseEndpoint(k, typeTable, lociTable))
      ),
    []
  );

  return {
    name: nameLiteral.getLiteralText(),
    description: descriptionDoc && descriptionDoc.getComment(),
    types: [],
    security,
    endpoints
  };
}

function parseSecurityHeader(
  property: PropertyDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): SecurityHeader {
  const decorator = property.getDecoratorOrThrow("securityHeader");
  const name = getPropertyName(property);
  const descriptionDoc = getJsDoc(property);

  return {
    name,
    description: descriptionDoc && descriptionDoc.getComment(),
    type: parseType(property.getTypeNodeOrThrow(), typeTable, lociTable)
  };
}

function parseEndpoint(
  klass: ClassDeclaration,
  typeTable: TypeTable,
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
  if (!isHttpMethod(methodValue)) {
    throw new Error(`expected a HttpMethod, got ${methodValue}`);
  }
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

  const descriptionDoc = getJsDoc(klass);

  const requestMethod = getMethodWithDecorator(klass, "request");
  const request =
    requestMethod &&
    parseRequest(requestMethod, typeTable, lociTable, { endpointName });

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
    request
  };
}

function parseRequest(
  method: MethodDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable,
  lociContext: {
    endpointName: string;
  }
): Request {
  const decorator = method.getDecoratorOrThrow("request");
  const headersParam = getParamWithDecorator(method, "headers");
  const pathParamsParam = getParamWithDecorator(method, "pathParams");
  const queryParamsParam = getParamWithDecorator(method, "queryParams");
  const bodyParam = getParamWithDecorator(method, "body");

  const headers = headersParam
    ? parseHeaders(headersParam, typeTable, lociTable)
    : [];

  const pathParams = pathParamsParam
    ? parsePathParams(pathParamsParam, typeTable, lociTable)
    : [];

  const queryParams = queryParamsParam
    ? parseQueryParams(queryParamsParam, typeTable, lociTable)
    : [];

  const body = bodyParam && parseBody(bodyParam, typeTable, lociTable);

  // TODO: add loci information

  return {
    headers,
    pathParams,
    queryParams,
    body
  };
}

function parseHeaders(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Header[] {
  const decorator = parameter.getDecoratorOrThrow("headers");
  // TODO check parameter.isOptional()
  if (parameter.hasQuestionToken()) {
    throw new Error("@headers parameter cannot be optional");
  }
  const type = getParameterTypeAsTypeLiteralOrThrow(parameter);
  const headers = type.getProperties().map(p => {
    const pDescription = getJsDoc(p);
    return {
      name: getPropertyName(p),
      type: parseType(p.getTypeNodeOrThrow(), typeTable, lociTable),
      description: pDescription && pDescription.getComment(),
      optional: p.hasQuestionToken()
    };
  });
  // TODO: add loci information
  return headers;
}

function parsePathParams(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): PathParam[] {
  const decorator = parameter.getDecoratorOrThrow("pathParams");
  if (parameter.hasQuestionToken()) {
    throw new Error("@pathParams parameter cannot be optional");
  }
  const type = getParameterTypeAsTypeLiteralOrThrow(parameter);
  const pathParams = type.getProperties().map(p => {
    const pDescription = getJsDoc(p);
    if (parameter.hasQuestionToken()) {
      throw new Error("@pathParams properties cannot be optional");
    }
    return {
      name: getPropertyName(p),
      type: parseType(p.getTypeNodeOrThrow(), typeTable, lociTable),
      description: pDescription && pDescription.getComment()
    };
  });
  // TODO: add loci information
  return pathParams;
}

function parseQueryParams(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): QueryParam[] {
  const decorator = parameter.getDecoratorOrThrow("queryParams");
  if (parameter.hasQuestionToken()) {
    throw new Error("@queryParams parameter cannot be optional");
  }
  const type = getParameterTypeAsTypeLiteralOrThrow(parameter);
  const queryParams = type.getProperties().map(p => {
    const pDescription = getJsDoc(p);
    return {
      name: getPropertyName(p),
      type: parseType(p.getTypeNodeOrThrow(), typeTable, lociTable),
      description: pDescription && pDescription.getComment(),
      optional: p.hasQuestionToken()
    };
  });
  // TODO: add loci information
  return queryParams;
}

function parseBody(
  parameter: ParameterDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Body {
  const decorator = parameter.getDecoratorOrThrow("body");
  if (parameter.hasQuestionToken()) {
    throw new Error("@body parameter cannot be optional");
  }
  const type = parseType(parameter.getTypeNodeOrThrow(), typeTable, lociTable);
  // TODO: add loci information
  return {
    // TODO: how to extract description from parameter declaration?
    description: undefined,
    type
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
