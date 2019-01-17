import { MethodDeclaration } from "ts-simple-ast";
import { Locatable } from "../../models/locatable";
import { DefaultResponseNode } from "../../models/nodes";
import {
  extractJsDocCommentLocatable,
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
): Locatable<DefaultResponseNode> {
  const decorator = method.getDecoratorOrThrow("defaultResponse");
  const headersParameter = methodParamWithDecorator(method, "headers");
  const bodyParameter = methodParamWithDecorator(method, "body");
  const description = extractJsDocCommentLocatable(method);
  const headers = headersParameter && parseHeaders(headersParameter);
  const body = bodyParameter && parseBody(bodyParameter);

  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value: { description, headers, body },
    location,
    line
  };
}
