import { ParameterDeclaration } from "ts-simple-ast";
import { HeaderNode } from "../../models/nodes";
import {
  ensureNodeNotOptional,
  extractJsDocComment,
  extractObjectParameterProperties
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
      name: property.getName(),
      description: extractJsDocComment(property),
      type: parseType(property.getTypeNodeOrThrow()),
      optional: property.hasQuestionToken()
    };
  });
}
