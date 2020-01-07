import {
  ClassDeclaration,
  ObjectLiteralExpression,
  TypeGuards
} from "ts-morph";
import { EndpointConfig } from "../../syntax/endpoint";
import { Endpoint, Response } from "../definitions";
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
  const name = klass.getNameOrThrow();

  // Handle method
  const methodProp = getObjLiteralPropOrThrow<EndpointConfig>(
    decoratorConfig,
    "method"
  );
  const methodLiteral = getPropValueAsStringOrThrow(methodProp);
  const method = methodLiteral.getLiteralText();
  if (!isHttpMethod(method)) {
    throw new Error(`expected a HttpMethod, got ${method}`);
  }

  // Handle tags
  const tagsResult = extractEndpointTags(decoratorConfig);
  if (tagsResult.isErr()) return tagsResult;
  const tags = tagsResult.unwrap();

  // Handle jsdoc
  const descriptionDoc = getJsDoc(klass);
  const description = descriptionDoc && descriptionDoc.getDescription().trim();

  // Handle draft
  const draft = klass.getDecorator("draft") !== undefined;

  // Handle request
  const requestMethod = getMethodWithDecorator(klass, "request");
  const requestResult = requestMethod
    ? parseRequest(requestMethod, typeTable, lociTable)
    : ok(undefined);
  if (requestResult.isErr()) return requestResult;
  const request = requestResult.unwrap();

  // Handle responses
  const responsesResult = extractEndpointResponses(klass, typeTable, lociTable);
  if (responsesResult.isErr()) return responsesResult;
  const responses = responsesResult.unwrap();

  // Handle default response
  const defaultResponseMethod = getMethodWithDecorator(
    klass,
    "defaultResponse"
  );
  const defaultResponseResult = defaultResponseMethod
    ? parseDefaultResponse(defaultResponseMethod, typeTable, lociTable)
    : ok(undefined);
  if (defaultResponseResult.isErr()) return defaultResponseResult;
  const defaultResponse = defaultResponseResult.unwrap();

  // Handle path
  const pathResult = extractEndpointPath(decoratorConfig);
  if (pathResult.isErr()) return pathResult;
  const path = pathResult.unwrap();

  // Check request path params cover the path dynamic components
  const pathParamsInPath = getDynamicPathComponents(path);
  const pathParamsInRequest = request
    ? request.pathParams.map(pathParam => pathParam.name)
    : [];

  const exclusivePathParamsInPath = pathParamsInPath.filter(
    pathParam => !pathParamsInRequest.includes(pathParam)
  );
  const exclusivePathParamsInRequest = pathParamsInRequest.filter(
    pathParam => !pathParamsInPath.includes(pathParam)
  );
  if (exclusivePathParamsInPath.length !== 0) {
    return err(
      new ParserError(
        `endpoint path dynamic components must have a corresponding path param defined in @request. Violating path components: ${exclusivePathParamsInPath.join(
          ", "
        )}`,
        {
          file: klass.getSourceFile().getFilePath(),
          position: klass.getPos()
        }
      )
    );
  }
  if (exclusivePathParamsInRequest.length !== 0) {
    return err(
      new ParserError(
        `endpoint request path params must have a corresponding dynamic path component defined in @endpoint. Violating path params: ${exclusivePathParamsInRequest.join(
          ", "
        )}`,
        {
          file: klass.getSourceFile().getFilePath(),
          position: klass.getPos()
        }
      )
    );
  }

  // Add location data
  lociTable.addMorphNode(LociTable.endpointClassKey(name), klass);
  lociTable.addMorphNode(LociTable.endpointDecoratorKey(name), decorator);
  lociTable.addMorphNode(LociTable.endpointMethodKey(name), methodProp);

  return ok({
    name,
    description,
    tags,
    method,
    path,
    request,
    responses,
    defaultResponse,
    draft
  });
}

