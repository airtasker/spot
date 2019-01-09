import { ParsedPathParam } from "../../models/definitions";
import { ParameterDeclaration } from "ts-simple-ast";
import {
  extractJsDocComment,
  extractObjectParameterProperties,
  ensureNodeNotOptional
} from "../utilities/parser-utility";
import { parseType } from "../utilities/type-parser";
import { isStringLikeType, isNumberLikeType } from "../../models/types";

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
    if (
      !isStringLikeType(propertyDataType) &&
      !isNumberLikeType(propertyDataType)
    ) {
      throw new Error("expected a string or number like type");
    }
    return {
      name: property.getName(),
      description: extractJsDocComment(property),
      type: propertyDataType
    };
  });
}
