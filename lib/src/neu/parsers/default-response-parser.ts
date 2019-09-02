import { MethodDeclaration } from "ts-morph";
import { DefaultResponse } from "../definitions";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { parseBody } from "./body-parser";
import { parseHeaders } from "./headers-parser";
import { getJsDoc, getParamWithDecorator } from "./parser-helpers";

export function parseDefaultResponse(
  method: MethodDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): DefaultResponse {
  method.getDecoratorOrThrow("defaultResponse");
  const headersParam = getParamWithDecorator(method, "headers");
  const headers = headersParam
    ? parseHeaders(headersParam, typeTable, lociTable)
    : [];
  const bodyParam = getParamWithDecorator(method, "body");
  const body = bodyParam && parseBody(bodyParam, typeTable, lociTable);
  const descriptionDoc = getJsDoc(method);
  return {
    headers,
    description: descriptionDoc && descriptionDoc.getComment(),
    body
  };
}
