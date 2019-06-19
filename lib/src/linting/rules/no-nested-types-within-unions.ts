import { extractEndpointTypes } from "lib/src/utilities/extract-endpoint-types";
import { extractNestedUnionTypes } from "lib/src/utilities/extract-union-types";
import { flatten } from "lodash";
import { TypeKind } from "../../models/types";
import { LintingRule } from "../rule";

/**
 * Checks that the contract doesn't define nested types within union types.
 */
export const noNestedTypesWithinUnions: LintingRule = contract => {
  const topLevelTypes = flatten([
    ...contract.types,
    ...contract.endpoints.map(extractEndpointTypes)
  ]);
  const unionTypes = flatten(
    topLevelTypes.map(t => extractNestedUnionTypes(t.type, t.name))
  );
  return unionTypes
    .filter(typeNode =>
      typeNode.type.types.find(
        t =>
          t.kind !== TypeKind.TYPE_REFERENCE &&
          t.kind !== TypeKind.STRING_LITERAL
      )
    )
    .map(typeNode => ({
      message: `The union type \`${typeNode.name}\` defines nested type. Use type aliases instead.`
    }));
};
