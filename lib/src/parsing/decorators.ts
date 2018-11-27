import * as ts from "typescript";
import { Type } from "../models";
import { extractLiteral, Literal } from "./literal-parser";
import { panic } from "./panic";
import { extractType } from "./type-parser";

/**
 * Extracts the arguments from a single decorator associated with a TypeScript node.
 *
 * For example with the following code:
 * ```
 * @myDecorator(1, 2, 3)
 * function abc() {}
 * ```
 *
 * Then calling extractSingleDecorator() on the function declaration node will return:
 * {
 *   typeParameters: [],
 *   arguments: [1, 2, 3]
 * }
 *
 * This will fail if the same decorator is attached to the same node multiple times.
 * Use extractMultipleDecorators() for that purpose instead.
 *
 * @returns null when there is no decorator with the given name attached to the node.
 */
export function extractSingleDecorator(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  decoratorName: string
): Decorator | null {
  const decorators = extractMultipleDecorators(sourceFile, node, decoratorName);
  if (decorators.length === 1) {
    return decorators[0];
  } else if (decorators.length > 1) {
    throw panic(
      `Expected a single @${decoratorName} decorator, found ${
        decorators.length
      }`
    );
  } else {
    return null;
  }
}

/**
 * Extracts the arguments from a repeated decorator associated with a TypeScript node.
 *
 * For example with the following code:
 * ```
 * @myDecorator(1, 2, 3)
 * @myDecorator("a", "b", "c")
 * function abc() {}
 * ```
 *
 * Then calling extractMultipleDecorators() on the function declaration node will return:
 * [
 *   {
 *     typeParameters: [],
 *     arguments: [1, 2, 3]
 *   },
 *   {
 *     typeParameters: [],
 *     arguments: ["a", "b", "c"]
 *   }
 * ]
 */
export function extractMultipleDecorators(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  decoratorName: string
): Decorator[] {
  const decorators: Decorator[] = [];
  if (node.decorators) {
    for (const decorator of node.decorators) {
      if (
        ts.isIdentifier(decorator.expression) &&
        decorator.expression.getText(sourceFile) === decoratorName
      ) {
        decorators.push({
          typeParameters: [],
          arguments: []
        });
      } else if (ts.isCallExpression(decorator.expression)) {
        if (
          ts.isIdentifier(decorator.expression.expression) &&
          decorator.expression.expression.getText(sourceFile) === decoratorName
        ) {
          decorators.push({
            typeParameters: [...(decorator.expression.typeArguments || [])].map(
              t => extractType(sourceFile, t)
            ),
            arguments: [...decorator.expression.arguments].map(e =>
              extractLiteral(sourceFile, e)
            )
          });
        }
      }
    }
  }
  return decorators;
}

export interface Decorator {
  typeParameters: Type[];
  arguments: Literal[];
}
