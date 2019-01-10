import { MethodDeclaration } from "ts-simple-ast";
import { ParsedResponse } from "../../models/definitions";
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
export function parseResponse(method: MethodDeclaration): ParsedResponse {
  const decorator = method.getDecoratorOrThrow("response");
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const headersParameter = methodParamWithDecorator(method, "headers");
  const bodyParameter = methodParamWithDecorator(method, "body");

  const description = extractJsDocComment(method);
  const status = extractNumberProperty(configuration, "status");
  const headers =
    headersParameter === undefined ? [] : parseHeaders(headersParameter);
  const body =
    bodyParameter === undefined ? undefined : parseBody(bodyParameter);

  return { description, status, headers, body };
}
