import { ClassDeclaration, ObjectLiteralExpression } from "ts-simple-ast";
import {
  extractJsDocComment,
  extractDecoratorFactoryConfiguration,
  extractStringProperty,
  isHttpMethod
} from "./parser-utility";
import { EndpointDefinition } from "../models/definitions";
import { HttpMethod } from "../models/types";

/**
 * Parse an Endpoint definition object.
 *
 * @param klass a class declaration
 */
export function parseEndpoint(klass: ClassDeclaration): EndpointDefinition {
  const decorator = klass.getDecoratorOrThrow("endpoint");
  const description = extractJsDocComment(klass);
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const method = extractHttpMethodProperty(configuration, "method");
  const path = extractStringProperty(configuration, "path");
  return { description, method, path };
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
