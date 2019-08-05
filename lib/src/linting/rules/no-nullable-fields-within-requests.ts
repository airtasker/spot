import { flatten, flow } from "lodash";
import { LintingRule } from "../rule";

import { TypeNode } from "../../models/nodes";
import { isNullType, UnionType } from "../../models/types";
import { extractRequestType } from "../../utilities/extract-endpoint-types";
import { extractNestedUnionTypes } from "../../utilities/extract-nested-types";

/**
 * Checks optional fields at any level in requests are not nullable
 */
export const noNullableFieldsWithinRequests: LintingRule = contract => {
  const extractTypes = flow(
    extractRequestType,
    (t: TypeNode) => extractNestedUnionTypes(t, contract.types),
    flatten
  );

  const types = flatten(contract.endpoints.map(extractTypes));

  const filterNullable = (t: TypeNode<UnionType>) =>
    t.type.types.find(possibleType => isNullType(possibleType));

  return types.filter(filterNullable).map(typeNode => ({
    message: `The object type \`${typeNode.name}\` defines an nullable property. Use omittable instead.`
  }));
};
