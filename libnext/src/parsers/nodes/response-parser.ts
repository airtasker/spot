import { MethodDeclaration } from "ts-simple-ast";
import { ResponseNode } from "../../models/nodes";
import {
  extractDecoratorFactoryConfiguration,
  extractJsDocComment,
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
export function parseResponse(method: MethodDeclaration): ResponseNode {
  const decorator = method.getDecoratorOrThrow("response");
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const headersParameter = methodParamWithDecorator(method, "headers");
  const bodyParameter = methodParamWithDecorator(method, "body");

  const description = extractJsDocComment(method);
  const status = extractNumberProperty(configuration, "status");
  const headers = headersParameter ? parseHeaders(headersParameter) : [];
  const body = bodyParameter ? parseBody(bodyParameter) : undefined;

  return { description, status, headers, body };
}
