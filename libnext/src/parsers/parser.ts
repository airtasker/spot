import { Project, SourceFile, ts, CompilerOptions } from "ts-simple-ast";
import { parseApi } from "./nodes/api-parser";
import { parseEndpoint } from "./nodes/endpoint-parser";
import {
  ParsedContract,
  ParsedEndpoint,
  ParsedHeader,
  ParsedRequest,
  ParsedResponse
} from "../models/definitions";
import {
  isObjectType,
  isArrayType,
  DataType,
  isUnionType,
  ReferenceType,
  isReferenceType,
  Kind
} from "../models/types";
import { parseObjectLiteralType, parseType } from "./utilities/type-parser";
import { extractJsDocComment } from "./utilities/parser-utility";
import { uniqBy } from "lodash";

export function parseFilePath(
  sourcePath: string,
  customCompilerOptions: CompilerOptions = {}
): ParsedContract {
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

  return parseRootSourceFile(sourceFile, project);
}

/**
 * Parse a root source file to return a contract.
 *
 * @param file source file
 */
function parseRootSourceFile(
  file: SourceFile,
  projectContext: Project
): ParsedContract {
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

  const endpoints = importedFiles.reduce<ParsedEndpoint[]>(
    (endpointsAcc, currentFile) =>
      currentFile
        .getClasses()
        .filter(klass => klass.getDecorator("endpoint") !== undefined)
        .map(endpointClass => parseEndpoint(endpointClass))
        .concat(endpointsAcc),
    sourceEndpoints
  );

  const directReferencedTypes = endpoints.reduce<ReferenceType[]>(
    (referenceTypesAcc, currentEndpoint) => {
      const fromResponses = retrieveTypeReferencesFromResponses(
        currentEndpoint.responses
      );
      if (currentEndpoint.request) {
        const fromRequest = fromResponses.concat(
          retrieveTypeReferencesFromRequest(currentEndpoint.request)
        );
        return referenceTypesAcc.concat(fromRequest).concat(fromResponses);
      }
      return referenceTypesAcc.concat(fromResponses);
    },
    []
  );

  const uniqueDirectReferenceTypes = uniqueReferences(directReferencedTypes);

  const secondaryReferenceTypes = uniqueDirectReferenceTypes.reduce<
    ReferenceType[]
  >(
    (referenceTypesAcc, currentReferenceType) =>
      referenceTypesAcc.concat(
        retrieveTypeReferencesFromType(currentReferenceType, projectContext)
      ),
    []
  );

  const allReferenceTypes = uniqueReferences(
    uniqueDirectReferenceTypes.concat(secondaryReferenceTypes)
  );

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
      const type = parseObjectLiteralType(interfaceDeclaration.getType());
      return { description, name, type };
    }

    throw new Error("unexpected type reference");
  });

  return { api, endpoints, types };
}

function uniqueReferences(referenceTypes: ReferenceType[]): ReferenceType[] {
  return uniqBy(referenceTypes, referenceType =>
    referenceType.location.concat(referenceType.name)
  );
}

function retrieveTypeReferencesFromType(
  dataType: DataType,
  projectContext: Project
): ReferenceType[] {
  if (isReferenceType(dataType)) {
    const file = projectContext.getSourceFileOrThrow(dataType.location);
    switch (dataType.referenceKind) {
      case Kind.Null:
      case Kind.Boolean:
      case Kind.String:
      case Kind.Number:
      case Kind.Integer:
      case Kind.Date:
      case Kind.DateTime:
      case Kind.BooleanLiteral:
      case Kind.StringLiteral:
      case Kind.NumberLiteral:
        return [dataType];
      case Kind.Object: {
        const interfaceDeclaration = file.getInterfaceOrThrow(dataType.name);
        return [dataType].concat(
          retrieveTypeReferencesFromType(
            parseObjectLiteralType(interfaceDeclaration.getType()),
            projectContext
          )
        );
      }
      case Kind.Array:
      case Kind.Union: {
        const typeAlias = file.getTypeAliasOrThrow(dataType.name);
        return [dataType].concat(
          retrieveTypeReferencesFromType(
            parseType(typeAlias.getTypeNodeOrThrow()),
            projectContext
          )
        );
      }
      case Kind.TypeReference: {
        const typeAlias = file.getTypeAlias(dataType.name);
        if (typeAlias !== undefined) {
          return [dataType].concat(
            retrieveTypeReferencesFromType(
              parseType(typeAlias.getTypeNodeOrThrow()),
              projectContext
            )
          );
        }
        const interfaceDeclaration = file.getInterface(dataType.name);
        if (interfaceDeclaration) {
          return [dataType].concat(
            retrieveTypeReferencesFromType(
              parseObjectLiteralType(interfaceDeclaration.getType()),
              projectContext
            )
          );
        }
        throw new Error(
          "expected type reference to resolve to a type alias or an interface"
        );
      }
      default: {
        throw new Error("unexpected type reference");
      }
    }
  } else if (isObjectType(dataType)) {
    return dataType.properties.reduce<ReferenceType[]>(
      (referenceTypesAcc, currentProperty) =>
        referenceTypesAcc.concat(
          retrieveTypeReferencesFromType(currentProperty.type, projectContext)
        ),
      []
    );
  } else if (isArrayType(dataType)) {
    return retrieveTypeReferencesFromType(dataType.elements, projectContext);
  } else if (isUnionType(dataType)) {
    return dataType.types.reduce<ReferenceType[]>(
      (referenceTypesAcc, type) =>
        referenceTypesAcc.concat(
          retrieveTypeReferencesFromType(type, projectContext)
        ),
      []
    );
  } else {
    return [];
  }
}

function retrieveTypeReferencesFromRequest(
  request: ParsedRequest
): ReferenceType[] {
  const fromHeaders = retrieveTypeReferencesFromHeaders(request.headers);
  if (request.body) {
    const type = request.body.type;
    if (isReferenceType(type)) {
      return fromHeaders.concat(type);
    }
  }
  return fromHeaders;
}

function retrieveTypeReferencesFromResponses(
  responses: ParsedResponse[]
): ReferenceType[] {
  return responses.reduce<ReferenceType[]>(
    (typeReferencesAcc, currentResponse) => {
      const fromHeaders = retrieveTypeReferencesFromHeaders(
        currentResponse.headers
      );
      if (currentResponse.body) {
        const type = currentResponse.body.type;
        if (isReferenceType(type)) {
          return typeReferencesAcc.concat(fromHeaders.concat(type));
        }
      }
      return typeReferencesAcc.concat(fromHeaders);
    },
    []
  );
}

function retrieveTypeReferencesFromHeaders(
  headers: ParsedHeader[]
): ReferenceType[] {
  return headers.reduce<ReferenceType[]>((typeReferencesAcc, currentHeader) => {
    const type = currentHeader.type;
    if (isReferenceType(type)) {
      return typeReferencesAcc.concat(type);
    } else {
      return typeReferencesAcc;
    }
  }, []);
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
