import { ParameterDeclaration } from "ts-simple-ast";
import { ParsedQueryParam } from "../../models/parsed-nodes";
import {
  ensureNodeNotOptional,
  extractJsDocComment,
  extractObjectParameterProperties
} from "../utilities/parser-utility";
import { parseType } from "../utilities/type-parser";

/**
 * Parse an `@queryParams` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseQueryParams(
  parameter: ParameterDeclaration
): ParsedQueryParam[] {
  parameter.getDecoratorOrThrow("queryParams");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);
  return properties.map(property => {
    return {
      name: property.getName(),
      description: extractJsDocComment(property),
      type: parseType(property.getTypeNodeOrThrow()),
      optional: property.hasQuestionToken()
    };
  });
}
