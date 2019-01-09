import { ClassDeclaration, ObjectLiteralExpression } from "ts-simple-ast";
import {
  extractJsDocComment,
  extractDecoratorFactoryConfiguration,
  extractStringProperty,
  isHttpMethod,
  classMethodWithDecorator
} from "../utilities/parser-utility";
import { EndpointDefinition } from "../../models/definitions";
import { HttpMethod } from "../../models/http";
import { parseRequest } from "./request-parser";
import { parseResponse } from "./response-parser";

/**
 * Parse an `@endpoint` decorated class.
 *
 * @param klass a class declaration
 */
export function parseEndpoint(klass: ClassDeclaration): EndpointDefinition {
  const decorator = klass.getDecoratorOrThrow("endpoint");
  const description = extractJsDocComment(klass);
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const method = extractHttpMethodProperty(configuration, "method");
  const name = klass.getName() || '';
  const path = extractStringProperty(configuration, "path");
  const requestMethod = classMethodWithDecorator(klass, "request");
  const request =
    requestMethod === undefined ? undefined : parseRequest(requestMethod);
  const responses = klass
    .getMethods()
    .filter(klassMethod => klassMethod.getDecorator("response") !== undefined)
    .map(responseMethod => parseResponse(responseMethod));

  if (responses.length === 0) {
    throw new Error("expected at least one @response decorated method");
  }

  return { description, method, name, path, request, responses };
}

/**
 * Extract a HTTP method property from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
function extractHttpMethodProperty(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): HttpMethod {
  const method = extractStringProperty(objectLiteral, propertyName);
  if (!isHttpMethod(method)) {
    throw new Error(`expected a HttpMethod, got ${method}`);
  }
  return method;
}
