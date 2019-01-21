import ts from "typescript";
import { panic } from "./panic";

export type Literal =
  | ObjectLiteral
  | ArrayLiteral
  | StringLiteral
  | NumericLiteral
  | BooleanLiteral;

/**
 * Extracts a Literal from a TypeScript expression, or fails if the expression isn't a supported literal.
 */
export function extractLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.Node
): Literal {
  if (ts.isObjectLiteralExpression(expression)) {
    return extractObjectLiteral(sourceFile, expression);
  } else if (ts.isArrayLiteralExpression(expression)) {
    return extractArrayLiteral(sourceFile, expression);
  } else if (ts.isStringLiteral(expression)) {
    return extractStringLiteral(sourceFile, expression);
  } else if (ts.isNumericLiteral(expression)) {
    return extractNumericLiteral(sourceFile, expression);
  } else if (
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword
  ) {
    return extractBooleanLiteral(sourceFile, expression);
  } else {
    throw panic(`Expected a literal, found ${expression.getText(sourceFile)}`);
  }
}

export interface ObjectLiteral {
  kind: "object";
  properties: {
    [key: string]: Literal;
  };
}

export function isObjectLiteral(literal?: Literal): literal is ObjectLiteral {
  return literal !== undefined && literal.kind === "object";
}

function extractObjectLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.ObjectLiteralExpression
): ObjectLiteral {
  const objectLiteral: ObjectLiteral = {
    kind: "object",
    properties: {}
  };
  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw panic(
        `Unsupported property syntax: ${property.getText(sourceFile)}`
      );
    }
    if (!ts.isIdentifier(property.name)) {
      throw panic(
        `The following should be a plain identifier: ${property.name.getText(
          sourceFile
        )}`
      );
    }
    objectLiteral.properties[
      property.name.getText(sourceFile)
    ] = extractLiteral(sourceFile, property.initializer);
  }
  return objectLiteral;
}

export interface ArrayLiteral {
  kind: "array";
  elements: Literal[];
}

export function isArrayLiteral(literal?: Literal): literal is ArrayLiteral {
  return literal !== undefined && literal.kind === "array";
}

function extractArrayLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.ArrayLiteralExpression
): ArrayLiteral {
  return {
    kind: "array",
    elements: expression.elements.map(e => extractLiteral(sourceFile, e))
  };
}

export interface StringLiteral {
  kind: "string";
  text: string;
}

export function isStringLiteral(literal?: Literal): literal is StringLiteral {
  return literal !== undefined && literal.kind === "string";
}

function extractStringLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.StringLiteral
): StringLiteral {
  const literal = expression.getText(sourceFile);
  return {
    kind: "string",
    // TODO: Unescape strings.
    text: literal.substr(1, literal.length - 2)
  };
}

export interface NumericLiteral {
  kind: "number";
  text: string;
}

export function isNumericLiteral(literal?: Literal): literal is NumericLiteral {
  return literal !== undefined && literal.kind === "number";
}

function extractNumericLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.NumericLiteral
): NumericLiteral {
  const literal = expression.getText(sourceFile);
  return {
    kind: "number",
    text: literal
  };
}

export interface BooleanLiteral {
  kind: "boolean";
  value: boolean;
}

export function isBooleanLiteral(literal?: Literal): literal is BooleanLiteral {
  return literal !== undefined && literal.kind === "boolean";
}

function extractBooleanLiteral(
  sourceFile: ts.SourceFile,
  expression: ts.Node
): BooleanLiteral {
  return {
    kind: "boolean",
    value: expression.kind === ts.SyntaxKind.TrueKeyword
  };
}
