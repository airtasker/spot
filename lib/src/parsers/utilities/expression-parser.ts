import { Expression, TypeGuards } from "ts-morph";
import {
  arrayExpression,
  booleanExpression,
  DataExpression,
  nullExpression,
  numberExpression,
  objectExpression,
  ObjectExpressionProperty,
  stringExpression
} from "../../models/types";

/**
 * Convert an AST expression to a local data expression.
 *
 * @param expression AST expression
 */
export function parseExpression(expression: Expression): DataExpression {
  if (TypeGuards.isNullLiteral(expression)) {
    return nullExpression();
  } else if (TypeGuards.isBooleanLiteral(expression)) {
    return booleanExpression(expression.getLiteralValue());
  } else if (TypeGuards.isStringLiteral(expression)) {
    return stringExpression(expression.getLiteralValue());
  } else if (TypeGuards.isNumericLiteral(expression)) {
    return numberExpression(expression.getLiteralValue());
  } else if (TypeGuards.isArrayLiteralExpression(expression)) {
    return arrayExpression(expression.getElements().map(parseExpression));
  } else if (TypeGuards.isObjectLiteralExpression(expression)) {
    const objectProperties: ObjectExpressionProperty[] = expression
      .getProperties()
      .map(property => {
        if (TypeGuards.isPropertyAssignment(property)) {
          const nameNode = property.getNameNode();
          let name;
          if (TypeGuards.isIdentifier(nameNode)) {
            name = nameNode.getText();
          } else if (TypeGuards.isStringLiteral(nameNode)) {
            name = nameNode.getLiteralValue();
          } else {
            throw new Error(
              "only identifiers and string literals are valid object property keys"
            );
          }
          return {
            name,
            expression: parseExpression(property.getInitializerOrThrow())
          };
        } else {
          throw new Error("expected property assignment");
        }
      });
    return objectExpression(objectProperties);
  } else {
    throw new Error("unknown expression type");
  }
}
