import { ClassDeclaration, ObjectLiteralExpression } from "ts-simple-ast";
import { HttpMethod } from "../../models/http";
import { Locatable } from "../../models/locatable";
import { EndpointNode } from "../../models/nodes";
import {
  classMethodWithDecorator,
  extractDecoratorFactoryConfiguration,
  extractJsDocCommentLocatable,
  extractOptionalStringArrayPropertyValueLocatable,
  extractStringPropertyValueLocatable,
  isHttpMethod
} from "../utilities/parser-utility";
import { parseDefaultResponse } from "./default-response-parser";
import { parseRequest } from "./request-parser";
import { parseResponse } from "./response-parser";

/**
 * Parse an `@endpoint` decorated class.
 *
 * @param klass a class declaration
 */
export function parseEndpoint(
  klass: ClassDeclaration
): Locatable<EndpointNode> {
  const decorator = klass.getDecoratorOrThrow("endpoint");
  const description = extractJsDocCommentLocatable(klass);
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const tags = extractOptionalStringArrayPropertyValueLocatable(
    configuration,
    "tags"
  );
  const method = extractHttpMethodProperty(configuration, "method");
  const name = {
    value: klass.getNameOrThrow(),
    location: klass.getSourceFile().getFilePath(),
    line: klass.getNameNodeOrThrow().getStartLineNumber()
  };
  const path = extractStringPropertyValueLocatable(configuration, "path");
  const requestMethod = classMethodWithDecorator(klass, "request");
  const request = requestMethod && parseRequest(requestMethod);
  const responses = klass
    .getMethods()
    .filter(klassMethod => klassMethod.getDecorator("response") !== undefined)
    .map(responseMethod => parseResponse(responseMethod));
  const defaultResponseMethod = classMethodWithDecorator(
    klass,
    "defaultResponse"
  );
  const defaultResponse =
    defaultResponseMethod && parseDefaultResponse(defaultResponseMethod);

  if (responses.length === 0) {
    throw new Error("expected at least one @response decorated method");
  }

  const location = decorator.getSourceFile().getFilePath();
  const line = decorator.getStartLineNumber();

  return {
    value: {
      description,
      method,
      name,
      tags,
      path,
      request,
      responses,
      defaultResponse
    },
    location,
    line
  };
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
): Locatable<HttpMethod> {
  const locatableMethod = extractStringPropertyValueLocatable(
    objectLiteral,
    propertyName
  );
  const value = locatableMethod.value;
  if (!isHttpMethod(value)) {
    throw new Error(`expected a HttpMethod, got ${value}`);
  }
  const location = locatableMethod.location;
  const line = locatableMethod.line;

  return {
    value,
    location,
    line
  };
}
