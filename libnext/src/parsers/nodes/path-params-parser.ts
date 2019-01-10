import { ParameterDeclaration } from "ts-simple-ast";
import { PathParamNode } from "../../models/nodes";
import {
  ensureNodeNotOptional,
  extractJsDocComment,
  extractObjectParameterProperties
} from "../utilities/parser-utility";
import { parseType } from "../utilities/type-parser";

/**
 * Parse an `@pathParams` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parsePathParams(
  parameter: ParameterDeclaration
): PathParamNode[] {
  parameter.getDecoratorOrThrow("pathParams");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);
  return properties.map(property => {
    ensureNodeNotOptional(property);
    return {
      name: property.getName(),
      description: extractJsDocComment(property),
      type: parseType(property.getTypeNodeOrThrow())
    };
  });
}
