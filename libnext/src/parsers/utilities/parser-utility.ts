import {
  ts,
  ObjectLiteralExpression,
  JSDocableNode,
  Decorator,
  TypeGuards,
  Symbol,
  ParameterDeclaration,
  PropertySignature,
  QuestionTokenableNode
} from "ts-simple-ast";
import { HttpMethod } from "../../models/http";
import { DataType, Kind } from "libnext/src/models/types";

/**
 * Extract the property signature of an AST Symbol.
 *
 * @param property the property
 */
export function extractPropertySignature(property: Symbol) {
  const valueDeclaration = property.getValueDeclarationOrThrow();
  if (!TypeGuards.isPropertySignature(valueDeclaration)) {
    throw new Error("expected property signature");
  }
  return valueDeclaration;
}

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
 * Extract the properties properties from a from a parameter declaration.
 *
 * @param parameter a parameter declaration
 */
export function extractObjectParameterProperties(
  parameter: ParameterDeclaration
): PropertySignature[] {
  // Request parameters are expected to be object types
  const type = parameter.getType();
  if (type.isObject() && !type.isArray() && !type.isInterface()) {
    return type
      .getProperties()
      .map(property => extractPropertySignature(property));
  } else {
    throw new Error("expected literal object parameter");
  }
}

/**
 * Ensure an AST optionable node is not optional.
 *
 * @param node an AST node
 */
export function ensureNodeNotOptional(node: QuestionTokenableNode) {
  if (node.hasQuestionToken()) {
    throw new Error("parameter cannot be optional");
  }
}

/**
 * Ensure a data type is of a particular kind.
 *
 * @param dataType internal data type
 * @param allowedTypes allowed kinds of data
 */
export function ensureDataTypeIsKind(dataType: DataType, allowedKinds: Kind[]) {
  if (!allowedKinds.includes(dataType.kind)) {
    throw new Error(
      `expected data type to be of kind ${allowedKinds.join(" | ")}, but got ${
        dataType.kind
      }`
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
