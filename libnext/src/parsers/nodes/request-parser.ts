import { MethodDeclaration } from "ts-simple-ast";
import { Locatable } from "../../models/locatable";
import { RequestNode } from "../../models/nodes";
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
export function parseRequest(
  method: MethodDeclaration
): Locatable<RequestNode> {
  const decorator = method.getDecoratorOrThrow("request");
  const headersParameter = methodParamWithDecorator(method, "headers");
  const pathParamsParameter = methodParamWithDecorator(method, "pathParams");
  const queryParamsParameter = methodParamWithDecorator(method, "queryParams");
  const bodyParameter = methodParamWithDecorator(method, "body");

  const headers = headersParameter && parseHeaders(headersParameter);
  const pathParams =
    pathParamsParameter && parsePathParams(pathParamsParameter);
  const queryParams =
    queryParamsParameter && parseQueryParams(queryParamsParameter);
  const body = bodyParameter && parseBody(bodyParameter);

  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value: { headers, pathParams, queryParams, body },
    location,
    line
  };
}
