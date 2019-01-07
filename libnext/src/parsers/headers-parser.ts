import { HeaderDefinition } from "../models/definitions";
import { ParameterDeclaration } from "ts-simple-ast";
import {
  ensureNodeNotOptional,
  extractObjectParameterProperties,
  ensureDataTypeIsKind,
  extractJsDocComment
} from "./utilities/parser-utility";
import { parseType } from "./utilities/type-parser";
import { KindOfString, KindOfNumber } from "../models/types";

/**
 * Parse an `@headers` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseHeaders(
  parameter: ParameterDeclaration
): HeaderDefinition[] {
  parameter.getDecoratorOrThrow("headers");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);
  return properties.map(property => {
    const propertyDataType = parseType(property.getType());
    ensureDataTypeIsKind(propertyDataType, KindOfString.concat(KindOfNumber));
    return {
      name: property.getName(),
      description: extractJsDocComment(property),
      type: propertyDataType,
      optional: property.hasQuestionToken()
    };
  });
}
