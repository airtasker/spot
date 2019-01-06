import { ParameterDeclaration, TypeGuards } from "ts-simple-ast";
import {
  extractJsDocComment,
  extractPropertySignature
} from "./utilities/parser-utility";
import { parseType } from "./utilities/type-parser";
import { PathParamDefinition } from "../models/definitions";

/**
 * Parse an `@pathParams` decorated parameter.
 *
 * @param parameter a parameter declaration
 */
export function parsePathParams(
  parameter: ParameterDeclaration
): PathParamDefinition[] {
  // sanity check
  parameter.getDecoratorOrThrow("pathParams");
  if (parameter.hasQuestionToken()) {
    throw new Error("parameter cannot be optional");
  }
  const type = parameter.getType();
  if (!type.isObject()) {
    throw new Error("expected object");
  }
  const properties = type.getProperties();
  return properties.map(property => {
    const propertySignature = extractPropertySignature(property);
    return {
      name: propertySignature.getName(),
      description: extractJsDocComment(propertySignature),
      type: parseType(propertySignature.getType())
    };
  });
}
