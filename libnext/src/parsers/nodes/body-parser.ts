import { ParameterDeclaration } from "ts-simple-ast";
import { ParsedBody } from "../../models/parsed-nodes";
import { parseType } from "../utilities/type-parser";

/**
 * Parse an `@body` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseBody(parameter: ParameterDeclaration): ParsedBody {
  parameter.getDecoratorOrThrow("body");
  const dataType = parseType(parameter.getTypeNodeOrThrow());
  return {
    // TODO: how to extract description from parameter declaration?
    description: undefined,
    type: dataType,
    optional: parameter.hasQuestionToken()
  };
}