function extractEndpointTags(
  decoratorConfig: ObjectLiteralExpression
): Result<string[], ParserError> {
  const tagsProp = getObjLiteralProp<EndpointConfig>(decoratorConfig, "tags");
  if (tagsProp === undefined) return ok([]);

  const tagsLiteral = getPropValueAsArrayOrThrow(tagsProp);
  const tags: string[] = [];

  for (const elementExpr of tagsLiteral.getElements()) {
    // Sanity check, typesafety should prevent any non-string tags
    if (!TypeGuards.isStringLiteral(elementExpr)) {
      return err(
        new ParserError("endpoint tag must be a string", {
          file: elementExpr.getSourceFile().getFilePath(),
          position: elementExpr.getPos()
        })
      );
    }
    const tag = elementExpr.getLiteralText().trim();
    if (tag.length === 0) {
      return err(
        new ParserError("endpoint tag cannot be blank", {
          file: elementExpr.getSourceFile().getFilePath(),
          position: elementExpr.getPos()
        })
      );
    }
    if (!/^[\w\s-]*$/.test(tag)) {
      return err(
        new ParserError(
          "endpoint tag may only contain alphanumeric, space, underscore and hyphen characters",
          {
            file: elementExpr.getSourceFile().getFilePath(),
            position: elementExpr.getPos()
          }
        )
      );
    }
    tags.push(tag);
  }

  const duplicateTags = [
    ...new Set(tags.filter((tag, index) => tags.indexOf(tag) !== index))
  ];
  if (duplicateTags.length !== 0) {
    return err(
      new ParserError(
        `endpoint tags may not contain duplicates: ${duplicateTags.join(", ")}`,
        {
          file: tagsProp.getSourceFile().getFilePath(),
          position: tagsProp.getPos()
        }
      )
    );
  }

  return ok(tags.sort((a, b) => (b > a ? -1 : 1)));
}

function extractEndpointPath(
  decoratorConfig: ObjectLiteralExpression
): Result<string, ParserError> {
  const pathProp = getObjLiteralPropOrThrow<EndpointConfig>(
    decoratorConfig,
    "path"
  );
  const pathLiteral = getPropValueAsStringOrThrow(pathProp);
  const path = pathLiteral.getLiteralText();
  const dynamicComponents = getDynamicPathComponents(path);

  const duplicateDynamicComponents = [
    ...new Set(
      dynamicComponents.filter(
        (component, index) => dynamicComponents.indexOf(component) !== index
      )
    )
  ];
  if (duplicateDynamicComponents.length !== 0) {
    return err(
      new ParserError(
        "endpoint path dynamic components must have unique names",
        {
          file: pathProp.getSourceFile().getFilePath(),
          position: pathProp.getPos()
        }
      )
    );
  }

  return ok(path);
}

function extractEndpointResponses(
  klass: ClassDeclaration,
  typeTable: TypeTable,
  lociTable: LociTable
): Result<Response[], ParserError> {
  const responseMethods = klass
    .getMethods()
    .filter(m => m.getDecorator("response") !== undefined);

  const responses: Response[] = [];
  for (const method of responseMethods) {
    const responseResult = parseResponse(method, typeTable, lociTable);
    if (responseResult.isErr()) return responseResult;
    responses.push(responseResult.unwrap());
  }

  // ensure unique response statsues
  const statuses = responses.map(r => r.status);
  const duplicateStatuses = [
    ...new Set(
      statuses.filter((status, index) => statuses.indexOf(status) !== index)
    )
  ];
  if (duplicateStatuses.length !== 0) {
    return err(
      new ParserError(
        `endpoint responses must have unique statuses. Duplicates found: ${duplicateStatuses.join(
          ", "
        )}`,
        { file: klass.getSourceFile().getFilePath(), position: klass.getPos() }
      )
    );
  }

  return ok(responses.sort((a, b) => (b.status > a.status ? -1 : 1)));
}

function getDynamicPathComponents(path: string): string[] {
  return path
    .split("/")
    .filter(component => component.startsWith(":"))
    .map(component => component.substr(1));
}
