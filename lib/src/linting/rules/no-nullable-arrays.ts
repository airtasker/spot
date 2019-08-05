import { flatten } from "lodash";
import { TypeKind } from "../../models/types";
import { extractEndpointTypes } from "../../utilities/extract-endpoint-types";
import { extractNestedUnionTypes } from "../../utilities/extract-nested-types";
import { resolveType } from "../../verifiers/utilities/type-resolver";
import { LintingRule } from "../rule";

/**
 * Checks that the contract doesn't define nullable arrays.
 */
export const noNullableArrays: LintingRule = contract => {
  const topLevelTypes = flatten([
    ...contract.types,
    ...contract.endpoints.map(extractEndpointTypes)
  ]);
  const unionTypes = flatten(
    topLevelTypes.map(t => extractNestedUnionTypes(t, contract.types))
  );
  return unionTypes
    .filter(typeNode => {
      const resolvedTypes = typeNode.type.types.map(t =>
        resolveType(t, contract.types)
      );
      return (
        resolvedTypes.find(
          possibleType => possibleType.kind === TypeKind.NULL
        ) &&
        resolvedTypes.find(possibleType => possibleType.kind === TypeKind.ARRAY)
      );
    })
    .map(typeNode => ({
      message: `The object type \`${typeNode.name}\` is a nullable array. Use an empty array to represent the absence of values instead.`
    }));
};
