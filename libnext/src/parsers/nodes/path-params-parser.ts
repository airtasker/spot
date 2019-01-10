import { ParsedPathParam } from "../../models/definitions";
import { ParameterDeclaration } from "ts-simple-ast";
import {
  extractJsDocComment,
  extractObjectParameterProperties,
  ensureNodeNotOptional
} from "../utilities/parser-utility";
import { parseType } from "../utilities/type-parser";

/**
 * Parse an `@pathParams` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parsePathParams(
  parameter: ParameterDeclaration
): ParsedPathParam[] {
  parameter.getDecoratorOrThrow("pathParams");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);
  return properties.map(property => {
    ensureNodeNotOptional(property);
    const propertyDataType = parseType(property.getTypeNodeOrThrow());
    return {
      name: property.getName(),
      description: extractJsDocComment(property),
      type: propertyDataType
    };
  });
}
