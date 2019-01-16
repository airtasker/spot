import { ParameterDeclaration } from "ts-simple-ast";
import { BodyNode } from "../../models/nodes";
import { ensureNodeNotOptional } from "../utilities/parser-utility";
import { parseType } from "../utilities/type-parser";

/**
 * Parse an `@body` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseBody(parameter: ParameterDeclaration): BodyNode {
  parameter.getDecoratorOrThrow("body");
  ensureNodeNotOptional(parameter);
  const dataType = parseType(parameter.getTypeNodeOrThrow());
  return {
    // TODO: how to extract description from parameter declaration?
    description: undefined,
    type: dataType
  };
}
