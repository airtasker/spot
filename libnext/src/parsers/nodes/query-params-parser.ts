import { ParameterDeclaration } from "ts-simple-ast";
import { QueryParamNode } from "../../models/nodes";
import {
  ensureNodeNotOptional,
  extractJsDocComment,
  extractObjectParameterProperties,
  extractPropertyName
} from "../utilities/parser-utility";
import { parseType } from "../utilities/type-parser";

/**
 * Parse an `@queryParams` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseQueryParams(
  parameter: ParameterDeclaration
): QueryParamNode[] {
  parameter.getDecoratorOrThrow("queryParams");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);
  return properties.map(property => {
    return {
      name: extractPropertyName(property),
      description: extractJsDocComment(property),
      type: parseType(property.getTypeNodeOrThrow()),
      optional: property.hasQuestionToken()
    };
  });
}
