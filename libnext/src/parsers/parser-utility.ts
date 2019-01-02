import {
  ts,
  ObjectLiteralExpression,
  JSDocableNode,
  Decorator,
  TypeGuards
} from "ts-simple-ast";
import { HttpMethod } from "../../../lib/src/lib";

/**
 * Extracts the JS Doc comment from a node.
 *
 * @param node a JS Docable Node
 */
export function extractJsDocComment(node: JSDocableNode): string | undefined {
  const jsDocs = node.getJsDocs();
  if (jsDocs.length === 1) {
    return jsDocs[0].getComment();
  } else if (jsDocs.length > 1) {
    throw new Error(`expected 1 jsDoc node, got ${jsDocs.length}`);
  }
  return;
}

/**
 * Extract a string property from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
export function extractStringProperty(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): string {
  return objectLiteral
    .getPropertyOrThrow(propertyName)
    .getLastChildIfKindOrThrow(ts.SyntaxKind.StringLiteral)
    .getLiteralText();
}

/**
 * Extract an optional string property from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
export function extractOptionalStringProperty(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): string | undefined {
  const property = objectLiteral.getProperty(propertyName);
  if (property) {
    return property
      .getLastChildIfKindOrThrow(ts.SyntaxKind.StringLiteral)
      .getLiteralText();
  }
  return;
}

/**
 * Extract the Configuration object (first argument) from a Spot decorator factory.
 *
 * @param decorator a decorator factory
 */
export function extractDecoratorFactoryConfiguration(
  decorator: Decorator
): ObjectLiteralExpression {
  if (decorator.getArguments().length === 1) {
    const argument = decorator.getArguments()[0];
    if (TypeGuards.isObjectLiteralExpression(argument)) {
      return argument;
    } else {
      throw new Error(`expected object literal`);
    }
  } else {
    throw new Error(
      `expected 1 argument, got ${decorator.getArguments().length}`
    );
  }
}

/**
 * Determine if a string is a HTTP method.
 *
 * @param method the string
 */
export function isHttpMethod(method: string): method is HttpMethod {
  switch (method) {
    case "GET":
    case "HEAD":
    case "POST":
    case "PUT":
    case "DELETE":
    case "CONNECT":
    case "OPTIONS":
    case "TRACE":
    case "PATCH":
      return true;
    default:
      return false;
  }
}
