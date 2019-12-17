import { MethodDeclaration } from "ts-morph";
import { DefaultResponse } from "../definitions";
import { ParserError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { ok, Result } from "../util";
import { parseBody } from "./body-parser";
import { parseHeaders } from "./headers-parser";
import { getJsDoc, getParamWithDecorator } from "./parser-helpers";

export function parseDefaultResponse(
  method: MethodDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<DefaultResponse, ParserError> {
  method.getDecoratorOrThrow("defaultResponse");
  const headersParam = getParamWithDecorator(method, "headers");
  const bodyParam = getParamWithDecorator(method, "body");
  const descriptionDoc = getJsDoc(method);

  const headers = [];
  if (headersParam) {
    const headersResult = parseHeaders(headersParam, typeTable, lociTable);
    if (headersResult.isErr()) return headersResult;
    headers.push(...headersResult.unwrap());
  }

  let body;
  if (bodyParam) {
    const bodyResult = parseBody(bodyParam, typeTable, lociTable);
    if (bodyResult.isErr()) return bodyResult;
    body = bodyResult.unwrap();
  }

  return ok({
    headers,
    description: descriptionDoc && descriptionDoc.getDescription(),
    body
  });
}
