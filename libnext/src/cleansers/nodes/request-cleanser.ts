import { RequestDefinition } from "../../models/definitions";
import { RequestNode } from "../../models/nodes";
import { cleanseBody } from "./body-cleanser";
import { cleanseHeader } from "./header-cleanser";
import { cleansePathParam } from "./path-param-cleanser";
import { cleanseQueryParam } from "./query-param-cleanser";

export function cleanseRequest(requestNode: RequestNode): RequestDefinition {
  const headers = requestNode.headers
    ? requestNode.headers.value.map(header => cleanseHeader(header.value))
    : [];
  const pathParams = requestNode.pathParams
    ? requestNode.pathParams.value.map(pathParam =>
        cleansePathParam(pathParam.value)
      )
    : [];
  const queryParams = requestNode.queryParams
    ? requestNode.queryParams.value.map(queryParam =>
        cleanseQueryParam(queryParam.value)
      )
    : [];
  const body = requestNode.body && cleanseBody(requestNode.body.value);

  return { headers, pathParams, queryParams, body };
}
