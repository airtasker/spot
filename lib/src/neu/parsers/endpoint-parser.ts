import { ClassDeclaration, TypeGuards } from "ts-morph";
import { EndpointConfig } from "../../syntax/endpoint";
import { Endpoint } from "../definitions";
import { LociTable } from "../locations";
import { TypeTable } from "../types";
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
): Endpoint {
  const decorator = klass.getDecoratorOrThrow("endpoint");
  const decoratorConfig = getDecoratorConfigOrThrow(decorator);
  const endpointName = klass.getNameOrThrow();
  const methodProp = getObjLiteralPropOrThrow<EndpointConfig>(
    decoratorConfig,
    "method"
  );
  const methodLiteral = getPropValueAsStringOrThrow(methodProp);
  const methodValue = methodLiteral.getLiteralText();
  if (!isHttpMethod(methodValue)) {
    throw new Error(`expected a HttpMethod, got ${methodValue}`);
  }
  const pathProp = getObjLiteralPropOrThrow<EndpointConfig>(
    decoratorConfig,
    "path"
  );
  const pathLiteral = getPropValueAsStringOrThrow(pathProp);
  const tagsProp = getObjLiteralProp<EndpointConfig>(decoratorConfig, "tags");
  const tagsLiteral = tagsProp && getPropValueAsArrayOrThrow(tagsProp);
  const tagsValueLiterals = tagsLiteral
    ? tagsLiteral.getElements().map(elementExpr => {
        if (TypeGuards.isStringLiteral(elementExpr)) {
          return elementExpr;
        } else {
          throw new Error(`tag must be a string`);
        }
      })
    : [];
  const descriptionDoc = getJsDoc(klass);
  const requestMethod = getMethodWithDecorator(klass, "request");
  const request =
    requestMethod &&
    parseRequest(requestMethod, typeTable, lociTable, { endpointName });
  const responseMethods = klass
    .getMethods()
    .filter(m => m.getDecorator("response") !== undefined);
  const responses = responseMethods
    .map(r => parseResponse(r, typeTable, lociTable))
    .sort((a, b) => {
      if (a.status === b.status) {
        throw new Error(
          `Multiple responses found for status code ${a.status} in endpoint ${endpointName}`
        );
      }
      return b.status > a.status ? -1 : 1;
    });
  const defaultResponseMethod = getMethodWithDecorator(
    klass,
    "defaultResponse"
  );
  const defaultResponse =
    defaultResponseMethod &&
    parseDefaultResponse(defaultResponseMethod, typeTable, lociTable);

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
  return {
    name: endpointName,
    description: descriptionDoc && descriptionDoc.getComment(),
    tags: tagsValueLiterals.map(literal => literal.getLiteralText()),
    method: methodValue,
    path: pathLiteral.getLiteralText(),
    request,
    responses,
    defaultResponse
  };
}
