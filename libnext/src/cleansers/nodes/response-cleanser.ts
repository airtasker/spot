import { ResponseDefinition } from "../../models/definitions";
import { ResponseNode } from "../../models/nodes";
import { cleanseBody } from "./body-cleanser";
import { cleanseHeader } from "./header-cleanser";

export function cleanseResponse(
  responseNode: ResponseNode
): ResponseDefinition {
  const description =
    responseNode.description && responseNode.description.value;
  const headers = responseNode.headers
    ? responseNode.headers.value.map(header => cleanseHeader(header.value))
    : [];
  const body = responseNode.body && cleanseBody(responseNode.body.value);
  const status = responseNode.status.value;

  return { description, headers, body, status };
}
