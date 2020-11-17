import assertNever from "assert-never";
import { Contract } from "../../definitions";
import { dereferenceType, Type, TypeKind, TypeTable } from "../../types";
import { LintingRuleViolation } from "../rule";

/**
 * Ensures nullable fields are not used in request components.
 *
 * @param contract a contract
 */
export function noNullableFieldsWithinRequestBodies(
  contract: Contract
): LintingRuleViolation[] {
  const typeTable = TypeTable.fromArray(contract.types);

  const violations: LintingRuleViolation[] = [];

  contract.endpoints.forEach(endpoint => {
    if (endpoint.request?.body) {
      findNullableFieldViolation(endpoint.request.body.type, typeTable).forEach(
        path => {
          violations.push({
            message: `Endpoint (${endpoint.name}) request body contains a nullable field: #/${path}`
          });
        }
      );
    }
  });

  return violations;
}

/**
 * Finds nullable field violations for a given type. The paths to the violations
 * will be returned.
 *
 * @param type current type to check
 * @param typeTable type reference table
 * @param typePath type path for context
 */
function findNullableFieldViolation(
  type: Type,
  typeTable: TypeTable,
  typePath: string[] = []
): string[] {
  switch (type.kind) {
    case TypeKind.NULL:
      return [typePath.join("/")];
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
          findNullableFieldViolation(
            prop.type,
            typeTable,
            typePath.concat(prop.name)
          )
        );
      }, []);
    case TypeKind.ARRAY:
      return findNullableFieldViolation(
        type.elementType,
        typeTable,
        typePath.concat("[]")
      );
    case TypeKind.INTERSECTION:
    case TypeKind.UNION:
      return type.types.reduce<string[]>((acc, t) => {
        return acc.concat(
          findNullableFieldViolation(t, typeTable, typePath.concat())
        );
      }, []);
    case TypeKind.REFERENCE:
      return findNullableFieldViolation(
        dereferenceType(type, typeTable),
        typeTable,
        typePath
      );
    default:
      throw assertNever(type);
  }
}
