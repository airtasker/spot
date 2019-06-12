import { uniqBy } from "lodash";
import { Project } from "ts-morph";
import { Locatable } from "../../models/locatable";
import {
  BodyNode,
  DefaultResponseNode,
  EndpointNode,
  HeaderNode,
  PathParamNode,
  QueryParamNode,
  RequestNode
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
 * Retrieve all the type references from a collection of endpoints recurisvely.
 *
 * @param endpoints collection of endpoints
 * @param projectContext ts-morph project
 */
export function retrieveTypeReferencesFromEndpoints(
  endpoints: Array<Locatable<EndpointNode>>,
  projectContext: Project
): ReferenceType[] {
  return endpoints.reduce<ReferenceType[]>(
    (referenceTypesAcc, currentEndpoint) => {
      const allResponses = (currentEndpoint.value.defaultResponse
        ? [currentEndpoint.value.defaultResponse]
        : []
      ).concat(currentEndpoint.value.responses);
      const fromResponses = retrieveTypeReferencesFromResponses(
        allResponses,
        projectContext
      );
      if (currentEndpoint.value.request) {
        const fromRequest = fromResponses.concat(
          retrieveTypeReferencesFromRequest(
            currentEndpoint.value.request,
            projectContext
          )
        );
        return referenceTypesAcc.concat(fromRequest).concat(fromResponses);
      }
      return referenceTypesAcc.concat(fromResponses);
    },
    []
  );
}

/**
 * Retrieve all type references from a request recursively.
 *
 * @param request a request
 * @param projectContext ts-morph project
 */
function retrieveTypeReferencesFromRequest(
  request: Locatable<RequestNode>,
  projectContext: Project
): ReferenceType[] {
  const fromHeaders = request.value.headers
    ? retrieveTypeReferencesFromHeadersPathParamsQueryParams(
        request.value.headers.value,
        projectContext
      )
    : [];
  const fromPathParams = request.value.pathParams
    ? retrieveTypeReferencesFromHeadersPathParamsQueryParams(
        request.value.pathParams.value,
        projectContext
      )
    : [];
  const fromQueryParams = request.value.queryParams
    ? retrieveTypeReferencesFromHeadersPathParamsQueryParams(
        request.value.queryParams.value,
        projectContext
      )
    : [];
  const fromBody = request.value.body
    ? retrieveTypeReferencesFromBody(request.value.body, projectContext)
    : [];

  return fromHeaders
    .concat(fromPathParams)
    .concat(fromQueryParams)
    .concat(fromBody);
}

/**
 * Retrieve all type references from a collection of responses recursively.
 *
 * @param requests a collection of responses
 * @param projectContext ts-morph project
 */
function retrieveTypeReferencesFromResponses(
  responses: Array<Locatable<DefaultResponseNode>>,
  projectContext: Project
): ReferenceType[] {
  return responses.reduce<ReferenceType[]>(
    (typeReferencesAcc, currentResponse) => {
      const fromHeaders = currentResponse.value.headers
        ? retrieveTypeReferencesFromHeadersPathParamsQueryParams(
            currentResponse.value.headers.value,
            projectContext
          )
        : [];
      const fromBody = currentResponse.value.body
        ? retrieveTypeReferencesFromBody(
            currentResponse.value.body,
            projectContext
          )
        : [];
      return typeReferencesAcc.concat(fromHeaders).concat(fromBody);
    },
    []
  );
}

/**
 * Retrieve all type references from a body recursively.
 *
 * @param body a body
 * @param projectContext ts-morph project
 */
function retrieveTypeReferencesFromBody(
  body: Locatable<BodyNode>,
  projectContext: Project
): ReferenceType[] {
  return retrieveTypeReferencesFromType(body.value.type, projectContext);
}

/**
 * Retrieve all type references from a collection of headers, path params or query params recursively.
 *
 * @param nodes a collection of headers, path params or query params
 * @param projectContext ts-morph project
 */
function retrieveTypeReferencesFromHeadersPathParamsQueryParams(
  nodes: Array<Locatable<HeaderNode | PathParamNode | QueryParamNode>>,
  projectContext: Project
): ReferenceType[] {
  return nodes.reduce<ReferenceType[]>(
    (typeReferencesAcc, currentHeader) =>
      typeReferencesAcc.concat(
        retrieveTypeReferencesFromType(currentHeader.value.type, projectContext)
      ),
    []
  );
}

/**
 * Recursively retrieves all type references from a data type including itself.
 */
function retrieveTypeReferencesFromType(
  dataType: DataType,
  projectContext: Project
): ReferenceType[] {
  if (isReferenceType(dataType)) {
    const file = projectContext.getSourceFileOrThrow(dataType.location);
    switch (dataType.referenceKind) {
      case TypeKind.NULL:
      case TypeKind.BOOLEAN:
      case TypeKind.STRING:
      case TypeKind.FLOAT:
      case TypeKind.INT32:
      case TypeKind.INT64:
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
