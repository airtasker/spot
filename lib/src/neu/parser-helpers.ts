import {
  ArrayLiteralExpression,
  ClassDeclaration,
  Decorator,
  JSDoc,
  JSDocableNode,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
  StringLiteral,
  ts,
  TypeGuards
} from "ts-morph";
import { HttpMethod } from "./definitions";

// FILE HELPERS

/**
 * Retrieve all local dependencies of a file recursively including itself.
 *
 * @param file the source file
 * @param visitedFiles
 */
export function getSelfAndLocalDependencies(
  file: SourceFile,
  visitedFiles: SourceFile[] = []
): SourceFile[] {
  return (
    file
      .getImportDeclarations()
      // We only care about local imports.
      .filter(id => id.getModuleSpecifierValue().startsWith("."))
      .map(id => id.getModuleSpecifierSourceFileOrThrow())
      .reduce<SourceFile[]>((acc, curr) => {
        if (acc.some(f => f.getFilePath() === curr.getFilePath())) {
          return acc;
        } else {
          return getSelfAndLocalDependencies(curr, acc);
        }
      }, visitedFiles.concat(file))
  );
}

// CLASS HELPERS

export function findOneDecoratedClassOrThrow(
  klasses: ClassDeclaration[],
  decorator: string
): ClassDeclaration {
  // find classes with particular decorator
  const targetKlasses = klasses.filter(
    k => k.getDecorator(decorator) !== undefined
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

/**
 * Retrieve a decorator factory's configuration. The configuration is
 * the first parameter of the decorator and is expected to be an object
 * literal.
 *
 * @param decorator the source decorator
 */
export function getDecoratorConfigOrThrow(
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
 * Retrieves a property from an object literal expression or error. If
 * provided, the generic parameter will narrow down the available
 * property names allowed.
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

/**
 * Retrieve a property's value as a string or error.
 *
 * @param property the source property
 */
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

/**
 * Retrieve a JSDoc for a ts-morph node. The node is expected
 * to have no more than one JSDoc.
 *
 * @param node a JSDocable ts-morph node
 */
export function getJsDoc(node: JSDocableNode): JSDoc | undefined {
  const jsDocs = node.getJsDocs();
  if (jsDocs.length > 1) {
    throw new Error(`expected at most 1 jsDoc node, got ${jsDocs.length}`);
  } else if (jsDocs.length === 1) {
    return jsDocs[0];
  }
  return undefined;
}

// HTTP HELPERS

/**
 * Determine if a HTTP method is a supported HttpMethod.
 *
 * @param method the method to check
 */
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
