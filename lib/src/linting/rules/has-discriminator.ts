import assertNever from "assert-never";
import { Contract } from "../../definitions";
import {
  dereferenceType,
  isNotNullType,
  isPrimitiveType,
  possibleRootTypes,
  Type,
  TypeKind,
  TypeTable
} from "../../types";
import { LintingRuleViolation } from "../rule";

/**
 * Checks that all union types have a discriminator. A discriminator is *not* required for:
 * - a two type union where one type is `null`, e.g. `String | null`
 * - a union composed of `null` and other types of the same primitive type, e.g. `"one" | "two" | "three" | null`
 *
 * @param contract a contract
 */
export function hasDiscriminator(contract: Contract): LintingRuleViolation[] {
  const typeTable = TypeTable.fromArray(contract.types);

  const violations: LintingRuleViolation[] = [];

  contract.endpoints.forEach(endpoint => {
    if (endpoint.request) {
      endpoint.request.headers.forEach(header => {
        findDisriminatorViolations(header.type, typeTable).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) request header (${header.name}) contains a union type with no discriminator: #/${path}`
          });
        });
      });
      endpoint.request.pathParams.forEach(pathParam => {
        findDisriminatorViolations(pathParam.type, typeTable).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) request path parameter (${pathParam.name}) contains a union type with no discriminator: #/${path}`
          });
        });
      });
      endpoint.request.queryParams.forEach(queryParam => {
        findDisriminatorViolations(queryParam.type, typeTable).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) request query parameter (${queryParam.name}) contains a union type with no discriminator: #/${path}`
          });
        });
      });
      if (endpoint.request.body) {
        findDisriminatorViolations(
          endpoint.request.body.type,
          typeTable
        ).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) request body contains a union type with no discriminator: #/${path}`
          });
        });
      }
    }
    endpoint.responses.forEach(response => {
      response.headers.forEach(header => {
        findDisriminatorViolations(header.type, typeTable).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) response (${response.status}) header (${header.name}) contains a union type with no discriminator: #/${path}`
          });
        });
      });
      if (response.body) {
        findDisriminatorViolations(response.body.type, typeTable).forEach(
          path => {
            violations.push({
              message: `Endpoint (${endpoint.name}) response (${response.status}) body contains a union type with no discriminator: #/${path}`
            });
          }
        );
      }
    });
    if (endpoint.defaultResponse) {
      endpoint.defaultResponse.headers.forEach(header => {
        findDisriminatorViolations(header.type, typeTable).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) response (default) header (${header.name}) contains a union type with no discriminator: #/${path}`
          });
        });
      });
      if (endpoint.defaultResponse.body) {
        findDisriminatorViolations(
          endpoint.defaultResponse.body.type,
          typeTable
        ).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) response (default) body contains a union type with no discriminator: #/${path}`
          });
        });
      }
    }
  });

  return violations;
}

/**
 * Finds discriminator violations for a given type. The paths to the violations
 * will be returned.
 *
 * @param type current type to check
 * @param typeTable type reference table
 * @param typePath type path for context
 */
function findDisriminatorViolations(
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
    case TypeKind.INTERSECTION:
      return [];
    case TypeKind.OBJECT:
      return type.properties.reduce<string[]>((acc, prop) => {
        return acc.concat(
          findDisriminatorViolations(
            prop.type,
            typeTable,
            typePath.concat(prop.name)
          )
        );
      }, []);
    case TypeKind.ARRAY:
      return findDisriminatorViolations(
        type.elementType,
        typeTable,
        typePath.concat("[]")
      );
    case TypeKind.UNION: {
      const violationsInUnionTypes = type.types.reduce<string[]>((acc, t) => {
        return acc.concat(
          findDisriminatorViolations(t, typeTable, typePath.concat())
        );
      }, []);

      // Get concrete types excluding null
      const concreteTypes = possibleRootTypes(type, typeTable);
      const concreteTypesExcludingNull = concreteTypes.filter(isNotNullType);

      // Union of 2 types with null is valid
      if (concreteTypesExcludingNull.length === 1) {
        return violationsInUnionTypes;
      }

      // Union of primitive type with null is valid
      if (
        new Set(concreteTypesExcludingNull.map(t => t.kind)).size === 1 &&
        isPrimitiveType(concreteTypesExcludingNull[0])
      ) {
        return violationsInUnionTypes;
      }

      return type.discriminator === undefined
        ? violationsInUnionTypes.concat(typePath.join("/"))
        : violationsInUnionTypes;
    }
    case TypeKind.REFERENCE:
      return findDisriminatorViolations(
        dereferenceType(type, typeTable),
        typeTable,
        typePath
      );
    default:
      throw assertNever(type);
  }
}
