import { TestDefinition } from "../../models/definitions";
import { TestNode } from "../../models/nodes";

export function cleanseTest(testNode: TestNode): TestDefinition {
  const description = testNode.description && testNode.description.value;
  const states = testNode.states;
  const request = testNode.request && testNode.request.value;
  const response = {
    status: testNode.response.value.status.value,
    headers: testNode.response.value.headers,
    body: testNode.response.value.body
  };

  return { description, states, request, response };
}
