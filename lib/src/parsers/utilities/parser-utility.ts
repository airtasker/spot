import {
  ClassDeclaration,
  Decorator,
  InterfaceDeclaration,
  JSDocableNode,
  MethodDeclaration,
  ObjectLiteralExpression,
  ParameterDeclaration,
  PropertySignature,
  QuestionTokenableNode,
  ts,
  TypeAliasDeclaration,
  TypeGuards,
  TypeReferenceNode,
  ArrayLiteralExpression
} from "ts-simple-ast";
import { HttpMethod } from "../../models/http";
import { Locatable } from "../../models/locatable";

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
 * Property names may be defined with single or double quotes. These
 * quotes should be removed.
 *
 * @param property property signature
 */
export function extractPropertyName(property: PropertySignature): string {
  return property
    .getNameNode()
    .getSymbolOrThrow()
    .getEscapedName();
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
 * Extracts the JS Doc comment from a node.
 *
 * @param node a JS Docable Node
 */
export function extractJsDocCommentLocatable(
  node: JSDocableNode
): Locatable<string> | undefined {
  const jsDocs = node.getJsDocs();
  if (jsDocs.length === 1) {
    const jsDoc = jsDocs[0];
    const value = jsDoc.getComment();
    // value may be undefined for an empty comment
    if (value) {
      const location = jsDoc.getSourceFile().getFilePath();
      const line = jsDoc.getStartLineNumber();
      return { value, location, line };
    }
  } else if (jsDocs.length > 1) {
    throw new Error(`expected 1 jsDoc node, got ${jsDocs.length}`);
  }
  return;
}

/**
 * Property names may be defined with single or double quotes. These
 * quotes should be removed.
 *
 * @param property property signature
 */
export function extractPropertyNameLocatable(
  property: PropertySignature
): Locatable<string> {
  const nameNode = property.getNameNode();

  const value = nameNode.getSymbolOrThrow().getEscapedName();
  const location = nameNode.getSourceFile().getFilePath();
  const line = nameNode.getStartLineNumber();

  return { value, location, line };
}

/**
 * Extract a string property value metadata from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
export function extractStringPropertyValueLocatable(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): Locatable<string> {
  const property = objectLiteral.getPropertyOrThrow(propertyName);
  const literal = property.getLastChildIfKindOrThrow(
    ts.SyntaxKind.StringLiteral
  );
  const value = literal.getLiteralText();
  const location = property.getSourceFile().getFilePath();
  const line = literal.getStartLineNumber();

  return { value, location, line };
}

/**
 * Extract a string array property value from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
export function extractOptionalStringArrayPropertyValueLocatable(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): Locatable<string[]> | undefined {
  const property = objectLiteral.getProperty(propertyName);
  if (!property) {
    return undefined;
  }
  const literal = property.getLastChildIfKindOrThrow(
    ts.SyntaxKind.ArrayLiteralExpression
  );
  const value = literal.getElements().map(e => {
    if (TypeGuards.isStringLiteral(e)) {
      return e.getLiteralText();
    } else {
      throw new Error(`expected string literal`);
    }
  });
  const location = property.getSourceFile().getFilePath();
  const line = literal.getStartLineNumber();
  return { value, location, line };
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
): Locatable<number> {
  const property = objectLiteral.getPropertyOrThrow(propertyName);
  const literal = property.getLastChildIfKindOrThrow(
    ts.SyntaxKind.NumericLiteral
  );
  const value = literal.getLiteralValue();
  const location = property.getSourceFile().getFilePath();
  const line = literal.getStartLineNumber();

  return { value, location, line };
}

/**
 * Extract an optional object literal property value from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
export function extractOptionalObjectProperty(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): Locatable<ObjectLiteralExpression> | undefined {
  const property = objectLiteral.getProperty(propertyName);
  if (property) {
    const value = property.getLastChildIfKindOrThrow(
      ts.SyntaxKind.ObjectLiteralExpression
    );
    const location = property.getSourceFile().getFilePath();
    const line = value.getStartLineNumber();

    return { value, location, line };
  } else {
    return;
  }
}

/**
 * Extract an optional array literal property value from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
export function extractOptionalArrayProperty(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): Locatable<ArrayLiteralExpression> | undefined {
  const property = objectLiteral.getProperty(propertyName);
  if (property) {
    const value = property.getLastChildIfKindOrThrow(
      ts.SyntaxKind.ArrayLiteralExpression
    );
    const location = property.getSourceFile().getFilePath();
    const line = value.getStartLineNumber();

    return { value, location, line };
  } else {
    return;
  }
}

/**
 * Extract an object literal property value from an object literal.
 *
 * @param objectLiteral an object literal
 * @param propertyName the property to extract
 */
export function extractObjectProperty(
  objectLiteral: ObjectLiteralExpression,
  propertyName: string
): Locatable<ObjectLiteralExpression> {
  const property = objectLiteral.getPropertyOrThrow(propertyName);
  const value = property.getLastChildIfKindOrThrow(
    ts.SyntaxKind.ObjectLiteralExpression
  );
  const location = property.getSourceFile().getFilePath();
  const line = value.getStartLineNumber();

  return { value, location, line };
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
  // Request parameters are expected to be object literals
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
      `expected decorator @${decoratorName} to be used only once, found ${
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

/**
 * Extract the target type alias declaration or interface declaration
 * of a type reference.
 *
 * @param typeReference AST type reference node
 */
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
