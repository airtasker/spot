import { MethodDeclaration } from "ts-simple-ast";
import { ParsedDefaultResponse } from "../../models/parsed-nodes";
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
): ParsedDefaultResponse {
  method.getDecoratorOrThrow("defaultResponse");
  const headersParameter = methodParamWithDecorator(method, "headers");
  const bodyParameter = methodParamWithDecorator(method, "body");
  const description = extractJsDocComment(method);
  const headers =
    headersParameter === undefined ? [] : parseHeaders(headersParameter);
  const body =
    bodyParameter === undefined ? undefined : parseBody(bodyParameter);

  return { description, headers, body };
}
