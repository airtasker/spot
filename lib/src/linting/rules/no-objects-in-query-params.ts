import { flatten } from "lodash";
import { LintingRule } from "../rule";

import { Locatable } from "lib/src/models/locatable";
import { EndpointNode, TypeNode } from "../../models/nodes";
import { extractQueryParams } from "../../utilities/extract-endpoint-types";
import { extractNestedObjectTypes } from "../../utilities/extract-nested-types";

/**
 * Ensure query parameters are not objects
 */
export const noObjectsInQueryParams: LintingRule = contract => {
  const extractObjectTypes = (t: TypeNode) =>
    extractNestedObjectTypes(t, contract.types);

  const messages = contract.endpoints.map(
    (endpoint: Locatable<EndpointNode>) => {
      const queryParams = extractQueryParams(endpoint);

      const objectTypes = queryParams.map(extractObjectTypes);

      return flatten(objectTypes).map((typeNode: TypeNode) => ({
        message: `The parameter \`${typeNode.name}\` in endpoint ${endpoint.value.name.value} is of type object. Objects are not recommended in query parameters.`
      }));
    }
  );

  return flatten(messages);
};
