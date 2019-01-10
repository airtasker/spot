import { MethodDeclaration } from "ts-simple-ast";
import { ParsedRequest } from "../../models/definitions";
import { methodParamWithDecorator } from "../utilities/parser-utility";
import { parseBody } from "./body-parser";
import { parseHeaders } from "./headers-parser";
import { parsePathParams } from "./path-params-parser";
import { parseQueryParams } from "./query-params-parser";

/**
 * Parse a `@request` decorated method.
 *
 * @param method a method declaration
 */
export function parseRequest(method: MethodDeclaration): ParsedRequest {
  method.getDecoratorOrThrow("request");
  const headersParameter = methodParamWithDecorator(method, "headers");
  const pathParamsParameter = methodParamWithDecorator(method, "pathParams");
  const queryParamsParameter = methodParamWithDecorator(method, "queryParams");
  const bodyParameter = methodParamWithDecorator(method, "body");

  const headers =
    headersParameter === undefined ? [] : parseHeaders(headersParameter);
  const pathParams =
    pathParamsParameter === undefined
      ? []
      : parsePathParams(pathParamsParameter);
  const queryParams =
    queryParamsParameter === undefined
      ? []
      : parseQueryParams(queryParamsParameter);
  const body =
    bodyParameter === undefined ? undefined : parseBody(bodyParameter);

  return { headers, pathParams, queryParams, body };
}
