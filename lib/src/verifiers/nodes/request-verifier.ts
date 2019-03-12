import { RequestNode, TypeNode } from "../../models/nodes";
import { VerificationError } from "../verification-error";
import { verifyBodyNode } from "./body-verifier";
import { verifyHeaderNode } from "./header-verifier";
import { verifyPathParamNode } from "./path-param-verifier";
import { verifyQueryParamNode } from "./query-param-verifier";

export function verifyRequestNode(
  request: RequestNode,
  typeStore: TypeNode[]
): VerificationError[] {
  const errors: VerificationError[] = [];

  if (request.headers) {
    request.headers.value.forEach(header => {
      errors.push(...verifyHeaderNode(header.value, typeStore));
    });
  }

  if (request.pathParams) {
    request.pathParams.value.forEach(pathParam => {
      errors.push(...verifyPathParamNode(pathParam.value, typeStore));
    });
  }

  if (request.queryParams) {
    request.queryParams.value.forEach(queryParam => {
      errors.push(...verifyQueryParamNode(queryParam.value, typeStore));
    });
  }

  if (request.body) {
    errors.push(...verifyBodyNode(request.body.value));
  }

  return errors;
}
