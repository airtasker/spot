import { uniq, without } from "lodash";
import { EndpointNode, TypeNode } from "../../models/nodes";
import { VerificationError } from "../verification-error";
import { verifyRequestNode } from "./request-verifier";
import { verifyResponseNode } from "./response-verifier";
import { verifyTestNode } from "./test-verifier";

export function verifyEndpointNode(
  endpoint: EndpointNode,
  typeStore: TypeNode[]
): VerificationError[] {
  const errors: VerificationError[] = [];

  // Ensure valid tags
  if (endpoint.tags) {
    const tags = endpoint.tags;
    tags.value.forEach(tag => {
      if (/(^\s+)|(\s+$)/.test(tag)) {
        errors.push({
          message:
            "endpoint tag may not contain leading or trailing white space",
          location: tags.location,
          line: tags.line
        });
      }
      if (!/[^\s]/.test(tag)) {
        errors.push({
          message:
            "endpoint tag must contain at least one non white space character",
          location: tags.location,
          line: tags.line
        });
      }
    });
  }

  const requiredPathParams = endpoint.path.value
    .split("/")
    .filter(value => value.startsWith(":"))
    .map(value => value.substr(1));

  const definedPathParams = endpoint.request
    ? endpoint.request.value.pathParams
      ? endpoint.request.value.pathParams.value.map(
          pathParam => pathParam.value.name.value
        )
      : []
    : [];

  // ensure no duplicate dynamic components exist in the path
  if (uniq(requiredPathParams).length !== requiredPathParams.length) {
    errors.push({
      message: "endpoint dynamic path components must have unique names",
      location: endpoint.path.location,
      line: endpoint.path.line
    });
  }

  // ensure all dynamic path components have a corresponding path param defined
  without(requiredPathParams, ...definedPathParams).forEach(pathParam => {
    errors.push({
      message: `dynamic path component :${pathParam} must be defined in the request's path params`,
      location: endpoint.path.location,
      line: endpoint.path.line
    });
  });

  // inverse of previous check
  without(definedPathParams, ...requiredPathParams).forEach(pathParam => {
    errors.push({
      message: `path param "${pathParam}" not found in the endpoint path`,
      location: endpoint.path.location,
      line: endpoint.path.line
    });
  });

  // verify the request
  if (endpoint.request) {
    errors.push(...verifyRequestNode(endpoint.request.value, typeStore));
  }

  // verify the default response
  if (endpoint.defaultResponse) {
    errors.push(
      ...verifyResponseNode(endpoint.defaultResponse.value, typeStore)
    );
  }

  // verify each specific response
  endpoint.responses.forEach(response => {
    errors.push(...verifyResponseNode(response.value, typeStore));
  });

  const statuses = endpoint.responses.map(
    response => response.value.status.value
  );

  // ensure response statuses are unique
  // TODO: use duplicated response's location and line
  if (uniq(statuses).length !== statuses.length) {
    errors.push({
      message: "endpoint response statuses must be unique",
      location: endpoint.name.location,
      line: endpoint.name.line
    });
  }

  // verify tests
  endpoint.tests.forEach(test => {
    errors.push(...verifyTestNode(test, endpoint, typeStore));
  });

  return errors;
}
