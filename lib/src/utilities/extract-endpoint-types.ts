import { compact } from "lodash";
import { Locatable } from "../models/locatable";
import { EndpointNode, TypeNode } from "../models/nodes";

export function extractResponseTypes(
  endpoint: Locatable<EndpointNode>
): TypeNode[] {
  return compact([
    endpoint.value.defaultResponse &&
      endpoint.value.defaultResponse.value.body && {
        name: `${endpoint.value.name.value} (default response body)`,
        type: endpoint.value.defaultResponse.value.body.value.type
      },
    ...endpoint.value.responses.map(
      response =>
        response.value.body && {
          name: `${endpoint.value.name.value} (response body for status ${response.value.status.value})`,
          type: response.value.body.value.type
        }
    )
  ]);
}

export function extractRequestTypes(
  endpoint: Locatable<EndpointNode>
): TypeNode | null {
  return (
    (endpoint.value.request &&
      endpoint.value.request.value.body && {
        name: `${endpoint.value.name.value} (request body)`,
        type: endpoint.value.request.value.body.value.type
      }) ||
    null
  );
}

export function extractEndpointTypes(
  endpoint: Locatable<EndpointNode>
): TypeNode[] {
  return compact([
    ...extractResponseTypes(endpoint),
    extractRequestTypes(endpoint)
  ]);
}
