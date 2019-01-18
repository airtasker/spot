import { MethodDeclaration } from "ts-simple-ast";
import { Locatable } from "../../models/locatable";
import { ResponseNode } from "../../models/nodes";
import {
  extractDecoratorFactoryConfiguration,
  extractJsDocCommentLocatable,
  extractNumberProperty,
  methodParamWithDecorator
} from "../utilities/parser-utility";
import { parseBody } from "./body-parser";
import { parseHeaders } from "./headers-parser";

/**
 * Parse a `@response` decorated method.
 *
 * @param method a method declaration
 */
export function parseResponse(
  method: MethodDeclaration
): Locatable<ResponseNode> {
  const decorator = method.getDecoratorOrThrow("response");
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const headersParameter = methodParamWithDecorator(method, "headers");
  const bodyParameter = methodParamWithDecorator(method, "body");

  const description = extractJsDocCommentLocatable(method);
  const status = extractNumberProperty(configuration, "status");
  const headers = headersParameter && parseHeaders(headersParameter);
  const body = bodyParameter && parseBody(bodyParameter);

  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value: { description, status, headers, body },
    location,
    line
  };
}
