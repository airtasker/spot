import {
  ArrayLiteralExpression,
  ClassDeclaration,
  Decorator,
  JSDoc,
  JSDocableNode,
  MethodDeclaration,
  NumericLiteral,
  ObjectLiteralExpression,
  ParameterDeclaration,
  PropertyAssignment,
  PropertyDeclaration,
  PropertySignature,
  SourceFile,
  StringLiteral,
  ts,
  TypeGuards,
  TypeLiteralNode
} from "ts-morph";
import { HttpMethod, QueryParamArrayStrategy } from "../definitions";

// FILE HELPERS

/**
 * Retrieve all local dependencies of a file recursively including itself.
 *
 * @param file the source file
 * @param visitedFiles visisted files
 */
export function getSelfAndLocalDependencies(
  file: SourceFile,
  visitedFiles: SourceFile[] = []
): SourceFile[] {
  return (
    file
      .getImportDeclarations()
      // We only care about local imports.
      .filter(id => id.isModuleSpecifierRelative())
      // will throw on file with no import/export statements
      // TODO: provide a warning
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

/**
 * Retrieve a class from a file with a particular decorator or throw.
 *
 * @param file the source file
 * @param decoratorName name of decorator to search for
 */
export function getClassWithDecoratorOrThrow(
  file: SourceFile,
  decoratorName: string
): ClassDeclaration {
  const matchingKlasses = file
    .getClasses()
    .filter(k => k.getDecorator(decoratorName) !== undefined);

  if (matchingKlasses.length !== 1) {
    throw new Error(
      `expected a decorator @${decoratorName} to be used once, found ${matchingKlasses.length} usages`
    );
  }

  return matchingKlasses[0];
}

// CLASS HELPERS

/**
 * Retrieve a property from a class declaration with a particular decorator.
 *
 * @param klass class declaration
 * @param decoratorName name of decorator to search for
 */
export function getPropertyWithDecorator(
  klass: ClassDeclaration,
  decoratorName: string
): PropertyDeclaration | undefined {
  const matchingProps = klass
    .getProperties()
    .filter(p => p.getDecorator(decoratorName) !== undefined);

  if (matchingProps.length > 1) {
    throw new Error(
      `expected a decorator @${decoratorName} to be used only once, found ${matchingProps.length} usages`
    );
  }

  return matchingProps.length === 1 ? matchingProps[0] : undefined;
}

/**
 * Retrieve a method from a class declaration with a particular decorator.
 *
 * @param klass class declaration
 * @param decoratorName  name of the decorator to search for
 */
export function getMethodWithDecorator(
  klass: ClassDeclaration,
  decoratorName: string
): MethodDeclaration | undefined {
  const matchingMethods = klass
    .getMethods()
    .filter(m => m.getDecorator(decoratorName) !== undefined);

  if (matchingMethods.length > 1) {
    throw new Error(
      `expected a decorator @${decoratorName} to be used only once, found ${matchingMethods.length} usages`
    );
  }

  return matchingMethods.length === 1 ? matchingMethods[0] : undefined;
}

// METHOD HELPERS

/**
 * Retrieve a parameter from a method declaration with a particular decorator.
 *
 * @param method method declaration
 * @param decoratorName name of decorator to search for
 */
export function getParamWithDecorator(
  method: MethodDeclaration,
  decoratorName: string
): ParameterDeclaration | undefined {
  const matchingParams = method
    .getParameters()
    .filter(p => p.getDecorator(decoratorName) !== undefined);

  if (matchingParams.length > 1) {
    throw new Error(
      `expected a decorator @${decoratorName} to be used only once, found ${matchingParams.length} usages`
    );
  }

  return matchingParams.length === 1 ? matchingParams[0] : undefined;
}

// PARAMETER HELPERS

/**
 * Retrieve a parameter's type as a type literal or throw.
 *
 * @param parameter a parameter declaration
 */
export function getParameterTypeAsTypeLiteralOrThrow(
  parameter: ParameterDeclaration
): TypeLiteralNode {
  const typeNode = parameter.getTypeNodeOrThrow();
  if (!TypeGuards.isTypeLiteralNode(typeNode)) {
    throw new Error("expected parameter value to be an type literal object");
  }
  return typeNode;
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
  const property = objectLiteral.getProperty(propertyName);
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

// PROPERTY ASSIGNMENT HELPERS

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

/**
 * Retrieve a property's value as a number or error.
 *
 * @param property the source property
 */
export function getPropValueAsNumberOrThrow(
  property: PropertyAssignment
): NumericLiteral {
  return property.getInitializerIfKindOrThrow(ts.SyntaxKind.NumericLiteral);
}

/**
 * Retrieve a property's value as an array or error.
 *
 * @param property the source property
 */
export function getPropValueAsArrayOrThrow(
  property: PropertyAssignment
): ArrayLiteralExpression {
  return property.getInitializerIfKindOrThrow(
    ts.SyntaxKind.ArrayLiteralExpression
  );
}

/**
 * Retrieve a property's value as an object or error.
 *
 * @param property the source property
 */
export function getPropValueAsObjectOrThrow(
  property: PropertyAssignment
): ObjectLiteralExpression {
  return property.getInitializerIfKindOrThrow(
    ts.SyntaxKind.ObjectLiteralExpression
  );
}

// PROPERTY SIGNATURE/DECLARATION HELPERS

/**
 * Retrieve a property's name. This will remove any quotes surrounding the name.
 *
 * @param property property signature
 */
export function getPropertyName(
  property: PropertyDeclaration | PropertySignature
): string {
  return property
    .getNameNode()
    .getSymbolOrThrow()
    .getEscapedName();
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

// TYPE GUARDS

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

/**
 * Determine if a query param array strategy is a supported QueryParamArrayStrategy.
 *
 * @param strategy the strategy to check
 */
export function isQueryParamArrayStrategy(
  strategy: string
): strategy is QueryParamArrayStrategy {
  switch (strategy) {
    case "ampersand":
    case "space":
    case "comma":
    case "pipe":
      return true;
    default:
      return false;
  }
}
