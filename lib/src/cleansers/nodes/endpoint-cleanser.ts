import { EndpointDefinition } from "../../models/definitions";
import { EndpointNode } from "../../models/nodes";
import { cleanseDefaultResponse } from "./default-response-cleanser";
import { cleanseRequest } from "./request-cleanser";
import { cleanseResponse } from "./response-cleanser";
import { cleanseTest } from "./test-cleanser";

export function cleanseEndpoint(
  endpointNode: EndpointNode
): EndpointDefinition {
  const name = endpointNode.name.value;
  const description =
    endpointNode.description && endpointNode.description.value;
  const isDraft = endpointNode.isDraft;
  const tags = endpointNode.tags ? endpointNode.tags.value : [];
  const method = endpointNode.method.value;
  const path = endpointNode.path.value;
  const request = endpointNode.request
    ? cleanseRequest(endpointNode.request.value)
    : { headers: [], pathParams: [], queryParams: [] };
  const defaultResponse =
    endpointNode.defaultResponse &&
    cleanseDefaultResponse(endpointNode.defaultResponse.value);
  const responses = endpointNode.responses.map(response =>
    cleanseResponse(response.value)
  );
  const tests = endpointNode.tests.map(test => cleanseTest(test.value));

  return {
    name,
    description,
    isDraft,
    tags,
    method,
    path,
    request,
    responses,
    defaultResponse,
    tests
  };
}
