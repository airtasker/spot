import { Locatable } from "../../models/locatable";
import { ResponseNode } from "../../models/nodes";
import { LintingRule } from "../rule";

/**
 * Checks that the contract defines exactly one success response per endpoint.
 */
export const oneSuccessResponsePerEndpoint: LintingRule = contract => {
  return [
    ...contract.endpoints
      .filter(
        endpoint =>
          endpoint.value.responses.filter(successfulResponse).length === 0
      )
      .map(endpoint => ({
        message: `${endpoint.value.name.value} does not define a successful response`
      })),
    ...contract.endpoints
      .filter(
        endpoint =>
          endpoint.value.responses.filter(successfulResponse).length > 1
      )
      .map(endpoint => ({
        message: `${endpoint.value.name.value} defines more than one successful response`
      }))
  ];
};

const successfulResponse = (response: Locatable<ResponseNode>) =>
  response.value.status.value >= 200 && response.value.status.value < 400;
