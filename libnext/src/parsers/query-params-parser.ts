import { QueryParamDefinition } from "../models/definitions";
import { ParameterDeclaration } from "ts-simple-ast";
import {
  ensureNodeNotOptional,
  extractObjectParameterProperties,
  extractJsDocComment,
  ensureDataTypeIsKind
} from "./utilities/parser-utility";
import { parseType } from "./utilities/type-parser";
import { KindOfString, KindOfNumber } from "../models/types";

/**
 * Parse an `@queryParams` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseQueryParams(
  parameter: ParameterDeclaration
): QueryParamDefinition[] {
  parameter.getDecoratorOrThrow("queryParams");
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
