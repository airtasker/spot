import { flatten, flow } from "lodash";
import { TypeNode } from "../../models/nodes";
import { ObjectType } from "../../models/types/object-types";
import { LintingRule } from "../rule";

import { extractResponseTypes } from "../../utilities/extract-endpoint-types";
import { extractNestedObjectTypes } from "../../utilities/extract-nested-types";

const hasOptionalProperties = (typeNode: TypeNode<ObjectType>) =>
  typeNode.type.properties.filter(prop => prop.optional).length > 0;

/**
 * Checks fields at any level in optional responses are nullable
 */
export const noOmittableFieldsWithinResponses: LintingRule = contract => {
  const extractObjectTypes = (t: TypeNode[]) =>
    t.map((type: TypeNode) => extractNestedObjectTypes(type, contract.types));

  const extractTypes = flow(
    extractResponseTypes,
    extractObjectTypes,
    flatten
  );

  const types = flatten(contract.endpoints.map(extractTypes));

  return types.filter(hasOptionalProperties).map(typeNode => ({
    message: `The object type \`${typeNode.name}\` defines an omittable property. Use nullable instead.`
  }));
};
