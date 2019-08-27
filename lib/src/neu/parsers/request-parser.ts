import { MethodDeclaration } from "ts-morph";
import { Request } from "../definitions";
import { LociTable } from "../locations";
import { getParamWithDecorator } from "../parser-helpers";
import { TypeTable } from "../types";
import { parseBody } from "./body-parser";
import { parseHeaders } from "./headers-parser";
import { parsePathParams } from "./path-params-parser";
import { parseQueryParams } from "./query-params-parser";

export function parseRequest(
  method: MethodDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable,
  lociContext: {
    endpointName: string;
  }
): Request {
  const decorator = method.getDecoratorOrThrow("request");
  const headersParam = getParamWithDecorator(method, "headers");
  const pathParamsParam = getParamWithDecorator(method, "pathParams");
  const queryParamsParam = getParamWithDecorator(method, "queryParams");
  const bodyParam = getParamWithDecorator(method, "body");
  const headers = headersParam
    ? parseHeaders(headersParam, typeTable, lociTable)
    : [];
  const pathParams = pathParamsParam
    ? parsePathParams(pathParamsParam, typeTable, lociTable)
    : [];
  const queryParams = queryParamsParam
    ? parseQueryParams(queryParamsParam, typeTable, lociTable)
    : [];
  const body = bodyParam && parseBody(bodyParam, typeTable, lociTable);
  // TODO: add loci information
  return {
    headers,
    pathParams,
    queryParams,
    body
  };
}
