import { DefaultResponseDefinition } from "../../models/definitions";
import { DefaultResponseNode } from "../../models/nodes";
import { cleanseBody } from "./body-cleanser";
import { cleanseHeader } from "./header-cleanser";

export function cleanseDefaultResponse(
  defaultResponseNode: DefaultResponseNode
): DefaultResponseDefinition {
  const description =
    defaultResponseNode.description && defaultResponseNode.description.value;
  const headers = defaultResponseNode.headers
    ? defaultResponseNode.headers.value.map(header =>
        cleanseHeader(header.value)
      )
    : [];
  const body =
    defaultResponseNode.body && cleanseBody(defaultResponseNode.body.value);

  return { description, headers, body };
}
