import { Project, SourceFile, ts, CompilerOptions } from "ts-simple-ast";
import { parseApi } from "./nodes/api-parser";
import { parseEndpoint } from "./nodes/endpoint-parser";
import {
  Contract,
  EndpointDefinition,
  HeaderDefinition,
  RequestDefinition,
  ResponseDefinition
} from "../models/definitions";
import {
  isObjectType,
  isArrayType,
  DataType,
  isUnionType,
  isObjectReferenceType,
  ReferenceType,
  isReferenceType,
  isPrimitiveReferenceType,
  isAliasablePrimitiveType
} from "../models/types";
import {
  parseAstObjectAsLiteralObject,
  parseType
} from "./utilities/type-parser";
import { extractJsDocComment } from "./utilities/parser-utility";
import { uniqBy } from "lodash";

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
): Contract {
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
    if (isObjectReferenceType(referenceType)) {
      const interfaceDeclaration = file.getInterfaceOrThrow(referenceType.name);
      const name = interfaceDeclaration.getName();
      const description = extractJsDocComment(interfaceDeclaration);
      const type = parseAstObjectAsLiteralObject(
        interfaceDeclaration.getType()
      );
      return { description, name, type };
    } else {
      const typeAliasDeclaration = file.getTypeAliasOrThrow(referenceType.name);
      const name = typeAliasDeclaration.getName();
      const description = extractJsDocComment(typeAliasDeclaration);
      const type = parseType(typeAliasDeclaration.getTypeNodeOrThrow());
      if (isAliasablePrimitiveType(type)) {
        return { description, name, type };
      } else {
        throw new Error("unexpected aliased type");
      }
    }
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
  if (isPrimitiveReferenceType(dataType)) {
    return [dataType];
  } else if (isObjectReferenceType(dataType)) {
    const file = projectContext.getSourceFileOrThrow(dataType.location);
    const interfaceDeclaration = file.getInterfaceOrThrow(dataType.name);
    const objectType = parseAstObjectAsLiteralObject(
      interfaceDeclaration.getType()
    );
    return retrieveTypeReferencesFromType(objectType, projectContext).concat(
      dataType
    );
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
  request: RequestDefinition
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
  responses: ResponseDefinition[]
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
  headers: HeaderDefinition[]
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
