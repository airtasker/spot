import { MethodDeclaration } from "ts-morph";
import { Response } from "../definitions";
import { ParserError } from "../errors";
import { LociTable } from "../locations";
import { ResponseConfig } from "../syntax/response";
import { TypeTable } from "../types";
import { ok, Result } from "../util";
import { parseBody } from "./body-parser";
import { parseHeaders } from "./headers-parser";
import {
  getDecoratorConfigOrThrow,
  getJsDoc,
  getObjLiteralPropOrThrow,
  getParamWithDecorator,
  getPropValueAsNumberOrThrow
} from "./parser-helpers";

export function parseResponse(
  method: MethodDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Response, ParserError> {
  const decorator = method.getDecoratorOrThrow("response");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const statusProp = getObjLiteralPropOrThrow<ResponseConfig>(
    decoratorConfig,
    "status"
  );
  const statusLiteral = getPropValueAsNumberOrThrow(statusProp);
  const headersParam = getParamWithDecorator(method, "headers");
  const bodyParam = getParamWithDecorator(method, "body");

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
    status: statusLiteral.getLiteralValue(),
    headers,
    description: getJsDoc(method)?.getDescription().trim(),
    body
  });
}
