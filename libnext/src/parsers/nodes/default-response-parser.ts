import { MethodDeclaration } from "ts-simple-ast";
import { DefaultResponseNode } from "../../models/nodes";
import {
  extractJsDocComment,
  methodParamWithDecorator
} from "../utilities/parser-utility";
import { parseBody } from "./body-parser";
import { parseHeaders } from "./headers-parser";

/**
 * Parse a `@defaultResponse` decorated method.
 *
 * @param method a method declaration
 */
export function parseDefaultResponse(
  method: MethodDeclaration
): DefaultResponseNode {
  method.getDecoratorOrThrow("defaultResponse");
  const headersParameter = methodParamWithDecorator(method, "headers");
  const bodyParameter = methodParamWithDecorator(method, "body");
  const description = extractJsDocComment(method);
  const headers = headersParameter ? parseHeaders(headersParameter) : [];
  const body = bodyParameter ? parseBody(bodyParameter) : undefined;

  return { description, headers, body };
}
