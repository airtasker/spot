import { ClassDeclaration, ObjectLiteralExpression } from "ts-simple-ast";
import { HttpMethod } from "../../models/http";
import {
  DynamicPathComponent,
  EndpointNode,
  PathComponent
} from "../../models/nodes";
import {
  classMethodWithDecorator,
  extractDecoratorFactoryConfiguration,
  extractJsDocComment,
  extractStringArrayProperty,
  extractStringProperty,
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
export function parseEndpoint(klass: ClassDeclaration): EndpointNode {
  const decorator = klass.getDecoratorOrThrow("endpoint");
  const description = extractJsDocComment(klass);
  const configuration = extractDecoratorFactoryConfiguration(decorator);
  const tags = extractTagsProperty(configuration, "tags");
  const method = extractHttpMethodProperty(configuration, "method");
  const name = klass.getNameOrThrow();
  const path = extractPathProperty(configuration, "path");
  const requestMethod = classMethodWithDecorator(klass, "request");
  const request = requestMethod
    ? parseRequest(requestMethod)
    : {
        headers: [],
        pathParams: [],
        queryParams: []
      };
  const responses = klass
    .getMethods()
    .filter(klassMethod => klassMethod.getDecorator("response") !== undefined)
    .map(responseMethod => parseResponse(responseMethod));
  const defaultResponseMethod = classMethodWithDecorator(
    klass,
    "defaultResponse"
  );
  const defaultResponse = defaultResponseMethod
    ? parseDefaultResponse(defaultResponseMethod)
    : undefined;

  if (responses.length === 0) {
    throw new Error("expected at least one @response decorated method");
  }

  return {
    description,
    method,
    name,
    tags,
    path,
    request,
    responses,
    defaultResponse
  };
}

/**
 * Extract a list of tags from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
function extractTagsProperty(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): string[] {
  return extractStringArrayProperty(objectLiteral, propertyName);
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

/**
 * Extract a list of path components from a string path.
 *
 * An example of valid path is "/users/:id".
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
function extractPathProperty(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): PathComponent[] {
  const stringPath = extractStringProperty(objectLiteral, propertyName);
  const pathComponents: PathComponent[] = [];
  if (stringPath.length > 0) {
    let componentStartPosition = 0;
    do {
      if (stringPath.charAt(componentStartPosition) === ":") {
        // The parameter name extends until a character that isn't a valid name.
        const nextNonNamePositionRelative = stringPath
          .substr(componentStartPosition + 1)
          .search(/[^a-z0-9_]/gi);
        const dynamicPathComponent: DynamicPathComponent = {
          kind: "dynamic",
          paramName: stringPath.substr(
            componentStartPosition + 1,
            nextNonNamePositionRelative === -1
              ? undefined
              : nextNonNamePositionRelative
          )
        };
        pathComponents.push(dynamicPathComponent);
        componentStartPosition =
          nextNonNamePositionRelative === -1
            ? -1
            : componentStartPosition + 1 + nextNonNamePositionRelative;
      } else {
        // The static component extends until the next parameter, which starts with ":".
        const nextColumnPosition = stringPath.indexOf(
          ":",
          componentStartPosition
        );
        pathComponents.push({
          kind: "static",
          content: stringPath.substring(
            componentStartPosition,
            nextColumnPosition === -1 ? undefined : nextColumnPosition
          )
        });
        componentStartPosition = nextColumnPosition;
      }
    } while (componentStartPosition !== -1);
  }
  return pathComponents;
}
