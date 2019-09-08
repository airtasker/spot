import { ClassDeclaration, TypeGuards } from "ts-morph";
import { EndpointConfig } from "../../syntax/endpoint";
import { Endpoint } from "../definitions";
import { ParserError } from "../errors";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
import { err, ok, Result } from "../util";
import { parseDefaultResponse } from "./default-response-parser";
import {
  getDecoratorConfigOrThrow,
  getJsDoc,
  getMethodWithDecorator,
  getObjLiteralProp,
  getObjLiteralPropOrThrow,
  getPropValueAsArrayOrThrow,
  getPropValueAsStringOrThrow,
  isHttpMethod
} from "./parser-helpers";
import { parseRequest } from "./request-parser";
import { parseResponse } from "./response-parser";

export function parseEndpoint(
  klass: ClassDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Endpoint, ParserError> {
  const decorator = klass.getDecoratorOrThrow("endpoint");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);

  // Handle name
  const endpointName = klass.getNameOrThrow();

  // Handle method
  const methodProp = getObjLiteralPropOrThrow<EndpointConfig>(
    decoratorConfig,
    "method"
  );
  const methodLiteral = getPropValueAsStringOrThrow(methodProp);
  const methodValue = methodLiteral.getLiteralText();
  if (!isHttpMethod(methodValue)) {
    throw new Error(`expected a HttpMethod, got ${methodValue}`);
  }

  // Handle path
  const pathProp = getObjLiteralPropOrThrow<EndpointConfig>(
    decoratorConfig,
    "path"
  );
  const pathLiteral = getPropValueAsStringOrThrow(pathProp);

  // Handle tags
  const tagsProp = getObjLiteralProp<EndpointConfig>(decoratorConfig, "tags");
  const tagsLiteral = tagsProp && getPropValueAsArrayOrThrow(tagsProp);
  const tagsValueLiterals = [];
  if (tagsLiteral) {
    for (const elementExpr of tagsLiteral.getElements()) {
      if (TypeGuards.isStringLiteral(elementExpr)) {
        tagsValueLiterals.push(elementExpr);
      } else {
        return err(
          new ParserError("tag must be a string", {
            file: elementExpr.getSourceFile().getFilePath(),
            position: elementExpr.getPos()
          })
        );
      }
    }
  }

  // Handle jsdoc
  const descriptionDoc = getJsDoc(klass);

  // Handle request
  const requestMethod = getMethodWithDecorator(klass, "request");
  let request;
  if (requestMethod) {
    const requestResult = parseRequest(requestMethod, typeTable, lociTable, {
      endpointName
    });
    if (requestResult.isErr()) return requestResult;
    request = requestResult.unwrap();
  }

  // Handle responses
  const responseMethods = klass
    .getMethods()
    .filter(m => m.getDecorator("response") !== undefined);
  const responses = [];
  for (const method of responseMethods) {
    const responseResult = parseResponse(method, typeTable, lociTable);
    if (responseResult.isErr()) return responseResult;
    responses.push(responseResult.unwrap());
  }
  // TODO: find duplicate response statuses

  // Handle default response
  const defaultResponseMethod = getMethodWithDecorator(
    klass,
    "defaultResponse"
  );
  let defaultResponse;
  if (defaultResponseMethod) {
    const defaultResponseResult = parseDefaultResponse(
      defaultResponseMethod,
      typeTable,
      lociTable
    );
    if (defaultResponseResult.isErr()) return defaultResponseResult;
    defaultResponse = defaultResponseResult.unwrap();
  }

  // Add location data
  lociTable.addMorphNode(LociTable.endpointClassKey(endpointName), klass);
  lociTable.addMorphNode(
    LociTable.endpointDecoratorKey(endpointName),
    decorator
  );
  lociTable.addMorphNode(LociTable.endpointMethodKey(endpointName), methodProp);
  lociTable.addMorphNode(LociTable.endpointPathKey(endpointName), pathProp);
  if (descriptionDoc) {
    lociTable.addMorphNode(
      LociTable.endpointDescriptionKey(endpointName),
      descriptionDoc
    );
  }
  if (tagsProp) {
    lociTable.addMorphNode(LociTable.endpointTagsKey(endpointName), tagsProp);
    tagsValueLiterals.forEach(tagLiteral => {
      lociTable.addMorphNode(
        LociTable.endpointTagKey(endpointName, tagLiteral.getLiteralText()),
        tagLiteral
      );
    });
  }
  return ok({
    name: endpointName,
    description: descriptionDoc && descriptionDoc.getComment(),
    tags: tagsValueLiterals.map(tvl => tvl.getLiteralText()), // TODO: sort tags
    method: methodValue,
    path: pathLiteral.getLiteralText(),
    request,
    responses: responses.sort((a, b) => (b.status > a.status ? -1 : 1)),
    defaultResponse
  });
}
