import { flatten } from "lodash";
import { LintingRule } from "../rule";

import { TypeNode } from "../../models/nodes";
import { extractQueryParams } from "../../utilities/extract-endpoint-types";
import { extractNestedObjectTypes } from "../../utilities/extract-nested-types";

/**
 * Ensure query parameters are not objects
 */
export const noObjectsInQueryParams: LintingRule = contract => {
  const extractObjectTypes = (t: TypeNode) =>
    t && extractNestedObjectTypes(t, contract.types);

  const objectTypes = flatten(contract.endpoints.map(extractQueryParams)).map(
    extractObjectTypes
  );

  return flatten(objectTypes).map((typeNode: TypeNode) => ({
    message: `The type \`${typeNode.name}\` is of type object. Objects are not recommended in query parameters.`
  }));
};
