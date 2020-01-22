import assertNever from "assert-never";
import { Contract } from "../../definitions";
import {
  dereferenceType,
  isArrayType,
  isNullType,
  possibleRootTypes,
  Type,
  TypeKind,
  TypeTable
} from "../../types";
import { LintingRuleViolation } from "../rule";

/**
 * Ensures that arrays are not part of nullable unions
 *
 * @param contract a contract
 */
export function noNullableArrays(contract: Contract): LintingRuleViolation[] {
  const typeTable = TypeTable.fromArray(contract.types);

  const violations: LintingRuleViolation[] = [];

  contract.endpoints.forEach(endpoint => {
    if (endpoint.request) {
      endpoint.request.headers.forEach(header => {
        findNullableArrayViolations(header.type, typeTable).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) request header (${header.name}) contains a nullable array type: #/${path}`
          });
        });
      });
      endpoint.request.pathParams.forEach(pathParam => {
        findNullableArrayViolations(pathParam.type, typeTable).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) request path parameter (${pathParam.name}) contains a nullable array type: #/${path}`
          });
        });
      });
      endpoint.request.queryParams.forEach(queryParam => {
        findNullableArrayViolations(queryParam.type, typeTable).forEach(
          path => {
            violations.push({
              message: `Endpoint (${endpoint.name}) request query parameter (${queryParam.name}) contains a nullable array type: #/${path}`
            });
          }
        );
      });
      if (endpoint.request.body) {
        findNullableArrayViolations(
          endpoint.request.body.type,
          typeTable
        ).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) request body contains a nullable array type: #/${path}`
          });
        });
      }
    }
    endpoint.responses.forEach(response => {
      response.headers.forEach(header => {
        findNullableArrayViolations(header.type, typeTable).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) response (${response.status}) header (${header.name}) contains a nullable array type: #/${path}`
          });
        });
      });
      if (response.body) {
        findNullableArrayViolations(response.body.type, typeTable).forEach(
          path => {
            violations.push({
              message: `Endpoint (${endpoint.name}) response (${response.status}) body contains a nullable array type: #/${path}`
            });
          }
        );
      }
    });
    if (endpoint.defaultResponse) {
      endpoint.defaultResponse.headers.forEach(header => {
        findNullableArrayViolations(header.type, typeTable).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) response (default) header (${header.name}) contains a nullable array type: #/${path}`
          });
        });
      });
      if (endpoint.defaultResponse.body) {
        findNullableArrayViolations(
          endpoint.defaultResponse.body.type,
          typeTable
        ).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) response (default) body contains a nullable array type: #/${path}`
          });
        });
      }
    }
  });

  return violations;
}

/**
 * Finds nullable array violations for a given type. The paths to the violations
 * will be returned.
 *
 * @param type current type to check
 * @param typeTable type reference table
 * @param typePath type path for context
 */
function findNullableArrayViolations(
  type: Type,
  typeTable: TypeTable,
  typePath: string[] = []
): string[] {
  switch (type.kind) {
    case TypeKind.NULL:
    case TypeKind.BOOLEAN:
    case TypeKind.BOOLEAN_LITERAL:
    case TypeKind.STRING:
    case TypeKind.STRING_LITERAL:
    case TypeKind.FLOAT:
    case TypeKind.DOUBLE:
    case TypeKind.FLOAT_LITERAL:
    case TypeKind.INT32:
    case TypeKind.INT64:
    case TypeKind.INT_LITERAL:
    case TypeKind.DATE:
    case TypeKind.DATE_TIME:
      return [];
    case TypeKind.OBJECT:
      return type.properties.reduce<string[]>((acc, prop) => {
        return acc.concat(
          findNullableArrayViolations(
            prop.type,
            typeTable,
            typePath.concat(prop.name)
          )
        );
      }, []);
    case TypeKind.ARRAY:
      return findNullableArrayViolations(
        type.elementType,
        typeTable,
        typePath.concat("[]")
      );
    case TypeKind.UNION:
      const violationsInUnionTypes = type.types.reduce<string[]>((acc, t) => {
        return acc.concat(
          findNullableArrayViolations(t, typeTable, typePath.concat())
        );
      }, []);

      const concreteTypes = possibleRootTypes(type, typeTable);

      return concreteTypes.some(isArrayType) && concreteTypes.some(isNullType)
        ? violationsInUnionTypes.concat(typePath.join("/"))
        : violationsInUnionTypes;
    case TypeKind.REFERENCE:
      return findNullableArrayViolations(
        dereferenceType(type, typeTable),
        typeTable,
        typePath
      );
    default:
      throw assertNever(type);
  }
}
