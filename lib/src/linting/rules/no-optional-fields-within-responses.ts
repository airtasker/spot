import { flatten, flow } from "lodash";
import { TypeNode } from "../../models/nodes";
import { isUnionType } from "../../models/types";
import { TypeKind } from "../../models/types/kinds";
import {
  ObjectType,
  ObjectTypeProperty
} from "../../models/types/object-types";
import { LintingRule } from "../rule";

import { extractResponseTypes } from "../../utilities/extract-endpoint-types";
import { extractNestedObjectTypes } from "../../utilities/extract-nested-types";

const hasOptionalProperties = (typeNode: TypeNode<ObjectType>) =>
  typeNode.type.properties.filter(prop => prop.optional).length > 0;

/**
 * Checks fields at any level in optional responses are nullable
 */
export const noOptionalFieldsWithinResponses: LintingRule = contract => {
  const extractObjectTypes = (t: TypeNode[]) =>
    t.map((type: TypeNode) => extractNestedObjectTypes(type, contract.types));

  const types = flatten(
    contract.endpoints.map(
      flow(
        extractResponseTypes,
        extractObjectTypes,
        flatten
      )
    )
  ) as Array<TypeNode<ObjectType>>;

  return types.filter(hasOptionalProperties).map(typeNode => ({
    message: `The object type \`${typeNode.name}\` defines an optional property. Use nullable instead.`
  }));
};
