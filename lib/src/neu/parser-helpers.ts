import {
  ClassDeclaration,
  Decorator,
  JSDoc,
  JSDocableNode,
  ObjectLiteralExpression,
  PropertyAssignment,
  StringLiteral,
  ts,
  TypeGuards,
  ArrayLiteralExpression
} from "ts-morph";
import { HttpMethod } from "./definitions";

// CLASS HELPERS

export function findOneDecoratedClassOrThrow(
  klasses: ClassDeclaration[],
  decorator: string
): ClassDeclaration {
  // find classes with particular decorator
  const targetKlasses = klasses.filter(
    klass => klass.getDecorator(decorator) !== undefined
  );
  // expect only a single class
  if (targetKlasses.length !== 1) {
    throw new Error(
      `expected class decorated with @${decorator} to be defined exactly once, found ${targetKlasses.length} usages`
    );
  }
  return targetKlasses[0];
}

// DECORATOR HELPERS

export function getDecoratorConfigProp<T>(
  decorator: Decorator,
  property: Extract<keyof T, string>
): PropertyAssignment {
  const config = extractDecoratorConfigOrThrow(decorator);
  const configProperty = config.getPropertyOrThrow(property);
  if (!TypeGuards.isPropertyAssignment(configProperty)) {
    throw new Error("expected property assignment");
  }
  return configProperty;
}

export function extractDecoratorConfigOrThrow(
  decorator: Decorator
): ObjectLiteralExpression {
  // expect a decorator factory
  if (!decorator.isDecoratorFactory()) {
    throw new Error("expected decorator factory");
  }
  // expect a single argument
  const decoratorArgs = decorator.getArguments();
  if (decoratorArgs.length !== 1) {
    throw new Error(
      `expected exactly one argument, got ${decoratorArgs.length}`
    );
  }
  // expect the argument to be an object literal expression
  const decoratorArg = decoratorArgs[0];
  if (!TypeGuards.isObjectLiteralExpression(decoratorArg)) {
    throw new Error(
      `expected decorator factory configuration argument to be an object literal`
    );
  }
  return decoratorArg;
}

// EXPRESSION HELPERS

/**
 * Retrieves a property from an object literal expression. If provided,
 * the generic parameter will narrow down the available property names
 * allowed.
 *
 * @param objectLiteral a ts-morph object literal expression
 * @param propertyName name of the property
 */
export function getObjLiteralProp<T>(
  objectLiteral: ObjectLiteralExpression,
  propertyName: Extract<keyof T, string>
): PropertyAssignment | undefined {
  const property = objectLiteral.getPropertyOrThrow(propertyName);
  if (!property) {
    return undefined;
  }
  if (!TypeGuards.isPropertyAssignment(property)) {
    throw new Error("expected property assignment");
  }
  return property;
}

/**
 * Retrieves a property from an object literal expression. If provided,
 * the generic parameter will narrow down the available property names
 * allowed.
 *
 * @param objectLiteral a ts-morph object literal expression
 * @param propertyName name of the property
 */
export function getObjLiteralPropOrThrow<T>(
  objectLiteral: ObjectLiteralExpression,
  propertyName: Extract<keyof T, string>
): PropertyAssignment {
  const property = objectLiteral.getPropertyOrThrow(propertyName);
  if (!TypeGuards.isPropertyAssignment(property)) {
    throw new Error("expected property assignment");
  }
  return property;
}

// PROPERTY HELPERS

export function getPropValueAsStringOrThrow(
  property: PropertyAssignment
): StringLiteral {
  return property.getInitializerIfKindOrThrow(ts.SyntaxKind.StringLiteral);
}

export function getPropValueAsArrayOrThrow(
  property: PropertyAssignment
): ArrayLiteralExpression {
  return property.getInitializerIfKindOrThrow(
    ts.SyntaxKind.ArrayLiteralExpression
  );
}

// JSDOC HELPERS

export function getJsDoc(node: JSDocableNode): JSDoc | undefined {
  const jsDocs = node.getJsDocs();
  if (jsDocs.length > 1) {
    throw new Error(`expected at most 1 jsDoc node, got ${jsDocs.length}`);
  } else if (jsDocs.length === 1) {
    return jsDocs[0];
  }
  return;
}

// HTTP HELPERS

export function isHttpMethod(method: string): method is HttpMethod {
  switch (method) {
    case "GET":
    case "POST":
    case "PUT":
    case "PATCH":
    case "DELETE":
      return true;
    default:
      return false;
  }
}
