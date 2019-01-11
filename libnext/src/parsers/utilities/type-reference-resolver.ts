import { uniqBy } from "lodash";
import Project from "ts-simple-ast";
import {
  EndpointNode,
  HeaderNode,
  RequestNode,
  ResponseNode
} from "../../models/nodes";
import {
  DataType,
  isArrayType,
  isObjectType,
  isReferenceType,
  isUnionType,
  ReferenceType,
  TypeKind
} from "../../models/types";
import { parseInterfaceDeclaration, parseType } from "./type-parser";

/**
 * Recursively retrieves all type references from a data type including itself.
 */
export function retrieveTypeReferencesFromType(
  dataType: DataType,
  projectContext: Project
): ReferenceType[] {
  if (isReferenceType(dataType)) {
    const file = projectContext.getSourceFileOrThrow(dataType.location);
    switch (dataType.referenceKind) {
      case TypeKind.NULL:
      case TypeKind.BOOLEAN:
      case TypeKind.STRING:
      case TypeKind.NUMBER:
      case TypeKind.INTEGER:
      case TypeKind.DATE:
      case TypeKind.DATE_TIME:
      case TypeKind.BOOLEAN_LITERAL:
      case TypeKind.STRING_LITERAL:
      case TypeKind.NUMBER_LITERAL:
        return [dataType];
      case TypeKind.ARRAY:
      case TypeKind.UNION:
      case TypeKind.TYPE_REFERENCE: {
        const typeAlias = file.getTypeAliasOrThrow(dataType.name);
        return [dataType].concat(
          retrieveTypeReferencesFromType(
            parseType(typeAlias.getTypeNodeOrThrow()),
            projectContext
          )
        );
      }
      case TypeKind.OBJECT: {
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
              parseInterfaceDeclaration(interfaceDeclaration),
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

/**
 * Retrieve all the type references from a collection of endpoints. This will only retrieve direct references (not recursive)
 * from each node of an endpoint.
 *
 * @param endpoints collection of endpoints
 */
export function retrieveTypeReferencesFromEndpoints(
  endpoints: EndpointNode[]
): ReferenceType[] {
  return endpoints.reduce<ReferenceType[]>(
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
}

/**
 * Retrieve all type references from a request. This will only retrieve direct references (not recursive).
 *
 * @param request a request
 */
function retrieveTypeReferencesFromRequest(
  request: RequestNode
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

/**
 * Retrieve all type references from a collection of responses. This will only retrieve direct references (not recursive).
 *
 * @param requests a collection of responses
 */
function retrieveTypeReferencesFromResponses(
  responses: ResponseNode[]
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

/**
 * Retrieve all type references from a collection of headers. This will only retrieve direct references (not recursive).
 *
 * @param headers a collection of headers
 */
function retrieveTypeReferencesFromHeaders(
  headers: HeaderNode[]
): ReferenceType[] {
  return headers.reduce<ReferenceType[]>((typeReferencesAcc, currentHeader) => {
    const type = currentHeader.type;
    return isReferenceType(type)
      ? typeReferencesAcc.concat(type)
      : typeReferencesAcc;
  }, []);
}

/**
 * Return the unique collection of reference types from a collection of reference types.
 *
 * @param referenceTypes collection of reference types
 */
export function uniqueReferences(
  referenceTypes: ReferenceType[]
): ReferenceType[] {
  return uniqBy(referenceTypes, referenceType =>
    referenceType.location.concat(referenceType.name)
  );
}
