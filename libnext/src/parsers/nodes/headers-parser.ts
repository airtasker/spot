import { ParameterDeclaration } from "ts-simple-ast";
import { HeaderNode } from "../../models/nodes";
import {
  ensureNodeNotOptional,
  extractJsDocComment,
  extractObjectParameterProperties,
  extractPropertyName
} from "../utilities/parser-utility";
import { parseType } from "../utilities/type-parser";

/**
 * Parse a `@headers` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseHeaders(parameter: ParameterDeclaration): HeaderNode[] {
  parameter.getDecoratorOrThrow("headers");
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
