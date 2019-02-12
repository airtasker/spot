import { uniqBy } from "lodash";
import Project from "ts-morph";
import { Locatable } from "../../models/locatable";
import {
  BodyNode,
  EndpointNode,
  HeaderNode,
  PathParamNode,
  QueryParamNode,
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
import { parseInterfaceDeclaration, parseTypeNode } from "./type-parser";

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
            parseTypeNode(typeAlias.getTypeNodeOrThrow()),
            projectContext
          )
        );
      }
      case TypeKind.OBJECT: {
        const typeAlias = file.getTypeAlias(dataType.name);
        if (typeAlias !== undefined) {
          return [dataType].concat(
            retrieveTypeReferencesFromType(
              parseTypeNode(typeAlias.getTypeNodeOrThrow()),
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
  endpoints: Locatable<EndpointNode>[]
): ReferenceType[] {
  return endpoints.reduce<ReferenceType[]>(
    (referenceTypesAcc, currentEndpoint) => {
      const fromResponses = retrieveTypeReferencesFromResponses(
        currentEndpoint.value.responses
      );
      if (currentEndpoint.value.request) {
        const fromRequest = fromResponses.concat(
          retrieveTypeReferencesFromRequest(currentEndpoint.value.request)
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
  request: Locatable<RequestNode>
): ReferenceType[] {
  const fromHeaders = request.value.headers
    ? retrieveTypeReferencesFromHeadersPathParamsQueryParams(
        request.value.headers.value
      )
    : [];
  const fromPathParams = request.value.pathParams
    ? retrieveTypeReferencesFromHeadersPathParamsQueryParams(
        request.value.pathParams.value
      )
    : [];
  const fromQueryParams = request.value.queryParams
    ? retrieveTypeReferencesFromHeadersPathParamsQueryParams(
        request.value.queryParams.value
      )
    : [];
  const fromBody = request.value.body
    ? retrieveTypeReferencesFromBody(request.value.body)
    : [];

  return fromHeaders
    .concat(fromPathParams)
    .concat(fromQueryParams)
    .concat(fromBody);
}

/**
 * Retrieve all type references from a collection of responses. This will only retrieve direct references (not recursive).
 *
 * @param requests a collection of responses
 */
function retrieveTypeReferencesFromResponses(
  responses: Locatable<ResponseNode>[]
): ReferenceType[] {
  return responses.reduce<ReferenceType[]>(
    (typeReferencesAcc, currentResponse) => {
      const fromHeaders = currentResponse.value.headers
        ? retrieveTypeReferencesFromHeadersPathParamsQueryParams(
            currentResponse.value.headers.value
          )
        : [];
      const fromBody = currentResponse.value.body
        ? retrieveTypeReferencesFromBody(currentResponse.value.body)
        : [];
      return typeReferencesAcc.concat(fromHeaders).concat(fromBody);
    },
    []
  );
}

/**
 * Retrieve all type references from a body. This will only retrieve direct references (not recursive).
 *
 * @param body a body
 */
function retrieveTypeReferencesFromBody(
  body: Locatable<BodyNode>
): ReferenceType[] {
  const type = body.value.type;
  if (isReferenceType(type)) {
    return [type];
  } else if (isUnionType(type)) {
    return type.types.reduce<ReferenceType[]>(
      (typeAcc, currType) =>
        isReferenceType(currType) ? typeAcc.concat(currType) : typeAcc,
      []
    );
  } else {
    return [];
  }
}

/**
 * Retrieve all type references from a collection of headers, path params or query params.
 * This will only retrieve direct references (not recursive).
 *
 * @param nodes a collection of headers, path params or query params
 */
function retrieveTypeReferencesFromHeadersPathParamsQueryParams(
  nodes: Locatable<HeaderNode | PathParamNode | QueryParamNode>[]
): ReferenceType[] {
  return nodes.reduce<ReferenceType[]>((typeReferencesAcc, currentHeader) => {
    const type = currentHeader.value.type;
    if (isReferenceType(type)) {
      return typeReferencesAcc.concat(type);
    } else if (isUnionType(type)) {
      return typeReferencesAcc.concat(
        type.types.reduce<ReferenceType[]>(
          (typeAcc, currType) =>
            isReferenceType(currType) ? typeAcc.concat(currType) : typeAcc,
          []
        )
      );
    } else {
      return typeReferencesAcc;
    }
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
