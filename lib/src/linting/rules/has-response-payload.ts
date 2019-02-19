import { Locatable } from "lib/src/models/locatable";
import {
  DefaultResponseNode,
  EndpointNode,
  ResponseNode
} from "lib/src/models/nodes";
import { unnest } from "ramda";
import { LintingRule } from "../rule";

/**
 * Checks that the response payload is always defined.
 */
export const hasResponsePayload: LintingRule = contract => {
  return unnest(
    contract.endpoints.map(endpoint =>
      findResponses(endpoint)
        .filter(hasNoPayload)
        .map(response => ({
          message: `${responseName(response)} is missing a body in endpoint ${
            endpoint.value.name.value
          }`,
          source: response
        }))
    )
  );
};

function findResponses(endpoint: Locatable<EndpointNode>) {
  return [
    ...endpoint.value.responses,
    ...(endpoint.value.defaultResponse ? [endpoint.value.defaultResponse] : [])
  ];
}

function hasNoPayload(response: Locatable<ResponseNode | DefaultResponseNode>) {
  return !response.value.body;
}

function responseName(response: Locatable<ResponseNode | DefaultResponseNode>) {
  return "status" in response.value
    ? `response for status ${response.value.status.value}`
    : `default response`;
}
