import {
  ts,
  ObjectLiteralExpression,
  JSDocableNode,
  Decorator,
  TypeGuards,
  Symbol,
  ParameterDeclaration,
  PropertySignature,
  QuestionTokenableNode,
  MethodDeclaration,
  ClassDeclaration,
  TypeReferenceNode,
  TypeAliasDeclaration,
  InterfaceDeclaration
} from "ts-simple-ast";
import { HttpMethod } from "../../models/http";

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
 * Extract a string property value from an object literal.
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
 * Extract a number property value from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
export function extractNumberProperty(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): number {
  return objectLiteral
    .getPropertyOrThrow(propertyName)
    .getLastChildIfKindOrThrow(ts.SyntaxKind.NumericLiteral)
    .getLiteralValue();
}

/**
 * Extract an optional string property value from an object literal.
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
  const typeNode = parameter.getTypeNodeOrThrow();
  if (!TypeGuards.isTypeLiteralNode(typeNode)) {
    throw new Error("expected object literal parameter");
  }
  return typeNode.getProperties();
}

/**
 * Retrieve a parameter from a method declaration with a particular decorator.
 *
 * @param method method declaration
 * @param decoratorName name of decorator to search for
 */
export function methodParamWithDecorator(
  method: MethodDeclaration,
  decoratorName: string
): ParameterDeclaration | undefined {
  const matchingParams = method
    .getParameters()
    .filter(parameter => parameter.getDecorator(decoratorName) !== undefined);
  if (matchingParams.length === 1) {
    return matchingParams[0];
  } else if (matchingParams.length > 1) {
    throw new Error(
      `expected a decorator @${decoratorName} to be used only once, found ${
        matchingParams.length
      } usages`
    );
  }
  return undefined;
}

/**
 * Retrieve a method from a class declaration with a particular decorator.
 *
 * @param klass class declaration
 * @param decoratorName name of decorator to search for
 */
export function classMethodWithDecorator(
  klass: ClassDeclaration,
  decoratorName: string
): MethodDeclaration | undefined {
  const matchingMethods = klass
    .getMethods()
    .filter(method => method.getDecorator(decoratorName) !== undefined);
  if (matchingMethods.length === 1) {
    return matchingMethods[0];
  } else if (matchingMethods.length > 1) {
    throw new Error(
      `expected a decorator @${decoratorName} to be used only once, found ${
        matchingMethods.length
      } usages`
    );
  }
  return undefined;
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

export function getTargetDeclarationFromTypeReference(
  typeReference: TypeReferenceNode
): TypeAliasDeclaration | InterfaceDeclaration {
  const symbol = typeReference.getTypeName().getSymbolOrThrow();
  // if the symbol is an alias, it means it the reference is declared from an import
  const targetSymbol = symbol.isAlias()
    ? symbol.getAliasedSymbolOrThrow()
    : symbol;
  const declarations = targetSymbol.getDeclarations();
  if (declarations.length !== 1) {
    throw new Error("expected exactly one declaration");
  }
  const targetDeclaration = declarations[0];
  if (
    TypeGuards.isInterfaceDeclaration(targetDeclaration) ||
    TypeGuards.isTypeAliasDeclaration(targetDeclaration)
  ) {
    return targetDeclaration;
  }
  throw new Error("expected a type alias or interface declaration");
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
