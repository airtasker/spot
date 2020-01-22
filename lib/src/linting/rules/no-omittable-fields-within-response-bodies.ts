import assertNever from "assert-never";
import { Contract } from "../../definitions";
import { dereferenceType, Type, TypeKind, TypeTable } from "../../types";
import { LintingRuleViolation } from "../rule";

/**
 * Ensures omittable fields are not used in response bodies.
 *
 * @param contract a contract
 */
export function noOmittableFieldsWithinResponseBodies(
  contract: Contract
): LintingRuleViolation[] {
  const typeTable = TypeTable.fromArray(contract.types);

  const violations: LintingRuleViolation[] = [];

  contract.endpoints.forEach(endpoint => {
    endpoint.responses.forEach(response => {
      if (response.body) {
        findOmittableFieldViolation(response.body.type, typeTable).forEach(
          path => {
            violations.push({
              message: `Endpoint (${endpoint.name}) response (${response.status}) body contains an omittable field: #/${path}`
            });
          }
        );
      }
    });
    if (endpoint.defaultResponse) {
      if (endpoint.defaultResponse.body) {
        findOmittableFieldViolation(
          endpoint.defaultResponse.body.type,
          typeTable
        ).forEach(path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) response (default) body contains an omittable field: #/${path}`
          });
        });
      }
    }
  });

  return violations;
}

/**
 * Finds omittable field violations for a given type. The paths to the violations
 * will be returned.
 *
 * @param type current type to check
 * @param typeTable type reference table
 * @param typePath type path for context
 */
function findOmittableFieldViolation(
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
      const violationsInObjectPropTypes = type.properties.reduce<string[]>(
        (acc, prop) => {
          return acc.concat(
            findOmittableFieldViolation(
              prop.type,
              typeTable,
              typePath.concat(prop.name)
            )
          );
        },
        []
      );
      const violationsInObjectProps = type.properties.reduce<string[]>(
        (acc, prop) => {
          return prop.optional
            ? acc.concat(typePath.concat(prop.name).join("/"))
            : acc;
        },
        []
      );
      return violationsInObjectProps.concat(violationsInObjectPropTypes);
    case TypeKind.ARRAY:
      return findOmittableFieldViolation(
        type.elementType,
        typeTable,
        typePath.concat("[]")
      );
    case TypeKind.UNION:
      return type.types.reduce<string[]>((acc, t) => {
        return acc.concat(
          findOmittableFieldViolation(t, typeTable, typePath.concat())
        );
      }, []);
    case TypeKind.REFERENCE:
      return findOmittableFieldViolation(
        dereferenceType(type, typeTable),
        typeTable,
        typePath
      );
    default:
      throw assertNever(type);
  }
}
