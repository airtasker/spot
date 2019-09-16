import { MethodDeclaration } from "ts-morph";
import { Request } from "../definitions";
import { ParserError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { ok, Result } from "../util";
import { parseBody } from "./body-parser";
import { parseHeaders } from "./headers-parser";
import { getParamWithDecorator } from "./parser-helpers";
import { parsePathParams } from "./path-params-parser";
import { parseQueryParams } from "./query-params-parser";

export function parseRequest(
  method: MethodDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Request, ParserError> {
  method.getDecoratorOrThrow("request");
  const headersParam = getParamWithDecorator(method, "headers");
  const pathParamsParam = getParamWithDecorator(method, "pathParams");
  const queryParamsParam = getParamWithDecorator(method, "queryParams");
  const bodyParam = getParamWithDecorator(method, "body");

  const headers = [];
  if (headersParam) {
    const headersResult = parseHeaders(headersParam, typeTable, lociTable);
    if (headersResult.isErr()) return headersResult;
    headers.push(...headersResult.unwrap());
  }

  const pathParams = [];
  if (pathParamsParam) {
    const pathParamsResult = parsePathParams(
      pathParamsParam,
      typeTable,
      lociTable
    );
    if (pathParamsResult.isErr()) return pathParamsResult;
    pathParams.push(...pathParamsResult.unwrap());
  }

  const queryParams = [];
  if (queryParamsParam) {
    const queryParamsResult = parseQueryParams(
      queryParamsParam,
      typeTable,
      lociTable
    );
    if (queryParamsResult.isErr()) return queryParamsResult;
    queryParams.push(...queryParamsResult.unwrap());
  }

  let body;
  if (bodyParam) {
    const bodyResult = parseBody(bodyParam, typeTable, lociTable);
    if (bodyResult.isErr()) return bodyResult;
    body = bodyResult.unwrap();
  }

  return ok({
    headers,
    pathParams,
    queryParams,
    body
  });
}
