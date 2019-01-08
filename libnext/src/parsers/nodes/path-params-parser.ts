import { PathParamDefinition } from "../../models/definitions";
import { ParameterDeclaration } from "ts-simple-ast";
import {
  extractJsDocComment,
  extractObjectParameterProperties,
  ensureNodeNotOptional,
  ensureDataTypeIsKind
} from "../utilities/parser-utility";
import { parseType } from "../utilities/type-parser";
import { KindOfString, KindOfNumber } from "../../models/types";

/**
 * Parse an `@pathParams` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parsePathParams(
  parameter: ParameterDeclaration
): PathParamDefinition[] {
  parameter.getDecoratorOrThrow("pathParams");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);
  return properties.map(property => {
    ensureNodeNotOptional(property);
    const propertyDataType = parseType(property.getType());
    ensureDataTypeIsKind(propertyDataType, KindOfString.concat(KindOfNumber));
    return {
      name: property.getName(),
      description: extractJsDocComment(property),
      type: propertyDataType
    };
  });
}
