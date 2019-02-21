import { Locatable } from "lib/src/models/locatable";
import { EndpointNode } from "lib/src/models/nodes";
import { complement } from "ramda";
import { LintingRule } from "../rule";

/**
 * Checks that the request payload is defined if and only if the method is POST/PUT/PATCH.
 */
export const hasRequestPayload: LintingRule = contract => {
  return [
    ...mutationEndpointsHaveRequestPayload(contract),
    ...nonMutationEndpointsDoNotHaveRequestPayload(contract)
  ];
};

const mutationEndpointsHaveRequestPayload: LintingRule = contract => {
  return contract.endpoints
    .filter(isMutationEndpoint)
    .filter(complement(endpointHasRequestPayload))
    .map(endpoint => ({
      message: `${
        endpoint.value.name.value
      } should have a request payload as its method is ${
        endpoint.value.method.value
      }`,
      source: endpoint
    }));
};

const nonMutationEndpointsDoNotHaveRequestPayload: LintingRule = contract => {
  return contract.endpoints
    .filter(complement(isMutationEndpoint))
    .filter(endpointHasRequestPayload)
    .map(endpoint => ({
      message: `${
        endpoint.value.name.value
      } should not have a request payload as its method is ${
        endpoint.value.method.value
      }`,
      source: endpoint
    }));
};

function isMutationEndpoint(endpoint: Locatable<EndpointNode>) {
  switch (endpoint.value.method.value) {
    case "POST":
    case "PUT":
    case "PATCH":
      return true;
    default:
      return false;
  }
}

function endpointHasRequestPayload(endpoint: Locatable<EndpointNode>): boolean {
  return Boolean(endpoint.value.request && endpoint.value.request.value.body);
}
