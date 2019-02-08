import { TestDefinition } from "../../models/definitions";
import { TestNode } from "../../models/nodes";

export function cleanseTest(testNode: TestNode): TestDefinition {
  const description = testNode.description && testNode.description.value;
  const states = testNode.states
    ? testNode.states.map(stateNode => {
        return {
          name: stateNode.name,
          params: stateNode.params ? stateNode.params : []
        };
      })
    : [];
  const request = {
    headers: testNode.request
      ? testNode.request.value.headers
        ? testNode.request.value.headers
        : []
      : [],
    pathParams: testNode.request
      ? testNode.request.value.pathParams
        ? testNode.request.value.pathParams
        : []
      : [],
    queryParams: testNode.request
      ? testNode.request.value.queryParams
        ? testNode.request.value.queryParams
        : []
      : [],
    body: testNode.request && testNode.request.value.body
  };
  const response = {
    status: testNode.response.value.status.value,
    headers: testNode.response.value.headers
      ? testNode.response.value.headers
      : [],
    body: testNode.response.value.body
  };

  return { description, states, request, response };
}
