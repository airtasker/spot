import {
  DefaultResponseNode,
  ResponseNode,
  TypeNode
} from "../../models/nodes";
import { VerificationError } from "../verification-error";
import { verifyBodyNode } from "./body-verifier";
import { verifyHeaderNode } from "./header-verifier";

export function verifyResponseNode(
  response: ResponseNode | DefaultResponseNode,
  typeStore: TypeNode[]
): VerificationError[] {
  const errors: VerificationError[] = [];

  if (response.headers) {
    response.headers.value.forEach(header => {
      errors.push(...verifyHeaderNode(header.value, typeStore));
    });
  }

  if (response.body) {
    errors.push(...verifyBodyNode(response.body.value));
  }

  return errors;
}
