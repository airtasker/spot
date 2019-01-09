import { ParsedHeader } from "../../models/definitions";
import { ParameterDeclaration } from "ts-simple-ast";
import {
  ensureNodeNotOptional,
  extractObjectParameterProperties,
  extractJsDocComment
} from "../utilities/parser-utility";
import { parseType } from "../utilities/type-parser";

/**
 * Parse a `@headers` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parseHeaders(parameter: ParameterDeclaration): ParsedHeader[] {
  parameter.getDecoratorOrThrow("headers");
  ensureNodeNotOptional(parameter);
  const properties = extractObjectParameterProperties(parameter);
  return properties.map(property => {
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
      type: propertyDataType,
      optional: property.hasQuestionToken()
    };
  });
}

function possibleKinds(dataType: DataType): Kind[] {}
