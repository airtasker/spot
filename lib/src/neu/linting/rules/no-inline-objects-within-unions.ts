import assertNever from "assert-never";
import { Contract } from "../../definitions";
import {
  dereferenceType,
  isNotNullType,
  isObjectType,
  possibleRootTypes,
  Type,
  TypeKind,
  TypeTable
} from "../../types";
import { LintingRuleViolation } from "../rule";

/**
 * Checks that all union members of object type are defined via type reference. This rule
 * ensures code generators have unique type names to use for data models. This rule is ignored
 * for two type union where one type is `null`, e.g. `{ name: String } | null`.
 *
 * @param contract a contract
 */
export function noInlineObjectsWithinUnions(
  contract: Contract
): LintingRuleViolation[] {
  const typeTable = TypeTable.fromArray(contract.types);

  const violations: LintingRuleViolation[] = [];

  contract.endpoints.forEach(endpoint => {
    if (endpoint.request) {
      endpoint.request.headers.forEach(header => {
        findInlineObjectInUnionViolations(header.type, typeTable).forEach(
          path => {
            violations.push({
              message: `Endpoint (${endpoint.name}) request header (${header.name}) contains a union type with an inlined object member: #/${path}`
            });
          }
        );
      });
      endpoint.request.pathParams.forEach(pathParam => {
        findInlineObjectInUnionViolations(pathParam.type, typeTable).forEach(
          path => {
            violations.push({
              message: `Endpoint (${endpoint.name}) request path parameter (${pathParam.name}) contains a union type with an inlined object member: #/${path}`
            });
          }
        );
      });
      endpoint.request.queryParams.forEach(queryParam => {
        findInlineObjectInUnionViolations(queryParam.type, typeTable).forEach(
          path => {
            violations.push({
              message: `Endpoint (${endpoint.name}) request query parameter (${queryParam.name}) contains a union type with an inlined object member: #/${path}`
            });
          }
        );
      });
      if (endpoint.request.body) {
        findInlineObjectInUnionViolations(
          endpoint.request.body.type,
          typeTable
        ).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) request body contains a union type with an inlined object member: #/${path}`
          });
        });
      }
    }
    endpoint.responses.forEach(response => {
      response.headers.forEach(header => {
        findInlineObjectInUnionViolations(header.type, typeTable).forEach(
          path => {
            violations.push({
              message: `Endpoint (${endpoint.name}) response (${response.status}) header (${header.name}) contains a union type with an inlined object member: #/${path}`
            });
          }
        );
      });
      if (response.body) {
        findInlineObjectInUnionViolations(
          response.body.type,
          typeTable
        ).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) response (${response.status}) body contains a union type with an inlined object member: #/${path}`
          });
        });
      }
    });
    if (endpoint.defaultResponse) {
      endpoint.defaultResponse.headers.forEach(header => {
        findInlineObjectInUnionViolations(header.type, typeTable).forEach(
          path => {
            violations.push({
              message: `Endpoint (${endpoint.name}) response (default) header (${header.name}) contains a union type with an inlined object member: #/${path}`
            });
          }
        );
      });
      if (endpoint.defaultResponse.body) {
        findInlineObjectInUnionViolations(
          endpoint.defaultResponse.body.type,
          typeTable
        ).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) response (default) body contains a union type with an inlined object member: #/${path}`
          });
        });
      }
    }
  });

  return violations;
}

/**
 * Finds inline object in union violations for a given type. The paths to the violations
 * will be returned.
 *
 * @param type current type to check
 * @param typeTable type reference table
 * @param typePath type path for context
 */
function findInlineObjectInUnionViolations(
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
          findInlineObjectInUnionViolations(
            prop.type,
            typeTable,
            typePath.concat(prop.name)
          )
        );
      }, []);
    case TypeKind.ARRAY:
      return findInlineObjectInUnionViolations(
        type.elementType,
        typeTable,
        typePath.concat("[]")
      );
    case TypeKind.UNION:
      const violationsInUnionTypes = type.types.reduce<string[]>((acc, t) => {
        return acc.concat(
          findInlineObjectInUnionViolations(t, typeTable, typePath.concat())
        );
      }, []);

      // Get concrete types excluding null
      const concreteTypes = possibleRootTypes(type, typeTable);
      const concreteTypesExcludingNull = concreteTypes.filter(isNotNullType);

      // Union of 2 types with null is valid
      if (concreteTypesExcludingNull.length === 1) {
        return violationsInUnionTypes;
      }

      return type.types.some(isObjectType)
        ? violationsInUnionTypes.concat(typePath.join("/"))
        : violationsInUnionTypes;
    case TypeKind.REFERENCE:
      return findInlineObjectInUnionViolations(
        dereferenceType(type, typeTable),
        typeTable,
        typePath
      );
    default:
      throw assertNever(type);
  }
}
