import { MethodDeclaration } from "ts-morph";
import { ResponseConfig } from "../../syntax/response";
import { Response } from "../definitions";
import { LociTable } from "../locations";
import {
  getDecoratorConfigOrThrow,
  getJsDoc,
  getObjLiteralPropOrThrow,
  getParamWithDecorator,
  getPropValueAsNumberOrThrow
} from "../parser-helpers";
import { TypeTable } from "../types";
import { parseBody } from "./body-parser";
import { parseHeaders } from "./headers-parser";

export function parseResponse(
  method: MethodDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Response {
  const decorator = method.getDecoratorOrThrow("response");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const statusProp = getObjLiteralPropOrThrow<ResponseConfig>(
    decoratorConfig,
    "status"
  );
  const statusLiteral = getPropValueAsNumberOrThrow(statusProp);
  const headersParam = getParamWithDecorator(method, "headers");
  const headers = headersParam
    ? parseHeaders(headersParam, typeTable, lociTable)
    : [];
  const bodyParam = getParamWithDecorator(method, "body");
  const body = bodyParam && parseBody(bodyParam, typeTable, lociTable);
  const descriptionDoc = getJsDoc(method);
  return {
    status: statusLiteral.getLiteralValue(),
    headers,
    description: descriptionDoc && descriptionDoc.getComment(),
    body
  };
}
